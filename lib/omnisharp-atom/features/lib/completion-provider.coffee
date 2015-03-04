Omni = require '../../../omni-sharp-server/omni'

module.exports =
  class CompletionProvider
    selector: '.source.cs'
    blacklist: 'source.cs .comment'
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
            suggestions = ({
                word:item.CompletionText,
                prefix:word
                renderLabelAsHtml:true,
                label: renderLabel(item)
                } for item in completions)
            resolve(suggestions)

    renderLabel = (item) ->
      # we don't have icons for this type of comment
      if item.Kind is 'NamedType' or item.Kind is 'Parameter' or item.Kind is 'Local' then return
      #todo: move additional styling to css
      return '<img height="16px" width="16px" src="atom://omnisharp-atom/styles/icons/autocomplete_' + item.Kind.toLowerCase()  + '@3x.png" /> '

    htmlEscape = (str) ->
      return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
