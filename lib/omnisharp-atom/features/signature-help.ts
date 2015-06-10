import OmniSharpAtom = require('../omnisharp-atom');
import Omni = require('../../omni-sharp-server/omni')
import SignatureHelpView = require('../views/signature-help-view');


class SignatureHelp {

    private view;

    public activate() {
        Omni.addTextEditorCommand("omnisharp-atom:signature-help", () => {
            Omni.request(client => client.signatureHelp(client.makeRequest()))
                .subscribe((data) => {
                    console.log(data);
                    this.view = new SignatureHelpView(data.Signatures);
                });
        });

        //Omni.listener.observeSignatureHelp;
    }
}

export var signatureHelp = new SignatureHelp;
