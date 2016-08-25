"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.enhancedHighlighting19 = exports.ExcludeClassifications = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.augmentEditor = augmentEditor;
exports.getEnhancedGrammar = getEnhancedGrammar;

var _omnisharpClient = require("omnisharp-client");

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
var ExcludeClassifications = exports.ExcludeClassifications = [_omnisharpClient.Models.HighlightClassification.Comment, _omnisharpClient.Models.HighlightClassification.String, _omnisharpClient.Models.HighlightClassification.Punctuation, _omnisharpClient.Models.HighlightClassification.Operator, _omnisharpClient.Models.HighlightClassification.Keyword];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS50cyIsImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS5qcyJdLCJuYW1lcyI6WyJhdWdtZW50RWRpdG9yIiwiZ2V0RW5oYW5jZWRHcmFtbWFyIiwiQXRvbUdyYW1tYXIiLCJyZXF1aXJlIiwiYXRvbSIsImNvbmZpZyIsInJlc291cmNlUGF0aCIsIkRFQk9VTkNFX1RJTUUiLCJmYXN0ZG9tIiwiSElHSExJR0hUIiwiSElHSExJR0hUX1JFUVVFU1QiLCJnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMiLCJwYXRoIiwicXVpY2tGaXhlcyIsInByb2plY3ROYW1lcyIsImZpbHRlciIsIngiLCJGaWxlTmFtZSIsIm1hcCIsIlN0YXJ0TGluZSIsIkxpbmUiLCJTdGFydENvbHVtbiIsIkNvbHVtbiIsIkVuZExpbmUiLCJFbmRDb2x1bW4iLCJLaW5kIiwiUHJvamVjdHMiLCJ2YWx1ZSIsIkV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMiLCJIaWdobGlnaHRDbGFzc2lmaWNhdGlvbiIsIkNvbW1lbnQiLCJTdHJpbmciLCJQdW5jdHVhdGlvbiIsIk9wZXJhdG9yIiwiS2V5d29yZCIsIkhpZ2hsaWdodCIsInVudXNlZENvZGVSb3dzIiwiVW51c2VkTWFwIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGVmYXVsdCIsImF0b21WZXJzaW9uIiwibWlub3IiLCJkaXNwb3NhYmxlIiwiZWRpdG9ycyIsImFkZCIsImNvbnRleHQiLCJlZGl0b3IiLCJnZXQiLCJzdGFydFdpdGgiLCJkZWJvdW5jZVRpbWUiLCJzd2l0Y2hNYXAiLCJkZWZlciIsInByb2plY3RzIiwicHJvamVjdCIsImFjdGl2ZUZyYW1ld29yayIsIk5hbWUiLCJsaW5lc1RvRmV0Y2giLCJnZXRHcmFtbWFyIiwibGVuZ3RoIiwiY29tYmluZUxhdGVzdCIsImdldFBhdGgiLCJyZXF1ZXN0Iiwic29sdXRpb24iLCJoaWdobGlnaHQiLCJQcm9qZWN0TmFtZXMiLCJMaW5lcyIsInF1aWNrZml4ZXMiLCJyZXNwb25zZSIsImhpZ2hsaWdodHMiLCJjb25jYXQiLCJIaWdobGlnaHRzIiwiZG8iLCJzZXRSZXNwb25zZXMiLCJwdWJsaXNoUmVwbGF5IiwicmVmQ291bnQiLCJsaXN0ZW5lciIsIm1vZGVsIiwiZGlhZ25vc3RpY3NCeUZpbGUiLCJzdWJzY3JpYmUiLCJjaGFuZ2VzIiwiZmlsZSIsImRpYWdub3N0aWNzIiwic2V0IiwiTG9nTGV2ZWwiLCJlYWNoRWRpdG9yIiwiY2QiLCJzZXR1cEVkaXRvciIsIm9tbmlzaGFycCIsInRva2VuaXplZEJ1ZmZlciIsIm5leHQiLCJzd2l0Y2hBY3RpdmVFZGl0b3IiLCJjcmVhdGUiLCJjbGVhciIsImRpc3Bvc2UiLCJpc3N1ZVJlcXVlc3QiLCJwdXNoIiwicmVzcG9uc2VzIiwicmV0b2tlbml6ZUxpbmVzIiwib25EaWREZXN0cm95Iiwib2JzZXJ2ZSIsIm9uRGlkU3RvcENoYW5naW5nIiwib25EaWRTYXZlIiwid2hlbkNvbm5lY3RlZCIsImRlbGF5IiwiY29tcGxldGUiLCJkb1NldEdyYW1tYXIiLCJzZXRHcmFtbWFyIiwiYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQiLCJtYXJrVG9rZW5pemF0aW9uQ29tcGxldGUiLCJ0b2tlbml6ZUluQmFja2dyb3VuZCIsInJvdyIsImFwcGx5IiwiYXJndW1lbnRzIiwic2lsZW50UmV0b2tlbml6ZUxpbmVzIiwiaXNPYnNlcnZlUmV0b2tlbml6aW5nIiwibGFzdFJvdyIsImJ1ZmZlciIsImdldExhc3RSb3ciLCJ0b2tlbml6ZWRMaW5lcyIsImJ1aWxkUGxhY2Vob2xkZXJUb2tlbml6ZWRMaW5lc0ZvclJvd3MiLCJpbnZhbGlkUm93cyIsImxpbmVzVG9Ub2tlbml6ZSIsImludmFsaWRhdGVSb3ciLCJmdWxseVRva2VuaXplZCIsImxlYWRpbmciLCJ0cmFpbGluZyIsInZpc2libGUiLCJwZW5kaW5nQ2h1bmsiLCJpc0FsaXZlIiwibXV0YXRlIiwidG9rZW5pemVOZXh0Q2h1bmsiLCJzY29wZXNGcm9tVGFncyIsInN0YXJ0aW5nU2NvcGVzIiwidGFncyIsInNjb3BlcyIsInNsaWNlIiwiZ3JhbW1hciIsImkiLCJsZW4iLCJ0YWciLCJtYXRjaGluZ1N0YXJ0VGFnIiwicG9wIiwic3RhcnRJZEZvclNjb3BlIiwic2NvcGVOYW1lIiwiY29uc29sZSIsImluZm8iLCJmaWxlUGF0aCIsImdyYW1tYXJTY29wZU5hbWUiLCJ1bm1hdGNoZWRFbmRUYWciLCJzY29wZUZvcklkIiwidGFrZSIsInJvd3MiLCJHcmFtbWFyIiwiYmFzZSIsIm9wdGlvbnMiLCJfZ2lkIiwiTWFwIiwicmVhZG9ubHkiLCJnZXRCdWZmZXIiLCJwcmVlbXB0RGlkQ2hhbmdlIiwiZSIsIm9sZFJhbmdlIiwibmV3UmFuZ2UiLCJzdGFydCIsImRlbHRhIiwiZW5kIiwiZ2V0TGluZUNvdW50IiwibGluZXMiLCJrZXlzIiwiZG9uZSIsInJlc3BvbnNlTGluZSIsIm9sZEZyb20iLCJjb2x1bW4iLCJuZXdGcm9tIiwic3BhbiIsImRlbGV0ZSIsImxpbmUiLCJjb3VudCIsImhhcyIsImFic0RlbHRhIiwiTWF0aCIsImFicyIsImVuYWJsZUV4Y2x1ZGVDb2RlIiwicmVzdWx0cyIsImdyb3VwZWRJdGVtcyIsImZsYXR0ZW4iLCJncm91cEJ5IiwieiIsIml0ZW0iLCJrZXkiLCJrIiwibWFwcGVkSXRlbSIsImwiLCJwcm90b3R5cGUiLCJydWxlU3RhY2siLCJmaXJzdExpbmUiLCJiYXNlUmVzdWx0IiwidG9rZW5pemVMaW5lIiwiY2FsbCIsImdldEF0b21TdHlsZUZvclRva2VuIiwibmFtZSIsImdldENzVG9rZW5zRm9yTGluZSIsInJ1bGUiLCJnZXRJbml0aWFsUnVsZSIsImRpc3RhbmNlIiwiaW5kZXgiLCJzdHIiLCJzdWJzdHJpbmciLCJzaXplIiwidmFsdWVzIiwicHJldiIsInNwbGljZSIsImJhY2t0cmFja0luZGV4IiwiYmFja3RyYWNrRGlzdGFuY2UiLCJmb3J3YXJkdHJhY2tJbmRleCIsInJlbWFpbmluZ1NpemUiLCJvcGVuRm91bmQiLCJoIiwiZ2V0SWRGb3JTY29wZSIsImlkcyIsImdyYW1tYXJzIiwiYnVpbGRTY29wZXNGb3JHcmFtbWFyIiwiZ3JhbW1hck5hbWUiLCJnZXRHcmFtbWFycyIsImdhbW1yIiwicmVnaXN0cnkiLCJzY29wZXNCeUlkIiwibWV0aG9kIiwic2NvcGUiLCJ0b2tlbiIsImluZGV4RW5kIiwicHJldmlvdXNTY29wZXMiLCJyZXBsYWNlbWVudHMiLCJvcGVucyIsImNsb3NlcyIsIm9wZW5JbmRleCIsInVuc2hpZnQiLCJ1bmZ1bGxmaWxsZWQiLCJyZXBsYWNlbWVudCIsImludGVybmFsSW5kZXgiLCJ2IiwiaWQiLCJjdHgiLCJsb2ciLCJudW0iLCJnMiIsIl9zZXRHcmFtbWFyIiwiaXNWYWxpZEdyYW1tYXIiLCJuZXdHcmFtbWFyIiwiX21hcCIsIm8iLCJfZ2V0T2JzZXJ2ZXIiLCJnZXRWYWx1ZSIsImVuaGFuY2VkSGlnaGxpZ2h0aW5nMTkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O1FBMktBQSxhLEdBQUFBLGE7UUEyZ0JBQyxrQixHQUFBQSxrQjs7QUN0ckJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QURJQSxJQUFNQyxjQUFjQyxRQUFjQyxLQUFNQyxNQUFOLENBQWFDLFlBQWIsR0FBNEIseUNBQTFDLENBQXBCO0FBRUEsSUFBTUMsZ0JBQWdCLEdBQXRCO0FBQ0EsSUFBSUMsVUFBMEJMLFFBQVEsU0FBUixDQUE5QjtBQUVBLElBQU1NLFlBQVksV0FBbEI7QUFBQSxJQUNJQyxvQkFBb0IsbUJBRHhCO0FBR0EsU0FBQUMsMkJBQUEsQ0FBcUNDLElBQXJDLEVBQW1EQyxVQUFuRCxFQUE0RkMsWUFBNUYsRUFBa0g7QUFDOUcsV0FBTyxtQkFBTUQsVUFBTixFQUNGRSxNQURFLENBQ0s7QUFBQSxlQUFLQyxFQUFFQyxRQUFGLEtBQWVMLElBQXBCO0FBQUEsS0FETCxFQUVGTSxHQUZFLENBRUU7QUFBQSxlQUFNO0FBQ1BDLHVCQUFXSCxFQUFFSSxJQUROO0FBRVBDLHlCQUFh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RyxFQUFhcEssSyxFQUFtQztBQUN2RCxnQkFBTWlPLElBQUksS0FBS0MsWUFBTCxDQUFrQjlELEdBQWxCLENBQVY7QUFDQSxnQkFBSSxDQUFDLHFCQUFRNkQsRUFBRUUsUUFBRixFQUFSLEVBQXNCbk8sS0FBdEIsQ0FBTCxFQUFtQztBQUMvQmlPLGtCQUFFakssSUFBRixDQUFPaEUsU0FBUyxFQUFoQjtBQUNIO0FBQ0QsbUJBQU8sSUFBUDtBQUNIOzs7Z0NBRWFvSyxHLEVBQVc7QUFDckIsZ0JBQUksS0FBSzRELElBQUwsQ0FBVXZFLEdBQVYsQ0FBY1csR0FBZCxDQUFKLEVBQ0ksS0FBSzRELElBQUwsQ0FBVTFFLE1BQVYsQ0FBaUJjLEdBQWpCO0FBQ1A7OztnQ0FFVztBQUNSLGlCQUFLNEQsSUFBTCxDQUFVN0osS0FBVjtBQUNIOzs7Ozs7QUFHRSxJQUFNaUssMERBQXlCLElBQUk1TixTQUFKLEVBQS9CIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge09tbmlzaGFycFRleHRFZGl0b3IsIGlzT21uaXNoYXJwVGV4dEVkaXRvcn0gZnJvbSBcIi4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcclxuaW1wb3J0IHtlYWNoLCBleHRlbmQsIGhhcywgc29tZSwgcmFuZ2UsIHJlbW92ZSwgcHVsbCwgZmluZCwgY2hhaW4sIHVuaXEsIGZpbmRJbmRleCwgZXZlcnksIGlzRXF1YWwsIG1pbiwgZGVib3VuY2UsIHNvcnRCeSwgdW5pcXVlSWQsIGZpbHRlcn0gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIFJlcGxheVN1YmplY3QsIEJlaGF2aW9yU3ViamVjdCwgU3Vic2NyaWJlcn0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtyZWdpc3RlckNvbnRleHRJdGVtfSBmcm9tIFwiLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xyXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmNvbnN0IEF0b21HcmFtbWFyID0gcmVxdWlyZSgoPGFueT5hdG9tKS5jb25maWcucmVzb3VyY2VQYXRoICsgXCIvbm9kZV9tb2R1bGVzL2ZpcnN0LW1hdGUvbGliL2dyYW1tYXIuanNcIik7XHJcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5jb25zdCBERUJPVU5DRV9USU1FID0gMjQwLyoyNDAqLztcclxubGV0IGZhc3Rkb206IHR5cGVvZiBGYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XHJcblxyXG5jb25zdCBISUdITElHSFQgPSBcIkhJR0hMSUdIVFwiLFxyXG4gICAgSElHSExJR0hUX1JFUVVFU1QgPSBcIkhJR0hMSUdIVF9SRVFVRVNUXCI7XHJcblxyXG5mdW5jdGlvbiBnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMocGF0aDogc3RyaW5nLCBxdWlja0ZpeGVzOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10sIHByb2plY3ROYW1lczogc3RyaW5nW10pIHtcclxuICAgIHJldHVybiBjaGFpbihxdWlja0ZpeGVzKVxyXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4LkZpbGVOYW1lID09PSBwYXRoKVxyXG4gICAgICAgIC5tYXAoeCA9PiAoe1xyXG4gICAgICAgICAgICBTdGFydExpbmU6IHguTGluZSxcclxuICAgICAgICAgICAgU3RhcnRDb2x1bW46IHguQ29sdW1uLFxyXG4gICAgICAgICAgICBFbmRMaW5lOiB4LkVuZExpbmUsXHJcbiAgICAgICAgICAgIEVuZENvbHVtbjogeC5FbmRDb2x1bW4sXHJcbiAgICAgICAgICAgIEtpbmQ6IFwidW51c2VkIGNvZGVcIixcclxuICAgICAgICAgICAgUHJvamVjdHM6IHByb2plY3ROYW1lc1xyXG4gICAgICAgIH0gYXMgTW9kZWxzLkhpZ2hsaWdodFNwYW4pKVxyXG4gICAgICAgIC52YWx1ZSgpO1xyXG59XHJcblxyXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmV4cG9ydCBjb25zdCBFeGNsdWRlQ2xhc3NpZmljYXRpb25zID0gW1xyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLkNvbW1lbnQsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uU3RyaW5nLFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLlB1bmN0dWF0aW9uLFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLk9wZXJhdG9yLFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLktleXdvcmRcclxuXTtcclxuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcblxyXG5jbGFzcyBIaWdobGlnaHQgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIGVkaXRvcnM6IEFycmF5PE9tbmlzaGFycFRleHRFZGl0b3I+O1xyXG4gICAgcHJpdmF0ZSB1bnVzZWRDb2RlUm93cyA9IG5ldyBVbnVzZWRNYXAoKTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgaWYgKCEoT21uaS5hdG9tVmVyc2lvbi5taW5vciAhPT0gMSB8fCBPbW5pLmF0b21WZXJzaW9uLm1pbm9yID4gOCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZWRpdG9ycyA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICByZWdpc3RlckNvbnRleHRJdGVtKEhJR0hMSUdIVF9SRVFVRVNULCAoY29udGV4dCkgPT4gbmV3IFN1YmplY3Q8Ym9vbGVhbj4oKSksXHJcbiAgICAgICAgICAgIHJlZ2lzdGVyQ29udGV4dEl0ZW0oSElHSExJR0hULCAoY29udGV4dCwgZWRpdG9yKSA9PlxyXG4gICAgICAgICAgICAgICAgY29udGV4dC5nZXQ8U3ViamVjdDxib29sZWFuPj4oSElHSExJR0hUX1JFUVVFU1QpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN0YXJ0V2l0aCh0cnVlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoKCkgPT4gT2JzZXJ2YWJsZS5kZWZlcigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2plY3RzID0gY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lID09PSBcImFsbFwiID8gW10gOiBbY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsaW5lc1RvRmV0Y2ggPSB1bmlxPG51bWJlcj4oKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFsaW5lc1RvRmV0Y2ggfHwgIWxpbmVzVG9GZXRjaC5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lc1RvRmV0Y2ggPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmhpZ2hsaWdodCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvamVjdE5hbWVzOiBwcm9qZWN0cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMaW5lczogbGluZXNUb0ZldGNoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChxdWlja2ZpeGVzLCByZXNwb25zZSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0czogZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKGVkaXRvci5nZXRQYXRoKCksIHF1aWNrZml4ZXMsIHByb2plY3RzKS5jb25jYXQocmVzcG9uc2UgPyByZXNwb25zZS5IaWdobGlnaHRzIDogW10pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5kbygoe2hpZ2hsaWdodHN9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnNldFJlc3BvbnNlcyhoaWdobGlnaHRzLCBwcm9qZWN0cy5sZW5ndGggPiAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZWZDb3VudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKSksXHJcbiAgICAgICAgICAgIE9tbmkubGlzdGVuZXIubW9kZWwuZGlhZ25vc3RpY3NCeUZpbGVcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoY2hhbmdlcyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgW2ZpbGUsIGRpYWdub3N0aWNzXSBvZiBjaGFuZ2VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3Muc2V0KGZpbGUsIGZpbHRlcihkaWFnbm9zdGljcywgeCA9PiB4LkxvZ0xldmVsID09PSBcIkhpZGRlblwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIE9tbmkuZWFjaEVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXR1cEVkaXRvcihlZGl0b3IsIGNkKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9tbmlzaGFycFxyXG4gICAgICAgICAgICAgICAgICAgIC5nZXQ8T2JzZXJ2YWJsZTx7IGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvcjsgaGlnaGxpZ2h0czogTW9kZWxzLkhpZ2hsaWdodFNwYW5bXTsgcHJvamVjdHM6IHN0cmluZ1tdIH0+PihISUdITElHSFQpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0oKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldDxTdWJqZWN0PGJvb2xlYW4+PihISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldDxTdWJqZWN0PGJvb2xlYW4+PihISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGlmICgoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5jbGVhcigpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwRWRpdG9yKGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvciwgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIGlmIChlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSB8fCAhZWRpdG9yLmdldEdyYW1tYXIpIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgaXNzdWVSZXF1ZXN0ID0gZWRpdG9yLm9tbmlzaGFycC5nZXQ8U3ViamVjdDxib29sZWFuPj4oSElHSExJR0hUX1JFUVVFU1QpO1xyXG5cclxuICAgICAgICBhdWdtZW50RWRpdG9yKGVkaXRvciwgdGhpcy51bnVzZWRDb2RlUm93cywgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHRoaXMuZWRpdG9ycy5wdXNoKGVkaXRvcik7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNwb3NhYmxlKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcykgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkucmVzcG9uc2VzLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzKCk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBlZGl0b3JbXCJfb2xkR3JhbW1hclwiXTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHB1bGwodGhpcy5lZGl0b3JzLCBlZGl0b3IpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9tbmlzaGFycC5wcm9qZWN0XHJcbiAgICAgICAgICAgIC5vYnNlcnZlLmFjdGl2ZUZyYW1ld29ya1xyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmxpbmVzVG9GZXRjaCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcykgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkucmVzcG9uc2VzLmNsZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoKCkgPT4gaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSkpKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkU2F2ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmxpbmVzVG9GZXRjaCA9IFtdO1xyXG4gICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb25cclxuICAgICAgICAgICAgLndoZW5Db25uZWN0ZWQoKVxyXG4gICAgICAgICAgICAuZGVsYXkoMTAwMClcclxuICAgICAgICAgICAgLnN1YnNjcmliZSh7XHJcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkVuaGFuY2VkIEhpZ2hsaWdodGluZ1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJFbmFibGVzIHNlcnZlciBiYXNlZCBoaWdobGlnaHRpbmcsIHdoaWNoIGluY2x1ZGVzIHN1cHBvcnQgZm9yIHN0cmluZyBpbnRlcnBvbGF0aW9uLCBjbGFzcyBuYW1lcyBhbmQgbW9yZS5cIjtcclxuICAgIHB1YmxpYyBkZWZhdWx0ID0gZmFsc2U7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhdWdtZW50RWRpdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCB1bnVzZWRDb2RlUm93czogVW51c2VkTWFwID0gbnVsbCwgZG9TZXRHcmFtbWFyID0gZmFsc2UpIHtcclxuICAgIGlmICghZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0pXHJcbiAgICAgICAgZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0gPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xyXG4gICAgaWYgKCFlZGl0b3JbXCJfc2V0R3JhbW1hclwiXSlcclxuICAgICAgICBlZGl0b3JbXCJfc2V0R3JhbW1hclwiXSA9IGVkaXRvci5zZXRHcmFtbWFyO1xyXG4gICAgaWYgKCEoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdKVxyXG4gICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0gPSAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0O1xyXG4gICAgaWYgKCEoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXSlcclxuICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXSA9IChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIubWFya1Rva2VuaXphdGlvbkNvbXBsZXRlO1xyXG4gICAgaWYgKCEoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX3JldG9rZW5pemVMaW5lc1wiXSlcclxuICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX3JldG9rZW5pemVMaW5lc1wiXSA9IChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzO1xyXG4gICAgaWYgKCEoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX3Rva2VuaXplSW5CYWNrZ3JvdW5kXCJdKVxyXG4gICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfdG9rZW5pemVJbkJhY2tncm91bmRcIl0gPSAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyLnRva2VuaXplSW5CYWNrZ3JvdW5kO1xyXG4gICAgaWYgKCEoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX2NodW5rU2l6ZVwiXSlcclxuICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiY2h1bmtTaXplXCJdID0gMjA7XHJcblxyXG4gICAgZWRpdG9yLnNldEdyYW1tYXIgPSBzZXRHcmFtbWFyO1xyXG4gICAgaWYgKGRvU2V0R3JhbW1hcikgZWRpdG9yLnNldEdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSk7XHJcblxyXG4gICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikuYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQgPSBmdW5jdGlvbiAocm93OiBudW1iZXIpIHtcclxuICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKVtcIl9fcm93X19cIl0gPSByb3c7XHJcbiAgICAgICAgcmV0dXJuIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIH07XHJcblxyXG4gICAgaWYgKCEoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5zaWxlbnRSZXRva2VuaXplTGluZXMpIHtcclxuICAgICAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5zaWxlbnRSZXRva2VuaXplTGluZXMgPSBkZWJvdW5jZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcpXHJcbiAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dChmYWxzZSk7XHJcbiAgICAgICAgICAgIGxldCBsYXN0Um93OiBudW1iZXI7XHJcbiAgICAgICAgICAgIGxhc3RSb3cgPSB0aGlzLmJ1ZmZlci5nZXRMYXN0Um93KCk7XHJcbiAgICAgICAgICAgIHRoaXMudG9rZW5pemVkTGluZXMgPSB0aGlzLmJ1aWxkUGxhY2Vob2xkZXJUb2tlbml6ZWRMaW5lc0ZvclJvd3MoMCwgbGFzdFJvdyk7XHJcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZFJvd3MgPSBbXTtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGluZXNUb1Rva2VuaXplICYmIHRoaXMubGluZXNUb1Rva2VuaXplLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlUm93KG1pbih0aGlzLmxpbmVzVG9Ub2tlbml6ZSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlUm93KDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZnVsbHlUb2tlbml6ZWQgPSBmYWxzZTtcclxuICAgICAgICB9LCBERUJPVU5DRV9USU1FLCB7IGxlYWRpbmc6IHRydWUsIHRyYWlsaW5nOiB0cnVlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLm1hcmtUb2tlbml6YXRpb25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxyXG4gICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dCh0cnVlKTtcclxuICAgICAgICByZXR1cm4gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIH07XHJcblxyXG4gICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikucmV0b2tlbml6ZUxpbmVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcpXHJcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KGZhbHNlKTtcclxuICAgICAgICByZXR1cm4gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIH07XHJcblxyXG4gICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikudG9rZW5pemVJbkJhY2tncm91bmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnZpc2libGUgfHwgdGhpcy5wZW5kaW5nQ2h1bmsgfHwgIXRoaXMuaXNBbGl2ZSgpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gdHJ1ZTtcclxuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQWxpdmUoKSAmJiB0aGlzLmJ1ZmZlci5pc0FsaXZlKCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudG9rZW5pemVOZXh0Q2h1bmsoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5zY29wZXNGcm9tVGFncyA9IGZ1bmN0aW9uIChzdGFydGluZ1Njb3BlczogbnVtYmVyW10sIHRhZ3M6IG51bWJlcltdKSB7XHJcbiAgICAgICAgY29uc3Qgc2NvcGVzID0gc3RhcnRpbmdTY29wZXMuc2xpY2UoKTtcclxuICAgICAgICBjb25zdCBncmFtbWFyID0gKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRhZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgdGFnID0gdGFnc1tpXTtcclxuICAgICAgICAgICAgaWYgKHRhZyA8IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICgodGFnICUgMikgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2godGFnKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hpbmdTdGFydFRhZyA9IHRhZyArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3Blcy5wb3AoKSA9PT0gbWF0Y2hpbmdTdGFydFRhZykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3Blcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhY2sgdG8gZW5zdXJlIHRoYXQgYWxsIGxpbmVzIGFsd2F5cyBnZXQgdGhlIHByb3BlciBzb3VyY2UgbGluZXMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZXMucHVzaCg8YW55PmdyYW1tYXIuc3RhcnRJZEZvclNjb3BlKGAuJHtncmFtbWFyLnNjb3BlTmFtZX1gKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oXCJFbmNvdW50ZXJlZCBhbiB1bm1hdGNoZWQgc2NvcGUgZW5kIHRhZy5cIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBlZGl0b3IuYnVmZmVyLmdldFBhdGgoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFtbWFyU2NvcGVOYW1lOiBncmFtbWFyLnNjb3BlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5tYXRjaGVkRW5kVGFnOiBncmFtbWFyLnNjb3BlRm9ySWQodGFnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5zZXRSZXNwb25zZXMoW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVudXNlZENvZGVSb3dzICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW51c2VkQ29kZVJvd3MuZ2V0KGVkaXRvci5nZXRQYXRoKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocm93cyA9PiAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFJlc3BvbnNlcyhnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMoZWRpdG9yLmdldFBhdGgoKSwgcm93cywgW10pKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2NvcGVzO1xyXG4gICAgfTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElIaWdobGlnaHRpbmdHcmFtbWFyIGV4dGVuZHMgRmlyc3RNYXRlLkdyYW1tYXIge1xyXG4gICAgaXNPYnNlcnZlUmV0b2tlbml6aW5nOiBTdWJqZWN0PGJvb2xlYW4+O1xyXG4gICAgbGluZXNUb0ZldGNoOiBudW1iZXJbXTtcclxuICAgIGxpbmVzVG9Ub2tlbml6ZTogbnVtYmVyW107XHJcbiAgICByZXNwb25zZXM6IE1hcDxudW1iZXIsIE1vZGVscy5IaWdobGlnaHRTcGFuW10+O1xyXG4gICAgZnVsbHlUb2tlbml6ZWQ6IGJvb2xlYW47XHJcbiAgICBzY29wZU5hbWU6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgR3JhbW1hciB7XHJcbiAgICBwdWJsaWMgaXNPYnNlcnZlUmV0b2tlbml6aW5nOiBSZXBsYXlTdWJqZWN0PGJvb2xlYW4+O1xyXG4gICAgcHVibGljIGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yO1xyXG4gICAgcHVibGljIGxpbmVzVG9GZXRjaDogYW55W107XHJcbiAgICBwdWJsaWMgbGluZXNUb1Rva2VuaXplOiBhbnlbXTtcclxuICAgIHB1YmxpYyBhY3RpdmVGcmFtZXdvcms6IGFueTtcclxuICAgIHB1YmxpYyByZXNwb25zZXM6IE1hcDxudW1iZXIsIE1vZGVscy5IaWdobGlnaHRTcGFuW10+O1xyXG4gICAgcHVibGljIF9naWQgPSB1bmlxdWVJZChcIm9nXCIpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBiYXNlOiBGaXJzdE1hdGUuR3JhbW1hciwgb3B0aW9uczogeyByZWFkb25seTogYm9vbGVhbiB9KSB7XHJcbiAgICAgICAgdGhpcy5pc09ic2VydmVSZXRva2VuaXppbmcgPSBuZXcgUmVwbGF5U3ViamVjdDxib29sZWFuPigxKTtcclxuICAgICAgICB0aGlzLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KHRydWUpO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcclxuICAgICAgICB0aGlzLnJlc3BvbnNlcyA9IG5ldyBNYXA8bnVtYmVyLCBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdPigpO1xyXG4gICAgICAgIHRoaXMubGluZXNUb0ZldGNoID0gW107XHJcbiAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUgPSBbXTtcclxuICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHt9O1xyXG5cclxuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMucmVhZG9ubHkpIHtcclxuICAgICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLnByZWVtcHREaWRDaGFuZ2UoKGU6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qge29sZFJhbmdlLCBuZXdSYW5nZX0gPSBlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0OiBudW1iZXIgPSBvbGRSYW5nZS5zdGFydC5yb3csXHJcbiAgICAgICAgICAgICAgICAgICAgZGVsdGE6IG51bWJlciA9IG5ld1JhbmdlLmVuZC5yb3cgLSBvbGRSYW5nZS5lbmQucm93O1xyXG5cclxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gc3RhcnQgLSA1O1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGVuZCA9IGVkaXRvci5idWZmZXIuZ2V0TGluZUNvdW50KCkgLSAxO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVzID0gcmFuZ2Uoc3RhcnQsIGVuZCArIDEpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5rZXlzKCkubmV4dCgpLmRvbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9GZXRjaC5wdXNoKC4uLmxpbmVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobGluZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGxpbmVzWzBdKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZEZyb20gPSBvbGRSYW5nZS5zdGFydC5jb2x1bW4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdGcm9tID0gbmV3UmFuZ2Uuc3RhcnQuY29sdW1uO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlKHJlc3BvbnNlTGluZSwgKHNwYW46IE1vZGVscy5IaWdobGlnaHRTcGFuKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydExpbmUgPCBsaW5lc1swXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gb2xkRnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBvbGRGcm9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydENvbHVtbiA+PSBuZXdGcm9tIHx8IHNwYW4uRW5kQ29sdW1uID49IG5ld0Zyb20pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlYWNoKGxpbmVzLCBsaW5lID0+IHsgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGxpbmUpOyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZGVsdGEgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTmV3IGxpbmVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gY291bnQgLSAxOyBpID4gZW5kOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VzLmhhcyhpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGkgKyBkZWx0YSwgdGhpcy5yZXNwb25zZXMuZ2V0KGkpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLmRlbGV0ZShpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVsdGEgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlZCBsaW5lXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWJzRGVsdGEgPSBNYXRoLmFicyhkZWx0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGVuZDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VzLmhhcyhpICsgYWJzRGVsdGEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaSwgdGhpcy5yZXNwb25zZXMuZ2V0KGkgKyBhYnNEZWx0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGkgKyBhYnNEZWx0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0UmVzcG9uc2VzKHZhbHVlOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdLCBlbmFibGVFeGNsdWRlQ29kZTogYm9vbGVhbikge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBjaGFpbih2YWx1ZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGdyb3VwZWRJdGVtcyA9IDxhbnk+cmVzdWx0cy5tYXAoaGlnaGxpZ2h0ID0+IHJhbmdlKGhpZ2hsaWdodC5TdGFydExpbmUsIGhpZ2hsaWdodC5FbmRMaW5lICsgMSlcclxuICAgICAgICAgICAgLm1hcChsaW5lID0+ICh7IGxpbmUsIGhpZ2hsaWdodCB9KSkpXHJcbiAgICAgICAgICAgIC5mbGF0dGVuPHsgbGluZTogbnVtYmVyOyBoaWdobGlnaHQ6IE1vZGVscy5IaWdobGlnaHRTcGFuIH0+KClcclxuICAgICAgICAgICAgLmdyb3VwQnkoeiA9PiB6LmxpbmUpXHJcbiAgICAgICAgICAgIC52YWx1ZSgpO1xyXG5cclxuICAgICAgICBlYWNoKGdyb3VwZWRJdGVtcywgKGl0ZW06IHsgaGlnaGxpZ2h0OiBNb2RlbHMuSGlnaGxpZ2h0U3BhbiB9W10sIGtleTogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBrID0gK2tleSwgbWFwcGVkSXRlbSA9IGl0ZW0ubWFwKHggPT4geC5oaWdobGlnaHQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFlbmFibGVFeGNsdWRlQ29kZSB8fCBzb21lKG1hcHBlZEl0ZW0sIGkgPT4gaS5LaW5kID09PSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCIpICYmIGV2ZXJ5KG1hcHBlZEl0ZW0sIGkgPT4gaS5LaW5kID09PSBcImV4Y2x1ZGVkIGNvZGVcIiB8fCBpLktpbmQgPT09IFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIikpIHtcclxuICAgICAgICAgICAgICAgIG1hcHBlZEl0ZW0gPSBtYXBwZWRJdGVtLmZpbHRlcih6ID0+IHouS2luZCAhPT0gXCJleGNsdWRlZCBjb2RlXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmhhcyhrKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUucHVzaChrKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChrKTtcclxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZUxpbmUubGVuZ3RoICE9PSBtYXBwZWRJdGVtLmxlbmd0aCB8fCBzb21lKHJlc3BvbnNlTGluZSwgKGwsIGkpID0+ICFpc0VxdWFsKGwsIG1hcHBlZEl0ZW1baV0pKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChrLCBtYXBwZWRJdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG4vKiB0c2xpbnQ6ZGlzYWJsZTptZW1iZXItYWNjZXNzICovXHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuZXh0ZW5kKEdyYW1tYXIucHJvdG90eXBlLCBBdG9tR3JhbW1hci5wcm90b3R5cGUpO1xyXG5cclxuR3JhbW1hci5wcm90b3R5cGVbXCJvbW5pc2hhcnBcIl0gPSB0cnVlO1xyXG5HcmFtbWFyLnByb3RvdHlwZVtcInRva2VuaXplTGluZVwiXSA9IGZ1bmN0aW9uIChsaW5lOiBzdHJpbmcsIHJ1bGVTdGFjazogYW55W10sIGZpcnN0TGluZSA9IGZhbHNlKTogeyB0YWdzOiBudW1iZXJbXTsgcnVsZVN0YWNrOiBhbnkgfSB7XHJcbiAgICBjb25zdCBiYXNlUmVzdWx0ID0gQXRvbUdyYW1tYXIucHJvdG90eXBlLnRva2VuaXplTGluZS5jYWxsKHRoaXMsIGxpbmUsIHJ1bGVTdGFjaywgZmlyc3RMaW5lKTtcclxuICAgIGxldCB0YWdzOiBhbnlbXTtcclxuXHJcbiAgICBpZiAodGhpcy5yZXNwb25zZXMpIHtcclxuICAgICAgICBjb25zdCByb3cgPSB0aGlzW1wiX19yb3dfX1wiXTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMocm93KSkgcmV0dXJuIGJhc2VSZXN1bHQ7XHJcblxyXG4gICAgICAgIGNvbnN0IGhpZ2hsaWdodHMgPSB0aGlzLnJlc3BvbnNlcy5nZXQocm93KTtcclxuICAgICAgICAvLyBFeGNsdWRlZCBjb2RlIGJsb3dzIGF3YXkgYW55IG90aGVyIGZvcm1hdHRpbmcsIG90aGVyd2lzZSB3ZSBnZXQgaW50byBhIHZlcnkgd2VpcmQgc3RhdGUuXHJcbiAgICAgICAgaWYgKGhpZ2hsaWdodHNbMF0gJiYgaGlnaGxpZ2h0c1swXS5LaW5kID09PSBcImV4Y2x1ZGVkIGNvZGVcIikge1xyXG4gICAgICAgICAgICB0YWdzID0gW2xpbmUubGVuZ3RoXTtcclxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHRzWzBdLCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xyXG4gICAgICAgICAgICBiYXNlUmVzdWx0LnJ1bGVTdGFjayA9IFtiYXNlUmVzdWx0LnJ1bGVTdGFja1swXV07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGFncyA9IHRoaXMuZ2V0Q3NUb2tlbnNGb3JMaW5lKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIGJhc2VSZXN1bHQudGFncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJhc2VSZXN1bHQudGFncyA9IHRhZ3M7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYmFzZVJlc3VsdDtcclxufTtcclxuXHJcbihHcmFtbWFyLnByb3RvdHlwZSBhcyBhbnkpLmdldENzVG9rZW5zRm9yTGluZSA9IGZ1bmN0aW9uIChoaWdobGlnaHRzOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdLCBsaW5lOiBzdHJpbmcsIHJvdzogbnVtYmVyLCBydWxlU3RhY2s6IGFueVtdLCBmaXJzdExpbmU6IGJvb2xlYW4sIHRhZ3M6IG51bWJlcltdKSB7XHJcbiAgICBydWxlU3RhY2sgPSBbeyBydWxlOiB0aGlzLmdldEluaXRpYWxSdWxlKCkgfV07XHJcblxyXG4gICAgZWFjaChoaWdobGlnaHRzLCAoaGlnaGxpZ2h0KSA9PiB7XHJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBoaWdobGlnaHQuU3RhcnRDb2x1bW4gLSAxO1xyXG4gICAgICAgIGNvbnN0IGVuZCA9IGhpZ2hsaWdodC5FbmRDb2x1bW4gLSAxO1xyXG5cclxuICAgICAgICBpZiAoaGlnaGxpZ2h0LkVuZExpbmUgPiBoaWdobGlnaHQuU3RhcnRMaW5lICYmIGhpZ2hsaWdodC5TdGFydENvbHVtbiA9PT0gMCAmJiBoaWdobGlnaHQuRW5kQ29sdW1uID09PSAwKSB7XHJcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGlzdGFuY2UgPSAtMTtcclxuICAgICAgICBsZXQgaW5kZXggPSAtMTtcclxuICAgICAgICBsZXQgaTogbnVtYmVyO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRpc3RhbmNlICsgdGFnc1tpXSA+IHN0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgKz0gdGFnc1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3RyID0gbGluZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCk7XHJcbiAgICAgICAgY29uc3Qgc2l6ZSA9IGVuZCAtIHN0YXJ0O1xyXG4gICAgICAgIGlmICh0YWdzW2luZGV4XSA+PSBzaXplKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZXM6IG51bWJlcltdO1xyXG4gICAgICAgICAgICBsZXQgcHJldjogbnVtYmVyLCBuZXh0OiBudW1iZXI7XHJcbiAgICAgICAgICAgIGlmIChkaXN0YW5jZSA9PT0gc3RhcnQpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtzaXplLCB0YWdzW2luZGV4XSAtIHNpemVdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcHJldiA9IHN0YXJ0IC0gZGlzdGFuY2U7XHJcbiAgICAgICAgICAgICAgICBuZXh0ID0gdGFnc1tpbmRleF0gLSBzaXplIC0gcHJldjtcclxuICAgICAgICAgICAgICAgIGlmIChuZXh0ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplLCB0YWdzW2luZGV4XSAtIHNpemUgLSBwcmV2XTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gW3ByZXYsIHNpemVdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRhZ3Muc3BsaWNlKGluZGV4LCAxLCAuLi52YWx1ZXMpO1xyXG4gICAgICAgICAgICBpZiAocHJldikgaW5kZXggPSBpbmRleCArIDE7XHJcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCBpbmRleCwgaW5kZXggKyAxLCBzdHIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGFnc1tpbmRleF0gPCBzaXplKSB7XHJcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tJbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrRGlzdGFuY2UgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSBiYWNrdHJhY2tJbmRleDsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrdHJhY2tEaXN0YW5jZSA+PSBzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0Rpc3RhbmNlICs9IHRhZ3NbaV07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSBpICsgMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGZvcndhcmR0cmFja0luZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgICAgIGxldCByZW1haW5pbmdTaXplID0gc2l6ZTtcclxuICAgICAgICAgICAgZm9yIChpID0gaW5kZXggKyAxOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKChyZW1haW5pbmdTaXplIDw9IDAgJiYgdGFnc1tpXSA+IDApLyogfHwgdGFnc1tpXSAlIDIgPT09IC0xKi8pIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IGkgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2l6ZSAtPSB0YWdzW2ldO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEhhbmRsZXMgY2FzZSB3aGVyZSB0aGVyZSBpcyBhIGNsb3NpbmcgdGFnXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYnV0IG5vIG9wZW5pbmcgdGFnIGhlcmUuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG9wZW5Gb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGggPSBpOyBoID49IDA7IGgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFnc1toXSA9PT0gdGFnc1tpXSArIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5Gb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW9wZW5Gb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IGkgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpID09PSB0YWdzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSB0YWdzLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCBiYWNrdHJhY2tJbmRleCwgZm9yd2FyZHRyYWNrSW5kZXgsIHN0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHRhZ3M7XHJcbn07XHJcblxyXG5jb25zdCBnZXRJZEZvclNjb3BlID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IGlkczogeyBba2V5OiBzdHJpbmddOiB7IFtrZXk6IHN0cmluZ106IG51bWJlciB9OyB9ID0ge307XHJcbiAgICBjb25zdCBncmFtbWFyczogYW55ID0ge307XHJcblxyXG4gICAgZnVuY3Rpb24gYnVpbGRTY29wZXNGb3JHcmFtbWFyKGdyYW1tYXJOYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBncmFtbWFyID0gZmluZChhdG9tLmdyYW1tYXJzLmdldEdyYW1tYXJzKCksIGdhbW1yID0+IGdhbW1yLm5hbWUgPT09IGdyYW1tYXJOYW1lKTtcclxuICAgICAgICBpZiAoIWdyYW1tYXIpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWRzW2dyYW1tYXIubmFtZV0gPSB7fTtcclxuICAgICAgICBncmFtbWFyc1tncmFtbWFyLm5hbWVdID0gZ3JhbW1hcjtcclxuXHJcbiAgICAgICAgZWFjaChncmFtbWFyLnJlZ2lzdHJ5LnNjb3Blc0J5SWQsICh2YWx1ZTogc3RyaW5nLCBrZXk6IGFueSkgPT4geyBpZHNbZ3JhbW1hci5uYW1lXVt2YWx1ZV0gPSAra2V5OyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtZXRob2QgPSAoZ3JhbW1hcjogc3RyaW5nLCBzY29wZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgaWYgKCFpZHNbZ3JhbW1hcl0pIHtcclxuICAgICAgICAgICAgYnVpbGRTY29wZXNGb3JHcmFtbWFyKGdyYW1tYXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFpZHNbZ3JhbW1hcl1bc2NvcGVdKVxyXG4gICAgICAgICAgICBpZHNbZ3JhbW1hcl1bc2NvcGVdID0gZ3JhbW1hcnNbZ3JhbW1hcl0ucmVnaXN0cnkuc3RhcnRJZEZvclNjb3BlKHNjb3BlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuICtpZHNbZ3JhbW1hcl1bc2NvcGVdO1xyXG4gICAgfTtcclxuXHJcbiAgICAoPGFueT5tZXRob2QpLmVuZCA9IChzY29wZTogbnVtYmVyKSA9PiArc2NvcGUgLSAxO1xyXG5cclxuICAgIHJldHVybiA8eyAoZ3JhbW1hcjogc3RyaW5nLCBzY29wZTogc3RyaW5nKTogbnVtYmVyOyBlbmQ6IChzY29wZTogbnVtYmVyKSA9PiBudW1iZXI7IH0+bWV0aG9kO1xyXG59KSgpO1xyXG5cclxuXHJcbi8vLyBOT1RFOiBiZXN0IHdheSBJIGhhdmUgZm91bmQgZm9yIHRoZXNlIGlzIHRvIGp1c3QgbG9vayBhdCB0aGVtZSBcImxlc3NcIiBmaWxlc1xyXG4vLyBBbHRlcm5hdGl2ZWx5IGp1c3QgaW5zcGVjdCB0aGUgdG9rZW4gZm9yIGEgLmpzIGZpbGVcclxuZnVuY3Rpb24gZ2V0QXRvbVN0eWxlRm9yVG9rZW4oZ3JhbW1hcjogc3RyaW5nLCB0YWdzOiBudW1iZXJbXSwgdG9rZW46IE1vZGVscy5IaWdobGlnaHRTcGFuLCBpbmRleDogbnVtYmVyLCBpbmRleEVuZDogbnVtYmVyLCBzdHI6IHN0cmluZykge1xyXG4gICAgY29uc3QgcHJldmlvdXNTY29wZXM6IGFueVtdID0gW107XHJcbiAgICBmb3IgKGxldCBpID0gaW5kZXggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgIGlmICh0YWdzW2ldID4gMClcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgcHJldmlvdXNTY29wZXMucHVzaCh0YWdzW2ldKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZXBsYWNlbWVudHM6IHsgc3RhcnQ6IG51bWJlcjsgZW5kOiBudW1iZXI7IHJlcGxhY2VtZW50OiBudW1iZXJbXSB9W10gPSBbXTtcclxuICAgIGNvbnN0IG9wZW5zOiB7IHRhZzogbnVtYmVyOyBpbmRleDogbnVtYmVyIH1bXSA9IFtdO1xyXG4gICAgY29uc3QgY2xvc2VzOiB0eXBlb2Ygb3BlbnMgPSBbXTtcclxuXHJcbiAgICAvLyBTY2FuIGZvciBhbnkgdW5jbG9zZWQgb3IgdW5vcGVuZWQgdGFnc1xyXG4gICAgZm9yIChsZXQgaSA9IGluZGV4OyBpIDwgaW5kZXhFbmQ7IGkrKykge1xyXG4gICAgICAgIGlmICh0YWdzW2ldID4gMCkgY29udGludWU7XHJcbiAgICAgICAgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9wZW5JbmRleCA9IGZpbmRJbmRleChvcGVucywgeCA9PiB4LnRhZyA9PT0gKHRhZ3NbaV0gKyAxKSk7XHJcbiAgICAgICAgICAgIGlmIChvcGVuSW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgb3BlbnMuc3BsaWNlKG9wZW5JbmRleCwgMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjbG9zZXMucHVzaCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBvcGVucy51bnNoaWZ0KHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHVuZnVsbGZpbGxlZDogdHlwZW9mIG9wZW5zID0gW107XHJcbiAgICBpZiAoY2xvc2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB1bmZ1bGxmaWxsZWQgPSBzb3J0Qnkob3BlbnMuY29uY2F0KGNsb3NlcyksIHggPT4geC5pbmRleCk7XHJcbiAgICB9IGVsc2UgaWYgKG9wZW5zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAvLyBHcmFiIHRoZSBsYXN0IGtub3duIG9wZW4sIGFuZCBhcHBlbmQgZnJvbSB0aGVyZVxyXG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgc3RhcnQ6IG9wZW5zW29wZW5zLmxlbmd0aCAtIDFdLmluZGV4LFxyXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxyXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShvcGVuc1tvcGVucy5sZW5ndGggLSAxXS5pbmRleCwgaW5kZXhFbmQgKyAxKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBpbnRlcm5hbEluZGV4ID0gaW5kZXg7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVuZnVsbGZpbGxlZC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IHYgPSB1bmZ1bGxmaWxsZWRbaV07XHJcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xyXG4gICAgICAgICAgICBzdGFydDogaW50ZXJuYWxJbmRleCxcclxuICAgICAgICAgICAgZW5kOiB2LmluZGV4LFxyXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbnRlcm5hbEluZGV4LCB2LmluZGV4KVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGludGVybmFsSW5kZXggPSB2LmluZGV4ICsgMTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVwbGFjZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgc3RhcnQ6IGluZGV4LFxyXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxyXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbmRleCwgaW5kZXhFbmQpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8qcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xyXG4gICAgICAgICAgICBzdGFydDogaW50ZXJuYWxJbmRleCxcclxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW50ZXJuYWxJbmRleCwgaW5kZXhFbmQpXHJcbiAgICAgICAgfSk7Ki9cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhZGQoc2NvcGU6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGlkID0gZ2V0SWRGb3JTY29wZShncmFtbWFyLCBzY29wZSk7XHJcbiAgICAgICAgaWYgKGlkID09PSAtMSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAoIXNvbWUocHJldmlvdXNTY29wZXMsIHogPT4geiA9PT0gaWQpKSB7XHJcbiAgICAgICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2goaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSBjdHgucmVwbGFjZW1lbnQ7XHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50LnVuc2hpZnQoaWQpO1xyXG4gICAgICAgICAgICByZXBsYWNlbWVudC5wdXNoKGdldElkRm9yU2NvcGUuZW5kKGlkKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBzd2l0Y2ggKHRva2VuLktpbmQpIHtcclxuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XHJcbiAgICAgICAgICAgIGFkZChgY29uc3RhbnQubnVtZXJpY2ApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwic3RydWN0IG5hbWVcIjpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNvbnN0YW50Lm51bWVyaWMuaWRlbnRpZmllci5zdHJ1Y3RgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImVudW0gbmFtZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY29uc3RhbnQubnVtZXJpYy5pZGVudGlmaWVyLmVudW1gKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImlkZW50aWZpZXJcIjpcclxuICAgICAgICAgICAgYWRkKGBpZGVudGlmaWVyYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJjbGFzcyBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXJgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImRlbGVnYXRlIG5hbWVcIjpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllci5kZWxlZ2F0ZWApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiaW50ZXJmYWNlIG5hbWVcIjpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllci5pbnRlcmZhY2VgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCI6XHJcbiAgICAgICAgICAgIGFkZChgY29uc3RhbnQub3RoZXIuc3ltYm9sYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJleGNsdWRlZCBjb2RlXCI6XHJcbiAgICAgICAgICAgIGFkZChgY29tbWVudC5ibG9ja2ApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwidW51c2VkIGNvZGVcIjpcclxuICAgICAgICAgICAgYWRkKGB1bnVzZWRgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ1bmhhbmRsZWQgS2luZCBcIiArIHRva2VuLktpbmQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuXHJcbiAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcclxuICAgICAgICBjb25zdCB7cmVwbGFjZW1lbnQsIGVuZCwgc3RhcnR9ID0gY3R4O1xyXG4gICAgICAgIGlmIChyZXBsYWNlbWVudC5sZW5ndGggPT09IDIpIHJldHVybjtcclxuICAgICAgICBsZXQgbnVtID0gZW5kIC0gc3RhcnQ7XHJcbiAgICAgICAgaWYgKG51bSA8PSAwKSB7XHJcbiAgICAgICAgICAgIG51bSA9IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRhZ3Muc3BsaWNlKHN0YXJ0LCBudW0sIC4uLnJlcGxhY2VtZW50KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRHcmFtbWFyKGdyYW1tYXI6IEZpcnN0TWF0ZS5HcmFtbWFyKTogRmlyc3RNYXRlLkdyYW1tYXIge1xyXG4gICAgY29uc3QgZzIgPSBnZXRFbmhhbmNlZEdyYW1tYXIodGhpcywgZ3JhbW1hcik7XHJcbiAgICBpZiAoZzIgIT09IGdyYW1tYXIpXHJcbiAgICAgICAgdGhpcy5fc2V0R3JhbW1hcihnMik7XHJcbiAgICByZXR1cm4gZzI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRFbmhhbmNlZEdyYW1tYXIoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGdyYW1tYXI/OiBGaXJzdE1hdGUuR3JhbW1hciwgb3B0aW9ucz86IHsgcmVhZG9ubHk6IGJvb2xlYW4gfSkge1xyXG4gICAgaWYgKCFncmFtbWFyKSBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcclxuICAgIGlmICghZ3JhbW1hcltcIm9tbmlzaGFycFwiXSAmJiBPbW5pLmlzVmFsaWRHcmFtbWFyKGdyYW1tYXIpKSB7XHJcbiAgICAgICAgY29uc3QgbmV3R3JhbW1hciA9IG5ldyBHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucyk7XHJcbiAgICAgICAgZWFjaChncmFtbWFyLCAoeCwgaSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoaGFzKGdyYW1tYXIsIGkpKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdHcmFtbWFyW2ldID0geDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGdyYW1tYXIgPSA8YW55Pm5ld0dyYW1tYXI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZ3JhbW1hcjtcclxufVxyXG5cclxuLy8gVXNlZCB0byBjYWNoZSB2YWx1ZXMgZm9yIHNwZWNpZmljIGVkaXRvcnNcclxuY2xhc3MgVW51c2VkTWFwIHtcclxuICAgIHByaXZhdGUgX21hcCA9IG5ldyBNYXA8c3RyaW5nLCBPYnNlcnZhYmxlPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4+KCk7XHJcbiAgICBwdWJsaWMgZ2V0KGtleTogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9tYXAuaGFzKGtleSkpIHRoaXMuX21hcC5zZXQoa2V5LCA8YW55Pm5ldyBCZWhhdmlvclN1YmplY3Q8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPihbXSkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAuZ2V0KGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0T2JzZXJ2ZXIoa2V5OiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gPFN1YnNjcmliZXI8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPiAmIHsgZ2V0VmFsdWUoKTogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdIH0+PGFueT50aGlzLmdldChrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlPzogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdKSB7XHJcbiAgICAgICAgY29uc3QgbyA9IHRoaXMuX2dldE9ic2VydmVyKGtleSk7XHJcbiAgICAgICAgaWYgKCFpc0VxdWFsKG8uZ2V0VmFsdWUoKSwgdmFsdWUpKSB7XHJcbiAgICAgICAgICAgIG8ubmV4dCh2YWx1ZSB8fCBbXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWxldGUoa2V5OiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodGhpcy5fbWFwLmhhcyhrZXkpKVxyXG4gICAgICAgICAgICB0aGlzLl9tYXAuZGVsZXRlKGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsZWFyKCkge1xyXG4gICAgICAgIHRoaXMuX21hcC5jbGVhcigpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZW5oYW5jZWRIaWdobGlnaHRpbmcxOSA9IG5ldyBIaWdobGlnaHQ7XHJcbiIsImltcG9ydCB7IE1vZGVscyB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBpc09tbmlzaGFycFRleHRFZGl0b3IgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xuaW1wb3J0IHsgZWFjaCwgZXh0ZW5kLCBoYXMsIHNvbWUsIHJhbmdlLCByZW1vdmUsIHB1bGwsIGZpbmQsIGNoYWluLCB1bmlxLCBmaW5kSW5kZXgsIGV2ZXJ5LCBpc0VxdWFsLCBtaW4sIGRlYm91bmNlLCBzb3J0QnksIHVuaXF1ZUlkLCBmaWx0ZXIgfSBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0LCBSZXBsYXlTdWJqZWN0LCBCZWhhdmlvclN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgcmVnaXN0ZXJDb250ZXh0SXRlbSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XG5jb25zdCBBdG9tR3JhbW1hciA9IHJlcXVpcmUoYXRvbS5jb25maWcucmVzb3VyY2VQYXRoICsgXCIvbm9kZV9tb2R1bGVzL2ZpcnN0LW1hdGUvbGliL2dyYW1tYXIuanNcIik7XG5jb25zdCBERUJPVU5DRV9USU1FID0gMjQwO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmNvbnN0IEhJR0hMSUdIVCA9IFwiSElHSExJR0hUXCIsIEhJR0hMSUdIVF9SRVFVRVNUID0gXCJISUdITElHSFRfUkVRVUVTVFwiO1xuZnVuY3Rpb24gZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKHBhdGgsIHF1aWNrRml4ZXMsIHByb2plY3ROYW1lcykge1xuICAgIHJldHVybiBjaGFpbihxdWlja0ZpeGVzKVxuICAgICAgICAuZmlsdGVyKHggPT4geC5GaWxlTmFtZSA9PT0gcGF0aClcbiAgICAgICAgLm1hcCh4ID0+ICh7XG4gICAgICAgIFN0YXJ0TGluZTogeC5MaW5lLFxuICAgICAgICBTdGFydENvbHVtbjogeC5Db2x1bW4sXG4gICAgICAgIEVuZExpbmU6IHguRW5kTGluZSxcbiAgICAgICAgRW5kQ29sdW1uOiB4LkVuZENvbHVtbixcbiAgICAgICAgS2luZDogXCJ1bnVzZWQgY29kZVwiLFxuICAgICAgICBQcm9qZWN0czogcHJvamVjdE5hbWVzXG4gICAgfSkpXG4gICAgICAgIC52YWx1ZSgpO1xufVxuZXhwb3J0IGNvbnN0IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMgPSBbXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLkNvbW1lbnQsXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLlN0cmluZyxcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uUHVuY3R1YXRpb24sXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLk9wZXJhdG9yLFxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5LZXl3b3JkXG5dO1xuY2xhc3MgSGlnaGxpZ2h0IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cyA9IG5ldyBVbnVzZWRNYXAoKTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJFbmhhbmNlZCBIaWdobGlnaHRpbmdcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiRW5hYmxlcyBzZXJ2ZXIgYmFzZWQgaGlnaGxpZ2h0aW5nLCB3aGljaCBpbmNsdWRlcyBzdXBwb3J0IGZvciBzdHJpbmcgaW50ZXJwb2xhdGlvbiwgY2xhc3MgbmFtZXMgYW5kIG1vcmUuXCI7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IGZhbHNlO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgaWYgKCEoT21uaS5hdG9tVmVyc2lvbi5taW5vciAhPT0gMSB8fCBPbW5pLmF0b21WZXJzaW9uLm1pbm9yID4gOCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmVkaXRvcnMgPSBbXTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChyZWdpc3RlckNvbnRleHRJdGVtKEhJR0hMSUdIVF9SRVFVRVNULCAoY29udGV4dCkgPT4gbmV3IFN1YmplY3QoKSksIHJlZ2lzdGVyQ29udGV4dEl0ZW0oSElHSExJR0hULCAoY29udGV4dCwgZWRpdG9yKSA9PiBjb250ZXh0LmdldChISUdITElHSFRfUkVRVUVTVClcbiAgICAgICAgICAgIC5zdGFydFdpdGgodHJ1ZSlcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwKVxuICAgICAgICAgICAgLnN3aXRjaE1hcCgoKSA9PiBPYnNlcnZhYmxlLmRlZmVyKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3RzID0gY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lID09PSBcImFsbFwiID8gW10gOiBbY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lXTtcbiAgICAgICAgICAgIGxldCBsaW5lc1RvRmV0Y2ggPSB1bmlxKGVkaXRvci5nZXRHcmFtbWFyKCkubGluZXNUb0ZldGNoKTtcbiAgICAgICAgICAgIGlmICghbGluZXNUb0ZldGNoIHx8ICFsaW5lc1RvRmV0Y2gubGVuZ3RoKVxuICAgICAgICAgICAgICAgIGxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuY29tYmluZUxhdGVzdCh0aGlzLnVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKSwgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uaGlnaGxpZ2h0KHtcbiAgICAgICAgICAgICAgICBQcm9qZWN0TmFtZXM6IHByb2plY3RzLFxuICAgICAgICAgICAgICAgIExpbmVzOiBsaW5lc1RvRmV0Y2gsXG4gICAgICAgICAgICAgICAgRXhjbHVkZUNsYXNzaWZpY2F0aW9uczogRXhjbHVkZUNsYXNzaWZpY2F0aW9uc1xuICAgICAgICAgICAgfSkpLCAocXVpY2tmaXhlcywgcmVzcG9uc2UpID0+ICh7XG4gICAgICAgICAgICAgICAgZWRpdG9yLFxuICAgICAgICAgICAgICAgIHByb2plY3RzLFxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodHM6IGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCBxdWlja2ZpeGVzLCBwcm9qZWN0cykuY29uY2F0KHJlc3BvbnNlID8gcmVzcG9uc2UuSGlnaGxpZ2h0cyA6IFtdKVxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgLmRvKCh7IGhpZ2hsaWdodHMgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcikge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnNldFJlc3BvbnNlcyhoaWdobGlnaHRzLCBwcm9qZWN0cy5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXG4gICAgICAgICAgICAgICAgLnJlZkNvdW50KCk7XG4gICAgICAgIH0pKSksIE9tbmkubGlzdGVuZXIubW9kZWwuZGlhZ25vc3RpY3NCeUZpbGVcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY2hhbmdlcyA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBbZmlsZSwgZGlhZ25vc3RpY3NdIG9mIGNoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLnNldChmaWxlLCBmaWx0ZXIoZGlhZ25vc3RpY3MsIHggPT4geC5Mb2dMZXZlbCA9PT0gXCJIaWRkZW5cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSwgT21uaS5lYWNoRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldHVwRWRpdG9yKGVkaXRvciwgY2QpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbW5pc2hhcnBcbiAgICAgICAgICAgICAgICAuZ2V0KEhJR0hMSUdIVClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldChISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcbiAgICAgICAgfSksIE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldChISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcbiAgICAgICAgICAgIGlmIChlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSwgRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5jbGVhcigpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0dXBFZGl0b3IoZWRpdG9yLCBkaXNwb3NhYmxlKSB7XG4gICAgICAgIGlmIChlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSB8fCAhZWRpdG9yLmdldEdyYW1tYXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGlzc3VlUmVxdWVzdCA9IGVkaXRvci5vbW5pc2hhcnAuZ2V0KEhJR0hMSUdIVF9SRVFVRVNUKTtcbiAgICAgICAgYXVnbWVudEVkaXRvcihlZGl0b3IsIHRoaXMudW51c2VkQ29kZVJvd3MsIHRydWUpO1xuICAgICAgICB0aGlzLmVkaXRvcnMucHVzaChlZGl0b3IpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzLmNsZWFyKCk7XG4gICAgICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcygpO1xuICAgICAgICAgICAgZGVsZXRlIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICBwdWxsKHRoaXMuZWRpdG9ycywgZWRpdG9yKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnByb2plY3RcbiAgICAgICAgICAgIC5vYnNlcnZlLmFjdGl2ZUZyYW1ld29ya1xuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzLmNsZWFyKCk7XG4gICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoKCkgPT4gaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSkpKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkU2F2ZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvblxuICAgICAgICAgICAgLndoZW5Db25uZWN0ZWQoKVxuICAgICAgICAgICAgLmRlbGF5KDEwMDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudEVkaXRvcihlZGl0b3IsIHVudXNlZENvZGVSb3dzID0gbnVsbCwgZG9TZXRHcmFtbWFyID0gZmFsc2UpIHtcbiAgICBpZiAoIWVkaXRvcltcIl9vbGRHcmFtbWFyXCJdKVxuICAgICAgICBlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgaWYgKCFlZGl0b3JbXCJfc2V0R3JhbW1hclwiXSlcbiAgICAgICAgZWRpdG9yW1wiX3NldEdyYW1tYXJcIl0gPSBlZGl0b3Iuc2V0R3JhbW1hcjtcbiAgICBpZiAoIWVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0O1xuICAgIGlmICghZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdID0gZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGU7XG4gICAgaWYgKCFlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX3JldG9rZW5pemVMaW5lc1wiXSlcbiAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcztcbiAgICBpZiAoIWVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfdG9rZW5pemVJbkJhY2tncm91bmRcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfdG9rZW5pemVJbkJhY2tncm91bmRcIl0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnRva2VuaXplSW5CYWNrZ3JvdW5kO1xuICAgIGlmICghZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9jaHVua1NpemVcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJjaHVua1NpemVcIl0gPSAyMDtcbiAgICBlZGl0b3Iuc2V0R3JhbW1hciA9IHNldEdyYW1tYXI7XG4gICAgaWYgKGRvU2V0R3JhbW1hcilcbiAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSk7XG4gICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dCA9IGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKVtcIl9fcm93X19cIl0gPSByb3c7XG4gICAgICAgIHJldHVybiBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBpZiAoIWVkaXRvci50b2tlbml6ZWRCdWZmZXIuc2lsZW50UmV0b2tlbml6ZUxpbmVzKSB7XG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIuc2lsZW50UmV0b2tlbml6ZUxpbmVzID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xuICAgICAgICAgICAgbGV0IGxhc3RSb3c7XG4gICAgICAgICAgICBsYXN0Um93ID0gdGhpcy5idWZmZXIuZ2V0TGFzdFJvdygpO1xuICAgICAgICAgICAgdGhpcy50b2tlbml6ZWRMaW5lcyA9IHRoaXMuYnVpbGRQbGFjZWhvbGRlclRva2VuaXplZExpbmVzRm9yUm93cygwLCBsYXN0Um93KTtcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZFJvd3MgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmxpbmVzVG9Ub2tlbml6ZSAmJiB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3cobWluKHRoaXMubGluZXNUb1Rva2VuaXplKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3coMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZ1bGx5VG9rZW5pemVkID0gZmFsc2U7XG4gICAgICAgIH0sIERFQk9VTkNFX1RJTUUsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgfVxuICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIubWFya1Rva2VuaXphdGlvbkNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcpXG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KHRydWUpO1xuICAgICAgICByZXR1cm4gZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcpXG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KGZhbHNlKTtcbiAgICAgICAgcmV0dXJuIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnRva2VuaXplSW5CYWNrZ3JvdW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMudmlzaWJsZSB8fCB0aGlzLnBlbmRpbmdDaHVuayB8fCAhdGhpcy5pc0FsaXZlKCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gdHJ1ZTtcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wZW5kaW5nQ2h1bmsgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQWxpdmUoKSAmJiB0aGlzLmJ1ZmZlci5pc0FsaXZlKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRva2VuaXplTmV4dENodW5rKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5zY29wZXNGcm9tVGFncyA9IGZ1bmN0aW9uIChzdGFydGluZ1Njb3BlcywgdGFncykge1xuICAgICAgICBjb25zdCBzY29wZXMgPSBzdGFydGluZ1Njb3Blcy5zbGljZSgpO1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRhZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRhZyA9IHRhZ3NbaV07XG4gICAgICAgICAgICBpZiAodGFnIDwgMCkge1xuICAgICAgICAgICAgICAgIGlmICgodGFnICUgMikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3Blcy5wdXNoKHRhZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGluZ1N0YXJ0VGFnID0gdGFnICsgMTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMucG9wKCkgPT09IG1hdGNoaW5nU3RhcnRUYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2goZ3JhbW1hci5zdGFydElkRm9yU2NvcGUoYC4ke2dyYW1tYXIuc2NvcGVOYW1lfWApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oXCJFbmNvdW50ZXJlZCBhbiB1bm1hdGNoZWQgc2NvcGUgZW5kIHRhZy5cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogZWRpdG9yLmJ1ZmZlci5nZXRQYXRoKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW1tYXJTY29wZU5hbWU6IGdyYW1tYXIuc2NvcGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVubWF0Y2hlZEVuZFRhZzogZ3JhbW1hci5zY29wZUZvcklkKHRhZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnNldFJlc3BvbnNlcyhbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVudXNlZENvZGVSb3dzICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocm93cyA9PiBlZGl0b3IuZ2V0R3JhbW1hcigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0UmVzcG9uc2VzKGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCByb3dzLCBbXSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlcztcbiAgICB9O1xufVxuY2xhc3MgR3JhbW1hciB7XG4gICAgY29uc3RydWN0b3IoZWRpdG9yLCBiYXNlLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2dpZCA9IHVuaXF1ZUlkKFwib2dcIik7XG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nID0gbmV3IFJlcGxheVN1YmplY3QoMSk7XG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLnJlc3BvbnNlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB7fTtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnJlYWRvbmx5KSB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkucHJlZW1wdERpZENoYW5nZSgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgb2xkUmFuZ2UsIG5ld1JhbmdlIH0gPSBlO1xuICAgICAgICAgICAgICAgIGxldCBzdGFydCA9IG9sZFJhbmdlLnN0YXJ0LnJvdywgZGVsdGEgPSBuZXdSYW5nZS5lbmQucm93IC0gb2xkUmFuZ2UuZW5kLnJvdztcbiAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0IC0gNTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnQgPCAwKVxuICAgICAgICAgICAgICAgICAgICBzdGFydCA9IDA7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5kID0gZWRpdG9yLmJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDE7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSByYW5nZShzdGFydCwgZW5kICsgMSk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5rZXlzKCkubmV4dCgpLmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2gucHVzaCguLi5saW5lcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGxpbmVzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkRnJvbSA9IG9sZFJhbmdlLnN0YXJ0LmNvbHVtbiwgbmV3RnJvbSA9IG5ld1JhbmdlLnN0YXJ0LmNvbHVtbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZShyZXNwb25zZUxpbmUsIChzcGFuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRMaW5lIDwgbGluZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG9sZEZyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gb2xkRnJvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gbmV3RnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBuZXdGcm9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWFjaChsaW5lcywgbGluZSA9PiB7IHRoaXMucmVzcG9uc2VzLmRlbGV0ZShsaW5lKTsgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkZWx0YSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBjb3VudCAtIDE7IGkgPiBlbmQ7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VzLmhhcyhpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpICsgZGVsdGEsIHRoaXMucmVzcG9uc2VzLmdldChpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWJzRGVsdGEgPSBNYXRoLmFicyhkZWx0YSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBlbmQ7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkgKyBhYnNEZWx0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaSwgdGhpcy5yZXNwb25zZXMuZ2V0KGkgKyBhYnNEZWx0YSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLmRlbGV0ZShpICsgYWJzRGVsdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0UmVzcG9uc2VzKHZhbHVlLCBlbmFibGVFeGNsdWRlQ29kZSkge1xuICAgICAgICBjb25zdCByZXN1bHRzID0gY2hhaW4odmFsdWUpO1xuICAgICAgICBjb25zdCBncm91cGVkSXRlbXMgPSByZXN1bHRzLm1hcChoaWdobGlnaHQgPT4gcmFuZ2UoaGlnaGxpZ2h0LlN0YXJ0TGluZSwgaGlnaGxpZ2h0LkVuZExpbmUgKyAxKVxuICAgICAgICAgICAgLm1hcChsaW5lID0+ICh7IGxpbmUsIGhpZ2hsaWdodCB9KSkpXG4gICAgICAgICAgICAuZmxhdHRlbigpXG4gICAgICAgICAgICAuZ3JvdXBCeSh6ID0+IHoubGluZSlcbiAgICAgICAgICAgIC52YWx1ZSgpO1xuICAgICAgICBlYWNoKGdyb3VwZWRJdGVtcywgKGl0ZW0sIGtleSkgPT4ge1xuICAgICAgICAgICAgbGV0IGsgPSAra2V5LCBtYXBwZWRJdGVtID0gaXRlbS5tYXAoeCA9PiB4LmhpZ2hsaWdodCk7XG4gICAgICAgICAgICBpZiAoIWVuYWJsZUV4Y2x1ZGVDb2RlIHx8IHNvbWUobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIikgJiYgZXZlcnkobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwiZXhjbHVkZWQgY29kZVwiIHx8IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSkge1xuICAgICAgICAgICAgICAgIG1hcHBlZEl0ZW0gPSBtYXBwZWRJdGVtLmZpbHRlcih6ID0+IHouS2luZCAhPT0gXCJleGNsdWRlZCBjb2RlXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMoaykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChrKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lLmxlbmd0aCAhPT0gbWFwcGVkSXRlbS5sZW5ndGggfHwgc29tZShyZXNwb25zZUxpbmUsIChsLCBpKSA9PiAhaXNFcXVhbChsLCBtYXBwZWRJdGVtW2ldKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXh0ZW5kKEdyYW1tYXIucHJvdG90eXBlLCBBdG9tR3JhbW1hci5wcm90b3R5cGUpO1xuR3JhbW1hci5wcm90b3R5cGVbXCJvbW5pc2hhcnBcIl0gPSB0cnVlO1xuR3JhbW1hci5wcm90b3R5cGVbXCJ0b2tlbml6ZUxpbmVcIl0gPSBmdW5jdGlvbiAobGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUgPSBmYWxzZSkge1xuICAgIGNvbnN0IGJhc2VSZXN1bHQgPSBBdG9tR3JhbW1hci5wcm90b3R5cGUudG9rZW5pemVMaW5lLmNhbGwodGhpcywgbGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUpO1xuICAgIGxldCB0YWdzO1xuICAgIGlmICh0aGlzLnJlc3BvbnNlcykge1xuICAgICAgICBjb25zdCByb3cgPSB0aGlzW1wiX19yb3dfX1wiXTtcbiAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMocm93KSlcbiAgICAgICAgICAgIHJldHVybiBiYXNlUmVzdWx0O1xuICAgICAgICBjb25zdCBoaWdobGlnaHRzID0gdGhpcy5yZXNwb25zZXMuZ2V0KHJvdyk7XG4gICAgICAgIGlmIChoaWdobGlnaHRzWzBdICYmIGhpZ2hsaWdodHNbMF0uS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIpIHtcbiAgICAgICAgICAgIHRhZ3MgPSBbbGluZS5sZW5ndGhdO1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHRzWzBdLCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xuICAgICAgICAgICAgYmFzZVJlc3VsdC5ydWxlU3RhY2sgPSBbYmFzZVJlc3VsdC5ydWxlU3RhY2tbMF1dO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGFncyA9IHRoaXMuZ2V0Q3NUb2tlbnNGb3JMaW5lKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIGJhc2VSZXN1bHQudGFncyk7XG4gICAgICAgIH1cbiAgICAgICAgYmFzZVJlc3VsdC50YWdzID0gdGFncztcbiAgICB9XG4gICAgcmV0dXJuIGJhc2VSZXN1bHQ7XG59O1xuR3JhbW1hci5wcm90b3R5cGUuZ2V0Q3NUb2tlbnNGb3JMaW5lID0gZnVuY3Rpb24gKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIHRhZ3MpIHtcbiAgICBydWxlU3RhY2sgPSBbeyBydWxlOiB0aGlzLmdldEluaXRpYWxSdWxlKCkgfV07XG4gICAgZWFjaChoaWdobGlnaHRzLCAoaGlnaGxpZ2h0KSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uIC0gMTtcbiAgICAgICAgY29uc3QgZW5kID0gaGlnaGxpZ2h0LkVuZENvbHVtbiAtIDE7XG4gICAgICAgIGlmIChoaWdobGlnaHQuRW5kTGluZSA+IGhpZ2hsaWdodC5TdGFydExpbmUgJiYgaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uID09PSAwICYmIGhpZ2hsaWdodC5FbmRDb2x1bW4gPT09IDApIHtcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaXN0YW5jZSA9IC0xO1xuICAgICAgICBsZXQgaW5kZXggPSAtMTtcbiAgICAgICAgbGV0IGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgKyB0YWdzW2ldID4gc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgKz0gdGFnc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdHIgPSBsaW5lLnN1YnN0cmluZyhzdGFydCwgZW5kKTtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IGVuZCAtIHN0YXJ0O1xuICAgICAgICBpZiAodGFnc1tpbmRleF0gPj0gc2l6ZSkge1xuICAgICAgICAgICAgbGV0IHZhbHVlcztcbiAgICAgICAgICAgIGxldCBwcmV2LCBuZXh0O1xuICAgICAgICAgICAgaWYgKGRpc3RhbmNlID09PSBzdGFydCkge1xuICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtzaXplLCB0YWdzW2luZGV4XSAtIHNpemVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJldiA9IHN0YXJ0IC0gZGlzdGFuY2U7XG4gICAgICAgICAgICAgICAgbmV4dCA9IHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXY7XG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplLCB0YWdzW2luZGV4XSAtIHNpemUgLSBwcmV2XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YWdzLnNwbGljZShpbmRleCwgMSwgLi4udmFsdWVzKTtcbiAgICAgICAgICAgIGlmIChwcmV2KVxuICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXggKyAxO1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGluZGV4LCBpbmRleCArIDEsIHN0cik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGFnc1tpbmRleF0gPCBzaXplKSB7XG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tEaXN0YW5jZSA9IDA7XG4gICAgICAgICAgICBmb3IgKGkgPSBiYWNrdHJhY2tJbmRleDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0Rpc3RhbmNlICs9IHRhZ3NbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrdHJhY2tEaXN0YW5jZSA+PSBzaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGkgKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZm9yd2FyZHRyYWNrSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGxldCByZW1haW5pbmdTaXplID0gc2l6ZTtcbiAgICAgICAgICAgIGZvciAoaSA9IGluZGV4ICsgMTsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoKHJlbWFpbmluZ1NpemUgPD0gMCAmJiB0YWdzW2ldID4gMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmdTaXplIC09IHRhZ3NbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBvcGVuRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IGk7IGggPj0gMDsgaC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFnc1toXSA9PT0gdGFnc1tpXSArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghb3BlbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IGkgLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA9PT0gdGFncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IHRhZ3MubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCBiYWNrdHJhY2tJbmRleCwgZm9yd2FyZHRyYWNrSW5kZXgsIHN0cik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdGFncztcbn07XG5jb25zdCBnZXRJZEZvclNjb3BlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBpZHMgPSB7fTtcbiAgICBjb25zdCBncmFtbWFycyA9IHt9O1xuICAgIGZ1bmN0aW9uIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyTmFtZSkge1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZmluZChhdG9tLmdyYW1tYXJzLmdldEdyYW1tYXJzKCksIGdhbW1yID0+IGdhbW1yLm5hbWUgPT09IGdyYW1tYXJOYW1lKTtcbiAgICAgICAgaWYgKCFncmFtbWFyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZHNbZ3JhbW1hci5uYW1lXSA9IHt9O1xuICAgICAgICBncmFtbWFyc1tncmFtbWFyLm5hbWVdID0gZ3JhbW1hcjtcbiAgICAgICAgZWFjaChncmFtbWFyLnJlZ2lzdHJ5LnNjb3Blc0J5SWQsICh2YWx1ZSwga2V5KSA9PiB7IGlkc1tncmFtbWFyLm5hbWVdW3ZhbHVlXSA9ICtrZXk7IH0pO1xuICAgIH1cbiAgICBjb25zdCBtZXRob2QgPSAoZ3JhbW1hciwgc2NvcGUpID0+IHtcbiAgICAgICAgaWYgKCFpZHNbZ3JhbW1hcl0pIHtcbiAgICAgICAgICAgIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXVtzY29wZV0pXG4gICAgICAgICAgICBpZHNbZ3JhbW1hcl1bc2NvcGVdID0gZ3JhbW1hcnNbZ3JhbW1hcl0ucmVnaXN0cnkuc3RhcnRJZEZvclNjb3BlKHNjb3BlKTtcbiAgICAgICAgcmV0dXJuICtpZHNbZ3JhbW1hcl1bc2NvcGVdO1xuICAgIH07XG4gICAgbWV0aG9kLmVuZCA9IChzY29wZSkgPT4gK3Njb3BlIC0gMTtcbiAgICByZXR1cm4gbWV0aG9kO1xufSkoKTtcbmZ1bmN0aW9uIGdldEF0b21TdHlsZUZvclRva2VuKGdyYW1tYXIsIHRhZ3MsIHRva2VuLCBpbmRleCwgaW5kZXhFbmQsIHN0cikge1xuICAgIGNvbnN0IHByZXZpb3VzU2NvcGVzID0gW107XG4gICAgZm9yIChsZXQgaSA9IGluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2godGFnc1tpXSk7XG4gICAgfVxuICAgIGNvbnN0IHJlcGxhY2VtZW50cyA9IFtdO1xuICAgIGNvbnN0IG9wZW5zID0gW107XG4gICAgY29uc3QgY2xvc2VzID0gW107XG4gICAgZm9yIChsZXQgaSA9IGluZGV4OyBpIDwgaW5kZXhFbmQ7IGkrKykge1xuICAgICAgICBpZiAodGFnc1tpXSA+IDApXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBvcGVuSW5kZXggPSBmaW5kSW5kZXgob3BlbnMsIHggPT4geC50YWcgPT09ICh0YWdzW2ldICsgMSkpO1xuICAgICAgICAgICAgaWYgKG9wZW5JbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3BlbnMuc3BsaWNlKG9wZW5JbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9zZXMucHVzaCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvcGVucy51bnNoaWZ0KHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgdW5mdWxsZmlsbGVkID0gW107XG4gICAgaWYgKGNsb3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHVuZnVsbGZpbGxlZCA9IHNvcnRCeShvcGVucy5jb25jYXQoY2xvc2VzKSwgeCA9PiB4LmluZGV4KTtcbiAgICB9XG4gICAgZWxzZSBpZiAob3BlbnMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogb3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2Uob3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsIGluZGV4RW5kICsgMSlcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCBpbnRlcm5hbEluZGV4ID0gaW5kZXg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmZ1bGxmaWxsZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgdiA9IHVuZnVsbGZpbGxlZFtpXTtcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXG4gICAgICAgICAgICBlbmQ6IHYuaW5kZXgsXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbnRlcm5hbEluZGV4LCB2LmluZGV4KVxuICAgICAgICB9KTtcbiAgICAgICAgaW50ZXJuYWxJbmRleCA9IHYuaW5kZXggKyAxO1xuICAgIH1cbiAgICBpZiAocmVwbGFjZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogaW5kZXgsXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW5kZXgsIGluZGV4RW5kKVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZChzY29wZSkge1xuICAgICAgICBjb25zdCBpZCA9IGdldElkRm9yU2NvcGUoZ3JhbW1hciwgc2NvcGUpO1xuICAgICAgICBpZiAoaWQgPT09IC0xKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoIXNvbWUocHJldmlvdXNTY29wZXMsIHogPT4geiA9PT0gaWQpKSB7XG4gICAgICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKGlkKTtcbiAgICAgICAgfVxuICAgICAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gY3R4LnJlcGxhY2VtZW50O1xuICAgICAgICAgICAgcmVwbGFjZW1lbnQudW5zaGlmdChpZCk7XG4gICAgICAgICAgICByZXBsYWNlbWVudC5wdXNoKGdldElkRm9yU2NvcGUuZW5kKGlkKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRva2VuLktpbmQpIHtcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5udW1lcmljYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInN0cnVjdCBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY29uc3RhbnQubnVtZXJpYy5pZGVudGlmaWVyLnN0cnVjdGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJlbnVtIG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuZW51bWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6XG4gICAgICAgICAgICBhZGQoYGlkZW50aWZpZXJgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiY2xhc3MgbmFtZVwiOlxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllcmApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJkZWxlZ2F0ZSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmRlbGVnYXRlYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImludGVyZmFjZSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmludGVyZmFjZWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiOlxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5vdGhlci5zeW1ib2xgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZXhjbHVkZWQgY29kZVwiOlxuICAgICAgICAgICAgYWRkKGBjb21tZW50LmJsb2NrYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInVudXNlZCBjb2RlXCI6XG4gICAgICAgICAgICBhZGQoYHVudXNlZGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVuaGFuZGxlZCBLaW5kIFwiICsgdG9rZW4uS2luZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XG4gICAgICAgIGNvbnN0IHsgcmVwbGFjZW1lbnQsIGVuZCwgc3RhcnQgfSA9IGN0eDtcbiAgICAgICAgaWYgKHJlcGxhY2VtZW50Lmxlbmd0aCA9PT0gMilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IG51bSA9IGVuZCAtIHN0YXJ0O1xuICAgICAgICBpZiAobnVtIDw9IDApIHtcbiAgICAgICAgICAgIG51bSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgdGFncy5zcGxpY2Uoc3RhcnQsIG51bSwgLi4ucmVwbGFjZW1lbnQpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gc2V0R3JhbW1hcihncmFtbWFyKSB7XG4gICAgY29uc3QgZzIgPSBnZXRFbmhhbmNlZEdyYW1tYXIodGhpcywgZ3JhbW1hcik7XG4gICAgaWYgKGcyICE9PSBncmFtbWFyKVxuICAgICAgICB0aGlzLl9zZXRHcmFtbWFyKGcyKTtcbiAgICByZXR1cm4gZzI7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5oYW5jZWRHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucykge1xuICAgIGlmICghZ3JhbW1hcilcbiAgICAgICAgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgaWYgKCFncmFtbWFyW1wib21uaXNoYXJwXCJdICYmIE9tbmkuaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcikpIHtcbiAgICAgICAgY29uc3QgbmV3R3JhbW1hciA9IG5ldyBHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucyk7XG4gICAgICAgIGVhY2goZ3JhbW1hciwgKHgsIGkpID0+IHtcbiAgICAgICAgICAgIGlmIChoYXMoZ3JhbW1hciwgaSkpIHtcbiAgICAgICAgICAgICAgICBuZXdHcmFtbWFyW2ldID0geDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGdyYW1tYXIgPSBuZXdHcmFtbWFyO1xuICAgIH1cbiAgICByZXR1cm4gZ3JhbW1hcjtcbn1cbmNsYXNzIFVudXNlZE1hcCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX21hcCA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgZ2V0KGtleSkge1xuICAgICAgICBpZiAoIXRoaXMuX21hcC5oYXMoa2V5KSlcbiAgICAgICAgICAgIHRoaXMuX21hcC5zZXQoa2V5LCBuZXcgQmVoYXZpb3JTdWJqZWN0KFtdKSk7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAuZ2V0KGtleSk7XG4gICAgfVxuICAgIF9nZXRPYnNlcnZlcihrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0KGtleSk7XG4gICAgfVxuICAgIHNldChrZXksIHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IG8gPSB0aGlzLl9nZXRPYnNlcnZlcihrZXkpO1xuICAgICAgICBpZiAoIWlzRXF1YWwoby5nZXRWYWx1ZSgpLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgIG8ubmV4dCh2YWx1ZSB8fCBbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGRlbGV0ZShrZXkpIHtcbiAgICAgICAgaWYgKHRoaXMuX21hcC5oYXMoa2V5KSlcbiAgICAgICAgICAgIHRoaXMuX21hcC5kZWxldGUoa2V5KTtcbiAgICB9XG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuX21hcC5jbGVhcigpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBlbmhhbmNlZEhpZ2hsaWdodGluZzE5ID0gbmV3IEhpZ2hsaWdodDtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
