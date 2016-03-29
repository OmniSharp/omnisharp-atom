/* tslint:disable:no-string-literal */
import {Convert} from "../services/ansi-to-html";
const convert = new Convert();
import _ from "lodash";

// ctrl-r. ctrl-t run test
// ctrl-r, ctrl-f run fixture
// ctrl-r, ctrl-a run all
// ctrl-r, ctrl-l run last

export class TestResultsWindow extends HTMLDivElement implements WebComponent {
    public displayName = "CommandOutputWindow";
    private _container: HTMLDivElement;
    private _scrollToBottom: () => void;

    public createdCallback() {
        this.classList.add("omni-output-pane-view", "native-key-bindings");
        this.tabIndex = -1;

        this._container = document.createElement("div");
        this._container.classList.add("messages-container");
        this.appendChild(this._container);

        this._scrollToBottom = _.throttle(() => {
            const item = <any>(this.lastElementChild && this.lastElementChild.lastElementChild);
            if (item) item.scrollIntoViewIfNeeded();
        }, 100, { trailing: true });
    }

    public attachedCallback() {
        _.defer(this._scrollToBottom, this);
    }

    public addMessage(item: OutputMessage) {
        const pre = document.createElement("pre");
        pre.classList.add(item.logLevel);
        pre.innerText = convert.toHtml(item.message).trim();

        this._container.appendChild(pre);
        this._scrollToBottom();
    }

    public clear() {
        this._container.innerHTML = "";
    }
}

(<any>exports).TestResultsWindow = (<any>document).registerElement("omnisharp-test-results", { prototype: TestResultsWindow.prototype });
