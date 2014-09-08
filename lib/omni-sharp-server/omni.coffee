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

      return context

    @_uri: (path, query) =>
      port = OmniSharpServer.get().getPortNumber()
      Url.format
        hostname: "localhost"
        protocol: "http"
        port: port
        pathname: path
        query: query

    @syntaxErrors: (data) =>
      rp
        uri: @_uri "syntaxErrors"
        method: "POST"
        form: data

    @goToDefinition: (data) =>
      data = $.extend({}, data, @getEditorRequestContext())
      rp
        uri: @_uri "gotoDefinition"
        method: "POST"
        form: data

    @autocomplete: (wordToComplete) =>
      console.log('word', wordToComplete)
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

      console.log(response)
      return response
