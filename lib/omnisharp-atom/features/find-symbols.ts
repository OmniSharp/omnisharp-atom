import {CompositeDisposable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import FindSymbolsView = require('../views/find-symbols-view');

class FindSymbols implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private view: FindSymbolsView;
    private editor: Atom.TextEditor;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:find-symbols', () => {
            this.view = new FindSymbolsView();
        }));

        this.disposable.add(Omni.listener.observeFindsymbols.subscribe((data) => {
            this.view.addToList(data.response.QuickFixes);
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }
}

export var findSymbols = new FindSymbols;
