/* tslint:disable:no-string-literal */
import { throttle, defer } from 'lodash';

export class CommandOutputWindow extends HTMLDivElement implements WebComponent {
    public displayName = 'CommandOutputWindow';
    private _container: HTMLDivElement;
    private _scrollToBottom: () => void;

    public createdCallback() {
        this.classList.add('omni-output-pane-view', 'native-key-bindings');
        this.tabIndex = -1;

        this._container = document.createElement('div');
        this._container.classList.add('messages-container');
        this.appendChild(this._container);

        this._scrollToBottom = throttle(() => {
            const item = <any>(this.lastElementChild && this.lastElementChild.lastElementChild);
            if (item) item.scrollIntoViewIfNeeded();
        }, 100, { trailing: true });
    }

    public attachedCallback() {
        defer(this._scrollToBottom, this);
    }

    public addMessage(item: { message: string }) {
        const pre = document.createElement('pre');
        pre.innerText = item.message.trim();

        this._container.appendChild(pre);
        this._scrollToBottom();
    }
}

(<any>exports).CommandOutputWindow = (<any>document).registerElement('omnisharp-command-output', { prototype: CommandOutputWindow.prototype });
