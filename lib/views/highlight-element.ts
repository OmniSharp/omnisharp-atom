import {Models} from "omnisharp-client";
import {EditorElement} from "./text-editor-pool";

export class HighlightElement extends HTMLElement implements WebComponent {
    private _editor: EditorElement;

    public createdCallback() {
        this._editor = new EditorElement;
    }

    public attachedCallback() {
        this.appendChild(this._editor);
    }

    public detachedCallback() {
        this.removeChild(this._editor);
    }

    public revert() {
        this._editor.revert();
    }

    public enhance() {
        this._editor.enhance();
    }

    public set usage(usage: Models.QuickFix) {
        this._editor.usage = usage;
    }
}

(<any>exports).HighlightElement = (<any>document).registerElement("omnisharp-highlight-element", { prototype: HighlightElement.prototype });
