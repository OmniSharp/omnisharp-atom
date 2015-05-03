import Omni = require('../../../omni-sharp-server/omni')

import _ = require('lodash')
import rx = require('rx')
var filter = require('fuzzaldrin').filter;

var cachedValue: rx.IPromise<OmniSharp.Models.AutoCompleteResponse[]> = null;

export interface RequestOptions {
    editor: Atom.TextEditor;
    bufferPosition: TextBuffer.Point; // the position of the cursor
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
    className?: string;
}

var subject = new rx.Subject<RequestOptions>();

// Detect when the cursor has moved a good distance
var bufferMovement = rx.Observable.zip(subject, subject.skip(1), (previous, current) => {
    // If the row changes we moved lines, we should refetch the completions
    // (Is it possible it will be the same set?)
    var row = Math.abs(current.bufferPosition.row - previous.bufferPosition.row) > 1;
    // If the column jumped over 5 places, lets get them again to be safe.
    var column = Math.abs(current.bufferPosition.column - previous.bufferPosition.column) > 5;

    return row || column || false;
}).filter(z => z);

// Always reset if the value is a dot
var prefixChange = subject.where(z => z.prefix === "." || !z.prefix).map(z => true);
// TODO: reset after x seconds?
//var reset = subject.debounce(1000).map(z => true);

rx.Observable.merge(bufferMovement, prefixChange)//, reset)
    .subscribe(x => cachedValue = null);

function getCachedValue(options: RequestOptions) {
    if (cachedValue) {
        return cachedValue;
    }

    var o = CompletionProvider.getResults(options);
    if (o) cachedValue = o.toPromise();

    return cachedValue;
};

export var CompletionProvider = {

    selector: '.source.cs, .source.csx',
    disableForSelector: 'source.cs .comment',

    inclusionPriority: 1,
    excludeLowerPriority: true,

    getResults(options: RequestOptions) {
        var buffer = options.editor.getBuffer();
        var data = buffer.getLines()[options.bufferPosition.row].substring(0, end + 1);
        var end = options.bufferPosition.column;
        var lastCharacterTyped = data[end - 1];
        if (!/[A-Z_0-9.]+/i.test(lastCharacterTyped)) {
            return;
        }

        return Omni.client.autocomplete(Omni.makeDataRequest<OmniSharp.Models.AutoCompleteRequest>({
            WordToComplete: '',
            WantDocumentationForEveryCompletionResult: false,
            WantKind: true,
            WantSnippet: true,
            WantReturnType: true
        }))
            .map(completions => {
            if (completions == null) {
                completions = [];
            }
            return completions;
        });
    },

    makeSuggestion(item: OmniSharp.Models.AutoCompleteResponse) {
        return {
            _search: item.DisplayText,
            snippet: item.Snippet,
            type: item.Kind,
            iconHTML: this.renderIcon(item),
            displayText: item.MethodHeader,
            className: 'autocomplete-omnisharp-atom',
            description: this.renderReturnType(item.ReturnType)
        }
    },

    getSuggestions(options: RequestOptions): rx.IPromise<Suggestion[]> {
        if (!Omni.vm.isReady) {
            return;
        }

        var search = options.prefix;
        if (search === ".")
            search = "";

        subject.onNext(options);
        var result = getCachedValue(options);
        if (result) {
            return result.then(response =>
                response.map(s => this.makeSuggestion(s)))
                .then(s => filter(s, search, { key: '_search' }));
        }
    },

    onDidInsertSuggestion(editor: Atom.TextEditor, triggerPosition: TextBuffer.Point, suggestion: any) {
    },

    dispose() {
    },

    renderReturnType(returnType: string) {
        if (returnType === null) {
            return;
        }
        return `Returns: ${returnType}`;
    },

    renderIcon(item) {
        // todo: move additional styling to css
        return '<img height="16px" width="16px" src="atom://omnisharp-atom/styles/icons/autocomplete_' + item.Kind.toLowerCase() + '@3x.png" /> '
    }

}
