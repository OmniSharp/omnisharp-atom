import {getTemporaryGrammar, ExcludeClassifications} from "../features/highlight";
import * as _ from "lodash";
import Omni = require("../../omni-sharp-server/omni");
import {Observable, Subject} from "rx";

const customExcludes = ExcludeClassifications.concat([
    OmniSharp.Models.HighlightClassification.Identifier,
    OmniSharp.Models.HighlightClassification.PreprocessorKeyword,
    OmniSharp.Models.HighlightClassification.ExcludedCode,
]);

function request(request: {
    filePath: string;
    startLine: number;
    endLine: number;
    whitespace: number;
}) {
    return Omni.request(client => client.highlight({
        Buffer: null,
        FileName: request.filePath,
        Lines: _.range(request.startLine, request.endLine),
        ExcludeClassifications: customExcludes
    }, { silent: true }))
        .map(response => _(response.Highlights)
            //.filter(x => x.StartLine >= request.startLine && x.EndLine <= request.endLine)
            .map(x => ({
                StartLine: x.StartLine - request.startLine,
                StartColumn: (x.StartLine === request.startLine ? x.StartColumn - request.whitespace : x.StartColumn),
                EndLine: x.EndLine - request.startLine,
                EndColumn: (x.StartLine === request.startLine ? x.EndColumn - request.whitespace : x.EndColumn),
                Kind: x.Kind,
                Projects: x.Projects
            }))
            .value())
        .where(x => x.length > 0);
}

export class HighlightElement extends HTMLElement {
    public editorElement: Atom.TextEditorComponent;
    public editor: Atom.TextEditor;

    public createdCallback() {
        var preview = this.innerText;
        this.innerText = "";

        // Based on markdown editor
        // https://github.com/atom/markdown-preview/blob/2bcbadac3980f1aeb455f7078bd1fdfb4e6fe6b1/lib/renderer.coffee#L111
        var editorElement = this.editorElement = <any>document.createElement('atom-text-editor');
        editorElement.setAttributeNode(document.createAttribute('gutter-hidden'));
        editorElement.removeAttribute('tabindex'); // make read-only

        var editor = this.editor = (<any>editorElement).getModel();
        editor.getDecorations({ class: 'cursor-line', type: 'line' })[0].destroy(); // remove the default selection of a line in each editor
        editor.setText(preview);
        editor.setSoftWrapped(true);

        this.appendChild(editorElement);
    }

    // API
    public attachedCallback() {
        var grammars = atom.grammars.getGrammars();
        var grammar = this._grammar = _.find(grammars, grammar => _.any((<any>grammar).fileTypes, ft => _.endsWith(this.dataset['filePath'], `.${ft}`)));

        var text = this.dataset['lineText'];
        var whitespace = text.length - _.trimLeft(text).length;
        this.selected = this.dataset['selected'] === "true";

        this.editor.setGrammar(<any>grammar);
        this.editor.setText(_.trimLeft(text));

        var marker = this.editor.markBufferRange([[0, +this.dataset['startColumn'] - whitespace], [+this.dataset['endLine'] - +this.dataset['startLine'], +this.dataset['endColumn'] - whitespace]]);
        this.editor.decorateMarker(marker, { type: 'highlight', class: 'findusages-underline' });
    }

    public detachedCallback() {
        this.editor.destroy();
    }

    private _grammar: FirstMate.Grammar;
    private _grammarConfigured = false;

    private _selected: boolean;
    public get selected() {
        return this._selected;
    }

    public set selected(value) {
        if (value && !this._grammarConfigured) {
            this._grammarConfigured = true;
            if (atom.config.get<boolean>('omnisharp-atom.enhancedHighlighting')) {
                var text = this.dataset['lineText'];
                var whitespace = text.length - _.trimLeft(text).length;
                request({ filePath: this.dataset['filePath'], startLine: +this.dataset['startLine'], endLine: +this.dataset['endLine'], whitespace: whitespace })
                    .subscribe(response => {
                        var start = +this.dataset['startLine'];
                        this._grammar = getTemporaryGrammar(this.editor, this._grammar);
                        (<any>this._grammar).setResponses(response);
                        this.editor.setGrammar(<any>this._grammar);
                    });
                this.editor.setGrammar(<any>this._grammar);
            }
        }
        this._selected = value;
    }

    public attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === "data-selected" && oldVal !== newVal) {
            this.selected = newVal === "true";
        }
    }
}

(<any>exports).HighlightElement = (<any>document).registerElement('omnisharp-highlight-element', { prototype: HighlightElement.prototype });
