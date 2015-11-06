var Range = require('atom').Range;
import {Observable} from "rx";


export function applyChanges(editor: Atom.TextEditor, response: { Changes: OmniSharp.Models.LinePositionSpanTextChange[]; });
export function applyChanges(editor: Atom.TextEditor, response: { Buffer: string });
export function applyChanges(editor: Atom.TextEditor, response: any) {
    if (response && response.Changes) {
        var buffer = editor.getBuffer();
        var checkpoint = buffer.createCheckpoint();

        response.Changes.forEach((change) => {
            var range = new Range([change.StartLine, change.StartColumn], [change.EndLine, change.EndColumn]);
            buffer.setTextInRange(range, change.NewText);
        });

        buffer.groupChangesSinceCheckpoint(checkpoint);
    } else if (response && response.Buffer) {
        editor.setText(response.Buffer)
    }
}

// If you have preview tabs enabled,
//     they will actually try to close
//     with changes still.
function resetPreviewTab() {
    var pane: HTMLElement = <any>atom.views.getView(atom.workspace.getActivePane());
    if (pane) {
    var title = pane.querySelector('.title.temp');
    if (title) {
        title.classList.remove('temp');
    }

    var tab = pane.querySelector('.preview-tab.active');
    if (tab) {
        tab.classList.remove('preview-tab');
        (<any>tab).isPreviewTab = false;
    }
    }
}

export function applyAllChanges(changes: OmniSharp.Models.ModifiedFileResponse[]) {
    resetPreviewTab();
    return Observable.from(changes || [])
        .concatMap(change => atom.workspace.open(change.FileName, undefined)
            .then(editor => {
                resetPreviewTab();
                applyChanges(editor, change);
            }))
        .subscribe();
}
