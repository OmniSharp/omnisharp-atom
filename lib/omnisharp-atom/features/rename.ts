import _ = require('lodash')
import {CompositeDisposable, Disposable, Observable} from "rx";
import RenameView = require('../views/rename-view')
import Omni = require('../../omni-sharp-server/omni');
import Changes = require('./lib/apply-changes')
import {Range} from "atom";

class Rename implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    private renameView: RenameView

    public activate() {
        this.disposable = new CompositeDisposable();
        this.renameView = new RenameView();
        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:rename', (e) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            this.rename();
        }));

        this.disposable.add(Omni.listener.observeRename.subscribe((data) => {
            this.applyAllChanges(data.response.Changes);
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public rename() {
        var editor = atom.workspace.getActiveTextEditor();
        var disposable = new CompositeDisposable();


        var cancel = () => {
            disposable.dispose();
        }

        var confirm = () => {
            disposable.dispose();
        }

        if (editor) {
            var currentCursors = editor.getCursors().map(z => z.getMarker());
            var newCursors: Atom.Cursor[];
            var promise = Omni.request(client => client.findusages(client.makeRequest(), { silent: true }))
                .flatMap(x => Observable.from(x.QuickFixes))
                .where(x => atom.workspace.getActiveTextEditor().getPath() === x.FileName)
                .map(x => {
                    var clone = _.clone(x);
                    clone.Line = clone.Line - 1;
                    clone.EndLine = clone.EndLine - 1;
                    clone.Column = clone.Column - 1;
                    clone.EndColumn = clone.EndColumn - 1;
                    return clone;
                })
                .map(position => {
                    var range: Atom.Range = <any>[[position.Line, position.Column], [position.EndLine, position.EndColumn]];
                    var cursor: Atom.Cursor = <any>editor.addCursorAtBufferPosition([position.EndLine, position.EndColumn]);

                    return { range, cursor, position };
                })
                .toArray()
                .toPromise()
                .then(fixes => {
                    if (!fixes.length) return;

                    newCursors = fixes.map<Atom.Cursor>(fix => fix.cursor);

                    editor.setSelectedBufferRanges(fixes.map(z => z.range));

                    disposable.add(Disposable.create(() => {
                        editor.clearSelections();
                        editor.getCursors().forEach(cursor => editor.removeCursor(cursor));
                        _.each(currentCursors, x => editor.addCursor(x));
                    }));

                    return fixes;
                }).then(fixes => {
                    _.each(fixes, fix => {
                        var {cursor, position} = fix;

                        cursor.setVisible(true);
                        disposable.add(cursor.onDidChangePosition((e) => {
                            if (e.newBufferPosition.row !== position.Line) {
                                cancel();
                            }

                            if (e.newBufferPosition.column > position.EndColumn) {
                                if (cursor.isAtBeginningOfLine() || cursor.isSurroundedByWhitespace()) {
                                    cancel();
                                }

                            }
                        }));
                    });

                    disposable.add(atom.commands.add("atom-text-editor", "core:confirm", confirm));
                    disposable.add(atom.commands.add("atom-text-editor", "core:cancel", cancel));
                    //disposable.add(Omni.activeEditor.skip(1).subscribe(cancel));
                    /*disposable.add(editor.onDidChangeCursorPosition(e => {
                        if (e.oldScreenPosition.row !== e.newBufferPosition.row) {
                            cancel();
                        }
                    }));*/
                });


            //disposable.add(editor.onDidRemoveCursor(cancel));


            /*var wordToRename = editor.getWordUnderCursor();

            atom.workspace.addTopPanel({
                item: this.renameView
            });*/
        }
        //return this.renameView.configure(wordToRename);
    }

    public applyAllChanges(changes: any[]) {
        return _.each(changes, (change) => {
            atom.workspace.open(change.FileName, undefined)
                .then((editor) => { Changes.applyChanges(editor, change.Changes); })
        });
    }
}
export var rename = new Rename
