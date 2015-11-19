import * as _ from "lodash";
import {CompositeDisposable, Subject, Observable, Scheduler} from "rx";
import Omni = require("../../omni-sharp-server/omni")
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
                .subscribe(ctx => {
                    const {request, response} = ctx;
                    //pop ui to user.
                    this.view = codeActionsView({
                        items: response.CodeActions,
                        confirmed: (item) => {
                            if (!editor || editor.isDestroyed()) return;

                            const range = editor.getSelectedBufferRange();
                            this.runCodeActionRequest(editor, request, item.Identifier)
                                .subscribe((response) => applyAllChanges(response.Changes));
                        }
                    }, editor);
                });
        }));

        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            const cd = new CompositeDisposable();
            cd.add(Omni.listener.getcodeactions
                .where(z => z.request.FileName === editor.getPath())
                .where(ctx => ctx.response.CodeActions.length > 0)
                .subscribe(({response, request}) => {
                    if (marker) {
                        marker.destroy();
                        marker = null;
                    }

                    const range = [[request.Line, 0], [request.Line, 0]];
                    marker = editor.markBufferRange(range);
                    editor.decorateMarker(marker, { type: "line-number", class: "quickfix" });
                }));

            const word, marker: Atom.Marker, subscription: Rx.Disposable;
            const makeLightbulbRequest = (position: TextBuffer.Point) => {
                if (subscription) subscription.dispose();
                if (!editor || editor.isDestroyed()) return;

                const range = editor.getSelectedBufferRange();

                this.getCodeActionsRequest(editor, true)
                    .subscribe(ctx => {
                        const {response} = ctx;
                        if (response.CodeActions.length > 0) {
                            if (marker) {
                                marker.destroy();
                                marker = null;
                            }

                            const range = [[position.row, 0], [position.row, 0]];
                            marker = editor.markBufferRange(range);
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
            cd.add(editor.onDidChangeCursorPosition(_.debounce(e => {
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

                !onDidChangeCursorPosition.isDisposed && onDidChangeCursorPosition.onNext(e);
            }, 1000)));
        }));
    }

    private getCodeActionsRequest(editor: Atom.TextEditor, silent = true) {
        if (!editor || editor.isDestroyed()) return Observable.empty<{ request: OmniSharp.Models.V2.GetCodeActionsRequest; response: OmniSharp.Models.V2.GetCodeActionsResponse }>();

        const request = this.getRequest(editor);
        return Omni.request(editor, solution => solution.getcodeactions(request))
            .map(response => ({ request, response }));
    }

    private runCodeActionRequest(editor: Atom.TextEditor, getRequest: OmniSharp.Models.V2.GetCodeActionsRequest, codeAction: string) {
        if (!editor || editor.isDestroyed()) return Observable.empty<OmniSharp.Models.V2.RunCodeActionResponse>();

        const request = this.getRequest(editor, codeAction);
        request.Selection = getRequest.Selection;
        return Omni.request(editor, solution => solution.runcodeaction(request));
    }

    private getRequest(editor: Atom.TextEditor): OmniSharp.Models.V2.GetCodeActionsRequest;
    private getRequest(editor: Atom.TextEditor, codeAction: string): OmniSharp.Models.V2.RunCodeActionRequest;
    private getRequest(editor: Atom.TextEditor, codeAction?: string) {
        const range = <any>editor.getSelectedBufferRange();
        const request = <OmniSharp.Models.V2.RunCodeActionRequest>{
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
