import {Observable, CompositeDisposable} from "rx";
import Omni = require("../../omni-sharp-server/omni");
import * as _ from 'lodash';
import {OmnisharpClientStatus} from "omnisharp-client";
import {dock} from "../atom/dock";
import {OutputWindow} from '../views/omni-output-pane-view';
import {ViewModel} from "../../omni-sharp-server/view-model";

class ServerInformation implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    public observe: {
        status: Observable<OmnisharpClientStatus>;
        output: Observable<OmniSharp.OutputMessage[]>;
        projects: Observable<OmniSharp.IProjectViewModel[]>;
        model: Observable<ViewModel>;
        updates: Observable<Rx.ObjectObserveChange<ServerInformation>>;
    }

    public model: ViewModel;

    public activate() {
        this.disposable = new CompositeDisposable();

        var status = this.setupStatus();
        var output = this.setupOutput();
        var projects = this.setupProjects();

        Omni.activeModel.subscribe(z => this.model = z);
        this.observe = { status, output, projects, model: Omni.activeModel, updates: Observable.ofObjectChanges(this) };

        this.disposable.add(dock.addWindow('output', 'Omnisharp output', OutputWindow, {}));
    }

    private setupStatus() {
        // Stream the status from the active model
        return Omni.activeModel
            .flatMapLatest(model => model.observe.status)
            .share();
    }

    private setupOutput() {
        // As the active model changes (when we go from an editor for ClientA to an editor for ClientB)
        // We want to make sure that the output field is
        return Omni.activeModel
            .flatMapLatest(z => z.observe.output)
        // This starts us off with the current models output
            .merge(Omni.activeModel.map(z => z.output))
            .startWith([])
            .share();
    }

    private setupProjects() {
        return Omni.activeModel
            .flatMapLatest(model => model.observe.projects)
        // This starts us off with the current projects output
            .merge(Omni.activeModel.map(z => z.projects))
            .share();
    }

    public dispose() {
        this.disposable.dispose();
    }
}

export var server = new ServerInformation;
