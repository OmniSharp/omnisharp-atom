import {Models} from "omnisharp-client";
import {Observable, Subject} from "rxjs";
import {CompositeDisposable, Disposable, IDisposable} from "omnisharp-client";
import {Omni} from "../server/omni";
import _ from "lodash";
import {SignatureView} from "../views/signature-help-view";

interface IDecoration {
    destroy(): void;
    getMarker(): Atom.Marker;
    getProperties(): any;
    setProperties(props: any): any;
}

class SignatureHelp implements IFeature {
    private disposable: CompositeDisposable;
    private _bubble: SignatureBubble;

    public activate() {
        this.disposable = new CompositeDisposable();
        const issueRequest = new Subject<TextBuffer.Point>();
        const delayIssueRequest = new Subject<any>();

        this.disposable.add(delayIssueRequest
            .debounceTime(1000)
            .subscribe(() => {
                const editor = atom.workspace.getActiveTextEditor();
                const position = editor.getCursorBufferPosition();
                issueRequest.next(position);
            }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:signature-help",
            (e) => delayIssueRequest.next(null)));

        this.disposable.add(atom.commands.onWillDispatch(function(event: Event) {
            if (event.type === "autocomplete-plus:activate" || event.type === "autocomplete-plus:confirm") {
                delayIssueRequest.next(null);
            }
        }));

        const shouldContinue = Observable.zip(
            Omni.listener.signatureHelp,
            Omni.listener.signatureHelp.skip(1).startWith(null),
            (current, previous) => {
                if (previous === null) return true;

                if (!current.response || !current.response.Signatures || current.response.Signatures.length === 0) {
                    return false;
                }

                if (current.response && current.response.Signatures && previous.response && previous.response.Signatures) {
                    if (!_.isEqual(current.response.Signatures, previous.response.Signatures)) {
                        return false;
                    }
                }

                return true;
            })
            .publishReplay(1).refCount();

        this.disposable.add(shouldContinue
            .filter(z => !z)
            .subscribe(() => this._bubble && this._bubble.dispose()));

        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            cd.add(issueRequest
                .flatMap((position: TextBuffer.Point) =>
                    Omni.request(editor, solution => solution.signatureHelp({
                        Line: position.row,
                        Column: position.column,
                    }))
                        .switchMap(x => shouldContinue.filter(z => z), x => x)
                        .flatMap(response => {
                            if (response && response.Signatures && response.Signatures.length > 0) {
                                if (!this._bubble) {
                                    const disposable = editor.onDidChangeCursorPosition(event => {
                                        issueRequest.next(event.newBufferPosition);
                                    });
                                    cd.add(disposable);

                                    const disposer = Disposable.create(() => {
                                        if (this._bubble) {
                                            this._bubble.dispose();
                                            this._bubble = null;
                                        }
                                        disposable.dispose();
                                    });

                                    this._bubble = new SignatureBubble(editor, disposer);
                                }
                                this._bubble.update(position, response);
                            } else {
                                if (this._bubble) {
                                    this._bubble.dispose();
                                }
                            }

                            return Observable.empty<any>();
                        }))
                .subscribe());
        }));
        this.disposable.add(issueRequest);
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = false;
    public default = false;
    public title = "Signature Help";
    public description = "Adds signature help to method calls.";
}
export const signatureHelp = new SignatureHelp;

class SignatureBubble implements IDisposable {
    private _decoration: IDecoration;
    private _disposable = new CompositeDisposable();
    private _element: SignatureView;
    private _marker: Atom.Marker;
    private _position: TextBuffer.Point;
    private _member: Models.SignatureHelp;
    private _lineHeight: number;

    constructor(private _editor: Atom.TextEditor, disposer: IDisposable) {
        this._disposable.add(disposer);

        const editorView: HTMLElement = <any>atom.views.getView(_editor);
        editorView.classList.add("signature-help-active");

        this._disposable.add(Disposable.create(() => {
            editorView.classList.remove("signature-help-active");
        }));

        this._disposable.add(
            atom.commands.add("atom-text-editor:not(.autocomplete-active).signature-help-active",
                "core:move-up", (event) => {
                    this._element.moveIndex(-1);
                    event.stopImmediatePropagation();
                }));

        this._disposable.add(
            atom.commands.add("atom-text-editor:not(.autocomplete-active).signature-help-active",
                "core:move-down", (event) => {
                    this._element.moveIndex(1);
                    event.stopImmediatePropagation();
                }));

        this._disposable.add(
            atom.commands.add("atom-text-editor:not(.autocomplete-active).signature-help-active",
                "core:cancel", (event) => {
                    this.dispose();
                    event.stopImmediatePropagation();
                }));

        this._disposable.add(atom.config.observe("editor.fontSize", (size: number) => {
            _.defer(() => {
                this._lineHeight = _editor.getLineHeightInPixels();
                if (this._element)
                    this._element.setLineHeight(this._lineHeight);
            });
        }));
    }

    public update(position: TextBuffer.Point, member: Models.SignatureHelp) {
        this._position = position;
        const range = [[position.row, position.column], [position.row, position.column]];
        if (!this._marker) {
            this._marker = (<any>this._editor).markBufferRange(range/*, { invalidate: "inside" }*/);
            this._disposable.add(Disposable.create(() => {
                this._marker.destroy();
            }));
        } else {
            this._marker.setBufferRange(<any>range);
        }

        if (!this._element || !this._decoration) {
            this._element = new SignatureView();
            this._element.setLineHeight(this._lineHeight);
            this._decoration = <any>this._editor.decorateMarker(this._marker, { type: "overlay", class: `signature-help`, item: this._element, position: "head" });
        }

        if (!this._member) {
            this._updateMember(member);
        }

        if (member && this._member.Signatures && member.Signatures) {
            if (!_.isEqual(member.Signatures, this._member.Signatures)) {
                this.dispose();
                return;
            }

            if (!_.isEqual(member, this._member)) {
                this._updateMember(member);
            }
        }

    }

    private _updateMember(member: Models.SignatureHelp) {
        this._member = member;
        this._element.updateMember(member);
    }

    public dispose() {
        this._disposable.dispose();
    }
}
