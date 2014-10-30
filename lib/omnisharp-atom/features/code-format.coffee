Omni = require '../../omni-sharp-server/omni'

module.exports =
  class CodeFormat

    activate: =>
      atom.workspaceView.command "omnisharp-atom:code-format", ->
        Omni.codeFormat()

      atom.on "omni:code-format", (d) =>
        atom.workspace.getActiveEditor()?.setText d.Buffer
