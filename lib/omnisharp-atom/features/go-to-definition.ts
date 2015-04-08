import OmniSharpServer = require('../../omni-sharp-server/omni-sharp-server')
import Omni = require('../../omni-sharp-server/omni')

class GoToDefinition {
    private disposable: { dispose: () => void; };
    private navigateToWord: string;

    public goToDefinition() {
        var ref;
        if (OmniSharpServer.vm.isReady) {
            this.navigateToWord = (ref = atom.workspace.getActiveTextEditor()) != null ? ref.getWordUnderCursor() : void 0;
            return Omni.goToDefinition();
        }
    }

    public activate() {
        var goToDef;
        goToDef = this.goToDefinition;
        this.disposable = atom.workspace.observeTextEditors((editor) => {
            return editor.on("symbols-view:go-to-declaration", () => {
                return goToDef();
            });
        });
        atom.commands.add("atom-text-editor", "omnisharp-atom:go-to-definition", () => {
            return goToDef();
        });
        return atom.on("omni:navigate-to", (position) => {
            if (position.FileName != null) {
                atom.workspace.open(position.FileName, undefined)
                    .then((editor) => { editor.setCursorBufferPosition([position.Line && position.Line - 1, position.Column && position.Column - 1])});
            } else {
                atom.emit("omnisharp-atom:error", "Can't navigate to '" + this.navigateToWord + "'");
            }
        });
    }

    public deactivate() {
        this.disposable.dispose()
    }
}
export = GoToDefinition;
