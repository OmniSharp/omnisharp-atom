import Omni = require('../../omni-sharp-server/omni')

class Intellisense {

    public activate() {
        atom.commands.add('atom-workspace', 'omnisharp-atom:intellisense-dot',
            (event) => {
                this.complete(event, '.');
                setTimeout(() =>
                    atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), 'autocomplete-plus:activate'), 0);
            });

        atom.commands.add('atom-workspace', 'omnisharp-atom:intellisense-space',
            (event) => this.complete(event, ' '));
    }

    private complete(event: Event, char: string) {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            var view = atom.views.getView(editor);
            atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:confirm');
            editor.insertText(char);

            event.preventDefault();
            event.stopImmediatePropagation();
            event.stopPropagation();
            return false;
        }
    }
}
export = Intellisense
