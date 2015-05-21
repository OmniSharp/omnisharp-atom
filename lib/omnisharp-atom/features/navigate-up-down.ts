import ClientManager = require('../../omni-sharp-server/client-manager');
import Omni = require('../../omni-sharp-server/omni')
import OmniSharpAtom = require('../omnisharp-atom');

class Navigate {
    private disposable: { dispose: () => void; };

    public navigateUp() {
        ClientManager.getClientForActiveEditor().subscribe(client => client.navigateup(client.makeRequest()));
    }

    public navigateDown() {
        ClientManager.getClientForActiveEditor().subscribe(client => client.navigatedown(client.makeRequest()));
    }

    public activate() {
        OmniSharpAtom.addCommand("omnisharp-atom:navigate-up", () => {
            return this.navigateUp();
        });

        OmniSharpAtom.addCommand("omnisharp-atom:navigate-down", () => {
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
