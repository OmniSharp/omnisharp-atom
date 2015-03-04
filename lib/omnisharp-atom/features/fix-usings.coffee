Omni = require '../../omni-sharp-server/omni'

module.exports =
  class FixUsings

    activate: =>
      atom.commands.add 'atom-workspace', "omnisharp-atom:fix-usings", ->
        Omni.fixUsings()
