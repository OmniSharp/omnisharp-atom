import * as _ from "lodash";
import {Observable} from "rx";
import Omni = require('../../../omni-sharp-server/omni');

interface IAutocompleteProviderOptions {
    editor: Atom.TextEditor;
    bufferPosition: TextBuffer.Point; // the position of the cursor
    prefix: string;
    scopeDescriptor: { scopes: string[] };
    activatedManually: boolean;
    path: string;
}

interface IAutocompleteProvider {
    fileMatchs: string[];
    pathMatch: (path: string) => boolean;
    getSuggestions: (options: IAutocompleteProviderOptions) => Rx.IPromise<any[]>;
    dispose(): void;
}

interface ISearchRequest {
    Search: string;
    ProjectPath: string;
    IncludePrerelease: boolean;
}

interface ISearchResponse {
    Packages: ISearchResponsePackage[];
    Sources: string[];
}

interface IVersionRequest {
    Id: string;
    ProjectPath: string;
}

interface IVersionResponse {
    Versions: string[];
}

interface ISearchResponsePackage {
    Id: string;
    HasVersion: boolean;
    Version: string;
    Description: string;
}

function makeSuggestion(item: ISearchResponsePackage) {
    var type = 'package';

    return {
        _search: item.Id,
        text: item.Id,
        snippet: item.Id,
        type: type,
        displayText: item.Id,
        className: 'autocomplete-project-json',
    }
}

function makeSuggestion2(item: string) {
    var type = 'version';

    return {
        _search: item,
        text: item,
        snippet: item,
        type: type,
        displayText: item,
        className: 'autocomplete-project-json',
    }
}

var nameRegex = /\/?dependencies$/;
var versionRegex = /\/?dependencies\/([a-zA-Z0-9\._]*?)(?:\/version)?$/;


var nugetName: IAutocompleteProvider = {
    getSuggestions(options: IAutocompleteProviderOptions) {
        return Omni.request(solution => solution.request<ISearchRequest, ISearchResponse>("packagesearch", {
            Search: options.prefix,
            IncludePrerelease: true,
            ProjectPath: solution.path
        }))
            .flatMap(z => Observable.from(z.Packages))
            .map(makeSuggestion)
            .toArray()
            .toPromise();
    },
    fileMatchs: ['project.json'],
    pathMatch(path) { return !!path.match(nameRegex); },
    dispose() { }
    //getSuggestions: _.throttle(getSuggestions, 0),
    //onDidInsertSuggestion,
    //dispose
}

var nugetVersion: IAutocompleteProvider = {
    getSuggestions(options: IAutocompleteProviderOptions) {
        var match = options.path.match(versionRegex);
        if (!match) return Promise.resolve([]);
        var name = match[1];

        return Omni.request(solution => solution.request<IVersionRequest, IVersionResponse>("packageversion", {
            Id: name,
            IncludePrerelease: true,
            ProjectPath: solution.path
        }))
            .flatMap(z => Observable.from(z.Versions))
            .map(makeSuggestion2)
            .toArray()
            .toPromise();
    },
    fileMatchs: ['project.json'],
    pathMatch(path) { return !!path.match(versionRegex); },
    dispose() { }
    //getSuggestions: _.throttle(getSuggestions, 0),
    //onDidInsertSuggestion,
    //dispose
}

var providers = [nugetName, nugetVersion];
export = providers;
