OmniSharpServer = require './omni-sharp-server'
rp = require "request-promise"
Url = require "url"
_ = require "underscore"

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

    @req: (path, event, data = null) =>
      editor = atom.workspace.getActiveEditor()
      cursor = editor.getCursorBufferPosition()
      buffer = editor.buffer.getLines().join('\n')
      parse = @parse
      return if !buffer
      form =
        column: cursor.column + 1
        filename: editor.getUri()
        line: cursor.row + 1
        buffer: buffer
      #_.extend(form, data) if data
      rp
        uri: @_uri path
        method: "POST"
        form: form
      .then (data) -> atom.emit("omni:#{event}", JSON.parse(data))
      .catch (data) -> console.error(data.statusCode?, data.options?.uri)

    @syntaxErrors: (data) => @req "syntaxErrors", "syntax-errors", data

    @goToDefinition: (data) => @req "gotoDefinition", "navigate-to", data
