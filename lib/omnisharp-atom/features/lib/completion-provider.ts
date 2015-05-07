import Omni = require('../../../omni-sharp-server/omni')

import _ = require('lodash')
import rx = require('rx')
var filter = require('fuzzaldrin').filter;

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

// Hide all the private code, so it doesn't bleed into the rest
// Make another file at somepoint?
var dataSource = (function() {
    var currentOptions: RequestOptions;

    function getResults(options: RequestOptions) {
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
    };

    function justResults(options: RequestOptions) {
        getSuggestionsSubject.onNext(getResults(options).toPromise())
    }

    function nextResults(value) {
        getSuggestionsSubject.onNext(getLatestValueObservable.take(1).toPromise());
    }

    var requestSubject = new rx.Subject<RequestOptions>();
    var clearCacheSubject = new rx.Subject<boolean>();
    var getLatestValueObservable = requestSubject.flatMap(getResults);
    var getSuggestionsSubject = new rx.BehaviorSubject<rx.IPromise<OmniSharp.Models.AutoCompleteResponse[]>>(getLatestValueObservable.take(1).toPromise());

    // Clear when auto-complete is opening.
    // TODO: Update atom typings
    atom.commands.onWillDispatch(function(event: Event) {
        if (event.type === "autocomplete-plus:activate" || event.type === "autocomplete-plus:confirm" || event.type === "autocomplete-plus:cancel") {
            clearCachedValue();
        }

        if (event.type === "autocomplete-plus:activate" && currentOptions) {
            requestSubject.onNext(currentOptions);
        }
    });

    // Always reset if the value is a dot
    var clearCacheWithDotPrefixObservable = requestSubject
        .where(z => z.prefix === "." || (z.prefix && !_.trim(z.prefix)) || !z.prefix)
        .subscribe(justResults);

    rx.Observable.merge(clearCacheSubject).subscribe(nextResults);

    function clearCachedValue() {
        clearCacheSubject.onNext(true);
    }

    return {
        onNext(options: RequestOptions) {
            currentOptions = options;
            requestSubject.onNext(options);
            currentOptions = null;
        },
        clearCachedValue: clearCachedValue,
        promise() { return getSuggestionsSubject.getValue(); }
    };
})();


export var CompletionProvider = {

    selector: '.source.cs, .source.csx',
    disableForSelector: 'source.cs .comment',

    inclusionPriority: 1,
    excludeLowerPriority: true,

    makeSuggestion(item: OmniSharp.Models.AutoCompleteResponse) {
        return {
            _search: item.CompletionText,
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

        dataSource.onNext(options);
        return dataSource.promise()
            .then(response => response.map(s => this.makeSuggestion(s)))
            .then(s => filter(s, search, { key: '_search' }));
    },

    onDidInsertSuggestion(editor: Atom.TextEditor, triggerPosition: TextBuffer.Point, suggestion: any) {
        dataSource.clearCachedValue();
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
