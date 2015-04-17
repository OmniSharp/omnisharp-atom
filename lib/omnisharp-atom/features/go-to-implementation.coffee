OmniSharpServer = require '../../omni-sharp-server/omni-sharp-server'
Omni = require '../../omni-sharp-server/omni'

module.exports =
  class GoToImplementation

    goToImplementation: ->
      if OmniSharpServer.vm.isReady
        @navigateToWord = atom.workspace.getActiveTextEditor()?.getWordUnderCursor()
        Omni.goToImplementation()

    activate: =>
      goToImpl = @goToImplementation

      @disposable = atom.workspace.observeTextEditors (editor) ->
        editor.on "symbols-view:go-to-implementation", () -> #this doesn't work
          goToImpl()

      atom.commands.add "atom-text-editor", "omnisharp-atom:go-to-implementation", () ->
        goToImpl()

      atom.on "omni:navigate-to-implementation", (quickFixes) =>
        if quickFixes.QuickFixes.length is 1
          position =
            FileName: quickFixes.QuickFixes[0].FileName
            Line: quickFixes.QuickFixes[0].Line
            Column: quickFixes.QuickFixes[0].Column

          atom.emit "omni:navigate-to", position

        else atom.emit "omni:find-usages", quickFixes

    deactivate: =>
        @disposable.dispose()
