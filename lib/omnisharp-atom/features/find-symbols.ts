import Omni = require('../../omni-sharp-server/omni')
import OmniSharpAtom = require('../omnisharp-atom')
import FindSymbolsView = require('../views/find-symbols-view');

class FindSymbols {

    private view : FindSymbolsView;
    private editor : Atom.TextEditor;

    public activate() {
        OmniSharpAtom.addCommand('omnisharp-atom:find-symbols', () => {
            this.view = new FindSymbolsView();

        });

        Omni.registerConfiguration(client => {
            client.observeFindsymbols.subscribe((data) => {
                this.view.addToList(data.response.QuickFixes);
            });
        });
    }
}

export = FindSymbols;
