import ClientManager = require('../../omni-sharp-server/client-manager');
import Client = require("../../omni-sharp-server/client");
import OmniSharpAtom = require('../omnisharp-atom');
import {each, indexOf, extend, has, map, flatten, contains, any} from "lodash";
import _ = require('lodash');
import {Observable, Subject, Scheduler} from "rx";
var AtomGrammar = require((<any> atom).config.resourcePath + "/node_modules/first-mate/lib/grammar.js");
var Range: typeof TextBuffer.Range = <any>require('atom').Range;

class Highlight {
    public activate() {
        OmniSharpAtom.onEditor((editor: Atom.TextEditor) => {
            editor['_setGrammar'] = editor.setGrammar;
            editor.setGrammar = setGrammar;
            editor.setGrammar(editor.getGrammar());
        });
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

    var tokenizationComplete = new Subject<any>();
    var bufferpreemptDidChange = new Subject<any>();
    var bufferDidChange = new Subject<any>();
    editor.displayBuffer.tokenizedBuffer.onDidTokenize(() => tokenizationComplete.onNext(true));


    var client = ClientManager.getClientForEditor(this.editor);
    if (client) {
        client.request<HighlightRequest, HighlightResponse[]>("highlight", {
            FileName: this.editor.getPath(),
            Lines: []
        })
            .subscribe(responses => {
                this.responses = responses;
                editor.displayBuffer.tokenizedBuffer.retokenizeLines();
            });
    }

    editor.buffer.onDidChange((e) => {
        bufferDidChange.onNext(e);
    })

    editor.buffer.preemptDidChange((e) => {
        bufferpreemptDidChange.onNext(e);
        // Any new lines... we need to full highlight again.
        let retokenize: Observable<any>;
        if (any(e.newText, (z: string) => z.charCodeAt(0) === 10) || any(e.oldText, (z: string) => z.charCodeAt(0) === 10)) {
            this.responses = [];
            retokenize = bufferDidChange.take(1)
        }

        var client = ClientManager.getClientForEditor(this.editor);
        if (client) {
            var request : HighlightRequest = <any>client.makeRequest(editor);
            request.Lines = [];
            Observable.combineLatest(retokenize || Observable.empty(),
            client.request<HighlightRequest, HighlightResponse[]>("highlight", request), (r, response) => response)
                //.delay(100)
                .subscribe(responses => {
                    this.responses = responses;
                    if (retokenize) {
                        editor.displayBuffer.tokenizedBuffer.retokenizeLines();
                    }
                });
        }
    });
    this.responses = [];
}

extend(Grammar.prototype, AtomGrammar.prototype);

Grammar.prototype.omnisharp = true;
Grammar.prototype.tokenizeLine = function(line: string, ruleStack: any[], firstLine = false) {
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
        return this.convertCsTokensToAtomTokens(this.getCsTokensForLine(this.responses, line));
    } else {
        return this.base.tokenizeLine(line, ruleStack, firstLine);
    }
}

Grammar.prototype.convertCsTokensToAtomTokens = function(csTokensWithRuleStack) {
    var tokens = flatten(csTokensWithRuleStack.tokens).map((info: any) => {
        var atomToken = this.registry.createToken(info.str, ["source.cs"].concat(info.style));
        return atomToken;
    });

    return { tokens, ruleStack: csTokensWithRuleStack.ruleStack };
}

Grammar.prototype.getCsTokensForLine = function(responses: HighlightResponse[], line: string): any {
    var editor: Atom.TextEditor = this.editor;
    var index = indexOf(editor.getBuffer().getLines(), line);

    var highlights = _(responses)
        .filter(response => findLine(response, index))
        .value();

    var ruleStack = [this.getInitialRule()/*output.finalLexState*/];
    // TypeScript classifier returns empty for "". But Atom wants to have some Token and it needs to be "whitespace" for autoindent to work
    if (!highlights.length) return { tokens: [{ style: ['whitespace'], str: '' }], ruleStack: ruleStack };

    // Start with trailing whitespace taken into account.
    // This is needed because classification for that is already done by ATOM internally (somehow)
    var totalLength = this.trailingWhiteSpaceLength;
    var tokens = map(highlights, highlight => {
        var results = [];
        var start = highlight.Start.Character + this.trailingWhiteSpaceLength;
        var end = highlight.End.Character + this.trailingWhiteSpaceLength;

        if (start > totalLength) {
            var whitespace = start - totalLength;
            for (let i = 0; i < whitespace; i++) {
                results.push({ style: ['whitespace'], str: ' ' });
            }
        }

        var str = line.substring(start, end);
        var style = getAtomStyleForToken(highlight, str);

        results.push({ style: [style], str: str });
        totalLength = end;
        return results;
    });

    if (line.length > totalLength) {
        tokens.push([{ style: ['whitespace'], str: line.substr(totalLength) }])
    }

    return { tokens, ruleStack };
}

/// NOTE: best way I have found for these is to just look at theme "less" files
// Alternatively just inspect the token for a .js file
function getAtomStyleForToken(token: HighlightResponse, str: string): string {
    switch (token.Kind) {
        case "punctuation":
            switch (str) {
                case '{':
                    return "punctuation.section.scope.begin.cs";
                case '}':
                    return "punctuation.section.scope.end.cs";
                case ')':
                    return "meta.brace.round.cs";
                case '(':
                    return "meta.brace.round.cs";
                case ';':
                    return "punctuation.terminator.statement.cs";
                default:
                    return "punctuation";
            }
        case "keyword":
            switch (str) {
                case 'static':
                case 'public':
                case 'private':
                case 'protected':
                case 'export':
                case 'get':
                case 'set':
                    return 'support.function';
                case 'class':
                case 'module':
                case 'var':
                    return 'storage.modifier';
                case 'function':
                    return 'storage.type.function';
                case 'string':
                case 'number':
                case 'void':
                case 'boolean':
                    return 'keyword';
                default:
                    return 'keyword';
            }
        case "number":
            return 'constant.numeric';
        case "string":
            return "string";
        case "operator":
            return 'keyword.operator.cs';
        case "comment":
            return 'comment.block';
        case "identifier":
            return 'identifier';
        case "class name":
        case "enum name":
            return 'support.class';
        case "interface name":
            return 'support.function';
        case "preprocessor keyword":
            return 'constant.other.symbol';
        case "excluded code":
            return "comment";
        default:
            console.log(`unhandled Kind ${token.Kind}`);
            return 'keyword'; // This should not happen
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

export = Highlight;
