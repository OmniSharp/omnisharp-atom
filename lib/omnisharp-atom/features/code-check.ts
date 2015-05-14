import _ = require('lodash');
import Omni = require('../../omni-sharp-server/omni');
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

        Omni.registerConfiguration(client => {
            client.state.subscribe(state => {
                if (state === omnisharp.DriverState.Connected)
                    this.doCodeCheck(null);
            });
        });

    }

    public doCodeCheck(editor: Atom.TextEditor) {
        if (Omni.client === undefined || Omni.client.currentState !== omnisharp.DriverState.Connected) return;
        _.debounce(() => {
            var request = <OmniSharp.Models.FormatRangeRequest>Omni.makeRequest(editor);
            Omni.client.updatebufferPromise(request)
                .then(() => {
                request.FileName = null;
                Omni.client.codecheck(request);
            });
        }, 500)();
    }
}

export = CodeCheck;
