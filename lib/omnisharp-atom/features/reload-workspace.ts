import * as _ from "lodash";
import {CompositeDisposable, AsyncSubject, Observable, Scheduler} from "@reactivex/rxjs";
import Omni from "../../omni-sharp-server/omni";
import {exists} from "fs";
const oexists = Observable.fromCallback(exists);

class ReloadWorkspace implements OmniSharpAtom.IFeature {
    private disposable: CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(atom.commands.add(atom.views.getView(atom.workspace), "omnisharp-atom:reload-workspace", () => this.reloadWorkspace().toPromise()));
    }

    public reloadWorkspace() {
        return Omni.solutions
            .mergeMap(solution => {
                return Observable.from(solution.model.projects)
                    .mergeMap(x => x.sourceFiles)
                    .observeOn(Scheduler.nextTick)
                    .concatMap(file => oexists(file).filter(x => !x)
                        .mergeMap(() => solution.updatebuffer({ FileName: file, Buffer: "" })));
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
