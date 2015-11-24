import {Models} from "omnisharp-client";
import * as SpacePen from "atom-space-pen-views";
import * as React from "react";
import {ReactClientComponent} from "./react-client-component";
import {frameworkSelector} from "../atom/framework-selector";
const $ : JQueryStatic = require("jquery");

interface FrameworkSelectorState {
    frameworks?: Models.DnxFramework[];
    activeFramework?: Models.DnxFramework;
    alignLeft?: boolean;
}

export class FrameworkSelectorComponent extends ReactClientComponent<{ alignLeft: boolean }, FrameworkSelectorState> {

    constructor(props?: { alignLeft: boolean }, context?: any) {
        super(props, context);
        this.state = {
            frameworks: <Models.DnxFramework[]>[],
            activeFramework: <Models.DnxFramework>{}
        };
    }

    public componentWillMount() {
        super.componentWillMount();
    }

    public render() {
        return React.DOM.a({
            href: "#",
            onClick: (e) => {
                const view = new FrameworkSelectorSelectListView(atom.workspace.getActiveTextEditor(), {
                    attachTo: ".framework-selector",
                    alignLeft: this.props.alignLeft,
                    items: this.state.frameworks,
                    save: (framework: Models.DnxFramework) => {
                        frameworkSelector.setActiveFramework(framework);
                        view.hide();
                    }
                });
                view.appendTo(<any>atom.views.getView(atom.workspace));
                view.setItems();
                view.show();
            },
        }, this.state.activeFramework.FriendlyName);
    }
}

export class FrameworkSelectorSelectListView extends SpacePen.SelectListView {
    constructor(public editor: Atom.TextEditor, private options: { alignLeft: boolean; attachTo: string; items: Models.DnxFramework[]; save(item: any): void }) {
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
