{View} = require 'atom-space-pen-views'
{TextEditorView} = require 'atom-space-pen-views'

Omni = require '../../omni-sharp-server/omni'

module.exports =
  class RenameView extends View
    wordToRename: null

    @content: ->
      @div class: 'rename overlay from-top', =>
        @p outlet: 'message', class: 'icon icon-diff-renamed', 'Rename to:'
        @subview 'miniEditor', new TextEditorView({mini: true})

    initialize: ->
      @on 'core:confirm', => @rename()
      @on 'core:cancel', => @destroy()

    configure: (wordToRename) ->
      @miniEditor.setText wordToRename
      #@miniEditor.selectAll()
      @miniEditor.focus()

    rename: ->
      Omni.rename @miniEditor.getText()
      @destroy()

    destroy: ->
      @miniEditor.setText ''
      @detach()
      #atom.workspaceView.focus()
