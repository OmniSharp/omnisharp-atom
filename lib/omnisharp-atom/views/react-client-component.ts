import {CompositeDisposable, Disposable, Scheduler} from "rx";
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni');
import React = require('react');
import {world} from '../world';

export class ReactClientComponent<P, S> extends React.Component<P, S> {
    protected disposable = new CompositeDisposable();

    constructor(props?: P, context?: any) {
        super(props, context);
    }

    public componentWillMount() {
        this.disposable = new CompositeDisposable();
    }

    public componentDidMount() {
        this.disposable = new CompositeDisposable();
    }

    public componentWillUnmount() {
        this.disposable.dispose();
    }
}

// Hack to workaround issue with ts.transpile not working correctly
(function(ReactClientComponent: any) {
    ReactClientComponent.componentWillMount = ReactClientComponent.prototype.componentWillMount;
    ReactClientComponent.componentDidMount = ReactClientComponent.prototype.componentDidMount;
    ReactClientComponent.componentWillUnmount = ReactClientComponent.prototype.componentWillUnmount;
})(ReactClientComponent);
