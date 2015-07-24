import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import path = require('path');
import $ = require('jquery');
import {ReactClientComponent} from "./react-client-component";
import {findUsages} from "../features/find-usages";

interface FindWindowState {
    selectedIndex?: number;
    usages?: OmniSharp.Models.DiagnosticLocation[];
}

interface FindWindowProps {
    scrollTop: () => number;
    setScrollTop: (scrollTop: number) => void;
    findUsages: typeof findUsages;
}

export class FindWindow extends ReactClientComponent<FindWindowProps, FindWindowState> {
    public displayName = 'FindPaneWindow';

    private model: typeof findUsages;

    constructor(props?: FindWindowProps, context?: any) {
        super(props, context);
        this.model = this.props.findUsages;
        this.state = { usages: this.model.usages, selectedIndex: this.model.selectedIndex };
    }

    public componentWillMount() {
        super.componentWillMount();
        this.disposable.add(this.model.observe
            .updated
            .where(z => z.name === "usages")
            .subscribe(z => this.setState({
                usages: this.model.usages
            })));

        this.disposable.add(this.model.observe
            .updated
            .where(z => z.name === "selectedIndex")
            .delay(0)
            .subscribe(z => this.updateStateAndScroll()));
    }

    public componentDidMount() {
        super.componentDidMount();

        React.findDOMNode(this).scrollTop = this.props.scrollTop();
        (<any>React.findDOMNode(this)).onkeydown = (e) => this.keydownPane(e);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        (<any>React.findDOMNode(this)).onkeydown = undefined;
    }

    private updateStateAndScroll() {
        this.setState({ selectedIndex: this.model.selectedIndex }, () => this.scrollToItemView());
    }

    private scrollToItemView() {
        var self = $(React.findDOMNode(this));
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

    private keydownPane(e: any) {
        if (e.keyIdentifier == 'Down') {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:next-usage");
        }
        else if (e.keyIdentifier == 'Up') {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:previous-usage");
        }
        else if (e.keyIdentifier == 'Enter') {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:go-to-usage");
        }
    }

    private gotoUsage(quickfix: OmniSharp.Models.QuickFix, index: number) {
        Omni.navigateTo(quickfix);
        this.model.selectedIndex = index;
    }

    public render() {
        return React.DOM.div({
            className: 'error-output-pane ' + (this.props['className'] || ''),
            onScroll: (e) => {
                this.props.setScrollTop((<any>e.currentTarget).scrollTop);
            },
            tabIndex: -1,
        },
            React.DOM.ol({
                style: { cursor: "pointer" },
            }, _.map(this.state.usages, (usage: OmniSharp.Models.QuickFix, index) =>
                React.DOM.li({
                    key: `quick-fix-${usage.FileName}-(${usage.Line}-${usage.Column})-(${usage.EndLine}-${usage.EndColumn})-(${usage.Projects.join('-') })`,
                    className: 'find-usages' + (index === this.state.selectedIndex ? ' selected' : ''),
                    onClick: (e) => this.gotoUsage(usage, index)
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
