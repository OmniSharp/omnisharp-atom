import Omni = require('../../omni-sharp-server/omni');
import OmniSharpAtom = require('../omnisharp-atom');
import _ = require('lodash');
import EventKit = require('event-kit');

function updateBuffer(editor: Atom.TextEditor) {
    if (!editor) return;

    Omni.enqueue(editor, client => {
        var request = client.makeRequest();
        request.Buffer = editor.getText();
        return client.updatebufferPromise(request);
    });
}

function changeBuffer(editor: Atom.TextEditor, event: any) {
    if (!editor) return;
    //if marker exists then buffer was changed from server changes
    // don't send to server again.
    var markers = editor.getBuffer().findMarkers({ "omnisharp-buffer": false });

    if (markers.length > 0) {
        markers.forEach(marker => marker.destroy());
        return;
    }

    var request = <OmniSharp.Models.ChangeBufferRequest>{
        FileName: editor.getPath(),
        StartLine: event.oldRange.start.row + 1,
        StartColumn: event.oldRange.start.column + 1,
        EndLine: event.oldRange.end.row + 1,
        EndColumn: event.oldRange.end.column + 1,
        NewText: event.newText
    };

    Omni.enqueue(editor, client => client.changebufferPromise(request));
}

class BufferUpdater {
    private disposables: EventKit.CompositeDisposable;
    private editor: Atom.TextEditor;
    private emitter: EventKit.Emitter;

    constructor(editor: Atom.TextEditor) {
        this.disposables = new EventKit.CompositeDisposable();
        this.emitter = new EventKit.Emitter();
        this.editor = editor;

        var buffer = editor.getBuffer();

        this.disposables.add(buffer.onDidSave(() => updateBuffer(editor)));
        this.disposables.add(buffer.onDidReload(() => updateBuffer(editor)));
        this.disposables.add(buffer.onDidDestroy(() => this.dispose()));
        this.disposables.add(buffer.onDidChange(event => changeBuffer(editor, event)));
    }

    public dispose() {
        this.disposables.dispose();
        this.emitter.emit('on-destroy');
    }

    public onDidDestroy(callback: any): EventKit.Disposable {
        return this.emitter.on('on-destroy', callback);
    }
}

class BufferFeature {
    private disposables: EventKit.CompositeDisposable;
    private bufferUpdaters: Array<BufferUpdater>;

    constructor() {
        this.disposables = new EventKit.CompositeDisposable();
        this.bufferUpdaters = new Array<BufferUpdater>();
    }

    public activate() {

        this.disposables.add(OmniSharpAtom.onEditor((editor: Atom.TextEditor) => {
            var updater = new BufferUpdater(editor);
            this.bufferUpdaters.push(updater);
            this.disposables.add(updater.onDidDestroy(() => {
                var index = this.bufferUpdaters.indexOf(updater);
                if (index > -1)
                    this.bufferUpdaters.splice(index, 1);
            }));

        }));

        OmniSharpAtom.activeEditor.subscribe(updateBuffer);
    }

    public destroy() {
        this.disposables.dispose();
        this.bufferUpdaters.forEach(updater => updater.dispose());
    }
}

export = BufferFeature;
