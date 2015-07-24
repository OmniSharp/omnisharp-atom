import Omni = require('../../../omni-sharp-server/omni')
import OmniSharpAtom = require('../../omnisharp-atom');

import _ = require('lodash')
import {Subject, BehaviorSubject, Observable, CompositeDisposable} from 'rx';
import Promise = require('bluebird');
var escape = require("escape-html");
var filter = require('fuzzaldrin').filter;

interface RequestOptions {
    editor: Atom.TextEditor;
    bufferPosition: TextBuffer.Point; // the position of the cursor
    prefix: string;
    scopeDescriptor: { scopes: string[] };
    activatedManually: boolean;
}

interface Suggestion {
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

function calcuateMovement(previous: RequestOptions, current: RequestOptions) {
    if (!current) return { reset: true, current: current };
    // If the row changes we moved lines, we should refetch the completions
    // (Is it possible it will be the same set?)
    var row = Math.abs(current.bufferPosition.row - previous.bufferPosition.row) > 0;
    // If the column jumped, lets get them again to be safe.
    var column = Math.abs(current.bufferPosition.column - previous.bufferPosition.column) > 3;
    return { reset: row || column || false, previous: previous, current: current };
}

var autoCompleteOptions = <OmniSharp.Models.AutoCompleteRequest>{
    WordToComplete: '',
    WantDocumentationForEveryCompletionResult: false,
    WantKind: true,
    WantSnippet: true,
    WantReturnType: true
};

let _disposable: CompositeDisposable;
let _initialized = false;

let _useIcons: boolean;
let _useLeftLabelColumnForSuggestions: boolean;

let _currentOptions: RequestOptions;
let _subject = new Subject<RequestOptions>();

let _clearCacheOnBufferMovement = Observable.zip(_subject, _subject.skip(1), calcuateMovement).where(z => z.reset).select(x => x.current);
let _clearCacheOnDot = _subject.where(z => z.prefix === "." || (z.prefix && !_.trim(z.prefix)) || !z.prefix || z.activatedManually);
let _cacheClearOnForce = new Subject<RequestOptions>();

// Only issue new requests when ever a cache change event occurs.
let _requestStream = Observable.merge(_clearCacheOnDot, _clearCacheOnBufferMovement, _cacheClearOnForce)
// This covers us incase both return the same value.
    .distinctUntilChanged()
// Make the request
    .flatMapLatest(options => Omni.request(client => client.autocomplete(client.makeDataRequest(autoCompleteOptions))))
// Ensure the array is not null;
    .map(completions => completions || [])
    .share();

function makeNextResolver() {
    var result: any;
    var resolver;
    var promise = new Promise(r => resolver = r);
    return { promise: promise, resolver: resolver };
}

let _suggestions = new BehaviorSubject<{ promise: Rx.IPromise<OmniSharp.Models.AutoCompleteResponse[]>; resolver?: (results: OmniSharp.Models.AutoCompleteResponse[]) => void }>(makeNextResolver());

// Reset the cache when the user asks us.
let clearCacheValue = _.debounce(() => {
    _suggestions.onNext(makeNextResolver());
}, 100, { leading: true });

let setupSubscriptions = () => {
    if (_initialized) return;

    var disposable = _disposable = new CompositeDisposable();

    disposable.add(_requestStream.subscribe(results => {
        var v = _suggestions.getValue();
        if (v.resolver) {
            v.resolver(results);
            v.resolver = null;
        } else {
            var nr = makeNextResolver();
            _suggestions.onNext(nr);
            nr.resolver(results);
            nr.resolver = null;
        }
    }));

    // Clear when auto-complete is opening.
    // TODO: Update atom typings
    disposable.add(atom.commands.onWillDispatch(function(event: Event) {
        if (event.type === "autocomplete-plus:activate" || event.type === "autocomplete-plus:confirm" || event.type === "autocomplete-plus:cancel") {
            clearCacheValue();
        }

        if (event.type === "autocomplete-plus:activate" && _currentOptions) {
            _cacheClearOnForce.onNext(_currentOptions);
        }
    }));

    // TODO: Dispose of these when not needed
    disposable.add(atom.config.observe('omnisharp-atom.useIcons', (value) => {
        _useIcons = value;
    }));

    disposable.add(atom.config.observe('omnisharp-atom.useLeftLabelColumnForSuggestions', (value) => {
        _useLeftLabelColumnForSuggestions = value;
    }));

    _initialized = true;
}

var onNext = (options: RequestOptions) => {
    // Hold on to options incase we're activating
    _currentOptions = options;
    _subject.onNext(options);
    _currentOptions = null;
};

// This method returns the currently held promise
// This is out cache container.  This resets when we ask for new values.
let promise = () => {
    return _suggestions.getValue().promise;
};

function makeSuggestion(item: OmniSharp.Models.AutoCompleteResponse) {
    var description, leftLabel, iconHTML, type;

    if (_useLeftLabelColumnForSuggestions == true) {
        description = item.RequiredNamespaceImport;
        leftLabel = item.ReturnType;
    } else {
        description = renderReturnType(item.ReturnType);
        leftLabel = '';
    }

    if (_useIcons == true) {
        iconHTML = renderIcon(item);
        type = item.Kind;
    } else {
        iconHTML = null;
        type = item.Kind.toLowerCase();
    }

    return {
        _search: item.CompletionText,
        snippet: item.Snippet,
        type: type,
        iconHTML: iconHTML,
        displayText: escape(item.DisplayText),
        className: 'autocomplete-omnisharp-atom',
        description: description,
        leftLabel: leftLabel,
    }
}

function renderReturnType(returnType: string) {
    if (returnType === null) {
        return;
    }
    return `Returns: ${returnType}`;
}

function renderIcon(item) {
    // todo: move additional styling to css
    return '<img height="16px" width="16px" src="atom://omnisharp-atom/styles/icons/autocomplete_' + item.Kind.toLowerCase() + '@3x.png" /> '
}

function getSuggestions(options: RequestOptions): Rx.IPromise<Suggestion[]> {
    if (!_initialized) setupSubscriptions();

    onNext(options);

    var buffer = options.editor.getBuffer();
    var end = options.bufferPosition.column;

    var data = buffer.getLines()[options.bufferPosition.row].substring(0, end + 1);
    var lastCharacterTyped = data[end - 1];

    if (!/[A-Z_0-9.]+/i.test(lastCharacterTyped)) {
        return;
    }

    var search = options.prefix;
    if (search === ".")
        search = "";

    var p = promise();
    if (search)
        p = p.then(s => filter(s, search, { key: 'CompletionText' }));

    return p.then(response => response.map(s => makeSuggestion(s)))
}

function onDidInsertSuggestion(editor: Atom.TextEditor, triggerPosition: TextBuffer.Point, suggestion: any) {
    clearCacheValue();
}

function dispose() {
    if (_disposable)
        _disposable.dispose();
    _disposable = null;
    _initialized = false;
}
export var CompletionProvider = {
    selector: '.source.cs, .source.csx',
    disableForSelector: 'source.cs .comment',
    inclusionPriority: 3,
    excludeLowerPriority: false,
    getSuggestions,
    //getSuggestions: _.throttle(getSuggestions, 0),
    onDidInsertSuggestion,
    dispose
}
