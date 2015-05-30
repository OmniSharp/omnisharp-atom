import {Observable} from "rx";
import Omni = require("../../omni-sharp-server/omni");
import * as _ from 'lodash';

// Stream the status from the active model
var observable = Omni.activeModel
    .flatMapLatest(model => model.observe.status)
    .share();

export var status = observable;
