Omni = require '../omni-sharp-server/omni'

if path = atom.packages.getLoadedPackage('autocomplete-plus-async')?.path
  {Provider, Suggestion} = require path
else
  # Package not installed
  console.log("autocomplete-plus-async has not been installed")

module.exports =
  class AtomSharperProvider
    instance = null
    class AtomSharperProviderInstance extends Provider

      buildSuggestions: (callback) ->
        wordRegex = /[A-Z_0-9]+/i
        editor = atom.workspace.getActiveEditor()
        buffer = editor.getBuffer()
        bufferPosition = editor.getCursorBufferPosition()

        end = bufferPosition.column

        data = buffer.getLines()[bufferPosition.row].substring(0, end + 1)
        end--

        while wordRegex.test(data.charAt(end))
          end--

        word = data.substring(end+1);
        console.log(word)
        Omni.autocomplete(word)
        .then (data) ->
          completions = JSON.parse(data)
          suggestions =
            (new Suggestion(this, word:item.CompletionText, label:item.DisplayText) for item in completions)
          callback suggestions
        .catch (data) -> console.error(data)

    @get: (editorView) ->
      instance ?= new AtomSharperProviderInstance(editorView)
