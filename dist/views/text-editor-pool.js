"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EditorElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _highlight = require("../features/highlight");

var _omni = require("../server/omni");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fastdom = require("fastdom");
var customExcludes = _highlight.ExcludeClassifications.concat([8, 9, 10]);
var pool = function () {
    var NUM_TO_KEEP = 10;
    var POOL = [];
    var cleanupPool = _lodash2.default.throttle(function cleanupPool() {
        if (POOL.length > NUM_TO_KEEP) {
            var len = Math.min(POOL.length - NUM_TO_KEEP, 10);
            var remove = POOL.splice(0, len);
            remove.forEach(function (x) {
                return x.editor.destroy();
            });
            cleanupPool();
        }
    }, 10000, { trailing: true });

    var Result = function () {
        function Result(editor, element) {
            var _this = this;

            _classCallCheck(this, Result);

            this.editor = editor;
            this.element = element;
            this._disposable = _omnisharpClient.Disposable.create(function () {
                var editor = _this.editor;
                var element = _this.element;

                element.remove();
                POOL.push({ editor: editor, element: element });
                editor.setGrammar(_omni.Omni.grammars[0]);
                editor.setText("");
                cleanupPool();
            });
        }

        _createClass(Result, [{
            key: "dispose",
            value: function dispose() {
                this._disposable.dispose();
            }
        }]);

        return Result;
    }();

    function populatePool() {
        return _rxjs.Observable.interval(50).take(10).map(function () {
            var editorElement = document.createElement("atom-text-editor");
            editorElement.setAttributeNode(document.createAttribute("gutter-hidden"));
            editorElement.removeAttribute("tabindex");
            var editor = editorElement.getModel();
            editor.getDecorations({ class: "cursor-line", type: "line" })[0].destroy();
            editor.setGrammar(_omni.Omni.grammars[0]);
            editor.setSoftWrapped(true);
            (0, _highlight.augmentEditor)(editor);
            return editorElement;
        }).do(function (element) {
            return POOL.push({ element: element, editor: element.getModel() });
        }).toArray();
    }
    setTimeout(function () {
        return populatePool();
    }, 10000);
    function request() {
        if (POOL.length) {
            var _POOL$pop = POOL.pop();

            var editor = _POOL$pop.editor;
            var element = _POOL$pop.element;

            return _rxjs.Observable.of(new Result(editor, element));
        } else {
            return populatePool().flatMap(function () {
                return request();
            });
        }
    }
    return {
        getNext: function getNext() {
            if (!POOL.length) {
                return { success: false, result: null };
            }

            var _POOL$pop2 = POOL.pop();

            var editor = _POOL$pop2.editor;
            var element = _POOL$pop2.element;

            return { success: true, result: new Result(editor, element) };
        },

        request: request
    };
}();

var EditorElement = exports.EditorElement = function (_HTMLSpanElement) {
    _inherits(EditorElement, _HTMLSpanElement);

    function EditorElement() {
        _classCallCheck(this, EditorElement);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(EditorElement).apply(this, arguments));
    }

    _createClass(EditorElement, [{
        key: "setEditorText",
        value: function setEditorText(grammar) {
            if (this._usage) {
                var text = this._usage.Text;
                this._editor._setGrammar(grammar);
                this._editor.setText(_lodash2.default.trimStart(text));
                var marker = this._editor.markBufferRange([[0, +this._usage.Column - this._whitespace], [+this._usage.EndLine - +this._usage.Line, +this._usage.EndColumn - this._whitespace]]);
                this._editor.decorateMarker(marker, { type: "highlight", class: "findusages-underline" });
            } else {
                this._editor.setText(_lodash2.default.trim(this._editorText));
            }
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            this._disposable = new _omnisharpClient.CompositeDisposable();
            if (!this._pre) {
                this._pre = document.createElement("pre");
                this._pre.innerText = this._usage && this._usage.Text || this.editorText;
                this._pre.style.fontSize = atom.config.get("editor.fontSize") + "px !important";
            }
            this.appendChild(this._pre);
        }
    }, {
        key: "revert",
        value: function revert() {
            var _this3 = this;

            fastdom.mutate(function () {
                return _this3._detachEditor(true);
            });
        }
    }, {
        key: "enhance",
        value: function enhance() {
            var _this4 = this;

            if (this._enhanced) return;
            this._enhanced = true;
            var next = pool.getNext();
            if (next.success) {
                if (this._usage && atom.config.get("omnisharp-atom.enhancedHighlighting")) {
                    var s = request({ filePath: this._usage.FileName, startLine: this._usage.Line, endLine: this._usage.EndLine, whitespace: this._whitespace }).subscribe(function (response) {
                        var grammar = _this4._grammar = (0, _highlight.getEnhancedGrammar)(next.result.editor, _lodash2.default.find(_omni.Omni.grammars, function (g) {
                            return _lodash2.default.some(g.fileTypes, function (ft) {
                                return _lodash2.default.endsWith(_this4._usage.FileName, "." + ft);
                            });
                        }), { readonly: true });
                        grammar.setResponses(response);
                        fastdom.mutate(function () {
                            return _this4._attachEditor(next.result, grammar);
                        });
                    });
                    this._disposable.add(s);
                    return;
                }
                fastdom.mutate(function () {
                    return _this4._attachEditor(next.result);
                });
            } else {
                (function () {
                    var s = pool.request().subscribe(function (result) {
                        if (_this4._usage && atom.config.get("omnisharp-atom.enhancedHighlighting")) {
                            var _s = request({ filePath: _this4._usage.FileName, startLine: _this4._usage.Line, endLine: _this4._usage.EndLine, whitespace: _this4._whitespace }).subscribe(function (response) {
                                var grammar = _this4._grammar = (0, _highlight.getEnhancedGrammar)(result.editor, _lodash2.default.find(_omni.Omni.grammars, function (g) {
                                    return _lodash2.default.some(g.fileTypes, function (ft) {
                                        return _lodash2.default.endsWith(_this4._usage.FileName, "." + ft);
                                    });
                                }), { readonly: true });
                                grammar.setResponses(response);
                                fastdom.mutate(function () {
                                    return _this4._attachEditor(result, grammar);
                                });
                            });
                            _this4._disposable.add(_s);
                            return;
                        }
                        fastdom.mutate(function () {
                            return _this4._attachEditor(result);
                        });
                        _this4._disposable.remove(s);
                    });
                    _this4._disposable.add(s);
                })();
            }
        }
    }, {
        key: "_attachEditor",
        value: function _attachEditor(result, grammar) {
            if (this._pre) {
                this._pre.remove();
                this._pre = null;
            }
            this._release = result;
            this._disposable.add(result);
            this._editorElement = result.element;
            this._editor = result.editor;
            this.setEditorText(grammar || this._grammar);
            this.appendChild(this._editorElement);
        }
    }, {
        key: "_detachEditor",
        value: function _detachEditor(append) {
            if (append) {
                this._pre = document.createElement("pre");
                this._pre.innerText = this._usage && this._usage.Text || this.editorText;
                this._pre.style.fontSize = atom.config.get("editor.fontSize") + "px !important";
                this.appendChild(this._pre);
            }
            if (this._release) {
                this._disposable.remove(this._release);
                this._release.dispose();
            }
            if (this._editorElement) this._editorElement.remove();
            this._editor = null;
            this._editorElement = null;
            this._enhanced = false;
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            this._detachEditor();
            if (this._pre) {
                this._pre.remove();
                this._pre.innerText = "";
            }
            this._disposable.dispose();
        }
    }, {
        key: "usage",
        get: function get() {
            return this._usage;
        },
        set: function set(value) {
            this._editorText = null;
            this._usage = value;
            this._whitespace = 0;
            var text = this._usage.Text;
            var usageLength = this._usage.EndColumn - this._usage.Column;
            for (var i = this._usage.Column; i > -1; i--) {
                var chunk = text.substr(i);
                console.log(chunk);
                var match = chunk.match(/^((?:@|_|[a-zA-Z])[\w]*)(?:[\W]|$)/);
                if (!match) continue;
                console.log(match);
                var v = match[1];
                if (v.length === usageLength) {
                    this._whitespace = this._usage.Column - i;
                    break;
                }
            }
            if (this._pre) {
                this._pre.innerText = _lodash2.default.trimStart(value.Text);
            }
            if (this._editor) {
                this.setEditorText(this._grammar);
            }
        }
    }, {
        key: "editorText",
        get: function get() {
            return this._editorText;
        },
        set: function set(value) {
            this._usage = null;
            this._editorText = value;
            if (this._pre) {
                this._pre.innerText = _lodash2.default.trimStart(value);
            }
            if (this._editor) {
                this.setEditorText(this._grammar);
            }
        }
    }]);

    return EditorElement;
}(HTMLSpanElement);

function request(_ref) {
    var filePath = _ref.filePath;
    var startLine = _ref.startLine;
    var endLine = _ref.endLine;
    var whitespace = _ref.whitespace;

    return _omni.Omni.request(function (client) {
        return client.highlight({
            Buffer: null,
            FileName: filePath,
            Lines: _lodash2.default.range(startLine, endLine),
            ExcludeClassifications: customExcludes
        }, { silent: true });
    }).map(function (response) {
        return (0, _lodash2.default)(response.Highlights).map(function (x) {
            return {
                StartLine: x.StartLine - startLine,
                StartColumn: x.StartLine === startLine ? x.StartColumn - whitespace : x.StartColumn,
                EndLine: x.EndLine - startLine,
                EndColumn: x.StartLine === startLine ? x.EndColumn - whitespace : x.EndColumn,
                Kind: x.Kind,
                Projects: x.Projects
            };
        }).value();
    }).filter(function (x) {
        return x.length > 0;
    });
}
exports.EditorElement = document.registerElement("omnisharp-editor-element", { prototype: EditorElement.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90ZXh0LWVkaXRvci1wb29sLmpzIiwibGliL3ZpZXdzL3RleHQtZWRpdG9yLXBvb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztBQ0VBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTFCO0FBRUosSUFBTSxpQkFBaUIsa0NBQXVCLE1BQXZCLENBQThCLENBQ2pELENBRGlELEVBRWpELENBRmlELEVBR2pELEVBSGlELENBQTlCLENBQWpCO0FBTU4sSUFBTSxPQUFPLFlBQUM7QUFDVixRQUFNLGNBQWMsRUFBZCxDQURJO0FBRVYsUUFBTSxPQUEwRSxFQUExRSxDQUZJO0FBSVYsUUFBTSxjQUFjLGlCQUFFLFFBQUYsQ0FBVyxTQUFBLFdBQUEsR0FBQTtBQUMzQixZQUFJLEtBQUssTUFBTCxHQUFjLFdBQWQsRUFBMkI7QUFDM0IsZ0JBQU0sTUFBTSxLQUFLLEdBQUwsQ0FBUyxLQUFLLE1BQUwsR0FBYyxXQUFkLEVBQTJCLEVBQXBDLENBQU4sQ0FEcUI7QUFFM0IsZ0JBQUksU0FBUyxLQUFLLE1BQUwsQ0FBWSxDQUFaLEVBQWUsR0FBZixDQUFULENBRnVCO0FBRzNCLG1CQUFPLE9BQVAsQ0FBZTt1QkFBSyxFQUFFLE1BQUYsQ0FBUyxPQUFUO2FBQUwsQ0FBZixDQUgyQjtBQUszQiwwQkFMMkI7U0FBL0I7S0FEMkIsRUFRNUIsS0FSaUIsRUFRVixFQUFFLFVBQVUsSUFBVixFQVJRLENBQWQsQ0FKSTs7UUFjVjtBQVlJLHdCQUFtQixNQUFuQixFQUFtRCxPQUFuRCxFQUFvRjs7Ozs7QUFBakUsaUJBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBaUU7QUFBakMsaUJBQUEsT0FBQSxHQUFBLE9BQUEsQ0FBaUM7QUFYNUUsaUJBQUEsV0FBQSxHQUFjLDRCQUFXLE1BQVgsQ0FBa0IsWUFBQTtvQkFDN0Isc0JBRDZCO29CQUNyQix3QkFEcUI7O0FBRW5DLHdCQUFnQixN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LENBaUJGLE1BakJFLENBaUJLO2VBQUssRUFBRSxNQUFGLEdBQVcsQ0FBWDtLQUFMLENBakJaLENBRHNJO0NBQTFJO0FBcUJNLFFBQVMsYUFBVCxHQUErQixTQUFVLGVBQVYsQ0FBMEIsMEJBQTFCLEVBQXNELEVBQUUsV0FBVyxjQUFjLFNBQWQsRUFBbkUsQ0FBL0IiLCJmaWxlIjoibGliL3ZpZXdzL3RleHQtZWRpdG9yLXBvb2wuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgZ2V0RW5oYW5jZWRHcmFtbWFyLCBhdWdtZW50RWRpdG9yLCBFeGNsdWRlQ2xhc3NpZmljYXRpb25zIH0gZnJvbSBcIi4uL2ZlYXR1cmVzL2hpZ2hsaWdodFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmNvbnN0IGN1c3RvbUV4Y2x1ZGVzID0gRXhjbHVkZUNsYXNzaWZpY2F0aW9ucy5jb25jYXQoW1xuICAgIDgsXG4gICAgOSxcbiAgICAxMCxcbl0pO1xuY29uc3QgcG9vbCA9IChmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgTlVNX1RPX0tFRVAgPSAxMDtcbiAgICBjb25zdCBQT09MID0gW107XG4gICAgY29uc3QgY2xlYW51cFBvb2wgPSBfLnRocm90dGxlKGZ1bmN0aW9uIGNsZWFudXBQb29sKCkge1xuICAgICAgICBpZiAoUE9PTC5sZW5ndGggPiBOVU1fVE9fS0VFUCkge1xuICAgICAgICAgICAgY29uc3QgbGVuID0gTWF0aC5taW4oUE9PTC5sZW5ndGggLSBOVU1fVE9fS0VFUCwgMTApO1xuICAgICAgICAgICAgbGV0IHJlbW92ZSA9IFBPT0wuc3BsaWNlKDAsIGxlbik7XG4gICAgICAgICAgICByZW1vdmUuZm9yRWFjaCh4ID0+IHguZWRpdG9yLmRlc3Ryb3koKSk7XG4gICAgICAgICAgICBjbGVhbnVwUG9vbCgpO1xuICAgICAgICB9XG4gICAgfSwgMTAwMDAsIHsgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgY2xhc3MgUmVzdWx0IHtcbiAgICAgICAgY29uc3RydWN0b3IoZWRpdG9yLCBlbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgZWRpdG9yLCBlbGVtZW50IH0gPSB0aGlzO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgUE9PTC5wdXNoKHsgZWRpdG9yLCBlbGVtZW50IH0pO1xuICAgICAgICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKE9tbmkuZ3JhbW1hcnNbMF0pO1xuICAgICAgICAgICAgICAgIGVkaXRvci5zZXRUZXh0KFwiXCIpO1xuICAgICAgICAgICAgICAgIGNsZWFudXBQb29sKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBkaXNwb3NlKCkge1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcG9wdWxhdGVQb29sKCkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5pbnRlcnZhbCg1MClcbiAgICAgICAgICAgIC50YWtlKDEwKVxuICAgICAgICAgICAgLm1hcCgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3JFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImF0b20tdGV4dC1lZGl0b3JcIik7XG4gICAgICAgICAgICBlZGl0b3JFbGVtZW50LnNldEF0dHJpYnV0ZU5vZGUoZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKFwiZ3V0dGVyLWhpZGRlblwiKSk7XG4gICAgICAgICAgICBlZGl0b3JFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcInRhYmluZGV4XCIpO1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gZWRpdG9yRWxlbWVudC5nZXRNb2RlbCgpO1xuICAgICAgICAgICAgZWRpdG9yLmdldERlY29yYXRpb25zKHsgY2xhc3M6IFwiY3Vyc29yLWxpbmVcIiwgdHlwZTogXCJsaW5lXCIgfSlbMF0uZGVzdHJveSgpO1xuICAgICAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIoT21uaS5ncmFtbWFyc1swXSk7XG4gICAgICAgICAgICBlZGl0b3Iuc2V0U29mdFdyYXBwZWQodHJ1ZSk7XG4gICAgICAgICAgICBhdWdtZW50RWRpdG9yKGVkaXRvcik7XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yRWxlbWVudDtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5kbygoZWxlbWVudCkgPT4gUE9PTC5wdXNoKHsgZWxlbWVudCwgZWRpdG9yOiBlbGVtZW50LmdldE1vZGVsKCkgfSkpXG4gICAgICAgICAgICAudG9BcnJheSgpO1xuICAgIH1cbiAgICBzZXRUaW1lb3V0KCgpID0+IHBvcHVsYXRlUG9vbCgpLCAxMDAwMCk7XG4gICAgZnVuY3Rpb24gcmVxdWVzdCgpIHtcbiAgICAgICAgaWYgKFBPT0wubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCB7IGVkaXRvciwgZWxlbWVudCB9ID0gUE9PTC5wb3AoKTtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKG5ldyBSZXN1bHQoZWRpdG9yLCBlbGVtZW50KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcG9wdWxhdGVQb29sKCkuZmxhdE1hcCgoKSA9PiByZXF1ZXN0KCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGdldE5leHQoKSB7XG4gICAgICAgICAgICBpZiAoIVBPT0wubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlc3VsdDogbnVsbCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeyBlZGl0b3IsIGVsZW1lbnQgfSA9IFBPT0wucG9wKCk7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IG5ldyBSZXN1bHQoZWRpdG9yLCBlbGVtZW50KSB9O1xuICAgICAgICB9LFxuICAgICAgICByZXF1ZXN0XG4gICAgfTtcbn0pKCk7XG5leHBvcnQgY2xhc3MgRWRpdG9yRWxlbWVudCBleHRlbmRzIEhUTUxTcGFuRWxlbWVudCB7XG4gICAgZ2V0IHVzYWdlKCkgeyByZXR1cm4gdGhpcy5fdXNhZ2U7IH1cbiAgICBzZXQgdXNhZ2UodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yVGV4dCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3VzYWdlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX3doaXRlc3BhY2UgPSAwO1xuICAgICAgICBjb25zdCB0ZXh0ID0gdGhpcy5fdXNhZ2UuVGV4dDtcbiAgICAgICAgY29uc3QgdXNhZ2VMZW5ndGggPSB0aGlzLl91c2FnZS5FbmRDb2x1bW4gLSB0aGlzLl91c2FnZS5Db2x1bW47XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLl91c2FnZS5Db2x1bW47IGkgPiAtMTsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBjaHVuayA9IHRleHQuc3Vic3RyKGkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY2h1bmspO1xuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSBjaHVuay5tYXRjaCgvXigoPzpAfF98W2EtekEtWl0pW1xcd10qKSg/OltcXFddfCQpLyk7XG4gICAgICAgICAgICBpZiAoIW1hdGNoKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc29sZS5sb2cobWF0Y2gpO1xuICAgICAgICAgICAgY29uc3QgdiA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgaWYgKHYubGVuZ3RoID09PSB1c2FnZUxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3doaXRlc3BhY2UgPSB0aGlzLl91c2FnZS5Db2x1bW4gLSBpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSBfLnRyaW1TdGFydCh2YWx1ZS5UZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fZWRpdG9yKSB7XG4gICAgICAgICAgICB0aGlzLnNldEVkaXRvclRleHQodGhpcy5fZ3JhbW1hcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IGVkaXRvclRleHQoKSB7IHJldHVybiB0aGlzLl9lZGl0b3JUZXh0OyB9XG4gICAgc2V0IGVkaXRvclRleHQodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fdXNhZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLl9lZGl0b3JUZXh0ID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSBfLnRyaW1TdGFydCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2VkaXRvcikge1xuICAgICAgICAgICAgdGhpcy5zZXRFZGl0b3JUZXh0KHRoaXMuX2dyYW1tYXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldEVkaXRvclRleHQoZ3JhbW1hcikge1xuICAgICAgICBpZiAodGhpcy5fdXNhZ2UpIHtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSB0aGlzLl91c2FnZS5UZXh0O1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLl9zZXRHcmFtbWFyKGdyYW1tYXIpO1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLnNldFRleHQoXy50cmltU3RhcnQodGV4dCkpO1xuICAgICAgICAgICAgY29uc3QgbWFya2VyID0gdGhpcy5fZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShbWzAsICt0aGlzLl91c2FnZS5Db2x1bW4gLSB0aGlzLl93aGl0ZXNwYWNlXSwgWyt0aGlzLl91c2FnZS5FbmRMaW5lIC0gK3RoaXMuX3VzYWdlLkxpbmUsICt0aGlzLl91c2FnZS5FbmRDb2x1bW4gLSB0aGlzLl93aGl0ZXNwYWNlXV0pO1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiBcImhpZ2hsaWdodFwiLCBjbGFzczogXCJmaW5kdXNhZ2VzLXVuZGVybGluZVwiIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLnNldFRleHQoXy50cmltKHRoaXMuX2VkaXRvclRleHQpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgaWYgKCF0aGlzLl9wcmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgICAgICB0aGlzLl9wcmUuaW5uZXJUZXh0ID0gdGhpcy5fdXNhZ2UgJiYgdGhpcy5fdXNhZ2UuVGV4dCB8fCB0aGlzLmVkaXRvclRleHQ7XG4gICAgICAgICAgICB0aGlzLl9wcmUuc3R5bGUuZm9udFNpemUgPSBgJHthdG9tLmNvbmZpZy5nZXQoXCJlZGl0b3IuZm9udFNpemVcIil9cHggIWltcG9ydGFudGA7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9wcmUpO1xuICAgIH1cbiAgICByZXZlcnQoKSB7XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2RldGFjaEVkaXRvcih0cnVlKSk7XG4gICAgfVxuICAgIGVuaGFuY2UoKSB7XG4gICAgICAgIGlmICh0aGlzLl9lbmhhbmNlZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5fZW5oYW5jZWQgPSB0cnVlO1xuICAgICAgICBjb25zdCBuZXh0ID0gcG9vbC5nZXROZXh0KCk7XG4gICAgICAgIGlmIChuZXh0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl91c2FnZSAmJiBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZ1wiKSkge1xuICAgICAgICAgICAgICAgIGxldCBzID0gcmVxdWVzdCh7IGZpbGVQYXRoOiB0aGlzLl91c2FnZS5GaWxlTmFtZSwgc3RhcnRMaW5lOiB0aGlzLl91c2FnZS5MaW5lLCBlbmRMaW5lOiB0aGlzLl91c2FnZS5FbmRMaW5lLCB3aGl0ZXNwYWNlOiB0aGlzLl93aGl0ZXNwYWNlIH0pXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFtbWFyID0gdGhpcy5fZ3JhbW1hciA9IGdldEVuaGFuY2VkR3JhbW1hcihuZXh0LnJlc3VsdC5lZGl0b3IsIF8uZmluZChPbW5pLmdyYW1tYXJzLCBnID0+IF8uc29tZShnLmZpbGVUeXBlcywgZnQgPT4gXy5lbmRzV2l0aCh0aGlzLl91c2FnZS5GaWxlTmFtZSwgYC4ke2Z0fWApKSksIHsgcmVhZG9ubHk6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIGdyYW1tYXIuc2V0UmVzcG9uc2VzKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fYXR0YWNoRWRpdG9yKG5leHQucmVzdWx0LCBncmFtbWFyKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fYXR0YWNoRWRpdG9yKG5leHQucmVzdWx0KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgcyA9IHBvb2wucmVxdWVzdCgpLnN1YnNjcmliZSgocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3VzYWdlICYmIGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzID0gcmVxdWVzdCh7IGZpbGVQYXRoOiB0aGlzLl91c2FnZS5GaWxlTmFtZSwgc3RhcnRMaW5lOiB0aGlzLl91c2FnZS5MaW5lLCBlbmRMaW5lOiB0aGlzLl91c2FnZS5FbmRMaW5lLCB3aGl0ZXNwYWNlOiB0aGlzLl93aGl0ZXNwYWNlIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW1tYXIgPSB0aGlzLl9ncmFtbWFyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKHJlc3VsdC5lZGl0b3IsIF8uZmluZChPbW5pLmdyYW1tYXJzLCBnID0+IF8uc29tZShnLmZpbGVUeXBlcywgZnQgPT4gXy5lbmRzV2l0aCh0aGlzLl91c2FnZS5GaWxlTmFtZSwgYC4ke2Z0fWApKSksIHsgcmVhZG9ubHk6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBncmFtbWFyLnNldFJlc3BvbnNlcyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9hdHRhY2hFZGl0b3IocmVzdWx0LCBncmFtbWFyKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9hdHRhY2hFZGl0b3IocmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUocyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9hdHRhY2hFZGl0b3IocmVzdWx0LCBncmFtbWFyKSB7XG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuX3ByZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVsZWFzZSA9IHJlc3VsdDtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocmVzdWx0KTtcbiAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudCA9IHJlc3VsdC5lbGVtZW50O1xuICAgICAgICB0aGlzLl9lZGl0b3IgPSByZXN1bHQuZWRpdG9yO1xuICAgICAgICB0aGlzLnNldEVkaXRvclRleHQoZ3JhbW1hciB8fCB0aGlzLl9ncmFtbWFyKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9lZGl0b3JFbGVtZW50KTtcbiAgICB9XG4gICAgX2RldGFjaEVkaXRvcihhcHBlbmQpIHtcbiAgICAgICAgaWYgKGFwcGVuZCkge1xuICAgICAgICAgICAgdGhpcy5fcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSB0aGlzLl91c2FnZSAmJiB0aGlzLl91c2FnZS5UZXh0IHx8IHRoaXMuZWRpdG9yVGV4dDtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5zdHlsZS5mb250U2l6ZSA9IGAke2F0b20uY29uZmlnLmdldChcImVkaXRvci5mb250U2l6ZVwiKX1weCAhaW1wb3J0YW50YDtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fcHJlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcmVsZWFzZSkge1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUodGhpcy5fcmVsZWFzZSk7XG4gICAgICAgICAgICB0aGlzLl9yZWxlYXNlLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fZWRpdG9yRWxlbWVudClcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuX2VkaXRvciA9IG51bGw7XG4gICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9lbmhhbmNlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9kZXRhY2hFZGl0b3IoKTtcbiAgICAgICAgaWYgKHRoaXMuX3ByZSkge1xuICAgICAgICAgICAgdGhpcy5fcHJlLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZnVuY3Rpb24gcmVxdWVzdCh7IGZpbGVQYXRoLCBzdGFydExpbmUsIGVuZExpbmUsIHdoaXRlc3BhY2UgfSkge1xuICAgIHJldHVybiBPbW5pLnJlcXVlc3QoY2xpZW50ID0+IGNsaWVudC5oaWdobGlnaHQoe1xuICAgICAgICBCdWZmZXI6IG51bGwsXG4gICAgICAgIEZpbGVOYW1lOiBmaWxlUGF0aCxcbiAgICAgICAgTGluZXM6IF8ucmFuZ2Uoc3RhcnRMaW5lLCBlbmRMaW5lKSxcbiAgICAgICAgRXhjbHVkZUNsYXNzaWZpY2F0aW9uczogY3VzdG9tRXhjbHVkZXNcbiAgICB9LCB7IHNpbGVudDogdHJ1ZSB9KSlcbiAgICAgICAgLm1hcChyZXNwb25zZSA9PiBfKHJlc3BvbnNlLkhpZ2hsaWdodHMpXG4gICAgICAgIC5tYXAoeCA9PiAoe1xuICAgICAgICBTdGFydExpbmU6IHguU3RhcnRMaW5lIC0gc3RhcnRMaW5lLFxuICAgICAgICBTdGFydENvbHVtbjogKHguU3RhcnRMaW5lID09PSBzdGFydExpbmUgPyB4LlN0YXJ0Q29sdW1uIC0gd2hpdGVzcGFjZSA6IHguU3RhcnRDb2x1bW4pLFxuICAgICAgICBFbmRMaW5lOiB4LkVuZExpbmUgLSBzdGFydExpbmUsXG4gICAgICAgIEVuZENvbHVtbjogKHguU3RhcnRMaW5lID09PSBzdGFydExpbmUgPyB4LkVuZENvbHVtbiAtIHdoaXRlc3BhY2UgOiB4LkVuZENvbHVtbiksXG4gICAgICAgIEtpbmQ6IHguS2luZCxcbiAgICAgICAgUHJvamVjdHM6IHguUHJvamVjdHNcbiAgICB9KSlcbiAgICAgICAgLnZhbHVlKCkpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lmxlbmd0aCA+IDApO1xufVxuZXhwb3J0cy5FZGl0b3JFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWVkaXRvci1lbGVtZW50XCIsIHsgcHJvdG90eXBlOiBFZGl0b3JFbGVtZW50LnByb3RvdHlwZSB9KTtcbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7RGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtnZXRFbmhhbmNlZEdyYW1tYXIsIGF1Z21lbnRFZGl0b3IsIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnN9IGZyb20gXCIuLi9mZWF0dXJlcy9oaWdobGlnaHRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxubGV0IGZhc3Rkb206IHR5cGVvZiBGYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XHJcblxyXG5jb25zdCBjdXN0b21FeGNsdWRlcyA9IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMuY29uY2F0KFtcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5JZGVudGlmaWVyLFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLlByZXByb2Nlc3NvcktleXdvcmQsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uRXhjbHVkZWRDb2RlLFxyXG5dKTtcclxuXHJcbmNvbnN0IHBvb2wgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCBOVU1fVE9fS0VFUCA9IDEwO1xyXG4gICAgY29uc3QgUE9PTDogeyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjsgZWxlbWVudDogQXRvbS5UZXh0RWRpdG9yQ29tcG9uZW50OyB9W10gPSBbXTtcclxuXHJcbiAgICBjb25zdCBjbGVhbnVwUG9vbCA9IF8udGhyb3R0bGUoZnVuY3Rpb24gY2xlYW51cFBvb2woKSB7XHJcbiAgICAgICAgaWYgKFBPT0wubGVuZ3RoID4gTlVNX1RPX0tFRVApIHtcclxuICAgICAgICAgICAgY29uc3QgbGVuID0gTWF0aC5taW4oUE9PTC5sZW5ndGggLSBOVU1fVE9fS0VFUCwgMTApO1xyXG4gICAgICAgICAgICBsZXQgcmVtb3ZlID0gUE9PTC5zcGxpY2UoMCwgbGVuKTtcclxuICAgICAgICAgICAgcmVtb3ZlLmZvckVhY2goeCA9PiB4LmVkaXRvci5kZXN0cm95KCkpO1xyXG5cclxuICAgICAgICAgICAgY2xlYW51cFBvb2woKTtcclxuICAgICAgICB9XHJcbiAgICB9LCAxMDAwMCwgeyB0cmFpbGluZzogdHJ1ZSB9KTtcclxuXHJcbiAgICBjbGFzcyBSZXN1bHQgaW1wbGVtZW50cyBJRGlzcG9zYWJsZSB7XHJcbiAgICAgICAgcHJpdmF0ZSBfZGlzcG9zYWJsZSA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qge2VkaXRvciwgZWxlbWVudH0gPSB0aGlzO1xyXG4gICAgICAgICAgICAoZWxlbWVudCBhcyBhbnkpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBQT09MLnB1c2goeyBlZGl0b3IsIGVsZW1lbnQgfSk7XHJcblxyXG4gICAgICAgICAgICBlZGl0b3Iuc2V0R3JhbW1hcihPbW5pLmdyYW1tYXJzWzBdKTtcclxuICAgICAgICAgICAgZWRpdG9yLnNldFRleHQoXCJcIik7XHJcblxyXG4gICAgICAgICAgICBjbGVhbnVwUG9vbCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIHB1YmxpYyBlbGVtZW50OiBBdG9tLlRleHRFZGl0b3JDb21wb25lbnQpIHsgfVxyXG5cclxuICAgICAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBvcHVsYXRlUG9vbCgpIHtcclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5pbnRlcnZhbCg1MClcclxuICAgICAgICAgICAgLnRha2UoMTApXHJcbiAgICAgICAgICAgIC5tYXAoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZWRpdG9yRWxlbWVudCA9IDxhbnk+ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImF0b20tdGV4dC1lZGl0b3JcIik7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3JFbGVtZW50LnNldEF0dHJpYnV0ZU5vZGUoZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKFwiZ3V0dGVyLWhpZGRlblwiKSk7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3JFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcInRhYmluZGV4XCIpOyAvLyBtYWtlIHJlYWQtb25seVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9ICg8YW55PmVkaXRvckVsZW1lbnQpLmdldE1vZGVsKCk7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0RGVjb3JhdGlvbnMoeyBjbGFzczogXCJjdXJzb3ItbGluZVwiLCB0eXBlOiBcImxpbmVcIiB9KVswXS5kZXN0cm95KCk7IC8vIHJlbW92ZSB0aGUgZGVmYXVsdCBzZWxlY3Rpb24gb2YgYSBsaW5lIGluIGVhY2ggZWRpdG9yXHJcbiAgICAgICAgICAgICAgICBlZGl0b3Iuc2V0R3JhbW1hcihPbW5pLmdyYW1tYXJzWzBdKTtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5zZXRTb2Z0V3JhcHBlZCh0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBhdWdtZW50RWRpdG9yKGVkaXRvcik7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxBdG9tLlRleHRFZGl0b3JDb21wb25lbnQ+ZWRpdG9yRWxlbWVudDtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmRvKChlbGVtZW50KSA9PiBQT09MLnB1c2goeyBlbGVtZW50LCBlZGl0b3I6ICg8YW55PmVsZW1lbnQpLmdldE1vZGVsKCkgfSkpXHJcbiAgICAgICAgICAgIC50b0FycmF5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGltZW91dCgoKSA9PiBwb3B1bGF0ZVBvb2woKSwgMTAwMDApO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlcXVlc3QoKTogT2JzZXJ2YWJsZTxSZXN1bHQ+IHtcclxuICAgICAgICBpZiAoUE9PTC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3Qge2VkaXRvciwgZWxlbWVudH0gPSBQT09MLnBvcCgpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YobmV3IFJlc3VsdChlZGl0b3IsIGVsZW1lbnQpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gcG9wdWxhdGVQb29sKCkuZmxhdE1hcCgoKSA9PiByZXF1ZXN0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGdldE5leHQoKSB7XHJcbiAgICAgICAgICAgIGlmICghUE9PTC5sZW5ndGgpIHsgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlc3VsdDogbnVsbCB9OyB9XHJcbiAgICAgICAgICAgIGNvbnN0IHtlZGl0b3IsIGVsZW1lbnR9ID0gUE9PTC5wb3AoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBuZXcgUmVzdWx0KGVkaXRvciwgZWxlbWVudCkgfTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlcXVlc3RcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG5leHBvcnQgY2xhc3MgRWRpdG9yRWxlbWVudCBleHRlbmRzIEhUTUxTcGFuRWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwcml2YXRlIF9wcmU6IEhUTUxQcmVFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX3JlbGVhc2U6IElEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfZWRpdG9yRWxlbWVudDogQXRvbS5UZXh0RWRpdG9yQ29tcG9uZW50O1xyXG4gICAgcHJpdmF0ZSBfZWRpdG9yOiBBdG9tLlRleHRFZGl0b3I7XHJcbiAgICBwcml2YXRlIF93aGl0ZXNwYWNlOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9ncmFtbWFyOiBGaXJzdE1hdGUuR3JhbW1hcjtcclxuXHJcbiAgICBwcml2YXRlIF91c2FnZTogTW9kZWxzLlF1aWNrRml4O1xyXG4gICAgcHVibGljIGdldCB1c2FnZSgpIHsgcmV0dXJuIHRoaXMuX3VzYWdlOyB9XHJcbiAgICBwdWJsaWMgc2V0IHVzYWdlKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yVGV4dCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fdXNhZ2UgPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5fd2hpdGVzcGFjZSA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0IHRleHQgPSB0aGlzLl91c2FnZS5UZXh0O1xyXG4gICAgICAgIGNvbnN0IHVzYWdlTGVuZ3RoID0gdGhpcy5fdXNhZ2UuRW5kQ29sdW1uIC0gdGhpcy5fdXNhZ2UuQ29sdW1uO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLl91c2FnZS5Db2x1bW47IGkgPiAtMTsgaS0tKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNodW5rID0gdGV4dC5zdWJzdHIoaSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNodW5rKTtcclxuICAgICAgICAgICAgLy8gVGhpcyByZWdleCBwZXJoYXBzIG5lZWRzIHRvIGJlIGltcHJvdmVkXHJcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gY2h1bmsubWF0Y2goL14oKD86QHxffFthLXpBLVpdKVtcXHddKikoPzpbXFxXXXwkKS8pO1xyXG4gICAgICAgICAgICBpZiAoIW1hdGNoKSBjb250aW51ZTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cobWF0Y2gpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdiA9IG1hdGNoWzFdO1xyXG4gICAgICAgICAgICBpZiAodi5sZW5ndGggPT09IHVzYWdlTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl93aGl0ZXNwYWNlID0gdGhpcy5fdXNhZ2UuQ29sdW1uIC0gaTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fcHJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSBfLnRyaW1TdGFydCh2YWx1ZS5UZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRFZGl0b3JUZXh0KHRoaXMuX2dyYW1tYXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9lZGl0b3JUZXh0OiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IGVkaXRvclRleHQoKSB7IHJldHVybiB0aGlzLl9lZGl0b3JUZXh0OyB9XHJcbiAgICBwdWJsaWMgc2V0IGVkaXRvclRleHQodmFsdWUpIHtcclxuICAgICAgICB0aGlzLl91c2FnZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yVGV4dCA9IHZhbHVlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fcHJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSBfLnRyaW1TdGFydCh2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZWRpdG9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RWRpdG9yVGV4dCh0aGlzLl9ncmFtbWFyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXRFZGl0b3JUZXh0KGdyYW1tYXI6IEZpcnN0TWF0ZS5HcmFtbWFyKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3VzYWdlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSB0aGlzLl91c2FnZS5UZXh0O1xyXG5cclxuICAgICAgICAgICAgKHRoaXMuX2VkaXRvciBhcyBhbnkpLl9zZXRHcmFtbWFyKDxhbnk+Z3JhbW1hcik7XHJcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvci5zZXRUZXh0KF8udHJpbVN0YXJ0KHRleHQpKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG1hcmtlciA9IHRoaXMuX2VkaXRvci5tYXJrQnVmZmVyUmFuZ2UoW1swLCArdGhpcy5fdXNhZ2UuQ29sdW1uIC0gdGhpcy5fd2hpdGVzcGFjZV0sIFsrdGhpcy5fdXNhZ2UuRW5kTGluZSAtICt0aGlzLl91c2FnZS5MaW5lLCArdGhpcy5fdXNhZ2UuRW5kQ29sdW1uIC0gdGhpcy5fd2hpdGVzcGFjZV1dKTtcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiBcImhpZ2hsaWdodFwiLCBjbGFzczogXCJmaW5kdXNhZ2VzLXVuZGVybGluZVwiIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvci5zZXRUZXh0KF8udHJpbSh0aGlzLl9lZGl0b3JUZXh0KSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGlmICghdGhpcy5fcHJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSB0aGlzLl91c2FnZSAmJiB0aGlzLl91c2FnZS5UZXh0IHx8IHRoaXMuZWRpdG9yVGV4dDtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLnN0eWxlLmZvbnRTaXplID0gYCR7YXRvbS5jb25maWcuZ2V0KFwiZWRpdG9yLmZvbnRTaXplXCIpfXB4ICFpbXBvcnRhbnRgO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX3ByZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJldmVydCgpIHtcclxuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9kZXRhY2hFZGl0b3IodHJ1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2VuaGFuY2VkOiBib29sZWFuO1xyXG4gICAgcHVibGljIGVuaGFuY2UoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2VuaGFuY2VkKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5fZW5oYW5jZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBjb25zdCBuZXh0ID0gcG9vbC5nZXROZXh0KCk7XHJcbiAgICAgICAgaWYgKG5leHQuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fdXNhZ2UgJiYgYXRvbS5jb25maWcuZ2V0PGJvb2xlYW4+KFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmdcIikpIHtcclxuICAgICAgICAgICAgICAgIGxldCBzID0gcmVxdWVzdCh7IGZpbGVQYXRoOiB0aGlzLl91c2FnZS5GaWxlTmFtZSwgc3RhcnRMaW5lOiB0aGlzLl91c2FnZS5MaW5lLCBlbmRMaW5lOiB0aGlzLl91c2FnZS5FbmRMaW5lLCB3aGl0ZXNwYWNlOiB0aGlzLl93aGl0ZXNwYWNlIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW1tYXIgPSB0aGlzLl9ncmFtbWFyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKG5leHQucmVzdWx0LmVkaXRvciwgXy5maW5kKE9tbmkuZ3JhbW1hcnMsIGcgPT4gXy5zb21lKCg8YW55PmcpLmZpbGVUeXBlcywgZnQgPT4gXy5lbmRzV2l0aCh0aGlzLl91c2FnZS5GaWxlTmFtZSwgYC4ke2Z0fWApKSksIHsgcmVhZG9ubHk6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmdyYW1tYXIpLnNldFJlc3BvbnNlcyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2F0dGFjaEVkaXRvcihuZXh0LnJlc3VsdCwgZ3JhbW1hcikpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fYXR0YWNoRWRpdG9yKG5leHQucmVzdWx0KSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IHMgPSBwb29sLnJlcXVlc3QoKS5zdWJzY3JpYmUoKHJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3VzYWdlICYmIGF0b20uY29uZmlnLmdldDxib29sZWFuPihcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHMgPSByZXF1ZXN0KHsgZmlsZVBhdGg6IHRoaXMuX3VzYWdlLkZpbGVOYW1lLCBzdGFydExpbmU6IHRoaXMuX3VzYWdlLkxpbmUsIGVuZExpbmU6IHRoaXMuX3VzYWdlLkVuZExpbmUsIHdoaXRlc3BhY2U6IHRoaXMuX3doaXRlc3BhY2UgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFtbWFyID0gdGhpcy5fZ3JhbW1hciA9IGdldEVuaGFuY2VkR3JhbW1hcihyZXN1bHQuZWRpdG9yLCBfLmZpbmQoT21uaS5ncmFtbWFycywgZyA9PiBfLnNvbWUoKDxhbnk+ZykuZmlsZVR5cGVzLCBmdCA9PiBfLmVuZHNXaXRoKHRoaXMuX3VzYWdlLkZpbGVOYW1lLCBgLiR7ZnR9YCkpKSwgeyByZWFkb25seTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmdyYW1tYXIpLnNldFJlc3BvbnNlcyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9hdHRhY2hFZGl0b3IocmVzdWx0LCBncmFtbWFyKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2F0dGFjaEVkaXRvcihyZXN1bHQpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUucmVtb3ZlKHMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2F0dGFjaEVkaXRvcihyZXN1bHQ6IHsgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3I7IGVsZW1lbnQ6IEF0b20uVGV4dEVkaXRvckNvbXBvbmVudDsgZGlzcG9zZTogKCkgPT4gdm9pZCB9LCBncmFtbWFyPzogRmlyc3RNYXRlLkdyYW1tYXIpIHtcclxuICAgICAgICBpZiAodGhpcy5fcHJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgdGhpcy5fcHJlID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3JlbGVhc2UgPSByZXN1bHQ7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocmVzdWx0KTtcclxuICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50ID0gcmVzdWx0LmVsZW1lbnQ7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gcmVzdWx0LmVkaXRvcjtcclxuICAgICAgICB0aGlzLnNldEVkaXRvclRleHQoZ3JhbW1hciB8fCB0aGlzLl9ncmFtbWFyKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKDxhbnk+dGhpcy5fZWRpdG9yRWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZGV0YWNoRWRpdG9yKGFwcGVuZD86IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAoYXBwZW5kKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSB0aGlzLl91c2FnZSAmJiB0aGlzLl91c2FnZS5UZXh0IHx8IHRoaXMuZWRpdG9yVGV4dDtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLnN0eWxlLmZvbnRTaXplID0gYCR7YXRvbS5jb25maWcuZ2V0KFwiZWRpdG9yLmZvbnRTaXplXCIpfXB4ICFpbXBvcnRhbnRgO1xyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX3ByZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fcmVsZWFzZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLl9yZWxlYXNlKTtcclxuICAgICAgICAgICAgdGhpcy5fcmVsZWFzZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZWRpdG9yRWxlbWVudClcclxuICAgICAgICAgICAgKHRoaXMuX2VkaXRvckVsZW1lbnQgYXMgYW55KS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50ID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9lbmhhbmNlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2RldGFjaEVkaXRvcigpO1xyXG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUuaW5uZXJUZXh0ID0gXCJcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlcXVlc3Qoe2ZpbGVQYXRoLCBzdGFydExpbmUsIGVuZExpbmUsIHdoaXRlc3BhY2V9OiB7IGZpbGVQYXRoOiBzdHJpbmc7IHN0YXJ0TGluZTogbnVtYmVyOyBlbmRMaW5lOiBudW1iZXI7IHdoaXRlc3BhY2U6IG51bWJlcjsgfSkge1xyXG4gICAgcmV0dXJuIE9tbmkucmVxdWVzdChjbGllbnQgPT4gY2xpZW50LmhpZ2hsaWdodCh7XHJcbiAgICAgICAgQnVmZmVyOiBudWxsLFxyXG4gICAgICAgIEZpbGVOYW1lOiBmaWxlUGF0aCxcclxuICAgICAgICBMaW5lczogXy5yYW5nZShzdGFydExpbmUsIGVuZExpbmUpLFxyXG4gICAgICAgIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnM6IGN1c3RvbUV4Y2x1ZGVzXHJcbiAgICB9LCB7IHNpbGVudDogdHJ1ZSB9KSlcclxuICAgICAgICAubWFwKHJlc3BvbnNlID0+IF8ocmVzcG9uc2UuSGlnaGxpZ2h0cylcclxuICAgICAgICAgICAgLy8uZmlsdGVyKHggPT4geC5TdGFydExpbmUgPj0gcmVxdWVzdC5zdGFydExpbmUgJiYgeC5FbmRMaW5lIDw9IHJlcXVlc3QuZW5kTGluZSlcclxuICAgICAgICAgICAgLm1hcCh4ID0+ICh7XHJcbiAgICAgICAgICAgICAgICBTdGFydExpbmU6IHguU3RhcnRMaW5lIC0gc3RhcnRMaW5lLFxyXG4gICAgICAgICAgICAgICAgU3RhcnRDb2x1bW46ICh4LlN0YXJ0TGluZSA9PT0gc3RhcnRMaW5lID8geC5TdGFydENvbHVtbiAtIHdoaXRlc3BhY2UgOiB4LlN0YXJ0Q29sdW1uKSxcclxuICAgICAgICAgICAgICAgIEVuZExpbmU6IHguRW5kTGluZSAtIHN0YXJ0TGluZSxcclxuICAgICAgICAgICAgICAgIEVuZENvbHVtbjogKHguU3RhcnRMaW5lID09PSBzdGFydExpbmUgPyB4LkVuZENvbHVtbiAtIHdoaXRlc3BhY2UgOiB4LkVuZENvbHVtbiksXHJcbiAgICAgICAgICAgICAgICBLaW5kOiB4LktpbmQsXHJcbiAgICAgICAgICAgICAgICBQcm9qZWN0czogeC5Qcm9qZWN0c1xyXG4gICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgLnZhbHVlKCkpXHJcbiAgICAgICAgLmZpbHRlcih4ID0+IHgubGVuZ3RoID4gMCk7XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLkVkaXRvckVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWVkaXRvci1lbGVtZW50XCIsIHsgcHJvdG90eXBlOiBFZGl0b3JFbGVtZW50LnByb3RvdHlwZSB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
