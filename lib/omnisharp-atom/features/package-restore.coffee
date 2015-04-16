Omni = require '../../omni-sharp-server/omni'

module.exports =
  class PackageRestore

    activate: =>
      atom.commands.add 'atom-workspace', "omnisharp-atom:package-restore", ->
        Omni.packageRestore()
