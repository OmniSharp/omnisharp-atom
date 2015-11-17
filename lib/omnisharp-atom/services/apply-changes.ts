import {OmniSharp} from "../../omnisharp.d.ts";
/* tslint:disable:variable-name */
const Range = require("atom").Range;
/* tslint:enable:variable-name */
import {Observable} from "@reactivex/rxjs";

function hasChanges(value: any): value is { Changes: OmniSharp.Models.LinePositionSpanTextChange[]; } {
    if (value.Changes) {
        return true;
    }
    return false;
}

export function applyChanges(editor: Atom.TextEditor, response: { Changes: OmniSharp.Models.LinePositionSpanTextChange[]; } | { Buffer: string }) {
    if (hasChanges(response)) {
        const buffer = editor.getBuffer();
        const checkpoint = buffer.createCheckpoint();

        response.Changes.forEach((change) => {
            const range = new Range([change.StartLine, change.StartColumn], [change.EndLine, change.EndColumn]);
            buffer.setTextInRange(range, change.NewText);
        });

        buffer.groupChangesSinceCheckpoint(checkpoint);
    } else if (response.Buffer) {
        editor.setText(response.Buffer)
    }
}

// If you have preview tabs enabled,
//     they will actually try to close
//     with changes still.
function resetPreviewTab() {
    const pane: HTMLElement = <any>atom.views.getView(atom.workspace.getActivePane());
    if (pane) {
    const title = pane.querySelector(".title.temp");
    if (title) {
        title.classList.remove("temp");
    }

    const tab = pane.querySelector(".preview-tab.active");
    if (tab) {
        tab.classList.remove("preview-tab");
        (<any>tab).isPreviewTab = false;
    }
    }
}

export function applyAllChanges(changes: OmniSharp.Models.ModifiedFileResponse[]) {
    resetPreviewTab();
    return Observable.from(changes)
        .concatMap(change => atom.workspace.open(change.FileName, undefined)
            .then(editor => {
                resetPreviewTab();
                applyChanges(editor, change);
            }))
        .subscribe();
}
