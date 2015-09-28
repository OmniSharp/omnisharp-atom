import {CompositeDisposable, Observable, Disposable, Subject} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import * as _ from "lodash";
import {SignatureView} from "../views/signature-help-view";

interface IDecoration {
    destroy();
    getMarker(): Atom.Marker;
    getProperties(): any
    setProperties(props: any);
}

class SignatureHelp implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private _bubble: SignatureBubble;

    public activate() {
        this.disposable = new CompositeDisposable();
        var issueRequest = new Subject<TextBuffer.Point>();
        var delayIssueRequest = new Subject<any>();

        this.disposable.add(delayIssueRequest
            .debounce(1000)
            .subscribe(() => {
                var editor = atom.workspace.getActiveTextEditor();
                var position = editor.getCursorBufferPosition();
                issueRequest.onNext(position);
            }));

        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:signature-help',
            (e) => delayIssueRequest.onNext(null)));

        this.disposable.add(atom.commands.onWillDispatch(function(event: Event) {
            if (event.type === "autocomplete-plus:activate" || event.type === "autocomplete-plus:confirm") {
                delayIssueRequest.onNext(null);
            }
        }));

        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            cd.add(issueRequest
                .flatMap((position: TextBuffer.Point) =>
                    Omni.request(editor, solution => solution.signatureHelp({
                        Line: position.row,
                        Column: position.column,
                    }))
                        .delay(50) // wait for the closing handler to catch up.
                        .flatMap(response => {
                            if (response && response.Signatures && response.Signatures.length > 0) {
                                if (!this._bubble) {
                                    var disposable = editor.onDidChangeCursorPosition(_.debounce(event => {
                                        issueRequest.onNext(event.newBufferPosition);
                                    }, 200));
                                    cd.add(disposable);

                                    var disposer = Disposable.create(() => {
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

            cd.add(Observable.zip(
                Omni.listener.observeSignatureHelp,
                Omni.listener.observeSignatureHelp.skip(1),
                (current, previous) => ({ current, previous }))
                .subscribe(ctx => {
                    var {current, previous} = ctx;
                    if (!current.response || !current.response.Signatures || current.response.Signatures.length === 0) {
                        if (this._bubble) {
                            this._bubble.dispose();
                        }
                    }

                    if (current.response && current.response.Signatures && previous.response && previous.response.Signatures) {
                        if (this._bubble && !_.isEqual(current.response.Signatures, previous.response.Signatures)) {
                            this._bubble.dispose();
                        }
                    }
                }));
        }));
        this.disposable.add(issueRequest);
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = 'Signature Help';
    public description = 'Adds signature help to method calls.';
}
export var signatureHelp = new SignatureHelp;

class SignatureBubble implements Rx.IDisposable {
    private _decoration: IDecoration;
    private _disposable = new CompositeDisposable();
    private _element: SignatureView;
    private _path: string;
    private _marker: Atom.Marker;
    private _position: TextBuffer.Point;
    private _member: OmniSharp.Models.SignatureHelp;

    constructor(private _editor: Atom.TextEditor, disposer: Rx.IDisposable) {
        this._disposable.add(disposer);

        var editorView: HTMLElement = <any>atom.views.getView(_editor);
        editorView.classList.add('signature-help-active');

        this._disposable.add(Disposable.create(() => {
            editorView.classList.remove('signature-help-active');
        }))

        this._disposable.add(
            atom.commands.add('atom-text-editor:not(.autocomplete-active).signature-help-active',
                'core:move-up', (event) => {
                    this._element.moveIndex(-1);
                    event.stopImmediatePropagation();
                }));

        this._disposable.add(
            atom.commands.add('atom-text-editor:not(.autocomplete-active).signature-help-active',
                'core:move-down', (event) => {
                    this._element.moveIndex(1);
                    event.stopImmediatePropagation();
                }));

        this._disposable.add(
            atom.commands.add('atom-text-editor:not(.autocomplete-active).signature-help-active',
                'core:cancel', (event) => {
                    this.dispose();
                    event.stopImmediatePropagation();
                }));
    }

    public update(position: TextBuffer.Point, member: OmniSharp.Models.SignatureHelp) {
        this._position = position;
        var range = [[position.row - 1, position.column], [position.row - 1, position.column]];
        if (!this._marker) {
            this._marker = (<any>this._editor).markBufferRange(range/*, { invalidate: 'inside' }*/);
            this._disposable.add(Disposable.create(() => {
                this._marker.destroy();
            }));
        } else {
            this._marker.setBufferRange(<any>range);
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

    private _updateMember(member: OmniSharp.Models.SignatureHelp) {
        this._member = member;
        if (!this._element || !this._decoration) {
            this._element = new SignatureView();
            this._decoration = <any>this._editor.decorateMarker(this._marker, { type: "overlay", class: `signature-help`, item: this._element, position: 'head' });
        }

        this._element.updateMember(member);
    }

    public dispose() {
        this._disposable.dispose();
    }
}
