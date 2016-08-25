import {CompositeDisposable} from "ts-disposables";
import {Omni} from "../server/omni";
import {FindSymbolsView} from "../views/find-symbols-view";

class FindSymbols implements IFeature {
    private disposable: CompositeDisposable;
    private view: FindSymbolsView;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:find-symbols", () => {
            this.view = new FindSymbolsView();
        }));

        this.disposable.add(Omni.listener.findsymbols.subscribe((data) => {
            this.view.addToList(data.response.QuickFixes);
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = "Find Symbols";
    public description = "Adds commands to find symbols through the UI.";
}

export const findSymbols = new FindSymbols;
