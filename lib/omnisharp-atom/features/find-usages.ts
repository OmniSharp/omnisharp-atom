import Omni = require('../../omni-sharp-server/omni')
import OmniSharpAtom = require('../omnisharp-atom')

class FindUsages {
    private atomSharper: typeof OmniSharpAtom;

    constructor(atomSharper: typeof OmniSharpAtom) {
        this.atomSharper = atomSharper;
    }

    public activate() {
        atom.commands.add('atom-workspace', "omnisharp-atom:find-usages", () => {
            Omni.client.findusagesPromise(Omni.makeRequest())
            this.atomSharper.outputView.selectPane("find");
        });
    }
}
export = FindUsages;
