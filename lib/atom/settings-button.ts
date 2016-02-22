import {CompositeDisposable, IDisposable} from "omnisharp-client";
import {dock} from "../atom/dock";

class SettingsButton implements IFeature {
    private disposable: CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();
        let tooltip :IDisposable;

        const htmlButton = document.createElement("a");
        htmlButton.classList.add("btn","icon-gear");

        htmlButton.onclick = () => atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:settings");
        htmlButton.onmouseenter = (e) => {
            tooltip = atom.tooltips.add(<any>e.currentTarget, { title: this.tooltip });
            this.disposable.add(tooltip);
        };
        htmlButton.onmouseleave = (e) => {
            if (tooltip) {
                this.disposable.remove(tooltip);
                tooltip.dispose();
            }
        };

        this.disposable.add(dock.addButton(
            "settings-button",
            "Settings",
            htmlButton,
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

export const settingsButton = new SettingsButton();
