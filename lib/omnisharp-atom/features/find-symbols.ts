import Omni = require('../../omni-sharp-server/omni')
import ClientManager = require('../../omni-sharp-server/client-manager');
import OmniSharpAtom = require('../omnisharp-atom')
import SpacePen = require('atom-space-pen-views');
import FindSymbolsView = require('../views/find-symbols-view');

interface TemporaryCodeAction {
    Name : string;
    Id: number;
}


class FindSymbols {

    private view : FindSymbolsView;
    private editor : Atom.TextEditor;

    constructor(private atomSharper: typeof OmniSharpAtom) {
        this.atomSharper = atomSharper;
    }

    public activate() {
        this.atomSharper.addCommand("omnisharp-atom:find-symbols", () => {
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
