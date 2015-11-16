import * as _ from "lodash";
import {CompositeDisposable, Observable} from "@reactivex/rxjs";
import Omni from "../../omni-sharp-server/omni";
import $ = require("jquery");
const Range: typeof TextBuffer.Range = require("atom").Range;
const identifierRegex = /^identifier|identifier$|\.identifier\./;

class GoToDefinition implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    private exprTypeTimeout = null;
    private marker = null;
    private enhancedHighlighting: boolean;
    private wantMetadata: boolean;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            const view = $(atom.views.getView(editor));
            const scroll = this.getFromShadowDom(view, ".scroll-view");
            if (!scroll[0]) {
                return;
            }

            const click = Observable.fromEvent<MouseEvent>(scroll[0], "click");

            const mousemove = Observable.fromEvent<MouseEvent>(scroll[0], "mousemove");

            const keyup = Observable.merge(
                Observable.fromEvent<any>(view[0], "focus"),
                Observable.fromEvent<any>(view[0], "blur"),
                Observable.fromEventPattern(x => { (<any>atom.getCurrentWindow()).on("focus", x) }, x => { (<any>atom.getCurrentWindow()).removeListener("focus", x) }),
                Observable.fromEventPattern(x => { (<any>atom.getCurrentWindow()).on("blur", x) }, x => { (<any>atom.getCurrentWindow()).removeListener("blur", x) }),
                Observable.fromEvent<KeyboardEvent>(view[0], "keyup")
                    .filter(x => x.which === 17 || x.which === 224 || x.which === 93 || x.which === 91)
            )
                .throttleTime(100);

            const keydown = Observable.fromEvent<KeyboardEvent>(view[0], "keydown")
                .filter(z => !z.repeat)
                .filter(e => e.ctrlKey || e.metaKey)
                .throttleTime(100);

            const specialKeyDown = keydown
                .switchMap(x => mousemove
                    .takeUntil(keyup)
                    .map(event => {
                        const pixelPt = this.pixelPositionFromMouseEvent(editor, view, event);
                        const screenPt = editor.screenPositionForPixelPosition(pixelPt);
                        return editor.bufferPositionForScreenPosition(screenPt);
                    })
                    .startWith(editor.getCursorBufferPosition())
                    .map(bufferPt => ({ bufferPt, range: this.getWordRange(editor, bufferPt) }))
                    .filter(z => !!z.range)
                    .distinctUntilChanged(x => x, (current, next) => current.range.isEqual(<any>next.range)));

            editor.onDidDestroy(() => cd.dispose());

            const eventDisposable: Disposable;
            cd.add(atom.config.observe("omnisharp-atom.enhancedHighlighting", (enabled: boolean) => {
                this.enhancedHighlighting = enabled;
                if (eventDisposable) {
                    eventDisposable.dispose();
                    cd.remove(eventDisposable);
                }

                const observable = specialKeyDown;
                if (!enabled) {
                    observable = observable.debounceTime(200);
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

        this.disposable.add(atom.emitter.on("symbols-view:go-to-declaration", () => this.goToDefinition()));
        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:go-to-definition", () => this.goToDefinition()));
        this.disposable.add(atom.config.observe("omnisharp-atom.wantMetadata", enabled => {
            this.wantMetadata = enabled;
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public goToDefinition() {
        const editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            const word = <any>editor.getWordUnderCursor();
            Omni.request(editor, solution => solution.gotodefinition({
                WantMetadata: this.wantMetadata
            }))
                .subscribe((data: OmniSharp.Models.GotoDefinitionResponse) => {
                    if (data.FileName != null) {
                        Omni.navigateTo(data);
                    } else if (data.MetadataSource) {
                        const {AssemblyName, TypeName} = data.MetadataSource;
                        atom.workspace.open(`omnisharp://metadata/${AssemblyName}/${TypeName}`, <any>{
                            initialLine: data.Line,
                            initialColumn: data.Column,
                            searchAllPanes: true
                        });
                    } else {
                        atom.notifications.addWarning("Can't navigate to \"" + word + "\"");
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
        const buffer = editor.getBuffer();
        const startColumn = bufferPt.column;
        const endColumn = bufferPt.column;
        const line = buffer.getLines()[bufferPt.row];

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

        const addMark = () => {
            this.removeMarker();
            this.marker = editor.markBufferRange(wordRange);
            const decoration = editor.decorateMarker(this.marker, { type: "highlight", class: "gotodefinition-underline" });
        };

        if (this.enhancedHighlighting) {
            const scopes: string[] = (<any>editor.scopeDescriptorForBufferPosition(bufferPt)).scopes;
            if (identifierRegex.test(_.last(scopes))) {
                addMark();
            }
        } else {
            // If enhanced highlighting is off, fallback to the old method.
            Omni.request(editor, solution => solution.gotodefinition({
                Line: bufferPt.row,
                Column: bufferPt.column
            })).filter(data => !!data.FileName || !!data["MetadataSource"])
                .subscribe(data => addMark());
        }
    }

    private pixelPositionFromMouseEvent(editor: Atom.TextEditor, editorView, event: MouseEvent) {
        const clientX = event.clientX, clientY = event.clientY;
        const linesClientRect = this.getFromShadowDom(editorView, ".lines")[0].getBoundingClientRect();
        const top = clientY - linesClientRect.top;
        const left = clientX - linesClientRect.left;
        top += (<any>editor).getScrollTop();
        left += (<any>editor).getScrollLeft();
        return { top: top, left: left };
    }

    private getFromShadowDom(element: JQuery, selector: string): JQuery {
        const el = element[0];
        const found = (<any>el).rootElement.querySelectorAll(selector);
        return $(found[0]);
    }

    private removeMarker() {
        if (this.marker !== null) {
            this.marker.destroy();
            this.marker = null;
        }
    }

    public required = true;
    public title = "Go To Definition";
    public description = "Adds support to goto definition, as well as display metadata returned by a goto definition metadata response";
}

export const goToDefintion = new GoToDefinition;
