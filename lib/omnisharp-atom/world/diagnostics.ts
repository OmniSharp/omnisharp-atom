import {Observable, ReplaySubject} from "rx";
import Omni = require("../../omni-sharp-server/omni");

var currentlyEnabled = false;

/**
* monitor config
*/
var showDiagnosticsForAllSolutions = (function() {
    let subject = new ReplaySubject<boolean>(1);
    subject.subscribe(x => currentlyEnabled = x);
    subject.onNext(atom.config.get<boolean>("omnisharp-atom.showDiagnosticsForAllSolutions"));

    atom.config.onDidChange("omnisharp-atom.showDiagnosticsForAllSolutions", function() {
        let enabled = atom.config.get<boolean>("omnisharp-atom.showDiagnosticsForAllSolutions");
        subject.onNext(enabled);
    });

    return <Observable<boolean>>subject;
})();

var observable = Observable.combineLatest(
    Omni.activeModel.startWith(null),
    showDiagnosticsForAllSolutions,
    (model, enabled) => ({ model: model, enabled }))
    .where(ctx => (!currentlyEnabled && ctx.enabled === currentlyEnabled))
    .flatMapLatest(ctx => {
        var {enabled, model} = ctx;
        currentlyEnabled = enabled;

        if (enabled) {
            return Omni.combination.observe(z => z.observeCodecheck
                .where(z => z.request.FileName === null)
                .map(z => <OmniSharp.Models.DiagnosticLocation[]>z.response.QuickFixes))
            // TODO: Allow filtering by client, project
                .map(z => z.map(z => z.value || [])) // value can be null!
                .debounce(200)
                .map(data => _.flatten<OmniSharp.Models.DiagnosticLocation>(data))
        } else if (model.client) {
            return model.codecheck;
        }
    })
    .share();

export var diagnostics = observable;
