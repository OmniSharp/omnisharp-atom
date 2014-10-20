_ = require 'underscore'
OmniSharpServer = require '../../omni-sharp-server/omni-sharp-server'
Omni = require '../../omni-sharp-server/omni'
{Range} = require 'atom'

module.exports =
  class SyntaxErrors

    constructor: (atomSharper) ->
      @atomSharper = atomSharper
      @decorations = {}

    activate: =>
      @editorSubscription = @atomSharper.onEditor (editor) =>
        @detectSyntaxErrorsIn editor

    detectSyntaxErrorsIn: (editor) ->
      @decorations[editor.id] = [];
      buffer = editor.getBuffer()
      buffer.on 'changed', _.debounce(Omni.codecheck, 200)
      atom.on "omni:quick-fixes", _.debounce(_.bind(@drawDecorations, this, editor), 100)

    drawDecorations: (editor, {QuickFixes}) ->
      _.each @decorations[editor.id], (decoration) => decoration.getMarker().destroy()

      ranges = _.map QuickFixes, (error) =>
        line = error.Line - 1
        column = error.Column
        text = editor.lineTextForBufferRow(line)

        type: error.LogLevel
        range: new Range([line, column], [line, column + 2])
        message: error.Message

      decorations = _.map ranges, ({type, range}) =>
        color = switch
          when type == 'Warning' then "blue"
          when type == 'Error' then "red"
          else "unknown"

        marker = editor.markBufferRange(range, invalidate: 'never')
        markerL = editor.markBufferRange(range, invalidate: 'never')

        gutter = editor.decorateMarker(marker, type: "gutter", class: "gutter-#{color}")
        line = editor.decorateMarker(markerL, type: "highlight", class: "highlight-#{color}")
        [gutter, line]

      @decorations[editor.id] = _.flatten decorations

      #@decorationsByEditorId[editor.id] ?= {}
      #@decorationsByEditorId[editor.id][type] = decoration


    deactivate: ->
      @editorSubscription.destroy()
