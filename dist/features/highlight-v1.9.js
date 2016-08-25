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
                        var _step$value = _slicedToArray(_step.value, 2);

                        var file = _step$value[0];
                        var diagnostics = _step$value[1];

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
    var unusedCodeRows = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    var doSetGrammar = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

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
                var oldRange = e.oldRange;
                var newRange = e.newRange;

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
    var firstLine = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

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
        var replacement = ctx.replacement;
        var end = ctx.end;
        var start = ctx.start;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS50cyIsImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztRQTJLQTtRQTJnQkE7O0FDdHJCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FES0EsSUFBTSxjQUFjLFFBQWMsS0FBTSxNQUFOLENBQWEsWUFBYixHQUE0Qix5Q0FBNUIsQ0FBNUI7QUFFTixJQUFNLGdCQUFnQixHQUFoQjtBQUNOLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTFCO0FBRUosSUFBTSxZQUFZLFdBQVo7SUFDRixvQkFBb0IsbUJBQXBCO0FBRUosU0FBQSwyQkFBQSxDQUFxQyxJQUFyQyxFQUFtRCxVQUFuRCxFQUE0RixZQUE1RixFQUFrSDtBQUM5RyxXQUFPLG1CQUFNLFVBQU4sRUFDRixNQURFLENBQ0s7ZUFBSyxFQUFFLFFBQUYsS0FBZSxJQUFmO0tBQUwsQ0FETCxDQUVGLEdBRkUsQ0FFRTtlQUFNO0FBQ1AsdUJBQVcsRUFBRSxJQUFGO0FBQ1gseUJBQWEsRUFBRSxNQUFGO0FBQ2IscUJBQVMsRUFBRSxPQUFGO0FBQ1QsdUJBQVcsRUFBRSxTQUFGO0FBQ1gsa0JBQU0sYUFBTjtBQUNBLHNCQUFVLFlBQVY7O0tBTkMsQ0FGRixDQVVGLEtBVkUsRUFBUCxDQUQ4RztDQUFsSDtBQWVPLElBQU0sMERBQXlCLENBQ2xDLENBRGtDLEVBRWxDLENBRmtDLEVBR2xDLENBSGtDLEVBSWxDLENBSmtDLEVBS2xDLENBTGtDLENBQXpCOztJQVNiO0FBQUEseUJBQUE7OztBQUdZLGFBQUEsY0FBQSxHQUFpQixJQUFJLFNBQUosRUFBakIsQ0FIWjtBQTRIVyxhQUFBLFFBQUEsR0FBVyxLQUFYLENBNUhYO0FBNkhXLGFBQUEsS0FBQSxHQUFRLHVCQUFSLENBN0hYO0FBOEhXLGFBQUEsV0FBQSxHQUFjLDJHQUFkLENBOUhYO0FBK0hXLGFBQUEsT0FBQSxHQUFVLEtBQVYs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O0FBU0EsV0FBTyxPQUFQLENBWG9IO0NBQXhIOztJQWVBO0FBQUEseUJBQUE7OztBQUNZLGFBQUEsSUFBQSxHQUFPLElBQUksR0FBSixFQUFQLENBRFo7S0FBQTs7Ozs0QkFFZSxLQUFXO0FBQ2xCLGdCQUFJLENBQUMsS0FBSyxJQUFMLENBQVUsR0FBVixDQUFjLEdBQWQsQ0FBRCxFQUFxQixLQUFLLElBQUwsQ0FBVSxHQUFWLENBQWMsR0FBZCxFQUF3QiwwQkFBaUQsRUFBakQsQ0FBeEIsRUFBekI7QUFDQSxtQkFBTyxLQUFLLElBQUwsQ0FBVSxHQUFWLENBQWMsR0FBZCxDQUFQLENBRmtCOzs7O3FDQUtELEtBQVc7QUFDNUIsbUJBQW1HLEtBQUssR0FBTCxDQUFTLEdBQVQsQ0FBbkcsQ0FENEI7Ozs7NEJBSXJCLEtBQWEsT0FBbUM7QUFDdkQsZ0JBQU0sSUFBSSxLQUFLLFlBQUwsQ0FBa0IsR0FBbEIsQ0FBSixDQURpRDtBQUV2RCxnQkFBSSxDQUFDLHFCQUFRLEVBQUUsUUFBRixFQUFSLEVBQXNCLEtBQXRCLENBQUQsRUFBK0I7QUFDL0Isa0JBQUUsSUFBRixDQUFPLFNBQVMsRUFBVCxDQUFQLENBRCtCO2FBQW5DO0FBR0EsbUJBQU8sSUFBUCxDQUx1RDs7OztnQ0FRN0MsS0FBVztBQUNyQixnQkFBSSxLQUFLLElBQUwsQ0FBVSxHQUFWLENBQWMsR0FBZCxDQUFKLEVBQ0ksS0FBSyxJQUFMLENBQVUsTUFBVixDQUFpQixHQUFqQixFQURKOzs7O2dDQUlRO0FBQ1IsaUJBQUssSUFBTCxDQUFVLEtBQVYsR0FEUTs7Ozs7OztBQUtULElBQU0sMERBQXlCLElBQUksU0FBSixFQUF6QiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvaGlnaGxpZ2h0LXYxLjkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5pbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtPbW5pc2hhcnBUZXh0RWRpdG9yLCBpc09tbmlzaGFycFRleHRFZGl0b3J9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XHJcbmltcG9ydCB7ZWFjaCwgZXh0ZW5kLCBoYXMsIHNvbWUsIHJhbmdlLCByZW1vdmUsIHB1bGwsIGZpbmQsIGNoYWluLCB1bmlxLCBmaW5kSW5kZXgsIGV2ZXJ5LCBpc0VxdWFsLCBtaW4sIGRlYm91bmNlLCBzb3J0QnksIHVuaXF1ZUlkLCBmaWx0ZXJ9IGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0LCBSZXBsYXlTdWJqZWN0LCBCZWhhdmlvclN1YmplY3QsIFN1YnNjcmliZXJ9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7cmVnaXN0ZXJDb250ZXh0SXRlbX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5jb25zdCBBdG9tR3JhbW1hciA9IHJlcXVpcmUoKDxhbnk+YXRvbSkuY29uZmlnLnJlc291cmNlUGF0aCArIFwiL25vZGVfbW9kdWxlcy9maXJzdC1tYXRlL2xpYi9ncmFtbWFyLmpzXCIpO1xyXG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuY29uc3QgREVCT1VOQ0VfVElNRSA9IDI0MC8qMjQwKi87XHJcbmxldCBmYXN0ZG9tOiB0eXBlb2YgRmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xyXG5cclxuY29uc3QgSElHSExJR0hUID0gXCJISUdITElHSFRcIixcclxuICAgIEhJR0hMSUdIVF9SRVFVRVNUID0gXCJISUdITElHSFRfUkVRVUVTVFwiO1xyXG5cclxuZnVuY3Rpb24gZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKHBhdGg6IHN0cmluZywgcXVpY2tGaXhlczogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdLCBwcm9qZWN0TmFtZXM6IHN0cmluZ1tdKSB7XHJcbiAgICByZXR1cm4gY2hhaW4ocXVpY2tGaXhlcylcclxuICAgICAgICAuZmlsdGVyKHggPT4geC5GaWxlTmFtZSA9PT0gcGF0aClcclxuICAgICAgICAubWFwKHggPT4gKHtcclxuICAgICAgICAgICAgU3RhcnRMaW5lOiB4LkxpbmUsXHJcbiAgICAgICAgICAgIFN0YXJ0Q29sdW1uOiB4LkNvbHVtbixcclxuICAgICAgICAgICAgRW5kTGluZTogeC5FbmRMaW5lLFxyXG4gICAgICAgICAgICBFbmRDb2x1bW46IHguRW5kQ29sdW1uLFxyXG4gICAgICAgICAgICBLaW5kOiBcInVudXNlZCBjb2RlXCIsXHJcbiAgICAgICAgICAgIFByb2plY3RzOiBwcm9qZWN0TmFtZXNcclxuICAgICAgICB9IGFzIE1vZGVscy5IaWdobGlnaHRTcGFuKSlcclxuICAgICAgICAudmFsdWUoKTtcclxufVxyXG5cclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5leHBvcnQgY29uc3QgRXhjbHVkZUNsYXNzaWZpY2F0aW9ucyA9IFtcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5Db21tZW50LFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLlN0cmluZyxcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5QdW5jdHVhdGlvbixcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5PcGVyYXRvcixcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5LZXl3b3JkXHJcbl07XHJcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5cclxuY2xhc3MgSGlnaGxpZ2h0IGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBlZGl0b3JzOiBBcnJheTxPbW5pc2hhcnBUZXh0RWRpdG9yPjtcclxuICAgIHByaXZhdGUgdW51c2VkQ29kZVJvd3MgPSBuZXcgVW51c2VkTWFwKCk7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIGlmICghKE9tbmkuYXRvbVZlcnNpb24ubWlub3IgIT09IDEgfHwgT21uaS5hdG9tVmVyc2lvbi5taW5vciA+IDgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmVkaXRvcnMgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgcmVnaXN0ZXJDb250ZXh0SXRlbShISUdITElHSFRfUkVRVUVTVCwgKGNvbnRleHQpID0+IG5ldyBTdWJqZWN0PGJvb2xlYW4+KCkpLFxyXG4gICAgICAgICAgICByZWdpc3RlckNvbnRleHRJdGVtKEhJR0hMSUdIVCwgKGNvbnRleHQsIGVkaXRvcikgPT5cclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydFdpdGgodHJ1ZSlcclxuICAgICAgICAgICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMClcclxuICAgICAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKCgpID0+IE9ic2VydmFibGUuZGVmZXIoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0cyA9IGNvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZSA9PT0gXCJhbGxcIiA/IFtdIDogW2NvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbGluZXNUb0ZldGNoID0gdW5pcTxudW1iZXI+KCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmxpbmVzVG9GZXRjaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbGluZXNUb0ZldGNoIHx8ICFsaW5lc1RvRmV0Y2gubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZXNUb0ZldGNoID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5nZXQoZWRpdG9yLmdldFBhdGgoKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5oaWdobGlnaHQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb2plY3ROYW1lczogcHJvamVjdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTGluZXM6IGxpbmVzVG9GZXRjaCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeGNsdWRlQ2xhc3NpZmljYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocXVpY2tmaXhlcywgcmVzcG9uc2UpID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodHM6IGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCBxdWlja2ZpeGVzLCBwcm9qZWN0cykuY29uY2F0KHJlc3BvbnNlID8gcmVzcG9uc2UuSGlnaGxpZ2h0cyA6IFtdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZG8oKHtoaWdobGlnaHRzfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5zZXRSZXNwb25zZXMoaGlnaGxpZ2h0cywgcHJvamVjdHMubGVuZ3RoID4gMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVmQ291bnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSkpLFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLm1vZGVsLmRpYWdub3N0aWNzQnlGaWxlXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGNoYW5nZXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IFtmaWxlLCBkaWFnbm9zdGljc10gb2YgY2hhbmdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLnNldChmaWxlLCBmaWx0ZXIoZGlhZ25vc3RpY3MsIHggPT4geC5Mb2dMZXZlbCA9PT0gXCJIaWRkZW5cIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBPbW5pLmVhY2hFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0dXBFZGl0b3IoZWRpdG9yLCBjZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbW5pc2hhcnBcclxuICAgICAgICAgICAgICAgICAgICAuZ2V0PE9ic2VydmFibGU8eyBlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3I7IGhpZ2hsaWdodHM6IE1vZGVscy5IaWdobGlnaHRTcGFuW107IHByb2plY3RzOiBzdHJpbmdbXSB9Pj4oSElHSExJR0hUKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5nZXQ8U3ViamVjdDxib29sZWFuPj4oSElHSExJR0hUX1JFUVVFU1QpLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5nZXQ8U3ViamVjdDxib29sZWFuPj4oSElHSExJR0hUX1JFUVVFU1QpLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MuY2xlYXIoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cEVkaXRvcihlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IsIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGUpIHtcclxuICAgICAgICBpZiAoZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0gfHwgIWVkaXRvci5nZXRHcmFtbWFyKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IGlzc3VlUmVxdWVzdCA9IGVkaXRvci5vbW5pc2hhcnAuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKTtcclxuXHJcbiAgICAgICAgYXVnbWVudEVkaXRvcihlZGl0b3IsIHRoaXMudW51c2VkQ29kZVJvd3MsIHRydWUpO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvcnMucHVzaChlZGl0b3IpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoID0gW107XHJcbiAgICAgICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMpICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcy5jbGVhcigpO1xyXG4gICAgICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcygpO1xyXG4gICAgICAgICAgICBkZWxldGUgZWRpdG9yW1wiX29sZEdyYW1tYXJcIl07XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgICAgICBwdWxsKHRoaXMuZWRpdG9ycywgZWRpdG9yKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbW5pc2hhcnAucHJvamVjdFxyXG4gICAgICAgICAgICAub2JzZXJ2ZS5hY3RpdmVGcmFtZXdvcmtcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICAgICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMpICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcy5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKCgpID0+IGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpKSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFNhdmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uXHJcbiAgICAgICAgICAgIC53aGVuQ29ubmVjdGVkKClcclxuICAgICAgICAgICAgLmRlbGF5KDEwMDApXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJFbmhhbmNlZCBIaWdobGlnaHRpbmdcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiRW5hYmxlcyBzZXJ2ZXIgYmFzZWQgaGlnaGxpZ2h0aW5nLCB3aGljaCBpbmNsdWRlcyBzdXBwb3J0IGZvciBzdHJpbmcgaW50ZXJwb2xhdGlvbiwgY2xhc3MgbmFtZXMgYW5kIG1vcmUuXCI7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IGZhbHNlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudEVkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgdW51c2VkQ29kZVJvd3M6IFVudXNlZE1hcCA9IG51bGwsIGRvU2V0R3JhbW1hciA9IGZhbHNlKSB7XHJcbiAgICBpZiAoIWVkaXRvcltcIl9vbGRHcmFtbWFyXCJdKVxyXG4gICAgICAgIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcclxuICAgIGlmICghZWRpdG9yW1wiX3NldEdyYW1tYXJcIl0pXHJcbiAgICAgICAgZWRpdG9yW1wiX3NldEdyYW1tYXJcIl0gPSBlZGl0b3Iuc2V0R3JhbW1hcjtcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXSlcclxuICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdID0gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dDtcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0gPSAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyLm1hcmtUb2tlbml6YXRpb25Db21wbGV0ZTtcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0gPSAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcztcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl90b2tlbml6ZUluQmFja2dyb3VuZFwiXSlcclxuICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX3Rva2VuaXplSW5CYWNrZ3JvdW5kXCJdID0gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci50b2tlbml6ZUluQmFja2dyb3VuZDtcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9jaHVua1NpemVcIl0pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcImNodW5rU2l6ZVwiXSA9IDIwO1xyXG5cclxuICAgIGVkaXRvci5zZXRHcmFtbWFyID0gc2V0R3JhbW1hcjtcclxuICAgIGlmIChkb1NldEdyYW1tYXIpIGVkaXRvci5zZXRHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpO1xyXG5cclxuICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0ID0gZnVuY3Rpb24gKHJvdzogbnVtYmVyKSB7XHJcbiAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSlbXCJfX3Jvd19fXCJdID0gcm93O1xyXG4gICAgICAgIHJldHVybiAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICghKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikuc2lsZW50UmV0b2tlbml6ZUxpbmVzKSB7XHJcbiAgICAgICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikuc2lsZW50UmV0b2tlbml6ZUxpbmVzID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxyXG4gICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xyXG4gICAgICAgICAgICBsZXQgbGFzdFJvdzogbnVtYmVyO1xyXG4gICAgICAgICAgICBsYXN0Um93ID0gdGhpcy5idWZmZXIuZ2V0TGFzdFJvdygpO1xyXG4gICAgICAgICAgICB0aGlzLnRva2VuaXplZExpbmVzID0gdGhpcy5idWlsZFBsYWNlaG9sZGVyVG9rZW5pemVkTGluZXNGb3JSb3dzKDAsIGxhc3RSb3cpO1xyXG4gICAgICAgICAgICB0aGlzLmludmFsaWRSb3dzID0gW107XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxpbmVzVG9Ub2tlbml6ZSAmJiB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZVJvdyhtaW4odGhpcy5saW5lc1RvVG9rZW5pemUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZVJvdygwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmZ1bGx5VG9rZW5pemVkID0gZmFsc2U7XHJcbiAgICAgICAgfSwgREVCT1VOQ0VfVElNRSwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgcmV0dXJuIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLnJldG9rZW5pemVMaW5lcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxyXG4gICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dChmYWxzZSk7XHJcbiAgICAgICAgcmV0dXJuIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLnRva2VuaXplSW5CYWNrZ3JvdW5kID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghdGhpcy52aXNpYmxlIHx8IHRoaXMucGVuZGluZ0NodW5rIHx8ICF0aGlzLmlzQWxpdmUoKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnBlbmRpbmdDaHVuayA9IHRydWU7XHJcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnBlbmRpbmdDaHVuayA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0FsaXZlKCkgJiYgdGhpcy5idWZmZXIuaXNBbGl2ZSgpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRva2VuaXplTmV4dENodW5rKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikuc2NvcGVzRnJvbVRhZ3MgPSBmdW5jdGlvbiAoc3RhcnRpbmdTY29wZXM6IG51bWJlcltdLCB0YWdzOiBudW1iZXJbXSkge1xyXG4gICAgICAgIGNvbnN0IHNjb3BlcyA9IHN0YXJ0aW5nU2NvcGVzLnNsaWNlKCk7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9ICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0YWdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRhZyA9IHRhZ3NbaV07XHJcbiAgICAgICAgICAgIGlmICh0YWcgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHRhZyAlIDIpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3Blcy5wdXNoKHRhZyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoaW5nU3RhcnRUYWcgPSB0YWcgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMucG9wKCkgPT09IG1hdGNoaW5nU3RhcnRUYWcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIYWNrIHRvIGVuc3VyZSB0aGF0IGFsbCBsaW5lcyBhbHdheXMgZ2V0IHRoZSBwcm9wZXIgc291cmNlIGxpbmVzLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2goPGFueT5ncmFtbWFyLnN0YXJ0SWRGb3JTY29wZShgLiR7Z3JhbW1hci5zY29wZU5hbWV9YCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiRW5jb3VudGVyZWQgYW4gdW5tYXRjaGVkIHNjb3BlIGVuZCB0YWcuXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogZWRpdG9yLmJ1ZmZlci5nZXRQYXRoKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbW1hclNjb3BlTmFtZTogZ3JhbW1hci5zY29wZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVubWF0Y2hlZEVuZFRhZzogZ3JhbW1hci5zY29wZUZvcklkKHRhZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuc2V0UmVzcG9uc2VzKFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1bnVzZWRDb2RlUm93cyAmJiBpc09tbmlzaGFycFRleHRFZGl0b3IoZWRpdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJvd3MgPT4gKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRSZXNwb25zZXMoZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKGVkaXRvci5nZXRQYXRoKCksIHJvd3MsIFtdKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNjb3BlcztcclxuICAgIH07XHJcbn1cclxuXHJcbmludGVyZmFjZSBJSGlnaGxpZ2h0aW5nR3JhbW1hciBleHRlbmRzIEZpcnN0TWF0ZS5HcmFtbWFyIHtcclxuICAgIGlzT2JzZXJ2ZVJldG9rZW5pemluZzogU3ViamVjdDxib29sZWFuPjtcclxuICAgIGxpbmVzVG9GZXRjaDogbnVtYmVyW107XHJcbiAgICBsaW5lc1RvVG9rZW5pemU6IG51bWJlcltdO1xyXG4gICAgcmVzcG9uc2VzOiBNYXA8bnVtYmVyLCBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdPjtcclxuICAgIGZ1bGx5VG9rZW5pemVkOiBib29sZWFuO1xyXG4gICAgc2NvcGVOYW1lOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIEdyYW1tYXIge1xyXG4gICAgcHVibGljIGlzT2JzZXJ2ZVJldG9rZW5pemluZzogUmVwbGF5U3ViamVjdDxib29sZWFuPjtcclxuICAgIHB1YmxpYyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcclxuICAgIHB1YmxpYyBsaW5lc1RvRmV0Y2g6IGFueVtdO1xyXG4gICAgcHVibGljIGxpbmVzVG9Ub2tlbml6ZTogYW55W107XHJcbiAgICBwdWJsaWMgYWN0aXZlRnJhbWV3b3JrOiBhbnk7XHJcbiAgICBwdWJsaWMgcmVzcG9uc2VzOiBNYXA8bnVtYmVyLCBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdPjtcclxuICAgIHB1YmxpYyBfZ2lkID0gdW5pcXVlSWQoXCJvZ1wiKTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgYmFzZTogRmlyc3RNYXRlLkdyYW1tYXIsIG9wdGlvbnM6IHsgcmVhZG9ubHk6IGJvb2xlYW4gfSkge1xyXG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nID0gbmV3IFJlcGxheVN1YmplY3Q8Ym9vbGVhbj4oMSk7XHJcbiAgICAgICAgdGhpcy5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dCh0cnVlKTtcclxuXHJcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XHJcbiAgICAgICAgdGhpcy5yZXNwb25zZXMgPSBuZXcgTWFwPG51bWJlciwgTW9kZWxzLkhpZ2hsaWdodFNwYW5bXT4oKTtcclxuICAgICAgICB0aGlzLmxpbmVzVG9GZXRjaCA9IFtdO1xyXG4gICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplID0gW107XHJcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB7fTtcclxuXHJcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnJlYWRvbmx5KSB7XHJcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5wcmVlbXB0RGlkQ2hhbmdlKChlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHtvbGRSYW5nZSwgbmV3UmFuZ2V9ID0gZTtcclxuICAgICAgICAgICAgICAgIGxldCBzdGFydDogbnVtYmVyID0gb2xkUmFuZ2Uuc3RhcnQucm93LFxyXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhOiBudW1iZXIgPSBuZXdSYW5nZS5lbmQucm93IC0gb2xkUmFuZ2UuZW5kLnJvdztcclxuXHJcbiAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0IC0gNTtcclxuICAgICAgICAgICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSBlZGl0b3IuYnVmZmVyLmdldExpbmVDb3VudCgpIC0gMTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9IHJhbmdlKHN0YXJ0LCBlbmQgKyAxKTtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMua2V5cygpLm5leHQoKS5kb25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2gucHVzaCguLi5saW5lcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChsaW5lc1swXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRGcm9tID0gb2xkUmFuZ2Uuc3RhcnQuY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RnJvbSA9IG5ld1JhbmdlLnN0YXJ0LmNvbHVtbjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZShyZXNwb25zZUxpbmUsIChzcGFuOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRMaW5lIDwgbGluZXNbMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG9sZEZyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gb2xkRnJvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gbmV3RnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBuZXdGcm9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWFjaChsaW5lcywgbGluZSA9PiB7IHRoaXMucmVzcG9uc2VzLmRlbGV0ZShsaW5lKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRlbHRhID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5ldyBsaW5lXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGNvdW50IC0gMTsgaSA+IGVuZDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlc3BvbnNlcy5oYXMoaSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpICsgZGVsdGEsIHRoaXMucmVzcG9uc2VzLmdldChpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5kZWxldGUoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlbHRhIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZWQgbGluZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gZWRpdG9yLmdldExpbmVDb3VudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFic0RlbHRhID0gTWF0aC5hYnMoZGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBlbmQ7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlc3BvbnNlcy5oYXMoaSArIGFic0RlbHRhKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGksIHRoaXMucmVzcG9uc2VzLmdldChpICsgYWJzRGVsdGEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLmRlbGV0ZShpICsgYWJzRGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFJlc3BvbnNlcyh2YWx1ZTogTW9kZWxzLkhpZ2hsaWdodFNwYW5bXSwgZW5hYmxlRXhjbHVkZUNvZGU6IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCByZXN1bHRzID0gY2hhaW4odmFsdWUpO1xyXG5cclxuICAgICAgICBjb25zdCBncm91cGVkSXRlbXMgPSA8YW55PnJlc3VsdHMubWFwKGhpZ2hsaWdodCA9PiByYW5nZShoaWdobGlnaHQuU3RhcnRMaW5lLCBoaWdobGlnaHQuRW5kTGluZSArIDEpXHJcbiAgICAgICAgICAgIC5tYXAobGluZSA9PiAoeyBsaW5lLCBoaWdobGlnaHQgfSkpKVxyXG4gICAgICAgICAgICAuZmxhdHRlbjx7IGxpbmU6IG51bWJlcjsgaGlnaGxpZ2h0OiBNb2RlbHMuSGlnaGxpZ2h0U3BhbiB9PigpXHJcbiAgICAgICAgICAgIC5ncm91cEJ5KHogPT4gei5saW5lKVxyXG4gICAgICAgICAgICAudmFsdWUoKTtcclxuXHJcbiAgICAgICAgZWFjaChncm91cGVkSXRlbXMsIChpdGVtOiB7IGhpZ2hsaWdodDogTW9kZWxzLkhpZ2hsaWdodFNwYW4gfVtdLCBrZXk6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBsZXQgayA9ICtrZXksIG1hcHBlZEl0ZW0gPSBpdGVtLm1hcCh4ID0+IHguaGlnaGxpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZW5hYmxlRXhjbHVkZUNvZGUgfHwgc29tZShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSAmJiBldmVyeShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIgfHwgaS5LaW5kID09PSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBtYXBwZWRJdGVtID0gbWFwcGVkSXRlbS5maWx0ZXIoeiA9PiB6LktpbmQgIT09IFwiZXhjbHVkZWQgY29kZVwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMoaykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChrLCBtYXBwZWRJdGVtKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplLnB1c2goayk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUxpbmUgPSB0aGlzLnJlc3BvbnNlcy5nZXQoayk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lLmxlbmd0aCAhPT0gbWFwcGVkSXRlbS5sZW5ndGggfHwgc29tZShyZXNwb25zZUxpbmUsIChsLCBpKSA9PiAhaXNFcXVhbChsLCBtYXBwZWRJdGVtW2ldKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUucHVzaChrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuLyogdHNsaW50OmRpc2FibGU6bWVtYmVyLWFjY2VzcyAqL1xyXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmV4dGVuZChHcmFtbWFyLnByb3RvdHlwZSwgQXRvbUdyYW1tYXIucHJvdG90eXBlKTtcclxuXHJcbkdyYW1tYXIucHJvdG90eXBlW1wib21uaXNoYXJwXCJdID0gdHJ1ZTtcclxuR3JhbW1hci5wcm90b3R5cGVbXCJ0b2tlbml6ZUxpbmVcIl0gPSBmdW5jdGlvbiAobGluZTogc3RyaW5nLCBydWxlU3RhY2s6IGFueVtdLCBmaXJzdExpbmUgPSBmYWxzZSk6IHsgdGFnczogbnVtYmVyW107IHJ1bGVTdGFjazogYW55IH0ge1xyXG4gICAgY29uc3QgYmFzZVJlc3VsdCA9IEF0b21HcmFtbWFyLnByb3RvdHlwZS50b2tlbml6ZUxpbmUuY2FsbCh0aGlzLCBsaW5lLCBydWxlU3RhY2ssIGZpcnN0TGluZSk7XHJcbiAgICBsZXQgdGFnczogYW55W107XHJcblxyXG4gICAgaWYgKHRoaXMucmVzcG9uc2VzKSB7XHJcbiAgICAgICAgY29uc3Qgcm93ID0gdGhpc1tcIl9fcm93X19cIl07XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMuaGFzKHJvdykpIHJldHVybiBiYXNlUmVzdWx0O1xyXG5cclxuICAgICAgICBjb25zdCBoaWdobGlnaHRzID0gdGhpcy5yZXNwb25zZXMuZ2V0KHJvdyk7XHJcbiAgICAgICAgLy8gRXhjbHVkZWQgY29kZSBibG93cyBhd2F5IGFueSBvdGhlciBmb3JtYXR0aW5nLCBvdGhlcndpc2Ugd2UgZ2V0IGludG8gYSB2ZXJ5IHdlaXJkIHN0YXRlLlxyXG4gICAgICAgIGlmIChoaWdobGlnaHRzWzBdICYmIGhpZ2hsaWdodHNbMF0uS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIpIHtcclxuICAgICAgICAgICAgdGFncyA9IFtsaW5lLmxlbmd0aF07XHJcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0c1swXSwgMCwgdGFncy5sZW5ndGggLSAxLCBsaW5lKTtcclxuICAgICAgICAgICAgYmFzZVJlc3VsdC5ydWxlU3RhY2sgPSBbYmFzZVJlc3VsdC5ydWxlU3RhY2tbMF1dO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRhZ3MgPSB0aGlzLmdldENzVG9rZW5zRm9yTGluZShoaWdobGlnaHRzLCBsaW5lLCByb3csIHJ1bGVTdGFjaywgZmlyc3RMaW5lLCBiYXNlUmVzdWx0LnRhZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBiYXNlUmVzdWx0LnRhZ3MgPSB0YWdzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJhc2VSZXN1bHQ7XHJcbn07XHJcblxyXG4oR3JhbW1hci5wcm90b3R5cGUgYXMgYW55KS5nZXRDc1Rva2Vuc0ZvckxpbmUgPSBmdW5jdGlvbiAoaGlnaGxpZ2h0czogTW9kZWxzLkhpZ2hsaWdodFNwYW5bXSwgbGluZTogc3RyaW5nLCByb3c6IG51bWJlciwgcnVsZVN0YWNrOiBhbnlbXSwgZmlyc3RMaW5lOiBib29sZWFuLCB0YWdzOiBudW1iZXJbXSkge1xyXG4gICAgcnVsZVN0YWNrID0gW3sgcnVsZTogdGhpcy5nZXRJbml0aWFsUnVsZSgpIH1dO1xyXG5cclxuICAgIGVhY2goaGlnaGxpZ2h0cywgKGhpZ2hsaWdodCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uIC0gMTtcclxuICAgICAgICBjb25zdCBlbmQgPSBoaWdobGlnaHQuRW5kQ29sdW1uIC0gMTtcclxuXHJcbiAgICAgICAgaWYgKGhpZ2hsaWdodC5FbmRMaW5lID4gaGlnaGxpZ2h0LlN0YXJ0TGluZSAmJiBoaWdobGlnaHQuU3RhcnRDb2x1bW4gPT09IDAgJiYgaGlnaGxpZ2h0LkVuZENvbHVtbiA9PT0gMCkge1xyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgMCwgdGFncy5sZW5ndGggLSAxLCBsaW5lKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGRpc3RhbmNlID0gLTE7XHJcbiAgICAgICAgbGV0IGluZGV4ID0gLTE7XHJcbiAgICAgICAgbGV0IGk6IG51bWJlcjtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcclxuICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSArIHRhZ3NbaV0gPiBzdGFydCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRpc3RhbmNlICs9IHRhZ3NbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN0ciA9IGxpbmUuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpO1xyXG4gICAgICAgIGNvbnN0IHNpemUgPSBlbmQgLSBzdGFydDtcclxuICAgICAgICBpZiAodGFnc1tpbmRleF0gPj0gc2l6ZSkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWVzOiBudW1iZXJbXTtcclxuICAgICAgICAgICAgbGV0IHByZXY6IG51bWJlciwgbmV4dDogbnVtYmVyO1xyXG4gICAgICAgICAgICBpZiAoZGlzdGFuY2UgPT09IHN0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbc2l6ZSwgdGFnc1tpbmRleF0gLSBzaXplXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHByZXYgPSBzdGFydCAtIGRpc3RhbmNlO1xyXG4gICAgICAgICAgICAgICAgbmV4dCA9IHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXY7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV4dCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbcHJldiwgc2l6ZSwgdGFnc1tpbmRleF0gLSBzaXplIC0gcHJldl07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0YWdzLnNwbGljZShpbmRleCwgMSwgLi4udmFsdWVzKTtcclxuICAgICAgICAgICAgaWYgKHByZXYpIGluZGV4ID0gaW5kZXggKyAxO1xyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgaW5kZXgsIGluZGV4ICsgMSwgc3RyKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRhZ3NbaW5kZXhdIDwgc2l6ZSkge1xyXG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgbGV0IGJhY2t0cmFja0Rpc3RhbmNlID0gMDtcclxuICAgICAgICAgICAgZm9yIChpID0gYmFja3RyYWNrSW5kZXg7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYmFja3RyYWNrRGlzdGFuY2UgPj0gc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tEaXN0YW5jZSArPSB0YWdzW2ldO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrdHJhY2tEaXN0YW5jZSA+PSBzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBmb3J3YXJkdHJhY2tJbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICBsZXQgcmVtYWluaW5nU2l6ZSA9IHNpemU7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IGluZGV4ICsgMTsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICgocmVtYWluaW5nU2l6ZSA8PSAwICYmIHRhZ3NbaV0gPiAwKS8qIHx8IHRhZ3NbaV0gJSAyID09PSAtMSovKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NpemUgLT0gdGFnc1tpXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBIYW5kbGVzIGNhc2Ugd2hlcmUgdGhlcmUgaXMgYSBjbG9zaW5nIHRhZ1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGJ1dCBubyBvcGVuaW5nIHRhZyBoZXJlLlxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBvcGVuRm91bmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBoID0gaTsgaCA+PSAwOyBoLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhZ3NbaF0gPT09IHRhZ3NbaV0gKyAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvcGVuRm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA9PT0gdGFncy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gdGFncy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgYmFja3RyYWNrSW5kZXgsIGZvcndhcmR0cmFja0luZGV4LCBzdHIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB0YWdzO1xyXG59O1xyXG5cclxuY29uc3QgZ2V0SWRGb3JTY29wZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBpZHM6IHsgW2tleTogc3RyaW5nXTogeyBba2V5OiBzdHJpbmddOiBudW1iZXIgfTsgfSA9IHt9O1xyXG4gICAgY29uc3QgZ3JhbW1hcnM6IGFueSA9IHt9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyTmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9IGZpbmQoYXRvbS5ncmFtbWFycy5nZXRHcmFtbWFycygpLCBnYW1tciA9PiBnYW1tci5uYW1lID09PSBncmFtbWFyTmFtZSk7XHJcbiAgICAgICAgaWYgKCFncmFtbWFyKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlkc1tncmFtbWFyLm5hbWVdID0ge307XHJcbiAgICAgICAgZ3JhbW1hcnNbZ3JhbW1hci5uYW1lXSA9IGdyYW1tYXI7XHJcblxyXG4gICAgICAgIGVhY2goZ3JhbW1hci5yZWdpc3RyeS5zY29wZXNCeUlkLCAodmFsdWU6IHN0cmluZywga2V5OiBhbnkpID0+IHsgaWRzW2dyYW1tYXIubmFtZV1bdmFsdWVdID0gK2tleTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWV0aG9kID0gKGdyYW1tYXI6IHN0cmluZywgc2NvcGU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIGlmICghaWRzW2dyYW1tYXJdKSB7XHJcbiAgICAgICAgICAgIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaWRzW2dyYW1tYXJdW3Njb3BlXSlcclxuICAgICAgICAgICAgaWRzW2dyYW1tYXJdW3Njb3BlXSA9IGdyYW1tYXJzW2dyYW1tYXJdLnJlZ2lzdHJ5LnN0YXJ0SWRGb3JTY29wZShzY29wZSk7XHJcblxyXG4gICAgICAgIHJldHVybiAraWRzW2dyYW1tYXJdW3Njb3BlXTtcclxuICAgIH07XHJcblxyXG4gICAgKDxhbnk+bWV0aG9kKS5lbmQgPSAoc2NvcGU6IG51bWJlcikgPT4gK3Njb3BlIC0gMTtcclxuXHJcbiAgICByZXR1cm4gPHsgKGdyYW1tYXI6IHN0cmluZywgc2NvcGU6IHN0cmluZyk6IG51bWJlcjsgZW5kOiAoc2NvcGU6IG51bWJlcikgPT4gbnVtYmVyOyB9Pm1ldGhvZDtcclxufSkoKTtcclxuXHJcblxyXG4vLy8gTk9URTogYmVzdCB3YXkgSSBoYXZlIGZvdW5kIGZvciB0aGVzZSBpcyB0byBqdXN0IGxvb2sgYXQgdGhlbWUgXCJsZXNzXCIgZmlsZXNcclxuLy8gQWx0ZXJuYXRpdmVseSBqdXN0IGluc3BlY3QgdGhlIHRva2VuIGZvciBhIC5qcyBmaWxlXHJcbmZ1bmN0aW9uIGdldEF0b21TdHlsZUZvclRva2VuKGdyYW1tYXI6IHN0cmluZywgdGFnczogbnVtYmVyW10sIHRva2VuOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbiwgaW5kZXg6IG51bWJlciwgaW5kZXhFbmQ6IG51bWJlciwgc3RyOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHByZXZpb3VzU2NvcGVzOiBhbnlbXSA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IGluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICBpZiAodGFnc1tpXSA+IDApXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2godGFnc1tpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVwbGFjZW1lbnRzOiB7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyOyByZXBsYWNlbWVudDogbnVtYmVyW10gfVtdID0gW107XHJcbiAgICBjb25zdCBvcGVuczogeyB0YWc6IG51bWJlcjsgaW5kZXg6IG51bWJlciB9W10gPSBbXTtcclxuICAgIGNvbnN0IGNsb3NlczogdHlwZW9mIG9wZW5zID0gW107XHJcblxyXG4gICAgLy8gU2NhbiBmb3IgYW55IHVuY2xvc2VkIG9yIHVub3BlbmVkIHRhZ3NcclxuICAgIGZvciAobGV0IGkgPSBpbmRleDsgaSA8IGluZGV4RW5kOyBpKyspIHtcclxuICAgICAgICBpZiAodGFnc1tpXSA+IDApIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBvcGVuSW5kZXggPSBmaW5kSW5kZXgob3BlbnMsIHggPT4geC50YWcgPT09ICh0YWdzW2ldICsgMSkpO1xyXG4gICAgICAgICAgICBpZiAob3BlbkluZGV4ID4gLTEpIHtcclxuICAgICAgICAgICAgICAgIG9wZW5zLnNwbGljZShvcGVuSW5kZXgsIDEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY2xvc2VzLnB1c2goeyB0YWc6IHRhZ3NbaV0sIGluZGV4OiBpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgb3BlbnMudW5zaGlmdCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCB1bmZ1bGxmaWxsZWQ6IHR5cGVvZiBvcGVucyA9IFtdO1xyXG4gICAgaWYgKGNsb3Nlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdW5mdWxsZmlsbGVkID0gc29ydEJ5KG9wZW5zLmNvbmNhdChjbG9zZXMpLCB4ID0+IHguaW5kZXgpO1xyXG4gICAgfSBlbHNlIGlmIChvcGVucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgLy8gR3JhYiB0aGUgbGFzdCBrbm93biBvcGVuLCBhbmQgYXBwZW5kIGZyb20gdGhlcmVcclxuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBvcGVuc1tvcGVucy5sZW5ndGggLSAxXS5pbmRleCxcclxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2Uob3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsIGluZGV4RW5kICsgMSlcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgaW50ZXJuYWxJbmRleCA9IGluZGV4O1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmZ1bGxmaWxsZWQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCB2ID0gdW5mdWxsZmlsbGVkW2ldO1xyXG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogdi5pbmRleCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW50ZXJuYWxJbmRleCwgdi5pbmRleClcclxuICAgICAgICB9KTtcclxuICAgICAgICBpbnRlcm5hbEluZGV4ID0gdi5pbmRleCArIDE7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlcGxhY2VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBpbmRleCxcclxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW5kZXgsIGluZGV4RW5kKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvKnJlcGxhY2VtZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGludGVybmFsSW5kZXgsIGluZGV4RW5kKVxyXG4gICAgICAgIH0pOyovXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkKHNjb3BlOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBpZCA9IGdldElkRm9yU2NvcGUoZ3JhbW1hciwgc2NvcGUpO1xyXG4gICAgICAgIGlmIChpZCA9PT0gLTEpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKCFzb21lKHByZXZpb3VzU2NvcGVzLCB6ID0+IHogPT09IGlkKSkge1xyXG4gICAgICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKGlkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gY3R4LnJlcGxhY2VtZW50O1xyXG4gICAgICAgICAgICByZXBsYWNlbWVudC51bnNoaWZ0KGlkKTtcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQucHVzaChnZXRJZEZvclNjb3BlLmVuZChpZCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgc3dpdGNoICh0b2tlbi5LaW5kKSB7XHJcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxyXG4gICAgICAgICAgICBhZGQoYGNvbnN0YW50Lm51bWVyaWNgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcInN0cnVjdCBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuc3RydWN0YCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJlbnVtIG5hbWVcIjpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNvbnN0YW50Lm51bWVyaWMuaWRlbnRpZmllci5lbnVtYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6XHJcbiAgICAgICAgICAgIGFkZChgaWRlbnRpZmllcmApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiY2xhc3MgbmFtZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJkZWxlZ2F0ZSBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXIuZGVsZWdhdGVgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImludGVyZmFjZSBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXIuaW50ZXJmYWNlYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiOlxyXG4gICAgICAgICAgICBhZGQoYGNvbnN0YW50Lm90aGVyLnN5bWJvbGApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiZXhjbHVkZWQgY29kZVwiOlxyXG4gICAgICAgICAgICBhZGQoYGNvbW1lbnQuYmxvY2tgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcInVudXNlZCBjb2RlXCI6XHJcbiAgICAgICAgICAgIGFkZChgdW51c2VkYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidW5oYW5kbGVkIEtpbmQgXCIgKyB0b2tlbi5LaW5kKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcblxyXG4gICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XHJcbiAgICAgICAgY29uc3Qge3JlcGxhY2VtZW50LCBlbmQsIHN0YXJ0fSA9IGN0eDtcclxuICAgICAgICBpZiAocmVwbGFjZW1lbnQubGVuZ3RoID09PSAyKSByZXR1cm47XHJcbiAgICAgICAgbGV0IG51bSA9IGVuZCAtIHN0YXJ0O1xyXG4gICAgICAgIGlmIChudW0gPD0gMCkge1xyXG4gICAgICAgICAgICBudW0gPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0YWdzLnNwbGljZShzdGFydCwgbnVtLCAuLi5yZXBsYWNlbWVudCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0R3JhbW1hcihncmFtbWFyOiBGaXJzdE1hdGUuR3JhbW1hcik6IEZpcnN0TWF0ZS5HcmFtbWFyIHtcclxuICAgIGNvbnN0IGcyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKHRoaXMsIGdyYW1tYXIpO1xyXG4gICAgaWYgKGcyICE9PSBncmFtbWFyKVxyXG4gICAgICAgIHRoaXMuX3NldEdyYW1tYXIoZzIpO1xyXG4gICAgcmV0dXJuIGcyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5oYW5jZWRHcmFtbWFyKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBncmFtbWFyPzogRmlyc3RNYXRlLkdyYW1tYXIsIG9wdGlvbnM/OiB7IHJlYWRvbmx5OiBib29sZWFuIH0pIHtcclxuICAgIGlmICghZ3JhbW1hcikgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XHJcbiAgICBpZiAoIWdyYW1tYXJbXCJvbW5pc2hhcnBcIl0gJiYgT21uaS5pc1ZhbGlkR3JhbW1hcihncmFtbWFyKSkge1xyXG4gICAgICAgIGNvbnN0IG5ld0dyYW1tYXIgPSBuZXcgR3JhbW1hcihlZGl0b3IsIGdyYW1tYXIsIG9wdGlvbnMpO1xyXG4gICAgICAgIGVhY2goZ3JhbW1hciwgKHgsIGkpID0+IHtcclxuICAgICAgICAgICAgaWYgKGhhcyhncmFtbWFyLCBpKSkge1xyXG4gICAgICAgICAgICAgICAgbmV3R3JhbW1hcltpXSA9IHg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBncmFtbWFyID0gPGFueT5uZXdHcmFtbWFyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGdyYW1tYXI7XHJcbn1cclxuXHJcbi8vIFVzZWQgdG8gY2FjaGUgdmFsdWVzIGZvciBzcGVjaWZpYyBlZGl0b3JzXHJcbmNsYXNzIFVudXNlZE1hcCB7XHJcbiAgICBwcml2YXRlIF9tYXAgPSBuZXcgTWFwPHN0cmluZywgT2JzZXJ2YWJsZTxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+PigpO1xyXG4gICAgcHVibGljIGdldChrZXk6IHN0cmluZykge1xyXG4gICAgICAgIGlmICghdGhpcy5fbWFwLmhhcyhrZXkpKSB0aGlzLl9tYXAuc2V0KGtleSwgPGFueT5uZXcgQmVoYXZpb3JTdWJqZWN0PE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4oW10pKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLmdldChrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldE9ic2VydmVyKGtleTogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIDxTdWJzY3JpYmVyPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4gJiB7IGdldFZhbHVlKCk6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSB9Pjxhbnk+dGhpcy5nZXQoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0KGtleTogc3RyaW5nLCB2YWx1ZT86IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSkge1xyXG4gICAgICAgIGNvbnN0IG8gPSB0aGlzLl9nZXRPYnNlcnZlcihrZXkpO1xyXG4gICAgICAgIGlmICghaXNFcXVhbChvLmdldFZhbHVlKCksIHZhbHVlKSkge1xyXG4gICAgICAgICAgICBvLm5leHQodmFsdWUgfHwgW10pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGVsZXRlKGtleTogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX21hcC5oYXMoa2V5KSlcclxuICAgICAgICAgICAgdGhpcy5fbWFwLmRlbGV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9tYXAuY2xlYXIoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGVuaGFuY2VkSGlnaGxpZ2h0aW5nMTkgPSBuZXcgSGlnaGxpZ2h0O1xyXG4iLCJpbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBpc09tbmlzaGFycFRleHRFZGl0b3IgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xuaW1wb3J0IHsgZWFjaCwgZXh0ZW5kLCBoYXMsIHNvbWUsIHJhbmdlLCByZW1vdmUsIHB1bGwsIGZpbmQsIGNoYWluLCB1bmlxLCBmaW5kSW5kZXgsIGV2ZXJ5LCBpc0VxdWFsLCBtaW4sIGRlYm91bmNlLCBzb3J0QnksIHVuaXF1ZUlkLCBmaWx0ZXIgfSBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0LCBSZXBsYXlTdWJqZWN0LCBCZWhhdmlvclN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgcmVnaXN0ZXJDb250ZXh0SXRlbSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XG5jb25zdCBBdG9tR3JhbW1hciA9IHJlcXVpcmUoYXRvbS5jb25maWcucmVzb3VyY2VQYXRoICsgXCIvbm9kZV9tb2R1bGVzL2ZpcnN0LW1hdGUvbGliL2dyYW1tYXIuanNcIik7XG5jb25zdCBERUJPVU5DRV9USU1FID0gMjQwO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmNvbnN0IEhJR0hMSUdIVCA9IFwiSElHSExJR0hUXCIsIEhJR0hMSUdIVF9SRVFVRVNUID0gXCJISUdITElHSFRfUkVRVUVTVFwiO1xuZnVuY3Rpb24gZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKHBhdGgsIHF1aWNrRml4ZXMsIHByb2plY3ROYW1lcykge1xuICAgIHJldHVybiBjaGFpbihxdWlja0ZpeGVzKVxuICAgICAgICAuZmlsdGVyKHggPT4geC5GaWxlTmFtZSA9PT0gcGF0aClcbiAgICAgICAgLm1hcCh4ID0+ICh7XG4gICAgICAgIFN0YXJ0TGluZTogeC5MaW5lLFxuICAgICAgICBTdGFydENvbHVtbjogeC5Db2x1bW4sXG4gICAgICAgIEVuZExpbmU6IHguRW5kTGluZSxcbiAgICAgICAgRW5kQ29sdW1uOiB4LkVuZENvbHVtbixcbiAgICAgICAgS2luZDogXCJ1bnVzZWQgY29kZVwiLFxuICAgICAgICBQcm9qZWN0czogcHJvamVjdE5hbWVzXG4gICAgfSkpXG4gICAgICAgIC52YWx1ZSgpO1xufVxuZXhwb3J0IGNvbnN0IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMgPSBbXG4gICAgMixcbiAgICAzLFxuICAgIDUsXG4gICAgNCxcbiAgICA2XG5dO1xuY2xhc3MgSGlnaGxpZ2h0IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cyA9IG5ldyBVbnVzZWRNYXAoKTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJFbmhhbmNlZCBIaWdobGlnaHRpbmdcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiRW5hYmxlcyBzZXJ2ZXIgYmFzZWQgaGlnaGxpZ2h0aW5nLCB3aGljaCBpbmNsdWRlcyBzdXBwb3J0IGZvciBzdHJpbmcgaW50ZXJwb2xhdGlvbiwgY2xhc3MgbmFtZXMgYW5kIG1vcmUuXCI7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IGZhbHNlO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgaWYgKCEoT21uaS5hdG9tVmVyc2lvbi5taW5vciAhPT0gMSB8fCBPbW5pLmF0b21WZXJzaW9uLm1pbm9yID4gOCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmVkaXRvcnMgPSBbXTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChyZWdpc3RlckNvbnRleHRJdGVtKEhJR0hMSUdIVF9SRVFVRVNULCAoY29udGV4dCkgPT4gbmV3IFN1YmplY3QoKSksIHJlZ2lzdGVyQ29udGV4dEl0ZW0oSElHSExJR0hULCAoY29udGV4dCwgZWRpdG9yKSA9PiBjb250ZXh0LmdldChISUdITElHSFRfUkVRVUVTVClcbiAgICAgICAgICAgIC5zdGFydFdpdGgodHJ1ZSlcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwKVxuICAgICAgICAgICAgLnN3aXRjaE1hcCgoKSA9PiBPYnNlcnZhYmxlLmRlZmVyKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3RzID0gY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lID09PSBcImFsbFwiID8gW10gOiBbY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lXTtcbiAgICAgICAgICAgIGxldCBsaW5lc1RvRmV0Y2ggPSB1bmlxKGVkaXRvci5nZXRHcmFtbWFyKCkubGluZXNUb0ZldGNoKTtcbiAgICAgICAgICAgIGlmICghbGluZXNUb0ZldGNoIHx8ICFsaW5lc1RvRmV0Y2gubGVuZ3RoKVxuICAgICAgICAgICAgICAgIGxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuY29tYmluZUxhdGVzdCh0aGlzLnVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKSwgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uaGlnaGxpZ2h0KHtcbiAgICAgICAgICAgICAgICBQcm9qZWN0TmFtZXM6IHByb2plY3RzLFxuICAgICAgICAgICAgICAgIExpbmVzOiBsaW5lc1RvRmV0Y2gsXG4gICAgICAgICAgICAgICAgRXhjbHVkZUNsYXNzaWZpY2F0aW9uczogRXhjbHVkZUNsYXNzaWZpY2F0aW9uc1xuICAgICAgICAgICAgfSkpLCAocXVpY2tmaXhlcywgcmVzcG9uc2UpID0+ICh7XG4gICAgICAgICAgICAgICAgZWRpdG9yLFxuICAgICAgICAgICAgICAgIHByb2plY3RzLFxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodHM6IGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCBxdWlja2ZpeGVzLCBwcm9qZWN0cykuY29uY2F0KHJlc3BvbnNlID8gcmVzcG9uc2UuSGlnaGxpZ2h0cyA6IFtdKVxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgLmRvKCh7IGhpZ2hsaWdodHMgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcikge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnNldFJlc3BvbnNlcyhoaWdobGlnaHRzLCBwcm9qZWN0cy5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXG4gICAgICAgICAgICAgICAgLnJlZkNvdW50KCk7XG4gICAgICAgIH0pKSksIE9tbmkubGlzdGVuZXIubW9kZWwuZGlhZ25vc3RpY3NCeUZpbGVcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY2hhbmdlcyA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBbZmlsZSwgZGlhZ25vc3RpY3NdIG9mIGNoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLnNldChmaWxlLCBmaWx0ZXIoZGlhZ25vc3RpY3MsIHggPT4geC5Mb2dMZXZlbCA9PT0gXCJIaWRkZW5cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSwgT21uaS5lYWNoRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldHVwRWRpdG9yKGVkaXRvciwgY2QpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbW5pc2hhcnBcbiAgICAgICAgICAgICAgICAuZ2V0KEhJR0hMSUdIVClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldChISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcbiAgICAgICAgfSksIE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldChISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcbiAgICAgICAgICAgIGlmIChlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSwgRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5jbGVhcigpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0dXBFZGl0b3IoZWRpdG9yLCBkaXNwb3NhYmxlKSB7XG4gICAgICAgIGlmIChlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSB8fCAhZWRpdG9yLmdldEdyYW1tYXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGlzc3VlUmVxdWVzdCA9IGVkaXRvci5vbW5pc2hhcnAuZ2V0KEhJR0hMSUdIVF9SRVFVRVNUKTtcbiAgICAgICAgYXVnbWVudEVkaXRvcihlZGl0b3IsIHRoaXMudW51c2VkQ29kZVJvd3MsIHRydWUpO1xuICAgICAgICB0aGlzLmVkaXRvcnMucHVzaChlZGl0b3IpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzLmNsZWFyKCk7XG4gICAgICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcygpO1xuICAgICAgICAgICAgZGVsZXRlIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICBwdWxsKHRoaXMuZWRpdG9ycywgZWRpdG9yKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnByb2plY3RcbiAgICAgICAgICAgIC5vYnNlcnZlLmFjdGl2ZUZyYW1ld29ya1xuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzLmNsZWFyKCk7XG4gICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoKCkgPT4gaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSkpKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkU2F2ZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvblxuICAgICAgICAgICAgLndoZW5Db25uZWN0ZWQoKVxuICAgICAgICAgICAgLmRlbGF5KDEwMDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudEVkaXRvcihlZGl0b3IsIHVudXNlZENvZGVSb3dzID0gbnVsbCwgZG9TZXRHcmFtbWFyID0gZmFsc2UpIHtcbiAgICBpZiAoIWVkaXRvcltcIl9vbGRHcmFtbWFyXCJdKVxuICAgICAgICBlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgaWYgKCFlZGl0b3JbXCJfc2V0R3JhbW1hclwiXSlcbiAgICAgICAgZWRpdG9yW1wiX3NldEdyYW1tYXJcIl0gPSBlZGl0b3Iuc2V0R3JhbW1hcjtcbiAgICBpZiAoIWVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0O1xuICAgIGlmICghZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdID0gZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGU7XG4gICAgaWYgKCFlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX3JldG9rZW5pemVMaW5lc1wiXSlcbiAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcztcbiAgICBpZiAoIWVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfdG9rZW5pemVJbkJhY2tncm91bmRcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfdG9rZW5pemVJbkJhY2tncm91bmRcIl0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnRva2VuaXplSW5CYWNrZ3JvdW5kO1xuICAgIGlmICghZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9jaHVua1NpemVcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJjaHVua1NpemVcIl0gPSAyMDtcbiAgICBlZGl0b3Iuc2V0R3JhbW1hciA9IHNldEdyYW1tYXI7XG4gICAgaWYgKGRvU2V0R3JhbW1hcilcbiAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSk7XG4gICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dCA9IGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKVtcIl9fcm93X19cIl0gPSByb3c7XG4gICAgICAgIHJldHVybiBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBpZiAoIWVkaXRvci50b2tlbml6ZWRCdWZmZXIuc2lsZW50UmV0b2tlbml6ZUxpbmVzKSB7XG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIuc2lsZW50UmV0b2tlbml6ZUxpbmVzID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xuICAgICAgICAgICAgbGV0IGxhc3RSb3c7XG4gICAgICAgICAgICBsYXN0Um93ID0gdGhpcy5idWZmZXIuZ2V0TGFzdFJvdygpO1xuICAgICAgICAgICAgdGhpcy50b2tlbml6ZWRMaW5lcyA9IHRoaXMuYnVpbGRQbGFjZWhvbGRlclRva2VuaXplZExpbmVzRm9yUm93cygwLCBsYXN0Um93KTtcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZFJvd3MgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmxpbmVzVG9Ub2tlbml6ZSAmJiB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3cobWluKHRoaXMubGluZXNUb1Rva2VuaXplKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3coMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZ1bGx5VG9rZW5pemVkID0gZmFsc2U7XG4gICAgICAgIH0sIERFQk9VTkNFX1RJTUUsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgfVxuICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIubWFya1Rva2VuaXphdGlvbkNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcpXG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KHRydWUpO1xuICAgICAgICByZXR1cm4gZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcpXG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KGZhbHNlKTtcbiAgICAgICAgcmV0dXJuIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnRva2VuaXplSW5CYWNrZ3JvdW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMudmlzaWJsZSB8fCB0aGlzLnBlbmRpbmdDaHVuayB8fCAhdGhpcy5pc0FsaXZlKCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gdHJ1ZTtcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wZW5kaW5nQ2h1bmsgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQWxpdmUoKSAmJiB0aGlzLmJ1ZmZlci5pc0FsaXZlKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRva2VuaXplTmV4dENodW5rKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5zY29wZXNGcm9tVGFncyA9IGZ1bmN0aW9uIChzdGFydGluZ1Njb3BlcywgdGFncykge1xuICAgICAgICBjb25zdCBzY29wZXMgPSBzdGFydGluZ1Njb3Blcy5zbGljZSgpO1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRhZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRhZyA9IHRhZ3NbaV07XG4gICAgICAgICAgICBpZiAodGFnIDwgMCkge1xuICAgICAgICAgICAgICAgIGlmICgodGFnICUgMikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3Blcy5wdXNoKHRhZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGluZ1N0YXJ0VGFnID0gdGFnICsgMTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMucG9wKCkgPT09IG1hdGNoaW5nU3RhcnRUYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2goZ3JhbW1hci5zdGFydElkRm9yU2NvcGUoYC4ke2dyYW1tYXIuc2NvcGVOYW1lfWApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oXCJFbmNvdW50ZXJlZCBhbiB1bm1hdGNoZWQgc2NvcGUgZW5kIHRhZy5cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogZWRpdG9yLmJ1ZmZlci5nZXRQYXRoKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW1tYXJTY29wZU5hbWU6IGdyYW1tYXIuc2NvcGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVubWF0Y2hlZEVuZFRhZzogZ3JhbW1hci5zY29wZUZvcklkKHRhZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnNldFJlc3BvbnNlcyhbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVudXNlZENvZGVSb3dzICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocm93cyA9PiBlZGl0b3IuZ2V0R3JhbW1hcigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0UmVzcG9uc2VzKGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCByb3dzLCBbXSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlcztcbiAgICB9O1xufVxuY2xhc3MgR3JhbW1hciB7XG4gICAgY29uc3RydWN0b3IoZWRpdG9yLCBiYXNlLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2dpZCA9IHVuaXF1ZUlkKFwib2dcIik7XG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nID0gbmV3IFJlcGxheVN1YmplY3QoMSk7XG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLnJlc3BvbnNlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB7fTtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnJlYWRvbmx5KSB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkucHJlZW1wdERpZENoYW5nZSgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgb2xkUmFuZ2UsIG5ld1JhbmdlIH0gPSBlO1xuICAgICAgICAgICAgICAgIGxldCBzdGFydCA9IG9sZFJhbmdlLnN0YXJ0LnJvdywgZGVsdGEgPSBuZXdSYW5nZS5lbmQucm93IC0gb2xkUmFuZ2UuZW5kLnJvdztcbiAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0IC0gNTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnQgPCAwKVxuICAgICAgICAgICAgICAgICAgICBzdGFydCA9IDA7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5kID0gZWRpdG9yLmJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDE7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSByYW5nZShzdGFydCwgZW5kICsgMSk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5rZXlzKCkubmV4dCgpLmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2gucHVzaCguLi5saW5lcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGxpbmVzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkRnJvbSA9IG9sZFJhbmdlLnN0YXJ0LmNvbHVtbiwgbmV3RnJvbSA9IG5ld1JhbmdlLnN0YXJ0LmNvbHVtbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZShyZXNwb25zZUxpbmUsIChzcGFuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRMaW5lIDwgbGluZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG9sZEZyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gb2xkRnJvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gbmV3RnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBuZXdGcm9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWFjaChsaW5lcywgbGluZSA9PiB7IHRoaXMucmVzcG9uc2VzLmRlbGV0ZShsaW5lKTsgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkZWx0YSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBjb3VudCAtIDE7IGkgPiBlbmQ7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VzLmhhcyhpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpICsgZGVsdGEsIHRoaXMucmVzcG9uc2VzLmdldChpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWJzRGVsdGEgPSBNYXRoLmFicyhkZWx0YSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBlbmQ7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkgKyBhYnNEZWx0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaSwgdGhpcy5yZXNwb25zZXMuZ2V0KGkgKyBhYnNEZWx0YSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLmRlbGV0ZShpICsgYWJzRGVsdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0UmVzcG9uc2VzKHZhbHVlLCBlbmFibGVFeGNsdWRlQ29kZSkge1xuICAgICAgICBjb25zdCByZXN1bHRzID0gY2hhaW4odmFsdWUpO1xuICAgICAgICBjb25zdCBncm91cGVkSXRlbXMgPSByZXN1bHRzLm1hcChoaWdobGlnaHQgPT4gcmFuZ2UoaGlnaGxpZ2h0LlN0YXJ0TGluZSwgaGlnaGxpZ2h0LkVuZExpbmUgKyAxKVxuICAgICAgICAgICAgLm1hcChsaW5lID0+ICh7IGxpbmUsIGhpZ2hsaWdodCB9KSkpXG4gICAgICAgICAgICAuZmxhdHRlbigpXG4gICAgICAgICAgICAuZ3JvdXBCeSh6ID0+IHoubGluZSlcbiAgICAgICAgICAgIC52YWx1ZSgpO1xuICAgICAgICBlYWNoKGdyb3VwZWRJdGVtcywgKGl0ZW0sIGtleSkgPT4ge1xuICAgICAgICAgICAgbGV0IGsgPSAra2V5LCBtYXBwZWRJdGVtID0gaXRlbS5tYXAoeCA9PiB4LmhpZ2hsaWdodCk7XG4gICAgICAgICAgICBpZiAoIWVuYWJsZUV4Y2x1ZGVDb2RlIHx8IHNvbWUobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIikgJiYgZXZlcnkobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwiZXhjbHVkZWQgY29kZVwiIHx8IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSkge1xuICAgICAgICAgICAgICAgIG1hcHBlZEl0ZW0gPSBtYXBwZWRJdGVtLmZpbHRlcih6ID0+IHouS2luZCAhPT0gXCJleGNsdWRlZCBjb2RlXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMoaykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChrKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lLmxlbmd0aCAhPT0gbWFwcGVkSXRlbS5sZW5ndGggfHwgc29tZShyZXNwb25zZUxpbmUsIChsLCBpKSA9PiAhaXNFcXVhbChsLCBtYXBwZWRJdGVtW2ldKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXh0ZW5kKEdyYW1tYXIucHJvdG90eXBlLCBBdG9tR3JhbW1hci5wcm90b3R5cGUpO1xuR3JhbW1hci5wcm90b3R5cGVbXCJvbW5pc2hhcnBcIl0gPSB0cnVlO1xuR3JhbW1hci5wcm90b3R5cGVbXCJ0b2tlbml6ZUxpbmVcIl0gPSBmdW5jdGlvbiAobGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUgPSBmYWxzZSkge1xuICAgIGNvbnN0IGJhc2VSZXN1bHQgPSBBdG9tR3JhbW1hci5wcm90b3R5cGUudG9rZW5pemVMaW5lLmNhbGwodGhpcywgbGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUpO1xuICAgIGxldCB0YWdzO1xuICAgIGlmICh0aGlzLnJlc3BvbnNlcykge1xuICAgICAgICBjb25zdCByb3cgPSB0aGlzW1wiX19yb3dfX1wiXTtcbiAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMocm93KSlcbiAgICAgICAgICAgIHJldHVybiBiYXNlUmVzdWx0O1xuICAgICAgICBjb25zdCBoaWdobGlnaHRzID0gdGhpcy5yZXNwb25zZXMuZ2V0KHJvdyk7XG4gICAgICAgIGlmIChoaWdobGlnaHRzWzBdICYmIGhpZ2hsaWdodHNbMF0uS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIpIHtcbiAgICAgICAgICAgIHRhZ3MgPSBbbGluZS5sZW5ndGhdO1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHRzWzBdLCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xuICAgICAgICAgICAgYmFzZVJlc3VsdC5ydWxlU3RhY2sgPSBbYmFzZVJlc3VsdC5ydWxlU3RhY2tbMF1dO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGFncyA9IHRoaXMuZ2V0Q3NUb2tlbnNGb3JMaW5lKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIGJhc2VSZXN1bHQudGFncyk7XG4gICAgICAgIH1cbiAgICAgICAgYmFzZVJlc3VsdC50YWdzID0gdGFncztcbiAgICB9XG4gICAgcmV0dXJuIGJhc2VSZXN1bHQ7XG59O1xuR3JhbW1hci5wcm90b3R5cGUuZ2V0Q3NUb2tlbnNGb3JMaW5lID0gZnVuY3Rpb24gKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIHRhZ3MpIHtcbiAgICBydWxlU3RhY2sgPSBbeyBydWxlOiB0aGlzLmdldEluaXRpYWxSdWxlKCkgfV07XG4gICAgZWFjaChoaWdobGlnaHRzLCAoaGlnaGxpZ2h0KSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uIC0gMTtcbiAgICAgICAgY29uc3QgZW5kID0gaGlnaGxpZ2h0LkVuZENvbHVtbiAtIDE7XG4gICAgICAgIGlmIChoaWdobGlnaHQuRW5kTGluZSA+IGhpZ2hsaWdodC5TdGFydExpbmUgJiYgaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uID09PSAwICYmIGhpZ2hsaWdodC5FbmRDb2x1bW4gPT09IDApIHtcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaXN0YW5jZSA9IC0xO1xuICAgICAgICBsZXQgaW5kZXggPSAtMTtcbiAgICAgICAgbGV0IGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgKyB0YWdzW2ldID4gc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgKz0gdGFnc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdHIgPSBsaW5lLnN1YnN0cmluZyhzdGFydCwgZW5kKTtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IGVuZCAtIHN0YXJ0O1xuICAgICAgICBpZiAodGFnc1tpbmRleF0gPj0gc2l6ZSkge1xuICAgICAgICAgICAgbGV0IHZhbHVlcztcbiAgICAgICAgICAgIGxldCBwcmV2LCBuZXh0O1xuICAgICAgICAgICAgaWYgKGRpc3RhbmNlID09PSBzdGFydCkge1xuICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtzaXplLCB0YWdzW2luZGV4XSAtIHNpemVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJldiA9IHN0YXJ0IC0gZGlzdGFuY2U7XG4gICAgICAgICAgICAgICAgbmV4dCA9IHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXY7XG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplLCB0YWdzW2luZGV4XSAtIHNpemUgLSBwcmV2XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YWdzLnNwbGljZShpbmRleCwgMSwgLi4udmFsdWVzKTtcbiAgICAgICAgICAgIGlmIChwcmV2KVxuICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXggKyAxO1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGluZGV4LCBpbmRleCArIDEsIHN0cik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGFnc1tpbmRleF0gPCBzaXplKSB7XG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tEaXN0YW5jZSA9IDA7XG4gICAgICAgICAgICBmb3IgKGkgPSBiYWNrdHJhY2tJbmRleDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0Rpc3RhbmNlICs9IHRhZ3NbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrdHJhY2tEaXN0YW5jZSA+PSBzaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGkgKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZm9yd2FyZHRyYWNrSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGxldCByZW1haW5pbmdTaXplID0gc2l6ZTtcbiAgICAgICAgICAgIGZvciAoaSA9IGluZGV4ICsgMTsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoKHJlbWFpbmluZ1NpemUgPD0gMCAmJiB0YWdzW2ldID4gMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmdTaXplIC09IHRhZ3NbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBvcGVuRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IGk7IGggPj0gMDsgaC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFnc1toXSA9PT0gdGFnc1tpXSArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghb3BlbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IGkgLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA9PT0gdGFncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IHRhZ3MubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCBiYWNrdHJhY2tJbmRleCwgZm9yd2FyZHRyYWNrSW5kZXgsIHN0cik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdGFncztcbn07XG5jb25zdCBnZXRJZEZvclNjb3BlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBpZHMgPSB7fTtcbiAgICBjb25zdCBncmFtbWFycyA9IHt9O1xuICAgIGZ1bmN0aW9uIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyTmFtZSkge1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZmluZChhdG9tLmdyYW1tYXJzLmdldEdyYW1tYXJzKCksIGdhbW1yID0+IGdhbW1yLm5hbWUgPT09IGdyYW1tYXJOYW1lKTtcbiAgICAgICAgaWYgKCFncmFtbWFyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZHNbZ3JhbW1hci5uYW1lXSA9IHt9O1xuICAgICAgICBncmFtbWFyc1tncmFtbWFyLm5hbWVdID0gZ3JhbW1hcjtcbiAgICAgICAgZWFjaChncmFtbWFyLnJlZ2lzdHJ5LnNjb3Blc0J5SWQsICh2YWx1ZSwga2V5KSA9PiB7IGlkc1tncmFtbWFyLm5hbWVdW3ZhbHVlXSA9ICtrZXk7IH0pO1xuICAgIH1cbiAgICBjb25zdCBtZXRob2QgPSAoZ3JhbW1hciwgc2NvcGUpID0+IHtcbiAgICAgICAgaWYgKCFpZHNbZ3JhbW1hcl0pIHtcbiAgICAgICAgICAgIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXVtzY29wZV0pXG4gICAgICAgICAgICBpZHNbZ3JhbW1hcl1bc2NvcGVdID0gZ3JhbW1hcnNbZ3JhbW1hcl0ucmVnaXN0cnkuc3RhcnRJZEZvclNjb3BlKHNjb3BlKTtcbiAgICAgICAgcmV0dXJuICtpZHNbZ3JhbW1hcl1bc2NvcGVdO1xuICAgIH07XG4gICAgbWV0aG9kLmVuZCA9IChzY29wZSkgPT4gK3Njb3BlIC0gMTtcbiAgICByZXR1cm4gbWV0aG9kO1xufSkoKTtcbmZ1bmN0aW9uIGdldEF0b21TdHlsZUZvclRva2VuKGdyYW1tYXIsIHRhZ3MsIHRva2VuLCBpbmRleCwgaW5kZXhFbmQsIHN0cikge1xuICAgIGNvbnN0IHByZXZpb3VzU2NvcGVzID0gW107XG4gICAgZm9yIChsZXQgaSA9IGluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2godGFnc1tpXSk7XG4gICAgfVxuICAgIGNvbnN0IHJlcGxhY2VtZW50cyA9IFtdO1xuICAgIGNvbnN0IG9wZW5zID0gW107XG4gICAgY29uc3QgY2xvc2VzID0gW107XG4gICAgZm9yIChsZXQgaSA9IGluZGV4OyBpIDwgaW5kZXhFbmQ7IGkrKykge1xuICAgICAgICBpZiAodGFnc1tpXSA+IDApXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBvcGVuSW5kZXggPSBmaW5kSW5kZXgob3BlbnMsIHggPT4geC50YWcgPT09ICh0YWdzW2ldICsgMSkpO1xuICAgICAgICAgICAgaWYgKG9wZW5JbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3BlbnMuc3BsaWNlKG9wZW5JbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9zZXMucHVzaCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvcGVucy51bnNoaWZ0KHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgdW5mdWxsZmlsbGVkID0gW107XG4gICAgaWYgKGNsb3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHVuZnVsbGZpbGxlZCA9IHNvcnRCeShvcGVucy5jb25jYXQoY2xvc2VzKSwgeCA9PiB4LmluZGV4KTtcbiAgICB9XG4gICAgZWxzZSBpZiAob3BlbnMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogb3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2Uob3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsIGluZGV4RW5kICsgMSlcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCBpbnRlcm5hbEluZGV4ID0gaW5kZXg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmZ1bGxmaWxsZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgdiA9IHVuZnVsbGZpbGxlZFtpXTtcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXG4gICAgICAgICAgICBlbmQ6IHYuaW5kZXgsXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbnRlcm5hbEluZGV4LCB2LmluZGV4KVxuICAgICAgICB9KTtcbiAgICAgICAgaW50ZXJuYWxJbmRleCA9IHYuaW5kZXggKyAxO1xuICAgIH1cbiAgICBpZiAocmVwbGFjZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogaW5kZXgsXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW5kZXgsIGluZGV4RW5kKVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZChzY29wZSkge1xuICAgICAgICBjb25zdCBpZCA9IGdldElkRm9yU2NvcGUoZ3JhbW1hciwgc2NvcGUpO1xuICAgICAgICBpZiAoaWQgPT09IC0xKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoIXNvbWUocHJldmlvdXNTY29wZXMsIHogPT4geiA9PT0gaWQpKSB7XG4gICAgICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKGlkKTtcbiAgICAgICAgfVxuICAgICAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gY3R4LnJlcGxhY2VtZW50O1xuICAgICAgICAgICAgcmVwbGFjZW1lbnQudW5zaGlmdChpZCk7XG4gICAgICAgICAgICByZXBsYWNlbWVudC5wdXNoKGdldElkRm9yU2NvcGUuZW5kKGlkKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRva2VuLktpbmQpIHtcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5udW1lcmljYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInN0cnVjdCBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY29uc3RhbnQubnVtZXJpYy5pZGVudGlmaWVyLnN0cnVjdGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJlbnVtIG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuZW51bWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6XG4gICAgICAgICAgICBhZGQoYGlkZW50aWZpZXJgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiY2xhc3MgbmFtZVwiOlxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllcmApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJkZWxlZ2F0ZSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmRlbGVnYXRlYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImludGVyZmFjZSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmludGVyZmFjZWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiOlxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5vdGhlci5zeW1ib2xgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZXhjbHVkZWQgY29kZVwiOlxuICAgICAgICAgICAgYWRkKGBjb21tZW50LmJsb2NrYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInVudXNlZCBjb2RlXCI6XG4gICAgICAgICAgICBhZGQoYHVudXNlZGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVuaGFuZGxlZCBLaW5kIFwiICsgdG9rZW4uS2luZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XG4gICAgICAgIGNvbnN0IHsgcmVwbGFjZW1lbnQsIGVuZCwgc3RhcnQgfSA9IGN0eDtcbiAgICAgICAgaWYgKHJlcGxhY2VtZW50Lmxlbmd0aCA9PT0gMilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IG51bSA9IGVuZCAtIHN0YXJ0O1xuICAgICAgICBpZiAobnVtIDw9IDApIHtcbiAgICAgICAgICAgIG51bSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgdGFncy5zcGxpY2Uoc3RhcnQsIG51bSwgLi4ucmVwbGFjZW1lbnQpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gc2V0R3JhbW1hcihncmFtbWFyKSB7XG4gICAgY29uc3QgZzIgPSBnZXRFbmhhbmNlZEdyYW1tYXIodGhpcywgZ3JhbW1hcik7XG4gICAgaWYgKGcyICE9PSBncmFtbWFyKVxuICAgICAgICB0aGlzLl9zZXRHcmFtbWFyKGcyKTtcbiAgICByZXR1cm4gZzI7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5oYW5jZWRHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucykge1xuICAgIGlmICghZ3JhbW1hcilcbiAgICAgICAgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgaWYgKCFncmFtbWFyW1wib21uaXNoYXJwXCJdICYmIE9tbmkuaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcikpIHtcbiAgICAgICAgY29uc3QgbmV3R3JhbW1hciA9IG5ldyBHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucyk7XG4gICAgICAgIGVhY2goZ3JhbW1hciwgKHgsIGkpID0+IHtcbiAgICAgICAgICAgIGlmIChoYXMoZ3JhbW1hciwgaSkpIHtcbiAgICAgICAgICAgICAgICBuZXdHcmFtbWFyW2ldID0geDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGdyYW1tYXIgPSBuZXdHcmFtbWFyO1xuICAgIH1cbiAgICByZXR1cm4gZ3JhbW1hcjtcbn1cbmNsYXNzIFVudXNlZE1hcCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX21hcCA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgZ2V0KGtleSkge1xuICAgICAgICBpZiAoIXRoaXMuX21hcC5oYXMoa2V5KSlcbiAgICAgICAgICAgIHRoaXMuX21hcC5zZXQoa2V5LCBuZXcgQmVoYXZpb3JTdWJqZWN0KFtdKSk7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAuZ2V0KGtleSk7XG4gICAgfVxuICAgIF9nZXRPYnNlcnZlcihrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0KGtleSk7XG4gICAgfVxuICAgIHNldChrZXksIHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IG8gPSB0aGlzLl9nZXRPYnNlcnZlcihrZXkpO1xuICAgICAgICBpZiAoIWlzRXF1YWwoby5nZXRWYWx1ZSgpLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgIG8ubmV4dCh2YWx1ZSB8fCBbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGRlbGV0ZShrZXkpIHtcbiAgICAgICAgaWYgKHRoaXMuX21hcC5oYXMoa2V5KSlcbiAgICAgICAgICAgIHRoaXMuX21hcC5kZWxldGUoa2V5KTtcbiAgICB9XG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuX21hcC5jbGVhcigpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBlbmhhbmNlZEhpZ2hsaWdodGluZzE5ID0gbmV3IEhpZ2hsaWdodDtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
