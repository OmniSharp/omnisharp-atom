var Convert = require('ansi-to-html')
import _ = require('lodash')
import path = require('path')
import {Observable} from "rx";

import Omni = require('../../omni-sharp-server/omni')
import React = require('react');
import {ReactClientComponent} from "./react-client-component";


class CodeCheckOutputPaneWindow extends ReactClientComponent<{}, { errors?: OmniSharp.Models.DiagnosticLocation[] }> {
    public displayName = 'FindPaneWindow';

    constructor(props?: {}, context?: any) {
        super(props, context);
        this.state = { errors: [] };
        this.trackClientChanges;
    }

    public componentDidMount() {
        super.componentDidMount();

        let subscription: Rx.Disposable;
        let currentlyEnabled = false;
        let localCache = {};

        Observable.combineLatest(
            Omni.activeModel.startWith(null),
            Omni.showDiagnosticsForAllSolutions, (model, enabled) => ({ client: model && model.client, enabled }))
            .subscribe(ctx => {
                var {enabled, client} = ctx;

                // If we're currently enabled no point swap out subscriptions.
                if (currentlyEnabled && enabled === currentlyEnabled) {
                    return;
                }

                currentlyEnabled = enabled;
                if (subscription) {
                    this.disposable.remove(subscription);
                    subscription.dispose();
                }

                if (enabled) {
                    subscription = Omni.combination.observe(z => z.observeCodecheck
                        .where(z => z.request.FileName === null)
                        .map(z => z.response.QuickFixes))
                    // TODO: Allow filtering by client, project
                        .map(z => z.map(z => z.value || [])) // value can be null!
                        .debounce(200)
                        .subscribe((data) => {
                            var fixes = _.flatten<OmniSharp.Models.QuickFix>(data);
                            this.setState({
                                errors: _.sortBy(this.filterOnlyWarningsAndErrors(fixes),
                                    (quickFix: OmniSharp.Models.DiagnosticLocation) => {
                                        return quickFix.LogLevel;
                                    })
                            });
                        });
                } else if (client) {
                    subscription = client.observeCodecheck
                        .where(z => z.request.FileName === null)
                        .map(z => z.response)
                        .merge(client.codecheck({}))
                        .map(z => z.QuickFixes)
                    // TODO: Allow filtering by client, project
                        .debounce(200)
                        .startWith(localCache[client.uniqueId] || [])
                        .subscribe((data) => {
                            localCache[client.uniqueId] = data;
                            this.setState({
                                errors: _.sortBy(this.filterOnlyWarningsAndErrors(data),
                                    (quickFix: OmniSharp.Models.DiagnosticLocation) => {
                                        return quickFix.LogLevel;
                                    })
                            });
                        });
                }

                this.disposable.add(subscription);
            });
    }

    private goToLine(location: OmniSharp.Models.DiagnosticLocation) {
        Omni.navigateTo(location);
    }

    private filterOnlyWarningsAndErrors(quickFixes): OmniSharp.Models.DiagnosticLocation[] {
        return _.filter(quickFixes, (quickFix: OmniSharp.Models.DiagnosticLocation) => {
            return quickFix.LogLevel != "Hidden";
        });
    }

    public render() {
        return React.DOM.div({
            style: { "cursor": "pointer" }
        }, ..._.map(this.state.errors, error => {
            var filename = path.basename(error.FileName);
            var dirname = path.dirname(error.FileName);
            var projectTargetFramework = Omni.getFrameworks(error.Projects);

            return React.DOM.div({
                className: `codecheck ${error.LogLevel}`,
                onClick: (e) => this.goToLine(error)
            },
                React.DOM.pre({ className: "text-highlight" }, error.Text),
                React.DOM.pre({ className: "inline-block" }, `${filename}(${error.Line},${error.Column})`),
                React.DOM.pre({ className: "text-subtle inline-block" }, ` ${dirname}  [${projectTargetFramework}]`)
                )
        }));
    }
}

export = function() {
    var element = document.createElement('div');
    element.className = 'codecheck-output-pane';
    React.render(React.createElement(CodeCheckOutputPaneWindow, null), element);
    return element;
}
