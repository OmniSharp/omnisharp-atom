import _ = require('lodash')
import path = require('path');
import Client = require('./client');
import {findCandidates} from "omnisharp-client";

class ClientManager {
    private _clients: { [path:string] : Client } = {};
    private _configurations : ((client: Client) => void)[] = [];
    private _projectClientPaths: { [key: string]: string[] } = {};
    private _clientPaths: string[] = [];
    private _paths: string[] = [];
    private _activated = false;

    public activate() {
        this._activated = true;
        this.updatePaths(atom.project.getPaths());
        atom.project.onDidChangePaths((paths) => this.updatePaths(paths));
    }

    private updatePaths(paths: string[]) {
        var newPaths = _.difference(paths, this._paths);
        var removeClients = _.intersection(newPaths, _.keys(this._clients));
        var addedClients = _.difference(newPaths, _.keys(this._clients));

        _.each(removeClients, project => {
            var client = this._clients[project];
            client.disconnect();
            delete this._clients[project];
        });

        _.each(addedClients, project => {
            var localPaths = this._projectClientPaths[project] = [];
            for (var candidate of findCandidates(project, console)) {
                localPaths.push(candidate);
                this._clientPaths.push(candidate);

                var client = new Client({
                    projectPath: candidate
                });

                _.each(this._configurations, config => config(client));
                this._clients[candidate] = client;
            }
        });

        this._paths = paths;
    }

    public getClientForActiveEditor() {
        var editor = atom.workspace.getActiveTextEditor();
        if (editor)
            return this.getClientForEditor(editor);

        // No window is open
        return this._clients[this._clientPaths[0]];
    }

    public getClientForEditor(editor: Atom.TextEditor) {
        // Not sure if we should just add properties onto editors...
        // but it works...
        if ((<any>editor).omniProject) {
            return this._clients[(<any>editor).omniProject];
        }

        var location = editor.getPath();
        if (location === undefined) {
            return;
        }
        
        var segments = location.split(path.sep);
        var mappedLocations = segments.map((loc, index) => {
            return _.take(segments, index + 1).join(path.sep);
        });

        var intersect = _.intersection(mappedLocations, this._clientPaths);
        if (intersect.length) {
            (<any>editor).omniProject = intersect[0];
            return this._clients[intersect[0]];
        }
    }

    public registerConfiguration(callback: (client: Client) => void) {
        this._configurations.push(callback);

        _.each(this._clients, (client) => {
            callback(client);
        });
    }
}

var instance = new ClientManager();
export = instance;
