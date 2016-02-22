import {Omni} from "../server/omni";
import {Models} from "omnisharp-client";
import _ from "lodash";
import {CompositeDisposable, IDisposable} from "omnisharp-client";
const filter = require("fuzzaldrin").filter;

interface RequestOptions {
    editor: Atom.TextEditor;
    bufferPosition: TextBuffer.Point; // the position of the cursor
    prefix: string;
    scopeDescriptor: { scopes: string[] };
    activatedManually: boolean;
}

interface Suggestion {
    //Either text or snippet is required
    text?: string;
    snippet?: string;
    displayText?: string;
    replacementPrefix?: string;
    type: string;
    leftLabel?: string;
    leftLabelHTML?: string;
    rightLabel?: string;
    rightLabelHTML?: string;
    iconHTML?: string;
    description?: string;
    descriptionMoreURL?: string;
    className?: string;
}

function calcuateMovement(previous: RequestOptions, current: RequestOptions) {
    if (!current) return { reset: true, current: current, previous: null };
    // If the row changes we moved lines, we should refetch the completions
    // (Is it possible it will be the same set?)
    const row = Math.abs(current.bufferPosition.row - previous.bufferPosition.row) > 0;
    // If the column jumped, lets get them again to be safe.
    const column = Math.abs(current.bufferPosition.column - previous.bufferPosition.column) > 3;
    return { reset: row || column || false, previous: previous, current: current };
}

const autoCompleteOptions = <Models.AutoCompleteRequest>{
    WordToComplete: "",
    WantDocumentationForEveryCompletionResult: false,
    WantKind: true,
    WantSnippet: true,
    WantReturnType: true
};

function renderReturnType(returnType: string) {
    if (returnType === null) {
        return;
    }
    return `Returns: ${returnType}`;
}

function renderIcon(item: Models.AutoCompleteResponse) {
    // todo: move additional styling to css
    return `<img height="16px" width="16px" src="atom://omnisharp-atom/styles/icons/autocomplete_${item.Kind.toLowerCase()}@3x.png" />`;
}

class CompletionProvider implements IDisposable {
    private _disposable: CompositeDisposable;

    private _initialized = false;

    private _useIcons: boolean;
    private _useLeftLabelColumnForSuggestions: boolean;

    private previous: RequestOptions;
    private results: Promise<Models.AutoCompleteResponse[]>;

    public selector = ".source.omnisharp";
    public disableForSelector = ".source.omnisharp .comment";
    public inclusionPriority = 1;
    public suggestionPriority = 10;
    public excludeLowerPriority = false;

    public getSuggestions(options: RequestOptions): Promise<Suggestion[]> {
        if (!this._initialized) this._setupSubscriptions();

        if (this.results && this.previous && calcuateMovement(this.previous, options).reset) {
            this.results = null;
        }

        if (this.results && options.prefix === "." || (options.prefix && !_.trim(options.prefix)) || !options.prefix || options.activatedManually) {
            this.results = null;
        }

        this.previous = options;

        const buffer = options.editor.getBuffer();
        const end = options.bufferPosition.column;

        const data = buffer.getLines()[options.bufferPosition.row].substring(0, end + 1);
        const lastCharacterTyped = data[end - 1];

        if (!/[A-Z_0-9.]+/i.test(lastCharacterTyped)) {
            return;
        }

        let search = options.prefix;
        if (search === ".")
            search = "";

        if (!this.results) this.results = Omni.request(solution => solution.autocomplete(_.clone(autoCompleteOptions))).toPromise();

        let p = this.results;
        if (search)
            p = p.then(s => filter(s, search, { key: "CompletionText" }));

        return p.then(response => response.map(s => this._makeSuggestion(s)));
    }

    public onDidInsertSuggestion(editor: Atom.TextEditor, triggerPosition: TextBuffer.Point, suggestion: any) {
        this.results = null;
    }

    public dispose() {
        if (this._disposable)
            this._disposable.dispose();

        this._disposable = null;
        this._initialized = false;
    }

    private _setupSubscriptions() {
        if (this._initialized) return;

        const disposable = this._disposable = new CompositeDisposable();

        // Clear when auto-complete is opening.
        // TODO: Update atom typings
        disposable.add(atom.commands.onWillDispatch((event: Event) => {
            if (event.type === "autocomplete-plus:activate" || event.type === "autocomplete-plus:confirm" || event.type === "autocomplete-plus:cancel") {
                this.results = null;
            }
        }));

        // TODO: Dispose of these when not needed
        disposable.add(atom.config.observe("omnisharp-atom.useIcons", (value) => {
            this._useIcons = value;
        }));

        disposable.add(atom.config.observe("omnisharp-atom.useLeftLabelColumnForSuggestions", (value) => {
            this._useLeftLabelColumnForSuggestions = value;
        }));

        this._initialized = true;
    }

    private _makeSuggestion(item: Models.AutoCompleteResponse) {
        let description: any, leftLabel: any, iconHTML: any, type: any;

        if (this._useLeftLabelColumnForSuggestions === true) {
            description = item.RequiredNamespaceImport;
            leftLabel = item.ReturnType;
        } else {
            description = renderReturnType(item.ReturnType);
            leftLabel = "";
        }

        if (this._useIcons === true) {
            iconHTML = renderIcon(item);
            type = item.Kind;
        } else {
            iconHTML = null;
            type = item.Kind.toLowerCase();
        }

        return {
            _search: item.CompletionText,
            snippet: item.Snippet,
            type: type,
            iconHTML: iconHTML,
            displayText: item.DisplayText,
            className: "autocomplete-omnisharp-atom",
            description: description,
            leftLabel: leftLabel,
        };
    }
}

module.exports = [new CompletionProvider()];
