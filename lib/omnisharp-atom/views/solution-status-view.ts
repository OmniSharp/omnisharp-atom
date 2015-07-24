import _ = require('lodash')
import {basename} from "path";
import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {solutionInformation} from "../features/solution-information";
import {ViewModel} from "../../omni-sharp-server/view-model";
import {DriverState} from "omnisharp-client";
import $ = require('jquery');
import {Observable} from "rx";

interface ICardState {
    model: ViewModel;
    count: number;
}

export interface ICardProps {
    model: ViewModel;
    count: number;
    attachTo?: string;
}
interface ISolutionStatusWindowState {
}

interface ISolutionStatusWindowProps {
    solutionInformation: typeof solutionInformation;
}

function truncateStringReverse(str: string, maxLength: number = 55) {
    var reversedString = _.toArray(str).reverse().join('');
    return _.toArray(_.trunc(reversedString, maxLength)).reverse().join('');
}

export class SolutionStatusCard<T extends ICardProps> extends ReactClientComponent<T, ICardState> {
    public displayName = 'Card';
    private updatesDisposable: Rx.Disposable;

    constructor(props?: T, context?: any) {
        super(props, context);

        //this.model = this.props.codeCheck;
        this.state = { model: props.model, count: props.count };
    }

    public componentWillMount() {
        super.componentWillMount();
    }
    public componentWillUpdate(nextProps: T, nextState: ICardState) {
        if (this.state.model.uniqueId !== nextState.model.uniqueId && this.updatesDisposable) {
            this.disposable.remove(this.updatesDisposable);
            this.updatesDisposable.dispose();
            this.updatesDisposable = nextState.model.observe.updates.debounce(500).subscribe(() => this.setState(<any>{}));
        }
    }

    public componentDidMount() {
        super.componentDidMount();
        this.updatesDisposable = this.state.model.observe.updates.debounce(500).subscribe(() => this.setState(<any>{}));
        this.disposable.add(this.updatesDisposable);
        this.verifyPosition();
    }

    public componentDidUpdate() {
        _.delay(this.verifyPosition.bind(this), 50);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
    }

    public updateCard(state: ICardState) {
        this.setState(state);
    }

    private verifyPosition() {
        var node = React.findDOMNode(this);
        var offset = $(document.querySelectorAll(this.props.attachTo)).offset();
        if (offset) {
            $(node).css({
                position: 'fixed',
                top: offset.top - node.clientHeight,
                left: offset.left
            });
        }
    }

    private getButtons() {
        var buttons = [];

        if (this.state.model.isReady) {
            buttons.push(React.DOM.button({
                type: 'button',
                className: 'btn btn-xs btn-error',
                onClick: () => atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:stop-server')
            }, React.DOM.span({ className: 'fa fa-stop' }), 'Stop'));
        } else if (this.state.model.isOff) {
            buttons.push(React.DOM.button({
                type: 'button',
                className: 'btn btn-xs btn-success',
                onClick: () => atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:start-server')
            }, React.DOM.span({ className: 'fa fa-play' }), 'Start'));
        }

        if (this.state.model.isOn) {
            buttons.push(React.DOM.button({
                type: 'button',
                className: 'btn btn-xs btn-info',
                onClick: () => atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:restart-server')
            }, React.DOM.span({ className: 'fa fa-refresh' }), 'Restart'));
        }

        return buttons;
    }

    private getProjects() {
        var projects = [];
        return this.state.model.projects.map(
            project => {
                var path = truncateStringReverse(project.path.replace(this.state.model.path, ''), 24);
                return React.DOM.div({ className: 'project name', title: `${path} [${project.frameworks.filter(z => z.Name !== 'all').map(x => x.FriendlyName) }]` }, project.name);
            });
    }

    private getStatusText() {
        if (this.state.model.state === DriverState.Connected) {
            return "Online";
        } else if (this.state.model.state === DriverState.Connecting) {
            return "Loading";
        } else if (this.state.model.state === DriverState.Disconnected) {
            return "Offline";
        }
        return DriverState[this.state.model.state];
    }

    public render() {
        if (!this.state.model) {
            return React.DOM.div({ className: 'omnisharp-card' });
        }
        var path = truncateStringReverse(this.state.model.path);

        var stats = [
            React.DOM.div({
                className: 'meta-controls'
            },
                React.DOM.div({
                    className: 'btn-group'
                },
                    this.getButtons())
                )
        ];

        stats.unshift(React.DOM.span({
            className: "pull-left stats-item " + (DriverState[this.state.model.state].toLowerCase())
        },
            React.DOM.span({
                className: ''
            }, React.DOM.span({
                className: 'icon icon-zap'
            }), this.getStatusText())));

        if (this.state.model.runtime) {
            stats.unshift(React.DOM.span({
                className: "pull-right stats-item"
            }, React.DOM.span({
                className: 'icon icon-versions'
            }),
                React.DOM.span({
                    className: ''
                }, this.state.model.runtime)));
        }

        if (this.state.model.projects.length) {
            var projects = React.DOM.div({ className: 'meta meta-projects' },
                React.DOM.div({ className: 'header' }, 'Projects'),
                this.getProjects());
        }

        var children = [
            React.DOM.div({
                className: 'body'
            },
                React.DOM.h4({
                    className: 'name'
                },
                    React.DOM.span({
                    }, `${basename(this.state.model.path) } (${this.state.model.index})`)),
                React.DOM.span({
                    className: 'description'
                }, path), ...stats),
            projects || ''
        ];

        if (this.state.count > 1) {
            children.unshift(
                React.DOM.div({ className: 'selector btn-group btn-group-xs' },
                    React.DOM.span({
                        className: "btn btn-xs icon icon-triangle-left",
                        onClick: (e) => atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:previous-solution-status')
                    }),
                    React.DOM.span({
                        className: "btn btn-xs icon icon-triangle-right",
                        onClick: (e) => atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:next-solution-status')
                    }))
                );
        }

        return React.DOM.div({
            className: 'omnisharp-card'
        }, ...children);
    }
}
