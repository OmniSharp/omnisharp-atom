import {CompositeDisposable, Observable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import {readFileSync} from "fs";

class Menu implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private _json: string;

    public activate() {
        this.disposable = new CompositeDisposable();
        if (!this._json) {
            var menuJsonFile = Omni.packageDir + "/omnisharp-atom/menus/omnisharp-menu.json";
            this._json = JSON.parse(readFileSync(menuJsonFile, 'utf8')).menu;
        }

        var cd = new CompositeDisposable();

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

export var topMenu = new Menu();
