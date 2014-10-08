_ = require 'underscore'
OmniSharpServer = require '../../omni-sharp-server/omni-sharp-server'
Omni = require '../../omni-sharp-server/omni'

module.exports =
  class SyntaxErrors

    constructor: (atomSharper) ->
      @atomSharper = atomSharper

    activate: =>
      @editorSubscription = @atomSharper.onEditor (editor) =>
        @detectSyntaxErrorsIn editor

    detectSyntaxErrorsIn: (editor) ->
      buffer = editor.getBuffer()
      buffer.on 'changed', _.debounce(Omni.syntaxErrors, 200)

    deactivate: ->
      @editorSubscription.destroy()
