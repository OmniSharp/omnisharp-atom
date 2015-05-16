var Range = require('atom').Range;
import Omni = require('../../../omni-sharp-server/omni');

class Changes {
    public static applyChanges(editor: Atom.TextEditor, changes: OmniSharp.Models.LinePositionSpanTextChange[]) {
        var buffer = editor.getBuffer();
        var checkpoint = buffer.createCheckpoint();
        changes.forEach((change) => {
            var range = new Range([change.StartLine - 1, change.StartColumn - 1], [change.EndLine - 1, change.EndColumn - 1]);
            buffer.markRange(range, {'omnisharp-buffer': false});
            buffer.setTextInRange(range, change.NewText);
        });
        buffer.groupChangesSinceCheckpoint(checkpoint);
    }
}

export = Changes
