import ClientManager = require('../../omni-sharp-server/client-manager');
import OmniSharpAtom = require('../omnisharp-atom');
import Omni = require('../../omni-sharp-server/omni')
import SignatureHelpView = require('../views/signature-help-view');


class SignatureHelp {

    private view;

    public activate() {
        OmniSharpAtom.addCommand("omnisharp-atom:signature-help", () => {

            ClientManager.getClientForActiveEditor()
                .subscribe(client => {
                    client.signatureHelpPromise(client.makeRequest());
                });

        });

        Omni.registerConfiguration(client => {
            client.observeSignatureHelp.subscribe((data) => {
                console.log(data);

                this.view = new SignatureHelpView(data.response.Signatures);

            });
        });


    }
}

export = SignatureHelp;
