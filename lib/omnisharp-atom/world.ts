import * as _ from 'lodash';
import Omni = require('../omni-sharp-server/omni');
import {Observable} from "rx";
import {findUsages} from "./features/find-usages";
import {codeCheck} from "./features/code-check";
import {server} from "./features/server-information";
import {solutionInformation} from "./features/solution-information";

var statefulProperties = ['isOff', 'isConnecting', 'isOn', 'isReady', 'isError'];

class WorldModel {
    public status = <any>{};

    public findUsages = findUsages;
    public codeCheck = codeCheck;
    public server = server;
    public solutions = solutionInformation;

    public isOff: boolean;
    public isConnecting: boolean;
    public isOn: boolean;
    public isReady: boolean;
    public isError: boolean;

    // Enhance in the future, to allow a client to say it supports building (contains an MSBuild project)
    public supportsBuild = false;

    constructor() {
    }

    public activate() {
        this.setupState();
        this.observe = {
            get diagnostics() { return codeCheck.observe.diagnostics },
            get output() { return server.observe.output },
            get status() { return server.observe.status },
            updates: Observable.ofObjectChanges(this)
        };
    }

    private setupState() {
        Omni.activeModel
            .subscribe(newModel => {
                // Update on change
                _.each(statefulProperties, property => { this[property] = newModel[property] });
            });

        Omni.activeModel
            .flatMapLatest(newModel =>
                newModel.observe.updates// Track changes to the model
                    .buffer(newModel.observe.updates.throttleFirst(100), () => Observable.timer(100)) // Group the changes so that we capture all the differences at once.
                    .map(items => _.filter(items, item => _.contains(statefulProperties, item.name)))
                    .where(z => z.length > 0)
                    .map(items => ({ items, newModel })))
            .subscribe(ctx => {
                var {items, newModel} = ctx;
                // Apply the updates if found
                _.each(items, item => {
                    this[item.name] = newModel[item.name];
                })
            });
    }

    public observe: {
        // TODO: Do these make sense, or should we just do `world.log.observe.output`?
        diagnostics: typeof codeCheck.observe.diagnostics;
        output: typeof server.observe.output;
        status: typeof server.observe.status;
        updates: Observable<Rx.ObjectObserveChange<WorldModel>>;
    }
}

var world = new WorldModel();
window['world'] = world; //TEMP

export {world, findUsages, codeCheck, server, solutionInformation};
