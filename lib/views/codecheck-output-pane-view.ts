import {Models} from "omnisharp-client";
import * as path from "path";
import {Omni} from "../server/omni";
import {OutputElement, MessageElement} from "./output-component";

export interface CodeCheckMessageElement extends MessageElement<Models.DiagnosticLocation> { }

const getMessageElement = (function() {
    const selectedProps = {
        get: function selected() { return this.classList.contains("selected"); },
        set: function selected(value: boolean) { if (value) this.classList.add("selected"); else this.classList.remove("selected"); }
    };

    const keyProps = {
        get: function key() { return this._key; }
    };

    const inviewProps = {
        get: function inview() { return this._inview; },
        set: function inview(value: boolean) { this._inview = value; }
    };

    function setMessage(key: string, item: Models.DiagnosticLocation) {
        this._key = key;

        this.classList.add(`${item.LogLevel}`);

        if (item.LogLevel === "Error") {
            this._icon.classList.add("fa-times-circle");
            this._icon.classList.remove("fa-exclamation-triangle");
            this._icon.classList.remove("fa-info");
        } else if (item.LogLevel === "Warning") {
            this._icon.classList.add("fa-exclamation-triangle");
            this._icon.classList.remove("fa-times-circle");
            this._icon.classList.remove("fa-info");
        } else {
            this._icon.classList.add("fa-info");
            this._icon.classList.remove("fa-exclamation-triangle");
            this._icon.classList.remove("fa-times-circle");
        }

        this._text.innerText = item.Text;
        this._location.innerText = `${path.basename(item.FileName)}(${item.Line},${item.Column})`;
        this._filename.innerText = path.dirname(item.FileName);
    }

    function attached() { /* */ }

    function detached() { /* */ }

    return function getMessageElement(): CodeCheckMessageElement {
        const element: CodeCheckMessageElement = <any>document.createElement("li");
        element.classList.add("codecheck");

        const icon = (element as any)._icon = document.createElement("span");
        icon.classList.add("fa");
        element.appendChild(icon);

        const text = (element as any)._text = document.createElement("pre");
        text.classList.add("text-highlight");
        element.appendChild(text);

        const location = (element as any)._location = document.createElement("pre");
        location.classList.add("inline-block");
        element.appendChild(location);

        const filename = (element as any)._filename = document.createElement("pre");
        filename.classList.add("text-subtle", "inline-block");
        element.appendChild(filename);

        Object.defineProperty(element, "key", keyProps);
        Object.defineProperty(element, "selected", selectedProps);
        Object.defineProperty(element, "inview", inviewProps);
        element.setMessage = setMessage;
        element.attached = attached;
        element.detached = detached;

        return element;
    };
})();

export class CodeCheckOutputElement extends HTMLDivElement implements WebComponent {
    public displayName = "FindPaneWindow";
    private _list: OutputElement<Models.DiagnosticLocation, CodeCheckMessageElement>;

    public createdCallback() {
        this.classList.add("codecheck-output-pane");
        this._list = new OutputElement<Models.DiagnosticLocation, CodeCheckMessageElement>();
        this.appendChild(this._list);
        this._list.getKey = (error: Models.DiagnosticLocation) => {
            return `code-check-${error.LogLevel}-${error.FileName}-(${error.Line}-${error.Column})-(${error.EndLine}-${error.EndColumn})-(${(error.Projects || []).join("-")})`;
        };
        this._list.handleClick = (item: Models.DiagnosticLocation) => {
            this.goToLine(item);
        };
        this._list.eventName = "diagnostic";
        this._list.elementFactory = getMessageElement;
    }

    public attachedCallback() {
        this._list.attached();
    }

    public detachedCallback() {
        this._list.detached();
    }

    public update(output: Models.DiagnosticLocation[]) {
        this._list.updateOutput(output);
    }

    public next() {
        this._list.next();
    }

    public prev() {
        this._list.prev();
    }

    public get selectedIndex() { return this._list.selectedIndex; }
    public set selectedIndex(value) { this._list.selectedIndex = value; }
    public get current() { return this._list.current; }

    private goToLine(location: Models.DiagnosticLocation) {
        Omni.navigateTo(location);
    }
}

(<any>exports).CodeCheckOutputElement = (<any>document).registerElement("omnisharp-codecheck-output", { prototype: CodeCheckOutputElement.prototype });
