import {Component} from "./component";

export abstract class MessageElement<TItem> extends HTMLLIElement implements WebComponent {
    private _key: string;
    public get key() { return this._key; }

    public set selected(value: boolean) { if (value) this.classList.add("selected"); else this.classList.remove("selected"); }

    public setMessage(key: string, item: TItem) {
        this._key = key;
    }
}

export abstract class OutputElement<TItem, TElement extends MessageElement<TItem>> extends Component {
    private output: TItem[];
    private _selectedKey: string;
    private _selectedIndex: number;
    private _selectedElement: TElement;
    private _container: HTMLOListElement;
    private _update: () => void;

    public createdCallback() {
        super.createdCallback();
        this.output = [];
        this.tabIndex = -1;

        this._update = _.throttle(() => {
            const add: TElement[] = [];
            const remove: Element[] = [];
            if (this._container.children.length > this.output.length) {
                for (let i = this._container.children.length - this.output.length - 1; i < this._container.children.length; i++) {
                    remove.push(this._container.children[i]);
                }
            } else {
                for (let i = this._container.children.length - 1; i < this.output.length; i++) {
                    add.push(new (this.elementType()));
                }
            }

            window.requestAnimationFrame(() => {
                _.each(add, x => this._container.appendChild(x));
                _.each(remove, x => x.remove());

                _.each(this.output, (item, i) => {
                    const child: TElement = <any>this._container.children[i];
                    const key = this.getKey(item);
                    if (child.key !== key) {
                        child.setMessage(key, item);
                    }

                    this.onclick = (e) => {
                        this.selected = child.key;
                        this.handleClick(item, child.key, i);
                    };

                    if (child.key === this._selectedKey && !child.selected) {
                        child.selected = true;
                    } else if (child.selected) {
                        child.selected = false;
                    }
                });

                this.scrollToItemView();
            });
        }, 100, { trailing: true });
    }

    public attachedCallback() {
        super.attachedCallback();

        this.scrollTop = $(this).scrollTop();
        this.onkeydown = (e: any) => this.keydownPane(e);
    }

    protected abstract getKey(message: TItem): string;
    protected abstract update(): void;
    protected abstract eventName(): string;
    protected abstract handleClick(item: TItem, key: string, index: number): void;
    protected abstract elementType(): { new (): TElement };

    public get selected() { return this._selectedKey; }
    public set selected(value: string) {
        const index = _.findIndex(this._container.children, (e: TElement) => e.key === value);
        if (index) {
            const e: TElement = <any>this._container.children[index];
            this._selectedKey = value;
            this._selectedIndex = index;
            this._selectedElement.selected = false;
            this._selectedElement = e;
            e.selected = true;
        }
    }

    protected updateOutput(output: TItem[]) {
        this.output = output;
        this._update();
    }

    public detachedCallback() {
        super.detachedCallback();
        this.onkeydown = undefined;
    }

    private keydownPane(e: any) {
        if (e.keyIdentifier === "Down") {
            atom.commands.dispatch(atom.views.getView(atom.workspace), `omnisharp-atom:next-${this.eventName()}`);
        } else if (e.keyIdentifier === "Up") {
            atom.commands.dispatch(atom.views.getView(atom.workspace), `omnisharp-atom:previous-${this.eventName()}`);
        } else if (e.keyIdentifier === "Enter") {
            atom.commands.dispatch(atom.views.getView(atom.workspace), `omnisharp-atom:go-to-${this.eventName()}`);
        }
    }

    private scrollToItemView() {
        const self = $(this);
        const item = self.find(`li.selected`);
        if (!item || !item.position()) return;

        const pane = self;
        const scrollTop = pane.scrollTop();
        const desiredTop = item.position().top + scrollTop;
        const desiredBottom = desiredTop + item.outerHeight();

        if (desiredTop < scrollTop) {
            pane.scrollTop(desiredTop);
        } else if (desiredBottom > pane.scrollBottom()) {
            pane.scrollBottom(desiredBottom);
        }
    }
}
