import {OmniSharpAtom} from "../../omnisharp.d.ts";
import * as path from "path";
import * as fs from "fs";
import Omni from "../../omni-sharp-server/omni";
import * as _ from "lodash";
import {IDisposable, CompositeDisposable} from "../../Disposable";
import {Observable, Subject} from "@reactivex/rxjs";
import {File} from "atom";
import {ProjectViewModel} from "../../omni-sharp-server/project-view-model";
import {Solution} from "../../omni-sharp-server/solution";

function projectLock(solution: Solution, project: ProjectViewModel<any>, filePath: string) {
    const disposable = new CompositeDisposable();
    const subject = new Subject<string>();
    const file = new File(filePath);
    let onDidChange = file.onDidChange(() => subject.next(filePath)),
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
    disposable.add(subject);

    return {
        observable: Observable.from(subject.throttleTime(30000)),
        dispose: () => disposable.dispose()
    };
}

class FileMonitor implements OmniSharpAtom.IFeature {
    private disposable: CompositeDisposable;
    private filesMap = new WeakMap<ProjectViewModel<any>, IDisposable>();

    public activate() {
        this.disposable = new CompositeDisposable();

        const projectJsonEditors = Omni.configEditors
            .filter(z => _.endsWith(z.getPath(), "project.json"))
            .mergeMap(editor => {
                const s = new Subject<boolean>();
                editor.onDidSave(() => {
                    s.next(false);
                });
                return Observable.from(s);
            });

        /*const pauser = Observable.merge(
            projectJsonEditors.throttleTime(10000),
            Omni.listener.packageRestoreFinished.debounceTime(1000).map(z => true)
        ).startWith(true);*/

        const changes = Observable.merge(Omni.listener.model.projectAdded, Omni.listener.model.projectChanged)
            .map(project => ({ project, filePath: path.join(project.path, "project.lock.json") }))
            .filter(({ filePath}) => fs.existsSync(filePath))
            .mergeMap(({ project, filePath}) =>
                Omni.getSolutionForProject(project).map(solution => ({ solution, project, filePath })))
            .filter(x => !!x.solution)
            .mergeMap(({ solution, project, filePath }) => {
                if (this.filesMap.has(project)) {
                    const v = this.filesMap.get(project);
                    v.dispose();
                }

                const lock = projectLock(solution, project, filePath);
                this.disposable.add(lock);
                this.filesMap.set(project, lock);
                return lock.observable.map(path => ({ solution, filePath }));
            })
            .share();
            /*.pausable(pauser);*/

        this.disposable.add(changes
            .buffer(changes.throttleTime(1000).delay(1000))
            .subscribe(files => {
                _.each(_.groupBy(files, x => x.solution.uniqueId), items => {
                    const solution = items[0].solution;
                    const paths = _.unique(items.map(x => x.filePath));
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
