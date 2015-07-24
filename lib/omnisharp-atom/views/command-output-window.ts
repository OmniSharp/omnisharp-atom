import {Disposable, Observable} from "rx";
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {world} from '../world';


interface ICommandOutputWindowState {
    output: { message: string }[];
}

export class CommandOutputWindow extends ReactClientComponent<{ update: Observable<{ message: string }[]>; output: { message: string }[] }, ICommandOutputWindowState>  {
    public displayName = "CommandOutputWindow";

    private _convert;

    constructor(props?: { update: Observable<{ id: number; message: string }[]>; output: { message: string }[] }, context?: any) {
        super(props, context);
        this.state = { output: props.output };
        this.disposable.add(this.props.update.subscribe(output =>
            this.setState({ output }, () => this.scrollToBottom())));
        _.defer(_.bind(this.scrollToBottom, this));
    }

    private scrollToBottom() {
        var item = <any> React.findDOMNode(this).lastElementChild.lastElementChild;
        if (item) item.scrollIntoViewIfNeeded();
    }

    private createItem(item: { message: string }, index: number) {
        return React.DOM.pre({
            key: `output-${index}`
        }, item.message.trim());
    }

    public render() {
        return React.DOM.div({
            className: 'omni-output-pane-view native-key-bindings ' + (this.props['className'] || ''),
            tabIndex: -1
        },
            React.DOM.div({
                className: 'messages-container'
            }, _.map(this.state.output, (item, index) => this.createItem(item, index))));
    }
}
