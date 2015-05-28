import {CompositeDisposable, Disposable, Scheduler} from "rx";
import _ = require('lodash');
import Omni = require('../../omni-sharp-server/omni')
import ClientManager = require('../../omni-sharp-server/client-manager');
import Client = require('../../omni-sharp-server/client');
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {Observable} from "rx";


class StatusBarComponent extends ReactClientComponent<{}, { errorCount?: number; warningCount?: number }> {

    constructor(props?: {}, context?: any) {
        super(props, context);
        this.state = { errorCount: 0, warningCount: 0 };
        this.trackClientChanges = true;
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

        let subscription: Rx.Disposable;
        let currentlyEnabled = false;
        let localCache = {};

        Observable.combineLatest(
            Omni.activeModel.startWith(null),
            Omni.showDiagnosticsForAllSolutions, (model, enabled) => ({ client: model && model.client, enabled }))
            .subscribe(ctx => {
                var {enabled, client} = ctx;

                // If we're currently enabled no point swap out subscriptions.
                if (currentlyEnabled && enabled === currentlyEnabled) {
                    return;
                }

                currentlyEnabled = enabled;
                if (subscription) {
                    this.disposable.remove(subscription);
                    subscription.dispose();
                }

                if (enabled) {
                    subscription = Omni.combination.observe(z => z.observeCodecheck
                        .where(z => z.request.FileName === null)
                        .map(z => z.response.QuickFixes))
                    // TODO: Allow filtering by client, project
                        .map(z => z.map(z => z.value || [])) // value can be null!
                        .subscribe((data) => {
                            var fixes = _.flatten<OmniSharp.Models.QuickFix>(data);
                            var counts = _.countBy(fixes, (quickFix: OmniSharp.Models.DiagnosticLocation) => quickFix.LogLevel);
                            this.setState({
                                errorCount: counts['Error'] || 0,
                                warningCount: counts['Warning'] || 0
                            });
                        });
                } else if (client) {
                    subscription = client.observeCodecheck
                        .where(z => z.request.FileName === null)
                        .map(z => z.response)
                        .merge(client.codecheck({}))
                        .map(z => z.QuickFixes)
                        .startWith(localCache[client.uniqueId] || [])
                        .subscribe((data) => {
                            localCache[client.uniqueId] = data;
                            var counts = _.countBy(data, (quickFix: OmniSharp.Models.DiagnosticLocation) => quickFix.LogLevel);
                            this.setState({
                                errorCount: counts['Error'] || 0,
                                warningCount: counts['Warning'] || 0
                            });
                        });
                }

                this.disposable.add(subscription);
            });
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
