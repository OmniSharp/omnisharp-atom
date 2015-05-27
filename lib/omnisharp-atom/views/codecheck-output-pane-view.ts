var Convert = require('ansi-to-html')
import _ = require('lodash')
import path = require('path')

import Omni = require('../../omni-sharp-server/omni')
import ClientManager = require("../../omni-sharp-server/client-manager");
import React = require('react');
import {ReactClientComponent} from "./react-client-component";


class CodeCheckOutputPaneWindow extends ReactClientComponent<{}, { errors?: OmniSharp.Models.DiagnosticLocation[] }> {
    public displayName = 'FindPaneWindow';

    constructor(props?: {}, context?: any) {
        super({ trackClientChanges: false }, props, context);
        this.state = { errors: [] };
    }

    public componentDidMount() {
        super.componentDidMount();

        ClientManager.registerConfiguration(client => {
            this.disposable.add(client.observeCodecheck
                .where(z => z.request.FileName === null)
                .subscribe((data) => {
                    this.setState({
                        errors: _.sortBy(this.filterOnlyWarningsAndErrors(data.response.QuickFixes),
                            (quickFix: OmniSharp.Models.DiagnosticLocation) => {
                                return quickFix.LogLevel;
                            })
                    });
                }));
        });
    }

    private goToLine(location: OmniSharp.Models.DiagnosticLocation) {
        Omni.navigateTo(location);
    }

    private filterOnlyWarningsAndErrors(quickFixes): OmniSharp.Models.DiagnosticLocation[] {
        return _.filter(quickFixes, (quickFix: OmniSharp.Models.DiagnosticLocation) => {
            return quickFix.LogLevel != "Hidden";
        });
    }

    public render() {
        return React.DOM.div({
            style: { "cursor": "pointer" }
        }, ..._.map(this.state.errors, error => {
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
