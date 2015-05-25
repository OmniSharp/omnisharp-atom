import ClientManager = require('../../omni-sharp-server/client-manager');
import OmniSharpAtom = require('../omnisharp-atom');
import Omni = require('../../omni-sharp-server/omni')

class SignatureHelp {

    constructor(private atomSharper: typeof OmniSharpAtom) {
        this.atomSharper = atomSharper;
    }

    public activate() {
        this.atomSharper.addCommand("omnisharp-atom:signature-help", () => {

            ClientManager.getClientForActiveEditor()
                .subscribe(client => {
                    client.signatureHelpPromise(client.makeRequest());
                });

        });

        Omni.registerConfiguration(client => {
            client.observeSignatureHelp.subscribe((data) => {
                console.log(data);
            });
        });


    }
}

export = SignatureHelp;
