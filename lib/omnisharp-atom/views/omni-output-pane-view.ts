import {Disposable} from "rx";
var Convert = require('ansi-to-html');
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {world} from '../world';

interface IOutputWindowState {
    output: OmniSharp.OutputMessage[];
}

class OutputWindow extends ReactClientComponent<{}, IOutputWindowState>  {
    public displayName = "OutputWindow";

    private _convert;

    constructor(props?: {}, context?: any) {
        super(props, context);
        this._convert = new Convert();
        this.state = { output: [] };
    }

    public componentDidMount() {
        super.componentDidMount();

        this.disposable.add(world.observe.output
            .subscribe(z => this.setState({ output: z }, () => this.scrollToBottom())));
    }

    private scrollToBottom() {
        var item = <any> React.findDOMNode(this).lastElementChild;
        if (item) item.scrollIntoViewIfNeeded();
    }

    private createItem(item: OmniSharp.OutputMessage) {
        return React.DOM.pre({
            className: item.logLevel
        }, this._convert.toHtml(item.message).trim());
    }

    public render() {
        return React.DOM.div({
            className: 'messages-container'
        }, _.map(this.state.output, item => this.createItem(item)));
    }
}

export = function() {
    var element = document.createElement('div');
    element.className = 'omni-output-pane-view native-key-bindings';
    element.tabIndex = -1;
    React.render(React.createElement(OutputWindow, null), element);
    return element;
}
