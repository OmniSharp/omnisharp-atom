var spacePenViews = require('atom-space-pen-views')
var View = <any>spacePenViews.View;
var TextEditorView = <any>spacePenViews.TextEditorView;

import Omni = require('../../omni-sharp-server/omni')

class RenameView extends View {
    private wordToRename = null;
    private miniEditor: AtomCore.IEditor;

    public static content() {
        return this.div({
            "class": 'rename overlay from-top'
        }, () => {
                this.p({
                    outlet: 'message',
                    "class": 'icon icon-diff-renamed'
                }, 'Rename to:');
                return this.subview('miniEditor',
                    new TextEditorView({
                        mini: true
                    }));
            });
    }

    public initialize() {
        this.on('core:confirm', () => this.rename());
        return this.on('core:cancel', () => this.destroy());
    }

    public configure(wordToRename) {
        this.miniEditor.setText(wordToRename);
        return this.miniEditor.focus();
    }

    public rename() {
        Omni.rename(this.miniEditor.getText());
        return this.destroy();
    }

    public destroy() {
        this.miniEditor.setText('');
        return this.detach();
    }
}
export = RenameView
