import {OmniSharp} from "../../omnisharp";
import {CompositeDisposable, Observable, Disposable} from "rx";
import {Omni} from "../../omni-sharp-server/omni";
import {dock} from "../atom/dock";
import {FindWindow} from "../views/find-pane-view";

class FindUsages implements IFeature {
    private disposable: Rx.CompositeDisposable;
    private window: Rx.CompositeDisposable;
    public selectedIndex: number = 0;
    private scrollTop: number = 0;
    public usages: OmniSharp.Models.DiagnosticLocation[] = [];

    public observe: {
        find: Observable<OmniSharp.Models.DiagnosticLocation[]>;
        open: Observable<boolean>;
        reset: Observable<boolean>;
    };

    public activate() {
        this.disposable = new CompositeDisposable();

        const observable = Observable.merge(
            // Listen to find usages
            Omni.listener.findusages,
            // We also want find implementations, where we found more than one
            Omni.listener.findimplementations
                .where(z => z.response.QuickFixes && z.response.QuickFixes.length > 1)
        )
            // For the UI we only need the qucik fixes.
            .map(z => <OmniSharp.Models.DiagnosticLocation[]>z.response.QuickFixes || [])
            .share();

        this.observe = {
            find: observable,
            // NOTE: We cannot do the same for find implementations because find implementation
            //      just goes to the item if only one comes back.
            open: Omni.listener.requests.where(z => !z.silent && z.command === "findusages").map(() => true),
            reset: Omni.listener.requests.where(z => !z.silent && (z.command === "findimplementations" || z.command === "findusages")).map(() => true),
        };

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:find-usages", () => {
            Omni.request(solution => solution.findusages({}));
        }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:go-to-implementation", () => {
            Omni.request(solution => solution.findimplementations({}));
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:next-usage", () => {
            this.updateSelectedItem(this.selectedIndex + 1);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-usage", () => {
            if (this.usages[this.selectedIndex])
                Omni.navigateTo(this.usages[this.selectedIndex]);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:previous-usage", () => {
            this.updateSelectedItem(this.selectedIndex - 1);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-next-usage", () => {
            this.updateSelectedItem(this.selectedIndex + 1);
            if (this.usages[this.selectedIndex])
                Omni.navigateTo(this.usages[this.selectedIndex]);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-previous-usage", () => {
            this.updateSelectedItem(this.selectedIndex - 1);
            if (this.usages[this.selectedIndex])
                Omni.navigateTo(this.usages[this.selectedIndex]);
        }));

        this.disposable.add(this.observe.find.subscribe(s => {
            this.usages = s;
        }));

        this.disposable.add(Observable.merge(this.observe.find.map(z => true), this.observe.open.map(z => true)).subscribe(() => {
            this.ensureWindowIsCreated();
            dock.selectWindow("find");
        }));

        this.disposable.add(this.observe.reset.subscribe(() => {
            this.usages = [];
            this.scrollTop = 0;
            this.selectedIndex = 0;
        }));


        this.disposable.add(Omni.listener.findimplementations.subscribe((data) => {
            if (data.response.QuickFixes.length === 1) {
                Omni.navigateTo(data.response.QuickFixes[0]);
            }
        }));
    }

    private updateSelectedItem(index: number) {
        if (index < 0)
            index = 0;
        if (index >= this.usages.length)
            index = this.usages.length - 1;
        if (this.selectedIndex !== index)
            this.selectedIndex = index;
    }

    private ensureWindowIsCreated() {
        if (!this.window) {
            this.window = new CompositeDisposable();
            const windowDisposable = dock.addWindow("find", "Find", FindWindow, {
                scrollTop: () => this.scrollTop,
                setScrollTop: (scrollTop: number) => this.scrollTop = scrollTop,
                findUsages: this
            }, {
                    priority: 2000,
                    closeable: true
                }, this.window);
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
        Omni.navigateTo(this.usages[this.selectedIndex]);
    }

    public required = true;
    public title = "Find Usages / Go To Implementations";
    public description = "Adds support to find usages, and go to implementations";
}
export const findUsages = new FindUsages;
