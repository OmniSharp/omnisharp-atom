import _ = require('lodash');
import Omni = require('../../omni-sharp-server/omni')
import ClientManager = require('../../omni-sharp-server/client-manager');
import OmniSharpAtom = require('../omnisharp-atom')
import SpacePen = require('atom-space-pen-views');
import CodeActionsView = require('../views/code-actions-view');
import EventKit = require('event-kit');
import Changes = require('./lib/apply-changes');

class CodeCheck {

    private view : SpacePen.SelectListView;
    private disposable: EventKit.CompositeDisposable;

    constructor(private atomSharper: typeof OmniSharpAtom) {
        this.atomSharper = atomSharper;
    }
    public activate() {

        this.disposable = new EventKit.CompositeDisposable();

        OmniSharpAtom.addCommand("omnisharp-atom:get-code-actions", () => {
            ClientManager.getClientForActiveEditor()
                .subscribe(client => {
                    client.getcodeactionsPromise(client.makeRequest());
                });

        });

        Omni.registerConfiguration(client => {
            client.observeGetcodeactions.subscribe((data) => {

                //pop ui to user.
                this.view = new CodeActionsView(data, (result: any) => {
                    //callback when an item is selected
                    ClientManager.getClientForActiveEditor()
                        .subscribe(client => {
                            client.runcodeactionPromise(client.makeDataRequest<OmniSharp.Models.CodeActionRequest>(
                                {
                                    CodeAction : 0,
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

    public applyAllChanges(changes: any[]) {

        var editor = atom.workspace.getActiveTextEditor();
        Changes.applyChanges(editor, changes)
        
    }

    public deactivate() {
        //todo figure out what needs to be added to disposable
        this.disposable.dispose();
    }

}
export = CodeCheck;
