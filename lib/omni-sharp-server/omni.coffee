OmniSharpServer = require './omni-sharp-server'
rp = require "request-promise"
Url = require "url"
_ = require "underscore"
Promise = require("bluebird");

module.exports =

  class Omni

    @getEditorContext: (editor) ->
      editor = editor || atom.workspace.getActiveEditor()
      return unless editor
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

    @req: (path, event, d, editor) =>
      @_req(path, event, d, editor)
      .catch (data) ->
        console.error data.statusCode?, data.options?.uri if typeof data isnt 'string'

    @_req: (path, event, d, editor) =>
      return Promise.reject "omnisharp not ready" if OmniSharpServer.vm.isNotReady

      context = @getEditorContext(editor)
      return Promise.reject "no editor context found" unless context

      rp
        uri: @_uri path
        method: "POST"
        form: _.extend({}, context, d)
      .then (data) ->
        json = JSON.parse(data)
        atom.emit "omni:#{event}", json
        json

    @syntaxErrors: => @req "syntaxErrors", "syntax-errors"

    @codecheck: (buffer, editor) =>
      @req "codecheck", "quick-fixes", null, editor

    @findUsages: => @req "findUsages", "find-usages"

    @goToDefinition: => @req "gotoDefinition", "navigate-to"

    @fixUsings: => @req "fixUsings", "code-format"

    @codeFormat: => @req "codeFormat", "code-format"

    @autocomplete: (wordToComplete) =>
      data =
        wordToComplete: wordToComplete
        wantDocumentationForEveryCompletionResult: false

      @req "autocomplete", "autocomplete", data
