// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow
// https://atom.io/packages/atom-typescript
import {Models} from "omnisharp-client";
import {CompositeDisposable, Observable, Disposable} from "rx";
import {Omni} from "../../omni-sharp-server/omni";
import {TooltipView} from "../views/tooltip-view";
const $ : JQueryStatic = require("jquery");
const escape = require("escape-html");

class TypeLookup implements IFeature {
    private disposable: Rx.CompositeDisposable;

    public activate() {
        /* tslint:disable:no-string-literal */
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            // subscribe for tooltips
            // inspiration : https://github.com/chaika2013/ide-haskell
            const editorView = $(atom.views.getView(editor));
            const tooltip = editor["__omniTooltip"] = new Tooltip(editorView, editor);
            cd.add(tooltip);

            cd.add(editor.onDidDestroy(() => {
                editor["__omniTooltip"] = null;
                cd.dispose();
            }));
        }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:type-lookup", () => {
            Omni.activeEditor.first().subscribe(editor => {
                const tooltip = <Tooltip>editor["__omniTooltip"];
                tooltip.showExpressionTypeOnCommand();
            });
        }));
        /* tslint:enable:no-string-literal */
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = false;
    public title = "Tooltip Lookup";
    public description = "Adds hover tooltips to the editor, also has a keybind";
}

class Tooltip implements Rx.Disposable {
    private exprTypeTooltip: TooltipView = null;
    private keydown: Rx.Observable<KeyboardEvent>;
    private keydownSubscription: Rx.IDisposable;
    private rawView: any;
    private disposable: Rx.CompositeDisposable;

    constructor(private editorView: JQuery, private editor: Atom.TextEditor) {
        this.rawView = editorView[0];

        const cd = this.disposable = new CompositeDisposable();

        const scroll = this.getFromShadowDom(editorView, ".scroll-view");
        if (!scroll[0]) return;

        // to debounce mousemove event"s firing for some reason on some machines
        let lastExprTypeBufferPt: any;

        const mousemove = Observable.fromEvent<MouseEvent>(scroll[0], "mousemove");
        const mouseout = Observable.fromEvent<MouseEvent>(scroll[0], "mouseout");
        this.keydown = Observable.fromEvent<KeyboardEvent>(scroll[0], "keydown");

        cd.add(mousemove.map(event => {
            const pixelPt = this.pixelPositionFromMouseEvent(editorView, event);
            const screenPt = editor.screenPositionForPixelPosition(pixelPt);
            const bufferPt = editor.bufferPositionForScreenPosition(screenPt);
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

        cd.add(Omni.switchActiveEditor((edit, innerCd) => {
            innerCd.add(Disposable.create(() => this.hideExpressionType()));
        }));

        cd.add(Disposable.create(() => {
            this.hideExpressionType();
        }));
    }

    private subcribeKeyDown() {
        this.keydownSubscription = this.keydown.subscribe((e) => this.hideExpressionType());
        this.disposable.add(this.keydownSubscription);
    }

    public showExpressionTypeOnCommand() {
        if (this.editor.cursors.length < 1) return;

        const bufferPt = this.editor.getCursorBufferPosition();

        if (!this.checkPosition(bufferPt)) return;

        // find out show position
        const offset = (this.rawView.component.getFontSize() * bufferPt.column) * 0.7;
        const rect = this.getFromShadowDom(this.editorView, ".cursor-line")[0].getBoundingClientRect();

        const tooltipRect = {
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
        const offset = (<any>this.editor).getLineHeightInPixels() * 0.7;
        const tooltipRect = {
            left: e.clientX,
            right: e.clientX,
            top: e.clientY - offset,
            bottom: e.clientY + offset
        };

        this.showToolTip(bufferPt, tooltipRect);
    }

    private checkPosition(bufferPt: TextBuffer.Point) {
        const curCharPixelPt = this.rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
        const nextCharPixelPt = this.rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1]);

        if (curCharPixelPt.left >= nextCharPixelPt.left) {
            return false;
        } else {
            return true;
        }
    }

    private showToolTip(bufferPt: TextBuffer.Point, tooltipRect: any) {
        this.exprTypeTooltip = new TooltipView(tooltipRect);

        // Actually make the program manager query
        Omni.request(solution => solution.typelookup({
            IncludeDocumentation: true,
            Line: bufferPt.row,
            Column: bufferPt.column
        })).subscribe((response: Models.TypeLookupResponse) => {
            if (response.Type === null) {
                return;
            }
            let message = `<b>${escape(response.Type)}</b>`;
            if (response.Documentation) {
                message = message + `<br/><i>${escape(response.Documentation)}</i>`;
            }
            // Sorry about this "if". It"s in the code I copied so I guess its there for a reason
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
        const el = element[0];
        const found = (<any>el).rootElement.querySelectorAll(selector);
        return $(found[0]);
    }

    private pixelPositionFromMouseEvent(editorView: any, event: MouseEvent) {
        const clientX = event.clientX, clientY = event.clientY;
        const linesClientRect = this.getFromShadowDom(editorView, ".lines")[0].getBoundingClientRect();
        let top = clientY - linesClientRect.top;
        let left = clientX - linesClientRect.left;
        top += (<any>this.editor).getScrollTop();
        left += (<any>this.editor).getScrollLeft();
        return { top: top, left: left };
    }
}

export const typeLookup = new TypeLookup;
