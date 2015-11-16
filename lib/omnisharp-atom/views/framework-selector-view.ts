import SpacePen = require("atom-space-pen-views");
import {CompositeDisposable, Disposable, Scheduler, Observable} from "@reactivex/rxjs";
import * as _ from "lodash";
import * as React from "react";
import {ReactClientComponent} from "./react-client-component";
import {frameworkSelector} from "../atom/framework-selector";
import $ = require("jquery");

interface FrameworkSelectorState {
    frameworks?: OmniSharp.Models.DnxFramework[];
    activeFramework?: OmniSharp.Models.DnxFramework;
    alignLeft?: boolean;
}

export class FrameworkSelectorComponent extends ReactClientComponent<{ alignLeft: boolean }, FrameworkSelectorState> {

    constructor(props?: { alignLeft: boolean }, context?: any) {
        super(props, context);
        this.state = {
            frameworks: <OmniSharp.Models.DnxFramework[]>[],
            activeFramework: <OmniSharp.Models.DnxFramework>{}
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
                    save: (framework: OmniSharp.Models.DnxFramework) => {
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

class FrameworkSelectorSelectListView extends SpacePen.SelectListView {
    private panel: Atom.Panel;

    constructor(public editor: Atom.TextEditor, private options: { alignLeft: boolean; attachTo: string; items: OmniSharp.Models.DnxFramework[]; save(item: any): void }) {
        super();
        this.$.addClass("code-actions-overlay");
        (<any>this).filterEditorView.model.placeholderText = "Filter list";
    }

    get $(): JQuery {
        return <any>this;
    }

    public setItems() {
        SpacePen.SelectListView.prototype.setItems.call(this, this.options.items)
    }

    public confirmed(item) {
        this.cancel(); //will close the view

        this.options.save(item);
        return null;
    }

    show() {
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

    hide() {
        this.restoreFocus();
        this.remove();
    }

    cancelled() {
        this.hide();
    }

    public getFilterKey() { return "Name"; }

    public viewForItem(item) {
        if (!item) {

        }
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
