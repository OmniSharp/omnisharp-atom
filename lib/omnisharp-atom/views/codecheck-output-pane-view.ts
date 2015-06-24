import _ = require('lodash')
import path = require('path')
import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import $ = require('jquery');
import {ReactClientComponent} from "./react-client-component";
import {codeCheck} from "../features/code-check";

interface ICodeCheckOutputWindowState {
    diagnostics?: OmniSharp.Models.DiagnosticLocation[];
    selectedIndex?: number;
}

export interface ICodeCheckOutputWindowProps {
    scrollTop: () => number;
    setScrollTop: (scrollTop: number) => void;
    codeCheck: typeof codeCheck;
}

export class CodeCheckOutputWindow<T extends ICodeCheckOutputWindowProps> extends ReactClientComponent<T, ICodeCheckOutputWindowState> {
    public displayName = 'FindPaneWindow';
    private model: typeof codeCheck;

    constructor(props?: T, context?: any) {
        super(props, context);

        this.model = this.props.codeCheck;
        this.state = { diagnostics: this.model.displayDiagnostics, selectedIndex: this.model.selectedIndex };
    }

    public componentWillMount() {
        super.componentWillMount();
        this.disposable.add(this.model.observe
            .updated
            .where(z => z.name === "displayDiagnostics")
            .subscribe(z => this.setState({
                diagnostics: this.model.displayDiagnostics
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

    private goToLine(location: OmniSharp.Models.DiagnosticLocation, index: number) {
        Omni.navigateTo(location);
        this.model.selectedIndex = index;
    }

    private keydownPane(e: any) {
        if (e.keyIdentifier == 'Down') {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:next-diagnostic");
        }
        else if (e.keyIdentifier == 'Up') {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:previous-diagnostic");
        }
        else if (e.keyIdentifier == 'Enter') {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:go-to-diagnostic");
        }
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

    public render() {
        return React.DOM.div({
            className: 'codecheck-output-pane ' + (this.props['className'] || ''),
            onScroll: (e) => {
                this.props.setScrollTop((<any>e.currentTarget).scrollTop);
            },
            tabIndex: -1,
        },
            React.DOM.ol({
                style: { cursor: "pointer" },
            }, _.map(this.state.diagnostics, (error, index) =>
                React.DOM.li({
                    key: `code-check-${error.LogLevel}-${error.FileName}-(${error.Line}-${error.Column})-(${error.EndLine}-${error.EndColumn})-(${error.Projects.join('-')})`,
                    className: `codecheck ${error.LogLevel}` + (index === this.state.selectedIndex ? ' selected' : ''),
                    onClick: (e) => this.goToLine(error, index)
                },
                    React.DOM.pre({
                        className: "text-highlight"
                    }, error.Text),
                    React.DOM.pre({
                        className: "inline-block"
                    }, `${path.basename(error.FileName) }(${error.Line},${error.Column})`),
                    React.DOM.pre({
                        className: "text-subtle inline-block"
                    }, `${path.dirname(error.FileName) }`)
                    ))
                ));
    }
}
