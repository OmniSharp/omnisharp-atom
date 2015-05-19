import spacePenViews = require('atom-space-pen-views')
var $ = spacePenViews.jQuery;
import Vue = require('vue')
import Omni = require('../../omni-sharp-server/omni');
import _ = require('lodash');

class StatusBarView extends spacePenViews.View {
    private vm;

    constructor(...args: any[]) {
        super(args[0]);
    }

    // Internal: Initialize test-status status bar view DOM contents.
    public static content() {
        // space-pen.d.ts is not working correctly...
        return this.div({
            'class': 'inline-block'
        }, () => {
            this.a({
                href: '#',
                'v-on': 'click: toggle',
                outlet: 'omni-meter',
                "class": 'omnisharp-atom-button'
            }, () => {
                    this.span({
                        "class": 'icon icon-flame',
                        'v-class': 'text-subtle: isOff, text-success: isReady, text-error: isError, icon-flame-loading: isLoading'
                    }, '{{iconText}}');
            });
            return this.a({
                href: '#',
                'v-on': 'click: toggleErrorWarningPanel',
                'class': 'inline-block error-warning-summary',
                'v-class': 'hide: isNotReady'
            }, () => {
                this.span({
                    'class': 'icon icon-issue-opened'
                });
                this.span({
                    'class': 'error-summary'
                }, '{{errorCount}}');
                this.span({
                    'class': 'icon icon-alert'
                });
                this.span({
                    'class': 'warning-summary'
                }, '{{warningCount}}');
            });
        });
    }

    // Internal: Initialize the status bar view and event handlers.
    public initialize(statusBar) {
        var viewModel = new Vue({
            el: this[0],
            data: _.extend(Omni.vm, { errorCount: 0, warningCount: 0 }),
            methods: {
                toggle: () => this.toggleView(),
                toggleErrorWarningPanel: () => this.toggleErrorWarningPanel()
            }
        });
        this.vm = <any>viewModel;
        statusBar.addLeftTile({
            item: this,
            priority: -1000
        });
        Omni.registerConfiguration(client => {
            client.observeCodecheck
                .where(z => z.request.FileName === null)
                .subscribe((data) => {
                    var counts = _.countBy(data.response.QuickFixes, (quickFix: OmniSharp.Models.DiagnosticLocation) => quickFix.LogLevel);
                    this.vm.errorCount = counts['Error'] || 0;
                    this.vm.warningCount = (counts['Warning'] || 0);
                });
        });
    }

    public toggleView() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-output');
        return this.vm.isOpen = !this.vm.isOpen;
    }

    public toggleErrorWarningPanel() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:show-errors');
    }

    public turnOffIcon() {
      return this.find('.icon-flame').removeClass("text-success");
    }

    //Returns nothing.
    public destroy() {
        return this.detach();
    }

}

export = StatusBarView
