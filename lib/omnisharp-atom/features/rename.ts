import _ = require('lodash')
import {CompositeDisposable} from "rx";
import RenameView = require('../views/rename-view')
import Omni = require('../../omni-sharp-server/omni');
import Changes = require('../services/apply-changes')

class Rename implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private renameView: RenameView;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.renameView = new RenameView();
        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:rename', (e) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            this.rename();
        }));

        this.disposable.add(Omni.listener.observeRename.subscribe((data) => {
            this.applyAllChanges(data.response.Changes);
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public rename() {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            var wordToRename: string = <any>editor.getWordUnderCursor();
            // Word under cursor can sometimes return the open bracket if the word is selected.
            wordToRename = _.trimRight(wordToRename, '(');
            atom.workspace.addTopPanel({
                item: this.renameView
            });
        }
        return this.renameView.configure(wordToRename);
    }

    public applyAllChanges(changes: OmniSharp.Models.ModifiedFileResponse[]) {
        return _.each(changes, (change) => {
            atom.workspace.open(change.FileName, undefined)
                .then((editor) => { Changes.applyChanges(editor, change); })
        });
    }

    public required = true;
    public title = 'Rename';
    public description = 'Adds command to rename symbols.';
}
export var rename = new Rename
