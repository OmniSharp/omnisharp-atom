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
                        (function () {
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
                        })();
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
        var _ret2 = _loop(_i3);

        if (_ret2 === 'continue') continue;
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
        (function () {
            var newGrammar = new Grammar(editor, grammar, options);
            (0, _lodash.each)(grammar, function (x, i) {
                if ((0, _lodash.has)(grammar, i)) {
                    newGrammar[i] = x;
                }
            });
            grammar = newGrammar;
        })();
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS50cyJdLCJuYW1lcyI6WyJhdWdtZW50RWRpdG9yIiwiZ2V0RW5oYW5jZWRHcmFtbWFyIiwiQXRvbUdyYW1tYXIiLCJyZXF1aXJlIiwiYXRvbSIsImNvbmZpZyIsInJlc291cmNlUGF0aCIsIkRFQk9VTkNFX1RJTUUiLCJISUdITElHSFQiLCJISUdITElHSFRfUkVRVUVTVCIsImdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyIsInBhdGgiLCJxdWlja0ZpeGVzIiwicHJvamVjdE5hbWVzIiwiZmlsdGVyIiwieCIsIkZpbGVOYW1lIiwibWFwIiwiU3RhcnRMaW5lIiwiTGluZSIsIlN0YXJ0Q29sdW1uIiwiQ29sdW1uIiwiRW5kTGluZSIsIkVuZENvbHVtbiIsIktpbmQiLCJQcm9qZWN0cyIsInZhbHVlIiwiRXhjbHVkZUNsYXNzaWZpY2F0aW9ucyIsIkhpZ2hsaWdodCIsInVudXNlZENvZGVSb3dzIiwiVW51c2VkTWFwIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGVmYXVsdCIsImF0b21WZXJzaW9uIiwibWlub3IiLCJkaXNwb3NhYmxlIiwiZWRpdG9ycyIsImFkZCIsImNvbnRleHQiLCJlZGl0b3IiLCJnZXQiLCJzdGFydFdpdGgiLCJkZWJvdW5jZVRpbWUiLCJzd2l0Y2hNYXAiLCJkZWZlciIsInByb2plY3RzIiwicHJvamVjdCIsImFjdGl2ZUZyYW1ld29yayIsIk5hbWUiLCJsaW5lc1RvRmV0Y2giLCJnZXRHcmFtbWFyIiwibGVuZ3RoIiwiY29tYmluZUxhdGVzdCIsImdldFBhdGgiLCJyZXF1ZXN0Iiwic29sdXRpb24iLCJoaWdobGlnaHQiLCJQcm9qZWN0TmFtZXMiLCJMaW5lcyIsInF1aWNrZml4ZXMiLCJyZXNwb25zZSIsImhpZ2hsaWdodHMiLCJjb25jYXQiLCJIaWdobGlnaHRzIiwiZG8iLCJzZXRSZXNwb25zZXMiLCJwdWJsaXNoUmVwbGF5IiwicmVmQ291bnQiLCJsaXN0ZW5lciIsIm1vZGVsIiwiZGlhZ25vc3RpY3NCeUZpbGUiLCJzdWJzY3JpYmUiLCJjaGFuZ2VzIiwiZmlsZSIsImRpYWdub3N0aWNzIiwic2V0IiwiTG9nTGV2ZWwiLCJlYWNoRWRpdG9yIiwiY2QiLCJzZXR1cEVkaXRvciIsIm9tbmlzaGFycCIsInRva2VuaXplZEJ1ZmZlciIsIm5leHQiLCJzd2l0Y2hBY3RpdmVFZGl0b3IiLCJjcmVhdGUiLCJjbGVhciIsImRpc3Bvc2UiLCJpc3N1ZVJlcXVlc3QiLCJwdXNoIiwicmVzcG9uc2VzIiwicmV0b2tlbml6ZUxpbmVzIiwib25EaWREZXN0cm95Iiwib2JzZXJ2ZSIsIm9uRGlkU3RvcENoYW5naW5nIiwib25EaWRTYXZlIiwid2hlbkNvbm5lY3RlZCIsImRlbGF5IiwiY29tcGxldGUiLCJkb1NldEdyYW1tYXIiLCJzZXRHcmFtbWFyIiwiYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQiLCJtYXJrVG9rZW5pemF0aW9uQ29tcGxldGUiLCJ0b2tlbml6ZUluQmFja2dyb3VuZCIsInJvdyIsImFwcGx5IiwiYXJndW1lbnRzIiwic2lsZW50UmV0b2tlbml6ZUxpbmVzIiwiaXNPYnNlcnZlUmV0b2tlbml6aW5nIiwibGFzdFJvdyIsImJ1ZmZlciIsImdldExhc3RSb3ciLCJ0b2tlbml6ZWRMaW5lcyIsImJ1aWxkUGxhY2Vob2xkZXJUb2tlbml6ZWRMaW5lc0ZvclJvd3MiLCJpbnZhbGlkUm93cyIsImxpbmVzVG9Ub2tlbml6ZSIsImludmFsaWRhdGVSb3ciLCJmdWxseVRva2VuaXplZCIsImxlYWRpbmciLCJ0cmFpbGluZyIsInZpc2libGUiLCJwZW5kaW5nQ2h1bmsiLCJpc0FsaXZlIiwidG9rZW5pemVOZXh0Q2h1bmsiLCJzY29wZXNGcm9tVGFncyIsInN0YXJ0aW5nU2NvcGVzIiwidGFncyIsInNjb3BlcyIsInNsaWNlIiwiZ3JhbW1hciIsImkiLCJsZW4iLCJ0YWciLCJtYXRjaGluZ1N0YXJ0VGFnIiwicG9wIiwic3RhcnRJZEZvclNjb3BlIiwic2NvcGVOYW1lIiwiY29uc29sZSIsImluZm8iLCJmaWxlUGF0aCIsImdyYW1tYXJTY29wZU5hbWUiLCJ1bm1hdGNoZWRFbmRUYWciLCJzY29wZUZvcklkIiwidGFrZSIsInJvd3MiLCJHcmFtbWFyIiwiYmFzZSIsIm9wdGlvbnMiLCJfZ2lkIiwiTWFwIiwicmVhZG9ubHkiLCJnZXRCdWZmZXIiLCJwcmVlbXB0RGlkQ2hhbmdlIiwiZSIsIm9sZFJhbmdlIiwibmV3UmFuZ2UiLCJzdGFydCIsImRlbHRhIiwiZW5kIiwiZ2V0TGluZUNvdW50IiwibGluZXMiLCJrZXlzIiwiZG9uZSIsInJlc3BvbnNlTGluZSIsIm9sZEZyb20iLCJjb2x1bW4iLCJuZXdGcm9tIiwic3BhbiIsImRlbGV0ZSIsImxpbmUiLCJjb3VudCIsImhhcyIsImFic0RlbHRhIiwiTWF0aCIsImFicyIsImVuYWJsZUV4Y2x1ZGVDb2RlIiwicmVzdWx0cyIsImdyb3VwZWRJdGVtcyIsImZsYXR0ZW4iLCJncm91cEJ5IiwieiIsIml0ZW0iLCJrZXkiLCJrIiwibWFwcGVkSXRlbSIsImwiLCJwcm90b3R5cGUiLCJydWxlU3RhY2siLCJmaXJzdExpbmUiLCJiYXNlUmVzdWx0IiwidG9rZW5pemVMaW5lIiwiY2FsbCIsImdldEF0b21TdHlsZUZvclRva2VuIiwibmFtZSIsImdldENzVG9rZW5zRm9yTGluZSIsInJ1bGUiLCJnZXRJbml0aWFsUnVsZSIsImRpc3RhbmNlIiwiaW5kZXgiLCJzdHIiLCJzdWJzdHJpbmciLCJzaXplIiwidmFsdWVzIiwicHJldiIsInNwbGljZSIsImJhY2t0cmFja0luZGV4IiwiYmFja3RyYWNrRGlzdGFuY2UiLCJmb3J3YXJkdHJhY2tJbmRleCIsInJlbWFpbmluZ1NpemUiLCJvcGVuRm91bmQiLCJoIiwiZ2V0SWRGb3JTY29wZSIsImlkcyIsImdyYW1tYXJzIiwiYnVpbGRTY29wZXNGb3JHcmFtbWFyIiwiZ3JhbW1hck5hbWUiLCJnZXRHcmFtbWFycyIsImdhbW1yIiwicmVnaXN0cnkiLCJzY29wZXNCeUlkIiwibWV0aG9kIiwic2NvcGUiLCJ0b2tlbiIsImluZGV4RW5kIiwicHJldmlvdXNTY29wZXMiLCJyZXBsYWNlbWVudHMiLCJvcGVucyIsImNsb3NlcyIsIm9wZW5JbmRleCIsInVuc2hpZnQiLCJ1bmZ1bGxmaWxsZWQiLCJyZXBsYWNlbWVudCIsImludGVybmFsSW5kZXgiLCJ2IiwiaWQiLCJjdHgiLCJsb2ciLCJudW0iLCJnMiIsIl9zZXRHcmFtbWFyIiwiaXNWYWxpZEdyYW1tYXIiLCJuZXdHcmFtbWFyIiwiX21hcCIsIm8iLCJfZ2V0T2JzZXJ2ZXIiLCJnZXRWYWx1ZSIsImVuaGFuY2VkSGlnaGxpZ2h0aW5nMTkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O1FBMEtNQSxhLEdBQUFBLGE7UUF5Z0JBQyxrQixHQUFBQSxrQjs7QUFsckJOOztBQUVBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QUFHQSxJQUFNQyxjQUFjQyxRQUFjQyxLQUFNQyxNQUFOLENBQWFDLFlBQWIsR0FBNEIseUNBQTFDLENBQXBCO0FBRUEsSUFBTUMsZ0JBQWdCLEdBQXRCO0FBRUEsSUFBTUMsWUFBWSxXQUFsQjtBQUFBLElBQ0lDLG9CQUFvQixtQkFEeEI7QUFHQSxTQUFBQywyQkFBQSxDQUFxQ0MsSUFBckMsRUFBbURDLFVBQW5ELEVBQTRGQyxZQUE1RixFQUFrSDtBQUM5RyxXQUFPLG1CQUFNRCxVQUFOLEVBQ0ZFLE1BREUsQ0FDSztBQUFBLGVBQUtDLEVBQUVDLFFBQUYsS0FBZUwsSUFBcEI7QUFBQSxLQURMLEVBRUZNLEdBRkUsQ0FFRTtBQUFBLGVBQU07QUFDUEMsdUJBQVdILEVBQUVJLElBRE47QUFFUEMseUJBQWFMLEVBQUVNLE1BRlI7QUFHUEMscUJBQVNQLEVBQUVPLE9BSEo7QUFJUEMsdUJBQVdSLEVBQUVRLFNBSk47QUFLUEMsa0JBQU0sYUFMQztBQU1QQyxzQkFBVVo7QUFOSCxTQUFOO0FBQUEsS0FGRixFQVVGYSxLQVZFLEVBQVA7QUFXSDtBQUdNLElBQU1DLDBEQUF5QixDQUNsQyxDQURrQyxFQUVsQyxDQUZr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QVY7QUFDSDs7Ozs7O0FBR0UsSUFBTWdLLDBEQUF5QixJQUFJM04sU0FBSixFQUEvQiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvaGlnaGxpZ2h0LXYxLjkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5pbXBvcnQge2NoYWluLCBkZWJvdW5jZSwgZWFjaCwgZXZlcnksIGV4dGVuZCwgZmlsdGVyLCBmaW5kLCBmaW5kSW5kZXgsIGhhcywgaXNFcXVhbCwgbWluLCBwdWxsLCByYW5nZSwgcmVtb3ZlLCBzb21lLCBzb3J0QnksIHVuaXEsIHVuaXF1ZUlkfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQge01vZGVsc30gZnJvbSAnb21uaXNoYXJwLWNsaWVudCc7XHJcbmltcG9ydCB7QmVoYXZpb3JTdWJqZWN0LCBPYnNlcnZhYmxlLCBSZXBsYXlTdWJqZWN0LCBTdWJqZWN0LCBTdWJzY3JpYmVyfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7T21uaX0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5pbXBvcnQge2lzT21uaXNoYXJwVGV4dEVkaXRvciwgSU9tbmlzaGFycFRleHRFZGl0b3J9IGZyb20gJy4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3InO1xyXG5pbXBvcnQge3JlZ2lzdGVyQ29udGV4dEl0ZW19IGZyb20gJy4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3InO1xyXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmNvbnN0IEF0b21HcmFtbWFyID0gcmVxdWlyZSgoPGFueT5hdG9tKS5jb25maWcucmVzb3VyY2VQYXRoICsgJy9ub2RlX21vZHVsZXMvZmlyc3QtbWF0ZS9saWIvZ3JhbW1hci5qcycpO1xyXG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuY29uc3QgREVCT1VOQ0VfVElNRSA9IDI0MC8qMjQwKi87XHJcblxyXG5jb25zdCBISUdITElHSFQgPSAnSElHSExJR0hUJyxcclxuICAgIEhJR0hMSUdIVF9SRVFVRVNUID0gJ0hJR0hMSUdIVF9SRVFVRVNUJztcclxuXHJcbmZ1bmN0aW9uIGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhwYXRoOiBzdHJpbmcsIHF1aWNrRml4ZXM6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSwgcHJvamVjdE5hbWVzOiBzdHJpbmdbXSkge1xyXG4gICAgcmV0dXJuIGNoYWluKHF1aWNrRml4ZXMpXHJcbiAgICAgICAgLmZpbHRlcih4ID0+IHguRmlsZU5hbWUgPT09IHBhdGgpXHJcbiAgICAgICAgLm1hcCh4ID0+ICh7XHJcbiAgICAgICAgICAgIFN0YXJ0TGluZTogeC5MaW5lLFxyXG4gICAgICAgICAgICBTdGFydENvbHVtbjogeC5Db2x1bW4sXHJcbiAgICAgICAgICAgIEVuZExpbmU6IHguRW5kTGluZSxcclxuICAgICAgICAgICAgRW5kQ29sdW1uOiB4LkVuZENvbHVtbixcclxuICAgICAgICAgICAgS2luZDogJ3VudXNlZCBjb2RlJyxcclxuICAgICAgICAgICAgUHJvamVjdHM6IHByb2plY3ROYW1lc1xyXG4gICAgICAgIH0gYXMgTW9kZWxzLkhpZ2hsaWdodFNwYW4pKVxyXG4gICAgICAgIC52YWx1ZSgpO1xyXG59XHJcblxyXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmV4cG9ydCBjb25zdCBFeGNsdWRlQ2xhc3NpZmljYXRpb25zID0gW1xyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLkNvbW1lbnQsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uU3RyaW5nLFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLlB1bmN0dWF0aW9uLFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLk9wZXJhdG9yLFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLktleXdvcmRcclxuXTtcclxuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcblxyXG5jbGFzcyBIaWdobGlnaHQgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIGVkaXRvcnM6IElPbW5pc2hhcnBUZXh0RWRpdG9yW107XHJcbiAgICBwcml2YXRlIHVudXNlZENvZGVSb3dzID0gbmV3IFVudXNlZE1hcCgpO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICBpZiAoIShPbW5pLmF0b21WZXJzaW9uLm1pbm9yICE9PSAxIHx8IE9tbmkuYXRvbVZlcnNpb24ubWlub3IgPiA4KSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5lZGl0b3JzID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIHJlZ2lzdGVyQ29udGV4dEl0ZW0oSElHSExJR0hUX1JFUVVFU1QsIGNvbnRleHQgPT4gbmV3IFN1YmplY3Q8Ym9vbGVhbj4oKSksXHJcbiAgICAgICAgICAgIHJlZ2lzdGVyQ29udGV4dEl0ZW0oSElHSExJR0hULCAoY29udGV4dCwgZWRpdG9yKSA9PlxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5nZXQ8U3ViamVjdDxib29sZWFuPj4oSElHSExJR0hUX1JFUVVFU1QpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN0YXJ0V2l0aCh0cnVlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoKCkgPT4gT2JzZXJ2YWJsZS5kZWZlcigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2plY3RzID0gY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lID09PSAnYWxsJyA/IFtdIDogW2NvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbGluZXNUb0ZldGNoID0gdW5pcTxudW1iZXI+KCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmxpbmVzVG9GZXRjaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbGluZXNUb0ZldGNoIHx8ICFsaW5lc1RvRmV0Y2gubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZXNUb0ZldGNoID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5nZXQoZWRpdG9yLmdldFBhdGgoKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5oaWdobGlnaHQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb2plY3ROYW1lczogcHJvamVjdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTGluZXM6IGxpbmVzVG9GZXRjaCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeGNsdWRlQ2xhc3NpZmljYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocXVpY2tmaXhlcywgcmVzcG9uc2UpID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodHM6IGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCBxdWlja2ZpeGVzLCBwcm9qZWN0cykuY29uY2F0KHJlc3BvbnNlID8gcmVzcG9uc2UuSGlnaGxpZ2h0cyA6IFtdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZG8oKHtoaWdobGlnaHRzfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5zZXRSZXNwb25zZXMoaGlnaGxpZ2h0cywgcHJvamVjdHMubGVuZ3RoID4gMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVmQ291bnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSkpLFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLm1vZGVsLmRpYWdub3N0aWNzQnlGaWxlXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGNoYW5nZXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW2ZpbGUsIGRpYWdub3N0aWNzXSBvZiBjaGFuZ2VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3Muc2V0KGZpbGUsIGZpbHRlcihkaWFnbm9zdGljcywgeCA9PiB4LkxvZ0xldmVsID09PSAnSGlkZGVuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBPbW5pLmVhY2hFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0dXBFZGl0b3IoZWRpdG9yLCBjZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbW5pc2hhcnBcclxuICAgICAgICAgICAgICAgICAgICAuZ2V0PE9ic2VydmFibGU8eyBlZGl0b3I6IElPbW5pc2hhcnBUZXh0RWRpdG9yOyBoaWdobGlnaHRzOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdOyBwcm9qZWN0czogc3RyaW5nW10gfT4+KEhJR0hMSUdIVClcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlclsnc2lsZW50UmV0b2tlbml6ZUxpbmVzJ10oKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldDxTdWJqZWN0PGJvb2xlYW4+PihISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldDxTdWJqZWN0PGJvb2xlYW4+PihISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGlmICgoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyWydzaWxlbnRSZXRva2VuaXplTGluZXMnXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbJ3NpbGVudFJldG9rZW5pemVMaW5lcyddKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5kaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0dXBFZGl0b3IoZWRpdG9yOiBJT21uaXNoYXJwVGV4dEVkaXRvciwgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIGlmIChlZGl0b3JbJ19vbGRHcmFtbWFyJ10gfHwgIWVkaXRvci5nZXRHcmFtbWFyKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IGlzc3VlUmVxdWVzdCA9IGVkaXRvci5vbW5pc2hhcnAuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKTtcclxuXHJcbiAgICAgICAgYXVnbWVudEVkaXRvcihlZGl0b3IsIHRoaXMudW51c2VkQ29kZVJvd3MsIHRydWUpO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvcnMucHVzaChlZGl0b3IpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoID0gW107XHJcbiAgICAgICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMpICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcy5jbGVhcigpO1xyXG4gICAgICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcygpO1xyXG4gICAgICAgICAgICBkZWxldGUgZWRpdG9yWydfb2xkR3JhbW1hciddO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcclxuICAgICAgICAgICAgcHVsbCh0aGlzLmVkaXRvcnMsIGVkaXRvcik7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnByb2plY3RcclxuICAgICAgICAgICAgLm9ic2VydmUuYWN0aXZlRnJhbWV3b3JrXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoID0gW107XHJcbiAgICAgICAgICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkucmVzcG9uc2VzKSAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMuY2xlYXIoKTtcclxuICAgICAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZygoKSA9PiBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRTYXZlKCgpID0+IHtcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoID0gW107XHJcbiAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvblxyXG4gICAgICAgICAgICAud2hlbkNvbm5lY3RlZCgpXHJcbiAgICAgICAgICAgIC5kZWxheSgxMDAwKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHtcclxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdFbmhhbmNlZCBIaWdobGlnaHRpbmcnO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gJ0VuYWJsZXMgc2VydmVyIGJhc2VkIGhpZ2hsaWdodGluZywgd2hpY2ggaW5jbHVkZXMgc3VwcG9ydCBmb3Igc3RyaW5nIGludGVycG9sYXRpb24sIGNsYXNzIG5hbWVzIGFuZCBtb3JlLic7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IGZhbHNlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudEVkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgdW51c2VkQ29kZVJvd3M6IFVudXNlZE1hcCA9IG51bGwsIGRvU2V0R3JhbW1hciA9IGZhbHNlKSB7XHJcbiAgICBpZiAoIWVkaXRvclsnX29sZEdyYW1tYXInXSlcclxuICAgICAgICBlZGl0b3JbJ19vbGRHcmFtbWFyJ10gPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xyXG4gICAgaWYgKCFlZGl0b3JbJ19zZXRHcmFtbWFyJ10pXHJcbiAgICAgICAgZWRpdG9yWydfc2V0R3JhbW1hciddID0gZWRpdG9yLnNldEdyYW1tYXI7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbJ19idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dCddKVxyXG4gICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbJ19idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dCddID0gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dDtcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlclsnX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZSddKVxyXG4gICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbJ19tYXJrVG9rZW5pemF0aW9uQ29tcGxldGUnXSA9IChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIubWFya1Rva2VuaXphdGlvbkNvbXBsZXRlO1xyXG4gICAgaWYgKCEoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyWydfcmV0b2tlbml6ZUxpbmVzJ10pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlclsnX3JldG9rZW5pemVMaW5lcyddID0gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci5yZXRva2VuaXplTGluZXM7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbJ190b2tlbml6ZUluQmFja2dyb3VuZCddKVxyXG4gICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbJ190b2tlbml6ZUluQmFja2dyb3VuZCddID0gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci50b2tlbml6ZUluQmFja2dyb3VuZDtcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlclsnX2NodW5rU2l6ZSddKVxyXG4gICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbJ2NodW5rU2l6ZSddID0gMjA7XHJcblxyXG4gICAgZWRpdG9yLnNldEdyYW1tYXIgPSBzZXRHcmFtbWFyO1xyXG4gICAgaWYgKGRvU2V0R3JhbW1hcikgZWRpdG9yLnNldEdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSk7XHJcblxyXG4gICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikuYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQgPSBmdW5jdGlvbiAocm93OiBudW1iZXIpIHtcclxuICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKVsnX19yb3dfXyddID0gcm93O1xyXG4gICAgICAgIHJldHVybiAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyWydfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQnXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoISg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLnNpbGVudFJldG9rZW5pemVMaW5lcykge1xyXG4gICAgICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLnNpbGVudFJldG9rZW5pemVMaW5lcyA9IGRlYm91bmNlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcclxuICAgICAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KGZhbHNlKTtcclxuICAgICAgICAgICAgbGV0IGxhc3RSb3c6IG51bWJlcjtcclxuICAgICAgICAgICAgbGFzdFJvdyA9IHRoaXMuYnVmZmVyLmdldExhc3RSb3coKTtcclxuICAgICAgICAgICAgdGhpcy50b2tlbml6ZWRMaW5lcyA9IHRoaXMuYnVpbGRQbGFjZWhvbGRlclRva2VuaXplZExpbmVzRm9yUm93cygwLCBsYXN0Um93KTtcclxuICAgICAgICAgICAgdGhpcy5pbnZhbGlkUm93cyA9IFtdO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5saW5lc1RvVG9rZW5pemUgJiYgdGhpcy5saW5lc1RvVG9rZW5pemUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3cobWluKHRoaXMubGluZXNUb1Rva2VuaXplKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3coMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5mdWxseVRva2VuaXplZCA9IGZhbHNlO1xyXG4gICAgICAgIH0sIERFQk9VTkNFX1RJTUUsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikubWFya1Rva2VuaXphdGlvbkNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcpXHJcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KHRydWUpO1xyXG4gICAgICAgIHJldHVybiAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyWydfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlJ10uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIH07XHJcblxyXG4gICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikucmV0b2tlbml6ZUxpbmVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcpXHJcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KGZhbHNlKTtcclxuICAgICAgICByZXR1cm4gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlclsnX3JldG9rZW5pemVMaW5lcyddLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLnRva2VuaXplSW5CYWNrZ3JvdW5kID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghdGhpcy52aXNpYmxlIHx8IHRoaXMucGVuZGluZ0NodW5rIHx8ICF0aGlzLmlzQWxpdmUoKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnBlbmRpbmdDaHVuayA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQWxpdmUoKSAmJiB0aGlzLmJ1ZmZlci5pc0FsaXZlKCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudG9rZW5pemVOZXh0Q2h1bmsoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5zY29wZXNGcm9tVGFncyA9IGZ1bmN0aW9uIChzdGFydGluZ1Njb3BlczogbnVtYmVyW10sIHRhZ3M6IG51bWJlcltdKSB7XHJcbiAgICAgICAgY29uc3Qgc2NvcGVzID0gc3RhcnRpbmdTY29wZXMuc2xpY2UoKTtcclxuICAgICAgICBjb25zdCBncmFtbWFyID0gKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRhZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgdGFnID0gdGFnc1tpXTtcclxuICAgICAgICAgICAgaWYgKHRhZyA8IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICgodGFnICUgMikgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2godGFnKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hpbmdTdGFydFRhZyA9IHRhZyArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3Blcy5wb3AoKSA9PT0gbWF0Y2hpbmdTdGFydFRhZykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3Blcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhY2sgdG8gZW5zdXJlIHRoYXQgYWxsIGxpbmVzIGFsd2F5cyBnZXQgdGhlIHByb3BlciBzb3VyY2UgbGluZXMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZXMucHVzaCg8YW55PmdyYW1tYXIuc3RhcnRJZEZvclNjb3BlKGAuJHtncmFtbWFyLnNjb3BlTmFtZX1gKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ0VuY291bnRlcmVkIGFuIHVubWF0Y2hlZCBzY29wZSBlbmQgdGFnLicsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogZWRpdG9yLmJ1ZmZlci5nZXRQYXRoKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbW1hclNjb3BlTmFtZTogZ3JhbW1hci5zY29wZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVubWF0Y2hlZEVuZFRhZzogZ3JhbW1hci5zY29wZUZvcklkKHRhZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuc2V0UmVzcG9uc2VzKFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1bnVzZWRDb2RlUm93cyAmJiBpc09tbmlzaGFycFRleHRFZGl0b3IoZWRpdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJvd3MgPT4gKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRSZXNwb25zZXMoZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKGVkaXRvci5nZXRQYXRoKCksIHJvd3MsIFtdKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNjb3BlcztcclxuICAgIH07XHJcbn1cclxuXHJcbmludGVyZmFjZSBJSGlnaGxpZ2h0aW5nR3JhbW1hciBleHRlbmRzIEZpcnN0TWF0ZS5HcmFtbWFyIHtcclxuICAgIGlzT2JzZXJ2ZVJldG9rZW5pemluZzogU3ViamVjdDxib29sZWFuPjtcclxuICAgIGxpbmVzVG9GZXRjaDogbnVtYmVyW107XHJcbiAgICBsaW5lc1RvVG9rZW5pemU6IG51bWJlcltdO1xyXG4gICAgcmVzcG9uc2VzOiBNYXA8bnVtYmVyLCBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdPjtcclxuICAgIGZ1bGx5VG9rZW5pemVkOiBib29sZWFuO1xyXG4gICAgc2NvcGVOYW1lOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIEdyYW1tYXIge1xyXG4gICAgcHVibGljIGlzT2JzZXJ2ZVJldG9rZW5pemluZzogUmVwbGF5U3ViamVjdDxib29sZWFuPjtcclxuICAgIHB1YmxpYyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcclxuICAgIHB1YmxpYyBsaW5lc1RvRmV0Y2g6IGFueVtdO1xyXG4gICAgcHVibGljIGxpbmVzVG9Ub2tlbml6ZTogYW55W107XHJcbiAgICBwdWJsaWMgYWN0aXZlRnJhbWV3b3JrOiBhbnk7XHJcbiAgICBwdWJsaWMgcmVzcG9uc2VzOiBNYXA8bnVtYmVyLCBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdPjtcclxuICAgIHB1YmxpYyBfZ2lkID0gdW5pcXVlSWQoJ29nJyk7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGJhc2U6IEZpcnN0TWF0ZS5HcmFtbWFyLCBvcHRpb25zOiB7IHJlYWRvbmx5OiBib29sZWFuIH0pIHtcclxuICAgICAgICB0aGlzLmlzT2JzZXJ2ZVJldG9rZW5pemluZyA9IG5ldyBSZXBsYXlTdWJqZWN0PGJvb2xlYW4+KDEpO1xyXG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XHJcblxyXG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xyXG4gICAgICAgIHRoaXMucmVzcG9uc2VzID0gbmV3IE1hcDxudW1iZXIsIE1vZGVscy5IaWdobGlnaHRTcGFuW10+KCk7XHJcbiAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZSA9IFtdO1xyXG4gICAgICAgIHRoaXMuYWN0aXZlRnJhbWV3b3JrID0ge307XHJcblxyXG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAhb3B0aW9ucy5yZWFkb25seSkge1xyXG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkucHJlZW1wdERpZENoYW5nZSgoZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB7b2xkUmFuZ2UsIG5ld1JhbmdlfSA9IGU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnQ6IG51bWJlciA9IG9sZFJhbmdlLnN0YXJ0LnJvdyxcclxuICAgICAgICAgICAgICAgICAgICBkZWx0YTogbnVtYmVyID0gbmV3UmFuZ2UuZW5kLnJvdyAtIG9sZFJhbmdlLmVuZC5yb3c7XHJcblxyXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBzdGFydCAtIDU7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgZW5kID0gZWRpdG9yLmJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSByYW5nZShzdGFydCwgZW5kICsgMSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmtleXMoKS5uZXh0KCkuZG9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb0ZldGNoLnB1c2goLi4ubGluZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUxpbmUgPSB0aGlzLnJlc3BvbnNlcy5nZXQobGluZXNbMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZUxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkRnJvbSA9IG9sZFJhbmdlLnN0YXJ0LmNvbHVtbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zyb20gPSBuZXdSYW5nZS5zdGFydC5jb2x1bW47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmUocmVzcG9uc2VMaW5lLCAoc3BhbjogTW9kZWxzLkhpZ2hsaWdodFNwYW4pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0TGluZSA8IGxpbmVzWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydENvbHVtbiA+PSBvbGRGcm9tIHx8IHNwYW4uRW5kQ29sdW1uID49IG9sZEZyb20pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG5ld0Zyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gbmV3RnJvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGVhY2gobGluZXMsIGxpbmUgPT4geyB0aGlzLnJlc3BvbnNlcy5kZWxldGUobGluZSk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkZWx0YSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBOZXcgbGluZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gZWRpdG9yLmdldExpbmVDb3VudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBjb3VudCAtIDE7IGkgPiBlbmQ7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaSArIGRlbHRhLCB0aGlzLnJlc3BvbnNlcy5nZXQoaSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZWx0YSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmVkIGxpbmVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNEZWx0YSA9IE1hdGguYWJzKGRlbHRhKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZW5kOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkgKyBhYnNEZWx0YSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpLCB0aGlzLnJlc3BvbnNlcy5nZXQoaSArIGFic0RlbHRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5kZWxldGUoaSArIGFic0RlbHRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRSZXNwb25zZXModmFsdWU6IE1vZGVscy5IaWdobGlnaHRTcGFuW10sIGVuYWJsZUV4Y2x1ZGVDb2RlOiBib29sZWFuKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGNoYWluKHZhbHVlKTtcclxuXHJcbiAgICAgICAgY29uc3QgZ3JvdXBlZEl0ZW1zID0gPGFueT5yZXN1bHRzLm1hcChoaWdobGlnaHQgPT4gcmFuZ2UoaGlnaGxpZ2h0LlN0YXJ0TGluZSwgaGlnaGxpZ2h0LkVuZExpbmUgKyAxKVxyXG4gICAgICAgICAgICAubWFwKGxpbmUgPT4gKHsgbGluZSwgaGlnaGxpZ2h0IH0pKSlcclxuICAgICAgICAgICAgLmZsYXR0ZW48eyBsaW5lOiBudW1iZXI7IGhpZ2hsaWdodDogTW9kZWxzLkhpZ2hsaWdodFNwYW4gfT4oKVxyXG4gICAgICAgICAgICAuZ3JvdXBCeSh6ID0+IHoubGluZSlcclxuICAgICAgICAgICAgLnZhbHVlKCk7XHJcblxyXG4gICAgICAgIGVhY2goZ3JvdXBlZEl0ZW1zLCAoaXRlbTogeyBoaWdobGlnaHQ6IE1vZGVscy5IaWdobGlnaHRTcGFuIH1bXSwga2V5OiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgbGV0IGsgPSAra2V5LCBtYXBwZWRJdGVtID0gaXRlbS5tYXAoeCA9PiB4LmhpZ2hsaWdodCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWVuYWJsZUV4Y2x1ZGVDb2RlIHx8IHNvbWUobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09ICdwcmVwcm9jZXNzb3Iga2V5d29yZCcpICYmIGV2ZXJ5KG1hcHBlZEl0ZW0sIGkgPT4gaS5LaW5kID09PSAnZXhjbHVkZWQgY29kZScgfHwgaS5LaW5kID09PSAncHJlcHJvY2Vzc29yIGtleXdvcmQnKSkge1xyXG4gICAgICAgICAgICAgICAgbWFwcGVkSXRlbSA9IG1hcHBlZEl0ZW0uZmlsdGVyKHogPT4gei5LaW5kICE9PSAnZXhjbHVkZWQgY29kZScpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmhhcyhrKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUucHVzaChrKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChrKTtcclxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZUxpbmUubGVuZ3RoICE9PSBtYXBwZWRJdGVtLmxlbmd0aCB8fCBzb21lKHJlc3BvbnNlTGluZSwgKGwsIGkpID0+ICFpc0VxdWFsKGwsIG1hcHBlZEl0ZW1baV0pKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChrLCBtYXBwZWRJdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG4vKiB0c2xpbnQ6ZGlzYWJsZTptZW1iZXItYWNjZXNzICovXHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuZXh0ZW5kKEdyYW1tYXIucHJvdG90eXBlLCBBdG9tR3JhbW1hci5wcm90b3R5cGUpO1xyXG5cclxuR3JhbW1hci5wcm90b3R5cGVbJ29tbmlzaGFycCddID0gdHJ1ZTtcclxuR3JhbW1hci5wcm90b3R5cGVbJ3Rva2VuaXplTGluZSddID0gZnVuY3Rpb24gKGxpbmU6IHN0cmluZywgcnVsZVN0YWNrOiBhbnlbXSwgZmlyc3RMaW5lID0gZmFsc2UpOiB7IHRhZ3M6IG51bWJlcltdOyBydWxlU3RhY2s6IGFueSB9IHtcclxuICAgIGNvbnN0IGJhc2VSZXN1bHQgPSBBdG9tR3JhbW1hci5wcm90b3R5cGUudG9rZW5pemVMaW5lLmNhbGwodGhpcywgbGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUpO1xyXG4gICAgbGV0IHRhZ3M6IGFueVtdO1xyXG5cclxuICAgIGlmICh0aGlzLnJlc3BvbnNlcykge1xyXG4gICAgICAgIGNvbnN0IHJvdyA9IHRoaXNbJ19fcm93X18nXTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMocm93KSkgcmV0dXJuIGJhc2VSZXN1bHQ7XHJcblxyXG4gICAgICAgIGNvbnN0IGhpZ2hsaWdodHMgPSB0aGlzLnJlc3BvbnNlcy5nZXQocm93KTtcclxuICAgICAgICAvLyBFeGNsdWRlZCBjb2RlIGJsb3dzIGF3YXkgYW55IG90aGVyIGZvcm1hdHRpbmcsIG90aGVyd2lzZSB3ZSBnZXQgaW50byBhIHZlcnkgd2VpcmQgc3RhdGUuXHJcbiAgICAgICAgaWYgKGhpZ2hsaWdodHNbMF0gJiYgaGlnaGxpZ2h0c1swXS5LaW5kID09PSAnZXhjbHVkZWQgY29kZScpIHtcclxuICAgICAgICAgICAgdGFncyA9IFtsaW5lLmxlbmd0aF07XHJcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0c1swXSwgMCwgdGFncy5sZW5ndGggLSAxLCBsaW5lKTtcclxuICAgICAgICAgICAgYmFzZVJlc3VsdC5ydWxlU3RhY2sgPSBbYmFzZVJlc3VsdC5ydWxlU3RhY2tbMF1dO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRhZ3MgPSB0aGlzLmdldENzVG9rZW5zRm9yTGluZShoaWdobGlnaHRzLCBsaW5lLCByb3csIHJ1bGVTdGFjaywgZmlyc3RMaW5lLCBiYXNlUmVzdWx0LnRhZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBiYXNlUmVzdWx0LnRhZ3MgPSB0YWdzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJhc2VSZXN1bHQ7XHJcbn07XHJcblxyXG4oR3JhbW1hci5wcm90b3R5cGUgYXMgYW55KS5nZXRDc1Rva2Vuc0ZvckxpbmUgPSBmdW5jdGlvbiAoaGlnaGxpZ2h0czogTW9kZWxzLkhpZ2hsaWdodFNwYW5bXSwgbGluZTogc3RyaW5nLCByb3c6IG51bWJlciwgcnVsZVN0YWNrOiBhbnlbXSwgZmlyc3RMaW5lOiBib29sZWFuLCB0YWdzOiBudW1iZXJbXSkge1xyXG4gICAgcnVsZVN0YWNrID0gW3sgcnVsZTogdGhpcy5nZXRJbml0aWFsUnVsZSgpIH1dO1xyXG5cclxuICAgIGVhY2goaGlnaGxpZ2h0cywgaGlnaGxpZ2h0ID0+IHtcclxuICAgICAgICBjb25zdCBzdGFydCA9IGhpZ2hsaWdodC5TdGFydENvbHVtbiAtIDE7XHJcbiAgICAgICAgY29uc3QgZW5kID0gaGlnaGxpZ2h0LkVuZENvbHVtbiAtIDE7XHJcblxyXG4gICAgICAgIGlmIChoaWdobGlnaHQuRW5kTGluZSA+IGhpZ2hsaWdodC5TdGFydExpbmUgJiYgaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uID09PSAwICYmIGhpZ2hsaWdodC5FbmRDb2x1bW4gPT09IDApIHtcclxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIDAsIHRhZ3MubGVuZ3RoIC0gMSwgbGluZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkaXN0YW5jZSA9IC0xO1xyXG4gICAgICAgIGxldCBpbmRleCA9IC0xO1xyXG4gICAgICAgIGxldCBpOiBudW1iZXI7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgKyB0YWdzW2ldID4gc3RhcnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkaXN0YW5jZSArPSB0YWdzW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzdHIgPSBsaW5lLnN1YnN0cmluZyhzdGFydCwgZW5kKTtcclxuICAgICAgICBjb25zdCBzaXplID0gZW5kIC0gc3RhcnQ7XHJcbiAgICAgICAgaWYgKHRhZ3NbaW5kZXhdID49IHNpemUpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlczogbnVtYmVyW107XHJcbiAgICAgICAgICAgIGxldCBwcmV2OiBudW1iZXIsIG5leHQ6IG51bWJlcjtcclxuICAgICAgICAgICAgaWYgKGRpc3RhbmNlID09PSBzdGFydCkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWVzID0gW3NpemUsIHRhZ3NbaW5kZXhdIC0gc2l6ZV07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwcmV2ID0gc3RhcnQgLSBkaXN0YW5jZTtcclxuICAgICAgICAgICAgICAgIG5leHQgPSB0YWdzW2luZGV4XSAtIHNpemUgLSBwcmV2O1xyXG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gW3ByZXYsIHNpemUsIHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXZdO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbcHJldiwgc2l6ZV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGFncy5zcGxpY2UoaW5kZXgsIDEsIC4uLnZhbHVlcyk7XHJcbiAgICAgICAgICAgIGlmIChwcmV2KSBpbmRleCA9IGluZGV4ICsgMTtcclxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGluZGV4LCBpbmRleCArIDEsIHN0cik7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0YWdzW2luZGV4XSA8IHNpemUpIHtcclxuICAgICAgICAgICAgbGV0IGJhY2t0cmFja0luZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tEaXN0YW5jZSA9IDA7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IGJhY2t0cmFja0luZGV4OyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrRGlzdGFuY2UgKz0gdGFnc1tpXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYmFja3RyYWNrRGlzdGFuY2UgPj0gc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGkgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgZm9yd2FyZHRyYWNrSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgbGV0IHJlbWFpbmluZ1NpemUgPSBzaXplO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSBpbmRleCArIDE7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHJlbWFpbmluZ1NpemUgPD0gMCAmJiB0YWdzW2ldID4gMCkvKiB8fCB0YWdzW2ldICUgMiA9PT0gLTEqLykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gaSAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmdTaXplIC09IHRhZ3NbaV07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSGFuZGxlcyBjYXNlIHdoZXJlIHRoZXJlIGlzIGEgY2xvc2luZyB0YWdcclxuICAgICAgICAgICAgICAgICAgICAvLyBidXQgbm8gb3BlbmluZyB0YWcgaGVyZS5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgb3BlbkZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IGk7IGggPj0gMDsgaC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWdzW2hdID09PSB0YWdzW2ldICsgMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghb3BlbkZvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gaSAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGkgPT09IHRhZ3MubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IHRhZ3MubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGJhY2t0cmFja0luZGV4LCBmb3J3YXJkdHJhY2tJbmRleCwgc3RyKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdGFncztcclxufTtcclxuXHJcbmNvbnN0IGdldElkRm9yU2NvcGUgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgaWRzOiB7IFtrZXk6IHN0cmluZ106IHsgW2tleTogc3RyaW5nXTogbnVtYmVyIH07IH0gPSB7fTtcclxuICAgIGNvbnN0IGdyYW1tYXJzOiBhbnkgPSB7fTtcclxuXHJcbiAgICBmdW5jdGlvbiBidWlsZFNjb3Blc0ZvckdyYW1tYXIoZ3JhbW1hck5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSBmaW5kKGF0b20uZ3JhbW1hcnMuZ2V0R3JhbW1hcnMoKSwgZ2FtbXIgPT4gZ2FtbXIubmFtZSA9PT0gZ3JhbW1hck5hbWUpO1xyXG4gICAgICAgIGlmICghZ3JhbW1hcikgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZHNbZ3JhbW1hci5uYW1lXSA9IHt9O1xyXG4gICAgICAgIGdyYW1tYXJzW2dyYW1tYXIubmFtZV0gPSBncmFtbWFyO1xyXG5cclxuICAgICAgICBlYWNoKGdyYW1tYXIucmVnaXN0cnkuc2NvcGVzQnlJZCwgKHZhbHVlOiBzdHJpbmcsIGtleTogYW55KSA9PiB7IGlkc1tncmFtbWFyLm5hbWVdW3ZhbHVlXSA9ICtrZXk7IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1ldGhvZCA9IChncmFtbWFyOiBzdHJpbmcsIHNjb3BlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXSkge1xyXG4gICAgICAgICAgICBidWlsZFNjb3Blc0ZvckdyYW1tYXIoZ3JhbW1hcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXVtzY29wZV0pXHJcbiAgICAgICAgICAgIGlkc1tncmFtbWFyXVtzY29wZV0gPSBncmFtbWFyc1tncmFtbWFyXS5yZWdpc3RyeS5zdGFydElkRm9yU2NvcGUoc2NvcGUpO1xyXG5cclxuICAgICAgICByZXR1cm4gK2lkc1tncmFtbWFyXVtzY29wZV07XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55Pm1ldGhvZCkuZW5kID0gKHNjb3BlOiBudW1iZXIpID0+ICtzY29wZSAtIDE7XHJcblxyXG4gICAgcmV0dXJuIDx7IChncmFtbWFyOiBzdHJpbmcsIHNjb3BlOiBzdHJpbmcpOiBudW1iZXI7IGVuZDogKHNjb3BlOiBudW1iZXIpID0+IG51bWJlcjsgfT5tZXRob2Q7XHJcbn0pKCk7XHJcblxyXG5cclxuLy8vIE5PVEU6IGJlc3Qgd2F5IEkgaGF2ZSBmb3VuZCBmb3IgdGhlc2UgaXMgdG8ganVzdCBsb29rIGF0IHRoZW1lIFwibGVzc1wiIGZpbGVzXHJcbi8vIEFsdGVybmF0aXZlbHkganVzdCBpbnNwZWN0IHRoZSB0b2tlbiBmb3IgYSAuanMgZmlsZVxyXG5mdW5jdGlvbiBnZXRBdG9tU3R5bGVGb3JUb2tlbihncmFtbWFyOiBzdHJpbmcsIHRhZ3M6IG51bWJlcltdLCB0b2tlbjogTW9kZWxzLkhpZ2hsaWdodFNwYW4sIGluZGV4OiBudW1iZXIsIGluZGV4RW5kOiBudW1iZXIsIHN0cjogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBwcmV2aW91c1Njb3BlczogYW55W10gPSBbXTtcclxuICAgIGZvciAobGV0IGkgPSBpbmRleCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKHRhZ3NbaV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlcGxhY2VtZW50czogeyBzdGFydDogbnVtYmVyOyBlbmQ6IG51bWJlcjsgcmVwbGFjZW1lbnQ6IG51bWJlcltdIH1bXSA9IFtdO1xyXG4gICAgY29uc3Qgb3BlbnM6IHsgdGFnOiBudW1iZXI7IGluZGV4OiBudW1iZXIgfVtdID0gW107XHJcbiAgICBjb25zdCBjbG9zZXM6IHR5cGVvZiBvcGVucyA9IFtdO1xyXG5cclxuICAgIC8vIFNjYW4gZm9yIGFueSB1bmNsb3NlZCBvciB1bm9wZW5lZCB0YWdzXHJcbiAgICBmb3IgKGxldCBpID0gaW5kZXg7IGkgPCBpbmRleEVuZDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSBjb250aW51ZTtcclxuICAgICAgICBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgY29uc3Qgb3BlbkluZGV4ID0gZmluZEluZGV4KG9wZW5zLCB4ID0+IHgudGFnID09PSAodGFnc1tpXSArIDEpKTtcclxuICAgICAgICAgICAgaWYgKG9wZW5JbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBvcGVucy5zcGxpY2Uob3BlbkluZGV4LCAxKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNsb3Nlcy5wdXNoKHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG9wZW5zLnVuc2hpZnQoeyB0YWc6IHRhZ3NbaV0sIGluZGV4OiBpIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBsZXQgdW5mdWxsZmlsbGVkOiB0eXBlb2Ygb3BlbnMgPSBbXTtcclxuICAgIGlmIChjbG9zZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHVuZnVsbGZpbGxlZCA9IHNvcnRCeShvcGVucy5jb25jYXQoY2xvc2VzKSwgeCA9PiB4LmluZGV4KTtcclxuICAgIH0gZWxzZSBpZiAob3BlbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIC8vIEdyYWIgdGhlIGxhc3Qga25vd24gb3BlbiwgYW5kIGFwcGVuZCBmcm9tIHRoZXJlXHJcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xyXG4gICAgICAgICAgICBzdGFydDogb3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKG9wZW5zW29wZW5zLmxlbmd0aCAtIDFdLmluZGV4LCBpbmRleEVuZCArIDEpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGludGVybmFsSW5kZXggPSBpbmRleDtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdW5mdWxsZmlsbGVkLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgdiA9IHVuZnVsbGZpbGxlZFtpXTtcclxuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBpbnRlcm5hbEluZGV4LFxyXG4gICAgICAgICAgICBlbmQ6IHYuaW5kZXgsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGludGVybmFsSW5kZXgsIHYuaW5kZXgpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaW50ZXJuYWxJbmRleCA9IHYuaW5kZXggKyAxO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXBsYWNlbWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xyXG4gICAgICAgICAgICBzdGFydDogaW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGluZGV4LCBpbmRleEVuZClcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLypyZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBpbnRlcm5hbEluZGV4LFxyXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxyXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbnRlcm5hbEluZGV4LCBpbmRleEVuZClcclxuICAgICAgICB9KTsqL1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFkZChzY29wZTogYW55KSB7XHJcbiAgICAgICAgY29uc3QgaWQgPSBnZXRJZEZvclNjb3BlKGdyYW1tYXIsIHNjb3BlKTtcclxuICAgICAgICBpZiAoaWQgPT09IC0xKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICghc29tZShwcmV2aW91c1Njb3BlcywgeiA9PiB6ID09PSBpZCkpIHtcclxuICAgICAgICAgICAgcHJldmlvdXNTY29wZXMucHVzaChpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVhY2gocmVwbGFjZW1lbnRzLCBjdHggPT4ge1xyXG4gICAgICAgICAgICBjb25zdCByZXBsYWNlbWVudCA9IGN0eC5yZXBsYWNlbWVudDtcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQudW5zaGlmdChpZCk7XHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50LnB1c2goZ2V0SWRGb3JTY29wZS5lbmQoaWQpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHN3aXRjaCAodG9rZW4uS2luZCkge1xyXG4gICAgICAgIGNhc2UgJ251bWJlcic6XHJcbiAgICAgICAgICAgIGFkZChgY29uc3RhbnQubnVtZXJpY2ApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdzdHJ1Y3QgbmFtZSc6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuc3RydWN0YCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2VudW0gbmFtZSc6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuZW51bWApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdpZGVudGlmaWVyJzpcclxuICAgICAgICAgICAgYWRkKGBpZGVudGlmaWVyYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2NsYXNzIG5hbWUnOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2RlbGVnYXRlIG5hbWUnOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmRlbGVnYXRlYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2ludGVyZmFjZSBuYW1lJzpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllci5pbnRlcmZhY2VgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAncHJlcHJvY2Vzc29yIGtleXdvcmQnOlxyXG4gICAgICAgICAgICBhZGQoYGNvbnN0YW50Lm90aGVyLnN5bWJvbGApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdleGNsdWRlZCBjb2RlJzpcclxuICAgICAgICAgICAgYWRkKGBjb21tZW50LmJsb2NrYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ3VudXNlZCBjb2RlJzpcclxuICAgICAgICAgICAgYWRkKGB1bnVzZWRgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3VuaGFuZGxlZCBLaW5kICcgKyB0b2tlbi5LaW5kKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcblxyXG4gICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XHJcbiAgICAgICAgY29uc3Qge3JlcGxhY2VtZW50LCBlbmQsIHN0YXJ0fSA9IGN0eDtcclxuICAgICAgICBpZiAocmVwbGFjZW1lbnQubGVuZ3RoID09PSAyKSByZXR1cm47XHJcbiAgICAgICAgbGV0IG51bSA9IGVuZCAtIHN0YXJ0O1xyXG4gICAgICAgIGlmIChudW0gPD0gMCkge1xyXG4gICAgICAgICAgICBudW0gPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0YWdzLnNwbGljZShzdGFydCwgbnVtLCAuLi5yZXBsYWNlbWVudCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0R3JhbW1hcihncmFtbWFyOiBGaXJzdE1hdGUuR3JhbW1hcik6IEZpcnN0TWF0ZS5HcmFtbWFyIHtcclxuICAgIGNvbnN0IGcyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKHRoaXMsIGdyYW1tYXIpO1xyXG4gICAgaWYgKGcyICE9PSBncmFtbWFyKVxyXG4gICAgICAgIHRoaXMuX3NldEdyYW1tYXIoZzIpO1xyXG4gICAgcmV0dXJuIGcyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5oYW5jZWRHcmFtbWFyKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBncmFtbWFyPzogRmlyc3RNYXRlLkdyYW1tYXIsIG9wdGlvbnM/OiB7IHJlYWRvbmx5OiBib29sZWFuIH0pIHtcclxuICAgIGlmICghZ3JhbW1hcikgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XHJcbiAgICBpZiAoIWdyYW1tYXJbJ29tbmlzaGFycCddICYmIE9tbmkuaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcikpIHtcclxuICAgICAgICBjb25zdCBuZXdHcmFtbWFyID0gbmV3IEdyYW1tYXIoZWRpdG9yLCBncmFtbWFyLCBvcHRpb25zKTtcclxuICAgICAgICBlYWNoKGdyYW1tYXIsICh4LCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChoYXMoZ3JhbW1hciwgaSkpIHtcclxuICAgICAgICAgICAgICAgIG5ld0dyYW1tYXJbaV0gPSB4O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZ3JhbW1hciA9IDxhbnk+bmV3R3JhbW1hcjtcclxuICAgIH1cclxuICAgIHJldHVybiBncmFtbWFyO1xyXG59XHJcblxyXG4vLyBVc2VkIHRvIGNhY2hlIHZhbHVlcyBmb3Igc3BlY2lmaWMgZWRpdG9yc1xyXG5jbGFzcyBVbnVzZWRNYXAge1xyXG4gICAgcHJpdmF0ZSBfbWFwID0gbmV3IE1hcDxzdHJpbmcsIE9ic2VydmFibGU8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPj4oKTtcclxuICAgIHB1YmxpYyBnZXQoa2V5OiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX21hcC5oYXMoa2V5KSkgdGhpcy5fbWFwLnNldChrZXksIDxhbnk+bmV3IEJlaGF2aW9yU3ViamVjdDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KFtdKSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC5nZXQoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRPYnNlcnZlcihrZXk6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiA8U3Vic2NyaWJlcjxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+ICYgeyBnZXRWYWx1ZSgpOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10gfT48YW55PnRoaXMuZ2V0KGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldChrZXk6IHN0cmluZywgdmFsdWU/OiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10pIHtcclxuICAgICAgICBjb25zdCBvID0gdGhpcy5fZ2V0T2JzZXJ2ZXIoa2V5KTtcclxuICAgICAgICBpZiAoIWlzRXF1YWwoby5nZXRWYWx1ZSgpLCB2YWx1ZSkpIHtcclxuICAgICAgICAgICAgby5uZXh0KHZhbHVlIHx8IFtdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlbGV0ZShrZXk6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLl9tYXAuaGFzKGtleSkpXHJcbiAgICAgICAgICAgIHRoaXMuX21hcC5kZWxldGUoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fbWFwLmNsZWFyKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBlbmhhbmNlZEhpZ2hsaWdodGluZzE5ID0gbmV3IEhpZ2hsaWdodDtcclxuIl19
