import _ = require('lodash');
import {Observable} from 'rx';
import {OmnisharpObservationClientV2, OmnisharpObservationClientV1, OmnisharpCombinationClientV2, OmnisharpClientV1} from "omnisharp-client";
import Client = require("./client");
import {ViewModel} from './view-model';

export class ObservationClient extends OmnisharpObservationClientV2<Client> {
    model: typeof ViewModel.prototype.observe;
    v1: OmnisharpObservationClientV1<OmnisharpClientV1>;

    constructor(clients: Client[] = []) {
        this.v1 = new OmnisharpObservationClientV1(clients.map(z => z.v1));
        super(clients);

        this.model = {
            codecheck: this.makeMergeObserable((client: Client) => client.model.observe.codecheck),
            output: this.makeMergeObserable((client: Client) => client.model.observe.output),
            status: this.makeMergeObserable((client: Client) => client.model.observe.status),
            updates: this.makeMergeObserable((client: Client) => client.model.observe.updates),
            projectAdded: this.makeMergeObserable((client: Client) => client.model.observe.projectAdded),
            projectRemoved: this.makeMergeObserable((client: Client) => client.model.observe.projectRemoved),
            projectChanged: this.makeMergeObserable((client: Client) => client.model.observe.projectChanged),
            projects: this.makeMergeObserable((client: Client) => client.model.observe.projects)
        };
    }

    public add(client: Client) {
        super.add(client);
        this.v1.add(client.v1);
    }

    public remove(client: Client) {
        super.remove(client);
        this.v1.remove(client.v1);
    }

    public removeAll() {
        super.removeAll();
        this.v1.removeAll();
    }
}

// Hack to workaround issue with ts.transpile not working correctly
(function(Client: any) {
    Client.add = Client.prototype.add;
    Client.remove = Client.prototype.remove;
    Client.removeAll = Client.prototype.removeAll;
})(ObservationClient);

export class CombinationClient extends OmnisharpCombinationClientV2<Client> { }
