/* tslint:disable:no-string-literal */
/* tslint:disable:variable-name */
const Convert = require("ansi-to-html");
const convert = new Convert();
/* tslint:enable:variable-name */
const _: _.LoDashStatic = require("lodash");
import {Component} from "./component";

// ctrl-r. ctrl-t run test
// ctrl-r, ctrl-f run fixture
// ctrl-r, ctrl-a run all
// ctrl-r, ctrl-l run last

export class TestResultsWindow extends Component {
    public displayName = "CommandOutputWindow";
    private _container: HTMLDivElement;
    private _scrollToBottom: () => void;

    public createdCallback() {
        super.createdCallback();

        this.classList.add("omni-output-pane-view", "native-key-bindings");
        this.tabIndex = -1;

        this._container = document.createElement("div");
        this._container.classList.add("messages-container");

        this._scrollToBottom = _.throttle(() => {
            const item = <any>this.lastElementChild.lastElementChild;
            if (item) item.scrollIntoViewIfNeeded();
        }, 100, { trailing: true });
    }

    public attachedCallback() {
        super.attachedCallback();

        _.defer(this._scrollToBottom, this);
    }

    public addMessage(item: OutputMessage) {
        const pre = document.createElement("pre");
        pre.classList.add(item.logLevel);
        pre.innerText = convert.toHtml(item.message).trim();

        this._container.appendChild(pre);
    }

    public clear() {
        this._container.innerHTML = "";
    }
}

(<any>exports).TestResultsWindow = (<any>document).registerElement("omnisharp-test-results", { prototype: TestResultsWindow.prototype });
