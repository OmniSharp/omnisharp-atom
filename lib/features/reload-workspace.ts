import {Observable, Scheduler} from "rxjs";
import {CompositeDisposable} from "omnisharp-client";
import {Omni} from "../server/omni";
import {exists} from "fs";
import {ProjectViewModel} from "../server/project-view-model";
const oexists = Observable.bindCallback(exists);

class ReloadWorkspace implements IFeature {
    private disposable: CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(atom.commands.add(atom.views.getView(atom.workspace), "omnisharp-atom:reload-workspace", () => this.reloadWorkspace().toPromise()));
    }

    public reloadWorkspace() {
        return Omni.solutions
            .flatMap(solution => {
                return Observable.from<ProjectViewModel<any>>(solution.model.projects)
                    .flatMap(x => x.sourceFiles)
                    .observeOn(Scheduler.queue)
                    .concatMap(file => oexists(file).filter(x => !x)
                        .flatMap(() => solution.updatebuffer({ FileName: file, Buffer: "" })));
            });
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = "Reload Workspace";
    public description = "Reloads the workspace, to make sure all the files are in sync.";
}

export const reloadWorkspace = new ReloadWorkspace;
