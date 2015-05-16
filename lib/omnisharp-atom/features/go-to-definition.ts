import _ = require('lodash');
import Omni = require('../../omni-sharp-server/omni');
import rx = require('rx');
import $ = require('jquery');
var Range = require('atom').Range;

class GoToDefinition {
    private disposable: { dispose: () => void; };

    private exprTypeTimeout = null;
    private marker = null;
    public goToDefinition() {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            var req: any = Omni.makeRequest();
            var word = <any>editor.getWordUnderCursor();

            Omni.client.gotodefinitionPromise(req).then((data) => {
                if (data.FileName != null) {
                    Omni.navigateTo(data);
                } else {
                    atom.emitter.emit("omnisharp-atom:error",
                        "Can't navigate to '" + word + "'");
                }
            });
        }
    }

    public activate() {
        this.disposable = atom.workspace.observeTextEditors((editor) => {
            var view = $(atom.views.getView(editor));
            var scroll = this.getFromShadowDom(view, '.scroll-view');
            var mousemove = rx.Observable.fromEvent<MouseEvent>(scroll[0], 'mousemove');
            var click = rx.Observable.fromEvent<MouseEvent>(scroll[0], 'click');

            var cd = this.disposable = new rx.CompositeDisposable();

            // to debounce mousemove event's firing for some reason on some machines
            var lastExprTypeBufferPt: any;

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
                return this.goToDefinition();
            }));

            return atom.emitter.on("symbols-view:go-to-declaration", () => {
                return this.goToDefinition();
            });

        });

        atom.commands.add("atom-text-editor", "omnisharp-atom:go-to-definition", () => {
            return this.goToDefinition();
        });
    }

    public deactivate() {
        this.disposable.dispose()
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
        if (this.marker !== null && this.marker.bufferMarker.range.compare(wordRange) === 0)
            return;
        if (Omni.client === null) {
            return;
        }
        
        Omni.client.gotodefinitionPromise({
            Line: bufferPt.row + 1,
            Column: bufferPt.column + 1,
            FileName: editor.getURI()
        }).then(data => {
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

export = GoToDefinition;
