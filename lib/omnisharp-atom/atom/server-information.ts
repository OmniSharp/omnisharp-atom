import {Observable, CompositeDisposable} from "rx";
import {Omni} from "../../omni-sharp-server/omni";
import {OmnisharpClientStatus} from "omnisharp-client";
import {dock} from "../atom/dock";
import {OutputWindow} from "../views/omni-output-pane-view";
import {ViewModel} from "../../omni-sharp-server/view-model";
import {IProjectViewModel} from "../../omnisharp";

class ServerInformation implements IFeature {
    private disposable: CompositeDisposable;
    public observe: {
        status: Observable<OmnisharpClientStatus>;
        output: Observable<OutputMessage[]>;
        projects: Observable<IProjectViewModel[]>;
        model: Observable<ViewModel>;
        updates: Observable<Rx.ObjectObserveChange<ServerInformation>>;
    };

    public model: ViewModel;

    public activate() {
        this.disposable = new CompositeDisposable();

        const status = this.setupStatus();
        const output = this.setupOutput();
        const projects = this.setupProjects();

        this.disposable.add(Omni.activeModel.subscribe(z => this.model = z));
        this.observe = { status, output, projects, model: Omni.activeModel, updates: Observable.ofObjectChanges(this) };

        this.disposable.add(dock.addWindow("output", "Omnisharp output", OutputWindow, {}));
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

    public required = true;
    public title = "Server Information";
    public description = "Monitors server output and status.";
}

export const server = new ServerInformation;
