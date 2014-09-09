OmniSharpServer = require './omni-sharp-server'
rp = require "request-promise"
Url = require "url"

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

    @req: (path, event, line = 0, column = 0) =>
      editor = atom.workspace.getActiveEditor()
      buffer =  editor.displayBuffer.buffer.cachedText
      return if !buffer
      rp
        uri: @_uri path
        method: "POST"
        form:
          column: column
          filename: editor.getUri()
          line: line
          buffer: buffer
      .then (data) -> atom.emit("omni:#{event}", JSON.parse(data))
      .catch (data) -> console.error(data.statusCode?, data.options?.uri)

    @syntaxErrors: (data) => @req "syntaxErrors", "syntax-errors"
