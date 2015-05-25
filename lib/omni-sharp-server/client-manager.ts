import _ = require('lodash')
import path = require('path');
import {Observable, AsyncSubject, RefCountDisposable, Disposable, ReplaySubject} from "rx";
import Client = require('./client');
import CompositeClient = require('./composite-client');
import {findCandidates, DriverState} from "omnisharp-client";
import OmniSharpAtom = require('../omnisharp-atom/omnisharp-atom');

class ClientManager {
    private _clients: { [path: string]: Client } = {};
    private _configurations: ((client: Client) => void)[] = [];
    private _projectClientPaths: { [key: string]: string[] } = {};
    private _clientPaths: string[] = [];
    private _projectPaths: string[] = [];
    private _activated = false;
    private _temporaryClients: { [path: string]: RefCountDisposable } = {};
    private _omnisharpAtom: typeof OmniSharpAtom;

    private _aggregateClient = new CompositeClient();
    public get aggregateClient() { return this._aggregateClient; }

    private _activeClient = new ReplaySubject<Client>(1);
    public get activeClient() : Observable<Client> { return this._activeClient; }

    constructor() {

    }

    public activate(omnisharpAtom: typeof OmniSharpAtom) {
        this._activated = true;
        this._omnisharpAtom = omnisharpAtom;
        this.updatePaths(atom.project.getPaths());
        atom.project.onDidChangePaths((paths) => this.updatePaths(paths));

        this._omnisharpAtom.activeEditor
            .where(z => !!z)
            .flatMap(z => this.getClientForEditor(z))
            .subscribe(x => this._activeClient.onNext(x));
    }

    public connect() {
        _.each(this._clients, x => x.connect());
    }

    public disconnect() {
        _.each(this._clients, x => x.disconnect());
    }

    public get connected() {
        return _.any(this._clients, z => z.currentState === DriverState.Connected);
    }

    private updatePaths(paths: string[]) {
        var newPaths = _.difference(paths, this._projectPaths);
        var removePaths = _.intersection(newPaths, _.keys(this._clients));
        var addedPaths = _.difference(newPaths, _.keys(this._clients));

        _.each(removePaths, project => {
            this.removeClient(project);
        });

        _.each(addedPaths, project => {
            var localPaths = this._projectClientPaths[project] = [];
            findCandidates(project, console).toPromise().then(candidates => {
                for (var candidate of candidates) {
                    this.addClient(candidate, localPaths);
                }
            });
        });

        this._projectPaths = paths;
    }

    private addClient(candidate: string, localPaths: string[], delay = 1200, temporary?: boolean) {
        if (this._clients[candidate])
            return;
            
        localPaths.push(candidate);
        this._clientPaths.push(candidate);

        var client = new Client(candidate, {
            projectPath: candidate
        });

        _.each(this._configurations, config => config(client));
        this._clients[candidate] = client;

        if (temporary) {
            var tempD = Disposable.create(() => { });
            tempD.dispose();
            this._temporaryClients[candidate] = new RefCountDisposable(tempD);
        }

        if (!temporary) {
            this._aggregateClient.add(client);
        }

        // Auto start, with a little delay
        if (atom.config.get('omnisharp-atom.autoStartOnCompatibleFile')) {
            _.delay(() => client.connect(), delay);
        }

        return client;
    }

    private removeClient(candidate: string) {
        var refCountDisposable = this._temporaryClients[candidate]
        if (refCountDisposable) {
            refCountDisposable.dispose();
            if (!refCountDisposable.isDisposed) {
                return;
            }

            delete this._temporaryClients[candidate];
        }

        var client = this._clients[candidate];
        delete this._clients[candidate];
        client.disconnect();
        _.pull(this._clientPaths, candidate);
        this._aggregateClient.remove(client);
    }

    public getClientForActiveEditor() {
        var editor = atom.workspace.getActiveTextEditor();
        var client: Observable<Client>;
        if (editor)
            client = this.getClientForEditor(editor);

        if (client) return client;
        // No active text editor
        return Observable.empty<Client>();
    }

    public getClientForEditor(editor: Atom.TextEditor) {
        var client: Observable<Client>;
        if (!editor)
            // No text editor found
            return Observable.empty<Client>();

        if (!editor.getPath) {
            // Not a text editor
            return Observable.empty<Client>();
        }

        var grammarName = editor.getGrammar().name;
        var valid = false;
        if (grammarName === 'C#' || grammarName === 'C# Script File')
            valid = true;

        var filename = path.basename(editor.getPath());
        if (filename === 'project.json') {
            valid = true;
        }

        if (!valid)
            // No valid text editor
            return Observable.empty<Client>();


        var p = (<any>editor).omniProject;
        // Not sure if we should just add properties onto editors...
        // but it works...
        if (p && (client = Observable.just(this._clients[p]))) {
            if (this._temporaryClients[p]) {
                this.setupDisposableForTemporaryClient(p, editor);
            }

            return client;
        }

        var location = editor.getPath();
        var [intersect, clientInstance] = this.getClientForUnderlyingPath(location, grammarName);
        p = (<any>editor).omniProject = intersect;
        if (this._temporaryClients[p]) {
            this.setupDisposableForTemporaryClient(p, editor);
        }

        if (clientInstance)
            return Observable.just(clientInstance);

        return this.findClientForUnderlyingPath(location)
            .map(z => {
                var [p, client, temporary] = z;
                (<any>editor).omniProject = p;
                if (temporary) {
                    this.setupDisposableForTemporaryClient(p, editor);
                }
                return client;
            });
    }

    private getClientForUnderlyingPath(location: string, grammar?: string): [string, Client] {
        if (location === undefined) {
            return;
        }

        if (grammar === 'C# Script File' || _.endsWith(location, '.csx')) {
            // CSX are special, and need a client per directory.
            var directory = path.dirname(location);
            var csClient = this._clients[directory];
            if (csClient)
                return [directory, csClient];
        } else {
            var intersect = intersectPath(location, this._clientPaths);
            if (intersect) {
                return [intersect, this._clients[intersect]];
            }
        }

        return [null, null];
    }

    private findClientForUnderlyingPath(location: string, grammar?: string): Observable<[string, Client, boolean]> {
        var directory = path.dirname(location);
        var project = intersectPath(directory, this._projectPaths);
        var localPaths: string[];
        if (project)
            localPaths = this._projectClientPaths[project] = [];

        var subject = new AsyncSubject<[string, Client, boolean]>();

        var foundCandidates = findCandidates(directory, console)
            .subscribe(candidates => {
                var newCandidates = _.difference(candidates, this._clientPaths);
                for (var candidate of candidates) {
                    this.addClient(candidate, localPaths || [], 0, !project);
                }

                var intersect = intersectPath(location, this._clientPaths) || intersectPath(location, this._projectPaths);
                if (intersect) {
                    subject.onNext([intersect, this._clients[intersect], !project]); // The boolean means this client is temporary.
                } else {
                    subject.onError('Could not find a client for location ' + location);
                }
                subject.onCompleted();
            });

        return subject;
    }

    private setupDisposableForTemporaryClient(path: string, editor: Atom.TextEditor) {
        if (!editor['__setup_temp__'] && this._temporaryClients[path]) {
            var refCountDisposable = this._temporaryClients[path];
            var disposable = refCountDisposable.getDisposable();
            editor['__setup_temp__'] = true
            editor.onDidDestroy(() => {
                disposable.dispose();
                this.removeClient(path);
            });
        }
    }

    public registerConfiguration(callback: (client: Client) => void) {
        this._configurations.push(callback);

        _.each(this._clients, (client) => {
            callback(client);
        });
    }
}

function intersectPath(location: string, paths: string[]): string {
    var segments = location.split(path.sep);
    var mappedLocations = segments.map((loc, index) => {
        return _.take(segments, index + 1).join(path.sep);
    });

    // Look for the closest match first.
    mappedLocations.reverse();

    var intersect = (<any>_<string[]>(mappedLocations)).intersection(paths).first();
    if (intersect) {
        return intersect;
    }
}

var instance = new ClientManager();
export = instance;
