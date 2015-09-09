import {CompositeDisposable, Disposable} from "rx";
import {each} from 'lodash';
import Omni = require('../../omni-sharp-server/omni')
import StatusBarComponent = require('../views/status-bar-view');
import React = require('react');
import {dock} from "../atom/dock";

interface IButton {
    name: string;
    config: string;
    icon: string;
    tooltip: string;
}

const buttons = [
    {
        name: 'enhanced-highlighting',
        config: 'omnisharp-atom.enhancedHighlighting',
        icon: 'icon-pencil',
        tooltip: 'Enable / Disable Enhanced Highlighting'
    }, {
        name: 'code-lens',
        config: 'omnisharp-atom.codeLens',
        icon: 'icon-telescope',
        tooltip: 'Enable / Disable Code Lens'
    }];

class FeatureEditorButtons implements OmniSharp.IAtomFeature {
    private disposable: Rx.CompositeDisposable;
    private statusBar: any;
    private _active = false;
    private _showInEditor = true;

    public activate() {
        this.disposable = new CompositeDisposable();
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
        each(buttons, (button, index) => this._button(button, index));
    }

    private _button(button: IButton, index: number) {
        var {name, config, icon, tooltip} = button;
        var view = document.createElement("span");
        view.classList.add('inline-block', `${name}-button`, icon);
        view.style.display = 'none';
        view.onclick = () => atom.config.set(config, !atom.config.get(config));

        var tooltipDisposable: Rx.IDisposable;
        view.onmouseenter = () => {
            tooltipDisposable = atom.tooltips.add(view, { title: tooltip });
            this.disposable.add(tooltipDisposable);
        };
        view.onmouseleave = () => {
            this.disposable.remove(tooltipDisposable);
            tooltipDisposable.dispose();
        }

        if (atom.config.get('grammar-selector.showOnRightSideOfStatusBar')) {
            var tile = this.statusBar.addRightTile({
                item: view,
                priority: 9 - index - 1
            });
        } else {
            var tile = this.statusBar.addLeftTile({
                item: view,
                priority: 11 + index + 1
            });
        }

        this.disposable.add(atom.config.observe(config, (value: boolean) => {
            if (value) {
                view.classList.add('text-success');
            } else {
                view.classList.remove('text-success');
            }
        }));

        this.disposable.add(Disposable.create(() => {
            tile.destroy();
            view.remove();
        }));

        this.disposable.add(Omni.activeEditor
            .subscribe((editor) => editor ? (view.style.display = '') : (view.style.display = 'none')));
    }

    public required = false;
    public title = "Show Editor Feature Buttons";
    public description = "Shows feature toggle buttons in the editor.";
    public default = true;
}

class FeatureButtons implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private statusBar: any;
    private _active = false;
    private _showInEditor = true;

    public activate() {
        this.disposable = new CompositeDisposable();
        each(buttons, (button, index) => this._button(button, index));
    }

    public dispose() {
        this.disposable.dispose();
    }

    private _button(button: IButton, index: number) {
        var {name, config, icon, tooltip} = button;

        var buttonDisposable: Rx.IDisposable;
        this.disposable.add(atom.config.observe(config, (value: boolean) => {
            if (buttonDisposable) {
                this.disposable.remove(buttonDisposable);
                buttonDisposable.dispose();
            }

            buttonDisposable = this._makeButton(button, index, value);
            this.disposable.add(buttonDisposable);
        }));

        this.disposable.add(Disposable.create(() => {
            buttonDisposable.dispose();
        }));
    }

    private _makeButton(button: IButton, index: number, enabled: boolean) {
        var {name, config, icon, tooltip} = button;

        var tooltipDisposable: Rx.IDisposable;
        var reactButton = React.DOM.a({
            id: `${icon}-name`,
            className: `btn ${icon} ${enabled ? 'btn-success' : ''}`,
            onClick: () => atom.config.set(config, !atom.config.get(config)),
            onMouseEnter: (e) => {
                tooltipDisposable = atom.tooltips.add(<any>e.currentTarget, { title: tooltip });
                this.disposable.add(tooltipDisposable);
            },
            onMouseLeave: (e) => {
                this.disposable.remove(tooltipDisposable);
                tooltipDisposable.dispose();
            }
        });

        var buttonDisposable = dock.addButton(
            `${name}-button`,
            tooltip,
            reactButton,
            { priority: 500 + index }
        );

        return buttonDisposable;
    }

    public required = false;
    public title = "Show Feature Toggles";
    public description = "Shows feature toggle buttons in the omnisharp window.";
    public default = true;
}

export var featureButtons = new FeatureButtons();
export var featureEditorButtons = new FeatureEditorButtons();
