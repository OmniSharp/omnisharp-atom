"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.enhancedHighlighting19 = exports.ExcludeClassifications = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.augmentEditor = augmentEditor;
exports.getEnhancedGrammar = getEnhancedGrammar;

var _omni = require("../server/omni");

var _omnisharpTextEditor = require("../server/omnisharp-text-editor");

var _lodash = require("lodash");

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AtomGrammar = require(atom.config.resourcePath + "/node_modules/first-mate/lib/grammar.js");
var DEBOUNCE_TIME = 240;
var fastdom = require("fastdom");
var HIGHLIGHT = "HIGHLIGHT",
    HIGHLIGHT_REQUEST = "HIGHLIGHT_REQUEST";
function getHighlightsFromQuickFixes(path, quickFixes, projectNames) {
    return (0, _lodash.chain)(quickFixes).filter(function (x) {
        return x.FileName === path;
    }).map(function (x) {
        return {
            StartLine: x.Line,
            StartColumn: x.Column,
            EndLine: x.EndLine,
            EndColumn: x.EndColumn,
            Kind: "unused code",
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
        this.title = "Enhanced Highlighting";
        this.description = "Enables server based highlighting, which includes support for string interpolation, class names and more.";
        this.default = false;
    }

    _createClass(Highlight, [{
        key: "activate",
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
                        var projects = context.project.activeFramework.Name === "all" ? [] : [context.project.activeFramework.Name];
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
                            return x.LogLevel === "Hidden";
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
                    editor.tokenizedBuffer["silentRetokenizeLines"]();
                }));
                editor.omnisharp.get(HIGHLIGHT_REQUEST).next(true);
            }), _omni.Omni.switchActiveEditor(function (editor, cd) {
                editor.omnisharp.get(HIGHLIGHT_REQUEST).next(true);
                if (editor.tokenizedBuffer["silentRetokenizeLines"]) {
                    editor.tokenizedBuffer["silentRetokenizeLines"]();
                }
            }), _tsDisposables.Disposable.create(function () {
                _this.unusedCodeRows.clear();
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            if (this.disposable) {
                this.disposable.dispose();
            }
        }
    }, {
        key: "setupEditor",
        value: function setupEditor(editor, disposable) {
            var _this2 = this;

            if (editor["_oldGrammar"] || !editor.getGrammar) return;
            var issueRequest = editor.omnisharp.get(HIGHLIGHT_REQUEST);
            augmentEditor(editor, this.unusedCodeRows, true);
            this.editors.push(editor);
            this.disposable.add(disposable);
            disposable.add(_tsDisposables.Disposable.create(function () {
                editor.getGrammar().linesToFetch = [];
                if (editor.getGrammar().responses) editor.getGrammar().responses.clear();
                editor.tokenizedBuffer.retokenizeLines();
                delete editor["_oldGrammar"];
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

    if (!editor["_oldGrammar"]) editor["_oldGrammar"] = editor.getGrammar();
    if (!editor["_setGrammar"]) editor["_setGrammar"] = editor.setGrammar;
    if (!editor.tokenizedBuffer["_buildTokenizedLineForRowWithText"]) editor.tokenizedBuffer["_buildTokenizedLineForRowWithText"] = editor.tokenizedBuffer.buildTokenizedLineForRowWithText;
    if (!editor.tokenizedBuffer["_markTokenizationComplete"]) editor.tokenizedBuffer["_markTokenizationComplete"] = editor.tokenizedBuffer.markTokenizationComplete;
    if (!editor.tokenizedBuffer["_retokenizeLines"]) editor.tokenizedBuffer["_retokenizeLines"] = editor.tokenizedBuffer.retokenizeLines;
    if (!editor.tokenizedBuffer["_tokenizeInBackground"]) editor.tokenizedBuffer["_tokenizeInBackground"] = editor.tokenizedBuffer.tokenizeInBackground;
    if (!editor.tokenizedBuffer["_chunkSize"]) editor.tokenizedBuffer["chunkSize"] = 20;
    editor.setGrammar = setGrammar;
    if (doSetGrammar) editor.setGrammar(editor.getGrammar());
    editor.tokenizedBuffer.buildTokenizedLineForRowWithText = function (row) {
        editor.getGrammar()["__row__"] = row;
        return editor.tokenizedBuffer["_buildTokenizedLineForRowWithText"].apply(this, arguments);
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
        return editor.tokenizedBuffer["_markTokenizationComplete"].apply(this, arguments);
    };
    editor.tokenizedBuffer.retokenizeLines = function () {
        if (editor.getGrammar().isObserveRetokenizing) editor.getGrammar().isObserveRetokenizing.next(false);
        return editor.tokenizedBuffer["_retokenizeLines"].apply(this, arguments);
    };
    editor.tokenizedBuffer.tokenizeInBackground = function () {
        var _this3 = this;

        if (!this.visible || this.pendingChunk || !this.isAlive()) return;
        this.pendingChunk = true;
        fastdom.mutate(function () {
            _this3.pendingChunk = false;
            if (_this3.isAlive() && _this3.buffer.isAlive()) {
                _this3.tokenizeNextChunk();
            }
        });
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
                            scopes.push(grammar.startIdForScope("." + grammar.scopeName));
                            console.info("Encountered an unmatched scope end tag.", {
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
        var _this4 = this;

        _classCallCheck(this, Grammar);

        this._gid = (0, _lodash.uniqueId)("og");
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
                if (!_this4.responses.keys().next().done) {
                    var _linesToFetch;

                    (_linesToFetch = _this4.linesToFetch).push.apply(_linesToFetch, _toConsumableArray(lines));
                }
                if (lines.length === 1) {
                    var responseLine = _this4.responses.get(lines[0]);
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
                        _this4.responses.delete(line);
                    });
                }
                if (delta > 0) {
                    var count = editor.getLineCount();
                    for (var i = count - 1; i > end; i--) {
                        if (_this4.responses.has(i)) {
                            _this4.responses.set(i + delta, _this4.responses.get(i));
                            _this4.responses.delete(i);
                        }
                    }
                } else if (delta < 0) {
                    var _count = editor.getLineCount();
                    var absDelta = Math.abs(delta);
                    for (var _i2 = end; _i2 < _count; _i2++) {
                        if (_this4.responses.has(_i2 + absDelta)) {
                            _this4.responses.set(_i2, _this4.responses.get(_i2 + absDelta));
                            _this4.responses.delete(_i2 + absDelta);
                        }
                    }
                }
            });
        }
    }

    _createClass(Grammar, [{
        key: "setResponses",
        value: function setResponses(value, enableExcludeCode) {
            var _this5 = this;

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
                    return i.Kind === "preprocessor keyword";
                }) && (0, _lodash.every)(mappedItem, function (i) {
                    return i.Kind === "excluded code" || i.Kind === "preprocessor keyword";
                })) {
                    mappedItem = mappedItem.filter(function (z) {
                        return z.Kind !== "excluded code";
                    });
                }
                if (!_this5.responses.has(k)) {
                    _this5.responses.set(k, mappedItem);
                    _this5.linesToTokenize.push(k);
                } else {
                    var responseLine = _this5.responses.get(k);
                    if (responseLine.length !== mappedItem.length || (0, _lodash.some)(responseLine, function (l, i) {
                        return !(0, _lodash.isEqual)(l, mappedItem[i]);
                    })) {
                        _this5.responses.set(k, mappedItem);
                        _this5.linesToTokenize.push(k);
                    }
                }
            });
        }
    }]);

    return Grammar;
}();

(0, _lodash.extend)(Grammar.prototype, AtomGrammar.prototype);
Grammar.prototype["omnisharp"] = true;
Grammar.prototype["tokenizeLine"] = function (line, ruleStack) {
    var firstLine = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    var baseResult = AtomGrammar.prototype.tokenizeLine.call(this, line, ruleStack, firstLine);
    var tags = void 0;
    if (this.responses) {
        var row = this["__row__"];
        if (!this.responses.has(row)) return baseResult;
        var highlights = this.responses.get(row);
        if (highlights[0] && highlights[0].Kind === "excluded code") {
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
    var _this6 = this;

    ruleStack = [{ rule: this.getInitialRule() }];
    (0, _lodash.each)(highlights, function (highlight) {
        var start = highlight.StartColumn - 1;
        var end = highlight.EndColumn - 1;
        if (highlight.EndLine > highlight.StartLine && highlight.StartColumn === 0 && highlight.EndColumn === 0) {
            getAtomStyleForToken(_this6.name, tags, highlight, 0, tags.length - 1, line);
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
            getAtomStyleForToken(_this6.name, tags, highlight, index, index + 1, str);
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
            getAtomStyleForToken(_this6.name, tags, highlight, backtrackIndex, forwardtrackIndex, str);
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
        if (tags[_i3] > 0) return "continue";
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

        if (_ret2 === "continue") continue;
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
        case "number":
            add("constant.numeric");
            break;
        case "struct name":
            add("support.constant.numeric.identifier.struct");
            break;
        case "enum name":
            add("support.constant.numeric.identifier.enum");
            break;
        case "identifier":
            add("identifier");
            break;
        case "class name":
            add("support.class.type.identifier");
            break;
        case "delegate name":
            add("support.class.type.identifier.delegate");
            break;
        case "interface name":
            add("support.class.type.identifier.interface");
            break;
        case "preprocessor keyword":
            add("constant.other.symbol");
            break;
        case "excluded code":
            add("comment.block");
            break;
        case "unused code":
            add("unused");
            break;
        default:
            console.log("unhandled Kind " + token.Kind);
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
    if (!grammar["omnisharp"] && _omni.Omni.isValidGrammar(grammar)) {
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
        key: "get",
        value: function get(key) {
            if (!this._map.has(key)) this._map.set(key, new _rxjs.BehaviorSubject([]));
            return this._map.get(key);
        }
    }, {
        key: "_getObserver",
        value: function _getObserver(key) {
            return this.get(key);
        }
    }, {
        key: "set",
        value: function set(key, value) {
            var o = this._getObserver(key);
            if (!(0, _lodash.isEqual)(o.getValue(), value)) {
                o.next(value || []);
            }
            return this;
        }
    }, {
        key: "delete",
        value: function _delete(key) {
            if (this._map.has(key)) this._map.delete(key);
        }
    }, {
        key: "clear",
        value: function clear() {
            this._map.clear();
        }
    }]);

    return UnusedMap;
}();

var enhancedHighlighting19 = exports.enhancedHighlighting19 = new Highlight();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS50cyIsImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztRQTJLQTtRQTJnQkE7O0FDdHJCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FES0EsSUFBTSxjQUFjLFFBQWMsS0FBTSxNQUFOLENBQWEsWUFBYixHQUE0Qix5Q0FBNUIsQ0FBNUI7QUFFTixJQUFNLGdCQUFnQixHQUFoQjtBQUNOLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTFCO0FBRUosSUFBTSxZQUFZLFdBQVo7SUFDRixvQkFBb0IsbUJBQXBCO0FBRUosU0FBQSwyQkFBQSxDQUFxQyxJQUFyQyxFQUFtRCxVQUFuRCxFQUE0RixZQUE1RixFQUFrSDtBQUM5RyxXQUFPLG1CQUFNLFVBQU4sRUFDRixNQURFLENBQ0s7ZUFBSyxFQUFFLFFBQUYsS0FBZSxJQUFmO0tBQUwsQ0FETCxDQUVGLEdBRkUsQ0FFRTtlQUFNO0FBQ1AsdUJBQVcsRUFBRSxJQUFGO0FBQ1gseUJBQWEsRUFBRSxNQUFGO0FBQ2IscUJBQVMsRUFBRSxPQUFGO0FBQ1QsdUJBQVcsRUFBRSxTQUFGO0FBQ1gsa0JBQU0sYUFBTjtBQUNBLHNCQUFVLFlBQVY7O0tBTkMsQ0FGRixDQVVGLEtBVkUsRUFBUCxDQUQ4RztDQUFsSDtBQWVPLElBQU0sMERBQXlCLENBQ2xDLENBRGtDLEVBRWxDLENBRmtDLEVBR2xDLENBSGtDLEVBSWxDLENBSmtDLEVBS2xDLENBTGtDLENBQXpCOztJQVNiO0FBQUEseUJBQUE7OztBQUdZLGFBQUEsY0FBQSxHQUFpQixJQUFJLFNBQUosRUFBakIsQ0FIWjtBQTRIVyxhQUFBLFFBQUEsR0FBVyxLQUFYLENBNUhYO0FBNkhXLGFBQUEsS0FBQSxHQUFRLHVCQUFSLENBN0hYO0FBOEhXLGFBQUEsV0FBQSxHQUFjLDJHQUFkLENBOUhYO0FBK0hXLGFBQUEsT0FBQSxHQUFVLEtBQVYs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SUFlQTtBQUFBLHlCQUFBOzs7QUFDWSxhQUFBLElBQUEsR0FBTyxJQUFJLEdBQUosRUFBUCxDQURaO0tBQUE7Ozs7NEJBRWUsS0FBVztBQUNsQixnQkFBSSxDQUFDLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxHQUFkLENBQUQsRUFBcUIsS0FBSyxJQUFMLENBQVUsR0FBVixDQUFjLEdBQWQsRUFBd0IsMEJBQWlELEVBQWpELENBQXhCLEVBQXpCO0FBQ0EsbUJBQU8sS0FBSyxJQUFMLENBQVUsR0FBVixDQUFjLEdBQWQsQ0FBUCxDQUZrQjs7OztxQ0FLRCxLQUFXO0FBQzVCLG1CQUFtRyxLQUFLLEdBQUwsQ0FBUyxHQUFULENBQW5HLENBRDRCOzs7OzRCQUlyQixLQUFhLE9BQW1DO0FBQ3ZELGdCQUFNLElBQUksS0FBSyxZQUFMLENBQWtCLEdBQWxCLENBQUosQ0FEaUQ7QUFFdkQsZ0JBQUksQ0FBQyxxQkFBUSxFQUFFLFFBQUYsRUFBUixFQUFzQixLQUF0QixDQUFELEVBQStCO0FBQy9CLGtCQUFFLElBQUYsQ0FBTyxTQUFTLEVBQVQsQ0FBUCxDQUQrQjthQUFuQztBQUdBLG1CQUFPLElBQVAsQ0FMdUQ7Ozs7Z0NBUTdDLEtBQVc7QUFDckIsZ0JBQUksS0FBSyxJQUFMLENBQVUsR0FBVixDQUFjLEdBQWQsQ0FBSixFQUNJLEtBQUssSUFBTCxDQUFVLE1BQVYsQ0FBaUIsR0FBakIsRUFESjs7OztnQ0FJUTtBQUNSLGlCQUFLLElBQUwsQ0FBVSxLQUFWLEdBRFE7Ozs7Ozs7QUFLVCxJQUFNLDBEQUF5QixJQUFJLFNBQUosRUFBekIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2hpZ2hsaWdodC12MS45LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7T21uaXNoYXJwVGV4dEVkaXRvciwgaXNPbW5pc2hhcnBUZXh0RWRpdG9yfSBmcm9tIFwiLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xyXG5pbXBvcnQge2VhY2gsIGV4dGVuZCwgaGFzLCBzb21lLCByYW5nZSwgcmVtb3ZlLCBwdWxsLCBmaW5kLCBjaGFpbiwgdW5pcSwgZmluZEluZGV4LCBldmVyeSwgaXNFcXVhbCwgbWluLCBkZWJvdW5jZSwgc29ydEJ5LCB1bmlxdWVJZCwgZmlsdGVyfSBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgUmVwbGF5U3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0LCBTdWJzY3JpYmVyfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge3JlZ2lzdGVyQ29udGV4dEl0ZW19IGZyb20gXCIuLi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuY29uc3QgQXRvbUdyYW1tYXIgPSByZXF1aXJlKCg8YW55PmF0b20pLmNvbmZpZy5yZXNvdXJjZVBhdGggKyBcIi9ub2RlX21vZHVsZXMvZmlyc3QtbWF0ZS9saWIvZ3JhbW1hci5qc1wiKTtcclxuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmNvbnN0IERFQk9VTkNFX1RJTUUgPSAyNDAvKjI0MCovO1xyXG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcclxuXHJcbmNvbnN0IEhJR0hMSUdIVCA9IFwiSElHSExJR0hUXCIsXHJcbiAgICBISUdITElHSFRfUkVRVUVTVCA9IFwiSElHSExJR0hUX1JFUVVFU1RcIjtcclxuXHJcbmZ1bmN0aW9uIGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhwYXRoOiBzdHJpbmcsIHF1aWNrRml4ZXM6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSwgcHJvamVjdE5hbWVzOiBzdHJpbmdbXSkge1xyXG4gICAgcmV0dXJuIGNoYWluKHF1aWNrRml4ZXMpXHJcbiAgICAgICAgLmZpbHRlcih4ID0+IHguRmlsZU5hbWUgPT09IHBhdGgpXHJcbiAgICAgICAgLm1hcCh4ID0+ICh7XHJcbiAgICAgICAgICAgIFN0YXJ0TGluZTogeC5MaW5lLFxyXG4gICAgICAgICAgICBTdGFydENvbHVtbjogeC5Db2x1bW4sXHJcbiAgICAgICAgICAgIEVuZExpbmU6IHguRW5kTGluZSxcclxuICAgICAgICAgICAgRW5kQ29sdW1uOiB4LkVuZENvbHVtbixcclxuICAgICAgICAgICAgS2luZDogXCJ1bnVzZWQgY29kZVwiLFxyXG4gICAgICAgICAgICBQcm9qZWN0czogcHJvamVjdE5hbWVzXHJcbiAgICAgICAgfSBhcyBNb2RlbHMuSGlnaGxpZ2h0U3BhbikpXHJcbiAgICAgICAgLnZhbHVlKCk7XHJcbn1cclxuXHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuZXhwb3J0IGNvbnN0IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMgPSBbXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uQ29tbWVudCxcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5TdHJpbmcsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uUHVuY3R1YXRpb24sXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uT3BlcmF0b3IsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uS2V5d29yZFxyXG5dO1xyXG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuXHJcbmNsYXNzIEhpZ2hsaWdodCBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgZWRpdG9yczogQXJyYXk8T21uaXNoYXJwVGV4dEVkaXRvcj47XHJcbiAgICBwcml2YXRlIHVudXNlZENvZGVSb3dzID0gbmV3IFVudXNlZE1hcCgpO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICBpZiAoIShPbW5pLmF0b21WZXJzaW9uLm1pbm9yICE9PSAxIHx8IE9tbmkuYXRvbVZlcnNpb24ubWlub3IgPiA4KSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5lZGl0b3JzID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIHJlZ2lzdGVyQ29udGV4dEl0ZW0oSElHSExJR0hUX1JFUVVFU1QsIChjb250ZXh0KSA9PiBuZXcgU3ViamVjdDxib29sZWFuPigpKSxcclxuICAgICAgICAgICAgcmVnaXN0ZXJDb250ZXh0SXRlbShISUdITElHSFQsIChjb250ZXh0LCBlZGl0b3IpID0+XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmdldDxTdWJqZWN0PGJvb2xlYW4+PihISUdITElHSFRfUkVRVUVTVClcclxuICAgICAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKHRydWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDApXHJcbiAgICAgICAgICAgICAgICAgICAgLnN3aXRjaE1hcCgoKSA9PiBPYnNlcnZhYmxlLmRlZmVyKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvamVjdHMgPSBjb250ZXh0LnByb2plY3QuYWN0aXZlRnJhbWV3b3JrLk5hbWUgPT09IFwiYWxsXCIgPyBbXSA6IFtjb250ZXh0LnByb2plY3QuYWN0aXZlRnJhbWV3b3JrLk5hbWVdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxpbmVzVG9GZXRjaCA9IHVuaXE8bnVtYmVyPigoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2gpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWxpbmVzVG9GZXRjaCB8fCAhbGluZXNUb0ZldGNoLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzVG9GZXRjaCA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MuZ2V0KGVkaXRvci5nZXRQYXRoKCkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uaGlnaGxpZ2h0KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9qZWN0TmFtZXM6IHByb2plY3RzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExpbmVzOiBsaW5lc1RvRmV0Y2gsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRXhjbHVkZUNsYXNzaWZpY2F0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHF1aWNrZml4ZXMsIHJlc3BvbnNlKSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRzOiBnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMoZWRpdG9yLmdldFBhdGgoKSwgcXVpY2tmaXhlcywgcHJvamVjdHMpLmNvbmNhdChyZXNwb25zZSA/IHJlc3BvbnNlLkhpZ2hsaWdodHMgOiBbXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmRvKCh7aGlnaGxpZ2h0c30pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuc2V0UmVzcG9uc2VzKGhpZ2hsaWdodHMsIHByb2plY3RzLmxlbmd0aCA+IDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlZkNvdW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpKSxcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5tb2RlbC5kaWFnbm9zdGljc0J5RmlsZVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShjaGFuZ2VzID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBbZmlsZSwgZGlhZ25vc3RpY3NdIG9mIGNoYW5nZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5zZXQoZmlsZSwgZmlsdGVyKGRpYWdub3N0aWNzLCB4ID0+IHguTG9nTGV2ZWwgPT09IFwiSGlkZGVuXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgT21uaS5lYWNoRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldHVwRWRpdG9yKGVkaXRvciwgY2QpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub21uaXNoYXJwXHJcbiAgICAgICAgICAgICAgICAgICAgLmdldDxPYnNlcnZhYmxlPHsgZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yOyBoaWdobGlnaHRzOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdOyBwcm9qZWN0czogc3RyaW5nW10gfT4+KEhJR0hMSUdIVClcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKS5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKS5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0pIHtcclxuICAgICAgICAgICAgICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5kaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0dXBFZGl0b3IoZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yLCBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgaWYgKGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdIHx8ICFlZGl0b3IuZ2V0R3JhbW1hcikgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBpc3N1ZVJlcXVlc3QgPSBlZGl0b3Iub21uaXNoYXJwLmdldDxTdWJqZWN0PGJvb2xlYW4+PihISUdITElHSFRfUkVRVUVTVCk7XHJcblxyXG4gICAgICAgIGF1Z21lbnRFZGl0b3IoZWRpdG9yLCB0aGlzLnVudXNlZENvZGVSb3dzLCB0cnVlKTtcclxuXHJcbiAgICAgICAgdGhpcy5lZGl0b3JzLnB1c2goZWRpdG9yKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmxpbmVzVG9GZXRjaCA9IFtdO1xyXG4gICAgICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkucmVzcG9uc2VzKSAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMuY2xlYXIoKTtcclxuICAgICAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci5yZXRva2VuaXplTGluZXMoKTtcclxuICAgICAgICAgICAgZGVsZXRlIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcclxuICAgICAgICAgICAgcHVsbCh0aGlzLmVkaXRvcnMsIGVkaXRvcik7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnByb2plY3RcclxuICAgICAgICAgICAgLm9ic2VydmUuYWN0aXZlRnJhbWV3b3JrXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoID0gW107XHJcbiAgICAgICAgICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkucmVzcG9uc2VzKSAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMuY2xlYXIoKTtcclxuICAgICAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZygoKSA9PiBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRTYXZlKCgpID0+IHtcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoID0gW107XHJcbiAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvblxyXG4gICAgICAgICAgICAud2hlbkNvbm5lY3RlZCgpXHJcbiAgICAgICAgICAgIC5kZWxheSgxMDAwKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHtcclxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiRW5oYW5jZWQgSGlnaGxpZ2h0aW5nXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkVuYWJsZXMgc2VydmVyIGJhc2VkIGhpZ2hsaWdodGluZywgd2hpY2ggaW5jbHVkZXMgc3VwcG9ydCBmb3Igc3RyaW5nIGludGVycG9sYXRpb24sIGNsYXNzIG5hbWVzIGFuZCBtb3JlLlwiO1xyXG4gICAgcHVibGljIGRlZmF1bHQgPSBmYWxzZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIHVudXNlZENvZGVSb3dzOiBVbnVzZWRNYXAgPSBudWxsLCBkb1NldEdyYW1tYXIgPSBmYWxzZSkge1xyXG4gICAgaWYgKCFlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSlcclxuICAgICAgICBlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XHJcbiAgICBpZiAoIWVkaXRvcltcIl9zZXRHcmFtbWFyXCJdKVxyXG4gICAgICAgIGVkaXRvcltcIl9zZXRHcmFtbWFyXCJdID0gZWRpdG9yLnNldEdyYW1tYXI7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXSA9IChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIuYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQ7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdKVxyXG4gICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdID0gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGU7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdKVxyXG4gICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdID0gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci5yZXRva2VuaXplTGluZXM7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfdG9rZW5pemVJbkJhY2tncm91bmRcIl0pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl90b2tlbml6ZUluQmFja2dyb3VuZFwiXSA9IChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIudG9rZW5pemVJbkJhY2tncm91bmQ7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfY2h1bmtTaXplXCJdKVxyXG4gICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJjaHVua1NpemVcIl0gPSAyMDtcclxuXHJcbiAgICBlZGl0b3Iuc2V0R3JhbW1hciA9IHNldEdyYW1tYXI7XHJcbiAgICBpZiAoZG9TZXRHcmFtbWFyKSBlZGl0b3Iuc2V0R3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKTtcclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dCA9IGZ1bmN0aW9uIChyb3c6IG51bWJlcikge1xyXG4gICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpW1wiX19yb3dfX1wiXSA9IHJvdztcclxuICAgICAgICByZXR1cm4gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoISg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLnNpbGVudFJldG9rZW5pemVMaW5lcykge1xyXG4gICAgICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLnNpbGVudFJldG9rZW5pemVMaW5lcyA9IGRlYm91bmNlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcclxuICAgICAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KGZhbHNlKTtcclxuICAgICAgICAgICAgbGV0IGxhc3RSb3c6IG51bWJlcjtcclxuICAgICAgICAgICAgbGFzdFJvdyA9IHRoaXMuYnVmZmVyLmdldExhc3RSb3coKTtcclxuICAgICAgICAgICAgdGhpcy50b2tlbml6ZWRMaW5lcyA9IHRoaXMuYnVpbGRQbGFjZWhvbGRlclRva2VuaXplZExpbmVzRm9yUm93cygwLCBsYXN0Um93KTtcclxuICAgICAgICAgICAgdGhpcy5pbnZhbGlkUm93cyA9IFtdO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5saW5lc1RvVG9rZW5pemUgJiYgdGhpcy5saW5lc1RvVG9rZW5pemUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3cobWluKHRoaXMubGluZXNUb1Rva2VuaXplKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3coMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5mdWxseVRva2VuaXplZCA9IGZhbHNlO1xyXG4gICAgICAgIH0sIERFQk9VTkNFX1RJTUUsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikubWFya1Rva2VuaXphdGlvbkNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcpXHJcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KHRydWUpO1xyXG4gICAgICAgIHJldHVybiAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5yZXRva2VuaXplTGluZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xyXG4gICAgICAgIHJldHVybiAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX3JldG9rZW5pemVMaW5lc1wiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS50b2tlbml6ZUluQmFja2dyb3VuZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoIXRoaXMudmlzaWJsZSB8fCB0aGlzLnBlbmRpbmdDaHVuayB8fCAhdGhpcy5pc0FsaXZlKCkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5wZW5kaW5nQ2h1bmsgPSB0cnVlO1xyXG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wZW5kaW5nQ2h1bmsgPSBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBbGl2ZSgpICYmIHRoaXMuYnVmZmVyLmlzQWxpdmUoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50b2tlbml6ZU5leHRDaHVuaygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLnNjb3Blc0Zyb21UYWdzID0gZnVuY3Rpb24gKHN0YXJ0aW5nU2NvcGVzOiBudW1iZXJbXSwgdGFnczogbnVtYmVyW10pIHtcclxuICAgICAgICBjb25zdCBzY29wZXMgPSBzdGFydGluZ1Njb3Blcy5zbGljZSgpO1xyXG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGFncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCB0YWcgPSB0YWdzW2ldO1xyXG4gICAgICAgICAgICBpZiAodGFnIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCh0YWcgJSAyKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBzY29wZXMucHVzaCh0YWcpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGluZ1N0YXJ0VGFnID0gdGFnICsgMTtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGVzLnBvcCgpID09PSBtYXRjaGluZ1N0YXJ0VGFnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFjayB0byBlbnN1cmUgdGhhdCBhbGwgbGluZXMgYWx3YXlzIGdldCB0aGUgcHJvcGVyIHNvdXJjZSBsaW5lcy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3Blcy5wdXNoKDxhbnk+Z3JhbW1hci5zdGFydElkRm9yU2NvcGUoYC4ke2dyYW1tYXIuc2NvcGVOYW1lfWApKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIkVuY291bnRlcmVkIGFuIHVubWF0Y2hlZCBzY29wZSBlbmQgdGFnLlwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IGVkaXRvci5idWZmZXIuZ2V0UGF0aCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW1tYXJTY29wZU5hbWU6IGdyYW1tYXIuc2NvcGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bm1hdGNoZWRFbmRUYWc6IGdyYW1tYXIuc2NvcGVGb3JJZCh0YWcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnNldFJlc3BvbnNlcyhbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodW51c2VkQ29kZVJvd3MgJiYgaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bnVzZWRDb2RlUm93cy5nZXQoZWRpdG9yLmdldFBhdGgoKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRha2UoMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShyb3dzID0+ICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0UmVzcG9uc2VzKGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCByb3dzLCBbXSkpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzY29wZXM7XHJcbiAgICB9O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUhpZ2hsaWdodGluZ0dyYW1tYXIgZXh0ZW5kcyBGaXJzdE1hdGUuR3JhbW1hciB7XHJcbiAgICBpc09ic2VydmVSZXRva2VuaXppbmc6IFN1YmplY3Q8Ym9vbGVhbj47XHJcbiAgICBsaW5lc1RvRmV0Y2g6IG51bWJlcltdO1xyXG4gICAgbGluZXNUb1Rva2VuaXplOiBudW1iZXJbXTtcclxuICAgIHJlc3BvbnNlczogTWFwPG51bWJlciwgTW9kZWxzLkhpZ2hsaWdodFNwYW5bXT47XHJcbiAgICBmdWxseVRva2VuaXplZDogYm9vbGVhbjtcclxuICAgIHNjb3BlTmFtZTogc3RyaW5nO1xyXG59XHJcblxyXG5jbGFzcyBHcmFtbWFyIHtcclxuICAgIHB1YmxpYyBpc09ic2VydmVSZXRva2VuaXppbmc6IFJlcGxheVN1YmplY3Q8Ym9vbGVhbj47XHJcbiAgICBwdWJsaWMgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3I7XHJcbiAgICBwdWJsaWMgbGluZXNUb0ZldGNoOiBhbnlbXTtcclxuICAgIHB1YmxpYyBsaW5lc1RvVG9rZW5pemU6IGFueVtdO1xyXG4gICAgcHVibGljIGFjdGl2ZUZyYW1ld29yazogYW55O1xyXG4gICAgcHVibGljIHJlc3BvbnNlczogTWFwPG51bWJlciwgTW9kZWxzLkhpZ2hsaWdodFNwYW5bXT47XHJcbiAgICBwdWJsaWMgX2dpZCA9IHVuaXF1ZUlkKFwib2dcIik7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGJhc2U6IEZpcnN0TWF0ZS5HcmFtbWFyLCBvcHRpb25zOiB7IHJlYWRvbmx5OiBib29sZWFuIH0pIHtcclxuICAgICAgICB0aGlzLmlzT2JzZXJ2ZVJldG9rZW5pemluZyA9IG5ldyBSZXBsYXlTdWJqZWN0PGJvb2xlYW4+KDEpO1xyXG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XHJcblxyXG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xyXG4gICAgICAgIHRoaXMucmVzcG9uc2VzID0gbmV3IE1hcDxudW1iZXIsIE1vZGVscy5IaWdobGlnaHRTcGFuW10+KCk7XHJcbiAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZSA9IFtdO1xyXG4gICAgICAgIHRoaXMuYWN0aXZlRnJhbWV3b3JrID0ge307XHJcblxyXG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAhb3B0aW9ucy5yZWFkb25seSkge1xyXG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkucHJlZW1wdERpZENoYW5nZSgoZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB7b2xkUmFuZ2UsIG5ld1JhbmdlfSA9IGU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnQ6IG51bWJlciA9IG9sZFJhbmdlLnN0YXJ0LnJvdyxcclxuICAgICAgICAgICAgICAgICAgICBkZWx0YTogbnVtYmVyID0gbmV3UmFuZ2UuZW5kLnJvdyAtIG9sZFJhbmdlLmVuZC5yb3c7XHJcblxyXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBzdGFydCAtIDU7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgZW5kID0gZWRpdG9yLmJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSByYW5nZShzdGFydCwgZW5kICsgMSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmtleXMoKS5uZXh0KCkuZG9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb0ZldGNoLnB1c2goLi4ubGluZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUxpbmUgPSB0aGlzLnJlc3BvbnNlcy5nZXQobGluZXNbMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZUxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkRnJvbSA9IG9sZFJhbmdlLnN0YXJ0LmNvbHVtbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zyb20gPSBuZXdSYW5nZS5zdGFydC5jb2x1bW47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmUocmVzcG9uc2VMaW5lLCAoc3BhbjogTW9kZWxzLkhpZ2hsaWdodFNwYW4pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0TGluZSA8IGxpbmVzWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydENvbHVtbiA+PSBvbGRGcm9tIHx8IHNwYW4uRW5kQ29sdW1uID49IG9sZEZyb20pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG5ld0Zyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gbmV3RnJvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGVhY2gobGluZXMsIGxpbmUgPT4geyB0aGlzLnJlc3BvbnNlcy5kZWxldGUobGluZSk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkZWx0YSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBOZXcgbGluZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gZWRpdG9yLmdldExpbmVDb3VudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBjb3VudCAtIDE7IGkgPiBlbmQ7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaSArIGRlbHRhLCB0aGlzLnJlc3BvbnNlcy5nZXQoaSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZWx0YSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmVkIGxpbmVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNEZWx0YSA9IE1hdGguYWJzKGRlbHRhKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZW5kOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkgKyBhYnNEZWx0YSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpLCB0aGlzLnJlc3BvbnNlcy5nZXQoaSArIGFic0RlbHRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5kZWxldGUoaSArIGFic0RlbHRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRSZXNwb25zZXModmFsdWU6IE1vZGVscy5IaWdobGlnaHRTcGFuW10sIGVuYWJsZUV4Y2x1ZGVDb2RlOiBib29sZWFuKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGNoYWluKHZhbHVlKTtcclxuXHJcbiAgICAgICAgY29uc3QgZ3JvdXBlZEl0ZW1zID0gPGFueT5yZXN1bHRzLm1hcChoaWdobGlnaHQgPT4gcmFuZ2UoaGlnaGxpZ2h0LlN0YXJ0TGluZSwgaGlnaGxpZ2h0LkVuZExpbmUgKyAxKVxyXG4gICAgICAgICAgICAubWFwKGxpbmUgPT4gKHsgbGluZSwgaGlnaGxpZ2h0IH0pKSlcclxuICAgICAgICAgICAgLmZsYXR0ZW48eyBsaW5lOiBudW1iZXI7IGhpZ2hsaWdodDogTW9kZWxzLkhpZ2hsaWdodFNwYW4gfT4oKVxyXG4gICAgICAgICAgICAuZ3JvdXBCeSh6ID0+IHoubGluZSlcclxuICAgICAgICAgICAgLnZhbHVlKCk7XHJcblxyXG4gICAgICAgIGVhY2goZ3JvdXBlZEl0ZW1zLCAoaXRlbTogeyBoaWdobGlnaHQ6IE1vZGVscy5IaWdobGlnaHRTcGFuIH1bXSwga2V5OiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgbGV0IGsgPSAra2V5LCBtYXBwZWRJdGVtID0gaXRlbS5tYXAoeCA9PiB4LmhpZ2hsaWdodCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWVuYWJsZUV4Y2x1ZGVDb2RlIHx8IHNvbWUobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIikgJiYgZXZlcnkobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwiZXhjbHVkZWQgY29kZVwiIHx8IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSkge1xyXG4gICAgICAgICAgICAgICAgbWFwcGVkSXRlbSA9IG1hcHBlZEl0ZW0uZmlsdGVyKHogPT4gei5LaW5kICE9PSBcImV4Y2x1ZGVkIGNvZGVcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMuaGFzKGspKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGspO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZS5sZW5ndGggIT09IG1hcHBlZEl0ZW0ubGVuZ3RoIHx8IHNvbWUocmVzcG9uc2VMaW5lLCAobCwgaSkgPT4gIWlzRXF1YWwobCwgbWFwcGVkSXRlbVtpXSkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplLnB1c2goayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbi8qIHRzbGludDpkaXNhYmxlOm1lbWJlci1hY2Nlc3MgKi9cclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5leHRlbmQoR3JhbW1hci5wcm90b3R5cGUsIEF0b21HcmFtbWFyLnByb3RvdHlwZSk7XHJcblxyXG5HcmFtbWFyLnByb3RvdHlwZVtcIm9tbmlzaGFycFwiXSA9IHRydWU7XHJcbkdyYW1tYXIucHJvdG90eXBlW1widG9rZW5pemVMaW5lXCJdID0gZnVuY3Rpb24gKGxpbmU6IHN0cmluZywgcnVsZVN0YWNrOiBhbnlbXSwgZmlyc3RMaW5lID0gZmFsc2UpOiB7IHRhZ3M6IG51bWJlcltdOyBydWxlU3RhY2s6IGFueSB9IHtcclxuICAgIGNvbnN0IGJhc2VSZXN1bHQgPSBBdG9tR3JhbW1hci5wcm90b3R5cGUudG9rZW5pemVMaW5lLmNhbGwodGhpcywgbGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUpO1xyXG4gICAgbGV0IHRhZ3M6IGFueVtdO1xyXG5cclxuICAgIGlmICh0aGlzLnJlc3BvbnNlcykge1xyXG4gICAgICAgIGNvbnN0IHJvdyA9IHRoaXNbXCJfX3Jvd19fXCJdO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmhhcyhyb3cpKSByZXR1cm4gYmFzZVJlc3VsdDtcclxuXHJcbiAgICAgICAgY29uc3QgaGlnaGxpZ2h0cyA9IHRoaXMucmVzcG9uc2VzLmdldChyb3cpO1xyXG4gICAgICAgIC8vIEV4Y2x1ZGVkIGNvZGUgYmxvd3MgYXdheSBhbnkgb3RoZXIgZm9ybWF0dGluZywgb3RoZXJ3aXNlIHdlIGdldCBpbnRvIGEgdmVyeSB3ZWlyZCBzdGF0ZS5cclxuICAgICAgICBpZiAoaGlnaGxpZ2h0c1swXSAmJiBoaWdobGlnaHRzWzBdLktpbmQgPT09IFwiZXhjbHVkZWQgY29kZVwiKSB7XHJcbiAgICAgICAgICAgIHRhZ3MgPSBbbGluZS5sZW5ndGhdO1xyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodHNbMF0sIDAsIHRhZ3MubGVuZ3RoIC0gMSwgbGluZSk7XHJcbiAgICAgICAgICAgIGJhc2VSZXN1bHQucnVsZVN0YWNrID0gW2Jhc2VSZXN1bHQucnVsZVN0YWNrWzBdXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0YWdzID0gdGhpcy5nZXRDc1Rva2Vuc0ZvckxpbmUoaGlnaGxpZ2h0cywgbGluZSwgcm93LCBydWxlU3RhY2ssIGZpcnN0TGluZSwgYmFzZVJlc3VsdC50YWdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYmFzZVJlc3VsdC50YWdzID0gdGFncztcclxuICAgIH1cclxuICAgIHJldHVybiBiYXNlUmVzdWx0O1xyXG59O1xyXG5cclxuKEdyYW1tYXIucHJvdG90eXBlIGFzIGFueSkuZ2V0Q3NUb2tlbnNGb3JMaW5lID0gZnVuY3Rpb24gKGhpZ2hsaWdodHM6IE1vZGVscy5IaWdobGlnaHRTcGFuW10sIGxpbmU6IHN0cmluZywgcm93OiBudW1iZXIsIHJ1bGVTdGFjazogYW55W10sIGZpcnN0TGluZTogYm9vbGVhbiwgdGFnczogbnVtYmVyW10pIHtcclxuICAgIHJ1bGVTdGFjayA9IFt7IHJ1bGU6IHRoaXMuZ2V0SW5pdGlhbFJ1bGUoKSB9XTtcclxuXHJcbiAgICBlYWNoKGhpZ2hsaWdodHMsIChoaWdobGlnaHQpID0+IHtcclxuICAgICAgICBjb25zdCBzdGFydCA9IGhpZ2hsaWdodC5TdGFydENvbHVtbiAtIDE7XHJcbiAgICAgICAgY29uc3QgZW5kID0gaGlnaGxpZ2h0LkVuZENvbHVtbiAtIDE7XHJcblxyXG4gICAgICAgIGlmIChoaWdobGlnaHQuRW5kTGluZSA+IGhpZ2hsaWdodC5TdGFydExpbmUgJiYgaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uID09PSAwICYmIGhpZ2hsaWdodC5FbmRDb2x1bW4gPT09IDApIHtcclxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIDAsIHRhZ3MubGVuZ3RoIC0gMSwgbGluZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkaXN0YW5jZSA9IC0xO1xyXG4gICAgICAgIGxldCBpbmRleCA9IC0xO1xyXG4gICAgICAgIGxldCBpOiBudW1iZXI7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgKyB0YWdzW2ldID4gc3RhcnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkaXN0YW5jZSArPSB0YWdzW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzdHIgPSBsaW5lLnN1YnN0cmluZyhzdGFydCwgZW5kKTtcclxuICAgICAgICBjb25zdCBzaXplID0gZW5kIC0gc3RhcnQ7XHJcbiAgICAgICAgaWYgKHRhZ3NbaW5kZXhdID49IHNpemUpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlczogbnVtYmVyW107XHJcbiAgICAgICAgICAgIGxldCBwcmV2OiBudW1iZXIsIG5leHQ6IG51bWJlcjtcclxuICAgICAgICAgICAgaWYgKGRpc3RhbmNlID09PSBzdGFydCkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWVzID0gW3NpemUsIHRhZ3NbaW5kZXhdIC0gc2l6ZV07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwcmV2ID0gc3RhcnQgLSBkaXN0YW5jZTtcclxuICAgICAgICAgICAgICAgIG5leHQgPSB0YWdzW2luZGV4XSAtIHNpemUgLSBwcmV2O1xyXG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gW3ByZXYsIHNpemUsIHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXZdO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbcHJldiwgc2l6ZV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGFncy5zcGxpY2UoaW5kZXgsIDEsIC4uLnZhbHVlcyk7XHJcbiAgICAgICAgICAgIGlmIChwcmV2KSBpbmRleCA9IGluZGV4ICsgMTtcclxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGluZGV4LCBpbmRleCArIDEsIHN0cik7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0YWdzW2luZGV4XSA8IHNpemUpIHtcclxuICAgICAgICAgICAgbGV0IGJhY2t0cmFja0luZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tEaXN0YW5jZSA9IDA7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IGJhY2t0cmFja0luZGV4OyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrRGlzdGFuY2UgKz0gdGFnc1tpXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYmFja3RyYWNrRGlzdGFuY2UgPj0gc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGkgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgZm9yd2FyZHRyYWNrSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgbGV0IHJlbWFpbmluZ1NpemUgPSBzaXplO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSBpbmRleCArIDE7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHJlbWFpbmluZ1NpemUgPD0gMCAmJiB0YWdzW2ldID4gMCkvKiB8fCB0YWdzW2ldICUgMiA9PT0gLTEqLykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gaSAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmdTaXplIC09IHRhZ3NbaV07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSGFuZGxlcyBjYXNlIHdoZXJlIHRoZXJlIGlzIGEgY2xvc2luZyB0YWdcclxuICAgICAgICAgICAgICAgICAgICAvLyBidXQgbm8gb3BlbmluZyB0YWcgaGVyZS5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgb3BlbkZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IGk7IGggPj0gMDsgaC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWdzW2hdID09PSB0YWdzW2ldICsgMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghb3BlbkZvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gaSAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGkgPT09IHRhZ3MubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IHRhZ3MubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGJhY2t0cmFja0luZGV4LCBmb3J3YXJkdHJhY2tJbmRleCwgc3RyKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdGFncztcclxufTtcclxuXHJcbmNvbnN0IGdldElkRm9yU2NvcGUgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgaWRzOiB7IFtrZXk6IHN0cmluZ106IHsgW2tleTogc3RyaW5nXTogbnVtYmVyIH07IH0gPSB7fTtcclxuICAgIGNvbnN0IGdyYW1tYXJzOiBhbnkgPSB7fTtcclxuXHJcbiAgICBmdW5jdGlvbiBidWlsZFNjb3Blc0ZvckdyYW1tYXIoZ3JhbW1hck5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSBmaW5kKGF0b20uZ3JhbW1hcnMuZ2V0R3JhbW1hcnMoKSwgZ2FtbXIgPT4gZ2FtbXIubmFtZSA9PT0gZ3JhbW1hck5hbWUpO1xyXG4gICAgICAgIGlmICghZ3JhbW1hcikgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZHNbZ3JhbW1hci5uYW1lXSA9IHt9O1xyXG4gICAgICAgIGdyYW1tYXJzW2dyYW1tYXIubmFtZV0gPSBncmFtbWFyO1xyXG5cclxuICAgICAgICBlYWNoKGdyYW1tYXIucmVnaXN0cnkuc2NvcGVzQnlJZCwgKHZhbHVlOiBzdHJpbmcsIGtleTogYW55KSA9PiB7IGlkc1tncmFtbWFyLm5hbWVdW3ZhbHVlXSA9ICtrZXk7IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1ldGhvZCA9IChncmFtbWFyOiBzdHJpbmcsIHNjb3BlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXSkge1xyXG4gICAgICAgICAgICBidWlsZFNjb3Blc0ZvckdyYW1tYXIoZ3JhbW1hcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXVtzY29wZV0pXHJcbiAgICAgICAgICAgIGlkc1tncmFtbWFyXVtzY29wZV0gPSBncmFtbWFyc1tncmFtbWFyXS5yZWdpc3RyeS5zdGFydElkRm9yU2NvcGUoc2NvcGUpO1xyXG5cclxuICAgICAgICByZXR1cm4gK2lkc1tncmFtbWFyXVtzY29wZV07XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55Pm1ldGhvZCkuZW5kID0gKHNjb3BlOiBudW1iZXIpID0+ICtzY29wZSAtIDE7XHJcblxyXG4gICAgcmV0dXJuIDx7IChncmFtbWFyOiBzdHJpbmcsIHNjb3BlOiBzdHJpbmcpOiBudW1iZXI7IGVuZDogKHNjb3BlOiBudW1iZXIpID0+IG51bWJlcjsgfT5tZXRob2Q7XHJcbn0pKCk7XHJcblxyXG5cclxuLy8vIE5PVEU6IGJlc3Qgd2F5IEkgaGF2ZSBmb3VuZCBmb3IgdGhlc2UgaXMgdG8ganVzdCBsb29rIGF0IHRoZW1lIFwibGVzc1wiIGZpbGVzXHJcbi8vIEFsdGVybmF0aXZlbHkganVzdCBpbnNwZWN0IHRoZSB0b2tlbiBmb3IgYSAuanMgZmlsZVxyXG5mdW5jdGlvbiBnZXRBdG9tU3R5bGVGb3JUb2tlbihncmFtbWFyOiBzdHJpbmcsIHRhZ3M6IG51bWJlcltdLCB0b2tlbjogTW9kZWxzLkhpZ2hsaWdodFNwYW4sIGluZGV4OiBudW1iZXIsIGluZGV4RW5kOiBudW1iZXIsIHN0cjogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBwcmV2aW91c1Njb3BlczogYW55W10gPSBbXTtcclxuICAgIGZvciAobGV0IGkgPSBpbmRleCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKHRhZ3NbaV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlcGxhY2VtZW50czogeyBzdGFydDogbnVtYmVyOyBlbmQ6IG51bWJlcjsgcmVwbGFjZW1lbnQ6IG51bWJlcltdIH1bXSA9IFtdO1xyXG4gICAgY29uc3Qgb3BlbnM6IHsgdGFnOiBudW1iZXI7IGluZGV4OiBudW1iZXIgfVtdID0gW107XHJcbiAgICBjb25zdCBjbG9zZXM6IHR5cGVvZiBvcGVucyA9IFtdO1xyXG5cclxuICAgIC8vIFNjYW4gZm9yIGFueSB1bmNsb3NlZCBvciB1bm9wZW5lZCB0YWdzXHJcbiAgICBmb3IgKGxldCBpID0gaW5kZXg7IGkgPCBpbmRleEVuZDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSBjb250aW51ZTtcclxuICAgICAgICBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgY29uc3Qgb3BlbkluZGV4ID0gZmluZEluZGV4KG9wZW5zLCB4ID0+IHgudGFnID09PSAodGFnc1tpXSArIDEpKTtcclxuICAgICAgICAgICAgaWYgKG9wZW5JbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBvcGVucy5zcGxpY2Uob3BlbkluZGV4LCAxKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNsb3Nlcy5wdXNoKHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG9wZW5zLnVuc2hpZnQoeyB0YWc6IHRhZ3NbaV0sIGluZGV4OiBpIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBsZXQgdW5mdWxsZmlsbGVkOiB0eXBlb2Ygb3BlbnMgPSBbXTtcclxuICAgIGlmIChjbG9zZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHVuZnVsbGZpbGxlZCA9IHNvcnRCeShvcGVucy5jb25jYXQoY2xvc2VzKSwgeCA9PiB4LmluZGV4KTtcclxuICAgIH0gZWxzZSBpZiAob3BlbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIC8vIEdyYWIgdGhlIGxhc3Qga25vd24gb3BlbiwgYW5kIGFwcGVuZCBmcm9tIHRoZXJlXHJcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xyXG4gICAgICAgICAgICBzdGFydDogb3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKG9wZW5zW29wZW5zLmxlbmd0aCAtIDFdLmluZGV4LCBpbmRleEVuZCArIDEpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGludGVybmFsSW5kZXggPSBpbmRleDtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdW5mdWxsZmlsbGVkLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgdiA9IHVuZnVsbGZpbGxlZFtpXTtcclxuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBpbnRlcm5hbEluZGV4LFxyXG4gICAgICAgICAgICBlbmQ6IHYuaW5kZXgsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGludGVybmFsSW5kZXgsIHYuaW5kZXgpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaW50ZXJuYWxJbmRleCA9IHYuaW5kZXggKyAxO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXBsYWNlbWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xyXG4gICAgICAgICAgICBzdGFydDogaW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGluZGV4LCBpbmRleEVuZClcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLypyZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBpbnRlcm5hbEluZGV4LFxyXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxyXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbnRlcm5hbEluZGV4LCBpbmRleEVuZClcclxuICAgICAgICB9KTsqL1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFkZChzY29wZTogYW55KSB7XHJcbiAgICAgICAgY29uc3QgaWQgPSBnZXRJZEZvclNjb3BlKGdyYW1tYXIsIHNjb3BlKTtcclxuICAgICAgICBpZiAoaWQgPT09IC0xKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICghc29tZShwcmV2aW91c1Njb3BlcywgeiA9PiB6ID09PSBpZCkpIHtcclxuICAgICAgICAgICAgcHJldmlvdXNTY29wZXMucHVzaChpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVhY2gocmVwbGFjZW1lbnRzLCBjdHggPT4ge1xyXG4gICAgICAgICAgICBjb25zdCByZXBsYWNlbWVudCA9IGN0eC5yZXBsYWNlbWVudDtcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQudW5zaGlmdChpZCk7XHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50LnB1c2goZ2V0SWRGb3JTY29wZS5lbmQoaWQpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHN3aXRjaCAodG9rZW4uS2luZCkge1xyXG4gICAgICAgIGNhc2UgXCJudW1iZXJcIjpcclxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5udW1lcmljYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJzdHJ1Y3QgbmFtZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY29uc3RhbnQubnVtZXJpYy5pZGVudGlmaWVyLnN0cnVjdGApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiZW51bSBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuZW51bWApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiaWRlbnRpZmllclwiOlxyXG4gICAgICAgICAgICBhZGQoYGlkZW50aWZpZXJgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImNsYXNzIG5hbWVcIjpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllcmApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiZGVsZWdhdGUgbmFtZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmRlbGVnYXRlYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJpbnRlcmZhY2UgbmFtZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmludGVyZmFjZWApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIjpcclxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5vdGhlci5zeW1ib2xgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImV4Y2x1ZGVkIGNvZGVcIjpcclxuICAgICAgICAgICAgYWRkKGBjb21tZW50LmJsb2NrYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJ1bnVzZWQgY29kZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHVudXNlZGApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVuaGFuZGxlZCBLaW5kIFwiICsgdG9rZW4uS2luZCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICAgIGVhY2gocmVwbGFjZW1lbnRzLCBjdHggPT4ge1xyXG4gICAgICAgIGNvbnN0IHtyZXBsYWNlbWVudCwgZW5kLCBzdGFydH0gPSBjdHg7XHJcbiAgICAgICAgaWYgKHJlcGxhY2VtZW50Lmxlbmd0aCA9PT0gMikgcmV0dXJuO1xyXG4gICAgICAgIGxldCBudW0gPSBlbmQgLSBzdGFydDtcclxuICAgICAgICBpZiAobnVtIDw9IDApIHtcclxuICAgICAgICAgICAgbnVtID0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGFncy5zcGxpY2Uoc3RhcnQsIG51bSwgLi4ucmVwbGFjZW1lbnQpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldEdyYW1tYXIoZ3JhbW1hcjogRmlyc3RNYXRlLkdyYW1tYXIpOiBGaXJzdE1hdGUuR3JhbW1hciB7XHJcbiAgICBjb25zdCBnMiA9IGdldEVuaGFuY2VkR3JhbW1hcih0aGlzLCBncmFtbWFyKTtcclxuICAgIGlmIChnMiAhPT0gZ3JhbW1hcilcclxuICAgICAgICB0aGlzLl9zZXRHcmFtbWFyKGcyKTtcclxuICAgIHJldHVybiBnMjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEVuaGFuY2VkR3JhbW1hcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgZ3JhbW1hcj86IEZpcnN0TWF0ZS5HcmFtbWFyLCBvcHRpb25zPzogeyByZWFkb25seTogYm9vbGVhbiB9KSB7XHJcbiAgICBpZiAoIWdyYW1tYXIpIGdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xyXG4gICAgaWYgKCFncmFtbWFyW1wib21uaXNoYXJwXCJdICYmIE9tbmkuaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcikpIHtcclxuICAgICAgICBjb25zdCBuZXdHcmFtbWFyID0gbmV3IEdyYW1tYXIoZWRpdG9yLCBncmFtbWFyLCBvcHRpb25zKTtcclxuICAgICAgICBlYWNoKGdyYW1tYXIsICh4LCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChoYXMoZ3JhbW1hciwgaSkpIHtcclxuICAgICAgICAgICAgICAgIG5ld0dyYW1tYXJbaV0gPSB4O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZ3JhbW1hciA9IDxhbnk+bmV3R3JhbW1hcjtcclxuICAgIH1cclxuICAgIHJldHVybiBncmFtbWFyO1xyXG59XHJcblxyXG4vLyBVc2VkIHRvIGNhY2hlIHZhbHVlcyBmb3Igc3BlY2lmaWMgZWRpdG9yc1xyXG5jbGFzcyBVbnVzZWRNYXAge1xyXG4gICAgcHJpdmF0ZSBfbWFwID0gbmV3IE1hcDxzdHJpbmcsIE9ic2VydmFibGU8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPj4oKTtcclxuICAgIHB1YmxpYyBnZXQoa2V5OiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX21hcC5oYXMoa2V5KSkgdGhpcy5fbWFwLnNldChrZXksIDxhbnk+bmV3IEJlaGF2aW9yU3ViamVjdDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KFtdKSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC5nZXQoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRPYnNlcnZlcihrZXk6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiA8U3Vic2NyaWJlcjxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+ICYgeyBnZXRWYWx1ZSgpOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10gfT48YW55PnRoaXMuZ2V0KGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldChrZXk6IHN0cmluZywgdmFsdWU/OiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10pIHtcclxuICAgICAgICBjb25zdCBvID0gdGhpcy5fZ2V0T2JzZXJ2ZXIoa2V5KTtcclxuICAgICAgICBpZiAoIWlzRXF1YWwoby5nZXRWYWx1ZSgpLCB2YWx1ZSkpIHtcclxuICAgICAgICAgICAgby5uZXh0KHZhbHVlIHx8IFtdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlbGV0ZShrZXk6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLl9tYXAuaGFzKGtleSkpXHJcbiAgICAgICAgICAgIHRoaXMuX21hcC5kZWxldGUoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fbWFwLmNsZWFyKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBlbmhhbmNlZEhpZ2hsaWdodGluZzE5ID0gbmV3IEhpZ2hsaWdodDtcclxuIiwiaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgaXNPbW5pc2hhcnBUZXh0RWRpdG9yIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcbmltcG9ydCB7IGVhY2gsIGV4dGVuZCwgaGFzLCBzb21lLCByYW5nZSwgcmVtb3ZlLCBwdWxsLCBmaW5kLCBjaGFpbiwgdW5pcSwgZmluZEluZGV4LCBldmVyeSwgaXNFcXVhbCwgbWluLCBkZWJvdW5jZSwgc29ydEJ5LCB1bmlxdWVJZCwgZmlsdGVyIH0gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCwgUmVwbGF5U3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IHJlZ2lzdGVyQ29udGV4dEl0ZW0gfSBmcm9tIFwiLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xuY29uc3QgQXRvbUdyYW1tYXIgPSByZXF1aXJlKGF0b20uY29uZmlnLnJlc291cmNlUGF0aCArIFwiL25vZGVfbW9kdWxlcy9maXJzdC1tYXRlL2xpYi9ncmFtbWFyLmpzXCIpO1xuY29uc3QgREVCT1VOQ0VfVElNRSA9IDI0MDtcbmxldCBmYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XG5jb25zdCBISUdITElHSFQgPSBcIkhJR0hMSUdIVFwiLCBISUdITElHSFRfUkVRVUVTVCA9IFwiSElHSExJR0hUX1JFUVVFU1RcIjtcbmZ1bmN0aW9uIGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhwYXRoLCBxdWlja0ZpeGVzLCBwcm9qZWN0TmFtZXMpIHtcbiAgICByZXR1cm4gY2hhaW4ocXVpY2tGaXhlcylcbiAgICAgICAgLmZpbHRlcih4ID0+IHguRmlsZU5hbWUgPT09IHBhdGgpXG4gICAgICAgIC5tYXAoeCA9PiAoe1xuICAgICAgICBTdGFydExpbmU6IHguTGluZSxcbiAgICAgICAgU3RhcnRDb2x1bW46IHguQ29sdW1uLFxuICAgICAgICBFbmRMaW5lOiB4LkVuZExpbmUsXG4gICAgICAgIEVuZENvbHVtbjogeC5FbmRDb2x1bW4sXG4gICAgICAgIEtpbmQ6IFwidW51c2VkIGNvZGVcIixcbiAgICAgICAgUHJvamVjdHM6IHByb2plY3ROYW1lc1xuICAgIH0pKVxuICAgICAgICAudmFsdWUoKTtcbn1cbmV4cG9ydCBjb25zdCBFeGNsdWRlQ2xhc3NpZmljYXRpb25zID0gW1xuICAgIDIsXG4gICAgMyxcbiAgICA1LFxuICAgIDQsXG4gICAgNlxuXTtcbmNsYXNzIEhpZ2hsaWdodCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MgPSBuZXcgVW51c2VkTWFwKCk7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiRW5oYW5jZWQgSGlnaGxpZ2h0aW5nXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkVuYWJsZXMgc2VydmVyIGJhc2VkIGhpZ2hsaWdodGluZywgd2hpY2ggaW5jbHVkZXMgc3VwcG9ydCBmb3Igc3RyaW5nIGludGVycG9sYXRpb24sIGNsYXNzIG5hbWVzIGFuZCBtb3JlLlwiO1xuICAgICAgICB0aGlzLmRlZmF1bHQgPSBmYWxzZTtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIGlmICghKE9tbmkuYXRvbVZlcnNpb24ubWlub3IgIT09IDEgfHwgT21uaS5hdG9tVmVyc2lvbi5taW5vciA+IDgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5lZGl0b3JzID0gW107XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQocmVnaXN0ZXJDb250ZXh0SXRlbShISUdITElHSFRfUkVRVUVTVCwgKGNvbnRleHQpID0+IG5ldyBTdWJqZWN0KCkpLCByZWdpc3RlckNvbnRleHRJdGVtKEhJR0hMSUdIVCwgKGNvbnRleHQsIGVkaXRvcikgPT4gY29udGV4dC5nZXQoSElHSExJR0hUX1JFUVVFU1QpXG4gICAgICAgICAgICAuc3RhcnRXaXRoKHRydWUpXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMClcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAoKCkgPT4gT2JzZXJ2YWJsZS5kZWZlcigoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0cyA9IGNvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZSA9PT0gXCJhbGxcIiA/IFtdIDogW2NvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZV07XG4gICAgICAgICAgICBsZXQgbGluZXNUb0ZldGNoID0gdW5pcShlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCk7XG4gICAgICAgICAgICBpZiAoIWxpbmVzVG9GZXRjaCB8fCAhbGluZXNUb0ZldGNoLmxlbmd0aClcbiAgICAgICAgICAgICAgICBsaW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QodGhpcy51bnVzZWRDb2RlUm93cy5nZXQoZWRpdG9yLmdldFBhdGgoKSksIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmhpZ2hsaWdodCh7XG4gICAgICAgICAgICAgICAgUHJvamVjdE5hbWVzOiBwcm9qZWN0cyxcbiAgICAgICAgICAgICAgICBMaW5lczogbGluZXNUb0ZldGNoLFxuICAgICAgICAgICAgICAgIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnM6IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnNcbiAgICAgICAgICAgIH0pKSwgKHF1aWNrZml4ZXMsIHJlc3BvbnNlKSA9PiAoe1xuICAgICAgICAgICAgICAgIGVkaXRvcixcbiAgICAgICAgICAgICAgICBwcm9qZWN0cyxcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRzOiBnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMoZWRpdG9yLmdldFBhdGgoKSwgcXVpY2tmaXhlcywgcHJvamVjdHMpLmNvbmNhdChyZXNwb25zZSA/IHJlc3BvbnNlLkhpZ2hsaWdodHMgOiBbXSlcbiAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgIC5kbygoeyBoaWdobGlnaHRzIH0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5zZXRSZXNwb25zZXMoaGlnaGxpZ2h0cywgcHJvamVjdHMubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKVxuICAgICAgICAgICAgICAgIC5yZWZDb3VudCgpO1xuICAgICAgICB9KSkpLCBPbW5pLmxpc3RlbmVyLm1vZGVsLmRpYWdub3N0aWNzQnlGaWxlXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGNoYW5nZXMgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgW2ZpbGUsIGRpYWdub3N0aWNzXSBvZiBjaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5zZXQoZmlsZSwgZmlsdGVyKGRpYWdub3N0aWNzLCB4ID0+IHguTG9nTGV2ZWwgPT09IFwiSGlkZGVuXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksIE9tbmkuZWFjaEVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXR1cEVkaXRvcihlZGl0b3IsIGNkKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub21uaXNoYXJwXG4gICAgICAgICAgICAgICAgLmdldChISUdITElHSFQpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5nZXQoSElHSExJR0hUX1JFUVVFU1QpLm5leHQodHJ1ZSk7XG4gICAgICAgIH0pLCBPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5nZXQoSElHSExJR0hUX1JFUVVFU1QpLm5leHQodHJ1ZSk7XG4gICAgICAgICAgICBpZiAoZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSkge1xuICAgICAgICAgICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MuY2xlYXIoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICBpZiAodGhpcy5kaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldHVwRWRpdG9yKGVkaXRvciwgZGlzcG9zYWJsZSkge1xuICAgICAgICBpZiAoZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0gfHwgIWVkaXRvci5nZXRHcmFtbWFyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBpc3N1ZVJlcXVlc3QgPSBlZGl0b3Iub21uaXNoYXJwLmdldChISUdITElHSFRfUkVRVUVTVCk7XG4gICAgICAgIGF1Z21lbnRFZGl0b3IoZWRpdG9yLCB0aGlzLnVudXNlZENvZGVSb3dzLCB0cnVlKTtcbiAgICAgICAgdGhpcy5lZGl0b3JzLnB1c2goZWRpdG9yKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNwb3NhYmxlKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5saW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcigpLnJlc3BvbnNlcylcbiAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnJlc3BvbnNlcy5jbGVhcigpO1xuICAgICAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5yZXRva2VuaXplTGluZXMoKTtcbiAgICAgICAgICAgIGRlbGV0ZSBlZGl0b3JbXCJfb2xkR3JhbW1hclwiXTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgICAgICAgcHVsbCh0aGlzLmVkaXRvcnMsIGVkaXRvcik7XG4gICAgICAgIH0pKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9tbmlzaGFycC5wcm9qZWN0XG4gICAgICAgICAgICAub2JzZXJ2ZS5hY3RpdmVGcmFtZXdvcmtcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5saW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcigpLnJlc3BvbnNlcylcbiAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnJlc3BvbnNlcy5jbGVhcigpO1xuICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKCgpID0+IGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpKSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFNhdmUoKCkgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5saW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb25cbiAgICAgICAgICAgIC53aGVuQ29ubmVjdGVkKClcbiAgICAgICAgICAgIC5kZWxheSgxMDAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZSh7XG4gICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRFZGl0b3IoZWRpdG9yLCB1bnVzZWRDb2RlUm93cyA9IG51bGwsIGRvU2V0R3JhbW1hciA9IGZhbHNlKSB7XG4gICAgaWYgKCFlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSlcbiAgICAgICAgZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0gPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xuICAgIGlmICghZWRpdG9yW1wiX3NldEdyYW1tYXJcIl0pXG4gICAgICAgIGVkaXRvcltcIl9zZXRHcmFtbWFyXCJdID0gZWRpdG9yLnNldEdyYW1tYXI7XG4gICAgaWYgKCFlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdKVxuICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdID0gZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dDtcbiAgICBpZiAoIWVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdKVxuICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXSA9IGVkaXRvci50b2tlbml6ZWRCdWZmZXIubWFya1Rva2VuaXphdGlvbkNvbXBsZXRlO1xuICAgIGlmICghZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdID0gZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5yZXRva2VuaXplTGluZXM7XG4gICAgaWYgKCFlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX3Rva2VuaXplSW5CYWNrZ3JvdW5kXCJdKVxuICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX3Rva2VuaXplSW5CYWNrZ3JvdW5kXCJdID0gZWRpdG9yLnRva2VuaXplZEJ1ZmZlci50b2tlbml6ZUluQmFja2dyb3VuZDtcbiAgICBpZiAoIWVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfY2h1bmtTaXplXCJdKVxuICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiY2h1bmtTaXplXCJdID0gMjA7XG4gICAgZWRpdG9yLnNldEdyYW1tYXIgPSBzZXRHcmFtbWFyO1xuICAgIGlmIChkb1NldEdyYW1tYXIpXG4gICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpO1xuICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIuYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQgPSBmdW5jdGlvbiAocm93KSB7XG4gICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKClbXCJfX3Jvd19fXCJdID0gcm93O1xuICAgICAgICByZXR1cm4gZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgaWYgKCFlZGl0b3IudG9rZW5pemVkQnVmZmVyLnNpbGVudFJldG9rZW5pemVMaW5lcykge1xuICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnNpbGVudFJldG9rZW5pemVMaW5lcyA9IGRlYm91bmNlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcbiAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KGZhbHNlKTtcbiAgICAgICAgICAgIGxldCBsYXN0Um93O1xuICAgICAgICAgICAgbGFzdFJvdyA9IHRoaXMuYnVmZmVyLmdldExhc3RSb3coKTtcbiAgICAgICAgICAgIHRoaXMudG9rZW5pemVkTGluZXMgPSB0aGlzLmJ1aWxkUGxhY2Vob2xkZXJUb2tlbml6ZWRMaW5lc0ZvclJvd3MoMCwgbGFzdFJvdyk7XG4gICAgICAgICAgICB0aGlzLmludmFsaWRSb3dzID0gW107XG4gICAgICAgICAgICBpZiAodGhpcy5saW5lc1RvVG9rZW5pemUgJiYgdGhpcy5saW5lc1RvVG9rZW5pemUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlUm93KG1pbih0aGlzLmxpbmVzVG9Ub2tlbml6ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlUm93KDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mdWxseVRva2VuaXplZCA9IGZhbHNlO1xuICAgICAgICB9LCBERUJPVU5DRV9USU1FLCB7IGxlYWRpbmc6IHRydWUsIHRyYWlsaW5nOiB0cnVlIH0pO1xuICAgIH1cbiAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyLm1hcmtUb2tlbml6YXRpb25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxuICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dCh0cnVlKTtcbiAgICAgICAgcmV0dXJuIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxuICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dChmYWxzZSk7XG4gICAgICAgIHJldHVybiBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX3JldG9rZW5pemVMaW5lc1wiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci50b2tlbml6ZUluQmFja2dyb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZpc2libGUgfHwgdGhpcy5wZW5kaW5nQ2h1bmsgfHwgIXRoaXMuaXNBbGl2ZSgpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnBlbmRpbmdDaHVuayA9IHRydWU7XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0FsaXZlKCkgJiYgdGhpcy5idWZmZXIuaXNBbGl2ZSgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50b2tlbml6ZU5leHRDaHVuaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIuc2NvcGVzRnJvbVRhZ3MgPSBmdW5jdGlvbiAoc3RhcnRpbmdTY29wZXMsIHRhZ3MpIHtcbiAgICAgICAgY29uc3Qgc2NvcGVzID0gc3RhcnRpbmdTY29wZXMuc2xpY2UoKTtcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0YWdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB0YWcgPSB0YWdzW2ldO1xuICAgICAgICAgICAgaWYgKHRhZyA8IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoKHRhZyAlIDIpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBzY29wZXMucHVzaCh0YWcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hpbmdTdGFydFRhZyA9IHRhZyArIDE7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGVzLnBvcCgpID09PSBtYXRjaGluZ1N0YXJ0VGFnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3Blcy5wdXNoKGdyYW1tYXIuc3RhcnRJZEZvclNjb3BlKGAuJHtncmFtbWFyLnNjb3BlTmFtZX1gKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiRW5jb3VudGVyZWQgYW4gdW5tYXRjaGVkIHNjb3BlIGVuZCB0YWcuXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IGVkaXRvci5idWZmZXIuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFtbWFyU2NvcGVOYW1lOiBncmFtbWFyLnNjb3BlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bm1hdGNoZWRFbmRUYWc6IGdyYW1tYXIuc2NvcGVGb3JJZCh0YWcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5zZXRSZXNwb25zZXMoW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1bnVzZWRDb2RlUm93cyAmJiBpc09tbmlzaGFycFRleHRFZGl0b3IoZWRpdG9yKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bnVzZWRDb2RlUm93cy5nZXQoZWRpdG9yLmdldFBhdGgoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJvd3MgPT4gZWRpdG9yLmdldEdyYW1tYXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFJlc3BvbnNlcyhnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMoZWRpdG9yLmdldFBhdGgoKSwgcm93cywgW10pKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzY29wZXM7XG4gICAgfTtcbn1cbmNsYXNzIEdyYW1tYXIge1xuICAgIGNvbnN0cnVjdG9yKGVkaXRvciwgYmFzZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9naWQgPSB1bmlxdWVJZChcIm9nXCIpO1xuICAgICAgICB0aGlzLmlzT2JzZXJ2ZVJldG9rZW5pemluZyA9IG5ldyBSZXBsYXlTdWJqZWN0KDEpO1xuICAgICAgICB0aGlzLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KHRydWUpO1xuICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgdGhpcy5yZXNwb25zZXMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMubGluZXNUb0ZldGNoID0gW107XG4gICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlRnJhbWV3b3JrID0ge307XG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAhb3B0aW9ucy5yZWFkb25seSkge1xuICAgICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLnByZWVtcHREaWRDaGFuZ2UoKGUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IG9sZFJhbmdlLCBuZXdSYW5nZSB9ID0gZTtcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnQgPSBvbGRSYW5nZS5zdGFydC5yb3csIGRlbHRhID0gbmV3UmFuZ2UuZW5kLnJvdyAtIG9sZFJhbmdlLmVuZC5yb3c7XG4gICAgICAgICAgICAgICAgc3RhcnQgPSBzdGFydCAtIDU7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0IDwgMClcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQgPSAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuZCA9IGVkaXRvci5idWZmZXIuZ2V0TGluZUNvdW50KCkgLSAxO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVzID0gcmFuZ2Uoc3RhcnQsIGVuZCArIDEpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMua2V5cygpLm5leHQoKS5kb25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb0ZldGNoLnB1c2goLi4ubGluZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobGluZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChsaW5lc1swXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZUxpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZEZyb20gPSBvbGRSYW5nZS5zdGFydC5jb2x1bW4sIG5ld0Zyb20gPSBuZXdSYW5nZS5zdGFydC5jb2x1bW47XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmUocmVzcG9uc2VMaW5lLCAoc3BhbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0TGluZSA8IGxpbmVzWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydENvbHVtbiA+PSBvbGRGcm9tIHx8IHNwYW4uRW5kQ29sdW1uID49IG9sZEZyb20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG5ld0Zyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gbmV3RnJvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVhY2gobGluZXMsIGxpbmUgPT4geyB0aGlzLnJlc3BvbnNlcy5kZWxldGUobGluZSk7IH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZGVsdGEgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gZWRpdG9yLmdldExpbmVDb3VudCgpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gY291bnQgLSAxOyBpID4gZW5kOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlc3BvbnNlcy5oYXMoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaSArIGRlbHRhLCB0aGlzLnJlc3BvbnNlcy5nZXQoaSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLmRlbGV0ZShpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkZWx0YSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFic0RlbHRhID0gTWF0aC5hYnMoZGVsdGEpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZW5kOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VzLmhhcyhpICsgYWJzRGVsdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGksIHRoaXMucmVzcG9uc2VzLmdldChpICsgYWJzRGVsdGEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5kZWxldGUoaSArIGFic0RlbHRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFJlc3BvbnNlcyh2YWx1ZSwgZW5hYmxlRXhjbHVkZUNvZGUpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGNoYWluKHZhbHVlKTtcbiAgICAgICAgY29uc3QgZ3JvdXBlZEl0ZW1zID0gcmVzdWx0cy5tYXAoaGlnaGxpZ2h0ID0+IHJhbmdlKGhpZ2hsaWdodC5TdGFydExpbmUsIGhpZ2hsaWdodC5FbmRMaW5lICsgMSlcbiAgICAgICAgICAgIC5tYXAobGluZSA9PiAoeyBsaW5lLCBoaWdobGlnaHQgfSkpKVxuICAgICAgICAgICAgLmZsYXR0ZW4oKVxuICAgICAgICAgICAgLmdyb3VwQnkoeiA9PiB6LmxpbmUpXG4gICAgICAgICAgICAudmFsdWUoKTtcbiAgICAgICAgZWFjaChncm91cGVkSXRlbXMsIChpdGVtLCBrZXkpID0+IHtcbiAgICAgICAgICAgIGxldCBrID0gK2tleSwgbWFwcGVkSXRlbSA9IGl0ZW0ubWFwKHggPT4geC5oaWdobGlnaHQpO1xuICAgICAgICAgICAgaWYgKCFlbmFibGVFeGNsdWRlQ29kZSB8fCBzb21lKG1hcHBlZEl0ZW0sIGkgPT4gaS5LaW5kID09PSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCIpICYmIGV2ZXJ5KG1hcHBlZEl0ZW0sIGkgPT4gaS5LaW5kID09PSBcImV4Y2x1ZGVkIGNvZGVcIiB8fCBpLktpbmQgPT09IFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIikpIHtcbiAgICAgICAgICAgICAgICBtYXBwZWRJdGVtID0gbWFwcGVkSXRlbS5maWx0ZXIoeiA9PiB6LktpbmQgIT09IFwiZXhjbHVkZWQgY29kZVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMuaGFzKGspKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xuICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUxpbmUgPSB0aGlzLnJlc3BvbnNlcy5nZXQoayk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZS5sZW5ndGggIT09IG1hcHBlZEl0ZW0ubGVuZ3RoIHx8IHNvbWUocmVzcG9uc2VMaW5lLCAobCwgaSkgPT4gIWlzRXF1YWwobCwgbWFwcGVkSXRlbVtpXSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChrLCBtYXBwZWRJdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUucHVzaChrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4dGVuZChHcmFtbWFyLnByb3RvdHlwZSwgQXRvbUdyYW1tYXIucHJvdG90eXBlKTtcbkdyYW1tYXIucHJvdG90eXBlW1wib21uaXNoYXJwXCJdID0gdHJ1ZTtcbkdyYW1tYXIucHJvdG90eXBlW1widG9rZW5pemVMaW5lXCJdID0gZnVuY3Rpb24gKGxpbmUsIHJ1bGVTdGFjaywgZmlyc3RMaW5lID0gZmFsc2UpIHtcbiAgICBjb25zdCBiYXNlUmVzdWx0ID0gQXRvbUdyYW1tYXIucHJvdG90eXBlLnRva2VuaXplTGluZS5jYWxsKHRoaXMsIGxpbmUsIHJ1bGVTdGFjaywgZmlyc3RMaW5lKTtcbiAgICBsZXQgdGFncztcbiAgICBpZiAodGhpcy5yZXNwb25zZXMpIHtcbiAgICAgICAgY29uc3Qgcm93ID0gdGhpc1tcIl9fcm93X19cIl07XG4gICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMuaGFzKHJvdykpXG4gICAgICAgICAgICByZXR1cm4gYmFzZVJlc3VsdDtcbiAgICAgICAgY29uc3QgaGlnaGxpZ2h0cyA9IHRoaXMucmVzcG9uc2VzLmdldChyb3cpO1xuICAgICAgICBpZiAoaGlnaGxpZ2h0c1swXSAmJiBoaWdobGlnaHRzWzBdLktpbmQgPT09IFwiZXhjbHVkZWQgY29kZVwiKSB7XG4gICAgICAgICAgICB0YWdzID0gW2xpbmUubGVuZ3RoXTtcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0c1swXSwgMCwgdGFncy5sZW5ndGggLSAxLCBsaW5lKTtcbiAgICAgICAgICAgIGJhc2VSZXN1bHQucnVsZVN0YWNrID0gW2Jhc2VSZXN1bHQucnVsZVN0YWNrWzBdXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRhZ3MgPSB0aGlzLmdldENzVG9rZW5zRm9yTGluZShoaWdobGlnaHRzLCBsaW5lLCByb3csIHJ1bGVTdGFjaywgZmlyc3RMaW5lLCBiYXNlUmVzdWx0LnRhZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGJhc2VSZXN1bHQudGFncyA9IHRhZ3M7XG4gICAgfVxuICAgIHJldHVybiBiYXNlUmVzdWx0O1xufTtcbkdyYW1tYXIucHJvdG90eXBlLmdldENzVG9rZW5zRm9yTGluZSA9IGZ1bmN0aW9uIChoaWdobGlnaHRzLCBsaW5lLCByb3csIHJ1bGVTdGFjaywgZmlyc3RMaW5lLCB0YWdzKSB7XG4gICAgcnVsZVN0YWNrID0gW3sgcnVsZTogdGhpcy5nZXRJbml0aWFsUnVsZSgpIH1dO1xuICAgIGVhY2goaGlnaGxpZ2h0cywgKGhpZ2hsaWdodCkgPT4ge1xuICAgICAgICBjb25zdCBzdGFydCA9IGhpZ2hsaWdodC5TdGFydENvbHVtbiAtIDE7XG4gICAgICAgIGNvbnN0IGVuZCA9IGhpZ2hsaWdodC5FbmRDb2x1bW4gLSAxO1xuICAgICAgICBpZiAoaGlnaGxpZ2h0LkVuZExpbmUgPiBoaWdobGlnaHQuU3RhcnRMaW5lICYmIGhpZ2hsaWdodC5TdGFydENvbHVtbiA9PT0gMCAmJiBoaWdobGlnaHQuRW5kQ29sdW1uID09PSAwKSB7XG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgMCwgdGFncy5sZW5ndGggLSAxLCBsaW5lKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZGlzdGFuY2UgPSAtMTtcbiAgICAgICAgbGV0IGluZGV4ID0gLTE7XG4gICAgICAgIGxldCBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpc3RhbmNlICsgdGFnc1tpXSA+IHN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRpc3RhbmNlICs9IHRhZ3NbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RyID0gbGluZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCk7XG4gICAgICAgIGNvbnN0IHNpemUgPSBlbmQgLSBzdGFydDtcbiAgICAgICAgaWYgKHRhZ3NbaW5kZXhdID49IHNpemUpIHtcbiAgICAgICAgICAgIGxldCB2YWx1ZXM7XG4gICAgICAgICAgICBsZXQgcHJldiwgbmV4dDtcbiAgICAgICAgICAgIGlmIChkaXN0YW5jZSA9PT0gc3RhcnQpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbc2l6ZSwgdGFnc1tpbmRleF0gLSBzaXplXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHByZXYgPSBzdGFydCAtIGRpc3RhbmNlO1xuICAgICAgICAgICAgICAgIG5leHQgPSB0YWdzW2luZGV4XSAtIHNpemUgLSBwcmV2O1xuICAgICAgICAgICAgICAgIGlmIChuZXh0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbcHJldiwgc2l6ZSwgdGFnc1tpbmRleF0gLSBzaXplIC0gcHJldl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbcHJldiwgc2l6ZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFncy5zcGxpY2UoaW5kZXgsIDEsIC4uLnZhbHVlcyk7XG4gICAgICAgICAgICBpZiAocHJldilcbiAgICAgICAgICAgICAgICBpbmRleCA9IGluZGV4ICsgMTtcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCBpbmRleCwgaW5kZXggKyAxLCBzdHIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRhZ3NbaW5kZXhdIDwgc2l6ZSkge1xuICAgICAgICAgICAgbGV0IGJhY2t0cmFja0luZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrRGlzdGFuY2UgPSAwO1xuICAgICAgICAgICAgZm9yIChpID0gYmFja3RyYWNrSW5kZXg7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrdHJhY2tEaXN0YW5jZSA+PSBzaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tEaXN0YW5jZSArPSB0YWdzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYmFja3RyYWNrRGlzdGFuY2UgPj0gc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSBpICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGZvcndhcmR0cmFja0luZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICBsZXQgcmVtYWluaW5nU2l6ZSA9IHNpemU7XG4gICAgICAgICAgICBmb3IgKGkgPSBpbmRleCArIDE7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKChyZW1haW5pbmdTaXplIDw9IDAgJiYgdGFnc1tpXSA+IDApKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gaSAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2l6ZSAtPSB0YWdzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgb3BlbkZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGggPSBpOyBoID49IDA7IGgtLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhZ3NbaF0gPT09IHRhZ3NbaV0gKyAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIW9wZW5Gb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGkgPT09IHRhZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSB0YWdzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgYmFja3RyYWNrSW5kZXgsIGZvcndhcmR0cmFja0luZGV4LCBzdHIpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHRhZ3M7XG59O1xuY29uc3QgZ2V0SWRGb3JTY29wZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgaWRzID0ge307XG4gICAgY29uc3QgZ3JhbW1hcnMgPSB7fTtcbiAgICBmdW5jdGlvbiBidWlsZFNjb3Blc0ZvckdyYW1tYXIoZ3JhbW1hck5hbWUpIHtcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9IGZpbmQoYXRvbS5ncmFtbWFycy5nZXRHcmFtbWFycygpLCBnYW1tciA9PiBnYW1tci5uYW1lID09PSBncmFtbWFyTmFtZSk7XG4gICAgICAgIGlmICghZ3JhbW1hcilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWRzW2dyYW1tYXIubmFtZV0gPSB7fTtcbiAgICAgICAgZ3JhbW1hcnNbZ3JhbW1hci5uYW1lXSA9IGdyYW1tYXI7XG4gICAgICAgIGVhY2goZ3JhbW1hci5yZWdpc3RyeS5zY29wZXNCeUlkLCAodmFsdWUsIGtleSkgPT4geyBpZHNbZ3JhbW1hci5uYW1lXVt2YWx1ZV0gPSAra2V5OyB9KTtcbiAgICB9XG4gICAgY29uc3QgbWV0aG9kID0gKGdyYW1tYXIsIHNjb3BlKSA9PiB7XG4gICAgICAgIGlmICghaWRzW2dyYW1tYXJdKSB7XG4gICAgICAgICAgICBidWlsZFNjb3Blc0ZvckdyYW1tYXIoZ3JhbW1hcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpZHNbZ3JhbW1hcl1bc2NvcGVdKVxuICAgICAgICAgICAgaWRzW2dyYW1tYXJdW3Njb3BlXSA9IGdyYW1tYXJzW2dyYW1tYXJdLnJlZ2lzdHJ5LnN0YXJ0SWRGb3JTY29wZShzY29wZSk7XG4gICAgICAgIHJldHVybiAraWRzW2dyYW1tYXJdW3Njb3BlXTtcbiAgICB9O1xuICAgIG1ldGhvZC5lbmQgPSAoc2NvcGUpID0+ICtzY29wZSAtIDE7XG4gICAgcmV0dXJuIG1ldGhvZDtcbn0pKCk7XG5mdW5jdGlvbiBnZXRBdG9tU3R5bGVGb3JUb2tlbihncmFtbWFyLCB0YWdzLCB0b2tlbiwgaW5kZXgsIGluZGV4RW5kLCBzdHIpIHtcbiAgICBjb25zdCBwcmV2aW91c1Njb3BlcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSBpbmRleCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGlmICh0YWdzW2ldID4gMClcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKHRhZ3NbaV0pO1xuICAgIH1cbiAgICBjb25zdCByZXBsYWNlbWVudHMgPSBbXTtcbiAgICBjb25zdCBvcGVucyA9IFtdO1xuICAgIGNvbnN0IGNsb3NlcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSBpbmRleDsgaSA8IGluZGV4RW5kOyBpKyspIHtcbiAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3Qgb3BlbkluZGV4ID0gZmluZEluZGV4KG9wZW5zLCB4ID0+IHgudGFnID09PSAodGFnc1tpXSArIDEpKTtcbiAgICAgICAgICAgIGlmIChvcGVuSW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIG9wZW5zLnNwbGljZShvcGVuSW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xvc2VzLnB1c2goeyB0YWc6IHRhZ3NbaV0sIGluZGV4OiBpIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb3BlbnMudW5zaGlmdCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IHVuZnVsbGZpbGxlZCA9IFtdO1xuICAgIGlmIChjbG9zZXMubGVuZ3RoID4gMCkge1xuICAgICAgICB1bmZ1bGxmaWxsZWQgPSBzb3J0Qnkob3BlbnMuY29uY2F0KGNsb3NlcyksIHggPT4geC5pbmRleCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKG9wZW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xuICAgICAgICAgICAgc3RhcnQ6IG9wZW5zW29wZW5zLmxlbmd0aCAtIDFdLmluZGV4LFxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKG9wZW5zW29wZW5zLmxlbmd0aCAtIDFdLmluZGV4LCBpbmRleEVuZCArIDEpXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsZXQgaW50ZXJuYWxJbmRleCA9IGluZGV4O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdW5mdWxsZmlsbGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHYgPSB1bmZ1bGxmaWxsZWRbaV07XG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcbiAgICAgICAgICAgIHN0YXJ0OiBpbnRlcm5hbEluZGV4LFxuICAgICAgICAgICAgZW5kOiB2LmluZGV4LFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW50ZXJuYWxJbmRleCwgdi5pbmRleClcbiAgICAgICAgfSk7XG4gICAgICAgIGludGVybmFsSW5kZXggPSB2LmluZGV4ICsgMTtcbiAgICB9XG4gICAgaWYgKHJlcGxhY2VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xuICAgICAgICAgICAgc3RhcnQ6IGluZGV4LFxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGluZGV4LCBpbmRleEVuZClcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgIH1cbiAgICBmdW5jdGlvbiBhZGQoc2NvcGUpIHtcbiAgICAgICAgY29uc3QgaWQgPSBnZXRJZEZvclNjb3BlKGdyYW1tYXIsIHNjb3BlKTtcbiAgICAgICAgaWYgKGlkID09PSAtMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKCFzb21lKHByZXZpb3VzU2NvcGVzLCB6ID0+IHogPT09IGlkKSkge1xuICAgICAgICAgICAgcHJldmlvdXNTY29wZXMucHVzaChpZCk7XG4gICAgICAgIH1cbiAgICAgICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXBsYWNlbWVudCA9IGN0eC5yZXBsYWNlbWVudDtcbiAgICAgICAgICAgIHJlcGxhY2VtZW50LnVuc2hpZnQoaWQpO1xuICAgICAgICAgICAgcmVwbGFjZW1lbnQucHVzaChnZXRJZEZvclNjb3BlLmVuZChpZCkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgc3dpdGNoICh0b2tlbi5LaW5kKSB7XG4gICAgICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgICAgICAgIGFkZChgY29uc3RhbnQubnVtZXJpY2ApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzdHJ1Y3QgbmFtZVwiOlxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNvbnN0YW50Lm51bWVyaWMuaWRlbnRpZmllci5zdHJ1Y3RgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZW51bSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY29uc3RhbnQubnVtZXJpYy5pZGVudGlmaWVyLmVudW1gKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiaWRlbnRpZmllclwiOlxuICAgICAgICAgICAgYWRkKGBpZGVudGlmaWVyYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImNsYXNzIG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXJgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZGVsZWdhdGUgbmFtZVwiOlxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllci5kZWxlZ2F0ZWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJpbnRlcmZhY2UgbmFtZVwiOlxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllci5pbnRlcmZhY2VgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIjpcbiAgICAgICAgICAgIGFkZChgY29uc3RhbnQub3RoZXIuc3ltYm9sYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImV4Y2x1ZGVkIGNvZGVcIjpcbiAgICAgICAgICAgIGFkZChgY29tbWVudC5ibG9ja2ApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJ1bnVzZWQgY29kZVwiOlxuICAgICAgICAgICAgYWRkKGB1bnVzZWRgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ1bmhhbmRsZWQgS2luZCBcIiArIHRva2VuLktpbmQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGVhY2gocmVwbGFjZW1lbnRzLCBjdHggPT4ge1xuICAgICAgICBjb25zdCB7IHJlcGxhY2VtZW50LCBlbmQsIHN0YXJ0IH0gPSBjdHg7XG4gICAgICAgIGlmIChyZXBsYWNlbWVudC5sZW5ndGggPT09IDIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBudW0gPSBlbmQgLSBzdGFydDtcbiAgICAgICAgaWYgKG51bSA8PSAwKSB7XG4gICAgICAgICAgICBudW0gPSAxO1xuICAgICAgICB9XG4gICAgICAgIHRhZ3Muc3BsaWNlKHN0YXJ0LCBudW0sIC4uLnJlcGxhY2VtZW50KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIHNldEdyYW1tYXIoZ3JhbW1hcikge1xuICAgIGNvbnN0IGcyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKHRoaXMsIGdyYW1tYXIpO1xuICAgIGlmIChnMiAhPT0gZ3JhbW1hcilcbiAgICAgICAgdGhpcy5fc2V0R3JhbW1hcihnMik7XG4gICAgcmV0dXJuIGcyO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldEVuaGFuY2VkR3JhbW1hcihlZGl0b3IsIGdyYW1tYXIsIG9wdGlvbnMpIHtcbiAgICBpZiAoIWdyYW1tYXIpXG4gICAgICAgIGdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xuICAgIGlmICghZ3JhbW1hcltcIm9tbmlzaGFycFwiXSAmJiBPbW5pLmlzVmFsaWRHcmFtbWFyKGdyYW1tYXIpKSB7XG4gICAgICAgIGNvbnN0IG5ld0dyYW1tYXIgPSBuZXcgR3JhbW1hcihlZGl0b3IsIGdyYW1tYXIsIG9wdGlvbnMpO1xuICAgICAgICBlYWNoKGdyYW1tYXIsICh4LCBpKSA9PiB7XG4gICAgICAgICAgICBpZiAoaGFzKGdyYW1tYXIsIGkpKSB7XG4gICAgICAgICAgICAgICAgbmV3R3JhbW1hcltpXSA9IHg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBncmFtbWFyID0gbmV3R3JhbW1hcjtcbiAgICB9XG4gICAgcmV0dXJuIGdyYW1tYXI7XG59XG5jbGFzcyBVbnVzZWRNYXAge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9tYXAgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIGdldChrZXkpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tYXAuaGFzKGtleSkpXG4gICAgICAgICAgICB0aGlzLl9tYXAuc2V0KGtleSwgbmV3IEJlaGF2aW9yU3ViamVjdChbXSkpO1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLmdldChrZXkpO1xuICAgIH1cbiAgICBfZ2V0T2JzZXJ2ZXIoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldChrZXkpO1xuICAgIH1cbiAgICBzZXQoa2V5LCB2YWx1ZSkge1xuICAgICAgICBjb25zdCBvID0gdGhpcy5fZ2V0T2JzZXJ2ZXIoa2V5KTtcbiAgICAgICAgaWYgKCFpc0VxdWFsKG8uZ2V0VmFsdWUoKSwgdmFsdWUpKSB7XG4gICAgICAgICAgICBvLm5leHQodmFsdWUgfHwgW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBkZWxldGUoa2V5KSB7XG4gICAgICAgIGlmICh0aGlzLl9tYXAuaGFzKGtleSkpXG4gICAgICAgICAgICB0aGlzLl9tYXAuZGVsZXRlKGtleSk7XG4gICAgfVxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLl9tYXAuY2xlYXIoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgZW5oYW5jZWRIaWdobGlnaHRpbmcxOSA9IG5ldyBIaWdobGlnaHQ7XG4iXX0=
