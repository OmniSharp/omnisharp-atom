import {CompositeDisposable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import Changes = require('./lib/apply-changes');

class CodeFormat implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:code-format',
            () => {
                var editor = atom.workspace.getActiveTextEditor();
                if (editor) {
                    var buffer = editor.getBuffer();
                    Omni.request(editor, client => {
                        var request = <OmniSharp.Models.FormatRangeRequest>client.makeRequest();
                        request.Line = 0;
                        request.Column = 0;
                        request.EndLine = buffer.getLineCount() - 1;
                        request.EndColumn = 0;

                        return client
                            .formatRangePromise(request)
                            .then((data) => Changes.applyChanges(editor, data));
                    });
                }
            }));

        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:code-format-on-semicolon',
            (event) => this.formatOnKeystroke(event, ';')));
        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:code-format-on-curly-brace',
            (event) => this.formatOnKeystroke(event, '}')));
    }

    public dispose() {
        this.disposable.dispose();
    }

    private formatOnKeystroke(event: Event, char: string): any {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            editor.insertText(char);

            Omni.request(editor, client => {
                var request = <OmniSharp.Models.FormatAfterKeystrokeRequest>client.makeRequest();
                request.Character = char;

                return client.formatAfterKeystrokePromise(request)
                    .then((data) => Changes.applyChanges(editor, data));
            });
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        return false;
    }
}
export var codeFormat = new CodeFormat
