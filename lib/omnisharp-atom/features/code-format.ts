import Omni = require('../../omni-sharp-server/omni')

class CodeFormat {

    public activate() {
        atom.commands.add('atom-workspace', 'omnisharp-atom:code-format', () => Omni.codeFormat())
        atom.on("omni:code-format", (d) => {
            var editor = atom.workspace.getActiveEditor();
            if (editor) {
                editor.setText(d.Buffer);
            }
        });
    }
}
export = CodeFormat
