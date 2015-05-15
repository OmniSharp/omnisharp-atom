import Omni = require('../../omni-sharp-server/omni');
import OmniSharpAtom = require('../omnisharp-atom');
import OmniSharpClient = require('omnisharp-client');
import _ = require('lodash');
//import omnisharp = require("omnisharp-client");

class Range implements OmniSharp.Models.ChangeBufferRequest {
    FileName: string;
    StartLine: number;
    StartColumn: number;
    EndLine: number;
    EndColumn: number;
    NewText: string;
}

class BufferUpdater {

    public activate() {

        // add temp command to update complete buffer
        atom.commands.add('atom-workspace', 'omnisharp-atom:temp', () => this.updateBuffer());
        OmniSharpAtom.onEditor((editor: Atom.TextEditor) => {

            editor.getBuffer()
            .onDidChange(event => {
                console.log(event);

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

    }

    public updateBuffer() {
        var editor = atom.workspace.getActiveTextEditor();
        var request = <OmniSharp.Models.FormatRangeRequest>Omni.makeRequest(editor);

        request.Buffer = editor.getBuffer().getLines().join('\n');

        Omni.client.updatebufferPromise(request);
    }
}

export = BufferUpdater;
