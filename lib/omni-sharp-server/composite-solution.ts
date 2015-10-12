import _ = require('lodash');
import {Observable} from 'rx';
import {ObservationClientV2, AggregateClientV2} from "omnisharp-client";
import {Solution} from "./solution";
import {ViewModel} from './view-model';

export class SolutionObserver extends ObservationClientV2<Solution> {
    model: typeof ViewModel.prototype.observe;

    constructor(solutions: Solution[] = []) {
        super(solutions);

        this.model = {
            diagnostics: this.makeMergeObserable((solution) => solution.model.observe.diagnostics),
            output: this.makeMergeObserable((solution) => solution.model.observe.output),
            status: this.makeMergeObserable((solution) => solution.model.observe.status),
            state: this.makeMergeObserable((solution) => solution.model.observe.state),
            projectAdded: this.makeMergeObserable((solution) => solution.model.observe.projectAdded),
            projectRemoved: this.makeMergeObserable((solution) => solution.model.observe.projectRemoved),
            projectChanged: this.makeMergeObserable((solution) => solution.model.observe.projectChanged),
            projects: this.makeMergeObserable((solution) => solution.model.observe.projects)
        };
    }
}

export class SolutionAggregateObserver extends AggregateClientV2<Solution> {
    model: { diagnostics: Observable<{ key: string; value: OmniSharp.Models.DiagnosticLocation[]; }[]> };

    constructor(solutions: Solution[] = []) {
        super(solutions);

        this.model = {
            diagnostics: this.makeAggregateObserable((solution) => solution.model.observe.diagnostics)
        };
    }
}
