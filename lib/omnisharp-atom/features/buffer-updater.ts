import Omni = require('../../omni-sharp-server/omni');
import _ = require('lodash');
import {CompositeDisposable, Subject} from "rx";

function updateBuffer(editor: Atom.TextEditor) {
    if (!editor) return;

    Omni.enqueue(editor, client => {
        var request = client.makeRequest();
        request.Buffer = editor.getText();
        return client.updatebuffer(request, { silent: true });
    });
}

function changeBuffer(editor: Atom.TextEditor, event: any) {
    var request = <OmniSharp.Models.ChangeBufferRequest>{
        FileName: editor.getPath(),
        StartLine: event.oldRange.start.row,
        StartColumn: event.oldRange.start.column,
        EndLine: event.oldRange.end.row,
        EndColumn: event.oldRange.end.column,
        NewText: event.newText
    };

    Omni.enqueue(editor, client => client.changebuffer(request, { silent: true }));
}

class BufferFeature implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Omni.activeEditor.where(z => !!z)
            .subscribe(editor => {
                var cd = new CompositeDisposable();
                this.disposable.add(cd);
                cd.add(Omni.activeEditor.where(active => active !== editor).subscribe(() => {
                    cd.dispose();
                    this.disposable.remove(cd);
                }));

                cd.add(editor.onDidDestroy(() => {
                    cd.dispose();
                }));

                var buffer = editor.getBuffer();
                this.disposable.add(editor.onDidSave(() => updateBuffer(editor)));
                this.disposable.add(buffer.onDidReload(() => updateBuffer(editor)));
                this.disposable.add(buffer.onDidChange(event => changeBuffer(editor, event)));
            }));
    }

    public dispose() {
        this.disposable.dispose();
    }
}

export var bufferFeature = new BufferFeature;
