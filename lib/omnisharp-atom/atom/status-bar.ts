import {CompositeDisposable, Disposable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import StatusBarComponent = require('../views/status-bar-view');
import React = require('react');

class StatusBar implements OmniSharp.IAtomFeature {
    private disposable: Rx.CompositeDisposable;
    private view: Element;
    private tile: any;
    private statusBar: any;
    private _active = false;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Disposable.create(() => this._active = false));
    }

    public setup(statusBar) {
        this.statusBar = statusBar;

        if (this._active) {
            this._attach();
        }
    }

    public attach() {
        if (this.statusBar) { this._attach(); }
        this._active = true;
    }

    private _attach() {
        this.view = document.createElement("span");
        var tile = this.statusBar.addLeftTile({
            item: this.view,
            priority: -10000
        });
        this.disposable.add(Disposable.create(() => {
            React.unmountComponentAtNode(this.view);
            tile.destroy();
            this.view.remove();
        }));
        React.render(React.createElement(StatusBarComponent, {}), this.view);
    }

    public dispose() {
        this.disposable.dispose();
    }

}

export var statusBar = new StatusBar;
