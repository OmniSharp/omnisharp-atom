// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow
// https://atom.io/packages/atom-typescript
import Omni = require('../../omni-sharp-server/omni');
import path = require('path');
import fs = require('fs');
import TooltipView = require('../views/tooltip-view');
import rx = require('rx');
import $ = require('jquery');
import omnisharpAtom = require('../omnisharp-atom');
//import escape = require('escape-html');

class TypeLookup {
    public activate() {
        omnisharpAtom.onEditor((editor: Atom.TextEditor) => {

            // subscribe for tooltips
            // inspiration : https://github.com/chaika2013/ide-haskell
            var editorView = $(atom.views.getView(editor));
            new Tooltip(editorView, editor);
        });
    }
}

class Tooltip implements rx.Disposable {

    private exprTypeTimeout = null;
    private exprTypeTooltip: TooltipView = null;
    private rawView: any;
    private disposable: rx.Disposable;

    constructor(private editorView: JQuery, private editor: Atom.TextEditor) {
        this.rawView = editorView[0];

        var scroll = this.getFromShadowDom(editorView, '.scroll-view');

        // to debounce mousemove event's firing for some reason on some machines
        var lastExprTypeBufferPt: any;

        var mousemove = rx.Observable.fromEvent<MouseEvent>(scroll[0], 'mousemove');
        var mouseout = rx.Observable.fromEvent<MouseEvent>(scroll[0], 'mouseout');
        var keydown = rx.Observable.fromEvent<KeyboardEvent>(scroll[0], 'keydown');

        var cd = this.disposable = new rx.CompositeDisposable();

        cd.add(mousemove.subscribe((e) => {
            var pixelPt = this.pixelPositionFromMouseEvent(editorView, e)
            var screenPt = editor.screenPositionForPixelPosition(pixelPt)
            var bufferPt = editor.bufferPositionForScreenPosition(screenPt)
            if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && this.exprTypeTooltip)
                return;

            lastExprTypeBufferPt = bufferPt;

            this.clearExprTypeTimeout();
            this.exprTypeTimeout = setTimeout(() => this.showExpressionType(e), 100);
        }));
        cd.add(mouseout.subscribe((e) => this.clearExprTypeTimeout()));
        cd.add(keydown.subscribe((e) => this.clearExprTypeTimeout()));

        editor.onDidDestroy(() => this.dispose());
    }

    private showExpressionType(e: MouseEvent) {

        // If we are already showing we should wait for that to clear
        if (this.exprTypeTooltip) return;

        var pixelPt = this.pixelPositionFromMouseEvent(this.editorView, e);
        // TODO: Update typings
        var screenPt = this.editor.screenPositionForPixelPosition(pixelPt);
        var bufferPt = this.editor.bufferPositionForScreenPosition(screenPt);
        var curCharPixelPt = this.rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
        var nextCharPixelPt = this.rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1]);

        if (curCharPixelPt.left >= nextCharPixelPt.left) return;

        // find out show position
        var offset = (<any>this.editor).getLineHeightInPixels() * 0.7;
        var tooltipRect = {
            left: e.clientX,
            right: e.clientX,
            top: e.clientY - offset,
            bottom: e.clientY + offset
        };
        this.exprTypeTooltip = new TooltipView(tooltipRect);

        var buffer = this.editor.getBuffer();
        // TODO: Fix typings
        // characterIndexForPosition should return a number
        //var position = buffer.characterIndexForPosition(bufferPt);
        // Actually make the program manager query
        Omni.client.typelookupPromise({
            IncludeDocumentation: true,
            Line: bufferPt.row + 1,
            Column: bufferPt.column + 1,
            FileName: this.editor.getURI()
        }).then((response: OmniSharp.Models.TypeLookupResponse) => {
            var message = `<b>${response.Type}</b>`;
            if (response.Documentation) {
                message = message + `<br/><i>${response.Documentation}</i>`;
            }
            // Sorry about this "if". It's in the code I copied so I guess its there for a reason
            if (this.exprTypeTooltip) {
                this.exprTypeTooltip.updateText(message);
            }
        });
    }

    public dispose() {
        this.disposable.dispose();
        this.clearExprTypeTimeout();
    }
    /** clears the timeout && the tooltip */
    private clearExprTypeTimeout() {
        if (this.exprTypeTimeout) {
            clearTimeout(this.exprTypeTimeout);
            this.exprTypeTimeout = null;
        }
        this.hideExpressionType();
    }
    private hideExpressionType() {
        if (!this.exprTypeTooltip) return;
        this.exprTypeTooltip.remove();
        this.exprTypeTooltip = null;
    }

    private getFromShadowDom(element: JQuery, selector: string): JQuery {
        var el = element[0];
        var found = (<any> el).rootElement.querySelectorAll(selector);
        return $(found[0]);
    }

    private pixelPositionFromMouseEvent(editorView, event: MouseEvent) {
        var clientX = event.clientX, clientY = event.clientY;
        var linesClientRect = this.getFromShadowDom(editorView, '.lines')[0].getBoundingClientRect();
        var top = clientY - linesClientRect.top;
        var left = clientX - linesClientRect.left;
        return { top: top, left: left };
    }

    private screenPositionFromMouseEvent(editorView, event) {
        return editorView.getModel().screenPositionForPixelPosition(this.pixelPositionFromMouseEvent(editorView, event));
    }
}

export = TypeLookup;
