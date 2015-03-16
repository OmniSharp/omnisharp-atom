Omni = require '../../omni-sharp-server/omni'

module.exports =
  class FindUsages

    constructor: (atomSharper) ->
      @atomSharper = atomSharper

    activate: =>
      atom.commands.add 'atom-workspace', "omnisharp-atom:find-usages", =>
        Omni.findUsages()
        @atomSharper.outputView.selectPane "find"
