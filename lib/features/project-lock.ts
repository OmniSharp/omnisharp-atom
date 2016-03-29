import * as path from "path";
import * as fs from "fs";
import {Omni} from "../server/omni";
import _ from "lodash";
import {Observable, Subject} from "rxjs";
import {CompositeDisposable, IDisposable} from "omnisharp-client";
import {File} from "atom";
import {ProjectViewModel} from "../server/project-view-model";
import {Solution} from "../server/solution";
import {bufferFor} from "../operators/bufferFor";

function projectLock(solution: Solution, project: ProjectViewModel<any>, filePath: string) {
    const disposable = new CompositeDisposable();
    const subject = new Subject<string>();
    let file = new File(filePath),
        onDidChange = file.onDidChange(() => subject.next(filePath)),
        onWillThrowWatchError = file.onWillThrowWatchError(() => {
            subject.next(filePath);
            disposable.remove(onDidChange);
            onDidChange.dispose();
            _.delay(() => {
                onDidChange = file.onDidChange(() => subject.next(filePath));
                disposable.add(onDidChange);
            }, 5000);
        });

    disposable.add(onDidChange);
    disposable.add(onWillThrowWatchError);

    return {
        observable: subject.throttleTime(30000),
        dispose: () => disposable.dispose()
    };
}

class FileMonitor implements IFeature {
    private disposable: CompositeDisposable;
    private filesMap = new WeakMap<ProjectViewModel<any>, IDisposable>();

    public activate() {
        this.disposable = new CompositeDisposable();

        const changes = bufferFor(Observable.merge(Omni.listener.model.projectAdded, Omni.listener.model.projectChanged)
            .map(project => ({ project, filePath: path.join(project.path, "project.lock.json") }))
            .filter(({ filePath}) => fs.existsSync(filePath))
            .flatMap(({ project, filePath}) =>
                Omni.getSolutionForProject(project).map(solution => ({ solution, project, filePath })))
            .filter(x => !!x.solution)
            .flatMap(({ solution, project, filePath }) => {
                if (this.filesMap.has(project)) {
                    const v = this.filesMap.get(project);
                    v.dispose();
                }

                const lock = projectLock(solution, project, filePath);
                this.disposable.add(lock);
                this.filesMap.set(project, lock);
                return lock.observable.map(path => ({ solution, filePath }));
            })
            .share(), 30000);

        this.disposable.add(changes
            .subscribe(changs => {
                _.each(_.groupBy(changs, x => x.solution.uniqueId), chang => {
                    const solution = chang[0].solution;
                    const paths = _.uniq(chang.map(x => x.filePath));
                    solution.filesChanged(paths.map(z => ({ FileName: z })));
                });
            }));

        this.disposable.add(Omni.listener.model.projectRemoved
            .subscribe(project => {
                const removedItem = this.filesMap.get(project);
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
    public title = "Project Monitor";
    public description = "Monitors project.lock.json files for changes outside of atom, and keeps the running solution in sync";
}

export const fileMonitor = new FileMonitor;
