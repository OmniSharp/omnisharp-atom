var Range = require('atom').Range;

class Changes {
    public static applyChanges(editor: Atom.TextEditor, changes: OmniSharp.Models.LinePositionSpanTextChange[]) {
        var buffer = editor.getBuffer();
        var checkpoint = buffer.createCheckpoint();
        changes.forEach((change) => {
            var range = new Range([change.StartLine, change.StartColumn], [change.EndLine, change.EndColumn]);
            buffer.setTextInRange(range, change.NewText);
        });
        buffer.groupChangesSinceCheckpoint(checkpoint);
    }
}

export = Changes
