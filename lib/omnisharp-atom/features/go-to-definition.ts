import _ = require('lodash');
import {CompositeDisposable, Observable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import $ = require('jquery');
var Range = require('atom').Range;
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

            var mousemove = Observable.fromEvent<MouseEvent>(scroll[0], 'mousemove')
                .shareReplay(1);

            var keyup = Observable.fromEvent<KeyboardEvent>(view[0], 'keyup')
                .where(x => x.which === 17 || x.which === 224 || x.which === 93)
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
                        return { event, bufferPt: editor.bufferPositionForScreenPosition(screenPt) };
                    })
                    .distinctUntilChanged(e => e.bufferPt, (current, next) => current.isEqual(<any>next)));

            // to debounce mousemove event's firing for some reason on some machines
            var lastExprTypeBufferPt: any;

            cd.add(mousemove.subscribe(() => { }));
            editor.onDidDestroy(() => cd.dispose());

            var eventDisposable: Rx.Disposable;
            cd.add(highlight.observe.enabled.subscribe((enabled: boolean) => {
                if (eventDisposable) {
                    eventDisposable.dispose();
                    cd.remove(eventDisposable);
                }

                eventDisposable = specialKeyDown.subscribe((e) => this.underlineIfNavigable(editor, e));
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
                .subscribe((data) => {
                    if (data.FileName != null) {
                        Omni.navigateTo(data);
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

    private underlineIfNavigable(editor: Atom.TextEditor, { event, bufferPt }: { event: MouseEvent, bufferPt: TextBuffer.Point }) {
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

        var wordRange = new Range([bufferPt.row, startColumn + 1], [bufferPt.row, endColumn]);
        if (this.marker &&
            this.marker.bufferMarker.range &&
            this.marker.bufferMarker.range.compare(wordRange) === 0)
            return;

        var addMark = () => {
            this.removeMarker();
            this.marker = editor.markBufferRange(wordRange);
            var decoration = editor.decorateMarker(this.marker, { type: 'highlight', class: 'gotodefinition-underline' });
        };

        // TODO: Remove this and uncomment below code
        //       once we have metadata information.
        Omni.request(editor, client => client.gotodefinition({
            Line: bufferPt.row,
            Column: bufferPt.column,
            FileName: editor.getURI()
        })).where(data => !!data.FileName)
            .subscribe(data => addMark());

        /*if (highlight.enabled && highlight.active) {
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
            })).where(data => !!data.FileName)
                .subscribe(data => addMark());
        }*/
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
