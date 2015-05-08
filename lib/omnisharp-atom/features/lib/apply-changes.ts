var Range = require('atom').Range;

class Changes {
    public static applyChanges(editor: Atom.TextEditor, changes: OmniSharp.Models.LinePositionSpanTextChange[]) {
        var buffer = editor.getBuffer();

        changes.forEach((change) => {
            var range = new Range([change.StartLine - 1, change.StartColumn - 1], [change.EndLine - 1, change.EndColumn - 1]);
            buffer.setTextInRange(range, change.NewText);
        });
    }
}

export = Changes
