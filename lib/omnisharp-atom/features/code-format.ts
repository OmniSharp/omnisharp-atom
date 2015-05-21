import Omni = require('../../omni-sharp-server/omni')
import ClientManager = require('../../omni-sharp-server/client-manager');
import Changes = require('./lib/apply-changes');
import OmniSharpAtom = require('../omnisharp-atom')

class CodeFormat {

    public activate() {
        OmniSharpAtom.addCommand('omnisharp-atom:code-format',
            () => {
                var editor = atom.workspace.getActiveTextEditor();
                if (editor) {
                    var buffer = editor.getBuffer();
                    ClientManager.getClientForEditor(editor).subscribe(client => {
                        var request = <OmniSharp.Models.FormatRangeRequest>client.makeRequest();
                        request.Line = 1;
                        request.Column = 1;
                        request.EndLine = buffer.getLineCount();
                        request.EndColumn = 1;

                        client
                            .formatRangePromise(request)
                            .then((data) => Changes.applyChanges(editor, data.Changes));
                    })
                }
            });

        OmniSharpAtom.addCommand('omnisharp-atom:code-format-on-semicolon',
            (event) => this.formatOnKeystroke(event, ';'));
        OmniSharpAtom.addCommand('omnisharp-atom:code-format-on-curly-brace',
            (event) => this.formatOnKeystroke(event, '}'));
    }

    private formatOnKeystroke(event: Event, char: string): any {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            editor.insertText(char);

            ClientManager.getClientForEditor(editor).subscribe(client => {
                var request = <OmniSharp.Models.FormatAfterKeystrokeRequest>client.makeRequest();
                request.Character = char;

                client.formatAfterKeystrokePromise(request)
                    .then((data) => Changes.applyChanges(editor, data.Changes));
            });
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        return false;
    }
}
export = CodeFormat
