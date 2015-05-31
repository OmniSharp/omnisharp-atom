import {CompositeDisposable, Observable} from "rx";
import Omni = require('../../omni-sharp-server/omni')

class FindUsages implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    public selectedIndex: number = 0;
    public usages: OmniSharp.Models.QuickFix[] = [];
    public observe: {
        find: Observable<OmniSharp.Models.QuickFix[]>;
        open: Observable<boolean>;
        reset: Observable<boolean>;
    };

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

        this.disposable.add(this.observe.find.subscribe(s => {
            this.selectedIndex = 0;
            this.usages = s;
        }));

        this.disposable.add(Omni.addCommand("omnisharp-atom:find-usages", () => {
            Omni.request(client => client.findusages(client.makeRequest()));
        }));

        this.disposable.add(Omni.addCommand("omnisharp-atom:go-to-implementation", () => {
            Omni.request(client => client.findimplementations(client.makeRequest()));
        }));

        this.disposable.add(Omni.addCommand('omnisharp-atom:next-diagnostic', () => {

        }));

        this.disposable.add(Omni.addCommand('omnisharp-atom:previous-diagnostic', () => {

        }));

        Omni.listener.observeFindimplementations.subscribe((data) => {
            if (data.response.QuickFixes.length == 1) {
                Omni.navigateTo(data.response.QuickFixes[0]);
            }
        });
    }

    public dispose() {
        this.disposable.dispose();
    }

    public navigateToSelectedItem() {
        Omni.navigateTo(this.usages[this.selectedIndex]);
    }
}
export var findUsages = new FindUsages;
