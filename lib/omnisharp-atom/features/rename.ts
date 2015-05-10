import _ = require('lodash')
import RenameView = require('../views/rename-view')
import Omni = require('../../omni-sharp-server/omni')
import Changes = require('./lib/apply-changes')

class Rename {
    private renameView: RenameView

    public activate() {
        this.renameView = new RenameView();
        atom.commands.add('atom-text-editor', 'omnisharp-atom:rename', (e) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            this.rename();
        });
        Omni.registerConfiguration(client => {
            client.observeRename.subscribe((data) => {
                this.applyAllChanges(data.response.Changes);
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

    public applyAllChanges(changes: any[]) {
        var grouped = _.groupBy(changes, 'FileName');

        return _.each(grouped, (changesByFileName) => {
            var fileName = changesByFileName[0].FileName;
            var dedupedChanges = this.flattenAndDedupeChanges(changesByFileName);
            atom.workspace.open(fileName, undefined)
                .then((editor) => { Changes.applyChanges(editor, dedupedChanges); })
        });
    }

    private flattenAndDedupeChanges(changes) {
        // hacky workaround for a server issue that is waiting for a Roslyn fix.
        var changeLists = _.map(changes, (change) => { return change.Changes; });
        return  _.uniq(_.flatten(changeLists, true), false, (change) => {
            return change.StartColumn * 17 + change.StartLine * 23 + change.EndColumn * 31 + change.EndLine;
        });
    }
}
export =  Rename
