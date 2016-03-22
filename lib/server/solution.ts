import _ from "lodash";
import {Observable, Subject} from "rxjs";
import {CompositeDisposable} from "omnisharp-client";
import {Models, RequestOptions, ClientV2, DriverState, OmnisharpClientOptions} from "omnisharp-client";

interface SolutionOptions extends OmnisharpClientOptions {
    temporary: boolean;
    repository: Atom.GitRepository;
    index: number;
}

import {ViewModel} from "./view-model";

export class Solution extends ClientV2 {
    private static _regex = new RegExp(String.fromCharCode(0xFFFD), "g");

    public model: ViewModel;
    public logs: Observable<OutputMessage>;
    public path: string;
    public index: number;
    public temporary: boolean = false;
    private _solutionDisposable = new CompositeDisposable();
    public get disposable() { return this._solutionDisposable; }

    private repository: Atom.GitRepository;
    public get isDisposed() { return this._solutionDisposable.isDisposed; }

    private _isFolderPerFile = false;
    public get isFolderPerFile() { return this._isFolderPerFile; }
    public set isFolderPerFile(value) { this._isFolderPerFile = value; }

    constructor(options: SolutionOptions) {
        super(options);
        this.configureSolution();
        this.temporary = options.temporary;
        this.model = new ViewModel(this);
        this.path = options.projectPath;
        this.index = options.index;
        this.repository = options.repository;
        this.setupRepository();
        this._solutionDisposable.add(this.model);

        this.registerFixup((action: string, request: any, opts?: RequestOptions) => this._fixupRequest(action, request));
    }

    public connect() {
        if (this.isDisposed) return;
        if (this.currentState >= DriverState.Downloading && this.currentState <= DriverState.Connected) return;
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
        this.logs = this.events.map(event => ({
            message: event.Body && event.Body.Message || event.Event || "",
            logLevel: event.Body && event.Body.LogLevel || (event.Type === "error" && "ERROR") || "INFORMATION"
        }));

        this._solutionDisposable.add(this.errors.subscribe(exception => {
            console.error(exception);
        }));

        this._solutionDisposable.add(this.responses.subscribe(data => {
            if (atom.config.get("omnisharp-atom.developerMode")) {
                console.log("omni:" + data.command, data.request, data.response);
            }
        }));
    }

    private _currentEditor: Atom.TextEditor;
    public withEditor(editor: Atom.TextEditor) {
        this._currentEditor = editor;
        return this;
    }
    private _fixupRequest<TRequest, TResponse>(action: string, request: TRequest) {
        // Only send changes for requests that really need them.
        if (this._currentEditor && _.isObject(request)) {
            const editor = this._currentEditor;

            const marker = editor.getCursorBufferPosition();
            _.defaults(request, { Column: marker.column, Line: marker.row, FileName: editor.getURI(), Buffer: editor.getBuffer().getLines().join("\n") });
            /*
            TODO: Update once rename/code actions don"t apply changes to the workspace
            const omniChanges: { oldRange: { start: TextBuffer.Point, end: TextBuffer.Point }; newRange: { start: TextBuffer.Point, end: TextBuffer.Point }; oldText: string; newText: string; }[] = (<any>editor).__omniChanges__ || [];
            const computedChanges: Models.LinePositionSpanTextChange[];

            if (_.some(["goto", "navigate", "find", "package"], x => _.startsWith(action, x))) {
                computedChanges = null;
            } else {
                computedChanges = omniChanges.map(change => <Models.LinePositionSpanTextChange>{
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

        /* tslint:disable:no-string-literal */
        if (request["Buffer"]) {
            request["Buffer"] = request["Buffer"].replace(Solution._regex, "");
        }
        /* tslint:enable:no-string-literal */
    }

    public request<TRequest, TResponse>(action: string, request?: TRequest, options?: RequestOptions): Observable<TResponse> {
        if (this._currentEditor) {
            const editor = this._currentEditor;
            this._currentEditor = null;
            // TODO: update and add to typings.
            if (editor.isDestroyed()) {
                return Observable.empty<TResponse>();
            }
        }

        const tempR: Models.Request = request;
        if (tempR && _.endsWith(tempR.FileName, ".json")) {
            tempR.Buffer = null;
            tempR.Changes = null;
        }

        return super.request<TRequest, TResponse>(action, request, options);
    }

    private setupRepository() {
        if (this.repository) {
            const branchSubject = new Subject<string>();

            this._solutionDisposable.add(branchSubject
                .distinctUntilChanged()
                .subscribe(() => atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:restart-server")));

            this._solutionDisposable.add(this.repository.onDidChangeStatuses(() => {
                branchSubject.next((<any>this.repository).branch);
            }));
        }
    }

    public whenConnected() {
        return this.state.startWith(this.currentState)
            .filter(x => x === DriverState.Connected)
            .take(1);
    }
}
