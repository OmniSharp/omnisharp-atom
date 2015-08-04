var Range = require('atom').Range;

class Changes {
    public static applyChanges(editor: Atom.TextEditor, response: { Changes: OmniSharp.Models.LinePositionSpanTextChange[]; });
    public static applyChanges(editor: Atom.TextEditor, response: { Buffer: string });
    public static applyChanges(editor: Atom.TextEditor, response: any) {
        if (response.Changes) {
            var buffer = editor.getBuffer();
            var checkpoint = buffer.createCheckpoint();

            response.Changes.forEach((change) => {
                var range = new Range([change.StartLine, change.StartColumn], [change.EndLine, change.EndColumn]);
                buffer.setTextInRange(range, change.NewText);
            });

            buffer.groupChangesSinceCheckpoint(checkpoint);
        } else if (response.Buffer) {
            editor.setText(response.Buffer)
        }
    }
}

export = Changes
