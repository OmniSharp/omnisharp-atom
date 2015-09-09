import {CompositeDisposable, Disposable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import StatusBarComponent = require('../views/status-bar-view');
import React = require('react');
import {dock} from "../atom/dock";

class SettingsButton implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private _active = false;

    public activate() {
        this.disposable = new CompositeDisposable();
        var tooltip :Rx.IDisposable;
        var button = React.DOM.a({
            className: `btn icon-gear`,
            onClick: () => atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:settings"),
            onMouseEnter: (e) => {
                tooltip = atom.tooltips.add(<any>e.currentTarget, { title: this.tooltip });
                this.disposable.add(tooltip);
            },
            onMouseLeave: (e) => {
                this.disposable.remove(tooltip);
                tooltip.dispose();
            }
        });

        this.disposable.add(dock.addButton(
            'settings-button',
            'Settings',
            button,
            { priority: 999 }
        ));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = "Show Settings button";
    public tooltip = "Show Settings";
    public description = "Shows the settings button on the OmniSharp Dock";
    public default = true;
}

export var settingsButton = new SettingsButton();
