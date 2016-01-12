import {Models} from "omnisharp-client";
import {Observable, Disposable, CompositeDisposable} from "rx";
const _: _.LoDashStatic = require("lodash");
import {getEnhancedGrammar, augmentEditor, ExcludeClassifications} from "../features/highlight";
import {Omni} from "../server/omni";
let fastdom: typeof Fastdom = require("fastdom");

const customExcludes = ExcludeClassifications.concat([
    Models.HighlightClassification.Identifier,
    Models.HighlightClassification.PreprocessorKeyword,
    Models.HighlightClassification.ExcludedCode,
]);

const pool = (function() {
    const NUM_TO_KEEP = 10;
    const POOL: { editor: Atom.TextEditor; element: Atom.TextEditorComponent; }[] = [];

    const cleanupPool = _.throttle(function cleanupPool() {
        if (POOL.length > NUM_TO_KEEP) {
            const len = Math.min(POOL.length - NUM_TO_KEEP, 10);
            let remove = POOL.splice(0, len);
            remove.forEach(x => x.editor.destroy());

            cleanupPool();
        }
    }, 10000, { trailing: true });

    class Result implements Rx.IDisposable {
        private _disposable = Disposable.create(() => {
            const {editor, element} = this;
            (element as any).remove();
            POOL.push({ editor, element });

            editor.setText("");
            const grammar = <any>atom.grammars.grammarForScopeName("source.cs");
            editor.setGrammar(grammar);

            cleanupPool();
        });

        constructor(public editor: Atom.TextEditor, public element: Atom.TextEditorComponent) { }

        public dispose() {
            this._disposable.dispose();
        }
    }

    function populatePool() {
        return Observable.interval(50)
            .take(10)
            .map(() => {
                const editorElement = <any>document.createElement("atom-text-editor");
                editorElement.setAttributeNode(document.createAttribute("gutter-hidden"));
                editorElement.removeAttribute("tabindex"); // make read-only

                const editor = (<any>editorElement).getModel();
                editor.getDecorations({ class: "cursor-line", type: "line" })[0].destroy(); // remove the default selection of a line in each editor

                const grammar = atom.grammars.grammarForScopeName("source.cs");
                editor.setGrammar(grammar);
                editor.setSoftWrapped(true);

                augmentEditor(editor);

                return <Atom.TextEditorComponent>editorElement;
            })
            .tap((element) => POOL.push({ element, editor: (<any>element).getModel() }))
            .toArray();
    }

    setTimeout(() => populatePool(), 10000);

    function request(): Observable<Result> {
        if (POOL.length) {
            const {editor, element} = POOL.pop();

            return Observable.of(new Result(editor, element));
        } else {
            return populatePool().flatMap(() => request());
        }
    }

    return {
        getNext() {
            if (!POOL.length) { return { success: false, result: null }; }
            const {editor, element} = POOL.pop();
            return { success: true, result: new Result(editor, element) };
        },
        request
    };
})();

export class EditorElement extends HTMLSpanElement implements WebComponent {
    private _pre: HTMLPreElement;
    private _disposable: CompositeDisposable;
    private _editorElement: Atom.TextEditorComponent;
    private _editor: Atom.TextEditor;
    private _whitespace: number;

    private _usage: Models.QuickFix;
    public get usage() { return this._usage; }
    public set usage(value) {
        this._editorText = null;
        this._usage = value;

        if (this._pre) {
            this._pre.innerText = _.trimLeft(value.Text);
        }

        if (this._editor) {
            this.setEditorText();
        }
    }

    private _editorText: string;
    public get editorText() { return this._editorText; }
    public set editorText(value) {
        this._usage = null;
        this._editorText = value;

        if (this._pre) {
            this._pre.innerText = _.trimLeft(value);
        }

        if (this._editor) {
            this.setEditorText();
        }
    }

    private _enhanced: boolean;
    public enhance() {
        this.enableSemanticHighlighting();
    }

    private setEditorText() {
        if (this._usage) {
            const grammars = Omni.grammars;
            const grammar = _.find(grammars, g => _.any((<any>g).fileTypes, ft => _.endsWith(this._usage.FileName, `.${ft}`)));

            const text = this._usage.Text;

            const usageLength = this._usage.EndColumn - this._usage.Column;
            let whitespace: number;

            for (let i = this._usage.Column; i > -1; i--) {
                const chunk = text.substr(i, usageLength);
                console.log(chunk);
                // This regex perhaps needs to be improved
                const match = chunk.match(/^((?:@|_|[a-zA-Z])[\w]*)/);
                if (!match) continue;
                console.log(match);

                const value = match[1];
                if (value.length === usageLength) {
                    whitespace = this._whitespace = this._usage.Column - i;
                    break;
                }
            }

            this._editor.setGrammar(<any>grammar);
            this._editor.setText(_.trimLeft(text));

            const marker = this._editor.markBufferRange([[0, +this._usage.Column - whitespace], [+this._usage.EndLine - +this._usage.Line, +this._usage.EndColumn - whitespace]]);
            this._editor.decorateMarker(marker, { type: "highlight", class: "findusages-underline" });
        } else {
            this._editor.setText(_.trim(this._editorText));
        }
    }

    private enableSemanticHighlighting() {
        if (this._usage) {
            if (!this._enhanced && atom.config.get<boolean>("omnisharp-atom.enhancedHighlighting")) {
                request({ filePath: this._usage.FileName, startLine: this._usage.Line, endLine: this._usage.EndLine, whitespace: this._whitespace })
                    .subscribe(response => {
                        const grammar = getEnhancedGrammar(this._editor);
                        (<any>grammar).setResponses(response);
                        this._editor.setGrammar(<any>grammar);
                    });
            }
            this._enhanced = true;
        }
    }

    public attachedCallback() {
        this._disposable = new CompositeDisposable();
        const next = pool.getNext();
        if (next.success) {
            this._disposable.add(next.result);
            this._editorElement = next.result.element;
            this._editor = next.result.editor;
            this.setEditorText();
            this.appendChild(<any>this._editorElement);
        } else {
            this._pre = document.createElement("pre");
            this._pre.innerText = this.editorText;
            this.appendChild(this._pre);

            this._disposable.add(pool.request().subscribe((result) => {
                fastdom.mutate(() => {
                    this.removeChild(this._pre);
                    this._pre = null;

                    this._disposable.add(result);
                    this._editorElement = result.element;
                    this._editor = result.editor;
                    this.setEditorText();
                    this.appendChild(<any>this._editorElement);
                });
            }));
        }

        this.onmouseover = () => this.enhance();
    }

    public detachedCallback() {
        this._disposable.dispose();
        this._enhanced = false;
    }
}

function request({filePath, startLine, endLine, whitespace}: { filePath: string; startLine: number; endLine: number; whitespace: number; }) {
    return Omni.request(client => client.highlight({
        Buffer: null,
        FileName: filePath,
        Lines: _.range(startLine, endLine),
        ExcludeClassifications: customExcludes
    }, { silent: true }))
        .map(response => _(response.Highlights)
            //.filter(x => x.StartLine >= request.startLine && x.EndLine <= request.endLine)
            .map(x => ({
                StartLine: x.StartLine - startLine,
                StartColumn: (x.StartLine === startLine ? x.StartColumn - whitespace : x.StartColumn),
                EndLine: x.EndLine - startLine,
                EndColumn: (x.StartLine === startLine ? x.EndColumn - whitespace : x.EndColumn),
                Kind: x.Kind,
                Projects: x.Projects
            }))
            .value())
        .where(x => x.length > 0);
}

(<any>exports).EditorElement = (<any>document).registerElement("omnisharp-editor-element", { prototype: EditorElement.prototype });
