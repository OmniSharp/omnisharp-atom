import {CompositeDisposable, Disposable, IDisposable} from "omnisharp-client";
import {each} from "lodash";
import {Omni} from "../server/omni";
import {dock} from "../atom/dock";

interface IButton {
    name: string;
    config: string;
    icon: string;
    tooltip: string;
}

const buttons = [
    {
        name: "enhanced-highlighting",
        config: "omnisharp-atom.enhancedHighlighting",
        icon: "icon-pencil",
        tooltip: "Enable / Disable Enhanced Highlighting"
    }, {
        name: "code-lens",
        config: "omnisharp-atom.codeLens",
        icon: "icon-telescope",
        tooltip: "Enable / Disable Code Lens"
    }];

class FeatureEditorButtons implements IAtomFeature {
    private disposable: CompositeDisposable;
    private statusBar: any;
    private _active = false;

    public activate() {
        this.disposable = new CompositeDisposable();
    }

    public dispose() {
        this.disposable.dispose();
    }

    public setup(statusBar: any) {
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
        const {name, config, icon, tooltip} = button;
        const view = document.createElement("span");
        view.classList.add("inline-block", `${name}-button`, icon);
        view.style.display = "none";
        view.onclick = () => atom.config.set(config, !atom.config.get(config));

        let tooltipDisposable: IDisposable;
        view.onmouseenter = () => {
            tooltipDisposable = atom.tooltips.add(view, { title: tooltip });
            this.disposable.add(tooltipDisposable);
        };
        view.onmouseleave = () => {
            if (tooltipDisposable) {
                this.disposable.remove(tooltipDisposable);
                tooltipDisposable.dispose();
            }
        };

        let tile: any;
        if (atom.config.get("grammar-selector.showOnRightSideOfStatusBar")) {
            tile = this.statusBar.addRightTile({
                item: view,
                priority: 9 - index - 1
            });
        } else {
            tile = this.statusBar.addLeftTile({
                item: view,
                priority: 11 + index + 1
            });
        }

        this.disposable.add(atom.config.observe(config, (value: boolean) => {
            if (value) {
                view.classList.add("text-success");
            } else {
                view.classList.remove("text-success");
            }
        }));

        this.disposable.add(Disposable.create(() => {
            tile.destroy();
            view.remove();
        }));

        this.disposable.add(Omni.activeEditor
            .subscribe((editor) => editor ? (view.style.display = "") : (view.style.display = "none")));
    }

    public required = false;
    public title = "Show Editor Feature Buttons";
    public description = "Shows feature toggle buttons in the editor.";
    public default = true;
}

class FeatureButtons implements IFeature {
    private disposable: CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();
        each(buttons, (button, index) => this._button(button, index));
    }

    public dispose() {
        this.disposable.dispose();
    }

    private _button(button: IButton, index: number) {
        const {config} = button;

        let buttonDisposable: IDisposable;
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
        const {name, config, icon, tooltip} = button;

        let tooltipDisposable: IDisposable;
        const htmlButton = document.createElement("a");
        htmlButton.id = `${icon}-name`;
        htmlButton.classList.add("btn",icon);
        if (enabled) {
            htmlButton.classList.add("btn-success");
        }

        htmlButton.onclick = () => atom.config.set(config, !atom.config.get(config));
        htmlButton.onmouseenter = (e) => {
            tooltipDisposable = atom.tooltips.add(<any>e.currentTarget, { title: tooltip });
            this.disposable.add(tooltipDisposable);
        };
        htmlButton.onmouseleave = (e) => {
            if (tooltipDisposable) {
                this.disposable.remove(tooltipDisposable);
                tooltipDisposable.dispose();
            }
        };

        const buttonDisposable = dock.addButton(
            `${name}-button`,
            tooltip,
            htmlButton,
            { priority: 500 + index }
        );

        return buttonDisposable;
    }

    public required = false;
    public title = "Show Feature Toggles";
    public description = "Shows feature toggle buttons in the omnisharp window.";
    public default = true;
}

export const featureButtons = new FeatureButtons();
export const featureEditorButtons = new FeatureEditorButtons();
