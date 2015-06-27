import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import path = require('path');
import $ = require('jquery');
import {ReactClientComponent} from "./react-client-component";
import {runTests} from "../features/run-tests";

interface TestWindowState {
    testResults: string[];
}

interface TestWindowProps {
    runTests: typeof runTests;
}

export class TestResultsWindow<TestWindowProps> extends ReactClientComponent<TestWindowProps, TestWindowState> {
    public displayName = 'TestResultsWindow';

    private model: typeof runTests;

    constructor(props?: TestWindowProps, context?: any) {
        super(props, context);
        debugger;
        this.model = this.props.runTests
        //this.state = { usages: this.model.usages, selectedIndex: this.model.selectedIndex };
    }

    public componentWillMount() {
        super.componentWillMount();

        this.disposable.add(this.model.observe
            .updated
            .subscribe(z => this.setState({
                testResults: this.model.testResults
            })));
    }

    public componentDidMount() {
        super.componentWillMount();
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
    }

    public render() {
        debugger;
        return React.DOM.div({
            className: 'test-results-pane',
            tabIndex: -1,
        });
    }
}
