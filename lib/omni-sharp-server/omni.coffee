OmniSharpServer = require './omni-sharp-server'
rp = require "request-promise"
Url = require "url"
$ = require "jquery"

module.exports =

  class Omni

    @_uri: (path, query) =>
      port = OmniSharpServer.get().getPortNumber()
      Url.format
        hostname: "localhost"
        protocol: "http"
        port: port
        pathname: path
        query: query

    @req: (path, event) =>
      editor = atom.workspace.getActiveEditor()
      cursor = editor.getCursorBufferPosition()
      buffer =  editor.displayBuffer.buffer.cachedText
      parse = @parse
      return if !buffer
      rp
        uri: @_uri path
        method: "POST"
        form:
          column: cursor.column + 1
          filename: editor.getUri()
          line: cursor.row + 1
          buffer: buffer
      .then (data) -> atom.emit("omni:#{event}", parse(data))
      .catch (data) -> console.error(data.statusCode?, data.options?.uri)

    @parse: (response) ->
      response = JSON.parse(response)
      response.Line = response.Line && response.Line - 1
      response.Column = response.Column && response.Column - 1

      return response

    @syntaxErrors: (data) => @req "syntaxErrors", "syntax-errors"

    @goToDefinition: (data) => @req "gotoDefinition", "navigate-to"
