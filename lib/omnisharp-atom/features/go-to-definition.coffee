OmniSharpServer = require '../../omni-sharp-server/omni-sharp-server'
Omni = require '../../omni-sharp-server/omni'

module.exports =
  class GoToDefinition

    goToDefinition: ->
      if OmniSharpServer.vm.isReady
        @navigateToWord = atom.workspace.getActiveEditor()?.getWordUnderCursor()
        Omni.goToDefinition()

    activate: =>
      goToDef = @goToDefinition
      atom.workspaceView.eachEditorView (editorView) ->
        editorView.on "symbols-view:go-to-declaration", () ->
          goToDef()

      atom.workspaceView.command "omnisharp-atom:go-to-definition", () ->
        goToDef()

      atom.on "omni:navigate-to", (position) =>
        if position.FileName?
          atom.workspace.open(position.FileName).then (editor) ->
            editor.setCursorBufferPosition [
              position.Line && position.Line - 1
              position.Column && position.Column - 1
            ]
        else
          atom.emit "omnisharp-atom:error", "Can't navigate to '#{ @navigateToWord }'"
