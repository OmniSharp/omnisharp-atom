import {OmniSharpAtom} from "../../omnisharp.d.ts";
import {CompositeDisposable, SingleAssignmentDisposable, Disposable, IDisposable} from "../../Disposable";
import * as _ from "lodash";
import {DockWindow, DockPane, DockButton, IDockWindowProps, DocPaneOptions, DocButtonOptions} from "../views/dock-window";
import * as React from "react";

class Dock implements OmniSharpAtom.IAtomFeature {
    private disposable: CompositeDisposable;
    private view: Element;
    private dock: DockWindow<IDockWindowProps>;
    private _panes: DockPane<any, any>[] = [];
    private _buttons: DockButton[] = [];

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:toggle-dock", () => this.toggle()));
        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:show-dock", () => this.show()));
        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:hide-dock", () => this.hide()));
        this.disposable.add(atom.commands.add("atom-workspace", "core:close", () => this.hide()));
        this.disposable.add(atom.commands.add("atom-workspace", "core:cancel", () => this.hide()));
    }

    public attach() {
        const p = atom.workspace.addBottomPanel({
            item: document.createElement("span"),
            visible: false,
            priority: 1000
        });

        this.view = p.item.parentElement;
        this.view.classList.add("omnisharp-atom-pane");
        this.dock = <any> React.render(React.createElement<IDockWindowProps>(DockWindow, {
            panes: this._panes,
            buttons: this._buttons,
            panel: p
        }), this.view);

        this.disposable.add(Disposable.create(() => {
            React.unmountComponentAtNode(this.view);
            p.destroy();
            this.view.remove();
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public get isOpen() { return this.dock && this.dock.isOpen; }
    public get selected() { return this.dock && this.dock.selected; }

    public toggle() {
        if (this.dock)
            this.dock.toggleView();
    }

    public show() {
        if (this.dock)
            this.dock.showView();
    }

    public hide() {
        if (this.dock)
            this.dock.hideView();
    }

    public toggleWindow(selected: string) {
        this.dock.toggleWindow(selected);
    }

    public selectWindow(selected: string) {
        this.dock.selectWindow(selected);
    }

    public addWindow<P, S>(id: string, title: string, view: typeof React.Component, props: P, options: DocPaneOptions = { priority: 1000 }, parentDisposable?: IDisposable) {
        const sad = new SingleAssignmentDisposable();
        const cd = new CompositeDisposable();
        this.disposable.add(sad);
        sad.disposable = cd;

        if (parentDisposable)
            cd.add(parentDisposable);

        this._panes.push({ id, title, view, props, options, disposable: sad });

        cd.add(atom.commands.add("atom-workspace", "omnisharp-dock:show-" + _.kebabCase(title), () => this.selectWindow(id)));
        cd.add(atom.commands.add("atom-workspace", "omnisharp-dock:toggle-" + _.kebabCase(title), () => this.toggleWindow(id)));

        if (options.closeable) {
            cd.add(atom.commands.add("atom-workspace", "omnisharp-dock:close-" + id, () => {
                this.disposable.remove(sad);
                if (this.dock.selected === id) {
                    this.dock.state.selected = "output";
                    this.hide();
                }
                sad.dispose();
            }));
        }

        cd.add(Disposable.create(() => {
            _.remove(this._panes, { id });
            this.dock.state.selected = "output";
            this.dock.forceUpdate();
        }));

        this._update();

        return <IDisposable>sad;
    }

    public addButton<T>(id: string, title: string, view: React.HTMLElement, options: DocButtonOptions = { priority: 1000 }, parentDisposable?: Disposable) {
        const sad = new SingleAssignmentDisposable();
        const cd = new CompositeDisposable();
        this.disposable.add(sad);
        sad.disposable = cd;

        if (parentDisposable)
            cd.add(parentDisposable);

        this._buttons.push({ id, title, view, options, disposable: sad });

        cd.add(Disposable.create(() => {
            _.remove(this._buttons, { id });
            this.dock.forceUpdate();
        }));

        this._update();

        return <IDisposable>sad;
    }

    private _update() {
        // Sort th buttons!
        this._panes = _(this._panes)
            .sortBy(z => z.id)
            .sort((a, b) => {
                if (a.options.priority === b.options.priority) return 0;
                if (a.options.priority > b.options.priority) return 1;
                return -1;
            })
            .value();

        this._buttons = _(this._buttons)
            .sortBy(z => z.id)
            .sort((a, b) => {
                if (a.options.priority === b.options.priority) return 0;
                if (a.options.priority > b.options.priority) return 1;
                return -1;
            })
            .value();

        if (this.dock) {
            this.dock.props.panes = this._panes;
            this.dock.props.buttons = this._buttons;
            this.dock.forceUpdate();
        }
    }

    public required = true;
    public title = "Dock";
    public description = "The dock window used to show logs and diagnostics and other things.";
}

export const dock = new Dock;
