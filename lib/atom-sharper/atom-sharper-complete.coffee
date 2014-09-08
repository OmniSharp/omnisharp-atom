AtomSharperProvider = require "./atom-sharper-complete-provider"
console.log("loaded complete")
module.exports =
  editorSubscription: null
  autocomplete: null
  providers: []
  activate: ->
    console.log("activated")

    atom.packages.activatePackage("autocomplete-plus")
      .then (pkg) =>
        @autocomplete = pkg.mainModule
        @registerProviders()

  registerProviders: ->
    @editorSubscription = atom.workspaceView.eachEditorView (editorView) =>
      if editorView.attached and not editorView.mini
        provider = new AtomSharperProvider editorView

        @autocomplete.registerProviderForEditorView provider, editorView

        @providers.push provider

  deactivate: ->
    @editorSubscription?.off()
    @editorSubscription = null

    @providers.forEach (provider) =>
      @autocomplete.unregisterProvider provider

    @providers = []
