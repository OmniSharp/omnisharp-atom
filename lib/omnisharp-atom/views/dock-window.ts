//var Convert = require('ansi-to-html')
import _ = require('lodash')
import {Observable, SingleAssignmentDisposable, Disposable, CompositeDisposable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {findUsages} from "../features/find-usages";
import {world} from "../world";

interface IDockWindowState {
    selected: string;
}

export interface IDockWindowProps {
    panel: Atom.Panel;
    panes: DockPane<any, any>[];
}

interface IDockWindowButtonsState {
}

interface IDockWindowButtonsProps {
    selected: string;
    setSelected: (selected: string) => void;
    panes: DockPane<any, any>[];
    children: any[];
}



export interface DocPaneOptions {
    priority?: number;
    closeable?: boolean;
}

export interface DockPane<P, S> {
    id: string;
    title: string;
    props: P;
    view: typeof React.Component;
    options: DocPaneOptions;
}
export interface DisposableDockPane<P, S> {
    id: string;
    title: string;
    props: P;
    view: typeof React.Component;
    options: DocPaneOptions;
    disposable: Rx.Disposable;
}

class DockWindows<T extends IDockWindowButtonsProps> extends ReactClientComponent<T, IDockWindowButtonsState> {

    constructor(props?: T, context?: any) {
        super(props, context);
        this.state = {};
    }

    private button({id, title, options, disposable}: DisposableDockPane<any, any>) {

        var children = [React.DOM.span({ className: 'text' }, title)];
        if (options.closeable) {
            children.push(React.DOM.span({
                className: 'fa fa-times-circle close-pane',
                key: 'close',
                onClick: (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    disposable.dispose();
                }
            }));
        }

        return React.DOM.button({
            className: `btn btn-default btn-fix ${this.props.selected === id ? 'selected' : ''} ${options.closeable ? 'closeable' : ''}`,
            key: id,
            onClick: (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.props.setSelected(id);
                this.setState({});
            }
        }, children);
    }

    private getButtons() {
        return _.map(this.props.panes, this.button.bind(this));
    }

    public render() {
        return React.DOM.div({
            className: "inset-panel"
        }, React.DOM.div({
            className: "panel-heading clearfix"
        }, React.DOM.div({ className: 'btn-toolbar pull-left' },
            React.DOM.div({ className: 'btn-group btn-toggle' }, this.getButtons()))), this.props.children);
    }
}

export class DockWindow<T extends IDockWindowProps> extends ReactClientComponent<T, IDockWindowState> {
    public displayName = "DockWindow";

    public get selected() { return this.state.selected; }
    private visible = false;
    public get isOpen () { return this.visible }

    private _convert;

    constructor(props?: T, context?: any) {
        super(props, context);
        this.state = { selected: 'output' };
    }

    public componentWillMount() {
        super.componentWillMount();
    }

    private updateState(cb?: () => void) {
        this.setState(<any>{}, () => this.updateAtom(cb));
    }

    private updateAtom(cb: () => void) {
        if (this.props.panel.visible !== this.visible) {
            if (this.visible)
                this.props.panel.show();
            else
                this.props.panel.hide();
        }
        if (cb) cb();
    }

    public showView() {
        this.visible = true;
        this.updateState();
    }

    public doShowView() {
        this.visible = true;
    }

    public hideView() {
        this.doHideView();
        this.updateState();
    }

    private doHideView() {
        this.visible = false;
        atom.workspace.getActivePane().activate();
        atom.workspace.getActivePane().activateItem();
    }

    public toggleView() {
        if (this.visible) {
            this.doHideView();
        } else {
            this.doShowView();
        }
        this.updateState();
    }

    public toggleWindow(selected: string) {
        if (this.visible && this.state.selected === selected) {
            this.hideView();
            return;
        }

        this.selectWindow(selected);
    }

    private isSelected(key: string) {
        if (this.state.selected) {
            return `omnisharp-atom-output ${key}-output selected`;
        }
        return '';
    }

    public selectWindow(selected: string) {
        if (!this.visible)
            this.doShowView();

        this.state.selected = selected;

        // Focus the panel!
        this.updateState(() => {
            var panel: any = React.findDOMNode(this).querySelector('.omnisharp-atom-output.selected');
            if (panel) panel.focus();
        });
    }

    private getWindows() {
        var window = _.find(this.props.panes, { id: this.state.selected });
        if (!this.state.selected || !window)
            return React.DOM.span({});

        if (window) {
            var props = _.clone(window.props);
            props.className = (this.isSelected((window.id)) + ' ' + (props.className || ''))
            props.key = window.id;
            return React.createElement(window.view, props);
        }
    }

    public render() {
        if (!this.visible)
            return React.DOM.span({
                style: {
                    display: 'none'
                }
            });

        return React.createElement(DockWindows, { selected: this.state.selected, setSelected: this.selectWindow.bind(this), panes: this.props.panes }, this.getWindows());
    }
}
