var Convert = require('ansi-to-html')
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni');
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {world} from '../world';

interface IBuildOutputWindowState {
    output: OmniSharp.OutputMessage[];
}

export class BuildOutputWindow<T> extends ReactClientComponent<T, IBuildOutputWindowState> {
    public displayName = "BuildOutputWindow";

    private _convert;

    constructor(props?: T, context?: any) {
        super(props, context);
        this._convert = new Convert();
        this.state = { output: [] };

        /*
        Old events... may be useful when we reimplement


        public processMessage(data) {
            var linkPattern = /(.*)\((\d*),(\d*)\)/g;
            var navMatches = linkPattern.exec(data);
            var isLink = false;
            var nav : any = false;
            if ((navMatches != null ? navMatches.length : void 0) === 4) {
                isLink = true;
                nav = {
                    FileName: navMatches[1],
                    Line: navMatches[2],
                    Column: navMatches[3]
                };
            }
            var logMessage = {
                message: data,
                isLink: isLink,
                nav: JSON.stringify(nav),
                isError: isLink
            };
            if (this.vm.output.length >= 1000) {
                this.vm.output.$remove(0);
            }
            this.vm.output.push(logMessage);
        }

        atom.emitter.on("omnisharp-atom:build-message", data => {
            var buildMessages = data.split('\n');
            _.map(buildMessages, message => this.processMessage(message));
        });

        atom.emitter.on("omnisharp-atom:build-err", data => {
            if (this.vm.output.length >= 1000) {
                this.vm.output.$remove(0);
            }
            this.vm.output.push({
                message: data,
                isError: true
            });
        });

        atom.emitter.on("omnisharp-atom:building", command => {
            this.vm.output = <OmniSharp.VueArray<any>>[];
            this.vm.output.push({
                message: 'OmniSharp Atom building...'
            });
            this.vm.output.push({
                message: "\t" + command
            });
        });

        atom.emitter.on("omnisharp-atom:build-exitcode", exitCode => {
            if (exitCode === 0) {
                this.vm.output.push({
                    message: 'Build succeeded!'
                });
            } else {
                this.vm.output.push({
                    message: 'Build failed!',
                    isError: true
                });
            }
        });
        */
    }

    public componentDidMount() {
        super.componentDidMount();
        this.disposable.add(world.observe.output
            .subscribe(z => this.setState({ output: z }, () => this.scrollToBottom())));
        this.scrollToBottom();
    }

    private scrollToBottom() {
        var item = <any> React.findDOMNode(this).lastElementChild.lastElementChild;
        if (item) item.scrollIntoViewIfNeeded();
    }

    private createItem(item: OmniSharp.OutputMessage) {
        return React.DOM.pre({
            className: item.logLevel,
            //onClick: (e) => this.navigate(item.nav)
        }, this._convert.toHtml(item.message).trim());
    }

    /*private navigate(item: OmniSharp.OutputMessage) {
        Omni.navigateTo(nav);
    }*/

    public render() {
        return React.DOM.div({
            className: 'build-output-pane-view native-key-bindings ' + (this.props['className'] || ''),
            tabIndex: -1
        },
            React.DOM.div({
                className: 'messages-container'
            }, _.map(this.state.output, item => this.createItem(item))));
    }
}
