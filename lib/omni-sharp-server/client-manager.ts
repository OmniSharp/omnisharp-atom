import _ = require('lodash')
import path = require('path');
import {Observable, AsyncSubject, RefCountDisposable, Disposable, CompositeDisposable, BehaviorSubject, Scheduler, Subject} from "rx";
import Solution = require('./client');
import {AtomProjectTracker} from "./atom-projects";
import {ObservationClient, CombinationClient} from './composite-client';
import {findCandidates, DriverState} from "omnisharp-client";
import {GenericSelectListView} from "../omnisharp-atom/views/generic-list-view";

var openSelectList: GenericSelectListView;
class SolutionManager {
    public _unitTestMode_ = false;
    private _disposable: CompositeDisposable;
    private _solutionDisposable: CompositeDisposable;
    private _atomProjects: AtomProjectTracker;

    private _configurations = new Set<(solution: Solution) => void>();
    private _solutions = new Map<string, Solution>();
    private _solutionProjects = new Map<string, Solution>();
    private _temporarySolutions = new WeakMap<Solution, RefCountDisposable>();
    private _disposableSolutionMap = new WeakMap<Solution, Disposable>();
    private _findSolutionCache = new Map<string, Observable<[string, Solution, boolean]>>();
    private _candidateFinderCache = new Set<string>();

    private _activated = false;
    private _nextIndex = 0;
    private _activeSearch: Rx.IPromise<any>;

    private _activeSolutions: Solution[] = [];
    public get activeClients() {
        return this._activeSolutions;
    }

    // this solution can be used to observe behavior across all solution.
    private _observation = new ObservationClient();
    public get observationClient() {
        return this._observation;
    }

    // this solution can be used to aggregate behavior across all solutions
    private _combination = new CombinationClient();
    public get combinationClient() {
        return this._combination;
    }

    private _activeSolution = new BehaviorSubject<Solution>(null);
    private _activeSolutionObserable = this._activeSolution.shareReplay(1).distinctUntilChanged().where(z => !!z);
    public get activeClient() {
        return this._activeSolutionObserable;
    }

    private _activatedSubject = new Subject<boolean>();
    private get activatedSubject() {
        return this._activatedSubject;
    }

    public activate(activeEditor: Observable<Atom.TextEditor>) {
        if (this._activated) return;

        this._disposable = new CompositeDisposable();
        this._solutionDisposable = new CompositeDisposable();
        this._atomProjects = new AtomProjectTracker();
        this._disposable.add(this._atomProjects);

        this._activeSearch = Promise.resolve(undefined);

        // monitor atom project paths
        this.subscribeToAtomProjectTracker();

        // We use the active editor on omnisharpAtom to
        // create another observable that chnages when we get a new solution.
        this._disposable.add(activeEditor
            .where(z => !!z)
            .flatMap(z => this.getClientForEditor(z))
            .subscribe(x => this._activeSolution.onNext(x)));

        this._atomProjects.activate();
        this._activated = true;
        this.activatedSubject.onNext(true);
        this._disposable.add(this._solutionDisposable);
    }

    public connect() {
        this._solutions.forEach(solution => solution.connect());
    }

    public disconnect() {
        this._solutions.forEach(solution => solution.disconnect());
    }

    public deactivate() {
        if (this._unitTestMode_) return;
        this._activated = false;
        this._disposable.dispose();

        this._solutions.clear();
        this._solutionProjects.clear();
        this.disconnect();
        this._findSolutionCache.clear();
        //this._temporarySolutions.clear();
        //this._disposableSolutionMap.clear();
    }

    public get connected() {
        var iterator = this._solutions.values();
        var result = iterator.next();
        while (!result.done)
            if (result.value.currentState === DriverState.Connected)
                return true;
        return false;
    }

    private subscribeToAtomProjectTracker() {
        this._disposable.add(this._atomProjects.removed
            .where(z => this._solutions.has(z))
            .subscribe(project => this.removeSolution(project)));

        this._disposable.add(this._atomProjects.added
            .where(project => !this._solutionProjects.has(project))
            .map(project => {
                return this.candidateFinder(project, console)
                    .flatMap(candidates => addCandidatesInOrder(candidates, candidate => this.addSolution(candidate, { project })));
            })
            .subscribe(candidateObservable => {
                this._activeSearch = this._activeSearch.then(() => candidateObservable.toPromise());
            }));
    }

    private findRepositoryForPath(workingPath: string) {
        if (atom.project) return _.find(atom.project.getRepositories(), (repo: any) => repo && path.normalize(repo.getWorkingDirectory()) === path.normalize(workingPath));
    }

    private addSolution(candidate: string, {temporary = false, project}: { delay?: number; temporary?: boolean; project?: string; }) {
        var projectPath = candidate;
        if (_.endsWith(candidate, '.sln')) {
            candidate = path.dirname(candidate);
        }

        if (this._solutions.has(candidate))
            return Observable.just(this._solutions.get(candidate));

        if (project && this._solutionProjects.has(project)) {
            return Observable.just(this._solutionProjects.get(project));
        }

        var solution = new Solution({
            projectPath: projectPath,
            index: ++this._nextIndex,
            temporary: temporary,
            repository: this.findRepositoryForPath(candidate)
        });

        var cd = new CompositeDisposable();

        this._solutionDisposable.add(cd);
        this._disposableSolutionMap.set(solution, cd);
        cd.add(Disposable.create(() => {
            _.pull(this._activeSolutions, solution);
            this._solutions.delete(candidate);

            if (this._temporarySolutions.has(solution)) {
                this._temporarySolutions.delete(solution);
            }

            if (this._activeSolution.getValue() === solution) {
                this._activeSolution.onNext(this._activeSolutions.length ? this._activeSolutions[0] : null);
            }
        }));
        cd.add(solution);

        this._configurations.forEach(config => config(solution));
        this._solutions.set(candidate, solution);

        // keep track of the active solutions
        cd.add(this._observation.add(solution));
        cd.add(this._combination.add(solution));

        if (temporary) {
            var tempD = Disposable.create(() => { });
            tempD.dispose();
            this._temporarySolutions.set(solution, new RefCountDisposable(tempD));
        }

        this._activeSolutions.push(solution);
        if (this._activeSolutions.length === 1)
            this._activeSolution.onNext(solution);

        // Auto start, with a little delay
        /*if (atom.config.get('omnisharp-atom.autoStartOnCompatibleFile')) {
            _.defer(() => solution.connect());
        }*/

        var result = this.addSolutionSubscriptions(solution, cd);
        solution.connect();
        return result;
    }

    private addSolutionSubscriptions(solution: Solution, cd: CompositeDisposable) {
        var result = new AsyncSubject<Solution>();
        var errorResult = solution.state
            .where(z => z === DriverState.Error)
            .delay(100)
            .take(1);

        cd.add(errorResult.subscribe(() => result.onCompleted())); // If this solution errors move on to the next

        cd.add(solution.model.observe.projectAdded.subscribe(project => this._solutionProjects.set(project.path, solution)))
        cd.add(solution.model.observe.projectRemoved.subscribe(project => this._solutionProjects.delete(project.path)));

        // Wait for the projects to return from the solution
        cd.add(solution.model.observe.projects
            .debounce(100)
            .take(1)
            .map(() => solution)
            .timeout(15000, Scheduler.timeout) // Wait 30 seconds for the project to load.
            .subscribe(() => {
                // We loaded successfully return the solution
                result.onNext(solution);
                result.onCompleted();
            }, () => {
                // Move along.
                result.onCompleted();
            }));

        return result;
    }

    private removeSolution(candidate: string) {
        if (this._unitTestMode_) return;

        if (_.endsWith(candidate, '.sln')) {
            candidate = path.dirname(candidate);
        }

        var solution = this._solutions.get(candidate);

        var refCountDisposable = solution && this._temporarySolutions.has(solution) && this._temporarySolutions.get(solution);
        if (refCountDisposable) {
            refCountDisposable.dispose();
            if (!refCountDisposable.isDisposed) {
                return;
            }
        }

        // keep track of the removed solutions
        if (solution) {
            solution.disconnect();
            var disposable = this._disposableSolutionMap.get(solution);
            if (disposable) disposable.dispose();
        }
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

    public getClientForPath(path: string) {
        var solution: Observable<Solution>;
        if (!path)
            // No text editor found
            return Observable.empty<Solution>();

        var isCsx = _.endsWith(path, '.csx');

        var location = path;
        if (!location) {
            // Text editor not saved yet?
            return Observable.empty<Solution>();
        }

        var [intersect, solutionValue] = this.getSolutionForUnderlyingPath(location, isCsx);

        if (solutionValue)
            return Observable.just(solutionValue);

        return this.findSolutionForUnderlyingPath(location, isCsx)
            .map(z => {
                var [p, solution, temporary] = z;
                return solution;
            });
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
            if (solutionValue.currentState === DriverState.Disconnected && atom.config.get('omnisharp-atom.autoStartOnCompatibleFile'))
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
        (<any>editor).__omniClient__ = solutionValue;

        if (solutionValue && this._temporarySolutions.has(solutionValue)) {
            this.setupDisposableForTemporaryClient(solutionValue, editor);
        }

        if (solutionValue)
            return Observable.just(solutionValue);

        return this.findSolutionForUnderlyingPath(location, isCsx)
            .map(z => {
                var [p, solution, temporary] = z;
                (<any>editor).omniProject = p;
                (<any>editor).__omniClient__ = solution;
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
        var subject = new AsyncSubject<[string, Solution, boolean]>();

        if (!this._activated) {
            return this.activatedSubject.take(1)
                .flatMap(() => this.findSolutionForUnderlyingPath(location, isCsx));
        }

        if (this._findSolutionCache.has(location)) {
            return this._findSolutionCache.get(location);
        }

        this._findSolutionCache.set(location, subject);
        subject.tapOnCompleted(() => this._findSolutionCache.delete(location));

        var project = intersectPath(directory, this._atomProjects.paths);
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
            this._activeSearch.then(() => addCandidatesInOrder(newCandidates, candidate => this.addSolution(candidate, { temporary: !project }))
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

        var foundCandidates = this.candidateFinder(directory, console)
            .subscribe(cb);

        return subject;
    }

    private candidateFinder(directory: string, console: any) {
        return findCandidates(directory, console)
            .flatMap(candidates => {
                var slns = _.filter(candidates, x => _.endsWith(x, '.sln'));
                if (slns.length > 1) {
                    var items = _.difference(candidates, slns);
                    var asyncResult = new AsyncSubject<string[]>();
                    asyncResult.onNext(items);

                    // handle multiple solutions.
                    var listView = new GenericSelectListView('',
                        slns.map(x => ({ displayName: x, name: x })),
                        (result: any) => {
                            items.unshift(result);
                            _.each(candidates, x => this._candidateFinderCache.add(x));

                            asyncResult.onCompleted();
                        },
                        () => {
                            asyncResult.onCompleted();
                        }
                    );

                    listView.message.text('Please select a solution to load.');

                    // Show the view
                    if (openSelectList) {
                        openSelectList.onClosed.subscribe(() => {
                            if (!_.any(slns, x => this._candidateFinderCache.has(x)))
                                _.defer(() => listView.toggle());
                            else
                                asyncResult.onCompleted();
                        });
                    } else {
                        _.defer(() => listView.toggle());
                    }

                    asyncResult.doOnCompleted(() => openSelectList = null);
                    openSelectList = listView;

                    return asyncResult;
                } else {
                    return Observable.just(candidates);
                }
            });
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
