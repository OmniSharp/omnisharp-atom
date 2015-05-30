import {Observable} from "rx";
import Omni = require("../../omni-sharp-server/omni");

// As the active model changes (when we go from an editor for ClientA to an editor for ClientB)
// We want to make sure that the output field is
var observable = Omni.activeModel
    .flatMapLatest(z => z.observe.output)
    // This starts us off with the current models output
    .merge(Omni.activeModel.map(z => z.output))
    .startWith([])
    // Only update after a short time incase things are changing quickly.
    .debounce(100)
    .share();

export var output = observable;
