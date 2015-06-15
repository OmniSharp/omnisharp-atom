import {CompositeDisposable, Subject} from "rx";


export class AtomProjectTracker implements Rx.IDisposable {
    private _disposable = new CompositeDisposable();
    private _projectPaths: string[] = [];
    private _addedSubject = new Subject<string>();
    private _removedSubject = new Subject<string>();

    public get added() { return <Rx.Observable<string>>this._addedSubject; }
    public get removed() { return <Rx.Observable<string>>this._removedSubject; }
    public get paths() { return this._projectPaths.slice(); }

    public activate() {
        // monitor atom project paths
        this.updatePaths(atom.project.getPaths());
        this._disposable.add(atom.project.onDidChangePaths((paths) => this.updatePaths(paths)));
    }

    private updatePaths(paths: string[]) {
        var addedPaths = _.difference(paths, this._projectPaths);
        var removedPaths = _.difference(this._projectPaths, paths);

        _.each(addedPaths, project => this._addedSubject.onNext(project));
        _.each(removedPaths, project => this._removedSubject.onNext(project));

        this._projectPaths = paths;
    }

    public dispose() {
        this._disposable.dispose();
    }
}
