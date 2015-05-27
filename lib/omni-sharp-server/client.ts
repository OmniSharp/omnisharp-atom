import _ = require('lodash');
import {Observable} from 'rx';
import {OmnisharpClient, DriverState, OmnisharpClientOptions} from "omnisharp-client";

class Client extends OmnisharpClient {
    public uniqueId = _.uniqueId("client");
    public output: OmniSharp.OutputMessage[] = [];
    public logs: Observable<OmniSharp.OutputMessage>;

    constructor(public path: string, options: OmnisharpClientOptions) {
        super(options);
        this.configureClient();
    }

    public get isOff() { return this.currentState === DriverState.Disconnected; }
    public get isConnecting() { return this.currentState === DriverState.Connecting; }
    public get isOn() { return this.currentState === DriverState.Connecting || this.currentState === DriverState.Connected; }
    public get isReady() { return this.currentState === DriverState.Connected; }
    public get isError() { return this.currentState === DriverState.Error; }

    public toggle() {
        if (this.currentState === DriverState.Disconnected) {
            var path = atom && atom.project && atom.project.getPaths()[0];
            this.connect({
                projectPath: path
            });

            this.log("Starting OmniSharp server (pid:" + this.id + ")");
            this.log("OmniSharp Location: " + this.serverPath);
            this.log("Change the location that OmniSharp is loaded from by setting the OMNISHARP environment variable");
            this.log("OmniSharp Path: " + this.projectPath);
        } else {
            this.disconnect();
            this.log("Omnisharp server stopped.");
        }
    }

    public getEditorContext(editor: Atom.TextEditor): OmniSharp.Models.Request {
        editor = editor || atom.workspace.getActiveTextEditor();
        if (!editor) {
            return;
        }
        var marker = editor.getCursorBufferPosition();
        var buffer = editor.getBuffer().getLines().join('\n');
        return {
            Column: marker.column + 1,
            FileName: editor.getURI(),
            Line: marker.row + 1,
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
            Column: marker.column + 1,
            FileName: editor.getURI(),
            Line: marker.row + 1,
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

        this.logs.subscribe(event => {
            this.output.push(event);
            if (this.output.length > 1000)
                this.output.shift();
        });

        this.errors.subscribe(exception => {
            console.error(exception);
        });

        this.responses.subscribe(data => {
            if (atom.config.get('omnisharp-atom.developerMode')) {
                console.log("omni:" + data.command, data.request, data.response);
            }
        });
    }

    public request<TRequest, TResponse>(action: string, request?: TRequest): Rx.Observable<TResponse> {
        // Custom property that we set inside make request if the editor is no longer active.
        if (request['abort']) {
            return Observable.empty<TResponse>();
        }
        return OmnisharpClient.prototype.request.call(this, action, request);
    }
}

export = Client;
