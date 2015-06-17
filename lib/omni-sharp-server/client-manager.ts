import _ = require('lodash')
import path = require('path');
import {Observable, AsyncSubject, RefCountDisposable, Disposable, CompositeDisposable, ReplaySubject, Scheduler} from "rx";
import Solution = require('./client');
import {AtomProjectTracker} from "./atom-projects";
import {ObservationClient, CombinationClient} from './composite-client';
import {findCandidates, DriverState} from "omnisharp-client";

class SolutionManager {
    private _disposable: CompositeDisposable;
    private _configurations = new Set<(solution: Solution) => void>();
    private _atomProjects: AtomProjectTracker;

    private _solutions = new Map<string, Solution>();
    private _solutionProjects = new Map<string, Solution>();
    private _temporarySolutions = new WeakMap<Solution, RefCountDisposable>();

    private _activated = false;
    private _nextIndex = 0;
    private _activeSearch: Rx.IPromise<any> = Promise.resolve(undefined);

    private _activeSolutions: Solution[] = [];
    public get activeClients() { return this._activeSolutions }

    // this solution can be used to observe behavior across all solution.
    private _observation = new ObservationClient();
    public get observationClient() { return this._observation; }

    // this solution can be used to aggregate behavior across all solutions
    private _combination = new CombinationClient();
    public get combinationClient() { return this._combination; }

    private _activeSolution = new ReplaySubject<Solution>(1);
    private _activeSolutionObserable = this._activeSolution.distinctUntilChanged();
    public get activeClient(): Observable<Solution> { return this._activeSolutionObserable; }

    public activate(activeEditor: Observable<Atom.TextEditor>) {
        this._disposable = new CompositeDisposable();
        this._atomProjects = new AtomProjectTracker();
        this._disposable.add(this._atomProjects);

        // monitor atom project paths
        this.subscribeToAtomProjectTracker();
        this.subscribeToInternalEvents();

        // We use the active editor on omnisharpAtom to
        // create another observable that chnages when we get a new solution.
        this._disposable.add(activeEditor
            .where(z => !!z)
            .doOnNext(x => console.log('activeEditor', x))
            .flatMap(z => this.getClientForEditor(z))
            .subscribe(x => this._activeSolution.onNext(x)));

        this._atomProjects.activate();
        this._activated = true;
    }

    public connect() {
        this._solutions.forEach(solution => solution.connect());
    }

    public disconnect() {
        this._solutions.forEach(solution => solution.connect());
    }

    public deactivate() {
        this._activated = false;
        this._disposable.dispose();
    }

    public get connected() {
        var iterator = this._solutions.values();
        var result = iterator.next();
        while (!result.done)
            if (result.value.currentState === DriverState.Connected)
                return true;
    }

    private subscribeToAtomProjectTracker() {
        this._disposable.add(this._atomProjects.removed
            .where(z => this._solutions.has(z))
            .subscribe(project => this.removeSolution(project)));

        this._disposable.add(this._atomProjects.added
            .where(project => !this._solutionProjects.has(project))
            .map(project => {
                return findCandidates(project, console)
                    .flatMap(candidates => addCandidatesInOrder(candidates, candidate => this.addSolution(candidate, { project })));
            })
            .subscribe(candidateObservable => {
                this._activeSearch = this._activeSearch.then(() => candidateObservable.toPromise());
            }));
    }

    private subscribeToInternalEvents() {
    }

    private addSolution(candidate: string, {delay = 1200, temporary = false, project}: { delay?: number; temporary?: boolean; project?: string; }) {
        if (this._solutions.has(candidate))
            return Observable.just(this._solutions.get(candidate));

        if (project && this._solutionProjects.has(project)) {
            return Observable.just(this._solutionProjects.get(project));
        }

        var solution = new Solution({
            projectPath: candidate,
            index: ++this._nextIndex,
            temporary: temporary
        });

        this._configurations.forEach(config => config(solution));
        this._solutions.set(candidate, solution);

        // keep track of the active solutions
        this._observation.add(solution);
        this._combination.add(solution);

        if (temporary) {
            var tempD = Disposable.create(() => { });
            tempD.dispose();
            this._temporarySolutions.set(solution, new RefCountDisposable(tempD));
        }

        this._activeSolutions.push(solution);
        if (this._activeSolutions.length === 1)
            this._activeSolution.onNext(solution);

        // Auto start, with a little delay
        if (atom.config.get('omnisharp-atom.autoStartOnCompatibleFile')) {
            _.delay(() => solution.connect(), delay);
        }

        return this.addSolutionSubscriptions(solution);
    }

    private addSolutionSubscriptions(solution: Solution) {
        var result = new AsyncSubject<Solution>();
        var errorResult = solution.state
            .where(z => z === DriverState.Error)
            .delay(100)
            .take(1);

        errorResult.subscribe(state => this.evictClient(solution));
        errorResult.subscribe(() => result.onCompleted()); // If this solution errors move on to the next

        solution.model.observe.projectAdded.subscribe(project => this._solutionProjects.set(project.path, solution))
        solution.model.observe.projectRemoved.subscribe(project => this._solutionProjects.delete(project.path));

        // Wait for the projects to return from the solution
        solution.model.observe.projects
            .debounce(100)
            .take(1)
            .map(() => solution)
            .timeout(10000) // Wait 10 seconds for the project to load.
            .subscribe(() => {
                // We loaded successfully return the solution
                result.onNext(solution);
                result.onCompleted()
            }, () => {
                // Move along.
                result.onCompleted()
            });

        return result;
    }

    private removeSolution(candidate: string) {
        var solution = this._solutions.get(candidate);

        var refCountDisposable = this._temporarySolutions.has(solution) && this._temporarySolutions.get(solution);
        if (refCountDisposable) {
            refCountDisposable.dispose();
            if (!refCountDisposable.isDisposed) {
                return;
            }

            this.evictClient(solution);
        }

        // keep track of the removed solutions
        solution.disconnect();
    }

    public evictClient(solution: Solution) {
        if (solution.currentState === DriverState.Connected || solution.currentState === DriverState.Connecting) {
            solution.disconnect();
        }

        this._temporarySolutions.has(solution) && this._temporarySolutions.delete(solution);
        this._solutions.has(solution.path) && this._solutions.delete(solution.path);
        _.pull(this._activeSolutions, solution);
        this._observation.remove(solution);
        this._combination.remove(solution);
    }

    private getSolutionForActiveEditor() {
        var editor = atom.workspace.getActiveTextEditor();
        var solution: Observable<Solution>;
        if (editor)
            solution = this.getClientForEditor(editor);

        if (solution) return solution;
        // No active text editor
        return Observable.empty<Solution>();
    }

    public getClientForEditor(editor: Atom.TextEditor) {
        var solution: Observable<Solution>;
        if (!editor)
            // No text editor found
            return Observable.empty<Solution>();

        var isCsx = editor.getGrammar().name === "C# Script File" || _.endsWith(editor.getPath(), '.csx');

        var p = (<any>editor).omniProject;
        // Not sure if we should just add properties onto editors...
        // but it works...
        if (p && this._solutions.has(p)) {
            var solutionValue = this._solutions.get(p);
            // If the solution has disconnected, reconnect it
            if (solutionValue.currentState === DriverState.Disconnected)
            solutionValue.connect();

            // Client is in an invalid state
            if (solutionValue.currentState === DriverState.Error) {
                return Observable.empty<Solution>();
            }

            solution = Observable.just(solutionValue);

            if (solutionValue && this._temporarySolutions.has(solutionValue)) {
                this.setupDisposableForTemporaryClient(solutionValue, editor);
            }

            return solution;
        }

        var location = editor.getPath();
        if (!location) {
            // Text editor not saved yet?
            return Observable.empty<Solution>();
        }

        var [intersect, solutionValue] = this.getSolutionForUnderlyingPath(location, isCsx);
        p = (<any>editor).omniProject = intersect;

        if (solutionValue && this._temporarySolutions.has(solutionValue)) {
            this.setupDisposableForTemporaryClient(solutionValue, editor);
        }

        if (solutionValue)
            return Observable.just(solutionValue);

        return this.findSolutionForUnderlyingPath(location, isCsx)
            .map(z => {
                var [p, solution, temporary] = z;
                (<any>editor).omniProject = p;
                if (temporary) {
                    this.setupDisposableForTemporaryClient(solution, editor);
                }
                return solution;
            });
    }

    private _isPartOfSolution<T>(location: string, cb: (intersect: string, solution: Solution) => T) {
        for (var solution of this._activeSolutions) {
            var paths = solution.model.projects.map(z => z.path);
            var intersect = intersectPath(location, paths);
            if (intersect) {
                return cb(intersect, solution);
            }
        }
    }

    private getSolutionForUnderlyingPath(location: string, isCsx: boolean): [string, Solution] {
        if (location === undefined) {
            return;
        }

        if (isCsx) {
            // CSX are special, and need a solution per directory.
            var directory = path.dirname(location);
            if (this._solutions.has(directory))
                return [directory, this._solutions.get(directory)];

            return [null, null];
        } else {
            var intersect = intersectPath(location, fromIterator(this._solutions.keys()));
            if (intersect) {
                return [intersect, this._solutions.get(intersect)];
            }
        }

        if (!isCsx) {
            // Attempt to see if this file is part a solution
            var r = this._isPartOfSolution(location, (intersect, solution) => <[string, Solution]>[solution.path, solution]);
            if (r) {
                return r;
            }
        }

        return [null, null];
    }

    private findSolutionForUnderlyingPath(location: string, isCsx: boolean): Observable<[string, Solution, boolean]> {
        var directory = path.dirname(location);
        var project = intersectPath(directory, this._atomProjects.paths);
        var subject = new AsyncSubject<[string, Solution, boolean]>();

        var cb = (candidates: string[]) => {
            // We only want to search for solutions after the main solutions have been processed.
            // We can get into this race condition if the user has windows that were opened previously.
            if (!this._activated) {
                _.delay(cb, 5000);
                return;
            }

            if (!isCsx) {
                // Attempt to see if this file is part a solution
                var r = this._isPartOfSolution(location, (intersect, solution) => {
                    subject.onNext([solution.path, solution, false]); // The boolean means this solution is temporary.
                    subject.onCompleted();
                    return true;
                });
                if (r) return;
            }

            var newCandidates = _.difference(candidates, fromIterator(this._solutions.keys()));
            this._activeSearch.then(() => addCandidatesInOrder(newCandidates, candidate => this.addSolution(candidate, { delay: 0, temporary: !project }))
                .subscribeOnCompleted(() => {
                    if (!isCsx) {
                        // Attempt to see if this file is part a solution
                        var r = this._isPartOfSolution(location, (intersect, solution) => {
                            subject.onNext([solution.path, solution, false]); // The boolean means this solution is temporary.
                            subject.onCompleted();
                            return;
                        });
                        if (r) return;
                    }

                    var intersect = intersectPath(location, fromIterator(this._solutions.keys())) || intersectPath(location, this._atomProjects.paths);
                    if (intersect) {
                        subject.onNext([intersect, this._solutions.get(intersect), !project]); // The boolean means this solution is temporary.
                    } else {
                        subject.onError('Could not find a solution for location ' + location);
                    }
                    subject.onCompleted();
                }));
        }

        var foundCandidates = findCandidates(directory, console)
            .subscribe(cb);

        return subject;
    }

    private setupDisposableForTemporaryClient(solution: Solution, editor: Atom.TextEditor) {
        if (solution && !editor['__setup_temp__'] && this._temporarySolutions.has(solution)) {
            var refCountDisposable = this._temporarySolutions.get(solution);
            var disposable = refCountDisposable.getDisposable();
            editor['__setup_temp__'] = true
            editor.onDidDestroy(() => {
                disposable.dispose();
                this.removeSolution(solution.path);
            });
        }
    }

    public registerConfiguration(callback: (solution: Solution) => void) {
        this._configurations.add(callback);
        this._solutions.forEach(solution => callback(solution));
    }
}

function intersectPath(location: string, paths: string[]): string {
    var segments = location.split(path.sep);
    var mappedLocations = segments.map((loc, index) => {
        return _.take(segments, index + 1).join(path.sep);
    });

    // Look for the closest match first.
    mappedLocations.reverse();

    var intersect = (<any>_<string[]>(mappedLocations)).intersection(paths).first();
    if (intersect) {
        return intersect;
    }
}

function addCandidatesInOrder(candidates: string[], cb: (candidate: string) => Rx.Observable<Solution>) {
    var asyncSubject = new AsyncSubject();

    if (!candidates.length) {
        asyncSubject.onNext(candidates)
        asyncSubject.onCompleted();
        return asyncSubject;
    }

    var cds = candidates.slice();

    var candidate = cds.shift();
    var handleCandidate = (candidate: string) => {
        cb(candidate).subscribeOnCompleted(() => {
            if (cds.length) {
                candidate = cds.shift();
                handleCandidate(candidate);
            } else {
                asyncSubject.onNext(candidates)
                asyncSubject.onCompleted();
            }
        })
    }
    handleCandidate(candidate);
    return asyncSubject.asObservable();
}

function fromIterator<T>(iterator: IterableIterator<T>) {
    var items: T[] = [];
    var {done, value} = iterator.next();
    while (!done) {
        items.push(value);

        var {done, value} = iterator.next();
    }

    return items;
}

var instance = new SolutionManager();
export = instance;
