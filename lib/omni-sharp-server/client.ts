import _ = require('lodash');
import {Observable} from 'rx';
import {OmnisharpClient, DriverState, OmnisharpClientOptions} from "omnisharp-client";

class Client extends  OmnisharpClient {
    constructor(options: OmnisharpClientOptions) {
        super(options);
        this.configureClient();
    }

    public toggle() {
        if (this.currentState === DriverState.Disconnected) {
            var path = atom && atom.project && atom.project.getPaths()[0];
            this.connect({
                projectPath: path
            });
            atom.emitter.emit("omni-sharp-server:start", { pid: this.id, path: this.projectPath, exePath: this.serverPath});
        } else {
            this.disconnect();
            atom.emitter.emit("omni-sharp-server:stop");
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
        this.events.subscribe(event => {

            if (event.Type === "error") {
                atom.emitter.emit("omni-sharp-server:err", {
                    message: event.Body && event.Body.Message || event.Event || '',
                    logLevel: event.Body && event.Body.LogLevel || 'ERROR'
                });
            } else {
                atom.emitter.emit("omni-sharp-server:out", {
                    message: event.Body && event.Body.Message || event.Event || '',
                    logLevel: event.Body && event.Body.LogLevel || 'INFORMATION'
                });
            }
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
        return omnisharp.OmnisharpClient.prototype.request.call(this, action, request);
    }
}

export = Client;
