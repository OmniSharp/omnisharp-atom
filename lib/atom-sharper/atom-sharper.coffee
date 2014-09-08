AtomSharperStatusBarView = require './atom-sharper-status-bar-view'
AtomSharperOutputView = require './atom-sharper-output-view'
OmniSharpServer = require '../omni-sharp-server/omni-sharp-server'
Omni = require '../omni-sharp-server/omni'

module.exports =
  atomSharpView: null

  activate: (state) ->
    #atom.config.setDefaults('test-status', autorun: true)
    atom.workspaceView.command "atom-sharper:toggle", => @toggle()
    atom.workspaceView.command "atom-sharper:request", => Omni.syntaxErrors()

    createStatusEntry = =>
      @testStatusStatusBar = new AtomSharperStatusBarView
      @outputView = new AtomSharperOutputView

      atom.on("omni-sharp-server:close", => @outputView.destroy())

    if atom.workspaceView.statusBar
      createStatusEntry()
    else
      atom.packages.once 'activated', ->
        createStatusEntry()

  toggle: ->
    OmniSharpServer.get().toggle()

  testRequest: ->

  deactivate: ->
    OmniSharpServer.get().stop()
    @testStatusStatusBar?.destroy()
    @testStatusStatusBar = null
    @outputView?.destroy()
    @outputView = null

  serialize: ->
    atomSharpViewState: @atomSharpView.serialize()
