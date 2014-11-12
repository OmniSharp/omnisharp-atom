Omni = require '../../omni-sharp-server/omni'

module.exports =
  class FixUsings

    activate: =>
      atom.workspaceView.command "omnisharp-atom:fix-usings", ->
        Omni.fixUsings()
