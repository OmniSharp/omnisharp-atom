import spacePenViews = require('atom-space-pen-views')
var $ = spacePenViews.jQuery;
var Convert = require('ansi-to-html')
import Vue = require('vue')
import _ = require('lodash')
import path = require('path')
import Omni = require('../../omni-sharp-server/omni')

class CodeCheckOutputPaneView extends spacePenViews.View {
    private vm: {errors: any[] }

    public static content() {
        return this.div({
            "class": 'codecheck-output-pane',
            outlet: "codecheckOutputPane"
        }, () => {
            return this.div({
                "v-repeat": "errors",
                "v-on": "click: goToLine",
                outlet: "position",
                style: "cursor: pointer"
            }, () => {
                return this.div({
                    'class': 'codecheck {{LogLevel}}'
                }, () => {
                    this.pre({"class": "text-highlight"}, "{{Text}}");
                    this.pre({"class": "inline-block"}, "{{FileName | filename}}({{Line}},{{Column}})");
                    return this.pre({"class": "text-subtle inline-block"}, " {{FileName | dirname}}  [{{Projects | projectTargetFramework}}]");
                });
            });
        });
    }

    public initialize() {
        var viewModel = new Vue({
            el: this[0],
            data: _.extend(Omni.vm, { errors : [] }),
            methods: {
                goToLine: (args) => {
                    var targetVM;
                    targetVM = args.targetVM;
                    Omni.navigateTo(targetVM.$data);
                }
            }
        });
        Vue.filter("filename", (value: string) => {
            return path.basename(value);
        });
        Vue.filter('dirname', (value: string) => {
            return path.dirname(value);
        });
        Vue.filter('projectTargetFramework', (projects: string[]) => {
            return Omni.getFrameworks(projects);
        });

        this.vm = <any>viewModel;
        Omni.registerConfiguration(client => {
            client.observeCodecheck
                .where(z => z.request.FileName === null)
                .subscribe((data) => {
                    this.vm.errors = _.sortBy(this.filterOnlyWarningsAndErrors(data.response.QuickFixes),
                        (quickFix : OmniSharp.Models.DiagnosticLocation) => {
                            return quickFix.LogLevel;
                    });
                });
        });
    }

    private filterOnlyWarningsAndErrors(quickFixes): OmniSharp.Models.DiagnosticLocation[] {
        return _.filter(quickFixes, (quickFix: OmniSharp.Models.DiagnosticLocation) => {
            return quickFix.LogLevel != "Hidden";
        });
    }
}

export = CodeCheckOutputPaneView;
