import spacePenViews = require('atom-space-pen-views')
var $ = spacePenViews.jQuery;
var Convert = require('ansi-to-html')
import Vue = require('vue')
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import OmniSharpAtom = require('../omnisharp-atom')

// Internal: A tool-panel view for find usages/implementations
class FindPaneView extends spacePenViews.View {
    private vm: { usages: any[] };
    public list: any;
    private atomSharper: typeof OmniSharpAtom;

    constructor(atomSharper: typeof OmniSharpAtom) {
        super();
        this.atomSharper = atomSharper;
    }

    public static content() {
        return this.div({
            "class": 'error-output-pane',
            'v-on': 'keydown: keydownPane',
            'tabindex': '-1',
            outlet: 'findPane'
        }, () => {
            return this.ol({
                style: "cursor: pointer",
                outlet: "list"
            }, () => {
                return this.li({
                    'class': 'find-usages usage-{{$index}}',
                    "v-repeat": "usages",
                    "v-on": "click: gotoUsage",
                    'v-class': 'selected: isSelected'
                }, () => {
                    this.pre({"class": "text-highlight"}, "{{Text}}");
                    this.pre({"class": "inline-block"}, "{{FileName | filename}}({{Line}},{{Column}})");
                    return this.pre({"class": "text-subtle inline-block"}, " {{FileName | dirname}}");
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
                },
                keydownPane: (arg) => {
                    if (arg.keyIdentifier == 'Down') {
                        this.selectNextItem();
                    }
                    else if (arg.keyIdentifier == 'Up') {
                        this.selectPreviousItem();
                    }
                    else if (arg.keyIdentifier == 'Enter') {
                        this.nagivateToSelectedItem();
                    }
                }
            }
        });
        this.vm = <any>viewModel;

        Omni.registerConfiguration(client => {
            client.observeFindusages.subscribe((data) => {
                this.vm.usages = data.response.QuickFixes;
                if (this.vm.usages.length > 0) {
                    this.vm.usages[0].isSelected = true;
                    this.scrollToItemView(0);
                    this.list.parent().focus();
                }
            });

            client.observeFindimplementations.subscribe((data) => {
                if (data.response.QuickFixes.length > 1) {
                    this.vm.usages = data.response.QuickFixes;
                }
            });

        });

        //tried this.atomSharper.addCommand -- but atomSharper is undefined?
        //i guess views get loaded before OmniSharper
        atom.commands.add('atom-workspace', 'omnisharp-atom:show-find', () => {
            this.list.parent().focus();
        });

    }

    private selectNextItem() {
        if (!this.vm.usages) return;
        var index = this.deselectCurrentItem();
        this.setCurrentItem(index + 1);
    }

    private selectPreviousItem() {
        if (!this.vm.usages) return;
        var index = this.deselectCurrentItem();
        this.setCurrentItem(index - 1);
    }

    private deselectCurrentItem(): number {
        var index = _.findIndex(this.vm.usages, usage => usage.isSelected);
        this.vm.usages[index].isSelected = false;
        return index;
    }

    private setCurrentItem(index) {
        if (index < 0)
            index = 0;
        if (index >= this.vm.usages.length)
            index = this.vm.usages.length - 1;
        this.vm.usages[index].isSelected = true;
        this.scrollToItemView(index);
    }

    private nagivateToSelectedItem() {
        if (!this.vm.usages) return;
        var usage = _.find(this.vm.usages, usage => usage.isSelected);
        if (usage) Omni.navigateTo(usage);
    }

    public destroy() {
        this.detach();
    }

    private scrollToItemView(index) {
        var item = this.list.find(`li.usage-${index}`);
        if (!item || !item.position()) return;

        var pane = this.list.parent().parent();
        var scrollTop = pane.scrollTop();
        var desiredTop = item.position().top + scrollTop;
        var desiredBottom = desiredTop + item.outerHeight();

        if (desiredTop < scrollTop)
            pane.scrollTop(desiredTop);
        else if (desiredBottom > pane.scrollBottom())
            pane.scrollBottom(desiredBottom);
    }
}

export = FindPaneView;
