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

var _omnisharpClient = require("omnisharp-client");

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
            this.disposable = new _omnisharpClient.CompositeDisposable();
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
            }), _omnisharpClient.Disposable.create(function () {
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
            disposable.add(_omnisharpClient.Disposable.create(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS50cyIsImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztRQTJLQSxhLEdBQUEsYTtRQTJnQkEsa0IsR0FBQSxrQjs7QUN0ckJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QURLQSxJQUFNLGNBQWMsUUFBYyxLQUFNLE1BQU4sQ0FBYSxZQUFiLEdBQTRCLHlDQUExQyxDQUFwQjtBQUVBLElBQU0sZ0JBQWdCLEdBQXRCO0FBQ0EsSUFBSSxVQUEwQixRQUFRLFNBQVIsQ0FBOUI7QUFFQSxJQUFNLFlBQVksV0FBbEI7SUFDSSxvQkFBb0IsbUJBRHhCO0FBR0EsU0FBQSwyQkFBQSxDQUFxQyxJQUFyQyxFQUFtRCxVQUFuRCxFQUE0RixZQUE1RixFQUFrSDtBQUM5RyxXQUFPLG1CQUFNLFVBQU4sRUFDRixNQURFLENBQ0s7QUFBQSxlQUFLLEVBQUUsUUFBRixLQUFlLElBQXBCO0FBQUEsS0FETCxFQUVGLEdBRkUsQ0FFRTtBQUFBLGVBQU07QUFDUCx1QkFBVyxFQUFFLElBRE47QUFFUCx5QkFBYSxFQUFFLE1BRlI7QUFHUCxxQkFBUyxFQUFFLE9BSEo7QUFJUCx1QkFBVyxFQUFFLFNBSk47QUFLUCxrQkFBTSxhQUxDO0FBTVAsc0JBQVU7QUFOSCxTQUFOO0FBQUEsS0FGRixFQVVGLEtBVkUsRUFBUDtBQVdIO0FBR00sSUFBTSwwREFBeUIsQ0FDbEMsQ0FEa0MsRUFFbEMsQ0FGa0MsRUFHbEMsQ0FIa0MsRUFJbEMsQ0FKa0MsRUFLbEMsQ0FMa0MsQ0FBL0I7O0lBU1AsUztBQUFBLHlCQUFBO0FBQUE7O0FBR1ksYUFBQSxjQUFBLEdBQWlCLElBQUksU0FBSixFQUFqQjtBQXlIRCxhQUFBLFFBQUEsR0FBVyxLQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsdUJBQVI7QUFDQSxhQUFBLFdBQUEsR0FBYywyR0FBZDtBQUNBLGFBQUEsT0FBQSxH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UztBQUFBLHlCQUFBO0FBQUE7O0FBQ1ksYUFBQSxJQUFBLEdBQU8sSUFBSSxHQUFKLEVBQVA7QUEwQlg7Ozs7NEJBekJjLEcsRUFBVztBQUNsQixnQkFBSSxDQUFDLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxHQUFkLENBQUwsRUFBeUIsS0FBSyxJQUFMLENBQVUsR0FBVixDQUFjLEdBQWQsRUFBd0IsMEJBQWlELEVBQWpELENBQXhCO0FBQ3pCLG1CQUFPLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxHQUFkLENBQVA7QUFDSDs7O3FDQUVvQixHLEVBQVc7QUFDNUIsbUJBQW1HLEtBQUssR0FBTCxDQUFTLEdBQVQsQ0FBbkc7QUFDSDs7OzRCQUVVLEcsRUFBYSxLLEVBQW1DO0FBQ3ZELGdCQUFNLElBQUksS0FBSyxZQUFMLENBQWtCLEdBQWxCLENBQVY7QUFDQSxnQkFBSSxDQUFDLHFCQUFRLEVBQUUsUUFBRixFQUFSLEVBQXNCLEtBQXRCLENBQUwsRUFBbUM7QUFDL0Isa0JBQUUsSUFBRixDQUFPLFNBQVMsRUFBaEI7QUFDSDtBQUNELG1CQUFPLElBQVA7QUFDSDs7O2dDQUVhLEcsRUFBVztBQUNyQixnQkFBSSxLQUFLLElBQUwsQ0FBVSxHQUFWLENBQWMsR0FBZCxDQUFKLEVBQ0ksS0FBSyxJQUFMLENBQVUsTUFBVixDQUFpQixHQUFqQjtBQUNQOzs7Z0NBRVc7QUFDUixpQkFBSyxJQUFMLENBQVUsS0FBVjtBQUNIOzs7Ozs7QUFHRSxJQUFNLDBEQUF5QixJQUFJLFNBQUosRUFBL0IiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2hpZ2hsaWdodC12MS45LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7T21uaXNoYXJwVGV4dEVkaXRvciwgaXNPbW5pc2hhcnBUZXh0RWRpdG9yfSBmcm9tIFwiLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xyXG5pbXBvcnQge2VhY2gsIGV4dGVuZCwgaGFzLCBzb21lLCByYW5nZSwgcmVtb3ZlLCBwdWxsLCBmaW5kLCBjaGFpbiwgdW5pcSwgZmluZEluZGV4LCBldmVyeSwgaXNFcXVhbCwgbWluLCBkZWJvdW5jZSwgc29ydEJ5LCB1bmlxdWVJZCwgZmlsdGVyfSBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgUmVwbGF5U3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0LCBTdWJzY3JpYmVyfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7cmVnaXN0ZXJDb250ZXh0SXRlbX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5jb25zdCBBdG9tR3JhbW1hciA9IHJlcXVpcmUoKDxhbnk+YXRvbSkuY29uZmlnLnJlc291cmNlUGF0aCArIFwiL25vZGVfbW9kdWxlcy9maXJzdC1tYXRlL2xpYi9ncmFtbWFyLmpzXCIpO1xyXG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuY29uc3QgREVCT1VOQ0VfVElNRSA9IDI0MC8qMjQwKi87XHJcbmxldCBmYXN0ZG9tOiB0eXBlb2YgRmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xyXG5cclxuY29uc3QgSElHSExJR0hUID0gXCJISUdITElHSFRcIixcclxuICAgIEhJR0hMSUdIVF9SRVFVRVNUID0gXCJISUdITElHSFRfUkVRVUVTVFwiO1xyXG5cclxuZnVuY3Rpb24gZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKHBhdGg6IHN0cmluZywgcXVpY2tGaXhlczogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdLCBwcm9qZWN0TmFtZXM6IHN0cmluZ1tdKSB7XHJcbiAgICByZXR1cm4gY2hhaW4ocXVpY2tGaXhlcylcclxuICAgICAgICAuZmlsdGVyKHggPT4geC5GaWxlTmFtZSA9PT0gcGF0aClcclxuICAgICAgICAubWFwKHggPT4gKHtcclxuICAgICAgICAgICAgU3RhcnRMaW5lOiB4LkxpbmUsXHJcbiAgICAgICAgICAgIFN0YXJ0Q29sdW1uOiB4LkNvbHVtbixcclxuICAgICAgICAgICAgRW5kTGluZTogeC5FbmRMaW5lLFxyXG4gICAgICAgICAgICBFbmRDb2x1bW46IHguRW5kQ29sdW1uLFxyXG4gICAgICAgICAgICBLaW5kOiBcInVudXNlZCBjb2RlXCIsXHJcbiAgICAgICAgICAgIFByb2plY3RzOiBwcm9qZWN0TmFtZXNcclxuICAgICAgICB9IGFzIE1vZGVscy5IaWdobGlnaHRTcGFuKSlcclxuICAgICAgICAudmFsdWUoKTtcclxufVxyXG5cclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5leHBvcnQgY29uc3QgRXhjbHVkZUNsYXNzaWZpY2F0aW9ucyA9IFtcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5Db21tZW50LFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLlN0cmluZyxcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5QdW5jdHVhdGlvbixcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5PcGVyYXRvcixcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5LZXl3b3JkXHJcbl07XHJcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5cclxuY2xhc3MgSGlnaGxpZ2h0IGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBlZGl0b3JzOiBBcnJheTxPbW5pc2hhcnBUZXh0RWRpdG9yPjtcclxuICAgIHByaXZhdGUgdW51c2VkQ29kZVJvd3MgPSBuZXcgVW51c2VkTWFwKCk7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIGlmICghKE9tbmkuYXRvbVZlcnNpb24ubWlub3IgIT09IDEgfHwgT21uaS5hdG9tVmVyc2lvbi5taW5vciA+IDgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmVkaXRvcnMgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgcmVnaXN0ZXJDb250ZXh0SXRlbShISUdITElHSFRfUkVRVUVTVCwgKGNvbnRleHQpID0+IG5ldyBTdWJqZWN0PGJvb2xlYW4+KCkpLFxyXG4gICAgICAgICAgICByZWdpc3RlckNvbnRleHRJdGVtKEhJR0hMSUdIVCwgKGNvbnRleHQsIGVkaXRvcikgPT5cclxuICAgICAgICAgICAgICAgIGNvbnRleHQuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydFdpdGgodHJ1ZSlcclxuICAgICAgICAgICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMClcclxuICAgICAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKCgpID0+IE9ic2VydmFibGUuZGVmZXIoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0cyA9IGNvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZSA9PT0gXCJhbGxcIiA/IFtdIDogW2NvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbGluZXNUb0ZldGNoID0gdW5pcTxudW1iZXI+KCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmxpbmVzVG9GZXRjaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbGluZXNUb0ZldGNoIHx8ICFsaW5lc1RvRmV0Y2gubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZXNUb0ZldGNoID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5nZXQoZWRpdG9yLmdldFBhdGgoKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5oaWdobGlnaHQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb2plY3ROYW1lczogcHJvamVjdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTGluZXM6IGxpbmVzVG9GZXRjaCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeGNsdWRlQ2xhc3NpZmljYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocXVpY2tmaXhlcywgcmVzcG9uc2UpID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodHM6IGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCBxdWlja2ZpeGVzLCBwcm9qZWN0cykuY29uY2F0KHJlc3BvbnNlID8gcmVzcG9uc2UuSGlnaGxpZ2h0cyA6IFtdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZG8oKHtoaWdobGlnaHRzfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5zZXRSZXNwb25zZXMoaGlnaGxpZ2h0cywgcHJvamVjdHMubGVuZ3RoID4gMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVmQ291bnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSkpLFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLm1vZGVsLmRpYWdub3N0aWNzQnlGaWxlXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGNoYW5nZXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IFtmaWxlLCBkaWFnbm9zdGljc10gb2YgY2hhbmdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLnNldChmaWxlLCBmaWx0ZXIoZGlhZ25vc3RpY3MsIHggPT4geC5Mb2dMZXZlbCA9PT0gXCJIaWRkZW5cIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBPbW5pLmVhY2hFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0dXBFZGl0b3IoZWRpdG9yLCBjZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbW5pc2hhcnBcclxuICAgICAgICAgICAgICAgICAgICAuZ2V0PE9ic2VydmFibGU8eyBlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3I7IGhpZ2hsaWdodHM6IE1vZGVscy5IaWdobGlnaHRTcGFuW107IHByb2plY3RzOiBzdHJpbmdbXSB9Pj4oSElHSExJR0hUKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5nZXQ8U3ViamVjdDxib29sZWFuPj4oSElHSExJR0hUX1JFUVVFU1QpLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5nZXQ8U3ViamVjdDxib29sZWFuPj4oSElHSExJR0hUX1JFUVVFU1QpLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MuY2xlYXIoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cEVkaXRvcihlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IsIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGUpIHtcclxuICAgICAgICBpZiAoZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0gfHwgIWVkaXRvci5nZXRHcmFtbWFyKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IGlzc3VlUmVxdWVzdCA9IGVkaXRvci5vbW5pc2hhcnAuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKTtcclxuXHJcbiAgICAgICAgYXVnbWVudEVkaXRvcihlZGl0b3IsIHRoaXMudW51c2VkQ29kZVJvd3MsIHRydWUpO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvcnMucHVzaChlZGl0b3IpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoID0gW107XHJcbiAgICAgICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMpICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcy5jbGVhcigpO1xyXG4gICAgICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcygpO1xyXG4gICAgICAgICAgICBkZWxldGUgZWRpdG9yW1wiX29sZEdyYW1tYXJcIl07XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgICAgICBwdWxsKHRoaXMuZWRpdG9ycywgZWRpdG9yKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbW5pc2hhcnAucHJvamVjdFxyXG4gICAgICAgICAgICAub2JzZXJ2ZS5hY3RpdmVGcmFtZXdvcmtcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICAgICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMpICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcy5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKCgpID0+IGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpKSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFNhdmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uXHJcbiAgICAgICAgICAgIC53aGVuQ29ubmVjdGVkKClcclxuICAgICAgICAgICAgLmRlbGF5KDEwMDApXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJFbmhhbmNlZCBIaWdobGlnaHRpbmdcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiRW5hYmxlcyBzZXJ2ZXIgYmFzZWQgaGlnaGxpZ2h0aW5nLCB3aGljaCBpbmNsdWRlcyBzdXBwb3J0IGZvciBzdHJpbmcgaW50ZXJwb2xhdGlvbiwgY2xhc3MgbmFtZXMgYW5kIG1vcmUuXCI7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IGZhbHNlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudEVkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgdW51c2VkQ29kZVJvd3M6IFVudXNlZE1hcCA9IG51bGwsIGRvU2V0R3JhbW1hciA9IGZhbHNlKSB7XHJcbiAgICBpZiAoIWVkaXRvcltcIl9vbGRHcmFtbWFyXCJdKVxyXG4gICAgICAgIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcclxuICAgIGlmICghZWRpdG9yW1wiX3NldEdyYW1tYXJcIl0pXHJcbiAgICAgICAgZWRpdG9yW1wiX3NldEdyYW1tYXJcIl0gPSBlZGl0b3Iuc2V0R3JhbW1hcjtcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXSlcclxuICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdID0gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dDtcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0gPSAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyLm1hcmtUb2tlbml6YXRpb25Db21wbGV0ZTtcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0gPSAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcztcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl90b2tlbml6ZUluQmFja2dyb3VuZFwiXSlcclxuICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX3Rva2VuaXplSW5CYWNrZ3JvdW5kXCJdID0gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci50b2tlbml6ZUluQmFja2dyb3VuZDtcclxuICAgIGlmICghKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9jaHVua1NpemVcIl0pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcImNodW5rU2l6ZVwiXSA9IDIwO1xyXG5cclxuICAgIGVkaXRvci5zZXRHcmFtbWFyID0gc2V0R3JhbW1hcjtcclxuICAgIGlmIChkb1NldEdyYW1tYXIpIGVkaXRvci5zZXRHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpO1xyXG5cclxuICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0ID0gZnVuY3Rpb24gKHJvdzogbnVtYmVyKSB7XHJcbiAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSlbXCJfX3Jvd19fXCJdID0gcm93O1xyXG4gICAgICAgIHJldHVybiAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICghKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikuc2lsZW50UmV0b2tlbml6ZUxpbmVzKSB7XHJcbiAgICAgICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikuc2lsZW50UmV0b2tlbml6ZUxpbmVzID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxyXG4gICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xyXG4gICAgICAgICAgICBsZXQgbGFzdFJvdzogbnVtYmVyO1xyXG4gICAgICAgICAgICBsYXN0Um93ID0gdGhpcy5idWZmZXIuZ2V0TGFzdFJvdygpO1xyXG4gICAgICAgICAgICB0aGlzLnRva2VuaXplZExpbmVzID0gdGhpcy5idWlsZFBsYWNlaG9sZGVyVG9rZW5pemVkTGluZXNGb3JSb3dzKDAsIGxhc3RSb3cpO1xyXG4gICAgICAgICAgICB0aGlzLmludmFsaWRSb3dzID0gW107XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxpbmVzVG9Ub2tlbml6ZSAmJiB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZVJvdyhtaW4odGhpcy5saW5lc1RvVG9rZW5pemUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZVJvdygwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmZ1bGx5VG9rZW5pemVkID0gZmFsc2U7XHJcbiAgICAgICAgfSwgREVCT1VOQ0VfVElNRSwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgcmV0dXJuIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLnJldG9rZW5pemVMaW5lcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxyXG4gICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dChmYWxzZSk7XHJcbiAgICAgICAgcmV0dXJuIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLnRva2VuaXplSW5CYWNrZ3JvdW5kID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghdGhpcy52aXNpYmxlIHx8IHRoaXMucGVuZGluZ0NodW5rIHx8ICF0aGlzLmlzQWxpdmUoKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnBlbmRpbmdDaHVuayA9IHRydWU7XHJcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnBlbmRpbmdDaHVuayA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0FsaXZlKCkgJiYgdGhpcy5idWZmZXIuaXNBbGl2ZSgpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRva2VuaXplTmV4dENodW5rKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikuc2NvcGVzRnJvbVRhZ3MgPSBmdW5jdGlvbiAoc3RhcnRpbmdTY29wZXM6IG51bWJlcltdLCB0YWdzOiBudW1iZXJbXSkge1xyXG4gICAgICAgIGNvbnN0IHNjb3BlcyA9IHN0YXJ0aW5nU2NvcGVzLnNsaWNlKCk7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9ICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0YWdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRhZyA9IHRhZ3NbaV07XHJcbiAgICAgICAgICAgIGlmICh0YWcgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHRhZyAlIDIpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3Blcy5wdXNoKHRhZyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoaW5nU3RhcnRUYWcgPSB0YWcgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMucG9wKCkgPT09IG1hdGNoaW5nU3RhcnRUYWcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIYWNrIHRvIGVuc3VyZSB0aGF0IGFsbCBsaW5lcyBhbHdheXMgZ2V0IHRoZSBwcm9wZXIgc291cmNlIGxpbmVzLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2goPGFueT5ncmFtbWFyLnN0YXJ0SWRGb3JTY29wZShgLiR7Z3JhbW1hci5zY29wZU5hbWV9YCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiRW5jb3VudGVyZWQgYW4gdW5tYXRjaGVkIHNjb3BlIGVuZCB0YWcuXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogZWRpdG9yLmJ1ZmZlci5nZXRQYXRoKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbW1hclNjb3BlTmFtZTogZ3JhbW1hci5zY29wZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVubWF0Y2hlZEVuZFRhZzogZ3JhbW1hci5zY29wZUZvcklkKHRhZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuc2V0UmVzcG9uc2VzKFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1bnVzZWRDb2RlUm93cyAmJiBpc09tbmlzaGFycFRleHRFZGl0b3IoZWRpdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJvd3MgPT4gKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRSZXNwb25zZXMoZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKGVkaXRvci5nZXRQYXRoKCksIHJvd3MsIFtdKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNjb3BlcztcclxuICAgIH07XHJcbn1cclxuXHJcbmludGVyZmFjZSBJSGlnaGxpZ2h0aW5nR3JhbW1hciBleHRlbmRzIEZpcnN0TWF0ZS5HcmFtbWFyIHtcclxuICAgIGlzT2JzZXJ2ZVJldG9rZW5pemluZzogU3ViamVjdDxib29sZWFuPjtcclxuICAgIGxpbmVzVG9GZXRjaDogbnVtYmVyW107XHJcbiAgICBsaW5lc1RvVG9rZW5pemU6IG51bWJlcltdO1xyXG4gICAgcmVzcG9uc2VzOiBNYXA8bnVtYmVyLCBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdPjtcclxuICAgIGZ1bGx5VG9rZW5pemVkOiBib29sZWFuO1xyXG4gICAgc2NvcGVOYW1lOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIEdyYW1tYXIge1xyXG4gICAgcHVibGljIGlzT2JzZXJ2ZVJldG9rZW5pemluZzogUmVwbGF5U3ViamVjdDxib29sZWFuPjtcclxuICAgIHB1YmxpYyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcclxuICAgIHB1YmxpYyBsaW5lc1RvRmV0Y2g6IGFueVtdO1xyXG4gICAgcHVibGljIGxpbmVzVG9Ub2tlbml6ZTogYW55W107XHJcbiAgICBwdWJsaWMgYWN0aXZlRnJhbWV3b3JrOiBhbnk7XHJcbiAgICBwdWJsaWMgcmVzcG9uc2VzOiBNYXA8bnVtYmVyLCBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdPjtcclxuICAgIHB1YmxpYyBfZ2lkID0gdW5pcXVlSWQoXCJvZ1wiKTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgYmFzZTogRmlyc3RNYXRlLkdyYW1tYXIsIG9wdGlvbnM6IHsgcmVhZG9ubHk6IGJvb2xlYW4gfSkge1xyXG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nID0gbmV3IFJlcGxheVN1YmplY3Q8Ym9vbGVhbj4oMSk7XHJcbiAgICAgICAgdGhpcy5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dCh0cnVlKTtcclxuXHJcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XHJcbiAgICAgICAgdGhpcy5yZXNwb25zZXMgPSBuZXcgTWFwPG51bWJlciwgTW9kZWxzLkhpZ2hsaWdodFNwYW5bXT4oKTtcclxuICAgICAgICB0aGlzLmxpbmVzVG9GZXRjaCA9IFtdO1xyXG4gICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplID0gW107XHJcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB7fTtcclxuXHJcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnJlYWRvbmx5KSB7XHJcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5wcmVlbXB0RGlkQ2hhbmdlKChlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHtvbGRSYW5nZSwgbmV3UmFuZ2V9ID0gZTtcclxuICAgICAgICAgICAgICAgIGxldCBzdGFydDogbnVtYmVyID0gb2xkUmFuZ2Uuc3RhcnQucm93LFxyXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhOiBudW1iZXIgPSBuZXdSYW5nZS5lbmQucm93IC0gb2xkUmFuZ2UuZW5kLnJvdztcclxuXHJcbiAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0IC0gNTtcclxuICAgICAgICAgICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSBlZGl0b3IuYnVmZmVyLmdldExpbmVDb3VudCgpIC0gMTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9IHJhbmdlKHN0YXJ0LCBlbmQgKyAxKTtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMua2V5cygpLm5leHQoKS5kb25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2gucHVzaCguLi5saW5lcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChsaW5lc1swXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRGcm9tID0gb2xkUmFuZ2Uuc3RhcnQuY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RnJvbSA9IG5ld1JhbmdlLnN0YXJ0LmNvbHVtbjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZShyZXNwb25zZUxpbmUsIChzcGFuOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRMaW5lIDwgbGluZXNbMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG9sZEZyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gb2xkRnJvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gbmV3RnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBuZXdGcm9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWFjaChsaW5lcywgbGluZSA9PiB7IHRoaXMucmVzcG9uc2VzLmRlbGV0ZShsaW5lKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRlbHRhID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5ldyBsaW5lXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGNvdW50IC0gMTsgaSA+IGVuZDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlc3BvbnNlcy5oYXMoaSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpICsgZGVsdGEsIHRoaXMucmVzcG9uc2VzLmdldChpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5kZWxldGUoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlbHRhIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZWQgbGluZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gZWRpdG9yLmdldExpbmVDb3VudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFic0RlbHRhID0gTWF0aC5hYnMoZGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBlbmQ7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlc3BvbnNlcy5oYXMoaSArIGFic0RlbHRhKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGksIHRoaXMucmVzcG9uc2VzLmdldChpICsgYWJzRGVsdGEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLmRlbGV0ZShpICsgYWJzRGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFJlc3BvbnNlcyh2YWx1ZTogTW9kZWxzLkhpZ2hsaWdodFNwYW5bXSwgZW5hYmxlRXhjbHVkZUNvZGU6IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCByZXN1bHRzID0gY2hhaW4odmFsdWUpO1xyXG5cclxuICAgICAgICBjb25zdCBncm91cGVkSXRlbXMgPSA8YW55PnJlc3VsdHMubWFwKGhpZ2hsaWdodCA9PiByYW5nZShoaWdobGlnaHQuU3RhcnRMaW5lLCBoaWdobGlnaHQuRW5kTGluZSArIDEpXHJcbiAgICAgICAgICAgIC5tYXAobGluZSA9PiAoeyBsaW5lLCBoaWdobGlnaHQgfSkpKVxyXG4gICAgICAgICAgICAuZmxhdHRlbjx7IGxpbmU6IG51bWJlcjsgaGlnaGxpZ2h0OiBNb2RlbHMuSGlnaGxpZ2h0U3BhbiB9PigpXHJcbiAgICAgICAgICAgIC5ncm91cEJ5KHogPT4gei5saW5lKVxyXG4gICAgICAgICAgICAudmFsdWUoKTtcclxuXHJcbiAgICAgICAgZWFjaChncm91cGVkSXRlbXMsIChpdGVtOiB7IGhpZ2hsaWdodDogTW9kZWxzLkhpZ2hsaWdodFNwYW4gfVtdLCBrZXk6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBsZXQgayA9ICtrZXksIG1hcHBlZEl0ZW0gPSBpdGVtLm1hcCh4ID0+IHguaGlnaGxpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZW5hYmxlRXhjbHVkZUNvZGUgfHwgc29tZShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSAmJiBldmVyeShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIgfHwgaS5LaW5kID09PSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBtYXBwZWRJdGVtID0gbWFwcGVkSXRlbS5maWx0ZXIoeiA9PiB6LktpbmQgIT09IFwiZXhjbHVkZWQgY29kZVwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMoaykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChrLCBtYXBwZWRJdGVtKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplLnB1c2goayk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUxpbmUgPSB0aGlzLnJlc3BvbnNlcy5nZXQoayk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lLmxlbmd0aCAhPT0gbWFwcGVkSXRlbS5sZW5ndGggfHwgc29tZShyZXNwb25zZUxpbmUsIChsLCBpKSA9PiAhaXNFcXVhbChsLCBtYXBwZWRJdGVtW2ldKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUucHVzaChrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuLyogdHNsaW50OmRpc2FibGU6bWVtYmVyLWFjY2VzcyAqL1xyXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmV4dGVuZChHcmFtbWFyLnByb3RvdHlwZSwgQXRvbUdyYW1tYXIucHJvdG90eXBlKTtcclxuXHJcbkdyYW1tYXIucHJvdG90eXBlW1wib21uaXNoYXJwXCJdID0gdHJ1ZTtcclxuR3JhbW1hci5wcm90b3R5cGVbXCJ0b2tlbml6ZUxpbmVcIl0gPSBmdW5jdGlvbiAobGluZTogc3RyaW5nLCBydWxlU3RhY2s6IGFueVtdLCBmaXJzdExpbmUgPSBmYWxzZSk6IHsgdGFnczogbnVtYmVyW107IHJ1bGVTdGFjazogYW55IH0ge1xyXG4gICAgY29uc3QgYmFzZVJlc3VsdCA9IEF0b21HcmFtbWFyLnByb3RvdHlwZS50b2tlbml6ZUxpbmUuY2FsbCh0aGlzLCBsaW5lLCBydWxlU3RhY2ssIGZpcnN0TGluZSk7XHJcbiAgICBsZXQgdGFnczogYW55W107XHJcblxyXG4gICAgaWYgKHRoaXMucmVzcG9uc2VzKSB7XHJcbiAgICAgICAgY29uc3Qgcm93ID0gdGhpc1tcIl9fcm93X19cIl07XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMuaGFzKHJvdykpIHJldHVybiBiYXNlUmVzdWx0O1xyXG5cclxuICAgICAgICBjb25zdCBoaWdobGlnaHRzID0gdGhpcy5yZXNwb25zZXMuZ2V0KHJvdyk7XHJcbiAgICAgICAgLy8gRXhjbHVkZWQgY29kZSBibG93cyBhd2F5IGFueSBvdGhlciBmb3JtYXR0aW5nLCBvdGhlcndpc2Ugd2UgZ2V0IGludG8gYSB2ZXJ5IHdlaXJkIHN0YXRlLlxyXG4gICAgICAgIGlmIChoaWdobGlnaHRzWzBdICYmIGhpZ2hsaWdodHNbMF0uS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIpIHtcclxuICAgICAgICAgICAgdGFncyA9IFtsaW5lLmxlbmd0aF07XHJcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0c1swXSwgMCwgdGFncy5sZW5ndGggLSAxLCBsaW5lKTtcclxuICAgICAgICAgICAgYmFzZVJlc3VsdC5ydWxlU3RhY2sgPSBbYmFzZVJlc3VsdC5ydWxlU3RhY2tbMF1dO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRhZ3MgPSB0aGlzLmdldENzVG9rZW5zRm9yTGluZShoaWdobGlnaHRzLCBsaW5lLCByb3csIHJ1bGVTdGFjaywgZmlyc3RMaW5lLCBiYXNlUmVzdWx0LnRhZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBiYXNlUmVzdWx0LnRhZ3MgPSB0YWdzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJhc2VSZXN1bHQ7XHJcbn07XHJcblxyXG4oR3JhbW1hci5wcm90b3R5cGUgYXMgYW55KS5nZXRDc1Rva2Vuc0ZvckxpbmUgPSBmdW5jdGlvbiAoaGlnaGxpZ2h0czogTW9kZWxzLkhpZ2hsaWdodFNwYW5bXSwgbGluZTogc3RyaW5nLCByb3c6IG51bWJlciwgcnVsZVN0YWNrOiBhbnlbXSwgZmlyc3RMaW5lOiBib29sZWFuLCB0YWdzOiBudW1iZXJbXSkge1xyXG4gICAgcnVsZVN0YWNrID0gW3sgcnVsZTogdGhpcy5nZXRJbml0aWFsUnVsZSgpIH1dO1xyXG5cclxuICAgIGVhY2goaGlnaGxpZ2h0cywgKGhpZ2hsaWdodCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uIC0gMTtcclxuICAgICAgICBjb25zdCBlbmQgPSBoaWdobGlnaHQuRW5kQ29sdW1uIC0gMTtcclxuXHJcbiAgICAgICAgaWYgKGhpZ2hsaWdodC5FbmRMaW5lID4gaGlnaGxpZ2h0LlN0YXJ0TGluZSAmJiBoaWdobGlnaHQuU3RhcnRDb2x1bW4gPT09IDAgJiYgaGlnaGxpZ2h0LkVuZENvbHVtbiA9PT0gMCkge1xyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgMCwgdGFncy5sZW5ndGggLSAxLCBsaW5lKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGRpc3RhbmNlID0gLTE7XHJcbiAgICAgICAgbGV0IGluZGV4ID0gLTE7XHJcbiAgICAgICAgbGV0IGk6IG51bWJlcjtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcclxuICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSArIHRhZ3NbaV0gPiBzdGFydCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRpc3RhbmNlICs9IHRhZ3NbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN0ciA9IGxpbmUuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpO1xyXG4gICAgICAgIGNvbnN0IHNpemUgPSBlbmQgLSBzdGFydDtcclxuICAgICAgICBpZiAodGFnc1tpbmRleF0gPj0gc2l6ZSkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWVzOiBudW1iZXJbXTtcclxuICAgICAgICAgICAgbGV0IHByZXY6IG51bWJlciwgbmV4dDogbnVtYmVyO1xyXG4gICAgICAgICAgICBpZiAoZGlzdGFuY2UgPT09IHN0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbc2l6ZSwgdGFnc1tpbmRleF0gLSBzaXplXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHByZXYgPSBzdGFydCAtIGRpc3RhbmNlO1xyXG4gICAgICAgICAgICAgICAgbmV4dCA9IHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXY7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV4dCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbcHJldiwgc2l6ZSwgdGFnc1tpbmRleF0gLSBzaXplIC0gcHJldl07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0YWdzLnNwbGljZShpbmRleCwgMSwgLi4udmFsdWVzKTtcclxuICAgICAgICAgICAgaWYgKHByZXYpIGluZGV4ID0gaW5kZXggKyAxO1xyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgaW5kZXgsIGluZGV4ICsgMSwgc3RyKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRhZ3NbaW5kZXhdIDwgc2l6ZSkge1xyXG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgbGV0IGJhY2t0cmFja0Rpc3RhbmNlID0gMDtcclxuICAgICAgICAgICAgZm9yIChpID0gYmFja3RyYWNrSW5kZXg7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYmFja3RyYWNrRGlzdGFuY2UgPj0gc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tEaXN0YW5jZSArPSB0YWdzW2ldO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrdHJhY2tEaXN0YW5jZSA+PSBzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBmb3J3YXJkdHJhY2tJbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICBsZXQgcmVtYWluaW5nU2l6ZSA9IHNpemU7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IGluZGV4ICsgMTsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICgocmVtYWluaW5nU2l6ZSA8PSAwICYmIHRhZ3NbaV0gPiAwKS8qIHx8IHRhZ3NbaV0gJSAyID09PSAtMSovKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NpemUgLT0gdGFnc1tpXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBIYW5kbGVzIGNhc2Ugd2hlcmUgdGhlcmUgaXMgYSBjbG9zaW5nIHRhZ1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGJ1dCBubyBvcGVuaW5nIHRhZyBoZXJlLlxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBvcGVuRm91bmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBoID0gaTsgaCA+PSAwOyBoLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhZ3NbaF0gPT09IHRhZ3NbaV0gKyAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvcGVuRm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA9PT0gdGFncy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gdGFncy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgYmFja3RyYWNrSW5kZXgsIGZvcndhcmR0cmFja0luZGV4LCBzdHIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB0YWdzO1xyXG59O1xyXG5cclxuY29uc3QgZ2V0SWRGb3JTY29wZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBpZHM6IHsgW2tleTogc3RyaW5nXTogeyBba2V5OiBzdHJpbmddOiBudW1iZXIgfTsgfSA9IHt9O1xyXG4gICAgY29uc3QgZ3JhbW1hcnM6IGFueSA9IHt9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyTmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9IGZpbmQoYXRvbS5ncmFtbWFycy5nZXRHcmFtbWFycygpLCBnYW1tciA9PiBnYW1tci5uYW1lID09PSBncmFtbWFyTmFtZSk7XHJcbiAgICAgICAgaWYgKCFncmFtbWFyKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlkc1tncmFtbWFyLm5hbWVdID0ge307XHJcbiAgICAgICAgZ3JhbW1hcnNbZ3JhbW1hci5uYW1lXSA9IGdyYW1tYXI7XHJcblxyXG4gICAgICAgIGVhY2goZ3JhbW1hci5yZWdpc3RyeS5zY29wZXNCeUlkLCAodmFsdWU6IHN0cmluZywga2V5OiBhbnkpID0+IHsgaWRzW2dyYW1tYXIubmFtZV1bdmFsdWVdID0gK2tleTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWV0aG9kID0gKGdyYW1tYXI6IHN0cmluZywgc2NvcGU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIGlmICghaWRzW2dyYW1tYXJdKSB7XHJcbiAgICAgICAgICAgIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaWRzW2dyYW1tYXJdW3Njb3BlXSlcclxuICAgICAgICAgICAgaWRzW2dyYW1tYXJdW3Njb3BlXSA9IGdyYW1tYXJzW2dyYW1tYXJdLnJlZ2lzdHJ5LnN0YXJ0SWRGb3JTY29wZShzY29wZSk7XHJcblxyXG4gICAgICAgIHJldHVybiAraWRzW2dyYW1tYXJdW3Njb3BlXTtcclxuICAgIH07XHJcblxyXG4gICAgKDxhbnk+bWV0aG9kKS5lbmQgPSAoc2NvcGU6IG51bWJlcikgPT4gK3Njb3BlIC0gMTtcclxuXHJcbiAgICByZXR1cm4gPHsgKGdyYW1tYXI6IHN0cmluZywgc2NvcGU6IHN0cmluZyk6IG51bWJlcjsgZW5kOiAoc2NvcGU6IG51bWJlcikgPT4gbnVtYmVyOyB9Pm1ldGhvZDtcclxufSkoKTtcclxuXHJcblxyXG4vLy8gTk9URTogYmVzdCB3YXkgSSBoYXZlIGZvdW5kIGZvciB0aGVzZSBpcyB0byBqdXN0IGxvb2sgYXQgdGhlbWUgXCJsZXNzXCIgZmlsZXNcclxuLy8gQWx0ZXJuYXRpdmVseSBqdXN0IGluc3BlY3QgdGhlIHRva2VuIGZvciBhIC5qcyBmaWxlXHJcbmZ1bmN0aW9uIGdldEF0b21TdHlsZUZvclRva2VuKGdyYW1tYXI6IHN0cmluZywgdGFnczogbnVtYmVyW10sIHRva2VuOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbiwgaW5kZXg6IG51bWJlciwgaW5kZXhFbmQ6IG51bWJlciwgc3RyOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHByZXZpb3VzU2NvcGVzOiBhbnlbXSA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IGluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICBpZiAodGFnc1tpXSA+IDApXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2godGFnc1tpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVwbGFjZW1lbnRzOiB7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyOyByZXBsYWNlbWVudDogbnVtYmVyW10gfVtdID0gW107XHJcbiAgICBjb25zdCBvcGVuczogeyB0YWc6IG51bWJlcjsgaW5kZXg6IG51bWJlciB9W10gPSBbXTtcclxuICAgIGNvbnN0IGNsb3NlczogdHlwZW9mIG9wZW5zID0gW107XHJcblxyXG4gICAgLy8gU2NhbiBmb3IgYW55IHVuY2xvc2VkIG9yIHVub3BlbmVkIHRhZ3NcclxuICAgIGZvciAobGV0IGkgPSBpbmRleDsgaSA8IGluZGV4RW5kOyBpKyspIHtcclxuICAgICAgICBpZiAodGFnc1tpXSA+IDApIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBvcGVuSW5kZXggPSBmaW5kSW5kZXgob3BlbnMsIHggPT4geC50YWcgPT09ICh0YWdzW2ldICsgMSkpO1xyXG4gICAgICAgICAgICBpZiAob3BlbkluZGV4ID4gLTEpIHtcclxuICAgICAgICAgICAgICAgIG9wZW5zLnNwbGljZShvcGVuSW5kZXgsIDEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY2xvc2VzLnB1c2goeyB0YWc6IHRhZ3NbaV0sIGluZGV4OiBpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgb3BlbnMudW5zaGlmdCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCB1bmZ1bGxmaWxsZWQ6IHR5cGVvZiBvcGVucyA9IFtdO1xyXG4gICAgaWYgKGNsb3Nlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdW5mdWxsZmlsbGVkID0gc29ydEJ5KG9wZW5zLmNvbmNhdChjbG9zZXMpLCB4ID0+IHguaW5kZXgpO1xyXG4gICAgfSBlbHNlIGlmIChvcGVucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgLy8gR3JhYiB0aGUgbGFzdCBrbm93biBvcGVuLCBhbmQgYXBwZW5kIGZyb20gdGhlcmVcclxuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBvcGVuc1tvcGVucy5sZW5ndGggLSAxXS5pbmRleCxcclxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2Uob3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsIGluZGV4RW5kICsgMSlcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgaW50ZXJuYWxJbmRleCA9IGluZGV4O1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmZ1bGxmaWxsZWQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCB2ID0gdW5mdWxsZmlsbGVkW2ldO1xyXG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogdi5pbmRleCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW50ZXJuYWxJbmRleCwgdi5pbmRleClcclxuICAgICAgICB9KTtcclxuICAgICAgICBpbnRlcm5hbEluZGV4ID0gdi5pbmRleCArIDE7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlcGxhY2VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBpbmRleCxcclxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW5kZXgsIGluZGV4RW5kKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvKnJlcGxhY2VtZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGludGVybmFsSW5kZXgsIGluZGV4RW5kKVxyXG4gICAgICAgIH0pOyovXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkKHNjb3BlOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBpZCA9IGdldElkRm9yU2NvcGUoZ3JhbW1hciwgc2NvcGUpO1xyXG4gICAgICAgIGlmIChpZCA9PT0gLTEpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKCFzb21lKHByZXZpb3VzU2NvcGVzLCB6ID0+IHogPT09IGlkKSkge1xyXG4gICAgICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKGlkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gY3R4LnJlcGxhY2VtZW50O1xyXG4gICAgICAgICAgICByZXBsYWNlbWVudC51bnNoaWZ0KGlkKTtcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQucHVzaChnZXRJZEZvclNjb3BlLmVuZChpZCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgc3dpdGNoICh0b2tlbi5LaW5kKSB7XHJcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxyXG4gICAgICAgICAgICBhZGQoYGNvbnN0YW50Lm51bWVyaWNgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcInN0cnVjdCBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuc3RydWN0YCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJlbnVtIG5hbWVcIjpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNvbnN0YW50Lm51bWVyaWMuaWRlbnRpZmllci5lbnVtYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6XHJcbiAgICAgICAgICAgIGFkZChgaWRlbnRpZmllcmApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiY2xhc3MgbmFtZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJkZWxlZ2F0ZSBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXIuZGVsZWdhdGVgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImludGVyZmFjZSBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXIuaW50ZXJmYWNlYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiOlxyXG4gICAgICAgICAgICBhZGQoYGNvbnN0YW50Lm90aGVyLnN5bWJvbGApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiZXhjbHVkZWQgY29kZVwiOlxyXG4gICAgICAgICAgICBhZGQoYGNvbW1lbnQuYmxvY2tgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcInVudXNlZCBjb2RlXCI6XHJcbiAgICAgICAgICAgIGFkZChgdW51c2VkYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidW5oYW5kbGVkIEtpbmQgXCIgKyB0b2tlbi5LaW5kKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcblxyXG4gICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XHJcbiAgICAgICAgY29uc3Qge3JlcGxhY2VtZW50LCBlbmQsIHN0YXJ0fSA9IGN0eDtcclxuICAgICAgICBpZiAocmVwbGFjZW1lbnQubGVuZ3RoID09PSAyKSByZXR1cm47XHJcbiAgICAgICAgbGV0IG51bSA9IGVuZCAtIHN0YXJ0O1xyXG4gICAgICAgIGlmIChudW0gPD0gMCkge1xyXG4gICAgICAgICAgICBudW0gPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0YWdzLnNwbGljZShzdGFydCwgbnVtLCAuLi5yZXBsYWNlbWVudCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0R3JhbW1hcihncmFtbWFyOiBGaXJzdE1hdGUuR3JhbW1hcik6IEZpcnN0TWF0ZS5HcmFtbWFyIHtcclxuICAgIGNvbnN0IGcyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKHRoaXMsIGdyYW1tYXIpO1xyXG4gICAgaWYgKGcyICE9PSBncmFtbWFyKVxyXG4gICAgICAgIHRoaXMuX3NldEdyYW1tYXIoZzIpO1xyXG4gICAgcmV0dXJuIGcyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5oYW5jZWRHcmFtbWFyKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBncmFtbWFyPzogRmlyc3RNYXRlLkdyYW1tYXIsIG9wdGlvbnM/OiB7IHJlYWRvbmx5OiBib29sZWFuIH0pIHtcclxuICAgIGlmICghZ3JhbW1hcikgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XHJcbiAgICBpZiAoIWdyYW1tYXJbXCJvbW5pc2hhcnBcIl0gJiYgT21uaS5pc1ZhbGlkR3JhbW1hcihncmFtbWFyKSkge1xyXG4gICAgICAgIGNvbnN0IG5ld0dyYW1tYXIgPSBuZXcgR3JhbW1hcihlZGl0b3IsIGdyYW1tYXIsIG9wdGlvbnMpO1xyXG4gICAgICAgIGVhY2goZ3JhbW1hciwgKHgsIGkpID0+IHtcclxuICAgICAgICAgICAgaWYgKGhhcyhncmFtbWFyLCBpKSkge1xyXG4gICAgICAgICAgICAgICAgbmV3R3JhbW1hcltpXSA9IHg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBncmFtbWFyID0gPGFueT5uZXdHcmFtbWFyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGdyYW1tYXI7XHJcbn1cclxuXHJcbi8vIFVzZWQgdG8gY2FjaGUgdmFsdWVzIGZvciBzcGVjaWZpYyBlZGl0b3JzXHJcbmNsYXNzIFVudXNlZE1hcCB7XHJcbiAgICBwcml2YXRlIF9tYXAgPSBuZXcgTWFwPHN0cmluZywgT2JzZXJ2YWJsZTxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+PigpO1xyXG4gICAgcHVibGljIGdldChrZXk6IHN0cmluZykge1xyXG4gICAgICAgIGlmICghdGhpcy5fbWFwLmhhcyhrZXkpKSB0aGlzLl9tYXAuc2V0KGtleSwgPGFueT5uZXcgQmVoYXZpb3JTdWJqZWN0PE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4oW10pKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLmdldChrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldE9ic2VydmVyKGtleTogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIDxTdWJzY3JpYmVyPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4gJiB7IGdldFZhbHVlKCk6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSB9Pjxhbnk+dGhpcy5nZXQoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0KGtleTogc3RyaW5nLCB2YWx1ZT86IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSkge1xyXG4gICAgICAgIGNvbnN0IG8gPSB0aGlzLl9nZXRPYnNlcnZlcihrZXkpO1xyXG4gICAgICAgIGlmICghaXNFcXVhbChvLmdldFZhbHVlKCksIHZhbHVlKSkge1xyXG4gICAgICAgICAgICBvLm5leHQodmFsdWUgfHwgW10pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGVsZXRlKGtleTogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX21hcC5oYXMoa2V5KSlcclxuICAgICAgICAgICAgdGhpcy5fbWFwLmRlbGV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9tYXAuY2xlYXIoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGVuaGFuY2VkSGlnaGxpZ2h0aW5nMTkgPSBuZXcgSGlnaGxpZ2h0O1xyXG4iLCJpbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBpc09tbmlzaGFycFRleHRFZGl0b3IgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xuaW1wb3J0IHsgZWFjaCwgZXh0ZW5kLCBoYXMsIHNvbWUsIHJhbmdlLCByZW1vdmUsIHB1bGwsIGZpbmQsIGNoYWluLCB1bmlxLCBmaW5kSW5kZXgsIGV2ZXJ5LCBpc0VxdWFsLCBtaW4sIGRlYm91bmNlLCBzb3J0QnksIHVuaXF1ZUlkLCBmaWx0ZXIgfSBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0LCBSZXBsYXlTdWJqZWN0LCBCZWhhdmlvclN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyByZWdpc3RlckNvbnRleHRJdGVtIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcbmNvbnN0IEF0b21HcmFtbWFyID0gcmVxdWlyZShhdG9tLmNvbmZpZy5yZXNvdXJjZVBhdGggKyBcIi9ub2RlX21vZHVsZXMvZmlyc3QtbWF0ZS9saWIvZ3JhbW1hci5qc1wiKTtcbmNvbnN0IERFQk9VTkNFX1RJTUUgPSAyNDA7XG5sZXQgZmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuY29uc3QgSElHSExJR0hUID0gXCJISUdITElHSFRcIiwgSElHSExJR0hUX1JFUVVFU1QgPSBcIkhJR0hMSUdIVF9SRVFVRVNUXCI7XG5mdW5jdGlvbiBnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMocGF0aCwgcXVpY2tGaXhlcywgcHJvamVjdE5hbWVzKSB7XG4gICAgcmV0dXJuIGNoYWluKHF1aWNrRml4ZXMpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4LkZpbGVOYW1lID09PSBwYXRoKVxuICAgICAgICAubWFwKHggPT4gKHtcbiAgICAgICAgU3RhcnRMaW5lOiB4LkxpbmUsXG4gICAgICAgIFN0YXJ0Q29sdW1uOiB4LkNvbHVtbixcbiAgICAgICAgRW5kTGluZTogeC5FbmRMaW5lLFxuICAgICAgICBFbmRDb2x1bW46IHguRW5kQ29sdW1uLFxuICAgICAgICBLaW5kOiBcInVudXNlZCBjb2RlXCIsXG4gICAgICAgIFByb2plY3RzOiBwcm9qZWN0TmFtZXNcbiAgICB9KSlcbiAgICAgICAgLnZhbHVlKCk7XG59XG5leHBvcnQgY29uc3QgRXhjbHVkZUNsYXNzaWZpY2F0aW9ucyA9IFtcbiAgICAyLFxuICAgIDMsXG4gICAgNSxcbiAgICA0LFxuICAgIDZcbl07XG5jbGFzcyBIaWdobGlnaHQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzID0gbmV3IFVudXNlZE1hcCgpO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkVuaGFuY2VkIEhpZ2hsaWdodGluZ1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJFbmFibGVzIHNlcnZlciBiYXNlZCBoaWdobGlnaHRpbmcsIHdoaWNoIGluY2x1ZGVzIHN1cHBvcnQgZm9yIHN0cmluZyBpbnRlcnBvbGF0aW9uLCBjbGFzcyBuYW1lcyBhbmQgbW9yZS5cIjtcbiAgICAgICAgdGhpcy5kZWZhdWx0ID0gZmFsc2U7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICBpZiAoIShPbW5pLmF0b21WZXJzaW9uLm1pbm9yICE9PSAxIHx8IE9tbmkuYXRvbVZlcnNpb24ubWlub3IgPiA4KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZWRpdG9ycyA9IFtdO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHJlZ2lzdGVyQ29udGV4dEl0ZW0oSElHSExJR0hUX1JFUVVFU1QsIChjb250ZXh0KSA9PiBuZXcgU3ViamVjdCgpKSwgcmVnaXN0ZXJDb250ZXh0SXRlbShISUdITElHSFQsIChjb250ZXh0LCBlZGl0b3IpID0+IGNvbnRleHQuZ2V0KEhJR0hMSUdIVF9SRVFVRVNUKVxuICAgICAgICAgICAgLnN0YXJ0V2l0aCh0cnVlKVxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDApXG4gICAgICAgICAgICAuc3dpdGNoTWFwKCgpID0+IE9ic2VydmFibGUuZGVmZXIoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvamVjdHMgPSBjb250ZXh0LnByb2plY3QuYWN0aXZlRnJhbWV3b3JrLk5hbWUgPT09IFwiYWxsXCIgPyBbXSA6IFtjb250ZXh0LnByb2plY3QuYWN0aXZlRnJhbWV3b3JrLk5hbWVdO1xuICAgICAgICAgICAgbGV0IGxpbmVzVG9GZXRjaCA9IHVuaXEoZWRpdG9yLmdldEdyYW1tYXIoKS5saW5lc1RvRmV0Y2gpO1xuICAgICAgICAgICAgaWYgKCFsaW5lc1RvRmV0Y2ggfHwgIWxpbmVzVG9GZXRjaC5sZW5ndGgpXG4gICAgICAgICAgICAgICAgbGluZXNUb0ZldGNoID0gW107XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KHRoaXMudW51c2VkQ29kZVJvd3MuZ2V0KGVkaXRvci5nZXRQYXRoKCkpLCBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5oaWdobGlnaHQoe1xuICAgICAgICAgICAgICAgIFByb2plY3ROYW1lczogcHJvamVjdHMsXG4gICAgICAgICAgICAgICAgTGluZXM6IGxpbmVzVG9GZXRjaCxcbiAgICAgICAgICAgICAgICBFeGNsdWRlQ2xhc3NpZmljYXRpb25zXG4gICAgICAgICAgICB9KSksIChxdWlja2ZpeGVzLCByZXNwb25zZSkgPT4gKHtcbiAgICAgICAgICAgICAgICBlZGl0b3IsXG4gICAgICAgICAgICAgICAgcHJvamVjdHMsXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0czogZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKGVkaXRvci5nZXRQYXRoKCksIHF1aWNrZml4ZXMsIHByb2plY3RzKS5jb25jYXQocmVzcG9uc2UgPyByZXNwb25zZS5IaWdobGlnaHRzIDogW10pXG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAuZG8oKHsgaGlnaGxpZ2h0cyB9KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKSB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuc2V0UmVzcG9uc2VzKGhpZ2hsaWdodHMsIHByb2plY3RzLmxlbmd0aCA+IDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcbiAgICAgICAgICAgICAgICAucmVmQ291bnQoKTtcbiAgICAgICAgfSkpKSwgT21uaS5saXN0ZW5lci5tb2RlbC5kaWFnbm9zdGljc0J5RmlsZVxuICAgICAgICAgICAgLnN1YnNjcmliZShjaGFuZ2VzID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IFtmaWxlLCBkaWFnbm9zdGljc10gb2YgY2hhbmdlcykge1xuICAgICAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3Muc2V0KGZpbGUsIGZpbHRlcihkaWFnbm9zdGljcywgeCA9PiB4LkxvZ0xldmVsID09PSBcIkhpZGRlblwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLCBPbW5pLmVhY2hFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0dXBFZGl0b3IoZWRpdG9yLCBjZCk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9tbmlzaGFycFxuICAgICAgICAgICAgICAgIC5nZXQoSElHSExJR0hUKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0oKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuZ2V0KEhJR0hMSUdIVF9SRVFVRVNUKS5uZXh0KHRydWUpO1xuICAgICAgICB9KSwgT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuZ2V0KEhJR0hMSUdIVF9SRVFVRVNUKS5uZXh0KHRydWUpO1xuICAgICAgICAgICAgaWYgKGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0pIHtcbiAgICAgICAgICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLCBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLmNsZWFyKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXR1cEVkaXRvcihlZGl0b3IsIGRpc3Bvc2FibGUpIHtcbiAgICAgICAgaWYgKGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdIHx8ICFlZGl0b3IuZ2V0R3JhbW1hcilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgaXNzdWVSZXF1ZXN0ID0gZWRpdG9yLm9tbmlzaGFycC5nZXQoSElHSExJR0hUX1JFUVVFU1QpO1xuICAgICAgICBhdWdtZW50RWRpdG9yKGVkaXRvciwgdGhpcy51bnVzZWRDb2RlUm93cywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuZWRpdG9ycy5wdXNoKGVkaXRvcik7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkubGluZXNUb0ZldGNoID0gW107XG4gICAgICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5yZXNwb25zZXMpXG4gICAgICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5yZXNwb25zZXMuY2xlYXIoKTtcbiAgICAgICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzKCk7XG4gICAgICAgICAgICBkZWxldGUgZWRpdG9yW1wiX29sZEdyYW1tYXJcIl07XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgICAgIHB1bGwodGhpcy5lZGl0b3JzLCBlZGl0b3IpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbW5pc2hhcnAucHJvamVjdFxuICAgICAgICAgICAgLm9ic2VydmUuYWN0aXZlRnJhbWV3b3JrXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkubGluZXNUb0ZldGNoID0gW107XG4gICAgICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5yZXNwb25zZXMpXG4gICAgICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5yZXNwb25zZXMuY2xlYXIoKTtcbiAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZygoKSA9PiBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRTYXZlKCgpID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkubGluZXNUb0ZldGNoID0gW107XG4gICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uXG4gICAgICAgICAgICAud2hlbkNvbm5lY3RlZCgpXG4gICAgICAgICAgICAuZGVsYXkoMTAwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBhdWdtZW50RWRpdG9yKGVkaXRvciwgdW51c2VkQ29kZVJvd3MgPSBudWxsLCBkb1NldEdyYW1tYXIgPSBmYWxzZSkge1xuICAgIGlmICghZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0pXG4gICAgICAgIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICBpZiAoIWVkaXRvcltcIl9zZXRHcmFtbWFyXCJdKVxuICAgICAgICBlZGl0b3JbXCJfc2V0R3JhbW1hclwiXSA9IGVkaXRvci5zZXRHcmFtbWFyO1xuICAgIGlmICghZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXSlcbiAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXSA9IGVkaXRvci50b2tlbml6ZWRCdWZmZXIuYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQ7XG4gICAgaWYgKCFlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXSlcbiAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLm1hcmtUb2tlbml6YXRpb25Db21wbGV0ZTtcbiAgICBpZiAoIWVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdKVxuICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX3JldG9rZW5pemVMaW5lc1wiXSA9IGVkaXRvci50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzO1xuICAgIGlmICghZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl90b2tlbml6ZUluQmFja2dyb3VuZFwiXSlcbiAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl90b2tlbml6ZUluQmFja2dyb3VuZFwiXSA9IGVkaXRvci50b2tlbml6ZWRCdWZmZXIudG9rZW5pemVJbkJhY2tncm91bmQ7XG4gICAgaWYgKCFlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX2NodW5rU2l6ZVwiXSlcbiAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcImNodW5rU2l6ZVwiXSA9IDIwO1xuICAgIGVkaXRvci5zZXRHcmFtbWFyID0gc2V0R3JhbW1hcjtcbiAgICBpZiAoZG9TZXRHcmFtbWFyKVxuICAgICAgICBlZGl0b3Iuc2V0R3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKTtcbiAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0ID0gZnVuY3Rpb24gKHJvdykge1xuICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpW1wiX19yb3dfX1wiXSA9IHJvdztcbiAgICAgICAgcmV0dXJuIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIGlmICghZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5zaWxlbnRSZXRva2VuaXplTGluZXMpIHtcbiAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5zaWxlbnRSZXRva2VuaXplTGluZXMgPSBkZWJvdW5jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcpXG4gICAgICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dChmYWxzZSk7XG4gICAgICAgICAgICBsZXQgbGFzdFJvdztcbiAgICAgICAgICAgIGxhc3RSb3cgPSB0aGlzLmJ1ZmZlci5nZXRMYXN0Um93KCk7XG4gICAgICAgICAgICB0aGlzLnRva2VuaXplZExpbmVzID0gdGhpcy5idWlsZFBsYWNlaG9sZGVyVG9rZW5pemVkTGluZXNGb3JSb3dzKDAsIGxhc3RSb3cpO1xuICAgICAgICAgICAgdGhpcy5pbnZhbGlkUm93cyA9IFtdO1xuICAgICAgICAgICAgaWYgKHRoaXMubGluZXNUb1Rva2VuaXplICYmIHRoaXMubGluZXNUb1Rva2VuaXplLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZVJvdyhtaW4odGhpcy5saW5lc1RvVG9rZW5pemUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZVJvdygwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZnVsbHlUb2tlbml6ZWQgPSBmYWxzZTtcbiAgICAgICAgfSwgREVCT1VOQ0VfVElNRSwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KTtcbiAgICB9XG4gICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcbiAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XG4gICAgICAgIHJldHVybiBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5yZXRva2VuaXplTGluZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcbiAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xuICAgICAgICByZXR1cm4gZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIudG9rZW5pemVJbkJhY2tncm91bmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy52aXNpYmxlIHx8IHRoaXMucGVuZGluZ0NodW5rIHx8ICF0aGlzLmlzQWxpdmUoKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5wZW5kaW5nQ2h1bmsgPSB0cnVlO1xuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBlbmRpbmdDaHVuayA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNBbGl2ZSgpICYmIHRoaXMuYnVmZmVyLmlzQWxpdmUoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudG9rZW5pemVOZXh0Q2h1bmsoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnNjb3Blc0Zyb21UYWdzID0gZnVuY3Rpb24gKHN0YXJ0aW5nU2NvcGVzLCB0YWdzKSB7XG4gICAgICAgIGNvbnN0IHNjb3BlcyA9IHN0YXJ0aW5nU2NvcGVzLnNsaWNlKCk7XG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGFncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdGFnID0gdGFnc1tpXTtcbiAgICAgICAgICAgIGlmICh0YWcgPCAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCh0YWcgJSAyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2godGFnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoaW5nU3RhcnRUYWcgPSB0YWcgKyAxO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3Blcy5wb3AoKSA9PT0gbWF0Y2hpbmdTdGFydFRhZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3Blcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZXMucHVzaChncmFtbWFyLnN0YXJ0SWRGb3JTY29wZShgLiR7Z3JhbW1hci5zY29wZU5hbWV9YCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIkVuY291bnRlcmVkIGFuIHVubWF0Y2hlZCBzY29wZSBlbmQgdGFnLlwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBlZGl0b3IuYnVmZmVyLmdldFBhdGgoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbW1hclNjb3BlTmFtZTogZ3JhbW1hci5zY29wZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5tYXRjaGVkRW5kVGFnOiBncmFtbWFyLnNjb3BlRm9ySWQodGFnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuc2V0UmVzcG9uc2VzKFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodW51c2VkQ29kZVJvd3MgJiYgaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW51c2VkQ29kZVJvd3MuZ2V0KGVkaXRvci5nZXRQYXRoKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShyb3dzID0+IGVkaXRvci5nZXRHcmFtbWFyKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRSZXNwb25zZXMoZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKGVkaXRvci5nZXRQYXRoKCksIHJvd3MsIFtdKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2NvcGVzO1xuICAgIH07XG59XG5jbGFzcyBHcmFtbWFyIHtcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3IsIGJhc2UsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fZ2lkID0gdW5pcXVlSWQoXCJvZ1wiKTtcbiAgICAgICAgdGhpcy5pc09ic2VydmVSZXRva2VuaXppbmcgPSBuZXcgUmVwbGF5U3ViamVjdCgxKTtcbiAgICAgICAgdGhpcy5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dCh0cnVlKTtcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgIHRoaXMucmVzcG9uc2VzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZSA9IFtdO1xuICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHt9O1xuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMucmVhZG9ubHkpIHtcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5wcmVlbXB0RGlkQ2hhbmdlKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBvbGRSYW5nZSwgbmV3UmFuZ2UgfSA9IGU7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0ID0gb2xkUmFuZ2Uuc3RhcnQucm93LCBkZWx0YSA9IG5ld1JhbmdlLmVuZC5yb3cgLSBvbGRSYW5nZS5lbmQucm93O1xuICAgICAgICAgICAgICAgIHN0YXJ0ID0gc3RhcnQgLSA1O1xuICAgICAgICAgICAgICAgIGlmIChzdGFydCA8IDApXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0ID0gMDtcbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSBlZGl0b3IuYnVmZmVyLmdldExpbmVDb3VudCgpIC0gMTtcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9IHJhbmdlKHN0YXJ0LCBlbmQgKyAxKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmtleXMoKS5uZXh0KCkuZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9GZXRjaC5wdXNoKC4uLmxpbmVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUxpbmUgPSB0aGlzLnJlc3BvbnNlcy5nZXQobGluZXNbMF0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRGcm9tID0gb2xkUmFuZ2Uuc3RhcnQuY29sdW1uLCBuZXdGcm9tID0gbmV3UmFuZ2Uuc3RhcnQuY29sdW1uO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlKHJlc3BvbnNlTGluZSwgKHNwYW4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydExpbmUgPCBsaW5lc1swXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gb2xkRnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBvbGRGcm9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydENvbHVtbiA+PSBuZXdGcm9tIHx8IHNwYW4uRW5kQ29sdW1uID49IG5ld0Zyb20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlYWNoKGxpbmVzLCBsaW5lID0+IHsgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGxpbmUpOyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGRlbHRhID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGNvdW50IC0gMTsgaSA+IGVuZDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGkgKyBkZWx0YSwgdGhpcy5yZXNwb25zZXMuZ2V0KGkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5kZWxldGUoaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZGVsdGEgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gZWRpdG9yLmdldExpbmVDb3VudCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNEZWx0YSA9IE1hdGguYWJzKGRlbHRhKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGVuZDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlc3BvbnNlcy5oYXMoaSArIGFic0RlbHRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpLCB0aGlzLnJlc3BvbnNlcy5nZXQoaSArIGFic0RlbHRhKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGkgKyBhYnNEZWx0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRSZXNwb25zZXModmFsdWUsIGVuYWJsZUV4Y2x1ZGVDb2RlKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBjaGFpbih2YWx1ZSk7XG4gICAgICAgIGNvbnN0IGdyb3VwZWRJdGVtcyA9IHJlc3VsdHMubWFwKGhpZ2hsaWdodCA9PiByYW5nZShoaWdobGlnaHQuU3RhcnRMaW5lLCBoaWdobGlnaHQuRW5kTGluZSArIDEpXG4gICAgICAgICAgICAubWFwKGxpbmUgPT4gKHsgbGluZSwgaGlnaGxpZ2h0IH0pKSlcbiAgICAgICAgICAgIC5mbGF0dGVuKClcbiAgICAgICAgICAgIC5ncm91cEJ5KHogPT4gei5saW5lKVxuICAgICAgICAgICAgLnZhbHVlKCk7XG4gICAgICAgIGVhY2goZ3JvdXBlZEl0ZW1zLCAoaXRlbSwga2V5KSA9PiB7XG4gICAgICAgICAgICBsZXQgayA9ICtrZXksIG1hcHBlZEl0ZW0gPSBpdGVtLm1hcCh4ID0+IHguaGlnaGxpZ2h0KTtcbiAgICAgICAgICAgIGlmICghZW5hYmxlRXhjbHVkZUNvZGUgfHwgc29tZShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSAmJiBldmVyeShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIgfHwgaS5LaW5kID09PSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCIpKSB7XG4gICAgICAgICAgICAgICAgbWFwcGVkSXRlbSA9IG1hcHBlZEl0ZW0uZmlsdGVyKHogPT4gei5LaW5kICE9PSBcImV4Y2x1ZGVkIGNvZGVcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmhhcyhrKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChrLCBtYXBwZWRJdGVtKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGspO1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZUxpbmUubGVuZ3RoICE9PSBtYXBwZWRJdGVtLmxlbmd0aCB8fCBzb21lKHJlc3BvbnNlTGluZSwgKGwsIGkpID0+ICFpc0VxdWFsKGwsIG1hcHBlZEl0ZW1baV0pKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplLnB1c2goayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHRlbmQoR3JhbW1hci5wcm90b3R5cGUsIEF0b21HcmFtbWFyLnByb3RvdHlwZSk7XG5HcmFtbWFyLnByb3RvdHlwZVtcIm9tbmlzaGFycFwiXSA9IHRydWU7XG5HcmFtbWFyLnByb3RvdHlwZVtcInRva2VuaXplTGluZVwiXSA9IGZ1bmN0aW9uIChsaW5lLCBydWxlU3RhY2ssIGZpcnN0TGluZSA9IGZhbHNlKSB7XG4gICAgY29uc3QgYmFzZVJlc3VsdCA9IEF0b21HcmFtbWFyLnByb3RvdHlwZS50b2tlbml6ZUxpbmUuY2FsbCh0aGlzLCBsaW5lLCBydWxlU3RhY2ssIGZpcnN0TGluZSk7XG4gICAgbGV0IHRhZ3M7XG4gICAgaWYgKHRoaXMucmVzcG9uc2VzKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHRoaXNbXCJfX3Jvd19fXCJdO1xuICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmhhcyhyb3cpKVxuICAgICAgICAgICAgcmV0dXJuIGJhc2VSZXN1bHQ7XG4gICAgICAgIGNvbnN0IGhpZ2hsaWdodHMgPSB0aGlzLnJlc3BvbnNlcy5nZXQocm93KTtcbiAgICAgICAgaWYgKGhpZ2hsaWdodHNbMF0gJiYgaGlnaGxpZ2h0c1swXS5LaW5kID09PSBcImV4Y2x1ZGVkIGNvZGVcIikge1xuICAgICAgICAgICAgdGFncyA9IFtsaW5lLmxlbmd0aF07XG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodHNbMF0sIDAsIHRhZ3MubGVuZ3RoIC0gMSwgbGluZSk7XG4gICAgICAgICAgICBiYXNlUmVzdWx0LnJ1bGVTdGFjayA9IFtiYXNlUmVzdWx0LnJ1bGVTdGFja1swXV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0YWdzID0gdGhpcy5nZXRDc1Rva2Vuc0ZvckxpbmUoaGlnaGxpZ2h0cywgbGluZSwgcm93LCBydWxlU3RhY2ssIGZpcnN0TGluZSwgYmFzZVJlc3VsdC50YWdzKTtcbiAgICAgICAgfVxuICAgICAgICBiYXNlUmVzdWx0LnRhZ3MgPSB0YWdzO1xuICAgIH1cbiAgICByZXR1cm4gYmFzZVJlc3VsdDtcbn07XG5HcmFtbWFyLnByb3RvdHlwZS5nZXRDc1Rva2Vuc0ZvckxpbmUgPSBmdW5jdGlvbiAoaGlnaGxpZ2h0cywgbGluZSwgcm93LCBydWxlU3RhY2ssIGZpcnN0TGluZSwgdGFncykge1xuICAgIHJ1bGVTdGFjayA9IFt7IHJ1bGU6IHRoaXMuZ2V0SW5pdGlhbFJ1bGUoKSB9XTtcbiAgICBlYWNoKGhpZ2hsaWdodHMsIChoaWdobGlnaHQpID0+IHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBoaWdobGlnaHQuU3RhcnRDb2x1bW4gLSAxO1xuICAgICAgICBjb25zdCBlbmQgPSBoaWdobGlnaHQuRW5kQ29sdW1uIC0gMTtcbiAgICAgICAgaWYgKGhpZ2hsaWdodC5FbmRMaW5lID4gaGlnaGxpZ2h0LlN0YXJ0TGluZSAmJiBoaWdobGlnaHQuU3RhcnRDb2x1bW4gPT09IDAgJiYgaGlnaGxpZ2h0LkVuZENvbHVtbiA9PT0gMCkge1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIDAsIHRhZ3MubGVuZ3RoIC0gMSwgbGluZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRpc3RhbmNlID0gLTE7XG4gICAgICAgIGxldCBpbmRleCA9IC0xO1xuICAgICAgICBsZXQgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xuICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSArIHRhZ3NbaV0gPiBzdGFydCkge1xuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkaXN0YW5jZSArPSB0YWdzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0ciA9IGxpbmUuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpO1xuICAgICAgICBjb25zdCBzaXplID0gZW5kIC0gc3RhcnQ7XG4gICAgICAgIGlmICh0YWdzW2luZGV4XSA+PSBzaXplKSB7XG4gICAgICAgICAgICBsZXQgdmFsdWVzO1xuICAgICAgICAgICAgbGV0IHByZXYsIG5leHQ7XG4gICAgICAgICAgICBpZiAoZGlzdGFuY2UgPT09IHN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzID0gW3NpemUsIHRhZ3NbaW5kZXhdIC0gc2l6ZV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmV2ID0gc3RhcnQgLSBkaXN0YW5jZTtcbiAgICAgICAgICAgICAgICBuZXh0ID0gdGFnc1tpbmRleF0gLSBzaXplIC0gcHJldjtcbiAgICAgICAgICAgICAgICBpZiAobmV4dCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gW3ByZXYsIHNpemUsIHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXZdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gW3ByZXYsIHNpemVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhZ3Muc3BsaWNlKGluZGV4LCAxLCAuLi52YWx1ZXMpO1xuICAgICAgICAgICAgaWYgKHByZXYpXG4gICAgICAgICAgICAgICAgaW5kZXggPSBpbmRleCArIDE7XG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgaW5kZXgsIGluZGV4ICsgMSwgc3RyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0YWdzW2luZGV4XSA8IHNpemUpIHtcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgbGV0IGJhY2t0cmFja0Rpc3RhbmNlID0gMDtcbiAgICAgICAgICAgIGZvciAoaSA9IGJhY2t0cmFja0luZGV4OyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYmFja3RyYWNrRGlzdGFuY2UgPj0gc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrRGlzdGFuY2UgKz0gdGFnc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaSArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBmb3J3YXJkdHJhY2tJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgbGV0IHJlbWFpbmluZ1NpemUgPSBzaXplO1xuICAgICAgICAgICAgZm9yIChpID0gaW5kZXggKyAxOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICgocmVtYWluaW5nU2l6ZSA8PSAwICYmIHRhZ3NbaV0gPiAwKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IGkgLSAxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NpemUgLT0gdGFnc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG9wZW5Gb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBoID0gaTsgaCA+PSAwOyBoLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWdzW2hdID09PSB0YWdzW2ldICsgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5Gb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvcGVuRm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gaSAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpID09PSB0YWdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gdGFncy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGJhY2t0cmFja0luZGV4LCBmb3J3YXJkdHJhY2tJbmRleCwgc3RyKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB0YWdzO1xufTtcbmNvbnN0IGdldElkRm9yU2NvcGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IGlkcyA9IHt9O1xuICAgIGNvbnN0IGdyYW1tYXJzID0ge307XG4gICAgZnVuY3Rpb24gYnVpbGRTY29wZXNGb3JHcmFtbWFyKGdyYW1tYXJOYW1lKSB7XG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSBmaW5kKGF0b20uZ3JhbW1hcnMuZ2V0R3JhbW1hcnMoKSwgZ2FtbXIgPT4gZ2FtbXIubmFtZSA9PT0gZ3JhbW1hck5hbWUpO1xuICAgICAgICBpZiAoIWdyYW1tYXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlkc1tncmFtbWFyLm5hbWVdID0ge307XG4gICAgICAgIGdyYW1tYXJzW2dyYW1tYXIubmFtZV0gPSBncmFtbWFyO1xuICAgICAgICBlYWNoKGdyYW1tYXIucmVnaXN0cnkuc2NvcGVzQnlJZCwgKHZhbHVlLCBrZXkpID0+IHsgaWRzW2dyYW1tYXIubmFtZV1bdmFsdWVdID0gK2tleTsgfSk7XG4gICAgfVxuICAgIGNvbnN0IG1ldGhvZCA9IChncmFtbWFyLCBzY29wZSkgPT4ge1xuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXSkge1xuICAgICAgICAgICAgYnVpbGRTY29wZXNGb3JHcmFtbWFyKGdyYW1tYXIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaWRzW2dyYW1tYXJdW3Njb3BlXSlcbiAgICAgICAgICAgIGlkc1tncmFtbWFyXVtzY29wZV0gPSBncmFtbWFyc1tncmFtbWFyXS5yZWdpc3RyeS5zdGFydElkRm9yU2NvcGUoc2NvcGUpO1xuICAgICAgICByZXR1cm4gK2lkc1tncmFtbWFyXVtzY29wZV07XG4gICAgfTtcbiAgICBtZXRob2QuZW5kID0gKHNjb3BlKSA9PiArc2NvcGUgLSAxO1xuICAgIHJldHVybiBtZXRob2Q7XG59KSgpO1xuZnVuY3Rpb24gZ2V0QXRvbVN0eWxlRm9yVG9rZW4oZ3JhbW1hciwgdGFncywgdG9rZW4sIGluZGV4LCBpbmRleEVuZCwgc3RyKSB7XG4gICAgY29uc3QgcHJldmlvdXNTY29wZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gaW5kZXggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBpZiAodGFnc1tpXSA+IDApXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgcHJldmlvdXNTY29wZXMucHVzaCh0YWdzW2ldKTtcbiAgICB9XG4gICAgY29uc3QgcmVwbGFjZW1lbnRzID0gW107XG4gICAgY29uc3Qgb3BlbnMgPSBbXTtcbiAgICBjb25zdCBjbG9zZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gaW5kZXg7IGkgPCBpbmRleEVuZDsgaSsrKSB7XG4gICAgICAgIGlmICh0YWdzW2ldID4gMClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG9wZW5JbmRleCA9IGZpbmRJbmRleChvcGVucywgeCA9PiB4LnRhZyA9PT0gKHRhZ3NbaV0gKyAxKSk7XG4gICAgICAgICAgICBpZiAob3BlbkluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvcGVucy5zcGxpY2Uob3BlbkluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsb3Nlcy5wdXNoKHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG9wZW5zLnVuc2hpZnQoeyB0YWc6IHRhZ3NbaV0sIGluZGV4OiBpIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxldCB1bmZ1bGxmaWxsZWQgPSBbXTtcbiAgICBpZiAoY2xvc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdW5mdWxsZmlsbGVkID0gc29ydEJ5KG9wZW5zLmNvbmNhdChjbG9zZXMpLCB4ID0+IHguaW5kZXgpO1xuICAgIH1cbiAgICBlbHNlIGlmIChvcGVucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcbiAgICAgICAgICAgIHN0YXJ0OiBvcGVuc1tvcGVucy5sZW5ndGggLSAxXS5pbmRleCxcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShvcGVuc1tvcGVucy5sZW5ndGggLSAxXS5pbmRleCwgaW5kZXhFbmQgKyAxKVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGV0IGludGVybmFsSW5kZXggPSBpbmRleDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVuZnVsbGZpbGxlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCB2ID0gdW5mdWxsZmlsbGVkW2ldO1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogaW50ZXJuYWxJbmRleCxcbiAgICAgICAgICAgIGVuZDogdi5pbmRleCxcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGludGVybmFsSW5kZXgsIHYuaW5kZXgpXG4gICAgICAgIH0pO1xuICAgICAgICBpbnRlcm5hbEluZGV4ID0gdi5pbmRleCArIDE7XG4gICAgfVxuICAgIGlmIChyZXBsYWNlbWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcbiAgICAgICAgICAgIHN0YXJ0OiBpbmRleCxcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbmRleCwgaW5kZXhFbmQpXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkKHNjb3BlKSB7XG4gICAgICAgIGNvbnN0IGlkID0gZ2V0SWRGb3JTY29wZShncmFtbWFyLCBzY29wZSk7XG4gICAgICAgIGlmIChpZCA9PT0gLTEpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICghc29tZShwcmV2aW91c1Njb3BlcywgeiA9PiB6ID09PSBpZCkpIHtcbiAgICAgICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2goaWQpO1xuICAgICAgICB9XG4gICAgICAgIGVhY2gocmVwbGFjZW1lbnRzLCBjdHggPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSBjdHgucmVwbGFjZW1lbnQ7XG4gICAgICAgICAgICByZXBsYWNlbWVudC51bnNoaWZ0KGlkKTtcbiAgICAgICAgICAgIHJlcGxhY2VtZW50LnB1c2goZ2V0SWRGb3JTY29wZS5lbmQoaWQpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHN3aXRjaCAodG9rZW4uS2luZCkge1xuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgICAgICBhZGQoYGNvbnN0YW50Lm51bWVyaWNgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwic3RydWN0IG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuc3RydWN0YCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImVudW0gbmFtZVwiOlxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNvbnN0YW50Lm51bWVyaWMuaWRlbnRpZmllci5lbnVtYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImlkZW50aWZpZXJcIjpcbiAgICAgICAgICAgIGFkZChgaWRlbnRpZmllcmApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJjbGFzcyBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImRlbGVnYXRlIG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXIuZGVsZWdhdGVgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiaW50ZXJmYWNlIG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXIuaW50ZXJmYWNlYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCI6XG4gICAgICAgICAgICBhZGQoYGNvbnN0YW50Lm90aGVyLnN5bWJvbGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJleGNsdWRlZCBjb2RlXCI6XG4gICAgICAgICAgICBhZGQoYGNvbW1lbnQuYmxvY2tgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidW51c2VkIGNvZGVcIjpcbiAgICAgICAgICAgIGFkZChgdW51c2VkYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidW5oYW5kbGVkIEtpbmQgXCIgKyB0b2tlbi5LaW5kKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcbiAgICAgICAgY29uc3QgeyByZXBsYWNlbWVudCwgZW5kLCBzdGFydCB9ID0gY3R4O1xuICAgICAgICBpZiAocmVwbGFjZW1lbnQubGVuZ3RoID09PSAyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgbnVtID0gZW5kIC0gc3RhcnQ7XG4gICAgICAgIGlmIChudW0gPD0gMCkge1xuICAgICAgICAgICAgbnVtID0gMTtcbiAgICAgICAgfVxuICAgICAgICB0YWdzLnNwbGljZShzdGFydCwgbnVtLCAuLi5yZXBsYWNlbWVudCk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBzZXRHcmFtbWFyKGdyYW1tYXIpIHtcbiAgICBjb25zdCBnMiA9IGdldEVuaGFuY2VkR3JhbW1hcih0aGlzLCBncmFtbWFyKTtcbiAgICBpZiAoZzIgIT09IGdyYW1tYXIpXG4gICAgICAgIHRoaXMuX3NldEdyYW1tYXIoZzIpO1xuICAgIHJldHVybiBnMjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbmhhbmNlZEdyYW1tYXIoZWRpdG9yLCBncmFtbWFyLCBvcHRpb25zKSB7XG4gICAgaWYgKCFncmFtbWFyKVxuICAgICAgICBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICBpZiAoIWdyYW1tYXJbXCJvbW5pc2hhcnBcIl0gJiYgT21uaS5pc1ZhbGlkR3JhbW1hcihncmFtbWFyKSkge1xuICAgICAgICBjb25zdCBuZXdHcmFtbWFyID0gbmV3IEdyYW1tYXIoZWRpdG9yLCBncmFtbWFyLCBvcHRpb25zKTtcbiAgICAgICAgZWFjaChncmFtbWFyLCAoeCwgaSkgPT4ge1xuICAgICAgICAgICAgaWYgKGhhcyhncmFtbWFyLCBpKSkge1xuICAgICAgICAgICAgICAgIG5ld0dyYW1tYXJbaV0gPSB4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZ3JhbW1hciA9IG5ld0dyYW1tYXI7XG4gICAgfVxuICAgIHJldHVybiBncmFtbWFyO1xufVxuY2xhc3MgVW51c2VkTWFwIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fbWFwID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBnZXQoa2V5KSB7XG4gICAgICAgIGlmICghdGhpcy5fbWFwLmhhcyhrZXkpKVxuICAgICAgICAgICAgdGhpcy5fbWFwLnNldChrZXksIG5ldyBCZWhhdmlvclN1YmplY3QoW10pKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC5nZXQoa2V5KTtcbiAgICB9XG4gICAgX2dldE9ic2VydmVyKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXQoa2V5KTtcbiAgICB9XG4gICAgc2V0KGtleSwgdmFsdWUpIHtcbiAgICAgICAgY29uc3QgbyA9IHRoaXMuX2dldE9ic2VydmVyKGtleSk7XG4gICAgICAgIGlmICghaXNFcXVhbChvLmdldFZhbHVlKCksIHZhbHVlKSkge1xuICAgICAgICAgICAgby5uZXh0KHZhbHVlIHx8IFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgZGVsZXRlKGtleSkge1xuICAgICAgICBpZiAodGhpcy5fbWFwLmhhcyhrZXkpKVxuICAgICAgICAgICAgdGhpcy5fbWFwLmRlbGV0ZShrZXkpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5fbWFwLmNsZWFyKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGVuaGFuY2VkSGlnaGxpZ2h0aW5nMTkgPSBuZXcgSGlnaGxpZ2h0O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
