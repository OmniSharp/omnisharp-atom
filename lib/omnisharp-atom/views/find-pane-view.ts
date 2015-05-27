import spacePenViews = require('atom-space-pen-views')
var $ = spacePenViews.jQuery;
var Convert = require('ansi-to-html')
import Vue = require('vue')
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')

// Internal: A tool-panel view for find usages/implementations
class FindPaneView extends spacePenViews.View {
    private vm: { usages: any[] };
    public list: any;

    public static content() {
        return this.div({
            "class": 'error-output-pane',
            outlet: 'atomSharpFindPane'
        }, () => {
            this.input();
            return this.ol({
                style: "cursor: pointer",
                outlet: "list"
            }, () => {
                return this.li({
                    'class': 'find-usages',
                    "v-repeat": "usages",
                    "v-on": "click: gotoUsage",
                }, () => {
                    this.pre({"class": "text-highlight"}, "{{Text}}");
                    this.pre({"class": "inline-block"}, "{{FileName | filename}}({{Line}},{{Column}})");
                    return this.pre({"class": "text-subtle inline-block"}, " {{FileName | dirname}}");
                });
            });

                /*this.ul({
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
                    });*/
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
                this.selectItemView(this.list.find('li:first'));
            });

            client.observeFindimplementations.subscribe((data) => {
                if (data.response.QuickFixes.length > 1) {
                    this.vm.usages = data.response.QuickFixes;
                }
            });
        });

        atom.commands.add(this.element, {
            'core:move-down' : (event: Event) => {
                this.selectNextItemView();
                event.stopPropagation();
            },
            'core:move-up': (event: Event) => {
                this.selectPreviousItemView();
                event.stopPropagation();
            }
        });
    }

    public destroy() {
        this.detach();
    }

    private selectItemView(view) {
        if (!view.length) return;
        this.list.find('.selected').removeClass('selected');
        view.addClass('selected');
        this.scrollToItemView(view);
    }

    private selectNextItemView() {
        var view = this.getSelectedItemView().next();
        if (!view.length) view = this.list.find('li:first');
        this.selectItemView(view);
    }

    private selectPreviousItemView() {
        var view = this.getSelectedItemView().prev();
        if (!view.length) view = this.list.find('li:last');
        this.selectItemView(view);
    }

    private getSelectedItemView() {
        return this.list.find('li.selected');
    }

    private scrollToItemView(view) {
          var scrollTop = this.list.scrollTop();
          var desiredTop = view.position().top + scrollTop;
          var desiredBottom = desiredTop + view.outerHeight();

        if (desiredTop < scrollTop)
            this.list.scrollTop(desiredTop);
        else if (desiredBottom > this.list.scrollBottom())
            this.list.scrollBottom(desiredBottom);
    }
}
export = FindPaneView;
