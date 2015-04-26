import OmniSharpServer = require('../../omni-sharp-server/omni-sharp-server')
import Omni = require('../../omni-sharp-server/omni')

class GoToDefinition {
    private disposable: { dispose: () => void; };

    public goToDefinition() {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            var req : any = Omni.makeRequest();
            req.word = <any>editor.getWordUnderCursor();

            Omni.client.gotodefinitionPromise(Omni.makeRequest());
        }
    }

    public activate() {
        this.disposable = atom.workspace.observeTextEditors((editor) => {
            return atom.emitter.on("symbols-view:go-to-declaration", () => {
                return this.goToDefinition();
            });
        });
        atom.commands.add("atom-text-editor", "omnisharp-atom:go-to-definition", () => {
            return this.goToDefinition();
        });

        Omni.client.observeGotodefinition.subscribe((data) => {
            if (data.response.FileName != null) {
                Omni.navigateTo(data.response);
            } else {
                var word = (<any>data.request).word;
                atom.emitter.emit("omnisharp-atom:error",
                    "Can't navigate to '" + word + "'");
            }
        });
    }

    public deactivate() {
        this.disposable.dispose()
    }
}
export = GoToDefinition;
