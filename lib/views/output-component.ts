let fastdom: typeof Fastdom = require("fastdom");
const _: _.LoDashStatic = require("lodash");
import {VirtualList, LazyArray} from "./virtual-list";

export interface MessageElement<TItem> extends HTMLLIElement {
    key: string;
    selected: boolean;
    inview: boolean;
    setMessage(key: string, item: TItem): void;
    item: TItem;
    attached(): void;
    detached(): void;
}

export class OutputElement<TItem, TElement extends MessageElement<TItem>> extends VirtualList<TItem, TElement> {
    private _selectedKey: string;
    private _selectedIndex: number;
    private _selectedElement: TElement;
    private _update: (cb: Function) => void;

    public createdCallback() {
        super.createdCallback();
        this.classList.add("messages-container");

        this._update = _.throttle((cb: Function) => {
            this._renderChunk(this, 0);
            fastdom.mutate(() => {
                this.scrollToItemView();
                this._calculateInview();
                cb();
            });
        }, 100, { leading: true, trailing: true });

        this.onkeydown = (e: any) => this.keydownPane(e);

        const baseScroll = this._scroll;
        const throttleScroll = _.throttle((e: UIEvent) => this._calculateInview(), 100, { leading: true, trailing: true });

        this._scroll = (e) => {
            throttleScroll(e);
            return baseScroll(e);
        };
    }

    public attachedCallback() {
        super.attachedCallback();
        //this.parentElement.addEventListener("scroll", this._scroll);
        this._calculateInview();
    }

    public attached() {
        fastdom.mutate(() => {
            this._update(() => { /* */ });
        });
    }

    public detached() {
        fastdom.mutate(() => {
            _.each(this.children, (x: TElement) => x.detached());
        });
    }

    private _calculateInview() {
        const self = this;
        fastdom.measure(() => {
            const top = self.scrollTop;
            const bottom = top + this.parentElement.clientHeight * 2;

            for (let i = 0, len = this.children.length; i < len; i++) {
                const child: TElement = <any>this.children[i];
                const childTop = child.scrollTop;
                const height = child.clientHeight;
                const inview = childTop + height > top && childTop < bottom;

                if (child.inview !== inview) {
                    fastdom.mutate(() => {
                        child.inview = inview;
                    });
                }
            }
        });
    }

    public getKey: (message: TItem) => string;
    public eventName: string;
    public handleClick: (item: TItem) => void;
    public elementFactory: () => TElement;

    public get selected() { return this._selectedKey; }
    public set selected(value: string) {
        const index = _.findIndex(this.children, (e: TElement) => e.key === value);
        if (index) {
            const e: TElement = <any>this.children[index];
            this._selectedKey = value;
            this._selectedIndex = index;
            if (this._selectedElement) {
                this._selectedElement.selected = false;
            }
            this._selectedElement = e;
            e.selected = true;
        }
    }

    public get selectedIndex() { return this._selectedIndex; }
    public set selectedIndex(index) {
        const e: TElement = <any>this.children[index];
        if (e) {
            this.selected = e.key;
        }
    }

    public get current() { return this.items.get(this._selectedIndex).item; }

    public next() {
        this.selectedIndex = this._selectedIndex + 1;
    }

    public prev() {
        this.selectedIndex = this._selectedIndex - 1;
    }

    private _onclickHandler: (e: UIEvent) => void;

    public updateOutput(output: TItem[]) {
        if (!this._onclickHandler) {
            const parent = this;
            this._onclickHandler = function(e: UIEvent) {
                parent.selected = this.key;
                parent.handleClick(this.item);
            };
        }

        this.items = new LazyArray<TItem, TElement>(output, () => this.cachedItemsLen,
            (item: TItem) => {
                const child = this.elementFactory();
                const key = this.getKey(item);
                child.onclick = this._onclickHandler;
                child.setMessage(key, item);
                child.item = item;
                return child;
            });
        this._update(() => { /* */ });
    }

    private keydownPane(e: any) {
        if (e.keyIdentifier === "Down") {
            atom.commands.dispatch(atom.views.getView(atom.workspace), `omnisharp-atom:next-${this.eventName}`);
        } else if (e.keyIdentifier === "Up") {
            atom.commands.dispatch(atom.views.getView(atom.workspace), `omnisharp-atom:previous-${this.eventName}`);
        } else if (e.keyIdentifier === "Enter") {
            atom.commands.dispatch(atom.views.getView(atom.workspace), `omnisharp-atom:go-to-${this.eventName}`);
        }
    }

    private scrollToItemView() {
        const self = this;
        const item = self.querySelector(`.selected`);
        if (!item) return;

        const pane = self;
        const scrollTop = pane.scrollTop;
        const desiredTop = item.scrollTop + scrollTop;
        const desiredBottom = desiredTop + item.clientHeight;

        if (desiredTop < scrollTop) {
            pane.scrollTop = desiredTop;
        } else if (desiredBottom > pane.scrollTop + item.clientHeight) {
            pane.scrollTop = desiredBottom + item.clientHeight;
        }
    }
}

(<any>exports).OutputElement = (<any>document).registerElement("omnisharp-output-list", { prototype: OutputElement.prototype });
