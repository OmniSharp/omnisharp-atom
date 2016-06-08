import {ReactiveObservationClient, ReactiveCombinationClient} from "omnisharp-client";
import {Solution} from "./solution";
import {ViewModel} from "./view-model";

export class SolutionObserver extends ReactiveObservationClient<Solution> {
    public model: typeof ViewModel.prototype.observe;

    constructor(solutions: Solution[] = []) {
        super(solutions);

        this.model = {
            diagnostics: this.makeObservable((solution: Solution) => solution.model.observe.diagnostics),
            diagnosticsCounts: this.makeObservable((solution: Solution) => solution.model.observe.diagnosticsCounts),
            diagnosticsByFile: this.makeObservable((solution: Solution) => solution.model.observe.diagnosticsByFile),
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
