import {CompositeDisposable, Disposable, Scheduler} from "rx";
import _ = require('lodash');
import Omni = require('../../omni-sharp-server/omni')
import ClientManager = require('../../omni-sharp-server/client-manager');
import Client = require('../../omni-sharp-server/client');
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {world} from '../world';

interface StatusBarState {
    errorCount?: number;
    warningCount?: number;
    isOff?: boolean;
    isConnecting?: boolean;
    isOn?: boolean;
    isReady?: boolean;
    isError?: boolean;
    status?: typeof world.status;
}

class StatusBarComponent extends ReactClientComponent<{}, StatusBarState> {

    constructor(props?: {}, context?: any) {
        super(props, context);
        this.state = {
            errorCount: 0,
            warningCount: 0,
            isOff: world.isOff,
            isConnecting: world.isConnecting,
            isOn: world.isOn,
            isReady: world.isReady,
            isError: world.isError,
            status: world.status || <any>{}
        };
    }

    public componentDidMount() {
        super.componentDidMount();

        this.disposable.add(world.observe.diagnostics.subscribe(diagnostics => {
            var counts = _.countBy(diagnostics, quickFix => quickFix.LogLevel);
            this.setState({
                errorCount: counts['Error'] || 0,
                warningCount: counts['Warning'] || 0
            });
        }));

        this.disposable.add(world.observe.updates.bufferWithTime(50)
            .subscribe(items => {
            var updates = _(items)
                .filter(item => _.contains(['isOff', 'isConnecting', 'isOn', 'isReady', 'isError'], item.name))
                .value();

            if (updates.length) {
                var update = {};
                _.each(updates, item => {
                    update[item.name] = world[item.name];
                })
                this.setState(update);
            }
        }));

        this.disposable.add(world.observe.status.subscribe(status => {
            this.setState({ status });
        }));
    }

    private getIconClassName() {
        var cls = ["icon", "icon-flame"];

        if (!this.state.isOff)
            cls.push('text-subtle');

        if (this.state.isReady)
            cls.push('text-success')

        if (this.state.isError)
            cls.push('text-error')

        if (this.state.isConnecting)
            cls.push('icon-flame-loading')
        else if (this.state.status.hasOutgoingRequests)
            cls.push('icon-flame-processing')

        return cls.join(' ');
    }

    public toggle() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-output');
    }

    public toggleErrorWarningPanel() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-errors');
    }

    public render() {
        var hasClientAndIsOn = this.state.isOn;

        return React.DOM.div({
            className: "inline-block"
        }, React.DOM.a({
            href: '#',
            className: "omnisharp-atom-button",
            onClick: (e) => this.toggle()
        }, React.DOM.span({
            className: this.getIconClassName()
        }),
            React.DOM.span({
                className: 'outgoing-requests' + (!this.state.status.hasOutgoingRequests ? ' fade' : '')
            }, this.state.status.outgoingRequests || '0')),
            !hasClientAndIsOn ? React.DOM.span({}) :
                React.DOM.a({
                    href: '#',
                    className: 'inline-block error-warning-summary',
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
