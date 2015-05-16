import Omni = require('../../omni-sharp-server/omni');
import OmniSharpAtom = require('../omnisharp-atom');
import OmniSharpClient = require('omnisharp-client');
import _ = require('lodash');


class BufferUpdater {


    public activate() {

        OmniSharpAtom.onEditor((editor: Atom.TextEditor) => {

            var buffer = editor.getBuffer();

            buffer.onDidChange(event => {
                if (Omni.vm.isNotReady) return;

                //if marker exists then buffer was changed from server changes
                // don't send to server again.
                var markers = buffer.findMarkers({"omnisharp-buffer": false});

                if (markers.length > 0) {
                    markers.forEach(marker => marker.destroy());
                    return;
                }

                var request = <OmniSharp.Models.ChangeBufferRequest>{
                        FileName: editor.getPath(),
                        StartLine: 0,
                        StartColumn: 0,
                        EndLine: 0,
                        EndColumn: 0,
                        NewText: event.newText
                    };

                request.StartLine = event.oldRange.start.row + 1;
                request.StartColumn = event.oldRange.start.column + 1;
                request.EndLine = event.oldRange.end.row + 1;
                request.EndColumn = event.oldRange.end.column + 1;

                Omni.client.changebuffer(request);

            });
        });

        atom.workspace.observeActivePaneItem((pane: Atom.Pane) => {
            this.updateBuffer(atom.workspace.getActiveTextEditor());
        });
    }

    public updateBuffer(editor: Atom.TextEditor) {
        if (Omni.vm.isNotReady || editor === undefined) return;

        var request = <OmniSharp.Models.FormatRangeRequest>Omni.makeRequest(editor);

        //TODO: enable to create request with or without the buffer
        request.Buffer = editor.getBuffer().getLines().join('\n');

        Omni.client.updatebufferPromise(request);
    }

}

export = BufferUpdater;
