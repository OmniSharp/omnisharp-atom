/// <reference path="../typings.d.ts" />
/* tslint:disable:no-string-literal */
import {Models} from "omnisharp-client";
let fastdom: typeof Fastdom = require("fastdom");
import _ from "lodash";

const parseString = (function() {
    const parser = new DOMParser();

    return function(xml: string) {
        return parser.parseFromString(xml, "text/xml");
    };
})();

export class SignatureView extends HTMLDivElement { /* implements WebComponent */
    private _member: Models.SignatureHelp;
    private _inner: HTMLDivElement;
    private _label: HTMLSpanElement;
    private _documentation: HTMLDivElement;
    private _parameterDocumentation: HTMLDivElement;
    private _arrows: HTMLSpanElement;
    private _parametersList: SignatureParameterView[] = [];
    private _parameters: HTMLSpanElement;
    private _count: HTMLSpanElement;
    private _selectedIndex: number;
    private _lastIndex: number;
    private _editorLineHeight: number;

    public createdCallback() {
        this._selectedIndex = -1;
        this._lastIndex = -1;
        this._editorLineHeight = 0;

        this._inner = document.createElement("div");
        this._label = document.createElement("span");
        this._documentation = document.createElement("div");
        this._parameterDocumentation = document.createElement("div");
        this._parameterDocumentation.style.marginLeft = "2.4em";
        this._arrows = document.createElement("span");
        this._parameters = document.createElement("span");
        this._count = document.createElement("span");
        this._parametersList = [];

        this.classList.add("tooltip");
        this._inner.classList.add("tooltip-inner");

        this._setupArrows();

        let open = document.createElement("span");
        open.innerText = "(";

        let close = document.createElement("span");
        close.innerText = ")";

        this.appendChild(this._inner);
        this._inner.appendChild(this._documentation);

        this._inner.appendChild(this._arrows);

        this._inner.appendChild(this._label);
        this._inner.appendChild(open);
        this._inner.appendChild(this._parameters);
        this._inner.appendChild(close);

        open = document.createElement("span");
        open.innerText = " [";

        close = document.createElement("span");
        close.innerText = "]";

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

        fastdom.mutate(() => this._count.innerText = (this._selectedIndex + 1).toString());
        this.updateMember(this._member);
    }

    private _setupArrows() {
        const up = document.createElement("a");
        up.classList.add("icon-arrow-up");
        up.onclick = () => this.moveIndex(-1);

        const down = document.createElement("a");
        down.classList.add("icon-arrow-down");
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
    public updateMember(member: Models.SignatureHelp) {
        this._member = member;

        if (this._selectedIndex === -1) {
            this._selectedIndex = member.ActiveSignature;
            if (member.ActiveSignature === -1) {
                // The server basically threw up its arms and said fuck it...
                this._selectedIndex = 0;
            }
        }

        const signature = member.Signatures[this._selectedIndex];
        if (!signature) return;

        let docs: Document;
        if (signature.Documentation)
            docs = parseString(signature.Documentation);

        if (this._lastIndex !== this._selectedIndex) {
            this._lastIndex = this._selectedIndex;
            fastdom.mutate(() => {
                this._count.innerText = (this._selectedIndex + 1).toString();
                this._label.innerText = signature.Name;
                this._documentation.innerText = signature.Documentation;

                if (docs && signature.Documentation) {
                    const s: NodeListOf<HTMLElement> = <any>docs.getElementsByTagName("summary");
                    if (s.length) {
                        const summary = _.trim((s[0]).innerHTML);
                        this._documentation.innerText = summary;
                    } else {
                        this._documentation.innerText = "";
                        this._documentation.style.display = "none";
                    }

                    this._documentation.style.display = "";
                } else {
                    this._documentation.innerText = "";
                    this._documentation.style.display = "none";
                }

                if (member.Signatures.length > 1) {
                    this._arrows.style.display = "";
                } else {
                    this._arrows.style.display = "none";
                }
            });

            this._parametersList = [];

            fastdom.mutate(() => {
                const parameters = signature.Parameters;
                const parametersElement = document.createElement("span");
                _.each(parameters, (parameter, i) => {
                    const view: SignatureParameterView = <any>new exports.SignatureParameterView();
                    view.setMember(parameter);
                    view.setCurrent(i === member.ActiveParameter);

                    if (i > 0) {
                        const comma = document.createElement("span");
                        comma.innerText = ", ";
                        parametersElement.appendChild(comma);
                    }

                    parametersElement.appendChild(view);
                    this._parametersList.push(view);
                });

                const currentElement = this._parameters;
                this._inner.insertBefore(parametersElement, currentElement);
                this._inner.removeChild(currentElement);

                this._parameters = parametersElement;
            });
        } else {
            fastdom.mutate(() => {
                _.each(signature.Parameters, (param, i) =>
                    this._parametersList[i] && this._parametersList[i].setCurrent(i === member.ActiveParameter));
            });
        }

        const currentParameter = signature.Parameters[member.ActiveParameter];
        fastdom.measure(() => {
            if (!currentParameter) return;
            let summary: string;
            if (currentParameter.Documentation) {
                const paramDocs = parseString(currentParameter.Documentation);

                if (paramDocs) {
                    const s: NodeListOf<HTMLElement> = <any>paramDocs.getElementsByTagName("summary");
                    if (s.length) {
                        const summaryElement = s[0];
                        if (summaryElement)
                            summary = _.trim(summaryElement.innerHTML);
                    }
                }
            }

            if (docs && !summary) {
                const s: NodeListOf<HTMLElement> = <any>docs.getElementsByTagName("param");
                if (s.length) {
                    const param = <HTMLElement>_.find(s, x => x.attributes["name"] && x.attributes["name"].value === currentParameter.Name);
                    if (param) {
                        summary = _.trim(param.innerHTML);
                    }
                }
            }

            if (this._parameterDocumentation.innerText !== summary) {
                if (summary) {
                    this._parameterDocumentation.innerText = summary;
                } else {
                    this._parameterDocumentation.innerText = "";
                }
            }
        });

        fastdom.mutate(() => this.style.bottom = `${this.clientHeight + this._editorLineHeight}px`);
    }

    public detachedCallback() {
        _.each(this._parametersList, parameter => parameter.remove());
        this._parametersList = [];
    }
}

(<any>exports).SignatureView = (<any>document).registerElement("omnisharp-signature-help", { prototype: SignatureView.prototype });

export class SignatureParameterView extends HTMLSpanElement { /* implements WebComponent */
    private _member: Models.SignatureHelpParameter;
    private _label: HTMLSpanElement;

    public createdCallback() {
        this._label = document.createElement("span");
        this.appendChild(this._label);
    }

    public setMember(member: Models.SignatureHelpParameter) {
        this._member = member;
        this._label.innerText = member.Label;
    }

    public setCurrent(current: boolean) {
        fastdom.measure(() => {
            if (!current && this.style.fontWeight === "bold") {
                fastdom.mutate(() => this.style.fontWeight = "");
            } else if (current && this.style.fontWeight !== "bold") {
                fastdom.mutate(() => this.style.fontWeight = "bold");
            }
        });
    }
}

(<any>exports).SignatureParameterView = (<any>document).registerElement("omnisharp-signature-parameter", { prototype: SignatureParameterView.prototype });
