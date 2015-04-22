path = require 'path'
OmniSharpServer = require '../../omni-sharp-server/omni-sharp-server'
Omni = require '../../omni-sharp-server/omni'

module.exports =
  class PackageRestore

    constructor: (atomSharper) ->
      @atomSharper = atomSharper

    activate: =>

      @atomSharper.onConfigEditor (editor) =>
        @registerEventHandlerOnEditor editor

      @editorDestroyedSubscription = @atomSharper.onConfigEditorDestroyed (filePath) =>

    registerEventHandlerOnEditor: (editor) =>

      filename = path.basename(editor.getPath())
      return if filename is not 'project.json'

      editor.getBuffer().onDidSave =>
        return if OmniSharpServer.vm.isOff
        Omni.packageRestore()

    deactivate: ->
      @editorSubscription.destroy()
