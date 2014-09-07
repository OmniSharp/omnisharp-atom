AtomSharpStatusBarView = require './atom-sharp-status-bar-view'
AtomSharpOutputView = require './atom-sharp-output-view'
OmniSharpServer = require './omni-sharp-wrapper'
Omni = require './omni'

module.exports =
  atomSharpView: null

  activate: (state) ->
    #atom.config.setDefaults('test-status', autorun: true)
    atom.workspaceView.command "atom-sharp:toggle", => @toggle()
    atom.workspaceView.command "atom-sharp:request", => @testRequest()
    createStatusEntry = =>
      @testStatusStatusBar = new AtomSharpStatusBarView
      @outputView = new AtomSharpOutputView

      atom.on("omni-sharp:close", => @outputView.destroy())

    if atom.workspaceView.statusBar
      createStatusEntry()
    else
      atom.packages.once 'activated', ->
        createStatusEntry()

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

  deactivate: ->
    OmniSharpServer.get().stop()
    @testStatusStatusBar?.destroy()
    @testStatusStatusBar = null
    @outputView?.destroy()
    @outputView = null

  serialize: ->
    atomSharpViewState: @atomSharpView.serialize()
