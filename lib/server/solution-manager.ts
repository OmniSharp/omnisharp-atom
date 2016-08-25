import _ from "lodash";
import * as path from "path";
import {Observable, AsyncSubject, BehaviorSubject, Scheduler, Subject} from "rxjs";
import {RefCountDisposable, IDisposable, Disposable, CompositeDisposable} from "ts-disposables";
import {Solution} from "./solution";
import {AtomProjectTracker} from "./atom-projects";
import {SolutionObserver, SolutionAggregateObserver} from "./composite-solution";
import {DriverState, findCandidates, Runtime, Candidate} from "omnisharp-client";
import {GenericSelectListView} from "../views/generic-list-view";
import {OmnisharpTextEditor, isOmnisharpTextEditor, OmnisharpEditorContext} from "./omnisharp-text-editor";

type REPOSITORY = { getWorkingDirectory(): string; };
const SOLUTION_LOAD_TIME = 30000;

let openSelectList: GenericSelectListView;
class SolutionInstanceManager {
    /* tslint:disable:variable-name */
    public _unitTestMode_ = false;
    public _kick_in_the_pants_ = false;

    private get logger() {
        if (this._unitTestMode_ || this._kick_in_the_pants_) {
            return {
                log: () => {/* */ },
                error: () => {/* */ }
            };
        }

        return console;
    }
    /* tslint:enable:variable-name */
    private _disposable: CompositeDisposable;
    private _solutionDisposable: CompositeDisposable;
    private _atomProjects: AtomProjectTracker;

    private _configurations = new Set<(solution: Solution) => void>();
    private _solutions = new Map<string, Solution>();
    private _solutionProjects = new Map<string, Solution>();
    private _temporarySolutions = new WeakMap<Solution, RefCountDisposable>();
    private _disposableSolutionMap = new WeakMap<Solution, IDisposable>();
    private _findSolutionCache = new Map<string, Observable<Solution>>();
    private _candidateFinderCache = new Set<string>();

    private _activated = false;
    private _nextIndex = 0;
    private _activeSearch: Promise<any>;

    // These extensions only support server per folder, unlike normal cs files.
    private _specialCaseExtensions = [".csx", /*".cake"*/];
    public get __specialCaseExtensions() { return this._specialCaseExtensions; }

    private _activeSolutions: Solution[] = [];
    public get activeSolutions() {
        return this._activeSolutions;
    }

    // this solution can be used to observe behavior across all solution.
    private _observation = new SolutionObserver();
    public get solutionObserver() {
        return this._observation;
    }

    // this solution can be used to aggregate behavior across all solutions
    private _combination = new SolutionAggregateObserver();
    public get solutionAggregateObserver() {
        return this._combination;
    }

    private _activeSolution = new BehaviorSubject<Solution>(null);
    private _activeSolutionObserable = this._activeSolution.distinctUntilChanged().filter(z => !!z).publishReplay(1).refCount();
    public get activeSolution() {
        return this._activeSolutionObserable;
    }

    private _activatedSubject = new Subject<boolean>();
    private get activatedSubject() {
        return this._activatedSubject;
    }

    public activate(activeEditor: Observable<OmnisharpTextEditor>) {
        if (this._activated) return;

        this._disposable = new CompositeDisposable();
        this._solutionDisposable = new CompositeDisposable();
        this._atomProjects = new AtomProjectTracker();
        this._disposable.add(this._atomProjects);

        this._activeSearch = Promise.resolve(undefined);

        // monitor atom project paths
        this._subscribeToAtomProjectTracker();

        // We use the active editor on omnisharpAtom to
        // create another observable that chnages when we get a new solution.
        this._disposable.add(activeEditor
            .filter(z => !!z)
            .flatMap(z => this.getSolutionForEditor(z))
            .subscribe(x => this._activeSolution.next(x)));

        this._atomProjects.activate();
        this._activated = true;
        this.activatedSubject.next(true);
        this._disposable.add(this._solutionDisposable);
    }

    public connect() {
        this._solutions.forEach(solution => solution.connect());
    }

    public disconnect() {
        this._solutions.forEach(solution => solution.dispose());
    }

    public deactivate() {
        this._activated = false;
        this._disposable.dispose();
        this.disconnect();

        this._solutions.clear();
        this._solutionProjects.clear();
        this._findSolutionCache.clear();
    }

    public get connected() {
        const iterator = this._solutions.values();
        const result = iterator.next();
        while (!result.done)
            if (result.value.currentState === DriverState.Connected)
                return true;
        return false;
    }

    private _subscribeToAtomProjectTracker() {
        this._disposable.add(this._atomProjects.removed
            .filter(z => this._solutions.has(z))
            .subscribe(project => this._removeSolution(project)));

        this._disposable.add(this._atomProjects.added
            .filter(project => !this._solutionProjects.has(project))
            .map(project => {
                return this._candidateFinder(project)
                    .flatMap(candidates => {
                        return Observable.from(candidates)
                            .flatMap(x => this._findRepositoryForPath(x.path), (candidate, repo) => ({ candidate, repo }))
                            .toArray()
                            .toPromise()
                            .then(repos => {
                                const newCandidates = _.difference(candidates.map(z => z.path), fromIterator(this._solutions.keys())).map(z => _.find(candidates, { path: z }))
                                    .map(({ path, isProject, originalFile }) => {
                                        const found = _.find(repos, x => x.candidate.path === path);
                                        const repo = found && found.repo;
                                        return { path, isProject, repo, originalFile };
                                    });
                                return addCandidatesInOrder(newCandidates, (candidate, repo, isProject, originalFile) => this._addSolution(candidate, repo, isProject, { originalFile, project }));
                            });
                    }).toPromise();
            })
            .subscribe(candidateObservable => {
                this._activeSearch = this._activeSearch.then(() => candidateObservable);
            }));
    }

    private _findRepositoryForPath(workingPath: string) {
        return Observable.from<REPOSITORY>(atom.project.getRepositories() || [])
            .filter(x => !!x)
            .map(repo => ({ repo, directory: repo.getWorkingDirectory() }))
            .filter(({directory}) => path.normalize(directory) === path.normalize(workingPath))
            .take(1)
            .map(x => x.repo);
    }

    private _addSolution(candidate: string, repo: REPOSITORY, isProject: boolean, {temporary = false, project, originalFile}: { delay?: number; temporary?: boolean; project?: string; originalFile?: string; }) {
        const projectPath = candidate;
        if (_.endsWith(candidate, ".sln")) {
            candidate = path.dirname(candidate);
        }

        let solution: Solution;
        if (this._solutions.has(candidate)) {
            solution = this._solutions.get(candidate);
        } else if (project && this._solutionProjects.has(project)) {
            solution = this._solutionProjects.get(project);
        }

        if (solution && !solution.isDisposed) {
            return Observable.of(solution);
        } else if (solution && solution.isDisposed) {
            const disposer = this._disposableSolutionMap.get(solution);
            disposer.dispose();
        }

        solution = new Solution({
            projectPath: projectPath,
            index: ++this._nextIndex,
            temporary: temporary,
            repository: <any>repo,
            runtime: _.endsWith(originalFile, ".csx") ? Runtime.ClrOrMono : Runtime.CoreClr
        });

        if (!isProject) {
            solution.isFolderPerFile = true;
        }

        const cd = new CompositeDisposable();

        this._solutionDisposable.add(solution);
        solution.disposable.add(cd);
        this._disposableSolutionMap.set(solution, cd);

        solution.disposable.add(Disposable.create(() => {
            solution.connect = () => this._addSolution(candidate, repo, isProject, { temporary, project });
        }));

        cd.add(Disposable.create(() => {
            this._solutionDisposable.remove(cd);
            _.pull(this._activeSolutions, solution);
            this._solutions.delete(candidate);

            if (this._temporarySolutions.has(solution)) {
                this._temporarySolutions.delete(solution);
            }

            if (this._activeSolution.getValue() === solution) {
                this._activeSolution.next(this._activeSolutions.length ? this._activeSolutions[0] : null);
            }
        }));

        this._configurations.forEach(config => config(solution));
        this._solutions.set(candidate, solution);

        // keep track of the active solutions
        cd.add(this._observation.add(solution));
        cd.add(this._combination.add(solution));

        if (temporary) {
            const tempD = Disposable.create(() => { /* */ });
            tempD.dispose();
            this._temporarySolutions.set(solution, new RefCountDisposable(tempD));
        }

        this._activeSolutions.push(solution);
        if (this._activeSolutions.length === 1)
            this._activeSolution.next(solution);

        const result = this._addSolutionSubscriptions(solution, cd);
        solution.connect();
        return <Observable<Solution>><any>result;
    }

    private _addSolutionSubscriptions(solution: Solution, cd: CompositeDisposable) {
        const result = new AsyncSubject<Solution>();
        const errorResult = solution.state
            .filter(z => z === DriverState.Error)
            .delay(100)
            .take(1);

        cd.add(errorResult.subscribe(() => result.complete())); // If this solution errors move on to the next

        cd.add(solution.model.observe.projectAdded.subscribe(project => this._solutionProjects.set(project.path, solution)));
        cd.add(solution.model.observe.projectRemoved.subscribe(project => this._solutionProjects.delete(project.path)));

        // Wait for the projects to return from the solution
        cd.add(solution.model.observe.projects
            .debounceTime(100)
            .take(1)
            .map(() => solution)
            .timeout(SOLUTION_LOAD_TIME, Scheduler.queue) // Wait 30 seconds for the project to load.
            .subscribe(() => {
                // We loaded successfully return the solution
                result.next(solution);
                result.complete();
            }, () => {
                // Move along.
                result.complete();
            }));

        return result;
    }

    private _removeSolution(candidate: string) {
        if (_.endsWith(candidate, ".sln")) {
            candidate = path.dirname(candidate);
        }

        const solution = this._solutions.get(candidate);

        const refCountDisposable = solution && this._temporarySolutions.has(solution) && this._temporarySolutions.get(solution);
        if (refCountDisposable) {
            refCountDisposable.dispose();
            if (!refCountDisposable.isDisposed) {
                return;
            }
        }

        // keep track of the removed solutions
        if (solution) {
            solution.dispose();
            const disposable = this._disposableSolutionMap.get(solution);
            if (disposable) disposable.dispose();
        }
    }

    public getSolutionForPath(path: string) {
        if (!path)
            // No text editor found
            return Observable.empty<Solution>();

        const isFolderPerFile = _.some(this.__specialCaseExtensions, ext => _.endsWith(path, ext));

        const location = path;
        if (!location) {
            // Text editor not saved yet?
            return Observable.empty<Solution>();
        }

        const solutionValue = this._getSolutionForUnderlyingPath(location, isFolderPerFile);

        if (solutionValue)
            return Observable.of(solutionValue);

        return this._findSolutionForUnderlyingPath(location, isFolderPerFile);
    }

    public getSolutionForEditor(editor: Atom.TextEditor) {
        return this._getSolutionForEditor(editor).filter(() => !editor.isDestroyed());
    }

    private _setupEditorWithContext(editor: Atom.TextEditor, solution: Solution) {
        const context = new OmnisharpEditorContext(editor, solution);
        const result: OmnisharpTextEditor = <any>editor;
        this._disposable.add(context);

        if (solution && !context.temp && this._temporarySolutions.has(solution)) {
            const refCountDisposable = this._temporarySolutions.get(solution);
            const disposable = refCountDisposable.getDisposable();
            context.temp = true;
            context.solution.disposable.add(editor.onDidDestroy(() => {
                disposable.dispose();
                this._removeSolution(solution.path);
            }));
        }

        return result;
    }

    private _getSolutionForEditor(editor: Atom.TextEditor) {
        if (!editor) {
            // No text editor found
            return Observable.empty<Solution>();
        }

        const location = editor.getPath();
        if (!location) {
            // Text editor not saved yet?
            return Observable.empty<Solution>();
        }

        if (isOmnisharpTextEditor(editor)) {
            if (editor.omnisharp.metadata) {
                // client / server doesn"t work currently for metadata documents.
                return Observable.empty<Solution>();
            }

            const solution = editor.omnisharp.solution;

            // If the solution has disconnected, reconnect it
            if (solution.currentState === DriverState.Disconnected && atom.config.get("omnisharp-atom.autoStartOnCompatibleFile"))
                solution.connect();

            // Client is in an invalid state
            if (solution.currentState === DriverState.Error) {
                return Observable.empty<Solution>();
            }

            return Observable.of(solution);
        }

        const isFolderPerFile = _.some(this.__specialCaseExtensions, ext => _.endsWith(editor.getPath(), ext));
        const solution = this._getSolutionForUnderlyingPath(location, isFolderPerFile);
        if (solution) {
            this._setupEditorWithContext(editor, solution);
            return Observable.of(solution);
        }

        return this._findSolutionForUnderlyingPath(location, isFolderPerFile)
            .do((sln) => this._setupEditorWithContext(editor, sln));
    }

    private _isPartOfAnyActiveSolution<T>(location: string, cb: (intersect: string, solution: Solution) => T) {
        for (const solution of this._activeSolutions) {
            // We don"t check for folder based solutions
            if (solution.isFolderPerFile) continue;

            const paths = solution.model.projects.map(z => z.path);
            const intersect = this._intersectPathMethod(location, paths);
            if (intersect) {
                return cb(intersect, solution);
            }
        }
    }

    private _getSolutionForUnderlyingPath(location: string, isFolderPerFile: boolean): Solution {
        if (location === undefined) {
            return null;
        }

        if (isFolderPerFile) {
            // CSX are special, and need a solution per directory.
            const directory = path.dirname(location);
            if (this._solutions.has(directory))
                return this._solutions.get(directory);

            return null;
        } else {
            const intersect = this._intersectPath(location);
            if (intersect) {
                return this._solutions.get(intersect);
            }
        }

        if (!isFolderPerFile) {
            // Attempt to see if this file is part a solution
            return this._isPartOfAnyActiveSolution(location, (intersect, solution) => solution);
        }

        return null;
    }

    private _findSolutionForUnderlyingPath(location: string, isFolderPerFile: boolean): Observable<Solution> {
        const directory = path.dirname(location);

        if (!this._activated) {
            return this.activatedSubject.take(1)
                .flatMap(() => this._findSolutionForUnderlyingPath(location, isFolderPerFile));
        }

        const segments = location.split(path.sep);
        const mappedLocations = segments.map((loc, index) => {
            return _.take(segments, index + 1).join(path.sep);
        });

        for (let l of mappedLocations) {
            if (this._findSolutionCache.has(l)) {
                return this._findSolutionCache.get(l);
            }
        }

        const subject = new AsyncSubject<Solution>();
        _.each(mappedLocations, l => {
            this._findSolutionCache.set(l, <Observable<Solution>><any>subject);
            subject.subscribe({ complete: () => this._findSolutionCache.delete(l) });
        });

        const project = this._intersectAtomProjectPath(directory);
        const cb = (candidates: Candidate[]) => {
            // We only want to search for solutions after the main solutions have been processed.
            // We can get into this race condition if the user has windows that were opened previously.
            if (!this._activated) {
                _.delay(cb, SOLUTION_LOAD_TIME);
                return;
            }

            if (!isFolderPerFile) {
                // Attempt to see if this file is part a solution
                const r = this._isPartOfAnyActiveSolution(location, (intersect, solution) => {
                    subject.next(solution);
                    subject.complete();
                    return true;
                });
                if (r) return;
            }

            this._activeSearch.then(() => Observable.from(candidates)
                .flatMap(x => this._findRepositoryForPath(x.path), (candidate, repo) => ({ candidate, repo }))
                .toArray()
                .toPromise())
                .then(repos => {
                    const newCandidates = _.difference(candidates.map(z => z.path), fromIterator(this._solutions.keys())).map(z => _.find(candidates, { path: z }))
                        .map(({ path, isProject, originalFile }) => {
                            const found = _.find(repos, x => x.candidate.path === path);
                            const repo = found && found.repo;
                            return { path, isProject, repo, originalFile };
                        });
                    addCandidatesInOrder(newCandidates, (candidate, repo, isProject, originalFile) => this._addSolution(candidate, repo, isProject, { temporary: !project, originalFile }))
                        .then(() => {
                            if (!isFolderPerFile) {
                                // Attempt to see if this file is part a solution
                                const r = this._isPartOfAnyActiveSolution(location, (intersect, solution) => {
                                    subject.next(solution);
                                    subject.complete();
                                    return;
                                });
                                if (r) return;
                            }

                            const intersect = this._intersectPath(location) || this._intersectAtomProjectPath(location);
                            if (intersect) {
                                if (this._solutions.has(intersect)) {
                                    subject.next(this._solutions.get(intersect)); // The boolean means this solution is temporary.
                                }
                            } else {
                                atom.notifications.addInfo(`Could not find a solution for "${location}"`);
                            }
                            subject.complete();
                        });
                });
        };

        this._candidateFinder(directory).subscribe(cb);

        return <Observable<Solution>><any>subject;
    }

    private _candidateFinder(directory: string) {
        return findCandidates.withCandidates(directory, this.logger, {
            solutionIndependentSourceFilesToSearch: this.__specialCaseExtensions.map(z => "*" + z)
        })
            .flatMap(candidates => {
                const slns = _.filter(candidates, x => _.endsWith(x.path, ".sln"));
                if (slns.length > 1) {
                    const items = _.difference(candidates, slns);
                    const asyncResult = new AsyncSubject<typeof candidates>();
                    asyncResult.next(items);

                    // handle multiple solutions.
                    const listView = new GenericSelectListView("",
                        slns.map(x => ({ displayName: x.path, name: x.path })),
                        (result: any) => {
                            items.unshift(...slns.filter(x => x.path === result));
                            _.each(candidates, x => {
                                this._candidateFinderCache.add(x.path);
                            });

                            asyncResult.complete();
                        },
                        () => {
                            asyncResult.complete();
                        }
                    );

                    listView.message.text("Please select a solution to load.");

                    // Show the view
                    if (openSelectList) {
                        openSelectList.onClosed.subscribe(() => {
                            if (!_.some(slns, x => this._candidateFinderCache.has(x.path))) {
                                _.defer(() => listView.toggle());
                            } else {
                                asyncResult.complete();
                            }
                        });
                    } else {
                        _.defer(() => listView.toggle());
                    }

                    asyncResult.do({ complete: () => openSelectList = null });
                    openSelectList = listView;

                    return <Observable<typeof candidates>><any>asyncResult;
                } else {
                    return Observable.of(candidates);
                }
            });
    }

    public registerConfiguration(callback: (solution: Solution) => void) {
        this._configurations.add(callback);
        this._solutions.forEach(solution => callback(solution));
    }

    private _intersectPathMethod(location: string, paths?: string[]) {
        const validSolutionPaths = paths;

        const segments = location.split(path.sep);
        const mappedLocations = segments.map((loc, index) => {
            return _.take(segments, index + 1).join(path.sep);
        });

        // Look for the closest match first.
        mappedLocations.reverse();

        const intersect: string = _.intersection(mappedLocations, validSolutionPaths)[0];
        if (intersect) {
            return intersect;
        }
    }

    private _intersectPath(location: string) {
        return this._intersectPathMethod(location, fromIterator(this._solutions.entries())
            .filter(z => !z[1].isFolderPerFile).map(z => z[0]));
    }

    private _intersectAtomProjectPath(location: string) {
        return this._intersectPathMethod(location, this._atomProjects.paths);
    }
}

function addCandidatesInOrder(candidates: { path: string; repo: REPOSITORY; isProject: boolean; originalFile: string; }[], cb: (candidate: string, repo: REPOSITORY, isProject: boolean, originalFile: string) => Observable<Solution>) {
    const asyncSubject = new AsyncSubject();

    if (!candidates.length) {
        asyncSubject.next(candidates);
        asyncSubject.complete();
        return asyncSubject.toPromise();
    }

    const cds = candidates.slice();
    const candidate = cds.shift();
    const handleCandidate = (cand: { path: string; repo: REPOSITORY; isProject: boolean; originalFile: string; }) => {
        cb(cand.path, cand.repo, cand.isProject, cand.originalFile)
            .subscribe({
                complete: () => {
                    if (cds.length) {
                        cand = cds.shift();
                        handleCandidate(cand);
                    } else {
                        asyncSubject.next(candidates);
                        asyncSubject.complete();
                    }
                }
            });
    };
    handleCandidate(candidate);
    return asyncSubject.toPromise();
}

function fromIterator<T>(iterator: IterableIterator<T>) {
    const items: T[] = [];
    let result = iterator.next();
    while (!result.done) {
        items.push(result.value);

        result = iterator.next();
    }

    return items;
}

/* tslint:disable:variable-name */
export const SolutionManager = new SolutionInstanceManager();
/* tslint:enable:variable-name */
