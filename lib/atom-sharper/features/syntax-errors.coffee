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
      buffer.on 'changed', _.debounce(Omni.syntaxErrors, 200)
      atom.on "omni:syntax-errors", _.debounce(_.bind(@drawDecorations, this, editor), 100)

    drawDecorations: (editor, {Errors}) ->


      _.each @decorations[editor.id], (decoration) => decoration.getMarker().destroy()

      ranges = _.map(Errors, (error) => new Range([error.Line - 1, error.Column - 1], [error.Line - 1, error.Column + 5]))

      decorations = _.map ranges, (range) =>
        marker = editor.markBufferRange(range, invalidate: 'never')
        markerL = editor.markBufferRange(range, invalidate: 'never')

        gutter = editor.decorateMarker(marker, type: "gutter", class: "gutter-red")
        line = editor.decorateMarker(markerL, type: "highlight", class: "highlight-red")
        [gutter, line]

      @decorations[editor.id] = _.flatten decorations

      #@decorationsByEditorId[editor.id] ?= {}
      #@decorationsByEditorId[editor.id][type] = decoration


    deactivate: ->
      @editorSubscription.destroy()
