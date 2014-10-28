_ = require 'underscore'
OmniSharpServer = require '../../omni-sharp-server/omni-sharp-server'
Omni = require '../../omni-sharp-server/omni'
{Range} = require 'atom'

module.exports =
  class SyntaxErrors

    constructor: (atomSharper) ->
      @atomSharper = atomSharper
      @decorations = {}
      @editors = []

    activate: =>
      @editorSubscription = @atomSharper.onEditor (editor) =>
        @detectSyntaxErrorsIn editor

      atom.on 'omni-sharp-server:state-change-complete', @codeCheckAllExistingEditors

      # todo - remove emit here and subscribe directly from error-pane-view
      @editorDestroyedSubscription = @atomSharper.onEditorDestroyed (filePath) =>
        editorsCount = @editors.length
        while editorsCount--
          if @editors[editorsCount].buffer.file.path == filePath
            @editors.splice editorsCount, 1

        atom.emit 'omnisharp-atom:clear-syntax-errors', filePath

    detectSyntaxErrorsIn: (editor) =>
      @decorations[editor.id] = [];
      buffer = editor.getBuffer()

      buffer.on 'changed', _.debounce(Omni.codecheck, 200)
      atom.on "omni:quick-fixes", _.bind(@drawDecorations, this)

      Omni.codecheck null, editor

      @editors.push editor

    codeCheckAllExistingEditors: (state) =>
      if state == 'ready'
        Omni.codecheck null, editor for editor in @editors

    getWordAt: (str, pos) =>
      if str == undefined
        return {
          start: pos
          end: pos
        }

      while pos < str.length && /\W/.test str[pos]
        ++pos

      left = str.slice(0, pos + 1).search /\W(?!.*\W)/
      right = str.slice(pos).search /(\W|$)/

      start: left + 1
      end: left + 1 + right

    drawDecorations: ({QuickFixes}) ->
      quickFixPath = _.first(_.pluck(QuickFixes, "FileName"));

      editor = _.find @editors, (editor) ->
        editor.buffer.file.path == quickFixPath

      path = editor?.buffer.file.path

      return if path != quickFixPath

      _.each @decorations[editor.id], (decoration) => decoration.getMarker().destroy()

      ranges = _.map QuickFixes, (error) =>
        line = error.Line - 1
        column = error.Column - 1

        text = editor.lineTextForBufferRow line
        {start, end} = @getWordAt text, column

        type: error.LogLevel
        range: new Range([line, start], [line, end])
        message: error.Text

      decorations = _.map ranges, ({type, range}) =>
        color = switch
          when type == 'Warning' then "green"
          when type == 'Error' then "red"
          else "unknown"

        marker = editor.markBufferRange(range, invalidate: 'never')
        markerL = editor.markBufferRange(range, invalidate: 'never')

        gutter = editor.decorateMarker(marker, type: "gutter", class: "gutter-#{color}")
        line = editor.decorateMarker(markerL, type: "highlight", class: "highlight-#{color}")
        [gutter, line]

      @decorations[editor.id] = _.flatten decorations

    deactivate: ->
      @editorSubscription.destroy()
