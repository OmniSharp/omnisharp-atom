import spacePenViews = require('atom-space-pen-views')
var $ = spacePenViews.jQuery;
var Convert = require('ansi-to-html')
import Vue = require('vue')
import _ = require('lodash')
import Omni = require("../../omni-sharp-server/omni");

// Internal: A tool- panel view for the build result output.
class BuildOutputPaneView extends spacePenViews.View {
    public vm: { output: OmniSharp.VueArray<any> };
    public convert : typeof Convert;

    public static content() {
        return this.div({
            "class": 'build-output-pane-view native-key-bindings',
            "tabindex": '-1'
        }, () => this.div({
                "class": 'messages-container'
            }, () => this.pre({
                    'v-class': 'text-error: l.isError, navigate-link: l.isLink',
                    'v-repeat': 'l :output',
                    'v-on': 'click: navigate',
                    'v-attr': 'data-nav: l.nav'
                }, '{{ l.message | build-output-ansi-to-html }}')
                )
            );
    }

    public initialize() {
        var scrollToBottom = _.throttle(() => {
            var item : any = this.find(".messages-container")[0].lastElementChild;
            if (item != null)
                return item.scrollIntoViewIfNeeded();
        }, 100);

        Vue.filter('build-output-ansi-to-html', value => {
            scrollToBottom();
            if (this.convert == null) {
                this.convert = new Convert();
            }

            return this.convert.toHtml(value).trim();
        });

        var viewModel = new Vue({
            el: this[0],
            data: {
                output: []
            },
            methods: {
                navigate: function(e) {
                    var nav = JSON.parse(e.srcElement.attributes['data-nav'].value);
                    if (nav) {
                        Omni.navigateTo(nav);
                    }
                }
            }
        });
        this.vm = <any>viewModel;

        atom.emitter.on("omnisharp-atom:build-message", data => {
            var buildMessages = data.split('\n');
            return _.map(buildMessages, message => this.processMessage(message));
        });

        atom.emitter.on("omnisharp-atom:build-err", data => {
            if (this.vm.output.length >= 1000) {
                this.vm.output.$remove(0);
            }
            return this.vm.output.push({
                message: data,
                isError: true
            });
        });

        atom.emitter.on("omnisharp-atom:building", command => {
            this.vm.output = <OmniSharp.VueArray<any>>[];
            this.vm.output.push({
                message: 'OmniSharp Atom building...'
            });
            return this.vm.output.push({
                message: "\t" + command
            });
        });

        return atom.emitter.on("omnisharp-atom:build-exitcode", exitCode => {
            if (exitCode === 0) {
                return this.vm.output.push({
                    message: 'Build succeeded!'
                });
            } else {
                return this.vm.output.push({
                    message: 'Build failed!',
                    isError: true
                });
            }
        });
    }

    public processMessage(data) {
        var linkPattern = /(.*)\((\d*),(\d*)\)/g;
        var navMatches = linkPattern.exec(data);
        var isLink = false;
        var nav : any = false;
        if ((navMatches != null ? navMatches.length : void 0) === 4) {
            isLink = true;
            nav = {
                FileName: navMatches[1],
                Line: navMatches[2],
                Column: navMatches[3]
            };
        }
        var logMessage = {
            message: data,
            isLink: isLink,
            nav: JSON.stringify(nav),
            isError: isLink
        };
        if (this.vm.output.length >= 1000) {
            this.vm.output.$remove(0);
        }
        return this.vm.output.push(logMessage);
    }

    public destroy() {
        this.detach();
    }
}
export = BuildOutputPaneView
