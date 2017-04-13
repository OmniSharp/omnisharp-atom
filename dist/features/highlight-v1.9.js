'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.enhancedHighlighting19 = exports.ExcludeClassifications = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.augmentEditor = augmentEditor;
exports.getEnhancedGrammar = getEnhancedGrammar;

var _lodash = require('lodash');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

var _omnisharpTextEditor = require('../server/omnisharp-text-editor');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AtomGrammar = require(atom.config.resourcePath + '/node_modules/first-mate/lib/grammar.js');
var DEBOUNCE_TIME = 240;
var HIGHLIGHT = 'HIGHLIGHT',
    HIGHLIGHT_REQUEST = 'HIGHLIGHT_REQUEST';
function getHighlightsFromQuickFixes(path, quickFixes, projectNames) {
    return (0, _lodash.chain)(quickFixes).filter(function (x) {
        return x.FileName === path;
    }).map(function (x) {
        return {
            StartLine: x.Line,
            StartColumn: x.Column,
            EndLine: x.EndLine,
            EndColumn: x.EndColumn,
            Kind: 'unused code',
            Projects: projectNames
        };
    }).value();
}
var ExcludeClassifications = exports.ExcludeClassifications = [2, 3, 5, 4, 6];

var Highlight = function () {
    function Highlight() {
        _classCallCheck(this, Highlight);

        this.unusedCodeRows = new UnusedMap();
        this.required = false;
        this.title = 'Enhanced Highlighting';
        this.description = 'Enables server based highlighting, which includes support for string interpolation, class names and more.';
        this.default = false;
    }

    _createClass(Highlight, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            if (!(_omni.Omni.atomVersion.minor !== 1 || _omni.Omni.atomVersion.minor > 8)) {
                return;
            }
            this.disposable = new _tsDisposables.CompositeDisposable();
            this.editors = [];
            this.disposable.add((0, _omnisharpTextEditor.registerContextItem)(HIGHLIGHT_REQUEST, function (context) {
                return new _rxjs.Subject();
            }), (0, _omnisharpTextEditor.registerContextItem)(HIGHLIGHT, function (context, editor) {
                return context.get(HIGHLIGHT_REQUEST).startWith(true).debounceTime(100).switchMap(function () {
                    return _rxjs.Observable.defer(function () {
                        var projects = context.project.activeFramework.Name === 'all' ? [] : [context.project.activeFramework.Name];
                        var linesToFetch = (0, _lodash.uniq)(editor.getGrammar().linesToFetch);
                        if (!linesToFetch || !linesToFetch.length) linesToFetch = [];
                        return _rxjs.Observable.combineLatest(_this.unusedCodeRows.get(editor.getPath()), _omni.Omni.request(editor, function (solution) {
                            return solution.highlight({
                                ProjectNames: projects,
                                Lines: linesToFetch,
                                ExcludeClassifications: ExcludeClassifications
                            });
                        }), function (quickfixes, response) {
                            return {
                                editor: editor,
                                projects: projects,
                                highlights: getHighlightsFromQuickFixes(editor.getPath(), quickfixes, projects).concat(response ? response.Highlights : [])
                            };
                        }).do(function (_ref) {
                            var highlights = _ref.highlights;

                            if (editor.getGrammar) {
                                editor.getGrammar().setResponses(highlights, projects.length > 0);
                            }
                        }).publishReplay(1).refCount();
                    });
                });
            }), _omni.Omni.listener.model.diagnosticsByFile.subscribe(function (changes) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = changes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var _step$value = _slicedToArray(_step.value, 2),
                            file = _step$value[0],
                            diagnostics = _step$value[1];

                        _this.unusedCodeRows.set(file, (0, _lodash.filter)(diagnostics, function (x) {
                            return x.LogLevel === 'Hidden';
                        }));
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }), _omni.Omni.eachEditor(function (editor, cd) {
                _this.setupEditor(editor, cd);
                cd.add(editor.omnisharp.get(HIGHLIGHT).subscribe(function () {
                    editor.tokenizedBuffer['silentRetokenizeLines']();
                }));
                editor.omnisharp.get(HIGHLIGHT_REQUEST).next(true);
            }), _omni.Omni.switchActiveEditor(function (editor, cd) {
                editor.omnisharp.get(HIGHLIGHT_REQUEST).next(true);
                if (editor.tokenizedBuffer['silentRetokenizeLines']) {
                    editor.tokenizedBuffer['silentRetokenizeLines']();
                }
            }), _tsDisposables.Disposable.create(function () {
                _this.unusedCodeRows.clear();
            }));
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            if (this.disposable) {
                this.disposable.dispose();
            }
        }
    }, {
        key: 'setupEditor',
        value: function setupEditor(editor, disposable) {
            var _this2 = this;

            if (editor['_oldGrammar'] || !editor.getGrammar) return;
            var issueRequest = editor.omnisharp.get(HIGHLIGHT_REQUEST);
            augmentEditor(editor, this.unusedCodeRows, true);
            this.editors.push(editor);
            this.disposable.add(disposable);
            disposable.add(_tsDisposables.Disposable.create(function () {
                editor.getGrammar().linesToFetch = [];
                if (editor.getGrammar().responses) editor.getGrammar().responses.clear();
                editor.tokenizedBuffer.retokenizeLines();
                delete editor['_oldGrammar'];
            }));
            this.disposable.add(editor.onDidDestroy(function () {
                (0, _lodash.pull)(_this2.editors, editor);
            }));
            disposable.add(editor.omnisharp.project.observe.activeFramework.subscribe(function () {
                editor.getGrammar().linesToFetch = [];
                if (editor.getGrammar().responses) editor.getGrammar().responses.clear();
                issueRequest.next(true);
            }));
            disposable.add(editor.onDidStopChanging(function () {
                return issueRequest.next(true);
            }));
            disposable.add(editor.onDidSave(function () {
                editor.getGrammar().linesToFetch = [];
                issueRequest.next(true);
            }));
            disposable.add(editor.omnisharp.solution.whenConnected().delay(1000).subscribe({
                complete: function complete() {
                    issueRequest.next(true);
                }
            }));
        }
    }]);

    return Highlight;
}();

function augmentEditor(editor) {
    var unusedCodeRows = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var doSetGrammar = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    if (!editor['_oldGrammar']) editor['_oldGrammar'] = editor.getGrammar();
    if (!editor['_setGrammar']) editor['_setGrammar'] = editor.setGrammar;
    if (!editor.tokenizedBuffer['_buildTokenizedLineForRowWithText']) editor.tokenizedBuffer['_buildTokenizedLineForRowWithText'] = editor.tokenizedBuffer.buildTokenizedLineForRowWithText;
    if (!editor.tokenizedBuffer['_markTokenizationComplete']) editor.tokenizedBuffer['_markTokenizationComplete'] = editor.tokenizedBuffer.markTokenizationComplete;
    if (!editor.tokenizedBuffer['_retokenizeLines']) editor.tokenizedBuffer['_retokenizeLines'] = editor.tokenizedBuffer.retokenizeLines;
    if (!editor.tokenizedBuffer['_tokenizeInBackground']) editor.tokenizedBuffer['_tokenizeInBackground'] = editor.tokenizedBuffer.tokenizeInBackground;
    if (!editor.tokenizedBuffer['_chunkSize']) editor.tokenizedBuffer['chunkSize'] = 20;
    editor.setGrammar = setGrammar;
    if (doSetGrammar) editor.setGrammar(editor.getGrammar());
    editor.tokenizedBuffer.buildTokenizedLineForRowWithText = function (row) {
        editor.getGrammar()['__row__'] = row;
        return editor.tokenizedBuffer['_buildTokenizedLineForRowWithText'].apply(this, arguments);
    };
    if (!editor.tokenizedBuffer.silentRetokenizeLines) {
        editor.tokenizedBuffer.silentRetokenizeLines = (0, _lodash.debounce)(function () {
            if (editor.getGrammar().isObserveRetokenizing) editor.getGrammar().isObserveRetokenizing.next(false);
            var lastRow = void 0;
            lastRow = this.buffer.getLastRow();
            this.tokenizedLines = this.buildPlaceholderTokenizedLinesForRows(0, lastRow);
            this.invalidRows = [];
            if (this.linesToTokenize && this.linesToTokenize.length) {
                this.invalidateRow((0, _lodash.min)(this.linesToTokenize));
            } else {
                this.invalidateRow(0);
            }
            this.fullyTokenized = false;
        }, DEBOUNCE_TIME, { leading: true, trailing: true });
    }
    editor.tokenizedBuffer.markTokenizationComplete = function () {
        if (editor.getGrammar().isObserveRetokenizing) editor.getGrammar().isObserveRetokenizing.next(true);
        return editor.tokenizedBuffer['_markTokenizationComplete'].apply(this, arguments);
    };
    editor.tokenizedBuffer.retokenizeLines = function () {
        if (editor.getGrammar().isObserveRetokenizing) editor.getGrammar().isObserveRetokenizing.next(false);
        return editor.tokenizedBuffer['_retokenizeLines'].apply(this, arguments);
    };
    editor.tokenizedBuffer.tokenizeInBackground = function () {
        if (!this.visible || this.pendingChunk || !this.isAlive()) return;
        this.pendingChunk = true;
        this.pendingChunk = false;
        if (this.isAlive() && this.buffer.isAlive()) {
            this.tokenizeNextChunk();
        }
    };
    editor.tokenizedBuffer.scopesFromTags = function (startingScopes, tags) {
        var scopes = startingScopes.slice();
        var grammar = editor.getGrammar();
        for (var i = 0, len = tags.length; i < len; i++) {
            var tag = tags[i];
            if (tag < 0) {
                if (tag % 2 === -1) {
                    scopes.push(tag);
                } else {
                    var matchingStartTag = tag + 1;
                    while (true) {
                        if (scopes.pop() === matchingStartTag) {
                            break;
                        }
                        if (scopes.length === 0) {
                            scopes.push(grammar.startIdForScope('.' + grammar.scopeName));
                            console.info('Encountered an unmatched scope end tag.', {
                                filePath: editor.buffer.getPath(),
                                grammarScopeName: grammar.scopeName,
                                tag: tag,
                                unmatchedEndTag: grammar.scopeForId(tag)
                            });
                            editor.getGrammar().setResponses([]);
                            if (unusedCodeRows && (0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor)) {
                                unusedCodeRows.get(editor.getPath()).take(1).subscribe(function (rows) {
                                    return editor.getGrammar().setResponses(getHighlightsFromQuickFixes(editor.getPath(), rows, []));
                                });
                            }
                            break;
                        }
                    }
                }
            }
        }
        return scopes;
    };
}

var Grammar = function () {
    function Grammar(editor, base, options) {
        var _this3 = this;

        _classCallCheck(this, Grammar);

        this._gid = (0, _lodash.uniqueId)('og');
        this.isObserveRetokenizing = new _rxjs.ReplaySubject(1);
        this.isObserveRetokenizing.next(true);
        this.editor = editor;
        this.responses = new Map();
        this.linesToFetch = [];
        this.linesToTokenize = [];
        this.activeFramework = {};
        if (!options || !options.readonly) {
            editor.getBuffer().preemptDidChange(function (e) {
                var oldRange = e.oldRange,
                    newRange = e.newRange;

                var start = oldRange.start.row,
                    delta = newRange.end.row - oldRange.end.row;
                start = start - 5;
                if (start < 0) start = 0;
                var end = editor.buffer.getLineCount() - 1;
                var lines = (0, _lodash.range)(start, end + 1);
                if (!_this3.responses.keys().next().done) {
                    var _linesToFetch;

                    (_linesToFetch = _this3.linesToFetch).push.apply(_linesToFetch, _toConsumableArray(lines));
                }
                if (lines.length === 1) {
                    var responseLine = _this3.responses.get(lines[0]);
                    if (responseLine) {
                        var oldFrom = oldRange.start.column,
                            newFrom = newRange.start.column;
                        (0, _lodash.remove)(responseLine, function (span) {
                            if (span.StartLine < lines[0]) {
                                return true;
                            }
                            if (span.StartColumn >= oldFrom || span.EndColumn >= oldFrom) {
                                return true;
                            }
                            if (span.StartColumn >= newFrom || span.EndColumn >= newFrom) {
                                return true;
                            }
                            return false;
                        });
                    }
                } else {
                    (0, _lodash.each)(lines, function (line) {
                        _this3.responses.delete(line);
                    });
                }
                if (delta > 0) {
                    var count = editor.getLineCount();
                    for (var i = count - 1; i > end; i--) {
                        if (_this3.responses.has(i)) {
                            _this3.responses.set(i + delta, _this3.responses.get(i));
                            _this3.responses.delete(i);
                        }
                    }
                } else if (delta < 0) {
                    var _count = editor.getLineCount();
                    var absDelta = Math.abs(delta);
                    for (var _i2 = end; _i2 < _count; _i2++) {
                        if (_this3.responses.has(_i2 + absDelta)) {
                            _this3.responses.set(_i2, _this3.responses.get(_i2 + absDelta));
                            _this3.responses.delete(_i2 + absDelta);
                        }
                    }
                }
            });
        }
    }

    _createClass(Grammar, [{
        key: 'setResponses',
        value: function setResponses(value, enableExcludeCode) {
            var _this4 = this;

            var results = (0, _lodash.chain)(value);
            var groupedItems = results.map(function (highlight) {
                return (0, _lodash.range)(highlight.StartLine, highlight.EndLine + 1).map(function (line) {
                    return { line: line, highlight: highlight };
                });
            }).flatten().groupBy(function (z) {
                return z.line;
            }).value();
            (0, _lodash.each)(groupedItems, function (item, key) {
                var k = +key,
                    mappedItem = item.map(function (x) {
                    return x.highlight;
                });
                if (!enableExcludeCode || (0, _lodash.some)(mappedItem, function (i) {
                    return i.Kind === 'preprocessor keyword';
                }) && (0, _lodash.every)(mappedItem, function (i) {
                    return i.Kind === 'excluded code' || i.Kind === 'preprocessor keyword';
                })) {
                    mappedItem = mappedItem.filter(function (z) {
                        return z.Kind !== 'excluded code';
                    });
                }
                if (!_this4.responses.has(k)) {
                    _this4.responses.set(k, mappedItem);
                    _this4.linesToTokenize.push(k);
                } else {
                    var responseLine = _this4.responses.get(k);
                    if (responseLine.length !== mappedItem.length || (0, _lodash.some)(responseLine, function (l, i) {
                        return !(0, _lodash.isEqual)(l, mappedItem[i]);
                    })) {
                        _this4.responses.set(k, mappedItem);
                        _this4.linesToTokenize.push(k);
                    }
                }
            });
        }
    }]);

    return Grammar;
}();

(0, _lodash.extend)(Grammar.prototype, AtomGrammar.prototype);
Grammar.prototype['omnisharp'] = true;
Grammar.prototype['tokenizeLine'] = function (line, ruleStack) {
    var firstLine = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    var baseResult = AtomGrammar.prototype.tokenizeLine.call(this, line, ruleStack, firstLine);
    var tags = void 0;
    if (this.responses) {
        var row = this['__row__'];
        if (!this.responses.has(row)) return baseResult;
        var highlights = this.responses.get(row);
        if (highlights[0] && highlights[0].Kind === 'excluded code') {
            tags = [line.length];
            getAtomStyleForToken(this.name, tags, highlights[0], 0, tags.length - 1, line);
            baseResult.ruleStack = [baseResult.ruleStack[0]];
        } else {
            tags = this.getCsTokensForLine(highlights, line, row, ruleStack, firstLine, baseResult.tags);
        }
        baseResult.tags = tags;
    }
    return baseResult;
};
Grammar.prototype.getCsTokensForLine = function (highlights, line, row, ruleStack, firstLine, tags) {
    var _this5 = this;

    ruleStack = [{ rule: this.getInitialRule() }];
    (0, _lodash.each)(highlights, function (highlight) {
        var start = highlight.StartColumn - 1;
        var end = highlight.EndColumn - 1;
        if (highlight.EndLine > highlight.StartLine && highlight.StartColumn === 0 && highlight.EndColumn === 0) {
            getAtomStyleForToken(_this5.name, tags, highlight, 0, tags.length - 1, line);
            return;
        }
        var distance = -1;
        var index = -1;
        var i = void 0;
        for (i = 0; i < tags.length; i++) {
            if (tags[i] > 0) {
                if (distance + tags[i] > start) {
                    index = i;
                    break;
                }
                distance += tags[i];
            }
        }
        var str = line.substring(start, end);
        var size = end - start;
        if (tags[index] >= size) {
            var values = void 0;
            var prev = void 0,
                next = void 0;
            if (distance === start) {
                values = [size, tags[index] - size];
            } else {
                prev = start - distance;
                next = tags[index] - size - prev;
                if (next > 0) {
                    values = [prev, size, tags[index] - size - prev];
                } else {
                    values = [prev, size];
                }
            }
            tags.splice.apply(tags, [index, 1].concat(_toConsumableArray(values)));
            if (prev) index = index + 1;
            getAtomStyleForToken(_this5.name, tags, highlight, index, index + 1, str);
        } else if (tags[index] < size) {
            var backtrackIndex = index;
            var backtrackDistance = 0;
            for (i = backtrackIndex; i >= 0; i--) {
                if (tags[i] > 0) {
                    if (backtrackDistance >= size) {
                        backtrackIndex = i;
                        break;
                    }
                    backtrackDistance += tags[i];
                } else if (tags[i] % 2 === 0) {
                    if (backtrackDistance >= size) {
                        backtrackIndex = i + 1;
                        break;
                    }
                }
            }
            if (i === -1) {
                backtrackIndex = 0;
            }
            var forwardtrackIndex = index;
            var remainingSize = size;
            for (i = index + 1; i < tags.length; i++) {
                if (remainingSize <= 0 && tags[i] > 0) {
                    forwardtrackIndex = i - 1;
                    break;
                }
                if (tags[i] > 0) {
                    remainingSize -= tags[i];
                } else if (tags[i] % 2 === 0) {
                    var openFound = false;
                    for (var h = i; h >= 0; h--) {
                        if (tags[h] === tags[i] + 1) {
                            openFound = true;
                            break;
                        }
                    }
                    if (!openFound) {
                        forwardtrackIndex = i - 1;
                        break;
                    }
                }
            }
            if (i === tags.length) {
                forwardtrackIndex = tags.length - 1;
            }
            getAtomStyleForToken(_this5.name, tags, highlight, backtrackIndex, forwardtrackIndex, str);
        }
    });
    return tags;
};
var getIdForScope = function () {
    var ids = {};
    var grammars = {};
    function buildScopesForGrammar(grammarName) {
        var grammar = (0, _lodash.find)(atom.grammars.getGrammars(), function (gammr) {
            return gammr.name === grammarName;
        });
        if (!grammar) return;
        ids[grammar.name] = {};
        grammars[grammar.name] = grammar;
        (0, _lodash.each)(grammar.registry.scopesById, function (value, key) {
            ids[grammar.name][value] = +key;
        });
    }
    var method = function method(grammar, scope) {
        if (!ids[grammar]) {
            buildScopesForGrammar(grammar);
        }
        if (!ids[grammar][scope]) ids[grammar][scope] = grammars[grammar].registry.startIdForScope(scope);
        return +ids[grammar][scope];
    };
    method.end = function (scope) {
        return +scope - 1;
    };
    return method;
}();
function getAtomStyleForToken(grammar, tags, token, index, indexEnd, str) {
    var previousScopes = [];
    for (var i = index - 1; i >= 0; i--) {
        if (tags[i] > 0) break;
        previousScopes.push(tags[i]);
    }
    var replacements = [];
    var opens = [];
    var closes = [];

    var _loop = function _loop(_i3) {
        if (tags[_i3] > 0) return 'continue';
        if (tags[_i3] % 2 === 0) {
            var openIndex = (0, _lodash.findIndex)(opens, function (x) {
                return x.tag === tags[_i3] + 1;
            });
            if (openIndex > -1) {
                opens.splice(openIndex, 1);
            } else {
                closes.push({ tag: tags[_i3], index: _i3 });
            }
        } else {
            opens.unshift({ tag: tags[_i3], index: _i3 });
        }
    };

    for (var _i3 = index; _i3 < indexEnd; _i3++) {
        var _ret = _loop(_i3);

        if (_ret === 'continue') continue;
    }
    var unfullfilled = [];
    if (closes.length > 0) {
        unfullfilled = (0, _lodash.sortBy)(opens.concat(closes), function (x) {
            return x.index;
        });
    } else if (opens.length > 0) {
        replacements.unshift({
            start: opens[opens.length - 1].index,
            end: indexEnd,
            replacement: tags.slice(opens[opens.length - 1].index, indexEnd + 1)
        });
    }
    var internalIndex = index;
    for (var _i4 = 0; _i4 < unfullfilled.length; _i4++) {
        var v = unfullfilled[_i4];
        replacements.unshift({
            start: internalIndex,
            end: v.index,
            replacement: tags.slice(internalIndex, v.index)
        });
        internalIndex = v.index + 1;
    }
    if (replacements.length === 0) {
        replacements.unshift({
            start: index,
            end: indexEnd,
            replacement: tags.slice(index, indexEnd)
        });
    } else {}
    function add(scope) {
        var id = getIdForScope(grammar, scope);
        if (id === -1) return;
        if (!(0, _lodash.some)(previousScopes, function (z) {
            return z === id;
        })) {
            previousScopes.push(id);
        }
        (0, _lodash.each)(replacements, function (ctx) {
            var replacement = ctx.replacement;
            replacement.unshift(id);
            replacement.push(getIdForScope.end(id));
        });
    }
    switch (token.Kind) {
        case 'number':
            add('constant.numeric');
            break;
        case 'struct name':
            add('support.constant.numeric.identifier.struct');
            break;
        case 'enum name':
            add('support.constant.numeric.identifier.enum');
            break;
        case 'identifier':
            add('identifier');
            break;
        case 'class name':
            add('support.class.type.identifier');
            break;
        case 'delegate name':
            add('support.class.type.identifier.delegate');
            break;
        case 'interface name':
            add('support.class.type.identifier.interface');
            break;
        case 'preprocessor keyword':
            add('constant.other.symbol');
            break;
        case 'excluded code':
            add('comment.block');
            break;
        case 'unused code':
            add('unused');
            break;
        default:
            console.log('unhandled Kind ' + token.Kind);
            break;
    }
    (0, _lodash.each)(replacements, function (ctx) {
        var replacement = ctx.replacement,
            end = ctx.end,
            start = ctx.start;

        if (replacement.length === 2) return;
        var num = end - start;
        if (num <= 0) {
            num = 1;
        }
        tags.splice.apply(tags, [start, num].concat(_toConsumableArray(replacement)));
    });
}
function setGrammar(grammar) {
    var g2 = getEnhancedGrammar(this, grammar);
    if (g2 !== grammar) this._setGrammar(g2);
    return g2;
}
function getEnhancedGrammar(editor, grammar, options) {
    if (!grammar) grammar = editor.getGrammar();
    if (!grammar['omnisharp'] && _omni.Omni.isValidGrammar(grammar)) {
        var newGrammar = new Grammar(editor, grammar, options);
        (0, _lodash.each)(grammar, function (x, i) {
            if ((0, _lodash.has)(grammar, i)) {
                newGrammar[i] = x;
            }
        });
        grammar = newGrammar;
    }
    return grammar;
}

var UnusedMap = function () {
    function UnusedMap() {
        _classCallCheck(this, UnusedMap);

        this._map = new Map();
    }

    _createClass(UnusedMap, [{
        key: 'get',
        value: function get(key) {
            if (!this._map.has(key)) this._map.set(key, new _rxjs.BehaviorSubject([]));
            return this._map.get(key);
        }
    }, {
        key: '_getObserver',
        value: function _getObserver(key) {
            return this.get(key);
        }
    }, {
        key: 'set',
        value: function set(key, value) {
            var o = this._getObserver(key);
            if (!(0, _lodash.isEqual)(o.getValue(), value)) {
                o.next(value || []);
            }
            return this;
        }
    }, {
        key: 'delete',
        value: function _delete(key) {
            if (this._map.has(key)) this._map.delete(key);
        }
    }, {
        key: 'clear',
        value: function clear() {
            this._map.clear();
        }
    }]);

    return UnusedMap;
}();

var enhancedHighlighting19 = exports.enhancedHighlighting19 = new Highlight();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS50cyJdLCJuYW1lcyI6WyJhdWdtZW50RWRpdG9yIiwiZ2V0RW5oYW5jZWRHcmFtbWFyIiwiQXRvbUdyYW1tYXIiLCJyZXF1aXJlIiwiYXRvbSIsImNvbmZpZyIsInJlc291cmNlUGF0aCIsIkRFQk9VTkNFX1RJTUUiLCJISUdITElHSFQiLCJISUdITElHSFRfUkVRVUVTVCIsImdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyIsInBhdGgiLCJxdWlja0ZpeGVzIiwicHJvamVjdE5hbWVzIiwiZmlsdGVyIiwieCIsIkZpbGVOYW1lIiwibWFwIiwiU3RhcnRMaW5lIiwiTGluZSIsIlN0YXJ0Q29sdW1uIiwiQ29sdW1uIiwiRW5kTGluZSIsIkVuZENvbHVtbiIsIktpbmQiLCJQcm9qZWN0cyIsInZhbHVlIiwiRXhjbHVkZUNsYXNzaWZpY2F0aW9ucyIsIkhpZ2hsaWdodCIsInVudXNlZENvZGVSb3dzIiwiVW51c2VkTWFwIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGVmYXVsdCIsImF0b21WZXJzaW9uIiwibWlub3IiLCJkaXNwb3NhYmxlIiwiZWRpdG9ycyIsImFkZCIsImNvbnRleHQiLCJlZGl0b3IiLCJnZXQiLCJzdGFydFdpdGgiLCJkZWJvdW5jZVRpbWUiLCJzd2l0Y2hNYXAiLCJkZWZlciIsInByb2plY3RzIiwicHJvamVjdCIsImFjdGl2ZUZyYW1ld29yayIsIk5hbWUiLCJsaW5lc1RvRmV0Y2giLCJnZXRHcmFtbWFyIiwibGVuZ3RoIiwiY29tYmluZUxhdGVzdCIsImdldFBhdGgiLCJyZXF1ZXN0Iiwic29sdXRpb24iLCJoaWdobGlnaHQiLCJQcm9qZWN0TmFtZXMiLCJMaW5lcyIsInF1aWNrZml4ZXMiLCJyZXNwb25zZSIsImhpZ2hsaWdodHMiLCJjb25jYXQiLCJIaWdobGlnaHRzIiwiZG8iLCJzZXRSZXNwb25zZXMiLCJwdWJsaXNoUmVwbGF5IiwicmVmQ291bnQiLCJsaXN0ZW5lciIsIm1vZGVsIiwiZGlhZ25vc3RpY3NCeUZpbGUiLCJzdWJzY3JpYmUiLCJjaGFuZ2VzIiwiZmlsZSIsImRpYWdub3N0aWNzIiwic2V0IiwiTG9nTGV2ZWwiLCJlYWNoRWRpdG9yIiwiY2QiLCJzZXR1cEVkaXRvciIsIm9tbmlzaGFycCIsInRva2VuaXplZEJ1ZmZlciIsIm5leHQiLCJzd2l0Y2hBY3RpdmVFZGl0b3IiLCJjcmVhdGUiLCJjbGVhciIsImRpc3Bvc2UiLCJpc3N1ZVJlcXVlc3QiLCJwdXNoIiwicmVzcG9uc2VzIiwicmV0b2tlbml6ZUxpbmVzIiwib25EaWREZXN0cm95Iiwib2JzZXJ2ZSIsIm9uRGlkU3RvcENoYW5naW5nIiwib25EaWRTYXZlIiwid2hlbkNvbm5lY3RlZCIsImRlbGF5IiwiY29tcGxldGUiLCJkb1NldEdyYW1tYXIiLCJzZXRHcmFtbWFyIiwiYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQiLCJtYXJrVG9rZW5pemF0aW9uQ29tcGxldGUiLCJ0b2tlbml6ZUluQmFja2dyb3VuZCIsInJvdyIsImFwcGx5IiwiYXJndW1lbnRzIiwic2lsZW50UmV0b2tlbml6ZUxpbmVzIiwiaXNPYnNlcnZlUmV0b2tlbml6aW5nIiwibGFzdFJvdyIsImJ1ZmZlciIsImdldExhc3RSb3ciLCJ0b2tlbml6ZWRMaW5lcyIsImJ1aWxkUGxhY2Vob2xkZXJUb2tlbml6ZWRMaW5lc0ZvclJvd3MiLCJpbnZhbGlkUm93cyIsImxpbmVzVG9Ub2tlbml6ZSIsImludmFsaWRhdGVSb3ciLCJmdWxseVRva2VuaXplZCIsImxlYWRpbmciLCJ0cmFpbGluZyIsInZpc2libGUiLCJwZW5kaW5nQ2h1bmsiLCJpc0FsaXZlIiwidG9rZW5pemVOZXh0Q2h1bmsiLCJzY29wZXNGcm9tVGFncyIsInN0YXJ0aW5nU2NvcGVzIiwidGFncyIsInNjb3BlcyIsInNsaWNlIiwiZ3JhbW1hciIsImkiLCJsZW4iLCJ0YWciLCJtYXRjaGluZ1N0YXJ0VGFnIiwicG9wIiwic3RhcnRJZEZvclNjb3BlIiwic2NvcGVOYW1lIiwiY29uc29sZSIsImluZm8iLCJmaWxlUGF0aCIsImdyYW1tYXJTY29wZU5hbWUiLCJ1bm1hdGNoZWRFbmRUYWciLCJzY29wZUZvcklkIiwidGFrZSIsInJvd3MiLCJHcmFtbWFyIiwiYmFzZSIsIm9wdGlvbnMiLCJfZ2lkIiwiTWFwIiwicmVhZG9ubHkiLCJnZXRCdWZmZXIiLCJwcmVlbXB0RGlkQ2hhbmdlIiwiZSIsIm9sZFJhbmdlIiwibmV3UmFuZ2UiLCJzdGFydCIsImRlbHRhIiwiZW5kIiwiZ2V0TGluZUNvdW50IiwibGluZXMiLCJrZXlzIiwiZG9uZSIsInJlc3BvbnNlTGluZSIsIm9sZEZyb20iLCJjb2x1bW4iLCJuZXdGcm9tIiwic3BhbiIsImRlbGV0ZSIsImxpbmUiLCJjb3VudCIsImhhcyIsImFic0RlbHRhIiwiTWF0aCIsImFicyIsImVuYWJsZUV4Y2x1ZGVDb2RlIiwicmVzdWx0cyIsImdyb3VwZWRJdGVtcyIsImZsYXR0ZW4iLCJncm91cEJ5IiwieiIsIml0ZW0iLCJrZXkiLCJrIiwibWFwcGVkSXRlbSIsImwiLCJwcm90b3R5cGUiLCJydWxlU3RhY2siLCJmaXJzdExpbmUiLCJiYXNlUmVzdWx0IiwidG9rZW5pemVMaW5lIiwiY2FsbCIsImdldEF0b21TdHlsZUZvclRva2VuIiwibmFtZSIsImdldENzVG9rZW5zRm9yTGluZSIsInJ1bGUiLCJnZXRJbml0aWFsUnVsZSIsImRpc3RhbmNlIiwiaW5kZXgiLCJzdHIiLCJzdWJzdHJpbmciLCJzaXplIiwidmFsdWVzIiwicHJldiIsInNwbGljZSIsImJhY2t0cmFja0luZGV4IiwiYmFja3RyYWNrRGlzdGFuY2UiLCJmb3J3YXJkdHJhY2tJbmRleCIsInJlbWFpbmluZ1NpemUiLCJvcGVuRm91bmQiLCJoIiwiZ2V0SWRGb3JTY29wZSIsImlkcyIsImdyYW1tYXJzIiwiYnVpbGRTY29wZXNGb3JHcmFtbWFyIiwiZ3JhbW1hck5hbWUiLCJnZXRHcmFtbWFycyIsImdhbW1yIiwicmVnaXN0cnkiLCJzY29wZXNCeUlkIiwibWV0aG9kIiwic2NvcGUiLCJ0b2tlbiIsImluZGV4RW5kIiwicHJldmlvdXNTY29wZXMiLCJyZXBsYWNlbWVudHMiLCJvcGVucyIsImNsb3NlcyIsIm9wZW5JbmRleCIsInVuc2hpZnQiLCJ1bmZ1bGxmaWxsZWQiLCJyZXBsYWNlbWVudCIsImludGVybmFsSW5kZXgiLCJ2IiwiaWQiLCJjdHgiLCJsb2ciLCJudW0iLCJnMiIsIl9zZXRHcmFtbWFyIiwiaXNWYWxpZEdyYW1tYXIiLCJuZXdHcmFtbWFyIiwiX21hcCIsIm8iLCJfZ2V0T2JzZXJ2ZXIiLCJnZXRWYWx1ZSIsImVuaGFuY2VkSGlnaGxpZ2h0aW5nMTkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O1FBMEtNQSxhLEdBQUFBLGE7UUF5Z0JBQyxrQixHQUFBQSxrQjs7QUFsckJOOztBQUVBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QUFHQSxJQUFNQyxjQUFjQyxRQUFjQyxLQUFNQyxNQUFOLENBQWFDLFlBQWIsR0FBNEIseUNBQTFDLENBQXBCO0FBRUEsSUFBTUMsZ0JBQWdCLEdBQXRCO0FBRUEsSUFBTUMsWUFBWSxXQUFsQjtBQUFBLElBQ0lDLG9CQUFvQixtQkFEeEI7QUFHQSxTQUFBQywyQkFBQSxDQUFxQ0MsSUFBckMsRUFBbURDLFVBQW5ELEVBQTRGQyxZQUE1RixFQUFrSDtBQUM5RyxXQUFPLG1CQUFNRCxVQUFOLEVBQ0ZFLE1BREUsQ0FDSztBQUFBLGVBQUtDLEVBQUVDLFFBQUYsS0FBZUwsSUFBcEI7QUFBQSxLQURMLEVBRUZNLEdBRkUsQ0FFRTtBQUFBLGVBQU07QUFDUEMsdUJBQVdILEVBQUVJLElBRE47QUFFUEMseUJBQWFMLEVBQUVNLE1BRlI7QUFHUEMscUJBQVNQLEVBQUVPLE9BSEo7QUFJUEMsdUJBQVdSLEVBQUVRLFNBSk47QUFLUEMsa0JBQU0sYUFMQztBQU1QQyxzQkFBVVo7QUFOSCxTQUFOO0FBQUEsS0FGRixFQVVGYSxLQVZFLEVBQVA7QUFXSDtBQUdNLElBQU1DLDBEQUF5QixDQUNsQyxDQURrQyxFQUVsQyxDQUZr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MERBQXlCLElBQUkzTixTQUFKLEVBQS9CIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7Y2hhaW4sIGRlYm91bmNlLCBlYWNoLCBldmVyeSwgZXh0ZW5kLCBmaWx0ZXIsIGZpbmQsIGZpbmRJbmRleCwgaGFzLCBpc0VxdWFsLCBtaW4sIHB1bGwsIHJhbmdlLCByZW1vdmUsIHNvbWUsIHNvcnRCeSwgdW5pcSwgdW5pcXVlSWR9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHtCZWhhdmlvclN1YmplY3QsIE9ic2VydmFibGUsIFJlcGxheVN1YmplY3QsIFN1YmplY3QsIFN1YnNjcmliZXJ9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHtPbW5pfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcbmltcG9ydCB7aXNPbW5pc2hhcnBUZXh0RWRpdG9yLCBJT21uaXNoYXJwVGV4dEVkaXRvcn0gZnJvbSAnLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvcic7XHJcbmltcG9ydCB7cmVnaXN0ZXJDb250ZXh0SXRlbX0gZnJvbSAnLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvcic7XHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuY29uc3QgQXRvbUdyYW1tYXIgPSByZXF1aXJlKCg8YW55PmF0b20pLmNvbmZpZy5yZXNvdXJjZVBhdGggKyAnL25vZGVfbW9kdWxlcy9maXJzdC1tYXRlL2xpYi9ncmFtbWFyLmpzJyk7XHJcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5jb25zdCBERUJPVU5DRV9USU1FID0gMjQwLyoyNDAqLztcclxuXHJcbmNvbnN0IEhJR0hMSUdIVCA9ICdISUdITElHSFQnLFxyXG4gICAgSElHSExJR0hUX1JFUVVFU1QgPSAnSElHSExJR0hUX1JFUVVFU1QnO1xyXG5cclxuZnVuY3Rpb24gZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKHBhdGg6IHN0cmluZywgcXVpY2tGaXhlczogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdLCBwcm9qZWN0TmFtZXM6IHN0cmluZ1tdKSB7XHJcbiAgICByZXR1cm4gY2hhaW4ocXVpY2tGaXhlcylcclxuICAgICAgICAuZmlsdGVyKHggPT4geC5GaWxlTmFtZSA9PT0gcGF0aClcclxuICAgICAgICAubWFwKHggPT4gKHtcclxuICAgICAgICAgICAgU3RhcnRMaW5lOiB4LkxpbmUsXHJcbiAgICAgICAgICAgIFN0YXJ0Q29sdW1uOiB4LkNvbHVtbixcclxuICAgICAgICAgICAgRW5kTGluZTogeC5FbmRMaW5lLFxyXG4gICAgICAgICAgICBFbmRDb2x1bW46IHguRW5kQ29sdW1uLFxyXG4gICAgICAgICAgICBLaW5kOiAndW51c2VkIGNvZGUnLFxyXG4gICAgICAgICAgICBQcm9qZWN0czogcHJvamVjdE5hbWVzXHJcbiAgICAgICAgfSBhcyBNb2RlbHMuSGlnaGxpZ2h0U3BhbikpXHJcbiAgICAgICAgLnZhbHVlKCk7XHJcbn1cclxuXHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuZXhwb3J0IGNvbnN0IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMgPSBbXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uQ29tbWVudCxcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5TdHJpbmcsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uUHVuY3R1YXRpb24sXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uT3BlcmF0b3IsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uS2V5d29yZFxyXG5dO1xyXG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuXHJcbmNsYXNzIEhpZ2hsaWdodCBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgZWRpdG9yczogSU9tbmlzaGFycFRleHRFZGl0b3JbXTtcclxuICAgIHByaXZhdGUgdW51c2VkQ29kZVJvd3MgPSBuZXcgVW51c2VkTWFwKCk7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIGlmICghKE9tbmkuYXRvbVZlcnNpb24ubWlub3IgIT09IDEgfHwgT21uaS5hdG9tVmVyc2lvbi5taW5vciA+IDgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmVkaXRvcnMgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgcmVnaXN0ZXJDb250ZXh0SXRlbShISUdITElHSFRfUkVRVUVTVCwgY29udGV4dCA9PiBuZXcgU3ViamVjdDxib29sZWFuPigpKSxcclxuICAgICAgICAgICAgcmVnaXN0ZXJDb250ZXh0SXRlbShISUdITElHSFQsIChjb250ZXh0LCBlZGl0b3IpID0+XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmdldDxTdWJqZWN0PGJvb2xlYW4+PihISUdITElHSFRfUkVRVUVTVClcclxuICAgICAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKHRydWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDApXHJcbiAgICAgICAgICAgICAgICAgICAgLnN3aXRjaE1hcCgoKSA9PiBPYnNlcnZhYmxlLmRlZmVyKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvamVjdHMgPSBjb250ZXh0LnByb2plY3QuYWN0aXZlRnJhbWV3b3JrLk5hbWUgPT09ICdhbGwnID8gW10gOiBbY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsaW5lc1RvRmV0Y2ggPSB1bmlxPG51bWJlcj4oKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFsaW5lc1RvRmV0Y2ggfHwgIWxpbmVzVG9GZXRjaC5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lc1RvRmV0Y2ggPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmhpZ2hsaWdodCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvamVjdE5hbWVzOiBwcm9qZWN0cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMaW5lczogbGluZXNUb0ZldGNoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChxdWlja2ZpeGVzLCByZXNwb25zZSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0czogZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKGVkaXRvci5nZXRQYXRoKCksIHF1aWNrZml4ZXMsIHByb2plY3RzKS5jb25jYXQocmVzcG9uc2UgPyByZXNwb25zZS5IaWdobGlnaHRzIDogW10pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5kbygoe2hpZ2hsaWdodHN9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnNldFJlc3BvbnNlcyhoaWdobGlnaHRzLCBwcm9qZWN0cy5sZW5ndGggPiAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZWZDb3VudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKSksXHJcbiAgICAgICAgICAgIE9tbmkubGlzdGVuZXIubW9kZWwuZGlhZ25vc3RpY3NCeUZpbGVcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoY2hhbmdlcyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBbZmlsZSwgZGlhZ25vc3RpY3NdIG9mIGNoYW5nZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5zZXQoZmlsZSwgZmlsdGVyKGRpYWdub3N0aWNzLCB4ID0+IHguTG9nTGV2ZWwgPT09ICdIaWRkZW4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIE9tbmkuZWFjaEVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXR1cEVkaXRvcihlZGl0b3IsIGNkKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9tbmlzaGFycFxyXG4gICAgICAgICAgICAgICAgICAgIC5nZXQ8T2JzZXJ2YWJsZTx7IGVkaXRvcjogSU9tbmlzaGFycFRleHRFZGl0b3I7IGhpZ2hsaWdodHM6IE1vZGVscy5IaWdobGlnaHRTcGFuW107IHByb2plY3RzOiBzdHJpbmdbXSB9Pj4oSElHSExJR0hUKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyWydzaWxlbnRSZXRva2VuaXplTGluZXMnXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKS5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKS5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbJ3NpbGVudFJldG9rZW5pemVMaW5lcyddKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlclsnc2lsZW50UmV0b2tlbml6ZUxpbmVzJ10oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MuY2xlYXIoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cEVkaXRvcihlZGl0b3I6IElPbW5pc2hhcnBUZXh0RWRpdG9yLCBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgaWYgKGVkaXRvclsnX29sZEdyYW1tYXInXSB8fCAhZWRpdG9yLmdldEdyYW1tYXIpIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgaXNzdWVSZXF1ZXN0ID0gZWRpdG9yLm9tbmlzaGFycC5nZXQ8U3ViamVjdDxib29sZWFuPj4oSElHSExJR0hUX1JFUVVFU1QpO1xyXG5cclxuICAgICAgICBhdWdtZW50RWRpdG9yKGVkaXRvciwgdGhpcy51bnVzZWRDb2RlUm93cywgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHRoaXMuZWRpdG9ycy5wdXNoKGVkaXRvcik7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNwb3NhYmxlKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcykgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkucmVzcG9uc2VzLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzKCk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBlZGl0b3JbJ19vbGRHcmFtbWFyJ107XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgICAgICBwdWxsKHRoaXMuZWRpdG9ycywgZWRpdG9yKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbW5pc2hhcnAucHJvamVjdFxyXG4gICAgICAgICAgICAub2JzZXJ2ZS5hY3RpdmVGcmFtZXdvcmtcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICAgICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMpICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcy5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKCgpID0+IGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpKSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFNhdmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uXHJcbiAgICAgICAgICAgIC53aGVuQ29ubmVjdGVkKClcclxuICAgICAgICAgICAgLmRlbGF5KDEwMDApXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gJ0VuaGFuY2VkIEhpZ2hsaWdodGluZyc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnRW5hYmxlcyBzZXJ2ZXIgYmFzZWQgaGlnaGxpZ2h0aW5nLCB3aGljaCBpbmNsdWRlcyBzdXBwb3J0IGZvciBzdHJpbmcgaW50ZXJwb2xhdGlvbiwgY2xhc3MgbmFtZXMgYW5kIG1vcmUuJztcclxuICAgIHB1YmxpYyBkZWZhdWx0ID0gZmFsc2U7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhdWdtZW50RWRpdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCB1bnVzZWRDb2RlUm93czogVW51c2VkTWFwID0gbnVsbCwgZG9TZXRHcmFtbWFyID0gZmFsc2UpIHtcclxuICAgIGlmICghZWRpdG9yWydfb2xkR3JhbW1hciddKVxyXG4gICAgICAgIGVkaXRvclsnX29sZEdyYW1tYXInXSA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XHJcbiAgICBpZiAoIWVkaXRvclsnX3NldEdyYW1tYXInXSlcclxuICAgICAgICBlZGl0b3JbJ19zZXRHcmFtbWFyJ10gPSBlZGl0b3Iuc2V0R3JhbW1hcjtcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlclsnX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0J10pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlclsnX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0J10gPSAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0O1xyXG4gICAgaWYgKCEoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyWydfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlJ10pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlclsnX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZSddID0gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGU7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbJ19yZXRva2VuaXplTGluZXMnXSlcclxuICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyWydfcmV0b2tlbml6ZUxpbmVzJ10gPSAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcztcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlclsnX3Rva2VuaXplSW5CYWNrZ3JvdW5kJ10pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlclsnX3Rva2VuaXplSW5CYWNrZ3JvdW5kJ10gPSAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyLnRva2VuaXplSW5CYWNrZ3JvdW5kO1xyXG4gICAgaWYgKCEoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyWydfY2h1bmtTaXplJ10pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlclsnY2h1bmtTaXplJ10gPSAyMDtcclxuXHJcbiAgICBlZGl0b3Iuc2V0R3JhbW1hciA9IHNldEdyYW1tYXI7XHJcbiAgICBpZiAoZG9TZXRHcmFtbWFyKSBlZGl0b3Iuc2V0R3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKTtcclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dCA9IGZ1bmN0aW9uIChyb3c6IG51bWJlcikge1xyXG4gICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpWydfX3Jvd19fJ10gPSByb3c7XHJcbiAgICAgICAgcmV0dXJuIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbJ19idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dCddLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICghKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikuc2lsZW50UmV0b2tlbml6ZUxpbmVzKSB7XHJcbiAgICAgICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikuc2lsZW50UmV0b2tlbml6ZUxpbmVzID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxyXG4gICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xyXG4gICAgICAgICAgICBsZXQgbGFzdFJvdzogbnVtYmVyO1xyXG4gICAgICAgICAgICBsYXN0Um93ID0gdGhpcy5idWZmZXIuZ2V0TGFzdFJvdygpO1xyXG4gICAgICAgICAgICB0aGlzLnRva2VuaXplZExpbmVzID0gdGhpcy5idWlsZFBsYWNlaG9sZGVyVG9rZW5pemVkTGluZXNGb3JSb3dzKDAsIGxhc3RSb3cpO1xyXG4gICAgICAgICAgICB0aGlzLmludmFsaWRSb3dzID0gW107XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxpbmVzVG9Ub2tlbml6ZSAmJiB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZVJvdyhtaW4odGhpcy5saW5lc1RvVG9rZW5pemUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZVJvdygwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmZ1bGx5VG9rZW5pemVkID0gZmFsc2U7XHJcbiAgICAgICAgfSwgREVCT1VOQ0VfVElNRSwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgcmV0dXJuIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbJ19tYXJrVG9rZW5pemF0aW9uQ29tcGxldGUnXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5yZXRva2VuaXplTGluZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xyXG4gICAgICAgIHJldHVybiAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyWydfcmV0b2tlbml6ZUxpbmVzJ10uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIH07XHJcblxyXG4gICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikudG9rZW5pemVJbkJhY2tncm91bmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnZpc2libGUgfHwgdGhpcy5wZW5kaW5nQ2h1bmsgfHwgIXRoaXMuaXNBbGl2ZSgpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5wZW5kaW5nQ2h1bmsgPSBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBbGl2ZSgpICYmIHRoaXMuYnVmZmVyLmlzQWxpdmUoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50b2tlbml6ZU5leHRDaHVuaygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLnNjb3Blc0Zyb21UYWdzID0gZnVuY3Rpb24gKHN0YXJ0aW5nU2NvcGVzOiBudW1iZXJbXSwgdGFnczogbnVtYmVyW10pIHtcclxuICAgICAgICBjb25zdCBzY29wZXMgPSBzdGFydGluZ1Njb3Blcy5zbGljZSgpO1xyXG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGFncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCB0YWcgPSB0YWdzW2ldO1xyXG4gICAgICAgICAgICBpZiAodGFnIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCh0YWcgJSAyKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBzY29wZXMucHVzaCh0YWcpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGluZ1N0YXJ0VGFnID0gdGFnICsgMTtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGVzLnBvcCgpID09PSBtYXRjaGluZ1N0YXJ0VGFnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFjayB0byBlbnN1cmUgdGhhdCBhbGwgbGluZXMgYWx3YXlzIGdldCB0aGUgcHJvcGVyIHNvdXJjZSBsaW5lcy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3Blcy5wdXNoKDxhbnk+Z3JhbW1hci5zdGFydElkRm9yU2NvcGUoYC4ke2dyYW1tYXIuc2NvcGVOYW1lfWApKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnRW5jb3VudGVyZWQgYW4gdW5tYXRjaGVkIHNjb3BlIGVuZCB0YWcuJywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBlZGl0b3IuYnVmZmVyLmdldFBhdGgoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFtbWFyU2NvcGVOYW1lOiBncmFtbWFyLnNjb3BlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5tYXRjaGVkRW5kVGFnOiBncmFtbWFyLnNjb3BlRm9ySWQodGFnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5zZXRSZXNwb25zZXMoW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVudXNlZENvZGVSb3dzICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW51c2VkQ29kZVJvd3MuZ2V0KGVkaXRvci5nZXRQYXRoKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocm93cyA9PiAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFJlc3BvbnNlcyhnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMoZWRpdG9yLmdldFBhdGgoKSwgcm93cywgW10pKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2NvcGVzO1xyXG4gICAgfTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElIaWdobGlnaHRpbmdHcmFtbWFyIGV4dGVuZHMgRmlyc3RNYXRlLkdyYW1tYXIge1xyXG4gICAgaXNPYnNlcnZlUmV0b2tlbml6aW5nOiBTdWJqZWN0PGJvb2xlYW4+O1xyXG4gICAgbGluZXNUb0ZldGNoOiBudW1iZXJbXTtcclxuICAgIGxpbmVzVG9Ub2tlbml6ZTogbnVtYmVyW107XHJcbiAgICByZXNwb25zZXM6IE1hcDxudW1iZXIsIE1vZGVscy5IaWdobGlnaHRTcGFuW10+O1xyXG4gICAgZnVsbHlUb2tlbml6ZWQ6IGJvb2xlYW47XHJcbiAgICBzY29wZU5hbWU6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgR3JhbW1hciB7XHJcbiAgICBwdWJsaWMgaXNPYnNlcnZlUmV0b2tlbml6aW5nOiBSZXBsYXlTdWJqZWN0PGJvb2xlYW4+O1xyXG4gICAgcHVibGljIGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yO1xyXG4gICAgcHVibGljIGxpbmVzVG9GZXRjaDogYW55W107XHJcbiAgICBwdWJsaWMgbGluZXNUb1Rva2VuaXplOiBhbnlbXTtcclxuICAgIHB1YmxpYyBhY3RpdmVGcmFtZXdvcms6IGFueTtcclxuICAgIHB1YmxpYyByZXNwb25zZXM6IE1hcDxudW1iZXIsIE1vZGVscy5IaWdobGlnaHRTcGFuW10+O1xyXG4gICAgcHVibGljIF9naWQgPSB1bmlxdWVJZCgnb2cnKTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgYmFzZTogRmlyc3RNYXRlLkdyYW1tYXIsIG9wdGlvbnM6IHsgcmVhZG9ubHk6IGJvb2xlYW4gfSkge1xyXG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nID0gbmV3IFJlcGxheVN1YmplY3Q8Ym9vbGVhbj4oMSk7XHJcbiAgICAgICAgdGhpcy5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dCh0cnVlKTtcclxuXHJcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XHJcbiAgICAgICAgdGhpcy5yZXNwb25zZXMgPSBuZXcgTWFwPG51bWJlciwgTW9kZWxzLkhpZ2hsaWdodFNwYW5bXT4oKTtcclxuICAgICAgICB0aGlzLmxpbmVzVG9GZXRjaCA9IFtdO1xyXG4gICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplID0gW107XHJcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB7fTtcclxuXHJcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnJlYWRvbmx5KSB7XHJcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5wcmVlbXB0RGlkQ2hhbmdlKChlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHtvbGRSYW5nZSwgbmV3UmFuZ2V9ID0gZTtcclxuICAgICAgICAgICAgICAgIGxldCBzdGFydDogbnVtYmVyID0gb2xkUmFuZ2Uuc3RhcnQucm93LFxyXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhOiBudW1iZXIgPSBuZXdSYW5nZS5lbmQucm93IC0gb2xkUmFuZ2UuZW5kLnJvdztcclxuXHJcbiAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0IC0gNTtcclxuICAgICAgICAgICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSBlZGl0b3IuYnVmZmVyLmdldExpbmVDb3VudCgpIC0gMTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9IHJhbmdlKHN0YXJ0LCBlbmQgKyAxKTtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMua2V5cygpLm5leHQoKS5kb25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2gucHVzaCguLi5saW5lcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChsaW5lc1swXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRGcm9tID0gb2xkUmFuZ2Uuc3RhcnQuY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RnJvbSA9IG5ld1JhbmdlLnN0YXJ0LmNvbHVtbjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZShyZXNwb25zZUxpbmUsIChzcGFuOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRMaW5lIDwgbGluZXNbMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG9sZEZyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gb2xkRnJvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gbmV3RnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBuZXdGcm9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWFjaChsaW5lcywgbGluZSA9PiB7IHRoaXMucmVzcG9uc2VzLmRlbGV0ZShsaW5lKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRlbHRhID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5ldyBsaW5lXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGNvdW50IC0gMTsgaSA+IGVuZDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlc3BvbnNlcy5oYXMoaSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpICsgZGVsdGEsIHRoaXMucmVzcG9uc2VzLmdldChpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5kZWxldGUoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlbHRhIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZWQgbGluZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gZWRpdG9yLmdldExpbmVDb3VudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFic0RlbHRhID0gTWF0aC5hYnMoZGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBlbmQ7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlc3BvbnNlcy5oYXMoaSArIGFic0RlbHRhKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGksIHRoaXMucmVzcG9uc2VzLmdldChpICsgYWJzRGVsdGEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLmRlbGV0ZShpICsgYWJzRGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFJlc3BvbnNlcyh2YWx1ZTogTW9kZWxzLkhpZ2hsaWdodFNwYW5bXSwgZW5hYmxlRXhjbHVkZUNvZGU6IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCByZXN1bHRzID0gY2hhaW4odmFsdWUpO1xyXG5cclxuICAgICAgICBjb25zdCBncm91cGVkSXRlbXMgPSA8YW55PnJlc3VsdHMubWFwKGhpZ2hsaWdodCA9PiByYW5nZShoaWdobGlnaHQuU3RhcnRMaW5lLCBoaWdobGlnaHQuRW5kTGluZSArIDEpXHJcbiAgICAgICAgICAgIC5tYXAobGluZSA9PiAoeyBsaW5lLCBoaWdobGlnaHQgfSkpKVxyXG4gICAgICAgICAgICAuZmxhdHRlbjx7IGxpbmU6IG51bWJlcjsgaGlnaGxpZ2h0OiBNb2RlbHMuSGlnaGxpZ2h0U3BhbiB9PigpXHJcbiAgICAgICAgICAgIC5ncm91cEJ5KHogPT4gei5saW5lKVxyXG4gICAgICAgICAgICAudmFsdWUoKTtcclxuXHJcbiAgICAgICAgZWFjaChncm91cGVkSXRlbXMsIChpdGVtOiB7IGhpZ2hsaWdodDogTW9kZWxzLkhpZ2hsaWdodFNwYW4gfVtdLCBrZXk6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBsZXQgayA9ICtrZXksIG1hcHBlZEl0ZW0gPSBpdGVtLm1hcCh4ID0+IHguaGlnaGxpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZW5hYmxlRXhjbHVkZUNvZGUgfHwgc29tZShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gJ3ByZXByb2Nlc3NvciBrZXl3b3JkJykgJiYgZXZlcnkobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09ICdleGNsdWRlZCBjb2RlJyB8fCBpLktpbmQgPT09ICdwcmVwcm9jZXNzb3Iga2V5d29yZCcpKSB7XHJcbiAgICAgICAgICAgICAgICBtYXBwZWRJdGVtID0gbWFwcGVkSXRlbS5maWx0ZXIoeiA9PiB6LktpbmQgIT09ICdleGNsdWRlZCBjb2RlJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMuaGFzKGspKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGspO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZS5sZW5ndGggIT09IG1hcHBlZEl0ZW0ubGVuZ3RoIHx8IHNvbWUocmVzcG9uc2VMaW5lLCAobCwgaSkgPT4gIWlzRXF1YWwobCwgbWFwcGVkSXRlbVtpXSkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplLnB1c2goayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbi8qIHRzbGludDpkaXNhYmxlOm1lbWJlci1hY2Nlc3MgKi9cclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5leHRlbmQoR3JhbW1hci5wcm90b3R5cGUsIEF0b21HcmFtbWFyLnByb3RvdHlwZSk7XHJcblxyXG5HcmFtbWFyLnByb3RvdHlwZVsnb21uaXNoYXJwJ10gPSB0cnVlO1xyXG5HcmFtbWFyLnByb3RvdHlwZVsndG9rZW5pemVMaW5lJ10gPSBmdW5jdGlvbiAobGluZTogc3RyaW5nLCBydWxlU3RhY2s6IGFueVtdLCBmaXJzdExpbmUgPSBmYWxzZSk6IHsgdGFnczogbnVtYmVyW107IHJ1bGVTdGFjazogYW55IH0ge1xyXG4gICAgY29uc3QgYmFzZVJlc3VsdCA9IEF0b21HcmFtbWFyLnByb3RvdHlwZS50b2tlbml6ZUxpbmUuY2FsbCh0aGlzLCBsaW5lLCBydWxlU3RhY2ssIGZpcnN0TGluZSk7XHJcbiAgICBsZXQgdGFnczogYW55W107XHJcblxyXG4gICAgaWYgKHRoaXMucmVzcG9uc2VzKSB7XHJcbiAgICAgICAgY29uc3Qgcm93ID0gdGhpc1snX19yb3dfXyddO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmhhcyhyb3cpKSByZXR1cm4gYmFzZVJlc3VsdDtcclxuXHJcbiAgICAgICAgY29uc3QgaGlnaGxpZ2h0cyA9IHRoaXMucmVzcG9uc2VzLmdldChyb3cpO1xyXG4gICAgICAgIC8vIEV4Y2x1ZGVkIGNvZGUgYmxvd3MgYXdheSBhbnkgb3RoZXIgZm9ybWF0dGluZywgb3RoZXJ3aXNlIHdlIGdldCBpbnRvIGEgdmVyeSB3ZWlyZCBzdGF0ZS5cclxuICAgICAgICBpZiAoaGlnaGxpZ2h0c1swXSAmJiBoaWdobGlnaHRzWzBdLktpbmQgPT09ICdleGNsdWRlZCBjb2RlJykge1xyXG4gICAgICAgICAgICB0YWdzID0gW2xpbmUubGVuZ3RoXTtcclxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHRzWzBdLCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xyXG4gICAgICAgICAgICBiYXNlUmVzdWx0LnJ1bGVTdGFjayA9IFtiYXNlUmVzdWx0LnJ1bGVTdGFja1swXV07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGFncyA9IHRoaXMuZ2V0Q3NUb2tlbnNGb3JMaW5lKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIGJhc2VSZXN1bHQudGFncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJhc2VSZXN1bHQudGFncyA9IHRhZ3M7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYmFzZVJlc3VsdDtcclxufTtcclxuXHJcbihHcmFtbWFyLnByb3RvdHlwZSBhcyBhbnkpLmdldENzVG9rZW5zRm9yTGluZSA9IGZ1bmN0aW9uIChoaWdobGlnaHRzOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdLCBsaW5lOiBzdHJpbmcsIHJvdzogbnVtYmVyLCBydWxlU3RhY2s6IGFueVtdLCBmaXJzdExpbmU6IGJvb2xlYW4sIHRhZ3M6IG51bWJlcltdKSB7XHJcbiAgICBydWxlU3RhY2sgPSBbeyBydWxlOiB0aGlzLmdldEluaXRpYWxSdWxlKCkgfV07XHJcblxyXG4gICAgZWFjaChoaWdobGlnaHRzLCBoaWdobGlnaHQgPT4ge1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uIC0gMTtcclxuICAgICAgICBjb25zdCBlbmQgPSBoaWdobGlnaHQuRW5kQ29sdW1uIC0gMTtcclxuXHJcbiAgICAgICAgaWYgKGhpZ2hsaWdodC5FbmRMaW5lID4gaGlnaGxpZ2h0LlN0YXJ0TGluZSAmJiBoaWdobGlnaHQuU3RhcnRDb2x1bW4gPT09IDAgJiYgaGlnaGxpZ2h0LkVuZENvbHVtbiA9PT0gMCkge1xyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgMCwgdGFncy5sZW5ndGggLSAxLCBsaW5lKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGRpc3RhbmNlID0gLTE7XHJcbiAgICAgICAgbGV0IGluZGV4ID0gLTE7XHJcbiAgICAgICAgbGV0IGk6IG51bWJlcjtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcclxuICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSArIHRhZ3NbaV0gPiBzdGFydCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRpc3RhbmNlICs9IHRhZ3NbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN0ciA9IGxpbmUuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpO1xyXG4gICAgICAgIGNvbnN0IHNpemUgPSBlbmQgLSBzdGFydDtcclxuICAgICAgICBpZiAodGFnc1tpbmRleF0gPj0gc2l6ZSkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWVzOiBudW1iZXJbXTtcclxuICAgICAgICAgICAgbGV0IHByZXY6IG51bWJlciwgbmV4dDogbnVtYmVyO1xyXG4gICAgICAgICAgICBpZiAoZGlzdGFuY2UgPT09IHN0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbc2l6ZSwgdGFnc1tpbmRleF0gLSBzaXplXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHByZXYgPSBzdGFydCAtIGRpc3RhbmNlO1xyXG4gICAgICAgICAgICAgICAgbmV4dCA9IHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXY7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV4dCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbcHJldiwgc2l6ZSwgdGFnc1tpbmRleF0gLSBzaXplIC0gcHJldl07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0YWdzLnNwbGljZShpbmRleCwgMSwgLi4udmFsdWVzKTtcclxuICAgICAgICAgICAgaWYgKHByZXYpIGluZGV4ID0gaW5kZXggKyAxO1xyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgaW5kZXgsIGluZGV4ICsgMSwgc3RyKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRhZ3NbaW5kZXhdIDwgc2l6ZSkge1xyXG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgbGV0IGJhY2t0cmFja0Rpc3RhbmNlID0gMDtcclxuICAgICAgICAgICAgZm9yIChpID0gYmFja3RyYWNrSW5kZXg7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYmFja3RyYWNrRGlzdGFuY2UgPj0gc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tEaXN0YW5jZSArPSB0YWdzW2ldO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrdHJhY2tEaXN0YW5jZSA+PSBzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBmb3J3YXJkdHJhY2tJbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICBsZXQgcmVtYWluaW5nU2l6ZSA9IHNpemU7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IGluZGV4ICsgMTsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICgocmVtYWluaW5nU2l6ZSA8PSAwICYmIHRhZ3NbaV0gPiAwKS8qIHx8IHRhZ3NbaV0gJSAyID09PSAtMSovKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NpemUgLT0gdGFnc1tpXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBIYW5kbGVzIGNhc2Ugd2hlcmUgdGhlcmUgaXMgYSBjbG9zaW5nIHRhZ1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGJ1dCBubyBvcGVuaW5nIHRhZyBoZXJlLlxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBvcGVuRm91bmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBoID0gaTsgaCA+PSAwOyBoLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhZ3NbaF0gPT09IHRhZ3NbaV0gKyAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvcGVuRm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA9PT0gdGFncy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gdGFncy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgYmFja3RyYWNrSW5kZXgsIGZvcndhcmR0cmFja0luZGV4LCBzdHIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB0YWdzO1xyXG59O1xyXG5cclxuY29uc3QgZ2V0SWRGb3JTY29wZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBpZHM6IHsgW2tleTogc3RyaW5nXTogeyBba2V5OiBzdHJpbmddOiBudW1iZXIgfTsgfSA9IHt9O1xyXG4gICAgY29uc3QgZ3JhbW1hcnM6IGFueSA9IHt9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyTmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9IGZpbmQoYXRvbS5ncmFtbWFycy5nZXRHcmFtbWFycygpLCBnYW1tciA9PiBnYW1tci5uYW1lID09PSBncmFtbWFyTmFtZSk7XHJcbiAgICAgICAgaWYgKCFncmFtbWFyKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlkc1tncmFtbWFyLm5hbWVdID0ge307XHJcbiAgICAgICAgZ3JhbW1hcnNbZ3JhbW1hci5uYW1lXSA9IGdyYW1tYXI7XHJcblxyXG4gICAgICAgIGVhY2goZ3JhbW1hci5yZWdpc3RyeS5zY29wZXNCeUlkLCAodmFsdWU6IHN0cmluZywga2V5OiBhbnkpID0+IHsgaWRzW2dyYW1tYXIubmFtZV1bdmFsdWVdID0gK2tleTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWV0aG9kID0gKGdyYW1tYXI6IHN0cmluZywgc2NvcGU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIGlmICghaWRzW2dyYW1tYXJdKSB7XHJcbiAgICAgICAgICAgIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaWRzW2dyYW1tYXJdW3Njb3BlXSlcclxuICAgICAgICAgICAgaWRzW2dyYW1tYXJdW3Njb3BlXSA9IGdyYW1tYXJzW2dyYW1tYXJdLnJlZ2lzdHJ5LnN0YXJ0SWRGb3JTY29wZShzY29wZSk7XHJcblxyXG4gICAgICAgIHJldHVybiAraWRzW2dyYW1tYXJdW3Njb3BlXTtcclxuICAgIH07XHJcblxyXG4gICAgKDxhbnk+bWV0aG9kKS5lbmQgPSAoc2NvcGU6IG51bWJlcikgPT4gK3Njb3BlIC0gMTtcclxuXHJcbiAgICByZXR1cm4gPHsgKGdyYW1tYXI6IHN0cmluZywgc2NvcGU6IHN0cmluZyk6IG51bWJlcjsgZW5kOiAoc2NvcGU6IG51bWJlcikgPT4gbnVtYmVyOyB9Pm1ldGhvZDtcclxufSkoKTtcclxuXHJcblxyXG4vLy8gTk9URTogYmVzdCB3YXkgSSBoYXZlIGZvdW5kIGZvciB0aGVzZSBpcyB0byBqdXN0IGxvb2sgYXQgdGhlbWUgXCJsZXNzXCIgZmlsZXNcclxuLy8gQWx0ZXJuYXRpdmVseSBqdXN0IGluc3BlY3QgdGhlIHRva2VuIGZvciBhIC5qcyBmaWxlXHJcbmZ1bmN0aW9uIGdldEF0b21TdHlsZUZvclRva2VuKGdyYW1tYXI6IHN0cmluZywgdGFnczogbnVtYmVyW10sIHRva2VuOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbiwgaW5kZXg6IG51bWJlciwgaW5kZXhFbmQ6IG51bWJlciwgc3RyOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHByZXZpb3VzU2NvcGVzOiBhbnlbXSA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IGluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICBpZiAodGFnc1tpXSA+IDApXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2godGFnc1tpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVwbGFjZW1lbnRzOiB7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyOyByZXBsYWNlbWVudDogbnVtYmVyW10gfVtdID0gW107XHJcbiAgICBjb25zdCBvcGVuczogeyB0YWc6IG51bWJlcjsgaW5kZXg6IG51bWJlciB9W10gPSBbXTtcclxuICAgIGNvbnN0IGNsb3NlczogdHlwZW9mIG9wZW5zID0gW107XHJcblxyXG4gICAgLy8gU2NhbiBmb3IgYW55IHVuY2xvc2VkIG9yIHVub3BlbmVkIHRhZ3NcclxuICAgIGZvciAobGV0IGkgPSBpbmRleDsgaSA8IGluZGV4RW5kOyBpKyspIHtcclxuICAgICAgICBpZiAodGFnc1tpXSA+IDApIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBvcGVuSW5kZXggPSBmaW5kSW5kZXgob3BlbnMsIHggPT4geC50YWcgPT09ICh0YWdzW2ldICsgMSkpO1xyXG4gICAgICAgICAgICBpZiAob3BlbkluZGV4ID4gLTEpIHtcclxuICAgICAgICAgICAgICAgIG9wZW5zLnNwbGljZShvcGVuSW5kZXgsIDEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY2xvc2VzLnB1c2goeyB0YWc6IHRhZ3NbaV0sIGluZGV4OiBpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgb3BlbnMudW5zaGlmdCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCB1bmZ1bGxmaWxsZWQ6IHR5cGVvZiBvcGVucyA9IFtdO1xyXG4gICAgaWYgKGNsb3Nlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdW5mdWxsZmlsbGVkID0gc29ydEJ5KG9wZW5zLmNvbmNhdChjbG9zZXMpLCB4ID0+IHguaW5kZXgpO1xyXG4gICAgfSBlbHNlIGlmIChvcGVucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgLy8gR3JhYiB0aGUgbGFzdCBrbm93biBvcGVuLCBhbmQgYXBwZW5kIGZyb20gdGhlcmVcclxuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBvcGVuc1tvcGVucy5sZW5ndGggLSAxXS5pbmRleCxcclxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2Uob3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsIGluZGV4RW5kICsgMSlcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgaW50ZXJuYWxJbmRleCA9IGluZGV4O1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmZ1bGxmaWxsZWQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCB2ID0gdW5mdWxsZmlsbGVkW2ldO1xyXG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogdi5pbmRleCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW50ZXJuYWxJbmRleCwgdi5pbmRleClcclxuICAgICAgICB9KTtcclxuICAgICAgICBpbnRlcm5hbEluZGV4ID0gdi5pbmRleCArIDE7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlcGxhY2VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBpbmRleCxcclxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW5kZXgsIGluZGV4RW5kKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvKnJlcGxhY2VtZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGludGVybmFsSW5kZXgsIGluZGV4RW5kKVxyXG4gICAgICAgIH0pOyovXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkKHNjb3BlOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBpZCA9IGdldElkRm9yU2NvcGUoZ3JhbW1hciwgc2NvcGUpO1xyXG4gICAgICAgIGlmIChpZCA9PT0gLTEpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKCFzb21lKHByZXZpb3VzU2NvcGVzLCB6ID0+IHogPT09IGlkKSkge1xyXG4gICAgICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKGlkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gY3R4LnJlcGxhY2VtZW50O1xyXG4gICAgICAgICAgICByZXBsYWNlbWVudC51bnNoaWZ0KGlkKTtcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQucHVzaChnZXRJZEZvclNjb3BlLmVuZChpZCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgc3dpdGNoICh0b2tlbi5LaW5kKSB7XHJcbiAgICAgICAgY2FzZSAnbnVtYmVyJzpcclxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5udW1lcmljYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ3N0cnVjdCBuYW1lJzpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNvbnN0YW50Lm51bWVyaWMuaWRlbnRpZmllci5zdHJ1Y3RgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnZW51bSBuYW1lJzpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNvbnN0YW50Lm51bWVyaWMuaWRlbnRpZmllci5lbnVtYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2lkZW50aWZpZXInOlxyXG4gICAgICAgICAgICBhZGQoYGlkZW50aWZpZXJgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnY2xhc3MgbmFtZSc6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXJgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnZGVsZWdhdGUgbmFtZSc6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXIuZGVsZWdhdGVgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnaW50ZXJmYWNlIG5hbWUnOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmludGVyZmFjZWApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdwcmVwcm9jZXNzb3Iga2V5d29yZCc6XHJcbiAgICAgICAgICAgIGFkZChgY29uc3RhbnQub3RoZXIuc3ltYm9sYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2V4Y2x1ZGVkIGNvZGUnOlxyXG4gICAgICAgICAgICBhZGQoYGNvbW1lbnQuYmxvY2tgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAndW51c2VkIGNvZGUnOlxyXG4gICAgICAgICAgICBhZGQoYHVudXNlZGApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygndW5oYW5kbGVkIEtpbmQgJyArIHRva2VuLktpbmQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuXHJcbiAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcclxuICAgICAgICBjb25zdCB7cmVwbGFjZW1lbnQsIGVuZCwgc3RhcnR9ID0gY3R4O1xyXG4gICAgICAgIGlmIChyZXBsYWNlbWVudC5sZW5ndGggPT09IDIpIHJldHVybjtcclxuICAgICAgICBsZXQgbnVtID0gZW5kIC0gc3RhcnQ7XHJcbiAgICAgICAgaWYgKG51bSA8PSAwKSB7XHJcbiAgICAgICAgICAgIG51bSA9IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRhZ3Muc3BsaWNlKHN0YXJ0LCBudW0sIC4uLnJlcGxhY2VtZW50KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRHcmFtbWFyKGdyYW1tYXI6IEZpcnN0TWF0ZS5HcmFtbWFyKTogRmlyc3RNYXRlLkdyYW1tYXIge1xyXG4gICAgY29uc3QgZzIgPSBnZXRFbmhhbmNlZEdyYW1tYXIodGhpcywgZ3JhbW1hcik7XHJcbiAgICBpZiAoZzIgIT09IGdyYW1tYXIpXHJcbiAgICAgICAgdGhpcy5fc2V0R3JhbW1hcihnMik7XHJcbiAgICByZXR1cm4gZzI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRFbmhhbmNlZEdyYW1tYXIoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGdyYW1tYXI/OiBGaXJzdE1hdGUuR3JhbW1hciwgb3B0aW9ucz86IHsgcmVhZG9ubHk6IGJvb2xlYW4gfSkge1xyXG4gICAgaWYgKCFncmFtbWFyKSBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcclxuICAgIGlmICghZ3JhbW1hclsnb21uaXNoYXJwJ10gJiYgT21uaS5pc1ZhbGlkR3JhbW1hcihncmFtbWFyKSkge1xyXG4gICAgICAgIGNvbnN0IG5ld0dyYW1tYXIgPSBuZXcgR3JhbW1hcihlZGl0b3IsIGdyYW1tYXIsIG9wdGlvbnMpO1xyXG4gICAgICAgIGVhY2goZ3JhbW1hciwgKHgsIGkpID0+IHtcclxuICAgICAgICAgICAgaWYgKGhhcyhncmFtbWFyLCBpKSkge1xyXG4gICAgICAgICAgICAgICAgbmV3R3JhbW1hcltpXSA9IHg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBncmFtbWFyID0gPGFueT5uZXdHcmFtbWFyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGdyYW1tYXI7XHJcbn1cclxuXHJcbi8vIFVzZWQgdG8gY2FjaGUgdmFsdWVzIGZvciBzcGVjaWZpYyBlZGl0b3JzXHJcbmNsYXNzIFVudXNlZE1hcCB7XHJcbiAgICBwcml2YXRlIF9tYXAgPSBuZXcgTWFwPHN0cmluZywgT2JzZXJ2YWJsZTxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+PigpO1xyXG4gICAgcHVibGljIGdldChrZXk6IHN0cmluZykge1xyXG4gICAgICAgIGlmICghdGhpcy5fbWFwLmhhcyhrZXkpKSB0aGlzLl9tYXAuc2V0KGtleSwgPGFueT5uZXcgQmVoYXZpb3JTdWJqZWN0PE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4oW10pKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLmdldChrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldE9ic2VydmVyKGtleTogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIDxTdWJzY3JpYmVyPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4gJiB7IGdldFZhbHVlKCk6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSB9Pjxhbnk+dGhpcy5nZXQoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0KGtleTogc3RyaW5nLCB2YWx1ZT86IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSkge1xyXG4gICAgICAgIGNvbnN0IG8gPSB0aGlzLl9nZXRPYnNlcnZlcihrZXkpO1xyXG4gICAgICAgIGlmICghaXNFcXVhbChvLmdldFZhbHVlKCksIHZhbHVlKSkge1xyXG4gICAgICAgICAgICBvLm5leHQodmFsdWUgfHwgW10pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGVsZXRlKGtleTogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX21hcC5oYXMoa2V5KSlcclxuICAgICAgICAgICAgdGhpcy5fbWFwLmRlbGV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9tYXAuY2xlYXIoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGVuaGFuY2VkSGlnaGxpZ2h0aW5nMTkgPSBuZXcgSGlnaGxpZ2h0O1xyXG4iXX0=
