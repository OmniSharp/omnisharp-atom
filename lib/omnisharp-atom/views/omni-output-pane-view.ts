import spacePenViews = require('atom-space-pen-views')
var $ = spacePenViews.jQuery;
var Convert = require('ansi-to-html')
import Vue = require('vue')
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')

// Internal: A tool-panel view for the test result output.
class OmniOutputPaneView extends spacePenViews.View {
    private vm: { uninitialized: boolean; initialized: boolean; output: OmniSharp.VueArray<any> };
    private convert: typeof Convert;

    public static content() {
        return this.div({
            "class": 'omni-output-pane-view native-key-bindings',
            "tabindex": '-1'
        }, () => {
                this.ul({
                    "class": 'background-message centered',
                    'v-class': 'hide: initialized'
                }, () => {
                        return this.li(() => {
                            this.span('Omnisharp server is turned off');
                            return this.kbd({
                                "class": 'key-binding text-highlight'
                            }, '⌃⌥O');
                        });
                    });
                return this.div({
                    "class": 'messages-container',
                    'v-class': 'hide: uninitialized'
                }, () => {
                        return this.pre({
                            'v-class': 'l.logLevel',
                            'v-repeat': 'l :output'
                        }, '{{{ l.message | ansi-to-html }}}');
                    });
            });
    }

    public initialize() {
        var scrollToBottom;
        scrollToBottom = _.throttle(() => {
            var ref;
            return (ref = this.find(".messages-container")[0].lastElementChild) != null ? ref.scrollIntoViewIfNeeded() : void 0;
        }, 100);
        Vue.filter('ansi-to-html', (value) => {
            var v;
            scrollToBottom();
            if (this.convert == null) {
                this.convert = new Convert();
            }
            v = this.convert.toHtml(value);
            return v.trim();
        });
        var viewModel = new Vue({
            el: this[0],
            data: _.extend(Omni.vm, {
                initialized: true,
                output: []
            })
        });
        this.vm = <any>viewModel;
        atom.emitter.on("omni-sharp-server:out", (data) => {
            if (this.vm.output.length >= 1000) {
                this.vm.output.$remove(0);
            }
            return this.vm.output.push({
                message: data.message,
                logLevel: data.logLevel
            });
        });
        atom.emitter.on("omni-sharp-server:err", (data) => {
            if (this.vm.output.length >= 1000) {
                this.vm.output.$remove(0);
            }
            return this.vm.output.push({
                message: data.message,
                logLevel: data.logLevel
            });
        });
        atom.emitter.on("omni-sharp-server:stop", () => {
            this.vm.output = <OmniSharp.VueArray<any>> [];
            return this.vm.output.push({
                message: "Omnisharp server stopped."
            });
        });

        return atom.emitter.on("omni-sharp-server:start", (data) => {
            this.vm.initialized = true;
            this.vm.output = <OmniSharp.VueArray<any>> [];
            this.vm.output.push({
                message: "Starting OmniSharp server (pid:" + data.pid + ")"
            });
            this.vm.output.push({
                message: "OmniSharp Location: " + data.exePath
            });
            this.vm.output.push({
                message: "Change the location that OmniSharp is loaded from by setting the OMNISHARP environment variable"
            });
            this.vm.output.push({
                message: "OmniSharp Path: " + data.path
            });
        });
    }

    destroy() {
        this.detach()
    }
}

export = OmniOutputPaneView;
