import _ = require('lodash')
import RenameView = require('../views/rename-view')
import Omni = require('../../omni-sharp-server/omni')

class Rename {
    private renameView: RenameView

    public activate() {
        this.renameView = new RenameView();
        atom.commands.add('atom-text-editor', 'omnisharp-atom:rename', () => this.rename());
        Omni.registerConfiguration(client => {
            client.observeRename.subscribe((data) => {
                this.applyChanges(data.response.Changes)
            })
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

    public applyChanges(changes: any[]) {
        return _.each(changes, (change) => atom.workspace.open(change.FileName, undefined)
            .then((editor) => editor.setText(change.Buffer)))
    }
}
export =  Rename
