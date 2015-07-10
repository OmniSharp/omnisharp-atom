import _ = require('lodash');
import {CompositeDisposable, Observable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import $ = require('jquery');
var Range: typeof TextBuffer.Range = require('atom').Range;
import {highlight} from "./highlight";

var identifierRegex = /^identifier|identifier$|\.identifier\./;

class GoToDefinition implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private exprTypeTimeout = null;
    private marker = null;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.activeEditor.where(z => !!z).subscribe((editor: Atom.TextEditor) => {
            var cd = new CompositeDisposable();
            cd.add(Omni.activeEditor.where(e => e !== editor).subscribe(() => {
                cd.dispose();
                this.disposable.add(cd);
            }));

            var view = $(atom.views.getView(editor));
            var scroll = this.getFromShadowDom(view, '.scroll-view');
            var click = Observable.fromEvent<MouseEvent>(scroll[0], 'click');

            var mousemove = Observable.fromEvent<MouseEvent>(scroll[0], 'mousemove');

            var keyup = Observable.merge(
                Observable.fromEvent<any>(view[0], 'focus'),
                Observable.fromEvent<any>(view[0], 'blur'),
                Observable.fromEventPattern(x => { (<any>atom.getCurrentWindow()).on('focus', x) }, x => { (<any>atom.getCurrentWindow()).removeListener('focus', x) }),
                Observable.fromEventPattern(x => { (<any>atom.getCurrentWindow()).on('blur', x) }, x => { (<any>atom.getCurrentWindow()).removeListener('blur', x) }),
                Observable.fromEvent<KeyboardEvent>(view[0], 'keyup')
                    .where(x => x.which === 17 || x.which === 224 || x.which === 93 || x.which === 91)
                )
                .throttleFirst(100);

            var keydown = Observable.fromEvent<KeyboardEvent>(view[0], 'keydown')
                .where(z => !z.repeat)
                .where(e => e.ctrlKey || e.metaKey)
                .throttleFirst(100);

            var specialKeyDown = keydown
                .flatMapLatest(x => mousemove
                    .takeUntil(keyup)
                    .map(event => {
                        var pixelPt = this.pixelPositionFromMouseEvent(editor, view, event);
                        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
                        return editor.bufferPositionForScreenPosition(screenPt);
                    })
                    .startWith(editor.getCursorBufferPosition())
                    .map(bufferPt => ({ bufferPt, range: this.getWordRange(editor, bufferPt) }))
                    .where(z => !!z.range)
                    .distinctUntilChanged(x => x, (current, next) => current.range.isEqual(<any>next.range)));

            editor.onDidDestroy(() => cd.dispose());

            var eventDisposable: Rx.Disposable;
            cd.add(highlight.observe.enabled.subscribe((enabled: boolean) => {
                if (eventDisposable) {
                    eventDisposable.dispose();
                    cd.remove(eventDisposable);
                }

                var observable = specialKeyDown;
                if (!enabled) {
                    observable = observable.debounce(200);
                }

                eventDisposable = observable
                    .subscribe(({bufferPt, range}) => this.underlineIfNavigable(editor, bufferPt, range));

                cd.add(eventDisposable);
            }));

            cd.add(keyup.subscribe(() => this.removeMarker()));

            cd.add(click.subscribe((e) => {
                if (!e.ctrlKey && !e.metaKey) {
                    return;
                }

                this.removeMarker();
                this.goToDefinition();
            }));
            this.disposable.add(cd);
        }));

        this.disposable.add(atom.emitter.on("symbols-view:go-to-declaration", this.goToDefinition));
        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:go-to-definition", this.goToDefinition));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public goToDefinition() {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            var word = <any>editor.getWordUnderCursor();
            Omni.request(editor, client => client.gotodefinition(client.makeRequest()))
                .subscribe((data: OmniSharp.Models.GotoDefinitionResponse) => {
                    if (data.FileName != null) {
                        if (data.FileName)
                            Omni.navigateTo(data);
                    } else if (data['MetadataSource']) {
                        var {AssemblyName, TypeName}: { AssemblyName: string; TypeName: string } = data['MetadataSource'];
                        atom.workspace.open(`omnisharp://metadata/${AssemblyName}/${TypeName}`, <any>{
                            initialLine: data.Line,
                            initialColumn: data.Column,
                            searchAllPanes: true
                        });
                    } else {
                        atom.emitter.emit("omnisharp-atom:error",
                            "Can't navigate to '" + word + "'");
                    }
                });
        }
    }

    private clearExprTypeTimeout() {
        if (this.exprTypeTimeout) {
            clearTimeout(this.exprTypeTimeout);
            this.exprTypeTimeout = null;
        }
    }

    private getWordRange(editor: Atom.TextEditor, bufferPt: TextBuffer.Point): TextBuffer.Range {
        var buffer = editor.getBuffer();
        var startColumn = bufferPt.column;
        var endColumn = bufferPt.column;
        var line = buffer.getLines()[bufferPt.row];

        if (!/[A-Z_0-9]/i.test(line[bufferPt.column])) {
            if (this.marker) this.removeMarker();
            return;
        }

        while (startColumn > 0 && /[A-Z_0-9]/i.test(line[--startColumn])) {
        }

        while (endColumn < line.length && /[A-Z_0-9]/i.test(line[++endColumn])) {
        }

        return new Range([bufferPt.row, startColumn + 1], [bufferPt.row, endColumn]);
    }

    private underlineIfNavigable(editor: Atom.TextEditor, bufferPt: TextBuffer.Point, wordRange: TextBuffer.Range) {
        if (this.marker &&
            this.marker.bufferMarker.range &&
            this.marker.bufferMarker.range.compare(wordRange) === 0)
            return;

        var addMark = () => {
            this.removeMarker();
            this.marker = editor.markBufferRange(wordRange);
            var decoration = editor.decorateMarker(this.marker, { type: 'highlight', class: 'gotodefinition-underline' });
        };

        if (highlight.enabled) {
            var scopes: string[] = (<any>editor.scopeDescriptorForBufferPosition(bufferPt)).scopes;
            if (identifierRegex.test(_.last(scopes))) {
                addMark();
            }
        } else {
            // If enhanced highlighting is off, fallback to the old method.
            Omni.request(editor, client => client.gotodefinition({
                Line: bufferPt.row,
                Column: bufferPt.column,
                FileName: editor.getURI()
            })).where(data => !!data.FileName || !!data['MetadataSource'])
                .subscribe(data => addMark());
        }
    }

    private pixelPositionFromMouseEvent(editor: Atom.TextEditor, editorView, event: MouseEvent) {
        var clientX = event.clientX, clientY = event.clientY;
        var linesClientRect = this.getFromShadowDom(editorView, '.lines')[0].getBoundingClientRect();
        var top = clientY - linesClientRect.top;
        var left = clientX - linesClientRect.left;
        top += editor.displayBuffer.getScrollTop();
        left += editor.displayBuffer.getScrollLeft();
        return { top: top, left: left };
    }

    private getFromShadowDom(element: JQuery, selector: string): JQuery {
        var el = element[0];
        var found = (<any> el).rootElement.querySelectorAll(selector);
        return $(found[0]);
    }

    private removeMarker() {
        if (this.marker !== null) {
            this.marker.destroy();
            this.marker = null;
        }
    }
}

export var goToDefintion = new GoToDefinition;
