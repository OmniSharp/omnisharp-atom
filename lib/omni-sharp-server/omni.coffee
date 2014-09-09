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

    @req: (path, event, data = null) =>
      context = @getEditorRequestContext()
      rp
        uri: @_uri path
        method: "POST"
        form:
          column: context.column
          filename: context.filename
          line: context.line
          buffer: context.buffer
      .then (data) -> atom.emit("omni:#{event}", JSON.parse(data))
      .catch (data) -> console.error(data.statusCode?, data.options?.uri)

    @syntaxErrors: (data) => @req "syntaxErrors", "syntax-errors", data

    @goToDefinition: (data) => @req "gotoDefinition", "navigate-to", data

    @autocomplete: (wordToComplete) =>
      data = @getEditorRequestContext()
      data.wordToComplete = wordToComplete
      data.wantDocumentationForEveryCompletionResult = false
      response = null
      # synchronous ajax - yuk, but autocomplete+ doesn't
      # support callbacks (yet)
      $.ajax
        url: @_uri "autocomplete"
        type: 'POST'
        data: data
        dataType: 'json'
        async: false
        error: (jqXHR, textStatus, errorThrown) ->
          console.log("Autocomplete error - ", errorThrown)
        success: (data, textStatus, jqXHR) ->
          response = data

      return response
