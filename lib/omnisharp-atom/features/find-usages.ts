import Omni = require('../../omni-sharp-server/omni')
import OmniSharpAtom = require('../omnisharp-atom')

class FindUsages {
    private atomSharper: typeof OmniSharpAtom;

    constructor(atomSharper: typeof OmniSharpAtom) {
        this.atomSharper = atomSharper;
    }

    public activate() {
        OmniSharpAtom.addCommand("omnisharp-atom:find-usages", () => {
            Omni.request(client => client.findusages(client.makeRequest()));
            this.atomSharper.outputView.selectPane("find");
        });
    }
}
export = FindUsages;
