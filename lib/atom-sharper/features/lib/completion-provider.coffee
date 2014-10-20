Omni = require '../../../omni-sharp-server/omni'

{Provider, Suggestion} = require 'autocomplete-plus-async-plus'

module.exports =
  class CompletionProvider extends Provider

    buildSuggestions: (cb) ->
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
      Omni.autocomplete(word)
        .then (completions) =>
          completions ?= []
          suggestions =
            (new Suggestion(this, word:item.CompletionText, label:item.DisplayText, prefix:word) for item in completions)
          cb(suggestions)
