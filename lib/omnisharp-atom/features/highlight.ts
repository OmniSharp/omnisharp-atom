import Omni = require('../../omni-sharp-server/omni');
import {DriverState} from "omnisharp-client";
import OmniSharpAtom = require('../omnisharp-atom');
import {each, indexOf, extend, has, map, flatten, contains, any, range, remove, pull, find, defer, startsWith, trim, isArray, chain} from "lodash";
import {Observable, Subject, Scheduler, CompositeDisposable, Disposable} from "rx";
var AtomGrammar = require((<any> atom).config.resourcePath + "/node_modules/first-mate/lib/grammar.js");
var Range: typeof TextBuffer.Range = <any>require('atom').Range;

class Highlight implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private editors: Array<Atom.TextEditor>;
    private wantIdentifiers = true;
    private retokenizeAll = new Subject<boolean>();

    constructor() {
        atom.config.observe("omnisharp-atom.enhancedHighlighting", (enabled: boolean) => {
            var currentlyEnabled = this.enabled;
            this.enabled = enabled;
            if (!currentlyEnabled && enabled) {
                this.activate(true);
            } else if (currentlyEnabled && !enabled) {
                this.dispose();
            }
        });

        atom.config.observe('omnisharp-atom.enhancedHighlightingIdentifiers', (enabled: boolean) => {
            this.wantIdentifiers = enabled;
            if (this.active) {
                this.retokenizeAll.onNext(enabled);
            }
        });
    }

    public active = false;
    private beenActivatedByPlugin = false;
    public enabled: boolean;

    public activate(enabledByConfig = false) {
        if (!enabledByConfig) this.beenActivatedByPlugin = true;
        if (this.active || !this.beenActivatedByPlugin) return;

        this.disposable = new CompositeDisposable();
        this.editors = [];

        this.active = true;
        this.disposable.add(Disposable.create(() => {
            this.active = false
        }));

        this.disposable.add(Omni.editors
            .subscribe(editor => this.setupEditor(editor)));

        this.disposable.add(
            Omni.activeEditor.take(1)
                .where(x => !!x)
                .flatMap(editor => Omni.listener.responses
                    .where(z => z.command === "highlight")
                    .where(z => z.request.FileName == editor.getPath())
                    .take(1))
                .subscribe(({request, response}: { request: HighlightRequest, response: HighlightResponse[] }) => {
                    var editor = find(this.editors, editor => editor.getPath() === request.FileName);
                    (<any>editor.getGrammar()).setResponses(response);
                    editor.displayBuffer.tokenizedBuffer.retokenizeLines();
                }));

        this.disposable.add(
            Omni.listener.responses
                .where(z => z.command === "highlight")
                .subscribe(({request, response}: { request: HighlightRequest, response: HighlightResponse[] }) => {
                    var editor = find(this.editors, editor => editor.getPath() === request.FileName);
                    (<any>editor.getGrammar()).setResponses(response);
                    editor.displayBuffer.tokenizedBuffer['silentRetokenizeLines']();
                }));

        this.disposable.add(Omni.activeEditor
            .where(z => !!z)
            .subscribe(editor => {
                editor.displayBuffer.tokenizedBuffer.retokenizeLines();
            }));
    }

    public dispose() {
        this.disposable && this.disposable.dispose();
    }

    private setupEditor(editor: Atom.TextEditor) {
        if (editor['_oldGrammar']) return;

        this.editors.push(editor);

        var disposable = new CompositeDisposable();

        if (!editor['_oldGrammar'])
            editor['_oldGrammar'] = editor.getGrammar();
        if (!editor['_setGrammar'])
            editor['_setGrammar'] = editor.setGrammar;
        if (!editor.displayBuffer.tokenizedBuffer['_buildTokenizedLineForRowWithText'])
            editor.displayBuffer.tokenizedBuffer['_buildTokenizedLineForRowWithText'] = editor.displayBuffer.tokenizedBuffer.buildTokenizedLineForRowWithText;

        editor.setGrammar = setGrammar;
        editor.setGrammar(editor.getGrammar());

        (<any>editor.displayBuffer.tokenizedBuffer).buildTokenizedLineForRowWithText = function(row) {
            editor.getGrammar()['__row__'] = row;
            return editor.displayBuffer.tokenizedBuffer['_buildTokenizedLineForRowWithText'].apply(this, arguments);
        };

        if (!(<any>editor.displayBuffer.tokenizedBuffer).silentRetokenizeLines) {
            (<any>editor.displayBuffer.tokenizedBuffer).silentRetokenizeLines = function() {
                var event, lastRow;
                lastRow = this.buffer.getLastRow();
                this.tokenizedLines = this.buildPlaceholderTokenizedLinesForRows(0, lastRow);
                this.invalidRows = [];
                this.invalidateRow(0);
                this.fullyTokenized = false;
            };
        }

        disposable.add(Disposable.create(() => defer(() => {
            editor.setGrammar = editor['_setGrammar'];
            editor.displayBuffer.tokenizedBuffer.buildTokenizedLineForRowWithText = editor.displayBuffer.tokenizedBuffer['_buildTokenizedLineForRowWithText'];
            editor.setGrammar(editor['_oldGrammar']);
        })));

        this.disposable.add(editor.onDidDestroy(() => {
            disposable.dispose();
            this.disposable.remove(disposable);
            pull(this.editors, editor);
        }));
        this.disposable.add(disposable);

        var doRequest = () => {
            Omni.request(editor, client => client
                .request<HighlightRequest, HighlightResponse[]>(
                    "highlight",
                    client.makeDataRequest<HighlightRequest>({
                        FileName: editor.getPath(),
                        Lines: [],
                        WantComments: false,
                        WantStrings: false,
                        WantOperators: false,
                        WantPunctuation: false,
                        WantKeywords: false,
                        WantIdentifiers: this.wantIdentifiers
                    }, editor)));
        }

        disposable.add(this.retokenizeAll.subscribe(() => doRequest()));
        disposable.add(editor.onDidStopChanging(() => doRequest()));
        disposable.add(editor.onDidSave(() => doRequest()));
        doRequest();
    }
}

interface HighlightRequest {
    FileName: string;
    Lines?: number[];
    WantComments?: boolean;
    WantStrings?: boolean;
    WantOperators?: boolean;
    WantPunctuation?: boolean;
    WantKeywords?: boolean;
}

interface HighlightResponse {
    StartLine: number;
    StartColumn: number;
    EndLine: number;
    EndColumn: number;
    Kind: string;
}

function Grammar(editor: Atom.TextEditor, base: FirstMate.Grammar) {
    this.editor = editor;
    var responses = new Map<number, HighlightResponse[]>();
    Object.defineProperty(this, 'responses', {
        writable: false,
        value: responses
    });

    var disposable = editor.buffer.preemptDidChange((e) => {
        var {oldRange, newRange} = e,
            start: number = oldRange.start.row,
            end: number = oldRange.end.row,
            delta: number = newRange.end.row - oldRange.end.row;

        each(range(start, end + 1), line => responses.delete(line));

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

    this.setResponses = (value: HighlightResponse[]) => {
        var results = chain(value).chain();

        var groupedItems = <any>results.map(highlight => range(highlight.StartLine, highlight.EndLine + 1)
            .map(line => ({ line, highlight })))
            .flatten<{ line: number; highlight: HighlightResponse }>()
            .groupBy(z => z.line)
            .value();

        responses.clear();
        each(groupedItems, (item: { highlight: HighlightResponse }[], key: number) => {
            if (!responses.has(+key)) {
                responses.set(+key, item.map(x => x.highlight));
            }
        });
    };
}

extend(Grammar.prototype, AtomGrammar.prototype);

Grammar.prototype.omnisharp = true;
Grammar.prototype.tokenizeLine = function(line: string, ruleStack: any[], firstLine = false): { tags: number[]; ruleStack: any } {
    var baseResult = AtomGrammar.prototype.tokenizeLine.call(this, line, ruleStack, firstLine);

    if (this.responses) {
        var row = this['__row__'];

        if (!this.responses.has(row)) return baseResult;

        var tags = this.getCsTokensForLine(this.responses.get(row), line, row, ruleStack, firstLine, baseResult.tags);
        baseResult.tags = tags;
    }
    return baseResult;
}

Grammar.prototype.getCsTokensForLine = function(highlights: HighlightResponse[], line: string, row: number, ruleStack: any[], firstLine, tags: number[]) {
    ruleStack = [{ rule: this.getInitialRule() }];

    each(highlights, function(highlight) {
        var start = highlight.StartColumn;
        var end = highlight.EndColumn

        if (highlight.EndLine > highlight.StartLine && highlight.EndLine !== row) {
            start = 0;
            end = line.length;
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

        var size = end - start;
        if (tags[index] !== size) {
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
        }

        var str = line.substring(start, end);
        getAtomStyleForToken(tags, highlight, index, str);
    });

    return tags;
}

var getIdForScope = (function() {
    var csharpGrammar = find(atom.grammars.getGrammars(), grammar => grammar.name === 'C#');
    var ids: { [key: string]: number } = {};
    each(csharpGrammar.registry.scopesById, (value: string, key: any) => { ids[value] = +key; });

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
function getAtomStyleForToken(tags: number[], token: HighlightResponse, index: number, str: string) {
    var previousScopes = [];

    for (var i = index - 1; i >= 0; i--) {
        if (tags[i] > 0)
            break;
        previousScopes.push(tags[i]);
    }

    var replacement = [tags[index]];

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
        case "struct name":
            add('constant.numeric.struct.source.cs');
            break;
        case "identifier":
            add('identifier.source.cs');
            break;
        case "class name":
            add('support.class.type.source.cs');
        case "delegate name":
            add('support.class.type.source.cs');
        case "enum name":
            add('support.class.type.enum.source.cs');
        case "delegate name":
            add('support.class.type.delegate.source.cs');
            break;
        case "interface name":
            add('support.class.type.interface.source.cs');
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
    if (replacement.length > 1) {
        tags.splice(index, 1, ...replacement);
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
