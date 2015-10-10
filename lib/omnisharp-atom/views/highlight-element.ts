import {getTemporaryGrammar, ExcludeClassifications} from "../features/highlight";
import * as _ from "lodash";
import Omni = require("../../omni-sharp-server/omni");
import {Observable, Subject} from "rx";
import {write} from "fastdom";

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
    public editorElement: any;
    public editor: Atom.TextEditor;

    private _grammar: FirstMate.Grammar;
    private _usage: OmniSharp.Models.DiagnosticLocation;
    private _whitespace: number;

    public createdCallback() {
        var preview = this.innerText;
        this.innerText = "";
    }

    // API
    public attachedCallback() {
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

        var grammars = atom.grammars.getGrammars();
        var grammar = this._grammar = _.find(grammars, grammar => _.any((<any>grammar).fileTypes, ft => _.endsWith(this.usage.FileName, `.${ft}`)));

        var text = this.usage.Text;
        var whitespace = this._whitespace = text.length - _.trimLeft(text).length;

        this.editor.setGrammar(<any>grammar);
        this.editor.setText(_.trimLeft(text));

        var marker = this.editor.markBufferRange([[0, +this.usage.Column - whitespace], [+this.usage.EndLine - +this.usage.Line, +this.usage.EndColumn - whitespace]]);
        this.editor.decorateMarker(marker, { type: 'highlight', class: 'findusages-underline' });

        this.appendChild(this.editorElement);
    }

    public detachedCallback() {
        this.editor.destroy();
    }

    public get usage() {
        return this._usage;
    }

    public set usage(value) {
        if (!this._usage) {
            this._usage = value;
        }
    }

    private _checked = false;
    public enableSemanticHighlighting() {
        if (!this._checked && atom.config.get<boolean>('omnisharp-atom.enhancedHighlighting')) {
            var text = this.usage.Text;

            request({ filePath: this.usage.FileName, startLine: +this.usage.Line, endLine: +this.usage.EndLine, whitespace: this._whitespace })
                .subscribe(response => {
                    var start = +this.usage.Line;
                    this._grammar = getTemporaryGrammar(this.editor, this._grammar);
                    (<any>this._grammar).setResponses(response);
                    this.editor.setGrammar(<any>this._grammar);
                });
        }
        this._checked = true;
    }
}

(<any>exports).HighlightElement = (<any>document).registerElement('omnisharp-highlight', { prototype: HighlightElement.prototype });
