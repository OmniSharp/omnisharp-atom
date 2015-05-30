import {Observable} from "rx";
import {diagnostics} from './world/world-diagnostics';
import {output} from './world/world-output';
import {updateState} from './world/world-state';
import {status} from './world/world-status';
import {findUsages} from './world/world-find-usages';
import {OmnisharpClientStatus} from "omnisharp-client";


class World {
    //public diagnostics: OmniSharp.Models.DiagnosticLocation[] = [];
    //public output: OmniSharp.OutputMessage[] = [];
    //public findUsages: OmniSharp.Models.QuickFix[] = <any>{};
    public status: OmnisharpClientStatus = <any>{};

    public isOff: boolean;
    public isConnecting: boolean;
    public isOn: boolean;
    public isReady: boolean;
    public isError: boolean;

    constructor() {
        //diagnostics.subscribe(items => this.diagnostics = items);
        //output.subscribe(o => this.output = o);
        //findUsages.subscribe(s => this.findUsages = s);
        status.subscribe(s => this.status = s);

        updateState(this);
        this.observe.updates = Observable.ofObjectChanges(this);
    }

    public observe = {
        diagnostics,
        output,
        status,
        findUsages,
        updates: <Observable<Rx.ObjectObserveChange<World>>> null
    }
}

export var world = new World();
window['world'] = world; //TEMP
