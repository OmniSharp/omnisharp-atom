import _ = require('lodash');
import {CompositeDisposable, Observable, ReplaySubject} from "rx";
import Omni = require('../../omni-sharp-server/omni');
var currentlyEnabled = false;

class CodeCheck implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    public observe: {
        diagnostics: Observable<OmniSharp.Models.DiagnosticLocation[]>;
    }

    public diagnostics: OmniSharp.Models.DiagnosticLocation[] = [];

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.addCommand('omnisharp-atom:next-diagnostic', () => {

        }));

        this.disposable.add(Omni.addCommand('omnisharp-atom:previous-diagnostic', () => {

        }));

        this.disposable.add(Omni.editors.subscribe((editor: Atom.TextEditor) => {
            var disposer = new CompositeDisposable();

            disposer.add(editor.getBuffer().onDidStopChanging(() => this.doCodeCheck(editor)));
            disposer.add(editor.getBuffer().onDidSave(() => this.doCodeCheck(editor)));
            disposer.add(editor.getBuffer().onDidDelete(() => this.doCodeCheck(editor)));
            disposer.add(editor.getBuffer().onDidReload(() => this.doCodeCheck(editor)));
            disposer.add(editor.getBuffer().onDidDestroy(() => {
                this.disposable.remove(disposer);
                disposer.dispose();
            }));
        }));

        this.disposable.add(Omni.activeEditor.subscribe(editor => {
            if (editor) {
                this.doCodeCheck(editor);
            }
        }));

        Omni.registerConfiguration(client => client.codecheck({}));
        this.setup();
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

        this.observe = { diagnostics };

        this.disposable.add( diagnostics.subscribe(items => this.diagnostics = items));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public doCodeCheck(editor: Atom.TextEditor) {
        _.debounce(() => {
            Omni.request(editor, client => {
                var request = <OmniSharp.Models.FormatRangeRequest>client.makeRequest(editor);
                return client.updatebufferPromise(request)
                    .then(() => {
                        request.FileName = null;
                        Omni.request(editor, client => client.codecheck(request));
                    });
            });
        }, 500)();
    }
}

export var codeCheck = new CodeCheck;
