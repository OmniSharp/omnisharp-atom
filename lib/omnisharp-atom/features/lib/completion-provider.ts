import Omni = require('../../../omni-sharp-server/omni')
import _ = require('lodash')

class CompletionProvider {
    public selector = '.source.cs'
    public blacklist = 'source.cs .comment'
    public requestHandler(options) {
        return new Promise<OmniSharp.ICompletionResult[]>(resolve => {
            var wordRegex = /[A-Z_0-9]+/i;
            var buffer = options.editor.getBuffer();
            var bufferPosition = options.editor.getCursorBufferPosition();

            var end = options.position.column;

            var data = buffer.getLines()[options.position.row].substring(0, end + 1);
            end--;

            while (wordRegex.test(data.charAt(end))) {
                end--;
            }

            var word = data.substring(end + 1);
            Omni.autocomplete(word)
                .then(completions => {
                if (completions == null) {
                    completions = [];
                }

                var result = _.map(completions, (item) => ({
                    word: item.CompletionText,
                    prefix: word,
                    renderLabelAsHtml: true,
                    label: this.renderLabel(item)
                }));

                // TODO: reoslve issue in bluebird.d.ts
                return resolve(<any>result);
            });
        })
    }

    public renderLabel(item) {
        // we don't have icons for this type of comment
        if (item.Kind === 'NamedType' || item.Kind === 'Parameter' || item.Kind === 'Local')
            return;

        // todo: move additional styling to css
        return '<img height="16px" width="16px" src="atom://omnisharp-atom/styles/icons/autocomplete_' + item.Kind.toLowerCase() + '@3x.png" /> '
    }

    public htmlEscape(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
    }
}

export = CompletionProvider;
