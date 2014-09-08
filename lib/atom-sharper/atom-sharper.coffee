AtomSharperStatusBarView = require './atom-sharper-status-bar-view'
AtomSharperOutputView = require './atom-sharper-output-view'
AtomSharperProvider = require "./atom-sharper-complete-provider"
OmniSharpServer = require '../omni-sharp-server/omni-sharp-server'
Omni = require '../omni-sharp-server/omni'

module.exports =
  atomSharpView: null

  editorSubscription: null
  autocomplete: null
  providers: []

  activate: (state) ->
    #atom.config.setDefaults('test-status', autorun: true)
    atom.workspaceView.command "atom-sharper:toggle", => @toggle()
    atom.workspaceView.command "atom-sharper:request", => @testRequest()
    atom.workspaceView.command "atom-sharp:go-to-definition", => @goToDefinition()

    createStatusEntry = =>
      @testStatusStatusBar = new AtomSharperStatusBarView
      @outputView = new AtomSharperOutputView

      atom.on("omni-sharp-server:close", => @outputView.destroy())

    if atom.workspaceView.statusBar
      createStatusEntry()
    else
      atom.packages.once 'activated', ->
        createStatusEntry()

    atom.packages.activatePackage("autocomplete-plus-async")
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

  testRequest: ->
    editor = atom.workspace.getActiveEditor()
    Omni.syntaxErrors
      column: 0
      filename: editor.getUri()
      line: 0
      buffer: editor.displayBuffer.buffer.cachedText
    .then (data) -> console.log(data)
    .catch (data) -> console.error(data)

  translatePoint: (line, column) ->
    return [
      line - 1
      column
    ]

  goToDefinition: ->
    translatePoint = @translatePoint

    Omni
      .goToDefinition()
      .then (data) ->
        definition = JSON.parse(data)
        atom.workspace.open(definition.FileName).then (editor) ->
          editor.setCursorBufferPosition translatePoint(definition.Line, definition.Column)
      .catch (data) -> console.error(data)

  deactivate: ->
    OmniSharpServer.get().stop()
    @testStatusStatusBar?.destroy()
    @testStatusStatusBar = null
    @outputView?.destroy()
    @outputView = null

    @editorSubscription?.off()
    @editorSubscription = null

#    @providers.forEach (provider) =>
#      @autocomplete.unregisterProvider provider

    @providers = []

  serialize: ->
    atomSharpViewState: @atomSharpView.serialize()
