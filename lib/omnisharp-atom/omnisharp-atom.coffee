_ = require "underscore"
fs = require 'fs-plus'
{Emitter} = require 'event-kit'

StatusBarView = require './views/status-bar-view'
DockView = require './views/dock-view'

OmniSharpServer = require '../omni-sharp-server/omni-sharp-server'
Omni = require '../omni-sharp-server/omni'

module.exports =

  activate: (state) ->
    atom.workspaceView.command "omnisharp-atom:toggle", => @toggle()

    @emitter = new Emitter
    @loadFeatures()
    @features.iterate 'activate', state
    @subscribeToEvents()

  # events
  onEditor: (callback) ->
    @emitter.on 'omnisharp-atom-editor', callback

  onEditorDestroyed: (callback) ->
    @emitter.on 'omnisharp-atom-editor-destroyed', (filePath) ->
      callback filePath

  getPackageDir: ->
    _.find(atom.packages.packageDirPaths, (packagePath) -> fs.existsSync("#{packagePath}/omnisharp-atom"))

  loadFeatures: ->
    self = this
    packageDir = @getPackageDir()
    featureDir = "#{packageDir}/omnisharp-atom/lib/omnisharp-atom/features"
    featureFiles = _.filter(fs.readdirSync(featureDir), (file) -> not fs.statSync("#{featureDir}/#{file}").isDirectory())

    @features = _.map(featureFiles, (feature) ->
      { name: feature.replace('.coffee', ''), path: "./features/#{feature}" }
    )

    loadFeature = (feature) ->
      feature._class = require feature.path
      feature._obj = new feature._class(self)

    loadFeature feature for feature in @features

    @features.iterate = (funcName) =>
      args = Array.prototype.slice.call arguments, 1
      feature._obj[funcName]?.apply feature, args for feature in @features

  subscribeToEvents: ->
    if atom.workspaceView.statusBar
      @buildStatusBarAndDock()

    @observePackagesActivated = atom.packages.onDidActivateAll () =>
      @buildStatusBarAndDock()

    @observeEditors = atom.workspace.observeTextEditors (editor) =>
      if editor.getGrammar().name is 'C#'
        @emitter.emit 'omnisharp-atom-editor', editor

        editorFilePath = editor.buffer.file.path
        editor.onDidDestroy () =>
          @emitter.emit 'omnisharp-atom-editor-destroyed', editorFilePath

  buildStatusBarAndDock: ->
    @statusBar = new StatusBarView
    @outputView = new DockView

  toggle: ->
    OmniSharpServer.get().toggle()

  deactivate: ->
    @emitter.dispose()
    @observeEditors.dispose()
    @observePackagesActivated.dispose()

    @features = null

    @outputView?.destroy()
    @outputView = null
    OmniSharpServer.get().stop()
