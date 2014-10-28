Omni = require '../../omni-sharp-server/omni'

module.exports =
  class FindUsages

    constructor: (atomSharper) ->
      @atomSharper = atomSharper

    activate: =>
      atom.workspaceView.command "omnisharp-atom:find-usages", =>
        Omni.findUsages()
        @atomSharper.outputView.selectPane "find"
