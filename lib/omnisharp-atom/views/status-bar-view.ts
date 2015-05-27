import {CompositeDisposable, Disposable, Scheduler} from "rx";
import _ = require('lodash');
import Omni = require('../../omni-sharp-server/omni')
import ClientManager = require('../../omni-sharp-server/client-manager');
import Client = require('../../omni-sharp-server/client');
import React = require('react');
import {ReactClientComponent} from "./react-client-component";

class StatusBarComponent extends ReactClientComponent<{}, { errorCount?: number; warningCount?: number }> {

    constructor(props?: {}, context?: any) {
        super(props, context);
        this.state = { errorCount: 0, warningCount: 0 };
    }

    private getIconClassName() {
        var cls = ["icon", "icon-flame"];
        if (!this.model || this.model.isOff)
            cls.push('text-subtle');

        if (this.model) {
            if (this.model.isReady)
                cls.push('text-success')
            if (this.model.isError)
                cls.push('text-error')
            if (this.model.isConnecting)
                cls.push('icon-flame-loading')
        }
        return cls.join(' ');
    }

    public componentDidMount() {
        super.componentDidMount();

        ClientManager.registerConfiguration(client => {
            this.disposable.add(client.observeCodecheck
                .where(z => z.request.FileName === null)
                .subscribe((data) => {
                    var counts = _.countBy(data.response.QuickFixes, (quickFix: OmniSharp.Models.DiagnosticLocation) => quickFix.LogLevel);
                    this.setState({
                        errorCount: counts['Error'] || 0,
                        warningCount: counts['Warning'] || 0
                    })
                }));
        });
    }

    public toggle() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-output');
    }

    public toggleErrorWarningPanel() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-errors');
    }

    public render() {
        var hasClientAndIsReady = this.model && this.model.isReady;

        return React.DOM.div({
            className: "inline-block"
        }, React.DOM.a({
            href: '#',
            className: "omnisharp-atom-button",
            onClick: (e) => this.toggle()
        }, React.DOM.span({
            className: this.getIconClassName()
        })),
            React.DOM.a({
                href: '#',
                className: 'inline-block error-warning-summary' + (!hasClientAndIsReady ? ' hide'  : ''),
                onClick: (e) => this.toggleErrorWarningPanel()
            },
                React.DOM.span({
                    className: 'icon icon-issue-opened'
                }),
                React.DOM.span({
                    className: 'error-summary'
                }, this.state.errorCount),
                React.DOM.span({
                    className: 'icon icon-alert'
                }),
                React.DOM.span({
                    className: 'warning-summary'
                }, this.state.warningCount))
            );

    }

}

export = StatusBarComponent
