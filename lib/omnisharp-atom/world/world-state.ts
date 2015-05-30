import {Observable} from "rx";
import Omni = require("../../omni-sharp-server/omni");
import * as _ from 'lodash';

var statefulProperties = ['isOff', 'isConnecting', 'isOn', 'isReady', 'isError'];

export function updateState(model: {
    isOff: boolean;
    isConnecting: boolean;
    isOn: boolean;
    isReady: boolean;
    isError: boolean;
}) {
    Omni.activeModel
        .subscribe(newModel => {
            // Update on change
            _.each(statefulProperties, property => { model[property] = newModel[property] });
        });

    Omni.activeModel
        .flatMapLatest(newModel =>
            newModel.observe.updates// Track changes to the model
                .bufferWithTime(50) // Group the changes so that we capture all the differences at once.
                .map(items => _.filter(items, item => _.contains(statefulProperties, item.name)))
                .where(z => z.length > 0)
                .map(items => ({ items, newModel })))
        .subscribe(ctx => {
            var {items, newModel} = ctx;
            // Apply the updates if found
            _.each(items, item => {
                model[item.name] = newModel[item.name];
            })
        });
}
