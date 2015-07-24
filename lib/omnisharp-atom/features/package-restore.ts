import {CompositeDisposable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import path = require('path');

class PackageRestore implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.configEditors.subscribe((editor: Atom.TextEditor) => {
            var disposer = this.registerEventHandlerOnEditor(editor);
            if (disposer) {
                this.disposable.add(disposer);

                editor.onDidDestroy(() => {
                    this.disposable.remove(disposer);
                    disposer.dispose();
                });
            }
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public registerEventHandlerOnEditor = (editor: Atom.TextEditor) => {
        var filename = path.basename(editor.getPath());
        if (filename === 'project.json') {
            return editor.getBuffer().onDidSave(() => {
                Omni.request(client => client.filesChanged([{
                    FileName: editor.getPath()
                }]));
            });
        }
    }
}

export var packageRestore = new PackageRestore;
