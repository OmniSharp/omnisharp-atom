import {read, write} from "fastdom";
import * as _ from "lodash";

function _d(cb: (value: Function) => Function) {
    return <MethodDecorator>function(target: Function, key: string, descriptor: any) {
        descriptor.value = cb(descriptor.value);
        return descriptor;
    }
}

var parseString = (function() {
    var parser = new DOMParser();

    return function(xml: string) {
        return parser.parseFromString(xml, "text/xml");
    }
})();

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
    private _editorLineHeight: number;

    public createdCallback() {
        this._selectedIndex = -1;
        this._lastIndex = -1;
        this._editorLineHeight = 0;

        this._inner = document.createElement('div');
        this._label = document.createElement('span');
        this._documentation = document.createElement('div');
        this._parameterDocumentation = document.createElement('div');
        this._parameterDocumentation.style.marginLeft = '2.4em';
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

        this._inner.appendChild(this._parameterDocumentation);
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

    public setLineHeight(height: number) {
        this._editorLineHeight = height;

        if (this._member)
            this.updateMember(this._member);
    }

    //@_d(m => _.debounce(m, 200, { leading: true, trailing: true }))
    public updateMember(member: OmniSharp.Models.SignatureHelp) {
        this._member = member;

        if (this._selectedIndex === -1) {
            this._selectedIndex = member.ActiveSignature;
            if (member.ActiveSignature === -1) {
                // The server basically threw up its arms and said fuck it...
                this._selectedIndex = 0;
            }
        }

        var signature = member.Signatures[this._selectedIndex];
        if (signature.Documentation)
            var docs = parseString(signature.Documentation);

        if (this._lastIndex !== this._selectedIndex) {
            this._lastIndex = this._selectedIndex;
            write(() => {
                this._count.innerText = (this._selectedIndex + 1).toString();
                this._label.innerText = signature.Name;
                this._documentation.innerText = signature.Documentation;

                if (docs && signature.Documentation) {
                    var s: NodeListOf<HTMLElement> = <any>docs.getElementsByTagName('summary');
                    if (s.length) {
                        var summary = _.trim((s[0]).innerHTML);
                        this._documentation.innerText = summary;
                    } else {
                        this._documentation.innerText = '';
                        this._documentation.style.display = 'none';
                    }

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
                var parametersElement = document.createElement('span');
                _.each(parameters, (parameter, i) => {
                    var view: SignatureParameterView = <any>new exports.SignatureParameterView();
                    view.setMember(parameter);
                    view.setCurrent(i === member.ActiveParameter);

                    if (i > 0) {
                        var comma = document.createElement('span');
                        comma.innerText = ', ';
                        parametersElement.appendChild(comma);
                    }

                    parametersElement.appendChild(view);
                    this._parametersList.push(view);
                });

                var currentElement = this._parameters;
                this._inner.insertBefore(parametersElement, currentElement);
                this._inner.removeChild(currentElement);

                this._parameters = parametersElement;
            });
        } else {
            write(() => {
                _.each(signature.Parameters, (param, i) =>
                    this._parametersList[i].setCurrent(i === member.ActiveParameter));
            });
        }

        var currentParameter = signature.Parameters[member.ActiveParameter];
        read(() => {
            if (signature.Documentation) {
                var paramDocs = parseString(currentParameter.Documentation);

                if (paramDocs) {
                    var s: NodeListOf<HTMLElement> = <any>paramDocs.getElementsByTagName('summary');
                    if (s.length) {
                        var summaryElement = s[0];
                        if (summaryElement)
                            var summary = _.trim(summaryElement.innerHTML);
                    }
                }
            }

            if (docs && !summary) {
                var s: NodeListOf<HTMLElement> = <any>docs.getElementsByTagName('param');
                if (s.length) {
                    var param = <HTMLElement>_.find(s, x => x.attributes['name'] && x.attributes['name'].value === currentParameter.Name);
                    if (param) {
                        summary = _.trim(param.innerHTML);
                    }
                }
            }

            if (currentParameter && this._parameterDocumentation.innerText !== summary) {
                if (summary) {
                    this._parameterDocumentation.innerText = summary;
                } else {
                    this._parameterDocumentation.innerText = '';
                }
            }
        });

        write(() => this.style.bottom = `${this.clientHeight + this._editorLineHeight}px`);
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
