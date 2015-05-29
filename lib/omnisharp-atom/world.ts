import {Observable} from "rx";
import {diagnostics} from './world/diagnostics';

class World {
    public updated: Observable<Rx.ObjectObserveChange<World>>;
    public diagnostics: OmniSharp.Models.DiagnosticLocation[] = [];

    constructor() {
        this.updated = Observable.ofObjectChanges(this);
        diagnostics.subscribe(items => this.diagnostics = items);
    }

    public observe = {
        diagnostics
    };
}

export var world = new World();
