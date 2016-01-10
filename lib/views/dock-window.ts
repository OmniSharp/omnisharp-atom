//const Convert = require("ansi-to-html")
import {Observable, Disposable, CompositeDisposable, SingleAssignmentDisposable} from "rx";
import {Component} from "./component";

export interface ToggleButton {
    id: string;
    title: string;
    view: Element;
    options: DocButtonOptions;
}

export interface DocButtonOptions {
    priority?: number;
}

interface InternalToggleButton extends ToggleButton {

}

export interface PaneButton {
    id: string;
    title: string;
    view: Element;
    options: PaneButtonOptions;
}

export interface PaneButtonOptions {
    priority?: number;
    closeable?: boolean;
}

interface InternalPaneButton extends PaneButton {
    _button: Element;
}

export class DockWindow extends Component {
    private _panel: Atom.Panel;
    private _panes: Map<string, InternalPaneButton>;
    private _selectedPane: InternalPaneButton;
    private _toolbar: HTMLDivElement;
    private _paneButtons: HTMLDivElement;
    private _toggleButtons: HTMLDivElement;
    private visible: boolean;
    private tempHeight: number;
    private fontSize: any;

    public get isOpen() { return this.visible; }
    //atom.config.get<number>("editor.fontSize")

    private _selected: string;
    public get selected() { return this._selected; }
    public set selected(value) {
        const pane = this._panes.get(value);

        if (this._selectedPane) {
            this._selectedPane._button.classList.remove("selected");
            this._selectedPane.view.remove();
        }

        if (pane) {
            this._selectedPane = pane;
            pane._button.classList.add("selected");
            this.appendChild(pane.view);
        }

        this._selected = value;
    }

    public createdCallback() {
        super.createdCallback();

        this._selected = "output";
        this.visible = false;
        this.tempHeight = 0;
        this.fontSize = atom.config.get<number>("editor.fontSize");
        this._panes = new Map<string, InternalPaneButton>();

        let fontSize = this.fontSize - 1;
        if (fontSize <= 0)
            fontSize = 1;

        this.classList.add("inset-panel", "font-size-" + fontSize);
        if (this.clientHeight || this.tempHeight) {
            this.style.height = this.clientHeight + this.tempHeight + "px";
        }

        const resizer = new exports.Resizer();
        resizer.update = ({top}: { left: number, top: number }) => {
            console.log(top);
            this.clientHeight = top;
        };

        const windows = document.createElement("div");
        windows.classList.add("panel-heading", "clearfix");
        this.appendChild(windows);

        this._toolbar = document.createElement("div");
        this._toolbar.classList.add("btn-toolbar", "pull-left");
        windows.appendChild(this._toolbar);

        this._paneButtons = document.createElement("div");
        this._paneButtons.classList.add("btn-group", "btn-toggle");
        windows.appendChild(this._paneButtons);

        this._toggleButtons = document.createElement("div");
        this._toggleButtons.classList.add("btn-well", "pull-right", "btn-group");
        windows.appendChild(this._toggleButtons);
    }

    public attachedCallback() {
        super.attachedCallback();

        this.disposable.add(atom.config.observe("editor.fontSize", (size: number) => {
            this.classList.remove("font-size-" + this.fontSize);
            this.fontSize = size;
            this.classList.add("font-size-" + size);
        }));
    }

    public detachedCallback() {
        super.detachedCallback();
    }

    public setPanel(panel: Atom.Panel) {
        this._panel = panel;
    }

    private _addDockButton(button: PaneButton) {
        const {id, title, options} = button;

        const view = document.createElement("button");
        view.classList.add("btn", "btn-default", "btn-fix");
        (view as any)._id = id;
        (view as any)._priority = options.priority;

        const disposable = Disposable.create(() => {
            if (view.classList.contains("selected")) {
                this.selected = (view.previousElementSibling as any)._id;
            }
            view.remove();
            this.disposable.remove(disposable);
        });
        this.disposable.add(disposable);

        const text = document.createElement("span");
        text.innerHTML = title;
        text.classList.add("text");
        view.appendChild(text);

        if (options.closeable) {
            view.classList.add("closeable");

            const close = document.createElement("span");
            close.classList.add("fa", "fa-times-circle", "close-pane");
            close.onclick = (e) => {
                disposable.dispose();
                view.remove();
            };
        }

        view.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.selected = id;
        };

        const internal = <InternalPaneButton>button;
        internal._button = view;

        this._panes.set(id, internal);
        this._insertButton(this._paneButtons, view, options.priority, id);

        return disposable;
    }

    private _addToggleButton({id, options, view}: ToggleButton) {
        const disposable = Disposable.create(() => {
            view.remove();
            this.disposable.remove(disposable);
        });

        this._insertButton(this._paneButtons, view, options.priority, id);

        return disposable;
    }

    private _insertButton(parent: Element, element: Element, priority: number, id: string) {
        let insertIndex = -1;
        for (let i = 0; i < parent.childNodes.length; i++) {
            const child = <any>parent.childNodes[i];
            if (child._id <= id && child._priority <= priority) {
                insertIndex = i + 1;
                break;
            }
        }

        if (insertIndex > -1 && insertIndex < parent.childNodes.length) {
            parent.insertBefore(element, parent.childNodes[insertIndex]);
        } else {
            parent.appendChild(element);
        }
    }

    private updateAtom(cb?: () => void) {
        if (this._panel.visible !== this.visible) {
            if (this.visible) {
                this._panel.show();
            } else {
                this._panel.hide();
            }
        }
        if (cb) cb();
    }

    public showView() {
        this.visible = true;
        this.updateAtom();
    }

    public doShowView() {
        this.visible = true;
    }

    public hideView() {
        this.doHideView();
        this.updateAtom();
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
        this.updateAtom();
    }

    public toggleWindow(selected: string) {
        if (this.visible && this.selected === selected) {
            this.hideView();
            return;
        }

        this.selectWindow(selected);
    }

    public selectWindow(selected: string) {
        if (!this.visible)
            this.doShowView();

        this.selected = selected;

        // Focus the panel!
        this.updateAtom(() => {
            const panel: any = this.querySelector(".omnisharp-atom-output.selected");
            if (panel) panel.focus();
        });
    }

    public addWindow(id: string, title: string, view: Element, options: PaneButtonOptions = { priority: 1000 }, parentDisposable?: Rx.Disposable) {
        const disposable = new SingleAssignmentDisposable();
        const cd = new CompositeDisposable();
        this.disposable.add(disposable);
        disposable.setDisposable(cd);

        if (parentDisposable)
            cd.add(parentDisposable);

        cd.add(this._addDockButton({ id, title, view, options }));

        cd.add(atom.commands.add("atom-workspace", "omnisharp-atom:dock-show-" + id, () => this.selectWindow(id)));
        cd.add(atom.commands.add("atom-workspace", "omnisharp-atom:dock-toggle-" + id, () => this.toggleWindow(id)));

        if (options.closeable) {
            cd.add(atom.commands.add("atom-workspace", "omnisharp-atom:dock-close-" + id, () => {
                this.disposable.remove(disposable);
                disposable.dispose();
            }));
        }

        cd.add(Disposable.create(() => {
            if (this.selected === id) {
                this.selected = "output";
                this.hideView();
            }
        }));

        this.appendChild(view);

        return <Rx.IDisposable>disposable;
    }

    public addButton(id: string, title: string, view: Element, options: DocButtonOptions = { priority: 1000 }, parentDisposable?: Rx.Disposable) {
        const disposable = new SingleAssignmentDisposable();
        const cd = new CompositeDisposable();
        this.disposable.add(disposable);
        disposable.setDisposable(cd);

        if (parentDisposable)
            cd.add(parentDisposable);

        cd.add(this._addToggleButton({ id, title, view, options }));

        return <Rx.IDisposable>disposable;
    }
}

(<any>exports).DockWindow = (<any>document).registerElement("omnisharp-dock-window", { prototype: DockWindow.prototype });

export class Resizer extends Component {
    public update: (location: { left: number; top: number }) => void;
    public done: () => void;

    public attachedCallback() {
        super.attachedCallback();

        const mousemove = Observable.fromEvent<MouseEvent>(document.body, "mousemove").share();
        const mouseup = Observable.fromEvent<MouseEvent>(document.body, "mouseup").share();
        const mousedown = Observable.fromEvent<MouseEvent>(document.body, "mousedown").share();

        const mousedrag = mousedown.selectMany((md) => {
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

        this.disposable.add(mousedrag.subscribe((x) => this.update(x)));
    }
}

(<any>exports).Resizer = (<any>document).registerElement("omnisharp-resizer", { prototype: Resizer.prototype });
