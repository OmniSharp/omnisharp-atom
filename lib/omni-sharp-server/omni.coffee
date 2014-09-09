OmniSharpServer = require './omni-sharp-server'
rp = require "request-promise"
Url = require "url"
_ = require "underscore"
$ = require "jquery"

module.exports =

  class Omni

    @getEditorRequestContext: ->
      editor = atom.workspace.getActiveEditor()
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
      context = @getEditorRequestContext()
      r =
        column: context.column
        filename: context.filename
        line: context.line
        buffer: context.buffer
      form = if d then d else r
      rp
        uri: @_uri path
        method: "POST"
        form: form
      .then (data) ->
        json = JSON.parse(data)
        atom.emit "omni:#{event}", json
        json
      .catch (data) -> console.error(data.statusCode?, data.options?.uri)

    @syntaxErrors: => @req "syntaxErrors", "syntax-errors"

    @goToDefinition: => @req "gotoDefinition", "navigate-to"

    @autocomplete: (wordToComplete) =>
      data = @getEditorRequestContext()
      data.wordToComplete = wordToComplete
      data.wantDocumentationForEveryCompletionResult = false
      @req "autocomplete", "autocomplete", data
