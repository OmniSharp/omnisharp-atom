OmniSharpServer = require './omni-sharp-server'
rp = require "request-promise"
Url = require "url"
_ = require "lodash"
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
      port = OmniSharpServer.get().port
      Url.format
        hostname: "localhost"
        protocol: "http"
        port: port
        pathname: path
        query: query

    @req: (path, event, d, editor) =>
      context = @getEditorContext(editor)
      return Promise.reject "no editor context found" unless context

      fullData = _.extend({}, context, d)

      @_req(path, event, fullData, editor)
      .catch (data) ->
        console.error data.statusCode?, data.options?.uri if typeof data isnt 'string'

    @_req: (path, event, fullData, editor) =>
      return Promise.reject "omnisharp not ready" if OmniSharpServer.vm.isNotReady

      rp
        uri: @_uri path
        method: "POST",
        json: true,
        body: fullData
      .then (data) ->
        try
          parsedData = JSON.parse(data)
        catch
          parsedData = data
        finally
          atom.emit "omni:#{event}",  parsedData, editor

        parsedData

    @reql: (path, event, d, editor) =>
      context = @getEditorContext(editor)
      return Promise.reject "no editor context found" unless context

      fullData = _.extend([], [context], d)

      @_req(path, event, fullData, editor)
      .catch (data) ->
        console.error data.statusCode?, data.options?.uri if typeof data isnt 'string'

    @syntaxErrors: => @req "syntaxErrors", "syntax-errors"

    @codecheck: (buffer, editor) =>
      @req "codecheck", "quick-fixes", null, editor

    @findUsages: => @req "findUsages", "find-usages"

    @goToDefinition: => @req "gotoDefinition", "navigate-to"

    @goToImplementation: => @req "findimplementations", "navigate-to-implementation"

    @fixUsings: => @req "fixUsings", "code-format"

    @codeFormat: => @req "codeFormat", "code-format"

    @build: => @req "buildcommand", "build-command"

    @packageRestore: => @reql "filesChanged", "package-restore"

    @autocomplete: (wordToComplete) =>
      data =
        wordToComplete: wordToComplete
        wantDocumentationForEveryCompletionResult: false
        wantKind: true

      @req "autocomplete", "autocomplete", data

    @rename: (wordToRename) =>
      data =
        renameTo: wordToRename

      @req "rename", "rename", data
