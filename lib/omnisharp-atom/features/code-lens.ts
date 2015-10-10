import _ = require('lodash');
//import spacePenViews = require('atom-space-pen-views')
//var $ = spacePenViews.jQuery;
import $ = require('jquery');
import {CompositeDisposable, Observable, Disposable, Subject, Scheduler} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import {DriverState} from "omnisharp-client";
import {read, write} from "fastdom";

interface IDecoration {
    destroy();
    getMarker(): Atom.Marker;
    getProperties(): any
    setProperties(props: any);
}

class CodeLens implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private decorations = new WeakMap<Atom.TextEditor, Set<Lens>>();

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Omni.eachEditor((editor, cd) => {
            cd.add(Disposable.create(() => {
                var markers = this.decorations.get(editor);

                if (markers) {
                    markers.forEach(marker => marker.dispose());
                }

                this.decorations.delete(editor);
            }));

            cd.add(atom.config.observe('editor.fontSize', (size: number) => {
                var decorations = this.decorations.get(editor);
                var lineHeight = editor.getLineHeightInPixels();
                if (decorations && lineHeight) {
                    decorations.forEach(decoration => decoration.updateTop(lineHeight));
                }
            }));
        }));

        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            var items = this.decorations.get(editor);
            if (!items) this.decorations.set(editor, new Set<Lens>());

            var subject = new Subject<boolean>();

            cd.add(subject
                .where(x => !!x && !editor.isDestroyed())
                .distinctUntilChanged(x => !!x)
                .debounce(500)
                .flatMapLatest(() => this.updateCodeLens(editor))
                .subscribe()
            );

            var bindDidChange = function() {
                var didChange = editor.getBuffer().onDidChange(() => {
                    didChange.dispose();
                    cd.remove(didChange);

                    subject.onNext(false);
                });

                cd.add(didChange);
            };

            cd.add(editor.getBuffer().onDidStopChanging(_.debounce(() => {
                !subject.isDisposed && subject.onNext(true);
                bindDidChange();
            }, 5000)));

            cd.add(editor.getBuffer().onDidSave(() => !subject.isDisposed && subject.onNext(true)));
            cd.add(editor.getBuffer().onDidReload(() => !subject.isDisposed && subject.onNext(true)));
            cd.add(Omni.whenEditorConnected(editor).subscribe(() => subject.onNext(true)));

            cd.add(editor.onDidChangeScrollTop(() => this.updateDecoratorVisiblility(editor)));

            cd.add(atom.commands.onWillDispatch((event: Event) => {
                if (_.contains(["omnisharp-atom:toggle-dock", "omnisharp-atom:show-dock", "omnisharp-atom:hide-dock"], event.type)) {
                    this.updateDecoratorVisiblility(editor);
                }
            }));

            cd.add(subject);
            this.updateDecoratorVisiblility(editor);
        }));
    }

    public updateDecoratorVisiblility(editor: Atom.TextEditor) {
        if (!this.decorations.has(editor)) this.decorations.set(editor, new Set<Lens>());
        var decorations = this.decorations.get(editor);
        decorations.forEach(decoration => decoration.updateVisible());
    }

    public dispose() {
        this.disposable.dispose();
    }

    public updateCodeLens(editor: Atom.TextEditor) {
        if (!this.decorations.has(editor)) this.decorations.set(editor, new Set<Lens>());
        var decorations = this.decorations.get(editor);
        var lineHeight = editor.getLineHeightInPixels();

        var updated = new WeakSet<Lens>();

        if (editor.isDestroyed()) {
            return Observable.empty<number>();
        }

        return Omni.request(editor, solution => solution.currentfilemembersasflat({ Buffer: null, Changes: null }))
            .observeOn(Scheduler.timeout)
            .where(fileMembers => !!fileMembers)
            .flatMap(fileMembers => Observable.from(fileMembers))
            .flatMap(fileMember => {
                var range: TextBuffer.Range = <any>editor.getBuffer().rangeForRow(fileMember.Line, false);
                var marker: Atom.Marker = (<any>editor).markBufferRange(range, { invalidate: 'inside' });

                var iteratee = decorations.values();
                var decoration = iteratee.next();
                while (!decoration.done) {
                    if (decoration.value.isEqual(marker)) {
                        var lens = decoration.value;
                        break;
                    }
                    decoration = iteratee.next();
                }

                if (lens) {
                    updated.add(lens);
                    lens.invalidate();
                } else {
                    lens = new Lens(editor, fileMember, marker, range, Disposable.create(() => {
                        decorations.delete(lens);
                    }));
                    updated.add(lens);
                    decorations.add(lens);
                }

                return lens.updateVisible();
            })
            .tapOnCompleted(() => {
                // Remove all old/missing decorations
                decorations.forEach(lens => {
                    if (lens && !updated.has(lens)) {
                        lens.dispose();
                    }
                });
            });
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
            .observeOn(Scheduler.timeout)
            .where(x => !!x)
            .flatMap(() => Omni.request(this._editor, solution =>
                solution.findusages({ FileName: this._path, Column: this._member.Column + 1, Line: this._member.Line, Buffer: null, Changes: null }, { silent: true })))
            .where(x => x && x.QuickFixes && !!x.QuickFixes.length)
            .map(x => x && x.QuickFixes && x.QuickFixes.length - 1)
            .share();

        this._disposable.add(this._updateObservable
            .take(1)
            .where(x => x > 0)
            .tapOnNext(() => this.loaded = true)
            .subscribe((x) => this._decorate(x)));

        this._disposable.add(disposer);
        this._disposable.add(this._marker.onDidDestroy(() => {
            this.dispose();
        }));
    }

    public updateVisible() {
        var isVisible = this._isVisible();
        this._updateDecoration(isVisible);

        if (isVisible) {
            var result = this._updateObservable.take(1);
        } else {
            var result = Observable.empty<number>();
        }

        this._issueUpdate(isVisible);
        return result;
    }

    private _issueUpdate = _.debounce((isVisible) => {
        !this._update.isDisposed && this._update.onNext(isVisible);
    }, 250);

    public updateTop(lineHeight: number) {
        if (this._element)
            this._element.style.top = `-${lineHeight}px`;
    }

    public invalidate() {
        this._updateObservable
            .take(1)
            .subscribe(x => {
                if (x <= 0) {
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
            var element = this._element;
            if (isVisible) {
                read(() => element.style.display === 'none' && write(() => element.style.display = ''));
            } else {
                read(() => element.style.display !== 'none' && write(() => element.style.display = 'none'));
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
        element.onclick = () => Omni.request(this._editor, s => s.findusages({ FileName: this._path, Column: this._member.Column + 1, Line: this._member.Line, Buffer: null, Changes: null }));

        this._decoration = <any>this._editor.decorateMarker(this._marker, { type: "overlay", class: `codelens`, item: this._element, position: 'head' });
        this._disposable.add(Disposable.create(() => {
            this._element.remove();
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
