import ClientManager = require('../../omni-sharp-server/client-manager');
import Client = require("../../omni-sharp-server/client");
import OmniSharpAtom = require('../omnisharp-atom');
import {each, indexOf} from "lodash";
var Range: typeof TextBuffer.Range = <any>require('atom').Range;

class Highlight {
    public activate() {
        OmniSharpAtom.onEditor((editor: Atom.TextEditor) => {
            new Highlighter(editor);
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

Grammar.prototype.tokenizeLine = function(line: string, ruleStack: any[], firstLine = false) {
    var editor : Atom.TextEditor = this.editor;
    var responses : HighlightResponse[] = this.responses;
    if (responses.length) {

    var index = indexOf(editor.getBuffer().getLines(), line) + 1;

    var highlights = _(responses)
        .filter(response => findLine(response, index));


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

function setGrammar(grammar: FirstMate.Grammar) : FirstMate.Grammar {
    if (grammar.name === 'C#' || grammar.name === 'C# Script File') {
        var newGrammar = new Grammar(this, grammar);
        this._setGrammar(newGrammar);
    }
    return undefined;
}

class Highlighter {
    constructor(private editor: Atom.TextEditor) {
        editor['_setGrammar'] = editor.setGrammar;
        editor.setGrammar = setGrammar;

    }

    public highlight() {
        var client = ClientManager.getClientForEditor(this.editor);
        if (client) {
            client.request<HighlightRequest, HighlightResponse[]>("highlight", {
                FileName: this.editor.getPath(),
                Lines: []
            }).toPromise().then(response => {
                each(response, item => {

                    var range = new Range([item.Start.Line, item.Start.Character], [item.End.Line, item.End.Character]);
                    var marker = this.editor.markBufferRange(range);
                    this.editor.decorateMarker(marker, {
                        type: "highlight",
                        class: "omnisharp-" + item.Kind
                    });
                })
            });
        }
    }
}

export = Highlight;
