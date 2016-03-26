import {Models} from "omnisharp-client";
import * as SpacePen from "atom-space-pen-views";
import {frameworkSelector} from "../atom/framework-selector";
const $: JQueryStatic = require("jquery");

interface FrameworkSelectorState {
    frameworks?: Models.DotNetFramework[];
    activeFramework?: Models.DotNetFramework;
    alignLeft?: boolean;
}

export class FrameworkSelectorComponent extends HTMLAnchorElement implements WebComponent {
    public frameworks: Models.DotNetFramework[];
    private _activeFramework: Models.DotNetFramework;
    public get activeFramework() { return this._activeFramework; }
    public set activeFramework(value) { this._activeFramework = value; this.innerText = this.activeFramework.FriendlyName; }

    public alignLeft: boolean;

    public createdCallback() {
        this.onclick = (e) => {
            const view = new FrameworkSelectorSelectListView(atom.workspace.getActiveTextEditor(), {
                attachTo: ".framework-selector",
                alignLeft: this.alignLeft,
                items: this.frameworks,
                save: (framework: Models.DotNetFramework) => {
                    frameworkSelector.setActiveFramework(framework);
                    view.hide();
                }
            });
            view.appendTo(<any>atom.views.getView(atom.workspace));
            view.setItems();
            view.show();
        };
    }
}

(<any>exports).FrameworkSelectorComponent = (<any>document).registerElement("omnisharp-framework-selector", { prototype: FrameworkSelectorComponent.prototype });

export class FrameworkSelectorSelectListView extends SpacePen.SelectListView {
    constructor(public editor: Atom.TextEditor, private options: { alignLeft: boolean; attachTo: string; items: Models.DotNetFramework[]; save(item: any): void }) {
        super();
        this.$.addClass("code-actions-overlay");
        (<any>this).filterEditorView.model.placeholderText = "Filter list";
    }

    get $(): JQuery {
        return <any>this;
    }

    public setItems() {
        SpacePen.SelectListView.prototype.setItems.call(this, this.options.items);
    }

    public confirmed(item: any): any {
        this.cancel(); //will close the view

        this.options.save(item);
        return null;
    }

    public show() {
        this.storeFocusedElement();
        setTimeout(() => this.focusFilterEditor(), 100);
        const width = 180;
        const node = this[0];
        const attachTo = $(document.querySelectorAll(this.options.attachTo));
        const offset = attachTo.offset();
        if (offset) {
            if (this.options.alignLeft) {
                $(node).css({
                    position: "fixed",
                    top: offset.top - node.clientHeight - 18,
                    left: offset.left,
                    width: width
                });
            } else {
                $(node).css({
                    position: "fixed",
                    top: offset.top - node.clientHeight - 18,
                    left: offset.left - width + attachTo[0].clientWidth,
                    width: width
                });
            }
        }
    }

    public hide() {
        this.restoreFocus();
        this.remove();
    }

    public cancelled() {
        this.hide();
    }

    public getFilterKey() { return "Name"; }

    public viewForItem(item: any) {
        return SpacePen.$$(function() {
            return this.li({
                "class": "event",
                "data-event-name": item.Name
            }, () => {
                return this.span(item.FriendlyName, {
                    title: item.FriendlyName
                });
            });
        });
    }
}
