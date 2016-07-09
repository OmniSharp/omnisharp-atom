"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.enhancedHighlighting = exports.ExcludeClassifications = undefined;

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

            if (_omni.Omni.atomVersion.minor === 1 && _omni.Omni.atomVersion.minor <= 8) {
                return;
            }
            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.editors = [];
            this.disposable.add((0, _omnisharpTextEditor.registerContextItem)(HIGHLIGHT_REQUEST, function (context) {
                return new _rxjs.Subject();
            }));
            this.disposable.add((0, _omnisharpTextEditor.registerContextItem)(HIGHLIGHT, function (context, editor) {
                return context.get(HIGHLIGHT_REQUEST).startWith(true).switchMap(function () {
                    return _rxjs.Observable.defer(function () {
                        var projects = context.project.activeFramework.Name === "all" ? [] : [context.project.activeFramework.Name];
                        var linesToFetch = (0, _lodash.uniq)(editor.getGrammar().linesToFetch);
                        if (!linesToFetch || !linesToFetch.length) linesToFetch = [];
                        _this.unusedCodeRows.set(editor.getPath(), []);
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
                                highlights: (response ? response.Highlights : []).concat(getHighlightsFromQuickFixes(editor.getPath(), quickfixes, projects))
                            };
                        }).do(function (_ref) {
                            var highlights = _ref.highlights;

                            if (editor.getGrammar) {
                                editor.getGrammar().setResponses(highlights, projects.length > 0);
                            }
                        }).publishReplay(1).refCount();
                    });
                });
            }));
            this.disposable.add(_omni.Omni.listener.model.diagnosticsByFile.subscribe(function (changes) {
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
            }));
            this.disposable.add(_omni.Omni.eachEditor(function (editor, cd) {
                _this.setupEditor(editor, cd);
                cd.add(editor.omnisharp.get(HIGHLIGHT).subscribe(function () {
                    editor.displayBuffer.tokenizedBuffer["silentRetokenizeLines"]();
                }));
                editor.omnisharp.get(HIGHLIGHT_REQUEST).next(true);
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                editor.omnisharp.get(HIGHLIGHT_REQUEST).next(true);
                if (editor.displayBuffer.tokenizedBuffer["silentRetokenizeLines"]) {
                    editor.displayBuffer.tokenizedBuffer["silentRetokenizeLines"]();
                }
            }));
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
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
            disposable.add(_omnisharpClient.Disposable.create(function () {
                _this2.unusedCodeRows.delete(editor.getPath());
            }));
            this.editors.push(editor);
            this.disposable.add(disposable);
            disposable.add(_omnisharpClient.Disposable.create(function () {
                editor.getGrammar().linesToFetch = [];
                if (editor.getGrammar().responses) editor.getGrammar().responses.clear();
                editor.displayBuffer.tokenizedBuffer.retokenizeLines();
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
    if (!editor.displayBuffer.tokenizedBuffer["_buildTokenizedLineForRowWithText"]) editor.displayBuffer.tokenizedBuffer["_buildTokenizedLineForRowWithText"] = editor.displayBuffer.tokenizedBuffer.buildTokenizedLineForRowWithText;
    if (!editor.displayBuffer.tokenizedBuffer["_markTokenizationComplete"]) editor.displayBuffer.tokenizedBuffer["_markTokenizationComplete"] = editor.displayBuffer.tokenizedBuffer.markTokenizationComplete;
    if (!editor.displayBuffer.tokenizedBuffer["_retokenizeLines"]) editor.displayBuffer.tokenizedBuffer["_retokenizeLines"] = editor.displayBuffer.tokenizedBuffer.retokenizeLines;
    if (!editor.displayBuffer.tokenizedBuffer["_tokenizeInBackground"]) editor.displayBuffer.tokenizedBuffer["_tokenizeInBackground"] = editor.displayBuffer.tokenizedBuffer.tokenizeInBackground;
    if (!editor.displayBuffer.tokenizedBuffer["_chunkSize"]) editor.displayBuffer.tokenizedBuffer["chunkSize"] = 20;
    editor.setGrammar = setGrammar;
    if (doSetGrammar) editor.setGrammar(editor.getGrammar());
    editor.displayBuffer.tokenizedBuffer.buildTokenizedLineForRowWithText = function (row) {
        editor.getGrammar()["__row__"] = row;
        return editor.displayBuffer.tokenizedBuffer["_buildTokenizedLineForRowWithText"].apply(this, arguments);
    };
    if (!editor.displayBuffer.tokenizedBuffer.silentRetokenizeLines) {
        editor.displayBuffer.tokenizedBuffer.silentRetokenizeLines = (0, _lodash.debounce)(function () {
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
    editor.displayBuffer.tokenizedBuffer.markTokenizationComplete = function () {
        if (editor.getGrammar().isObserveRetokenizing) editor.getGrammar().isObserveRetokenizing.next(true);
        return editor.displayBuffer.tokenizedBuffer["_markTokenizationComplete"].apply(this, arguments);
    };
    editor.displayBuffer.tokenizedBuffer.retokenizeLines = function () {
        if (editor.getGrammar().isObserveRetokenizing) editor.getGrammar().isObserveRetokenizing.next(false);
        return editor.displayBuffer.tokenizedBuffer["_retokenizeLines"].apply(this, arguments);
    };
    editor.displayBuffer.tokenizedBuffer.tokenizeInBackground = function () {
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
    editor.displayBuffer.tokenizedBuffer.scopesFromTags = function (startingScopes, tags) {
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

var enhancedHighlighting = exports.enhancedHighlighting = new Highlight();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9oaWdobGlnaHQudHMiLCJsaWIvZmVhdHVyZXMvaGlnaGxpZ2h0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O1FBb0xBLGEsR0FBQSxhO1FBMmdCQSxrQixHQUFBLGtCOztBQy9yQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBREtBLElBQU0sY0FBYyxRQUFjLEtBQU0sTUFBTixDQUFhLFlBQWIsR0FBNEIseUNBQTFDLENBQXBCO0FBRUEsSUFBTSxnQkFBZ0IsR0FBdEI7QUFDQSxJQUFJLFVBQTBCLFFBQVEsU0FBUixDQUE5QjtBQUVBLElBQU0sWUFBWSxXQUFsQjtJQUNJLG9CQUFvQixtQkFEeEI7QUFHQSxTQUFBLDJCQUFBLENBQXFDLElBQXJDLEVBQW1ELFVBQW5ELEVBQTRGLFlBQTVGLEVBQWtIO0FBQzlHLFdBQU8sbUJBQU0sVUFBTixFQUNGLE1BREUsQ0FDSztBQUFBLGVBQUssRUFBRSxRQUFGLEtBQWUsSUFBcEI7QUFBQSxLQURMLEVBRUYsR0FGRSxDQUVFO0FBQUEsZUFBTTtBQUNQLHVCQUFXLEVBQUUsSUFETjtBQUVQLHlCQUFhLEVBQUUsTUFGUjtBQUdQLHFCQUFTLEVBQUUsT0FISjtBQUlQLHVCQUFXLEVBQUUsU0FKTjtBQUtQLGtCQUFNLGFBTEM7QUFNUCxzQkFBVTtBQU5ILFNBQU47QUFBQSxLQUZGLEVBVUYsS0FWRSxFQUFQO0FBV0g7QUFHTSxJQUFNLDBEQUF5QixDQUNsQyxDQURrQyxFQUVsQyxDQUZrQyxFQUdsQyxDQUhrQyxFQUlsQyxDQUprQyxFQUtsQyxDQUxrQyxDQUEvQjs7SUFTUCxTO0FBQUEseUJBQUE7QUFBQTs7QUFHWSxhQUFBLGNBQUEsR0FBaUIsSUFBSSxTQUFKLEVBQWpCO0FBa0lELGFBQUEsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSx1QkFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLDJHQUFkO0FBQ0EsYUFBQSxPQUFBLEdBQVUsS0FBVjtB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QW5HO0FBQ0g7Ozs0QkFFVSxHLEVBQWEsSyxFQUFtQztBQUN2RCxnQkFBTSxJQUFJLEtBQUssWUFBTCxDQUFrQixHQUFsQixDQUFWO0FBQ0EsZ0JBQUksQ0FBQyxxQkFBUSxFQUFFLFFBQUYsRUFBUixFQUFzQixLQUF0QixDQUFMLEVBQW1DO0FBQy9CLGtCQUFFLElBQUYsQ0FBTyxTQUFTLEVBQWhCO0FBQ0g7QUFDRCxtQkFBTyxJQUFQO0FBQ0g7OztnQ0FFYSxHLEVBQVc7QUFDckIsZ0JBQUksS0FBSyxJQUFMLENBQVUsR0FBVixDQUFjLEdBQWQsQ0FBSixFQUNJLEtBQUssSUFBTCxDQUFVLE1BQVYsQ0FBaUIsR0FBakI7QUFDUDs7O2dDQUVXO0FBQ1IsaUJBQUssSUFBTCxDQUFVLEtBQVY7QUFDSDs7Ozs7O0FBR0UsSUFBTSxzREFBdUIsSUFBSSxTQUFKLEVBQTdCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9oaWdobGlnaHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5pbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtPbW5pc2hhcnBUZXh0RWRpdG9yLCBpc09tbmlzaGFycFRleHRFZGl0b3J9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XHJcbmltcG9ydCB7ZWFjaCwgZXh0ZW5kLCBoYXMsIHNvbWUsIHJhbmdlLCByZW1vdmUsIHB1bGwsIGZpbmQsIGNoYWluLCB1bmlxLCBmaW5kSW5kZXgsIGV2ZXJ5LCBpc0VxdWFsLCBtaW4sIGRlYm91bmNlLCBzb3J0QnksIHVuaXF1ZUlkLCBmaWx0ZXJ9IGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0LCBSZXBsYXlTdWJqZWN0LCBCZWhhdmlvclN1YmplY3QsIFN1YnNjcmliZXJ9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtyZWdpc3RlckNvbnRleHRJdGVtfSBmcm9tIFwiLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xyXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmNvbnN0IEF0b21HcmFtbWFyID0gcmVxdWlyZSgoPGFueT5hdG9tKS5jb25maWcucmVzb3VyY2VQYXRoICsgXCIvbm9kZV9tb2R1bGVzL2ZpcnN0LW1hdGUvbGliL2dyYW1tYXIuanNcIik7XHJcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5jb25zdCBERUJPVU5DRV9USU1FID0gMjQwLyoyNDAqLztcclxubGV0IGZhc3Rkb206IHR5cGVvZiBGYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XHJcblxyXG5jb25zdCBISUdITElHSFQgPSBcIkhJR0hMSUdIVFwiLFxyXG4gICAgSElHSExJR0hUX1JFUVVFU1QgPSBcIkhJR0hMSUdIVF9SRVFVRVNUXCI7XHJcblxyXG5mdW5jdGlvbiBnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMocGF0aDogc3RyaW5nLCBxdWlja0ZpeGVzOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10sIHByb2plY3ROYW1lczogc3RyaW5nW10pIHtcclxuICAgIHJldHVybiBjaGFpbihxdWlja0ZpeGVzKVxyXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4LkZpbGVOYW1lID09PSBwYXRoKVxyXG4gICAgICAgIC5tYXAoeCA9PiAoe1xyXG4gICAgICAgICAgICBTdGFydExpbmU6IHguTGluZSxcclxuICAgICAgICAgICAgU3RhcnRDb2x1bW46IHguQ29sdW1uLFxyXG4gICAgICAgICAgICBFbmRMaW5lOiB4LkVuZExpbmUsXHJcbiAgICAgICAgICAgIEVuZENvbHVtbjogeC5FbmRDb2x1bW4sXHJcbiAgICAgICAgICAgIEtpbmQ6IFwidW51c2VkIGNvZGVcIixcclxuICAgICAgICAgICAgUHJvamVjdHM6IHByb2plY3ROYW1lc1xyXG4gICAgICAgIH0gYXMgTW9kZWxzLkhpZ2hsaWdodFNwYW4pKVxyXG4gICAgICAgIC52YWx1ZSgpO1xyXG59XHJcblxyXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmV4cG9ydCBjb25zdCBFeGNsdWRlQ2xhc3NpZmljYXRpb25zID0gW1xyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLkNvbW1lbnQsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uU3RyaW5nLFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLlB1bmN0dWF0aW9uLFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLk9wZXJhdG9yLFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLktleXdvcmRcclxuXTtcclxuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcblxyXG5jbGFzcyBIaWdobGlnaHQgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIGVkaXRvcnM6IEFycmF5PE9tbmlzaGFycFRleHRFZGl0b3I+O1xyXG4gICAgcHJpdmF0ZSB1bnVzZWRDb2RlUm93cyA9IG5ldyBVbnVzZWRNYXAoKTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgaWYgKE9tbmkuYXRvbVZlcnNpb24ubWlub3IgPT09IDEgJiYgT21uaS5hdG9tVmVyc2lvbi5taW5vciA8PSA4KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmVkaXRvcnMgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChyZWdpc3RlckNvbnRleHRJdGVtKEhJR0hMSUdIVF9SRVFVRVNULCAoY29udGV4dCkgPT4gbmV3IFN1YmplY3Q8Ym9vbGVhbj4oKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQocmVnaXN0ZXJDb250ZXh0SXRlbShISUdITElHSFQsIChjb250ZXh0LCBlZGl0b3IpID0+XHJcbiAgICAgICAgICAgIGNvbnRleHQuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKVxyXG4gICAgICAgICAgICAgICAgLnN0YXJ0V2l0aCh0cnVlKVxyXG4gICAgICAgICAgICAgICAgLnN3aXRjaE1hcCgoKSA9PiBPYnNlcnZhYmxlLmRlZmVyKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0cyA9IGNvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZSA9PT0gXCJhbGxcIiA/IFtdIDogW2NvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBsaW5lc1RvRmV0Y2ggPSB1bmlxPG51bWJlcj4oKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWxpbmVzVG9GZXRjaCB8fCAhbGluZXNUb0ZldGNoLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGluZXNUb0ZldGNoID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IGNvZGUgcm93c1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3Muc2V0KGVkaXRvci5nZXRQYXRoKCksIFtdKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5nZXQoZWRpdG9yLmdldFBhdGgoKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmhpZ2hsaWdodCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9qZWN0TmFtZXM6IHByb2plY3RzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTGluZXM6IGxpbmVzVG9GZXRjaCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAocXVpY2tmaXhlcywgcmVzcG9uc2UpID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodHM6IChyZXNwb25zZSA/IHJlc3BvbnNlLkhpZ2hsaWdodHMgOiBbXSkuY29uY2F0KGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCBxdWlja2ZpeGVzLCBwcm9qZWN0cykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZG8oKHtoaWdobGlnaHRzfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuc2V0UmVzcG9uc2VzKGhpZ2hsaWdodHMsIHByb2plY3RzLmxlbmd0aCA+IDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVmQ291bnQoKTtcclxuICAgICAgICAgICAgICAgIH0pKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubW9kZWwuZGlhZ25vc3RpY3NCeUZpbGVcclxuICAgICAgICAgICAgLnN1YnNjcmliZShjaGFuZ2VzID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IFtmaWxlLCBkaWFnbm9zdGljc10gb2YgY2hhbmdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3Muc2V0KGZpbGUsIGZpbHRlcihkaWFnbm9zdGljcywgeCA9PiB4LkxvZ0xldmVsID09PSBcIkhpZGRlblwiKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmVhY2hFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5zZXR1cEVkaXRvcihlZGl0b3IsIGNkKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub21uaXNoYXJwXHJcbiAgICAgICAgICAgICAgICAuZ2V0PE9ic2VydmFibGU8eyBlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3I7IGhpZ2hsaWdodHM6IE1vZGVscy5IaWdobGlnaHRTcGFuW107IHByb2plY3RzOiBzdHJpbmdbXSB9Pj4oSElHSExJR0hUKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKS5uZXh0KHRydWUpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldDxTdWJqZWN0PGJvb2xlYW4+PihISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgaWYgKGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSkge1xyXG4gICAgICAgICAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLmNsZWFyKCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cEVkaXRvcihlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IsIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGUpIHtcclxuICAgICAgICBpZiAoZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0gfHwgIWVkaXRvci5nZXRHcmFtbWFyKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IGlzc3VlUmVxdWVzdCA9IGVkaXRvci5vbW5pc2hhcnAuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKTtcclxuXHJcbiAgICAgICAgYXVnbWVudEVkaXRvcihlZGl0b3IsIHRoaXMudW51c2VkQ29kZVJvd3MsIHRydWUpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MuZGVsZXRlKGVkaXRvci5nZXRQYXRoKCkpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5lZGl0b3JzLnB1c2goZWRpdG9yKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmxpbmVzVG9GZXRjaCA9IFtdO1xyXG4gICAgICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkucmVzcG9uc2VzKSAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMuY2xlYXIoKTtcclxuICAgICAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcygpO1xyXG4gICAgICAgICAgICBkZWxldGUgZWRpdG9yW1wiX29sZEdyYW1tYXJcIl07XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgICAgICBwdWxsKHRoaXMuZWRpdG9ycywgZWRpdG9yKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbW5pc2hhcnAucHJvamVjdFxyXG4gICAgICAgICAgICAub2JzZXJ2ZS5hY3RpdmVGcmFtZXdvcmtcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICAgICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMpICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcy5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKCgpID0+IGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpKSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFNhdmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2ggPSBbXTtcclxuICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uXHJcbiAgICAgICAgICAgIC53aGVuQ29ubmVjdGVkKClcclxuICAgICAgICAgICAgLmRlbGF5KDEwMDApXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJFbmhhbmNlZCBIaWdobGlnaHRpbmdcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiRW5hYmxlcyBzZXJ2ZXIgYmFzZWQgaGlnaGxpZ2h0aW5nLCB3aGljaCBpbmNsdWRlcyBzdXBwb3J0IGZvciBzdHJpbmcgaW50ZXJwb2xhdGlvbiwgY2xhc3MgbmFtZXMgYW5kIG1vcmUuXCI7XHJcbiAgICBwdWJsaWMgZGVmYXVsdCA9IGZhbHNlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudEVkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgdW51c2VkQ29kZVJvd3M6IFVudXNlZE1hcCA9IG51bGwsIGRvU2V0R3JhbW1hciA9IGZhbHNlKSB7XHJcbiAgICBpZiAoIWVkaXRvcltcIl9vbGRHcmFtbWFyXCJdKVxyXG4gICAgICAgIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcclxuICAgIGlmICghZWRpdG9yW1wiX3NldEdyYW1tYXJcIl0pXHJcbiAgICAgICAgZWRpdG9yW1wiX3NldEdyYW1tYXJcIl0gPSBlZGl0b3Iuc2V0R3JhbW1hcjtcclxuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdKVxyXG4gICAgICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXSA9IGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dDtcclxuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXSlcclxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdID0gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLm1hcmtUb2tlbml6YXRpb25Db21wbGV0ZTtcclxuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX3JldG9rZW5pemVMaW5lc1wiXSlcclxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdID0gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcztcclxuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX3Rva2VuaXplSW5CYWNrZ3JvdW5kXCJdKVxyXG4gICAgICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl90b2tlbml6ZUluQmFja2dyb3VuZFwiXSA9IGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci50b2tlbml6ZUluQmFja2dyb3VuZDtcclxuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX2NodW5rU2l6ZVwiXSlcclxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJjaHVua1NpemVcIl0gPSAyMDtcclxuXHJcbiAgICBlZGl0b3Iuc2V0R3JhbW1hciA9IHNldEdyYW1tYXI7XHJcbiAgICBpZiAoZG9TZXRHcmFtbWFyKSBlZGl0b3Iuc2V0R3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKTtcclxuXHJcbiAgICAoPGFueT5lZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIpLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0ID0gZnVuY3Rpb24ocm93OiBudW1iZXIpIHtcclxuICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKVtcIl9fcm93X19cIl0gPSByb3c7XHJcbiAgICAgICAgcmV0dXJuIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoISg8YW55PmVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcikuc2lsZW50UmV0b2tlbml6ZUxpbmVzKSB7XHJcbiAgICAgICAgKDxhbnk+ZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyKS5zaWxlbnRSZXRva2VuaXplTGluZXMgPSBkZWJvdW5jZShmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcclxuICAgICAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KGZhbHNlKTtcclxuICAgICAgICAgICAgbGV0IGxhc3RSb3c6IG51bWJlcjtcclxuICAgICAgICAgICAgbGFzdFJvdyA9IHRoaXMuYnVmZmVyLmdldExhc3RSb3coKTtcclxuICAgICAgICAgICAgdGhpcy50b2tlbml6ZWRMaW5lcyA9IHRoaXMuYnVpbGRQbGFjZWhvbGRlclRva2VuaXplZExpbmVzRm9yUm93cygwLCBsYXN0Um93KTtcclxuICAgICAgICAgICAgdGhpcy5pbnZhbGlkUm93cyA9IFtdO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5saW5lc1RvVG9rZW5pemUgJiYgdGhpcy5saW5lc1RvVG9rZW5pemUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3cobWluKHRoaXMubGluZXNUb1Rva2VuaXplKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3coMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5mdWxseVRva2VuaXplZCA9IGZhbHNlO1xyXG4gICAgICAgIH0sIERFQk9VTkNFX1RJTUUsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgKDxhbnk+ZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyKS5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxyXG4gICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dCh0cnVlKTtcclxuICAgICAgICByZXR1cm4gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICAoPGFueT5lZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIpLnJldG9rZW5pemVMaW5lcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcpXHJcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KGZhbHNlKTtcclxuICAgICAgICByZXR1cm4gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX3JldG9rZW5pemVMaW5lc1wiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICAoPGFueT5lZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIpLnRva2VuaXplSW5CYWNrZ3JvdW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnZpc2libGUgfHwgdGhpcy5wZW5kaW5nQ2h1bmsgfHwgIXRoaXMuaXNBbGl2ZSgpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gdHJ1ZTtcclxuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQWxpdmUoKSAmJiB0aGlzLmJ1ZmZlci5pc0FsaXZlKCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudG9rZW5pemVOZXh0Q2h1bmsoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAoPGFueT5lZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIpLnNjb3Blc0Zyb21UYWdzID0gZnVuY3Rpb24oc3RhcnRpbmdTY29wZXM6IG51bWJlcltdLCB0YWdzOiBudW1iZXJbXSkge1xyXG4gICAgICAgIGNvbnN0IHNjb3BlcyA9IHN0YXJ0aW5nU2NvcGVzLnNsaWNlKCk7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9ICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0YWdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRhZyA9IHRhZ3NbaV07XHJcbiAgICAgICAgICAgIGlmICh0YWcgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHRhZyAlIDIpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3Blcy5wdXNoKHRhZyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoaW5nU3RhcnRUYWcgPSB0YWcgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMucG9wKCkgPT09IG1hdGNoaW5nU3RhcnRUYWcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIYWNrIHRvIGVuc3VyZSB0aGF0IGFsbCBsaW5lcyBhbHdheXMgZ2V0IHRoZSBwcm9wZXIgc291cmNlIGxpbmVzLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2goPGFueT5ncmFtbWFyLnN0YXJ0SWRGb3JTY29wZShgLiR7Z3JhbW1hci5zY29wZU5hbWV9YCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiRW5jb3VudGVyZWQgYW4gdW5tYXRjaGVkIHNjb3BlIGVuZCB0YWcuXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogZWRpdG9yLmJ1ZmZlci5nZXRQYXRoKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbW1hclNjb3BlTmFtZTogZ3JhbW1hci5zY29wZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVubWF0Y2hlZEVuZFRhZzogZ3JhbW1hci5zY29wZUZvcklkKHRhZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuc2V0UmVzcG9uc2VzKFtdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1bnVzZWRDb2RlUm93cyAmJiBpc09tbmlzaGFycFRleHRFZGl0b3IoZWRpdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJvd3MgPT4gKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRSZXNwb25zZXMoZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKGVkaXRvci5nZXRQYXRoKCksIHJvd3MsIFtdKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNjb3BlcztcclxuICAgIH07XHJcbn1cclxuXHJcbmludGVyZmFjZSBJSGlnaGxpZ2h0aW5nR3JhbW1hciBleHRlbmRzIEZpcnN0TWF0ZS5HcmFtbWFyIHtcclxuICAgIGlzT2JzZXJ2ZVJldG9rZW5pemluZzogU3ViamVjdDxib29sZWFuPjtcclxuICAgIGxpbmVzVG9GZXRjaDogbnVtYmVyW107XHJcbiAgICBsaW5lc1RvVG9rZW5pemU6IG51bWJlcltdO1xyXG4gICAgcmVzcG9uc2VzOiBNYXA8bnVtYmVyLCBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdPjtcclxuICAgIGZ1bGx5VG9rZW5pemVkOiBib29sZWFuO1xyXG4gICAgc2NvcGVOYW1lOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIEdyYW1tYXIge1xyXG4gICAgcHVibGljIGlzT2JzZXJ2ZVJldG9rZW5pemluZzogUmVwbGF5U3ViamVjdDxib29sZWFuPjtcclxuICAgIHB1YmxpYyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcclxuICAgIHB1YmxpYyBsaW5lc1RvRmV0Y2g6IGFueVtdO1xyXG4gICAgcHVibGljIGxpbmVzVG9Ub2tlbml6ZTogYW55W107XHJcbiAgICBwdWJsaWMgYWN0aXZlRnJhbWV3b3JrOiBhbnk7XHJcbiAgICBwdWJsaWMgcmVzcG9uc2VzOiBNYXA8bnVtYmVyLCBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdPjtcclxuICAgIHB1YmxpYyBfZ2lkID0gdW5pcXVlSWQoXCJvZ1wiKTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgYmFzZTogRmlyc3RNYXRlLkdyYW1tYXIsIG9wdGlvbnM6IHsgcmVhZG9ubHk6IGJvb2xlYW4gfSkge1xyXG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nID0gbmV3IFJlcGxheVN1YmplY3Q8Ym9vbGVhbj4oMSk7XHJcbiAgICAgICAgdGhpcy5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dCh0cnVlKTtcclxuXHJcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XHJcbiAgICAgICAgdGhpcy5yZXNwb25zZXMgPSBuZXcgTWFwPG51bWJlciwgTW9kZWxzLkhpZ2hsaWdodFNwYW5bXT4oKTtcclxuICAgICAgICB0aGlzLmxpbmVzVG9GZXRjaCA9IFtdO1xyXG4gICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplID0gW107XHJcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB7fTtcclxuXHJcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnJlYWRvbmx5KSB7XHJcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5wcmVlbXB0RGlkQ2hhbmdlKChlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHtvbGRSYW5nZSwgbmV3UmFuZ2V9ID0gZTtcclxuICAgICAgICAgICAgICAgIGxldCBzdGFydDogbnVtYmVyID0gb2xkUmFuZ2Uuc3RhcnQucm93LFxyXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhOiBudW1iZXIgPSBuZXdSYW5nZS5lbmQucm93IC0gb2xkUmFuZ2UuZW5kLnJvdztcclxuXHJcbiAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0IC0gNTtcclxuICAgICAgICAgICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSBlZGl0b3IuYnVmZmVyLmdldExpbmVDb3VudCgpIC0gMTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9IHJhbmdlKHN0YXJ0LCBlbmQgKyAxKTtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMua2V5cygpLm5leHQoKS5kb25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2gucHVzaCguLi5saW5lcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChsaW5lc1swXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRGcm9tID0gb2xkUmFuZ2Uuc3RhcnQuY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RnJvbSA9IG5ld1JhbmdlLnN0YXJ0LmNvbHVtbjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZShyZXNwb25zZUxpbmUsIChzcGFuOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRMaW5lIDwgbGluZXNbMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG9sZEZyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gb2xkRnJvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gbmV3RnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBuZXdGcm9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWFjaChsaW5lcywgbGluZSA9PiB7IHRoaXMucmVzcG9uc2VzLmRlbGV0ZShsaW5lKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRlbHRhID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5ldyBsaW5lXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGNvdW50IC0gMTsgaSA+IGVuZDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlc3BvbnNlcy5oYXMoaSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpICsgZGVsdGEsIHRoaXMucmVzcG9uc2VzLmdldChpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5kZWxldGUoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlbHRhIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZWQgbGluZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gZWRpdG9yLmdldExpbmVDb3VudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFic0RlbHRhID0gTWF0aC5hYnMoZGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBlbmQ7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlc3BvbnNlcy5oYXMoaSArIGFic0RlbHRhKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGksIHRoaXMucmVzcG9uc2VzLmdldChpICsgYWJzRGVsdGEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLmRlbGV0ZShpICsgYWJzRGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFJlc3BvbnNlcyh2YWx1ZTogTW9kZWxzLkhpZ2hsaWdodFNwYW5bXSwgZW5hYmxlRXhjbHVkZUNvZGU6IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCByZXN1bHRzID0gY2hhaW4odmFsdWUpO1xyXG5cclxuICAgICAgICBjb25zdCBncm91cGVkSXRlbXMgPSA8YW55PnJlc3VsdHMubWFwKGhpZ2hsaWdodCA9PiByYW5nZShoaWdobGlnaHQuU3RhcnRMaW5lLCBoaWdobGlnaHQuRW5kTGluZSArIDEpXHJcbiAgICAgICAgICAgIC5tYXAobGluZSA9PiAoeyBsaW5lLCBoaWdobGlnaHQgfSkpKVxyXG4gICAgICAgICAgICAuZmxhdHRlbjx7IGxpbmU6IG51bWJlcjsgaGlnaGxpZ2h0OiBNb2RlbHMuSGlnaGxpZ2h0U3BhbiB9PigpXHJcbiAgICAgICAgICAgIC5ncm91cEJ5KHogPT4gei5saW5lKVxyXG4gICAgICAgICAgICAudmFsdWUoKTtcclxuXHJcbiAgICAgICAgZWFjaChncm91cGVkSXRlbXMsIChpdGVtOiB7IGhpZ2hsaWdodDogTW9kZWxzLkhpZ2hsaWdodFNwYW4gfVtdLCBrZXk6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBsZXQgayA9ICtrZXksIG1hcHBlZEl0ZW0gPSBpdGVtLm1hcCh4ID0+IHguaGlnaGxpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZW5hYmxlRXhjbHVkZUNvZGUgfHwgc29tZShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSAmJiBldmVyeShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIgfHwgaS5LaW5kID09PSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBtYXBwZWRJdGVtID0gbWFwcGVkSXRlbS5maWx0ZXIoeiA9PiB6LktpbmQgIT09IFwiZXhjbHVkZWQgY29kZVwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMoaykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChrLCBtYXBwZWRJdGVtKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplLnB1c2goayk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUxpbmUgPSB0aGlzLnJlc3BvbnNlcy5nZXQoayk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lLmxlbmd0aCAhPT0gbWFwcGVkSXRlbS5sZW5ndGggfHwgc29tZShyZXNwb25zZUxpbmUsIChsLCBpKSA9PiAhaXNFcXVhbChsLCBtYXBwZWRJdGVtW2ldKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUucHVzaChrKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuLyogdHNsaW50OmRpc2FibGU6bWVtYmVyLWFjY2VzcyAqL1xyXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmV4dGVuZChHcmFtbWFyLnByb3RvdHlwZSwgQXRvbUdyYW1tYXIucHJvdG90eXBlKTtcclxuXHJcbkdyYW1tYXIucHJvdG90eXBlW1wib21uaXNoYXJwXCJdID0gdHJ1ZTtcclxuR3JhbW1hci5wcm90b3R5cGVbXCJ0b2tlbml6ZUxpbmVcIl0gPSBmdW5jdGlvbihsaW5lOiBzdHJpbmcsIHJ1bGVTdGFjazogYW55W10sIGZpcnN0TGluZSA9IGZhbHNlKTogeyB0YWdzOiBudW1iZXJbXTsgcnVsZVN0YWNrOiBhbnkgfSB7XHJcbiAgICBjb25zdCBiYXNlUmVzdWx0ID0gQXRvbUdyYW1tYXIucHJvdG90eXBlLnRva2VuaXplTGluZS5jYWxsKHRoaXMsIGxpbmUsIHJ1bGVTdGFjaywgZmlyc3RMaW5lKTtcclxuICAgIGxldCB0YWdzOiBhbnlbXTtcclxuXHJcbiAgICBpZiAodGhpcy5yZXNwb25zZXMpIHtcclxuICAgICAgICBjb25zdCByb3cgPSB0aGlzW1wiX19yb3dfX1wiXTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMocm93KSkgcmV0dXJuIGJhc2VSZXN1bHQ7XHJcblxyXG4gICAgICAgIGNvbnN0IGhpZ2hsaWdodHMgPSB0aGlzLnJlc3BvbnNlcy5nZXQocm93KTtcclxuICAgICAgICAvLyBFeGNsdWRlZCBjb2RlIGJsb3dzIGF3YXkgYW55IG90aGVyIGZvcm1hdHRpbmcsIG90aGVyd2lzZSB3ZSBnZXQgaW50byBhIHZlcnkgd2VpcmQgc3RhdGUuXHJcbiAgICAgICAgaWYgKGhpZ2hsaWdodHNbMF0gJiYgaGlnaGxpZ2h0c1swXS5LaW5kID09PSBcImV4Y2x1ZGVkIGNvZGVcIikge1xyXG4gICAgICAgICAgICB0YWdzID0gW2xpbmUubGVuZ3RoXTtcclxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHRzWzBdLCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xyXG4gICAgICAgICAgICBiYXNlUmVzdWx0LnJ1bGVTdGFjayA9IFtiYXNlUmVzdWx0LnJ1bGVTdGFja1swXV07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGFncyA9IHRoaXMuZ2V0Q3NUb2tlbnNGb3JMaW5lKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIGJhc2VSZXN1bHQudGFncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJhc2VSZXN1bHQudGFncyA9IHRhZ3M7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYmFzZVJlc3VsdDtcclxufTtcclxuXHJcbihHcmFtbWFyLnByb3RvdHlwZSBhcyBhbnkpLmdldENzVG9rZW5zRm9yTGluZSA9IGZ1bmN0aW9uKGhpZ2hsaWdodHM6IE1vZGVscy5IaWdobGlnaHRTcGFuW10sIGxpbmU6IHN0cmluZywgcm93OiBudW1iZXIsIHJ1bGVTdGFjazogYW55W10sIGZpcnN0TGluZTogYm9vbGVhbiwgdGFnczogbnVtYmVyW10pIHtcclxuICAgIHJ1bGVTdGFjayA9IFt7IHJ1bGU6IHRoaXMuZ2V0SW5pdGlhbFJ1bGUoKSB9XTtcclxuXHJcbiAgICBlYWNoKGhpZ2hsaWdodHMsIChoaWdobGlnaHQpID0+IHtcclxuICAgICAgICBjb25zdCBzdGFydCA9IGhpZ2hsaWdodC5TdGFydENvbHVtbiAtIDE7XHJcbiAgICAgICAgY29uc3QgZW5kID0gaGlnaGxpZ2h0LkVuZENvbHVtbiAtIDE7XHJcblxyXG4gICAgICAgIGlmIChoaWdobGlnaHQuRW5kTGluZSA+IGhpZ2hsaWdodC5TdGFydExpbmUgJiYgaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uID09PSAwICYmIGhpZ2hsaWdodC5FbmRDb2x1bW4gPT09IDApIHtcclxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIDAsIHRhZ3MubGVuZ3RoIC0gMSwgbGluZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkaXN0YW5jZSA9IC0xO1xyXG4gICAgICAgIGxldCBpbmRleCA9IC0xO1xyXG4gICAgICAgIGxldCBpOiBudW1iZXI7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgKyB0YWdzW2ldID4gc3RhcnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkaXN0YW5jZSArPSB0YWdzW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzdHIgPSBsaW5lLnN1YnN0cmluZyhzdGFydCwgZW5kKTtcclxuICAgICAgICBjb25zdCBzaXplID0gZW5kIC0gc3RhcnQ7XHJcbiAgICAgICAgaWYgKHRhZ3NbaW5kZXhdID49IHNpemUpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlczogbnVtYmVyW107XHJcbiAgICAgICAgICAgIGxldCBwcmV2OiBudW1iZXIsIG5leHQ6IG51bWJlcjtcclxuICAgICAgICAgICAgaWYgKGRpc3RhbmNlID09PSBzdGFydCkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWVzID0gW3NpemUsIHRhZ3NbaW5kZXhdIC0gc2l6ZV07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwcmV2ID0gc3RhcnQgLSBkaXN0YW5jZTtcclxuICAgICAgICAgICAgICAgIG5leHQgPSB0YWdzW2luZGV4XSAtIHNpemUgLSBwcmV2O1xyXG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gW3ByZXYsIHNpemUsIHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXZdO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbcHJldiwgc2l6ZV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGFncy5zcGxpY2UoaW5kZXgsIDEsIC4uLnZhbHVlcyk7XHJcbiAgICAgICAgICAgIGlmIChwcmV2KSBpbmRleCA9IGluZGV4ICsgMTtcclxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGluZGV4LCBpbmRleCArIDEsIHN0cik7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0YWdzW2luZGV4XSA8IHNpemUpIHtcclxuICAgICAgICAgICAgbGV0IGJhY2t0cmFja0luZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tEaXN0YW5jZSA9IDA7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IGJhY2t0cmFja0luZGV4OyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrRGlzdGFuY2UgKz0gdGFnc1tpXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYmFja3RyYWNrRGlzdGFuY2UgPj0gc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGkgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgZm9yd2FyZHRyYWNrSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgbGV0IHJlbWFpbmluZ1NpemUgPSBzaXplO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSBpbmRleCArIDE7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHJlbWFpbmluZ1NpemUgPD0gMCAmJiB0YWdzW2ldID4gMCkvKiB8fCB0YWdzW2ldICUgMiA9PT0gLTEqLykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gaSAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmdTaXplIC09IHRhZ3NbaV07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSGFuZGxlcyBjYXNlIHdoZXJlIHRoZXJlIGlzIGEgY2xvc2luZyB0YWdcclxuICAgICAgICAgICAgICAgICAgICAvLyBidXQgbm8gb3BlbmluZyB0YWcgaGVyZS5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgb3BlbkZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IGk7IGggPj0gMDsgaC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWdzW2hdID09PSB0YWdzW2ldICsgMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghb3BlbkZvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gaSAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGkgPT09IHRhZ3MubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IHRhZ3MubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGJhY2t0cmFja0luZGV4LCBmb3J3YXJkdHJhY2tJbmRleCwgc3RyKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gdGFncztcclxufTtcclxuXHJcbmNvbnN0IGdldElkRm9yU2NvcGUgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCBpZHM6IHsgW2tleTogc3RyaW5nXTogeyBba2V5OiBzdHJpbmddOiBudW1iZXIgfTsgfSA9IHt9O1xyXG4gICAgY29uc3QgZ3JhbW1hcnM6IGFueSA9IHt9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyTmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9IGZpbmQoYXRvbS5ncmFtbWFycy5nZXRHcmFtbWFycygpLCBnYW1tciA9PiBnYW1tci5uYW1lID09PSBncmFtbWFyTmFtZSk7XHJcbiAgICAgICAgaWYgKCFncmFtbWFyKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlkc1tncmFtbWFyLm5hbWVdID0ge307XHJcbiAgICAgICAgZ3JhbW1hcnNbZ3JhbW1hci5uYW1lXSA9IGdyYW1tYXI7XHJcblxyXG4gICAgICAgIGVhY2goZ3JhbW1hci5yZWdpc3RyeS5zY29wZXNCeUlkLCAodmFsdWU6IHN0cmluZywga2V5OiBhbnkpID0+IHsgaWRzW2dyYW1tYXIubmFtZV1bdmFsdWVdID0gK2tleTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWV0aG9kID0gKGdyYW1tYXI6IHN0cmluZywgc2NvcGU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIGlmICghaWRzW2dyYW1tYXJdKSB7XHJcbiAgICAgICAgICAgIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaWRzW2dyYW1tYXJdW3Njb3BlXSlcclxuICAgICAgICAgICAgaWRzW2dyYW1tYXJdW3Njb3BlXSA9IGdyYW1tYXJzW2dyYW1tYXJdLnJlZ2lzdHJ5LnN0YXJ0SWRGb3JTY29wZShzY29wZSk7XHJcblxyXG4gICAgICAgIHJldHVybiAraWRzW2dyYW1tYXJdW3Njb3BlXTtcclxuICAgIH07XHJcblxyXG4gICAgKDxhbnk+bWV0aG9kKS5lbmQgPSAoc2NvcGU6IG51bWJlcikgPT4gK3Njb3BlIC0gMTtcclxuXHJcbiAgICByZXR1cm4gPHsgKGdyYW1tYXI6IHN0cmluZywgc2NvcGU6IHN0cmluZyk6IG51bWJlcjsgZW5kOiAoc2NvcGU6IG51bWJlcikgPT4gbnVtYmVyOyB9Pm1ldGhvZDtcclxufSkoKTtcclxuXHJcblxyXG4vLy8gTk9URTogYmVzdCB3YXkgSSBoYXZlIGZvdW5kIGZvciB0aGVzZSBpcyB0byBqdXN0IGxvb2sgYXQgdGhlbWUgXCJsZXNzXCIgZmlsZXNcclxuLy8gQWx0ZXJuYXRpdmVseSBqdXN0IGluc3BlY3QgdGhlIHRva2VuIGZvciBhIC5qcyBmaWxlXHJcbmZ1bmN0aW9uIGdldEF0b21TdHlsZUZvclRva2VuKGdyYW1tYXI6IHN0cmluZywgdGFnczogbnVtYmVyW10sIHRva2VuOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbiwgaW5kZXg6IG51bWJlciwgaW5kZXhFbmQ6IG51bWJlciwgc3RyOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IHByZXZpb3VzU2NvcGVzOiBhbnlbXSA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IGluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICBpZiAodGFnc1tpXSA+IDApXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2godGFnc1tpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVwbGFjZW1lbnRzOiB7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyOyByZXBsYWNlbWVudDogbnVtYmVyW10gfVtdID0gW107XHJcbiAgICBjb25zdCBvcGVuczogeyB0YWc6IG51bWJlcjsgaW5kZXg6IG51bWJlciB9W10gPSBbXTtcclxuICAgIGNvbnN0IGNsb3NlczogdHlwZW9mIG9wZW5zID0gW107XHJcblxyXG4gICAgLy8gU2NhbiBmb3IgYW55IHVuY2xvc2VkIG9yIHVub3BlbmVkIHRhZ3NcclxuICAgIGZvciAobGV0IGkgPSBpbmRleDsgaSA8IGluZGV4RW5kOyBpKyspIHtcclxuICAgICAgICBpZiAodGFnc1tpXSA+IDApIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBvcGVuSW5kZXggPSBmaW5kSW5kZXgob3BlbnMsIHggPT4geC50YWcgPT09ICh0YWdzW2ldICsgMSkpO1xyXG4gICAgICAgICAgICBpZiAob3BlbkluZGV4ID4gLTEpIHtcclxuICAgICAgICAgICAgICAgIG9wZW5zLnNwbGljZShvcGVuSW5kZXgsIDEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY2xvc2VzLnB1c2goeyB0YWc6IHRhZ3NbaV0sIGluZGV4OiBpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgb3BlbnMudW5zaGlmdCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCB1bmZ1bGxmaWxsZWQ6IHR5cGVvZiBvcGVucyA9IFtdO1xyXG4gICAgaWYgKGNsb3Nlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdW5mdWxsZmlsbGVkID0gc29ydEJ5KG9wZW5zLmNvbmNhdChjbG9zZXMpLCB4ID0+IHguaW5kZXgpO1xyXG4gICAgfSBlbHNlIGlmIChvcGVucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgLy8gR3JhYiB0aGUgbGFzdCBrbm93biBvcGVuLCBhbmQgYXBwZW5kIGZyb20gdGhlcmVcclxuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBvcGVuc1tvcGVucy5sZW5ndGggLSAxXS5pbmRleCxcclxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2Uob3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsIGluZGV4RW5kICsgMSlcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgaW50ZXJuYWxJbmRleCA9IGluZGV4O1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmZ1bGxmaWxsZWQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCB2ID0gdW5mdWxsZmlsbGVkW2ldO1xyXG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogdi5pbmRleCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW50ZXJuYWxJbmRleCwgdi5pbmRleClcclxuICAgICAgICB9KTtcclxuICAgICAgICBpbnRlcm5hbEluZGV4ID0gdi5pbmRleCArIDE7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlcGxhY2VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBpbmRleCxcclxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW5kZXgsIGluZGV4RW5kKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvKnJlcGxhY2VtZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXHJcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGludGVybmFsSW5kZXgsIGluZGV4RW5kKVxyXG4gICAgICAgIH0pOyovXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkKHNjb3BlOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBpZCA9IGdldElkRm9yU2NvcGUoZ3JhbW1hciwgc2NvcGUpO1xyXG4gICAgICAgIGlmIChpZCA9PT0gLTEpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKCFzb21lKHByZXZpb3VzU2NvcGVzLCB6ID0+IHogPT09IGlkKSkge1xyXG4gICAgICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKGlkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gY3R4LnJlcGxhY2VtZW50O1xyXG4gICAgICAgICAgICByZXBsYWNlbWVudC51bnNoaWZ0KGlkKTtcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQucHVzaChnZXRJZEZvclNjb3BlLmVuZChpZCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgc3dpdGNoICh0b2tlbi5LaW5kKSB7XHJcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxyXG4gICAgICAgICAgICBhZGQoYGNvbnN0YW50Lm51bWVyaWNgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcInN0cnVjdCBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuc3RydWN0YCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJlbnVtIG5hbWVcIjpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNvbnN0YW50Lm51bWVyaWMuaWRlbnRpZmllci5lbnVtYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6XHJcbiAgICAgICAgICAgIGFkZChgaWRlbnRpZmllcmApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiY2xhc3MgbmFtZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJkZWxlZ2F0ZSBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXIuZGVsZWdhdGVgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImludGVyZmFjZSBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXIuaW50ZXJmYWNlYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiOlxyXG4gICAgICAgICAgICBhZGQoYGNvbnN0YW50Lm90aGVyLnN5bWJvbGApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiZXhjbHVkZWQgY29kZVwiOlxyXG4gICAgICAgICAgICBhZGQoYGNvbW1lbnQuYmxvY2tgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcInVudXNlZCBjb2RlXCI6XHJcbiAgICAgICAgICAgIGFkZChgdW51c2VkYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidW5oYW5kbGVkIEtpbmQgXCIgKyB0b2tlbi5LaW5kKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcblxyXG4gICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XHJcbiAgICAgICAgY29uc3Qge3JlcGxhY2VtZW50LCBlbmQsIHN0YXJ0fSA9IGN0eDtcclxuICAgICAgICBpZiAocmVwbGFjZW1lbnQubGVuZ3RoID09PSAyKSByZXR1cm47XHJcbiAgICAgICAgbGV0IG51bSA9IGVuZCAtIHN0YXJ0O1xyXG4gICAgICAgIGlmIChudW0gPD0gMCkge1xyXG4gICAgICAgICAgICBudW0gPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0YWdzLnNwbGljZShzdGFydCwgbnVtLCAuLi5yZXBsYWNlbWVudCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0R3JhbW1hcihncmFtbWFyOiBGaXJzdE1hdGUuR3JhbW1hcik6IEZpcnN0TWF0ZS5HcmFtbWFyIHtcclxuICAgIGNvbnN0IGcyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKHRoaXMsIGdyYW1tYXIpO1xyXG4gICAgaWYgKGcyICE9PSBncmFtbWFyKVxyXG4gICAgICAgIHRoaXMuX3NldEdyYW1tYXIoZzIpO1xyXG4gICAgcmV0dXJuIGcyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5oYW5jZWRHcmFtbWFyKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBncmFtbWFyPzogRmlyc3RNYXRlLkdyYW1tYXIsIG9wdGlvbnM/OiB7IHJlYWRvbmx5OiBib29sZWFuIH0pIHtcclxuICAgIGlmICghZ3JhbW1hcikgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XHJcbiAgICBpZiAoIWdyYW1tYXJbXCJvbW5pc2hhcnBcIl0gJiYgT21uaS5pc1ZhbGlkR3JhbW1hcihncmFtbWFyKSkge1xyXG4gICAgICAgIGNvbnN0IG5ld0dyYW1tYXIgPSBuZXcgR3JhbW1hcihlZGl0b3IsIGdyYW1tYXIsIG9wdGlvbnMpO1xyXG4gICAgICAgIGVhY2goZ3JhbW1hciwgKHgsIGkpID0+IGhhcyhncmFtbWFyLCBpKSAmJiAobmV3R3JhbW1hcltpXSA9IHgpKTtcclxuICAgICAgICBncmFtbWFyID0gPGFueT5uZXdHcmFtbWFyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGdyYW1tYXI7XHJcbn1cclxuXHJcbi8vIFVzZWQgdG8gY2FjaGUgdmFsdWVzIGZvciBzcGVjaWZpYyBlZGl0b3JzXHJcbmNsYXNzIFVudXNlZE1hcCB7XHJcbiAgICBwcml2YXRlIF9tYXAgPSBuZXcgTWFwPHN0cmluZywgT2JzZXJ2YWJsZTxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+PigpO1xyXG4gICAgcHVibGljIGdldChrZXk6IHN0cmluZykge1xyXG4gICAgICAgIGlmICghdGhpcy5fbWFwLmhhcyhrZXkpKSB0aGlzLl9tYXAuc2V0KGtleSwgPGFueT5uZXcgQmVoYXZpb3JTdWJqZWN0PE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4oW10pKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLmdldChrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldE9ic2VydmVyKGtleTogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIDxTdWJzY3JpYmVyPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4gJiB7IGdldFZhbHVlKCk6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSB9Pjxhbnk+dGhpcy5nZXQoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0KGtleTogc3RyaW5nLCB2YWx1ZT86IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSkge1xyXG4gICAgICAgIGNvbnN0IG8gPSB0aGlzLl9nZXRPYnNlcnZlcihrZXkpO1xyXG4gICAgICAgIGlmICghaXNFcXVhbChvLmdldFZhbHVlKCksIHZhbHVlKSkge1xyXG4gICAgICAgICAgICBvLm5leHQodmFsdWUgfHwgW10pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGVsZXRlKGtleTogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX21hcC5oYXMoa2V5KSlcclxuICAgICAgICAgICAgdGhpcy5fbWFwLmRlbGV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9tYXAuY2xlYXIoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGVuaGFuY2VkSGlnaGxpZ2h0aW5nID0gbmV3IEhpZ2hsaWdodDtcclxuIiwiaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgaXNPbW5pc2hhcnBUZXh0RWRpdG9yIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcbmltcG9ydCB7IGVhY2gsIGV4dGVuZCwgaGFzLCBzb21lLCByYW5nZSwgcmVtb3ZlLCBwdWxsLCBmaW5kLCBjaGFpbiwgdW5pcSwgZmluZEluZGV4LCBldmVyeSwgaXNFcXVhbCwgbWluLCBkZWJvdW5jZSwgc29ydEJ5LCB1bmlxdWVJZCwgZmlsdGVyIH0gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCwgUmVwbGF5U3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJDb250ZXh0SXRlbSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XG5jb25zdCBBdG9tR3JhbW1hciA9IHJlcXVpcmUoYXRvbS5jb25maWcucmVzb3VyY2VQYXRoICsgXCIvbm9kZV9tb2R1bGVzL2ZpcnN0LW1hdGUvbGliL2dyYW1tYXIuanNcIik7XG5jb25zdCBERUJPVU5DRV9USU1FID0gMjQwO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmNvbnN0IEhJR0hMSUdIVCA9IFwiSElHSExJR0hUXCIsIEhJR0hMSUdIVF9SRVFVRVNUID0gXCJISUdITElHSFRfUkVRVUVTVFwiO1xuZnVuY3Rpb24gZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKHBhdGgsIHF1aWNrRml4ZXMsIHByb2plY3ROYW1lcykge1xuICAgIHJldHVybiBjaGFpbihxdWlja0ZpeGVzKVxuICAgICAgICAuZmlsdGVyKHggPT4geC5GaWxlTmFtZSA9PT0gcGF0aClcbiAgICAgICAgLm1hcCh4ID0+ICh7XG4gICAgICAgIFN0YXJ0TGluZTogeC5MaW5lLFxuICAgICAgICBTdGFydENvbHVtbjogeC5Db2x1bW4sXG4gICAgICAgIEVuZExpbmU6IHguRW5kTGluZSxcbiAgICAgICAgRW5kQ29sdW1uOiB4LkVuZENvbHVtbixcbiAgICAgICAgS2luZDogXCJ1bnVzZWQgY29kZVwiLFxuICAgICAgICBQcm9qZWN0czogcHJvamVjdE5hbWVzXG4gICAgfSkpXG4gICAgICAgIC52YWx1ZSgpO1xufVxuZXhwb3J0IGNvbnN0IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMgPSBbXG4gICAgMixcbiAgICAzLFxuICAgIDUsXG4gICAgNCxcbiAgICA2XG5dO1xuY2xhc3MgSGlnaGxpZ2h0IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cyA9IG5ldyBVbnVzZWRNYXAoKTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJFbmhhbmNlZCBIaWdobGlnaHRpbmdcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiRW5hYmxlcyBzZXJ2ZXIgYmFzZWQgaGlnaGxpZ2h0aW5nLCB3aGljaCBpbmNsdWRlcyBzdXBwb3J0IGZvciBzdHJpbmcgaW50ZXJwb2xhdGlvbiwgY2xhc3MgbmFtZXMgYW5kIG1vcmUuXCI7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IGZhbHNlO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgaWYgKE9tbmkuYXRvbVZlcnNpb24ubWlub3IgPT09IDEgJiYgT21uaS5hdG9tVmVyc2lvbi5taW5vciA8PSA4KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5lZGl0b3JzID0gW107XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQocmVnaXN0ZXJDb250ZXh0SXRlbShISUdITElHSFRfUkVRVUVTVCwgKGNvbnRleHQpID0+IG5ldyBTdWJqZWN0KCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChyZWdpc3RlckNvbnRleHRJdGVtKEhJR0hMSUdIVCwgKGNvbnRleHQsIGVkaXRvcikgPT4gY29udGV4dC5nZXQoSElHSExJR0hUX1JFUVVFU1QpXG4gICAgICAgICAgICAuc3RhcnRXaXRoKHRydWUpXG4gICAgICAgICAgICAuc3dpdGNoTWFwKCgpID0+IE9ic2VydmFibGUuZGVmZXIoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvamVjdHMgPSBjb250ZXh0LnByb2plY3QuYWN0aXZlRnJhbWV3b3JrLk5hbWUgPT09IFwiYWxsXCIgPyBbXSA6IFtjb250ZXh0LnByb2plY3QuYWN0aXZlRnJhbWV3b3JrLk5hbWVdO1xuICAgICAgICAgICAgbGV0IGxpbmVzVG9GZXRjaCA9IHVuaXEoZWRpdG9yLmdldEdyYW1tYXIoKS5saW5lc1RvRmV0Y2gpO1xuICAgICAgICAgICAgaWYgKCFsaW5lc1RvRmV0Y2ggfHwgIWxpbmVzVG9GZXRjaC5sZW5ndGgpXG4gICAgICAgICAgICAgICAgbGluZXNUb0ZldGNoID0gW107XG4gICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLnNldChlZGl0b3IuZ2V0UGF0aCgpLCBbXSk7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KHRoaXMudW51c2VkQ29kZVJvd3MuZ2V0KGVkaXRvci5nZXRQYXRoKCkpLCBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5oaWdobGlnaHQoe1xuICAgICAgICAgICAgICAgIFByb2plY3ROYW1lczogcHJvamVjdHMsXG4gICAgICAgICAgICAgICAgTGluZXM6IGxpbmVzVG9GZXRjaCxcbiAgICAgICAgICAgICAgICBFeGNsdWRlQ2xhc3NpZmljYXRpb25zXG4gICAgICAgICAgICB9KSksIChxdWlja2ZpeGVzLCByZXNwb25zZSkgPT4gKHtcbiAgICAgICAgICAgICAgICBlZGl0b3IsXG4gICAgICAgICAgICAgICAgcHJvamVjdHMsXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0czogKHJlc3BvbnNlID8gcmVzcG9uc2UuSGlnaGxpZ2h0cyA6IFtdKS5jb25jYXQoZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKGVkaXRvci5nZXRQYXRoKCksIHF1aWNrZml4ZXMsIHByb2plY3RzKSlcbiAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgIC5kbygoeyBoaWdobGlnaHRzIH0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5zZXRSZXNwb25zZXMoaGlnaGxpZ2h0cywgcHJvamVjdHMubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKVxuICAgICAgICAgICAgICAgIC5yZWZDb3VudCgpO1xuICAgICAgICB9KSkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLm1vZGVsLmRpYWdub3N0aWNzQnlGaWxlXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGNoYW5nZXMgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgW2ZpbGUsIGRpYWdub3N0aWNzXSBvZiBjaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5zZXQoZmlsZSwgZmlsdGVyKGRpYWdub3N0aWNzLCB4ID0+IHguTG9nTGV2ZWwgPT09IFwiSGlkZGVuXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZWFjaEVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXR1cEVkaXRvcihlZGl0b3IsIGNkKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub21uaXNoYXJwXG4gICAgICAgICAgICAgICAgLmdldChISUdITElHSFQpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldChISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldChISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcbiAgICAgICAgICAgIGlmIChlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0pIHtcbiAgICAgICAgICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MuY2xlYXIoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICBpZiAodGhpcy5kaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldHVwRWRpdG9yKGVkaXRvciwgZGlzcG9zYWJsZSkge1xuICAgICAgICBpZiAoZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0gfHwgIWVkaXRvci5nZXRHcmFtbWFyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBpc3N1ZVJlcXVlc3QgPSBlZGl0b3Iub21uaXNoYXJwLmdldChISUdITElHSFRfUkVRVUVTVCk7XG4gICAgICAgIGF1Z21lbnRFZGl0b3IoZWRpdG9yLCB0aGlzLnVudXNlZENvZGVSb3dzLCB0cnVlKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5kZWxldGUoZWRpdG9yLmdldFBhdGgoKSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5lZGl0b3JzLnB1c2goZWRpdG9yKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNwb3NhYmxlKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5saW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcigpLnJlc3BvbnNlcylcbiAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnJlc3BvbnNlcy5jbGVhcigpO1xuICAgICAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcygpO1xuICAgICAgICAgICAgZGVsZXRlIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICBwdWxsKHRoaXMuZWRpdG9ycywgZWRpdG9yKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnByb2plY3RcbiAgICAgICAgICAgIC5vYnNlcnZlLmFjdGl2ZUZyYW1ld29ya1xuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzLmNsZWFyKCk7XG4gICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoKCkgPT4gaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSkpKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkU2F2ZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvblxuICAgICAgICAgICAgLndoZW5Db25uZWN0ZWQoKVxuICAgICAgICAgICAgLmRlbGF5KDEwMDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudEVkaXRvcihlZGl0b3IsIHVudXNlZENvZGVSb3dzID0gbnVsbCwgZG9TZXRHcmFtbWFyID0gZmFsc2UpIHtcbiAgICBpZiAoIWVkaXRvcltcIl9vbGRHcmFtbWFyXCJdKVxuICAgICAgICBlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgaWYgKCFlZGl0b3JbXCJfc2V0R3JhbW1hclwiXSlcbiAgICAgICAgZWRpdG9yW1wiX3NldEdyYW1tYXJcIl0gPSBlZGl0b3Iuc2V0R3JhbW1hcjtcbiAgICBpZiAoIWVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXSlcbiAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdID0gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0O1xuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXSlcbiAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXSA9IGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGU7XG4gICAgaWYgKCFlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdKVxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdID0gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcztcbiAgICBpZiAoIWVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl90b2tlbml6ZUluQmFja2dyb3VuZFwiXSlcbiAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX3Rva2VuaXplSW5CYWNrZ3JvdW5kXCJdID0gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnRva2VuaXplSW5CYWNrZ3JvdW5kO1xuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX2NodW5rU2l6ZVwiXSlcbiAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiY2h1bmtTaXplXCJdID0gMjA7XG4gICAgZWRpdG9yLnNldEdyYW1tYXIgPSBzZXRHcmFtbWFyO1xuICAgIGlmIChkb1NldEdyYW1tYXIpXG4gICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpO1xuICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dCA9IGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKVtcIl9fcm93X19cIl0gPSByb3c7XG4gICAgICAgIHJldHVybiBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnNpbGVudFJldG9rZW5pemVMaW5lcykge1xuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIuc2lsZW50UmV0b2tlbml6ZUxpbmVzID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xuICAgICAgICAgICAgbGV0IGxhc3RSb3c7XG4gICAgICAgICAgICBsYXN0Um93ID0gdGhpcy5idWZmZXIuZ2V0TGFzdFJvdygpO1xuICAgICAgICAgICAgdGhpcy50b2tlbml6ZWRMaW5lcyA9IHRoaXMuYnVpbGRQbGFjZWhvbGRlclRva2VuaXplZExpbmVzRm9yUm93cygwLCBsYXN0Um93KTtcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZFJvd3MgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmxpbmVzVG9Ub2tlbml6ZSAmJiB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3cobWluKHRoaXMubGluZXNUb1Rva2VuaXplKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3coMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZ1bGx5VG9rZW5pemVkID0gZmFsc2U7XG4gICAgICAgIH0sIERFQk9VTkNFX1RJTUUsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgfVxuICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcbiAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XG4gICAgICAgIHJldHVybiBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcpXG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KGZhbHNlKTtcbiAgICAgICAgcmV0dXJuIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci50b2tlbml6ZUluQmFja2dyb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZpc2libGUgfHwgdGhpcy5wZW5kaW5nQ2h1bmsgfHwgIXRoaXMuaXNBbGl2ZSgpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnBlbmRpbmdDaHVuayA9IHRydWU7XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0FsaXZlKCkgJiYgdGhpcy5idWZmZXIuaXNBbGl2ZSgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50b2tlbml6ZU5leHRDaHVuaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci5zY29wZXNGcm9tVGFncyA9IGZ1bmN0aW9uIChzdGFydGluZ1Njb3BlcywgdGFncykge1xuICAgICAgICBjb25zdCBzY29wZXMgPSBzdGFydGluZ1Njb3Blcy5zbGljZSgpO1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRhZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRhZyA9IHRhZ3NbaV07XG4gICAgICAgICAgICBpZiAodGFnIDwgMCkge1xuICAgICAgICAgICAgICAgIGlmICgodGFnICUgMikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3Blcy5wdXNoKHRhZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGluZ1N0YXJ0VGFnID0gdGFnICsgMTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMucG9wKCkgPT09IG1hdGNoaW5nU3RhcnRUYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2goZ3JhbW1hci5zdGFydElkRm9yU2NvcGUoYC4ke2dyYW1tYXIuc2NvcGVOYW1lfWApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oXCJFbmNvdW50ZXJlZCBhbiB1bm1hdGNoZWQgc2NvcGUgZW5kIHRhZy5cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogZWRpdG9yLmJ1ZmZlci5nZXRQYXRoKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW1tYXJTY29wZU5hbWU6IGdyYW1tYXIuc2NvcGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVubWF0Y2hlZEVuZFRhZzogZ3JhbW1hci5zY29wZUZvcklkKHRhZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnNldFJlc3BvbnNlcyhbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVudXNlZENvZGVSb3dzICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocm93cyA9PiBlZGl0b3IuZ2V0R3JhbW1hcigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0UmVzcG9uc2VzKGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCByb3dzLCBbXSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlcztcbiAgICB9O1xufVxuY2xhc3MgR3JhbW1hciB7XG4gICAgY29uc3RydWN0b3IoZWRpdG9yLCBiYXNlLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2dpZCA9IHVuaXF1ZUlkKFwib2dcIik7XG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nID0gbmV3IFJlcGxheVN1YmplY3QoMSk7XG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLnJlc3BvbnNlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB7fTtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnJlYWRvbmx5KSB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkucHJlZW1wdERpZENoYW5nZSgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgb2xkUmFuZ2UsIG5ld1JhbmdlIH0gPSBlO1xuICAgICAgICAgICAgICAgIGxldCBzdGFydCA9IG9sZFJhbmdlLnN0YXJ0LnJvdywgZGVsdGEgPSBuZXdSYW5nZS5lbmQucm93IC0gb2xkUmFuZ2UuZW5kLnJvdztcbiAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0IC0gNTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnQgPCAwKVxuICAgICAgICAgICAgICAgICAgICBzdGFydCA9IDA7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5kID0gZWRpdG9yLmJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDE7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSByYW5nZShzdGFydCwgZW5kICsgMSk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5rZXlzKCkubmV4dCgpLmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2gucHVzaCguLi5saW5lcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGxpbmVzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkRnJvbSA9IG9sZFJhbmdlLnN0YXJ0LmNvbHVtbiwgbmV3RnJvbSA9IG5ld1JhbmdlLnN0YXJ0LmNvbHVtbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZShyZXNwb25zZUxpbmUsIChzcGFuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRMaW5lIDwgbGluZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG9sZEZyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gb2xkRnJvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gbmV3RnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBuZXdGcm9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWFjaChsaW5lcywgbGluZSA9PiB7IHRoaXMucmVzcG9uc2VzLmRlbGV0ZShsaW5lKTsgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkZWx0YSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBjb3VudCAtIDE7IGkgPiBlbmQ7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VzLmhhcyhpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpICsgZGVsdGEsIHRoaXMucmVzcG9uc2VzLmdldChpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWJzRGVsdGEgPSBNYXRoLmFicyhkZWx0YSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBlbmQ7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkgKyBhYnNEZWx0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaSwgdGhpcy5yZXNwb25zZXMuZ2V0KGkgKyBhYnNEZWx0YSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLmRlbGV0ZShpICsgYWJzRGVsdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0UmVzcG9uc2VzKHZhbHVlLCBlbmFibGVFeGNsdWRlQ29kZSkge1xuICAgICAgICBjb25zdCByZXN1bHRzID0gY2hhaW4odmFsdWUpO1xuICAgICAgICBjb25zdCBncm91cGVkSXRlbXMgPSByZXN1bHRzLm1hcChoaWdobGlnaHQgPT4gcmFuZ2UoaGlnaGxpZ2h0LlN0YXJ0TGluZSwgaGlnaGxpZ2h0LkVuZExpbmUgKyAxKVxuICAgICAgICAgICAgLm1hcChsaW5lID0+ICh7IGxpbmUsIGhpZ2hsaWdodCB9KSkpXG4gICAgICAgICAgICAuZmxhdHRlbigpXG4gICAgICAgICAgICAuZ3JvdXBCeSh6ID0+IHoubGluZSlcbiAgICAgICAgICAgIC52YWx1ZSgpO1xuICAgICAgICBlYWNoKGdyb3VwZWRJdGVtcywgKGl0ZW0sIGtleSkgPT4ge1xuICAgICAgICAgICAgbGV0IGsgPSAra2V5LCBtYXBwZWRJdGVtID0gaXRlbS5tYXAoeCA9PiB4LmhpZ2hsaWdodCk7XG4gICAgICAgICAgICBpZiAoIWVuYWJsZUV4Y2x1ZGVDb2RlIHx8IHNvbWUobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIikgJiYgZXZlcnkobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwiZXhjbHVkZWQgY29kZVwiIHx8IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSkge1xuICAgICAgICAgICAgICAgIG1hcHBlZEl0ZW0gPSBtYXBwZWRJdGVtLmZpbHRlcih6ID0+IHouS2luZCAhPT0gXCJleGNsdWRlZCBjb2RlXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMoaykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChrKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lLmxlbmd0aCAhPT0gbWFwcGVkSXRlbS5sZW5ndGggfHwgc29tZShyZXNwb25zZUxpbmUsIChsLCBpKSA9PiAhaXNFcXVhbChsLCBtYXBwZWRJdGVtW2ldKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXh0ZW5kKEdyYW1tYXIucHJvdG90eXBlLCBBdG9tR3JhbW1hci5wcm90b3R5cGUpO1xuR3JhbW1hci5wcm90b3R5cGVbXCJvbW5pc2hhcnBcIl0gPSB0cnVlO1xuR3JhbW1hci5wcm90b3R5cGVbXCJ0b2tlbml6ZUxpbmVcIl0gPSBmdW5jdGlvbiAobGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUgPSBmYWxzZSkge1xuICAgIGNvbnN0IGJhc2VSZXN1bHQgPSBBdG9tR3JhbW1hci5wcm90b3R5cGUudG9rZW5pemVMaW5lLmNhbGwodGhpcywgbGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUpO1xuICAgIGxldCB0YWdzO1xuICAgIGlmICh0aGlzLnJlc3BvbnNlcykge1xuICAgICAgICBjb25zdCByb3cgPSB0aGlzW1wiX19yb3dfX1wiXTtcbiAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMocm93KSlcbiAgICAgICAgICAgIHJldHVybiBiYXNlUmVzdWx0O1xuICAgICAgICBjb25zdCBoaWdobGlnaHRzID0gdGhpcy5yZXNwb25zZXMuZ2V0KHJvdyk7XG4gICAgICAgIGlmIChoaWdobGlnaHRzWzBdICYmIGhpZ2hsaWdodHNbMF0uS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIpIHtcbiAgICAgICAgICAgIHRhZ3MgPSBbbGluZS5sZW5ndGhdO1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHRzWzBdLCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xuICAgICAgICAgICAgYmFzZVJlc3VsdC5ydWxlU3RhY2sgPSBbYmFzZVJlc3VsdC5ydWxlU3RhY2tbMF1dO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGFncyA9IHRoaXMuZ2V0Q3NUb2tlbnNGb3JMaW5lKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIGJhc2VSZXN1bHQudGFncyk7XG4gICAgICAgIH1cbiAgICAgICAgYmFzZVJlc3VsdC50YWdzID0gdGFncztcbiAgICB9XG4gICAgcmV0dXJuIGJhc2VSZXN1bHQ7XG59O1xuR3JhbW1hci5wcm90b3R5cGUuZ2V0Q3NUb2tlbnNGb3JMaW5lID0gZnVuY3Rpb24gKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIHRhZ3MpIHtcbiAgICBydWxlU3RhY2sgPSBbeyBydWxlOiB0aGlzLmdldEluaXRpYWxSdWxlKCkgfV07XG4gICAgZWFjaChoaWdobGlnaHRzLCAoaGlnaGxpZ2h0KSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uIC0gMTtcbiAgICAgICAgY29uc3QgZW5kID0gaGlnaGxpZ2h0LkVuZENvbHVtbiAtIDE7XG4gICAgICAgIGlmIChoaWdobGlnaHQuRW5kTGluZSA+IGhpZ2hsaWdodC5TdGFydExpbmUgJiYgaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uID09PSAwICYmIGhpZ2hsaWdodC5FbmRDb2x1bW4gPT09IDApIHtcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaXN0YW5jZSA9IC0xO1xuICAgICAgICBsZXQgaW5kZXggPSAtMTtcbiAgICAgICAgbGV0IGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgKyB0YWdzW2ldID4gc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgKz0gdGFnc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdHIgPSBsaW5lLnN1YnN0cmluZyhzdGFydCwgZW5kKTtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IGVuZCAtIHN0YXJ0O1xuICAgICAgICBpZiAodGFnc1tpbmRleF0gPj0gc2l6ZSkge1xuICAgICAgICAgICAgbGV0IHZhbHVlcztcbiAgICAgICAgICAgIGxldCBwcmV2LCBuZXh0O1xuICAgICAgICAgICAgaWYgKGRpc3RhbmNlID09PSBzdGFydCkge1xuICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtzaXplLCB0YWdzW2luZGV4XSAtIHNpemVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJldiA9IHN0YXJ0IC0gZGlzdGFuY2U7XG4gICAgICAgICAgICAgICAgbmV4dCA9IHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXY7XG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplLCB0YWdzW2luZGV4XSAtIHNpemUgLSBwcmV2XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YWdzLnNwbGljZShpbmRleCwgMSwgLi4udmFsdWVzKTtcbiAgICAgICAgICAgIGlmIChwcmV2KVxuICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXggKyAxO1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGluZGV4LCBpbmRleCArIDEsIHN0cik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGFnc1tpbmRleF0gPCBzaXplKSB7XG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tEaXN0YW5jZSA9IDA7XG4gICAgICAgICAgICBmb3IgKGkgPSBiYWNrdHJhY2tJbmRleDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0Rpc3RhbmNlICs9IHRhZ3NbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrdHJhY2tEaXN0YW5jZSA+PSBzaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGkgKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZm9yd2FyZHRyYWNrSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGxldCByZW1haW5pbmdTaXplID0gc2l6ZTtcbiAgICAgICAgICAgIGZvciAoaSA9IGluZGV4ICsgMTsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoKHJlbWFpbmluZ1NpemUgPD0gMCAmJiB0YWdzW2ldID4gMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmdTaXplIC09IHRhZ3NbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBvcGVuRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IGk7IGggPj0gMDsgaC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFnc1toXSA9PT0gdGFnc1tpXSArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghb3BlbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IGkgLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA9PT0gdGFncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IHRhZ3MubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCBiYWNrdHJhY2tJbmRleCwgZm9yd2FyZHRyYWNrSW5kZXgsIHN0cik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdGFncztcbn07XG5jb25zdCBnZXRJZEZvclNjb3BlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBpZHMgPSB7fTtcbiAgICBjb25zdCBncmFtbWFycyA9IHt9O1xuICAgIGZ1bmN0aW9uIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyTmFtZSkge1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZmluZChhdG9tLmdyYW1tYXJzLmdldEdyYW1tYXJzKCksIGdhbW1yID0+IGdhbW1yLm5hbWUgPT09IGdyYW1tYXJOYW1lKTtcbiAgICAgICAgaWYgKCFncmFtbWFyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZHNbZ3JhbW1hci5uYW1lXSA9IHt9O1xuICAgICAgICBncmFtbWFyc1tncmFtbWFyLm5hbWVdID0gZ3JhbW1hcjtcbiAgICAgICAgZWFjaChncmFtbWFyLnJlZ2lzdHJ5LnNjb3Blc0J5SWQsICh2YWx1ZSwga2V5KSA9PiB7IGlkc1tncmFtbWFyLm5hbWVdW3ZhbHVlXSA9ICtrZXk7IH0pO1xuICAgIH1cbiAgICBjb25zdCBtZXRob2QgPSAoZ3JhbW1hciwgc2NvcGUpID0+IHtcbiAgICAgICAgaWYgKCFpZHNbZ3JhbW1hcl0pIHtcbiAgICAgICAgICAgIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXVtzY29wZV0pXG4gICAgICAgICAgICBpZHNbZ3JhbW1hcl1bc2NvcGVdID0gZ3JhbW1hcnNbZ3JhbW1hcl0ucmVnaXN0cnkuc3RhcnRJZEZvclNjb3BlKHNjb3BlKTtcbiAgICAgICAgcmV0dXJuICtpZHNbZ3JhbW1hcl1bc2NvcGVdO1xuICAgIH07XG4gICAgbWV0aG9kLmVuZCA9IChzY29wZSkgPT4gK3Njb3BlIC0gMTtcbiAgICByZXR1cm4gbWV0aG9kO1xufSkoKTtcbmZ1bmN0aW9uIGdldEF0b21TdHlsZUZvclRva2VuKGdyYW1tYXIsIHRhZ3MsIHRva2VuLCBpbmRleCwgaW5kZXhFbmQsIHN0cikge1xuICAgIGNvbnN0IHByZXZpb3VzU2NvcGVzID0gW107XG4gICAgZm9yIChsZXQgaSA9IGluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2godGFnc1tpXSk7XG4gICAgfVxuICAgIGNvbnN0IHJlcGxhY2VtZW50cyA9IFtdO1xuICAgIGNvbnN0IG9wZW5zID0gW107XG4gICAgY29uc3QgY2xvc2VzID0gW107XG4gICAgZm9yIChsZXQgaSA9IGluZGV4OyBpIDwgaW5kZXhFbmQ7IGkrKykge1xuICAgICAgICBpZiAodGFnc1tpXSA+IDApXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBvcGVuSW5kZXggPSBmaW5kSW5kZXgob3BlbnMsIHggPT4geC50YWcgPT09ICh0YWdzW2ldICsgMSkpO1xuICAgICAgICAgICAgaWYgKG9wZW5JbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3BlbnMuc3BsaWNlKG9wZW5JbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9zZXMucHVzaCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvcGVucy51bnNoaWZ0KHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgdW5mdWxsZmlsbGVkID0gW107XG4gICAgaWYgKGNsb3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHVuZnVsbGZpbGxlZCA9IHNvcnRCeShvcGVucy5jb25jYXQoY2xvc2VzKSwgeCA9PiB4LmluZGV4KTtcbiAgICB9XG4gICAgZWxzZSBpZiAob3BlbnMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogb3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2Uob3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsIGluZGV4RW5kICsgMSlcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCBpbnRlcm5hbEluZGV4ID0gaW5kZXg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmZ1bGxmaWxsZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgdiA9IHVuZnVsbGZpbGxlZFtpXTtcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXG4gICAgICAgICAgICBlbmQ6IHYuaW5kZXgsXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbnRlcm5hbEluZGV4LCB2LmluZGV4KVxuICAgICAgICB9KTtcbiAgICAgICAgaW50ZXJuYWxJbmRleCA9IHYuaW5kZXggKyAxO1xuICAgIH1cbiAgICBpZiAocmVwbGFjZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogaW5kZXgsXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW5kZXgsIGluZGV4RW5kKVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZChzY29wZSkge1xuICAgICAgICBjb25zdCBpZCA9IGdldElkRm9yU2NvcGUoZ3JhbW1hciwgc2NvcGUpO1xuICAgICAgICBpZiAoaWQgPT09IC0xKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoIXNvbWUocHJldmlvdXNTY29wZXMsIHogPT4geiA9PT0gaWQpKSB7XG4gICAgICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKGlkKTtcbiAgICAgICAgfVxuICAgICAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gY3R4LnJlcGxhY2VtZW50O1xuICAgICAgICAgICAgcmVwbGFjZW1lbnQudW5zaGlmdChpZCk7XG4gICAgICAgICAgICByZXBsYWNlbWVudC5wdXNoKGdldElkRm9yU2NvcGUuZW5kKGlkKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRva2VuLktpbmQpIHtcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5udW1lcmljYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInN0cnVjdCBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY29uc3RhbnQubnVtZXJpYy5pZGVudGlmaWVyLnN0cnVjdGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJlbnVtIG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuZW51bWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6XG4gICAgICAgICAgICBhZGQoYGlkZW50aWZpZXJgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiY2xhc3MgbmFtZVwiOlxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllcmApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJkZWxlZ2F0ZSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmRlbGVnYXRlYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImludGVyZmFjZSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmludGVyZmFjZWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiOlxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5vdGhlci5zeW1ib2xgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZXhjbHVkZWQgY29kZVwiOlxuICAgICAgICAgICAgYWRkKGBjb21tZW50LmJsb2NrYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInVudXNlZCBjb2RlXCI6XG4gICAgICAgICAgICBhZGQoYHVudXNlZGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVuaGFuZGxlZCBLaW5kIFwiICsgdG9rZW4uS2luZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XG4gICAgICAgIGNvbnN0IHsgcmVwbGFjZW1lbnQsIGVuZCwgc3RhcnQgfSA9IGN0eDtcbiAgICAgICAgaWYgKHJlcGxhY2VtZW50Lmxlbmd0aCA9PT0gMilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IG51bSA9IGVuZCAtIHN0YXJ0O1xuICAgICAgICBpZiAobnVtIDw9IDApIHtcbiAgICAgICAgICAgIG51bSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgdGFncy5zcGxpY2Uoc3RhcnQsIG51bSwgLi4ucmVwbGFjZW1lbnQpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gc2V0R3JhbW1hcihncmFtbWFyKSB7XG4gICAgY29uc3QgZzIgPSBnZXRFbmhhbmNlZEdyYW1tYXIodGhpcywgZ3JhbW1hcik7XG4gICAgaWYgKGcyICE9PSBncmFtbWFyKVxuICAgICAgICB0aGlzLl9zZXRHcmFtbWFyKGcyKTtcbiAgICByZXR1cm4gZzI7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5oYW5jZWRHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucykge1xuICAgIGlmICghZ3JhbW1hcilcbiAgICAgICAgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgaWYgKCFncmFtbWFyW1wib21uaXNoYXJwXCJdICYmIE9tbmkuaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcikpIHtcbiAgICAgICAgY29uc3QgbmV3R3JhbW1hciA9IG5ldyBHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucyk7XG4gICAgICAgIGVhY2goZ3JhbW1hciwgKHgsIGkpID0+IGhhcyhncmFtbWFyLCBpKSAmJiAobmV3R3JhbW1hcltpXSA9IHgpKTtcbiAgICAgICAgZ3JhbW1hciA9IG5ld0dyYW1tYXI7XG4gICAgfVxuICAgIHJldHVybiBncmFtbWFyO1xufVxuY2xhc3MgVW51c2VkTWFwIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fbWFwID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBnZXQoa2V5KSB7XG4gICAgICAgIGlmICghdGhpcy5fbWFwLmhhcyhrZXkpKVxuICAgICAgICAgICAgdGhpcy5fbWFwLnNldChrZXksIG5ldyBCZWhhdmlvclN1YmplY3QoW10pKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC5nZXQoa2V5KTtcbiAgICB9XG4gICAgX2dldE9ic2VydmVyKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXQoa2V5KTtcbiAgICB9XG4gICAgc2V0KGtleSwgdmFsdWUpIHtcbiAgICAgICAgY29uc3QgbyA9IHRoaXMuX2dldE9ic2VydmVyKGtleSk7XG4gICAgICAgIGlmICghaXNFcXVhbChvLmdldFZhbHVlKCksIHZhbHVlKSkge1xuICAgICAgICAgICAgby5uZXh0KHZhbHVlIHx8IFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgZGVsZXRlKGtleSkge1xuICAgICAgICBpZiAodGhpcy5fbWFwLmhhcyhrZXkpKVxuICAgICAgICAgICAgdGhpcy5fbWFwLmRlbGV0ZShrZXkpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5fbWFwLmNsZWFyKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGVuaGFuY2VkSGlnaGxpZ2h0aW5nID0gbmV3IEhpZ2hsaWdodDtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
