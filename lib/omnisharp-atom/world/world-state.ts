import {Observable} from "rx";
import Omni = require("../../omni-sharp-server/omni");
import * as _ from 'lodash';

export function updateState(model: {
    isOff: boolean;
    isConnecting: boolean;
    isOn: boolean;
    isReady: boolean;
    isError: boolean;
}) {

    return Omni.activeModel
        .subscribe(newModel => {
            newModel.updated        // Track changes to the model
                .bufferWithTime(50) // Group the changes so that we capture all the differences at once.
                .subscribe(items => {
                var updates = _(items)
                    // gather the updates
                    .filter(item => _.contains(['isOff', 'isConnecting', 'isOn', 'isReady', 'isError'], item.name))
                    .value();

                if (updates.length) {
                    // Apply the updates if found
                    _.each(updates, item => {
                        model[item.name] = newModel[item.name];
                    })
                }
            });
        });
}
