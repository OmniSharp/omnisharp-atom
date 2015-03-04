_ = require 'underscore'
OmniSharpServer = require '../../omni-sharp-server/omni-sharp-server'
Omni = require '../../omni-sharp-server/omni'
{Range} = require 'atom'
rp = require "request-promise"

module.exports =
  class SyntaxErrors

    constructor: (atomSharper) ->
      @atomSharper = atomSharper
      @decorations = {}


    activate: =>

      @atomSharper.onEditor (editor) =>
        @registerEventHandlerOnEditor editor

      @editorDestroyedSubscription = @atomSharper.onEditorDestroyed (filePath) =>
        #todo: what do we need to do with regards to cleanup? Should we be destroying
        #all markers?


    registerEventHandlerOnEditor: (editor) =>

      textBuffer = editor.getBuffer()
      textBuffer.onDidStopChanging =>
        return if OmniSharpServer.vm.isOff
        Omni.codecheck(null, editor).then (data) =>
          @drawDecorations data, editor

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


    destroyDecorationsInEditor: (editor) =>
      _.each @decorations[editor.id], (decoration) => decoration.getMarker().destroy()


    drawDecorations: ({QuickFixes}, editor) ->

      #clear all existing decorations for this editor.
      @destroyDecorationsInEditor editor
      #short out if we have no quickfixes
      if QuickFixes.length is 0
        return

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

        gutter = editor.decorateMarker(marker, type: "line-number", class: "gutter-#{color}")
        line = editor.decorateMarker(markerL, type: "highlight", class: "highlight-#{color}")
        [gutter, line]

      @decorations[editor.id] = _.flatten decorations

    deactivate: ->
      @editorSubscription.destroy()
