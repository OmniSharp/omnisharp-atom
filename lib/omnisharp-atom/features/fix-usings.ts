import Omni = require('../../omni-sharp-server/omni')

class FixUsings {
    public activate() {
        atom.commands.add('atom-workspace', "omnisharp-atom:fix-usings", () => Omni.fixUsings());
    }
}
export =  FixUsings;
