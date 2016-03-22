import {Models} from "omnisharp-client";
import {Observable} from "rxjs";
import {Disposable, CompositeDisposable, IDisposable} from "omnisharp-client";
import _ from "lodash";
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

    class Result implements IDisposable {
        private _disposable = Disposable.create(() => {
            const {editor, element} = this;
            (element as any).remove();
            POOL.push({ editor, element });

            editor.setGrammar(Omni.grammars[0]);
            editor.setText("");

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
                editor.setGrammar(Omni.grammars[0]);
                editor.setSoftWrapped(true);

                augmentEditor(editor);

                return <Atom.TextEditorComponent>editorElement;
            })
            .do((element) => POOL.push({ element, editor: (<any>element).getModel() }))
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
    private _release: IDisposable;
    private _editorElement: Atom.TextEditorComponent;
    private _editor: Atom.TextEditor;
    private _whitespace: number;
    private _grammar: FirstMate.Grammar;

    private _usage: Models.QuickFix;
    public get usage() { return this._usage; }
    public set usage(value) {
        this._editorText = null;
        this._usage = value;

        this._whitespace = 0;

        const text = this._usage.Text;
        const usageLength = this._usage.EndColumn - this._usage.Column;
        for (let i = this._usage.Column; i > -1; i--) {
            const chunk = text.substr(i);
            console.log(chunk);
            // This regex perhaps needs to be improved
            const match = chunk.match(/^((?:@|_|[a-zA-Z])[\w]*)(?:[\W]|$)/);
            if (!match) continue;
            console.log(match);

            const v = match[1];
            if (v.length === usageLength) {
                this._whitespace = this._usage.Column - i;
                break;
            }
        }

        if (this._pre) {
            this._pre.innerText = _.trimStart(value.Text);
        }

        if (this._editor) {
            this.setEditorText(this._grammar);
        }
    }

    private _editorText: string;
    public get editorText() { return this._editorText; }
    public set editorText(value) {
        this._usage = null;
        this._editorText = value;

        if (this._pre) {
            this._pre.innerText = _.trimStart(value);
        }

        if (this._editor) {
            this.setEditorText(this._grammar);
        }
    }

    private setEditorText(grammar: FirstMate.Grammar) {
        if (this._usage) {
            const text = this._usage.Text;

            (this._editor as any)._setGrammar(<any>grammar);
            this._editor.setText(_.trimStart(text));

            const marker = this._editor.markBufferRange([[0, +this._usage.Column - this._whitespace], [+this._usage.EndLine - +this._usage.Line, +this._usage.EndColumn - this._whitespace]]);
            this._editor.decorateMarker(marker, { type: "highlight", class: "findusages-underline" });
        } else {
            this._editor.setText(_.trim(this._editorText));
        }
    }

    public attachedCallback() {
        this._disposable = new CompositeDisposable();
        if (!this._pre) {
            this._pre = document.createElement("pre");
            this._pre.innerText = this._usage && this._usage.Text || this.editorText;
            this._pre.style.fontSize = `${atom.config.get("editor.fontSize")}px !important`;
        }
        this.appendChild(this._pre);
    }

    public revert() {
        fastdom.mutate(() => this._detachEditor(true));
    }

    private _enhanced: boolean;
    public enhance() {
        if (this._enhanced) return;
        this._enhanced = true;

        const next = pool.getNext();
        if (next.success) {
            if (this._usage && atom.config.get<boolean>("omnisharp-atom.enhancedHighlighting")) {
                let s = request({ filePath: this._usage.FileName, startLine: this._usage.Line, endLine: this._usage.EndLine, whitespace: this._whitespace })
                    .subscribe(response => {
                        const grammar = this._grammar = getEnhancedGrammar(next.result.editor, _.find(Omni.grammars, g => _.some((<any>g).fileTypes, ft => _.endsWith(this._usage.FileName, `.${ft}`))), { readonly: true });
                        (<any>grammar).setResponses(response);
                        fastdom.mutate(() => this._attachEditor(next.result, grammar));
                    });
                this._disposable.add(s);
                return;
            }
            fastdom.mutate(() => this._attachEditor(next.result));
        } else {
            let s = pool.request().subscribe((result) => {
                if (this._usage && atom.config.get<boolean>("omnisharp-atom.enhancedHighlighting")) {
                    let s = request({ filePath: this._usage.FileName, startLine: this._usage.Line, endLine: this._usage.EndLine, whitespace: this._whitespace })
                        .subscribe(response => {
                            const grammar = this._grammar = getEnhancedGrammar(result.editor, _.find(Omni.grammars, g => _.some((<any>g).fileTypes, ft => _.endsWith(this._usage.FileName, `.${ft}`))), { readonly: true });
                            (<any>grammar).setResponses(response);
                            fastdom.mutate(() => this._attachEditor(result, grammar));
                        });
                    this._disposable.add(s);
                    return;
                }
                fastdom.mutate(() => this._attachEditor(result));
                this._disposable.remove(s);
            });
            this._disposable.add(s);
        }
    }

    private _attachEditor(result: { editor: Atom.TextEditor; element: Atom.TextEditorComponent; dispose: () => void }, grammar?: FirstMate.Grammar) {
        if (this._pre) {
            this._pre.remove();
            this._pre = null;
        }

        this._release = result;
        this._disposable.add(result);
        this._editorElement = result.element;
        this._editor = result.editor;
        this.setEditorText(grammar || this._grammar);
        this.appendChild(<any>this._editorElement);
    }

    private _detachEditor(append?: boolean) {
        if (append) {
            this._pre = document.createElement("pre");
            this._pre.innerText = this._usage && this._usage.Text || this.editorText;
            this._pre.style.fontSize = `${atom.config.get("editor.fontSize")}px !important`;
            this.appendChild(this._pre);
        }

        if (this._release) {
            this._disposable.remove(this._release);
            this._release.dispose();
        }

        if (this._editorElement)
            (this._editorElement as any).remove();

        this._editor = null;
        this._editorElement = null;
        this._enhanced = false;
    }

    public detachedCallback() {
        this._detachEditor();
        if (this._pre) {
            this._pre.remove();
            this._pre.innerText = "";
        }
        this._disposable.dispose();
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
        .filter(x => x.length > 0);
}

(<any>exports).EditorElement = (<any>document).registerElement("omnisharp-editor-element", { prototype: EditorElement.prototype });
