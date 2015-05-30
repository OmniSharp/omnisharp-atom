import _ = require('lodash')
import path = require('path')
import Omni = require('../../omni-sharp-server/omni')
import {world} from '../world';
import React = require('react');
import {ReactClientComponent} from "./react-client-component";


class CodeCheckOutputPaneWindow extends ReactClientComponent<{}, { diagnostics?: OmniSharp.Models.DiagnosticLocation[] }> {
    public displayName = 'FindPaneWindow';

    constructor(props?: {}, context?: any) {
        super(props, context);

        this.state = { diagnostics: [] };
    }

    public componentDidMount() {
        super.componentDidMount();

        this.disposable.add(
                world.observe.diagnostics
                    .subscribe(diagnostics =>
                        this.setState({ diagnostics: this.filterOnlyWarningsAndErrors(diagnostics) })));
    }

    public shouldComponentUpdate(nextProps: {}, nextState: { diagnostics?: OmniSharp.Models.DiagnosticLocation[] }) {
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
            style: { "cursor": "pointer" }
        }, ..._.map(this.state.diagnostics, error => {
            var filename = path.basename(error.FileName);
            var dirname = path.dirname(error.FileName);
            var projectTargetFramework = Omni.getFrameworks(error.Projects);

            return React.DOM.div({
                className: `codecheck ${error.LogLevel}`,
                onClick: (e) => this.goToLine(error)
            },
                React.DOM.pre({ className: "text-highlight" }, error.Text),
                React.DOM.pre({ className: "inline-block" }, `${filename}(${error.Line},${error.Column})`),
                React.DOM.pre({ className: "text-subtle inline-block" }, ` ${dirname}  [${projectTargetFramework}]`)
                )
        }));
    }
}

export = function() {
    var element = document.createElement('div');
    element.className = 'codecheck-output-pane';
    React.render(React.createElement(CodeCheckOutputPaneWindow, null), element);
    return element;
}
