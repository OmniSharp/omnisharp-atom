import _ = require('lodash');
import Omni = require('../../omni-sharp-server/omni')
import ClientManager = require('../../omni-sharp-server/client-manager');
import OmniSharpAtom = require('../omnisharp-atom')
import SpacePen = require('atom-space-pen-views');
import CodeActionsView = require('../views/code-actions-view');
import Changes = require('./lib/apply-changes');

interface TemporaryCodeAction {
    Name : string;
    Id: number;
}


class CodeAction {

    private view : SpacePen.SelectListView;
    private editor : Atom.TextEditor;

    constructor(private atomSharper: typeof OmniSharpAtom) {
        this.atomSharper = atomSharper;
    }
    public activate() {

        this.atomSharper.addCommand("omnisharp-atom:get-code-actions", () => {
            //store the editor that this was triggered by.
            this.editor = atom.workspace.getActiveTextEditor();

            ClientManager.getClientForActiveEditor()
                .subscribe(client => {
                    client.getcodeactionsPromise(client.makeRequest());
                });

        });

        Omni.registerConfiguration(client => {
            client.observeGetcodeactions.subscribe((data) => {

                //hack: this is a temporary workaround until the server
                //can give us code actions based on an Id.
                var wrappedCodeActions = this.WrapCodeActionWithFakeIdGeneration(data.response)

                //pop ui to user.
                this.view = new CodeActionsView(wrappedCodeActions, (selectedItem) => {
                    //callback when an item is selected
                    ClientManager.getClientForActiveEditor()
                        .subscribe(client => {
                            client.runcodeactionPromise(client.makeDataRequest<OmniSharp.Models.CodeActionRequest>(
                                {
                                    CodeAction : selectedItem.Id,
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

    private WrapCodeActionWithFakeIdGeneration(data : OmniSharp.Models.GetCodeActionsResponse) : TemporaryCodeAction[] {
        var wrappedCodeActions: TemporaryCodeAction[] = [];
        for (var i = 0; i < data.CodeActions.length; i++) {
            wrappedCodeActions.push({ Name : data.CodeActions[i], Id : i });
        }
        return wrappedCodeActions;
    }

    public applyAllChanges(changes: OmniSharp.Models.LinePositionSpanTextChange[]) {

        Changes.applyChanges(this.editor, changes)

    }

    public deactivate() {
        //: todo figure out what needs to be disposed of?
    }

}
export = CodeAction;
