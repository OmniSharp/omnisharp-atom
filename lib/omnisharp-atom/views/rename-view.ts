import spacePenViews = require('atom-space-pen-views')
var $ = spacePenViews.jQuery;
var TextEditorView = <any>spacePenViews.TextEditorView;

import Omni = require('../../omni-sharp-server/omni')

class RenameView extends spacePenViews.View {
    private wordToRename = null;
    private miniEditor: spacePenViews.TextEditorView;

    public static content() {
        return this.div({
            "class": 'rename overlay from-top'
        }, () => {
            this.p({
                outlet: 'message',
                "class": 'icon icon-diff-renamed'
            }, 'Rename to:');
            return this.subview('miniEditor',
                new spacePenViews.TextEditorView({
                    mini: true
                }));
        });
    }

    public initialize() {
        atom.commands.add(this[0], 'core:confirm', () => this.rename());
        atom.commands.add(this[0], 'core:cancel', () => this.destroy());
    }

    public configure(wordToRename) {
        this.miniEditor.setText(wordToRename);
        return this.miniEditor.focus();
    }

    public rename() {
        Omni.request(client => client.rename(client.makeDataRequest({
            RenameTo: this.miniEditor.getText(),
            WantsTextChanges: true
        })));
        return this.destroy();
    }

    public destroy() {
        this.miniEditor.setText('');
        return this.detach();
    }
}
export = RenameView;
