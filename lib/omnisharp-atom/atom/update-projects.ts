import {CompositeDisposable, Observable} from "rx";
import * as _ from 'lodash';
import Omni = require('../../omni-sharp-server/omni');
import {ProjectViewModel} from "../../omni-sharp-server/view-model";

class UpdateProject implements OmniSharp.IAtomFeature {
    private disposable: Rx.CompositeDisposable;
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

        // We're keeping track of paths, just so we have a local reference
        this._paths = atom.project.getPaths();
        atom.project.onDidChangePaths(paths => this._paths = paths);

        this.disposable.add(Omni.listener.model.projectAdded
            .where(z => this._autoAddExternalProjects || this._nagAddExternalProjects)
            .where(z => !_.startsWith(z.path, z.solutionPath))
            .where(z => !_.any(this._paths, x => _.startsWith(z.path, x)))
            .buffer(Omni.listener.model.projectAdded.throttleFirst(1000), () => Observable.timer(1000))
            .where(z => z.length > 0)
            .subscribe(project => this.handleProjectAdded(project)));

        this.disposable.add(Omni.listener.model.projectRemoved
            .where(z => this._autoAddExternalProjects || this._nagAddExternalProjects)
            .where(z => !_.startsWith(z.path, z.solutionPath))
            .where(z => _.any(this._paths, x => _.startsWith(z.path, x)))
            .buffer(Omni.listener.model.projectRemoved.throttleFirst(1000), () => Observable.timer(1000))
            .where(z => z.length > 0)
            .subscribe(project => this.handleProjectRemoved(project)));

        Omni.registerConfiguration(client => {
            if (!client.temporary) {
                var path = _.find(this._paths, x => _.startsWith(x, client.path) && x !== client.path);
                if (path) {
                    if (this._autoAdjustTreeView) {
                        this.adjustTreeView(path, client.path);
                    } else if (this._nagAdjustTreeView) {
                        // notify for adjustment
                        let notification = atom.notifications.addInfo("Show solution root?", {
                            detail: `${path}\n-> ${client.path}`,
                            description: 'It appears the solution root is not displayed in the treeview.  Would you like to show the entire solution in the tree view?',
                            buttons: [
                                {
                                    text: 'Okay',
                                    className: 'btn-success',
                                    onDidClick: () => {
                                        this.adjustTreeView(path, client.path);
                                        notification.dismiss();
                                    }
                                }, {
                                    text: 'Dismiss',
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
        var newPaths = this._paths.slice()
        newPaths.splice(_.findIndex(this._paths, oldPath), 1, newPath);
        atom.project.setPaths(<any>newPaths);
    }

    private handleProjectAdded(projects: ProjectViewModel[]) {
        var paths = _.unique(projects.map(z => z.path));
        if (this._autoAddExternalProjects) {
            for (var project of paths) {
                atom.project.addPath(project);
            }
        } else if (this._nagAddExternalProjects) {
            let notification = atom.notifications.addInfo(`Add external projects?`, {
                detail: paths.join('\n'),
                description: `We have detected external projects would you like to add them to the treeview?`,
                buttons: [
                    {
                        text: 'Okay',
                        className: 'btn-success',
                        onDidClick: () => {
                            for (var project of paths) {
                                atom.project.addPath(project);
                            }

                            notification.dismiss();
                        }
                    }, {
                        text: 'Dismiss',
                        onDidClick: () => {
                            notification.dismiss();
                        }
                    }
                ],
                dismissable: true
            });
        }
    }

    private _notifications: { [key: string]: Atom.Notification } = {};

    private handleProjectRemoved(projects: ProjectViewModel[]) {
        var paths = _.unique(projects.map(z => z.path));
        if (this._autoAddExternalProjects) {
            for (var project of paths) {
                atom.project.removePath(project);
            }
        } else if (this._nagAddExternalProjects) {
            let notification = atom.notifications.addInfo(`Remove external projects?`, {
                detail: paths.join('\n'),
                description: `We have detected external projects have been removed, would you like to remove them from the treeview?`,
                buttons: [
                    {
                        text: 'Okay',
                        className: 'btn-success',
                        onDidClick: () => {
                            for (var project of paths) {
                                atom.project.removePath(project);
                            }
                            notification.dismiss();
                        }
                    }, {
                        text: 'Dismiss',
                        onDidClick: () => {
                            notification.dismiss();
                        }
                    }
                ],
                dismissable: true
            });
        }
    }

    public attach() { }

    public dispose() {
        this.disposable.dispose();
    }

}

export var updateProject = new UpdateProject;
