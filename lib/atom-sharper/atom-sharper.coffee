AtomSharperStatusBarView = require './atom-sharper-status-bar-view'
AtomSharperDockView = require './atom-sharper-dock-view'
AtomSharperCompletion = require "./atom-sharper-completion"
OmniSharpServer = require '../omni-sharp-server/omni-sharp-server'
Omni = require '../omni-sharp-server/omni'
_ = require "underscore"

module.exports =
  atomSharpView: null

  activate: (state) ->
    #atom.config.setDefaults('test-status', autorun: true)
    atom.workspaceView.command "atom-sharper:toggle", => @toggle()
    atom.workspaceView.command "atom-sharper:request", _.debounce(Omni.syntaxErrors, 200)
    atom.workspaceView.command "editor:display-updated", _.debounce(Omni.syntaxErrors, 200)
    atom.workspaceView.command "atom-sharp:go-to-definition", Omni.gotoDefinition

    atom.on "omni:navigate-to", (position) =>
      atom.workspace.open(position.FileName).then (editor) ->
        editor.setCursorBufferPosition [
          position.Line && position.Line - 1
          position.Column && position.Column - 1
        ]


    createStatusEntry = =>
      @testStatusStatusBar = new AtomSharperStatusBarView
      @outputView = new AtomSharperDockView
      @completion = new AtomSharperCompletion

    if atom.workspaceView.statusBar
      createStatusEntry()
    else
      atom.packages.once 'activated', createStatusEntry

  toggle: ->
    OmniSharpServer.get().toggle()

  deactivate: ->
    OmniSharpServer.get().stop()
    @testStatusStatusBar?.destroy()
    @testStatusStatusBar = null
    @outputView?.destroy()
    @outputView = null

    @completion?.deactivate()
    @completion = null

  serialize: -> atomSharpViewState: @atomSharpView?.serialize()
