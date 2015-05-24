import _ = require('lodash');
import Omni = require('../../omni-sharp-server/omni')
import ClientManager = require('../../omni-sharp-server/client-manager');
import OmniSharpAtom = require('../omnisharp-atom')
import SpacePen = require('atom-space-pen-views');
import CodeActionsView = require('../views/code-actions-view');
import Changes = require('./lib/apply-changes');

class CodeCheck {

    private view : SpacePen.SelectListView;

    constructor(private atomSharper: typeof OmniSharpAtom) {
        this.atomSharper = atomSharper;
    }
    public activate() {

        this.atomSharper.addCommand("omnisharp-atom:get-code-actions", () => {
            ClientManager.getClientForActiveEditor()
                .subscribe(client => {
                    client.getcodeactionsPromise(client.makeRequest());
                });

        });

        Omni.registerConfiguration(client => {
            client.observeGetcodeactions.subscribe((data) => {

                //pop ui to user.
                this.view = new CodeActionsView(data.response.CodeActions, () => {
                    //callback when an item is selected
                    ClientManager.getClientForActiveEditor()
                        .subscribe(client => {
                            client.runcodeactionPromise(client.makeDataRequest<OmniSharp.Models.CodeActionRequest>(
                                {
                                    CodeAction : 0, //this is the "ID"(index?) of the code action to run...
                                    WantsTextChanges: true
                                }
                            ));
                        });

                    })
                });

            });
        Omni.registerConfiguration(client => {
            client.observeRuncodeaction.subscribe((data) => {
                this.applyAllChanges(data.response.Changes);
            })
        })

    }

    public applyAllChanges(changes: OmniSharp.Models.LinePositionSpanTextChange[]) {
        //bug: if they have swapped editors since firing this request,
        //it might apply the changes to the wrong editor?
        var editor = atom.workspace.getActiveTextEditor();
        Changes.applyChanges(editor, changes)

    }

    public deactivate() {
        //todo figure out what needs to be added to disposable
    }

}
export = CodeCheck;
