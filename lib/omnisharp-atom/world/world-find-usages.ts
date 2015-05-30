import {Observable} from "rx";
import Omni = require("../../omni-sharp-server/omni");
import * as _ from 'lodash';

var observable = Observable.merge(
    // Listen to find usages
    Omni.listener.observeFindusages,
    // We also want find implementations, where we found more than one
    Omni.listener.observeFindimplementations
        .where(z => z.response.QuickFixes.length > 1)
    )
    // For the UI we only need the qucik fixes.
    .map(z => z.response.QuickFixes || [])
    .share()

export var findUsages = observable;
// NOTE: We cannot do the same for find implementations because find implementation
//      just goes to the item if only one comes back.
export var openUsages = Omni.listener.requests.where(z => z.command === "findusages");
export var resetUsages = Omni.listener.requests.where(z => z.command === "findimplementations" || z.command === "findusages");
