import {CompositeDisposable, Observable, Disposable, Subject} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import * as _ from "lodash";

function _d(cb: (value: Function) => Function) {
    return <MethodDecorator>function(target: Function, key: string, descriptor: any) {
        descriptor.value = cb(descriptor.value);
        return descriptor;
    }
}

//, 100, { leading: true, trailing: true });
function debounce(timeout: number, options: { leading?: boolean; trailing?: boolean }) {
    return <MethodDecorator>function(target: Function, key: string, descriptor: any) {
        descriptor.value = _.debounce(descriptor.value, timeout, options);
        return descriptor;
    }
}

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
                    this._element.moveIndex(-1);
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
            this._element = new exports.SignatureView();
            this._decoration = <any>this._editor.decorateMarker(this._marker, { type: "overlay", class: `signature-help`, item: this._element, position: 'head' });
        }

        this._element.updateMember(member);
    }

    public dispose() {
        this._disposable.dispose();
    }
}

import {read, write} from "fastdom";

export class SignatureView extends HTMLDivElement { /* implements WebComponent */
    private _member: OmniSharp.Models.SignatureHelp;
    private _inner: HTMLDivElement;
    private _label: HTMLSpanElement;
    private _documentation: HTMLDivElement;
    private _parameterDocumentation: HTMLDivElement;
    private _arrows: HTMLSpanElement;
    private _parametersList: SignatureParameterView[];
    private _parameters: HTMLSpanElement;
    private _count: HTMLSpanElement;
    private _selectedIndex: number;
    private _lastIndex: number;

    public createdCallback() {
        this._selectedIndex = -1;
        this._lastIndex = -1;

        this._inner = document.createElement('div');
        this._label = document.createElement('span');
        this._documentation = document.createElement('div');
        this._parameterDocumentation = document.createElement('div');
        this._arrows = document.createElement('span');
        this._parameters = document.createElement('span');
        this._count = document.createElement('span');
        this._parametersList = [];

        this.classList.add('tooltip');
        this._inner.classList.add('tooltip-inner');

        this._setupArrows();

        var open = document.createElement('span');
        open.innerText = '(';

        var close = document.createElement('span');
        close.innerText = ')';

        this.appendChild(this._inner);
        this._inner.appendChild(this._documentation);

        this._inner.appendChild(this._arrows);

        this._inner.appendChild(this._label);
        this._inner.appendChild(open);
        this._inner.appendChild(this._parameters);
        this._inner.appendChild(close);

        var open = document.createElement('span');
        open.innerText = ' [';

        var close = document.createElement('span');
        close.innerText = ']';

        this._inner.appendChild(open);
        this._inner.appendChild(this._count);
        this._inner.appendChild(close);
    }

    public moveIndex(direction: number) {
        if (!this._member) return;
        this._selectedIndex += direction;

        if (this._selectedIndex < 0) {
            this._selectedIndex = this._member.Signatures.length - 1;
        }

        if (this._selectedIndex > this._member.Signatures.length - 1) {
            this._selectedIndex = 0;
        }

        write(() => this._count.innerText = (this._selectedIndex + 1).toString());
        this.updateMember(this._member);
    }

    private _setupArrows() {
        var up = document.createElement('a');
        up.classList.add('icon-arrow-up');
        up.href = '#';
        up.onclick = () => this.moveIndex(-1);

        var down = document.createElement('a');
        down.classList.add('icon-arrow-down');
        down.href = '#';
        down.onclick = () => this.moveIndex(1);

        this._arrows.appendChild(up);
        this._arrows.appendChild(down);
    }

    @_d(m => _.debounce(m, 200, { leading: true, trailing: true }))
    public updateMember(member: OmniSharp.Models.SignatureHelp) {
        this._member = member;

        if (this._selectedIndex === -1) {
            this._selectedIndex = member.ActiveSignature;
        }

        var signature = member.Signatures[this._selectedIndex];

        if (this._lastIndex !== this._selectedIndex) {
            this._lastIndex = this._selectedIndex;
            write(() => {
                this._count.innerText = (this._selectedIndex + 1).toString();
                this._label.innerText = signature.Name;
                this._documentation.innerText = signature.Documentation;

                if (signature.Documentation) {
                    this._documentation.innerText = signature.Documentation;
                    this._documentation.style.display = '';
                } else {
                    this._documentation.innerText = '';
                    this._documentation.style.display = 'none';
                }

                if (member.Signatures.length > 1) {
                    this._arrows.style.display = '';
                } else {
                    this._arrows.style.display = 'none';
                }
            });

            this._parametersList = [];

            write(() => {
                var parameters = signature.Parameters;
                _.each(parameters, (parameter, i) => {
                    var view: SignatureParameterView = <any>(this._parameters.children[index] && this._parameters.children[index]) || new exports.SignatureParameterView();
                    view.setMember(parameter);

                    var index = i * 2;
                    var commaIndex = (i - 1) * 2 + 1;

                    if (commaIndex > -1 && this._parametersList.length && !this._parameters.children[commaIndex]) {
                        var comma = document.createElement('span');
                        comma.innerText = ', ';
                        this._parameters.appendChild(comma);
                    }

                    !this._parameters.children[index] && this._parameters.appendChild(view);
                    this._parametersList.push(view);
                });

                var lengthWithCommas = parameters.length * 2 - 1;

                for (var i = this._parameters.children.length; i > lengthWithCommas; i--) {
                    write(() => this._parameters.children[i].remove());
                }
            });
        }

        var currentParameter = signature.Parameters[member.ActiveParameter];
        read(() => {
            if (currentParameter && this._parameterDocumentation.innerText !== currentParameter.Documentation) {
                write(() => this._parameterDocumentation.innerText = currentParameter.Documentation);
            }
        });

        _.each(signature.Parameters, (param, i) => write(() => this._parametersList[i].setCurrent(i === member.ActiveParameter)));

        write(() => this.style.bottom = `${this.clientHeight}px`);
    }

    public detachedCallback() {
        _.each(this._parametersList, parameter => parameter.remove());
        this._parametersList = null;
    }
}

(<any>exports).SignatureView = (<any>document).registerElement('omnisharp-signature-help', { prototype: SignatureView.prototype });

export class SignatureParameterView extends HTMLSpanElement { /* implements WebComponent */
    private _member: OmniSharp.Models.SignatureHelpParameter;
    private _label: HTMLSpanElement;

    public createdCallback() {
        this._label = document.createElement('span');
        this.appendChild(this._label);
    }

    public setMember(member: OmniSharp.Models.SignatureHelpParameter) {
        this._member = member;
        this._label.innerText = member.Label;
    }

    public setCurrent(current: boolean) {
        read(() => {
            if (!current && this.style.fontWeight === 'bold') {
                write(() => this.style.fontWeight = '');
            } else if (current && this.style.fontWeight !== 'bold') {
                write(() => this.style.fontWeight = 'bold');
            }
        });
    }
}

(<any>exports).SignatureParameterView = (<any>document).registerElement('omnisharp-signature-parameter', { prototype: SignatureParameterView.prototype });
