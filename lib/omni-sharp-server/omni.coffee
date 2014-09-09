OmniSharpServer = require './omni-sharp-server'
rp = require "request-promise"
Url = require "url"
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

      console.log(context)
      return context

    @_uri: (path, query) =>
      port = OmniSharpServer.get().getPortNumber()
      Url.format
        hostname: "localhost"
        protocol: "http"
        port: port
        pathname: path
        query: query

    @req: (path, event) =>
      context = @getEditorRequestContext()
      parse = @parse
      rp
        uri: @_uri path
        method: "POST"
        form:
          column: context.column
          filename: context.filename
          line: context.line
          buffer: context.buffer
      .then (data) -> atom.emit("omni:#{event}", parse(data))
      .catch (data) -> console.error(data.statusCode?, data.options?.uri)

    @parse: (response) ->
      response = JSON.parse(response)
      response.Line = response.Line && response.Line - 1
      response.Column = response.Column && response.Column - 1

      return response

    @syntaxErrors: (data) => @req "syntaxErrors", "syntax-errors"

    @goToDefinition: (data) => @req "gotoDefinition", "navigate-to"

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
