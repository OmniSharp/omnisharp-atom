import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import path = require('path');
import $ = require('jquery');
import {ReactClientComponent} from "./react-client-component";
import {world} from '../world';

class FindPaneWindow extends ReactClientComponent<{}, { usages?: OmniSharp.Models.QuickFix[] }> {
    public displayName = 'FindPaneWindow';
    private selectedIndex = 0;

    constructor(props?: {}, context?: any) {
        super(props, context);
        this.state = { usages: [] };
    }

    public componentDidMount() {
        super.componentDidMount();

        this.disposable.add(world.observe.findUsages.subscribe(usages => {
            this.selectedIndex = 0;
            this.setState({ usages });
            this.updateModel();
        }));
    }

    private updateStateAndScroll() {
        this.setState({}, () => this.scrollToItemView());
    }

    private updateModel() {
        if (this.state.usages.length > 0) {
            _.defer(() => {
                $(React.findDOMNode(this)).parent().focus();
            })
        }
    }

    private selectNextItem() {
        if (!this.state.usages) return;
        this.setCurrentItem(this.selectedIndex + 1);
    }

    private selectPreviousItem() {
        if (!this.state.usages) return;
        this.setCurrentItem(this.selectedIndex - 1);
    }

    private setCurrentItem(index) {
        if (index < 0)
            index = 0;
        if (index >= this.state.usages.length)
            index = this.state.usages.length - 1;

        this.selectedIndex = index;
        this.updateStateAndScroll();
    }

    private nagivateToSelectedItem() {
        if (!this.state.usages) return;
        Omni.navigateTo(this.state.usages[this.selectedIndex]);
    }

    private scrollToItemView() {
        var self = $(React.findDOMNode(this)).parent().parent();
        var item = self.find(`li.usage-${this.selectedIndex}`);
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

    public keydownPane(e: any) {
        if (e.keyIdentifier == 'Down') {
            this.selectNextItem();
        }
        else if (e.keyIdentifier == 'Up') {
            this.selectPreviousItem();
        }
        else if (e.keyIdentifier == 'Enter') {
            this.nagivateToSelectedItem();
        }
    }

    private gotoUsage(quickfix: OmniSharp.Models.QuickFix) {
        Omni.navigateTo(quickfix);
    }

    public render() {
        return React.DOM.ol({
            style: { cursor: "pointer" }
        }, ..._.map(this.state.usages, (usage: OmniSharp.Models.QuickFix, index) =>
            React.DOM.li({
                className: 'find-usages usage-' + index + (index === this.selectedIndex ? ' selected' : ''),
                onClick: (e) => this.gotoUsage(usage)
            },
                React.DOM.pre({
                    className: "text-highlight"
                }, usage.Text),
                React.DOM.pre({
                    className: "inline-block"
                }, `${path.basename(usage.FileName) }(${usage.Line},${usage.Column})`),
                React.DOM.pre({
                    className: "text-subtle inline-block"
                }, `${path.dirname(usage.FileName) }`)
                ))
            );
    }
}

export = function() {
    var element = document.createElement('div');
    element.className = 'error-output-pane';
    element.tabIndex = -1;
    var reactItem: FindPaneWindow = <any>React.render(React.createElement(FindPaneWindow, null), element);
    element.onkeydown = (e) => reactItem.keydownPane(e);
    return element;
}
