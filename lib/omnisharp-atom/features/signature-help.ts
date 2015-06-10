import ClientManager = require('../../omni-sharp-server/client-manager');
import {CompositeDisposable, Subject, Observable} from "rx";
import OmniSharpAtom = require('../omnisharp-atom');
import Omni = require('../../omni-sharp-server/omni')
import SignatureHelpView = require('../views/signature-help-view');
import SpacePen = require('atom-space-pen-views');


class SignatureHelp implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    private view: SpacePen.View;


    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:signature-help", () => {
            console.log("RUNNING");

            Omni.request(client => client.signatureHelp(client.makeRequest()))
        }));

        this.disposable.add(Omni.listener.observeSignatureHelp.subscribe((data) => {
            console.log("sup");
            this.view = new SignatureHelpView(data.response.Signatures);
        }));

    }

    public dispose() {
        this.disposable.dispose();
    }
}

export var signatureHelp = new SignatureHelp;
