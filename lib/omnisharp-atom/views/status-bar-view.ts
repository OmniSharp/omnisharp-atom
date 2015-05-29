import {CompositeDisposable, Disposable, Scheduler} from "rx";
import _ = require('lodash');
import Omni = require('../../omni-sharp-server/omni')
import ClientManager = require('../../omni-sharp-server/client-manager');
import Client = require('../../omni-sharp-server/client');
import React = require('react');
import {ReactClientComponent} from "./react-client-component";

class StatusBarComponent extends ReactClientComponent<{}, { errorCount?: number; warningCount?: number }> {

    constructor(props?: {}, context?: any) {
        super({ trackWorldChanges: true }, props, context);
        this.state = { errorCount: 0, warningCount: 0 };
        this.world.observe.diagnostics.subscribe(diagnostics => {
            var counts = _.countBy(diagnostics, (quickFix: OmniSharp.Models.DiagnosticLocation) => quickFix.LogLevel);
            this.setState({
                errorCount: counts['Error'] || 0,
                warningCount: counts['Warning'] || 0
            });
        });
    }

    public shouldComponentUpdate(nextProps: {}, nextState: { errorCount?: number; warningCount?: number }) {
        return super.shouldComponentUpdate(nextProps, nextState) && !(this.state.errorCount === nextState.errorCount && this.state.warningCount === nextState.warningCount);
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

    public toggle() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-output');
    }

    public toggleErrorWarningPanel() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-errors');
    }

    public render() {
        var hasClientAndIsOn = this.model && this.model.isOn;

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
                className: 'inline-block error-warning-summary' + (!hasClientAndIsOn ? ' hide' : ''),
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
