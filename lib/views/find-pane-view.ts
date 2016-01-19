/* tslint:disable:no-string-literal */
import {Models} from "omnisharp-client";
import {Omni} from "../server/omni";
import * as path from "path";
import {OutputElement, MessageElement} from "./output-component";
import {HighlightElement} from "./highlight-element";

export interface FindMessageElement extends MessageElement<Models.DiagnosticLocation> { }

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
        set: function inview(value: boolean) {
            if (!this._inview && value) {
                this._text.enhance();
            }
            this._inview = value;
        }
    };

    function setMessage(key: string, item: Models.DiagnosticLocation) {
        this._key = key;
        this._inview = false;

        this.classList.add(item.LogLevel);
        this._usage = item;
        this._text.usage = item;
        this._location.innerText = `${path.basename(item.FileName)}(${item.Line},${item.Column})`;
        this._filename.innerText = path.dirname(item.FileName);
    }

    function attached() {
        this._text.usage = this._usage;
    }

    function detached() { this._inview = false; }

    return function getMessageElement(): FindMessageElement {
        const element: FindMessageElement = <any>document.createElement("li");
        element.classList.add("find-usages");

        const text = (element as any)._text = new HighlightElement();
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

export class FindWindow extends HTMLDivElement implements WebComponent {
    public displayName = "FindPaneWindow";
    private _list: OutputElement<Models.QuickFix, FindMessageElement>;

    public createdCallback() {
        this.classList.add("find-output-pane");
        this._list = new OutputElement<Models.QuickFix, FindMessageElement>();
        this.appendChild(this._list);
        this._list.getKey = (usage: Models.QuickFix) => {
            return `quick-fix-${usage.FileName}-(${usage.Line}-${usage.Column})-(${usage.EndLine}-${usage.EndColumn})-(${usage.Projects.join("-")})`;
        };
        this._list.handleClick = (item: Models.QuickFix) => {
            this.gotoUsage(item);
        };
        this._list.eventName = "usage";
        this._list.elementFactory = getMessageElement;
    }

    public attachedCallback() {
        this._list.attached();
    }

    public detachedCallback() {
        this._list.detached();
    }

    public update(output: Models.QuickFix[]) {
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

    private gotoUsage(quickfix: Models.QuickFix) {
        Omni.navigateTo(quickfix);
    }
}

(<any>exports).FindWindow = (<any>document).registerElement("omnisharp-find-window", { prototype: FindWindow.prototype });
