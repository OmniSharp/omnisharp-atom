import spacePenViews = require('atom-space-pen-views')
var $ = spacePenViews.jQuery;
var Convert = require('ansi-to-html')
import Vue = require('vue')
import _ = require('lodash')
import OmniSharpServer = require('../../omni-sharp-server/omni-sharp-server')
import OmniSharpAtom = require('../omnisharp-atom');


// Internal: A tool-panel view for the test result output.
class OmniOutputPaneView extends spacePenViews.View {
    private vm : {uninitialized: boolean; initialized: boolean; output: OmniSharp.VueArray<any> };
    private convert: typeof Convert;

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
            "class": 'omni-output-pane-view'
        }, () => {
                this.ul({
                    "class": 'background-message centered',
                    'v-class': 'hide: initialized'
                }, () => {
                        return this.li(() => {
                            this.span('Omnisharp server is turned off');
                            return this.kbd({
                                "class": 'key-binding text-highlight'
                            }, this.startupKeyboardCommand());
                        });
                    });
                return this.div({
                    "class": 'messages-container',
                    'v-class': 'hide: uninitialized'
                }, () => {
                        return this.pre({
                            'v-class': 'text-error: l.isError',
                            'v-repeat': 'l :output'
                        }, '{{ l.message | ansi-to-html }}');
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
            data: _.extend(OmniSharpServer.vm, {
                uninitialized: true,
                initialized: false,
                output: []
            })
        });
        this.vm = <any>viewModel;
        atom.emitter.on("omni-sharp-server:out", (data) => {
            if (this.vm.output.length >= 1000) {
                this.vm.output.$remove(0);
            }
            return this.vm.output.push({
                message: data
            });
        });
        atom.emitter.on("omni-sharp-server:err", (data) => {
            if (this.vm.output.length >= 1000) {
                this.vm.output.$remove(0);
            }
            return this.vm.output.push({
                message: data,
                isError: true
            });
        });
        return atom.emitter.on("omni-sharp-server:start", (pid, port) => {
            this.vm.uninitialized = false;
            this.vm.initialized = true;
            this.vm.output = <OmniSharp.VueArray<any>> [];
            return this.vm.output.push({
                message: "Starting Omnisharp server (pid:" + pid + ", port:" + port + ")"
            });
        });
    }

    destroy() {
        this.detach()
    }
}

export = OmniOutputPaneView;
