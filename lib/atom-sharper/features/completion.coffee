CompletionProvider = require "./lib/completion-provider"

module.exports =
class Completion
  editorSubscription: null
  autocomplete: null
  providers: []
  constructor: ->
    atom.packages.activatePackage("autocomplete-plus-async")
      .then (pkg) =>
        @autocomplete = pkg.mainModule
        @registerProviders()

  registerProviders: ->
    @editorSubscription = atom.workspaceView.eachEditorView (editorView) =>
      if editorView.attached and not editorView.mini
        provider = new CompletionProvider editorView

        @autocomplete.registerProviderForEditorView provider, editorView

        @providers.push provider

  deactivate: ->
    @editorSubscription?.off()
    @editorSubscription = null

    @providers.forEach (provider) =>
      @autocomplete.unregisterProvider provider

    @providers = []
