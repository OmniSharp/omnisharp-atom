AtomSharperStatusBarView = require './atom-sharper-status-bar-view'
AtomSharperOutputView = require './atom-sharper-output-view'
OmniSharpServer = require '../omni-sharp-server/omni-sharp-server'
Omni = require '../omni-sharp-server/omni'

module.exports =
  atomSharpView: null

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

  goToDefinition: ->
    Omni.goToDefinition().then (response) ->
      atom.workspace.open(response.FileName).then (editor) ->
        editor.setCursorBufferPosition [
          response.Line
          response.Column
        ]
      .catch (data) -> console.error(data)

  deactivate: ->
    OmniSharpServer.get().stop()
    @testStatusStatusBar?.destroy()
    @testStatusStatusBar = null
    @outputView?.destroy()
    @outputView = null

  serialize: ->
    atomSharpViewState: @atomSharpView.serialize()
