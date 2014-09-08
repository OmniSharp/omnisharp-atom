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

    @syntaxErrors: (data) =>
      editor = atom.workspace.getActiveEditor()
      rp
        uri: @_uri "syntaxErrors"
        method: "POST"
        form:
          column: 0
          filename: editor.getUri()
          line: 0
          buffer: editor.displayBuffer.buffer.cachedText
      .then (data) -> atom.emit("omni:syntax-errors", data)
      .catch (data) -> console.error(data)
