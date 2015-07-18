import _ = require('lodash');
import {CompositeDisposable, Subject, Observable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import SpacePen = require('atom-space-pen-views');
import Changes = require('./lib/apply-changes');
import codeActionsView from "../views/code-actions-view";

class CodeAction implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    private view: SpacePen.SelectListView;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:get-code-actions", () => {
            //store the editor that this was triggered by.
            var editor = atom.workspace.getActiveTextEditor();
            Omni.request(editor, client => client.getcodeactions(this.getRequest(client)))
                .subscribe(response => {
                    //pop ui to user.
                    this.view = codeActionsView({
                        items: response.CodeActions,
                        confirmed: (item) => {
                            var range = editor.getSelectedBufferRange();
                            Omni.request(editor, client => client.runcodeaction(this.getRequest(client, item.Identifier)))
                                .subscribe((response) => this.applyAllChanges(response.Changes));
                        }
                    }, editor);
                });
        }));

        this.disposable.add(Omni.activeEditor.where(editor => !!editor).subscribe(editor => {
            var cd = new CompositeDisposable();
            cd.add(Omni.listener.observeGetcodeactions
                .where(z => z.request.FileName === editor.getPath())
                .where(ctx => ctx.response.CodeActions.length > 0)
                .subscribe(({response, request}) => {
                    if (marker) {
                        marker.destroy();
                        marker = null;
                    }

                    var range = [[request.Line, 0], [request.Line, 0]];
                    marker = editor.markBufferRange(range);
                    editor.decorateMarker(marker, { type: "line-number", class: "quickfix" });
                }));

            cd.add(Omni.activeEditor.where(active => active !== editor).subscribe(() => {
                cd.dispose();
                this.disposable.remove(cd);
            }));

            var word, marker: Atom.Marker, subscription: Rx.Disposable;
            var makeLightbulbRequest = (position: TextBuffer.Point) => {
                if (subscription) subscription.dispose();

                var range = editor.getSelectedBufferRange();

                subscription = Omni.request(client => client.getcodeactions(this.getRequest(client), { silent: true }))
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

            var onDidChangeCursorPosition = new Subject<{ oldBufferPosition: TextBuffer.Point; oldScreenPosition: TextBuffer.Point; newBufferPosition: TextBuffer.Point; newScreenPosition: TextBuffer.Point; textChanged: boolean; cursor: Atom.Cursor; }>();
            cd.add(onDidChangeCursorPosition);

            var onDidStopChanging = new Subject<any>();
            cd.add(onDidStopChanging);

            cd.add(Observable.combineLatest(onDidChangeCursorPosition.debounce(100), onDidStopChanging.debounce(100), (cursor, changing) => cursor)
                .debounce(200)
                .subscribe(cursor => update(cursor.newBufferPosition)));

            cd.add(editor.onDidStopChanging(() => onDidStopChanging.onNext(true)));
            cd.add(editor.onDidChangeCursorPosition(e => {
                var oldPos = e.oldBufferPosition;
                var newPos = e.newBufferPosition;

                var newWord: string = <any>editor.getWordUnderCursor();
                if (word !== newWord || oldPos.row !== newPos.row) {
                    word = newWord;
                    if (marker) {
                        marker.destroy();
                        marker = null;
                    }
                }

                onDidChangeCursorPosition.onNext(e);
            }));
        }));
    }

    private getRequest(client: OmniSharp.ExtendApi): OmniSharp.Models.V2.GetCodeActionsRequest;
    private getRequest(client: OmniSharp.ExtendApi, codeAction: string): OmniSharp.Models.V2.RunCodeActionRequest;
    private getRequest(client: OmniSharp.ExtendApi, codeAction?: string) {
        var editor = atom.workspace.getActiveTextEditor();
        var range = <any>editor.getSelectedBufferRange();
        var request = client.makeDataRequest<OmniSharp.Models.V2.RunCodeActionRequest>({
            WantsTextChanges: true,
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

        if (codeAction !== undefined) {
            request.Identifier = codeAction;
        }

        return request;
    }

    public dispose() {
        this.disposable.dispose();
    }

    public applyAllChanges(changes: OmniSharp.Models.ModifiedFileResponse[]) {
        return _.each(changes, (change) => {
            atom.workspace.open(change.FileName, undefined)
                .then((editor) => { Changes.applyChanges(editor, change); })
        });
    }
}

export var codeAction = new CodeAction;
