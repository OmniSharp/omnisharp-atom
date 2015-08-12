import {Disposable} from "rx";
var Convert = require('ansi-to-html');
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {server} from '../features/server-information';

interface IOutputWindowState {
    output: OmniSharp.OutputMessage[];
}

export class OutputWindow<T> extends ReactClientComponent<T, IOutputWindowState>  {
    public displayName = "OutputWindow";

    private _convert;

    constructor(props?: T, context?: any) {
        super(props, context);
        this._convert = new Convert();
        this.state = { output: [] };
    }

    public componentDidMount() {
        super.componentDidMount();

        this.disposable.add(server.observe.output
            .subscribe(z => this.setState({ output: z }, () => this.scrollToBottom())));
        _.defer(_.bind(this.scrollToBottom, this));
    }

    private scrollToBottom() {
        var item = <any> React.findDOMNode(this).lastElementChild.lastElementChild;
        if (item) item.scrollIntoViewIfNeeded();
    }

    private createItem(item: OmniSharp.OutputMessage, index: number) {
        return React.DOM.pre({
            key: `output-${index}`,
            className: item.logLevel,
            dangerouslySetInnerHTML: { __html: this._convert.toHtml(item.message).trim() }
        });
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
