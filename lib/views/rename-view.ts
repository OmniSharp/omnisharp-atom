import * as spacePenViews from "atom-space-pen-views";
import {Omni} from "../server/omni";

export class RenameView extends spacePenViews.View {
    public static content() {
        return this.div({
            "class": "rename overlay from-top"
        }, () => {
            this.p({
                outlet: "message",
                "class": "icon icon-diff-renamed"
            }, "Rename to:");
            return this.subview("miniEditor",
                new spacePenViews.TextEditorView({
                    mini: true
                }));
        });
    }

    public miniEditor: spacePenViews.TextEditorView;

    public initialize() {
        atom.commands.add(this[0], "core:confirm", () => this.rename());
        atom.commands.add(this[0], "core:cancel", () => this.destroy());
    }

    public configure(wordToRename: string) {
        this.miniEditor.setText(wordToRename);
        return this.miniEditor.focus();
    }

    public rename() {
        Omni.request(solution => solution.rename({
            RenameTo: this.miniEditor.getText(),
            WantsTextChanges: true
        }));
        return this.destroy();
    }

    public destroy() {
        this.miniEditor.setText("");
        return this.detach();
    }
}
