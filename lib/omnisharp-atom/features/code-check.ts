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
            client.state
                .where(z => z === omnisharp.DriverState.Connected)
                .subscribe(state => {
                    var request = <OmniSharp.Models.Request>{
                        FileName: null
                    };
                    client.codecheck(request);
                });
        });

    }

    public doCodeCheck(editor: Atom.TextEditor) {
        _.debounce(() => {
            Omni.request(editor, client => {
                var request = <OmniSharp.Models.FormatRangeRequest>client.makeRequest(editor);
                return client.updatebufferPromise(request)
                    .then(() => {
                        request.FileName = null;
                        Omni.request(editor, client => client.codecheck(request));
                    });
            });
        }, 500)();
    }
}

export = CodeCheck;
