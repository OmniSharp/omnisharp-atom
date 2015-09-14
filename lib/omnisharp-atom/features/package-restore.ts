import {CompositeDisposable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import path = require('path');

class PackageRestore implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.eachConfigEditor((editor, cd) => {
            var disposer = this.registerEventHandlerOnEditor(editor);
            if (disposer) {
                cd.add(disposer);
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
                Omni.request(client => client.filesChanged([{ FileName: editor.getPath() }]));
            });
        }
    }

    public required = true;
    public title = 'Package Restore';
    public description = 'Initializes a package restore, when an project.json file is saved.';
}

export var packageRestore = new PackageRestore;
