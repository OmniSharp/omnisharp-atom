import _ = require('lodash');
import ClientManager = require('../../omni-sharp-server/client-manager');
import omnisharp = require("omnisharp-client");
import OmniSharpAtom = require('../omnisharp-atom');

class CodeCheck {
    constructor(private atomSharper: typeof OmniSharpAtom) {
        this.atomSharper = atomSharper;
    }

    public activate() {

        this.atomSharper.onEditor((editor: Atom.TextEditor) => {

            editor.getBuffer().onDidStopChanging(() => this.doCodeCheck(editor));
            editor.getBuffer().onDidSave(() => this.doCodeCheck(editor));
            editor.getBuffer().onDidDelete(() => this.doCodeCheck(editor));
            editor.getBuffer().onDidReload(() => this.doCodeCheck(editor));

        });

        ClientManager.registerConfiguration(client => {
            client.state.subscribe(state => {
                if (state === omnisharp.DriverState.Connected)
                    this.doCodeCheck(null);
            });
        });

    }

    public doCodeCheck(editor: Atom.TextEditor) {
        var client = ClientManager.getClientForEditor(editor);
        if (client && client.currentState === omnisharp.DriverState.Connected) {
            _.debounce(() => {
                var request = <OmniSharp.Models.FormatRangeRequest>client.makeRequest(editor);
                client.updatebufferPromise(request)
                    .then(() => {
                    request.FileName = null;
                    client.codecheck(request);
                });
            }, 500)();
        }
    }
}

export = CodeCheck;
