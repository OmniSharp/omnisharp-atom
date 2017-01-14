import { File } from 'atom';
import * as fs from 'fs';
import { delay, each, groupBy, map, uniq } from 'lodash';
import * as path from 'path';
import { Observable, Subject } from 'rxjs';
import { CompositeDisposable, IDisposable } from 'ts-disposables';
import { Omni } from '../server/omni';
import { ProjectViewModel } from '../server/project-view-model';
import { Solution } from '../server/solution';

function projectLock(solution: Solution, project: ProjectViewModel<any>, filePath: string) {
    const disposable = new CompositeDisposable();
    const subject = new Subject<string>();
    const file = new File(filePath);
    let onDidChange = file.onDidChange(() => subject.next(filePath));
    const onWillThrowWatchError = file.onWillThrowWatchError(() => {
        subject.next(filePath);
        disposable.remove(onDidChange);
        onDidChange.dispose();
        delay(() => {
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
    public required = false;
    public title = 'Project Monitor';
    public description = 'Monitors project.lock.json files for changes outside of atom, and keeps the running solution in sync';

    private disposable: CompositeDisposable;
    private filesMap = new WeakMap<ProjectViewModel<any>, IDisposable>();

    public activate() {
        this.disposable = new CompositeDisposable();

        const changes = Observable.merge(Omni.listener.model.projectAdded, Omni.listener.model.projectChanged)
            .map(project => ({ project, filePath: path.join(project.path, 'project.lock.json') }))
            .filter(({ filePath }) => fs.existsSync(filePath))
            .flatMap(({ project, filePath }) =>
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
            .share();

        this.disposable.add(changes
            .subscribe(change => {
                const solution = change[0].solution;
                solution.filesChanged({ FileName: change });
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
}

// tslint:disable-next-line:export-name
export const fileMonitor = new FileMonitor();
