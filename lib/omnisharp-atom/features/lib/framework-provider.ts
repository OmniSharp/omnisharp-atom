import * as _ from "lodash";
import {Observable} from "rx";
import Omni = require('../../../omni-sharp-server/omni');
import Manager = require("../../../omni-sharp-server/client-manager");
import {ajax} from "jquery";
var filter = require('fuzzaldrin').filter;

var frameworkCache = new Map<string, { [key: string]: string }>();

function fetchFrameworkFromGithub(framework: string) {
    if (frameworkCache.has(framework)) {
        return Observable.from<{ [key: string]: string }>(frameworkCache.get(framework));
    }

    // Get the file from github
    var result = ajax(`https://raw.githubusercontent.com/OmniSharp/omnisharp-nuget/resources/frameworks/${framework.toLowerCase() }.json`).then(res => JSON.parse(res));

    return Observable.fromPromise<{ [key: string]: string }>(result);
}

interface IAutocompleteProviderOptions {
    editor: Atom.TextEditor;
    bufferPosition: TextBuffer.Point; // the position of the cursor
    prefix: string;
    scopeDescriptor: { scopes: string[] };
    activatedManually: boolean;
    path: string;
    replacementPrefix: string;
}

interface IAutocompleteProvider {
    fileMatchs: string[];
    pathMatch: (path: string) => boolean;
    getSuggestions: (options: IAutocompleteProviderOptions) => Rx.IPromise<any[]>;
    dispose(): void;
}

function makeSuggestion(item: string, replacementPrefix: string) {
    var type = 'package';

    return {
        _search: item,
        text: item,
        snippet: item,
        type: type,
        displayText: item,
        replacementPrefix,
        className: 'autocomplete-project-json',
    }
}

function makeSuggestion2(item: string, replacementPrefix: string) {
    var type = 'version';

    return {
        _search: item,
        text: item,
        snippet: item,
        type: type,
        displayText: item,
        replacementPrefix,
        className: 'autocomplete-project-json',
    }
}

var nameRegex = /\/((?:dnx|net)[0-9]{2,3})\/frameworkAssemblies$/;
var versionRegex = /\/((?:dnx|net)[0-9]{2,3})\/frameworkAssemblies\/([a-zA-Z0-9\._]*?)(?:\/version)?$/;

var nugetName: IAutocompleteProvider = {
    getSuggestions(options: IAutocompleteProviderOptions) {
        var framework = options.path.match(nameRegex)[1];

        return fetchFrameworkFromGithub(framework)
            .map(_.keys)
            .map(z => z.map(x => makeSuggestion(x, options.replacementPrefix)))
            .map(s => filter(s, options.prefix, { key: '_search' }))
            .toPromise();
    },
    fileMatchs: ['project.json'],
    pathMatch(path) {
        return !!path.match(nameRegex);
    },
    dispose() { }
}

var nugetVersion: IAutocompleteProvider = {
    getSuggestions(options: IAutocompleteProviderOptions) {
        var match = options.path.match(versionRegex);
        var framework = match[1];
        var name = match[2];

        return fetchFrameworkFromGithub(framework)
            .map(x => [makeSuggestion(x[name], options.replacementPrefix)])
            .toPromise();
    },
    fileMatchs: ['project.json'],
    pathMatch(path) {
        return !!path.match(versionRegex);
    },
    dispose() { }
}

var providers = [nugetName, nugetVersion];
export = providers;
