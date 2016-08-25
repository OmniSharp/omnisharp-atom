import {Models} from "omnisharp-client";
import {Observable, Subject} from "rxjs";
import {CompositeDisposable} from "ts-disposables";
import {Omni} from "../server/omni";
import {dock} from "../atom/dock";
import {CodeCheckOutputElement} from "../views/codecheck-output-pane-view";
import {reloadWorkspace} from "./reload-workspace";
import {filter} from "lodash";

class CodeCheck implements IFeature {
    private disposable: CompositeDisposable;

    public displayDiagnostics: Models.DiagnosticLocation[] = [];
    public selectedIndex: number = 0;
    private scrollTop: number = 0;
    private _fullCodeCheck: Subject<any>;
    private _window = new CodeCheckOutputElement;

    public activate() {
        this.disposable = new CompositeDisposable();

        this._fullCodeCheck = new Subject<any>();
        this.disposable.add(this._fullCodeCheck);

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:next-diagnostic", () => {
            this._window.next();
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-diagnostic", () => {
            Omni.navigateTo(this._window.current);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:previous-diagnostic", () => {
            this._window.prev();
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-next-diagnostic", () => {
            this._window.next();
            Omni.navigateTo(this._window.current);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-previous-diagnostic", () => {
            this._window.prev();
            Omni.navigateTo(this._window.current);
        }));

        this.disposable.add(Omni.diagnostics
            .subscribe(diagnostics => {
                this.displayDiagnostics = this.filterOnlyWarningsAndErrors(diagnostics);
            }));

        this.disposable.add(Omni.diagnostics.subscribe(s => {
            this.scrollTop = 0;
            this.selectedIndex = 0;
        }));

        this.disposable.add(Omni.diagnostics
            .delay(100)
            .subscribe(diagnostics => this._window.update(diagnostics)));

        this.disposable.add(dock.addWindow("errors", "Errors & Warnings", this._window));

        let started = 0, finished = 0;
        this.disposable.add(Observable.combineLatest(
            Omni.listener.packageRestoreStarted.map(x => started++),
            Omni.listener.packageRestoreFinished.map(x => finished++),
            (s, f) => s === f)
            .filter(r => r)
            .debounceTime(2000)
            .subscribe(() => {
                started = 0;
                finished = 0;
                this.doFullCodeCheck();
            }));

        this.disposable.add(Omni.listener.packageRestoreFinished.debounceTime(3000).subscribe(() => this.doFullCodeCheck()));
        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:code-check", () => this.doFullCodeCheck()));

        this.disposable.add(this._fullCodeCheck
            .concatMap(() => reloadWorkspace.reloadWorkspace()
                .toArray()
                .concatMap(x => Omni.solutions)
                .concatMap(solution => solution.whenConnected()
                    .do(() => solution.diagnostics({ FileName: null })))
            )
            .subscribe());

        Omni.registerConfiguration(solution => solution
            .whenConnected()
            .delay(1000)
            .subscribe(() => this._fullCodeCheck.next(true)));
    }

    public doFullCodeCheck() {
        this._fullCodeCheck.next(true);
    }

    public filterOnlyWarningsAndErrors(quickFixes: Models.DiagnosticLocation[]): Models.DiagnosticLocation[] {
        return filter(quickFixes, x => x.LogLevel !== "Hidden");
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = "Diagnostics";
    public description = "Support for diagnostic errors.";
}

export const codeCheck = new CodeCheck;
