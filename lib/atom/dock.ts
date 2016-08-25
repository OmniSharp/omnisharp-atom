import {CompositeDisposable, Disposable, IDisposable} from "ts-disposables";
import {DockWindow, DocButtonOptions, PaneButtonOptions} from "../views/dock-window";


function fromDock(key?: string) {
    return function fromDock(target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
        const internalKey = `${key || propertyKey}`;
        descriptor.value = function() {
            return this.dock[internalKey].apply(this.dock, arguments);
        };
    };
}

class Dock implements IAtomFeature {
    private disposable: CompositeDisposable;
    private view: Element;
    private dock: DockWindow = new DockWindow;

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
        this.dock.setPanel(p);

        this.view.appendChild(this.dock);

        this.disposable.add(Disposable.create(() => {
            p.destroy();
            this.view.remove();
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public get isOpen() { return this.dock.isOpen; }
    public get selected() { return this.dock.selected; }
    public set selected(value) { this.dock.selected = value; }

    @fromDock("toggleView")
    public toggle() { /* */ }

    @fromDock("showView")
    public show() { /* */ };

    @fromDock("hideView")
    public hide() { /* */ };

    @fromDock()
    public addWindow(id: string, title: string, view: Element, options: PaneButtonOptions = { priority: 1000 }, parentDisposable?: IDisposable): IDisposable { throw new Error(""); }

    @fromDock()
    public toggleWindow(selected: string) { /* */ }

    @fromDock()
    public selectWindow(selected: string) { /* */ }

    @fromDock()
    public addButton(id: string, title: string, view: Element, options: DocButtonOptions = { priority: 1000 }, parentDisposable?: IDisposable): IDisposable { throw new Error(""); }

    public required = true;
    public title = "Dock";
    public description = "The dock window used to show logs and diagnostics and other things.";
}

export const dock = new Dock;
