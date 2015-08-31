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
    private decorations = new WeakMap<Atom.TextEditor, Lens[]>();

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
                    }));

                    cd.add(Disposable.create(() => {
                        var markers = this.decorations.get(editor);

                        _.each(markers, (marker) => marker && marker.dispose());
                        this.decorations.set(editor, []);
                    }))

                    cd.add(atom.config.observe('editor.fontSize', (size: number) => {
                        var decorations = this.decorations.get(editor);
                        var lineHeight = editor.getLineHeightInPixels();
                        if (decorations && lineHeight) {
                            _.each(decorations, lens => {
                                lens.updateTop(lineHeight);
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
            var items = this.decorations.get(editor);
            if (!items) this.decorations.set(editor, []);

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

            cd.add(editor.onDidChangeScrollTop(() => {
                this.updateDecoratorVisiblility(editor);
            }));

            cd.add(atom.commands.onWillDispatch((event: Event) => {
                if (_.contains(["omnisharp-atom:toggle-dock", "omnisharp-atom:show-dock", "omnisharp-atom:hide-dock"], event.type)) {
                    this.updateDecoratorVisiblility(editor);
                }
            }));

            this.updateDecoratorVisiblility(editor);
        }));
    }

    public updateDecoratorVisiblility(editor: Atom.TextEditor) {
        var decorations = this.decorations.get(editor);
        _.each(decorations, decoration => {
            decoration.updateVisible();
        });
    }

    public dispose() {
        this.disposable.dispose();
    }

    public updateCodeLens(editor: Atom.TextEditor) {
        if (!this.decorations.has(editor)) this.decorations.set(editor, []);
        var decorations = this.decorations.get(editor);
        var lineHeight = editor.getLineHeightInPixels();

        var updated = new WeakSet<Lens>();
        _.each(decorations, x => x.invalidate());

        return Omni.request(editor, solution =>
            solution.currentfilemembersasflat(solution.makeRequest(editor)))
            .concatMap(fileMembers => Observable.from(fileMembers)
                .flatMap(x => Observable.just(x).delay(100)))
            .map(fileMember => {
                var range: TextBuffer.Range = <any>editor.getBuffer().rangeForRow(fileMember.Line, false);
                var marker: Atom.Marker = (<any>editor).markBufferRange(range, { invalidate: 'inside' });

                var lens = _.find(decorations, d => d.isEqual(marker));
                if (lens) {
                    updated.add(lens);
                } else {
                    lens = new Lens(editor, fileMember, marker, range, Disposable.create(() => {
                        _.pull(decorations, lens);
                    }));
                    updated.add(lens);
                    decorations.push(lens);
                }

                return lens;
            })
            .tapOnCompleted(() => {
                // Remove all old/missing decorations
                _.each(decorations, d => {
                    if (d && !updated.has(d)) {
                        d.dispose();
                    }
                });
            })
            .tapOnNext((lens) => lens.updateVisible());
    }

    public required = false;
    public title = 'Code Lens';
    public description = 'Adds support for displaying references in the editor.';
}

function isLineVisible(editor: Atom.TextEditor, line: number) {
    var element: any = atom.views.getView(editor);
    var top = element.getFirstVisibleScreenRow();
    var bottom = element.getLastVisibleScreenRow();

    if (line <= top || line >= bottom)
        return false;
    return true;
}

export class Lens implements Rx.IDisposable {
    private _update: Rx.Subject<boolean>;
    private _row: number;
    private _decoration: IDecoration;
    private _resetDisposable: Rx.IDisposable;
    private _disposable = new CompositeDisposable();
    private _element: HTMLDivElement;
    private _updateObservable: Rx.Observable<number>;
    private _path: string;

    public loaded: boolean = false;

    constructor(private _editor: Atom.TextEditor, private _member: OmniSharp.Models.QuickFix, private _marker: Atom.Marker, private _range: TextBuffer.Range, disposer: Rx.IDisposable) {
        this._row = _range.getRows()[0];
        this._update = new Subject<any>();
        this._disposable.add(this._update);
        this._path = _editor.getPath();

        this._updateObservable = this._update
            .where(x => !!x)
            .flatMap(() => Omni.request(this._editor, solution =>
                solution.findusages({ FileName: this._path, Column: this._member.Column + 1, Line: this._member.Line }, { silent: true })))
            .map(x => x.QuickFixes.length - 1)
            .publish()
            .refCount();

        this._disposable.add(this._updateObservable
            .take(1)
            .where(x => x > 0)
            .tapOnNext(() => this.loaded = true)
            .subscribe((x) => this._decorate(x)));

        this._disposable.add(this._marker.onDidDestroy(() => {
            this.dispose();
        }));

        this._disposable.add(disposer);
    }

    public updateVisible() {
        var isVisible = this._isVisible();
        this._updateDecoration(isVisible);
        this._update.onNext(isVisible);
    }

    public updateTop(lineHeight: number) {
        if (this._element)
            this._element.style.top = `-${lineHeight}px`;
    }

    public invalidate() {
        this._updateObservable
            .take(1)
            .subscribe((x) => {
                if (x === 0) {
                    this.dispose();
                } else {
                    this._element && (this._element.textContent = x.toString());
                }
            });
    }

    public isEqual(marker: Atom.Marker) {
        return this._marker.isEqual(<any>marker);
    }

    private _isVisible() {
        return isLineVisible(this._editor, this._row);
    }

    private _updateDecoration(isVisible: boolean) {
        if (this._decoration && this._element) {
            if (isVisible && this._element.style.display === 'none') {
                this._element.style.display = '';
            } else if (!isVisible && this._element.style.display !== 'none') {
                this._element.style.display = 'none';
            }
        }
    }

    private _decorate(count: number) {
        var lineHeight = this._editor.getLineHeightInPixels();

        var element = this._element = document.createElement('div');
        element.style.position = 'relative';
        element.style.top = `-${lineHeight}px`;
        element.style.left = '16px';
        element.classList.add('highlight-info', 'badge', 'badge-small');
        element.textContent = count.toString();
        element.onclick = function() { Omni.request(this._editor, s => s.findusages({ FileName: this._path, Column: this._member.Column + 1, Line: this._member.Line })); }

        this._decoration = <any>this._editor.decorateMarker(this._marker, { type: "overlay", class: `codelens`, item: element, position: 'head' });
        this._disposable.add(Disposable.create(() => {
            this._decoration.destroy();
            this._element = null;
        }));

        var isVisible = isLineVisible(this._editor, this._row);
        if (!isVisible) {
            element.style.display = 'none';
        }

        return this._decoration;
    }

    public dispose() { return this._disposable.dispose(); }
}

export var codeLens = new CodeLens();
