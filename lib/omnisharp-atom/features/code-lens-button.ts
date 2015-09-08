import {CompositeDisposable, Disposable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import StatusBarComponent = require('../views/status-bar-view');
import React = require('react');
import {dock} from "../atom/dock";

class CodeLensButton implements OmniSharp.IAtomFeature {
    private disposable: Rx.CompositeDisposable;
    private view: HTMLSpanElement;
    private tile: any;
    private statusBar: any;
    private buttonDisposable: Rx.IDisposable;
    private _active = false;

    public activate() {
        this.disposable = new CompositeDisposable();
    }

    private _makeButton(enabled: boolean) {
        if (this.buttonDisposable) {
            this.disposable.remove(this.buttonDisposable);
            this.buttonDisposable.dispose();
        }

        var button = React.DOM.a({
            className: `btn icon-telescope ${enabled ? 'btn-success' : ''}`,
            onClick: () => atom.config.set('omnisharp-atom.codeLens', !atom.config.get('omnisharp-atom.codeLens'))
        });

        this.buttonDisposable = dock.addButton(
            'code-lens-button',
            'Enable Code Lens',
            button,
            { priority: 999 }
        );
        this.disposable.add(this.buttonDisposable);
        return this.buttonDisposable;
    }

    public dispose() {
        this.disposable.dispose();
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
        this.view.classList.add('inline-block', 'code-lens-button', 'icon-telescope');
        this.view.style.display = 'none';
        this.view.onclick = () => atom.config.set('omnisharp-atom.codeLens', !atom.config.get('omnisharp-atom.codeLens'));

        if (atom.config.get('grammar-selector.showOnRightSideOfStatusBar')) {
            var tile = this.statusBar.addRightTile({
                item: this.view,
                priority: 8
            });
        } else {
            var tile = this.statusBar.addLeftTile({
                item: this.view,
                priority: 12
            });
        }

        this.disposable.add(atom.config.observe('omnisharp-atom.codeLens', (value: boolean) => {
            if (value) {
                this.view.classList.add('text-success');
            } else {
                this.view.classList.remove('text-success');
            }

            this._makeButton(value);
        }));

        this.disposable.add(Disposable.create(() => {
            tile.destroy();
            this.view.remove();
            this.buttonDisposable && this.buttonDisposable.dispose();
        }));

        this.disposable.add(Omni.activeEditor
            .subscribe((editor) => editor ? (this.view.style.display = '') : (this.view.style.display = 'none')));
    }

    public required = false;
    public title = "Show Code Lens buttons";
    public description = "Show the code lens buttons in the editor near the current grammar as well as in the OmniSharp dock";
    public default = true;
}

export var codeLensButton = new CodeLensButton();
