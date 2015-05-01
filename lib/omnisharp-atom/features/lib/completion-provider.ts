import Omni = require('../../../omni-sharp-server/omni')

import _ = require('lodash')
import rx = require('rx')

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

var bufferMovement = rx.Observable.zip(subject, subject.skip(1), (previous, current) => {
    // If the row changes we moved lines, we should refetch the completions
    // (Is it possible it will be the same set?)
    var row = Math.abs(current.bufferPosition.row - previous.bufferPosition.row) > 1;
    // If the column jumped over 5 places, lets get them again to be safe.
    var column = Math.abs(current.bufferPosition.column - previous.bufferPosition.column) > 5;

    return { doLoad: row || column || false, options: current };
}).filter(z => z.doLoad).map(z => z.options);

// Always reset if the value is a dot
var prefixChange = subject.where(z => z.prefix === ".");

var suggestionSubject = new rx.BehaviorSubject<OmniSharp.Models.AutoCompleteResponse[]>([]);

var observable: rx.Observable<RequestOptions> = (<any>rx.Observable.merge(prefixChange, bufferMovement)).throttleFirst(100);
observable.flatMap(options => CompletionProvider.getResults(options)).subscribe((results) => suggestionSubject.onNext(results));
function removeReplacementPrefix(s: Suggestion) {
    delete s.replacementPrefix;
    return s;
}

export var CompletionProvider = {

    selector: '.source.cs, .source.csx',
    disableForSelector: 'source.cs .comment',

    inclusionPriority: 1,
    excludeLowerPriority: true,

    getResults(options: RequestOptions) {
        var wordRegex = /[A-Z_0-9]+/i;
        var buffer = options.editor.getBuffer();

        var end = options.bufferPosition.column;

        var data = buffer.getLines()[options.bufferPosition.row].substring(0, end + 1);
        var lastCharacterTyped = data[end - 1];
        if (!/[A-Z_0-9.]+/i.test(lastCharacterTyped)) {
            return;
        }

        var start = end;

        do {
            start--;
        } while (wordRegex.test(data.charAt(start)));

        var word = data.substring(start + 1, end);
        return Omni.client.autocomplete(Omni.makeDataRequest<OmniSharp.Models.AutoCompleteRequest>({
            WordToComplete: word,
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

    makeSuggestion(item : OmniSharp.Models.AutoCompleteResponse) {
        return {
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

        console.log('getSuggestions', options);
        //if (options.prefix === '.') // Always reset on dot
        subject.onNext(options);
        return suggestionSubject.take(1).toPromise().then(z => z.map(x => this.makeSuggestion(x)));
    },

    onDidInsertSuggestion(editor: Atom.TextEditor, triggerPosition: TextBuffer.Point, suggestion: any) {
        console.log('onDidInsertSuggestion', suggestion);
    },

    dispose() {
        console.log('dispose');
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
