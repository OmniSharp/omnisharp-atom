import fs = require('fs');
import _ = require('lodash');
import path = require('path');
var glob = require('glob');
var filesToSearch = ['global.json', '*.sln', 'project.json', '*.csproj', '*.csx'];

export function findProject(location: string) {
    location = _.trimRight(location, path.sep);

    var locations = location.split(path.sep);
    var mappedLocations = locations.map((loc, index) => {
        return _.take(locations, index + 1).join(path.sep);
    });

    mappedLocations.reverse();

    var results = _.flatten(
        filesToSearch.map(x =>
            mappedLocations.map(z => path.join(z, x))));

    var foundFile = _(results).chain().map(file => {
        var g = glob.sync(file);
        if (g && g.length) {
            return g[0];
        }
        return false;
    }).find(z => !!z).value();

    return path.dirname(foundFile);
}
