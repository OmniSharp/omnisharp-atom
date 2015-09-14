import _ = require('lodash');
import {CompositeDisposable, AsyncSubject, Observable, Scheduler} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import {exists} from "fs";
var oexists = Observable.fromCallback(exists);

class ReloadWorkspace implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(atom.commands.add(atom.views.getView(atom.workspace), 'omnisharp-atom:reload-workspace', () => this.reloadWorkspace().toPromise()));
    }

    public reloadWorkspace() {
        return Omni.clients
            .flatMap(client => {
                return Observable.from(client.model.projects)
                    .flatMap(x => x.sourceFiles)
                    .observeOn(Scheduler.timeout)
                    .concatMap(file => oexists(file).where(x => !x)
                        .flatMap(() => client.updatebuffer({ FileName: file, Buffer: '' })));
            });
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = 'Reload Workspace';
    public description = 'Reloads the workspace, to make sure all the files are in sync.';
}

export var reloadWorkspace = new ReloadWorkspace;
