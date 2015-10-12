import path = require('path');
import fs = require("fs");
import Omni = require('../../omni-sharp-server/omni');
import _ = require('lodash');
import {Observable, Disposable, CompositeDisposable, Subject} from "rx";
import {File} from "atom";
import {ProjectViewModel} from "../../omni-sharp-server/project-view-model";
import {Solution} from "../../omni-sharp-server/solution";

function projectLock(solution: Solution, project: ProjectViewModel<any>, filePath: string) {
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
    disposable.add(subject);

    return {
        observable: subject.throttle(30000).asObservable(),
        dispose: () => disposable.dispose()
    };
}

class FileMonitor implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    private filesMap = new WeakMap<ProjectViewModel<any>, Rx.IDisposable>();

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
                projectJsonEditors.throttle(10000),
                Omni.listener.packageRestoreFinished.debounce(1000).map(z => true)
            ).startWith(true);

        var changes = Observable.merge(Omni.listener.model.projectAdded, Omni.listener.model.projectChanged)
            .map(project => ({ project, filePath: path.join(project.path, "project.lock.json") }))
            .where(({ project, filePath}) => fs.existsSync(filePath))
            .flatMap(({ project, filePath}) =>
                Omni.getSolutionForProject(project).map(solution => ({ solution, project, filePath })))
            .where(x => !!x.solution)
            .flatMap(({ solution, project, filePath }) => {
                if (this.filesMap.has(project)) {
                    var v = this.filesMap.get(project);
                    v.dispose();
                }

                var lock = projectLock(solution, project, filePath);
                this.disposable.add(lock);
                this.filesMap.set(project, lock);
                return lock.observable.map(path => ({ solution, filePath }));
            })
            .share()
            .pausable(pauser);

        this.disposable.add(changes
            .buffer(changes.throttle(1000), () => Observable.timer(1000))
            .subscribe(changes => {
                _.each(_.groupBy(changes, x => x.solution.uniqueId), changes => {
                    var solution = changes[0].solution;
                    var paths = _.unique(changes.map(x => x.filePath));
                    solution.filesChanged(paths.map(z => ({ FileName: z })));
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

    public required = false;
    public title = 'Project Monitor';
    public description = 'Monitors project.lock.json files for changes outside of atom, and keeps the running solution in sync';
}

export var fileMonitor = new FileMonitor;
