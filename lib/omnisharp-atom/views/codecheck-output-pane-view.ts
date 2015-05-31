import _ = require('lodash')
import path = require('path')
import Omni = require('../../omni-sharp-server/omni')
import {world} from '../world';
import React = require('react');
import {ReactClientComponent} from "./react-client-component";

interface ICodeCheckOutputWindowState {
    diagnostics?: OmniSharp.Models.DiagnosticLocation[];
}
export interface ICodeCheckOutputWindowProps {
    scrollTop: () => number;
    setScrollTop: (scrollTop: number) => void;
}

export class CodeCheckOutputWindow<T extends ICodeCheckOutputWindowProps> extends ReactClientComponent<T, ICodeCheckOutputWindowState> {
    public displayName = 'FindPaneWindow';

    constructor(props?: T, context?: any) {
        super(props, context);

        this.state = { diagnostics: world.codeCheck.diagnostics };
    }

    public componentDidMount() {
        super.componentDidMount();

        this.disposable.add(
            world.observe.diagnostics
                .subscribe(diagnostics =>
                    this.setState({ diagnostics: this.filterOnlyWarningsAndErrors(diagnostics) })));
        React.findDOMNode(this).scrollTop = this.props.scrollTop();
    }

    public shouldComponentUpdate(nextProps: T, nextState: ICodeCheckOutputWindowState) {
        return !(this.state.diagnostics === nextState.diagnostics);
    }

    private filterOnlyWarningsAndErrors(quickFixes): OmniSharp.Models.DiagnosticLocation[] {
        return _.filter(quickFixes, (quickFix: OmniSharp.Models.DiagnosticLocation) => {
            return quickFix.LogLevel != "Hidden";
        });
    }

    private goToLine(location: OmniSharp.Models.DiagnosticLocation) {
        Omni.navigateTo(location);
    }

    public render() {
        return React.DOM.div({
            className: 'codecheck-output-pane ' + (this.props['className'] || ''),
            style: { "cursor": "pointer" },
            onScroll: (e) => {
                this.props.setScrollTop((<any>e.currentTarget).scrollTop);
            }
        },
            React.DOM.div({
                scrollTop: this.props.scrollTop()
            }, ..._.map(this.state.diagnostics, (error, index) => {
                var filename = path.basename(error.FileName);
                var dirname = path.dirname(error.FileName);
                var projectTargetFramework = Omni.getFrameworks(error.Projects);

                return React.DOM.div({
                    key: index,
                    className: `codecheck ${error.LogLevel}`,
                    onClick: (e) => this.goToLine(error)
                },
                    React.DOM.pre({ className: "text-highlight" }, error.Text),
                    React.DOM.pre({ className: "inline-block" }, `${filename}(${error.Line},${error.Column})`),
                    React.DOM.pre({ className: "text-subtle inline-block" }, ` ${dirname}  [${projectTargetFramework}]`)
                    )
            })));
    }
}
