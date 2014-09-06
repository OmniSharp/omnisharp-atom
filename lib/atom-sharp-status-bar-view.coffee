{View} = require 'atom'
OmniSharpServer = require './omni-sharp-wrapper'

module.exports =
class AtomSharpStatusBarView extends View

  # Internal: Initialize test-status status bar view DOM contents.
  @content: ->
    @div class: 'inline-block omni-meter', =>
      @span outlet:  'omni-meter', class: 'test-status icon icon-flame', tabindex: -1, 'omni'

  # Internal: Initialize the status bar view and event handlers.
  initialize: ->
    atom.workspaceView.command "atom-sharp:toggle", => @toggle()
    @subscribe this, 'click', =>
      console.log "clicked on the omni icon"
      atom.workspaceView.trigger 'atom-sharp:toggle-output'



  # Internal: Attach the status bar view to the status bar.
  #
  # Returns nothing.
  attach: ->
    console.log "AtomSharpStatusView was attached!"
    atom.workspaceView.statusBar.appendLeft(this)

  toggle: ->
    OmniSharpServer.get().toggle()
    if @hasParent()
      @detach()
    else
      @attach()

# Internal: Detach and destroy the test-status status barview.
  #
  # Returns nothing.
  destroy: ->
    @detach()
