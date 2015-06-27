import Omni = require('../../omni-sharp-server/omni');
import {DriverState} from "omnisharp-client";
import OmniSharpAtom = require('../omnisharp-atom');
import {each, indexOf, extend, has, map, flatten, contains, any, range, remove, pull, find, defer, startsWith, trim, isArray} from "lodash";
import {Observable, Subject, Scheduler, CompositeDisposable, Disposable} from "rx";
import * as _ from "lodash";
var AtomGrammar = require((<any> atom).config.resourcePath + "/node_modules/first-mate/lib/grammar.js");
var Range: typeof TextBuffer.Range = <any>require('atom').Range;


class Highlight implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(
            Observable.merge(
                Omni.listener.state
                    .where(state => state === DriverState.Connected)
                    .flatMap(Omni.editors), Omni.activeEditor
                )
                .flatMapLatest(editor =>
                    Omni.request(editor, client => client.request<HighlightRequest, HighlightResponse[]>("highlight", {
                        FileName: editor.getPath(),
                        Lines: []
                    })).map(responses => ({ editor, responses }))
                    )
                .subscribe(function({editor, responses}) {
                    (<any>editor.getGrammar()).responses = responses;
                    //if (retokenize) {
                    editor.displayBuffer.tokenizedBuffer['silentRetokenizeLines']();
                    //}
                }));

        this.disposable.add(Omni.editors
            .subscribe(editor => this.setupEditor(editor)));
    }

    public dispose() {
        this.disposable.dispose();
    }

    private setupEditor(editor: Atom.TextEditor) {
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

        var disposable = Disposable.create(() => defer(() => {
            editor.setGrammar = editor['_setGrammar'];
            editor.displayBuffer.tokenizedBuffer.buildTokenizedLineForRowWithText = editor.displayBuffer.tokenizedBuffer['_buildTokenizedLineForRowWithText'];
            editor.setGrammar(editor['_oldGrammar']);
        }));

        this.disposable.add(editor.onDidDestroy(() => {
            disposable.dispose();
            this.disposable.remove(disposable);
        }));
        this.disposable.add(disposable);
    }
}

interface HighlightRequest {
    FileName: string;
    Lines?: number[];
}

interface HighlightResponse {
    Start: { Character: number; Line: number; };
    End: { Character: number; Line: number; };
    Kind: string;
}

function Grammar(editor: Atom.TextEditor, base: FirstMate.Grammar) {
    this.editor = editor;
    this.base = base;

    var handleResponse = (responses: HighlightResponse[]) => {
        this.responses = responses;
    }

    Omni.request(editor, client => client.request<HighlightRequest, HighlightResponse[]>("highlight", {
        FileName: editor.getPath(),
        Lines: []
    }));

    var disposable = editor.buffer.preemptDidChange((e) => {
        var {oldRange, newRange} = e,
            start = oldRange.start.row,
            end = oldRange.end.row,
            delta = newRange.end.row - oldRange.end.row;

        // Any new lines... we need to full highlight again.
        let retokenize = false;
        if (any(e.newText, (z: string) => z.charCodeAt(0) === 10) || any(e.oldText, (z: string) => z.charCodeAt(0) === 10)) {
            //this.responses = [];
            retokenize = true;
        }

        if (!this.responses || !this.responses.length) {
            retokenize = true;
        }

        Omni.request(editor, client => client.request<HighlightRequest, HighlightResponse[]>("highlight", <HighlightRequest>client.makeRequest(editor)));
    });

    this.responses = [];
}

function getHighlightRows(responses: HighlightResponse[], row: number) {
    return _(responses)
        .filter(response => findLine(response, row))
        .value();
}

extend(Grammar.prototype, AtomGrammar.prototype);

Grammar.prototype.omnisharp = true;
Grammar.prototype.tokenizeLine = function(line: string, ruleStack: any[], firstLine = false): { tags: number[]; ruleStack: any } {
    // BOM handling:
    // NOTE THERE ARE OTHER BOMS. I just wanted a proof of concept.
    // Feel free to add here if you know of ones that are giving you pain.
    if (firstLine
        && line.length > 1
        && (line.charCodeAt(0) == 0xFFFE || line.charCodeAt(0) == 0xFEFF)) {
        this.trailingWhiteSpaceLength = 1;
    }
    else {
        this.trailingWhiteSpaceLength = 0;
    }

    if (this.responses && this.responses.length) {
        var baseResult = this.base.tokenizeLine.apply(this.base, arguments);
        if (startsWith(trim(line), '//')) {
            return baseResult;
        }

        var editor: Atom.TextEditor = this.editor;
        var row = this['__row__']

        var highlights = getHighlightRows(this.responses, row);
        if (!highlights.length) return baseResult;

        if (_.any(baseResult.tags, x => x === -1)) {
            debugger;
        }
        var r = this.getCsTokensForLine(highlights, line, row, ruleStack, firstLine, baseResult.tags);

        if (_.any(r.tags, x => x === -1)) {
            debugger;
        }
        return r;
    } else {
        return this.base.tokenizeLine.apply(this.base, arguments);
    }
}

Grammar.prototype.getCsTokensForLine = function(highlights: HighlightResponse[], line: string, row: number, ruleStack: any[], firstLine, tags: number[]) {
    ruleStack = [{ rule: this.getInitialRule() }];

    var replacements: { [key: number]: number[] } = {};

    each(highlights, highlight => {
        var start = highlight.Start.Character + this.trailingWhiteSpaceLength;
        var end = highlight.End.Character + this.trailingWhiteSpaceLength;

        if (highlight.End.Line > highlight.Start.Line && highlight.End.Line !== row) {
            start = 0;
            end = line.length;
        }

        //var index = tagMap[start];
        var distance = 0;
        var index = -1;
        for (var i = 0; i < tags.length; i++) {
            if (tags[i] > 0) {
                distance += tags[i];
                if (distance > start) {
                    index = i;
                    break;
                }
            }
        }

        
        /*if (tags[index] !== end - start - 1) {
            var size = end - start - 1;

            if (replacements[index]) {
                var replacement = replacements[index];
                var key = _.findIndex(replacement, x => x > 0);

                replacement[key] = size;
            }

            for (var k = size; k < tags[index]; k++) tagMap[k] = tagMap[k] + 1;

            //if (tags[index] - size === -1)
            //{
                //tags[index] = size;
                //debugger;
            //}

            //tags.splice(index, 1, size, tags[index] - size);
        }*/

        var str = line.substring(start, end);
        getAtomStyleForToken(tags, replacements, highlight, index, str);
    });

    each(<any>replacements, (value: number[], key: number) => {
        tags[key] = <any>value;
    })

    tags = flatten<number>(tags);

    return { line, tags, ruleStack };
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
function getAtomStyleForToken(tags: number[], replacements: { [key: number]: number[] }, token: HighlightResponse, index: number, str: string) {
    var previousScopes = [];

    if (!replacements[index]) {
        replacements[index] = [tags[index]];
    }

    var replacement = replacements[index];
    if (_.any(replacement.tags, x => x === -1)) {
        debugger;
    }

    for (var i = 0; i < replacement.length; i++) {
        if (replacement[i] > 0)
            break;
        previousScopes.push(replacement[i]);
    }

    for (var i = index - 1; i >= 0; i--) {
        if (tags[i] > 0)
            break;
        previousScopes.push(tags[i]);
    }

    function add(scope: string) {
        var id = getIdForScope(scope);
        if (id === -1) return;
        if (!_.any(previousScopes, z => z === id)) {
            previousScopes.push(id);
        }

        replacement.unshift(id);
        replacement.push(getIdForScope.end(id))
    }

    switch (token.Kind) {
        case "number":
        case "struct name":
            add('constant.numeric.source.cs');
            break;
        case "comment":
            add('comment.block.source.cs');
            break;
        case "identifier":
            add('identifier.source.cs');
            break;
        case "class name":
        case "enum name":
            add('support.class.type.source.cs');
            break;
        case "interface name":
            add('support.class.type.interface.source.cs');
            break;
        //ends.push('support.function');
        case "preprocessor keyword":
            add('constant.other.symbo.source.csl');
            break;
        case "excluded code":
            add('comment.block.source.cs');
            break;
        case "string":
        case "operator":
        case "punctuation":
        case "keyword":
            break;
        default:
            console.log(`unhandled Kind ${token.Kind}`);
            add('keyword.source.cs'); // This should not happen
            break;
    }
}

function findLine(response: HighlightResponse, index: number) {
    if (response.Start.Line === index || response.End.Line === index) {
        return true;
    }

    if (response.Start.Line < index && response.End.Line > index) {
        return true;
    }

    return false;
}

function setGrammar(grammar: FirstMate.Grammar): FirstMate.Grammar {
    if (!grammar['omnisharp'] && (grammar.name === 'C#' || grammar.name === 'C# Script File')) {
        var newGrammar = new Grammar(this, grammar);
        each(grammar, (x, i) => has(grammar, i) && (newGrammar[i] = x));
        grammar = newGrammar;
    }
    return this._setGrammar(grammar);
}

atom.config.onDidChange("omnisharp-atom.enhancedHighlighting", a => {
    this.enabled = atom.config.get<boolean>("omnisharp-atom.enhancedHighlighting");
    if (this.enabled) {
        highlight.activate();
    } else {
        highlight.dispose();
    }
});

export var highlight = new Highlight;
