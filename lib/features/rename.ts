import _ from "lodash";
import {CompositeDisposable} from "omnisharp-client";
import {RenameView} from "../views/rename-view";
import {Omni} from "../server/omni";
import {applyAllChanges} from "../services/apply-changes";

class Rename implements IFeature {
    private disposable: CompositeDisposable;
    private renameView: RenameView;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.renameView = new RenameView();
        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:rename", (e) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            this.rename();
        }));

        this.disposable.add(Omni.listener.rename.subscribe((data) => {
            applyAllChanges(data.response.Changes);
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public rename() {
        const editor = atom.workspace.getActiveTextEditor();
        let wordToRename: string;
        if (editor) {
            wordToRename = <any>editor.getWordUnderCursor();
            // Word under cursor can sometimes return the open bracket if the word is selected.
            wordToRename = _.trimEnd(wordToRename, "(");
            atom.workspace.addTopPanel({
                item: this.renameView
            });
        }
        return this.renameView.configure(wordToRename);
    }

    public required = true;
    public title = "Rename";
    public description = "Adds command to rename symbols.";
}
export const rename = new Rename;
