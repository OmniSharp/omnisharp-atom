var Range = require('atom').Range;
import {Observable} from "rx";

class Changes {
    public applyChanges(editor: Atom.TextEditor, response: { Changes: OmniSharp.Models.LinePositionSpanTextChange[]; });
    public applyChanges(editor: Atom.TextEditor, response: { Buffer: string });
    public applyChanges(editor: Atom.TextEditor, response: any) {
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

    public applyAllChanges(changes: OmniSharp.Models.ModifiedFileResponse[]) {
        return Observable.from(changes)
            .concatMap(change => atom.workspace.open(change.FileName, undefined)
                .then(editor => {
                    var pane: HTMLElement = <any>atom.views.getView(atom.workspace.getActivePane());
                    var title = pane.querySelector('.title.temp');
                    var tab = pane.querySelector('.preview-tab.active');
                    if (title) {
                        title.classList.remove('temp');
                    }
                    if (tab) {
                        tab.classList.remove('preview-tab');
                        (<any>tab).isPreviewTab = false;
                    }
                    this.applyChanges(editor, change);
                }))
            .subscribe();
    }
}

export var changes = new Changes;
