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


    getWordAt: (str, pos) =>
      while pos < str.length && /\W/.test str[pos]
        ++pos

      left = str.slice(0, pos + 1).search /\W(?!.*\W)/
      right = str.slice(pos).search /(\W|$)/

      start: left + 1
      end: left + 1 + right

    drawDecorations: (editor, {QuickFixes}) ->
      console.log QuickFixes

      _.each @decorations[editor.id], (decoration) => decoration.getMarker().destroy()

      ranges = _.map QuickFixes, (error) =>
        line = error.Line - 1
        column = error.Column - 1

        text = editor.lineTextForBufferRow line
        {start, end} = @getWordAt text, column

        type: error.LogLevel
        range: new Range([line, start], [line, end])
        message: error.Message

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

      #@decorationsByEditorId[editor.id] ?= {}
      #@decorationsByEditorId[editor.id][type] = decoration


    deactivate: ->
      @editorSubscription.destroy()
