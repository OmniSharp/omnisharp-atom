import * as fs from 'fs';
import { find, findIndex, some, startsWith, uniq } from 'lodash';
import { Observable } from 'rxjs';
import { CompositeDisposable } from 'ts-disposables';
import { Omni } from '../server/omni';
import { ProjectViewModel } from '../server/project-view-model';
const stat = Observable.bindNodeCallback(fs.stat);
import { dirname } from 'path';

class UpdateProject implements IAtomFeature {
    public required = true;
    public title = 'Atom Project Updater';
    public description = 'Adds support for detecting external projects and if atom is looking at the wrong project folder.';

    private disposable: CompositeDisposable;
    private _paths: string[];

    private _autoAdjustTreeView: boolean;
    private _nagAdjustTreeView: boolean;
    private _autoAddExternalProjects: boolean;
    private _nagAddExternalProjects: boolean;

    public activate() {
        this.disposable = new CompositeDisposable();

        atom.config.observe('omnisharp-atom.autoAdjustTreeView', (value: boolean) => this._autoAdjustTreeView = value);
        atom.config.observe('omnisharp-atom.nagAdjustTreeView', (value: boolean) => this._nagAdjustTreeView = value);

        atom.config.observe('omnisharp-atom.autoAddExternalProjects', (value: boolean) => this._autoAddExternalProjects = value);
        atom.config.observe('omnisharp-atom.nagAddExternalProjects', (value: boolean) => this._nagAddExternalProjects = value);

        // We"re keeping track of paths, just so we have a local reference
        this._paths = atom.project.getPaths();
        atom.project.onDidChangePaths((paths: any[]) => this._paths = paths);

        this.disposable.add(
            Omni.listener.model.projectAdded
                .filter(z => this._autoAddExternalProjects || this._nagAddExternalProjects)
                .filter(z => !startsWith(z.path, z.solutionPath))
                .filter(z => !some(this._paths, x => startsWith(z.path, x)))
                .subscribe(project => this._handleProjectAdded([project])));

        this.disposable.add(
            Omni.listener.model.projectRemoved
                .filter(z => this._autoAddExternalProjects || this._nagAddExternalProjects)
                .filter(z => !startsWith(z.path, z.solutionPath))
                .filter(z => some(this._paths, x => startsWith(z.path, x)))
                .subscribe(project => this._handleProjectRemoved([project])));

        Omni.registerConfiguration(solution => {
            if (!solution.temporary) {
                const path = find(this._paths, x => startsWith(x, solution.path) && x !== solution.path);
                if (path) {
                    if (this._autoAdjustTreeView) {
                        this._adjustTreeView(path, solution.path);
                    } else if (this._nagAdjustTreeView) {
                        // notify for adjustment
                        const notification = atom.notifications.addInfo('Show solution root?', <any>{
                            detail: `${path}\n-> ${solution.path}`,
                            // tslint:disable-next-line:max-line-length
                            description: 'It appears the solution root is not displayed in the treeview.  Would you like to show the entire solution in the tree view?',
                            buttons: [
                                {
                                    text: 'Okay',
                                    className: 'btn-success',
                                    onDidClick: () => {
                                        this._adjustTreeView(path, solution.path);
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

    public attach() { /* */ }

    public dispose() {
        this.disposable.dispose();
    }

    private _adjustTreeView(oldPath: string, newPath: string) {
        const newPaths = this._paths.slice();
        newPaths.splice(findIndex(this._paths, oldPath), 1, newPath);
        atom.project.setPaths(<any>newPaths);
    }

    private _getProjectDirectories(projects: ProjectViewModel<any>[]) {
        return Observable.from<string>(uniq(projects.map(z => z.path)))
            .flatMap(project => stat(project), (project, st) => {
                if (st.isDirectory()) {
                    return project;
                } else {
                    return dirname(project);
                }
            })
            .toArray();
    }

    private _handleProjectAdded(projects: ProjectViewModel<any>[]) {
        this._getProjectDirectories(projects)
            .subscribe(paths => {
                if (this._autoAddExternalProjects) {
                    for (const project of paths) {
                        atom.project.addPath(project);
                    }
                } else if (this._nagAddExternalProjects) {
                    const notification = atom.notifications.addInfo(`Add external projects?`, <any>{
                        detail: paths.join('\n'),
                        description: `We have detected external projects would you like to add them to the treeview?`,
                        buttons: [
                            {
                                text: 'Okay',
                                className: 'btn-success',
                                onDidClick: () => {
                                    for (const project of paths) {
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
            });
    }

    private _handleProjectRemoved(projects: ProjectViewModel<any>[]) {
        this._getProjectDirectories(projects)
            .subscribe(paths => {
                if (this._autoAddExternalProjects) {
                    for (const project of paths) {
                        atom.project.removePath(project);
                    }
                } else if (this._nagAddExternalProjects) {
                    const notification = atom.notifications.addInfo(`Remove external projects?`, <any>{
                        detail: paths.join('\n'),
                        description: `We have detected external projects have been removed, would you like to remove them from the treeview?`,
                        buttons: [
                            {
                                text: 'Okay',
                                className: 'btn-success',
                                onDidClick: () => {
                                    for (const project of paths) {
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
            });
    }
}

// tslint:disable-next-line:export-name
export const updateProject = new UpdateProject();
