import Omni = require('../../../omni-sharp-server/omni')
import OmniServer = require("../../../omni-sharp-server/omni-sharp-server");

import _ = require('lodash')

export interface RequestOptions {
            editor: AtomCore.IEditor;
            bufferPosition: TextBuffer.IPoint; // the position of the cursor
            prefix: string;
            scopeDescriptor: { scopes: string[] };
}

export interface Suggestion {

       //Either text or snippet is required
       text?: string;
       snippet?: string;
       displayText?: string;
       replacementPrefix?: string;
       type: string;
       leftLabel?: string;
       leftLabelHTML?: string;
       rightLabel?: string;
       rightLabelHTML?: string;
       iconHTML?: string;
       description?: string;
       descriptionMoreURL?: string;

   }


export var CompletionProvider = {

    selector: '.source.cs',
    disableForSelector: 'source.cs .comment',

    inclusionPriority: 1,
    excludeLowerPriority: true,

    getSuggestions(options : RequestOptions) : Promise<Suggestion[]> {
        return new Promise<Suggestion[]>(resolve => {

            if (OmniServer.vm.isOff) {
                return;
            }

            var wordRegex = /[A-Z_0-9]+/i;
            var buffer = options.editor.getBuffer();

            var end = options.bufferPosition.column;

            var data = buffer.getLines()[options.bufferPosition.row].substring(0, end + 1);
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

                var result = _.map(completions, (item) : Suggestion => ({
                    //text: item.CompletionText,
                    snippet: item.Snippet,
                    type: item.Kind,
                    displayText: _.escape(item.DisplayText),
                    //leftLabel: item.ReturnType,
                    leftLabelHTML: '<span class="text-smaller">' + _.escape(item.ReturnType)  +'</span>',
                    rightLabelHTML: '<span class="text-smaller">' + _.escape(item.Kind)  +'</span>',
                    //description: "desc",
                    iconHTML: this.renderIcon(item)
                }));

                // TODO: reoslve issue in bluebird.d.ts
                return resolve(<any>result);
            });
        })
    },

    renderIcon(item) {
        //todo: fix icon images
        if (item.Kind === 'NamedType' || item.Kind === 'Parameter' || item.Kind === 'Local')
            return;

        // todo: move additional styling to css
        return '<img height="16px" width="16px" src="atom://omnisharp-atom/styles/icons/autocomplete_' + item.Kind.toLowerCase() + '@3x.png" /> '
    }

}
