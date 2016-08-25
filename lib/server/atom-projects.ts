import {Subject} from "rxjs";
import {CompositeDisposable, IDisposable} from "ts-disposables";
import {difference} from "lodash";

export class AtomProjectTracker implements IDisposable {
    private _disposable = new CompositeDisposable();
    private _projectPaths: string[] = [];
    private _addedSubject = new Subject<string>();
    private _removedSubject = new Subject<string>();

    public get added() { return this._addedSubject; }
    public get removed() { return this._removedSubject; }
    public get paths() { return this._projectPaths.slice(); }

    public activate() {
        // monitor atom project paths
        this.updatePaths(atom.project.getPaths());
        this._disposable.add(atom.project.onDidChangePaths((paths: string[]) => this.updatePaths(paths)));
    }

    private updatePaths(paths: string[]) {
        const addedPaths = difference(paths, this._projectPaths);
        const removedPaths = difference(this._projectPaths, paths);

        for (let project of addedPaths) this._addedSubject.next(project);
        for (let project of removedPaths) this._removedSubject.next(project);

        this._projectPaths = paths;
    }

    public dispose() {
        this._disposable.dispose();
    }
}
