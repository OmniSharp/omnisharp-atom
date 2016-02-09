/**
 * The MIT License (MIT)
 *
 * Copyright (C) 2013 Sergi Mansilla
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
// https://raw.githubusercontent.com/sergi/virtual-list/master/vlist.js

import {debounce} from "lodash";
let fastdom: typeof Fastdom = require("fastdom");

export class VirtualList<TItem, T extends HTMLElement> extends HTMLOListElement implements WebComponent {
    public static createScroller() {
        const scroller = document.createElement("div");
        scroller.style.opacity = "0";
        scroller.style.position = "absolute";
        scroller.style.top = 0 + "px";
        scroller.style.left = 0 + "px";
        scroller.style.width = "1px";
        return scroller;
    }

    private _items: LazyArray<TItem, T>;
    protected get items() { return this._items; };
    protected set items(value) {
        this._items = value;
        this.scroller.style.height = `${this.itemHeight * this.items.length}px`;
    };

    private _itemHeight: number;
    private get itemHeight() {
        if (this._itemHeight === -1 && this.children.length > 1) {
            if ((<HTMLElement>this.children[1]).style.display === "none") {
                (<HTMLElement>this.children[1]).style.display = "";
            }
            if ((<HTMLElement>this.children[1]).offsetHeight > 0) {
                this._itemHeight = (<HTMLElement>this.children[1]).offsetHeight;
                this.scroller.style.height = `${this._itemHeight * this.items.length}px`;
            }
        }
        return this._itemHeight;
    }

    protected cleanup: () => void;
    protected scroller: HTMLDivElement;
    private disposable: Rx.IDisposable;

    public get screenItemsLen() { return Math.ceil(this.itemHeight > 0 ? this.offsetHeight / this.itemHeight : 10); }
    public get cachedItemsLen() { return this.screenItemsLen * 3; }

    public createdCallback() {
        const scroller = this.scroller = VirtualList.createScroller();
        this.style.padding = 0 + "px";
        this.style.border = "1px solid black";
        this.style.flex = "1";
        this.appendChild(scroller);

        this._items = new LazyArray<TItem, T>([], () => this.cachedItemsLen);
        this._itemHeight = -1;

        this.cleanup = debounce(() => {
            fastdom.mutate(() => {
                const badNodes = document.querySelectorAll("[data-rm=\"1\"]");
                for (var i = 0, l = badNodes.length; i < l; i++) {
                    this.removeChild(badNodes[i]);
                }
            });
        }, 100);

        this.disposable = atom.config.observe("editor.fontSize", (size: number) => {
            this._itemHeight = -1;
        });

        this._scroll = (e: UIEvent) => {
            fastdom.measure(() => {
                const maxBuffer = this.screenItemsLen * this.itemHeight;
                const scrollTop = (<HTMLElement>e.target).scrollTop; // Triggers reflow
                if (!this._lastRepaintY || Math.abs(scrollTop - this._lastRepaintY) > maxBuffer) {
                    const first = scrollTop / this.itemHeight - this.screenItemsLen;
                    this._renderChunk(this, first < 0 ? 0 : first);
                    this._lastRepaintY = scrollTop;
                }
            });

            e.preventDefault();

            this.cleanup();
        };
    }

    private _lastRepaintY: number;
    protected _scroll: (e: UIEvent) => void;

    public attachedCallback() {
        this.parentElement.style.display = "flex";
        this._renderChunk(this, 0);

        this.parentElement.addEventListener("scroll", this._scroll);
    }

    public detachedCallback() {
        this.disposable.dispose();
        this.parentElement.removeEventListener("scroll", this._scroll);
    }

    public createRow(index: number) {
        const item = this.items.get(index);
        if (!item) return;
        item.classList.add("vrow");
        item.style.position = "absolute";
        const height = this.itemHeight;
        if (height === -1) {
            item.style.top = "0px";
        } else {
            item.style.top = `${(index * this.itemHeight)}px`;
        }
        item.style.display = "";
        item.removeAttribute("data-rm");
        return item;
    }

    /**
     * Renders a particular, consecutive chunk of the total rows in the list. To
     * keep acceleration while scrolling, we mark the nodes that are candidate for
     * deletion instead of deleting them right away, which would suddenly stop the
     * acceleration. We delete them once scrolling has finished.
     *
     * @param {Node} node Parent node where we want to append the children chunk.
     * @param {Number} from Starting position, i.e. first children index.
     * @return {void}
     */
    protected _renderChunk(node: HTMLElement, from: number) {
        let finalItem = from + this.cachedItemsLen;
        if (finalItem > this.items.length)
            finalItem = this.items.length;

        fastdom.mutate(() => {
            this.scroller.style.height = `${(this.itemHeight > 0 ? this.itemHeight : 10) * this.items.length}px`;
            // Append all the new rows in a document fragment that we will later append to
            // the parent node
            let fragment = document.createDocumentFragment();
            for (let i = from; i < finalItem; i++) {
                const item = this.createRow(i);
                if (!item) continue;
                fragment.appendChild(item);
                (<any>item).attached();
            }

            // Hide and mark obsolete nodes for deletion.
            for (let j = 1, l = node.childNodes.length; j < l; j++) {
                (<HTMLElement>node.childNodes[j]).style.display = "none";
                (<HTMLElement>node.childNodes[j]).setAttribute("data-rm", "1");
                if (typeof (<any>node.childNodes[j]).detached === "function") {
                    (<any>node.childNodes[j]).detached();
                }
            }
            node.appendChild(fragment);

            this.cleanup();
        });
    }
}

export class LazyArray<TIn, TElement extends HTMLElement> {
    private elements = new Map<number, TElement[]>();
    constructor(private items: TIn[], private pageSize: () => number, private factory?: (item: TIn) => TElement) { }

    public get(index: number) {
        const page = Math.floor(index / this.pageSize());
        if (!this.elements.has(page)) {
            const elements: TElement[] = [];
            for (let i = page, len = page + this.pageSize(); i < len; i++) {
                if (this.factory) {
                    elements.push(this.factory(this.items[i]));
                }
            }
            this.elements.set(page, elements);
        }

        const pageIndex = index - page * this.pageSize();
        return this.elements.get(page)[pageIndex];
    }

    public get length() { return this.items.length; }
}
