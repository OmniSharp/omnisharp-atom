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
        this.on('core:confirm', () => this.rename());
        this.on('core:cancel', () => this.destroy());
    }

    public configure(wordToRename) {
        this.miniEditor.setText(wordToRename);
        return this.miniEditor.focus();
    }

    public rename() {
        Omni.client.renamePromise(Omni.makeDataRequest({
            RenameTo: this.miniEditor.getText()
        }));
        return this.destroy();
    }

    public destroy() {
        this.miniEditor.setText('');
        return this.detach();
    }
}
export = RenameView
