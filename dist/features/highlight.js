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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9oaWdobGlnaHQudHMiLCJsaWIvZmVhdHVyZXMvaGlnaGxpZ2h0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O1FBb0xBO1FBMmdCQTs7QUMvckJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QURLQSxJQUFNLGNBQWMsUUFBYyxLQUFNLE1BQU4sQ0FBYSxZQUFiLEdBQTRCLHlDQUE1QixDQUE1QjtBQUVOLElBQU0sZ0JBQWdCLEdBQWhCO0FBQ04sSUFBSSxVQUEwQixRQUFRLFNBQVIsQ0FBMUI7QUFFSixJQUFNLFlBQVksV0FBWjtJQUNGLG9CQUFvQixtQkFBcEI7QUFFSixTQUFBLDJCQUFBLENBQXFDLElBQXJDLEVBQW1ELFVBQW5ELEVBQTRGLFlBQTVGLEVBQWtIO0FBQzlHLFdBQU8sbUJBQU0sVUFBTixFQUNGLE1BREUsQ0FDSztlQUFLLEVBQUUsUUFBRixLQUFlLElBQWY7S0FBTCxDQURMLENBRUYsR0FGRSxDQUVFO2VBQU07QUFDUCx1QkFBVyxFQUFFLElBQUY7QUFDWCx5QkFBYSxFQUFFLE1BQUY7QUFDYixxQkFBUyxFQUFFLE9BQUY7QUFDVCx1QkFBVyxFQUFFLFNBQUY7QUFDWCxrQkFBTSxhQUFOO0FBQ0Esc0JBQVUsWUFBVjs7S0FOQyxDQUZGLENBVUYsS0FWRSxFQUFQLENBRDhHO0NBQWxIO0FBZU8sSUFBTSwwREFBeUIsQ0FDbEMsQ0FEa0MsRUFFbEMsQ0FGa0MsRUFHbEMsQ0FIa0MsRUFJbEMsQ0FKa0MsRUFLbEMsQ0FMa0MsQ0FBekI7O0lBU2I7QUFBQSx5QkFBQTs7O0FBR1ksYUFBQSxjQUFBLEdBQWlCLElBQUksU0FBSixFQUFqQixDQUhaO0FBcUlXLGFBQUEsUUFBQSxHQUFXLEtBQVgsQ0FySVg7QUFzSVcsYUFBQSxLQUFBLEdBQVEsdUJBQVIsQ0F0SVg7QUF1SVcsYUFBQSxXQUFBLEdBQWMsMkdBQWQsQ0F2SVg7QUF3SVcsYUFBQSxPQUFBLEdBQVUsS0FBVixDQXhJWDtLQUFB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Q0FBUCxDQUZrQjs7OztxQ0FLRCxLQUFXO0FBQzVCLG1CQUFtRyxLQUFLLEdBQUwsQ0FBUyxHQUFULENBQW5HLENBRDRCOzs7OzRCQUlyQixLQUFhLE9BQW1DO0FBQ3ZELGdCQUFNLElBQUksS0FBSyxZQUFMLENBQWtCLEdBQWxCLENBQUosQ0FEaUQ7QUFFdkQsZ0JBQUksQ0FBQyxxQkFBUSxFQUFFLFFBQUYsRUFBUixFQUFzQixLQUF0QixDQUFELEVBQStCO0FBQy9CLGtCQUFFLElBQUYsQ0FBTyxTQUFTLEVBQVQsQ0FBUCxDQUQrQjthQUFuQztBQUdBLG1CQUFPLElBQVAsQ0FMdUQ7Ozs7Z0NBUTdDLEtBQVc7QUFDckIsZ0JBQUksS0FBSyxJQUFMLENBQVUsR0FBVixDQUFjLEdBQWQsQ0FBSixFQUNJLEtBQUssSUFBTCxDQUFVLE1BQVYsQ0FBaUIsR0FBakIsRUFESjs7OztnQ0FJUTtBQUNSLGlCQUFLLElBQUwsQ0FBVSxLQUFWLEdBRFE7Ozs7Ozs7QUFLVCxJQUFNLHNEQUF1QixJQUFJLFNBQUosRUFBdkIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2hpZ2hsaWdodC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge09tbmlzaGFycFRleHRFZGl0b3IsIGlzT21uaXNoYXJwVGV4dEVkaXRvcn0gZnJvbSBcIi4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcclxuaW1wb3J0IHtlYWNoLCBleHRlbmQsIGhhcywgc29tZSwgcmFuZ2UsIHJlbW92ZSwgcHVsbCwgZmluZCwgY2hhaW4sIHVuaXEsIGZpbmRJbmRleCwgZXZlcnksIGlzRXF1YWwsIG1pbiwgZGVib3VuY2UsIHNvcnRCeSwgdW5pcXVlSWQsIGZpbHRlcn0gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIFJlcGxheVN1YmplY3QsIEJlaGF2aW9yU3ViamVjdCwgU3Vic2NyaWJlcn0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge3JlZ2lzdGVyQ29udGV4dEl0ZW19IGZyb20gXCIuLi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuY29uc3QgQXRvbUdyYW1tYXIgPSByZXF1aXJlKCg8YW55PmF0b20pLmNvbmZpZy5yZXNvdXJjZVBhdGggKyBcIi9ub2RlX21vZHVsZXMvZmlyc3QtbWF0ZS9saWIvZ3JhbW1hci5qc1wiKTtcclxuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbmNvbnN0IERFQk9VTkNFX1RJTUUgPSAyNDAvKjI0MCovO1xyXG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcclxuXHJcbmNvbnN0IEhJR0hMSUdIVCA9IFwiSElHSExJR0hUXCIsXHJcbiAgICBISUdITElHSFRfUkVRVUVTVCA9IFwiSElHSExJR0hUX1JFUVVFU1RcIjtcclxuXHJcbmZ1bmN0aW9uIGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhwYXRoOiBzdHJpbmcsIHF1aWNrRml4ZXM6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSwgcHJvamVjdE5hbWVzOiBzdHJpbmdbXSkge1xyXG4gICAgcmV0dXJuIGNoYWluKHF1aWNrRml4ZXMpXHJcbiAgICAgICAgLmZpbHRlcih4ID0+IHguRmlsZU5hbWUgPT09IHBhdGgpXHJcbiAgICAgICAgLm1hcCh4ID0+ICh7XHJcbiAgICAgICAgICAgIFN0YXJ0TGluZTogeC5MaW5lLFxyXG4gICAgICAgICAgICBTdGFydENvbHVtbjogeC5Db2x1bW4sXHJcbiAgICAgICAgICAgIEVuZExpbmU6IHguRW5kTGluZSxcclxuICAgICAgICAgICAgRW5kQ29sdW1uOiB4LkVuZENvbHVtbixcclxuICAgICAgICAgICAgS2luZDogXCJ1bnVzZWQgY29kZVwiLFxyXG4gICAgICAgICAgICBQcm9qZWN0czogcHJvamVjdE5hbWVzXHJcbiAgICAgICAgfSBhcyBNb2RlbHMuSGlnaGxpZ2h0U3BhbikpXHJcbiAgICAgICAgLnZhbHVlKCk7XHJcbn1cclxuXHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuZXhwb3J0IGNvbnN0IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMgPSBbXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uQ29tbWVudCxcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5TdHJpbmcsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uUHVuY3R1YXRpb24sXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uT3BlcmF0b3IsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uS2V5d29yZFxyXG5dO1xyXG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuXHJcbmNsYXNzIEhpZ2hsaWdodCBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgZWRpdG9yczogQXJyYXk8T21uaXNoYXJwVGV4dEVkaXRvcj47XHJcbiAgICBwcml2YXRlIHVudXNlZENvZGVSb3dzID0gbmV3IFVudXNlZE1hcCgpO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICBpZiAoT21uaS5hdG9tVmVyc2lvbi5taW5vciA9PT0gMSAmJiBPbW5pLmF0b21WZXJzaW9uLm1pbm9yIDw9IDgpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZWRpdG9ycyA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHJlZ2lzdGVyQ29udGV4dEl0ZW0oSElHSExJR0hUX1JFUVVFU1QsIChjb250ZXh0KSA9PiBuZXcgU3ViamVjdDxib29sZWFuPigpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChyZWdpc3RlckNvbnRleHRJdGVtKEhJR0hMSUdIVCwgKGNvbnRleHQsIGVkaXRvcikgPT5cclxuICAgICAgICAgICAgY29udGV4dC5nZXQ8U3ViamVjdDxib29sZWFuPj4oSElHSExJR0hUX1JFUVVFU1QpXHJcbiAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKHRydWUpXHJcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKCgpID0+IE9ic2VydmFibGUuZGVmZXIoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2plY3RzID0gY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lID09PSBcImFsbFwiID8gW10gOiBbY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxpbmVzVG9GZXRjaCA9IHVuaXE8bnVtYmVyPigoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2gpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbGluZXNUb0ZldGNoIHx8ICFsaW5lc1RvRmV0Y2gubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lc1RvRmV0Y2ggPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgY29kZSByb3dzXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5zZXQoZWRpdG9yLmdldFBhdGgoKSwgW10pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uaGlnaGxpZ2h0KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb2plY3ROYW1lczogcHJvamVjdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMaW5lczogbGluZXNUb0ZldGNoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRXhjbHVkZUNsYXNzaWZpY2F0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChxdWlja2ZpeGVzLCByZXNwb25zZSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0czogKHJlc3BvbnNlID8gcmVzcG9uc2UuSGlnaGxpZ2h0cyA6IFtdKS5jb25jYXQoZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKGVkaXRvci5nZXRQYXRoKCksIHF1aWNrZml4ZXMsIHByb2plY3RzKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5kbygoe2hpZ2hsaWdodHN9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5zZXRSZXNwb25zZXMoaGlnaGxpZ2h0cywgcHJvamVjdHMubGVuZ3RoID4gMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZWZDb3VudCgpO1xyXG4gICAgICAgICAgICAgICAgfSkpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5tb2RlbC5kaWFnbm9zdGljc0J5RmlsZVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGNoYW5nZXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgW2ZpbGUsIGRpYWdub3N0aWNzXSBvZiBjaGFuZ2VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5zZXQoZmlsZSwgZmlsdGVyKGRpYWdub3N0aWNzLCB4ID0+IHguTG9nTGV2ZWwgPT09IFwiSGlkZGVuXCIpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZWFjaEVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnNldHVwRWRpdG9yKGVkaXRvciwgY2QpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbW5pc2hhcnBcclxuICAgICAgICAgICAgICAgIC5nZXQ8T2JzZXJ2YWJsZTx7IGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvcjsgaGlnaGxpZ2h0czogTW9kZWxzLkhpZ2hsaWdodFNwYW5bXTsgcHJvamVjdHM6IHN0cmluZ1tdIH0+PihISUdITElHSFQpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0oKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5nZXQ8U3ViamVjdDxib29sZWFuPj4oSElHSExJR0hUX1JFUVVFU1QpLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKS5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICBpZiAoZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKSB7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MuY2xlYXIoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwRWRpdG9yKGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvciwgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIGlmIChlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSB8fCAhZWRpdG9yLmdldEdyYW1tYXIpIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgaXNzdWVSZXF1ZXN0ID0gZWRpdG9yLm9tbmlzaGFycC5nZXQ8U3ViamVjdDxib29sZWFuPj4oSElHSExJR0hUX1JFUVVFU1QpO1xyXG5cclxuICAgICAgICBhdWdtZW50RWRpdG9yKGVkaXRvciwgdGhpcy51bnVzZWRDb2RlUm93cywgdHJ1ZSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5kZWxldGUoZWRpdG9yLmdldFBhdGgoKSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvcnMucHVzaChlZGl0b3IpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoID0gW107XHJcbiAgICAgICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMpICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcy5jbGVhcigpO1xyXG4gICAgICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzKCk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBlZGl0b3JbXCJfb2xkR3JhbW1hclwiXTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHB1bGwodGhpcy5lZGl0b3JzLCBlZGl0b3IpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9tbmlzaGFycC5wcm9qZWN0XHJcbiAgICAgICAgICAgIC5vYnNlcnZlLmFjdGl2ZUZyYW1ld29ya1xyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmxpbmVzVG9GZXRjaCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcykgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkucmVzcG9uc2VzLmNsZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoKCkgPT4gaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSkpKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkU2F2ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmxpbmVzVG9GZXRjaCA9IFtdO1xyXG4gICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb25cclxuICAgICAgICAgICAgLndoZW5Db25uZWN0ZWQoKVxyXG4gICAgICAgICAgICAuZGVsYXkoMTAwMClcclxuICAgICAgICAgICAgLnN1YnNjcmliZSh7XHJcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkVuaGFuY2VkIEhpZ2hsaWdodGluZ1wiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJFbmFibGVzIHNlcnZlciBiYXNlZCBoaWdobGlnaHRpbmcsIHdoaWNoIGluY2x1ZGVzIHN1cHBvcnQgZm9yIHN0cmluZyBpbnRlcnBvbGF0aW9uLCBjbGFzcyBuYW1lcyBhbmQgbW9yZS5cIjtcclxuICAgIHB1YmxpYyBkZWZhdWx0ID0gZmFsc2U7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhdWdtZW50RWRpdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCB1bnVzZWRDb2RlUm93czogVW51c2VkTWFwID0gbnVsbCwgZG9TZXRHcmFtbWFyID0gZmFsc2UpIHtcclxuICAgIGlmICghZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0pXHJcbiAgICAgICAgZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0gPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xyXG4gICAgaWYgKCFlZGl0b3JbXCJfc2V0R3JhbW1hclwiXSlcclxuICAgICAgICBlZGl0b3JbXCJfc2V0R3JhbW1hclwiXSA9IGVkaXRvci5zZXRHcmFtbWFyO1xyXG4gICAgaWYgKCFlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0pXHJcbiAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdID0gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0O1xyXG4gICAgaWYgKCFlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdKVxyXG4gICAgICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0gPSBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIubWFya1Rva2VuaXphdGlvbkNvbXBsZXRlO1xyXG4gICAgaWYgKCFlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdKVxyXG4gICAgICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0gPSBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzO1xyXG4gICAgaWYgKCFlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfdG9rZW5pemVJbkJhY2tncm91bmRcIl0pXHJcbiAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX3Rva2VuaXplSW5CYWNrZ3JvdW5kXCJdID0gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnRva2VuaXplSW5CYWNrZ3JvdW5kO1xyXG4gICAgaWYgKCFlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfY2h1bmtTaXplXCJdKVxyXG4gICAgICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcImNodW5rU2l6ZVwiXSA9IDIwO1xyXG5cclxuICAgIGVkaXRvci5zZXRHcmFtbWFyID0gc2V0R3JhbW1hcjtcclxuICAgIGlmIChkb1NldEdyYW1tYXIpIGVkaXRvci5zZXRHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpO1xyXG5cclxuICAgICg8YW55PmVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcikuYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQgPSBmdW5jdGlvbihyb3c6IG51bWJlcikge1xyXG4gICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpW1wiX19yb3dfX1wiXSA9IHJvdztcclxuICAgICAgICByZXR1cm4gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIGlmICghKDxhbnk+ZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyKS5zaWxlbnRSZXRva2VuaXplTGluZXMpIHtcclxuICAgICAgICAoPGFueT5lZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIpLnNpbGVudFJldG9rZW5pemVMaW5lcyA9IGRlYm91bmNlKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxyXG4gICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xyXG4gICAgICAgICAgICBsZXQgbGFzdFJvdzogbnVtYmVyO1xyXG4gICAgICAgICAgICBsYXN0Um93ID0gdGhpcy5idWZmZXIuZ2V0TGFzdFJvdygpO1xyXG4gICAgICAgICAgICB0aGlzLnRva2VuaXplZExpbmVzID0gdGhpcy5idWlsZFBsYWNlaG9sZGVyVG9rZW5pemVkTGluZXNGb3JSb3dzKDAsIGxhc3RSb3cpO1xyXG4gICAgICAgICAgICB0aGlzLmludmFsaWRSb3dzID0gW107XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxpbmVzVG9Ub2tlbml6ZSAmJiB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZVJvdyhtaW4odGhpcy5saW5lc1RvVG9rZW5pemUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZVJvdygwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmZ1bGx5VG9rZW5pemVkID0gZmFsc2U7XHJcbiAgICAgICAgfSwgREVCT1VOQ0VfVElNRSwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICAoPGFueT5lZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIpLm1hcmtUb2tlbml6YXRpb25Db21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcpXHJcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KHRydWUpO1xyXG4gICAgICAgIHJldHVybiBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55PmVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcikucmV0b2tlbml6ZUxpbmVzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcclxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xyXG4gICAgICAgIHJldHVybiBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55PmVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcikudG9rZW5pemVJbkJhY2tncm91bmQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoIXRoaXMudmlzaWJsZSB8fCB0aGlzLnBlbmRpbmdDaHVuayB8fCAhdGhpcy5pc0FsaXZlKCkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5wZW5kaW5nQ2h1bmsgPSB0cnVlO1xyXG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wZW5kaW5nQ2h1bmsgPSBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBbGl2ZSgpICYmIHRoaXMuYnVmZmVyLmlzQWxpdmUoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50b2tlbml6ZU5leHRDaHVuaygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgICg8YW55PmVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcikuc2NvcGVzRnJvbVRhZ3MgPSBmdW5jdGlvbihzdGFydGluZ1Njb3BlczogbnVtYmVyW10sIHRhZ3M6IG51bWJlcltdKSB7XHJcbiAgICAgICAgY29uc3Qgc2NvcGVzID0gc3RhcnRpbmdTY29wZXMuc2xpY2UoKTtcclxuICAgICAgICBjb25zdCBncmFtbWFyID0gKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRhZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgdGFnID0gdGFnc1tpXTtcclxuICAgICAgICAgICAgaWYgKHRhZyA8IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICgodGFnICUgMikgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2godGFnKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hpbmdTdGFydFRhZyA9IHRhZyArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3Blcy5wb3AoKSA9PT0gbWF0Y2hpbmdTdGFydFRhZykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3Blcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhY2sgdG8gZW5zdXJlIHRoYXQgYWxsIGxpbmVzIGFsd2F5cyBnZXQgdGhlIHByb3BlciBzb3VyY2UgbGluZXMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZXMucHVzaCg8YW55PmdyYW1tYXIuc3RhcnRJZEZvclNjb3BlKGAuJHtncmFtbWFyLnNjb3BlTmFtZX1gKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oXCJFbmNvdW50ZXJlZCBhbiB1bm1hdGNoZWQgc2NvcGUgZW5kIHRhZy5cIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBlZGl0b3IuYnVmZmVyLmdldFBhdGgoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFtbWFyU2NvcGVOYW1lOiBncmFtbWFyLnNjb3BlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5tYXRjaGVkRW5kVGFnOiBncmFtbWFyLnNjb3BlRm9ySWQodGFnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5zZXRSZXNwb25zZXMoW10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVudXNlZENvZGVSb3dzICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW51c2VkQ29kZVJvd3MuZ2V0KGVkaXRvci5nZXRQYXRoKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocm93cyA9PiAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFJlc3BvbnNlcyhnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMoZWRpdG9yLmdldFBhdGgoKSwgcm93cywgW10pKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2NvcGVzO1xyXG4gICAgfTtcclxufVxyXG5cclxuaW50ZXJmYWNlIElIaWdobGlnaHRpbmdHcmFtbWFyIGV4dGVuZHMgRmlyc3RNYXRlLkdyYW1tYXIge1xyXG4gICAgaXNPYnNlcnZlUmV0b2tlbml6aW5nOiBTdWJqZWN0PGJvb2xlYW4+O1xyXG4gICAgbGluZXNUb0ZldGNoOiBudW1iZXJbXTtcclxuICAgIGxpbmVzVG9Ub2tlbml6ZTogbnVtYmVyW107XHJcbiAgICByZXNwb25zZXM6IE1hcDxudW1iZXIsIE1vZGVscy5IaWdobGlnaHRTcGFuW10+O1xyXG4gICAgZnVsbHlUb2tlbml6ZWQ6IGJvb2xlYW47XHJcbiAgICBzY29wZU5hbWU6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgR3JhbW1hciB7XHJcbiAgICBwdWJsaWMgaXNPYnNlcnZlUmV0b2tlbml6aW5nOiBSZXBsYXlTdWJqZWN0PGJvb2xlYW4+O1xyXG4gICAgcHVibGljIGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yO1xyXG4gICAgcHVibGljIGxpbmVzVG9GZXRjaDogYW55W107XHJcbiAgICBwdWJsaWMgbGluZXNUb1Rva2VuaXplOiBhbnlbXTtcclxuICAgIHB1YmxpYyBhY3RpdmVGcmFtZXdvcms6IGFueTtcclxuICAgIHB1YmxpYyByZXNwb25zZXM6IE1hcDxudW1iZXIsIE1vZGVscy5IaWdobGlnaHRTcGFuW10+O1xyXG4gICAgcHVibGljIF9naWQgPSB1bmlxdWVJZChcIm9nXCIpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBiYXNlOiBGaXJzdE1hdGUuR3JhbW1hciwgb3B0aW9uczogeyByZWFkb25seTogYm9vbGVhbiB9KSB7XHJcbiAgICAgICAgdGhpcy5pc09ic2VydmVSZXRva2VuaXppbmcgPSBuZXcgUmVwbGF5U3ViamVjdDxib29sZWFuPigxKTtcclxuICAgICAgICB0aGlzLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KHRydWUpO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcclxuICAgICAgICB0aGlzLnJlc3BvbnNlcyA9IG5ldyBNYXA8bnVtYmVyLCBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdPigpO1xyXG4gICAgICAgIHRoaXMubGluZXNUb0ZldGNoID0gW107XHJcbiAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUgPSBbXTtcclxuICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHt9O1xyXG5cclxuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMucmVhZG9ubHkpIHtcclxuICAgICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLnByZWVtcHREaWRDaGFuZ2UoKGU6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qge29sZFJhbmdlLCBuZXdSYW5nZX0gPSBlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0OiBudW1iZXIgPSBvbGRSYW5nZS5zdGFydC5yb3csXHJcbiAgICAgICAgICAgICAgICAgICAgZGVsdGE6IG51bWJlciA9IG5ld1JhbmdlLmVuZC5yb3cgLSBvbGRSYW5nZS5lbmQucm93O1xyXG5cclxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gc3RhcnQgLSA1O1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGVuZCA9IGVkaXRvci5idWZmZXIuZ2V0TGluZUNvdW50KCkgLSAxO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVzID0gcmFuZ2Uoc3RhcnQsIGVuZCArIDEpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5rZXlzKCkubmV4dCgpLmRvbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9GZXRjaC5wdXNoKC4uLmxpbmVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobGluZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGxpbmVzWzBdKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZEZyb20gPSBvbGRSYW5nZS5zdGFydC5jb2x1bW4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdGcm9tID0gbmV3UmFuZ2Uuc3RhcnQuY29sdW1uO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlKHJlc3BvbnNlTGluZSwgKHNwYW46IE1vZGVscy5IaWdobGlnaHRTcGFuKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydExpbmUgPCBsaW5lc1swXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gb2xkRnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBvbGRGcm9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydENvbHVtbiA+PSBuZXdGcm9tIHx8IHNwYW4uRW5kQ29sdW1uID49IG5ld0Zyb20pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlYWNoKGxpbmVzLCBsaW5lID0+IHsgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGxpbmUpOyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZGVsdGEgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTmV3IGxpbmVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gY291bnQgLSAxOyBpID4gZW5kOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VzLmhhcyhpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGkgKyBkZWx0YSwgdGhpcy5yZXNwb25zZXMuZ2V0KGkpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLmRlbGV0ZShpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVsdGEgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlZCBsaW5lXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWJzRGVsdGEgPSBNYXRoLmFicyhkZWx0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGVuZDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VzLmhhcyhpICsgYWJzRGVsdGEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaSwgdGhpcy5yZXNwb25zZXMuZ2V0KGkgKyBhYnNEZWx0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGkgKyBhYnNEZWx0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0UmVzcG9uc2VzKHZhbHVlOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdLCBlbmFibGVFeGNsdWRlQ29kZTogYm9vbGVhbikge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBjaGFpbih2YWx1ZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGdyb3VwZWRJdGVtcyA9IDxhbnk+cmVzdWx0cy5tYXAoaGlnaGxpZ2h0ID0+IHJhbmdlKGhpZ2hsaWdodC5TdGFydExpbmUsIGhpZ2hsaWdodC5FbmRMaW5lICsgMSlcclxuICAgICAgICAgICAgLm1hcChsaW5lID0+ICh7IGxpbmUsIGhpZ2hsaWdodCB9KSkpXHJcbiAgICAgICAgICAgIC5mbGF0dGVuPHsgbGluZTogbnVtYmVyOyBoaWdobGlnaHQ6IE1vZGVscy5IaWdobGlnaHRTcGFuIH0+KClcclxuICAgICAgICAgICAgLmdyb3VwQnkoeiA9PiB6LmxpbmUpXHJcbiAgICAgICAgICAgIC52YWx1ZSgpO1xyXG5cclxuICAgICAgICBlYWNoKGdyb3VwZWRJdGVtcywgKGl0ZW06IHsgaGlnaGxpZ2h0OiBNb2RlbHMuSGlnaGxpZ2h0U3BhbiB9W10sIGtleTogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBrID0gK2tleSwgbWFwcGVkSXRlbSA9IGl0ZW0ubWFwKHggPT4geC5oaWdobGlnaHQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFlbmFibGVFeGNsdWRlQ29kZSB8fCBzb21lKG1hcHBlZEl0ZW0sIGkgPT4gaS5LaW5kID09PSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCIpICYmIGV2ZXJ5KG1hcHBlZEl0ZW0sIGkgPT4gaS5LaW5kID09PSBcImV4Y2x1ZGVkIGNvZGVcIiB8fCBpLktpbmQgPT09IFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIikpIHtcclxuICAgICAgICAgICAgICAgIG1hcHBlZEl0ZW0gPSBtYXBwZWRJdGVtLmZpbHRlcih6ID0+IHouS2luZCAhPT0gXCJleGNsdWRlZCBjb2RlXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmhhcyhrKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUucHVzaChrKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChrKTtcclxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZUxpbmUubGVuZ3RoICE9PSBtYXBwZWRJdGVtLmxlbmd0aCB8fCBzb21lKHJlc3BvbnNlTGluZSwgKGwsIGkpID0+ICFpc0VxdWFsKGwsIG1hcHBlZEl0ZW1baV0pKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChrLCBtYXBwZWRJdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG4vKiB0c2xpbnQ6ZGlzYWJsZTptZW1iZXItYWNjZXNzICovXHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuZXh0ZW5kKEdyYW1tYXIucHJvdG90eXBlLCBBdG9tR3JhbW1hci5wcm90b3R5cGUpO1xyXG5cclxuR3JhbW1hci5wcm90b3R5cGVbXCJvbW5pc2hhcnBcIl0gPSB0cnVlO1xyXG5HcmFtbWFyLnByb3RvdHlwZVtcInRva2VuaXplTGluZVwiXSA9IGZ1bmN0aW9uKGxpbmU6IHN0cmluZywgcnVsZVN0YWNrOiBhbnlbXSwgZmlyc3RMaW5lID0gZmFsc2UpOiB7IHRhZ3M6IG51bWJlcltdOyBydWxlU3RhY2s6IGFueSB9IHtcclxuICAgIGNvbnN0IGJhc2VSZXN1bHQgPSBBdG9tR3JhbW1hci5wcm90b3R5cGUudG9rZW5pemVMaW5lLmNhbGwodGhpcywgbGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUpO1xyXG4gICAgbGV0IHRhZ3M6IGFueVtdO1xyXG5cclxuICAgIGlmICh0aGlzLnJlc3BvbnNlcykge1xyXG4gICAgICAgIGNvbnN0IHJvdyA9IHRoaXNbXCJfX3Jvd19fXCJdO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmhhcyhyb3cpKSByZXR1cm4gYmFzZVJlc3VsdDtcclxuXHJcbiAgICAgICAgY29uc3QgaGlnaGxpZ2h0cyA9IHRoaXMucmVzcG9uc2VzLmdldChyb3cpO1xyXG4gICAgICAgIC8vIEV4Y2x1ZGVkIGNvZGUgYmxvd3MgYXdheSBhbnkgb3RoZXIgZm9ybWF0dGluZywgb3RoZXJ3aXNlIHdlIGdldCBpbnRvIGEgdmVyeSB3ZWlyZCBzdGF0ZS5cclxuICAgICAgICBpZiAoaGlnaGxpZ2h0c1swXSAmJiBoaWdobGlnaHRzWzBdLktpbmQgPT09IFwiZXhjbHVkZWQgY29kZVwiKSB7XHJcbiAgICAgICAgICAgIHRhZ3MgPSBbbGluZS5sZW5ndGhdO1xyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodHNbMF0sIDAsIHRhZ3MubGVuZ3RoIC0gMSwgbGluZSk7XHJcbiAgICAgICAgICAgIGJhc2VSZXN1bHQucnVsZVN0YWNrID0gW2Jhc2VSZXN1bHQucnVsZVN0YWNrWzBdXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0YWdzID0gdGhpcy5nZXRDc1Rva2Vuc0ZvckxpbmUoaGlnaGxpZ2h0cywgbGluZSwgcm93LCBydWxlU3RhY2ssIGZpcnN0TGluZSwgYmFzZVJlc3VsdC50YWdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYmFzZVJlc3VsdC50YWdzID0gdGFncztcclxuICAgIH1cclxuICAgIHJldHVybiBiYXNlUmVzdWx0O1xyXG59O1xyXG5cclxuKEdyYW1tYXIucHJvdG90eXBlIGFzIGFueSkuZ2V0Q3NUb2tlbnNGb3JMaW5lID0gZnVuY3Rpb24oaGlnaGxpZ2h0czogTW9kZWxzLkhpZ2hsaWdodFNwYW5bXSwgbGluZTogc3RyaW5nLCByb3c6IG51bWJlciwgcnVsZVN0YWNrOiBhbnlbXSwgZmlyc3RMaW5lOiBib29sZWFuLCB0YWdzOiBudW1iZXJbXSkge1xyXG4gICAgcnVsZVN0YWNrID0gW3sgcnVsZTogdGhpcy5nZXRJbml0aWFsUnVsZSgpIH1dO1xyXG5cclxuICAgIGVhY2goaGlnaGxpZ2h0cywgKGhpZ2hsaWdodCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uIC0gMTtcclxuICAgICAgICBjb25zdCBlbmQgPSBoaWdobGlnaHQuRW5kQ29sdW1uIC0gMTtcclxuXHJcbiAgICAgICAgaWYgKGhpZ2hsaWdodC5FbmRMaW5lID4gaGlnaGxpZ2h0LlN0YXJ0TGluZSAmJiBoaWdobGlnaHQuU3RhcnRDb2x1bW4gPT09IDAgJiYgaGlnaGxpZ2h0LkVuZENvbHVtbiA9PT0gMCkge1xyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgMCwgdGFncy5sZW5ndGggLSAxLCBsaW5lKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGRpc3RhbmNlID0gLTE7XHJcbiAgICAgICAgbGV0IGluZGV4ID0gLTE7XHJcbiAgICAgICAgbGV0IGk6IG51bWJlcjtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcclxuICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSArIHRhZ3NbaV0gPiBzdGFydCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRpc3RhbmNlICs9IHRhZ3NbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN0ciA9IGxpbmUuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpO1xyXG4gICAgICAgIGNvbnN0IHNpemUgPSBlbmQgLSBzdGFydDtcclxuICAgICAgICBpZiAodGFnc1tpbmRleF0gPj0gc2l6ZSkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWVzOiBudW1iZXJbXTtcclxuICAgICAgICAgICAgbGV0IHByZXY6IG51bWJlciwgbmV4dDogbnVtYmVyO1xyXG4gICAgICAgICAgICBpZiAoZGlzdGFuY2UgPT09IHN0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbc2l6ZSwgdGFnc1tpbmRleF0gLSBzaXplXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHByZXYgPSBzdGFydCAtIGRpc3RhbmNlO1xyXG4gICAgICAgICAgICAgICAgbmV4dCA9IHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXY7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV4dCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbcHJldiwgc2l6ZSwgdGFnc1tpbmRleF0gLSBzaXplIC0gcHJldl07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0YWdzLnNwbGljZShpbmRleCwgMSwgLi4udmFsdWVzKTtcclxuICAgICAgICAgICAgaWYgKHByZXYpIGluZGV4ID0gaW5kZXggKyAxO1xyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgaW5kZXgsIGluZGV4ICsgMSwgc3RyKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRhZ3NbaW5kZXhdIDwgc2l6ZSkge1xyXG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgbGV0IGJhY2t0cmFja0Rpc3RhbmNlID0gMDtcclxuICAgICAgICAgICAgZm9yIChpID0gYmFja3RyYWNrSW5kZXg7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYmFja3RyYWNrRGlzdGFuY2UgPj0gc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tEaXN0YW5jZSArPSB0YWdzW2ldO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrdHJhY2tEaXN0YW5jZSA+PSBzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBmb3J3YXJkdHJhY2tJbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICBsZXQgcmVtYWluaW5nU2l6ZSA9IHNpemU7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IGluZGV4ICsgMTsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICgocmVtYWluaW5nU2l6ZSA8PSAwICYmIHRhZ3NbaV0gPiAwKS8qIHx8IHRhZ3NbaV0gJSAyID09PSAtMSovKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NpemUgLT0gdGFnc1tpXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBIYW5kbGVzIGNhc2Ugd2hlcmUgdGhlcmUgaXMgYSBjbG9zaW5nIHRhZ1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGJ1dCBubyBvcGVuaW5nIHRhZyBoZXJlLlxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBvcGVuRm91bmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBoID0gaTsgaCA+PSAwOyBoLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhZ3NbaF0gPT09IHRhZ3NbaV0gKyAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvcGVuRm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA9PT0gdGFncy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gdGFncy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgYmFja3RyYWNrSW5kZXgsIGZvcndhcmR0cmFja0luZGV4LCBzdHIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB0YWdzO1xyXG59O1xyXG5cclxuY29uc3QgZ2V0SWRGb3JTY29wZSA9IChmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IGlkczogeyBba2V5OiBzdHJpbmddOiB7IFtrZXk6IHN0cmluZ106IG51bWJlciB9OyB9ID0ge307XHJcbiAgICBjb25zdCBncmFtbWFyczogYW55ID0ge307XHJcblxyXG4gICAgZnVuY3Rpb24gYnVpbGRTY29wZXNGb3JHcmFtbWFyKGdyYW1tYXJOYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBncmFtbWFyID0gZmluZChhdG9tLmdyYW1tYXJzLmdldEdyYW1tYXJzKCksIGdhbW1yID0+IGdhbW1yLm5hbWUgPT09IGdyYW1tYXJOYW1lKTtcclxuICAgICAgICBpZiAoIWdyYW1tYXIpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWRzW2dyYW1tYXIubmFtZV0gPSB7fTtcclxuICAgICAgICBncmFtbWFyc1tncmFtbWFyLm5hbWVdID0gZ3JhbW1hcjtcclxuXHJcbiAgICAgICAgZWFjaChncmFtbWFyLnJlZ2lzdHJ5LnNjb3Blc0J5SWQsICh2YWx1ZTogc3RyaW5nLCBrZXk6IGFueSkgPT4geyBpZHNbZ3JhbW1hci5uYW1lXVt2YWx1ZV0gPSAra2V5OyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtZXRob2QgPSAoZ3JhbW1hcjogc3RyaW5nLCBzY29wZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgaWYgKCFpZHNbZ3JhbW1hcl0pIHtcclxuICAgICAgICAgICAgYnVpbGRTY29wZXNGb3JHcmFtbWFyKGdyYW1tYXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFpZHNbZ3JhbW1hcl1bc2NvcGVdKVxyXG4gICAgICAgICAgICBpZHNbZ3JhbW1hcl1bc2NvcGVdID0gZ3JhbW1hcnNbZ3JhbW1hcl0ucmVnaXN0cnkuc3RhcnRJZEZvclNjb3BlKHNjb3BlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuICtpZHNbZ3JhbW1hcl1bc2NvcGVdO1xyXG4gICAgfTtcclxuXHJcbiAgICAoPGFueT5tZXRob2QpLmVuZCA9IChzY29wZTogbnVtYmVyKSA9PiArc2NvcGUgLSAxO1xyXG5cclxuICAgIHJldHVybiA8eyAoZ3JhbW1hcjogc3RyaW5nLCBzY29wZTogc3RyaW5nKTogbnVtYmVyOyBlbmQ6IChzY29wZTogbnVtYmVyKSA9PiBudW1iZXI7IH0+bWV0aG9kO1xyXG59KSgpO1xyXG5cclxuXHJcbi8vLyBOT1RFOiBiZXN0IHdheSBJIGhhdmUgZm91bmQgZm9yIHRoZXNlIGlzIHRvIGp1c3QgbG9vayBhdCB0aGVtZSBcImxlc3NcIiBmaWxlc1xyXG4vLyBBbHRlcm5hdGl2ZWx5IGp1c3QgaW5zcGVjdCB0aGUgdG9rZW4gZm9yIGEgLmpzIGZpbGVcclxuZnVuY3Rpb24gZ2V0QXRvbVN0eWxlRm9yVG9rZW4oZ3JhbW1hcjogc3RyaW5nLCB0YWdzOiBudW1iZXJbXSwgdG9rZW46IE1vZGVscy5IaWdobGlnaHRTcGFuLCBpbmRleDogbnVtYmVyLCBpbmRleEVuZDogbnVtYmVyLCBzdHI6IHN0cmluZykge1xyXG4gICAgY29uc3QgcHJldmlvdXNTY29wZXM6IGFueVtdID0gW107XHJcbiAgICBmb3IgKGxldCBpID0gaW5kZXggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgIGlmICh0YWdzW2ldID4gMClcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgcHJldmlvdXNTY29wZXMucHVzaCh0YWdzW2ldKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZXBsYWNlbWVudHM6IHsgc3RhcnQ6IG51bWJlcjsgZW5kOiBudW1iZXI7IHJlcGxhY2VtZW50OiBudW1iZXJbXSB9W10gPSBbXTtcclxuICAgIGNvbnN0IG9wZW5zOiB7IHRhZzogbnVtYmVyOyBpbmRleDogbnVtYmVyIH1bXSA9IFtdO1xyXG4gICAgY29uc3QgY2xvc2VzOiB0eXBlb2Ygb3BlbnMgPSBbXTtcclxuXHJcbiAgICAvLyBTY2FuIGZvciBhbnkgdW5jbG9zZWQgb3IgdW5vcGVuZWQgdGFnc1xyXG4gICAgZm9yIChsZXQgaSA9IGluZGV4OyBpIDwgaW5kZXhFbmQ7IGkrKykge1xyXG4gICAgICAgIGlmICh0YWdzW2ldID4gMCkgY29udGludWU7XHJcbiAgICAgICAgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9wZW5JbmRleCA9IGZpbmRJbmRleChvcGVucywgeCA9PiB4LnRhZyA9PT0gKHRhZ3NbaV0gKyAxKSk7XHJcbiAgICAgICAgICAgIGlmIChvcGVuSW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgb3BlbnMuc3BsaWNlKG9wZW5JbmRleCwgMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjbG9zZXMucHVzaCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBvcGVucy51bnNoaWZ0KHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHVuZnVsbGZpbGxlZDogdHlwZW9mIG9wZW5zID0gW107XHJcbiAgICBpZiAoY2xvc2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB1bmZ1bGxmaWxsZWQgPSBzb3J0Qnkob3BlbnMuY29uY2F0KGNsb3NlcyksIHggPT4geC5pbmRleCk7XHJcbiAgICB9IGVsc2UgaWYgKG9wZW5zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAvLyBHcmFiIHRoZSBsYXN0IGtub3duIG9wZW4sIGFuZCBhcHBlbmQgZnJvbSB0aGVyZVxyXG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgc3RhcnQ6IG9wZW5zW29wZW5zLmxlbmd0aCAtIDFdLmluZGV4LFxyXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxyXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShvcGVuc1tvcGVucy5sZW5ndGggLSAxXS5pbmRleCwgaW5kZXhFbmQgKyAxKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBpbnRlcm5hbEluZGV4ID0gaW5kZXg7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVuZnVsbGZpbGxlZC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IHYgPSB1bmZ1bGxmaWxsZWRbaV07XHJcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xyXG4gICAgICAgICAgICBzdGFydDogaW50ZXJuYWxJbmRleCxcclxuICAgICAgICAgICAgZW5kOiB2LmluZGV4LFxyXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbnRlcm5hbEluZGV4LCB2LmluZGV4KVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGludGVybmFsSW5kZXggPSB2LmluZGV4ICsgMTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVwbGFjZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcclxuICAgICAgICAgICAgc3RhcnQ6IGluZGV4LFxyXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxyXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbmRleCwgaW5kZXhFbmQpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8qcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xyXG4gICAgICAgICAgICBzdGFydDogaW50ZXJuYWxJbmRleCxcclxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcclxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW50ZXJuYWxJbmRleCwgaW5kZXhFbmQpXHJcbiAgICAgICAgfSk7Ki9cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhZGQoc2NvcGU6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGlkID0gZ2V0SWRGb3JTY29wZShncmFtbWFyLCBzY29wZSk7XHJcbiAgICAgICAgaWYgKGlkID09PSAtMSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAoIXNvbWUocHJldmlvdXNTY29wZXMsIHogPT4geiA9PT0gaWQpKSB7XHJcbiAgICAgICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2goaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSBjdHgucmVwbGFjZW1lbnQ7XHJcbiAgICAgICAgICAgIHJlcGxhY2VtZW50LnVuc2hpZnQoaWQpO1xyXG4gICAgICAgICAgICByZXBsYWNlbWVudC5wdXNoKGdldElkRm9yU2NvcGUuZW5kKGlkKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBzd2l0Y2ggKHRva2VuLktpbmQpIHtcclxuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XHJcbiAgICAgICAgICAgIGFkZChgY29uc3RhbnQubnVtZXJpY2ApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwic3RydWN0IG5hbWVcIjpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNvbnN0YW50Lm51bWVyaWMuaWRlbnRpZmllci5zdHJ1Y3RgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImVudW0gbmFtZVwiOlxyXG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY29uc3RhbnQubnVtZXJpYy5pZGVudGlmaWVyLmVudW1gKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImlkZW50aWZpZXJcIjpcclxuICAgICAgICAgICAgYWRkKGBpZGVudGlmaWVyYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJjbGFzcyBuYW1lXCI6XHJcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXJgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcImRlbGVnYXRlIG5hbWVcIjpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllci5kZWxlZ2F0ZWApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiaW50ZXJmYWNlIG5hbWVcIjpcclxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllci5pbnRlcmZhY2VgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCI6XHJcbiAgICAgICAgICAgIGFkZChgY29uc3RhbnQub3RoZXIuc3ltYm9sYCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJleGNsdWRlZCBjb2RlXCI6XHJcbiAgICAgICAgICAgIGFkZChgY29tbWVudC5ibG9ja2ApO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwidW51c2VkIGNvZGVcIjpcclxuICAgICAgICAgICAgYWRkKGB1bnVzZWRgKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ1bmhhbmRsZWQgS2luZCBcIiArIHRva2VuLktpbmQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuXHJcbiAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcclxuICAgICAgICBjb25zdCB7cmVwbGFjZW1lbnQsIGVuZCwgc3RhcnR9ID0gY3R4O1xyXG4gICAgICAgIGlmIChyZXBsYWNlbWVudC5sZW5ndGggPT09IDIpIHJldHVybjtcclxuICAgICAgICBsZXQgbnVtID0gZW5kIC0gc3RhcnQ7XHJcbiAgICAgICAgaWYgKG51bSA8PSAwKSB7XHJcbiAgICAgICAgICAgIG51bSA9IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRhZ3Muc3BsaWNlKHN0YXJ0LCBudW0sIC4uLnJlcGxhY2VtZW50KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRHcmFtbWFyKGdyYW1tYXI6IEZpcnN0TWF0ZS5HcmFtbWFyKTogRmlyc3RNYXRlLkdyYW1tYXIge1xyXG4gICAgY29uc3QgZzIgPSBnZXRFbmhhbmNlZEdyYW1tYXIodGhpcywgZ3JhbW1hcik7XHJcbiAgICBpZiAoZzIgIT09IGdyYW1tYXIpXHJcbiAgICAgICAgdGhpcy5fc2V0R3JhbW1hcihnMik7XHJcbiAgICByZXR1cm4gZzI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRFbmhhbmNlZEdyYW1tYXIoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGdyYW1tYXI/OiBGaXJzdE1hdGUuR3JhbW1hciwgb3B0aW9ucz86IHsgcmVhZG9ubHk6IGJvb2xlYW4gfSkge1xyXG4gICAgaWYgKCFncmFtbWFyKSBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcclxuICAgIGlmICghZ3JhbW1hcltcIm9tbmlzaGFycFwiXSAmJiBPbW5pLmlzVmFsaWRHcmFtbWFyKGdyYW1tYXIpKSB7XHJcbiAgICAgICAgY29uc3QgbmV3R3JhbW1hciA9IG5ldyBHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucyk7XHJcbiAgICAgICAgZWFjaChncmFtbWFyLCAoeCwgaSkgPT4gaGFzKGdyYW1tYXIsIGkpICYmIChuZXdHcmFtbWFyW2ldID0geCkpO1xyXG4gICAgICAgIGdyYW1tYXIgPSA8YW55Pm5ld0dyYW1tYXI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZ3JhbW1hcjtcclxufVxyXG5cclxuLy8gVXNlZCB0byBjYWNoZSB2YWx1ZXMgZm9yIHNwZWNpZmljIGVkaXRvcnNcclxuY2xhc3MgVW51c2VkTWFwIHtcclxuICAgIHByaXZhdGUgX21hcCA9IG5ldyBNYXA8c3RyaW5nLCBPYnNlcnZhYmxlPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4+KCk7XHJcbiAgICBwdWJsaWMgZ2V0KGtleTogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9tYXAuaGFzKGtleSkpIHRoaXMuX21hcC5zZXQoa2V5LCA8YW55Pm5ldyBCZWhhdmlvclN1YmplY3Q8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPihbXSkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAuZ2V0KGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0T2JzZXJ2ZXIoa2V5OiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gPFN1YnNjcmliZXI8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPiAmIHsgZ2V0VmFsdWUoKTogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdIH0+PGFueT50aGlzLmdldChrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlPzogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdKSB7XHJcbiAgICAgICAgY29uc3QgbyA9IHRoaXMuX2dldE9ic2VydmVyKGtleSk7XHJcbiAgICAgICAgaWYgKCFpc0VxdWFsKG8uZ2V0VmFsdWUoKSwgdmFsdWUpKSB7XHJcbiAgICAgICAgICAgIG8ubmV4dCh2YWx1ZSB8fCBbXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWxldGUoa2V5OiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodGhpcy5fbWFwLmhhcyhrZXkpKVxyXG4gICAgICAgICAgICB0aGlzLl9tYXAuZGVsZXRlKGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsZWFyKCkge1xyXG4gICAgICAgIHRoaXMuX21hcC5jbGVhcigpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZW5oYW5jZWRIaWdobGlnaHRpbmcgPSBuZXcgSGlnaGxpZ2h0O1xyXG4iLCJpbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBpc09tbmlzaGFycFRleHRFZGl0b3IgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xuaW1wb3J0IHsgZWFjaCwgZXh0ZW5kLCBoYXMsIHNvbWUsIHJhbmdlLCByZW1vdmUsIHB1bGwsIGZpbmQsIGNoYWluLCB1bmlxLCBmaW5kSW5kZXgsIGV2ZXJ5LCBpc0VxdWFsLCBtaW4sIGRlYm91bmNlLCBzb3J0QnksIHVuaXF1ZUlkLCBmaWx0ZXIgfSBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0LCBSZXBsYXlTdWJqZWN0LCBCZWhhdmlvclN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyByZWdpc3RlckNvbnRleHRJdGVtIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcbmNvbnN0IEF0b21HcmFtbWFyID0gcmVxdWlyZShhdG9tLmNvbmZpZy5yZXNvdXJjZVBhdGggKyBcIi9ub2RlX21vZHVsZXMvZmlyc3QtbWF0ZS9saWIvZ3JhbW1hci5qc1wiKTtcbmNvbnN0IERFQk9VTkNFX1RJTUUgPSAyNDA7XG5sZXQgZmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuY29uc3QgSElHSExJR0hUID0gXCJISUdITElHSFRcIiwgSElHSExJR0hUX1JFUVVFU1QgPSBcIkhJR0hMSUdIVF9SRVFVRVNUXCI7XG5mdW5jdGlvbiBnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMocGF0aCwgcXVpY2tGaXhlcywgcHJvamVjdE5hbWVzKSB7XG4gICAgcmV0dXJuIGNoYWluKHF1aWNrRml4ZXMpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4LkZpbGVOYW1lID09PSBwYXRoKVxuICAgICAgICAubWFwKHggPT4gKHtcbiAgICAgICAgU3RhcnRMaW5lOiB4LkxpbmUsXG4gICAgICAgIFN0YXJ0Q29sdW1uOiB4LkNvbHVtbixcbiAgICAgICAgRW5kTGluZTogeC5FbmRMaW5lLFxuICAgICAgICBFbmRDb2x1bW46IHguRW5kQ29sdW1uLFxuICAgICAgICBLaW5kOiBcInVudXNlZCBjb2RlXCIsXG4gICAgICAgIFByb2plY3RzOiBwcm9qZWN0TmFtZXNcbiAgICB9KSlcbiAgICAgICAgLnZhbHVlKCk7XG59XG5leHBvcnQgY29uc3QgRXhjbHVkZUNsYXNzaWZpY2F0aW9ucyA9IFtcbiAgICAyLFxuICAgIDMsXG4gICAgNSxcbiAgICA0LFxuICAgIDZcbl07XG5jbGFzcyBIaWdobGlnaHQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzID0gbmV3IFVudXNlZE1hcCgpO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkVuaGFuY2VkIEhpZ2hsaWdodGluZ1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJFbmFibGVzIHNlcnZlciBiYXNlZCBoaWdobGlnaHRpbmcsIHdoaWNoIGluY2x1ZGVzIHN1cHBvcnQgZm9yIHN0cmluZyBpbnRlcnBvbGF0aW9uLCBjbGFzcyBuYW1lcyBhbmQgbW9yZS5cIjtcbiAgICAgICAgdGhpcy5kZWZhdWx0ID0gZmFsc2U7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICBpZiAoT21uaS5hdG9tVmVyc2lvbi5taW5vciA9PT0gMSAmJiBPbW5pLmF0b21WZXJzaW9uLm1pbm9yIDw9IDgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmVkaXRvcnMgPSBbXTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChyZWdpc3RlckNvbnRleHRJdGVtKEhJR0hMSUdIVF9SRVFVRVNULCAoY29udGV4dCkgPT4gbmV3IFN1YmplY3QoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHJlZ2lzdGVyQ29udGV4dEl0ZW0oSElHSExJR0hULCAoY29udGV4dCwgZWRpdG9yKSA9PiBjb250ZXh0LmdldChISUdITElHSFRfUkVRVUVTVClcbiAgICAgICAgICAgIC5zdGFydFdpdGgodHJ1ZSlcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAoKCkgPT4gT2JzZXJ2YWJsZS5kZWZlcigoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0cyA9IGNvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZSA9PT0gXCJhbGxcIiA/IFtdIDogW2NvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZV07XG4gICAgICAgICAgICBsZXQgbGluZXNUb0ZldGNoID0gdW5pcShlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCk7XG4gICAgICAgICAgICBpZiAoIWxpbmVzVG9GZXRjaCB8fCAhbGluZXNUb0ZldGNoLmxlbmd0aClcbiAgICAgICAgICAgICAgICBsaW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3Muc2V0KGVkaXRvci5nZXRQYXRoKCksIFtdKTtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QodGhpcy51bnVzZWRDb2RlUm93cy5nZXQoZWRpdG9yLmdldFBhdGgoKSksIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmhpZ2hsaWdodCh7XG4gICAgICAgICAgICAgICAgUHJvamVjdE5hbWVzOiBwcm9qZWN0cyxcbiAgICAgICAgICAgICAgICBMaW5lczogbGluZXNUb0ZldGNoLFxuICAgICAgICAgICAgICAgIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnNcbiAgICAgICAgICAgIH0pKSwgKHF1aWNrZml4ZXMsIHJlc3BvbnNlKSA9PiAoe1xuICAgICAgICAgICAgICAgIGVkaXRvcixcbiAgICAgICAgICAgICAgICBwcm9qZWN0cyxcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRzOiAocmVzcG9uc2UgPyByZXNwb25zZS5IaWdobGlnaHRzIDogW10pLmNvbmNhdChnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMoZWRpdG9yLmdldFBhdGgoKSwgcXVpY2tmaXhlcywgcHJvamVjdHMpKVxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgLmRvKCh7IGhpZ2hsaWdodHMgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcikge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnNldFJlc3BvbnNlcyhoaWdobGlnaHRzLCBwcm9qZWN0cy5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXG4gICAgICAgICAgICAgICAgLnJlZkNvdW50KCk7XG4gICAgICAgIH0pKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubW9kZWwuZGlhZ25vc3RpY3NCeUZpbGVcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY2hhbmdlcyA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBbZmlsZSwgZGlhZ25vc3RpY3NdIG9mIGNoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLnNldChmaWxlLCBmaWx0ZXIoZGlhZ25vc3RpY3MsIHggPT4geC5Mb2dMZXZlbCA9PT0gXCJIaWRkZW5cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5lYWNoRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldHVwRWRpdG9yKGVkaXRvciwgY2QpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbW5pc2hhcnBcbiAgICAgICAgICAgICAgICAuZ2V0KEhJR0hMSUdIVClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0oKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuZ2V0KEhJR0hMSUdIVF9SRVFVRVNUKS5uZXh0KHRydWUpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuZ2V0KEhJR0hMSUdIVF9SRVFVRVNUKS5uZXh0KHRydWUpO1xuICAgICAgICAgICAgaWYgKGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSkge1xuICAgICAgICAgICAgICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5jbGVhcigpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0dXBFZGl0b3IoZWRpdG9yLCBkaXNwb3NhYmxlKSB7XG4gICAgICAgIGlmIChlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSB8fCAhZWRpdG9yLmdldEdyYW1tYXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGlzc3VlUmVxdWVzdCA9IGVkaXRvci5vbW5pc2hhcnAuZ2V0KEhJR0hMSUdIVF9SRVFVRVNUKTtcbiAgICAgICAgYXVnbWVudEVkaXRvcihlZGl0b3IsIHRoaXMudW51c2VkQ29kZVJvd3MsIHRydWUpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLmRlbGV0ZShlZGl0b3IuZ2V0UGF0aCgpKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmVkaXRvcnMucHVzaChlZGl0b3IpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc3Bvc2FibGUpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkucmVzcG9uc2VzLmNsZWFyKCk7XG4gICAgICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzKCk7XG4gICAgICAgICAgICBkZWxldGUgZWRpdG9yW1wiX29sZEdyYW1tYXJcIl07XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgICAgIHB1bGwodGhpcy5lZGl0b3JzLCBlZGl0b3IpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbW5pc2hhcnAucHJvamVjdFxuICAgICAgICAgICAgLm9ic2VydmUuYWN0aXZlRnJhbWV3b3JrXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkubGluZXNUb0ZldGNoID0gW107XG4gICAgICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5yZXNwb25zZXMpXG4gICAgICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5yZXNwb25zZXMuY2xlYXIoKTtcbiAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZygoKSA9PiBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRTYXZlKCgpID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkubGluZXNUb0ZldGNoID0gW107XG4gICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uXG4gICAgICAgICAgICAud2hlbkNvbm5lY3RlZCgpXG4gICAgICAgICAgICAuZGVsYXkoMTAwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBhdWdtZW50RWRpdG9yKGVkaXRvciwgdW51c2VkQ29kZVJvd3MgPSBudWxsLCBkb1NldEdyYW1tYXIgPSBmYWxzZSkge1xuICAgIGlmICghZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0pXG4gICAgICAgIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICBpZiAoIWVkaXRvcltcIl9zZXRHcmFtbWFyXCJdKVxuICAgICAgICBlZGl0b3JbXCJfc2V0R3JhbW1hclwiXSA9IGVkaXRvci5zZXRHcmFtbWFyO1xuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdKVxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0gPSBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIuYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQ7XG4gICAgaWYgKCFlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdKVxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdID0gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLm1hcmtUb2tlbml6YXRpb25Db21wbGV0ZTtcbiAgICBpZiAoIWVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0pXG4gICAgICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0gPSBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzO1xuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX3Rva2VuaXplSW5CYWNrZ3JvdW5kXCJdKVxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfdG9rZW5pemVJbkJhY2tncm91bmRcIl0gPSBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIudG9rZW5pemVJbkJhY2tncm91bmQ7XG4gICAgaWYgKCFlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfY2h1bmtTaXplXCJdKVxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJjaHVua1NpemVcIl0gPSAyMDtcbiAgICBlZGl0b3Iuc2V0R3JhbW1hciA9IHNldEdyYW1tYXI7XG4gICAgaWYgKGRvU2V0R3JhbW1hcilcbiAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIoZWRpdG9yLmdldEdyYW1tYXIoKSk7XG4gICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0ID0gZnVuY3Rpb24gKHJvdykge1xuICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpW1wiX19yb3dfX1wiXSA9IHJvdztcbiAgICAgICAgcmV0dXJuIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgaWYgKCFlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIuc2lsZW50UmV0b2tlbml6ZUxpbmVzKSB7XG4gICAgICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci5zaWxlbnRSZXRva2VuaXplTGluZXMgPSBkZWJvdW5jZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcpXG4gICAgICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dChmYWxzZSk7XG4gICAgICAgICAgICBsZXQgbGFzdFJvdztcbiAgICAgICAgICAgIGxhc3RSb3cgPSB0aGlzLmJ1ZmZlci5nZXRMYXN0Um93KCk7XG4gICAgICAgICAgICB0aGlzLnRva2VuaXplZExpbmVzID0gdGhpcy5idWlsZFBsYWNlaG9sZGVyVG9rZW5pemVkTGluZXNGb3JSb3dzKDAsIGxhc3RSb3cpO1xuICAgICAgICAgICAgdGhpcy5pbnZhbGlkUm93cyA9IFtdO1xuICAgICAgICAgICAgaWYgKHRoaXMubGluZXNUb1Rva2VuaXplICYmIHRoaXMubGluZXNUb1Rva2VuaXplLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZVJvdyhtaW4odGhpcy5saW5lc1RvVG9rZW5pemUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZVJvdygwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZnVsbHlUb2tlbml6ZWQgPSBmYWxzZTtcbiAgICAgICAgfSwgREVCT1VOQ0VfVElNRSwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KTtcbiAgICB9XG4gICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLm1hcmtUb2tlbml6YXRpb25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxuICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dCh0cnVlKTtcbiAgICAgICAgcmV0dXJuIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9tYXJrVG9rZW5pemF0aW9uQ29tcGxldGVcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci5yZXRva2VuaXplTGluZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcbiAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xuICAgICAgICByZXR1cm4gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX3JldG9rZW5pemVMaW5lc1wiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnRva2VuaXplSW5CYWNrZ3JvdW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMudmlzaWJsZSB8fCB0aGlzLnBlbmRpbmdDaHVuayB8fCAhdGhpcy5pc0FsaXZlKCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gdHJ1ZTtcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wZW5kaW5nQ2h1bmsgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQWxpdmUoKSAmJiB0aGlzLmJ1ZmZlci5pc0FsaXZlKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRva2VuaXplTmV4dENodW5rKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnNjb3Blc0Zyb21UYWdzID0gZnVuY3Rpb24gKHN0YXJ0aW5nU2NvcGVzLCB0YWdzKSB7XG4gICAgICAgIGNvbnN0IHNjb3BlcyA9IHN0YXJ0aW5nU2NvcGVzLnNsaWNlKCk7XG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGFncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdGFnID0gdGFnc1tpXTtcbiAgICAgICAgICAgIGlmICh0YWcgPCAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCh0YWcgJSAyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2godGFnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoaW5nU3RhcnRUYWcgPSB0YWcgKyAxO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3Blcy5wb3AoKSA9PT0gbWF0Y2hpbmdTdGFydFRhZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3Blcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZXMucHVzaChncmFtbWFyLnN0YXJ0SWRGb3JTY29wZShgLiR7Z3JhbW1hci5zY29wZU5hbWV9YCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIkVuY291bnRlcmVkIGFuIHVubWF0Y2hlZCBzY29wZSBlbmQgdGFnLlwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBlZGl0b3IuYnVmZmVyLmdldFBhdGgoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbW1hclNjb3BlTmFtZTogZ3JhbW1hci5zY29wZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5tYXRjaGVkRW5kVGFnOiBncmFtbWFyLnNjb3BlRm9ySWQodGFnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuc2V0UmVzcG9uc2VzKFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodW51c2VkQ29kZVJvd3MgJiYgaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW51c2VkQ29kZVJvd3MuZ2V0KGVkaXRvci5nZXRQYXRoKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShyb3dzID0+IGVkaXRvci5nZXRHcmFtbWFyKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRSZXNwb25zZXMoZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKGVkaXRvci5nZXRQYXRoKCksIHJvd3MsIFtdKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2NvcGVzO1xuICAgIH07XG59XG5jbGFzcyBHcmFtbWFyIHtcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3IsIGJhc2UsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fZ2lkID0gdW5pcXVlSWQoXCJvZ1wiKTtcbiAgICAgICAgdGhpcy5pc09ic2VydmVSZXRva2VuaXppbmcgPSBuZXcgUmVwbGF5U3ViamVjdCgxKTtcbiAgICAgICAgdGhpcy5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dCh0cnVlKTtcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgIHRoaXMucmVzcG9uc2VzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZSA9IFtdO1xuICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHt9O1xuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMucmVhZG9ubHkpIHtcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5wcmVlbXB0RGlkQ2hhbmdlKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBvbGRSYW5nZSwgbmV3UmFuZ2UgfSA9IGU7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0ID0gb2xkUmFuZ2Uuc3RhcnQucm93LCBkZWx0YSA9IG5ld1JhbmdlLmVuZC5yb3cgLSBvbGRSYW5nZS5lbmQucm93O1xuICAgICAgICAgICAgICAgIHN0YXJ0ID0gc3RhcnQgLSA1O1xuICAgICAgICAgICAgICAgIGlmIChzdGFydCA8IDApXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0ID0gMDtcbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSBlZGl0b3IuYnVmZmVyLmdldExpbmVDb3VudCgpIC0gMTtcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9IHJhbmdlKHN0YXJ0LCBlbmQgKyAxKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmtleXMoKS5uZXh0KCkuZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9GZXRjaC5wdXNoKC4uLmxpbmVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUxpbmUgPSB0aGlzLnJlc3BvbnNlcy5nZXQobGluZXNbMF0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRGcm9tID0gb2xkUmFuZ2Uuc3RhcnQuY29sdW1uLCBuZXdGcm9tID0gbmV3UmFuZ2Uuc3RhcnQuY29sdW1uO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlKHJlc3BvbnNlTGluZSwgKHNwYW4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydExpbmUgPCBsaW5lc1swXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gb2xkRnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBvbGRGcm9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydENvbHVtbiA+PSBuZXdGcm9tIHx8IHNwYW4uRW5kQ29sdW1uID49IG5ld0Zyb20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlYWNoKGxpbmVzLCBsaW5lID0+IHsgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGxpbmUpOyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGRlbHRhID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGNvdW50IC0gMTsgaSA+IGVuZDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGkgKyBkZWx0YSwgdGhpcy5yZXNwb25zZXMuZ2V0KGkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5kZWxldGUoaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZGVsdGEgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gZWRpdG9yLmdldExpbmVDb3VudCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNEZWx0YSA9IE1hdGguYWJzKGRlbHRhKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGVuZDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlc3BvbnNlcy5oYXMoaSArIGFic0RlbHRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpLCB0aGlzLnJlc3BvbnNlcy5nZXQoaSArIGFic0RlbHRhKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGkgKyBhYnNEZWx0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRSZXNwb25zZXModmFsdWUsIGVuYWJsZUV4Y2x1ZGVDb2RlKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBjaGFpbih2YWx1ZSk7XG4gICAgICAgIGNvbnN0IGdyb3VwZWRJdGVtcyA9IHJlc3VsdHMubWFwKGhpZ2hsaWdodCA9PiByYW5nZShoaWdobGlnaHQuU3RhcnRMaW5lLCBoaWdobGlnaHQuRW5kTGluZSArIDEpXG4gICAgICAgICAgICAubWFwKGxpbmUgPT4gKHsgbGluZSwgaGlnaGxpZ2h0IH0pKSlcbiAgICAgICAgICAgIC5mbGF0dGVuKClcbiAgICAgICAgICAgIC5ncm91cEJ5KHogPT4gei5saW5lKVxuICAgICAgICAgICAgLnZhbHVlKCk7XG4gICAgICAgIGVhY2goZ3JvdXBlZEl0ZW1zLCAoaXRlbSwga2V5KSA9PiB7XG4gICAgICAgICAgICBsZXQgayA9ICtrZXksIG1hcHBlZEl0ZW0gPSBpdGVtLm1hcCh4ID0+IHguaGlnaGxpZ2h0KTtcbiAgICAgICAgICAgIGlmICghZW5hYmxlRXhjbHVkZUNvZGUgfHwgc29tZShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSAmJiBldmVyeShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIgfHwgaS5LaW5kID09PSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCIpKSB7XG4gICAgICAgICAgICAgICAgbWFwcGVkSXRlbSA9IG1hcHBlZEl0ZW0uZmlsdGVyKHogPT4gei5LaW5kICE9PSBcImV4Y2x1ZGVkIGNvZGVcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmhhcyhrKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChrLCBtYXBwZWRJdGVtKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGspO1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZUxpbmUubGVuZ3RoICE9PSBtYXBwZWRJdGVtLmxlbmd0aCB8fCBzb21lKHJlc3BvbnNlTGluZSwgKGwsIGkpID0+ICFpc0VxdWFsKGwsIG1hcHBlZEl0ZW1baV0pKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplLnB1c2goayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHRlbmQoR3JhbW1hci5wcm90b3R5cGUsIEF0b21HcmFtbWFyLnByb3RvdHlwZSk7XG5HcmFtbWFyLnByb3RvdHlwZVtcIm9tbmlzaGFycFwiXSA9IHRydWU7XG5HcmFtbWFyLnByb3RvdHlwZVtcInRva2VuaXplTGluZVwiXSA9IGZ1bmN0aW9uIChsaW5lLCBydWxlU3RhY2ssIGZpcnN0TGluZSA9IGZhbHNlKSB7XG4gICAgY29uc3QgYmFzZVJlc3VsdCA9IEF0b21HcmFtbWFyLnByb3RvdHlwZS50b2tlbml6ZUxpbmUuY2FsbCh0aGlzLCBsaW5lLCBydWxlU3RhY2ssIGZpcnN0TGluZSk7XG4gICAgbGV0IHRhZ3M7XG4gICAgaWYgKHRoaXMucmVzcG9uc2VzKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHRoaXNbXCJfX3Jvd19fXCJdO1xuICAgICAgICBpZiAoIXRoaXMucmVzcG9uc2VzLmhhcyhyb3cpKVxuICAgICAgICAgICAgcmV0dXJuIGJhc2VSZXN1bHQ7XG4gICAgICAgIGNvbnN0IGhpZ2hsaWdodHMgPSB0aGlzLnJlc3BvbnNlcy5nZXQocm93KTtcbiAgICAgICAgaWYgKGhpZ2hsaWdodHNbMF0gJiYgaGlnaGxpZ2h0c1swXS5LaW5kID09PSBcImV4Y2x1ZGVkIGNvZGVcIikge1xuICAgICAgICAgICAgdGFncyA9IFtsaW5lLmxlbmd0aF07XG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodHNbMF0sIDAsIHRhZ3MubGVuZ3RoIC0gMSwgbGluZSk7XG4gICAgICAgICAgICBiYXNlUmVzdWx0LnJ1bGVTdGFjayA9IFtiYXNlUmVzdWx0LnJ1bGVTdGFja1swXV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0YWdzID0gdGhpcy5nZXRDc1Rva2Vuc0ZvckxpbmUoaGlnaGxpZ2h0cywgbGluZSwgcm93LCBydWxlU3RhY2ssIGZpcnN0TGluZSwgYmFzZVJlc3VsdC50YWdzKTtcbiAgICAgICAgfVxuICAgICAgICBiYXNlUmVzdWx0LnRhZ3MgPSB0YWdzO1xuICAgIH1cbiAgICByZXR1cm4gYmFzZVJlc3VsdDtcbn07XG5HcmFtbWFyLnByb3RvdHlwZS5nZXRDc1Rva2Vuc0ZvckxpbmUgPSBmdW5jdGlvbiAoaGlnaGxpZ2h0cywgbGluZSwgcm93LCBydWxlU3RhY2ssIGZpcnN0TGluZSwgdGFncykge1xuICAgIHJ1bGVTdGFjayA9IFt7IHJ1bGU6IHRoaXMuZ2V0SW5pdGlhbFJ1bGUoKSB9XTtcbiAgICBlYWNoKGhpZ2hsaWdodHMsIChoaWdobGlnaHQpID0+IHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBoaWdobGlnaHQuU3RhcnRDb2x1bW4gLSAxO1xuICAgICAgICBjb25zdCBlbmQgPSBoaWdobGlnaHQuRW5kQ29sdW1uIC0gMTtcbiAgICAgICAgaWYgKGhpZ2hsaWdodC5FbmRMaW5lID4gaGlnaGxpZ2h0LlN0YXJ0TGluZSAmJiBoaWdobGlnaHQuU3RhcnRDb2x1bW4gPT09IDAgJiYgaGlnaGxpZ2h0LkVuZENvbHVtbiA9PT0gMCkge1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIDAsIHRhZ3MubGVuZ3RoIC0gMSwgbGluZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRpc3RhbmNlID0gLTE7XG4gICAgICAgIGxldCBpbmRleCA9IC0xO1xuICAgICAgICBsZXQgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xuICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZSArIHRhZ3NbaV0gPiBzdGFydCkge1xuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkaXN0YW5jZSArPSB0YWdzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0ciA9IGxpbmUuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpO1xuICAgICAgICBjb25zdCBzaXplID0gZW5kIC0gc3RhcnQ7XG4gICAgICAgIGlmICh0YWdzW2luZGV4XSA+PSBzaXplKSB7XG4gICAgICAgICAgICBsZXQgdmFsdWVzO1xuICAgICAgICAgICAgbGV0IHByZXYsIG5leHQ7XG4gICAgICAgICAgICBpZiAoZGlzdGFuY2UgPT09IHN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzID0gW3NpemUsIHRhZ3NbaW5kZXhdIC0gc2l6ZV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmV2ID0gc3RhcnQgLSBkaXN0YW5jZTtcbiAgICAgICAgICAgICAgICBuZXh0ID0gdGFnc1tpbmRleF0gLSBzaXplIC0gcHJldjtcbiAgICAgICAgICAgICAgICBpZiAobmV4dCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gW3ByZXYsIHNpemUsIHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXZdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gW3ByZXYsIHNpemVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhZ3Muc3BsaWNlKGluZGV4LCAxLCAuLi52YWx1ZXMpO1xuICAgICAgICAgICAgaWYgKHByZXYpXG4gICAgICAgICAgICAgICAgaW5kZXggPSBpbmRleCArIDE7XG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgaW5kZXgsIGluZGV4ICsgMSwgc3RyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0YWdzW2luZGV4XSA8IHNpemUpIHtcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgbGV0IGJhY2t0cmFja0Rpc3RhbmNlID0gMDtcbiAgICAgICAgICAgIGZvciAoaSA9IGJhY2t0cmFja0luZGV4OyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYmFja3RyYWNrRGlzdGFuY2UgPj0gc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrRGlzdGFuY2UgKz0gdGFnc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaSArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBmb3J3YXJkdHJhY2tJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgbGV0IHJlbWFpbmluZ1NpemUgPSBzaXplO1xuICAgICAgICAgICAgZm9yIChpID0gaW5kZXggKyAxOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICgocmVtYWluaW5nU2l6ZSA8PSAwICYmIHRhZ3NbaV0gPiAwKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IGkgLSAxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ1NpemUgLT0gdGFnc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG9wZW5Gb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBoID0gaTsgaCA+PSAwOyBoLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWdzW2hdID09PSB0YWdzW2ldICsgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5Gb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvcGVuRm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gaSAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpID09PSB0YWdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gdGFncy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGJhY2t0cmFja0luZGV4LCBmb3J3YXJkdHJhY2tJbmRleCwgc3RyKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB0YWdzO1xufTtcbmNvbnN0IGdldElkRm9yU2NvcGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IGlkcyA9IHt9O1xuICAgIGNvbnN0IGdyYW1tYXJzID0ge307XG4gICAgZnVuY3Rpb24gYnVpbGRTY29wZXNGb3JHcmFtbWFyKGdyYW1tYXJOYW1lKSB7XG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSBmaW5kKGF0b20uZ3JhbW1hcnMuZ2V0R3JhbW1hcnMoKSwgZ2FtbXIgPT4gZ2FtbXIubmFtZSA9PT0gZ3JhbW1hck5hbWUpO1xuICAgICAgICBpZiAoIWdyYW1tYXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlkc1tncmFtbWFyLm5hbWVdID0ge307XG4gICAgICAgIGdyYW1tYXJzW2dyYW1tYXIubmFtZV0gPSBncmFtbWFyO1xuICAgICAgICBlYWNoKGdyYW1tYXIucmVnaXN0cnkuc2NvcGVzQnlJZCwgKHZhbHVlLCBrZXkpID0+IHsgaWRzW2dyYW1tYXIubmFtZV1bdmFsdWVdID0gK2tleTsgfSk7XG4gICAgfVxuICAgIGNvbnN0IG1ldGhvZCA9IChncmFtbWFyLCBzY29wZSkgPT4ge1xuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXSkge1xuICAgICAgICAgICAgYnVpbGRTY29wZXNGb3JHcmFtbWFyKGdyYW1tYXIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaWRzW2dyYW1tYXJdW3Njb3BlXSlcbiAgICAgICAgICAgIGlkc1tncmFtbWFyXVtzY29wZV0gPSBncmFtbWFyc1tncmFtbWFyXS5yZWdpc3RyeS5zdGFydElkRm9yU2NvcGUoc2NvcGUpO1xuICAgICAgICByZXR1cm4gK2lkc1tncmFtbWFyXVtzY29wZV07XG4gICAgfTtcbiAgICBtZXRob2QuZW5kID0gKHNjb3BlKSA9PiArc2NvcGUgLSAxO1xuICAgIHJldHVybiBtZXRob2Q7XG59KSgpO1xuZnVuY3Rpb24gZ2V0QXRvbVN0eWxlRm9yVG9rZW4oZ3JhbW1hciwgdGFncywgdG9rZW4sIGluZGV4LCBpbmRleEVuZCwgc3RyKSB7XG4gICAgY29uc3QgcHJldmlvdXNTY29wZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gaW5kZXggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBpZiAodGFnc1tpXSA+IDApXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgcHJldmlvdXNTY29wZXMucHVzaCh0YWdzW2ldKTtcbiAgICB9XG4gICAgY29uc3QgcmVwbGFjZW1lbnRzID0gW107XG4gICAgY29uc3Qgb3BlbnMgPSBbXTtcbiAgICBjb25zdCBjbG9zZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gaW5kZXg7IGkgPCBpbmRleEVuZDsgaSsrKSB7XG4gICAgICAgIGlmICh0YWdzW2ldID4gMClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG9wZW5JbmRleCA9IGZpbmRJbmRleChvcGVucywgeCA9PiB4LnRhZyA9PT0gKHRhZ3NbaV0gKyAxKSk7XG4gICAgICAgICAgICBpZiAob3BlbkluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvcGVucy5zcGxpY2Uob3BlbkluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsb3Nlcy5wdXNoKHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG9wZW5zLnVuc2hpZnQoeyB0YWc6IHRhZ3NbaV0sIGluZGV4OiBpIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxldCB1bmZ1bGxmaWxsZWQgPSBbXTtcbiAgICBpZiAoY2xvc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdW5mdWxsZmlsbGVkID0gc29ydEJ5KG9wZW5zLmNvbmNhdChjbG9zZXMpLCB4ID0+IHguaW5kZXgpO1xuICAgIH1cbiAgICBlbHNlIGlmIChvcGVucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcbiAgICAgICAgICAgIHN0YXJ0OiBvcGVuc1tvcGVucy5sZW5ndGggLSAxXS5pbmRleCxcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShvcGVuc1tvcGVucy5sZW5ndGggLSAxXS5pbmRleCwgaW5kZXhFbmQgKyAxKVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGV0IGludGVybmFsSW5kZXggPSBpbmRleDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVuZnVsbGZpbGxlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCB2ID0gdW5mdWxsZmlsbGVkW2ldO1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogaW50ZXJuYWxJbmRleCxcbiAgICAgICAgICAgIGVuZDogdi5pbmRleCxcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGludGVybmFsSW5kZXgsIHYuaW5kZXgpXG4gICAgICAgIH0pO1xuICAgICAgICBpbnRlcm5hbEluZGV4ID0gdi5pbmRleCArIDE7XG4gICAgfVxuICAgIGlmIChyZXBsYWNlbWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcbiAgICAgICAgICAgIHN0YXJ0OiBpbmRleCxcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbmRleCwgaW5kZXhFbmQpXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkKHNjb3BlKSB7XG4gICAgICAgIGNvbnN0IGlkID0gZ2V0SWRGb3JTY29wZShncmFtbWFyLCBzY29wZSk7XG4gICAgICAgIGlmIChpZCA9PT0gLTEpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICghc29tZShwcmV2aW91c1Njb3BlcywgeiA9PiB6ID09PSBpZCkpIHtcbiAgICAgICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2goaWQpO1xuICAgICAgICB9XG4gICAgICAgIGVhY2gocmVwbGFjZW1lbnRzLCBjdHggPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSBjdHgucmVwbGFjZW1lbnQ7XG4gICAgICAgICAgICByZXBsYWNlbWVudC51bnNoaWZ0KGlkKTtcbiAgICAgICAgICAgIHJlcGxhY2VtZW50LnB1c2goZ2V0SWRGb3JTY29wZS5lbmQoaWQpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHN3aXRjaCAodG9rZW4uS2luZCkge1xuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgICAgICBhZGQoYGNvbnN0YW50Lm51bWVyaWNgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwic3RydWN0IG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuc3RydWN0YCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImVudW0gbmFtZVwiOlxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNvbnN0YW50Lm51bWVyaWMuaWRlbnRpZmllci5lbnVtYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImlkZW50aWZpZXJcIjpcbiAgICAgICAgICAgIGFkZChgaWRlbnRpZmllcmApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJjbGFzcyBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImRlbGVnYXRlIG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXIuZGVsZWdhdGVgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiaW50ZXJmYWNlIG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jbGFzcy50eXBlLmlkZW50aWZpZXIuaW50ZXJmYWNlYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCI6XG4gICAgICAgICAgICBhZGQoYGNvbnN0YW50Lm90aGVyLnN5bWJvbGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJleGNsdWRlZCBjb2RlXCI6XG4gICAgICAgICAgICBhZGQoYGNvbW1lbnQuYmxvY2tgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidW51c2VkIGNvZGVcIjpcbiAgICAgICAgICAgIGFkZChgdW51c2VkYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidW5oYW5kbGVkIEtpbmQgXCIgKyB0b2tlbi5LaW5kKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcbiAgICAgICAgY29uc3QgeyByZXBsYWNlbWVudCwgZW5kLCBzdGFydCB9ID0gY3R4O1xuICAgICAgICBpZiAocmVwbGFjZW1lbnQubGVuZ3RoID09PSAyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgbnVtID0gZW5kIC0gc3RhcnQ7XG4gICAgICAgIGlmIChudW0gPD0gMCkge1xuICAgICAgICAgICAgbnVtID0gMTtcbiAgICAgICAgfVxuICAgICAgICB0YWdzLnNwbGljZShzdGFydCwgbnVtLCAuLi5yZXBsYWNlbWVudCk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBzZXRHcmFtbWFyKGdyYW1tYXIpIHtcbiAgICBjb25zdCBnMiA9IGdldEVuaGFuY2VkR3JhbW1hcih0aGlzLCBncmFtbWFyKTtcbiAgICBpZiAoZzIgIT09IGdyYW1tYXIpXG4gICAgICAgIHRoaXMuX3NldEdyYW1tYXIoZzIpO1xuICAgIHJldHVybiBnMjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbmhhbmNlZEdyYW1tYXIoZWRpdG9yLCBncmFtbWFyLCBvcHRpb25zKSB7XG4gICAgaWYgKCFncmFtbWFyKVxuICAgICAgICBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICBpZiAoIWdyYW1tYXJbXCJvbW5pc2hhcnBcIl0gJiYgT21uaS5pc1ZhbGlkR3JhbW1hcihncmFtbWFyKSkge1xuICAgICAgICBjb25zdCBuZXdHcmFtbWFyID0gbmV3IEdyYW1tYXIoZWRpdG9yLCBncmFtbWFyLCBvcHRpb25zKTtcbiAgICAgICAgZWFjaChncmFtbWFyLCAoeCwgaSkgPT4gaGFzKGdyYW1tYXIsIGkpICYmIChuZXdHcmFtbWFyW2ldID0geCkpO1xuICAgICAgICBncmFtbWFyID0gbmV3R3JhbW1hcjtcbiAgICB9XG4gICAgcmV0dXJuIGdyYW1tYXI7XG59XG5jbGFzcyBVbnVzZWRNYXAge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9tYXAgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIGdldChrZXkpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tYXAuaGFzKGtleSkpXG4gICAgICAgICAgICB0aGlzLl9tYXAuc2V0KGtleSwgbmV3IEJlaGF2aW9yU3ViamVjdChbXSkpO1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLmdldChrZXkpO1xuICAgIH1cbiAgICBfZ2V0T2JzZXJ2ZXIoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldChrZXkpO1xuICAgIH1cbiAgICBzZXQoa2V5LCB2YWx1ZSkge1xuICAgICAgICBjb25zdCBvID0gdGhpcy5fZ2V0T2JzZXJ2ZXIoa2V5KTtcbiAgICAgICAgaWYgKCFpc0VxdWFsKG8uZ2V0VmFsdWUoKSwgdmFsdWUpKSB7XG4gICAgICAgICAgICBvLm5leHQodmFsdWUgfHwgW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBkZWxldGUoa2V5KSB7XG4gICAgICAgIGlmICh0aGlzLl9tYXAuaGFzKGtleSkpXG4gICAgICAgICAgICB0aGlzLl9tYXAuZGVsZXRlKGtleSk7XG4gICAgfVxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLl9tYXAuY2xlYXIoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgZW5oYW5jZWRIaWdobGlnaHRpbmcgPSBuZXcgSGlnaGxpZ2h0O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
