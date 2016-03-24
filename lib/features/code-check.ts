import {Models} from "omnisharp-client";
import _ from "lodash";
import {Observable, Subject} from "rxjs";
import {CompositeDisposable, Disposable} from "omnisharp-client";
import {Omni} from "../server/omni";
import {dock} from "../atom/dock";
import {CodeCheckOutputElement} from "../views/codecheck-output-pane-view";
import {reloadWorkspace} from "./reload-workspace";

class CodeCheck implements IFeature {
    private disposable: CompositeDisposable;

    public displayDiagnostics: Models.DiagnosticLocation[] = [];
    public selectedIndex: number = 0;
    private scrollTop: number = 0;
    private _editorSubjects = new WeakMap<Atom.TextEditor, () => Observable<Models.DiagnosticLocation[]>>();
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

        this.disposable.add(Omni.eachEditor((editor, cd) => {
            const subject = new Subject<any>();

            const o = subject
                .debounceTime(100)
                .filter(() => !editor.isDestroyed())
                .flatMap(() => this._doCodeCheck(editor))
                .map(response => response.QuickFixes || [])
                .share();

            this._editorSubjects.set(editor, () => {
                const result = o.take(1);
                subject.next(null);
                return result as Observable<Models.DiagnosticLocation[]>;
            });

            cd.add(o.subscribe());

            cd.add(editor.getBuffer().onDidSave(() => subject.next(null)));
            cd.add(editor.getBuffer().onDidReload(() => subject.next(null)));
            cd.add(editor.getBuffer().onDidStopChanging(() => subject.next(null)));
            cd.add(Disposable.create(() => this._editorSubjects.delete(editor)));
        }));

        // Linter is doing this for us!
        /*this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            cd.add(Omni.whenEditorConnected(editor).subscribe(() => this.doCodeCheck(editor)));
        }));*/

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
                    .do(() => solution.codecheck({ FileName: null })))
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
        return _.filter(quickFixes, (quickFix: Models.DiagnosticLocation) => {
            return quickFix.LogLevel !== "Hidden";
        });
    }

    public dispose() {
        this.disposable.dispose();
    }

    private _doCodeCheck(editor: Atom.TextEditor) {
        return Omni.request(editor, solution => solution.codecheck({}));
    };

    public doCodeCheck(editor: Atom.TextEditor): Observable<Models.DiagnosticLocation[]> {
        const callback = this._editorSubjects.get(editor);
        if (callback) {
            return callback();
        }
        return Observable.timer(100)
            .flatMap(() => this.doCodeCheck(editor));
    }

    public required = true;
    public title = "Diagnostics";
    public description = "Support for diagnostic errors.";
}

export const codeCheck = new CodeCheck;
