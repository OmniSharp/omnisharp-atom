import _ from "lodash";
import {Solution} from "./solution";
import {Models, DriverState, OmnisharpClientStatus} from "omnisharp-client";
import {Observable, Subject, ReplaySubject} from "rxjs";
import {CompositeDisposable, Disposable, IDisposable} from "omnisharp-client";
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
    private _disposable = new CompositeDisposable();
    public get uniqueId() { return this._solution.uniqueId; }

    public get index() { return this._solution.index; }
    public get path() { return this._solution.path; }
    public output: OutputMessage[] = [];
    public outputElement = document.createElement("div");
    public diagnostics: Models.DiagnosticLocation[] = [];

    public get state() { return this._solution.currentState; };
    public packageSources: string[] = [];
    public projects: ProjectViewModel<any>[] = [];
    private _projectAddedStream = new Subject<ProjectViewModel<any>>();
    private _projectRemovedStream = new Subject<ProjectViewModel<any>>();
    private _projectChangedStream = new Subject<ProjectViewModel<any>>();
    private _stateStream = new ReplaySubject<ViewModel>(1);

    public observe: {
        codecheck: Observable<Models.DiagnosticLocation[]>;
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
        this._disposable.add(_solution.logs.subscribe(event => {
            this.output.push(event);

            if (this.output.length > 1000) {
                this.output.shift();
            }
        }));

        this._disposable.add(bufferFor(_solution.logs, 100)
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
            }));

        this._disposable.add(_solution.state.filter(z => z === DriverState.Disconnected).subscribe(() => {
            _.each(this.projects.slice(), project => this._projectRemovedStream.next(project));
            this.projects = [];
            this.diagnostics = [];
        }));

        const {codecheck} = this._setupCodecheck(_solution);
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
            get codecheck() { return codecheck; },
            get output() { return outputObservable; },
            get status() { return status; },
            get state() { return <Observable<ViewModel>><any>state; },
            get projects() { return projects; },
            get projectAdded() { return _projectAddedStream; },
            get projectRemoved() { return _projectRemovedStream; },
            get projectChanged() { return _projectChangedStream; },
        };

        this._disposable.add(_solution.state.subscribe(_.bind(this._updateState, this)));

        /* tslint:disable */
        (window["clients"] || (window["clients"] = [])).push(this);  //TEMP
        /* tslint:enable */

        this._disposable.add(_solution.state.filter(z => z === DriverState.Connected)
            .subscribe(() => {
                _solution.projects({ ExcludeSourceFiles: false });

                _solution.packagesource({ ProjectPath: _solution.path })
                    .subscribe(response => {
                        this.packageSources = response.Sources;
                    });
            }));

        this._disposable.add(_solution.state.filter(z => z === DriverState.Disconnected).subscribe(() => {
            _.each(this.projects.slice(), project => this._projectRemovedStream.next(project));
        }));

        this._disposable.add(_solution.observe.projectAdded.subscribe(projectInformation => {
            _.each(projectViewModelFactory(projectInformation, _solution.projectPath), project => {
                if (!_.some(this.projects, { path: project.path })) {
                    this.projects.push(project);
                    this._projectAddedStream.next(project);
                }
            });
        }));

        this._disposable.add(_solution.observe.projectRemoved.subscribe(projectInformation => {
            _.each(projectViewModelFactory(projectInformation, _solution.projectPath), project => {
                const found: ProjectViewModel<any> = _.find(this.projects, { path: project.path });
                if (found) {
                    _.pull(this.projects, found);
                    this._projectRemovedStream.next(project);
                }
            });
        }));

        this._disposable.add(_solution.observe.projectChanged.subscribe(projectInformation => {
            _.each(projectViewModelFactory(projectInformation, _solution.projectPath), project => {
                const found: ProjectViewModel<any> = _.find(this.projects, { path: project.path });
                if (found) {
                    found.update(project);
                    this._projectChangedStream.next(project);
                }
            });
        }));

        this._disposable.add(_solution.observe.projects.subscribe(context => {
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

        /*this._disposable.add(_solution.observe.projects
            .filter(z => z.response && z.response.DotNet && z.response.DotNet.Projects.length > 0)
            .map(z => z.response.DotNet)
            .subscribe(system => {
                if (system.RuntimePath) {
                    this.runtime = basename(system.RuntimePath);

                    let path = normalize(system.RuntimePath);
                    if (win32) {
                        const home = process.env.HOME || process.env.USERPROFILE;
                        if (home && home.trim()) {
                            const processHome = normalize(home);
                            // Handles the case where home path does not have a trailing slash.
                            if (_.startsWith(path, processHome)) {
                                path = path.replace(processHome, "");
                                path = join(processHome, path);
                            }
                        }
                    }
                    this.runtimePath = path;

                    this._stateStream.next(this);
                }
            }));*/

        this._disposable.add(this._projectAddedStream);
        this._disposable.add(this._projectChangedStream);
        this._disposable.add(this._projectRemovedStream);

        this._disposable.add(Disposable.create(() => {
            _.each(this.projects, x => x.dispose());
        }));
    }

    public dispose() {
        this._disposable.dispose();
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
        const codecheck = Observable.merge(
            // Catch global code checks
            _solution.observe.codecheck
                .filter(z => !z.request.FileName)
                .map(z => z.response || <any>{})
                .map(z => <Models.DiagnosticLocation[]>z.QuickFixes || []),
            // Evict diagnostics from a code check for the given file
            // Then insert the new diagnostics
            _solution.observe.codecheck
                .filter(z => !!z.request.FileName)
                .map((ctx) => {
                    let {request, response} = ctx;
                    if (!response) response = <any>{};
                    const results = _.filter(this.diagnostics, (fix: Models.DiagnosticLocation) => request.FileName !== fix.FileName);
                    results.unshift(...<Models.DiagnosticLocation[]>response.QuickFixes || []);
                    return results;
                }))
            .map(data => _.sortBy(data, quickFix => quickFix.LogLevel))
            .startWith([])
            .publishReplay(1).refCount();

        this._disposable.add(codecheck.subscribe((data) => this.diagnostics = data));
        return { codecheck };
    }

    private _setupStatus(_solution: Solution) {
        const status = _solution.status
            .startWith(<any>{})
            .share();

        return status;
    }
}
