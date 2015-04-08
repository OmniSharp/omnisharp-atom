var spacePenViews = require('atom-space-pen-views')
var View = <any>spacePenViews.View;
import Vue = require('vue')
import OmniSharpServer = require('../../omni-sharp-server/omni-sharp-server')

class StatusBarView extends View {
    private vm: OmniSharp.vm;

    constructor(...args: any[]) {
        super(args[0]);
    }

    // Internal: Initialize test-status status bar view DOM contents.
    public static content() {
        // space-pen.d.ts is not working correctly...
        return this.a({
            href: '#',
            'v-on': 'click: toggle',
            outlet: 'omni-meter',
            "class": 'inline-block omnisharp-atom-button'
        }, () => {
                this.span({
                    "class": 'icon icon-flame',
                    'v-class': 'text-subtle: isOff, text-success: isReady, text-error: isError'
                }, '{{iconText}}');
                return this.progress({
                    "class": 'inline-block',
                    'v-class': 'hide: isNotLoading'
                });
            });
    }

    // Internal: Initialize the status bar view and event handlers.
    public initialize(statusBar) {
        var viewModel = new Vue({
            el: this[0],
            data: OmniSharpServer.vm,
            methods: {
                toggle: () => this.toggle()
            }
        });
        this.vm = <any>viewModel;
        return statusBar.addLeftTile({
            item: this,
            priority: -1000
        });
    }

    public toggle() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-output');
        return this.vm.isOpen = !this.vm.isOpen;
    }

    //Returns nothing.
    public destroy() {
        return this.detach();
    }

}

export = StatusBarView
