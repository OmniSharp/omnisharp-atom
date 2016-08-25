import _ from "lodash";
import {Solution} from "./solution";
import {Models, DriverState, OmnisharpClientStatus} from "omnisharp-client";
import {Observable, Subject, ReplaySubject} from "rxjs";
import {CompositeDisposable, Disposable, IDisposable} from "ts-disposables";
import {normalize} from "path";
import {ProjectViewModel, projectViewModelFactory, workspaceViewModelFactory} from "./project-view-model";
import {OutputMessageElement} from "../views/output-message-element";
let fastdom: typeof Fastdom = require("fastdom");
import {bufferFor} from "../operators/bufferFor";

export interface VMViewState {
    isOff: boolean;
    isConnecting: boolean;
    isOn: boolean;
    isReady: boolean;
    isError: boolean;
}

export class ViewModel implements VMViewState, IDisposable {
    public isOff: boolean;
    public isConnecting: boolean;
    public isOn: boolean;
    public isReady: boolean;
    public isError: boolean;

    private _uniqueId: string;
    public disposable = new CompositeDisposable();
    public get uniqueId() { return this._solution.uniqueId; }

    public get index() { return this._solution.index; }
    public get path() { return this._solution.path; }
    public output: OutputMessage[] = [];
    public outputElement = document.createElement("div");
    public diagnosticsByFile = new Map<string, Models.DiagnosticLocation[]>();
    public get diagnostics() {
        return _(_.toArray(this.diagnosticsByFile.values()))
            .flatMap(x => x)
            .sortBy(x => x.LogLevel, x => x.FileName, x => x.Line, x => x.Column, x => x.Text)
            .value();
    }
    public diagnosticCounts: { [index: string]: number; } = { error: 0, warning: 0, hidden: 0 };

    public errors: number = 0;
    public warnings: number = 0;
    public hidden: number = 0;

    public get state() { return this._solution.currentState; };
    public packageSources: string[] = [];
    public projects: ProjectViewModel<any>[] = [];
    private _projectAddedStream = new Subject<ProjectViewModel<any>>();
    private _projectRemovedStream = new Subject<ProjectViewModel<any>>();
    private _projectChangedStream = new Subject<ProjectViewModel<any>>();
    private _stateStream = new ReplaySubject<ViewModel>(1);

    public observe: {
        diagnostics: Observable<Models.DiagnosticLocation[]>;
        diagnosticsCounts: Observable<{ [index: string]: number; }>;
        diagnosticsByFile: Observable<Map<string, Models.DiagnosticLocation[]>>;
        output: Observable<OutputMessage[]>;
        status: Observable<OmnisharpClientStatus>;
        state: Observable<ViewModel>;
        projectAdded: Observable<ProjectViewModel<any>>;
        projectRemoved: Observable<ProjectViewModel<any>>;
        projectChanged: Observable<ProjectViewModel<any>>;
        projects: Observable<ProjectViewModel<any>[]>;
    };

    constructor(private _solution: Solution) {
        this._uniqueId = _solution.uniqueId;
        this._updateState(_solution.currentState);

        this.outputElement.classList.add("messages-container");

        // Manage our build log for display
        this.disposable.add(_solution.logs
            .subscribe(event => {
                this.output.push(event);

                if (this.output.length > 1000) {
                    this.output.shift();
                }
            }),
            bufferFor(_solution.logs, 100)
                .subscribe(items => {
                    let removals: Element[] = [];
                    if (this.outputElement.children.length === 1000) {
                        for (let i = 0; i < items.length; i++) {
                            removals.push(this.outputElement.children[i]);
                        }
                    }

                    fastdom.mutate(() => {
                        _.each(removals, x => x.remove());

                        _.each(items, event => {
                            this.outputElement.appendChild(OutputMessageElement.create(event));
                        });
                    });
                }),
            _solution.state.filter(z => z === DriverState.Disconnected)
                .subscribe(() => {
                    _.each(this.projects.slice(), project => this._projectRemovedStream.next(project));
                    this.projects = [];
                    this.diagnosticsByFile.clear();
                })
        );

        const {diagnostics, diagnosticsByFile, diagnosticsCounts} = this._setupCodecheck(_solution);
        const status = this._setupStatus(_solution);
        const output = this.output;

        const _projectAddedStream = this._projectAddedStream.share();
        const _projectRemovedStream = this._projectRemovedStream.share();
        const _projectChangedStream = this._projectChangedStream.share();
        const projects = Observable.merge(_projectAddedStream, _projectRemovedStream, _projectChangedStream)
            .startWith(<any>[])
            .debounceTime(200)
            .map(z => this.projects)
            .publishReplay(1).refCount();

        const outputObservable = _solution.logs
            .auditTime(100)
            .map(() => output);

        const state = this._stateStream;

        this.observe = {
            get diagnostics() { return diagnostics; },
            get diagnosticsCounts() { return diagnosticsCounts; },
            get diagnosticsByFile() { return diagnosticsByFile; },
            get output() { return outputObservable; },
            get status() { return status; },
            get state() { return <Observable<ViewModel>><any>state; },
            get projects() { return projects; },
            get projectAdded() { return _projectAddedStream; },
            get projectRemoved() { return _projectRemovedStream; },
            get projectChanged() { return _projectChangedStream; },
        };

        this.disposable.add(_solution.state.subscribe(_.bind(this._updateState, this)));

        /* tslint:disable */
        (window["clients"] || (window["clients"] = [])).push(this);  //TEMP
        /* tslint:enable */

        this.disposable.add(_solution.state.filter(z => z === DriverState.Connected)
            .subscribe(() => {
                _solution.projects({ ExcludeSourceFiles: false });

                _solution.packagesource({ ProjectPath: _solution.path })
                    .subscribe(response => {
                        this.packageSources = response.Sources;
                    });
            }));

        this.disposable.add(_solution.state.filter(z => z === DriverState.Disconnected).subscribe(() => {
            _.each(this.projects.slice(), project => this._projectRemovedStream.next(project));
        }));

        this.disposable.add(_solution.observe.projectAdded.subscribe(projectInformation => {
            _.each(projectViewModelFactory(projectInformation, _solution.projectPath), project => {
                if (!_.some(this.projects, { path: project.path })) {
                    this.projects.push(project);
                    this._projectAddedStream.next(project);
                }
            });
        }));

        this.disposable.add(_solution.observe.projectRemoved.subscribe(projectInformation => {
            _.each(projectViewModelFactory(projectInformation, _solution.projectPath), project => {
                const found: ProjectViewModel<any> = _.find(this.projects, { path: project.path });
                if (found) {
                    _.pull(this.projects, found);
                    this._projectRemovedStream.next(project);
                }
            });
        }));

        this.disposable.add(_solution.observe.projectChanged.subscribe(projectInformation => {
            _.each(projectViewModelFactory(projectInformation, _solution.projectPath), project => {
                const found: ProjectViewModel<any> = _.find(this.projects, { path: project.path });
                if (found) {
                    found.update(project);
                    this._projectChangedStream.next(project);
                }
            });
        }));

        this.disposable.add(_solution.observe.projects.subscribe(context => {
            _.each(workspaceViewModelFactory(context.response, _solution.projectPath), project => {
                const found: ProjectViewModel<any> = _.find(this.projects, { path: project.path });
                if (found) {
                    found.update(project);
                    this._projectChangedStream.next(project);
                } else {
                    this.projects.push(project);
                    this._projectAddedStream.next(project);
                }
            });
        }));

        this.disposable.add(this._projectAddedStream);
        this.disposable.add(this._projectChangedStream);
        this.disposable.add(this._projectRemovedStream);

        this.disposable.add(Disposable.create(() => {
            _.each(this.projects, x => x.dispose());
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public getProjectForEditor(editor: Atom.TextEditor) {
        return this.getProjectForPath(editor.getPath())
            .filter(() => !editor.isDestroyed());
    }

    public getProjectForPath(path: string) {
        if (this.isOn && this.projects.length) {
            const project = _.find(this.projects, x => x.filesSet.has(path));
            if (project) {
                return Observable.of(project);
            }
        }

        return this.observe.projectAdded.filter(x => _.startsWith(path, x.path)).take(1);
    }

    public getProjectContainingEditor(editor: Atom.TextEditor) {
        return this.getProjectContainingFile(editor.getPath());
    }

    public getProjectContainingFile(path: string) {
        if (this.isOn && this.projects.length) {
            const project = _.find(this.projects, x => _.includes(x.sourceFiles, normalize(path)));
            if (project) {
                return Observable.of(project);
            }
            return Observable.of(null);
        } else {
            return this.observe.projectAdded
                .filter(x => _.includes(x.sourceFiles, normalize(path)))
                .take(1)
                .defaultIfEmpty(null);
        }
    }

    private _updateState(state: DriverState) {
        this.isOn = state === DriverState.Connecting || state === DriverState.Connected;
        this.isOff = state === DriverState.Disconnected;
        this.isConnecting = state === DriverState.Connecting;
        this.isReady = state === DriverState.Connected;
        this.isError = state === DriverState.Error;

        this._stateStream.next(this);
    }

    private _setupCodecheck(_solution: Solution) {
        const baseCodecheck = _solution.observe.diagnostic
            .map(data => {
                const files: string[] = [];
                const counts = this.diagnosticCounts;
                _.each(data.Results, result => {
                    files.push(result.FileName);
                    if (this.diagnosticsByFile.has(result.FileName)) {
                        const old = this.diagnosticsByFile.get(result.FileName);
                        this.diagnosticsByFile.delete(result.FileName);

                        const grouped = _.groupBy(old, x => x.LogLevel.toLowerCase());
                        _.each(grouped, (items, key) => {
                            if (!_.isNumber(counts[key])) { counts[key] = 0; }
                            counts[key] -= items.length;
                            if (counts[key] < 0) counts[key] = 0;
                        });
                    }

                    this.diagnosticsByFile.set(result.FileName, _.sortBy(result.QuickFixes, x => x.Line, quickFix => quickFix.LogLevel, x => x.Text));
                    const grouped = _.groupBy(result.QuickFixes, x => x.LogLevel.toLowerCase());
                    _.each(grouped, (items, key) => {
                        if (!_.isNumber(counts[key])) { counts[key] = 0; }
                        counts[key] += items.length;
                    });
                });
                return files;
            })
            .share();

        const diagnostics = baseCodecheck
            .map(x => this.diagnostics)
            .cache(1);

        const diagnosticsByFile = baseCodecheck
            .map(files => {
                const map = new Map<string, Models.DiagnosticLocation[]>();
                _.each(files, file => {
                    map.set(file, this.diagnosticsByFile.get(file));
                });
                return map;
            })
            .cache(1);

        const diagnosticsCounts = baseCodecheck
            .map(x => this.diagnosticCounts)
            .cache(1);

        this.disposable.add(baseCodecheck.subscribe());
        return { diagnostics, diagnosticsByFile, diagnosticsCounts };
    }

    private _setupStatus(_solution: Solution) {
        const status = _solution.status
            .startWith(<any>{})
            .share();

        return status;
    }
}
