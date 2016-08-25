/* tslint:disable:no-string-literal */
import {Convert} from "../services/ansi-to-html";
import _ from "lodash";
import {server} from "../atom/server-information";
import {CompositeDisposable} from "ts-disposables";

export class BuildOutputWindow extends HTMLDivElement implements WebComponent {
    public displayName = "BuildOutputWindow";
    private _convert: any;
    private _output: OutputMessage[];
    private disposable: CompositeDisposable;

    public createdCallback() {
        this._convert = new Convert();
        this._output = [];

        this.classList.add("build-output-pane-view", "native-key-bindings");
        this.tabIndex = -1;
    }

    public attachedCallback() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(server.observe.outputElement.subscribe(element => {
            _.each(this.children, child => child.remove());
            this.appendChild(element);
        }));
        this.disposable.add(server.observe.output.delay(100).subscribe(() => this.scrollToBottom()));
        this.scrollToBottom();
    }

    public detachedCallback() {
        this.disposable.dispose();
    }

    private scrollToBottom() {
        const item = <any>(this.lastElementChild && this.lastElementChild.lastElementChild);
        if (item) item.scrollIntoViewIfNeeded();
    }
}
