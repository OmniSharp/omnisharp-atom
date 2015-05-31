import _ = require('lodash');
import {CompositeDisposable} from "rx";
import Omni = require('../../omni-sharp-server/omni');

class CodeCheck implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.addCommand('omnisharp-atom:next-diagnostic', () => {

        }));

        this.disposable.add(Omni.addCommand('omnisharp-atom:previous-diagnostic', () => {

        }));

        this.disposable.add(Omni.editors.subscribe((editor: Atom.TextEditor) => {
            var disposer = new CompositeDisposable();

            disposer.add(editor.getBuffer().onDidStopChanging(() => this.doCodeCheck(editor)));
            disposer.add(editor.getBuffer().onDidSave(() => this.doCodeCheck(editor)));
            disposer.add(editor.getBuffer().onDidDelete(() => this.doCodeCheck(editor)));
            disposer.add(editor.getBuffer().onDidReload(() => this.doCodeCheck(editor)));
            disposer.add(editor.getBuffer().onDidDestroy(() => {
                this.disposable.remove(disposer);
                disposer.dispose();
            }));
        }));

        this.disposable.add(Omni.activeEditor.subscribe(editor => {
            if (editor) {
                this.doCodeCheck(editor);
            }
        }));

        Omni.registerConfiguration(client => client.codecheck({}));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public doCodeCheck(editor: Atom.TextEditor) {
        _.debounce(() => {
            Omni.request(editor, client => {
                var request = <OmniSharp.Models.FormatRangeRequest>client.makeRequest(editor);
                return client.updatebufferPromise(request)
                    .then(() => {
                        request.FileName = null;
                        Omni.request(editor, client => client.codecheck(request));
                    });
            });
        }, 500)();
    }
}

export var codeCheck = new CodeCheck;
