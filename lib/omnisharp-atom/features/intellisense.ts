import {CompositeDisposable} from "rx";
import {delay} from "lodash";
import {Omni} from "../../omni-sharp-server/omni";

class Intellisense implements IFeature {
    private disposable: Rx.CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:intellisense-dot",
            (event) => {
                this.complete(event, ".");
                delay(() => atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), "autocomplete-plus:activate"), 100);
            }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:intellisense-space",
            (event) => this.complete(event, " ")));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:intellisense-semicolon",
            (event) => this.complete(event, ";")));
    }

    public dispose() {
        this.disposable.dispose();
    }

    private complete(event: Event, char: string) {
        const editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            atom.commands.dispatch(atom.views.getView(editor), "autocomplete-plus:confirm");
            editor.insertText(char);

            event.preventDefault();
            event.stopImmediatePropagation();
            event.stopPropagation();
            return false;
        }
    }

    public required = true;
    public title = "Intellisense";
    public description = "Augments some of the issues with Atoms autocomplete-plus package";
}
export const intellisense = new Intellisense;
