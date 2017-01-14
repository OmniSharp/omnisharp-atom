import * as SpacePen from 'atom-space-pen-views';
import { debounce } from 'lodash';
import { Models } from 'omnisharp-client';
import { Observable, Subject } from 'rxjs';
import { CompositeDisposable, IDisposable } from 'ts-disposables';
import { Omni } from '../server/omni';
import { applyAllChanges } from '../services/apply-changes';
import { factory } from '../views/code-actions-view';

interface IOnDidChangeCursorPositionContext {
    oldBufferPosition: TextBuffer.Point;
    oldScreenPosition: TextBuffer.Point;
    newBufferPosition: TextBuffer.Point;
    newScreenPosition: TextBuffer.Point;
    textChanged: boolean;
    cursor: Atom.Cursor;
}

class CodeAction implements IFeature {
    public required = true;
    public title = 'Code Actions';
    public description = 'Adds code action support to omnisharp-atom.';

    private disposable: CompositeDisposable;
    private view: SpacePen.SelectListView;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:get-code-actions', () => {
            //store the editor that this was triggered by.
            const editor = atom.workspace.getActiveTextEditor();
            this._getCodeActionsRequest(editor)
                .subscribe(({ request, response }) => {
                    //pop ui to user.
                    this.view = factory({
                        items: response.CodeActions,
                        confirmed: item => {
                            if (!editor || editor.isDestroyed()) {
                                return;
                            }

                            this._runCodeActionRequest(editor, request, item.Identifier)
                                .subscribe(resp => applyAllChanges(resp.Changes));
                        }
                    }, editor);
                });
        }));

        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            let word: string;
            let marker: Atom.Marker;

            cd.add(Omni.listener.getcodeactions
                .filter(z => z.request.FileName === editor.getPath())
                .filter(ctx => ctx.response.CodeActions.length > 0)
                .subscribe(({ request }) => {
                    if (marker) {
                        marker.destroy();
                        marker = null;
                    }

                    const range = [[request.Line, 0], [request.Line, 0]];
                    marker = editor.markBufferRange(range);
                    editor.decorateMarker(marker, { type: 'line-number', class: 'quickfix' });
                }));
            const makeLightbulbRequest = (position: TextBuffer.Point) => {
                if (!editor || editor.isDestroyed()) { return; }

                this._getCodeActionsRequest(editor, true)
                    .subscribe(ctx => {
                        const { response } = ctx;
                        if (response.CodeActions.length > 0) {
                            if (marker) {
                                marker.destroy();
                                marker = null;
                            }

                            const rng = [[position.row, 0], [position.row, 0]];
                            marker = editor.markBufferRange(rng);
                            editor.decorateMarker(marker, { type: 'line-number', class: 'quickfix' });
                        }
                    });
            };

            const update = (pos: TextBuffer.Point) => {
                makeLightbulbRequest(pos);
            };

            const onDidChangeCursorPosition = new Subject<IOnDidChangeCursorPositionContext>();
            cd.add(onDidChangeCursorPosition);

            const onDidStopChanging = new Subject<any>();

            cd.add(Observable.combineLatest(
                <Observable<IOnDidChangeCursorPositionContext>><any>onDidChangeCursorPosition,
                <Observable<any>><any>onDidStopChanging,
                (cursor, changing) => cursor)
                .debounceTime(1000)
                .subscribe(cursor => update(cursor.newBufferPosition)));

            cd.add(editor.onDidStopChanging(debounce(() => onDidStopChanging.next(true), 1000)));
            cd.add(editor.onDidChangeCursorPosition(debounce((e: any) => {
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

                if (!onDidChangeCursorPosition.closed) {
                    onDidChangeCursorPosition.next(e);
                }
            }, 1000)));
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    private _getCodeActionsRequest(editor: Atom.TextEditor, silent = true) {
        if (!editor || editor.isDestroyed()) {
            return Observable.empty<{ request: Models.V2.GetCodeActionsRequest; response: Models.V2.GetCodeActionsResponse }>();
        }

        const request = this._getRequest(editor);
        return Omni.request(editor, solution => solution.getcodeactions(request))
            .map(response => ({ request, response }));
    }

    private _runCodeActionRequest(editor: Atom.TextEditor, getRequest: Models.V2.GetCodeActionsRequest, codeAction: string) {
        if (!editor || editor.isDestroyed()) {
            return Observable.empty<Models.V2.RunCodeActionResponse>();
        }

        const request = this._getRequest(editor, codeAction);
        request.Selection = getRequest.Selection;
        return Omni.request(editor, solution => solution.runcodeaction(request));
    }

    private _getRequest(editor: Atom.TextEditor): Models.V2.GetCodeActionsRequest;
    private _getRequest(editor: Atom.TextEditor, codeAction: string): Models.V2.RunCodeActionRequest;
    private _getRequest(editor: Atom.TextEditor, codeAction?: string) {
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
}

// tslint:disable-next-line:export-name
export const codeAction = new CodeAction();
