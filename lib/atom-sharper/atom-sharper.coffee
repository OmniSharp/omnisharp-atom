AtomSharperStatusBarView = require './atom-sharper-status-bar-view'
AtomSharperDockView = require './atom-sharper-dock-view'
AtomSharperCompletion = require "./atom-sharper-completion"
OmniSharpServer = require '../omni-sharp-server/omni-sharp-server'
Omni = require '../omni-sharp-server/omni'
_ = require "underscore"

module.exports =
  atomSharpView: null

  activate: (state) ->
    atom.workspaceView.command "atom-sharper:toggle", => @toggle()
    atom.workspaceView.command "atom-sharper:go-to-definition", =>
      @navigateToWord = atom.workspace.getActiveEditor()?.getWordUnderCursor()
      Omni.goToDefinition()
    atom.workspaceView.command "atom-sharper:find-usages", => Omni.findUsages()

    atom.on "omni:navigate-to", (position) =>
      if position.FileName?
        atom.workspace.open(position.FileName).then (editor) ->
          editor.setCursorBufferPosition [
            position.Line && position.Line - 1
            position.Column && position.Column - 1
          ]
      else
        atom.emit "atom-sharper:error", "Can't navigate to '#{ @navigateToWord }'"

    atom.on "atom-sharper:error", (err) -> console.error err
    @registerEditorEvents()

    createStatusEntry = =>
      @testStatusStatusBar = new AtomSharperStatusBarView
      @outputView = new AtomSharperDockView
      @completion = new AtomSharperCompletion

    if atom.workspaceView.statusBar
      createStatusEntry()
    else
      atom.packages.once 'activated', createStatusEntry

  registerEditorEvents: ->
    atom.workspace.eachEditor (editor) =>
      if editor.getGrammar().name isnt 'C#'
          return
      buffer = editor.getBuffer()
      buffer.on 'changed', _.debounce(Omni.syntaxErrors, 200)

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
