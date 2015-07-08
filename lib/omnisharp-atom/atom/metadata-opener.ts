import {CompositeDisposable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import * as _ from "lodash";
import {TextEditor} from "atom";

var metadataUri = 'omnisharp://metadata/';

class MetadataOpener implements OmniSharp.IAtomFeature {
    private disposable: Rx.CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();

        atom.workspace.addOpener((uri: string) => {
            if (_.startsWith(uri, metadataUri)) {
                var url = uri.substr(metadataUri.length);
                var [assemblyName, typeName] = url.split('/');
                return this.createEditorView(assemblyName, typeName);
            }
        });
    }

    public attach() {

    }

    private createEditorView(assemblyName: string, typeName: string) {
        return Omni.request(solution => solution.request<any, { Source: string }>("metadata", { AssemblyName: assemblyName, TypeName: typeName }))
            .map(response => {
                var editor = new TextEditor({});
                editor.setText(response.Source);
                editor.onWillInsertText((e) => e.cancel());

                return editor;
            }).toPromise();
    }

    public dispose() {
        this.disposable.dispose();
    }

}

export var metadataOpener = new MetadataOpener;
