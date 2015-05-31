import {CompositeDisposable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import StatusBarComponent = require('../views/status-bar-view');
import React = require('react');

class StatusBar implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private view: Element;
    private tile: any;
    private statusBar: any;
    private _active = false;

    public activate() {
        this.view = document.createElement("span");
        if (this.statusBar) { this._attach(); }

        this._active = true;
    }

    public setup(statusBar) {
        this.statusBar = statusBar;

        if (this._active) {
            this._attach();
        }
    }

    private _attach() {
        this.statusBar.addLeftTile({
            item: this.view,
            priority: -1000
        });
        React.render(React.createElement(StatusBarComponent, {}), this.view);
    }

    public dispose() {
        React.unmountComponentAtNode(this.view);
        this.tile.destroy();
        this.disposable.dispose();
    }

}

export var statusBar = new StatusBar;
