import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {solutionInformation} from "../features/solution-information";

interface ISolutionStatusWindowState {
}

export interface ISolutionStatusWindowProps {
    solutionInformation: typeof solutionInformation;
}

export class SolutionStatusWindow<T extends ISolutionStatusWindowProps> extends ReactClientComponent<T, ISolutionStatusWindowState> {
    public displayName = 'SolutionStatusWindow';

    constructor(props?: T, context?: any) {
        super(props, context);

        //this.model = this.props.codeCheck;
        this.state = {  };
    }

    public componentWillMount() {
        super.componentWillMount();
    }

    public componentDidMount() {
        super.componentDidMount();
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
    }

    public render() {
        return React.DOM.div({

        },
            ...this.props.solutionInformation.solutions.map(solution =>
                React.DOM.div({

                }, solution.path)
            )
        )
    }
}
