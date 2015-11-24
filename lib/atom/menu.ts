import {CompositeDisposable} from "rx";
import {Omni} from "../server/omni";
import {readFileSync} from "fs";

class Menu implements IFeature {
    private disposable: Rx.CompositeDisposable;
    private _json: string;

    public activate() {
        this.disposable = new CompositeDisposable();
        if (!this._json) {
            const menuJsonFile = Omni.packageDir + "/menus/omnisharp-menu.json";
            this._json = JSON.parse(readFileSync(menuJsonFile, "utf8")).menu;
        }

        this.disposable.add(Omni.switchActiveSolution((solution, cd) => {
            if (solution) {
                cd.add(atom.menu.add(<any>this._json));
            }
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = false;
    public title = "Show OmniSharp Menu";
    public description = "Shows the Omnisharp Menu at the top of the window.";
    public default = true;
}

export const topMenu = new Menu();
