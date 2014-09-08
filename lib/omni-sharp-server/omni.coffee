OmniSharpServer = require './omni-sharp-server'
rp = require "request-promise"
Url = require "url"
$ = require "jquery"

module.exports =
  class Omni

    @request: (options) ->
      deferred = new $.Deferred()
      translateResponse = @translateResponse
      options.form = $.extend({}, @getEditorRequestContext(), options.form)

      rp(options)
        .then (response) ->
          parsedResponse = JSON.parse(response)
          deferred.resolve translateResponse(parsedResponse)

      return deferred.promise()

    @translateResponse: (response) ->
      response.Line = response.Line && response.Line - 1
      response.Column = response.Column && response.Column - 1

      return response

    @getEditorRequestContext: ->
      editor = atom.workspace.getActiveEditor()
      marker = editor.getCursorBufferPosition()

      context =
        column: marker.column
        filename: editor.getUri()
        line: marker.row + 1
        buffer: editor.displayBuffer.buffer.cachedText

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
      return @request
        uri: @_uri "gotoDefinition"
        method: "POST"
        form: data
