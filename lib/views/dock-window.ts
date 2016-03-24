import {Observable} from "rxjs";
import {Disposable, CompositeDisposable, SingleAssignmentDisposable, IDisposable} from "omnisharp-client";

export interface ToggleButton {
    id: string;
    title: string;
    view: HTMLElement;
    options: DocButtonOptions;
    disposable: CompositeDisposable;
}

export interface DocButtonOptions {
    priority?: number;
}

interface InternalToggleButton extends ToggleButton {

}

export interface PaneButton {
    id: string;
    title: string;
    view: HTMLElement;
    options: PaneButtonOptions;
    disposable: CompositeDisposable;
}

export interface PaneButtonOptions {
    priority?: number;
    closeable?: boolean;
}

interface InternalPaneButton extends PaneButton {
    _button?: Element;
}

export class DockWindow extends HTMLDivElement implements WebComponent {
    private disposable: CompositeDisposable;
    private _panel: Atom.Panel;
    private _selectedPane: InternalPaneButton;
    private _toolbar: HTMLDivElement;
    private _paneButtons: HTMLDivElement;
    private _toggleButtons: HTMLDivElement;
    private _panes: Map<string, InternalPaneButton>;
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
        this.disposable = new CompositeDisposable();
        this._panes = new Map<string, InternalPaneButton>();
        this._selected = "output";
        this.visible = false;
        this.tempHeight = 0;
        this.fontSize = atom.config.get<number>("editor.fontSize");

        let fontSize = this.fontSize - 1;
        if (fontSize <= 0)
            fontSize = 1;

        this.classList.add("inset-panel", "font-size-" + fontSize);
        if (this.clientHeight || this.tempHeight) {
            this.style.height = this.clientHeight + this.tempHeight + "px";
        }

        const resizer = new exports.Resizer();
        let _originalHeight = this.clientHeight;
        resizer.start = () => { _originalHeight = this.clientHeight; };
        resizer.update = ({top}: { left: number, top: number }) => {
            console.log(top);
            this.style.height = `${_originalHeight + -(top)}px`;
        };
        resizer.done = () => { /* */ };
        this.appendChild(resizer);

        const windows = document.createElement("div");
        windows.classList.add("panel-heading", "clearfix");
        this.appendChild(windows);

        this._toolbar = document.createElement("div");
        this._toolbar.classList.add("btn-toolbar", "pull-left");
        windows.appendChild(this._toolbar);

        this._paneButtons = document.createElement("div");
        this._paneButtons.classList.add("btn-group", "btn-toggle");
        this._toolbar.appendChild(this._paneButtons);

        this._toggleButtons = document.createElement("div");
        this._toggleButtons.classList.add("btn-well", "pull-right", "btn-group");
        windows.appendChild(this._toggleButtons);
    }

    public attachedCallback() {
        this.disposable.add(atom.config.observe("editor.fontSize", (size: number) => {
            this.className = this.className.replace(/font-size-[\d]*/g, "");
            this.fontSize = size;
            this.classList.add("font-size-" + size);
        }));
    }

    public setPanel(panel: Atom.Panel) {
        this._panel = panel;
    }

    private _addDockButton(button: InternalPaneButton) {
        const {id, title, options, disposable} = button;

        const view = document.createElement("button");
        view.classList.add("btn", "btn-default", "btn-fix");
        (view as any)._id = id;
        (view as any)._priority = options.priority;

        disposable.add(Disposable.create(() => {
            if (view.classList.contains("selected")) {
                this.selected = (view.previousElementSibling as any)._id;
            }
            view.remove();
        }));

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
            };
            view.appendChild(close);
        }

        view.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.selected = id;
        };

        button._button = view;

        this._insertButton(this._paneButtons, view, options.priority, id);
    }

    private _addToggleButton({id, options, view, disposable}: ToggleButton) {
        disposable.add(Disposable.create(() => {
            view.remove();
            this.disposable.remove(disposable);
        }));

        this._insertButton(this._toggleButtons, view, options.priority, id);
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

    public addWindow(id: string, title: string, view: HTMLElement, options: PaneButtonOptions = { priority: 1000 }, parentDisposable?: Disposable) {
        const disposable = new SingleAssignmentDisposable();
        const cd = new CompositeDisposable();
        const context = { id, title, view, options, disposable: cd };

        this._panes.set(id, context);
        this.disposable.add(disposable);
        disposable.disposable = cd;

        if (parentDisposable)
            cd.add(parentDisposable);

        view.classList.add("omnisharp-atom-output", `${id}-output`, "selected");

        cd.add(atom.commands.add("atom-workspace", "omnisharp-atom:dock-show-" + id, () => this.selectWindow(id)));
        cd.add(atom.commands.add("atom-workspace", "omnisharp-atom:dock-toggle-" + id, () => this.toggleWindow(id)));

        if (options.closeable) {
            cd.add(atom.commands.add("atom-workspace", "omnisharp-atom:dock-close-" + id, () => {
                this.disposable.remove(disposable);
                disposable.dispose();
                this.hideView();
            }));
        }

        cd.add(Disposable.create(() => {
            if (this.selected === id) {
                this.selected = "output";
            }
        }));

        cd.add(Disposable.create(() => {
            view.remove();
            this._panes.delete(id);
        }));

        this._addDockButton(context);

        if (!this.selected) this.selected = id;

        return <IDisposable>disposable;
    }

    public addButton(id: string, title: string, view: HTMLElement, options: DocButtonOptions = { priority: 1000 }, parentDisposable?: Disposable) {
        const disposable = new SingleAssignmentDisposable();
        const cd = new CompositeDisposable();
        this.disposable.add(disposable);
        disposable.disposable = cd;

        if (parentDisposable)
            cd.add(parentDisposable);

        this._addToggleButton({ id, title, view, options, disposable: cd });

        return <IDisposable>disposable;
    }
}

(<any>exports).DockWindow = (<any>document).registerElement("omnisharp-dock-window", { prototype: DockWindow.prototype });

export class Resizer extends HTMLDivElement implements WebComponent {
    private disposable: CompositeDisposable;
    public update: (location: { left: number; top: number }) => void;
    public done: () => void;
    public start: () => void;

    public createdCallback() {
        this.classList.add("omnisharp-atom-output-resizer");
    }

    public detachedCallback() {
        this.disposable.dispose();
    }

    public attachedCallback() {
        this.disposable = new CompositeDisposable();
        const mousemove = Observable.fromEvent<MouseEvent>(document.body, "mousemove").share();
        const mouseup = Observable.fromEvent<MouseEvent>(document.body, "mouseup").share();
        const mousedown = Observable.fromEvent<MouseEvent>(this, "mousedown").share();

        const mousedrag = mousedown.flatMap((md) => {
            const startX = md.clientX + window.scrollX,
                startY = md.clientY + window.scrollY;

            return mousemove.map((mm) => {
                mm.preventDefault();

                return {
                    left: (parseInt((<any>md.target).style.left, 10) || 0) + mm.clientX - startX,
                    top: (parseInt((<any>md.target).style.top, 10) || 0) + mm.clientY - startY
                };
            }).takeUntil(mouseup);
        });

        this.disposable.add(mousedown.subscribe(x => this.start()));
        this.disposable.add(mousedrag.subscribe((x) => this.update(x), null, () => this.done()));
    }
}

(<any>exports).Resizer = (<any>document).registerElement("omnisharp-resizer", { prototype: Resizer.prototype });
