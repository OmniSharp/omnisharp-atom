AtomSharperStatusBarView = require './atom-sharper-status-bar-view'
AtomSharperDockView = require './atom-sharper-dock-view'
AtomSharperProvider = require "./atom-sharper-complete-provider"
OmniSharpServer = require '../omni-sharp-server/omni-sharp-server'
Omni = require '../omni-sharp-server/omni'
_ = require "underscore"

module.exports =
  atomSharpView: null

  editorSubscription: null
  autocomplete: null
  providers: []

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

      atom.on("omni-sharp-server:close", => @outputView.destroy())

    if atom.workspaceView.statusBar
      createStatusEntry()
    else
      atom.packages.once 'activated', ->
        createStatusEntry()

    atom.packages.activatePackage("autocomplete-plus")
      .then (pkg) =>
        @autocomplete = pkg.mainModule
        @registerProviders()

  registerProviders: ->
    @editorSubscription = atom.workspaceView.eachEditorView (editorView) =>
      if editorView.attached and not editorView.mini
        provider = AtomSharperProvider.get(editorView)
        @autocomplete.registerProviderForEditorView provider, editorView

        @providers.push provider

  toggle: ->
    OmniSharpServer.get().toggle()

  deactivate: ->
    OmniSharpServer.get().stop()
    @testStatusStatusBar?.destroy()
    @testStatusStatusBar = null
    @outputView?.destroy()
    @outputView = null

    @editorSubscription?.off()
    @editorSubscription = null

    @providers.forEach (provider) =>
      @autocomplete.unregisterProvider provider

    @providers = []

  serialize: ->
    atomSharpViewState: @atomSharpView.serialize()
