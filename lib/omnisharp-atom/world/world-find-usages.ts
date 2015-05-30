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
    .map(z => z.response.QuickFixes)
    .share()

export var findUsages = observable;
