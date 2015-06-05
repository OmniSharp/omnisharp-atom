import _ = require('lodash');
import {CompositeDisposable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import SpacePen = require('atom-space-pen-views');
import CodeActionsView = require('../views/code-actions-view');
import Changes = require('./lib/apply-changes');

interface TemporaryCodeAction {
    Name: string;
    Id: number;
}

class CodeAction implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    private view: SpacePen.SelectListView;
    private editor: Atom.TextEditor;
    private marker: Atom.Marker;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.editor = atom.workspace.getActiveTextEditor();

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:get-code-actions", () => {
            //store the editor that this was triggered by.
            Omni.request(client => client.getcodeactions(client.makeRequest()));
        }));

        this.disposable.add(Omni.listener.observeGetcodeactions.subscribe((data) => {
            //hack: this is a temporary workaround until the server
            //can give us code actions based on an Id.
            var wrappedCodeActions = this.WrapCodeActionWithFakeIdGeneration(data.response)

            //pop ui to user.
            this.view = new CodeActionsView(wrappedCodeActions, (selectedItem) => {
                //callback when an item is selected
                Omni.request(client => client.runcodeactionPromise(client.makeDataRequest<OmniSharp.Models.CodeActionRequest>({
                    CodeAction: selectedItem.Id,
                    WantsTextChanges: true
                })));
            });
        }));

        this.disposable.add(Omni.listener.observeRuncodeaction.subscribe((data) => {
            this.applyAllChanges(data.response.Changes);
        }));

        this.disposable.add(this.editor.onDidChangeCursorPosition(_.debounce(e => {
            var oldPos = e.oldBufferPosition;
            var newPos = e.newBufferPosition;

            if (oldPos.row !== newPos.row || oldPos.column !== newPos.column) {

                if (this.marker) {
                    this.marker.destroy();
                }

                Omni.request(client => client.getcodeactions(client.makeRequest(), { silent: true })).subscribe(response => {
                    if (response.CodeActions.length > 0) {
                        var range = [[newPos.row, 0], [newPos.row, 0]];
                        this.marker = this.editor.markBufferRange(range);
                        this.editor.decorateMarker(this.marker, { type: "line-number", class: "quickfix" });
                    }
                });
            }
        }, 300)));
    }

    public dispose() {
        this.disposable.dispose();
    }

    private WrapCodeActionWithFakeIdGeneration(data: OmniSharp.Models.GetCodeActionsResponse): TemporaryCodeAction[] {
        var wrappedCodeActions: TemporaryCodeAction[] = [];
        for (var i = 0; i < data.CodeActions.length; i++) {
            wrappedCodeActions.push({ Name: data.CodeActions[i], Id: i });
        }
        return wrappedCodeActions;
    }

    public applyAllChanges(changes: OmniSharp.Models.LinePositionSpanTextChange[]) {
        Changes.applyChanges(this.editor, changes)
    }
}

export var codeAction = new CodeAction;
