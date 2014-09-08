{View} = require 'atom'

module.exports =
class AtomSharperStatusBarView extends View

  # Internal: Initialize test-status status bar view DOM contents.
  @content: ->
    @a href:'#', outlet:  'omni-meter', class: 'inline-block atom-sharper-button', =>
      @span class: 'icon icon-flame', 'omni'

  # Internal: Initialize the status bar view and event handlers.
  initialize: ->
    atom.workspaceView.command "atom-sharper:toggle", => @toggle()
    @subscribe this, 'click', =>
      atom.workspaceView.trigger 'atom-sharper:toggle-output'
      this.toggleClass("atom-sharper-button-selected")

  # Internal: Attach the status bar view to the status bar.
  #
  # Returns nothing.
  attach: ->
    atom.workspaceView.statusBar.appendLeft(this)

  toggle: ->
    if @hasParent()
      @detach()
    else
      @attach()

  # Internal: Detach and destroy the test-status status barview.
  #
  # Returns nothing.
  destroy: ->
    @detach()
