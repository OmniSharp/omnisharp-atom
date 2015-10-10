import _ = require('lodash');
import {CompositeDisposable, Observable, ReplaySubject, Subject, Disposable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
var currentlyEnabled = false;
import {dock} from "../atom/dock";
import {CodeCheckOutputWindow, ICodeCheckOutputWindowProps} from '../views/codecheck-output-pane-view';
import {DriverState} from "omnisharp-client";
import {reloadWorkspace} from "./reload-workspace";

class CodeCheck implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    public observe: {
        diagnostics: Observable<OmniSharp.Models.DiagnosticLocation[]>;
        updated: Observable<Rx.ObjectObserveChange<CodeCheck>>;
    };

    private diagnostics: OmniSharp.Models.DiagnosticLocation[] = [];
    public displayDiagnostics: OmniSharp.Models.DiagnosticLocation[] = [];
    public selectedIndex: number = 0;
    private scrollTop: number = 0;
    private _fullCodeCheck: Subject<any>;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.setup();

        this._fullCodeCheck = new Subject<any>();
        this.disposable.add(this._fullCodeCheck);

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:next-diagnostic', () => {
            this.updateSelectedItem(this.selectedIndex + 1);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:go-to-diagnostic', () => {
            if (this.displayDiagnostics[this.selectedIndex])
                Omni.navigateTo(this.displayDiagnostics[this.selectedIndex]);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:previous-diagnostic', () => {
            this.updateSelectedItem(this.selectedIndex - 1);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:go-to-next-diagnostic', () => {
            this.updateSelectedItem(this.selectedIndex + 1);
            Omni.navigateTo(this.displayDiagnostics[this.selectedIndex]);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:go-to-previous-diagnostic', () => {
            this.updateSelectedItem(this.selectedIndex - 1);
            Omni.navigateTo(this.displayDiagnostics[this.selectedIndex]);
        }));

        this.disposable.add(Omni.eachEditor((editor, cd) => {
            var subject = new Subject<any>();

            var o = subject
                .debounce(500)
                .where(() => !editor.isDestroyed())
                .flatMap(() => this._doCodeCheck(editor))
                .share();

            cd.add(o.subscribe());

            cd.add(editor.getBuffer().onDidSave(() => !subject.isDisposed && subject.onNext(null)));
            cd.add(editor.getBuffer().onDidReload(() => !subject.isDisposed && subject.onNext(null)));
            cd.add(editor.getBuffer().onDidStopChanging(() => !subject.isDisposed && subject.onNext(null)));
        }));

        // Linter is doing this for us!
        /*this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            cd.add(Omni.whenEditorConnected(editor).subscribe(() => this.doCodeCheck(editor)));
        }));*/

        this.disposable.add(this.observe.diagnostics
            .subscribe(diagnostics => {
                this.diagnostics = diagnostics;
                this.displayDiagnostics = this.filterOnlyWarningsAndErrors(diagnostics);
            }));

        this.disposable.add(this.observe.diagnostics.subscribe(s => {
            this.scrollTop = 0;
            this.selectedIndex = 0;
        }));

        this.disposable.add(dock.addWindow('errors', 'Errors & Warnings', CodeCheckOutputWindow, {
            scrollTop: () => this.scrollTop,
            setScrollTop: (scrollTop) => this.scrollTop = scrollTop,
            codeCheck: this
        }));

        this.disposable.add(Omni.listener.packageRestoreFinished.subscribe(() => this.doFullCodeCheck()));
        this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:code-check', () => this.doFullCodeCheck()));

        this.disposable.add(this._fullCodeCheck
            .concatMap(() => reloadWorkspace.reloadWorkspace()
                .toArray()
                .concatMap(x => Omni.solutions)
                .concatMap(solution => solution.whenConnected()
                    .tapOnNext(() => solution.codecheck({ FileName: null })))
            )
            .subscribe());

        Omni.registerConfiguration(solution => solution
            .whenConnected()
            .delay(1000)
            .subscribe(() => this._fullCodeCheck.onNext(true)));
    }

    public doFullCodeCheck() {
        this._fullCodeCheck.onNext(true);
    }

    private filterOnlyWarningsAndErrors(quickFixes): OmniSharp.Models.DiagnosticLocation[] {
        return _.filter(quickFixes, (quickFix: OmniSharp.Models.DiagnosticLocation) => {
            return quickFix.LogLevel != "Hidden";
        });
    }

    private updateSelectedItem(index: number) {
        if (index < 0)
            index = 0;
        if (index >= this.displayDiagnostics.length)
            index = this.displayDiagnostics.length - 1;
        if (this.selectedIndex !== index)
            this.selectedIndex = index;
    }

    private setup() {
        /**
        * monitor configuration
        */
        var showDiagnosticsForAllSolutions = (() => {
            // Get a subject that will give us the state of the value right away.
            let subject = new ReplaySubject<boolean>(1);
            this.disposable.add(subject.subscribe(x => currentlyEnabled = x));
            subject.onNext(atom.config.get<boolean>("omnisharp-atom.showDiagnosticsForAllSolutions"));

            this.disposable.add(atom.config.onDidChange("omnisharp-atom.showDiagnosticsForAllSolutions", function() {
                let enabled = atom.config.get<boolean>("omnisharp-atom.showDiagnosticsForAllSolutions");
                subject.onNext(enabled);
            }));

            this.disposable.add(subject);
            return <Observable<boolean>>subject;
        })();

        // Cache this result, because the underlying implementation of observe will
        //    create a cache of the last recieved value.  This allows us to pick
        //    up from where we left off.
        var combinationObservable = Omni.aggregateListener.model.codecheck;

        var diagnostics = Observable.combineLatest( // Combine both the active model and the configuration changes together
            Omni.activeModel.startWith(null), showDiagnosticsForAllSolutions,
            (model, enabled) => ({ model, enabled }))
            // If the setting is enabled (and hasn't changed) then we don't need to redo the subscription
            .where(ctx => (!currentlyEnabled && ctx.enabled === currentlyEnabled))
            .flatMapLatest(ctx => {
                var {enabled, model} = ctx;
                currentlyEnabled = enabled;

                if (enabled) {
                    return Omni.aggregateListener.model.codecheck
                        .debounce(200)
                        .map(data => _.flatten<OmniSharp.Models.DiagnosticLocation>(data.map(x => x.value)));
                } else if (model) {
                    return model.observe.codecheck;
                }

                return Observable.just(<OmniSharp.Models.DiagnosticLocation[]>[]);
            })
            .startWith([])
            .share();

        var updated = Observable.ofObjectChanges(this);
        this.observe = { diagnostics, updated };

        this.disposable.add(diagnostics.subscribe(items => this.diagnostics = items));
    }

    public dispose() {
        this.disposable.dispose();
    }

    private _doCodeCheck(editor: Atom.TextEditor) {
        return Omni.request(editor, solution => solution.request('/v2/codecheck', {}));
    };

    public doCodeCheck(editor: Atom.TextEditor) {
        return Omni.request(editor, solution => solution.request('/v2/codecheck', {}));
    }

    public required = true;
    public title = 'Diagnostics';
    public description = 'Support for diagnostic errors.';
}

export var codeCheck = new CodeCheck;
