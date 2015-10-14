import _ = require('lodash');
import {CompositeDisposable, Subject, Observable, Scheduler} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import SpacePen = require('atom-space-pen-views');
import Changes = require('../services/apply-changes');
import codeActionsView from "../views/code-actions-view";

class CodeAction implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    private view: SpacePen.SelectListView;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:get-code-actions", () => {
            //store the editor that this was triggered by.
            var editor = atom.workspace.getActiveTextEditor();
            Omni.request(editor, solution => solution.getcodeactions(this.getRequest(solution)))
                .subscribe(response => {
                    //pop ui to user.
                    this.view = codeActionsView({
                        items: response.CodeActions,
                        confirmed: (item) => {
                            if (editor && !editor.isDestroyed()) {
                                var range = editor.getSelectedBufferRange();
                                Omni.request(editor, solution => solution.runcodeaction(this.getRequest(solution, item.Identifier)))
                                    .subscribe((response) => this.applyAllChanges(response.Changes));
                            }
                        }
                    }, editor);
                });
        }));

        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            var cd = new CompositeDisposable();
            cd.add(Omni.listener.getcodeactions
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

            var word, marker: Atom.Marker, subscription: Rx.Disposable;
            var makeLightbulbRequest = (position: TextBuffer.Point) => {
                if (subscription) subscription.dispose();
                if (editor && editor.isDestroyed()) return;

                var range = editor.getSelectedBufferRange();

                subscription = Omni.request(editor, solution => solution.getcodeactions(this.getRequest(solution), { silent: true }))
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

            var update = (pos: TextBuffer.Point) => {
                if (subscription) subscription.dispose();
                makeLightbulbRequest(pos);
            };

            var onDidChangeCursorPosition = new Subject<{ oldBufferPosition: TextBuffer.Point; oldScreenPosition: TextBuffer.Point; newBufferPosition: TextBuffer.Point; newScreenPosition: TextBuffer.Point; textChanged: boolean; cursor: Atom.Cursor; }>();
            cd.add(onDidChangeCursorPosition);

            var onDidStopChanging = new Subject<any>();
            cd.add(onDidStopChanging);

            cd.add(Observable.combineLatest(onDidChangeCursorPosition, onDidStopChanging, (cursor, changing) => cursor)
                .observeOn(Scheduler.async)
                .debounce(1000)
                .subscribe(cursor => update(cursor.newBufferPosition)));

            cd.add(editor.onDidStopChanging(_.debounce(() => !onDidStopChanging.isDisposed && onDidStopChanging.onNext(true), 1000)));
            cd.add(editor.onDidChangeCursorPosition(_.debounce(e => {
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

                !onDidChangeCursorPosition.isDisposed && onDidChangeCursorPosition.onNext(e);
            }, 1000)));
        }));
    }

    private getRequest(solution: OmniSharp.ExtendApi): OmniSharp.Models.V2.GetCodeActionsRequest;
    private getRequest(solution: OmniSharp.ExtendApi, codeAction: string): OmniSharp.Models.V2.RunCodeActionRequest;
    private getRequest(solution: OmniSharp.ExtendApi, codeAction?: string) {
        var editor = atom.workspace.getActiveTextEditor();
        var range = <any>editor.getSelectedBufferRange();
        var request = <OmniSharp.Models.V2.RunCodeActionRequest>{
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

    public applyAllChanges(changes: OmniSharp.Models.ModifiedFileResponse[]) {
        var pane: HTMLElement = <any>atom.views.getView(atom.workspace.getActivePane());
        var title = pane.querySelector('.title.temp');
        var tab = pane.querySelector('.preview-tab.active');

        if (title) {
            title.classList.remove('temp');
        }
        if (tab) {
            tab.classList.remove('preview-tab');
        }

        Observable.from(changes)
            .concatMap(change => atom.workspace.open(change.FileName, undefined)
                .then(editor => {
                    var pane: HTMLElement = <any>atom.views.getView(atom.workspace.getActivePane());
                    var title = pane.querySelector('.title.temp');
                    var tab = pane.querySelector('.preview-tab.active');
                    if (title) {
                        title.classList.remove('temp');
                    }
                    if (tab) {
                        tab.classList.remove('preview-tab');
                    }
                    Changes.applyChanges(editor, change);
                }))
            .subscribe();
    }

    public required = true;
    public title = 'Code Actions';
    public description = 'Adds code action support to omnisharp-atom.';
}

export var codeAction = new CodeAction;
