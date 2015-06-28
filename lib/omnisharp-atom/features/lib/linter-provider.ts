import Omni = require('../../../omni-sharp-server/omni')
var Range = require('atom').Range;
import _ = require('lodash');


interface LinterError {
    type: string; // 'error' | 'warning'
    text?: string;
    html?: string;
    filePath?: string,
    range?: Range
}


function getWordAt(str: string, pos: number) {

    var wordLocation = {
        start: pos,
        end: pos
    }

    if (str === undefined) {
        return wordLocation;
    }

    while (pos < str.length && /\W/.test(str[pos])) {
        ++pos;
    }

    var left = str.slice(0, pos + 1).search(/\W(?!.*\W)/);
    var right = str.slice(pos).search(/(\W|$)/);

    wordLocation.start = left + 1;
    wordLocation.end = wordLocation.start + right;

    return wordLocation;
}


function mapValues(input: OmniSharp.Models.QuickFix[], editor: Atom.TextEditor): LinterError[] {
    return _.map(input, (error: OmniSharp.Models.DiagnosticLocation): LinterError => {
        var line = error.Line;
        var column = error.Column;
        var text = editor.lineTextForBufferRow(line);
        var wordLocation = getWordAt(text, column);
        var level = error.LogLevel.toLowerCase();

        if (level === "hidden") {
            level = "info"
        }

        return {
            text: `${error.Text} [${Omni.getFrameworks(error.Projects) }] `,
            line: line + 1,
            col: column + 1,
            type: level,
            range: new Range([line, wordLocation.start], [line, wordLocation.end])
        }
    });
}

exports.provider = {
    grammarScopes: ['source.cs'],
    scope: 'file',
    lintOnFly: true,
    lint: (editor: Atom.TextEditor) => {

        return new Promise((resolve, reject) => {
            Omni.activeEditor.first()
                .where(editor => editor === editor)
                .flatMap(editor => Omni.request(editor, client => client.codecheck(client.makeRequest(editor))))
                .subscribe(data => {
                    var errors = mapValues(data.QuickFixes, editor);
                    resolve(errors);
                })

        });

    }
}
