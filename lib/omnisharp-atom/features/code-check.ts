import _ = require('lodash');
import {CompositeDisposable, Observable, ReplaySubject} from "rx";
import Omni = require('../../omni-sharp-server/omni');
var currentlyEnabled = false;
import {dock} from "../atom/dock";
import {CodeCheckOutputWindow, ICodeCheckOutputWindowProps} from '../views/codecheck-output-pane-view';

class CodeCheck implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    public observe: {
        diagnostics: Observable<OmniSharp.Models.DiagnosticLocation[]>;
        updated: Observable<Rx.ObjectObserveChange<CodeCheck>>;
    }

    private diagnostics: OmniSharp.Models.DiagnosticLocation[] = [];
    public displayDiagnostics: OmniSharp.Models.DiagnosticLocation[] = [];
    public selectedIndex: number = 0;
    private scrollTop: number = 0;

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

        this.disposable.add(Omni.editors.subscribe((editor: Atom.TextEditor) => {
            var disposer = new CompositeDisposable();

            //disposer.add(editor.getBuffer().onDidStopChanging(() => this.doCodeCheck(editor)));
            disposer.add(editor.getBuffer().onDidSave(() => this.doCodeCheck(editor)));
            //disposer.add(editor.getBuffer().onDidDelete(() => this.doCodeCheck(editor)));
            disposer.add(editor.getBuffer().onDidReload(() => this.doCodeCheck(editor)));
            disposer.add(editor.getBuffer().onDidDestroy(() => {
                this.disposable.remove(disposer);
                disposer.dispose();
            }));
        }));

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

        Omni.registerConfiguration(client => client.codecheck({}));
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
        var showDiagnosticsForAllSolutions = (function() {
            // Get a subject that will give us the state of the value right away.
            let subject = new ReplaySubject<boolean>(1);
            subject.subscribe(x => currentlyEnabled = x);
            subject.onNext(atom.config.get<boolean>("omnisharp-atom.showDiagnosticsForAllSolutions"));

            atom.config.onDidChange("omnisharp-atom.showDiagnosticsForAllSolutions", function() {
                let enabled = atom.config.get<boolean>("omnisharp-atom.showDiagnosticsForAllSolutions");
                subject.onNext(enabled);
            });

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

    public doCodeCheck = _.debounce((editor: Atom.TextEditor) => {
        Omni.request(editor, client => {
            var request = <OmniSharp.Models.FormatRangeRequest>client.makeRequest(editor);
            return client.updatebufferPromise(request)
                .then(() => {
                    request.FileName = null;
                    Omni.request(editor, client => client.codecheck(request));
                });
        });
    }, 500);
}

export var codeCheck = new CodeCheck;
