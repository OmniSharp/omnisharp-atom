import {CompositeDisposable, Disposable, Scheduler, Observable} from "rx";
import _ = require('lodash');
import Omni = require('../../omni-sharp-server/omni')
import Client = require('../../omni-sharp-server/client');
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {world, server, solutionInformation} from '../world';

interface StatusBarState {
    errorCount?: number;
    warningCount?: number;
    projects?: typeof server.projects;
    isOff?: boolean;
    isConnecting?: boolean;
    isOn?: boolean;
    isReady?: boolean;
    isError?: boolean;
    status?: typeof server.status;
}

class StatusBarComponent extends ReactClientComponent<{}, StatusBarState> {

    constructor(props?: {}, context?: any) {
        super(props, context);
        this.state = {
            errorCount: 0,
            warningCount: 0,
            projects: server.projects,
            isOff: world.isOff,
            isConnecting: world.isConnecting,
            isOn: world.isOn,
            isReady: world.isReady,
            isError: world.isError,
            status: server.status || <any>{}
        };
    }

    public componentWillMount() {
        super.componentWillMount();

        this.disposable.add(world.observe.diagnostics.subscribe(diagnostics => {
            var counts = _.countBy(diagnostics, quickFix => quickFix.LogLevel);
            this.setState({
                errorCount: counts['Error'] || 0,
                warningCount: counts['Warning'] || 0
            });
        }));

        this.disposable.add(world.observe.updates
            .buffer(world.observe.updates.throttleFirst(100), () => Observable.timer(100))
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

        this.disposable.add(server.observe.projects
            .subscribe(projects => this.setState({ projects })));

        this.disposable.add(server.observe.status
            .subscribe(status => this.setState({ status })));
        this.disposable.add(server.observe.model
            .subscribe(status => this.setState({})));

        this.disposable.add(solutionInformation.observe.solutions
            .subscribe(solutions => this.setState({})));
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
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-dock');
    }

    public toggleErrorWarningPanel() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-errors');
    }

    public toggleSolutionInformation() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:solution-status');
    }

    public render() {
        var hasClientAndIsOn = this.state.isOn;

        var children = [];

        children.push(
            React.DOM.a({
                href: '#',
                className: "omnisharp-atom-button",
                onClick: (e) => this.toggle()
            },
                React.DOM.span({
                    className: this.getIconClassName()
                }),
                React.DOM.span({
                    className: 'outgoing-requests' + (!this.state.status.hasOutgoingRequests ? ' fade' : '')
                }, this.state.status.outgoingRequests || '0'))
            );

        if (hasClientAndIsOn) {
            var solutionNumber = solutionInformation.solutions.length > 1 ? _.trim(server.model && (<any>server.model).index, 'client') : '';

            children.push(
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
                    }, this.state.warningCount)));

            children.push(React.DOM.a({
                className: "inline-block project-summary projects-icon",
                onClick: (e) => this.toggleSolutionInformation()
            },
                React.DOM.span({
                    className: "icon icon-pulse"
                },
                    React.DOM.sub({}, solutionNumber)),
                React.DOM.span({
                    className: "projects"
                }, `${this.state.projects.length} Projects`)));
        }


        return React.DOM.div({ className: "inline-block" }, ...children);
    }

}

export = StatusBarComponent
