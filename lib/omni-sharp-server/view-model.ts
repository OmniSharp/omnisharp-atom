import * as _ from "lodash";
import {Solution} from "./solution";
import {DriverState, OmnisharpClientStatus} from "omnisharp-client";
import {Observable, Subject, ReplaySubject, CompositeDisposable, Disposable} from "rx";
import {basename, dirname, normalize} from "path";
import {ProjectViewModel, projectFromProxy} from "./project-view-model";
import ViewModelWorker from "./view-model.worker";

interface DiagnosticMessage extends OmniSharp.Models.DiagnosticLocation {
    Clear: boolean;
}

export class ViewModel implements Rx.IDisposable {
    public isOff: boolean;
    public isConnecting: boolean;
    public isOn: boolean;
    public isReady: boolean;
    public isError: boolean;

    private _uniqueId;
    private _disposable = new CompositeDisposable();
    private _worker: ViewModelWorker;
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

    public observe: {
        diagnostics: Rx.Observable<OmniSharp.Models.DiagnosticLocation[]>;
        output: Rx.Observable<OmniSharp.OutputMessage[]>;
        status: Rx.Observable<OmnisharpClientStatus>;
        updates: Rx.Observable<Rx.ObjectObserveChange<ViewModel>>;
        projectAdded: Rx.Observable<ProjectViewModel<any>>;
        projectRemoved: Rx.Observable<ProjectViewModel<any>>;
        projectChanged: Rx.Observable<ProjectViewModel<any>>;
        projects: Rx.Observable<ProjectViewModel<any>[]>;
    };

    constructor(private _solution: Solution) {
        var worker = this._worker = _solution.getWorker<ViewModelWorker>(__dirname, 'view-model.worker');
        this._uniqueId = _solution.uniqueId;
        this._updateState(_solution.currentState);

        // Manage our build log for display
        this._disposable.add(_solution.logs.subscribe(event => {
            this.output.push(event);
            if (this.output.length > 1000)
                this.output.shift();
        }));

        this._disposable.add(_solution.state.where(z => z === DriverState.Disconnected).subscribe(() => {
            this.projects = [];
            // CODECHECK v2
            //this._diagnosticMap.clear();
            this.diagnostics = [];
        }));

        var codecheck = this._setupCodecheck(_solution);
        var status = this._setupStatus(_solution);
        var output = this.output;
        var updates = Observable.ofObjectChanges(this);

        var outputObservable = _solution.logs
            .window(_solution.logs.throttle(100), () => Observable.timer(100))
            .flatMap(x => x.startWith(null).last())
            .map(() => output);

        var projectAdded = worker.projectAdded
            .map(projectFromProxy)
            .tapOnNext(project => this.projects.push(project))
            .share();

        var projectRemoved = worker.projectRemoved
            .map(projectFromProxy)
            .tapOnNext(project => {
                var p = _.find(this.projects, { path: p.path });
                if (p) _.pull(this.projects, p);
            })
            .share();

        var projectChanged = worker.projectChanged
            .map(projectFromProxy)
            .tapOnNext(project => {
                var p = _.find(this.projects, { path: p.path });
                if (p) p.update(project);
            })
            .share();

        var projects = Observable.merge(projectAdded, projectRemoved, projectChanged)
            .debounce(200)
            .map(z => this.projects)
            .share();

        this._disposable.add(projects.subscribe(projects =>
            this.projects = projects));

        this.observe = {
            get diagnostics() { return codecheck; },
            get output() { return outputObservable; },
            get status() { return status; },
            get updates() { return updates; },
            get projects() { return projects; },
            get projectAdded() { return projectAdded; },
            get projectRemoved() { return projectRemoved; },
            get projectChanged() { return projectChanged; },
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
            var project = _.find(this.projects, x => _.startsWith(path, x.path));
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
    }

    /* CODECHECK v2
        public getDiagnostics() {
            var results = [];
            this._diagnosticMap.forEach(set => {
                var values = [];
                set.forEach(value => values.push(value));
                results.push(..._.sortBy(values, (x: OmniSharp.Models.DiagnosticLocation) => `${x.Line}-${x.Column}-${x.LogLevel}`));
            });
            return results;
        }

        public getDiagnosticsFor(path: string) {
            if (!this._diagnosticMap.has(path)) return [];
            var values = [];
            this._diagnosticMap.get(path).forEach(value => values.push(value));
            return _.sortBy(values, (x: OmniSharp.Models.DiagnosticLocation) => `${x.Line}-${x.Column}-${x.LogLevel}`);

        }

        private _diagnosticMap = new Map<string, Set<OmniSharp.Models.DiagnosticLocation>>();

        private _setupCodecheck(_solution: Solution) {
            var codecheck = _solution.events
                .where(x => x.Event === "Diagnostic")
                .map(x => <DiagnosticMessage>x.Body)
                .tapOnNext(x => {
                    if (x.Clear && this._diagnosticMap.has(x.FileName)) {
                        this._diagnosticMap.delete(x.FileName);
                    } else if (!x.Clear) {
                        if (!this._diagnosticMap.has(x.FileName)) {
                            this._diagnosticMap.set(x.FileName, new Set<OmniSharp.Models.DiagnosticLocation>());
                        }
                        this._diagnosticMap.get(x.FileName).add(x);
                    }
                })
                .debounce(200)
                .map(x => this.getDiagnostics())
                .startWith([])
                .share();

            this._disposable.add(codecheck.subscribe());
            return codecheck;
        }*/
    private _setupCodecheck(_solution: Solution) {
        var codecheck = Observable.merge(
            // Catch global code checks
            _solution.observe.codecheck
                .where(z => !z.request.FileName)
                .map(z => z.response)
                .map(z => <OmniSharp.Models.DiagnosticLocation[]>z.QuickFixes),
            // Evict diagnostics from a code check for the given file
            // Then insert the new diagnostics
            _solution.observe.codecheck
                .where(z => !!z.request.FileName)
                .map((ctx) => {
                    var {request, response} = ctx;
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

    private _setupStatus(_solution: Solution) {
        var status = _solution.status
            .startWith(<any>{})
            .share();

        return status;
    }
}
