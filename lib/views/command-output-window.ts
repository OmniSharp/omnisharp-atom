/* tslint:disable:no-string-literal */
const _ : _.LoDashStatic = require("lodash");
import {Component} from "./component";

export class CommandOutputWindow extends Component {
    public displayName = "CommandOutputWindow";
    private _container: HTMLDivElement;
    private _scrollToBottom: () => void;

    public createdCallback() {
        super.createdCallback();

        this.classList.add("omni-output-pane-view","native-key-bindings");
        this.tabIndex = -1;

        this._container = document.createElement("div");
        this._container.classList.add("messages-container");

        this._scrollToBottom = _.throttle(() => {
            const item = <any> this.lastElementChild.lastElementChild;
            if (item) item.scrollIntoViewIfNeeded();
        }, 100, { trailing: true });
    }

    public attachedCallback() {
        super.attachedCallback();

        _.defer(this._scrollToBottom, this);
    }

    public addMessage(item: { message: string }) {
        const pre = document.createElement("pre");
        pre.innerText = item.message.trim();

        this._container.appendChild(pre);
    }
}

(<any>exports).CommandOutputWindow = (<any>document).registerElement("omnisharp-command-output", { prototype: CommandOutputWindow.prototype });
