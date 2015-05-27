import {CompositeDisposable, Disposable, Scheduler} from "rx";
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni');
import Client = require('../../omni-sharp-server/client');
import React = require('react');

export class ReactClientComponent<P, S> extends React.Component<P, S> {
    protected disposable = new CompositeDisposable();
    protected client: Client;
    private _clientChangeSubscription: Disposable = null;
    private trackClientChanges: boolean;

    constructor({trackClientChanges}: { trackClientChanges: boolean }, props?: P, context?: any) {
        super(props, context);
        this.trackClientChanges = trackClientChanges;
    }

    public componentDidMount() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Omni.activeClient.subscribe(client => {
            if (client && client !== this.client) {
                this.changeActiveClient(client);
            }
        }));
    }

    public changeActiveClient(client: Client) {
        this.client = client;
        if (this.trackClientChanges) {
            this.setState(<any>{});
            if (this._clientChangeSubscription) this._clientChangeSubscription.dispose();
            this._clientChangeSubscription = client.state.delaySubscription(0, Scheduler.timeout).subscribe(z => this.setState(<any>{}));
        }
    }

    public componentWillUnmount() {
        this.disposable.dispose();
    }
}
