import _ from "lodash";
import {Observable} from "rxjs";
import {ajax} from "jquery";
const filter = require("fuzzaldrin").filter;

const frameworkCache = new Map<string, { [key: string]: string }>();

function fetchFrameworkFromGithub(framework: string) {
    if (frameworkCache.has(framework)) {
        return Observable.of<{ [key: string]: string }>(frameworkCache.get(framework));
    }

    // Get the file from github
    const result = ajax(`https://raw.githubusercontent.com/OmniSharp/omnisharp-nuget/resources/frameworks/${framework.toLowerCase()}.json`).then(res => JSON.parse(res));

    return Observable.fromPromise<{ [key: string]: string }>(<any>result);
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
    getSuggestions: (options: IAutocompleteProviderOptions) => Promise<any[]>;
    dispose(): void;
}

function makeSuggestion(item: string, replacementPrefix: string) {
    const type = "package";

    return {
        _search: item,
        text: item,
        snippet: item,
        type: type,
        displayText: item,
        replacementPrefix,
        className: "autocomplete-project-json",
    };
}

const nameRegex = /\/((?:dnx|net)[0-9]{2,3})\/frameworkAssemblies$/;
const versionRegex = /\/((?:dnx|net)[0-9]{2,3})\/frameworkAssemblies\/([a-zA-Z0-9\._]*?)(?:\/version)?$/;

class NugetNameProvider implements IAutocompleteProvider {
    public getSuggestions(options: IAutocompleteProviderOptions) {
        const framework = options.path.match(nameRegex)[1];

        return fetchFrameworkFromGithub(framework)
            .map(_.keys)
            .map(z => z.map(x => makeSuggestion(x, options.replacementPrefix)))
            .map(s => filter(s, options.prefix, { key: "_search" }))
            .toPromise();
    }
    public fileMatchs = ["project.json"];
    public pathMatch(path: string) {
        return path && !!path.match(nameRegex);
    }
    public dispose() { /* */ }
}

class NugetVersionProvider implements IAutocompleteProvider {
    public getSuggestions(options: IAutocompleteProviderOptions) {
        const match = options.path.match(versionRegex);
        const framework = match[1];
        const name = match[2];

        return fetchFrameworkFromGithub(framework)
            .map(x => [makeSuggestion(x[name], options.replacementPrefix)])
            .toPromise();
    }
    public fileMatchs = ["project.json"];
    public pathMatch(path: string) {
        return path && !!path.match(versionRegex);
    }
    public dispose() { /* */ }
}

const providers = [new NugetNameProvider, new NugetVersionProvider];
module.exports = providers;
