import * as _ from "lodash";
import {Solution} from "./solution";
import {DriverState, OmnisharpClientStatus} from "omnisharp-client";
import {Observable, Subject, ReplaySubject, CompositeDisposable, Disposable} from "rx";
import {basename, dirname, normalize} from "path";


interface DiagnosticMessage extends OmniSharp.Models.DiagnosticLocation {
    Clear: boolean;
}

export class ProjectViewModel implements OmniSharp.IProjectViewModel, Rx.IDisposable {
    public path: string;

    private _subjectActiveFramework = new ReplaySubject<OmniSharp.Models.DnxFramework>(1);
    private _activeFramework: OmniSharp.Models.DnxFramework;
    public get activeFramework() { return this._activeFramework; }
    public set activeFramework(value) {
        this._activeFramework = value;
        !this._subjectActiveFramework.isDisposed && this._subjectActiveFramework.onNext(this._activeFramework);
    }
    public frameworks: OmniSharp.Models.DnxFramework[];
    public observe: {
        activeFramework: Observable<OmniSharp.Models.DnxFramework>;
    };

    constructor(
        public name: string,
        path: string,
        public solutionPath: string,
        frameworks: OmniSharp.Models.DnxFramework[] = [],
        public configurations: string[] = [],
        public commands: { [key: string]: string } = <any>{},
        public sourceFiles?: string[]
    ) {
        this.path = dirname(path);
        this.sourceFiles = (sourceFiles || []).map(normalize);

        this.frameworks = [{
            FriendlyName: 'All',
            Name: 'all',
            ShortName: 'all'
        }].concat(frameworks);

        this.activeFramework = this.frameworks[0];

        this.observe = {
            activeFramework: this._subjectActiveFramework.asObservable()
        };
    }

    public dispose() {
        this._subjectActiveFramework.dispose();
    }
}

export class ViewModel implements Rx.IDisposable {
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
    public projects: ProjectViewModel[] = [];
    private _projectAddedStream = new Subject<ProjectViewModel>();
    private _projectRemovedStream = new Subject<ProjectViewModel>();
    private _projectChangedStream = new Subject<ProjectViewModel>();

    public observe: {
        codecheck: Rx.Observable<OmniSharp.Models.DiagnosticLocation[]>;
        output: Rx.Observable<OmniSharp.OutputMessage[]>;
        status: Rx.Observable<OmnisharpClientStatus>;
        updates: Rx.Observable<Rx.ObjectObserveChange<ViewModel>>;
        projectAdded: Rx.Observable<ProjectViewModel>;
        projectRemoved: Rx.Observable<ProjectViewModel>;
        projectChanged: Rx.Observable<ProjectViewModel>;
        projects: Rx.Observable<ProjectViewModel[]>;
    };

    constructor(private _solution: Solution) {
        this._uniqueId = _solution.uniqueId;
        this._updateState(_solution.currentState);
        this._observeProjectEvents();

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
        var updates = Observable.ofObjectChanges(this);
        var msbuild = this._setupMsbuild(_solution);
        var dnx = this._setupDnx(_solution);
        var scriptcs = this._setupScriptCs(_solution);

        var _projectAddedStream = this._projectAddedStream;
        var _projectRemovedStream = this._projectRemovedStream;
        var _projectChangedStream = this._projectChangedStream;
        var projects = Observable.merge(_projectAddedStream, _projectRemovedStream, _projectChangedStream)
            .map(z => this.projects);

        var outputObservable = _solution.logs
            .window(_solution.logs.throttle(100), () => Observable.timer(100))
            .flatMap(x => x.startWith(null).last())
            .map(() => output);

        this.observe = {
            get codecheck() { return codecheck; },
            get output() { return outputObservable; },
            get status() { return status; },
            get updates() { return updates; },
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

        // MSBUILD
        this._disposable.add(_solution.projectAdded
            .where(z => z.MsBuildProject != null)
            .map(z => z.MsBuildProject)
            .where(z => !_.any(this.projects, { path: z.Path }))
            .subscribe(project => {
                this._projectAddedStream.onNext(
                    new ProjectViewModel(project.AssemblyName, project.Path, _solution.path, [{
                        FriendlyName: project.TargetFramework, Name: project.TargetFramework, ShortName: project.TargetFramework
                    }], project.SourceFiles));
            }));

        this._disposable.add(_solution.projectRemoved
            .where(z => z.MsBuildProject != null)
            .map(z => z.MsBuildProject)
            .subscribe(project => {
                this._projectRemovedStream.onNext(_.find(this.projects, { path: project.Path }));
            }));

        this._disposable.add(_solution.projectChanged
            .where(z => z.MsBuildProject != null)
            .map(z => z.MsBuildProject)
            .subscribe(project => {
                var current = _.find(this.projects, { path: project.Path });
                if (current) {
                    var changed = new ProjectViewModel(project.AssemblyName, project.Path, _solution.path, [{
                        FriendlyName: project.TargetFramework, Name: project.TargetFramework, ShortName: project.TargetFramework
                    }], project.SourceFiles);
                    _.assign(current, changed);
                    this._projectChangedStream.onNext(current);
                }
            }));

        //DNX
        this._disposable.add(_solution.projectAdded
            .where(z => z.DnxProject != null)
            .map(z => z.DnxProject)
            .where(z => !_.any(this.projects, { path: z.Path }))
            .subscribe(project => {
                this._projectAddedStream.onNext(
                    new ProjectViewModel(project.Name, project.Path, _solution.path, project.Frameworks, project.Configurations, project.Commands, project.SourceFiles));
            }));

        this._disposable.add(_solution.projectRemoved
            .where(z => z.DnxProject != null)
            .map(z => z.DnxProject)
            .subscribe(project => {
                this._projectRemovedStream.onNext(_.find(this.projects, { path: project.Path }));
            }));

        this._disposable.add(_solution.projectChanged
            .where(z => z.DnxProject != null)
            .map(z => z.DnxProject)
            .subscribe(project => {
                var current = _.find(this.projects, { path: project.Path });
                if (current) {
                    var changed = new ProjectViewModel(project.Name, project.Path, _solution.path, project.Frameworks, project.Configurations, project.Commands, project.SourceFiles);
                    _.assign(current, changed);
                    this._projectChangedStream.onNext(current);
                }
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
        var o: Observable<ProjectViewModel>;
        if (this.isOn && this.projects.length) {
            o = Observable.just<ProjectViewModel>(_.find(this.projects, x => _.startsWith(path, x.path))).where(z => !!z);
        } else {
            o = this._projectAddedStream.where(x => _.startsWith(path, x.path)).take(1);
        }

        return o;
    }

    public getProjectContainingEditor(editor: Atom.TextEditor) {
        return this.getProjectContainingFile(editor.getPath());
    }

    public getProjectContainingFile(path: string) {
        var o: Observable<ProjectViewModel>;
        if (this.isOn && this.projects.length) {
            o = Observable.just<ProjectViewModel>(_.find(this.projects, x =>
                _.contains(x.sourceFiles, normalize(path))))
                .take(1)
                .defaultIfEmpty(null);
        } else {
            o = this._projectAddedStream
                .where(x => _.contains(x.sourceFiles, normalize(path)))
                .take(1)
                .defaultIfEmpty(null);
        }
        return o;
    }

    private _updateState(state) {
        this.isOn = state === DriverState.Connecting || state === DriverState.Connected;
        this.isOff = state === DriverState.Disconnected;
        this.isConnecting = state === DriverState.Connecting;
        this.isReady = state === DriverState.Connected;
        this.isError = state === DriverState.Error;
    }

    private _observeProjectEvents() {
        this._disposable.add(this._projectAddedStream
            .where(z => !_.any(this.projects, { path: z.path }))
            .subscribe(project => this.projects.push(project)));

        this._disposable.add(this._projectRemovedStream.subscribe(
            project => _.pull(this.projects, _.find(this.projects, z => z.path === project.path))));

        this._disposable.add(this._projectChangedStream.subscribe(
            project => _.assign(_.find(this.projects, z => z.path === project.path), project)));
    }


    private _setupCodecheck(_solution: Solution) {
        var codecheck = _solution.events
            .where(x => x.Event === "Diagnostic")
            .map(x => <DiagnosticMessage>x.Body)
            .tapOnNext(x => {
                if (x.Clear) {
                    _.remove(this.diagnostics, z => z.FileName === x.FileName);
                } else {
                    this.diagnostics.push(x);
                }
            })
            .debounce(200)
            .map(x => this.diagnostics = _.sortBy(this.diagnostics, quickFix => quickFix.FileName + '-' + quickFix.LogLevel))
            .startWith([])
            .shareReplay(1);

        this._disposable.add(codecheck.subscribe());
        return codecheck;
    }

    private _setupStatus(_solution: Solution) {
        var status = _solution.status
            .startWith(<any>{})
            .share();

        return status;
    }

    private _setupMsbuild(_solution: Solution) {
        var workspace = _solution.observeProjects
            .where(z => z.response.MSBuild != null)
            .where(z => z.response.MSBuild.Projects.length > 0)
            .map(z => z.response.MSBuild);

        this._disposable.add(workspace.subscribe(system => {
            _.each(system.Projects, p => {
                var project = new ProjectViewModel(p.AssemblyName, p.Path, _solution.path, [{
                    FriendlyName: p.TargetFramework, Name: p.TargetFramework, ShortName: p.TargetFramework
                }], p.SourceFiles);
                this._projectAddedStream.onNext(project);
            });
        }));
        return workspace;
    }

    private _setupDnx(_solution: Solution) {
        var workspace = _solution.observeProjects
            .where(z => z.response.Dnx != null)
            .where(z => z.response.Dnx.Projects.length > 0)
            .map(z => z.response.Dnx);

        this._disposable.add(workspace.subscribe(system => {
            this.runtime = basename(system.RuntimePath);
            this.runtimePath = system.RuntimePath;

            _.each(system.Projects, p => {
                var project = new ProjectViewModel(p.Name, p.Path, _solution.path, p.Frameworks, p.Configurations, p.Commands, p.SourceFiles);
                this._projectAddedStream.onNext(project);
            });
        }));
        return workspace;
    }

    private _setupScriptCs(_solution: Solution) {
        var context = _solution.observeProjects
            .where(z => z.response.ScriptCs != null)
            .where(z => z.response.ScriptCs.CsxFiles.length > 0)
            .map(z => z.response.ScriptCs);

        this._disposable.add(context.subscribe(context => {
            this._projectAddedStream.onNext(new ProjectViewModel("ScriptCs", context.Path, _solution.path));
        }));
        return context;
    }
}
