import _ = require('lodash')
import semver = require('semver')
import fs = require('fs')

var dependencyErrors = [];

export function findAllDeps(packageDir) {
    dependencyErrors = [];

    var packageFilePath = packageDir + "/omnisharp-atom/package.json";
    var packageConfig = JSON.parse(fs.readFileSync(packageFilePath, 'utf8'));
    var packageDependencies = packageConfig['apmPackageDependencies'];
    var availablePackageMetaData = atom.packages.getAvailablePackageMetadata();

    _.each(packageDependencies, (version:string, packageName:string) => {
        var matchingPackage = _.find(availablePackageMetaData, (availablePackage) => availablePackage.name == packageName);

        if (matchingPackage) {
            if (!semver.satisfies(matchingPackage.version, version)) {
                dependencyErrors.push("Omnisharp Atom needs the package `"+packageName+"` (version "+version+") to be installed. You have an older version "+ matchingPackage.version +".");
            }
        } else {
            dependencyErrors.push("Omnisharp Atom needs the package `"+packageName+"` (version "+version+") to be installed");
        }

    });

    return dependencyErrors.length == 0;
}

export function errors() {
    return dependencyErrors;
}
