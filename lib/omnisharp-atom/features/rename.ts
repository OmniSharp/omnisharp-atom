import _ = require('lodash')
import RenameView = require('../views/rename-view')
import Omni = require('../../omni-sharp-server/omni');
import Changes = require('./lib/apply-changes')
import OmnisharpAtom = require('../omnisharp-atom');

class Rename {
    private renameView: RenameView

    public activate() {
        this.renameView = new RenameView();
        OmnisharpAtom.addCommand('omnisharp-atom:rename', (e) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            this.rename();
        });

        Omni.listen.observeRename.subscribe((data) => {
            this.applyAllChanges(data.response.Changes);
        });
    }

    public rename() {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            var wordToRename = editor.getWordUnderCursor();
            atom.workspace.addTopPanel({
                item: this.renameView
            });
        }
        return this.renameView.configure(wordToRename);
    }

    public applyAllChanges(changes: any[]) {
        return _.each(changes, (change) => {
            atom.workspace.open(change.FileName, undefined)
                .then((editor) => { Changes.applyChanges(editor, change.Changes); })
        });
    }
}
export =  Rename
