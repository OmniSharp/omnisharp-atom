import {Disposable} from "rx";
var Convert = require('ansi-to-html');
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import {ReactClientComponent} from "./react-client-component";

class OutputWindow extends ReactClientComponent<{}, { output?: OmniSharp.OutputMessage[] }> {
    public displayName = "OutputWindow";

    private _convert;
    private _currentSubscription: Disposable;

    constructor(props?: {}, context?: any) {
        super(props, context);
        this._convert = new Convert();
        this.state = { output: [] };
    }

    private scrollToBottom() {
        var item = <any> React.findDOMNode(this).lastElementChild;
        if (item) item.scrollIntoViewIfNeeded();
    }

    public changeActiveClient(model: ClientVM) {
        this._currentSubscription && this._currentSubscription.dispose();

        this._currentSubscription = model.client.events
            .throttle(100)
            .subscribe(z => {
                this.setState({}, () => this.scrollToBottom());
            });

        this.setState({
            output: model.output
        }, () => this.scrollToBottom());
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
