import {ObservationClientV2, AggregateClientV2} from "omnisharp-client";
import {Solution} from "./solution";
import {ViewModel} from "./view-model";

export class SolutionObserver extends ObservationClientV2<Solution> {
    public model: typeof ViewModel.prototype.observe;

    constructor(solutions: Solution[] = []) {
        super(solutions);

        this.model = {
            codecheck: this.makeMergeObserable((solution: Solution) => solution.model.observe.codecheck),
            output: this.makeMergeObserable((solution: Solution) => solution.model.observe.output),
            status: this.makeMergeObserable((solution: Solution) => solution.model.observe.status),
            state: this.makeMergeObserable((solution: Solution) => solution.model.observe.state),
            projectAdded: this.makeMergeObserable((solution: Solution) => solution.model.observe.projectAdded),
            projectRemoved: this.makeMergeObserable((solution: Solution) => solution.model.observe.projectRemoved),
            projectChanged: this.makeMergeObserable((solution: Solution) => solution.model.observe.projectChanged),
            projects: this.makeMergeObserable((solution: Solution) => solution.model.observe.projects)
        };
    }
}

export class SolutionAggregateObserver extends AggregateClientV2<Solution> { }
