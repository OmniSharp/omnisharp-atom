/* tslint:disable:no-string-literal */
/* tslint:disable:variable-name */
const Convert = require("ansi-to-html");
/* tslint:enable:variable-name */
const _: _.LoDashStatic = require("lodash");
import {Component} from "./component";
import {server} from "../atom/server-information";

export class BuildOutputWindow extends Component {
    public displayName = "BuildOutputWindow";
    private _convert: any;
    private _output: OutputMessage[];

    public createdCallback() {
        super.createdCallback();

        this._convert = new Convert();
        this._output = [];

        this.classList.add("build-output-pane-view", "native-key-bindings");
        this.tabIndex = -1;
    }

    public attachedCallback() {
        super.attachedCallback();

        this.disposable.add(server.observe.outputElement.subscribe(element => {
            _.each(this.children, child => child.remove());
            this.appendChild(element);
        }));
        this.disposable.add(server.observe.output.delay(100).subscribe(() => this.scrollToBottom()));
        this.scrollToBottom();
    }

    private scrollToBottom() {
        const item = <any>this.lastElementChild.lastElementChild;
        if (item) item.scrollIntoViewIfNeeded();
    }
}
