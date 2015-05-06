import Omni = require('../../omni-sharp-server/omni')

var Range = require("atom").Range;

class CodeFormat {

    public activate() {
        atom.commands.add('atom-workspace', 'omnisharp-atom:code-format',
            () => {
                var editor = atom.workspace.getActiveTextEditor();
                if (editor) {
                    Omni.client
                        .codeformatPromise(Omni.makeRequest())
                        .then((data) => editor.setText(data.Buffer));
                }
            });

        atom.commands.add('atom-workspace', 'omnisharp-atom:code-format-on-semicolon',
            () => { this.formatOnKeystroke(';'); });
        atom.commands.add('atom-workspace', 'omnisharp-atom:code-format-on-curly-brace',
            () => { this.formatOnKeystroke('}'); });
    }

    private formatOnKeystroke(char: string): any {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            editor.insertText(char);

            var request = <OmniSharp.Models.FormatAfterKeystrokeRequest>Omni.makeRequest();
            request.Character = char;

            Omni.client.formatAfterKeystrokePromise(request)
                .then((data) => {
                var buffer = editor.getBuffer();

                data.Changes.forEach((change) => {
                    var range = new Range([change.StartLine - 1, change.StartColumn - 1], [change.EndLine - 1, change.EndColumn - 1]);
                    buffer.setTextInRange(range, change.NewText);
                });
            });
        }
    }
}
export = CodeFormat
