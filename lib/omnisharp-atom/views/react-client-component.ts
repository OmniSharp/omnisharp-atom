import {CompositeDisposable, Disposable, Scheduler} from "rx";
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni');
import React = require('react');
import ClientVM = require('../../omni-sharp-server/view-model');

export class ReactClientComponent<P, S> extends React.Component<P, S> {
    protected disposable = new CompositeDisposable();
    protected model: ClientVM;
    private _clientChangeSubscription: Disposable = null;
    protected trackClientChanges: boolean;

    constructor(props?: P, context?: any) {
        super(props, context);
    }

    public componentDidMount() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Omni.activeModel.debounce(10).subscribe(client => {
            if (client && client !== this.model) {
                this.changeActiveClient(client);
            }
        }));
    }

    public changeActiveClient(model: ClientVM) {
        this.model = model;
        if (this.trackClientChanges) {
            this.setState(<any>{});
            if (this._clientChangeSubscription) this._clientChangeSubscription.dispose();
            this._clientChangeSubscription = model.client.state.debounce(10).subscribe(z => this.setState(<any>{}));
        }
    }

    public componentWillUnmount() {
        this.disposable.dispose();
    }
}

// Hack to workaround issue with ts.transpile not working correctly
(function(ReactClientComponent: any) {
    ReactClientComponent.componentDidMount = ReactClientComponent.prototype.componentDidMount;
    ReactClientComponent.changeActiveClient = ReactClientComponent.prototype.changeActiveClient;
    ReactClientComponent.componentWillUnmount = ReactClientComponent.prototype.componentWillUnmount;
})(ReactClientComponent);
