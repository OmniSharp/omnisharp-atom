/* tslint:disable:no-string-literal */
import {Models} from "omnisharp-client";
import * as path from "path";
import {Omni} from "../server/omni";
import {OutputElement, MessageElement} from "./output-component";

function makeKey(error: Models.DiagnosticLocation) {
    return `code-check-${error.LogLevel}-${error.FileName}-(${error.Line}-${error.Column})-(${error.EndLine}-${error.EndColumn})-(${(error.Projects || []).join("-")})`;
}

export class CodeCheckMessageElement extends MessageElement<Models.DiagnosticLocation> {
    private _icon: HTMLSpanElement;
    private _text: HTMLPreElement;
    private _location: HTMLPreElement;
    private _filename: HTMLPreElement;

    public createdCallback() {
        this.classList.add("codecheck");

        const icon = this._icon = document.createElement("span");
        icon.classList.add("fa");
        this.appendChild(icon);

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

        if (item.LogLevel === "Error") {
            this._icon.classList.add("fa-times-circle");
            this._icon.classList.remove("fa-exclamation-triangle");
        } else {
            this._icon.classList.add("fa-exclamation-triangle");
            this._icon.classList.remove("fa-times-circle");
        }

        this._text.innerText = item.Text;
        this._location.innerText = `${path.basename(item.FileName)}(${item.Line},${item.Column})`;
        this._filename.innerText = path.dirname(item.FileName);
    }
}

(<any>exports).CodeCheckMessageElement = (<any>document).registerElement("omnisharp-codecheck-message", { prototype: CodeCheckMessageElement.prototype });

export class CodeCheckOutputElement extends OutputElement<Models.DiagnosticLocation, CodeCheckMessageElement> {
    public displayName = "FindPaneWindow";

    public createdCallback() {
        super.createdCallback();
        this.classList.add("codecheck-output-pane");
    }

    public attachedCallback() {
        super.attachedCallback();
        this.disposable.add(Omni.diagnostics
            .delay(100)
            .subscribe(diagnostics => this.updateOutput(diagnostics)));
    }

    protected getKey(error: Models.DiagnosticLocation) {
        return `code-check-${error.LogLevel}-${error.FileName}-(${error.Line}-${error.Column})-(${error.EndLine}-${error.EndColumn})-(${(error.Projects || []).join("-")})`;
    }

    protected update() { /* */ }
    protected eventName() { return "diagnostic"; }
    protected elementType() { return exports.CodeCheckMessageElement; }

    protected handleClick(item: Models.DiagnosticLocation, key: string, index: number) {
        this.goToLine(item);
    }

    private goToLine(location: Models.DiagnosticLocation) {
        Omni.navigateTo(location);
        this.selected = makeKey(location);
    }
}

(<any>exports).CodeCheckOutputElement = (<any>document).registerElement("omnisharp-codecheck-output", { prototype: CodeCheckOutputElement.prototype });
