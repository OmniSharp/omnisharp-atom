import {ReactiveObservationClient, ReactiveCombinationClient} from "omnisharp-client";
import {Solution} from "./solution";
import {ViewModel} from "./view-model";

export class SolutionObserver extends ReactiveObservationClient<Solution> {
    public model: typeof ViewModel.prototype.observe;

    constructor(solutions: Solution[] = []) {
        super(solutions);

        this.model = {
            codecheck: this.makeObservable((solution: Solution) => solution.model.observe.codecheck),
            codecheckCounts: this.makeObservable((solution: Solution) => solution.model.observe.codecheckCounts),
            codecheckByFile: this.makeObservable((solution: Solution) => solution.model.observe.codecheckByFile),
            output: this.makeObservable((solution: Solution) => solution.model.observe.output),
            status: this.makeObservable((solution: Solution) => solution.model.observe.status),
            state: this.makeObservable((solution: Solution) => solution.model.observe.state),
            projectAdded: this.makeObservable((solution: Solution) => solution.model.observe.projectAdded),
            projectRemoved: this.makeObservable((solution: Solution) => solution.model.observe.projectRemoved),
            projectChanged: this.makeObservable((solution: Solution) => solution.model.observe.projectChanged),
            projects: this.makeObservable((solution: Solution) => solution.model.observe.projects)
        };
    }
}

export class SolutionAggregateObserver extends ReactiveCombinationClient<Solution> { }
