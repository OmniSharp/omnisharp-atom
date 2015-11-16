import {OmniSharpAtom} from "../../omnisharp.d.ts";
import {CompositeDisposable} from "../../Disposable";
import Omni from "../../omni-sharp-server/omni";
import {readFileSync} from "fs";

class Menu implements OmniSharpAtom.IFeature {
    private disposable: CompositeDisposable;
    private _json: string;

    public activate() {
        this.disposable = new CompositeDisposable();
        if (!this._json) {
            const menuJsonFile = Omni.packageDir + "/omnisharp-atom/menus/omnisharp-menu.json";
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
