import {CompositeDisposable} from "ts-disposables";
import {Omni} from "../server/omni";
import {defer} from "lodash";

class Intellisense implements IFeature {
    private disposable: CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            cd.add(editor.onWillInsertText(event => {
                if (event.text.length > 1) return;

                if (event.text === ";" || event.text === ".") {
                    atom.commands.dispatch(atom.views.getView(editor), "autocomplete-plus:confirm");
                }
            }));

            cd.add(editor.onDidInsertText(event => {
                if (event.text.length > 1) return;

                if (event.text === ".") {
                    defer(() => atom.commands.dispatch(atom.views.getView(editor), "autocomplete-plus:activate"));
                }
            }));
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = false;
    public default = true;
    public title = "Intellisense";
    public description = "Augments some of the issues with Atoms autocomplete-plus package";
}
export const intellisense = new Intellisense;
