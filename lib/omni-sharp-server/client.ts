import _ = require('lodash');
import {Observable} from 'rx';
import {OmnisharpClientV2 as OmnisharpClient, DriverState, OmnisharpClientOptions} from "omnisharp-client";

interface ClientOptions extends OmnisharpClientOptions {
    temporary: boolean;
}

import {ViewModel} from "./view-model";

class Client extends OmnisharpClient {
    public model: ViewModel;
    public logs: Observable<OmniSharp.OutputMessage>;
    public path: string;
    public index: number;
    public temporary: boolean = false;

    constructor(options: ClientOptions) {
        super(options);
        this.configureClient();
        this.temporary = options.temporary;
        this.model = new ViewModel(this);
        this.path = options.projectPath;
        this.index = options['index'];
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

    public getEditorContext(editor: Atom.TextEditor): OmniSharp.Models.Request {
        editor = editor || atom.workspace.getActiveTextEditor();
        if (!editor) {
            return;
        }
        var marker = editor.getCursorBufferPosition();
        var buffer = editor.getBuffer().getLines().join('\n');
        return {
            Column: marker.column,
            FileName: editor.getURI(),
            Line: marker.row,
            Buffer: buffer
        };
    }

    public makeRequest(editor?: Atom.TextEditor, buffer?: TextBuffer.TextBuffer) {
        editor = editor || atom.workspace.getActiveTextEditor();
        // TODO: update and add to typings.
        if (_.has(editor, 'alive') && !editor.alive) {
            return <OmniSharp.Models.Request>{ abort: true };
        }
        buffer = buffer || editor.getBuffer();

        var bufferText = buffer.getLines().join('\n');

        var marker = editor.getCursorBufferPosition();
        return <OmniSharp.Models.Request>{
            Column: marker.column,
            FileName: editor.getURI(),
            Line: marker.row,
            Buffer: bufferText
        };
    }

    public makeDataRequest<T>(data: T, editor?: Atom.TextEditor, buffer?: TextBuffer.TextBuffer) {
        return <T>_.extend(data, this.makeRequest(editor, buffer));
    }

    private configureClient() {
        this.logs = this.events.map(event => ({
            message: event.Body && event.Body.Message || event.Event || '',
            logLevel: event.Body && event.Body.LogLevel || (event.Type === "error" && 'ERROR') || 'INFORMATION'
        }));

        this.errors.subscribe(exception => {
            console.error(exception);
        });

        this.responses.subscribe(data => {
            if (atom.config.get('omnisharp-atom.developerMode')) {
                console.log("omni:" + data.command, data.request, data.response);
            }
        });
    }

    public request<TRequest, TResponse>(action: string, request?: TRequest, options?: OmniSharp.RequestOptions): Rx.Observable<TResponse> {
        // Custom property that we set inside make request if the editor is no longer active.
        if (request['abort']) {
            return Observable.empty<TResponse>();
        }
        return OmnisharpClient.prototype.request.call(this, action, request, options);
    }
}

export = Client;

// Hack to workaround issue with ts.transpile not working correctly
(function(Client: any) {
    Client.connect = Client.prototype.connect;
    Client.disconnect = Client.prototype.disconnect;
})(OmnisharpClient);
