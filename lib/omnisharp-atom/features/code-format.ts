import Omni = require('../../omni-sharp-server/omni')

class CodeFormat {

    public activate() {
        atom.commands.add('atom-workspace', 'omnisharp-atom:code-format', () => Omni.codeFormat())
        atom.emitter.on("omni:code-format", (d) => {
            var editor = atom.workspace.getActiveTextEditor();
            if (editor) {
                editor.setText(d.Buffer);
            }
        });
    }
}
export = CodeFormat
