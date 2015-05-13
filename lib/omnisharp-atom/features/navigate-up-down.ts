import Omni = require('../../omni-sharp-server/omni')

class Navigate {
    private disposable: { dispose: () => void; };

    public navigateUp() {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            Omni.client.navigateupPromise(Omni.makeRequest());
        }
    }

    public navigateDown() {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            Omni.client.navigatedownPromise(Omni.makeRequest());
        }
    }

    public activate() {
        atom.commands.add("atom-text-editor", "omnisharp-atom:navigate-up", () => {
            return this.navigateUp();
        });

        atom.commands.add("atom-text-editor", "omnisharp-atom:navigate-down", () => {
            return this.navigateDown();
        });

        Omni.registerConfiguration(client => {
            client.observeNavigateup.subscribe((data) => this.navigateTo(data.response));
            client.observeNavigatedown.subscribe((data) => this.navigateTo(data.response));
        });
    }

    private navigateTo(data: OmniSharp.Models.NavigateResponse) {
        var editor = atom.workspace.getActiveTextEditor();
        Omni.navigateTo({ FileName: editor.getURI(), Line: data.Line, Column: data.Column });
    }

    public deactivate() {
        this.disposable.dispose()
    }
}
export = Navigate;
