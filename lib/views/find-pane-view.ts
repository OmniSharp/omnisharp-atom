/* tslint:disable:no-string-literal */
import {Models} from "omnisharp-client";
import {Omni} from "../server/omni";
import * as path from "path";
import {findUsages} from "../features/find-usages";
import {OutputElement, MessageElement} from "./output-component";

export class FindMessageElement extends MessageElement<Models.QuickFix> {
    private _text: HTMLPreElement;
    private _location: HTMLPreElement;
    private _filename: HTMLPreElement;

    public createdCallback() {
        this.classList.add("find-usages");

        const text = this._text = document.createElement("pre");
        text.classList.add("text-highlight");
        this.appendChild(text);

        const location = this._location = document.createElement("pre");
        location.classList.add("inline-block");
        this.appendChild(location);

        const filename = this._filename = document.createElement("pre");
        filename.classList.add("text-subtle", "inline-block");
        this.appendChild(filename);
    }

    public setMessage(key: string, item: Models.DiagnosticLocation) {
        super.setMessage(key, item);

        this.classList.add(`${item.LogLevel}`);
        this._text.innerText = item.Text;
        this._location.innerText = `${path.basename(item.FileName)}(${item.Line},${item.Column})`;
        this._filename.innerText = path.dirname(item.FileName);
    }
}

(<any>exports).FindMessageElement = (<any>document).registerElement("omnisharp-find-message", { prototype: FindMessageElement.prototype });

export class FindWindow extends OutputElement<Models.QuickFix, FindMessageElement> {
    public displayName = "FindPaneWindow";

    public createdCallback() {
        super.createdCallback();

        this.classList.add("error-output-pane");
    }

    public attachedCallback() {
        super.attachedCallback();
        this.disposable.add(findUsages.observe.reset.merge(findUsages.observe.find.map(z => true))
            .subscribe(() => this.updateOutput(findUsages.usages)));
    }

    protected getKey(usage: Models.QuickFix) {
        return `quick-fix-${usage.FileName}-(${usage.Line}-${usage.Column})-(${usage.EndLine}-${usage.EndColumn})-(${usage.Projects.join("-")})`;
    }

    protected update() { /* */ }
    protected eventName() { return "diagnostic"; }
    protected elementType() { return exports.FindMessageElement; }

    protected handleClick(item: Models.QuickFix, key: string, index: number) {
        this.gotoUsage(item);
    }

    private gotoUsage(quickfix: Models.QuickFix) {
        Omni.navigateTo(quickfix);
    }
}
