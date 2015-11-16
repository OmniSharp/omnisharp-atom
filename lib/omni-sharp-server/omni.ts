import {OmniSharp} from "omnisharp-client";
import {CompositeDisposable, Disposable, IDisposable} from "../Disposable";
import {Observable, ReplaySubject, Subject, BehaviorSubject, Scheduler} from "@reactivex/rxjs";
import manager from "./solution-manager";
import {Solution} from "./solution";
import * as _ from "lodash";
import {basename} from "path";
import {DriverState} from "omnisharp-client";
import {ProjectViewModel} from "./project-view-model";
import {ViewModel} from "./view-model";
import * as fs from "fs";
import * as path from "path";

// Time we wait to try and do our active switch tasks.
const DEBOUNCE_TIMEOUT = 100;
const statefulProperties = ["isOff", "isConnecting", "isOn", "isReady", "isError"];

function wrapEditorObservable(observable: Observable<Atom.TextEditor>) {
    return observable
        .subscribeOn(Scheduler.nextTick)
        .observeOn(Scheduler.nextTick)
        .debounceTime(DEBOUNCE_TIMEOUT)
        .filter(editor => !editor || !editor.isDestroyed());
}

class Omni implements IDisposable {
    private disposable: CompositeDisposable;

    private _editors: Observable<Atom.TextEditor>;
    private _configEditors: Observable<Atom.TextEditor>;

    public get viewModelStatefulProperties() { return statefulProperties; }

    private _activeEditorSubject = new BehaviorSubject<Atom.TextEditor>(null);
    private _activeEditor = wrapEditorObservable(this._activeEditorSubject)
        .publishReplay(1)
        .refCount();

    private _activeConfigEditorSubject = new BehaviorSubject<Atom.TextEditor>(null);
    private _activeConfigEditor = wrapEditorObservable(this._activeConfigEditorSubject)
        .publishReplay(1)
        .refCount();

    private _activeEditorOrConfigEditor = wrapEditorObservable(Observable.combineLatest(this._activeEditorSubject, this._activeConfigEditorSubject, (editor, config) => editor || config || null));

    private _activeProject = this._activeEditorOrConfigEditor
        .switchMap(editor => manager.getSolutionForEditor(editor)
            .mergeMap(z => z.model.getProjectForEditor(editor)))
        .publishReplay(1)
        .refCount();

    private _activeFramework = this._activeEditorOrConfigEditor
        .switchMap(editor => manager.getSolutionForEditor(editor)
            .mergeMap(z => z.model.getProjectForEditor(editor)))
        .switchMap(project => project.observe.activeFramework.map(framework => ({ project, framework })))
        .publishReplay(1)
        .refCount();

    private _diagnostics: Observable<OmniSharp.Models.DiagnosticLocation[]>;
    public get diagnostics() { return this._diagnostics; }

    private _isOff = true;

    public get isOff() { return this._isOff; }
    public get isOn() { return !this.isOff; }

    public activate() {
        this.disposable = new CompositeDisposable;
        manager.activate(this._activeEditorOrConfigEditor);

        // we are only off if all our solutions are disconncted or erroed.
        this.disposable.add(manager.solutionAggregateObserver.state.subscribe(z => this._isOff = _.all(z, x => x.value === DriverState.Disconnected || x.value === DriverState.Error)));

        this._editors = Omni.createTextEditorObservable(this._supportedExtensions, this.disposable);
        this._configEditors = Omni.createTextEditorObservable([".json"], this.disposable);

        this.disposable.add(atom.workspace.observeActivePaneItem((pane: any) => {
            if (pane && pane.getGrammar) {
                if (_.any(this._supportedExtensions, ext => _.endsWith(pane.getPath(), ext))) {
                    this._activeConfigEditorSubject.next(null);
                    this._activeEditorSubject.next(pane);
                    return;
                }

                const filename = basename(pane.getPath());
                if (filename === "project.json") {
                    this._activeEditorSubject.next(null);
                    this._activeConfigEditorSubject.next(pane);
                    return;
                }
            }
            // This will tell us when the editor is no longer an appropriate editor
            this._activeEditorSubject.next(null);
            this._activeConfigEditorSubject.next(null);
        }));

        this.disposable.add(this._editors.subscribe(editor => {
            const cd = new CompositeDisposable();
            // TODO: Update once rename/codeactions support optional workspace changes
            //const omniChanges: { oldRange: TextBuffer.Range; newRange: TextBuffer.Range; oldText: string; newText: string; }[] = (<any>editor).__omniChanges__ = [];

            /*cd.add(editor.getBuffer().onDidChange((change: { oldRange: TextBuffer.Range; newRange: TextBuffer.Range; oldText: string; newText: string; }) => {
                //omniChanges.push(change);
            }));*/

            cd.add(editor.onDidStopChanging(_.debounce(() => {
                /*if (omniChanges.length) {
                }*/
                this.request(editor, solution => solution.updatebuffer({}, { silent: true }));
            }, 1000)));

            cd.add(editor.onDidSave(() => this.request(editor, solution => solution.updatebuffer({ FromDisk: true }, { silent: true }))));

            cd.add(editor.onDidDestroy(() => {
                cd.dispose();
            }));

            this.disposable.add(cd);
        }));

        this.disposable.add(Disposable.create(() => {
            this._activeEditorSubject.next(null);
            this._activeConfigEditorSubject.next(null);
        }));

        // Cache this result, because the underlying implementation of observe will
        //    create a cache of the last recieved value.  This allows us to pick pick
        //    up from where we left off.
        const combinationObservable = this.aggregateListener.observe(z => z.model.observe.codecheck);

        let showDiagnosticsForAllSolutions = new ReplaySubject<boolean>(1);
        this.disposable.add(atom.config.observe("omnisharp-atom.showDiagnosticsForAllSolutions", function(enabled) {
            showDiagnosticsForAllSolutions.next(enabled);
        }));

        this.disposable.add(showDiagnosticsForAllSolutions);

        this._diagnostics = Observable.combineLatest( // Combine both the active model and the configuration changes together
            this.activeModel.startWith(null), showDiagnosticsForAllSolutions, showDiagnosticsForAllSolutions.skip(1).startWith(atom.config.get<boolean>("omnisharp-atom.showDiagnosticsForAllSolutions")),
            (model, enabled, wasEnabled) => ({ model, enabled, wasEnabled }))
            // If the setting is enabled (and hasn"t changed) then we don"t need to redo the subscription
            .filter(ctx => (!(ctx.enabled && ctx.wasEnabled === ctx.enabled)))
            .switchMap(({enabled, model}) => {

                if (enabled) {
                    return combinationObservable
                        .debounceTime(200)
                        .map(data => _.flatten<OmniSharp.Models.DiagnosticLocation>(data));
                } else if (model) {
                    return model.observe.codecheck;
                }

                return Observable.of(<OmniSharp.Models.DiagnosticLocation[]>[]);
            })
            .startWith([])
            .share();
    }

    public dispose() {
        if (manager._unitTestMode_) return;
        this.disposable.dispose();
        manager.deactivate();
    }

    public connect() { manager.connect(); }

    public disconnect() { manager.disconnect(); }

    public toggle() {
        if (manager.connected) {
            manager.disconnect();
        } else {
            manager.connect();
        }
    }

    public navigateTo(response: { FileName: string; Line: number; Column: number; }) {
        return Observable.fromPromise(<any>atom.workspace.open(response.FileName, <any>{ initialLine: response.Line, initialColumn: response.Column }));
    }

    public getFrameworks(projects: string[]): string {
        const frameworks = _.map(projects, (project: string) => {
            return project.indexOf("+") === -1 ? "" : project.split("+")[1];
        }).filter((fw: string) => fw.length > 0);
        return frameworks.join(",");
    }

    public addTextEditorCommand(commandName: string, callback: (...args: any[]) => any) {
        return atom.commands.add("atom-text-editor", commandName, (event) => {
            const editor = atom.workspace.getActiveTextEditor();
            if (!editor) {
                return;
            };

            if (_.any(this._supportedExtensions, ext => _.endsWith(editor.getPath(), ext))) {
                event.stopPropagation();
                event.stopImmediatePropagation();
                callback(event);
            }
        });
    }

    private static createTextEditorObservable(extensions: string[], disposable: CompositeDisposable) {
        const editors: Atom.TextEditor[] = [];
        const subject = new Subject<Atom.TextEditor>();
        const editorSubject = new Subject<Atom.TextEditor>();

        disposable.add(atom.workspace.observeActivePaneItem((pane: any) => !editorSubject.isUnsubscribed && editorSubject.next(pane)));
        const editorObservable = editorSubject.filter(z => z && !!z.getGrammar);

        disposable.add(Observable.zip(editorObservable, editorObservable.skip(1), (editor, nextEditor) => ({ editor, nextEditor }))
            .debounceTime(50)
            .subscribe(function({editor, nextEditor}) {
                const path = nextEditor.getPath();
                if (!path) {
                    // editor isn"t saved yet.
                    if (editor && _.any(extensions, ext => _.endsWith(editor.getPath(), ext))) {
                        atom.notifications.addInfo("OmniSharp", { detail: "Functionality will limited until the file has been saved." });
                    }
                }
            }));

        disposable.add(atom.workspace.observeTextEditors((editor: Atom.TextEditor) => {
            const cb = () => {
                const p = editor.getPath();
                if (_.any(extensions, ext => _.endsWith(editor.getPath(), ext))) {
                    editors.push(editor);
                    if (!subject.unsubscribe) subject.next(editor);

                    // pull old editors.
                    disposable.add(editor.onDidDestroy(() => _.pull(editors, editor)));
                }
            };

            const path = editor.getPath();
            if (!path) {
                const disposer = editor.onDidChangePath(() => {
                    cb();
                    disposer.dispose();
                });
            } else {
                cb();
            }
        }));

        disposable.add(subject);
        disposable.add(editorSubject);

        return Observable.merge(subject, Observable.defer(() => Observable.from(editors))).delay(50);
    }

    /**
     * This property can be used to listen to any event that might come across on any solutions.
     * This is a mostly functional replacement for `registerConfiguration`, though there has been
     *     one place where `registerConfiguration` could not be replaced.
     */
    public get listener() {
        return manager.solutionObserver;
    }

    /**
     * This property can be used to observe to the aggregate or combined responses to any event.
     * A good example of this is, for code check errors, to aggregate all errors across all open solutions.
     */
    public get aggregateListener() {
        return manager.solutionAggregateObserver;
    }

    /**
     * This property gets a list of solutions as an observable.
     * NOTE: This property will not emit additions or removals of solutions.
     */
    public get solutions() {
        return Observable.defer(() => Observable.from(manager.activeSolutions));
    }

    /**
     * This method allows us to forget about the entire solution model.
     * Call this method with a specific editor, or just with a callback to capture the current editor
     *
     * The callback will then issue the request
     * NOTE: This API only exposes the operation Api and doesn"t expose the event api, as we are requesting something to happen
     */
    public request<T>(editor: Atom.TextEditor, callback: (solution: OmniSharpAtom.ExtendApi) => Observable<T>): Observable<T>;
    public request<T>(callback: (solution: OmniSharpAtom.ExtendApi) => Observable<T>): Observable<T>;
    public request<T>(editor: Atom.TextEditor | ((solution: OmniSharpAtom.ExtendApi) => Observable<T>), callback?: (solution: OmniSharpAtom.ExtendApi) => Observable<T>) {
        if (_.isFunction(editor)) {
            callback = <any>editor;
            editor = null;
        }

        if (!editor) {
            editor = atom.workspace.getActiveTextEditor();
        }

        const solutionCallback = (solution: Solution) => {
            const r = callback(solution.withEditor(<any>editor));
            return <Observable<T>>r;
        };

        let result: Observable<T>;

        if (editor) {
            result = manager.getSolutionForEditor(<Atom.TextEditor>editor)
                .filter(z => !!z)
                .mergeMap(solutionCallback).share();
        } else {
            result = manager.activeSolution.take(1)
                .filter(z => !!z)
                .mergeMap(solutionCallback).share();
        }

        // Ensure that the underying promise is connected
        //   (if we don"t subscribe to the reuslt of the request, which is not a requirement).
        result.subscribe();
        return result;
    }

    public getProject(editor: Atom.TextEditor) {
        return manager.getSolutionForEditor(editor)
            .mergeMap(z => z.model.getProjectForEditor(editor))
            .take(1);
    }

    public getSolutionForProject(project: ProjectViewModel<any>) {
        return Observable.of(
            _(manager.activeSolutions)
                .filter(solution => _.any(solution.model.projects, p => p.name === project.name))
                .first()
        );
    }

    /**
     * Allows for views to observe the active model as it changes between editors
     */
    public get activeModel() {
        return manager.activeSolution.map(z => z.model);
    }

    public switchActiveModel(callback: (model: ViewModel, cd: CompositeDisposable) => void): IDisposable {
        return disposeOnChange(this.activeModel, callback, true);
    }

    public get activeSolution() {
        return manager.activeSolution;
    }

    public switchActiveSolution(callback: (solution: Solution, cd: CompositeDisposable) => void): IDisposable {
        return disposeOnChange(this.activeSolution, callback, true);
    }

    public get activeEditor() {
        return this._activeEditor;
    }

    public switchActiveEditor(callback: (editor: Atom.TextEditor, cd: CompositeDisposable) => void): IDisposable {
        return disposeOnChange(this.activeEditor, callback, true);
    }

    public whenEditorConnected(editor: Atom.TextEditor) {
        return manager.getSolutionForEditor(editor)
            .mergeMap(solution => solution.whenConnected())
            .map(z => editor);
    }

    public get activeConfigEditor() {
        return this._activeConfigEditor;
    }

    public switchActiveConfigEditor(callback: (editor: Atom.TextEditor, cd: CompositeDisposable) => void): IDisposable {
        return disposeOnChange(this.activeConfigEditor, callback, true);
    }

    public get activeEditorOrConfigEditor() {
        return this._activeEditorOrConfigEditor;
    }

    public switchActiveEditorOrConfigEditor(callback: (editor: Atom.TextEditor, cd: CompositeDisposable) => void): IDisposable {
        return disposeOnChange(this.activeEditorOrConfigEditor, callback, true);
    }

    public get activeProject() {
        return this._activeProject;
    }

    public get activeFramework() {
        return this._activeFramework;
    }

    public get editors() {
        return this._editors;
    }

    public get configEditors() {
        return this._configEditors;
    }

    public eachEditor(callback: (editor: Atom.TextEditor, cd: CompositeDisposable) => void): IDisposable {
        return disposeOnChange(this._editors, callback);
    }

    public eachConfigEditor(callback: (editor: Atom.TextEditor, cd: CompositeDisposable) => void): IDisposable {
        return disposeOnChange(this._configEditors, callback);
    }

    public registerConfiguration(callback: (solution: Solution) => void) {
        manager.registerConfiguration(callback);
    }

    private get _kick_in_the_pants_() {
        return manager._kick_in_the_pants_;
    }

    private _supportedExtensions = [".cs", ".csx", /*".cake"*/];

    public get grammars() {
        return _.filter(atom.grammars.getGrammars(),
            grammar => _.any(this._supportedExtensions,
                ext => _.any((<any>grammar).fileTypes,
                    ft => _.trimLeft(ext, ".") === ft)));
    }

    public isValidGrammar(grammar: FirstMate.Grammar) {
        return _.any(this._supportedExtensions, ext => _.any((<any>grammar).fileTypes, ft => _.trimLeft(ext, ".") === ft));
    }

    private _packageDir: string;
    public get packageDir() {
        if (!this._packageDir) {
            console.info(`getPackageDirPaths: ${atom.packages.getPackageDirPaths()}`);
            this._packageDir = _.find(atom.packages.getPackageDirPaths(), function(packagePath) {
                console.info(`packagePath ${packagePath} exists: ${fs.existsSync(path.join(packagePath, "omnisharp-atom"))}`);
                return fs.existsSync(path.join(packagePath, "omnisharp-atom"));
            });

            // Fallback, this is for unit testing on travis mainly
            if (!this._packageDir) {
                this._packageDir = path.resolve(__dirname, "../../..");
            }
        }
        return this._packageDir;
    }
}

export default new Omni;

import {TextEditor} from "atom";
const metadataUri = "omnisharp://metadata/";
function makeOpener(): IDisposable {
    function createEditorView(assemblyName: string, typeName: string) {
        function issueRequest(solution: Solution) {
            return solution.request<any, { Source: string; SourceName: string }>("metadata", { AssemblyName: assemblyName, TypeName: typeName })
                .map(response => ({ source: response.Source, path: response.SourceName, solution }));
        }

        function setupEditor({solution, path, source}: { solution: Solution; source: string; path: string }) {
            const editor = new TextEditor({});
            editor.setText(source);
            editor.onWillInsertText((e) => e.cancel());
            editor.getBuffer().setPath(path);

            (<any>editor).omniProject = (<any>solution).path;
            (<any>editor).__omniClient__ = solution;
            editor.save = function() { /* */ };
            editor.saveAs = function() { /* */ };
            (<any>editor)._metadataEditor = true;

            return editor;
        }

        return manager.activeSolution
            .take(1)
            .mergeMap(issueRequest)
            .map(setupEditor)
            .toPromise();
    }

    return <any>atom.workspace.addOpener((uri: string) => {
        if (_.startsWith(uri, metadataUri)) {
            const url = uri.substr(metadataUri.length);
            const [assemblyName, typeName] = url.split("/");
            return createEditorView(assemblyName, typeName);
        }
    });
}

makeOpener();

function disposeOnChange<T>(target: Observable<T>, callback: (target: T, cd: CompositeDisposable) => void, activateOnTruthy = false): IDisposable {
    const outerCd = new CompositeDisposable();
    if (activateOnTruthy) target = target.filter(z => !!z);

    outerCd.add(target.subscribe(model => {
        const cd = new CompositeDisposable();
        outerCd.add(cd);

        cd.add(target.filter(active => active !== model)
            .subscribe(() => {
                outerCd.remove(cd);
                cd.dispose();
            }));

        callback(model, cd);
    }));

    return outerCd;
}
