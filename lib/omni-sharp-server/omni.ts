import {helpers, Observable, ReplaySubject, Subject, CompositeDisposable, BehaviorSubject, Disposable} from 'rx';
import manager = require("./client-manager");
import Client = require("./client");
import _ = require('lodash');
import {basename} from "path";
import {DriverState} from "omnisharp-client";
import {ProjectViewModel} from "./view-model";

class Omni {
    private disposable: CompositeDisposable;

    private _editors: Observable<Atom.TextEditor>;
    private _configEditors: Observable<Atom.TextEditor>;

    private _activeEditorSubject = new BehaviorSubject<Atom.TextEditor>(null);
    private _activeEditor = this._activeEditorSubject.shareReplay(1).asObservable();

    private _activeConfigEditorSubject = new BehaviorSubject<Atom.TextEditor>(null);
    private _activeConfigEditor = this._activeConfigEditorSubject.shareReplay(1).asObservable();

    private _activeProject = Observable.combineLatest(this._activeEditorSubject, this._activeConfigEditorSubject, (editor, config) => editor || config || null)
        .debounce(10)
        .asObservable()
        .flatMap(editor => manager.getClientForEditor(editor)
            .flatMap(z => z.model.getProjectForEditor(editor)))
        .shareReplay(1);

    private _activeFramework = Observable.combineLatest(this._activeEditorSubject, this._activeConfigEditorSubject, (editor, config) => editor || config || null)
        .debounce(10)
        .asObservable()
        .flatMapLatest(editor => manager.getClientForEditor(editor)
            .flatMapLatest(z => z.model.getProjectForEditor(editor)))
        .flatMapLatest(project => project.observe.activeFramework.map(framework => ({ project, framework })))
        .shareReplay(1);

    private _isOff = true;

    public get isOff() { return this._isOff; }
    public get isOn() { return !this.isOff; }

    public activate() {
        var openerDisposable = makeOpener();
        this.disposable = new CompositeDisposable;
        manager.activate(this._activeEditor);

        // we are only off if all our clients are disconncted or erroed.
        this.disposable.add(manager.combinationClient.state.subscribe(z => this._isOff = _.all(z, x => x.value === DriverState.Disconnected || x.value === DriverState.Error)));

        this._editors = Omni.createTextEditorObservable(['C#', 'C# Script File'], this.disposable);
        this._configEditors = Omni.createTextEditorObservable(['JSON'], this.disposable);

        this.disposable.add(atom.workspace.observeActivePaneItem((pane: any) => {
            if (pane && pane.getGrammar) {
                var grammar = pane.getGrammar();
                if (grammar) {
                    var grammarName = grammar.name;
                    if (grammarName === 'C#' || grammarName === 'C# Script File') {
                        this._activeConfigEditorSubject.onNext(null);
                        this._activeEditorSubject.onNext(pane);
                        return;
                    }

                    var filename = basename(pane.getPath());
                    if (filename === 'project.json') {
                        this._activeEditorSubject.onNext(null);
                        this._activeConfigEditorSubject.onNext(pane);
                        return;
                    }
                }
            }
            // This will tell us when the editor is no longer an appropriate editor
            this._activeEditorSubject.onNext(null);
            this._activeConfigEditorSubject.onNext(null);
        }));

        this.disposable.add(Disposable.create(() => {
            this._activeEditorSubject.onNext(null);
            this._activeConfigEditorSubject.onNext(null);
        }));
    }

    public deactivate() {
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
        atom.workspace.open(response.FileName, {initialLine: response.Line, initialColumn: response.Column})
            .then((editor) => {
                editor.setCursorBufferPosition([response.Line && response.Line, response.Column && response.Column])
            });
    }

    public getFrameworks(projects: string[]): string {
        var frameworks = _.map(projects, (project: string) => {
            return project.indexOf('+') === -1 ? '' : project.split('+')[1];
        }).filter((fw: string) => fw.length > 0);
        return frameworks.join(',');
    }

    public addTextEditorCommand(commandName: string, callback: (...args: any[]) => any) {
        return atom.commands.add("atom-text-editor", commandName, (event) => {
            var editor = atom.workspace.getActiveTextEditor();
            if (!editor) {
                return;
            };

            var grammarName = editor.getGrammar().name;
            if (grammarName === 'C#' || grammarName === 'C# Script File') {
                event.stopPropagation();
                event.stopImmediatePropagation();
                callback(event);
            }
        });
    }

    private static createTextEditorObservable(grammars: string[], disposable: CompositeDisposable) {
        var editors: Atom.TextEditor[] = [];
        var subject = new Subject<Atom.TextEditor>();
        disposable.add(subject);

        var editorSubject = new Subject<Atom.TextEditor>();
        disposable.add(editorSubject);

        disposable.add(atom.workspace.observeActivePaneItem((pane: any) => editorSubject.onNext(pane)));
        var editorObservable = editorSubject.where(z => z && !!z.getGrammar);

        disposable.add(Observable.zip(editorObservable, editorObservable.skip(1), (editor, nextEditor) => ({ editor, nextEditor }))
            .debounce(50)
            .subscribe(function({editor, nextEditor}) {
                var path = nextEditor.getPath();
                if (!path) {
                    // editor isn't saved yet.
                    if (editor && _.contains(grammars, editor.getGrammar().name)) {
                        atom.notifications.addInfo("OmniSharp", { detail: "Functionality will limited until the file has been saved." });
                    }
                }
            }));

        disposable.add(atom.workspace.observeTextEditors((editor: Atom.TextEditor) => {
            function cb() {
                editors.push(editor);
                subject.onNext(editor);

                // pull old editors.
                disposable.add(editor.onDidDestroy(() => _.pull(editors, editor)));
            }

            var editorFilePath;
            if (editor.getGrammar) {
                var s = editor.observeGrammar(grammar => {
                    var grammarName = editor.getGrammar().name;
                    if (_.contains(grammars, grammarName)) {
                        var path = editor.getPath();
                        if (!path) {
                            // editor isn't saved yet.
                            var sub = editor.onDidSave(() => {
                                if (editor.getPath()) {
                                    _.defer(() => {
                                        cb();
                                        s.dispose();
                                    });
                                }
                                sub.dispose();
                            });
                            disposable.add(sub);
                        } else {
                            _.defer(() => {
                                cb();
                                s.dispose();
                            });
                        }
                    }
                });

                disposable.add(s);
            }
        }));

        return Observable.merge(subject, Observable.defer(() => Observable.from(editors)));
    }

    /**
    * This property can be used to listen to any event that might come across on any clients.
    * This is a mostly functional replacement for `registerConfiguration`, though there has been
    *     one place where `registerConfiguration` could not be replaced.
    */
    public get listener() {
        return manager.observationClient;
    }

    /**
    * This property can be used to observe to the aggregate or combined responses to any event.
    * A good example of this is, for code check errors, to aggregate all errors across all open solutions.
    */
    public get combination() {
        return manager.combinationClient;
    }

    /**
    * This method allows us to forget about the entire client model.
    * Call this method with a specific editor, or just with a callback to capture the current editor
    *
    * The callback will then issue the request
    * NOTE: This API only exposes the operation Api and doesn't expose the event api, as we are requesting something to happen
    */
    public request<T>(editor: Atom.TextEditor, callback: (client: OmniSharp.ExtendApi) => Rx.Observable<T> | Rx.IPromise<T>): Rx.Observable<T>;
    public request<T>(callback: (client: OmniSharp.ExtendApi) => Rx.Observable<T> | Rx.IPromise<T>): Rx.Observable<T>;
    public request<T>(editor: Atom.TextEditor | ((client: OmniSharp.ExtendApi) => Rx.Observable<T> | Rx.IPromise<T>), callback?: (client: OmniSharp.ExtendApi) => Rx.Observable<T> | Rx.IPromise<T>): Rx.Observable<T> {
        if (_.isFunction(editor)) {
            callback = <any>editor;
            editor = null;
        }

        if (!editor) {
            editor = atom.workspace.getActiveTextEditor();
        }

        var clientCallback = (client: Client) => {
            var r = callback(client);
            if (helpers.isPromise(r)) {
                return Observable.fromPromise(<Rx.IPromise<T>> r);
            } else {
                return <Rx.Observable<T>>r;
            }
        };

        var result: Observable<T>;

        if (editor) {
            result = manager.getClientForEditor(<Atom.TextEditor> editor)
                .where(z => !!z)
                .flatMap(clientCallback).share();
        } else {
            result = manager.activeClient.take(1)
                .where(z => !!z)
                .flatMap(clientCallback).share();
        }

        // Ensure that the underying promise is connected
        //   (if we don't subscribe to the reuslt of the request, which is not a requirement).
        result.subscribeOnCompleted(() => { });

        return result;
    }

    public getProject(editor: Atom.TextEditor) {
        return manager.getClientForEditor(editor)
            .flatMap(z => z.model.getProjectForEditor(editor))
            .take(1);
    }

    public getClientForProject(project: ProjectViewModel) {
        return Observable.from(manager.activeClients)
            .where(solution => _.any(solution.model.projects, p => p === project))
            .take(1);
    }

    /**
    * Allows for views to observe the active model as it changes between editors
    */
    public get activeModel() {
        return manager.activeClient.map(z => z.model);
    }

    public get activeEditor() {
        return this._activeEditor;
    }

    public get activeConfigEditor() {
        return this._activeConfigEditor;
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

    public registerConfiguration(callback: (client: Client) => void) {
        manager.registerConfiguration(callback);
    }
}

var instance = new Omni;

export = instance;

import {TextEditor} from "atom";
var metadataUri = 'omnisharp://metadata/';
function makeOpener(): Rx.IDisposable {
    function createEditorView(assemblyName: string, typeName: string) {
        function issueRequest(solution: Client) {
            return solution.request<any, { Source: string; SourceName: string }>("metadata", { AssemblyName: assemblyName, TypeName: typeName })
                .map(response => ({ source: response.Source, path: response.SourceName, solution }));
        }

        function setupEditor({solution, path, source}: { solution: Client; source: string; path: string }) {
            var editor = new TextEditor({});
            editor.setText(source);
            editor.onWillInsertText((e) => e.cancel());
            editor.getBuffer().setPath(path);

            (<any>editor).omniProject = (<any>solution).path;
            (<any>editor).__omniClient__ = solution;
            editor.save = function() { };
            editor.saveAs = function() { };

            return editor;
        }

        return manager.activeClient
            .take(1)
            .flatMap(issueRequest)
        //.concat(..._.map(manager.activeClients, issueRequest))
        //.take(1)
            .map(setupEditor)
            .toPromise();
    }

    return <any>atom.workspace.addOpener((uri: string) => {
        if (_.startsWith(uri, metadataUri)) {
            var url = uri.substr(metadataUri.length);
            var [assemblyName, typeName] = url.split('/');
            return createEditorView(assemblyName, typeName);
        }
    });
}
