Omni = require '../omni-sharp-server/omni'

if path = atom.packages.getLoadedPackage('autocomplete-plus')?.path
  {Provider, Suggestion} = require path
else
  # Package not installed
  console.log("autocomplete-plus has not been installed")

module.exports =
  class AtomSharperProvider
    instance = null
    class AtomSharperProviderInstance extends Provider

      buildSuggestions: ->
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
        completions = Omni.autocomplete(word)
        console.log(completions);
        suggestions =
          (new Suggestion(this, word:item.CompletionText, label:item.DisplayText, prefix:word) for item in completions)
        return suggestions

    @get: (editorView) ->
      instance ?= new AtomSharperProviderInstance(editorView)
