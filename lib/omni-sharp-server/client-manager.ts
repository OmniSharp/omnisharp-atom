import _ = require('lodash')
import path = require('path');
import Client = require('./client');

class ClientManager {
    private _clients: WeakMap<string, Client> = new WeakMap<string, Client>();
    private _configurations : ((client: Client) => void)[] = [];
    private _paths: string[] = [];
    private _activated = false;

    public activate() {
        this._activated = true;
        this.updatePaths(atom.project.getPaths());
        atom.project.onDidChangePaths((paths) => this.updatePaths(paths));
    }

    private updatePaths(paths: string[]) {
        var newPaths = _.difference(this._paths, paths);
        var removeClients = _.intersection(newPaths, _.keys(this._clients));
        var addedClients = _.difference(_.keys(this._clients), newPaths);

        _.each(removeClients, project => {
            var client = this._clients.get(project);
            client.disconnect();
            this._clients.delete(project);
        });

        _.each(addedClients, project => {
            var client = new Client({
                projectPath: project
            });

            _.each(this._configurations, config => config(client));
            this._clients.set(project, client);
        });
    }

    public getClientForActiveEditor() {
        var editor = atom.workspace.getActiveTextEditor();
        return this.getClientForEditor(editor);
    }

    public getClientForEditor(editor: Atom.TextEditor) {
        // Not sure if we should just add properties onto editors...
        // but it works...
        if ((<any>editor).omniProject) {
            return this._clients.get((<any>editor).omniProject);
        }

        var base = editor.getPath();
        var sep = new RegExp('\\' + path.sep);
        var p: string;
        while ((base = path.dirname(base))) {
            if (p = _.find(this._paths, z => z === base)) {
                (<any>editor).omniProject = p;
                return this._clients.get(p);
            }

            if (!base.match(sep)){
                break;
            }
        }
    }

    public registerConfiguration(callback: (client: Client) => void) {
        this._configurations.push(callback);
    }
}

var instance = new ClientManager();
export = instance;
