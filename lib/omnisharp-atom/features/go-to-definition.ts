import _ = require('lodash');
import {CompositeDisposable, Observable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import $ = require('jquery');
var Range = require('atom').Range;

class GoToDefinition implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private exprTypeTimeout = null;
    private marker = null;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.editors.subscribe((editor: Atom.TextEditor) => _.defer(() => {
            var view = $(atom.views.getView(editor));
            var scroll = this.getFromShadowDom(view, '.scroll-view');
            var mousemove = Observable.fromEvent<MouseEvent>(scroll[0], 'mousemove');
            var click = Observable.fromEvent<MouseEvent>(scroll[0], 'click');

            // to debounce mousemove event's firing for some reason on some machines
            var lastExprTypeBufferPt: any;

            var cd = new CompositeDisposable();

            cd.add(mousemove.subscribe((e) => {
                if (!e.ctrlKey && !e.metaKey) {
                    this.removeMarker();
                    return;
                }

                var pixelPt = this.pixelPositionFromMouseEvent(view, e)
                var screenPt = editor.screenPositionForPixelPosition(pixelPt)
                var bufferPt = editor.bufferPositionForScreenPosition(screenPt)
                if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt))
                    return;

                lastExprTypeBufferPt = bufferPt;

                this.clearExprTypeTimeout();
                this.exprTypeTimeout = setTimeout(() => this.underlineIfNavigable(editor, view, e), 100);
            }));

            cd.add(click.subscribe((e) => {
                if (!e.ctrlKey && !e.metaKey) {
                    return;
                }
                this.removeMarker();
                this.goToDefinition();
            }));
            this.disposable.add(cd);
        })));

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

    private underlineIfNavigable(editor, view, event) {
        var pixelPt = this.pixelPositionFromMouseEvent(view, event);
        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt);

        var buffer = editor.getBuffer();
        var startColumn = bufferPt.column;
        var endColumn = bufferPt.column;
        var line = buffer.getLines()[bufferPt.row];

        if (!/[A-Z_0-9]/i.test(line[bufferPt.column]))
            return;

        while (startColumn > 0 && /[A-Z_0-9]/i.test(line[--startColumn])) {
        }

        while (endColumn < line.length && /[A-Z_0-9]/i.test(line[++endColumn])) {
        }

        var wordRange = new Range([bufferPt.row, startColumn + 1], [bufferPt.row, endColumn]);
        if (this.marker &&
            this.marker.bufferMarker.range &&
            this.marker.bufferMarker.range.compare(wordRange) === 0)
            return;

        Omni.request(editor, client => client.gotodefinition({
            Line: bufferPt.row,
            Column: bufferPt.column,
            FileName: editor.getURI()
        }))
            .subscribe(data => {
                if (data.FileName !== null) {
                    this.removeMarker();
                    this.marker = editor.markBufferRange(wordRange);
                    var decoration = editor.decorateMarker(this.marker, { type: 'highlight', class: 'gotodefinition-underline' })
                }
            });
    }

    private pixelPositionFromMouseEvent(editorView, event: MouseEvent) {
        var clientX = event.clientX, clientY = event.clientY;
        var linesClientRect = this.getFromShadowDom(editorView, '.lines')[0].getBoundingClientRect();
        var top = clientY - linesClientRect.top;
        var left = clientX - linesClientRect.left;
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
