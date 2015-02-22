_ = require 'underscore'
semver = require 'semver'
fs = require 'fs-plus'

module.exports =

  findAllDeps: (packageDir) ->
    @dependencyErrors = []
    packageFilePath = "#{packageDir}/omnisharp-atom/package.json"

    packageConfig = JSON.parse(fs.readFileSync(packageFilePath, 'utf8'))

    packageDependencies = packageConfig['apmPackageDependencies']
    availablePackageMetaData = atom.packages.getAvailablePackageMetadata()

    _.each packageDependencies, (version, packageName) =>
      matchingPackage = _.find(availablePackageMetaData, (availablePackage) ->
        availablePackage.name == packageName
      )

      if matchingPackage
        if !semver.satisfies(matchingPackage.version, version)
          @dependencyErrors.push "Omnisharp Atom needs the package `#{packageName}` (version #{version}) to be installed. You have an older version #{matchingPackage.version}."
      else
        @dependencyErrors.push "Omnisharp Atom needs the package `#{packageName}` (version #{version}) to be installed"

    hasErrors = @dependencyErrors.length == 0

  errors: () ->
    @dependencyErrors
