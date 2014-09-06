AtomSharpStatusBarView = require './atom-sharp-status-bar-view'

module.exports =
  atomSharpView: null

  activate: (state) ->
    atom.config.setDefaults('test-status', autorun: true)
    createStatusEntry = =>
      @testStatusStatusBar = new AtomSharpStatusBarView

    if atom.workspaceView.statusBar
      createStatusEntry()
    else
      atom.packages.once 'activated', ->
        createStatusEntry()

  deactivate: ->
    @testStatusStatusBar?.destroy()
    @testStatusStatusBar = null

  serialize: ->
    atomSharpViewState: @atomSharpView.serialize()
