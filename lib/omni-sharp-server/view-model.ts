import * as _ from "lodash";
import {Solution} from "./solution";
import {DriverState, OmnisharpClientStatus} from "omnisharp-client";
import {Observable, Subject, ReplaySubject, CompositeDisposable, Disposable} from "rx";
import {basename, dirname, normalize, join} from "path";
import {ProjectViewModel, projectViewModelFactory, workspaceViewModelFactory} from "./project-view-model";
var win32 = process.platform === "win32";

export interface VMViewState {
    isOff: boolean;
    isConnecting: boolean;
    isOn: boolean;
    isReady: boolean;
    isError: boolean;
}

export class ViewModel implements VMViewState, Rx.IDisposable {
    public isOff: boolean;
    public isConnecting: boolean;
    public isOn: boolean;
    public isReady: boolean;
    public isError: boolean;

    private _uniqueId;
    private _disposable = new CompositeDisposable();
    public get uniqueId() { return this._solution.uniqueId; }

    public get index() { return this._solution.index; }
    public get path() { return this._solution.path; }
    public output: OmniSharp.OutputMessage[] = [];
    public diagnostics: OmniSharp.Models.DiagnosticLocation[] = [];
    public get state() { return this._solution.currentState };
    public packageSources: string[] = [];
    public runtime = '';
    public runtimePath: string;
    public projects: ProjectViewModel<any>[] = [];
    private _projectAddedStream = new Subject<ProjectViewModel<any>>();
    private _projectRemovedStream = new Subject<ProjectViewModel<any>>();
    private _projectChangedStream = new Subject<ProjectViewModel<any>>();
    private _stateStream = new Subject<ViewModel>();

    public observe: {
        codecheck: Rx.Observable<OmniSharp.Models.DiagnosticLocation[]>;
        output: Rx.Observable<OmniSharp.OutputMessage[]>;
        status: Rx.Observable<OmnisharpClientStatus>;
        state: Rx.Observable<ViewModel>;
        projectAdded: Rx.Observable<ProjectViewModel<any>>;
        projectRemoved: Rx.Observable<ProjectViewModel<any>>;
        projectChanged: Rx.Observable<ProjectViewModel<any>>;
        projects: Rx.Observable<ProjectViewModel<any>[]>;
    };

    constructor(private _solution: Solution) {
        this._uniqueId = _solution.uniqueId;
        this._updateState(_solution.currentState);

        // Manage our build log for display
        this._disposable.add(_solution.logs.subscribe(event => {
            this.output.push(event);
            if (this.output.length > 1000)
                this.output.shift();
        }));

        this._disposable.add(_solution.state.where(z => z === DriverState.Disconnected).subscribe(() => {
            _.each(this.projects.slice(), project => this._projectRemovedStream.onNext(project));
            this.projects = [];
            this.diagnostics = [];
        }));

        var codecheck = this._setupCodecheck(_solution);
        var status = this._setupStatus(_solution);
        var output = this.output;

        var _projectAddedStream = this._projectAddedStream.share();
        var _projectRemovedStream = this._projectRemovedStream.share();
        var _projectChangedStream = this._projectChangedStream.share();
        var projects = Observable.merge(_projectAddedStream, _projectRemovedStream, _projectChangedStream)
            .debounce(200)
            .map(z => this.projects)
            .share();

        var outputObservable = _solution.logs
            .window(_solution.logs.throttle(100), () => Observable.timer(100))
            .flatMap(x => x.startWith(null).last())
            .map(() => output);

        var state = this._stateStream.share();

        this.observe = {
            get codecheck() { return codecheck; },
            get output() { return outputObservable; },
            get status() { return status; },
            get state() { return state; },
            get projects() { return projects; },
            get projectAdded() { return _projectAddedStream; },
            get projectRemoved() { return _projectRemovedStream; },
            get projectChanged() { return _projectChangedStream; },
        };

        this._disposable.add(_solution.state.subscribe(_.bind(this._updateState, this)));

        (window['clients'] || (window['clients'] = [])).push(this);  //TEMP

        this._disposable.add(_solution.state.where(z => z === DriverState.Connected)
            .subscribe(() => {
                _solution.projects({ ExcludeSourceFiles: false });

                _solution.packagesource({ ProjectPath: _solution.path })
                    .subscribe(response => {
                        this.packageSources = response.Sources;
                    });
            }));

        this._disposable.add(_solution.state.where(z => z === DriverState.Disconnected).subscribe(() => {
            _.each(this.projects.slice(), project => this._projectRemovedStream.onNext(project));
        }));

        this._disposable.add(_solution.observe.projectAdded.subscribe(projectInformation => {
            var projects = projectViewModelFactory(projectInformation, _solution.projectPath);
            _.each(projects, project => {
                if (!_.any(this.projects, { path: project.path })) {
                    this.projects.push(project);
                    this._projectAddedStream.onNext(project);
                }
            });
        }));

        this._disposable.add(_solution.observe.projectRemoved.subscribe(projectInformation => {
            var projects = projectViewModelFactory(projectInformation, _solution.projectPath);
            _.each(projects, project => {
                var found: ProjectViewModel<any> = _.find(this.projects, { path: project.path });
                if (found) {
                    _.pull(this.projects, found);
                    this._projectRemovedStream.onNext(project);
                }
            });
        }));

        this._disposable.add(_solution.observe.projectChanged.subscribe(projectInformation => {
            var projects = projectViewModelFactory(projectInformation, _solution.projectPath);
            _.each(projects, project => {
                var found: ProjectViewModel<any> = _.find(this.projects, { path: project.path });
                if (found) {
                    found.update(project);
                    this._projectChangedStream.onNext(project);
                }
            });
        }));

        this._disposable.add(_solution.observe.projects.subscribe(context => {
            var projects = workspaceViewModelFactory(context.response, _solution.projectPath);
            _.each(projects, project => {
                var found: ProjectViewModel<any> = _.find(this.projects, { path: project.path });
                if (found) {
                    found.update(project);
                    this._projectChangedStream.onNext(project);
                } else {
                    this.projects.push(project);
                    this._projectAddedStream.onNext(project);
                }
            });
        }));

        this._disposable.add(_solution.observe.projects
            .where(z => z.response.Dnx != null && z.response.Dnx.Projects.length > 0)
            .map(z => z.response.Dnx)
            .subscribe(system => {
                this.runtime = basename(system.RuntimePath);

                var path = normalize(system.RuntimePath);
                if (win32) {
                    var processHome = normalize(process.env.HOME || process.env.USERPROFILE);
                    // Handles the case where home path does not have a trailing slash.
                    if (_.startsWith(path, processHome)) {
                        path = path.replace(processHome, '');
                        path = join(processHome, path);
                    }
                }
                this.runtimePath = path;
            }));

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
            .where(() => !editor.isDestroyed());
    }

    public getProjectForPath(path: string) {
        if (this.isOn && this.projects.length) {
            var project = _.find(this.projects, x => x.filesSet.has(path));
            if (project) {
                return Observable.just(project);
            }
        }

        return this.observe.projectAdded.where(x => _.startsWith(path, x.path)).take(1);
    }

    public getProjectContainingEditor(editor: Atom.TextEditor) {
        return this.getProjectContainingFile(editor.getPath());
    }

    public getProjectContainingFile(path: string) {
        if (this.isOn && this.projects.length) {
            var project = _.find(this.projects, x => _.contains(x.sourceFiles, normalize(path)));
            if (project) {
                return Observable.just(project);
            }
            return Observable.just(null);
        } else {
            return this.observe.projectAdded
                .where(x => _.contains(x.sourceFiles, normalize(path)))
                .take(1)
                .defaultIfEmpty(null);
        }
    }

    private _updateState(state) {
        this.isOn = state === DriverState.Connecting || state === DriverState.Connected;
        this.isOff = state === DriverState.Disconnected;
        this.isConnecting = state === DriverState.Connecting;
        this.isReady = state === DriverState.Connected;
        this.isError = state === DriverState.Error;

        this._stateStream.onNext(this);
    }

    private _setupCodecheck(_solution: Solution) {
        var codecheck = Observable.merge(
            // Catch global code checks
            _solution.observe.codecheck
                .where(z => !z.request.FileName)
                .map(z => z.response || <any>{})
                .map(z => <OmniSharp.Models.DiagnosticLocation[]>z.QuickFixes || []),
            // Evict diagnostics from a code check for the given file
            // Then insert the new diagnostics
            _solution.observe.codecheck
                .where(z => !!z.request.FileName)
                .map((ctx) => {
                    var {request, response} = ctx;
                    if (!response) response = <any>{};
                    var results = _.filter(this.diagnostics, (fix: OmniSharp.Models.DiagnosticLocation) => request.FileName !== fix.FileName);
                    results.unshift(...<OmniSharp.Models.DiagnosticLocation[]>response.QuickFixes || []);
                    return results;
                }))
            .map(data => _.sortBy(data, quickFix => quickFix.LogLevel))
            .startWith([])
            .shareReplay(1);

        this._disposable.add(codecheck.subscribe((data) => this.diagnostics = data));
        return codecheck;
    }

    private _setupStatus(_solution: Solution) {
        var status = _solution.status
            .startWith(<any>{})
            .share();

        return status;
    }
}
