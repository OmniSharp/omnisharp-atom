import _ = require('lodash');
//import spacePenViews = require('atom-space-pen-views')
//var $ = spacePenViews.jQuery;
import $ = require('jquery');
import {CompositeDisposable, Observable, Disposable, Subject} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import {DriverState} from "omnisharp-client";

interface IDecoration {
    destroy();
    getMarker(): Atom.Marker;
    getProperties(): any
    setProperties(props: any);
}

class CodeLens implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private decorations = new WeakMap<Atom.TextEditor, IDecoration[]>();

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.editors.subscribe(editor => {
            var ad = Omni.activeEditor
                .where(active => active === editor)
                .subscribe(() => {
                    var cd = new CompositeDisposable();
                    this.disposable.add(cd);

                    cd.add(editor.onDidDestroy(() => {
                        this.disposable.remove(cd);
                        cd.dispose();

                        var markers = this.decorations.get(editor);
                        _.each(markers, (marker: any) => marker.destroy());
                    }));

                    cd.add(atom.config.observe('editor.fontSize', (size: number) => {
                        var decorations = this.decorations.get(editor);
                        var lineHeight = editor.getLineHeightInPixels();
                        if (decorations && lineHeight) {
                            _.each(decorations, d => {
                                var element = d.getProperties().item;
                                element.style.top = `-${lineHeight}px`;
                            });
                        }
                    }));

                    _.defer(() => {
                        this.disposable.remove(ad);
                        ad.dispose();
                    });
                });
            this.disposable.add(ad);
        }));

        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            var subject = new Subject<any>();
            cd.add(subject);

            cd.add(subject
                .debounce(500)
                .flatMapLatest(() => this.updateCodeLens(editor))
                .subscribe(() => { })
            );

            cd.add(editor.getBuffer().onDidStopChanging(() => subject.onNext(null)));
            cd.add(editor.getBuffer().onDidSave(() => subject.onNext(null)));
            cd.add(editor.getBuffer().onDidReload(() => subject.onNext(null)));
            cd.add(Omni.whenEditorConnected(editor).subscribe(() => subject.onNext(null)));
            //subject.onNext(null);
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public updateCodeLens(editor: Atom.TextEditor) {
        if (!this.decorations.has(editor)) this.decorations.set(editor, []);
        var decorations = this.decorations.get(editor);
        var lineHeight = editor.getLineHeightInPixels();
        var editorView = $(atom.views.getView(editor));

        var initialBufferPos = editor.getCursorBufferPosition();

        var updated = new WeakSet<Atom.Decoration>();

        return Omni.request(editor, solution =>
            solution.currentfilemembersasflat(solution.makeRequest(editor)))
            .flatMap(fileMembers => Observable.from(fileMembers))
            .map(fileMember => {
                var range = editor.getBuffer().rangeForRow(fileMember.Line, false);
                var marker = editor.markBufferRange(range, { invalidate: 'inside' });

                var activeDecoration = _.find(decorations, d => d.getMarker().isEqual(<any>marker));
                if (activeDecoration) {
                    updated.add(activeDecoration);
                }

                return { fileMember, marker };
            })
            .tapOnCompleted(() => {
                // Remove all old/missing markers
                _.each(decorations.slice(), d => {
                    if (!updated.has(d)) {
                        d.destroy();
                        _.pull(decorations, d);
                    }
                });
            })
        //.concatMap(x => Observable.just(x).delay(120))
            .flatMap(({fileMember, marker}) => Omni.request(editor, solution =>
                solution.findusages({ FileName: editor.getPath(), Column: fileMember.Column + 1, Line: fileMember.Line }, { silent: true })
                    .map(response => ({ response, fileMember, marker }))))
            .tapOnNext(({response, marker, fileMember}) => {
                var activeDecoration = _.find(decorations, d => d.getMarker().isEqual(<any>marker));
                var text = (response.QuickFixes.length).toString();

                if (activeDecoration) {
                    var htmlElement = activeDecoration.getProperties().item;
                    if (htmlElement.textContent !== text) {
                        htmlElement.textContent = text;
                    }
                } else {
                    if (!lineHeight) lineHeight = editor.getLineHeightInPixels();

                    var element = document.createElement('div');
                    element.style.position = 'relative';
                    element.style.top = `-${lineHeight}px`;
                    element.style.left = '16px';
                    element.classList.add('highlight-info', 'badge', 'badge-small');
                    element.textContent = text;
                    element.onclick = function() { Omni.request(editor, s => s.findusages({ FileName: editor.getPath(), Column: fileMember.Column + 1, Line: fileMember.Line })); }

                    var decoration = editor.decorateMarker(marker, { type: "overlay", class: `codelens`, item: element, position: 'head' });
                    decoration.flash();
                    decorations.push(<any>decoration);
                }
            });
    }
}

export var codeLens = new CodeLens();
