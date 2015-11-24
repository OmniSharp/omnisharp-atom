/* tslint:disable:no-string-literal */
import {Observable} from "rx";
const _ : _.LoDashStatic = require("lodash");
import * as React from "react";
import {ReactClientComponent} from "./react-client-component";

interface ICommandOutputWindowState {
    output: { message: string }[];
}

export class CommandOutputWindow extends ReactClientComponent<{ update: Observable<{ message: string }[]>; output: { message: string }[] }, ICommandOutputWindowState>  {
    public displayName = "CommandOutputWindow";

    constructor(props?: { update: Observable<{ id: number; message: string }[]>; output: { message: string }[] }, context?: any) {
        super(props, context);
        this.state = { output: props.output };
        this.disposable.add(this.props.update.subscribe(output =>
            this.setState({ output }, () => this.scrollToBottom())));
        _.defer(_.bind(this.scrollToBottom, this));
    }

    private scrollToBottom() {
        const item = <any> React.findDOMNode(this).lastElementChild.lastElementChild;
        if (item) item.scrollIntoViewIfNeeded();
    }

    private createItem(item: { message: string }, index: number) {
        return React.DOM.pre({
            key: `output-${index}`
        }, item.message.trim());
    }

    public render() {
        return React.DOM.div({
            className: "omni-output-pane-view native-key-bindings " + (this.props["className"] || ""),
            tabIndex: -1
        },
            React.DOM.div({
                className: "messages-container"
            }, _.map(this.state.output, (item, index) => this.createItem(item, index))));
    }
}
