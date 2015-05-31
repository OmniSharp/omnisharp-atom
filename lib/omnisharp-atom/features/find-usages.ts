import {CompositeDisposable, Observable, Subject} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import {dock} from "../atom/dock";
import {FindWindow} from "../views/find-pane-view";

class FindUsages implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private window: Rx.CompositeDisposable;
    public selectedIndex: number = 0;
    public usages: OmniSharp.Models.QuickFix[] = [];
    public observe: {
        find: Observable<OmniSharp.Models.QuickFix[]>;
        open: Observable<boolean>;
        reset: Observable<boolean>;
    };

    public moveNext: Observable<boolean>;
    public movePrevious: Observable<boolean>

    public activate() {
        this.disposable = new CompositeDisposable();

        var observable = Observable.merge(
            // Listen to find usages
            Omni.listener.observeFindusages,
            // We also want find implementations, where we found more than one
            Omni.listener.observeFindimplementations
                .where(z => z.response.QuickFixes.length > 1)
            )
        // For the UI we only need the qucik fixes.
            .map(z => z.response.QuickFixes || [])
            .share();

        this.observe = {
            find: observable,
            // NOTE: We cannot do the same for find implementations because find implementation
            //      just goes to the item if only one comes back.
            open: Omni.listener.requests.where(z => z.command === "findusages").map(() => true),
            reset: Omni.listener.requests.where(z => z.command === "findimplementations" || z.command === "findusages").map(() => true)
        }

        var moveNext = new Subject<boolean>();
        var movePrevious = new Subject<boolean>();
        this.moveNext = moveNext;
        this.movePrevious = movePrevious;

        this.disposable.add(this.observe.find.subscribe(s => {
            this.selectedIndex = 0;
            this.usages = s;
        }));

        this.disposable.add(Omni.addCommand("atom-text-editor", "omnisharp-atom:find-usages", () => {
            Omni.request(client => client.findusages(client.makeRequest()));
        }));

        this.disposable.add(Omni.addCommand("atom-text-editor", "omnisharp-atom:go-to-implementation", () => {
            Omni.request(client => client.findimplementations(client.makeRequest()));
        }));

        this.disposable.add(Omni.addCommand("atom-workspace", 'omnisharp-atom:next-usage', () => {
            moveNext.onNext(true);
            if (this.usages[this.selectedIndex])
                Omni.navigateTo(this.usages[this.selectedIndex]);
        }));

        this.disposable.add(Omni.addCommand("atom-workspace", 'omnisharp-atom:current-usage', () => {
            if (this.usages[this.selectedIndex])
                Omni.navigateTo(this.usages[this.selectedIndex]);
        }));

        this.disposable.add(Omni.addCommand("atom-workspace", 'omnisharp-atom:previous-usage', () => {
            movePrevious.onNext(true);
            if (this.usages[this.selectedIndex])
                Omni.navigateTo(this.usages[this.selectedIndex]);
        }));

        this.disposable.add(Observable.merge(findUsages.observe.find.map(z => true), findUsages.observe.open.map(z => true)).subscribe(() => {
            this.ensureWindowIsCreated();
            dock.selectWindow("find");
        }));

        this.disposable.add(Omni.listener.observeFindimplementations.subscribe((data) => {
            if (data.response.QuickFixes.length == 1) {
                Omni.navigateTo(data.response.QuickFixes[0]);
            }
        }));
    }

    private ensureWindowIsCreated() {
        if (!this.window || this.window.isDisposed) {
            if (this.window && this.window.isDisposed) {
                this.disposable.remove(this.window);
            }
            this.window = new CompositeDisposable();
            this.window.add(dock.addWindow('find', 'Find', FindWindow, { findUsages: this }, { priority: 2000, closeable: true }));
            this.disposable.add(this.window);
        }
    }

    public dispose() {
        this.disposable.dispose();
    }

    public navigateToSelectedItem() {
        Omni.navigateTo(this.usages[this.selectedIndex]);
    }
}
export var findUsages = new FindUsages;
