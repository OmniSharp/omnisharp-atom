import * as _ from "lodash";
import {ProjectViewModel, projectViewModelFactory, workspaceViewModelFactory} from "./project-view-model";
import {Observable, Subject, CompositeDisposable} from "rx";
import {ClientV2, DriverState, materialize} from "omnisharp-client";

export default class ViewModelWorker implements Rx.IDisposable {
    private _disposable = new CompositeDisposable();
    public _projects: ProjectViewModel<any>[] = [];
    private _projectAddedStream = new Subject<ProjectViewModel<any>>();
    private _projectRemovedStream = new Subject<ProjectViewModel<any>>();
    private _projectChangedStream = new Subject<ProjectViewModel<any>>();

    constructor(solution: ClientV2) {
        var cd = this._disposable;

        cd.add(solution.state.where(z => z === DriverState.Disconnected).subscribe(() => {
            _.each(this._projects.slice(), project => this._projectRemovedStream.onNext(project));
        }));

        cd.add(solution.observe.projectAdded.subscribe(projectInformation => {
            var projects = projectViewModelFactory(projectInformation, solution.projectPath);
            _.each(projects, project => {
                if (!_.any(this._projects, { path: project.path })) {
                    this._projectAddedStream.onNext(project);
                    this._projects.push(project);
                }
            });
        }));

        cd.add(solution.observe.projectRemoved.subscribe(projectInformation => {
            var projects = projectViewModelFactory(projectInformation, solution.projectPath);
            _.each(projects, project => {
                var found: ProjectViewModel<any> = _.find(this._projects, { path: project.path });
                if (found) {
                    this._projectRemovedStream.onNext(project);
                    _.pull(this._projects, found);
                }
            });
        }));

        cd.add(solution.observe.projectChanged.subscribe(projectInformation => {
            var projects = projectViewModelFactory(projectInformation, solution.projectPath);
            _.each(projects, project => {
                var found: ProjectViewModel<any> = _.find(this._projects, { path: project.path });
                if (found) {
                    found.update(project);
                    this._projectChangedStream.onNext(project);
                }
            });
        }));

        cd.add(solution.observe.projects.subscribe(context => {
            var projects = workspaceViewModelFactory(context.response, solution.projectPath);
            _.each(projects, project => {
                var found: ProjectViewModel<any> = _.find(this._projects, { path: project.path });
                if (found) {
                    found.update(project);
                    this._projectChangedStream.onNext(project);
                } else {
                    this._projectAddedStream.onNext(project);
                    this._projects.push(project);
                }
            });
        }));
    }

    public dispose() {
        this._disposable.dispose();
    }

    @materialize
    public get projectAdded() {
        return this._projectAddedStream.asObservable().share();
    }

    @materialize
    public get projectChanged() {
        return this._projectChangedStream.asObservable().share();
    }

    @materialize
    public get projectRemoved() {
        return this._projectRemovedStream.asObservable().share();
    }
}
