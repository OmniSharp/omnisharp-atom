{View, EditorView} = require 'atom-space-pen-views'

Omni = require '../../omni-sharp-server/omni'

module.exports =
  class RenameView extends View
    wordToRename: null

    @content: ->
      @div class: 'rename overlay from-top', =>
        @p outlet: 'message', class: 'icon icon-diff-renamed', 'Rename to:'
        @subview 'miniEditor', new EditorView({mini: true})

    initialize: ->
      @on 'core:confirm', => @rename()
      @on 'core:cancel', => @destroy()

    configure: (wordToRename) ->
      @miniEditor.getEditor().setText wordToRename
      @miniEditor.getEditor().selectAll()
      @miniEditor.focus()

    rename: ->
      Omni.rename @miniEditor.getEditor().getText()
      @destroy()

    destroy: ->
      @miniEditor.getEditor().setText ''
      @detach()
      atom.workspaceView.focus()
