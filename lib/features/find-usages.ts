import {Models} from "omnisharp-client";
import {Observable, Subject} from "rxjs";
import {CompositeDisposable, Disposable} from "omnisharp-client";
import {Omni} from "../server/omni";
import {dock} from "../atom/dock";
import {FindWindow} from "../views/find-pane-view";

class FindUsages implements IFeature {
    private disposable: CompositeDisposable;
    private window: CompositeDisposable;
    private _findWindow = new FindWindow;
    private scrollTop: number = 0;
    public usages: Models.DiagnosticLocation[] = [];

    public observe: {
        find: Observable<Models.DiagnosticLocation[]>;
        open: Observable<boolean>;
        reset: Observable<boolean>;
        selected: Observable<number>;
    };

    public activate() {
        this.disposable = new CompositeDisposable();

        const observable = Observable.merge(
            // Listen to find usages
            Omni.listener.findusages,
            // We also want find implementations, where we found more than one
            Omni.listener.findimplementations
                .filter(z => z.response.QuickFixes && z.response.QuickFixes.length > 1)
        )
            // For the UI we only need the qucik fixes.
            .map(z => <Models.DiagnosticLocation[]>z.response.QuickFixes || [])
            .share();

        const selected = new Subject<number>();

        this.observe = {
            find: observable,
            // NOTE: We cannot do the same for find implementations because find implementation
            //      just goes to the item if only one comes back.
            open: Omni.listener.requests.filter(z => !z.silent && z.command === "findusages").map(() => true),
            reset: Omni.listener.requests.filter(z => !z.silent && (z.command === "findimplementations" || z.command === "findusages")).map(() => true),
            selected: selected.asObservable()
        };

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:find-usages", () => {
            Omni.request(solution => solution.findusages({}));
        }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:go-to-implementation", () => {
            Omni.request(solution => solution.findimplementations({}));
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:next-usage", () => {
            this._findWindow.next();
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-usage", () => {
            Omni.navigateTo(this._findWindow.current);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:previous-usage", () => {
            this._findWindow.prev();
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-next-usage", () => {
            this._findWindow.next();
            Omni.navigateTo(this._findWindow.current);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-previous-usage", () => {
            this._findWindow.prev();
            Omni.navigateTo(this._findWindow.current);
        }));

        this.disposable.add(this.observe.find.subscribe(s => {
            this.usages = s;
            this._findWindow.update(s);
        }));

        this.disposable.add(Observable.merge(this.observe.find.map(z => true), this.observe.open.map(z => true)).subscribe(() => {
            this.ensureWindowIsCreated();
            dock.selectWindow("find");
        }));

        this.disposable.add(this.observe.reset.subscribe(() => {
            this.usages = [];
            this.scrollTop = 0;
            this._findWindow.selectedIndex = 0;
        }));


        this.disposable.add(Omni.listener.findimplementations.subscribe((data) => {
            if (data.response.QuickFixes.length === 1) {
                Omni.navigateTo(data.response.QuickFixes[0]);
            }
        }));
    }

    private ensureWindowIsCreated() {
        if (!this.window) {
            this.window = new CompositeDisposable();
            const windowDisposable = dock.addWindow("find", "Find", this._findWindow, { priority: 2000, closeable: true }, this.window);
            this.window.add(windowDisposable);
            this.window.add(Disposable.create(() => {
                this.disposable.remove(this.window);
                this.window = null;
            }));
            this.disposable.add(this.window);
        }
    }

    public dispose() {
        this.disposable.dispose();
    }

    public navigateToSelectedItem() {
        Omni.navigateTo(this.usages[this._findWindow.selectedIndex]);
    }

    public required = true;
    public title = "Find Usages / Go To Implementations";
    public description = "Adds support to find usages, and go to implementations";
}
export const findUsages = new FindUsages;
