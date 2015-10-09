import _ = require('lodash');
import {Observable} from 'rx';
import {OmnisharpObservationClientV2, OmnisharpObservationClientV1, OmnisharpCombinationClientV2, OmnisharpClientV1} from "omnisharp-client";
import {Solution} from "./solution";
import {ViewModel} from './view-model';

export class SolutionObserver extends OmnisharpObservationClientV2<Solution> {
    model: typeof ViewModel.prototype.observe;

    constructor(clients: Solution[] = []) {
        super(clients);

        this.model = {
            codecheck: this.makeMergeObserable((client: Solution) => client.model.observe.codecheck),
            output: this.makeMergeObserable((client: Solution) => client.model.observe.output),
            status: this.makeMergeObserable((client: Solution) => client.model.observe.status),
            updates: this.makeMergeObserable((client: Solution) => client.model.observe.updates),
            projectAdded: this.makeMergeObserable((client: Solution) => client.model.observe.projectAdded),
            projectRemoved: this.makeMergeObserable((client: Solution) => client.model.observe.projectRemoved),
            projectChanged: this.makeMergeObserable((client: Solution) => client.model.observe.projectChanged),
            projects: this.makeMergeObserable((client: Solution) => client.model.observe.projects)
        };
    }
}

export class SolutionAggregateObserver extends OmnisharpCombinationClientV2<Solution> { }
