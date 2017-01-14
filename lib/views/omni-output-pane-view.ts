/* tslint:disable:no-string-literal */
import {each} from 'lodash';
import {CompositeDisposable} from 'ts-disposables';
import {server} from '../atom/server-information';
import {Convert} from '../services/ansi-to-html';

export class OutputWindow extends HTMLDivElement implements WebComponent {
    public displayName = 'OutputWindow';
    private disposable: CompositeDisposable;
    private _convert: any;
    private _output: OutputMessage[];

    public createdCallback() {
        this._convert = new Convert();
        this._output = [];

        this.classList.add('omni-output-pane-view', 'native-key-bindings');
        this.tabIndex = -1;
    }

    public attachedCallback() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(server.observe.outputElement.subscribe(element => {
            each(this.children, child => child.remove());
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

(<any>exports).OutputWindow = (<any>document).registerElement('omnisharp-output-window', { prototype: OutputWindow.prototype });
