OmniSharpServer = require './omni-sharp-server'
rp = require "request-promise"
Url = require "url"
_ = require "underscore"
module.exports =

  class Omni

    @getEditorContext: ->
      editor = atom.workspace.getActiveEditor()
      return unless editor
      marker = editor.getCursorBufferPosition()

      context =
        column: marker.column + 1
        filename: editor.getUri()
        line: marker.row + 1
        buffer: editor.buffer.getLines().join('\n')
      context

    @_uri: (path, query) =>
      port = OmniSharpServer.get().getPortNumber()
      Url.format
        hostname: "localhost"
        protocol: "http"
        port: port
        pathname: path
        query: query

    @req: (path, event, d) =>
      return if OmniSharpServer.vm.isNotReady

      context = @getEditorContext()
      return unless context
      rp
        uri: @_uri path
        method: "POST"
        form: _.extend({}, context, d)
      .then (data) ->
        json = JSON.parse(data)
        atom.emit "omni:#{event}", json
        json
      .catch (data) -> console.error data.statusCode?, data.options?.uri

    @syntaxErrors: => @req "syntaxErrors", "syntax-errors"

    @goToDefinition: => @req "gotoDefinition", "navigate-to"

    @autocomplete: (wordToComplete) =>
      data =
        wordToComplete: wordToComplete
        wantDocumentationForEveryCompletionResult: false

      @req "autocomplete", "autocomplete", data
