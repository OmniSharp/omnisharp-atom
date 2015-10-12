import _ = require('lodash');
import {Observable, Subject, CompositeDisposable, Disposable} from 'rx';
import {clients, DriverState, OmnisharpClientOptions} from "omnisharp-client";

interface SolutionOptions extends OmnisharpClientOptions {
    temporary: boolean;
    repository: Atom.GitRepository;
    index: number;
}

import {ViewModel} from "./view-model";

export class Solution extends clients.ClientV2 {
    public model: ViewModel;
    public logs: Observable<OmniSharp.OutputMessage>;
    public path: string;
    public index: number;
    public temporary: boolean = false;
    private _solutionDisposable = new CompositeDisposable();
    public get disposable() { return this._solutionDisposable; }

    private repository: Atom.GitRepository;
    public get isDisposed() { return this._solutionDisposable.isDisposed; }

    constructor(options: SolutionOptions) {
        super(options);
        this.configureSolution();
        this.temporary = options.temporary;
        this.model = new ViewModel(this);
        this.path = options.projectPath;
        this.index = options['index'];
        this.repository = options.repository;
        this.setupRepository();
        this._solutionDisposable.add(this.model);

        this.registerFixup((action, request) => this._fixupRequest(action, request));
    }

    public toggle() {
        if (this.currentState === DriverState.Disconnected) {
            this.connect();
        } else {
            this.disconnect();
        }
    }

    public connect() {
        if (this.isDisposed) return;
        if (this.currentState === DriverState.Connected || this.currentState === DriverState.Connecting) return;
        super.connect();

        this.log("Starting OmniSharp server (pid:" + this.id + ")");
        this.log("OmniSharp Location: " + this.serverPath);
        this.log("Change the location that OmniSharp is loaded from by setting the OMNISHARP environment variable");
        this.log("OmniSharp Path: " + this.projectPath);
    }

    public disconnect() {
        super.disconnect();

        this.log("Omnisharp server stopped.");
    }

    public dispose() {
        super.dispose();
        this._solutionDisposable.dispose();
    }

    private configureSolution() {
        this.logs = this.events.where(x => x.Event !== "Diagnostic").map(event => ({
            message: event.Body && event.Body.Message || event.Event || '',
            logLevel: event.Body && event.Body.LogLevel || (event.Type === "error" && 'ERROR') || 'INFORMATION'
        }));

        this._solutionDisposable.add(this.errors.subscribe(exception => {
            console.error(exception);
        }));

        this._solutionDisposable.add(this.responses.subscribe(data => {
            if (atom.config.get('omnisharp-atom.developerMode')) {
                console.log("omni:" + data.command, data.request, data.response);
            }
        }));
    }

    private _currentEditor: Atom.TextEditor;
    public withEditor(editor: Atom.TextEditor) {
        this._currentEditor = editor;
        return this;
    }

    private static _regex = new RegExp(String.fromCharCode(0xFFFD), 'g');
    private _fixupRequest<TRequest, TResponse>(action: string, request: TRequest) {
        // Only send changes for requests that really need them.
        if (this._currentEditor && _.isObject(request)) {
            var editor = this._currentEditor;

            var marker = editor.getCursorBufferPosition();
            _.defaults(request, { Column: marker.column, Line: marker.row, FileName: editor.getURI(), Buffer: editor.getBuffer().getLines().join('\n') });
            /*
            TODO: Update once rename/code actions don't apply changes to the workspace
            var omniChanges: { oldRange: { start: TextBuffer.Point, end: TextBuffer.Point }; newRange: { start: TextBuffer.Point, end: TextBuffer.Point }; oldText: string; newText: string; }[] = (<any>editor).__omniChanges__ || [];
            var computedChanges: OmniSharp.Models.LinePositionSpanTextChange[];

            if (_.any(['goto', 'navigate', 'find', 'package'], x => _.startsWith(action, x))) {
                computedChanges = null;
            } else {
                computedChanges = omniChanges.map(change => <OmniSharp.Models.LinePositionSpanTextChange>{
                    NewText: change.newText,
                    StartLine: change.oldRange.start.row,
                    StartColumn: change.oldRange.start.column,
                    EndLine: change.oldRange.end.row,
                    EndColumn: change.oldRange.end.column
                });
            }

            omniChanges.splice(0, omniChanges.length);
            _.defaults(request, { Changes: computedChanges });
            */
        }

        if (request['Buffer']) {
            request['Buffer'] = request['Buffer'].replace(Solution._regex, '');
        }
    }

    public request<TRequest, TResponse>(action: string, request?: TRequest, options?: OmniSharp.RequestOptions): Rx.Observable<TResponse> {
        if (this._currentEditor) {
            var editor = this._currentEditor;
            this._currentEditor = null;
            // TODO: update and add to typings.
            if (editor.isDestroyed()) {
                return Observable.empty<TResponse>();
            }
        }

        var tempR: OmniSharp.Models.Request = request;
        if (tempR && _.endsWith(tempR.FileName, '.json')) {
            tempR.Buffer = null;
            tempR.Changes = null;
        }

        return super.request<TRequest, TResponse>(action, request, options);
    }

    private setupRepository() {
        if (this.repository) {
            var branchSubject = new Subject<string>();

            this._solutionDisposable.add(branchSubject
                .distinctUntilChanged()
                .subscribe(() => atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:restart-server')));
            this._solutionDisposable.add(branchSubject);

            this._solutionDisposable.add(this.repository.onDidChangeStatuses(() => {
                branchSubject.onNext(this.repository['branch']);
            }));
        }
    }

    public whenConnected() {
        return this.state.startWith(this.currentState)
            .where(x => x === DriverState.Connected)
            .take(1);
    }
}
