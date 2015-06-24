import _ = require('lodash');
import {CompositeDisposable, Subject, Observable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import SpacePen = require('atom-space-pen-views');
import CodeActionsView = require('../views/code-actions-view');
import Changes = require('./lib/apply-changes');

// interface TemporaryCodeAction {
//     Name: string;
//     Identifier: string;
// }

class CodeAction implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    private view: SpacePen.SelectListView;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:get-code-actions", () => {
            //store the editor that this was triggered by.
// <<<<<<< Updated upstream
//             Omni.request(client => client.v1.getcodeactions(this.getRequest(client)))
//         }));
//
//         this.disposable.add(Omni.listener.v1.observeGetcodeactions.subscribe((data) => {
//             //hack: this is a temporary workaround until the server
//             //can give us code actions based on an Id.
//             var wrappedCodeActions = this.WrapCodeActionWithFakeIdGeneration(data.response)

// =======
            Omni.request(client => client.getcodeactions(this.getRequest(client)))
                .subscribe(response => {
                    //pop ui to user.
                    this.view = new CodeActionsView(response.CodeActions, (selectedItem) => {
                        Omni.activeEditor
                            .first()
                            .subscribe(editor => {
                                var range = editor.getSelectedBufferRange();
                                Omni.request(editor, client => client.runcodeaction(this.getRequest(client, selectedItem.Id)))
                                    .subscribe((response) => this.applyAllChanges(response.Changes));
                            });
                    });
                });
        }));

//         this.disposable.add(Omni.listener.observeGetcodeactions.subscribe((data) => {
// // >>>>>>> Stashed changes
//             //pop ui to user.
//             this.view = new CodeActionsView(data.response.CodeActions, (selectedItem) => {
//                 Omni.activeEditor
//                     .first()
//                     .subscribe(editor => {
//                         var range = editor.getSelectedBufferRange();
//                         Omni.request(editor, client => client.v1.runcodeaction(this.getRequest(client, selectedItem.Id)))
//                             .subscribe((response) => this.applyAllChanges(response.Changes));
//                     });
//             });
//         }));

        this.disposable.add(Omni.editors.subscribe(editor => {
            var word, marker: Atom.Marker, subscription: Rx.Disposable;
            var makeLightbulbRequest = (position: TextBuffer.Point) => {
                if (subscription) subscription.dispose();

                var range = editor.getSelectedBufferRange();

                subscription = Omni.request(client => client.v1.getcodeactions(this.getRequest(client), { silent: true }))
                    .subscribe(response => {
                        if (response.CodeActions.length > 0) {
                            if (marker) {
                                marker.destroy();
                                marker = null;
                            }

                            var range = [[position.row, 0], [position.row, 0]];
                            marker = editor.markBufferRange(range);
                            editor.decorateMarker(marker, { type: "line-number", class: "quickfix" });
                        }
                    });
            };

            var update = _.debounce((pos: TextBuffer.Point) => {
                if (subscription) subscription.dispose();
                makeLightbulbRequest(pos);
            }, 400);

            this.disposable.add(editor.onDidChangeCursorPosition(e => {
                var oldPos = e.oldBufferPosition;
                var newPos = e.newBufferPosition;

                var newWord: string = <any>editor.getWordUnderCursor();
                if (word !== newWord || oldPos.row !== newPos.row) {
                    word = newWord;
                    if (marker) {
                        marker.destroy();
                        marker = null;
                    }

                    update(newPos);
                }
            }));
        }));
    }

    private getRequest(client: OmniSharp.ExtendApi, codeAction?: number) {
        var editor = atom.workspace.getActiveTextEditor();
        var range = <any>editor.getSelectedBufferRange();
        var request = client.makeDataRequest<OmniSharp.Models.V2.GetCodeActionsRequest>({
            Selection: {
                Start: {
                    Line: range.start.row,
                    Column: range.start.column
                },
                End: {
                    Line: range.end.row,
                    Column: range.end.column
                }
            }
        });

        // if (codeAction !== undefined) {
        //     request.CodeAction = codeAction;
        // }

        return request;
    }

    public dispose() {
        this.disposable.dispose();
    }

    public applyAllChanges(changes: OmniSharp.Models.ModifiedFileResponse[]) {
        return _.each(changes, (change) => {
            atom.workspace.open(change.FileName, undefined)
                .then((editor) => { Changes.applyChanges(editor, change.Changes); })
        });
    }
}

export var codeAction = new CodeAction;
