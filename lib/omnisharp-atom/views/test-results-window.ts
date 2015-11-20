/* tslint:disable:no-string-literal */
/* tslint:disable:variable-name */
const Convert = require("ansi-to-html");
/* tslint:enable:variable-name */
import {Observable} from "rx";
import * as React from "react";
import * as _ from "lodash";
import {ReactClientComponent} from "./react-client-component";
import {runTests} from "../features/run-tests";

// ctrl-r. ctrl-t run test
// ctrl-r, ctrl-f run fixture
// ctrl-r, ctrl-a run all
// ctrl-r, ctrl-l run last

interface TestWindowState {
    testResults: OutputMessage[];
}

interface TestWindowProps {
    runTests: typeof runTests;
}

export class TestResultsWindow extends ReactClientComponent<TestWindowProps, TestWindowState> {
    public displayName = "TestResultsWindow";

    private _convert: any;

    constructor(props?: TestWindowProps, context?: any) {
        super(props, context);
        this._convert = new Convert();
        this.state = { testResults: props.runTests.testResults };
    }

    public componentWillMount() {
        super.componentWillMount();

        this.disposable.add(this.props.runTests.observe.output
            .buffer(this.props.runTests.observe.output.throttle(100), () => Observable.timer(100))
            .map(arr => arr[0])
            .subscribe(testResults => this.setState({ testResults })));
        _.defer(_.bind(this.scrollToBottom, this));
    }

    public componentDidMount() {
        super.componentWillMount();
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
    }

    private createItem(item: OutputMessage, index: number) {
        return React.DOM.pre({
            key: `output-${index}`,
            className: item.logLevel
        }, this._convert.toHtml(item.message).trim());
    }

    private scrollToBottom() {
        const item = <any> React.findDOMNode(this).lastElementChild.lastElementChild;
        if (item) item.scrollIntoViewIfNeeded();
    }

    public render() {
        return React.DOM.div({
            className: "omni-output-pane-view native-key-bindings " + (this.props["className"] || ""),
            tabIndex: -1
        },
            React.DOM.div({
                className: "messages-container"
            }, _.map(this.state.testResults, (item, index) => this.createItem(item, index))));
    }
}
