import {CompositeDisposable} from "rx";
import React = require('react');

export class ReactClientComponent<P, S> extends React.Component<P, S> {
    protected disposable = new CompositeDisposable();

    constructor(props?: P, context?: any) {
        super(props, context);
    }

    public componentWillMount() {
        this.disposable = new CompositeDisposable();
    }

    public componentDidMount() { }

    public componentWillUnmount() {
        this.disposable.dispose();
    }
}
