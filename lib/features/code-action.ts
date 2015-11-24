import {Models} from "omnisharp-client";
const _ : _.LoDashStatic = require("lodash");
import {CompositeDisposable, Subject, Observable, Scheduler} from "rx";
import {Omni} from "../server/omni";
import * as SpacePen from "atom-space-pen-views";
import {applyAllChanges} from "../services/apply-changes";
import codeActionsView from "../views/code-actions-view";

class CodeAction implements IFeature {
    private disposable: Rx.CompositeDisposable;

    private view: SpacePen.SelectListView;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:get-code-actions", () => {
            //store the editor that this was triggered by.
            const editor = atom.workspace.getActiveTextEditor();
            this.getCodeActionsRequest(editor)
                .subscribe(({request, response}) => {
                    //pop ui to user.
                    this.view = codeActionsView({
                        items: response.CodeActions,
                        confirmed: (item) => {
                            if (!editor || editor.isDestroyed()) return;

                            this.runCodeActionRequest(editor, request, item.Identifier)
                                .subscribe((resp) => applyAllChanges(resp.Changes));
                        }
                    }, editor);
                });
        }));

        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            let word: string, marker: Atom.Marker, subscription: Rx.Disposable;

            cd.add(Omni.listener.getcodeactions
                .where(z => z.request.FileName === editor.getPath())
                .where(ctx => ctx.response.CodeActions.length > 0)
                .subscribe(({request}) => {
                    if (marker) {
                        marker.destroy();
                        marker = null;
                    }

                    const range = [[request.Line, 0], [request.Line, 0]];
                    marker = editor.markBufferRange(range);
                    editor.decorateMarker(marker, { type: "line-number", class: "quickfix" });
                }));
            const makeLightbulbRequest = (position: TextBuffer.Point) => {
                if (subscription) subscription.dispose();
                if (!editor || editor.isDestroyed()) return;

                this.getCodeActionsRequest(editor, true)
                    .subscribe(ctx => {
                        const {response} = ctx;
                        if (response.CodeActions.length > 0) {
                            if (marker) {
                                marker.destroy();
                                marker = null;
                            }

                            const rng = [[position.row, 0], [position.row, 0]];
                            marker = editor.markBufferRange(rng);
                            editor.decorateMarker(marker, { type: "line-number", class: "quickfix" });
                        }
                    });
            };

            const update = (pos: TextBuffer.Point) => {
                if (subscription) subscription.dispose();
                makeLightbulbRequest(pos);
            };

            const onDidChangeCursorPosition = new Subject<{ oldBufferPosition: TextBuffer.Point; oldScreenPosition: TextBuffer.Point; newBufferPosition: TextBuffer.Point; newScreenPosition: TextBuffer.Point; textChanged: boolean; cursor: Atom.Cursor; }>();
            cd.add(onDidChangeCursorPosition);

            const onDidStopChanging = new Subject<any>();
            cd.add(onDidStopChanging);

            cd.add(Observable.combineLatest(onDidChangeCursorPosition, onDidStopChanging, (cursor, changing) => cursor)
                .observeOn(Scheduler.async)
                .debounce(1000)
                .subscribe(cursor => update(cursor.newBufferPosition)));

            cd.add(editor.onDidStopChanging(_.debounce(() => !onDidStopChanging.isDisposed && onDidStopChanging.onNext(true), 1000)));
            cd.add(editor.onDidChangeCursorPosition(_.debounce((e: any) => {
                const oldPos = e.oldBufferPosition;
                const newPos = e.newBufferPosition;

                const newWord: string = <any>editor.getWordUnderCursor();
                if (word !== newWord || oldPos.row !== newPos.row) {
                    word = newWord;
                    if (marker) {
                        marker.destroy();
                        marker = null;
                    }
                }

                if (!onDidChangeCursorPosition.isDisposed) {
                    onDidChangeCursorPosition.onNext(e);
                }
            }, 1000)));
        }));
    }

    private getCodeActionsRequest(editor: Atom.TextEditor, silent = true) {
        if (!editor || editor.isDestroyed()) return Observable.empty<{ request: Models.V2.GetCodeActionsRequest; response: Models.V2.GetCodeActionsResponse }>();

        const request = this.getRequest(editor);
        return Omni.request(editor, solution => solution.getcodeactions(request))
            .map(response => ({ request, response }));
    }

    private runCodeActionRequest(editor: Atom.TextEditor, getRequest: Models.V2.GetCodeActionsRequest, codeAction: string) {
        if (!editor || editor.isDestroyed()) return Observable.empty<Models.V2.RunCodeActionResponse>();

        const request = this.getRequest(editor, codeAction);
        request.Selection = getRequest.Selection;
        return Omni.request(editor, solution => solution.runcodeaction(request));
    }

    private getRequest(editor: Atom.TextEditor): Models.V2.GetCodeActionsRequest;
    private getRequest(editor: Atom.TextEditor, codeAction: string): Models.V2.RunCodeActionRequest;
    private getRequest(editor: Atom.TextEditor, codeAction?: string) {
        const range = <any>editor.getSelectedBufferRange();
        const request: Models.V2.RunCodeActionRequest = {
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
        };

        if (codeAction !== undefined) {
            request.Identifier = codeAction;
        }

        return request;
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = "Code Actions";
    public description = "Adds code action support to omnisharp-atom.";
}

export const codeAction = new CodeAction;
