import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import path = require('path');
import {ReactClientComponent} from "./react-client-component";

class FindPaneWindow extends ReactClientComponent<{}, { usages?: OmniSharp.Models.QuickFix[] }> {
    public displayName = 'FindPaneWindow';

    constructor(props?: {}, context?: any) {
        super(props, context);
        this.state = { usages: [] };
        this.trackClientChanges = true;
    }

    public componentDidMount() {
        super.componentDidMount();

        ClientManager.registerConfiguration(client => {
            this.disposable.add(Omni.listener.observeFindusages.subscribe((data) => {
                this.updateModel();
                this.setState({
                    usages: data.response.QuickFixes
                });
            }));

            this.disposable.add(Omni.listener.observeFindimplementations.subscribe((data) => {
                if (data.response.QuickFixes.length > 1) {
                    this.updateModel();
                    this.setState({
                        usages: data.response.QuickFixes
                    });
                }
            }));
        });
    }

    private updateModel() {
        if (this.state.usages.length > 0) {
            this.state.usages[0]['isSelected'] = true;
            this.scrollToItemView(0);

            React.findDOMNode(this);//.focus();
            //this.list.parent().focus();
        }
    }

    private selectNextItem() {
        if (!this.state.usages) return;
        var index = this.deselectCurrentItem();
        this.setCurrentItem(index + 1);
    }

    private selectPreviousItem() {
        if (!this.state.usages) return;
        var index = this.deselectCurrentItem();
        this.setCurrentItem(index - 1);
    }

    private deselectCurrentItem(): number {
        var index = _.findIndex(this.state.usages, usage => usage['isSelected']);
        this.state.usages[index]['isSelected'] = false;
        return index;
    }

    private setCurrentItem(index) {
        if (index < 0)
            index = 0;
        if (index >= this.state.usages.length)
            index = this.state.usages.length - 1;
        this.state.usages[index]['isSelected']['isSelected'] = true;
        this.scrollToItemView(index);
    }

<<<<<<< HEAD
    private nagivateToSelectedItem() {
        if (!this.state.usages) return;
        var usage = _.find(this.state.usages, usage => usage['isSelected']);
        if (usage) Omni.navigateTo(usage);
    }

    private scrollToItemView(index) {
        //React.findDOMNode(this);//.focus();
        var item = this.list.find(`li.usage-${index}`);
        if (!item || !item.position()) return;

        //React.findDOMNode(this);//.focus();
        var pane = this.list.parent().parent();
        var scrollTop = pane.scrollTop();
        var desiredTop = item.position().top + scrollTop;
        var desiredBottom = desiredTop + item.outerHeight();

        if (desiredTop < scrollTop)
            pane.scrollTop(desiredTop);
        else if (desiredBottom > pane.scrollBottom())
            pane.scrollBottom(desiredBottom);
    }

    private keydownPane(e: any) {
        if (e.keyIdentifier == 'Down') {
            this.selectNextItem();
        }
        else if (e.keyIdentifier == 'Up') {
            this.selectPreviousItem();
=======
        if (this.model && this.model.isConnecting) {
            return React.DOM.ul({
                className: 'background-message centered'
            }, React.DOM.li({}, React.DOM.progress({
                className: 'inline-block'
            })));
>>>>>>> Added model property to client, for use as a view model
        }
        else if (e.keyIdentifier == 'Enter') {
            this.nagivateToSelectedItem();
        }
    }

    private gotoUsage(quickfix: OmniSharp.Models.QuickFix) {
        Omni.navigateTo(quickfix);
    }

    public render() {
        return React.DOM.div({
            className: 'error-output-pane',
            'tabindex': '-1',
            onKeyDown: (e) => this.keydownPane(e)
        }, React.DOM.ol({
            style: { cursor: "pointer" }
        }, ..._.map(this.state.usages, (usage: OmniSharp.Models.QuickFix, index) =>
            React.DOM.li({
                className: 'find-usages usage-' + index + (usage['isSelected'] ? ' selected' : ''),
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
            ));
    }
}

export = function() {
    var element = document.createElement('div');
    element.className = 'error-output-pane';
    React.render(React.createElement(FindPaneWindow, null), element);
    return element;
}
