import Omni = require('../../omni-sharp-server/omni');
import {DriverState} from "omnisharp-client";
import OmniSharpAtom = require('../omnisharp-atom');
import {each, indexOf, extend, has, map, flatten, contains, any, range, remove, pull, find, defer, startsWith, trim, isArray, chain, unique, set, findIndex, delay, filter, all, isEqual, min} from "lodash";
import {Observable, Subject, ReplaySubject, Scheduler, CompositeDisposable, Disposable} from "rx";
var AtomGrammar = require((<any> atom).config.resourcePath + "/node_modules/first-mate/lib/grammar.js");
var Range: typeof TextBuffer.Range = <any>require('atom').Range;

class Highlight implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private editors: Array<Atom.TextEditor>;

    constructor() {
        var subject = new ReplaySubject<boolean>(1);
        var loaded = false;
        atom.config.observe("omnisharp-atom.enhancedHighlighting", (enabled: boolean) => {
            this.enabled = enabled;
            subject.onNext(enabled);

            if (loaded) {
                if (enabled) {
                    this.activate();
                } else {
                    this.dispose();
                }
            }
            if (!loaded) {
                loaded = true;
            }
        });

        this.observe = { enabled: subject.asObservable() };
    }

    public active = false;
    public enabled: boolean;

    public observe: { enabled: Observable<boolean> };

    public activate() {
        if (!this.enabled || this.active) return;

        this.disposable = new CompositeDisposable();
        this.editors = [];

        this.active = true;
        this.disposable.add(Disposable.create(() => {
            this.active = false
        }));

        this.disposable.add(Omni.editors
            .subscribe(editor => this.setupEditor(editor)));

        this.disposable.add(
            isObserveRetokenizing(
                Omni.activeEditor.take(1)
                    .where(x => !!x)
                    .flatMap(editor => Omni.listener.observeHighlight
                        .where(z => z.request.FileName == editor.getPath())
                        .map(z => ({ editor, request: z.request, response: z.response }))
                        .take(1))
                )
                .subscribe(({editor, request, response}) => {
                    editor.getGrammar && (<any>editor.getGrammar()).setResponses(response.Highlights, request.ProjectNames.length > 0);
                    editor.displayBuffer.tokenizedBuffer.retokenizeLines();
                }));

        this.disposable.add(
            isObserveRetokenizing(
                Omni.listener.observeHighlight
                    .map(z => ({ editor: find(this.editors, editor => editor.getPath() === z.request.FileName), request: z.request, response: z.response }))
                )
                .subscribe(({editor, request, response}) => {
                    editor.getGrammar && (<any>editor.getGrammar()).setResponses(response.Highlights, request.ProjectNames.length > 0);
                }));

        this.disposable.add(isObserveRetokenizing(
            Omni.listener.observeHighlight
                .map(z => ({ editor: find(atom.workspace.getTextEditors(), editor => editor.getPath() == z.request.FileName), request: z.request, response: z.response }))
                .flatMap(z => Omni.activeEditor.take(1).where(x => x === z.editor).map(x => z))
            )
            .debounce(400)
            .subscribe(({request, response, editor}) => {
                editor.displayBuffer.tokenizedBuffer['silentRetokenizeLines']();
            }));

        this.disposable.add(isEditorObserveRetokenizing(
            Observable.merge(Omni.activeEditor,
                Omni.activeFramework
                    .flatMap(z => Omni.listener.observeHighlight
                        .where(x => contains(x.request.ProjectNames, `${z.project.name}+${z.framework.ShortName}`))
                        .map(z => ({ editor: find(this.editors, editor => editor.getPath() === z.request.FileName), request: z.request, response: z.response }))
                        .take(1))
                    .flatMap(z => Omni.activeEditor))
                .debounce(20)
                .where(z => !!z)
            )
            .subscribe(editor => {
                editor.displayBuffer.tokenizedBuffer['silentRetokenizeLines']();
            }));
    }

    public dispose() {
        this.disposable && this.disposable.dispose();
    }

    private setupEditor(editor: Atom.TextEditor) {
        if (editor['_oldGrammar'] || !editor.getGrammar) return;

        this.editors.push(editor);

        var disposable = new CompositeDisposable();
        this.disposable.add(disposable);

        if (!editor['_oldGrammar'])
            editor['_oldGrammar'] = editor.getGrammar();
        if (!editor['_setGrammar'])
            editor['_setGrammar'] = editor.setGrammar;
        if (!editor.displayBuffer.tokenizedBuffer['_buildTokenizedLineForRowWithText'])
            editor.displayBuffer.tokenizedBuffer['_buildTokenizedLineForRowWithText'] = editor.displayBuffer.tokenizedBuffer.buildTokenizedLineForRowWithText;
        if (!editor.displayBuffer.tokenizedBuffer['_markTokenizationComplete'])
            editor.displayBuffer.tokenizedBuffer['_markTokenizationComplete'] = editor.displayBuffer.tokenizedBuffer.markTokenizationComplete;
        if (!editor.displayBuffer.tokenizedBuffer['_retokenizeLines'])
            editor.displayBuffer.tokenizedBuffer['_retokenizeLines'] = editor.displayBuffer.tokenizedBuffer.retokenizeLines;
        if (!editor.displayBuffer.tokenizedBuffer['_chunkSize'])
            editor.displayBuffer.tokenizedBuffer['chunkSize'] = 20;

        editor.setGrammar = setGrammar;
        editor.setGrammar(editor.getGrammar());

        var grammar: IHighlightingGrammar = <any>editor.getGrammar();

        (<any>editor.displayBuffer.tokenizedBuffer).buildTokenizedLineForRowWithText = function(row) {
            grammar['__row__'] = row;
            return editor.displayBuffer.tokenizedBuffer['_buildTokenizedLineForRowWithText'].apply(this, arguments);
        };

        if (!(<any>editor.displayBuffer.tokenizedBuffer).silentRetokenizeLines) {
            (<any>editor.displayBuffer.tokenizedBuffer).silentRetokenizeLines = function() {
                if (grammar.isObserveRetokenizing)
                    grammar.isObserveRetokenizing.onNext(false);
                var event, lastRow;
                lastRow = this.buffer.getLastRow();
                this.tokenizedLines = this.buildPlaceholderTokenizedLinesForRows(0, lastRow);
                this.invalidRows = [];
                if (this.linesToTokenize && this.linesToTokenize.length) {
                    this.invalidateRow(min(this.linesToTokenize));
                } else {
                    this.invalidateRow(0);
                }
                this.fullyTokenized = false;
            };
        }

        (<any>editor.displayBuffer.tokenizedBuffer).markTokenizationComplete = function() {
            if (grammar.isObserveRetokenizing)
                grammar.isObserveRetokenizing.onNext(true);
            return editor.displayBuffer.tokenizedBuffer['_markTokenizationComplete'].apply(this, arguments);
        };

        (<any>editor.displayBuffer.tokenizedBuffer).retokenizeLines = function() {
            if (grammar.isObserveRetokenizing)
                grammar.isObserveRetokenizing.onNext(false);
            return editor.displayBuffer.tokenizedBuffer['_retokenizeLines'].apply(this, arguments);
        };

        disposable.add(Disposable.create(() => {
            grammar.linesToFetch = [];
            grammar.responses.clear();
            editor.displayBuffer.tokenizedBuffer.retokenizeLines();
            //editor.setGrammar = editor['_setGrammar'];
            //editor.displayBuffer.tokenizedBuffer.buildTokenizedLineForRowWithText = editor.displayBuffer.tokenizedBuffer['_buildTokenizedLineForRowWithText'];
            //editor.displayBuffer.tokenizedBuffer.markTokenizationComplete = editor.displayBuffer.tokenizedBuffer['_markTokenizationComplete'];
            //editor.displayBuffer.tokenizedBuffer.retokenizeLines = editor.displayBuffer.tokenizedBuffer['_retokenizeLines'];
            //editor.displayBuffer.tokenizedBuffer.chunkSize = editor.displayBuffer.tokenizedBuffer['_chunkSize'];
            //editor.setGrammar(editor['_oldGrammar']);
        }));

        this.disposable.add(editor.onDidDestroy(() => {
            disposable.dispose();
            this.disposable.remove(disposable);
            pull(this.editors, editor);
        }));

        var issueRequest = new Subject<boolean>();

        disposable.add(issueRequest
            .debounce(200)
            .flatMap(z => Omni.getProject(editor).map(z => z.activeFramework.Name === 'all' ? '' : (z.name + '+' + z.activeFramework.ShortName)).timeout(200, Observable.just('')))
            .subscribe((framework) => {
                var projects = [];
                if (framework)
                    projects = [framework];

                var linesToFetch = unique<number>(grammar.linesToFetch) || [];
                if (!linesToFetch || !linesToFetch.length)
                    linesToFetch = [];

                Omni.request(editor, client => client.highlight(
                    client.makeDataRequest<OmniSharp.Models.HighlightRequest>({
                        FileName: editor.getPath(),
                        ProjectNames: projects,
                        Lines: <any>linesToFetch,
                        ExcludeClassifications: [
                            OmniSharp.Models.HighlightClassification.Comment,
                            OmniSharp.Models.HighlightClassification.String,
                            OmniSharp.Models.HighlightClassification.Punctuation,
                            OmniSharp.Models.HighlightClassification.Operator,
                            OmniSharp.Models.HighlightClassification.Keyword
                        ]
                    }, editor)));
            }));

        disposable.add(Omni.getProject(editor)
            .flatMap(z => z.observe.activeFramework).subscribe(() => {
                grammar.linesToFetch = [];
                grammar.responses.clear();
                issueRequest.onNext(true);
            }));

        disposable.add(editor.onDidStopChanging(() => issueRequest.onNext(true)));

        disposable.add(editor.onDidSave(() => {
            grammar.linesToFetch = [];
            issueRequest.onNext(true);
        }));

        issueRequest.onNext(true);
    }
}

function isObserveRetokenizing(observable: Rx.Observable<{ editor: Atom.TextEditor; request: OmniSharp.Models.HighlightRequest; response: OmniSharp.Models.HighlightResponse }>) {
    return observable.where(z => !!z.editor.getGrammar).where(z => !!(<Observable<boolean>>(<any>z.editor.getGrammar()).isObserveRetokenizing))
        .flatMap(z => (<Observable<boolean>>(<any>z.editor.getGrammar()).isObserveRetokenizing).where(z => !!z).take(1).map(x => z));
}

function isEditorObserveRetokenizing(observable: Rx.Observable<Atom.TextEditor>) {
    return observable.where(z => !!z.getGrammar).where(z => !!(<Observable<boolean>>(<any>z.getGrammar()).isObserveRetokenizing))
        .flatMap(z => (<Observable<boolean>>(<any>z.getGrammar()).isObserveRetokenizing).where(z => !!z).take(1).map(x => z))
}

interface IHighlightingGrammar extends FirstMate.Grammar {
    isObserveRetokenizing: Rx.Subject<boolean>;
    linesToFetch: number[];
    linesToTokenize: number[];
    responses: Map<number, OmniSharp.Models.HighlightSpan[]>;
    fullyTokenized: boolean;
}

enum HighlightClassification {
    Name = 1,
    Comment = 2,
    String = 3,
    Operator = 4,
    Punctuation = 5,
    Keyword = 6,
    Number = 7,
    Identifier = 8,
    PreprocessorKeyword = 9,
    ExcludedCode = 10
}

set(global, 'OmniSharp.Models.HighlightClassification', HighlightClassification)

function Grammar(editor: Atom.TextEditor, base: FirstMate.Grammar) {
    var isObserveRetokenizing = this.isObserveRetokenizing = new ReplaySubject<boolean>(1);

    this.editor = editor;
    var responses = new Map<number, OmniSharp.Models.HighlightSpan[]>();
    this.linesToFetch = [];
    this.linesToTokenize = [];
    this.activeFramework = {};

    Object.defineProperty(this, 'responses', {
        writable: false,
        value: responses
    });

    var disposable = editor.getBuffer().preemptDidChange((e) => {
        var {oldRange, newRange} = e,
            start: number = oldRange.start.row,
            end: number = oldRange.end.row,
            delta: number = newRange.end.row - oldRange.end.row;

        var lines = range(start, end + 1);
        if (!responses.keys().next().done) {
            this.linesToFetch.push(...lines);
        }

        if (lines.length === 1) {
            var responseLine = responses.get(lines[0]);
            if (responseLine) {
                var oldFrom = oldRange.start.column,
                    oldTo = oldRange.end.column,
                    newFrom = newRange.start.column,
                    newTo = newRange.end.column,
                    oldDistance = oldTo - oldFrom,
                    newDistance = newTo - newFrom;

                //responses.delete(lines[0]);
                remove(responseLine, (span: OmniSharp.Models.HighlightSpan) => {
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
            each(lines, line => { responses.delete(line) });
        }

        if (delta > 0) {
            // New line
            var count = editor.getLineCount();
            for (var i = count - 1; i > end; i--) {
                if (responses.has(i)) {
                    responses.set(i + delta, responses.get(i))
                    responses.delete(i);
                }
            }
        } else if (delta < 0) {
            // Removed line
            var count = editor.getLineCount();
            var absDelta = Math.abs(delta);
            for (var i = end; i < count; i++) {
                if (responses.has(i + absDelta)) {
                    responses.set(i, responses.get(i + absDelta))
                    responses.delete(i + absDelta);
                }
            }
        }
    });

    this.setResponses = (value: OmniSharp.Models.HighlightSpan[], enableExcludeCode: boolean) => {
        var results = chain(value).chain();

        var groupedItems = <any>results.map(highlight => range(highlight.StartLine, highlight.EndLine + 1)
            .map(line => ({ line, highlight })))
            .flatten<{ line: number; highlight: OmniSharp.Models.HighlightSpan }>()
            .groupBy(z => z.line)
            .value();

        each(groupedItems, (item: { highlight: OmniSharp.Models.HighlightSpan }[], key: number) => {
            var k = +key, mappedItem = item.map(x => x.highlight);

            if (!enableExcludeCode || any(mappedItem, i => i.Kind === 'preprocessor keyword') && all(mappedItem, i => i.Kind === "excluded code" || i.Kind === 'preprocessor keyword')) {
                mappedItem = mappedItem.filter(z => z.Kind !== "excluded code");
            }

            if (!responses.has(k)) {
                responses.set(k, mappedItem);
                this.linesToTokenize.push(k);
            } else {
                var responseLine = responses.get(k);
                if (responseLine.length !== mappedItem.length || any(responseLine, (l, i) => !isEqual(l, mappedItem[i]))) {
                    responses.set(k, mappedItem);
                    this.linesToTokenize.push(k);
                }
            }
        });
    };
}

extend(Grammar.prototype, AtomGrammar.prototype);

Grammar.prototype.omnisharp = true;
Grammar.prototype.tokenizeLine = function(line: string, ruleStack: any[], firstLine = false): { tags: number[]; ruleStack: any } {
    var baseResult = AtomGrammar.prototype.tokenizeLine.call(this, line, ruleStack, firstLine);
    var tags;

    if (this.responses) {
        var row = this['__row__'];

        if (!this.responses.has(row)) return baseResult;

        var highlights = this.responses.get(row);
        // Excluded code blows away any other formatting, otherwise we get into a very weird state.
        if (highlights[0] && highlights[0].Kind === "excluded code") {
            tags = [line.length];
            getAtomStyleForToken(tags, highlights[0], 0, tags.length - 1, line);
            baseResult.ruleStack = [baseResult.ruleStack[0]]
        } else {
            tags = this.getCsTokensForLine(highlights, line, row, ruleStack, firstLine, baseResult.tags);
        }
        baseResult.tags = tags;
    }
    return baseResult;
}

Grammar.prototype.getCsTokensForLine = function(highlights: OmniSharp.Models.HighlightSpan[], line: string, row: number, ruleStack: any[], firstLine, tags: number[]) {
    ruleStack = [{ rule: this.getInitialRule() }];

    var originalTags = tags.slice();

    each(highlights, function(highlight) {
        var start = highlight.StartColumn - 1;
        var end = highlight.EndColumn - 1;

        if (highlight.EndLine > highlight.StartLine && highlight.StartColumn === 0 && highlight.EndColumn === 0) {
            getAtomStyleForToken(tags, highlight, 0, tags.length - 1, line);
            return;
        }

        var distance = -1;
        var index = -1;
        for (var i = 0; i < tags.length; i++) {
            if (tags[i] > 0) {
                if (distance + tags[i] > start) {
                    index = i;
                    break;
                }
                distance += tags[i];
            }
        }

        var str = line.substring(start, end);
        var size = end - start;
        if (tags[index] >= size) {
            var values: number[];
            if (distance === start) {
                values = [size, tags[index] - size];
            } else {
                var prev = start - distance;
                var next = tags[index] - size - prev;
                if (next > 0)
                    values = [prev, size, tags[index] - size - prev];
                else
                    values = [prev, size];
            }
            tags.splice(index, 1, ...values);
            if (prev) index = index + 1;
            getAtomStyleForToken(tags, highlight, index, index, str);
        } else if (tags[index] < size) {
            var backtrackIndex = index;
            var backtrackDistance = 0;
            for (var i = backtrackIndex; i >= 0; i--) {
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

            var forwardtrackIndex = index;
            for (var i = index + 1; i < tags.length; i++) {
                if (tags[i] > 0 || tags[i] % 2 === -1) {
                    forwardtrackIndex = i - 1;
                    break;
                }
            }

            if (i === tags.length) {
                forwardtrackIndex = tags.length - 1;
            }

            getAtomStyleForToken(tags, highlight, backtrackIndex, forwardtrackIndex, str);
        }
    });

    return tags;
}

var getIdForScope = (function() {
    var ids: { [key: string]: number } = {};
    var csharpGrammar: FirstMate.Grammar;

    var cb = () => {
        csharpGrammar = find(atom.grammars.getGrammars(), grammar => grammar.name === 'C#');
        if (!csharpGrammar) return;
        each(csharpGrammar.registry.scopesById, (value: string, key: any) => { ids[value] = +key; });
    };
    cb();

    if (!csharpGrammar) {
        var sub = atom.grammars.onDidAddGrammar(() => {
            cb();
            if (csharpGrammar)
                sub.dispose();
        });
    }

    var method = (scope: string) => {
        if (!ids[scope])
            ids[scope] = csharpGrammar.registry.startIdForScope(scope);
        return +ids[scope];
    }

    (<any>method).end = (scope: number) => +scope - 1;

    return <{ (scope: string): number; end: (scope: number) => number; }>method;
})();


/// NOTE: best way I have found for these is to just look at theme "less" files
// Alternatively just inspect the token for a .js file
function getAtomStyleForToken(tags: number[], token: OmniSharp.Models.HighlightSpan, index: number, indexEnd: number, str: string) {
    var previousScopes = [];

    for (var i = index - 1; i >= 0; i--) {
        if (tags[i] > 0)
            break;
        //if (tags[i] % 2 === -1)
        previousScopes.push(tags[i]);
    }

    var replacement = tags.slice(index, indexEnd + 1);

    function add(scope: string) {
        var id = getIdForScope(scope);
        if (id === -1) return;
        if (!any(previousScopes, z => z === id)) {
            previousScopes.push(id);
        }

        replacement.unshift(id);
        replacement.push(getIdForScope.end(id))
    }

    switch (token.Kind) {
        case "number":
            add('constant.numeric.source.cs');
            break;
        case "struct name":
            add('support.constant.numeric.identifier.struct.source.cs');
            break;
        case "enum name":
            add('support.constant.numeric.identifier.enum.source.cs');
            break;
        case "identifier":
            add('identifier.source.cs');
            break;
        case "class name":
            add('support.class.type.identifier.source.cs');
            break;
        case "delegate name":
            add('support.class.type.identifier.delegate.source.cs');
            break;
        case "interface name":
            add('support.class.type.identifier.interface.source.cs');
            break;
        case "preprocessor keyword":
            add('constant.other.symbo.source.csl');
            break;
        case "excluded code":
            add('comment.block.source.cs');
            break;
        default:
            console.log(`unhandled Kind ${token.Kind}`);
            break;
    }
    if (replacement.length > indexEnd - index + 1) {
        tags.splice(index, indexEnd - index + 1, ...replacement);
    }
}

function setGrammar(grammar: FirstMate.Grammar): FirstMate.Grammar {
    if (!grammar['omnisharp'] && (grammar.name === 'C#' || grammar.name === 'C# Script File')) {
        var newGrammar = new Grammar(this, grammar);
        each(grammar, (x, i) => has(grammar, i) && (newGrammar[i] = x));
        grammar = newGrammar;
    }
    return this._setGrammar(grammar);
}

export var highlight = new Highlight;
