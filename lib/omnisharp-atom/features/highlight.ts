import ClientManager = require('../../omni-sharp-server/client-manager');
import Client = require("../../omni-sharp-server/client");
import OmniSharpAtom = require('../omnisharp-atom');
import {each, indexOf, extend, has} from "lodash";
import _ = require('lodash');
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
    editor.onDidStopChanging(() => {
        var client = ClientManager.getClientForEditor(this.editor);
        if (client) {
            client.request<HighlightRequest, HighlightResponse[]>("highlight", {
                FileName: this.editor.getPath(),
                Lines: []
            }).subscribe(responses => this.responses = responses);
        }
    });
    this.responses = [];
}

extend(Grammar.prototype, AtomGrammar.prototype);

Grammar.prototype.omnisharp = true;
Grammar.prototype.tokenizeLine = function(line: string, ruleStack: any[], firstLine = false) {
    var editor: Atom.TextEditor = this.editor;
    var responses: HighlightResponse[] = this.responses;
    if (responses.length) {

        var index = indexOf(editor.getBuffer().getLines(), line);

        var highlights = _(responses)
            .filter(response => findLine(response, index))
            .value();

        return this.base.tokenizeLine(line, ruleStack, firstLine);
    } else {
        return this.base.tokenizeLine(line, ruleStack, firstLine);
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
