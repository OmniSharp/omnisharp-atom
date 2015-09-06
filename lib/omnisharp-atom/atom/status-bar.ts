import {CompositeDisposable, Disposable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import {StatusBarElement} from "../views/status-bar-view";
import React = require('react');

class StatusBar implements OmniSharp.IAtomFeature {
    private disposable: Rx.CompositeDisposable;
    private view: StatusBarElement;
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
        this.view = new StatusBarElement();
        var tile = this.statusBar.addLeftTile({
            item: this.view,
            priority: -10000
        });
        this.disposable.add(this.view);
        this.disposable.add(Disposable.create(() => {
            tile.destroy();
            this.view.remove();
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = 'Status Bar';
    public description = 'Adds the OmniSharp status icon to the status bar.';
}

export var statusBar = new StatusBar;
