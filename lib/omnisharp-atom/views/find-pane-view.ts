import spacePenViews = require('atom-space-pen-views')
var $ = spacePenViews.jQuery;
var Convert = require('ansi-to-html')
import Vue = require('vue')
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')

// Internal: A tool-panel view for find usages/implementations
class FindPaneView extends spacePenViews.View {
    private vm: { usages: any[] };

    public static content() {
        return this.div({
            "class": 'error-output-pane',
            outlet: 'atomSharpFindPane'
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
                                'v-repeat': 'usages',
                                'v-on': 'click: gotoUsage'
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
            data: _.extend(Omni.vm, {
                usages: []
            }),
            methods: {
                gotoUsage: (arg) => {
                    var targetVM;
                    targetVM = arg.targetVM;
                    Omni.navigateTo(targetVM.$data);
                }
            }
        });
        this.vm = <any>viewModel;

        Omni.registerConfiguration(client => {
            client.observeFindusages.subscribe((data) => {
                this.vm.usages = data.response.QuickFixes;
            });

            client.observeFindimplementations.subscribe((data) => {
                if (data.response.QuickFixes.length > 1) {
                    this.vm.usages = data.response.QuickFixes;
                }
            });
        });
    }

    public destroy() {
        this.detach();
    }
}
export = FindPaneView;
