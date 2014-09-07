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
      data = $.extend({}, data, @getEditorRequestContext())
      return rp
        uri: @_uri "gotoDefinition"
        method: "POST"
        form: data
