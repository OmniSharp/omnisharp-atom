import OmniSharpServer = require('../../omni-sharp-server/omni-sharp-server')
import Omni = require('../../omni-sharp-server/omni')
import OmniSharpAtom = require('../omnisharp-atom')

class GoToImplementation {
  private disposable: { dispose: () => void; }
  private navigateToWord: string;
  private atomSharper: typeof OmniSharpAtom;

  constructor(atomSharper: typeof OmniSharpAtom) {
      this.atomSharper = atomSharper;
  }

  public goToImplementation() {
    var ref;
    if (OmniSharpServer.vm.isReady) {
        this.navigateToWord = (ref = atom.workspace.getActiveTextEditor()) != null ? ref.getWordUnderCursor() : void 0;
        return Omni.goToImplementation();
    }
  }

  public activate() {
    var goToImpl;
    goToImpl = this.goToImplementation;

    this.disposable = atom.workspace.observeTextEditors((editor) => { });

    atom.commands.add("atom-text-editor", "omnisharp-atom:go-to-implementation", () => {
        return goToImpl();
    });

    atom.emitter.on("omni:navigate-to-implementation", (quickFixes) => {
      if (quickFixes.QuickFixes.length == 1) {
        return atom.emitter.emit("omni:navigate-to", quickFixes.QuickFixes[0]);
      } else {
        atom.emitter.emit("omni:find-usages", quickFixes);
        return this.atomSharper.outputView.selectPane("find");
      }
    });
  }

  public deactivate() {
    this.disposable.dispose()
  }
}
export = GoToImplementation
