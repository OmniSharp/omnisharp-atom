import {CompositeDisposable} from "../../Disposable";
import {Observable} from "@reactivex/rxjs";
import Omni from "../../omni-sharp-server/omni";
import * as _ from "lodash";
import {OmnisharpClientStatus} from "omnisharp-client";
import {dock} from "../atom/dock";
import {OutputWindow} from "../views/omni-output-pane-view";
import {ViewModel} from "../../omni-sharp-server/view-model";

class ServerInformation implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    public observe: {
        status: Observable<OmnisharpClientStatus>;
        output: Observable<OmniSharp.OutputMessage[]>;
        projects: Observable<OmniSharp.IProjectViewModel[]>;
        model: Observable<ViewModel>;
    }

    public model: ViewModel;

    public activate() {
        this.disposable = new CompositeDisposable();

        const status = this.setupStatus();
        const output = this.setupOutput();
        const projects = this.setupProjects();

        this.disposable.add(Omni.activeModel.subscribe(z => this.model = z));
        this.observe = { status, output, projects, model: Omni.activeModel };

        this.disposable.add(dock.addWindow("output", "Omnisharp output", OutputWindow, {}));
    }

    private setupStatus() {
        // Stream the status from the active model
        return Omni.activeModel
            .switchMap(model => model.observe.status)
            .share();
    }

    private setupOutput() {
        // As the active model changes (when we go from an editor for ClientA to an editor for ClientB)
        // We want to make sure that the output field is
        return Omni.activeModel
            .switchMap(z => z.observe.output)
        // This starts us off with the current models output
            .merge(Omni.activeModel.map(z => z.output))
            .startWith([])
            .share();
    }

    private setupProjects() {
        return Omni.activeModel
            .switchMap(model => model.observe.projects)
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
