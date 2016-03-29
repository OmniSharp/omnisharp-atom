import {Convert} from "../services/ansi-to-html";
const convert = new Convert();

const props = {
    set: function message(value: OutputMessage) {
        this.innerHTML = convert.toHtml(value.message).trim();
        this.classList.add(value.logLevel);
    }
};

export namespace OutputMessageElement {
    export function create(value: OutputMessage) {
        const pre = document.createElement("pre");
        Object.defineProperty(pre, "message", props);
        (pre as any).message = value;

        return pre;
    }
};
