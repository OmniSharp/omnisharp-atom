import path = require('path');
import OmniSharpServer = require('../../omni-sharp-server/omni-sharp-server');
import Omni = require('../../omni-sharp-server/omni');
import OmniSharpAtom = require('../omnisharp-atom');

class PackageRestore {
    private editorDestroyedSubscription: EventKit.Disposable;
    constructor(private atomSharper: typeof OmniSharpAtom) {
        this.registerEventHandlerOnEditor = this.registerEventHandlerOnEditor;
        this.activate = this.activate;
        this.atomSharper = atomSharper;
    }

    public activate = () => {
        this.atomSharper.onConfigEditor((editor: Atom.TextEditor) => this.registerEventHandlerOnEditor(editor));
        this.editorDestroyedSubscription = this.atomSharper.onConfigEditorDestroyed((filePath) => { });
    }

    public registerEventHandlerOnEditor = (editor: Atom.TextEditor) => {
        var filename = path.basename(editor.getPath());
        if (filename === 'project.json') {
            return editor.getBuffer().onDidSave(() => {
                Omni.client.filesChangedPromise([{
                    FileName: editor.getPath()
                }]);
            });
        }
    }

    public deactivate = function() {
        this.editorSubscription.destroy();
    }
}

export = PackageRestore;
