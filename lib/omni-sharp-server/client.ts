import _ = require('lodash');
import {Observable, Subject, CompositeDisposable} from 'rx';
import {OmnisharpClientV2, DriverState, OmnisharpClientOptions} from "omnisharp-client";

interface ClientOptions extends OmnisharpClientOptions {
    temporary: boolean;
    repository: Atom.GitRepository;
    index: number;
}

import {ViewModel} from "./view-model";

class Client extends OmnisharpClientV2 {
    public model: ViewModel;
    public logs: Observable<OmniSharp.OutputMessage>;
    public path: string;
    public index: number;
    public temporary: boolean = false;
    private _clientDisposable = new CompositeDisposable();
    private repository: Atom.GitRepository;
    constructor(options: ClientOptions) {
        super(options);
        this.configureClient();
        this.temporary = options.temporary;
        this.model = new ViewModel(this);
        this.path = options.projectPath;
        this.index = options['index'];
        this.repository = options.repository;
        this.setupRepository();
        this._clientDisposable.add(this.model);
    }

    public toggle() {
        if (this.currentState === DriverState.Disconnected) {
            var path = atom && atom.project && atom.project.getPaths()[0];
            this.connect({
                projectPath: path
            });
        } else {
            this.disconnect();
        }
    }

    public connect(options?) {
        if (this.currentState === DriverState.Connected || this.currentState === DriverState.Connecting) return;
        super.connect(options);

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
        this._clientDisposable.dispose();
    }

    private configureClient() {
        this.logs = this.events.map(event => ({
            message: event.Body && event.Body.Message || event.Event || '',
            logLevel: event.Body && event.Body.LogLevel || (event.Type === "error" && 'ERROR') || 'INFORMATION'
        }));

        this._clientDisposable.add(this.errors.subscribe(exception => {
            console.error(exception);
        }));

        this._clientDisposable.add(this.responses.subscribe(data => {
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

    private _fixupRequest<TRequest, TResponse>(action: string, request: TRequest, cb: () => Rx.Observable<TResponse>) {
        // Only send changes for requests that really need them.
        if (this._currentEditor && _.isObject(request)) {
            var editor = this._currentEditor;

            var marker = editor.getCursorBufferPosition();
            _.defaults(request, { Column: marker.column, Line: marker.row, FileName: editor.getURI(), Buffer: editor.getText() });
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

        return cb();
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

            this._clientDisposable.add(branchSubject
                .distinctUntilChanged()
                .subscribe(() => atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:restart-server')));
            this._clientDisposable.add(branchSubject);

            this._clientDisposable.add(this.repository.onDidChangeStatuses(() => {
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

export = Client;

for (var key in Client.prototype) {
    if (_.endsWith(key, 'Promise')) {
        (function() {
            var action = key.replace(/Promise$/, '');
            var promiseMethod = Client.prototype[key];
            var observableMethod = Client.prototype[action];

            Client.prototype[key] = function(request, options) {
                return this._fixupRequest(action, request, () => promiseMethod.call(this, request, options));
            };

            Client.prototype[action] = function(request, options) {
                return this._fixupRequest(action, request, () => observableMethod.call(this, request, options));
            };
        })();
    }
}
