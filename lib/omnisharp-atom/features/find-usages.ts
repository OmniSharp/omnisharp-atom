import {CompositeDisposable, Observable, Subject, Disposable} from "rx";
import * as _ from "lodash";
import Omni = require('../../omni-sharp-server/omni');
import {dock} from "../atom/dock";
import {FindWindowElement} from "../views/find-pane-view";
FindWindowElement;

class FindUsages implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private _dockWindowDisposable: Rx.CompositeDisposable;
    private _currentWindow: FindWindowElement;

    public activate() {
        this.disposable = new CompositeDisposable();

        var find = Observable.merge(
            // Listen to find usages
            Omni.listener.observeFindusages,
            // We also want find implementations, where we found more than one
            Omni.listener.observeFindimplementations
                .where(z => z.response.QuickFixes && z.response.QuickFixes.length > 1)
        )
            // For the UI we only need the qucik fixes.
            .map(z => <OmniSharp.Models.DiagnosticLocation[]>z.response.QuickFixes || [])
            .share();

        var open = Omni.listener.requests.where(z => !z.silent && z.command === "findusages").map(() => true);
        var reset = Omni.listener.requests.where(z => !z.silent && (z.command === "findimplementations" || z.command === "findusages")).map(() => true);

        this.disposable.add(reset.subscribe(() => {
            if (this._dockWindowDisposable) this._dockWindowDisposable.dispose();
            this._dockWindowDisposable = null;

            if (this._currentWindow) this._currentWindow.destory();
            this._currentWindow = null;
        }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:find-usages", () => {
            Omni.request(client => client.findusages({ WantWhitespace: true }));
        }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:go-to-implementation", () => {
            Omni.request(client => client.findimplementations({}));
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:next-usage', () => {
            if (this._currentWindow) {
                this._currentWindow.next();
            }
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:go-to-usage', () => {
            if (this._currentWindow) {
                this._currentWindow.goto();
            }
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:previous-usage', () => {
            if (this._currentWindow) {
                this._currentWindow.previous();
            }
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:go-to-next-usage', () => {
            if (this._currentWindow) {
                this._currentWindow.gotoNext();
            }
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:go-to-previous-usage', () => {
            if (this._currentWindow) {
                this._currentWindow.gotoPrevious();
            }
        }));

        this.disposable.add(open.delay(1).subscribe(() => {
            this.ensureWindowIsCreated();
            dock.selectWindow("find");
        }));

        this.disposable.add(find.subscribe((usages) => {
            this.ensureWindowIsCreated();
            dock.selectWindow("find");

            var window: FindWindowElement = this._currentWindow = <any>dock.getWebComponentWindow('find');
            window.usages = usages;
        }));

        this.disposable.add(Omni.listener.observeFindimplementations.subscribe((data) => {
            if (data.response.QuickFixes.length == 1) {
                Omni.navigateTo(data.response.QuickFixes[0]);
            }
        }));

        this.disposable.add(dock.selectedWindow.where(x => x === "find").subscribe(() => {
            var newWindow = dock.getWebComponentWindow('find');
            if (this._currentWindow && newWindow && newWindow !== this._currentWindow) {
                var parent = newWindow.parentElement;
                parent.insertBefore(this._currentWindow, newWindow);
                newWindow.remove();
            }
        }));
    }

    private ensureWindowIsCreated() {
        if (!this._dockWindowDisposable) {
            this._dockWindowDisposable = new CompositeDisposable();
            var windowDisposable = dock.addWebComponentWindow('find', 'Find', "omnisharp-find-window", {
                priority: 2000,
                closeable: true
            }, this._dockWindowDisposable);
            this._dockWindowDisposable.add(windowDisposable);
            this._dockWindowDisposable.add(Disposable.create(() => {
                this.disposable.remove(this._dockWindowDisposable);
                this._dockWindowDisposable = null;
                this._currentWindow = null;
            }));
            this.disposable.add(this._dockWindowDisposable);
            this._selectedIndex = 0;
            this._scrollTop = 0;
            this._usages = null;
        }
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = 'Find Usages / Go To Implementations';
    public description = 'Adds support to find usages, and go to implementations';
}
export var findUsages = new FindUsages;
