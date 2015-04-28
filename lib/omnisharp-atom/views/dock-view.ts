import spacePenViews = require('atom-space-pen-views')
var $ = spacePenViews.jQuery;
var Convert = require('ansi-to-html')
import Vue = require('vue')

import Omni = require('../../omni-sharp-server/omni')
import OmniSharpAtom = require("../omnisharp-atom");
import FindPaneView = require('./find-pane-view')
import BuildOutputPaneView = require('./build-output-pane-view')
import OmniOutputPaneView = require('./omni-output-pane-view')


class DockView extends spacePenViews.View {

    private findOutput;
    private buildOutput;
    private omniOutput;
    private vm: { selected: string; };
    private panel: any;
    private fixedTop: number;
    private fixedHeight: number;
    private fixedButtonBarHeight: number;
    private statusBarHeight: number;
    private resizeHandle: JQuery;

    // Internal: Initialize test-status output view DOM contents.
    public static content() {
        var btn = (view, text) => {
            this.button({
                'v-attr': "class: selected | btn-selected #{view}",
                'v-on': "click: selectPane",
                'pane': view
            }, text);
        };

        return this.div({
            "class": 'tool-panel panel-bottom omnisharp-atom-pane',
            outlet: 'pane'
        }, () => {
                this.div({
                    "class": 'omnisharp-atom-output-resizer',
                    outlet: 'resizeHandle'
                });
                return this.div({
                    "class": "inset-panel"
                }, () => {
                        this.div({
                            "class": "panel-heading clearfix"
                        }, () => {
                                return this.div({
                                    "class": 'btn-toolbar pull-left'
                                }, () => {
                                        return this.div({
                                            "class": 'btn-group btn-toggle'
                                        }, () => {
                                                btn("find", "Find");
                                                btn("build", "Build output");
                                                return btn("omni", "Omnisharp output");
                                            });
                                    });
                            });
                        this.div({
                            'v-attr': 'class: selected | content-selected omni',
                            outlet: 'omniOutput'
                        });
                        this.div({
                            'v-attr': 'class: selected | content-selected errors',
                            outlet: 'errorsOutput'
                        });
                        this.div({
                            'v-attr': 'class: selected | content-selected find',
                            outlet: 'findOutput'
                        });
                        return this.div({
                            'v-attr': 'class: selected | content-selected build',
                            outlet: 'buildOutput'
                        });
                    });
            });
    }

    // Internal: Initialize the test-status output view and event handlers.
    public initialize() {
        Vue.filter('btn-selected', (value, expectedValue) => {
            var selected;
            selected = value === expectedValue ? "selected" : "";
            return "btn btn-default btn-fix " + selected;
        });

        Vue.filter('content-selected', (value, expectedValue) => {
            var selected;
            selected = value === expectedValue ? "" : "hide";
            return "omnisharp-atom-output " + expectedValue + "-output " + selected;
        });

        this.findOutput.append(new FindPaneView());
        this.buildOutput.append(new BuildOutputPaneView());
        this.omniOutput.append(new OmniOutputPaneView());

        var viewModel = new Vue({
            el: this[0],
            data: {
                selected: "omni"
            },
            methods: {
                selectPane: arg => {
                    var target;
                    target = arg.target;
                    return this.selectPane($(target).attr("pane"));
                }
            }
        });

        this.vm = <any>viewModel;

        atom.commands.add('atom-workspace', "omnisharp-atom:toggle-output", () => this.toggleView());
        atom.commands.add('atom-workspace', "omnisharp-atom:hide", () => this.hideView());
        atom.commands.add('atom-workspace', "omnisharp-atom:show-find", () => this.selectPane("find"));
        atom.commands.add('atom-workspace', "omnisharp-atom:show-build", () => this.selectPane("build"));
        atom.commands.add('atom-workspace', "omnisharp-atom:show-omni", () => this.selectPane("omni"));

        this.on('core:cancel core:close', () => this.hideView());

        this.on('mousedown', '.omnisharp-atom-output-resizer', e => this.resizeStarted(e));

        //init the panel, but hide it
        this.panel = atom.workspace.addBottomPanel({
            item: this,
            visible: false
        });
    }

    constructor(private omnisharpAtom : typeof OmniSharpAtom) {
        super();
    }

    public selectPane = (pane) => {
        this.vm.selected = pane;
        this.show();
        if (!this.panel.visible) {
            this.panel.show();
        }
        this.find("button.selected").focus();
    }

    public resizeStarted = (event: JQueryEventObject) => {
        this.fixedTop = this.resizeHandle.offset().top;
        this.fixedHeight = $(".omnisharp-atom-pane").height();
        this.fixedButtonBarHeight = this.find(".btn-group").height();
        this.statusBarHeight = this.omnisharpAtom.statusBarView.height();
        $(document).on('mousemove', this.resizePane);
        $(document).on('mouseup', this.resizeStopped);
    }

    public resizeStopped = () => {
        $(document).off('mousemove', this.resizePane);
        $(document).off('mouseup', this.resizeStopped);
    }

    // TODO: Update to TS 1.5 when destructuring is done
    //public resizePane = ({pageY, which}) => {
    public resizePane = (arg) => {
        var pageY, which;
        pageY = arg.pageY, which = arg.which;

        if (which !== 1) {
            return this.resizeStopped();
        }

        var h = this.fixedHeight + (this.fixedTop - pageY);
        $(".omnisharp-atom-pane").height(h);
        this.find(".omnisharp-atom-output").height(h - this.fixedButtonBarHeight - this.statusBarHeight);
        this.find(".messages-container").height(h - this.fixedButtonBarHeight - this.statusBarHeight);
    }


    public destroy() {
        this.detach();
    }

    public hideView() {
        this.panel.hide();
        return this;
    }

    public toggleView() {
        if (this.panel.visible) {
            this.panel.hide();
        } else {
            this.panel.show();
        }
    }
}

export = DockView;
