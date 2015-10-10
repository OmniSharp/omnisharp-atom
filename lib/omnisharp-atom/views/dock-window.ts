//var Convert = require('ansi-to-html')
import _ = require('lodash')
import {Observable, SingleAssignmentDisposable, Disposable, CompositeDisposable, Subject} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {findUsages} from "../features/find-usages";
import {world} from "../world";

interface IDockWindowState {
    selected?: string;
    fontSize?: number;
}

export interface IDockWindowProps {
    panel: Atom.Panel;
    panes: DockPane[];
    buttons: DockButton[];
}

interface IDockWindowButtonsState {
}

interface IDockWindowButtonsProps {
    selected: string;
    setSelected: (selected: string) => void;
    panes: DockPane[];
    buttons: DockButton[];
    children: any[];
}



export interface DocPaneOptions {
    priority?: number;
    closeable?: boolean;
}

export interface DockPane {
    id: string;
    title: string;
    props?: any;
    view?: typeof React.Component;
    element?: string;
    options: DocPaneOptions;
    disposable: Rx.IDisposable;
}


export interface DocButtonOptions {
    priority?: number;
}

export interface DockButton {
    id: string;
    title: string;
    view: React.HTMLElement;
    options: DocButtonOptions;
    disposable: Rx.IDisposable;
}

export interface DisposableDockPane {
    id: string;
    title: string;
    props?: any;
    view?: typeof React.Component;
    element?: string;
    options: DocPaneOptions;
    disposable: Rx.Disposable;
}

class DockWindows<T extends IDockWindowButtonsProps> extends ReactClientComponent<T, IDockWindowButtonsState> {

    constructor(props?: T, context?: any) {
        super(props, context);
        this.state = {};
    }

    private panelButton({id, title, options, disposable}: DisposableDockPane) {
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
        }, ...children);
    }

    private button({view}: DockButton) {
        return view;
    }

    private getPanelButtons() {
        return _(this.props.panes)
            .sortBy(z => z.id)
            .sort((a, b) => {
                if (a.options.priority === b.options.priority) return 0;
                if (a.options.priority > b.options.priority) return 1;
                return -1;
            })
            .map(e => this.panelButton(e))
            .value();
    }

    private getButtons() {
        return _(this.props.buttons)
            .sortBy(z => z.id)
            .sort((a, b) => {
                if (a.options.priority === b.options.priority) return 0;
                if (a.options.priority > b.options.priority) return 1;
                return -1;
            })
            .map(e => this.button(e))
            .value();
    }

    public render() {
        return React.DOM.div({
            className: "panel-heading clearfix"
        }, React.DOM.div({ className: 'btn-toolbar pull-left' },
            React.DOM.div({ className: 'btn-group btn-toggle' },
                this.getPanelButtons())
        ),
            React.DOM.div({ className: "btn-well pull-right btn-group" },
                this.getButtons())
        );
    }
}

export class DockWindow<T extends IDockWindowProps> extends ReactClientComponent<T, IDockWindowState> {
    public displayName = "DockWindow";

    public get selected() { return this.state.selected; }
    private visible = false;
    public get isOpen() { return this.visible }
    private height = 0;
    private tempHeight = 0;

    private _convert;

    constructor(props?: T, context?: any) {
        super(props, context);
        this.state = { selected: 'output', fontSize: atom.config.get<number>('editor.fontSize') };
    }

    private _selectedWindow = new Subject<string>();
    public get selectedWindow() { return this._selectedWindow.asObservable(); }

    public componentWillMount() {
        super.componentWillMount();
    }

    public componentDidMount() {
        super.componentDidMount();

        var node = React.findDOMNode(this);
        this.height = node.clientHeight;

        atom.config.observe('editor.fontSize', (size: number) => {
            this.setState({ fontSize: size });
        });
    }

    private updateState(cb?: () => void) {
        this.setState(<any>{}, () => this.updateAtom(cb));
    }

    private updateAtom(cb: () => void) {
        if (this.props.panel.visible !== this.visible) {
            if (this.visible) {
                var node = React.findDOMNode(this);
                this.props.panel.show();
                this.height = node.clientHeight;
            } else {
                this.props.panel.hide();
            }
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
            var panel: HTMLElement = <any>React.findDOMNode(this);

            if (panel) {
                var selectedPane: HTMLElement = <any>_.find(panel.children, x => x.classList.contains('selected'));
                selectedPane.focus();
            }

            this._selectedWindow.onNext(selected);
        });
    }

    private getWindows() {
        var window = _.find(this.props.panes, { id: this.state.selected });
        if (!this.state.selected || !window)
            return React.DOM.span({});

        if (window) {
            if (window.view) {
                var props = _.clone(window.props);
                props.className = (this.isSelected((window.id)) + ' ' + (props.className || ''))
                props.key = window.id;
                props.id = `dock-${window.id}`;
                return React.createElement(window.view, props);
            } else if (window.element) {
                return React.createElement(window.element, { id: `dock-${window.id}`, key: window.id, className: this.isSelected((window.id)) });
            }
        }
    }

    public render() {
        if (!this.visible) {
            return React.DOM.span({
                style: <any>{
                    display: 'none'
                }
            });
        }

        var fontSize = this.state.fontSize - 1;
        if (fontSize <= 0)
            fontSize = 1;

        var insetProps = <any>{
            className: "inset-panel font-size-" + fontSize
        };

        if (this.height || this.tempHeight) {
            insetProps.style = { height: this.height + this.tempHeight };
        }

        return React.DOM.div(insetProps,
            React.createElement(Resizer, {
                className: 'omnisharp-atom-output-resizer',
                update: ({top}: { left: number, top: number }) => {
                    this.tempHeight = -(top);
                    this.setState(<any>{});
                },
                done: () => {
                    this.height = this.height + this.tempHeight;
                    this.tempHeight = 0;
                    this.setState(<any>{});
                }
            }),
            React.createElement(DockWindows, { selected: this.state.selected, setSelected: this.selectWindow.bind(this), panes: this.props.panes, buttons: this.props.buttons }),
            this.getWindows());
    }
}

function makeRxReactEventHandler<T>() {
    var subject = new Subject<T>();

    return {
        handler: <(value: T) => void>subject.onNext.bind(subject),
        observable: subject.asObservable()
    }
}

interface IResizeProps {
    update(location: { left: number; top: number });
    done();
    className: string;
}

export class Resizer<T extends IResizeProps> extends React.Component<T, {}> {
    private _mousedown = makeRxReactEventHandler<React.MouseEvent>();
    private disposable = new CompositeDisposable();

    public componentDidMount() {
        var node = React.findDOMNode(this);
        var mousemove = Observable.fromEvent<MouseEvent>(document.body, 'mousemove').share();
        var mouseup = Observable.fromEvent<MouseEvent>(document.body, 'mouseup').share();
        var mousedown = this._mousedown.observable;

        var mousedrag = mousedown.selectMany((md) => {
            const startX = md.clientX + window.scrollX,
                startY = md.clientY + window.scrollY,
                startLeft = parseInt((<any>md.target).style.left, 10) || 0,
                startTop = parseInt((<any>md.target).style.top, 10) || 0;

            return mousemove.map((mm) => {
                mm.preventDefault();

                return {
                    left: startLeft + mm.clientX - startX,
                    top: startTop + mm.clientY - startY
                };
            }).takeUntil(mouseup);
        });

        mousedown.flatMapLatest(x => mousemove.skipUntil(mouseup)).subscribe(() => this.props.done())
        this.disposable.add(mousedrag.subscribe(this.props.update));
    }

    public componentWillUnmount() {
        var node = React.findDOMNode(this);
        this.disposable.dispose();
    }

    public render() {
        return React.DOM.div({
            className: this.props.className,
            onMouseDown: (e) => this._mousedown.handler(e)
        });
    }
}
