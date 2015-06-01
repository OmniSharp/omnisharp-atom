import * as _ from "lodash";
import Client = require('./client');
import {DriverState, OmnisharpClientStatus} from "omnisharp-client";
import {Observable, Subject} from "rx";
import {basename} from "path";

class ProjectViewModel implements OmniSharp.IProjectViewModel {
    constructor(
        public name: string,
        public path: string,
        public frameworks: string[] = [],
        public configurations: string[] = [],
        public commands: { [key: string]: string } = <any>{}
        ) {
    }
}

class ViewModel {
    public isOff: boolean;
    public isConnecting: boolean;
    public isOn: boolean;
    public isReady: boolean;
    public isError: boolean;


    private _uniqueId;
    public get uniqueId() { return this._client.uniqueId; }

    public get index() { return this._client.index; }
    public get path() { return this._client.path; }
    public output: OmniSharp.OutputMessage[] = [];
    public diagnostics: OmniSharp.Models.DiagnosticLocation[] = [];
    public status: OmnisharpClientStatus;

    // Project information
    public msbuild: OmniSharp.Models.MsBuildWorkspaceInformation;
    public aspnet5: OmniSharp.Models.AspNet5WorkspaceInformation;
    public scriptcs: OmniSharp.ScriptCs.ScriptCsContext;

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
        _client.logs.subscribe(event => {
            this.output.push(event);
            if (this.output.length > 1000)
                this.output.shift();
        });

        var codecheck = this.setupCodecheck(_client);
        var status = this.setupStatus(_client);
        var output = this.output;
        var updates = Observable.ofObjectChanges(this);
        var msbuild = this.setupMsbuild(_client);
        var aspnet5 = this.setupAspnet5(_client);
        var scriptcs = this.setupScriptCs(_client);


        var _projectAddedStream = this._projectAddedStream;
        var _projectRemovedStream = this._projectRemovedStream;
        var _projectChangedStream = this._projectChangedStream;
        var projects = Observable.merge(_projectAddedStream, _projectRemovedStream, _projectChangedStream)
            .map(z => this.projects);

        this.observe = {
            get codecheck() { return codecheck; },
            get output() { return _client.logs.map(() => output); },
            get status() { return status; },
            get updates() { return updates; },
            get projects() { return projects; },
            get projectAdded() { return _projectAddedStream; },
            get projectRemoved() { return _projectRemovedStream; },
            get projectChanged() { return _projectChangedStream; },
        };

        _client.state.subscribe(_.bind(this._updateState, this));

        (window['clients'] || (window['clients'] = [])).push(this);  //TEMP

        // Get projects as soon as they're loaded
        _client.projects().toPromise().then(() => {
            _client.projectAdded
                .where(z => z.MsBuildProject != null)
                .map(z => z.MsBuildProject)
                .subscribe(project => {
                    this.msbuild.Projects.push(project);
                    this._projectAddedStream.onNext(
                        new ProjectViewModel(project.AssemblyName,
                            project.Path, [project.TargetFramework]));
                });

            _client.projectRemoved
                .where(z => z.MsBuildProject != null)
                .map(z => z.MsBuildProject)
                .subscribe(project => {
                    _.pull(this.msbuild.Projects, _.find(this.msbuild.Projects, z => z.Path === project.Path));
                    this._projectRemovedStream.onNext(_.find(this.projects, z => z.path === project.Path));
                });

            _client.projectChanged
                .where(z => z.MsBuildProject != null)
                .map(z => z.MsBuildProject)
                .subscribe(project => {
                    _.assign(_.find(this.msbuild.Projects, z => z.Path === project.Path), project);
                    this._projectChangedStream.onNext(new ProjectViewModel(project.AssemblyName,
                        project.Path, [project.TargetFramework]));
                });

            _client.projectAdded
                .where(z => z.AspNet5Project != null)
                .map(z => z.AspNet5Project)
                .subscribe(project => {
                    this.aspnet5.Projects.push(project);
                    this._projectAddedStream.onNext(
                        new ProjectViewModel(project.Name, project.Path, project.Frameworks, project.Configurations, project.Commands));
                });

            _client.projectRemoved
                .where(z => z.AspNet5Project != null)
                .map(z => z.AspNet5Project)
                .subscribe(project => {
                    _.pull(this.aspnet5.Projects, _.find(this.aspnet5.Projects, z => z.Path === project.Path));
                    this._projectRemovedStream.onNext(_.find(this.projects, z => z.path === project.Path));
                });

            _client.projectChanged
                .where(z => z.AspNet5Project != null)
                .map(z => z.AspNet5Project)
                .subscribe(project => {
                    _.assign(_.find(this.aspnet5.Projects, z => z.Path === project.Path), project);
                    this._projectChangedStream.onNext(
                        new ProjectViewModel(project.Name, project.Path, project.Frameworks, project.Configurations, project.Commands));
                });
        })
    }

    private _updateState(state) {
        this.isOn = state === DriverState.Connecting || state === DriverState.Connected;
        this.isOff = state === DriverState.Disconnected;
        this.isConnecting = state === DriverState.Connecting;
        this.isReady = state === DriverState.Connected;
        this.isError = state === DriverState.Error;
    }

    private _observeProjectEvents() {
        this._projectAddedStream.subscribe(
            project => this.projects.push(project));

        this._projectRemovedStream.subscribe(
            project => _.pull(this.projects, _.find(this.projects, z => z.path === project.path)));

        this._projectChangedStream.subscribe(
            project => _.assign(_.find(this.projects, z => z.path === project.path), project));
    }

    private setupCodecheck(_client: Client) {
        var codecheck = _client.observeCodecheck
            .where(z => !z.request.FileName)
            .map(z => z.response)
            .map(z => <OmniSharp.Models.DiagnosticLocation[]>z.QuickFixes)
            .map(data => _.sortBy(data, quickFix => quickFix.LogLevel))
            .startWith([])
            .shareReplay(1);

        codecheck.subscribe((data) => this.diagnostics = data);

        return codecheck;
    }

    private setupStatus(_client: Client) {
        var status = _client.status
            .startWith(<any>{})
            .share();

        _client.status.subscribe(z => this.status = z);

        return status;
    }

    private setupMsbuild(_client: Client) {
        var workspace = _client.observeProjects
            .where(z => z.response.MSBuild != null)
            .where(z => z.response.MSBuild.Projects.length > 0)
            .map(z => z.response.MSBuild);

        workspace.subscribe(project => {
            this.msbuild = project;

            _.each(this.msbuild.Projects
                .map(p => new ProjectViewModel(p.AssemblyName,
                    p.Path, [p.TargetFramework])),
                project => this._projectAddedStream.onNext(project));
        });

        return workspace;
    }

    private setupAspnet5(_client: Client) {
        var workspace = _client.observeProjects
            .where(z => z.response.AspNet5 != null)
            .where(z => z.response.AspNet5.Projects.length > 0)
            .map(z => z.response.AspNet5);

        workspace.subscribe(project => {
            this.aspnet5 = project;
            this.runtime = basename(project.RuntimePath);

            _.each(this.aspnet5.Projects
                .map(p => new ProjectViewModel(p.Name, p.Path, p.Frameworks, p.Configurations, p.Commands)),
                project => this._projectAddedStream.onNext(project));
        });

        return workspace;
    }

    private setupScriptCs(_client: Client) {
        var context = _client.observeProjects
            .where(z => z.response.ScriptCs != null)
            .where(z => z.response.ScriptCs.CsxFiles.length > 0)
            .map(z => z.response.ScriptCs);

        context.subscribe(context => {
            this.scriptcs = context;
            this._projectAddedStream.onNext(new ProjectViewModel("ScriptCs", context.Path));
        });

        return context;
    }
}

export = ViewModel;
