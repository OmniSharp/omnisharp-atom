Omni = require '../../../omni-sharp-server/omni'

module.exports =
  class CompletionProvider
    selector: '.source.cs'
    requestHandler: (options) ->
      return new Promise (resolve) ->
        wordRegex = /[A-Z_0-9]+/i
        buffer = options.editor.getBuffer()
        bufferPosition = options.editor.getCursorBufferPosition()

        end = options.position.column

        data = buffer.getLines()[options.position.row].substring(0, end + 1)
        end--

        while wordRegex.test(data.charAt(end))
          end--

        word = data.substring(end+1)
        Omni.autocomplete(word)
          .then (completions) ->
            completions ?= []
            suggestions = ({word:item.CompletionText, label:item.DisplayText, prefix:word} for item in completions)
            resolve(suggestions)
