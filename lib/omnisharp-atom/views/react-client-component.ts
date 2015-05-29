import {CompositeDisposable, Disposable, Scheduler} from "rx";
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni');
import React = require('react');
import ClientVM = require('../../omni-sharp-server/view-model');
import {world} from '../world';

export class ReactClientComponent<P, S> extends React.Component<P, S> {
    protected disposable = new CompositeDisposable();
    protected world: typeof world = world;
    private worldIsChanging: boolean = false;

    constructor(protected options: { trackWorldChanges?: boolean; }, props?: P, context?: any) {
        super(props, context);

        if (this.options.trackWorldChanges) {
            this.disposable.add(this.world.updated.subscribe(() => {
                this.worldIsChanging = true;

                this.setState(<any>{});

                this.worldIsChanging = false;
            }));
        }
    }

    public componentDidMount() {
        this.disposable = new CompositeDisposable();
    }

    public shouldComponentUpdate(nextProps: P, nextState: S): boolean {
        return this.options.trackWorldChanges && this.worldIsChanging || false;
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
    ReactClientComponent.shouldComponentUpdate = ReactClientComponent.prototype.shouldComponentUpdate;
})(ReactClientComponent);
