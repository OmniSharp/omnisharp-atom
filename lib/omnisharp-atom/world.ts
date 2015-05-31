import {Observable} from "rx";
import {diagnostics} from './world/world-diagnostics';
import {output} from './world/world-output';
import {updateState} from './world/world-state';
import {status} from './world/world-status';
import {OmnisharpClientStatus} from "omnisharp-client";
import {findUsages} from "./features/find-usages";

class WorldModel {
    public diagnostics: OmniSharp.Models.DiagnosticLocation[] = [];
    public output: OmniSharp.OutputMessage[] = [];
    public status: OmnisharpClientStatus = <any>{};
    public findUsages = findUsages;

    public isOff: boolean;
    public isConnecting: boolean;
    public isOn: boolean;
    public isReady: boolean;
    public isError: boolean;

    // Enhance in the future, to allow a client to say it supports building (contains an MSBuild project)
    public supportsBuild = false;

    constructor() {
        diagnostics.subscribe(items => this.diagnostics = items);
        output.subscribe(o => this.output = o);
        status.subscribe(s => this.status = s);

        updateState(this);
        this.observe.updates = Observable.ofObjectChanges(this);
    }

    public observe = {
        diagnostics,
        output,
        status,
        updates: <Observable<Rx.ObjectObserveChange<WorldModel>>> null
    }
}

export var world = new WorldModel();
window['world'] = world; //TEMP

export {findUsages};
