import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import {CompositeDisposable, Observable} from "rx";
import * as $ from "jquery";
import * as path from "path";
import {findUsages} from "../features/find-usages";
import {HighlightElement} from "./highlight-element";
import * as fastdom from "fastdom";

var write = <MethodDecorator>function(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>): void {
    var value = descriptor.value;
    descriptor.value = function() {
        fastdom.write(function() {
            value.apply(target, arguments);
        });
    };
}

export class FindWindowElement extends HTMLDivElement implements WebComponent {
    private _disposable: CompositeDisposable;

    private _selectedIndex: number;
    public get selectedIndex() {
        return this._selectedIndex;
    }

    public set selectedIndex(value) {
        var current = this._list.children[this._selectedIndex];
        var next = this._list.children[value];

        current && current.classList.remove('selected');
        next && next.classList.remove('selected');

        this._selectedIndex = value;
        this._scrollToItemView();
    }

    private _scrollTop: number;
    public get scrollTop() {
        return this._scrollTop;
    }

    public set scrollTop(value) {
        this._scrollTop = value;
        if (this._container.scrollTop !== value) {
            this._container.scrollTop = value;
        }
    }

    private _usages: OmniSharp.Models.DiagnosticLocation[];
    public get usages() { return this._usages; }
    public set usages(usages) {

        if (!this._usages && usages && usages.length) {
            this._usages = usages;
            Observable.from(usages)
                .flatMap(x => Observable.just(x).delay(20))
                .map((usage, index) => {
                    var selected = index === this.selectedIndex;
                    var li = document.createElement('li');
                    li.classList.add('find-usages');
                    if (selected) {
                        li.classList.add('selected');
                    }
                    var highlightedText = new HighlightElement();
                    highlightedText.usage = usage;
                    li.appendChild(highlightedText);

                    li.onmouseover = () => {
                        li.onmouseover = null;
                        highlightedText.enableSemanticHighlighting();
                    }

                    li.onclick = () => this._gotoUsage(usage, index);

                    var inlineBlock = document.createElement('pre');
                    inlineBlock.innerText = `${path.basename(usage.FileName) }(${usage.Line},${usage.Column})`;
                    inlineBlock.classList.add('inline-block');
                    li.appendChild(inlineBlock);

                    var subtleText = document.createElement('pre');
                    subtleText.innerText = `${path.dirname(usage.FileName) }`;
                    subtleText.classList.add('inline-block', 'text-subtle');
                    li.appendChild(subtleText);

                    this._list.appendChild(li);
                })
                .subscribe();

            this._container.appendChild(this._list);
        }
    }

    private _container: HTMLDivElement;
    private _list: HTMLOListElement;

    public createdCallback() {
        this._disposable = new CompositeDisposable();

        var div = this._container = document.createElement('div');
        div.classList.add('error-output-pane'); // className?
        div.onscroll = (e) => this.scrollTop = (<any>e.currentTarget).scrollTop;
        div.onkeydown = this._keydownPane;
        div.tabIndex = -1;

        var ol = this._list = document.createElement('ol');
        ol.style.cursor = 'pointer';

        this._selectedIndex = 0;
        this._scrollTop = 0;
        this.appendChild(this._container);
    }

    @write
    public attachedCallback() {
    }

    public detachedCallback() {
        this.destory();
    }

    public destory() {
        this._disposable.dispose();
    }

    private _gotoUsage(quickfix: OmniSharp.Models.QuickFix, index: number) {
        Omni.navigateTo(quickfix);
        this.selectedIndex = index;
    }

    private _keydownPane(e: KeyboardEvent) {
        if (e.key == 'ArrowDown') {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:next-usage");
        }
        else if (e.key == 'ArrowUp') {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:previous-usage");
        }
        else if (e.key == 'Enter') {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:go-to-usage");
        }
    }

    private _scrollToItemView() {
        var self = $(this);
        var item = self.find(`li.selected`);
        if (!item || !item.position()) return;

        var pane = self;
        var scrollTop = pane.scrollTop();
        var desiredTop = item.position().top + scrollTop;
        var desiredBottom = desiredTop + item.outerHeight();

        if (desiredTop < scrollTop)
            pane.scrollTop(desiredTop);
        else if (desiredBottom > pane.scrollBottom())
            pane.scrollBottom(desiredBottom);
    }

    private _updateSelectedItem(index: number) {
        if (index < 0)
            index = 0;
        if (index >= this.usages.length)
            index = this.usages.length - 1;
        if (this.selectedIndex !== index)
            this.selectedIndex = index;
    }

    public next() {
        this._updateSelectedItem(this.selectedIndex + 1);
    }

    public goto() {
        if (this.usages[this.selectedIndex])
            Omni.navigateTo(this.usages[this.selectedIndex]);
    }

    public previous() {
        this._updateSelectedItem(this.selectedIndex - 1);
    }

    public gotoNext() {
        this._updateSelectedItem(this.selectedIndex + 1);
        if (this.usages[this.selectedIndex])
            Omni.navigateTo(this.usages[this.selectedIndex]);
    }

    public gotoPrevious() {
        this._updateSelectedItem(this.selectedIndex - 1);
        if (this.usages[this.selectedIndex])
            Omni.navigateTo(this.usages[this.selectedIndex]);
    }
}

(<any>exports).FindWindowElement = (<any>document).registerElement('omnisharp-find-window', { prototype: FindWindowElement.prototype });
