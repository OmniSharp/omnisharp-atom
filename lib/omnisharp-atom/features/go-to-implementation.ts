import OmniSharpServer = require('../../omni-sharp-server/omni-sharp-server')
import Omni = require('../../omni-sharp-server/omni')
import OmniSharpAtom = require('../omnisharp-atom')

class GoToImplementation {
    private disposable: { dispose: () => void; }
    private atomSharper: typeof OmniSharpAtom;

    constructor(atomSharper: typeof OmniSharpAtom) {
        this.atomSharper = atomSharper;
    }

    public goToImplementation() {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            var req: any = Omni.makeRequest();
            req.word = <any>editor.getWordUnderCursor();

            Omni.client.findimplementationsPromise(Omni.makeRequest());
        }
    }

    public activate() {
        this.disposable = atom.workspace.observeTextEditors((editor) => { });

        atom.commands.add("atom-text-editor", "omnisharp-atom:go-to-implementation", () => {
            return this.goToImplementation();
        });

        Omni.client.observeFindimplementations.subscribe((data) => {
            if (data.response.QuickFixes.length == 1) {
                Omni.navigateTo(data.response.QuickFixes[0]);
            }
        });
    }

    public deactivate() {
        this.disposable.dispose()
    }
}
export = GoToImplementation
