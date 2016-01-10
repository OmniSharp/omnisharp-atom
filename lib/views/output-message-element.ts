/* tslint:disable:variable-name */
const Convert = require("ansi-to-html");
/* tslint:enable:variable-name */

const convert = new Convert();

export class OutputMessageElement extends HTMLPreElement implements WebComponent {
    public set message(value: OutputMessage) { this.innerHTML = convert.toHtml(value.message).trim(); this.className = ""; this.classList.add(value.logLevel); }
}

(<any>exports).OutputMessageElement = (<any>document).registerElement("omnisharp-output-message", { prototype: OutputMessageElement.prototype });
