import {CompositeDisposable, Observable} from "rx";
import * as _ from 'lodash';
import Omni = require('../../omni-sharp-server/omni');
import {ProjectViewModel} from "../../omni-sharp-server/view-model";

class UpdateProject implements OmniSharp.IAtomFeature {
    private disposable: Rx.CompositeDisposable;
    private _paths: string[];

    public activate() {
        this.disposable = new CompositeDisposable();

        // We're keeping track of paths, just so we have a local reference
        this._paths = atom.project.getPaths();
        atom.project.onDidChangePaths(paths => this._paths = paths);

        Omni.registerConfiguration(client => {
            var path = _.find(this._paths, x => _.startsWith(x, client.path) && x !== client.path);
            if (path) {
                // notify for adjustment
                let notification = atom.notifications.addInfo("Show solution root?", {
                    detail: `${path}\n-> ${client.path}`,
                    description: 'It appears the solution root is not displayed in the treeview.  Would you like to show the entire solution in the tree view?',
                    buttons: [
                        {
                            text: 'Okay',
                            className: 'btn-success',
                            onDidClick: () => {
                                var newPaths = this._paths.slice().splice(_.findIndex(this._paths, path), 1, path);
                                atom.project.setPaths(<any>newPaths);

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

            this.disposable.add(client.model.observe.projectAdded
                .where(z => !_.startsWith(z.path, client.path))
                .where(z => !_.any(this._paths, x => _.startsWith(z.path, x)))
                .buffer(client.model.observe.projectAdded.throttleFirst(1000), () => Observable.timer(1000))
                .subscribe(project => this.handleProjectAdded(project)));

            this.disposable.add(client.model.observe.projectRemoved
                .where(z => !_.startsWith(z.path, client.path))
                .where(z => _.any(this._paths, x => _.startsWith(z.path, x)))
                .buffer(client.model.observe.projectRemoved.throttleFirst(1000), () => Observable.timer(1000))
                .subscribe(project => this.handleProjectRemoved(project)));
        });
    }

    private handleProjectAdded(projects: ProjectViewModel[]) {
        let notification = atom.notifications.addInfo(`Add external projects?`, {
            detail: projects.map(z => `${z.name}`).join('\n'),
            description: `We have detected external projects would you like to add them to the treeview?`,
            buttons: [
                {
                    text: 'Okay',
                    className: 'btn-success',
                    onDidClick: () => {
                        for (var project of projects) {
                            atom.project.addPath(project.path);
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

    private _notifications: { [key: string]: Atom.Notification } = {};

    private handleProjectRemoved(projects: ProjectViewModel[]) {
        let notification = atom.notifications.addInfo(`Remove external projects?`, {
            detail: projects.map(z => `${z.name}`).join('\n'),
            description: `We have detected external projects have been removed, would you like to remove them from the treeview?`,
            buttons: [
                {
                    text: 'Okay',
                    className: 'btn-success',
                    onDidClick: () => {
                        for (var project of projects) {
                            atom.project.removePath(project.path);
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

    public attach() { }

    public dispose() {
        this.disposable.dispose();
    }

}

export var updateProject = new UpdateProject;
