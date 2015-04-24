import _ = require('lodash')
import semver = require('semver')
import fs = require('fs')

var apd = require('atom-package-dependencies');

var dependencyErrors = [];

export function findAllDeps(packageDir) {
    dependencyErrors = [];
    var missingDepencies = [];

    var packageFilePath = packageDir + "/omnisharp-atom/package.json";
    var packageConfig = JSON.parse(fs.readFileSync(packageFilePath, 'utf8'));
    var packageDependencies = packageConfig['package-dependencies'];
    var availablePackageMetaData = atom.packages.getAvailablePackageMetadata();

    _.each(packageDependencies, (version:string, packageName:string) => {
        var matchingPackage : any = _.find(availablePackageMetaData, (availablePackage: any) => availablePackage.name == packageName);

        if (matchingPackage) {
            if (!semver.satisfies(matchingPackage.version, version)) {
                dependencyErrors.push("Omnisharp Atom needs the package `"+packageName+"` (version "+version+") to be installed. You have an older version "+ matchingPackage.version +".");
            }
        } else {
            apd.require(packageName);
            missingDepencies.push(packageName);
        }
    });

    // Cribbed from atom-typescript
    if (missingDepencies.length > 0) {
        var notification = atom.notifications.addInfo('OmniSharp: Some dependencies not found. Running "apm install" on these for you. Please wait for a success confirmation!', { dismissable: true });
        apd.install(function() {
            atom.notifications.addSuccess("OmniSharp: Dependencies installed correctly. Enjoy OmniSharp", { dismissable: true });
            notification.dismiss();

            // Packages don't get loaded automatically as a result of an install
            _.each(missingDepencies, (packageName:string) => {
                if (!apd.require(packageName)) atom.packages.loadPackage(packageName);
                atom.packages.activatePackage(packageName);
            });
        });
    }

    return dependencyErrors.length == 0;
}

export function errors() {
    return dependencyErrors;
}
