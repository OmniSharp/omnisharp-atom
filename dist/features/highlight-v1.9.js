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
                return (0, _lodash.has)(grammar, i) && (newGrammar[i] = x);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS50cyIsImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztRQTJLQTtRQTJnQkE7O0FDdHJCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FES0EsSUFBTSxjQUFjLFFBQWMsS0FBTSxNQUFOLENBQWEsWUFBYixHQUE0Qix5Q0FBNUIsQ0FBNUI7QUFFTixJQUFNLGdCQUFnQixHQUFoQjtBQUNOLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTFCO0FBRUosSUFBTSxZQUFZLFdBQVo7SUFDRixvQkFBb0IsbUJBQXBCO0FBRUosU0FBQSwyQkFBQSxDQUFxQyxJQUFyQyxFQUFtRCxVQUFuRCxFQUE0RixZQUE1RixFQUFrSDtBQUM5RyxXQUFPLG1CQUFNLFVBQU4sRUFDRixNQURFLENBQ0s7ZUFBSyxFQUFFLFFBQUYsS0FBZSxJQUFmO0tBQUwsQ0FETCxDQUVGLEdBRkUsQ0FFRTtlQUFNO0FBQ1AsdUJBQVcsRUFBRSxJQUFGO0FBQ1gseUJBQWEsRUFBRSxNQUFGO0FBQ2IscUJBQVMsRUFBRSxPQUFGO0FBQ1QsdUJBQVcsRUFBRSxTQUFGO0FBQ1gsa0JBQU0sYUFBTjtBQUNBLHNCQUFVLFlBQVY7O0tBTkMsQ0FGRixDQVVGLEtBVkUsRUFBUCxDQUQ4RztDQUFsSDtBQWVPLElBQU0sMERBQXlCLENBQ2xDLENBRGtDLEVBRWxDLENBRmtDLEVBR2xDLENBSGtDLEVBSWxDLENBSmtDLEVBS2xDLENBTGtDLENBQXpCOztJQVNiO0FBQUEseUJBQUE7OztBQUdZLGFBQUEsY0FBQSxHQUFpQixJQUFJLFNBQUosRUFBakIsQ0FIWjtBQTRIVyxhQUFBLFFBQUEsR0FBVyxLQUFYLENBNUhYO0FBNkhXLGFBQUEsS0FBQSxHQUFRLHVCQUFSLENBN0hYO0FBOEhXLGFBQUEsV0FBQSxHQUFjLDJHQUFkLENBOUhYO0FBK0hXLGFBQUEsT0FBQSxHQUFVLEtBQVYs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QUFBQSx5QkFBQTs7O0FBQ1ksYUFBQSxJQUFBLEdBQU8sSUFBSSxHQUFKLEVBQVAsQ0FEWjtLQUFBOzs7OzRCQUVlLEtBQVc7QUFDbEIsZ0JBQUksQ0FBQyxLQUFLLElBQUwsQ0FBVSxHQUFWLENBQWMsR0FBZCxDQUFELEVBQXFCLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxHQUFkLEVBQXdCLDBCQUFpRCxFQUFqRCxDQUF4QixFQUF6QjtBQUNBLG1CQUFPLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxHQUFkLENBQVAsQ0FGa0I7Ozs7cUNBS0QsS0FBVztBQUM1QixtQkFBbUcsS0FBSyxHQUFMLENBQVMsR0FBVCxDQUFuRyxDQUQ0Qjs7Ozs0QkFJckIsS0FBYSxPQUFtQztBQUN2RCxnQkFBTSxJQUFJLEtBQUssWUFBTCxDQUFrQixHQUFsQixDQUFKLENBRGlEO0FBRXZELGdCQUFJLENBQUMscUJBQVEsRUFBRSxRQUFGLEVBQVIsRUFBc0IsS0FBdEIsQ0FBRCxFQUErQjtBQUMvQixrQkFBRSxJQUFGLENBQU8sU0FBUyxFQUFULENBQVAsQ0FEK0I7YUFBbkM7QUFHQSxtQkFBTyxJQUFQLENBTHVEOzs7O2dDQVE3QyxLQUFXO0FBQ3JCLGdCQUFJLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxHQUFkLENBQUosRUFDSSxLQUFLLElBQUwsQ0FBVSxNQUFWLENBQWlCLEdBQWpCLEVBREo7Ozs7Z0NBSVE7QUFDUixpQkFBSyxJQUFMLENBQVUsS0FBVixHQURROzs7Ozs7O0FBS1QsSUFBTSwwREFBeUIsSUFBSSxTQUFKLEVBQXpCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge09tbmlzaGFycFRleHRFZGl0b3IsIGlzT21uaXNoYXJwVGV4dEVkaXRvcn0gZnJvbSBcIi4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcclxuaW1wb3J0IHtlYWNoLCBleHRlbmQsIGhhcywgc29tZSwgcmFuZ2UsIHJlbW92ZSwgcHVsbCwgZmluZCwgY2hhaW4sIHVuaXEsIGZpbmRJbmRleCwgZXZlcnksIGlzRXF1YWwsIG1pbiwgZGVib3VuY2UsIHNvcnRCeSwgdW5pcXVlSWQsIGZpbHRlcn0gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIFJlcGxheVN1YmplY3QsIEJlaGF2aW9yU3ViamVjdCwgU3Vic2NyaWJlcn0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge3JlZ2lzdGVyQ29udGV4dEl0ZW19IGZyb20gXCIuLi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuY29uc3QgQXRvbUdyYW1tYXIgPSByZXF1aXJlKCg8YW55PmF0b20pLmNvbmZpZy5yZXNvdXJjZVBhdGggKyBcIi9ub2RlX21vZHVsZXMvZmlyc3QtbWF0ZS9saWIvZ3JhbW1hci5qc1wiKTtcclxuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmNvbnN0IERFQk9VTkNFX1RJTUUgPSAyNDAvKjI0MCovO1xyXG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcclxuXHJcbmNvbnN0IEhJR0hMSUdIVCA9IFwiSElHSExJR0hUXCIsXHJcbiAgICBISUdITElHSFRfUkVRVUVTVCA9IFwiSElHSExJR0hUX1JFUVVFU1RcIjtcclxuXHJcbmZ1bmN0aW9uIGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhwYXRoOiBzdHJpbmcsIHF1aWNrRml4ZXM6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSwgcHJvamVjdE5hbWVzOiBzdHJpbmdbXSkge1xyXG4gICAgcmV0dXJuIGNoYWluKHF1aWNrRml4ZXMpXHJcbiAgICAgICAgLmZpbHRlcih4ID0+IHguRmlsZU5hbWUgPT09IHBhdGgpXHJcbiAgICAgICAgLm1hcCh4ID0+ICh7XHJcbiAgICAgICAgICAgIFN0YXJ0TGluZTogeC5MaW5lLFxyXG4gICAgICAgICAgICBTdGFydENvbHVtbjogeC5Db2x1bW4sXHJcbiAgICAgICAgICAgIEVuZExpbmU6IHguRW5kTGluZSxcclxuICAgICAgICAgICAgRW5kQ29sdW1uOiB4LkVuZENvbHVtbixcclxuICAgICAgICAgICAgS2luZDogXCJ1bnVzZWQgY29kZVwiLFxyXG4gICAgICAgICAgICBQcm9qZWN0czogcHJvamVjdE5hbWVzXHJcbiAgICAgICAgfSBhcyBNb2RlbHMuSGlnaGxpZ2h0U3BhbikpXHJcbiAgICAgICAgLnZhbHVlKCk7XHJcbn1cclxuXHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuZXhwb3J0IGNvbnN0IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMgPSBbXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uQ29tbWVudCxcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5TdHJpbmcsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uUHVuY3R1YXRpb24sXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uT3BlcmF0b3IsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uS2V5d29yZFxyXG5dO1xyXG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuXHJcbmNsYXNzIEhpZ2hsaWdodCBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgZWRpdG9yczogQXJyYXk8T21uaXNoYXJwVGV4dEVkaXRvcj47XHJcbiAgICBwcml2YXRlIHVudXNlZENvZGVSb3dzID0gbmV3IFVudXNlZE1hcCgpO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICBpZiAoIShPbW5pLmF0b21WZXJzaW9uLm1pbm9yICE9PSAxIHx8IE9tbmkuYXRvbVZlcnNpb24ubWlub3IgPiA4KSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5lZGl0b3JzID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIHJlZ2lzdGVyQ29udGV4dEl0ZW0oSElHSExJR0hUX1JFUVVFU1QsIChjb250ZXh0KSA9PiBuZXcgU3ViamVjdDxib29sZWFuPigpKSxcclxuICAgICAgICAgICAgcmVnaXN0ZXJDb250ZXh0SXRlbShISUdITElHSFQsIChjb250ZXh0LCBlZGl0b3IpID0+XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LmdldDxTdWJqZWN0PGJvb2xlYW4+PihISUdITElHSFRfUkVRVUVTVClcclxuICAgICAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKHRydWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDApXHJcbiAgICAgICAgICAgICAgICAgICAgLnN3aXRjaE1hcCgoKSA9PiBPYnNlcnZhYmxlLmRlZmVyKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvamVjdHMgPSBjb250ZXh0LnByb2plY3QuYWN0aXZlRnJhbWV3b3JrLk5hbWUgPT09IFwiYWxsXCIgPyBbXSA6IFtjb250ZXh0LnByb2plY3QuYWN0aXZlRnJhbWV3b3JrLk5hbWVdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxpbmVzVG9GZXRjaCA9IHVuaXE8bnVtYmVyPigoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2gpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWxpbmVzVG9GZXRjaCB8fCAhbGluZXNUb0ZldGNoLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzVG9GZXRjaCA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MuZ2V0KGVkaXRvci5nZXRQYXRoKCkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uaGlnaGxpZ2h0KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9qZWN0TmFtZXM6IHByb2plY3RzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExpbmVzOiBsaW5lc1RvRmV0Y2gsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRXhjbHVkZUNsYXNzaWZpY2F0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHF1aWNrZml4ZXMsIHJlc3BvbnNlKSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRzOiBnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMoZWRpdG9yLmdldFBhdGgoKSwgcXVpY2tmaXhlcywgcHJvamVjdHMpLmNvbmNhdChyZXNwb25zZSA/IHJlc3BvbnNlLkhpZ2hsaWdodHMgOiBbXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmRvKCh7aGlnaGxpZ2h0c30pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuc2V0UmVzcG9uc2VzKGhpZ2hsaWdodHMsIHByb2plY3RzLmxlbmd0aCA+IDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlZkNvdW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpKSxcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5tb2RlbC5kaWFnbm9zdGljc0J5RmlsZVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShjaGFuZ2VzID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBbZmlsZSwgZGlhZ25vc3RpY3NdIG9mIGNoYW5nZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5zZXQoZmlsZSwgZmlsdGVyKGRpYWdub3N0aWNzLCB4ID0+IHguTG9nTGV2ZWwgPT09IFwiSGlkZGVuXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgT21uaS5lYWNoRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldHVwRWRpdG9yKGVkaXRvciwgY2QpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub21uaXNoYXJwXHJcbiAgICAgICAgICAgICAgICAgICAgLmdldDxPYnNlcnZhYmxlPHsgZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yOyBoaWdobGlnaHRzOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdOyBwcm9qZWN0czogc3RyaW5nW10gfT4+KEhJR0hMSUdIVClcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKS5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKS5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0pIHtcclxuICAgICAgICAgICAgICAgICAgICAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5kaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0dXBFZGl0b3IoZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yLCBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgaWYgKGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdIHx8ICFlZGl0b3IuZ2V0R3JhbW1hcikgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBpc3N1ZVJlcXVlc3QgPSBlZGl0b3Iub21uaXNoYXJwLmdldDxTdWJqZWN0PGJvb2xlYW4+PihISUdITElHSFRfUkVRVUVTVCk7XHJcblxyXG4gICAgICAgIGF1Z21lbnRFZGl0b3IoZWRpdG9yLCB0aGlzLnVudXNlZENvZGVSb3dzLCB0cnVlKTtcclxuXHJcbiAgICAgICAgdGhpcy5lZGl0b3JzLnB1c2goZWRpdG9yKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmxpbmVzVG9GZXRjaCA9IFtdO1xyXG4gICAgICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkucmVzcG9uc2VzKSAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMuY2xlYXIoKTtcclxuICAgICAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci5yZXRva2VuaXplTGluZXMoKTtcclxuICAgICAgICAgICAgZGVsZXRlIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcclxuICAgICAgICAgICAgcHVsbCh0aGlzLmVkaXRvcnMsIGVkaXRvcik7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnByb2plY3RcclxuICAgICAgICAgICAgLm9ic2VydmUuYWN0aXZlRnJhbWV3b3JrXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoID0gW107XHJcbiAgICAgICAgICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkucmVzcG9uc2VzKSAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMuY2xlYXIoKTtcclxuICAgICAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZygoKSA9PiBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRTYXZlKCgpID0+IHtcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoID0gW107XHJcbiAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvblxyXG4gICAgICAgICAgICAud2hlbkNvbm5lY3RlZCgpXHJcbiAgICAgICAgICAgIC5kZWxheSgxMDAwKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHtcclxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiRW5oYW5jZWQgSGlnaGxpZ2h0aW5nXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkVuYWJsZXMgc2VydmVyIGJhc2VkIGhpZ2hsaWdodGluZywgd2hpY2ggaW5jbHVkZXMgc3VwcG9ydCBmb3Igc3RyaW5nIGludGVycG9sYXRpb24sIGNsYXNzIG5hbWVzIGFuZCBtb3JlLlwiO1xyXG4gICAgcHVibGljIGRlZmF1bHQgPSBmYWxzZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIHVudXNlZENvZGVSb3dzOiBVbnVzZWRNYXAgPSBudWxsLCBkb1NldEdyYW1tYXIgPSBmYWxzZSkge1xyXG4gICAgaWYgKCFlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSlcclxuICAgICAgICBlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XHJcbiAgICBpZiAoIWVkaXRvcltcIl9zZXRHcmFtbWFyXCJdKVxyXG4gICAgICAgIGVkaXRvcltcIl9zZXRHcmFtbWFyXCJdID0gZWRpdG9yLnNldEdyYW1tYXI7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXSA9IChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIuYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQ7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdKVxyXG4gICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdID0gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGU7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdKVxyXG4gICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdID0gKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlci5yZXRva2VuaXplTGluZXM7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfdG9rZW5pemVJbkJhY2tncm91bmRcIl0pXHJcbiAgICAgICAgKGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcltcIl90b2tlbml6ZUluQmFja2dyb3VuZFwiXSA9IChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIudG9rZW5pemVJbkJhY2tncm91bmQ7XHJcbiAgICBpZiAoIShlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfY2h1bmtTaXplXCJdKVxyXG4gICAgICAgIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJjaHVua1NpemVcIl0gPSAyMDtcclxuXHJcbiAgICBlZGl0b3Iuc2V0R3JhbW1hciA9IHNldEdyYW1tYXI7XHJcbiAgICBpZiAoZG9TZXRHcmFtbWFyKSBlZGl0b3Iuc2V0R3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKTtcclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dCA9IGZ1bmN0aW9uKHJvdzogbnVtYmVyKSB7XHJcbiAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSlbXCJfX3Jvd19fXCJdID0gcm93O1xyXG4gICAgICAgIHJldHVybiAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICghKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikuc2lsZW50UmV0b2tlbml6ZUxpbmVzKSB7XHJcbiAgICAgICAgKDxhbnk+KGVkaXRvciBhcyBhbnkpLnRva2VuaXplZEJ1ZmZlcikuc2lsZW50UmV0b2tlbml6ZUxpbmVzID0gZGVib3VuY2UoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcpXHJcbiAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dChmYWxzZSk7XHJcbiAgICAgICAgICAgIGxldCBsYXN0Um93OiBudW1iZXI7XHJcbiAgICAgICAgICAgIGxhc3RSb3cgPSB0aGlzLmJ1ZmZlci5nZXRMYXN0Um93KCk7XHJcbiAgICAgICAgICAgIHRoaXMudG9rZW5pemVkTGluZXMgPSB0aGlzLmJ1aWxkUGxhY2Vob2xkZXJUb2tlbml6ZWRMaW5lc0ZvclJvd3MoMCwgbGFzdFJvdyk7XHJcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZFJvd3MgPSBbXTtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGluZXNUb1Rva2VuaXplICYmIHRoaXMubGluZXNUb1Rva2VuaXplLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlUm93KG1pbih0aGlzLmxpbmVzVG9Ub2tlbml6ZSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlUm93KDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZnVsbHlUb2tlbml6ZWQgPSBmYWxzZTtcclxuICAgICAgICB9LCBERUJPVU5DRV9USU1FLCB7IGxlYWRpbmc6IHRydWUsIHRyYWlsaW5nOiB0cnVlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLm1hcmtUb2tlbml6YXRpb25Db21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcpXHJcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KHRydWUpO1xyXG4gICAgICAgIHJldHVybiAoZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5yZXRva2VuaXplTGluZXMgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxyXG4gICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dChmYWxzZSk7XHJcbiAgICAgICAgcmV0dXJuIChlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55PihlZGl0b3IgYXMgYW55KS50b2tlbml6ZWRCdWZmZXIpLnRva2VuaXplSW5CYWNrZ3JvdW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnZpc2libGUgfHwgdGhpcy5wZW5kaW5nQ2h1bmsgfHwgIXRoaXMuaXNBbGl2ZSgpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gdHJ1ZTtcclxuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQWxpdmUoKSAmJiB0aGlzLmJ1ZmZlci5pc0FsaXZlKCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudG9rZW5pemVOZXh0Q2h1bmsoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAoPGFueT4oZWRpdG9yIGFzIGFueSkudG9rZW5pemVkQnVmZmVyKS5zY29wZXNGcm9tVGFncyA9IGZ1bmN0aW9uKHN0YXJ0aW5nU2NvcGVzOiBudW1iZXJbXSwgdGFnczogbnVtYmVyW10pIHtcclxuICAgICAgICBjb25zdCBzY29wZXMgPSBzdGFydGluZ1Njb3Blcy5zbGljZSgpO1xyXG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGFncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCB0YWcgPSB0YWdzW2ldO1xyXG4gICAgICAgICAgICBpZiAodGFnIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCh0YWcgJSAyKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBzY29wZXMucHVzaCh0YWcpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGluZ1N0YXJ0VGFnID0gdGFnICsgMTtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGVzLnBvcCgpID09PSBtYXRjaGluZ1N0YXJ0VGFnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFjayB0byBlbnN1cmUgdGhhdCBhbGwgbGluZXMgYWx3YXlzIGdldCB0aGUgcHJvcGVyIHNvdXJjZSBsaW5lcy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3Blcy5wdXNoKDxhbnk+Z3JhbW1hci5zdGFydElkRm9yU2NvcGUoYC4ke2dyYW1tYXIuc2NvcGVOYW1lfWApKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIkVuY291bnRlcmVkIGFuIHVubWF0Y2hlZCBzY29wZSBlbmQgdGFnLlwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IGVkaXRvci5idWZmZXIuZ2V0UGF0aCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW1tYXJTY29wZU5hbWU6IGdyYW1tYXIuc2NvcGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bm1hdGNoZWRFbmRUYWc6IGdyYW1tYXIuc2NvcGVGb3JJZCh0YWcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnNldFJlc3BvbnNlcyhbXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodW51c2VkQ29kZVJvd3MgJiYgaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bnVzZWRDb2RlUm93cy5nZXQoZWRpdG9yLmdldFBhdGgoKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRha2UoMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShyb3dzID0+ICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0UmVzcG9uc2VzKGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCByb3dzLCBbXSkpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzY29wZXM7XHJcbiAgICB9O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUhpZ2hsaWdodGluZ0dyYW1tYXIgZXh0ZW5kcyBGaXJzdE1hdGUuR3JhbW1hciB7XHJcbiAgICBpc09ic2VydmVSZXRva2VuaXppbmc6IFN1YmplY3Q8Ym9vbGVhbj47XHJcbiAgICBsaW5lc1RvRmV0Y2g6IG51bWJlcltdO1xyXG4gICAgbGluZXNUb1Rva2VuaXplOiBudW1iZXJbXTtcclxuICAgIHJlc3BvbnNlczogTWFwPG51bWJlciwgTW9kZWxzLkhpZ2hsaWdodFNwYW5bXT47XHJcbiAgICBmdWxseVRva2VuaXplZDogYm9vbGVhbjtcclxuICAgIHNjb3BlTmFtZTogc3RyaW5nO1xyXG59XHJcblxyXG5jbGFzcyBHcmFtbWFyIHtcclxuICAgIHB1YmxpYyBpc09ic2VydmVSZXRva2VuaXppbmc6IFJlcGxheVN1YmplY3Q8Ym9vbGVhbj47XHJcbiAgICBwdWJsaWMgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3I7XHJcbiAgICBwdWJsaWMgbGluZXNUb0ZldGNoOiBhbnlbXTtcclxuICAgIHB1YmxpYyBsaW5lc1RvVG9rZW5pemU6IGFueVtdO1xyXG4gICAgcHVibGljIGFjdGl2ZUZyYW1ld29yazogYW55O1xyXG4gICAgcHVibGljIHJlc3BvbnNlczogTWFwPG51bWJlciwgTW9kZWxzLkhpZ2hsaWdodFNwYW5bXT47XHJcbiAgICBwdWJsaWMgX2dpZCA9IHVuaXF1ZUlkKFwib2dcIik7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGJhc2U6IEZpcnN0TWF0ZS5HcmFtbWFyLCBvcHRpb25zOiB7IHJlYWRvbmx5OiBib29sZWFuIH0pIHtcclxuICAgICAgICB0aGlzLmlzT2JzZXJ2ZVJldG9rZW5pemluZyA9IG5ldyBSZXBsYXlTdWJqZWN0PGJvb2xlYW4+KDEpO1xyXG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XHJcblxyXG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xyXG4gICAgICAgIHRoaXMucmVzcG9uc2VzID0gbmV3IE1hcDxudW1iZXIsIE1vZGVscy5IaWdobGlnaHRTcGFuW10+KCk7XHJcbiAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZSA9IFtdO1xyXG4gICAgICAgIHRoaXMuYWN0aXZlRnJhbWV3b3JrID0ge307XHJcblxyXG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAhb3B0aW9ucy5yZWFkb25seSkge1xyXG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkucHJlZW1wdERpZENoYW5nZSgoZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB7b2xkUmFuZ2UsIG5ld1JhbmdlfSA9IGU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnQ6IG51bWJlciA9IG9sZFJhbmdlLnN0YXJ0LnJvdyxcclxuICAgICAgICAgICAgICAgICAgICBkZWx0YTogbnVtYmVyID0gbmV3UmFuZ2UuZW5kLnJvdyAtIG9sZFJhbmdlLmVuZC5yb3c7XHJcblxyXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBzdGFydCAtIDU7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgZW5kID0gZWRpdG9yLmJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSByYW5nZShzdGFydCwgZW5kICsgMSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmtleXMoKS5uZXh0KCkuZG9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb0ZldGNoLnB1c2goLi4ubGluZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUxpbmUgPSB0aGlzLnJlc3BvbnNlcy5nZXQobGluZXNbMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZUxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkRnJvbSA9IG9sZFJhbmdlLnN0YXJ0LmNvbHVtbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zyb20gPSBuZXdSYW5nZS5zdGFydC5jb2x1bW47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmUocmVzcG9uc2VMaW5lLCAoc3BhbjogTW9kZWxzLkhpZ2hsaWdodFNwYW4pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0TGluZSA8IGxpbmVzWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydENvbHVtbiA+PSBvbGRGcm9tIHx8IHNwYW4uRW5kQ29sdW1uID49IG9sZEZyb20pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG5ld0Zyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gbmV3RnJvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGVhY2gobGluZXMsIGxpbmUgPT4geyB0aGlzLnJlc3BvbnNlcy5kZWxldGUobGluZSk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkZWx0YSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBOZXcgbGluZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gZWRpdG9yLmdldExpbmVDb3VudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBjb3VudCAtIDE7IGkgPiBlbmQ7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaSArIGRlbHRhLCB0aGlzLnJlc3BvbnNlcy5nZXQoaSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkZWx0YSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmVkIGxpbmVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNEZWx0YSA9IE1hdGguYWJzKGRlbHRhKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZW5kOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkgKyBhYnNEZWx0YSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpLCB0aGlzLnJlc3BvbnNlcy5nZXQoaSArIGFic0RlbHRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5kZWxldGUoaSArIGFic0RlbHRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRSZXNwb25zZXModmFsdWU6IE1vZGVscy5IaWdobGlnaHRTcGFuW10sIGVuYWJsZUV4Y2x1ZGVDb2RlOiBib29sZWFuKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGNoYWluKHZhbHVlKTtcclxuXHJcbiAgICAgICAgY29uc3QgZ3JvdXBlZEl0ZW1zID0gPGFueT5yZXN1bHRzLm1hcChoaWdobGlnaHQgPT4gcmFuZ2UoaGlnaGxpZ2h0LlN0YXJ0TGluZSwgaGlnaGxpZ2h0LkVuZExpbmUgKyAxKVxyXG4gICAgICAgICAgICAubWFwKGxpbmUgPT4gKHsgbGluZSwgaGlnaGxpZ2h0IH0pKSlcclxuICAgICAgICAgICAgLmZsYXR0ZW48eyBsaW5lOiBudW1iZXI7IGhpZ2hsaWdodDogTW9kZWxzLkhpZ2hsaWdodFNwYW4gfT4oKVxyXG4gICAgICAgICAgICAuZ3JvdXBCeSh6ID0+IHoubGluZSlcclxuICAgICAgICAgICAgLnZhbHVlKCk7XHJcblxyXG4gICAgICAgIGVhY2goZ3JvdXBlZEl0ZW1zLCAoaXRlbTogeyBoaWdobGlnaHQ6IE1vZGVscy5IaWdobGlnaHRTcGFuIH1bXSwga2V5OiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgbGV0IGsgPSAra2V5LCBtYXBwZWRJdGVtID0gaXRlbS5tYXAoeCA9PiB4LmhpZ2hsaWdodCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWVuYWJsZUV4Y2x1ZGVDb2RlIHx8IHNvbWUobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIikgJiYgZXZlcnkobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwiZXhjbHVkZWQgY29kZVwiIHx8IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSkge1xyXG4gICAgICAgICAgICAgICAgbWFwcGVkSXRlbSA9IG1hcHBlZEl0ZW0uZmlsdGVyKHogPT4gei5LaW5kICE9PSBcImV4Y2x1ZGVkIGNvZGVcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMuaGFzKGspKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGspO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZS5sZW5ndGggIT09IG1hcHBlZEl0ZW0ubGVuZ3RoIHx8IHNvbWUocmVzcG9uc2VMaW5lLCAobCwgaSkgPT4gIWlzRXF1YWwobCwgbWFwcGVkSXRlbVtpXSkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplLnB1c2goayk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbi8qIHRzbGludDpkaXNhYmxlOm1lbWJlci1hY2Nlc3MgKi9cclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5leHRlbmQoR3JhbW1hci5wcm90b3R5cGUsIEF0b21HcmFtbWFyLnByb3RvdHlwZSk7XHJcblxyXG5HcmFtbWFyLnByb3RvdHlwZVtcIm9tbmlzaGFycFwiXSA9IHRydWU7XHJcbkdyYW1tYXIucHJvdG90eXBlW1widG9rZW5pemVMaW5lXCJdID0gZnVuY3Rpb24obGluZTogc3RyaW5nLCBydWxlU3RhY2s6IGFueVtdLCBmaXJzdExpbmUgPSBmYWxzZSk6IHsgdGFnczogbnVtYmVyW107IHJ1bGVTdGFjazogYW55IH0ge1xyXG4gICAgY29uc3QgYmFzZVJlc3VsdCA9IEF0b21HcmFtbWFyLnByb3RvdHlwZS50b2tlbml6ZUxpbmUuY2FsbCh0aGlzLCBsaW5lLCBydWxlU3RhY2ssIGZpcnN0TGluZSk7XHJcbiAgICBsZXQgdGFnczogYW55W107XHJcblxyXG4gICAgaWYgKHRoaXMucmVzcG9uc2VzKSB7XHJcbiAgICAgICAgY29uc3Qgcm93ID0gdGhpc1tcIl9fcm93X19cIl07XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMuaGFzKHJvdykpIHJldHVybiBiYXNlUmVzdWx0O1xyXG5cclxuICAgICAgICBjb25zdCBoaWdobGlnaHRzID0gdGhpcy5yZXNwb25zZXMuZ2V0KHJvdyk7XHJcbiAgICAgICAgLy8gRXhjbHVkZWQgY29kZSBibG93cyBhd2F5IGFueSBvdGhlciBmb3JtYXR0aW5nLCBvdGhlcndpc2Ugd2UgZ2V0IGludG8gYSB2ZXJ5IHdlaXJkIHN0YXRlLlxyXG4gICAgICAgIGlmIChoaWdobGlnaHRzWzBdICYmIGhpZ2hsaWdodHNbMF0uS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIpIHtcclxuICAgICAgICAgICAgdGFncyA9IFtsaW5lLmxlbmd0aF07XHJcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0c1swXSwgMCwgdGFncy5sZW5ndGggLSAxLCBsaW5lKTtcclxuICAgICAgICAgICAgYmFzZVJlc3VsdC5ydWxlU3RhY2sgPSBbYmFzZVJlc3VsdC5ydWxlU3RhY2tbMF1dO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRhZ3MgPSB0aGlzLmdldENzVG9rZW5zRm9yTGluZShoaWdobGlnaHRzLCBsaW5lLCByb3csIHJ1bGVTdGFjaywgZmlyc3RMaW5lLCBiYXNlUmVzdWx0LnRhZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBiYXNlUmVzdWx0LnRhZ3MgPSB0YWdzO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJhc2VSZXN1bHQ7XHJcbn07XHJcblxyXG4oR3JhbW1hci5wcm90b3R5cGUgYXMgYW55KS5nZXRDc1Rva2Vuc0ZvckxpbmUgPSBmdW5jdGlvbihoaWdobGlnaHRzOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdLCBsaW5lOiBzdHJpbmcsIHJvdzogbnVtYmVyLCBydWxlU3RhY2s6IGFueVtdLCBmaXJzdExpbmU6IGJvb2xlYW4sIHRhZ3M6IG51bWJlcltdKSB7XHJcbiAgICBydWxlU3RhY2sgPSBbeyBydWxlOiB0aGlzLmdldEluaXRpYWxSdWxlKCkgfV07XHJcblxyXG4gICAgZWFjaChoaWdobGlnaHRzLCAoaGlnaGxpZ2h0KSA9PiB7XHJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBoaWdobGlnaHQuU3RhcnRDb2x1bW4gLSAxO1xyXG4gICAgICAgIGNvbnN0IGVuZCA9IGhpZ2hsaWdodC5FbmRDb2x1bW4gLSAxO1xyXG5cclxuICAgICAgICBpZiAoaGlnaGxpZ2h0LkVuZExpbmUgPiBoaWdobGlnaHQuU3RhcnRMaW5lICYmIGhpZ2hsaWdodC5TdGFydENvbHVtbiA9PT0gMCAmJiBoaWdobGlnaHQuRW5kQ29sdW1uID09PSAwKSB7XHJcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGlzdGFuY2UgPSAtMTtcclxuICAgICAgICBsZXQgaW5kZXggPSAtMTtcclxuICAgICAgICBsZXQgaTogbnVtYmVyO1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRpc3RhbmNlICsgdGFnc1tpXSA+IHN0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgKz0gdGFnc1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3RyID0gbGluZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCk7XHJcbiAgICAgICAgY29uc3Qgc2l6ZSA9IGVuZCAtIHN0YXJ0O1xyXG4gICAgICAgIGlmICh0YWdzW2luZGV4XSA+PSBzaXplKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZXM6IG51bWJlcltdO1xyXG4gICAgICAgICAgICBsZXQgcHJldjogbnVtYmVyLCBuZXh0OiBudW1iZXI7XHJcbiAgICAgICAgICAgIGlmIChkaXN0YW5jZSA9PT0gc3RhcnQpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtzaXplLCB0YWdzW2luZGV4XSAtIHNpemVdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcHJldiA9IHN0YXJ0IC0gZGlzdGFuY2U7XHJcbiAgICAgICAgICAgICAgICBuZXh0ID0gdGFnc1tpbmRleF0gLSBzaXplIC0gcHJldjtcclxuICAgICAgICAgICAgICAgIGlmIChuZXh0ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplLCB0YWdzW2luZGV4XSAtIHNpemUgLSBwcmV2XTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gW3ByZXYsIHNpemVdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRhZ3Muc3BsaWNlKGluZGV4LCAxLCAuLi52YWx1ZXMpO1xyXG4gICAgICAgICAgICBpZiAocHJldikgaW5kZXggPSBpbmRleCArIDE7XHJcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCBpbmRleCwgaW5kZXggKyAxLCBzdHIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGFnc1tpbmRleF0gPCBzaXplKSB7XHJcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tJbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrRGlzdGFuY2UgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSBiYWNrdHJhY2tJbmRleDsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrdHJhY2tEaXN0YW5jZSA+PSBzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0Rpc3RhbmNlICs9IHRhZ3NbaV07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSBpICsgMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGZvcndhcmR0cmFja0luZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgICAgIGxldCByZW1haW5pbmdTaXplID0gc2l6ZTtcclxuICAgICAgICAgICAgZm9yIChpID0gaW5kZXggKyAxOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKChyZW1haW5pbmdTaXplIDw9IDAgJiYgdGFnc1tpXSA+IDApLyogfHwgdGFnc1tpXSAlIDIgPT09IC0xKi8pIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IGkgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2l6ZSAtPSB0YWdzW2ldO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEhhbmRsZXMgY2FzZSB3aGVyZSB0aGVyZSBpcyBhIGNsb3NpbmcgdGFnXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYnV0IG5vIG9wZW5pbmcgdGFnIGhlcmUuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG9wZW5Gb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGggPSBpOyBoID49IDA7IGgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFnc1toXSA9PT0gdGFnc1tpXSArIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5Gb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW9wZW5Gb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IGkgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpID09PSB0YWdzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSB0YWdzLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCBiYWNrdHJhY2tJbmRleCwgZm9yd2FyZHRyYWNrSW5kZXgsIHN0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHRhZ3M7XHJcbn07XHJcblxyXG5jb25zdCBnZXRJZEZvclNjb3BlID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgaWRzOiB7IFtrZXk6IHN0cmluZ106IHsgW2tleTogc3RyaW5nXTogbnVtYmVyIH07IH0gPSB7fTtcclxuICAgIGNvbnN0IGdyYW1tYXJzOiBhbnkgPSB7fTtcclxuXHJcbiAgICBmdW5jdGlvbiBidWlsZFNjb3Blc0ZvckdyYW1tYXIoZ3JhbW1hck5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSBmaW5kKGF0b20uZ3JhbW1hcnMuZ2V0R3JhbW1hcnMoKSwgZ2FtbXIgPT4gZ2FtbXIubmFtZSA9PT0gZ3JhbW1hck5hbWUpO1xyXG4gICAgICAgIGlmICghZ3JhbW1hcikgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZHNbZ3JhbW1hci5uYW1lXSA9IHt9O1xyXG4gICAgICAgIGdyYW1tYXJzW2dyYW1tYXIubmFtZV0gPSBncmFtbWFyO1xyXG5cclxuICAgICAgICBlYWNoKGdyYW1tYXIucmVnaXN0cnkuc2NvcGVzQnlJZCwgKHZhbHVlOiBzdHJpbmcsIGtleTogYW55KSA9PiB7IGlkc1tncmFtbWFyLm5hbWVdW3ZhbHVlXSA9ICtrZXk7IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1ldGhvZCA9IChncmFtbWFyOiBzdHJpbmcsIHNjb3BlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXSkge1xyXG4gICAgICAgICAgICBidWlsZFNjb3Blc0ZvckdyYW1tYXIoZ3JhbW1hcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXVtzY29wZV0pXHJcbiAgICAgICAgICAgIGlkc1tncmFtbWFyXVtzY29wZV0gPSBncmFtbWFyc1tncmFtbWFyXS5yZWdpc3RyeS5zdGFydElkRm9yU2NvcGUoc2NvcGUpO1xyXG5cclxuICAgICAgICByZXR1cm4gK2lkc1tncmFtbWFyXVtzY29wZV07XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55Pm1ldGhvZCkuZW5kID0gKHNjb3BlOiBudW1iZXIpID0+ICtzY29wZSAtIDE7XHJcblxyXG4gICAgcmV0dXJuIDx7IChncmFtbWFyOiBzdHJpbmcsIHNjb3BlOiBzdHJpbmcpOiBudW1iZXI7IGVuZDogKHNjb3BlOiBudW1iZXIpID0+IG51bWJlcjsgfT5tZXRob2Q7XHJcbn0pKCk7XHJcblxyXG5cclxuLy8vIE5PVEU6IGJlc3Qgd2F5IEkgaGF2ZSBmb3VuZCBmb3IgdGhlc2UgaXMgdG8ganVzdCBsb29rIGF0IHRoZW1lIFwibGVzc1wiIGZpbGVzXHJcbi8vIEFsdGVybmF0aXZlbHkganVzdCBpbnNwZWN0IHRoZSB0b2tlbiBmb3IgYSAuanMgZmlsZVxyXG5mdW5jdGlvbiBnZXRBdG9tU3R5bGVGb3JUb2tlbihncmFtbWFyOiBzdHJpbmcsIHRhZ3M6IG51bWJlcltdLCB0b2tlbjogTW9kZWxzLkhpZ2hsaWdodFNwYW4sIGluZGV4OiBudW1iZXIsIGluZGV4RW5kOiBudW1iZXIsIHN0cjogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBwcmV2aW91c1Njb3BlczogYW55W10gPSBbXTtcclxuICAgIGZvciAobGV0IGkgPSBpbmRleCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKHRhZ3NbaV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlcGxhY2VtZW50czogeyBzdGFydDogbnVtYmVyOyBlbmQ6IG51bWJlcjsgcmVwbGFjZW1lbnQ6IG51bWJlcltdIH1bXSA9IFtdO1xyXG4gICAgY29uc3Qgb3BlbnM6IHsgdGFnOiBudW1iZXI7IGluZGV4OiBudW1iZXIgfVtdID0gW107XHJcbiAgICBjb25zdCBjbG9zZXM6IHR5cGVvZiBvcGVucyA9IFtdO1xyXG5cclxuICAgIC8vIFNjYW4gZm9yIGFueSB1bmNsb3NlZCBvciB1bm9wZW5lZCB0YWdzXHJcbiAgICBmb3IgKGxldCBpID0gaW5kZXg7IGkgPCBpbmRleEVuZDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSBjb250aW51ZTtcclxuICAgICAgICBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgY29uc3Qgb3BlbkluZGV4ID0gZmluZEluZGV4KG9wZW5zLCB4ID0+IHgudGFnID09PSAodGFnc1tpXSArIDEpKTtcclxuICAgICAgICAgICAgaWYgKG9wZW5JbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBvcGVucy5zcGxpY2Uob3BlbkluZGV4LCAxKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNsb3Nlcy5wdXNoKHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG9wZW5zLnVuc2hpZnQoeyB0YWc6IHRhZ3NbaV0sIGluZGV4OiBpIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBsZXQgdW5mdWxsZmlsbGVkOiB0eXBlb2Ygb3BlbnMgPSBbXTtcclxuICAgIGlmIChjbG9zZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHVuZnVsbGZpbGxlZCA9IHNvcnRCeShvcGVucy5jb25jYXQoY2xvc2VzKSwgeCA9PiB4LmluZGV4KTtcclxuICAgIH0gZWxzZSBpZiAob3BlbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIC8vIEdyYWIgdGhlIGxhc3Qga25vd24gb3BlbiwgYW5kIGFwcGVuZCBmcm9tIHRoZXJlXHJcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xyXG4gICAgICAgICAgICBzdGFydDogb3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKG9wZW5zW29wZW5zLmxlbmd0aCAtIDFdLmluZGV4LCBpbmRleEVuZCArIDEpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGludGVybmFsSW5kZXggPSBpbmRleDtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdW5mdWxsZmlsbGVkLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgdiA9IHVuZnVsbGZpbGxlZFtpXTtcclxuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBpbnRlcm5hbEluZGV4LFxyXG4gICAgICAgICAgICBlbmQ6IHYuaW5kZXgsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGludGVybmFsSW5kZXgsIHYuaW5kZXgpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaW50ZXJuYWxJbmRleCA9IHYuaW5kZXggKyAxO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXBsYWNlbWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xyXG4gICAgICAgICAgICBzdGFydDogaW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGluZGV4LCBpbmRleEVuZClcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLypyZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBpbnRlcm5hbEluZGV4LFxyXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxyXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbnRlcm5hbEluZGV4LCBpbmRleEVuZClcclxuICAgICAgICB9KTsqL1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFkZChzY29wZTogYW55KSB7XHJcbiAgICAgICAgY29uc3QgaWQgPSBnZXRJZEZvclNjb3BlKGdyYW1tYXIsIHNjb3BlKTtcclxuICAgICAgICBpZiAoaWQgPT09IC0xKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICghc29tZShwcmV2aW91c1Njb3BlcywgeiA9PiB6ID09PSBpZCkpIHtcclxuICAgICAgICAgICAgcHJldmlvdXNTY29wZXMucHVzaChpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVhY2gocmVwbGFjZW1lbnRzLCBjdHggPT4ge1xyXG4gICAgICAgICAgICBjb25zdCByZXBsYWNlbWVudCA9IGN0eC5yZXBsYWNlbWVudDtcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQudW5zaGlmdChpZCk7XHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50LnB1c2goZ2V0SWRGb3JTY29wZS5lbmQoaWQpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHN3aXRjaCAodG9rZW4uS2luZCkge1xyXG4gICAgICAgIGNhc2UgXCJudW1iZXJcIjpcclxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5udW1lcmljYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJzdHJ1Y3QgbmFtZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY29uc3RhbnQubnVtZXJpYy5pZGVudGlmaWVyLnN0cnVjdGApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiZW51bSBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuZW51bWApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiaWRlbnRpZmllclwiOlxyXG4gICAgICAgICAgICBhZGQoYGlkZW50aWZpZXJgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImNsYXNzIG5hbWVcIjpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllcmApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiZGVsZWdhdGUgbmFtZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmRlbGVnYXRlYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJpbnRlcmZhY2UgbmFtZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmludGVyZmFjZWApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIjpcclxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5vdGhlci5zeW1ib2xgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImV4Y2x1ZGVkIGNvZGVcIjpcclxuICAgICAgICAgICAgYWRkKGBjb21tZW50LmJsb2NrYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJ1bnVzZWQgY29kZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHVudXNlZGApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVuaGFuZGxlZCBLaW5kIFwiICsgdG9rZW4uS2luZCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICAgIGVhY2gocmVwbGFjZW1lbnRzLCBjdHggPT4ge1xyXG4gICAgICAgIGNvbnN0IHtyZXBsYWNlbWVudCwgZW5kLCBzdGFydH0gPSBjdHg7XHJcbiAgICAgICAgaWYgKHJlcGxhY2VtZW50Lmxlbmd0aCA9PT0gMikgcmV0dXJuO1xyXG4gICAgICAgIGxldCBudW0gPSBlbmQgLSBzdGFydDtcclxuICAgICAgICBpZiAobnVtIDw9IDApIHtcclxuICAgICAgICAgICAgbnVtID0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGFncy5zcGxpY2Uoc3RhcnQsIG51bSwgLi4ucmVwbGFjZW1lbnQpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldEdyYW1tYXIoZ3JhbW1hcjogRmlyc3RNYXRlLkdyYW1tYXIpOiBGaXJzdE1hdGUuR3JhbW1hciB7XHJcbiAgICBjb25zdCBnMiA9IGdldEVuaGFuY2VkR3JhbW1hcih0aGlzLCBncmFtbWFyKTtcclxuICAgIGlmIChnMiAhPT0gZ3JhbW1hcilcclxuICAgICAgICB0aGlzLl9zZXRHcmFtbWFyKGcyKTtcclxuICAgIHJldHVybiBnMjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEVuaGFuY2VkR3JhbW1hcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgZ3JhbW1hcj86IEZpcnN0TWF0ZS5HcmFtbWFyLCBvcHRpb25zPzogeyByZWFkb25seTogYm9vbGVhbiB9KSB7XHJcbiAgICBpZiAoIWdyYW1tYXIpIGdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xyXG4gICAgaWYgKCFncmFtbWFyW1wib21uaXNoYXJwXCJdICYmIE9tbmkuaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcikpIHtcclxuICAgICAgICBjb25zdCBuZXdHcmFtbWFyID0gbmV3IEdyYW1tYXIoZWRpdG9yLCBncmFtbWFyLCBvcHRpb25zKTtcclxuICAgICAgICBlYWNoKGdyYW1tYXIsICh4LCBpKSA9PiBoYXMoZ3JhbW1hciwgaSkgJiYgKG5ld0dyYW1tYXJbaV0gPSB4KSk7XHJcbiAgICAgICAgZ3JhbW1hciA9IDxhbnk+bmV3R3JhbW1hcjtcclxuICAgIH1cclxuICAgIHJldHVybiBncmFtbWFyO1xyXG59XHJcblxyXG4vLyBVc2VkIHRvIGNhY2hlIHZhbHVlcyBmb3Igc3BlY2lmaWMgZWRpdG9yc1xyXG5jbGFzcyBVbnVzZWRNYXAge1xyXG4gICAgcHJpdmF0ZSBfbWFwID0gbmV3IE1hcDxzdHJpbmcsIE9ic2VydmFibGU8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPj4oKTtcclxuICAgIHB1YmxpYyBnZXQoa2V5OiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX21hcC5oYXMoa2V5KSkgdGhpcy5fbWFwLnNldChrZXksIDxhbnk+bmV3IEJlaGF2aW9yU3ViamVjdDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KFtdKSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC5nZXQoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRPYnNlcnZlcihrZXk6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiA8U3Vic2NyaWJlcjxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+ICYgeyBnZXRWYWx1ZSgpOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10gfT48YW55PnRoaXMuZ2V0KGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldChrZXk6IHN0cmluZywgdmFsdWU/OiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10pIHtcclxuICAgICAgICBjb25zdCBvID0gdGhpcy5fZ2V0T2JzZXJ2ZXIoa2V5KTtcclxuICAgICAgICBpZiAoIWlzRXF1YWwoby5nZXRWYWx1ZSgpLCB2YWx1ZSkpIHtcclxuICAgICAgICAgICAgby5uZXh0KHZhbHVlIHx8IFtdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlbGV0ZShrZXk6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLl9tYXAuaGFzKGtleSkpXHJcbiAgICAgICAgICAgIHRoaXMuX21hcC5kZWxldGUoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fbWFwLmNsZWFyKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBlbmhhbmNlZEhpZ2hsaWdodGluZzE5ID0gbmV3IEhpZ2hsaWdodDtcclxuIiwiaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgaXNPbW5pc2hhcnBUZXh0RWRpdG9yIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcbmltcG9ydCB7IGVhY2gsIGV4dGVuZCwgaGFzLCBzb21lLCByYW5nZSwgcmVtb3ZlLCBwdWxsLCBmaW5kLCBjaGFpbiwgdW5pcSwgZmluZEluZGV4LCBldmVyeSwgaXNFcXVhbCwgbWluLCBkZWJvdW5jZSwgc29ydEJ5LCB1bmlxdWVJZCwgZmlsdGVyIH0gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCwgUmVwbGF5U3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJDb250ZXh0SXRlbSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XG5jb25zdCBBdG9tR3JhbW1hciA9IHJlcXVpcmUoYXRvbS5jb25maWcucmVzb3VyY2VQYXRoICsgXCIvbm9kZV9tb2R1bGVzL2ZpcnN0LW1hdGUvbGliL2dyYW1tYXIuanNcIik7XG5jb25zdCBERUJPVU5DRV9USU1FID0gMjQwO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmNvbnN0IEhJR0hMSUdIVCA9IFwiSElHSExJR0hUXCIsIEhJR0hMSUdIVF9SRVFVRVNUID0gXCJISUdITElHSFRfUkVRVUVTVFwiO1xuZnVuY3Rpb24gZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKHBhdGgsIHF1aWNrRml4ZXMsIHByb2plY3ROYW1lcykge1xuICAgIHJldHVybiBjaGFpbihxdWlja0ZpeGVzKVxuICAgICAgICAuZmlsdGVyKHggPT4geC5GaWxlTmFtZSA9PT0gcGF0aClcbiAgICAgICAgLm1hcCh4ID0+ICh7XG4gICAgICAgIFN0YXJ0TGluZTogeC5MaW5lLFxuICAgICAgICBTdGFydENvbHVtbjogeC5Db2x1bW4sXG4gICAgICAgIEVuZExpbmU6IHguRW5kTGluZSxcbiAgICAgICAgRW5kQ29sdW1uOiB4LkVuZENvbHVtbixcbiAgICAgICAgS2luZDogXCJ1bnVzZWQgY29kZVwiLFxuICAgICAgICBQcm9qZWN0czogcHJvamVjdE5hbWVzXG4gICAgfSkpXG4gICAgICAgIC52YWx1ZSgpO1xufVxuZXhwb3J0IGNvbnN0IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMgPSBbXG4gICAgMixcbiAgICAzLFxuICAgIDUsXG4gICAgNCxcbiAgICA2XG5dO1xuY2xhc3MgSGlnaGxpZ2h0IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cyA9IG5ldyBVbnVzZWRNYXAoKTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJFbmhhbmNlZCBIaWdobGlnaHRpbmdcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiRW5hYmxlcyBzZXJ2ZXIgYmFzZWQgaGlnaGxpZ2h0aW5nLCB3aGljaCBpbmNsdWRlcyBzdXBwb3J0IGZvciBzdHJpbmcgaW50ZXJwb2xhdGlvbiwgY2xhc3MgbmFtZXMgYW5kIG1vcmUuXCI7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IGZhbHNlO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgaWYgKCEoT21uaS5hdG9tVmVyc2lvbi5taW5vciAhPT0gMSB8fCBPbW5pLmF0b21WZXJzaW9uLm1pbm9yID4gOCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmVkaXRvcnMgPSBbXTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChyZWdpc3RlckNvbnRleHRJdGVtKEhJR0hMSUdIVF9SRVFVRVNULCAoY29udGV4dCkgPT4gbmV3IFN1YmplY3QoKSksIHJlZ2lzdGVyQ29udGV4dEl0ZW0oSElHSExJR0hULCAoY29udGV4dCwgZWRpdG9yKSA9PiBjb250ZXh0LmdldChISUdITElHSFRfUkVRVUVTVClcbiAgICAgICAgICAgIC5zdGFydFdpdGgodHJ1ZSlcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwKVxuICAgICAgICAgICAgLnN3aXRjaE1hcCgoKSA9PiBPYnNlcnZhYmxlLmRlZmVyKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3RzID0gY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lID09PSBcImFsbFwiID8gW10gOiBbY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lXTtcbiAgICAgICAgICAgIGxldCBsaW5lc1RvRmV0Y2ggPSB1bmlxKGVkaXRvci5nZXRHcmFtbWFyKCkubGluZXNUb0ZldGNoKTtcbiAgICAgICAgICAgIGlmICghbGluZXNUb0ZldGNoIHx8ICFsaW5lc1RvRmV0Y2gubGVuZ3RoKVxuICAgICAgICAgICAgICAgIGxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuY29tYmluZUxhdGVzdCh0aGlzLnVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKSwgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uaGlnaGxpZ2h0KHtcbiAgICAgICAgICAgICAgICBQcm9qZWN0TmFtZXM6IHByb2plY3RzLFxuICAgICAgICAgICAgICAgIExpbmVzOiBsaW5lc1RvRmV0Y2gsXG4gICAgICAgICAgICAgICAgRXhjbHVkZUNsYXNzaWZpY2F0aW9uc1xuICAgICAgICAgICAgfSkpLCAocXVpY2tmaXhlcywgcmVzcG9uc2UpID0+ICh7XG4gICAgICAgICAgICAgICAgZWRpdG9yLFxuICAgICAgICAgICAgICAgIHByb2plY3RzLFxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodHM6IGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCBxdWlja2ZpeGVzLCBwcm9qZWN0cykuY29uY2F0KHJlc3BvbnNlID8gcmVzcG9uc2UuSGlnaGxpZ2h0cyA6IFtdKVxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgLmRvKCh7IGhpZ2hsaWdodHMgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcikge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnNldFJlc3BvbnNlcyhoaWdobGlnaHRzLCBwcm9qZWN0cy5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXG4gICAgICAgICAgICAgICAgLnJlZkNvdW50KCk7XG4gICAgICAgIH0pKSksIE9tbmkubGlzdGVuZXIubW9kZWwuZGlhZ25vc3RpY3NCeUZpbGVcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY2hhbmdlcyA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBbZmlsZSwgZGlhZ25vc3RpY3NdIG9mIGNoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLnNldChmaWxlLCBmaWx0ZXIoZGlhZ25vc3RpY3MsIHggPT4geC5Mb2dMZXZlbCA9PT0gXCJIaWRkZW5cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSwgT21uaS5lYWNoRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldHVwRWRpdG9yKGVkaXRvciwgY2QpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbW5pc2hhcnBcbiAgICAgICAgICAgICAgICAuZ2V0KEhJR0hMSUdIVClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldChISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcbiAgICAgICAgfSksIE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldChISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcbiAgICAgICAgICAgIGlmIChlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSwgRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5jbGVhcigpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0dXBFZGl0b3IoZWRpdG9yLCBkaXNwb3NhYmxlKSB7XG4gICAgICAgIGlmIChlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSB8fCAhZWRpdG9yLmdldEdyYW1tYXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGlzc3VlUmVxdWVzdCA9IGVkaXRvci5vbW5pc2hhcnAuZ2V0KEhJR0hMSUdIVF9SRVFVRVNUKTtcbiAgICAgICAgYXVnbWVudEVkaXRvcihlZGl0b3IsIHRoaXMudW51c2VkQ29kZVJvd3MsIHRydWUpO1xuICAgICAgICB0aGlzLmVkaXRvcnMucHVzaChlZGl0b3IpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzLmNsZWFyKCk7XG4gICAgICAgICAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcygpO1xuICAgICAgICAgICAgZGVsZXRlIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICBwdWxsKHRoaXMuZWRpdG9ycywgZWRpdG9yKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnByb2plY3RcbiAgICAgICAgICAgIC5vYnNlcnZlLmFjdGl2ZUZyYW1ld29ya1xuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzLmNsZWFyKCk7XG4gICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoKCkgPT4gaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSkpKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkU2F2ZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvblxuICAgICAgICAgICAgLndoZW5Db25uZWN0ZWQoKVxuICAgICAgICAgICAgLmRlbGF5KDEwMDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudEVkaXRvcihlZGl0b3IsIHVudXNlZENvZGVSb3dzID0gbnVsbCwgZG9TZXRHcmFtbWFyID0gZmFsc2UpIHtcbiAgICBpZiAoIWVkaXRvcltcIl9vbGRHcmFtbWFyXCJdKVxuICAgICAgICBlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgaWYgKCFlZGl0b3JbXCJfc2V0R3JhbW1hclwiXSlcbiAgICAgICAgZWRpdG9yW1wiX3NldEdyYW1tYXJcIl0gPSBlZGl0b3Iuc2V0R3JhbW1hcjtcbiAgICBpZiAoIWVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0O1xuICAgIGlmICghZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdID0gZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGU7XG4gICAgaWYgKCFlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX3JldG9rZW5pemVMaW5lc1wiXSlcbiAgICAgICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcztcbiAgICBpZiAoIWVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfdG9rZW5pemVJbkJhY2tncm91bmRcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfdG9rZW5pemVJbkJhY2tncm91bmRcIl0gPSBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnRva2VuaXplSW5CYWNrZ3JvdW5kO1xuICAgIGlmICghZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9jaHVua1NpemVcIl0pXG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJjaHVua1NpemVcIl0gPSAyMDtcbiAgICBlZGl0b3Iuc2V0R3JhbW1hciA9IHNldEdyYW1tYXI7XG4gICAgaWYgKGRvU2V0R3JhbW1hcilcbiAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSk7XG4gICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dCA9IGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKVtcIl9fcm93X19cIl0gPSByb3c7XG4gICAgICAgIHJldHVybiBlZGl0b3IudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBpZiAoIWVkaXRvci50b2tlbml6ZWRCdWZmZXIuc2lsZW50UmV0b2tlbml6ZUxpbmVzKSB7XG4gICAgICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIuc2lsZW50UmV0b2tlbml6ZUxpbmVzID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xuICAgICAgICAgICAgbGV0IGxhc3RSb3c7XG4gICAgICAgICAgICBsYXN0Um93ID0gdGhpcy5idWZmZXIuZ2V0TGFzdFJvdygpO1xuICAgICAgICAgICAgdGhpcy50b2tlbml6ZWRMaW5lcyA9IHRoaXMuYnVpbGRQbGFjZWhvbGRlclRva2VuaXplZExpbmVzRm9yUm93cygwLCBsYXN0Um93KTtcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZFJvd3MgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmxpbmVzVG9Ub2tlbml6ZSAmJiB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3cobWluKHRoaXMubGluZXNUb1Rva2VuaXplKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3coMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZ1bGx5VG9rZW5pemVkID0gZmFsc2U7XG4gICAgICAgIH0sIERFQk9VTkNFX1RJTUUsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgfVxuICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIubWFya1Rva2VuaXphdGlvbkNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcpXG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KHRydWUpO1xuICAgICAgICByZXR1cm4gZWRpdG9yLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIGVkaXRvci50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcpXG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KGZhbHNlKTtcbiAgICAgICAgcmV0dXJuIGVkaXRvci50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBlZGl0b3IudG9rZW5pemVkQnVmZmVyLnRva2VuaXplSW5CYWNrZ3JvdW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMudmlzaWJsZSB8fCB0aGlzLnBlbmRpbmdDaHVuayB8fCAhdGhpcy5pc0FsaXZlKCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gdHJ1ZTtcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wZW5kaW5nQ2h1bmsgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQWxpdmUoKSAmJiB0aGlzLmJ1ZmZlci5pc0FsaXZlKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRva2VuaXplTmV4dENodW5rKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgZWRpdG9yLnRva2VuaXplZEJ1ZmZlci5zY29wZXNGcm9tVGFncyA9IGZ1bmN0aW9uIChzdGFydGluZ1Njb3BlcywgdGFncykge1xuICAgICAgICBjb25zdCBzY29wZXMgPSBzdGFydGluZ1Njb3Blcy5zbGljZSgpO1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRhZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRhZyA9IHRhZ3NbaV07XG4gICAgICAgICAgICBpZiAodGFnIDwgMCkge1xuICAgICAgICAgICAgICAgIGlmICgodGFnICUgMikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3Blcy5wdXNoKHRhZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGluZ1N0YXJ0VGFnID0gdGFnICsgMTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMucG9wKCkgPT09IG1hdGNoaW5nU3RhcnRUYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2goZ3JhbW1hci5zdGFydElkRm9yU2NvcGUoYC4ke2dyYW1tYXIuc2NvcGVOYW1lfWApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oXCJFbmNvdW50ZXJlZCBhbiB1bm1hdGNoZWQgc2NvcGUgZW5kIHRhZy5cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogZWRpdG9yLmJ1ZmZlci5nZXRQYXRoKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW1tYXJTY29wZU5hbWU6IGdyYW1tYXIuc2NvcGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVubWF0Y2hlZEVuZFRhZzogZ3JhbW1hci5zY29wZUZvcklkKHRhZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnNldFJlc3BvbnNlcyhbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVudXNlZENvZGVSb3dzICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocm93cyA9PiBlZGl0b3IuZ2V0R3JhbW1hcigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0UmVzcG9uc2VzKGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCByb3dzLCBbXSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlcztcbiAgICB9O1xufVxuY2xhc3MgR3JhbW1hciB7XG4gICAgY29uc3RydWN0b3IoZWRpdG9yLCBiYXNlLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2dpZCA9IHVuaXF1ZUlkKFwib2dcIik7XG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nID0gbmV3IFJlcGxheVN1YmplY3QoMSk7XG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLnJlc3BvbnNlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB7fTtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnJlYWRvbmx5KSB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkucHJlZW1wdERpZENoYW5nZSgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgb2xkUmFuZ2UsIG5ld1JhbmdlIH0gPSBlO1xuICAgICAgICAgICAgICAgIGxldCBzdGFydCA9IG9sZFJhbmdlLnN0YXJ0LnJvdywgZGVsdGEgPSBuZXdSYW5nZS5lbmQucm93IC0gb2xkUmFuZ2UuZW5kLnJvdztcbiAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0IC0gNTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnQgPCAwKVxuICAgICAgICAgICAgICAgICAgICBzdGFydCA9IDA7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5kID0gZWRpdG9yLmJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDE7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSByYW5nZShzdGFydCwgZW5kICsgMSk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5rZXlzKCkubmV4dCgpLmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2gucHVzaCguLi5saW5lcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGxpbmVzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkRnJvbSA9IG9sZFJhbmdlLnN0YXJ0LmNvbHVtbiwgbmV3RnJvbSA9IG5ld1JhbmdlLnN0YXJ0LmNvbHVtbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZShyZXNwb25zZUxpbmUsIChzcGFuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRMaW5lIDwgbGluZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG9sZEZyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gb2xkRnJvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gbmV3RnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBuZXdGcm9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWFjaChsaW5lcywgbGluZSA9PiB7IHRoaXMucmVzcG9uc2VzLmRlbGV0ZShsaW5lKTsgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkZWx0YSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBjb3VudCAtIDE7IGkgPiBlbmQ7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VzLmhhcyhpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpICsgZGVsdGEsIHRoaXMucmVzcG9uc2VzLmdldChpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWJzRGVsdGEgPSBNYXRoLmFicyhkZWx0YSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBlbmQ7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkgKyBhYnNEZWx0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaSwgdGhpcy5yZXNwb25zZXMuZ2V0KGkgKyBhYnNEZWx0YSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLmRlbGV0ZShpICsgYWJzRGVsdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0UmVzcG9uc2VzKHZhbHVlLCBlbmFibGVFeGNsdWRlQ29kZSkge1xuICAgICAgICBjb25zdCByZXN1bHRzID0gY2hhaW4odmFsdWUpO1xuICAgICAgICBjb25zdCBncm91cGVkSXRlbXMgPSByZXN1bHRzLm1hcChoaWdobGlnaHQgPT4gcmFuZ2UoaGlnaGxpZ2h0LlN0YXJ0TGluZSwgaGlnaGxpZ2h0LkVuZExpbmUgKyAxKVxuICAgICAgICAgICAgLm1hcChsaW5lID0+ICh7IGxpbmUsIGhpZ2hsaWdodCB9KSkpXG4gICAgICAgICAgICAuZmxhdHRlbigpXG4gICAgICAgICAgICAuZ3JvdXBCeSh6ID0+IHoubGluZSlcbiAgICAgICAgICAgIC52YWx1ZSgpO1xuICAgICAgICBlYWNoKGdyb3VwZWRJdGVtcywgKGl0ZW0sIGtleSkgPT4ge1xuICAgICAgICAgICAgbGV0IGsgPSAra2V5LCBtYXBwZWRJdGVtID0gaXRlbS5tYXAoeCA9PiB4LmhpZ2hsaWdodCk7XG4gICAgICAgICAgICBpZiAoIWVuYWJsZUV4Y2x1ZGVDb2RlIHx8IHNvbWUobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIikgJiYgZXZlcnkobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwiZXhjbHVkZWQgY29kZVwiIHx8IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSkge1xuICAgICAgICAgICAgICAgIG1hcHBlZEl0ZW0gPSBtYXBwZWRJdGVtLmZpbHRlcih6ID0+IHouS2luZCAhPT0gXCJleGNsdWRlZCBjb2RlXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMoaykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChrKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lLmxlbmd0aCAhPT0gbWFwcGVkSXRlbS5sZW5ndGggfHwgc29tZShyZXNwb25zZUxpbmUsIChsLCBpKSA9PiAhaXNFcXVhbChsLCBtYXBwZWRJdGVtW2ldKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXh0ZW5kKEdyYW1tYXIucHJvdG90eXBlLCBBdG9tR3JhbW1hci5wcm90b3R5cGUpO1xuR3JhbW1hci5wcm90b3R5cGVbXCJvbW5pc2hhcnBcIl0gPSB0cnVlO1xuR3JhbW1hci5wcm90b3R5cGVbXCJ0b2tlbml6ZUxpbmVcIl0gPSBmdW5jdGlvbiAobGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUgPSBmYWxzZSkge1xuICAgIGNvbnN0IGJhc2VSZXN1bHQgPSBBdG9tR3JhbW1hci5wcm90b3R5cGUudG9rZW5pemVMaW5lLmNhbGwodGhpcywgbGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUpO1xuICAgIGxldCB0YWdzO1xuICAgIGlmICh0aGlzLnJlc3BvbnNlcykge1xuICAgICAgICBjb25zdCByb3cgPSB0aGlzW1wiX19yb3dfX1wiXTtcbiAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMocm93KSlcbiAgICAgICAgICAgIHJldHVybiBiYXNlUmVzdWx0O1xuICAgICAgICBjb25zdCBoaWdobGlnaHRzID0gdGhpcy5yZXNwb25zZXMuZ2V0KHJvdyk7XG4gICAgICAgIGlmIChoaWdobGlnaHRzWzBdICYmIGhpZ2hsaWdodHNbMF0uS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIpIHtcbiAgICAgICAgICAgIHRhZ3MgPSBbbGluZS5sZW5ndGhdO1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHRzWzBdLCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xuICAgICAgICAgICAgYmFzZVJlc3VsdC5ydWxlU3RhY2sgPSBbYmFzZVJlc3VsdC5ydWxlU3RhY2tbMF1dO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGFncyA9IHRoaXMuZ2V0Q3NUb2tlbnNGb3JMaW5lKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIGJhc2VSZXN1bHQudGFncyk7XG4gICAgICAgIH1cbiAgICAgICAgYmFzZVJlc3VsdC50YWdzID0gdGFncztcbiAgICB9XG4gICAgcmV0dXJuIGJhc2VSZXN1bHQ7XG59O1xuR3JhbW1hci5wcm90b3R5cGUuZ2V0Q3NUb2tlbnNGb3JMaW5lID0gZnVuY3Rpb24gKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIHRhZ3MpIHtcbiAgICBydWxlU3RhY2sgPSBbeyBydWxlOiB0aGlzLmdldEluaXRpYWxSdWxlKCkgfV07XG4gICAgZWFjaChoaWdobGlnaHRzLCAoaGlnaGxpZ2h0KSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uIC0gMTtcbiAgICAgICAgY29uc3QgZW5kID0gaGlnaGxpZ2h0LkVuZENvbHVtbiAtIDE7XG4gICAgICAgIGlmIChoaWdobGlnaHQuRW5kTGluZSA+IGhpZ2hsaWdodC5TdGFydExpbmUgJiYgaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uID09PSAwICYmIGhpZ2hsaWdodC5FbmRDb2x1bW4gPT09IDApIHtcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaXN0YW5jZSA9IC0xO1xuICAgICAgICBsZXQgaW5kZXggPSAtMTtcbiAgICAgICAgbGV0IGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgKyB0YWdzW2ldID4gc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgKz0gdGFnc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdHIgPSBsaW5lLnN1YnN0cmluZyhzdGFydCwgZW5kKTtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IGVuZCAtIHN0YXJ0O1xuICAgICAgICBpZiAodGFnc1tpbmRleF0gPj0gc2l6ZSkge1xuICAgICAgICAgICAgbGV0IHZhbHVlcztcbiAgICAgICAgICAgIGxldCBwcmV2LCBuZXh0O1xuICAgICAgICAgICAgaWYgKGRpc3RhbmNlID09PSBzdGFydCkge1xuICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtzaXplLCB0YWdzW2luZGV4XSAtIHNpemVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJldiA9IHN0YXJ0IC0gZGlzdGFuY2U7XG4gICAgICAgICAgICAgICAgbmV4dCA9IHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXY7XG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplLCB0YWdzW2luZGV4XSAtIHNpemUgLSBwcmV2XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YWdzLnNwbGljZShpbmRleCwgMSwgLi4udmFsdWVzKTtcbiAgICAgICAgICAgIGlmIChwcmV2KVxuICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXggKyAxO1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGluZGV4LCBpbmRleCArIDEsIHN0cik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGFnc1tpbmRleF0gPCBzaXplKSB7XG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tEaXN0YW5jZSA9IDA7XG4gICAgICAgICAgICBmb3IgKGkgPSBiYWNrdHJhY2tJbmRleDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0Rpc3RhbmNlICs9IHRhZ3NbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrdHJhY2tEaXN0YW5jZSA+PSBzaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGkgKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZm9yd2FyZHRyYWNrSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGxldCByZW1haW5pbmdTaXplID0gc2l6ZTtcbiAgICAgICAgICAgIGZvciAoaSA9IGluZGV4ICsgMTsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoKHJlbWFpbmluZ1NpemUgPD0gMCAmJiB0YWdzW2ldID4gMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmdTaXplIC09IHRhZ3NbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBvcGVuRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IGk7IGggPj0gMDsgaC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFnc1toXSA9PT0gdGFnc1tpXSArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghb3BlbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IGkgLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA9PT0gdGFncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IHRhZ3MubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCBiYWNrdHJhY2tJbmRleCwgZm9yd2FyZHRyYWNrSW5kZXgsIHN0cik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdGFncztcbn07XG5jb25zdCBnZXRJZEZvclNjb3BlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBpZHMgPSB7fTtcbiAgICBjb25zdCBncmFtbWFycyA9IHt9O1xuICAgIGZ1bmN0aW9uIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyTmFtZSkge1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZmluZChhdG9tLmdyYW1tYXJzLmdldEdyYW1tYXJzKCksIGdhbW1yID0+IGdhbW1yLm5hbWUgPT09IGdyYW1tYXJOYW1lKTtcbiAgICAgICAgaWYgKCFncmFtbWFyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZHNbZ3JhbW1hci5uYW1lXSA9IHt9O1xuICAgICAgICBncmFtbWFyc1tncmFtbWFyLm5hbWVdID0gZ3JhbW1hcjtcbiAgICAgICAgZWFjaChncmFtbWFyLnJlZ2lzdHJ5LnNjb3Blc0J5SWQsICh2YWx1ZSwga2V5KSA9PiB7IGlkc1tncmFtbWFyLm5hbWVdW3ZhbHVlXSA9ICtrZXk7IH0pO1xuICAgIH1cbiAgICBjb25zdCBtZXRob2QgPSAoZ3JhbW1hciwgc2NvcGUpID0+IHtcbiAgICAgICAgaWYgKCFpZHNbZ3JhbW1hcl0pIHtcbiAgICAgICAgICAgIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXVtzY29wZV0pXG4gICAgICAgICAgICBpZHNbZ3JhbW1hcl1bc2NvcGVdID0gZ3JhbW1hcnNbZ3JhbW1hcl0ucmVnaXN0cnkuc3RhcnRJZEZvclNjb3BlKHNjb3BlKTtcbiAgICAgICAgcmV0dXJuICtpZHNbZ3JhbW1hcl1bc2NvcGVdO1xuICAgIH07XG4gICAgbWV0aG9kLmVuZCA9IChzY29wZSkgPT4gK3Njb3BlIC0gMTtcbiAgICByZXR1cm4gbWV0aG9kO1xufSkoKTtcbmZ1bmN0aW9uIGdldEF0b21TdHlsZUZvclRva2VuKGdyYW1tYXIsIHRhZ3MsIHRva2VuLCBpbmRleCwgaW5kZXhFbmQsIHN0cikge1xuICAgIGNvbnN0IHByZXZpb3VzU2NvcGVzID0gW107XG4gICAgZm9yIChsZXQgaSA9IGluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2godGFnc1tpXSk7XG4gICAgfVxuICAgIGNvbnN0IHJlcGxhY2VtZW50cyA9IFtdO1xuICAgIGNvbnN0IG9wZW5zID0gW107XG4gICAgY29uc3QgY2xvc2VzID0gW107XG4gICAgZm9yIChsZXQgaSA9IGluZGV4OyBpIDwgaW5kZXhFbmQ7IGkrKykge1xuICAgICAgICBpZiAodGFnc1tpXSA+IDApXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBvcGVuSW5kZXggPSBmaW5kSW5kZXgob3BlbnMsIHggPT4geC50YWcgPT09ICh0YWdzW2ldICsgMSkpO1xuICAgICAgICAgICAgaWYgKG9wZW5JbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3BlbnMuc3BsaWNlKG9wZW5JbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9zZXMucHVzaCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvcGVucy51bnNoaWZ0KHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgdW5mdWxsZmlsbGVkID0gW107XG4gICAgaWYgKGNsb3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHVuZnVsbGZpbGxlZCA9IHNvcnRCeShvcGVucy5jb25jYXQoY2xvc2VzKSwgeCA9PiB4LmluZGV4KTtcbiAgICB9XG4gICAgZWxzZSBpZiAob3BlbnMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogb3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2Uob3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsIGluZGV4RW5kICsgMSlcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCBpbnRlcm5hbEluZGV4ID0gaW5kZXg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmZ1bGxmaWxsZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgdiA9IHVuZnVsbGZpbGxlZFtpXTtcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXG4gICAgICAgICAgICBlbmQ6IHYuaW5kZXgsXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbnRlcm5hbEluZGV4LCB2LmluZGV4KVxuICAgICAgICB9KTtcbiAgICAgICAgaW50ZXJuYWxJbmRleCA9IHYuaW5kZXggKyAxO1xuICAgIH1cbiAgICBpZiAocmVwbGFjZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogaW5kZXgsXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW5kZXgsIGluZGV4RW5kKVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZChzY29wZSkge1xuICAgICAgICBjb25zdCBpZCA9IGdldElkRm9yU2NvcGUoZ3JhbW1hciwgc2NvcGUpO1xuICAgICAgICBpZiAoaWQgPT09IC0xKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoIXNvbWUocHJldmlvdXNTY29wZXMsIHogPT4geiA9PT0gaWQpKSB7XG4gICAgICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKGlkKTtcbiAgICAgICAgfVxuICAgICAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gY3R4LnJlcGxhY2VtZW50O1xuICAgICAgICAgICAgcmVwbGFjZW1lbnQudW5zaGlmdChpZCk7XG4gICAgICAgICAgICByZXBsYWNlbWVudC5wdXNoKGdldElkRm9yU2NvcGUuZW5kKGlkKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRva2VuLktpbmQpIHtcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5udW1lcmljYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInN0cnVjdCBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY29uc3RhbnQubnVtZXJpYy5pZGVudGlmaWVyLnN0cnVjdGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJlbnVtIG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuZW51bWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6XG4gICAgICAgICAgICBhZGQoYGlkZW50aWZpZXJgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiY2xhc3MgbmFtZVwiOlxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllcmApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJkZWxlZ2F0ZSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmRlbGVnYXRlYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImludGVyZmFjZSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmludGVyZmFjZWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiOlxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5vdGhlci5zeW1ib2xgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZXhjbHVkZWQgY29kZVwiOlxuICAgICAgICAgICAgYWRkKGBjb21tZW50LmJsb2NrYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInVudXNlZCBjb2RlXCI6XG4gICAgICAgICAgICBhZGQoYHVudXNlZGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVuaGFuZGxlZCBLaW5kIFwiICsgdG9rZW4uS2luZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XG4gICAgICAgIGNvbnN0IHsgcmVwbGFjZW1lbnQsIGVuZCwgc3RhcnQgfSA9IGN0eDtcbiAgICAgICAgaWYgKHJlcGxhY2VtZW50Lmxlbmd0aCA9PT0gMilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IG51bSA9IGVuZCAtIHN0YXJ0O1xuICAgICAgICBpZiAobnVtIDw9IDApIHtcbiAgICAgICAgICAgIG51bSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgdGFncy5zcGxpY2Uoc3RhcnQsIG51bSwgLi4ucmVwbGFjZW1lbnQpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gc2V0R3JhbW1hcihncmFtbWFyKSB7XG4gICAgY29uc3QgZzIgPSBnZXRFbmhhbmNlZEdyYW1tYXIodGhpcywgZ3JhbW1hcik7XG4gICAgaWYgKGcyICE9PSBncmFtbWFyKVxuICAgICAgICB0aGlzLl9zZXRHcmFtbWFyKGcyKTtcbiAgICByZXR1cm4gZzI7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5oYW5jZWRHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucykge1xuICAgIGlmICghZ3JhbW1hcilcbiAgICAgICAgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgaWYgKCFncmFtbWFyW1wib21uaXNoYXJwXCJdICYmIE9tbmkuaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcikpIHtcbiAgICAgICAgY29uc3QgbmV3R3JhbW1hciA9IG5ldyBHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucyk7XG4gICAgICAgIGVhY2goZ3JhbW1hciwgKHgsIGkpID0+IGhhcyhncmFtbWFyLCBpKSAmJiAobmV3R3JhbW1hcltpXSA9IHgpKTtcbiAgICAgICAgZ3JhbW1hciA9IG5ld0dyYW1tYXI7XG4gICAgfVxuICAgIHJldHVybiBncmFtbWFyO1xufVxuY2xhc3MgVW51c2VkTWFwIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fbWFwID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBnZXQoa2V5KSB7XG4gICAgICAgIGlmICghdGhpcy5fbWFwLmhhcyhrZXkpKVxuICAgICAgICAgICAgdGhpcy5fbWFwLnNldChrZXksIG5ldyBCZWhhdmlvclN1YmplY3QoW10pKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC5nZXQoa2V5KTtcbiAgICB9XG4gICAgX2dldE9ic2VydmVyKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXQoa2V5KTtcbiAgICB9XG4gICAgc2V0KGtleSwgdmFsdWUpIHtcbiAgICAgICAgY29uc3QgbyA9IHRoaXMuX2dldE9ic2VydmVyKGtleSk7XG4gICAgICAgIGlmICghaXNFcXVhbChvLmdldFZhbHVlKCksIHZhbHVlKSkge1xuICAgICAgICAgICAgby5uZXh0KHZhbHVlIHx8IFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgZGVsZXRlKGtleSkge1xuICAgICAgICBpZiAodGhpcy5fbWFwLmhhcyhrZXkpKVxuICAgICAgICAgICAgdGhpcy5fbWFwLmRlbGV0ZShrZXkpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5fbWFwLmNsZWFyKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGVuaGFuY2VkSGlnaGxpZ2h0aW5nMTkgPSBuZXcgSGlnaGxpZ2h0O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
