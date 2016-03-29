import {Observable} from "rxjs";
import {CompositeDisposable} from "omnisharp-client";
import _ from "lodash";
import {Omni} from "../server/omni";
import {ProjectViewModel} from "../server/project-view-model";
import * as fs from "fs";
const stat = Observable.bindNodeCallback(fs.stat);
import {dirname} from "path";
import {bufferFor} from "../operators/bufferFor";

class UpdateProject implements IAtomFeature {
    private disposable: CompositeDisposable;
    private _paths: string[];

    private _autoAdjustTreeView: boolean;
    private _nagAdjustTreeView: boolean;
    private _autoAddExternalProjects: boolean;
    private _nagAddExternalProjects: boolean;

    public activate() {
        this.disposable = new CompositeDisposable();

        atom.config.observe("omnisharp-atom.autoAdjustTreeView", (value: boolean) => this._autoAdjustTreeView = value);
        atom.config.observe("omnisharp-atom.nagAdjustTreeView", (value: boolean) => this._nagAdjustTreeView = value);

        atom.config.observe("omnisharp-atom.autoAddExternalProjects", (value: boolean) => this._autoAddExternalProjects = value);
        atom.config.observe("omnisharp-atom.nagAddExternalProjects", (value: boolean) => this._nagAddExternalProjects = value);

        // We"re keeping track of paths, just so we have a local reference
        this._paths = atom.project.getPaths();
        atom.project.onDidChangePaths((paths: any[]) => this._paths = paths);

        this.disposable.add(
            bufferFor(
                Omni.listener.model.projectAdded
                    .filter(z => this._autoAddExternalProjects || this._nagAddExternalProjects)
                    .filter(z => !_.startsWith(z.path, z.solutionPath))
                    .filter(z => !_.some(this._paths, x => _.startsWith(z.path, x))),
                1000
            )
                .filter(z => z.length > 0)
                .subscribe(project => this.handleProjectAdded(project)));

        this.disposable.add(
            bufferFor(
                Omni.listener.model.projectRemoved
                    .filter(z => this._autoAddExternalProjects || this._nagAddExternalProjects)
                    .filter(z => !_.startsWith(z.path, z.solutionPath))
                    .filter(z => _.some(this._paths, x => _.startsWith(z.path, x))),
                1000
            )
                .filter(z => z.length > 0)
                .subscribe(project => this.handleProjectRemoved(project)));

        Omni.registerConfiguration(solution => {
            if (!solution.temporary) {
                const path = _.find(this._paths, x => _.startsWith(x, solution.path) && x !== solution.path);
                if (path) {
                    if (this._autoAdjustTreeView) {
                        this.adjustTreeView(path, solution.path);
                    } else if (this._nagAdjustTreeView) {
                        // notify for adjustment
                        let notification = atom.notifications.addInfo("Show solution root?", <any>{
                            detail: `${path}\n-> ${solution.path}`,
                            description: "It appears the solution root is not displayed in the treeview.  Would you like to show the entire solution in the tree view?",
                            buttons: [
                                {
                                    text: "Okay",
                                    className: "btn-success",
                                    onDidClick: () => {
                                        this.adjustTreeView(path, solution.path);
                                        notification.dismiss();
                                    }
                                }, {
                                    text: "Dismiss",
                                    onDidClick: () => {
                                        notification.dismiss();
                                    }
                                }
                            ],
                            dismissable: true
                        });
                    }
                }
            }
        });
    }

    private adjustTreeView(oldPath: string, newPath: string) {
        const newPaths = this._paths.slice();
        newPaths.splice(_.findIndex(this._paths, oldPath), 1, newPath);
        atom.project.setPaths(<any>newPaths);
    }

    private getProjectDirectories(projects: ProjectViewModel<any>[]) {
        return Observable.from<string>(_.uniq(projects.map(z => z.path)))
            .flatMap(project => stat(project), (project, st) => {
                if (st.isDirectory()) {
                    return project;
                } else {
                    return dirname(project);
                }
            })
            .toArray();
    }

    private handleProjectAdded(projects: ProjectViewModel<any>[]) {
        this.getProjectDirectories(projects)
            .subscribe(paths => {
                if (this._autoAddExternalProjects) {
                    for (const project of paths) {
                        atom.project.addPath(project);
                    }
                } else if (this._nagAddExternalProjects) {
                    let notification = atom.notifications.addInfo(`Add external projects?`, <any>{
                        detail: paths.join("\n"),
                        description: `We have detected external projects would you like to add them to the treeview?`,
                        buttons: [
                            {
                                text: "Okay",
                                className: "btn-success",
                                onDidClick: () => {
                                    for (const project of paths) {
                                        atom.project.addPath(project);
                                    }

                                    notification.dismiss();
                                }
                            }, {
                                text: "Dismiss",
                                onDidClick: () => {
                                    notification.dismiss();
                                }
                            }
                        ],
                        dismissable: true
                    });
                }
            });
    }

    private handleProjectRemoved(projects: ProjectViewModel<any>[]) {
        this.getProjectDirectories(projects)
            .subscribe(paths => {
                if (this._autoAddExternalProjects) {
                    for (const project of paths) {
                        atom.project.removePath(project);
                    }
                } else if (this._nagAddExternalProjects) {
                    let notification = atom.notifications.addInfo(`Remove external projects?`, <any>{
                        detail: paths.join("\n"),
                        description: `We have detected external projects have been removed, would you like to remove them from the treeview?`,
                        buttons: [
                            {
                                text: "Okay",
                                className: "btn-success",
                                onDidClick: () => {
                                    for (const project of paths) {
                                        atom.project.removePath(project);
                                    }
                                    notification.dismiss();
                                }
                            }, {
                                text: "Dismiss",
                                onDidClick: () => {
                                    notification.dismiss();
                                }
                            }
                        ],
                        dismissable: true
                    });
                }
            });
    }

    public attach() { /* */ }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = "Atom Project Updater";
    public description = "Adds support for detecting external projects and if atom is looking at the wrong project folder.";
}

export const updateProject = new UpdateProject;
