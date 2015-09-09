import _ = require('lodash');
import {CompositeDisposable, Observable, ReplaySubject, Subject, Disposable} from "rx";
import Omni = require('../../omni-sharp-server/omni');
var currentlyEnabled = false;
import {dock} from "../atom/dock";
import {CodeCheckOutputWindow, ICodeCheckOutputWindowProps} from '../views/codecheck-output-pane-view';
import {DriverState} from "omnisharp-client";

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
    private _editorSubjects = new WeakMap<Atom.TextEditor, () => Rx.Observable<OmniSharp.Models.DiagnosticLocation[]>>();

    public activate() {
        this.disposable = new CompositeDisposable();
        this.setup();

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
                .map(response => response.QuickFixes || [])
                .share();

            this._editorSubjects.set(editor, () => {
                var result = o.take(1);
                subject.onNext(null);
                return result;
            });

            cd.add(o.subscribe());

            cd.add(editor.getBuffer().onDidSave(() => !subject.isDisposed && subject.onNext(null)));
            cd.add(editor.getBuffer().onDidReload(() => !subject.isDisposed && subject.onNext(null)));
            cd.add(editor.getBuffer().onDidStopChanging(() => !subject.isDisposed && subject.onNext(null)));
            cd.add(Disposable.create(() => this._editorSubjects.delete(editor)));
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

        Omni.registerConfiguration(client => client
            .whenConnected()
            .delay(2000)
            .subscribe(() => client.codecheck({ FileName: null })));

        this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:code-check', () => {
            Omni.clients.subscribe(client => {
                client.whenConnected()
                    .subscribe(() => client.codecheck({ FileName: null }));
            });
        }));
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
        //    create a cache of the last recieved value.  This allows us to pick pick
        //    up from where we left off.
        var combinationObservable = Omni.combination.observe(z => z.observeCodecheck
            .where(z => !z.request.FileName) // Only select file names
            .map(z => <OmniSharp.Models.DiagnosticLocation[]>z.response.QuickFixes));

        var diagnostics = Observable.combineLatest( // Combine both the active model and the configuration changes together
            Omni.activeModel.startWith(null), showDiagnosticsForAllSolutions,
            (model, enabled) => ({ model, enabled }))
        // If the setting is enabled (and hasn't changed) then we don't need to redo the subscription
            .where(ctx => (!currentlyEnabled && ctx.enabled === currentlyEnabled))
            .flatMapLatest(ctx => {
                var {enabled, model} = ctx;
                currentlyEnabled = enabled;

                if (enabled) {
                    return combinationObservable
                        .map(z => z.map(z => z.value || [])) // value can be null!
                        .debounce(200)
                        .map(data => _.flatten<OmniSharp.Models.DiagnosticLocation>(data));
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
        return Omni.request(editor, client => client.codecheck({}));
    };

    public doCodeCheck(editor: Atom.TextEditor) {
        if (!this._editorSubjects.has(editor)) return Observable.just<OmniSharp.Models.DiagnosticLocation[]>([]);
        var callback = this._editorSubjects.get(editor);
        return callback();
    }

    public required = true;
    public title = 'Diagnostics';
    public description = 'Support for diagnostic errors.';
}

export var codeCheck = new CodeCheck;
