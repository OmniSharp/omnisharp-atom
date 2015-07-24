// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow
// https://atom.io/packages/atom-typescript
import {CompositeDisposable, Observable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import path = require('path');
import fs = require('fs');
import TooltipView = require('../views/tooltip-view');
import $ = require('jquery');
var escape = require("escape-html");
import _ = require('lodash');

class TypeLookup implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.activeEditor.where(z => !!z).subscribe(editor => {
            var cd = new CompositeDisposable();

            // subscribe for tooltips
            // inspiration : https://github.com/chaika2013/ide-haskell
            var editorView = $(atom.views.getView(editor));
            var tooltip = editor['__omniTooltip'] = new Tooltip(editorView, editor);
            cd.add(tooltip);

            editor.onDidDestroy(() => {
                editor['__omniTooltip'] = null;
                cd.dispose();
            });

            cd.add(Omni.activeEditor.where(active => active !== editor).subscribe(() => {
                cd.dispose();
                this.disposable.remove(cd);
            }));
        }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:type-lookup", () => {
            Omni.activeEditor.first().subscribe(editor => {
                var tooltip = <Tooltip>editor['__omniTooltip'];
                tooltip.showExpressionTypeOnCommand();
            })
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }
}

class Tooltip implements Rx.Disposable {

    private exprTypeTimeout = null;
    private exprTypeTooltip: TooltipView = null;
    private keydown: Rx.Observable<KeyboardEvent>;
    private keydownSubscription: Rx.IDisposable;
    private rawView: any;
    private disposable: Rx.CompositeDisposable;

    constructor(private editorView: JQuery, private editor: Atom.TextEditor) {
        this.rawView = editorView[0];

        var scroll = this.getFromShadowDom(editorView, '.scroll-view');

        // to debounce mousemove event's firing for some reason on some machines
        var lastExprTypeBufferPt: any;

        var mousemove = Observable.fromEvent<MouseEvent>(scroll[0], 'mousemove');
        var mouseout = Observable.fromEvent<MouseEvent>(scroll[0], 'mouseout');
        this.keydown = Observable.fromEvent<KeyboardEvent>(scroll[0], 'keydown');

        var cd = this.disposable = new CompositeDisposable();

        cd.add(mousemove.map(event => {
            var pixelPt = this.pixelPositionFromMouseEvent(editorView, event);
            var screenPt = editor.screenPositionForPixelPosition(pixelPt);
            var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
            if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && this.exprTypeTooltip)
                return null;

            lastExprTypeBufferPt = bufferPt;
            return { bufferPt, event };
        })
            .where(z => !!z)
            .tapOnNext(() => this.hideExpressionType())
            .debounce(200)
            .where(x => this.checkPosition(x.bufferPt))
            .tapOnNext(() => this.subcribeKeyDown())
            .subscribe(({bufferPt, event}) => {
                this.showExpressionTypeOnMouseOver(event, bufferPt);
            }));

        cd.add(mouseout.subscribe((e) => this.hideExpressionType()));

        cd.add(Omni.activeEditor.subscribe((activeItem) => {
            this.hideExpressionType();
        }));
    }

    private subcribeKeyDown() {
        this.keydownSubscription = this.keydown.subscribe((e) => this.hideExpressionType());
        this.disposable.add(this.keydownSubscription);
    }

    public showExpressionTypeOnCommand() {
        if (this.editor.cursors.length < 1) return;

        var buffer = this.editor.getBuffer();
        var bufferPt = this.editor.getCursorBufferPosition();

        if (!this.checkPosition(bufferPt)) return;

        // find out show position
        var offset = (this.rawView.component.getFontSize() * bufferPt.column) * 0.7;
        var rect = this.getFromShadowDom(this.editorView, '.cursor-line')[0].getBoundingClientRect();

        var tooltipRect = {
            left: rect.left - offset,
            right: rect.left + offset,
            top: rect.bottom,
            bottom: rect.bottom
        };

        this.hideExpressionType();
        this.subcribeKeyDown();
        this.showToolTip(bufferPt, tooltipRect);
    }

    private showExpressionTypeOnMouseOver(e: MouseEvent, bufferPt: TextBuffer.Point) {
        if (!Omni.isOn) {
            return;
        }

        // If we are already showing we should wait for that to clear
        if (this.exprTypeTooltip) return;

        // find out show position
        var offset = (<any>this.editor).getLineHeightInPixels() * 0.7;
        var tooltipRect = {
            left: e.clientX,
            right: e.clientX,
            top: e.clientY - offset,
            bottom: e.clientY + offset
        };

        this.showToolTip(bufferPt, tooltipRect);
    }

    private checkPosition(bufferPt) {
        var curCharPixelPt = this.rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
        var nextCharPixelPt = this.rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1]);

        if (curCharPixelPt.left >= nextCharPixelPt.left) { return false; }
        else { return true };
    }

    private showToolTip(bufferPt, tooltipRect) {
        this.exprTypeTooltip = new TooltipView(tooltipRect);

        var buffer = this.editor.getBuffer();
        // TODO: Fix typings
        // characterIndexForPosition should return a number
        //var position = buffer.characterIndexForPosition(bufferPt);
        // Actually make the program manager query

        Omni.request(client => client.typelookup({
            IncludeDocumentation: true,
            Line: bufferPt.row,
            Column: bufferPt.column,
            FileName: this.editor.getURI()
        })).subscribe((response: OmniSharp.Models.TypeLookupResponse) => {
            if (response.Type === null) {
                return;
            }
            var message = `<b>${escape(response.Type) }</b>`;
            if (response.Documentation) {
                message = message + `<br/><i>${escape(response.Documentation) }</i>`;
            }
            // Sorry about this "if". It's in the code I copied so I guess its there for a reason
            if (this.exprTypeTooltip) {
                this.exprTypeTooltip.updateText(message);
            }
        });
    }

    public dispose() {
        this.disposable.dispose();
    }

    private hideExpressionType() {
        if (!this.exprTypeTooltip) return;
        this.exprTypeTooltip.remove();
        this.exprTypeTooltip = null;

        if (this.keydownSubscription) {
            this.disposable.remove(this.keydownSubscription);
            this.keydownSubscription.dispose();
            this.keydownSubscription = null;
        }
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
        top += this.editor.displayBuffer.getScrollTop();
        left += this.editor.displayBuffer.getScrollLeft();
        return { top: top, left: left };
    }

    private screenPositionFromMouseEvent(editorView, event) {
        return editorView.getModel().screenPositionForPixelPosition(this.pixelPositionFromMouseEvent(editorView, event));
    }
}

export var typeLookup = new TypeLookup;
