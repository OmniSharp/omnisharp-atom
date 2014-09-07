{View}  = require 'atom'
Convert = require 'ansi-to-html'

module.exports =
# Internal: A tool-panel view for the test result output.
class AtomSharperOutputView extends View

  # Internal: Initialize test-status output view DOM contents.
  @content: ->
    @div tabIndex: -1, class: 'atom-sharper-output tool-panel panel-bottom padded native-key-bindings', =>
      @div class: 'block', =>
        @div class: 'message', outlet: 'sharpAtomOutput'

  # Internal: Initialize the test-status output view and event handlers.
  initialize: ->

    atom.workspaceView.command "atom-sharper:toggle-output", =>
      @toggle()

    atom.on("omni-sharp-server:out", (data) => @update data)
    atom.on("omni-sharp-server:err", (data) => @update data)
    atom.on "omni-sharp-server:start", @start

  start: (pid) =>
    @output = "<strong class'success'>Started Omnisharp server (#{pid})</strong>"
    @sharpAtomOutput.html(@output).css('font-size', "#{atom.config.getInt('editor.fontSize')}px")

  update: (output) ->
    @convert ?= new Convert
    @output = @convert.toHtml(
      output.replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      )
    message = @sharpAtomOutput.append("<pre>#{@output.trim()}</pre>")
    message[0].lastChild.scrollIntoViewIfNeeded()

  destroy: ->
    @detach()

  # Internal: Toggle the visibilty of the test-status output view.
  #
  # Returns nothing.
  toggle: ->
    if @hasParent()
      @detach()
    else
      atom.workspaceView.prependToBottom(this) unless @hasParent()
      @sharpAtomOutput[0].lastChild.scrollIntoViewIfNeeded()
