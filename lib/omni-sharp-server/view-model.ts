import * as _ from "lodash";
import Client = require('./client');
import {DriverState, OmnisharpClientStatus} from "omnisharp-client";
import {Observable, Subject, CompositeDisposable} from "rx";
import {basename, dirname, normalize} from "path";

export class ProjectViewModel implements OmniSharp.IProjectViewModel {
    public path: string;
    public activeFramework: OmniSharp.Models.DnxFramework;
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
            activeFramework: Observable.ofObjectChanges(this)
                .where(z => z.name === "activeFramework")
                .map(z => this.activeFramework)
                .shareReplay(1)
        };
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
    public get uniqueId() { return this._client.uniqueId; }

    public get index() { return this._client.index; }
    public get path() { return this._client.path; }
    public output: OmniSharp.OutputMessage[] = [];
    public diagnostics: OmniSharp.Models.DiagnosticLocation[] = [];
    public get state() { return this._client.currentState };
    public packageSources: string[] = [];
    public runtime = '';
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

    constructor(private _client: Client) {
        this._uniqueId = _client.uniqueId;
        this._updateState(_client.currentState);
        this._observeProjectEvents();

        // Manage our build log for display
        this._disposable.add(_client.logs.subscribe(event => {
            this.output.push(event);
            if (this.output.length > 1000)
                this.output.shift();
        }));

        this._disposable.add(_client.state.where(z => z === DriverState.Disconnected).subscribe(() => {
            _.each(this.projects.slice(), project => this._projectRemovedStream.onNext(project));
            this.projects = [];
            this.diagnostics = [];
        }));

        var codecheck = this.setupCodecheck(_client);
        var status = this.setupStatus(_client);
        var output = this.output;
        var updates = Observable.ofObjectChanges(this);
        var msbuild = this.setupMsbuild(_client);
        var dnx = this.setupDnx(_client);
        var scriptcs = this.setupScriptCs(_client);


        var _projectAddedStream = this._projectAddedStream;
        var _projectRemovedStream = this._projectRemovedStream;
        var _projectChangedStream = this._projectChangedStream;
        var projects = Observable.merge(_projectAddedStream, _projectRemovedStream, _projectChangedStream)
            .map(z => this.projects);

        var outputObservable = _client.logs
            .window(_client.logs.throttle(100), () => Observable.timer(100))
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

        this._disposable.add(_client.state.subscribe(_.bind(this._updateState, this)));

        (window['clients'] || (window['clients'] = [])).push(this);  //TEMP

        this._disposable.add(_client.state.where(z => z === DriverState.Connected)
            .subscribe(() => {
                _client.projects({ ExcludeSourceFiles: false });

                _client.packagesource({ ProjectPath: _client.path })
                    .subscribe(response => {
                        this.packageSources = response.Sources;
                    });
            }));

        // MSBUILD
        this._disposable.add(_client.projectAdded
            .where(z => z.MsBuildProject != null)
            .map(z => z.MsBuildProject)
            .where(z => !_.any(this.projects, { path: z.Path }))
            .subscribe(project => {
                this._projectAddedStream.onNext(
                    new ProjectViewModel(project.AssemblyName, project.Path, _client.path, [{
                        FriendlyName: project.TargetFramework, Name: project.TargetFramework, ShortName: project.TargetFramework
                    }], project.SourceFiles));
            }));

        this._disposable.add(_client.projectRemoved
            .where(z => z.MsBuildProject != null)
            .map(z => z.MsBuildProject)
            .subscribe(project => {
                this._projectRemovedStream.onNext(_.find(this.projects, { path: project.Path }));
            }));

        this._disposable.add(_client.projectChanged
            .where(z => z.MsBuildProject != null)
            .map(z => z.MsBuildProject)
            .subscribe(project => {
                var current = _.find(this.projects, { path: project.Path });
                if (current) {
                    var changed = new ProjectViewModel(project.AssemblyName, project.Path, _client.path, [{
                        FriendlyName: project.TargetFramework, Name: project.TargetFramework, ShortName: project.TargetFramework
                    }], project.SourceFiles);
                    _.assign(current, changed);
                    this._projectChangedStream.onNext(current);
                }
            }));

        //DNX
        this._disposable.add(_client.projectAdded
            .where(z => z.DnxProject != null)
            .map(z => z.DnxProject)
            .where(z => !_.any(this.projects, { path: z.Path }))
            .subscribe(project => {
                this._projectAddedStream.onNext(
                    new ProjectViewModel(project.Name, project.Path, _client.path, project.Frameworks, project.Configurations, project.Commands, project.SourceFiles));
            }));

        this._disposable.add(_client.projectRemoved
            .where(z => z.DnxProject != null)
            .map(z => z.DnxProject)
            .subscribe(project => {
                this._projectRemovedStream.onNext(_.find(this.projects, { path: project.Path }));
            }));

        this._disposable.add(_client.projectChanged
            .where(z => z.DnxProject != null)
            .map(z => z.DnxProject)
            .subscribe(project => {
                var current = _.find(this.projects, { path: project.Path });
                if (current) {
                    var changed = new ProjectViewModel(project.Name, project.Path, _client.path, project.Frameworks, project.Configurations, project.Commands, project.SourceFiles);
                    _.assign(current, changed);
                    this._projectChangedStream.onNext(current);
                }
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

    private setupCodecheck(_client: Client) {
        var codecheck = Observable.merge(
            // Catch global code checks
            _client.observeCodecheck
                .where(z => !z.request.FileName)
                .map(z => z.response)
                .map(z => <OmniSharp.Models.DiagnosticLocation[]>z.QuickFixes),
            // Evict diagnostics from a code check for the given file
            // Then insert the new diagnostics
            _client.observeCodecheck
                .where(z => !!z.request.FileName)
                .map(({request, response}) => {
                    var results = _.filter(this.diagnostics, (fix: OmniSharp.Models.DiagnosticLocation) => request.FileName !== fix.FileName);
                    results.unshift(...<OmniSharp.Models.DiagnosticLocation[]>response.QuickFixes);
                    return results;
                }))
            .map(data => _.sortBy(data, quickFix => quickFix.LogLevel))
            .startWith([])
            .shareReplay(1);

        this._disposable.add(codecheck.subscribe((data) => this.diagnostics = data));
        return codecheck;
    }

    private setupStatus(_client: Client) {
        var status = _client.status
            .startWith(<any>{})
            .share();

        return status;
    }

    private setupMsbuild(_client: Client) {
        var workspace = _client.observeProjects
            .where(z => z.response.MSBuild != null)
            .where(z => z.response.MSBuild.Projects.length > 0)
            .map(z => z.response.MSBuild);

        this._disposable.add(workspace.subscribe(system => {
            _.each(system.Projects, p => {
                var project = new ProjectViewModel(p.AssemblyName, p.Path, _client.path, [{
                    FriendlyName: p.TargetFramework, Name: p.TargetFramework, ShortName: p.TargetFramework
                }], p.SourceFiles);
                this._projectAddedStream.onNext(project);
            });
        }));
        return workspace;
    }

    private setupDnx(_client: Client) {
        var workspace = _client.observeProjects
            .where(z => z.response.Dnx != null)
            .where(z => z.response.Dnx.Projects.length > 0)
            .map(z => z.response.Dnx);

        this._disposable.add(workspace.subscribe(system => {
            this.runtime = basename(system.RuntimePath);

            _.each(system.Projects, p => {
                var project = new ProjectViewModel(p.Name, p.Path, _client.path, p.Frameworks, p.Configurations, p.Commands, p.SourceFiles);
                this._projectAddedStream.onNext(project);
            });
        }));
        return workspace;
    }

    private setupScriptCs(_client: Client) {
        var context = _client.observeProjects
            .where(z => z.response.ScriptCs != null)
            .where(z => z.response.ScriptCs.CsxFiles.length > 0)
            .map(z => z.response.ScriptCs);

        this._disposable.add(context.subscribe(context => {
            this._projectAddedStream.onNext(new ProjectViewModel("ScriptCs", context.Path, _client.path));
        }));
        return context;
    }
}
