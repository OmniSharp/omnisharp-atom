import _ = require('lodash')
import omnisharp = require("omnisharp-node-client");

class Client extends omnisharp.OmnisharpClient {
    constructor(options: omnisharp.OmnisharpClientOptions) {
        super(options);
        this.configureClient();
    }

    public vm: OmniSharp.vm = {
        isNotLoading: true,
        isLoading: false,
        isOff: true,
        isNotOff: false,
        isOn: false,
        isNotReady: true,
        isReady: false,
        isNotError: true,
        isError: false,
        isLoadingOrReady: false,
        iconText: "",
        isOpen: false
    }

    public toggle() {
        if (this.currentState === omnisharp.DriverState.Disconnected) {
            var path = atom && atom.project && atom.project.getPaths()[0];
            this.connect({
                projectPath: path
            });
            atom.emitter.emit("omni-sharp-server:start", this.id);
        } else {
            this.disconnect();
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

    public navigateTo(response: { FileName: string; Line: number; Column: number; }) {
        atom.workspace.open(response.FileName, undefined)
            .then((editor) => {
                editor.setCursorBufferPosition([response.Line && response.Line - 1, response.Column && response.Column - 1])
            });
    }

    private configureClient() {
        this.events.subscribe(event => {
            atom.emitter.emit("omni-sharp-server:out", event.Body && event.Body.Message || event.Event || '');

            if (event.Type === "error") {
                atom.emitter.emit("omni-sharp-server:err", event.Body && event.Body.Message || event.Event || '');
            }
        });

        this.state.subscribe(state => {
            if (state == omnisharp.DriverState.Connected) {
                atom.emitter.emit("omni-sharp-server:ready", this.id);
            } else if (state == omnisharp.DriverState.Disconnected) {
                atom.emitter.emit("omni-sharp-server:close", "closing server");
            }
        });

        this.errors.subscribe(exception => {
            console.error(exception);
        });

        this.responses.subscribe(data => {
            console.log("omni:" + event, data);
        });

        this.state.subscribe(state => {
            this.vm.isLoading = state === omnisharp.DriverState.Connecting;
            this.vm.isNotLoading = !this.vm.isLoading;
            this.vm.isOff = state === omnisharp.DriverState.Disconnected;
            this.vm.isNotOff = !this.vm.isOff;
            this.vm.isOn = state === omnisharp.DriverState.Connecting || state === omnisharp.DriverState.Connected;
            this.vm.isReady = state === omnisharp.DriverState.Connected;
            this.vm.isNotReady = !this.vm.isReady
            this.vm.isNotError = !this.vm.isError;
            this.vm.isLoadingOrReady = this.vm.isLoading || this.vm.isReady;
            this.vm.iconText = this.vm.isError ? "omni error occured" : "";
        });
    }


}

export = Client;
