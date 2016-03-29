import {Observable, ReplaySubject, Subject, BehaviorSubject, Scheduler} from "rxjs";
import {CompositeDisposable, Disposable, IDisposable, createObservable} from "omnisharp-client";
import {SolutionManager} from "./solution-manager";
import {Solution} from "./solution";
import _ from "lodash";
import {DriverState} from "omnisharp-client";
import {ProjectViewModel} from "./project-view-model";
import {ViewModel} from "./view-model";
import * as fs from "fs";
import * as path from "path";
import {ExtendApi} from "../omnisharp";
import {Models} from "omnisharp-client";
import {OmnisharpTextEditor, isOmnisharpTextEditor} from "./omnisharp-text-editor";
import {metadataOpener} from "./metadata-editor";

// Time we wait to try and do our active switch tasks.
const DEBOUNCE_TIMEOUT = 100;
const statefulProperties = ["isOff", "isConnecting", "isOn", "isReady", "isError"];

function wrapEditorObservable(observable: Observable<OmnisharpTextEditor>) {
    return observable
        .subscribeOn(Scheduler.queue)
        .observeOn(Scheduler.queue)
        .debounceTime(DEBOUNCE_TIMEOUT)
        .filter(editor => !editor || editor && !editor.isDestroyed());
}

class OmniManager implements IDisposable {
    private disposable: CompositeDisposable;

    private _editors: Observable<OmnisharpTextEditor>;
    private _configEditors: Observable<OmnisharpTextEditor>;
    private _underlyingEditors: OmnisharpTextEditor[] = [];

    public get viewModelStatefulProperties() { return statefulProperties; }

    private _activeEditorOrConfigEditorSubject = new BehaviorSubject<OmnisharpTextEditor>(null);
    private _activeEditorOrConfigEditor = wrapEditorObservable(<Observable<OmnisharpTextEditor>><any>this._activeEditorOrConfigEditorSubject)
        .publishReplay(1).refCount();

    private _activeEditor = wrapEditorObservable(<Observable<OmnisharpTextEditor>><any>this._activeEditorOrConfigEditorSubject)
        .delay(DEBOUNCE_TIMEOUT)
        .map(x => x && !x.omnisharp.config ? x : null)
        .publishReplay(1).refCount();

    private _activeConfigEditor = wrapEditorObservable(<Observable<OmnisharpTextEditor>><any>this._activeEditorOrConfigEditorSubject)
        .delay(DEBOUNCE_TIMEOUT)
        .map(x => x && x.omnisharp.config ? x : null)
        .publishReplay(1).refCount();

    private _activeProject = this._activeEditorOrConfigEditor
        .filter(editor => editor && !editor.isDestroyed())
        .switchMap(editor => editor.omnisharp.solution.model.getProjectForEditor(editor))
        .distinctUntilChanged()
        .publishReplay(1).refCount();

    private _activeFramework = this._activeEditorOrConfigEditor
        .filter(editor => editor && !editor.isDestroyed())
        .switchMap(editor => editor.omnisharp.solution.model.getProjectForEditor(editor))
        .switchMap(project => project.observe.activeFramework, (project, framework) => ({ project, framework }))
        .distinctUntilChanged()
        .publishReplay(1).refCount();

    private _diagnostics: Observable<Models.DiagnosticLocation[]>;
    public get diagnostics() { return this._diagnostics; }

    private _isOff = true;

    public get isOff() { return this._isOff; }
    public get isOn() { return !this.isOff; }

    public activate() {
        this.disposable = new CompositeDisposable;
        this.disposable.add(metadataOpener());

        const editors = this.createTextEditorObservable(this._supportedExtensions, this.disposable);
        this._editors = wrapEditorObservable(editors.filter(x => !x.omnisharp.config));
        this._configEditors = wrapEditorObservable(editors.filter(x => x.omnisharp.config));

        SolutionManager.setupContextCallback = editor => {
            this._underlyingEditors.push(editor);
            editor.omnisharp.config = _.endsWith(editor.getPath(), "project.json");

            this.disposable.add(Disposable.create(() => {
                _.pull(this._underlyingEditors, editor);
            }));

            editor.omnisharp.solution.disposable.add(Disposable.create(() => {
                _.pull(this._underlyingEditors, editor);
            }));
        };

        SolutionManager.activate(this._activeEditorOrConfigEditor);

        // we are only off if all our solutions are disconncted or erroed.
        this.disposable.add(SolutionManager.solutionAggregateObserver.state.subscribe(z => this._isOff = _.every(z, x => x.value === DriverState.Disconnected || x.value === DriverState.Error)));

        this.disposable.add(
            createObservable<Atom.TextEditor>(observer => {
                const dis = atom.workspace.observeActivePaneItem((pane: any) => {
                    if (pane && pane.getGrammar && pane.getPath && this.isValidGrammar(pane.getGrammar())) {
                        observer.next(<Atom.TextEditor>pane);
                        return;
                    }
                    observer.next(null);
                });

                return () => dis.dispose();
            })
                .concatMap((pane) => {
                    if (!pane || isOmnisharpTextEditor(pane)) {
                        return Observable.of(pane);
                    }
                    return wrapEditorObservable(
                        SolutionManager.getSolutionForEditor(pane)
                            .map(x => <OmnisharpTextEditor>pane)
                    );
                })
                .subscribe(this._activeEditorOrConfigEditorSubject));

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
            this._activeEditorOrConfigEditorSubject.next(null);
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
            this.activeModel.startWith(null), <Observable<boolean>><any>showDiagnosticsForAllSolutions, showDiagnosticsForAllSolutions.skip(1).startWith(atom.config.get<boolean>("omnisharp-atom.showDiagnosticsForAllSolutions")),
            (model, enabled, wasEnabled) => ({ model, enabled, wasEnabled }))
            // If the setting is enabled (and hasn"t changed) then we don"t need to redo the subscription
            .filter(ctx => (!(ctx.enabled && ctx.wasEnabled === ctx.enabled)))
            .switchMap(ctx => {
                const {enabled, model} = ctx;

                if (enabled) {
                    return combinationObservable
                        .debounceTime(200)
                        .map(data => _.flatten<Models.DiagnosticLocation>(data));
                } else if (model) {
                    return model.observe.codecheck;
                }

                return Observable.of(<Models.DiagnosticLocation[]>[]);
            })
            .startWith([])
            .publishReplay(1).refCount();
    }

    public dispose() {
        if (SolutionManager._unitTestMode_) return;
        this.disposable.dispose();
        SolutionManager.deactivate();
    }

    public connect() { SolutionManager.connect(); }

    public disconnect() { SolutionManager.disconnect(); }

    public toggle() {
        if (SolutionManager.connected) {
            SolutionManager.disconnect();
        } else {
            SolutionManager.connect();
        }
    }

    public navigateTo(response: { FileName: string; Line: number; Column: number; }) {
        return Observable.fromPromise(<Promise<Atom.TextEditor>><any>atom.workspace.open(response.FileName, <any>{ initialLine: response.Line, initialColumn: response.Column }));
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

            if (_.some(this._supportedExtensions, ext => _.endsWith(editor.getPath(), ext))) {
                event.stopPropagation();
                event.stopImmediatePropagation();
                callback(event);
            }
        });
    }

    private createTextEditorObservable(extensions: string[], disposable: CompositeDisposable, config = false) {
        this._createSafeGuard(extensions, disposable);

        return Observable.merge<OmnisharpTextEditor>(
            Observable.defer(() => Observable.from(this._underlyingEditors)),
            createObservable<OmnisharpTextEditor>(observer => {
                const dis = atom.workspace.observeTextEditors((editor: Atom.TextEditor) => {
                    const cb = () => {
                        if (_.some(extensions, ext => _.endsWith(editor.getPath(), ext))) {
                            SolutionManager.getSolutionForEditor(editor)
                                .subscribe(() => observer.next(<any>editor));
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
                });

                return () => dis.dispose();
            }));
    }

    private _createSafeGuard(extensions: string[], disposable: CompositeDisposable) {
        const editorSubject = new Subject<OmnisharpTextEditor>();

        disposable.add(atom.workspace.observeActivePaneItem((pane: any) => editorSubject.next(pane)));
        const editorObservable = editorSubject.filter(z => z && !!z.getGrammar).startWith(null);

        disposable.add(Observable.zip(editorObservable, editorObservable.skip(1), (editor, nextEditor) => ({ editor, nextEditor }))
            .debounceTime(50)
            .subscribe(function({editor, nextEditor}) {
                const path = nextEditor.getPath();
                if (!path) {
                    // editor isn"t saved yet.
                    if (editor && _.some(extensions, ext => _.endsWith(editor.getPath(), ext))) {
                        atom.notifications.addInfo("OmniSharp", { detail: "Functionality will limited until the file has been saved." });
                    }
                }
            }));
    }

    /**
     * This property can be used to listen to any event that might come across on any solutions.
     * This is a mostly functional replacement for `registerConfiguration`, though there has been
     *     one place where `registerConfiguration` could not be replaced.
     */
    public get listener() {
        return SolutionManager.solutionObserver;
    }

    /**
     * This property can be used to observe to the aggregate or combined responses to any event.
     * A good example of this is, for code check errors, to aggregate all errors across all open solutions.
     */
    public get aggregateListener() {
        return SolutionManager.solutionAggregateObserver;
    }

    /**
     * This property gets a list of solutions as an observable.
     * NOTE: This property will not emit additions or removals of solutions.
     */
    public get solutions() {
        return Observable.defer(() => Observable.from<Solution>(SolutionManager.activeSolutions));
    }

    /**
     * This method allows us to forget about the entire solution model.
     * Call this method with a specific editor, or just with a callback to capture the current editor
     *
     * The callback will then issue the request
     * NOTE: This API only exposes the operation Api and doesn"t expose the event api, as we are requesting something to happen
     */
    public request<T>(editor: Atom.TextEditor, callback: (solution: ExtendApi) => Observable<T>): Observable<T>;
    public request<T>(callback: (solution: ExtendApi) => Observable<T>): Observable<T>;
    public request<T>(editor: Atom.TextEditor | ((solution: ExtendApi) => Observable<T> | Promise<T>), callback?: (solution: ExtendApi) => Observable<T>): Observable<T> {
        if (_.isFunction(editor)) {
            callback = <any>editor;
            editor = null;
        }

        if (!editor) {
            editor = atom.workspace.getActiveTextEditor();
        }

        const solutionCallback = (solution: Solution) => callback(solution.withEditor(<any>editor));

        let result: Observable<T>;
        if (editor && isOmnisharpTextEditor(editor)) {
            result = solutionCallback(editor.omnisharp.solution)
                .share();
            result.subscribe();
            return result;
        }

        let solutionResult: Observable<Solution>;
        if (editor) {
            solutionResult = SolutionManager.getSolutionForEditor(<Atom.TextEditor>editor);
        } else {
            solutionResult = SolutionManager.activeSolution.take(1);
        }

        result = solutionResult
            .filter(z => !!z)
            .flatMap(solutionCallback)
            .share();

        // Ensure that the underying promise is connected
        //   (if we don"t subscribe to the reuslt of the request, which is not a requirement).
        result.subscribe();

        return result;
    }

    public getProject(editor: Atom.TextEditor) {
        if (isOmnisharpTextEditor(editor) && editor.omnisharp.project) {
            return Observable.of(editor.omnisharp.project);
        }

        return SolutionManager.getSolutionForEditor(editor)
            .flatMap(z => z.model.getProjectForEditor(editor))
            .take(1);
    }

    public getSolutionForProject(project: ProjectViewModel<any>) {
        return Observable.of(
            _(SolutionManager.activeSolutions)
                .filter(solution => _.some(solution.model.projects, p => p.name === project.name))
                .first()
        );
    }

    public getSolutionForEditor(editor: Atom.TextEditor) {
        if (isOmnisharpTextEditor(editor)) {
            return Observable.of(editor.omnisharp.solution);
        }

        return SolutionManager.getSolutionForEditor(editor);
    }

    /**
     * Allows for views to observe the active model as it changes between editors
     */
    public get activeModel() {
        return SolutionManager.activeSolution.map(z => z.model);
    }

    public switchActiveModel(callback: (model: ViewModel, cd: CompositeDisposable) => void): IDisposable {
        const outerCd = new CompositeDisposable();
        outerCd.add(this.activeModel.filter(z => !!z).subscribe(model => {
            const cd = new CompositeDisposable();
            outerCd.add(cd);

            cd.add(this.activeModel.filter(active => active !== model)
                .subscribe(() => {
                    outerCd.remove(cd);
                    cd.dispose();
                }));

            callback(model, cd);
        }));

        return outerCd;
    }

    public get activeSolution() {
        return SolutionManager.activeSolution;
    }

    public switchActiveSolution(callback: (solution: Solution, cd: CompositeDisposable) => void): IDisposable {
        const outerCd = new CompositeDisposable();
        outerCd.add(this.activeSolution.filter(z => !!z).subscribe(solution => {
            const cd = new CompositeDisposable();
            outerCd.add(cd);

            cd.add(this.activeSolution.filter(active => active !== solution)
                .subscribe(() => {
                    outerCd.remove(cd);
                    cd.dispose();
                }));

            callback(solution, cd);
        }));

        return outerCd;
    }

    public get activeEditor() {
        return this._activeEditor;
    }

    public switchActiveEditor(callback: (editor: OmnisharpTextEditor, cd: CompositeDisposable) => void): IDisposable {
        const outerCd = new CompositeDisposable();
        outerCd.add(this.activeEditor.filter(z => !!z).subscribe(editor => {
            const cd = new CompositeDisposable();
            outerCd.add(cd);

            cd.add(this.activeEditor.filter(active => active !== editor)
                .subscribe(() => {
                    outerCd.remove(cd);
                    cd.dispose();
                }));

            callback(editor, cd);
        }));

        return outerCd;
    }

    public whenEditorConnected(editor: Atom.TextEditor) {
        if (isOmnisharpTextEditor(editor)) {
            return editor.omnisharp.solution
                .whenConnected()
                .map(z => editor);
        }

        return SolutionManager.getSolutionForEditor(editor)
            .flatMap(solution => solution.whenConnected(), () => <OmnisharpTextEditor>editor);
    }

    public get activeConfigEditor() {
        return this._activeConfigEditor;
    }

    public switchActiveConfigEditor(callback: (editor: OmnisharpTextEditor, cd: CompositeDisposable) => void): IDisposable {
        const outerCd = new CompositeDisposable();
        outerCd.add(this.activeConfigEditor.filter(z => !!z).subscribe(editor => {
            const cd = new CompositeDisposable();
            outerCd.add(cd);

            cd.add(this.activeConfigEditor.filter(active => active !== editor)
                .subscribe(() => {
                    outerCd.remove(cd);
                    cd.dispose();
                }));

            callback(editor, cd);
        }));

        return outerCd;
    }

    public get activeEditorOrConfigEditor() {
        return this._activeEditorOrConfigEditor;
    }

    public switchActiveEditorOrConfigEditor(callback: (editor: OmnisharpTextEditor, cd: CompositeDisposable) => void): IDisposable {
        const outerCd = new CompositeDisposable();
        outerCd.add(this.activeEditorOrConfigEditor.filter(z => !!z).subscribe(editor => {
            const cd = new CompositeDisposable();
            outerCd.add(cd);

            cd.add(this.activeEditorOrConfigEditor.filter(active => active !== editor)
                .subscribe(() => {
                    outerCd.remove(cd);
                    cd.dispose();
                }));

            callback(editor, cd);
        }));

        return outerCd;
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

    public eachEditor(callback: (editor: OmnisharpTextEditor, cd: CompositeDisposable) => void): IDisposable {
        const outerCd = new CompositeDisposable();
        outerCd.add(this._editors.subscribe(editor => {
            const cd = new CompositeDisposable();
            outerCd.add(cd);

            cd.add(editor.onDidDestroy((() => {
                outerCd.remove(cd);
                cd.dispose();
            })));

            callback(editor, cd);
        }));

        return outerCd;
    }

    public eachConfigEditor(callback: (editor: OmnisharpTextEditor, cd: CompositeDisposable) => void): IDisposable {
        const outerCd = new CompositeDisposable();
        outerCd.add(this._configEditors.subscribe(editor => {
            const cd = new CompositeDisposable();
            outerCd.add(cd);

            cd.add(editor.onDidDestroy((() => {
                outerCd.remove(cd);
                cd.dispose();
            })));

            callback(editor, cd);
        }));

        return outerCd;
    }

    public registerConfiguration(callback: (solution: Solution) => void) {
        SolutionManager.registerConfiguration(callback);
    }

    private get _kick_in_the_pants_() {
        return SolutionManager._kick_in_the_pants_;
    }

    private _supportedExtensions = ["project.json", ".cs", ".csx", /*".cake"*/];

    public get grammars() {
        return _.filter(atom.grammars.getGrammars(),
            grammar => _.some(this._supportedExtensions,
                ext => _.some((<any>grammar).fileTypes,
                    ft => _.trimStart(ext, ".") === ft)));
    }

    public isValidGrammar(grammar: FirstMate.Grammar) {
        return _.some(this.grammars, { scopeName: (grammar as any).scopeName });
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

/* tslint:disable:variable-name */
export const Omni = new OmniManager;
/* tslint:enable:variable-name */
