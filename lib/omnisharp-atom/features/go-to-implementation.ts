import OmniSharpServer = require('../../omni-sharp-server/omni-sharp-server')
import Omni = require('../../omni-sharp-server/omni')

class GoToImplementation {
  private disposable: { dispose: () => void; }
  private navigateToWord: string;
  //private atomSharper;

  public goToImplementation(atomSharpers) {
    //atomSharper = atomSharpers;
    var ref;
    if (OmniSharpServer.vm.isReady) {
        this.navigateToWord = (ref = atom.workspace.getActiveTextEditor()) != null ? ref.getWordUnderCursor() : void 0;
        return Omni.goToImplementation();
    }
  }

  public activate() {
    var goToImpl;
    goToImpl = this.goToImplementation;

    this.disposable = atom.workspace.observeTextEditors((editor) => {
      // editor .on was depricated...   Is this needed?
      return atom.emitter.on("symbols-view:go-to-implementation", () => {
        return goToImpl();
      });
    });

    atom.commands.add("atom-text-editor", "omnisharp-atom:go-to-implementation", () => {
        return goToImpl();
    });

    atom.emitter.on("omni:navigate-to", (position) => {
      
  }
/*




      atom.on "omni:navigate-to-implementation", (quickFixes) =>
        if quickFixes.QuickFixes.length is 1
          position =
            FileName: quickFixes.QuickFixes[0].FileName
            Line: quickFixes.QuickFixes[0].Line
            Column: quickFixes.QuickFixes[0].Column

          atom.emit "omni:navigate-to", position

        else
          atom.emit "omni:find-usages", quickFixes
          @atomSharper.outputView.selectPane "find"

    deactivate: =>
        @disposable.dispose()
        */
        public deactivate() {
            this.disposable.dispose()
          }
}
export = GoToImplementation
