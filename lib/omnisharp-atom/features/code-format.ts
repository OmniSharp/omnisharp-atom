import Omni = require('../../omni-sharp-server/omni')
import Changes = require('./lib/apply-changes');

class CodeFormat {

    public activate() {
        atom.commands.add('atom-workspace', 'omnisharp-atom:code-format',
            () => {
                var editor = atom.workspace.getActiveTextEditor();
                if (editor) {
                    var buffer = editor.getBuffer();
                    var request = <OmniSharp.Models.FormatRangeRequest>Omni.makeRequest();

                    request.Line = 1;
                    request.Column = 1;
                    request.EndLine = buffer.getLineCount();
                    request.EndColumn = 1;
                    Omni.client
                        .formatRangePromise(request)
                        .then((data) => Changes.applyChanges(editor, data.Changes));
                }
            });

        atom.commands.add('atom-workspace', 'omnisharp-atom:code-format-on-semicolon',
            (event) => this.formatOnKeystroke(event, ';'));
        atom.commands.add('atom-workspace', 'omnisharp-atom:code-format-on-curly-brace',
            (event) => this.formatOnKeystroke(event, '}'));
    }

    private formatOnKeystroke(event: Event, char: string): any {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            editor.insertText(char);

            var request = <OmniSharp.Models.FormatAfterKeystrokeRequest>Omni.makeRequest();
            request.Character = char;

            Omni.client.formatAfterKeystrokePromise(request)
                .then((data) => Changes.applyChanges(editor, data.Changes));

        }
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        return false;
    }
}
export = CodeFormat
