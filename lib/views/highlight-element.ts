export class HighlightElement extends HTMLElement {
    public editorElement: Atom.TextEditorComponent;
    public editor: Atom.TextEditor;

    public createdCallback() {
        const preview = this.innerText;
        this.innerText = "";

        // Based on markdown editor
        // https://github.com/atom/markdown-preview/blob/2bcbadac3980f1aeb455f7078bd1fdfb4e6fe6b1/lib/renderer.coffee#L111
        const editorElement = this.editorElement = <any>document.createElement("atom-text-editor");
        editorElement.setAttributeNode(document.createAttribute("gutter-hidden"));
        editorElement.removeAttribute("tabindex"); // make read-only

        const editor = this.editor = (<any>editorElement).getModel();
        editor.getDecorations({ class: "cursor-line", type: "line" })[0].destroy(); // remove the default selection of a line in each editor
        editor.setText(preview);

        const grammar = atom.grammars.grammarForScopeName("source.cs");
        editor.setGrammar(grammar);
        editor.setSoftWrapped(true);

        this.appendChild(editorElement);
    }

    // API
    public text(text: string) {
        this.editor.setText(text);
    }
}

(<any>exports).HighlightElement = (<any>document).registerElement("omnisharp-highlight-element", { prototype: HighlightElement.prototype });
