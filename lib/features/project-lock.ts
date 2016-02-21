import * as path from "path";
import * as fs from "fs";
import {Omni} from "../server/omni";
import _ from "lodash";
import {Observable, CompositeDisposable, Subject} from "rx";
import {File} from "atom";
import {ProjectViewModel} from "../server/project-view-model";
import {Solution} from "../server/solution";

function projectLock(solution: Solution, project: ProjectViewModel<any>, filePath: string) {
    const disposable = new CompositeDisposable();
    const subject = new Subject<string>();
    let file = new File(filePath),
        onDidChange = file.onDidChange(() => subject.onNext(filePath)),
        onWillThrowWatchError = file.onWillThrowWatchError(() => {
            subject.onNext(filePath);
            disposable.remove(onDidChange);
            onDidChange.dispose();
            _.delay(() => {
                onDidChange = file.onDidChange(() => subject.onNext(filePath));
                disposable.add(onDidChange);
            }, 5000);
        });

    disposable.add(onDidChange);
    disposable.add(onWillThrowWatchError);

    return {
        observable: subject.throttle(30000).asObservable(),
        dispose: () => disposable.dispose()
    };
}

class FileMonitor implements IFeature {
    private disposable: CompositeDisposable;
    private filesMap = new WeakMap<ProjectViewModel<any>, Rx.IDisposable>();

    public activate() {
        this.disposable = new CompositeDisposable();

        const projectJsonEditors = Omni.configEditors
            .where(z => _.endsWith(z.getPath(), "project.json"))
            .flatMap(editor => {
                const s = new Subject<boolean>();
                editor.onDidSave(() => {
                    s.onNext(false);
                });
                return s.asObservable();
            });

        const pauser = Observable.merge(
                projectJsonEditors.throttle(10000),
                Omni.listener.packageRestoreFinished.debounce(1000).map(z => true)
            ).startWith(true);

        const changes = Observable.merge(Omni.listener.model.projectAdded, Omni.listener.model.projectChanged)
            .map(project => ({ project, filePath: path.join(project.path, "project.lock.json") }))
            .where(({ filePath}) => fs.existsSync(filePath))
            .flatMap(({ project, filePath}) =>
                Omni.getSolutionForProject(project).map(solution => ({ solution, project, filePath })))
            .where(x => !!x.solution)
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
            .share()
            .pausable(pauser);

        this.disposable.add(changes
            .buffer(changes.throttle(1000), () => Observable.timer(1000))
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
