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
            disposable.remove(onDidChange);
            onDidChange.dispose();
            _.delay(() => {
                onDidChange = file.onDidChange(() => subject.onNext(filePath))
                disposable.add(onDidChange);
            }, 5000);
        });

    disposable.add(onDidChange);
    disposable.add(onWillThrowWatchError);

    return {
        observable: subject.throttleFirst(30000).asObservable(),
        dispose: () => disposable.dispose()
    };
}

class FileMonitor implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    private filesMap = new WeakMap<ProjectViewModel, Rx.IDisposable>();

    public activate() {
        this.disposable = new CompositeDisposable();

        var projectJsonEditors = Omni.configEditors
            .where(z => _.endsWith(z.getPath(), 'project.json'))
            .flatMap(editor => {
                var s = new Subject<boolean>();
                editor.onDidSave(() => {
                    s.onNext(false);
                });
                return s.asObservable();
            });

        var pauser = Observable.merge(
                projectJsonEditors.throttleFirst(10000),
                Omni.listener.packageRestoreFinished.debounce(1000).map(z => true)
            ).startWith(true);

        var changes = Observable.merge(Omni.listener.model.projectAdded, Omni.listener.model.projectChanged)
            .map(project => ({ project, filePath: path.join(project.path, "project.lock.json") }))
            .where(({ project, filePath}) => fs.existsSync(filePath))
            .flatMap(({ project, filePath}) =>
                Omni.getClientForProject(project).map(client => ({ client, project, filePath })))
            .flatMap(({ client, project, filePath }) => {
                if (this.filesMap.has(project)) {
                    var v = this.filesMap.get(project);
                    v.dispose();
                }

                var lock = projectLock(client, project, filePath);
                this.disposable.add(lock);
                this.filesMap.set(project, lock);
                return lock.observable.map(path => ({ client, filePath }));
            })
            .share()
            .pausable(pauser);

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
