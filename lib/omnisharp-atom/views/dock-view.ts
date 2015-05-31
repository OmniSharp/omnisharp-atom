//var Convert = require('ansi-to-html')
import _ = require('lodash')
import {Observable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import React = require('react');
import {FindWindow} from './find-pane-view'
import {BuildOutputWindow} from './build-output-pane-view'
import {OutputWindow} from './omni-output-pane-view'
import {CodeCheckOutputWindow, ICodeCheckOutputWindowProps} from './codecheck-output-pane-view';
import {ReactClientComponent} from "./react-client-component";
import {findUsages} from "../features/find-usages";
import {world} from "../world";

interface IDockWindowState {
    errorScrollTop: number;
}

interface IDockWindowProps {
    panel: Atom.Panel;
}

interface IDockWindowButtonsState {
}

interface IDockWindowButtonsProps {
    selected: string;
    setSelected: (selected: string) => void;
    children: any[];
}

class DockWindows<T extends IDockWindowButtonsProps> extends ReactClientComponent<T, IDockWindowButtonsState> {

    constructor(props?: T, context?: any) {
        super(props, context);
        this.state = {};
    }

    private button(id, title) {
        return React.DOM.button({
            className: `btn btn-default btn-fix ${this.props.selected === id ? 'selected' : ''}`,
            key: id,
            onClick: () => {
                this.props.setSelected(id);
                this.setState({});
            }
        }, title);
    }

    private getButtons() {
        var buttons = [];
        buttons.push(this.button("errors", "Errors & Warnings"));
        buttons.push(this.button("find", "Find"));
        if (world.supportsBuild)
            buttons.push(this.button("build", "Build output"));
        buttons.push(this.button("omni", "Omnisharp output"));

        return buttons;
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

class DockWindow<T extends IDockWindowProps> extends ReactClientComponent<T, IDockWindowState> {
    public displayName = "DockWindow";

    private selected = 'omni';
    private visible = false;

    private _convert;

    constructor(props?: T, context?: any) {
        super(props, context);
        this.state = { errorScrollTop: 0 };
    }

    public componentWillMount() {
        super.componentWillMount();

        this.disposable.add(atom.commands.add('atom-workspace', "omnisharp-atom:toggle-output", () => {
            this.toggleView();
            this.updateState();
        }));
        this.disposable.add(atom.commands.add('atom-workspace', "omnisharp-atom:hide", () => {
            this.hideView();
            this.updateState();
        }));
        this.disposable.add(atom.commands.add('atom-workspace', "omnisharp-atom:show-find", () => {
            this.selectPane("find");
        }));

        this.disposable.add(Observable.merge(findUsages.observe.find.map(z => true), findUsages.observe.open.map(z => true)).subscribe(() => {
            this.selectPane("find");
        }));

        this.disposable.add(atom.commands.add('atom-workspace', "omnisharp-atom:show-build", () => {
            this.selectPane("build");
        }));
        this.disposable.add(atom.commands.add('atom-workspace', "omnisharp-atom:show-omni", () => {
            this.selectPane("omni");
        }));
        this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:toggle-errors', () => {
            this.toggleErrors();
        }));
        this.disposable.add(atom.commands.add('atom-workspace', 'core:close', () => {
            this.hideView();
            this.updateState();
        }));
        this.disposable.add(atom.commands.add('atom-workspace', 'core:cancel', () => {
            this.hideView();
            this.updateState();
        }));
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


    private selectPane(selected: string) {
        if (!this.visible)
            this.showView();
        this.selected = selected;

        // Focus the panel!
        this.updateState(() => {
            var panel: any = React.findDOMNode(this).querySelector('.omnisharp-atom-output.selected');
            panel.focus();
        });
    }

    public showView() {
        this.visible = true;
    }

    public hideView() {
        this.visible = false;
        atom.workspace.getActivePane().activate();
        atom.workspace.getActivePane().activateItem();
        return this;
    }

    public toggleView() {
        if (this.visible) {
            this.hideView();
        } else {
            this.showView();
        }
    }

    private toggleErrors() {
        if (this.visible && this.selected === 'errors') {
            this.hideView();
            this.updateState();
            return;
        }

        if (!this.visible) {
            this.showView();
        }
        this.selectPane('errors');
    }

    private isSelected(key: string) {
        if (this.selected) {
            return `omnisharp-atom-output ${key}-output selected`;
        }
        return '';
    }

    private getWindows() {
        var windows: any[] = [];
        if (this.selected === 'errors')
            windows.push(React.createElement<ICodeCheckOutputWindowProps>(CodeCheckOutputWindow, {
                scrollTop: this.state.errorScrollTop,
                setScrollTop: (scrollTop) => this.state.errorScrollTop = scrollTop,
                className: this.isSelected('errors'),
                key: 'errors'
            }));

        if (this.selected === 'find')
            windows.push(React.createElement(FindWindow, {
                className: this.isSelected('find'),
                key: 'find'
            }));

        if (world.supportsBuild && this.selected === 'build') {
            windows.push(React.createElement(BuildOutputWindow, {
                className: this.isSelected('build'),
                key: 'build'
            }));
        }

        if (this.selected === 'omni')
            windows.push(React.createElement(OutputWindow, {
                className: this.isSelected('omni'),
                key: 'omni'
            }));

        return windows;
    }

    public render() {
        if (!this.visible)
            return React.DOM.span({
                style: {
                    display: 'none'
                }
            });

        return React.createElement(DockWindows, { selected: this.selected, setSelected: this.selectPane.bind(this) }, this.getWindows());
    }
}

export = DockWindow;
