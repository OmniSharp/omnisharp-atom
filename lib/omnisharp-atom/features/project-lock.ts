import path = require('path');
import fs = require("fs");
import Omni = require('../../omni-sharp-server/omni');
import _ = require('lodash');
import {Observable, Disposable, CompositeDisposable, Subject} from "rx";
import {File} from "atom";
import {ProjectViewModel} from "../../omni-sharp-server/view-model";
import Client = require("../../omni-sharp-server/client");

function projectLock(solution: Client, project: ProjectViewModel, filePath: string) {
    var disposable = new CompositeDisposable();
    var subject = new Subject<string>();
    var file = new File(filePath),
        onDidChange = file.onDidChange(() => subject.onNext(filePath)),
        onWillThrowWatchError = file.onWillThrowWatchError(() => {
            subject.onNext(filePath);
            onDidChange.dispose();
            _.delay(() => {
                onDidChange = file.onDidChange(() => subject.onNext(filePath))
            }, 1000);
        });

    return {
        observable: subject.throttleFirst(2000).asObservable(),
        dispose: () => disposable.dispose()
    };
}

class FileMonitor implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    private filesMap = new WeakMap<ProjectViewModel, Rx.IDisposable>();

    public activate() {
        this.disposable = new CompositeDisposable();
        var changes = Omni.listener.model.projectAdded
            .map(project => ({ project, filePath: path.join(project.path, "project.lock.json") }))
            .where(({ project, filePath}) => fs.existsSync(filePath))
            .flatMap(({ project, filePath}) =>
                Omni.getClientForProject(project).map(client => ({ client, project, filePath })))
            .flatMap(({ client, project, filePath }) => {
                var lock = projectLock(client, project, filePath);
                this.disposable.add(lock);
                this.filesMap.set(project, lock);
                return lock.observable.map(path => ({ client, filePath }));
            });

        this.disposable.add(changes
            .buffer(changes.throttleFirst(1000), () => Observable.timer(1000))
            .subscribe(changes => {
                _.each(_.groupBy(changes, x => x.client.uniqueId), changes => {
                    var client = changes[0].client;
                    var paths = _.unique(changes.map(x => x.filePath));
                    client.filesChanged(paths.map(z => ({ FileName: z })));
                });
            }));

        this.disposable.add(Omni.listener.model.projectRemoved
            .subscribe(project => {
                var removedItem = this.filesMap.get(project);
                if (removedItem) {
                    this.filesMap.delete(project);
                    removedItem.dispose();
                }
            }));
    }

    public dispose() {
        this.disposable.dispose();
    }
}

export var fileMonitor = new FileMonitor;
