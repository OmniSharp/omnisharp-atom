import Omni = require('../../omni-sharp-server/omni')

class CodeFormat {

    public activate() {
        atom.commands.add('atom-workspace', 'omnisharp-atom:code-format',
            () => {
                var editor = atom.workspace.getActiveTextEditor();
                if (editor) {
                    Omni.client
                        .codeformatPromise(Omni.makeRequest())
                        .then((data) => editor.setText(data.Buffer));
                }
            });
    }
}
export = CodeFormat
