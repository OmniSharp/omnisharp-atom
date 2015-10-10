import _ = require('lodash');
import {Observable} from 'rx';
import {OmnisharpObservationClientV2, OmnisharpObservationClientV1, OmnisharpCombinationClientV2, OmnisharpClientV1} from "omnisharp-client";
import {Solution} from "./solution";
import {ViewModel} from './view-model';

export class SolutionObserver extends OmnisharpObservationClientV2<Solution> {
    model: typeof ViewModel.prototype.observe;

    constructor(solutions: Solution[] = []) {
        super(solutions);

        this.model = {
            diagnostics: this.makeMergeObserable((solution: Solution) => solution.model.observe.diagnostics),
            output: this.makeMergeObserable((solution: Solution) => solution.model.observe.output),
            status: this.makeMergeObserable((solution: Solution) => solution.model.observe.status),
            updates: this.makeMergeObserable((solution: Solution) => solution.model.observe.updates),
            projectAdded: this.makeMergeObserable((solution: Solution) => solution.model.observe.projectAdded),
            projectRemoved: this.makeMergeObserable((solution: Solution) => solution.model.observe.projectRemoved),
            projectChanged: this.makeMergeObserable((solution: Solution) => solution.model.observe.projectChanged),
            projects: this.makeMergeObserable((solution: Solution) => solution.model.observe.projects)
        };
    }
}

export class SolutionAggregateObserver extends OmnisharpCombinationClientV2<Solution> {
    model: { diagnostics: Observable<{ key: string; value: OmniSharp.Models.DiagnosticLocation[]; }[]> };

    constructor(solutions: Solution[] = []) {
        super(solutions);

        this.model = {
            diagnostics: this.makeCombineObserable((solution: Solution) => solution.model.observe.diagnostics)
        };
    }
}
