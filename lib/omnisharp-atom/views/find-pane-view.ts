import spacePenViews = require('atom-space-pen-views')
var $ = spacePenViews.jQuery;
var Convert = require('ansi-to-html')
import Vue = require('vue')
import _ = require('lodash')
import OmniSharpServer = require('../../omni-sharp-server/omni-sharp-server')
import OmniSharpAtom = require('../omnisharp-atom');


// Internal: A tool-panel view for find usages/implementations
class FindPaneView extends spacePenViews.View {


    private vm: { usages:any[] };

    private static startupKeyboardCommand()
    {
        //todo: we need to change this keybinding, and perhaps move it to settings.
        if (process.platform === "darwin") {
            return "⌃⌥O"; //funky OSX keyboard combo
        }
        return "CTRL+ALT+O";
    }


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
                            }, this.startupKeyboardCommand());
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
            data: _.extend(OmniSharpServer.vm, {
                usages: []
            }),
            methods: {
                gotoUsage: (arg) => {
                    var targetVM;
                    targetVM = arg.targetVM;
                    return atom.emitter.emit("omni:navigate-to", targetVM.$data);
                }
            }
        });
        this.vm = <any>viewModel;

        return atom.emitter.on("omni:find-usages", (data) => this.vm.usages = data.QuickFixes);
    }

    public destroy() {
        this.detach();
    }
}
export = FindPaneView;
