_ = require 'underscore'
RenameView = require '../views/rename-view'
Omni = require '../../omni-sharp-server/omni'

module.exports =
  class Rename
    renameView: null

    activate: =>
      @renameView = new RenameView()
      atom.commands.add 'atom-text-editor', 'omnisharp-atom:rename', => @rename()

      atom.on 'omnisharp-atom:rename:exec', (newName) =>
        Omni.rename newName

      atom.on 'omni:rename', (changes) =>
        @applyChanges changes.Changes

    rename: ->
      wordToRename = atom.workspace.getActiveTextEditor()?.getWordUnderCursor()
      atom.workspace.addTopPanel(item: @renameView)
      @renameView.configure wordToRename

    applyChanges: (changes) ->
      _.each(changes, (change)=>
        atom.workspace.open(change.FileName).then (editor) ->
          editor.setText change.Buffer
        )
