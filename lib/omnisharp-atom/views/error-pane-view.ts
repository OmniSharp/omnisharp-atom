var spacePenViews = require('atom-space-pen-views')
var View = <any>spacePenViews.View;
var Convert = require('ansi-to-html')
import Vue = require('vue')
import _ = require('lodash')
import OmniSharpServer = require('../../omni-sharp-server/omni-sharp-server')

// Internal: A tool-panel view for the test result output.
class ErrorPaneView extends View {
    public vm: { errors: any[] };

    public static content() {
        return this.div({
            "class": 'error-output-pane',
            outlet: 'atomSharpErrorPane'
        }, () => {
                this.ul({
                    "class": 'background-message centered',
                    'v-class': 'hide: isLoadingOrReady'
                }, () => {
                        return this.li(() => {
                            this.span('Omnisharp server is turned off');
                            return this.kbd({
                                "class": 'key-binding text-highlight'
                            }, '⌃⌥O');
                        });
                    });
                this.ul({
                    "class": 'background-message centered',
                    'v-class': 'hide: isNotLoading'
                }, () => {
                        return this.li(() => {
                            return this.progress({
                                "class": 'inline-block'
                            });
                        });
                    });
                return this.table({
                    "class": 'error-table',
                    'v-class': 'hide: isNotReady'
                }, () => {
                        this.thead(() => {
                            this.th('line');
                            this.th('column');
                            this.th('message');
                            return this.th('filename');
                        });
                        return this.tbody(() => {
                            var data;
                            return this.tr({
                                'v-repeat': 'errors',
                                'v-on': 'click: gotoError',
                                'class': '{{LogLevel}}'
                            }, data = '{{$index}}', () => {
                                    this.td('{{Line}}');
                                    this.td('{{Column}}');
                                    this.td('{{Text}}');
                                    return this.td('{{FileName}}');
                                });
                        });
                    });
            });
    }

    public initialize() {
        var viewModel = new Vue({
            el: this[0],
            data: _.extend(OmniSharpServer.vm, {
                errors: []
            }),
            methods: {
                // TODO: gotoError: ({targetVM}}) => {
                gotoError: (arg) => {
                    var targetVM = arg.targetVM;
                    return atom.emit("omni:navigate-to", targetVM.$data);
                }
            }
        });
        this.vm = <any>viewModel;

        atom.on("omni:quick-fixes", data => this.displayQuickFixes(data.QuickFixes));

        return atom.on('omnisharp-atom:clear-syntax-errors', filePath => this.removeErrorsFor(filePath));
    }

    public removeErrorsFor = (filePath) => {
        var existingErrorsCount = this.vm.errors.length;
        var results = [];
        while (existingErrorsCount--) {
            if (this.vm.errors[existingErrorsCount].FileName === filePath) {
                results.push(this.vm.errors.splice(existingErrorsCount, 1));
            } else {
                results.push(void 0);
            }
        }
        return results;
    }

    public displayQuickFixes = (quickFixes) => {
        if (quickFixes.length === 0) {
            this.vm.errors = [];
            return;

            var item = quickFixes[0];
            if (item != null) {
                this.removeErrorsFor(item.FileName);
            }
            return _.map(quickFixes, quickFix => this.vm.errors.unshift(quickFix));
        }
    }

    public destroy() {
        this.detach();
    }
}
export = ErrorPaneView
