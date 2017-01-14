import { defaults, endsWith, isObject, some, startsWith } from 'lodash';
import { DriverState, Models, ReactiveClient, IReactiveClientOptions, RequestOptions, Runtime } from 'omnisharp-client';
import { Observable, Subject } from 'rxjs';
import { CompositeDisposable } from 'ts-disposables';
import { IOmnisharpTextEditor } from './omnisharp-text-editor';
import { ViewModel } from './view-model';

interface ISolutionOptions extends IReactiveClientOptions {
    temporary: boolean;
    repository: Atom.GitRepository;
    index: number;
}

// tslint:disable-next-line:export-name
export class Solution extends ReactiveClient {
    private static _regex = new RegExp(String.fromCharCode(0xFFFD), 'g');

    public model: ViewModel;
    public logs: Observable<OutputMessage>;
    public path: string;
    public index: number;
    public temporary: boolean = false;
    private _solutionDisposable = new CompositeDisposable();
    private _currentEditor: IOmnisharpTextEditor;

    public get disposable() { return this._solutionDisposable; }

    private repository: Atom.GitRepository;
    public get isDisposed() { return this._solutionDisposable.isDisposed; }

    private _isFolderPerFile = false;
    public get isFolderPerFile() { return this._isFolderPerFile; }
    public set isFolderPerFile(value) { this._isFolderPerFile = value; }

    public constructor(options: Partial<ISolutionOptions>) {
        super(defaults(options, { runtime: Runtime.ClrOrMono }));
        this._configureSolution();
        this.temporary = options.temporary;
        this.model = new ViewModel(this);
        this.path = options.projectPath;
        this.index = options.index;
        this.repository = options.repository;
        this._setupRepository();
        this._solutionDisposable.add(this.model);

        this.registerFixup((action: string, request: any, opts?: RequestOptions) => this._fixupRequest(action, request));
    }

    public connect() {
        if (this.isDisposed) { return; }
        if (this.currentState >= DriverState.Downloading && this.currentState <= DriverState.Connected) { return; }
        super.connect();

        this.log('Starting OmniSharp server (pid:' + this.id + ')');
        this.log('OmniSharp Location: ' + this.serverPath);
        this.log('Change the location that OmniSharp is loaded from by setting the OMNISHARP environment variable');
        this.log('OmniSharp Path: ' + this.projectPath);
    }

    public disconnect() {
        super.disconnect();

        this.log('Omnisharp server stopped.');
    }

    public dispose() {
        super.dispose();
        this._solutionDisposable.dispose();
    }

    public withEditor(editor: IOmnisharpTextEditor) {
        this._currentEditor = editor;
        return this;
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
        if (tempR && endsWith(tempR.FileName, '.json')) {
            tempR.Buffer = null;
            tempR.Changes = null;
        }

        return <any>super.request<TRequest, TResponse>(action, request, options);
    }

    public whenConnected() {
        return this.state.startWith(this.currentState)
            .filter(x => x === DriverState.Connected)
            .take(1);
    }

    private _setupRepository() {
        if (this.repository) {
            const branchSubject = new Subject<string>();

            this._solutionDisposable.add(branchSubject
                .distinctUntilChanged()
                .subscribe(() => atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:restart-server')));

            this._solutionDisposable.add(this.repository.onDidChangeStatuses(() => {
                branchSubject.next((<any>this.repository).branch);
            }));
        }
    }

    private _configureSolution() {
        this.logs = this.events.map(event => ({
            message: event.Body && event.Body.Message || event.Event || '',
            logLevel: event.Body && event.Body.LogLevel || (event.Type === 'error' && 'ERROR') || 'INFORMATION'
        }));

        this._solutionDisposable.add(this.errors.subscribe(exception => {
            console.error(exception);
        }));

        this._solutionDisposable.add(this.responses.subscribe(data => {
            if (atom.config.get('omnisharp-atom.developerMode')) {
                console.log('omni:' + data.command, data.request, data.response);
            }
        }));
    }

    private _fixupRequest<TRequest, TResponse>(action: string, request: TRequest) {
        // Only send changes for requests that really need them.
        if (this._currentEditor && isObject(request)) {
            const editor = this._currentEditor;
            const marker = editor.getCursorBufferPosition();
            let computedChanges: Models.LinePositionSpanTextChange[] = null;
            if (!some(['/goto', '/navigate', '/find', '/package'], x => startsWith(action, x))) {
                computedChanges = editor.omnisharp.popChanges();
            }

            defaults(request, { Column: marker.column, Line: marker.row, FileName: editor.getURI(), Changes: computedChanges });
        }

        /* tslint:disable:no-string-literal */
        if (request['Buffer']) {
            request['Buffer'] = request['Buffer'].replace(Solution._regex, '');
        }
        /* tslint:enable:no-string-literal */
    }
}
