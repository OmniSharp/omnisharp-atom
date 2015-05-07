import Omni = require('../../omni-sharp-server/omni')

class Intellisense {

    public activate() {
        atom.commands.add('atom-workspace', 'omnisharp-atom:intellisense-dot',
            (event) => this.complete(event, '.'));

        atom.commands.add('atom-workspace', 'omnisharp-atom:intellisense-space',
            (event) => this.complete(event, ' '));
    }

    private complete(event: Event, char: string) {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            var view = atom.views.getView(editor);
            atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:confirm');
            editor.insertText(char);
            if (char == '.') {
                setTimeout(() => 
                    atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate') , 0);
            }
        }
    }
}
export = Intellisense
