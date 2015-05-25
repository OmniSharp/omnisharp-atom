import {CompositeDisposable} from "rx";
import spacePenViews = require('atom-space-pen-views');
var $ = spacePenViews.jQuery;
var Convert = require('ansi-to-html');
import Vue = require('vue')
import _ = require('lodash')
import Omni = require('../../omni-sharp-server/omni')
import ClientManager = require('../../omni-sharp-server/client-manager');
import React = require('react')

// Internal: A tool-panel view for the test result output.
class OmniOutputPaneView extends spacePenViews.View {
    private vm: { uninitialized: boolean; initialized: boolean; output: OmniSharp.VueArray<OmniSharp.OutputMessage> };
    private convert = new Convert();
    private subscription: Rx.CompositeDisposable;

    constructor() {
        super();
        _.defer(_.bind(this.setupSubscriptions, this));
    }

    private setupSubscriptions() {
        var output: OmniSharp.OutputMessage[] = [];
        var convert = new Convert();
        var createItem = function(item: OmniSharp.OutputMessage) {
            return React.DOM.pre({
                className: item.logLevel
            }, convert.toHtml(item.message).trim());
        };

        var scrollToBottom = _.throttle(() => {
            var item = <any>this.find(".messages-container")[0].lastElementChild;
            if (item)
                item.scrollIntoViewIfNeeded();
        }, 100);

        var OutputWindow = React.createClass({
            displayName: 'OutputWindow',
            render: function() {
                return React.DOM.div({
                    className: 'messages-container'
                },
                    null,
                    output.map(createItem)
                    );
            }
        });

        var react = React.render(React.createElement(OutputWindow, null), this[0]);
        var update = _.throttle(() => react.forceUpdate(), 100);

        this.subscription = new CompositeDisposable();

        var currentClient = null;
        var currentSubscription = null;

        this.subscription.add(ClientManager.activeClient
            .subscribe(client => {
            if (client && client !== currentClient) {
                currentClient = client;
                currentSubscription && currentSubscription.dispose();

                output = client.output;
                console.log(client.uniqueId, client.path);

                currentSubscription = client.logs
                    .throttle(100)
                    .subscribe(z => {
                        react.forceUpdate();
                        scrollToBottom();
                    });

                update();
                scrollToBottom();
            }
        }));
    }

    public static content() {
        return this.div({
            "class": 'omni-output-pane-view native-key-bindings',
            "tabindex": '-1'
        });
    }

    public initialize() {
    }

    destroy() {
        this.detach();
        this.subscription.dispose();
    }
}

export = OmniOutputPaneView;
