/* tslint:disable:no-string-literal */
import {Models} from "omnisharp-client";
import {Omni} from "../server/omni";
import {OmnisharpTextEditor, isOmnisharpTextEditor} from "../server/omnisharp-text-editor";
import {each, extend, has, any, range, remove, pull, find, chain, unique, findIndex, all, isEqual, min, debounce, sortBy, uniqueId, defer} from "lodash";
import {Observable, Subject, ReplaySubject, CompositeDisposable, Disposable} from "rx";
/* tslint:disable:variable-name */
const AtomGrammar = require((<any>atom).config.resourcePath + "/node_modules/first-mate/lib/grammar.js");
/* tslint:enable:variable-name */
const DEBOUNCE_TIME = 240/*240*/;
let fastdom: typeof Fastdom = require("fastdom");

const HIGHLIGHT = "HIGHLIGHT",
    HIGHLIGHT_REQUEST = "HIGHLIGHT_REQUEST",
    IS_OBSERVE_RETOKENIZING = "IS_OBSERVE_RETOKENIZING";

function getHighlightsFromQuickFixes(path: string, quickFixes: Models.DiagnosticLocation[], projectNames: string[]) {
    return chain(quickFixes)
        .filter(x => x.FileName === path)
        .map(x => ({
            StartLine: x.Line,
            StartColumn: x.Column,
            EndLine: x.EndLine,
            EndColumn: x.EndColumn,
            Kind: "unused code",
            Projects: projectNames
        } as Models.HighlightSpan))
        .value();
}

/* tslint:disable:variable-name */
export const ExcludeClassifications = [
    Models.HighlightClassification.Comment,
    Models.HighlightClassification.String,
    Models.HighlightClassification.Punctuation,
    Models.HighlightClassification.Operator,
    Models.HighlightClassification.Keyword
];
/* tslint:enable:variable-name */

class Highlight implements IFeature {
    private disposable: Rx.CompositeDisposable;
    private editors: Array<OmnisharpTextEditor>;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.editors = [];

        this.disposable.add(Omni.eachEditor((editor, cd) => this.setupEditor(editor, cd)));

        const cb = (editor: OmnisharpTextEditor, cd: CompositeDisposable) => {
            if (this.editors.indexOf(editor) === -1) {
                defer(cb);
                return;
            }
            cd.add(editor.omnisharp.project
                .observe.activeFramework
                .skip(1)
                .distinctUntilChanged()
                .subscribe(() => {
                    editor.omnisharp.get<Rx.Observer<boolean>>(HIGHLIGHT_REQUEST).onNext(true);
                }));

            cd.add(editor.omnisharp
                .get<Observable<{ editor: OmnisharpTextEditor; highlights: Models.HighlightSpan[]; projects: string[] }>>(HIGHLIGHT)
                .subscribe(() => {
                    editor.displayBuffer.tokenizedBuffer["silentRetokenizeLines"]();
                }));
        };
        this.disposable.add(Omni.switchActiveEditor(cb));
    }

    public dispose() {
        if (this.disposable) {
            this.disposable.dispose();
        }
    }

    private setupEditor(editor: OmnisharpTextEditor, disposable: CompositeDisposable) {
        if (editor["_oldGrammar"] || !editor.getGrammar) return;
        const issueRequest = new Subject<boolean>();

        augmentEditor(editor, true);

        editor.omnisharp.set(HIGHLIGHT_REQUEST, (context) => issueRequest);
        editor.omnisharp.set(HIGHLIGHT, (context) =>
            issueRequest
                .startWith(true)
                .flatMap(() => Observable.defer(() => {
                    const projects = context.project.activeFramework.Name === "all" ? [] : [context.project.activeFramework.Name];

                    let linesToFetch = unique<number>((<any>editor.getGrammar()).linesToFetch);
                    if (!linesToFetch || !linesToFetch.length)
                        linesToFetch = [];

                    return Observable.combineLatest(
                        Omni.request(editor, solution => solution.highlight({
                            ProjectNames: projects,
                            Lines: linesToFetch,
                            ExcludeClassifications
                        })),
                        context.solution.model.observe.unusedCodeRows,
                        (response, quickfixes) => ({
                            editor,
                            projects,
                            highlights: (response ? response.Highlights : []).concat(getHighlightsFromQuickFixes(editor.getPath(), quickfixes, projects))
                        }))
                        .do(({highlights}) => {
                            if (editor.getGrammar) {
                                (<any>editor.getGrammar()).setResponses(highlights, projects.length > 0);
                            }
                        })
                        .shareReplay(1);
                })));

        this.editors.push(editor);
        this.disposable.add(disposable);

        disposable.add(Disposable.create(() => {
            (<any>editor.getGrammar()).linesToFetch = [];
            if ((<any>editor.getGrammar()).responses) (<any>editor.getGrammar()).responses.clear();
            editor.displayBuffer.tokenizedBuffer.retokenizeLines();
            delete editor["_oldGrammar"];
        }));

        this.disposable.add(editor.onDidDestroy(() => {
            pull(this.editors, editor);
        }));

        disposable.add(editor.omnisharp.project
            .observe.activeFramework
            .subscribe(() => {
                (<any>editor.getGrammar()).linesToFetch = [];
                if ((<any>editor.getGrammar()).responses) (<any>editor.getGrammar()).responses.clear();
                issueRequest.onNext(true);
            }));

        disposable.add(editor.onDidStopChanging(() => issueRequest.onNext(true)));

        disposable.add(editor.onDidSave(() => {
            (<any>editor.getGrammar()).linesToFetch = [];
            issueRequest.onNext(true);
        }));

        disposable.add(editor.omnisharp.solution
            .whenConnected()
            .delay(1000)
            .subscribeOnCompleted(() => {
                issueRequest.onNext(true);
            }));
    }

    public required = false;
    public title = "Enhanced Highlighting";
    public description = "Enables server based highlighting, which includes support for string interpolation, class names and more.";
    public default = false;
}

export function augmentEditor(editor: Atom.TextEditor, doSetGrammar = false) {
    if (!editor["_oldGrammar"])
        editor["_oldGrammar"] = editor.getGrammar();
    if (!editor["_setGrammar"])
        editor["_setGrammar"] = editor.setGrammar;
    if (!editor.displayBuffer.tokenizedBuffer["_buildTokenizedLineForRowWithText"])
        editor.displayBuffer.tokenizedBuffer["_buildTokenizedLineForRowWithText"] = editor.displayBuffer.tokenizedBuffer.buildTokenizedLineForRowWithText;
    if (!editor.displayBuffer.tokenizedBuffer["_markTokenizationComplete"])
        editor.displayBuffer.tokenizedBuffer["_markTokenizationComplete"] = editor.displayBuffer.tokenizedBuffer.markTokenizationComplete;
    if (!editor.displayBuffer.tokenizedBuffer["_retokenizeLines"])
        editor.displayBuffer.tokenizedBuffer["_retokenizeLines"] = editor.displayBuffer.tokenizedBuffer.retokenizeLines;
    if (!editor.displayBuffer.tokenizedBuffer["_tokenizeInBackground"])
        editor.displayBuffer.tokenizedBuffer["_tokenizeInBackground"] = editor.displayBuffer.tokenizedBuffer.tokenizeInBackground;
    if (!editor.displayBuffer.tokenizedBuffer["_chunkSize"])
        editor.displayBuffer.tokenizedBuffer["chunkSize"] = 20;

    editor.setGrammar = setGrammar;
    if (doSetGrammar) editor.setGrammar(editor.getGrammar());

    (<any>editor.displayBuffer.tokenizedBuffer).buildTokenizedLineForRowWithText = function(row: number) {
        (<any>editor.getGrammar())["__row__"] = row;
        return editor.displayBuffer.tokenizedBuffer["_buildTokenizedLineForRowWithText"].apply(this, arguments);
    };

    if (!(<any>editor.displayBuffer.tokenizedBuffer).silentRetokenizeLines) {
        (<any>editor.displayBuffer.tokenizedBuffer).silentRetokenizeLines = debounce(function() {
            if ((<any>editor.getGrammar()).isObserveRetokenizing)
                (<any>editor.getGrammar()).isObserveRetokenizing.onNext(false);
            let lastRow: number;
            lastRow = this.buffer.getLastRow();
            this.tokenizedLines = this.buildPlaceholderTokenizedLinesForRows(0, lastRow);
            this.invalidRows = [];
            if (this.linesToTokenize && this.linesToTokenize.length) {
                this.invalidateRow(min(this.linesToTokenize));
            } else {
                this.invalidateRow(0);
            }
            this.fullyTokenized = false;
        }, DEBOUNCE_TIME, { leading: true, trailing: true });
    }

    (<any>editor.displayBuffer.tokenizedBuffer).markTokenizationComplete = function() {
        if ((<any>editor.getGrammar()).isObserveRetokenizing)
            (<any>editor.getGrammar()).isObserveRetokenizing.onNext(true);
        return editor.displayBuffer.tokenizedBuffer["_markTokenizationComplete"].apply(this, arguments);
    };

    (<any>editor.displayBuffer.tokenizedBuffer).retokenizeLines = function() {
        if ((<any>editor.getGrammar()).isObserveRetokenizing)
            (<any>editor.getGrammar()).isObserveRetokenizing.onNext(false);
        return editor.displayBuffer.tokenizedBuffer["_retokenizeLines"].apply(this, arguments);
    };

    (<any>editor.displayBuffer.tokenizedBuffer).tokenizeInBackground = function() {
        if (!this.visible || this.pendingChunk || !this.isAlive())
            return;

        this.pendingChunk = true;
        fastdom.mutate(() => {
            this.pendingChunk = false;
            if (this.isAlive() && this.buffer.isAlive()) {
                this.tokenizeNextChunk();
            }
        });
    };

    (<any>editor.displayBuffer.tokenizedBuffer).scopesFromTags = function(startingScopes: number[], tags: number[]) {
        const scopes = startingScopes.slice();
        const grammar = (<any>editor.getGrammar());
        for (let i = 0, len = tags.length; i < len; i++) {
            const tag = tags[i];
            if (tag < 0) {
                if ((tag % 2) === -1) {
                    scopes.push(tag);
                } else {
                    const matchingStartTag = tag + 1;
                    while (true) {
                        if (scopes.pop() === matchingStartTag) {
                            break;
                        }
                        if (scopes.length === 0) {
                            // Hack to ensure that all lines always get the proper source lines.
                            scopes.push(<any>grammar.startIdForScope(grammar.scopeName));
                            console.info("Encountered an unmatched scope end tag.", {
                                filePath: editor.buffer.getPath(),
                                grammarScopeName: grammar.scopeName,
                                tag,
                                unmatchedEndTag: grammar.scopeForId(tag)
                            });
                            (<any>editor.getGrammar()).setResponses([]);
                            if (isOmnisharpTextEditor(editor)) {
                                editor.omnisharp.solution
                                    .model.observe.unusedCodeRows
                                    .take(1)
                                    .subscribe(rows => (<any>editor.getGrammar())
                                        .setResponses(getHighlightsFromQuickFixes(editor.getPath(), rows, [])));
                            }
                            break;
                        }
                    }
                }
            }
        }
        return scopes;
    };
}

interface IHighlightingGrammar extends FirstMate.Grammar {
    isObserveRetokenizing: Rx.Subject<boolean>;
    linesToFetch: number[];
    linesToTokenize: number[];
    responses: Map<number, Models.HighlightSpan[]>;
    fullyTokenized: boolean;
    scopeName: string;
}

class Grammar {
    public isObserveRetokenizing: ReplaySubject<boolean>;
    public editor: Atom.TextEditor;
    public linesToFetch: any[];
    public linesToTokenize: any[];
    public activeFramework: any;
    public responses: Map<number, Models.HighlightSpan[]>;
    public _gid = uniqueId("og");

    constructor(editor: Atom.TextEditor, base: FirstMate.Grammar, options: { readonly: boolean }) {
        this.isObserveRetokenizing = new ReplaySubject<boolean>(1);
        this.isObserveRetokenizing.onNext(true);

        if ((editor as any).omnisharp) {
            (editor as any).omnisharp.set(IS_OBSERVE_RETOKENIZING, () => new ReplaySubject<boolean>(1));
        }

        this.editor = editor;
        this.responses = new Map<number, Models.HighlightSpan[]>();
        this.linesToFetch = [];
        this.linesToTokenize = [];
        this.activeFramework = {};

        if (!options || !options.readonly) {
            editor.getBuffer().preemptDidChange((e: any) => {
                const {oldRange, newRange} = e;
                let start: number = oldRange.start.row,
                    delta: number = newRange.end.row - oldRange.end.row;

                start = start - 5;
                if (start < 0) start = 0;

                const end = editor.buffer.getLineCount() - 1;

                const lines = range(start, end + 1);
                if (!this.responses.keys().next().done) {
                    this.linesToFetch.push(...lines);
                }

                if (lines.length === 1) {
                    const responseLine = this.responses.get(lines[0]);
                    if (responseLine) {
                        const oldFrom = oldRange.start.column,
                            newFrom = newRange.start.column;

                        remove(responseLine, (span: Models.HighlightSpan) => {
                            if (span.StartLine < lines[0]) {
                                return true;
                            }
                            if (span.StartColumn >= oldFrom || span.EndColumn >= oldFrom) {
                                return true;
                            }
                            if (span.StartColumn >= newFrom || span.EndColumn >= newFrom) {
                                return true;
                            }
                            return false;
                        });
                    }
                } else {
                    each(lines, line => { this.responses.delete(line); });
                }

                if (delta > 0) {
                    // New line
                    const count = editor.getLineCount();
                    for (let i = count - 1; i > end; i--) {
                        if (this.responses.has(i)) {
                            this.responses.set(i + delta, this.responses.get(i));
                            this.responses.delete(i);
                        }
                    }
                } else if (delta < 0) {
                    // Removed line
                    const count = editor.getLineCount();
                    const absDelta = Math.abs(delta);
                    for (let i = end; i < count; i++) {
                        if (this.responses.has(i + absDelta)) {
                            this.responses.set(i, this.responses.get(i + absDelta));
                            this.responses.delete(i + absDelta);
                        }
                    }
                }
            });
        }
    }

    public setResponses(value: Models.HighlightSpan[], enableExcludeCode: boolean) {
        const results = chain(value);

        const groupedItems = <any>results.map(highlight => range(highlight.StartLine, highlight.EndLine + 1)
            .map(line => ({ line, highlight })))
            .flatten<{ line: number; highlight: Models.HighlightSpan }>()
            .groupBy(z => z.line)
            .value();

        each(groupedItems, (item: { highlight: Models.HighlightSpan }[], key: number) => {
            let k = +key, mappedItem = item.map(x => x.highlight);

            if (!enableExcludeCode || any(mappedItem, i => i.Kind === "preprocessor keyword") && all(mappedItem, i => i.Kind === "excluded code" || i.Kind === "preprocessor keyword")) {
                mappedItem = mappedItem.filter(z => z.Kind !== "excluded code");
            }

            if (!this.responses.has(k)) {
                this.responses.set(k, mappedItem);
                this.linesToTokenize.push(k);
            } else {
                const responseLine = this.responses.get(k);
                if (responseLine.length !== mappedItem.length || any(responseLine, (l, i) => !isEqual(l, mappedItem[i]))) {
                    this.responses.set(k, mappedItem);
                    this.linesToTokenize.push(k);
                }
            }
        });
    }

}

/* tslint:disable:member-access */
/* tslint:disable:variable-name */
extend(Grammar.prototype, AtomGrammar.prototype);

Grammar.prototype["omnisharp"] = true;
Grammar.prototype["tokenizeLine"] = function(line: string, ruleStack: any[], firstLine = false): { tags: number[]; ruleStack: any } {
    const baseResult = AtomGrammar.prototype.tokenizeLine.call(this, line, ruleStack, firstLine);
    let tags: any[];

    if (this.responses) {
        const row = this["__row__"];

        if (!this.responses.has(row)) return baseResult;

        const highlights = this.responses.get(row);
        // Excluded code blows away any other formatting, otherwise we get into a very weird state.
        if (highlights[0] && highlights[0].Kind === "excluded code") {
            tags = [line.length];
            getAtomStyleForToken(this.name, tags, highlights[0], 0, tags.length - 1, line);
            baseResult.ruleStack = [baseResult.ruleStack[0]];
        } else {
            tags = this.getCsTokensForLine(highlights, line, row, ruleStack, firstLine, baseResult.tags);
        }
        baseResult.tags = tags;
    }
    return baseResult;
};

(Grammar.prototype as any).getCsTokensForLine = function(highlights: Models.HighlightSpan[], line: string, row: number, ruleStack: any[], firstLine: boolean, tags: number[]) {
    ruleStack = [{ rule: this.getInitialRule() }];

    each(highlights, (highlight) => {
        const start = highlight.StartColumn - 1;
        const end = highlight.EndColumn - 1;

        if (highlight.EndLine > highlight.StartLine && highlight.StartColumn === 0 && highlight.EndColumn === 0) {
            getAtomStyleForToken(this.name, tags, highlight, 0, tags.length - 1, line);
            return;
        }

        let distance = -1;
        let index = -1;
        let i: number;
        for (i = 0; i < tags.length; i++) {
            if (tags[i] > 0) {
                if (distance + tags[i] > start) {
                    index = i;
                    break;
                }
                distance += tags[i];
            }
        }

        const str = line.substring(start, end);
        const size = end - start;
        if (tags[index] >= size) {
            let values: number[];
            let prev: number, next: number;
            if (distance === start) {
                values = [size, tags[index] - size];
            } else {
                prev = start - distance;
                next = tags[index] - size - prev;
                if (next > 0) {
                    values = [prev, size, tags[index] - size - prev];
                } else {
                    values = [prev, size];
                }
            }
            tags.splice(index, 1, ...values);
            if (prev) index = index + 1;
            getAtomStyleForToken(this.name, tags, highlight, index, index + 1, str);
        } else if (tags[index] < size) {
            let backtrackIndex = index;
            let backtrackDistance = 0;
            for (i = backtrackIndex; i >= 0; i--) {
                if (tags[i] > 0) {
                    if (backtrackDistance >= size) {
                        backtrackIndex = i;
                        break;
                    }
                    backtrackDistance += tags[i];
                } else if (tags[i] % 2 === 0) {
                    if (backtrackDistance >= size) {
                        backtrackIndex = i + 1;
                        break;
                    }
                }
            }

            if (i === -1) {
                backtrackIndex = 0;
            }

            let forwardtrackIndex = index;
            let remainingSize = size;
            for (i = index + 1; i < tags.length; i++) {
                if ((remainingSize <= 0 && tags[i] > 0)/* || tags[i] % 2 === -1*/) {
                    forwardtrackIndex = i - 1;
                    break;
                }
                if (tags[i] > 0) {
                    remainingSize -= tags[i];
                } else if (tags[i] % 2 === 0) {
                    // Handles case where there is a closing tag
                    // but no opening tag here.
                    let openFound = false;
                    for (let h = i; h >= 0; h--) {
                        if (tags[h] === tags[i] + 1) {
                            openFound = true;
                            break;
                        }
                    }
                    if (!openFound) {
                        forwardtrackIndex = i - 1;
                        break;
                    }
                }
            }

            if (i === tags.length) {
                forwardtrackIndex = tags.length - 1;
            }

            getAtomStyleForToken(this.name, tags, highlight, backtrackIndex, forwardtrackIndex, str);
        }
    });

    return tags;
};

const getIdForScope = (function() {
    const ids: { [key: string]: { [key: string]: number }; } = {};
    const grammars: any = {};

    function buildScopesForGrammar(grammarName: string) {
        const grammar = find(atom.grammars.getGrammars(), gammr => gammr.name === grammarName);
        if (!grammar) return;

        ids[grammar.name] = {};
        grammars[grammar.name] = grammar;

        each(grammar.registry.scopesById, (value: string, key: any) => { ids[grammar.name][value] = +key; });
    }

    const method = (grammar: string, scope: string) => {
        if (!ids[grammar]) {
            buildScopesForGrammar(grammar);
        }

        if (!ids[grammar][scope])
            ids[grammar][scope] = grammars[grammar].registry.startIdForScope(scope);

        return +ids[grammar][scope];
    };

    (<any>method).end = (scope: number) => +scope - 1;

    return <{ (grammar: string, scope: string): number; end: (scope: number) => number; }>method;
})();


/// NOTE: best way I have found for these is to just look at theme "less" files
// Alternatively just inspect the token for a .js file
function getAtomStyleForToken(grammar: string, tags: number[], token: Models.HighlightSpan, index: number, indexEnd: number, str: string) {
    const previousScopes: any[] = [];
    for (let i = index - 1; i >= 0; i--) {
        if (tags[i] > 0)
            break;
        previousScopes.push(tags[i]);
    }

    const replacements: { start: number; end: number; replacement: number[] }[] = [];
    const opens: { tag: number; index: number }[] = [];
    const closes: typeof opens = [];

    // Scan for any unclosed or unopened tags
    for (let i = index; i < indexEnd; i++) {
        if (tags[i] > 0) continue;
        if (tags[i] % 2 === 0) {
            const openIndex = findIndex(opens, x => x.tag === (tags[i] + 1));
            if (openIndex > -1) {
                opens.splice(openIndex, 1);
            } else {
                closes.push({ tag: tags[i], index: i });
            }
        } else {
            opens.unshift({ tag: tags[i], index: i });
        }
    }

    let unfullfilled: typeof opens = [];
    if (closes.length > 0) {
        unfullfilled = sortBy(opens.concat(closes), x => x.index);
    } else if (opens.length > 0) {
        // Grab the last known open, and append from there
        replacements.unshift({
            start: opens[opens.length - 1].index,
            end: indexEnd,
            replacement: tags.slice(opens[opens.length - 1].index, indexEnd + 1)
        });
    }

    let internalIndex = index;
    for (let i = 0; i < unfullfilled.length; i++) {
        const v = unfullfilled[i];
        replacements.unshift({
            start: internalIndex,
            end: v.index,
            replacement: tags.slice(internalIndex, v.index)
        });
        internalIndex = v.index + 1;
    }

    if (replacements.length === 0) {
        replacements.unshift({
            start: index,
            end: indexEnd,
            replacement: tags.slice(index, indexEnd)
        });
    } else {
        /*replacements.unshift({
            start: internalIndex,
            end: indexEnd,
            replacement: tags.slice(internalIndex, indexEnd)
        });*/
    }

    function add(scope: any) {
        const id = getIdForScope(grammar, scope);
        if (id === -1) return;

        if (!any(previousScopes, z => z === id)) {
            previousScopes.push(id);
        }
        each(replacements, ctx => {
            const replacement = ctx.replacement;
            replacement.unshift(id);
            replacement.push(getIdForScope.end(id));
        });
    }
    switch (token.Kind) {
        case "number":
            add(`constant.numeric`);
            break;
        case "struct name":
            add(`support.constant.numeric.identifier.struct`);
            break;
        case "enum name":
            add(`support.constant.numeric.identifier.enum`);
            break;
        case "identifier":
            add(`identifier`);
            break;
        case "class name":
            add(`support.class.type.identifier`);
            break;
        case "delegate name":
            add(`support.class.type.identifier.delegate`);
            break;
        case "interface name":
            add(`support.class.type.identifier.interface`);
            break;
        case "preprocessor keyword":
            add(`constant.other.symbol`);
            break;
        case "excluded code":
            add(`comment.block`);
            break;
        case "unused code":
            add(`unused`);
            break;
        default:
            console.log("unhandled Kind " + token.Kind);
            break;
    }

    each(replacements, ctx => {
        const {replacement, end, start} = ctx;
        if (replacement.length === 2) return;
        let num = end - start;
        if (num <= 0) {
            num = 1;
        }
        tags.splice(start, num, ...replacement);
    });
}

function setGrammar(grammar: FirstMate.Grammar): FirstMate.Grammar {
    const g2 = getEnhancedGrammar(this, grammar);
    if (g2 !== grammar)
        this._setGrammar(g2);
    return g2;
}

export function getEnhancedGrammar(editor: Atom.TextEditor, grammar?: FirstMate.Grammar, options?: { readonly: boolean }) {
    if (!grammar) grammar = editor.getGrammar();
    if (!grammar["omnisharp"] && Omni.isValidGrammar(grammar)) {
        const newGrammar = new Grammar(editor, grammar, options);
        each(grammar, (x, i) => has(grammar, i) && (newGrammar[i] = x));
        grammar = <any>newGrammar;
    }
    return grammar;
}

export const enhancedHighlighting = new Highlight;
