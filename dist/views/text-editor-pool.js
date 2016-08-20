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

var _highlightV = require("../features/highlight-v1.9");

var _omni = require("../server/omni");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fastdom = require("fastdom");
var customExcludes = _highlightV.ExcludeClassifications.concat([8, 9, 10]);
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
            (0, _highlightV.augmentEditor)(editor);
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
                        var grammar = _this4._grammar = (0, _highlightV.getEnhancedGrammar)(next.result.editor, _lodash2.default.find(_omni.Omni.grammars, function (g) {
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
                                var grammar = _this4._grammar = (0, _highlightV.getEnhancedGrammar)(result.editor, _lodash2.default.find(_omni.Omni.grammars, function (g) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90ZXh0LWVkaXRvci1wb29sLmpzIiwibGliL3ZpZXdzL3RleHQtZWRpdG9yLXBvb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztBQ0VBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTlCO0FBRUEsSUFBTSxpQkFBaUIsbUNBQXVCLE1BQXZCLENBQThCLENBQ2pELENBRGlELEVBRWpELENBRmlELEVBR2pELEVBSGlELENBQTlCLENBQXZCO0FBTUEsSUFBTSxPQUFRLFlBQUE7QUFDVixRQUFNLGNBQWMsRUFBcEI7QUFDQSxRQUFNLE9BQTBFLEVBQWhGO0FBRUEsUUFBTSxjQUFjLGlCQUFFLFFBQUYsQ0FBVyxTQUFBLFdBQUEsR0FBQTtBQUMzQixZQUFJLEtBQUssTUFBTCxHQUFjLFdBQWxCLEVBQStCO0FBQzNCLGdCQUFNLE1BQU0sS0FBSyxHQUFMLENBQVMsS0FBSyxNQUFMLEdBQWMsV0FBdkIsRUFBb0MsRUFBcEMsQ0FBWjtBQUNBLGdCQUFJLFNBQVMsS0FBSyxNQUFMLENBQVksQ0FBWixFQUFlLEdBQWYsQ0FBYjtBQUNBLG1CQUFPLE9BQVAsQ0FBZTtBQUFBLHVCQUFLLEVBQUUsTUFBRixDQUFTLE9BQVQsRUFBTDtBQUFBLGFBQWY7QUFFQTtBQUNIO0FBQ0osS0FSbUIsRUFRakIsS0FSaUIsRUFRVixFQUFFLFVBQVUsSUFBWixFQVJVLENBQXBCOztBQUpVLFFBY1YsTUFkVTtBQTBCTix3QkFBbUIsTUFBbkIsRUFBbUQsT0FBbkQsRUFBb0Y7QUFBQTs7QUFBQTs7QUFBakUsaUJBQUEsTUFBQSxHQUFBLE1BQUE7QUFBZ0MsaUJBQUEsT0FBQSxHQUFBLE9BQUE7QUFYM0MsaUJBQUEsV0FBQSxHQUFjLDRCQUFXLE1BQVgsQ0FBa0IsWUFBQTtBQUFBLG9CQUM3QixNQUQ2QixTQUM3QixNQUQ2QjtBQUFBLG9CQUNyQixPQURxQixTQUNyQixPQURxQjs7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QUVLLFFBQVMsYUFBVCxHQUErQixTQUFVLGVBQVYsQ0FBMEIsMEJBQTFCLEVBQXNELEVBQUUsV0FBVyxjQUFjLFNBQTNCLEVBQXRELENBQS9CIiwiZmlsZSI6ImxpYi92aWV3cy90ZXh0LWVkaXRvci1wb29sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IGdldEVuaGFuY2VkR3JhbW1hciwgYXVnbWVudEVkaXRvciwgRXhjbHVkZUNsYXNzaWZpY2F0aW9ucyB9IGZyb20gXCIuLi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOVwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmNvbnN0IGN1c3RvbUV4Y2x1ZGVzID0gRXhjbHVkZUNsYXNzaWZpY2F0aW9ucy5jb25jYXQoW1xuICAgIDgsXG4gICAgOSxcbiAgICAxMCxcbl0pO1xuY29uc3QgcG9vbCA9IChmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgTlVNX1RPX0tFRVAgPSAxMDtcbiAgICBjb25zdCBQT09MID0gW107XG4gICAgY29uc3QgY2xlYW51cFBvb2wgPSBfLnRocm90dGxlKGZ1bmN0aW9uIGNsZWFudXBQb29sKCkge1xuICAgICAgICBpZiAoUE9PTC5sZW5ndGggPiBOVU1fVE9fS0VFUCkge1xuICAgICAgICAgICAgY29uc3QgbGVuID0gTWF0aC5taW4oUE9PTC5sZW5ndGggLSBOVU1fVE9fS0VFUCwgMTApO1xuICAgICAgICAgICAgbGV0IHJlbW92ZSA9IFBPT0wuc3BsaWNlKDAsIGxlbik7XG4gICAgICAgICAgICByZW1vdmUuZm9yRWFjaCh4ID0+IHguZWRpdG9yLmRlc3Ryb3koKSk7XG4gICAgICAgICAgICBjbGVhbnVwUG9vbCgpO1xuICAgICAgICB9XG4gICAgfSwgMTAwMDAsIHsgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgY2xhc3MgUmVzdWx0IHtcbiAgICAgICAgY29uc3RydWN0b3IoZWRpdG9yLCBlbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgZWRpdG9yLCBlbGVtZW50IH0gPSB0aGlzO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgUE9PTC5wdXNoKHsgZWRpdG9yLCBlbGVtZW50IH0pO1xuICAgICAgICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKE9tbmkuZ3JhbW1hcnNbMF0pO1xuICAgICAgICAgICAgICAgIGVkaXRvci5zZXRUZXh0KFwiXCIpO1xuICAgICAgICAgICAgICAgIGNsZWFudXBQb29sKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBkaXNwb3NlKCkge1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcG9wdWxhdGVQb29sKCkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5pbnRlcnZhbCg1MClcbiAgICAgICAgICAgIC50YWtlKDEwKVxuICAgICAgICAgICAgLm1hcCgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3JFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImF0b20tdGV4dC1lZGl0b3JcIik7XG4gICAgICAgICAgICBlZGl0b3JFbGVtZW50LnNldEF0dHJpYnV0ZU5vZGUoZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKFwiZ3V0dGVyLWhpZGRlblwiKSk7XG4gICAgICAgICAgICBlZGl0b3JFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcInRhYmluZGV4XCIpO1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gZWRpdG9yRWxlbWVudC5nZXRNb2RlbCgpO1xuICAgICAgICAgICAgZWRpdG9yLmdldERlY29yYXRpb25zKHsgY2xhc3M6IFwiY3Vyc29yLWxpbmVcIiwgdHlwZTogXCJsaW5lXCIgfSlbMF0uZGVzdHJveSgpO1xuICAgICAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIoT21uaS5ncmFtbWFyc1swXSk7XG4gICAgICAgICAgICBlZGl0b3Iuc2V0U29mdFdyYXBwZWQodHJ1ZSk7XG4gICAgICAgICAgICBhdWdtZW50RWRpdG9yKGVkaXRvcik7XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yRWxlbWVudDtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5kbygoZWxlbWVudCkgPT4gUE9PTC5wdXNoKHsgZWxlbWVudCwgZWRpdG9yOiBlbGVtZW50LmdldE1vZGVsKCkgfSkpXG4gICAgICAgICAgICAudG9BcnJheSgpO1xuICAgIH1cbiAgICBzZXRUaW1lb3V0KCgpID0+IHBvcHVsYXRlUG9vbCgpLCAxMDAwMCk7XG4gICAgZnVuY3Rpb24gcmVxdWVzdCgpIHtcbiAgICAgICAgaWYgKFBPT0wubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCB7IGVkaXRvciwgZWxlbWVudCB9ID0gUE9PTC5wb3AoKTtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKG5ldyBSZXN1bHQoZWRpdG9yLCBlbGVtZW50KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcG9wdWxhdGVQb29sKCkuZmxhdE1hcCgoKSA9PiByZXF1ZXN0KCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGdldE5leHQoKSB7XG4gICAgICAgICAgICBpZiAoIVBPT0wubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlc3VsdDogbnVsbCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeyBlZGl0b3IsIGVsZW1lbnQgfSA9IFBPT0wucG9wKCk7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IG5ldyBSZXN1bHQoZWRpdG9yLCBlbGVtZW50KSB9O1xuICAgICAgICB9LFxuICAgICAgICByZXF1ZXN0XG4gICAgfTtcbn0pKCk7XG5leHBvcnQgY2xhc3MgRWRpdG9yRWxlbWVudCBleHRlbmRzIEhUTUxTcGFuRWxlbWVudCB7XG4gICAgZ2V0IHVzYWdlKCkgeyByZXR1cm4gdGhpcy5fdXNhZ2U7IH1cbiAgICBzZXQgdXNhZ2UodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yVGV4dCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3VzYWdlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX3doaXRlc3BhY2UgPSAwO1xuICAgICAgICBjb25zdCB0ZXh0ID0gdGhpcy5fdXNhZ2UuVGV4dDtcbiAgICAgICAgY29uc3QgdXNhZ2VMZW5ndGggPSB0aGlzLl91c2FnZS5FbmRDb2x1bW4gLSB0aGlzLl91c2FnZS5Db2x1bW47XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLl91c2FnZS5Db2x1bW47IGkgPiAtMTsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBjaHVuayA9IHRleHQuc3Vic3RyKGkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY2h1bmspO1xuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSBjaHVuay5tYXRjaCgvXigoPzpAfF98W2EtekEtWl0pW1xcd10qKSg/OltcXFddfCQpLyk7XG4gICAgICAgICAgICBpZiAoIW1hdGNoKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc29sZS5sb2cobWF0Y2gpO1xuICAgICAgICAgICAgY29uc3QgdiA9IG1hdGNoWzFdO1xuICAgICAgICAgICAgaWYgKHYubGVuZ3RoID09PSB1c2FnZUxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3doaXRlc3BhY2UgPSB0aGlzLl91c2FnZS5Db2x1bW4gLSBpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSBfLnRyaW1TdGFydCh2YWx1ZS5UZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fZWRpdG9yKSB7XG4gICAgICAgICAgICB0aGlzLnNldEVkaXRvclRleHQodGhpcy5fZ3JhbW1hcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IGVkaXRvclRleHQoKSB7IHJldHVybiB0aGlzLl9lZGl0b3JUZXh0OyB9XG4gICAgc2V0IGVkaXRvclRleHQodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fdXNhZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLl9lZGl0b3JUZXh0ID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSBfLnRyaW1TdGFydCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2VkaXRvcikge1xuICAgICAgICAgICAgdGhpcy5zZXRFZGl0b3JUZXh0KHRoaXMuX2dyYW1tYXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldEVkaXRvclRleHQoZ3JhbW1hcikge1xuICAgICAgICBpZiAodGhpcy5fdXNhZ2UpIHtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSB0aGlzLl91c2FnZS5UZXh0O1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLl9zZXRHcmFtbWFyKGdyYW1tYXIpO1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLnNldFRleHQoXy50cmltU3RhcnQodGV4dCkpO1xuICAgICAgICAgICAgY29uc3QgbWFya2VyID0gdGhpcy5fZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShbWzAsICt0aGlzLl91c2FnZS5Db2x1bW4gLSB0aGlzLl93aGl0ZXNwYWNlXSwgWyt0aGlzLl91c2FnZS5FbmRMaW5lIC0gK3RoaXMuX3VzYWdlLkxpbmUsICt0aGlzLl91c2FnZS5FbmRDb2x1bW4gLSB0aGlzLl93aGl0ZXNwYWNlXV0pO1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiBcImhpZ2hsaWdodFwiLCBjbGFzczogXCJmaW5kdXNhZ2VzLXVuZGVybGluZVwiIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLnNldFRleHQoXy50cmltKHRoaXMuX2VkaXRvclRleHQpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgaWYgKCF0aGlzLl9wcmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgICAgICB0aGlzLl9wcmUuaW5uZXJUZXh0ID0gdGhpcy5fdXNhZ2UgJiYgdGhpcy5fdXNhZ2UuVGV4dCB8fCB0aGlzLmVkaXRvclRleHQ7XG4gICAgICAgICAgICB0aGlzLl9wcmUuc3R5bGUuZm9udFNpemUgPSBgJHthdG9tLmNvbmZpZy5nZXQoXCJlZGl0b3IuZm9udFNpemVcIil9cHggIWltcG9ydGFudGA7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9wcmUpO1xuICAgIH1cbiAgICByZXZlcnQoKSB7XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2RldGFjaEVkaXRvcih0cnVlKSk7XG4gICAgfVxuICAgIGVuaGFuY2UoKSB7XG4gICAgICAgIGlmICh0aGlzLl9lbmhhbmNlZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5fZW5oYW5jZWQgPSB0cnVlO1xuICAgICAgICBjb25zdCBuZXh0ID0gcG9vbC5nZXROZXh0KCk7XG4gICAgICAgIGlmIChuZXh0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl91c2FnZSAmJiBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZ1wiKSkge1xuICAgICAgICAgICAgICAgIGxldCBzID0gcmVxdWVzdCh7IGZpbGVQYXRoOiB0aGlzLl91c2FnZS5GaWxlTmFtZSwgc3RhcnRMaW5lOiB0aGlzLl91c2FnZS5MaW5lLCBlbmRMaW5lOiB0aGlzLl91c2FnZS5FbmRMaW5lLCB3aGl0ZXNwYWNlOiB0aGlzLl93aGl0ZXNwYWNlIH0pXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFtbWFyID0gdGhpcy5fZ3JhbW1hciA9IGdldEVuaGFuY2VkR3JhbW1hcihuZXh0LnJlc3VsdC5lZGl0b3IsIF8uZmluZChPbW5pLmdyYW1tYXJzLCBnID0+IF8uc29tZShnLmZpbGVUeXBlcywgZnQgPT4gXy5lbmRzV2l0aCh0aGlzLl91c2FnZS5GaWxlTmFtZSwgYC4ke2Z0fWApKSksIHsgcmVhZG9ubHk6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIGdyYW1tYXIuc2V0UmVzcG9uc2VzKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fYXR0YWNoRWRpdG9yKG5leHQucmVzdWx0LCBncmFtbWFyKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fYXR0YWNoRWRpdG9yKG5leHQucmVzdWx0KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgcyA9IHBvb2wucmVxdWVzdCgpLnN1YnNjcmliZSgocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3VzYWdlICYmIGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzID0gcmVxdWVzdCh7IGZpbGVQYXRoOiB0aGlzLl91c2FnZS5GaWxlTmFtZSwgc3RhcnRMaW5lOiB0aGlzLl91c2FnZS5MaW5lLCBlbmRMaW5lOiB0aGlzLl91c2FnZS5FbmRMaW5lLCB3aGl0ZXNwYWNlOiB0aGlzLl93aGl0ZXNwYWNlIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW1tYXIgPSB0aGlzLl9ncmFtbWFyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKHJlc3VsdC5lZGl0b3IsIF8uZmluZChPbW5pLmdyYW1tYXJzLCBnID0+IF8uc29tZShnLmZpbGVUeXBlcywgZnQgPT4gXy5lbmRzV2l0aCh0aGlzLl91c2FnZS5GaWxlTmFtZSwgYC4ke2Z0fWApKSksIHsgcmVhZG9ubHk6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBncmFtbWFyLnNldFJlc3BvbnNlcyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9hdHRhY2hFZGl0b3IocmVzdWx0LCBncmFtbWFyKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9hdHRhY2hFZGl0b3IocmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUocyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9hdHRhY2hFZGl0b3IocmVzdWx0LCBncmFtbWFyKSB7XG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuX3ByZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVsZWFzZSA9IHJlc3VsdDtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocmVzdWx0KTtcbiAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudCA9IHJlc3VsdC5lbGVtZW50O1xuICAgICAgICB0aGlzLl9lZGl0b3IgPSByZXN1bHQuZWRpdG9yO1xuICAgICAgICB0aGlzLnNldEVkaXRvclRleHQoZ3JhbW1hciB8fCB0aGlzLl9ncmFtbWFyKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9lZGl0b3JFbGVtZW50KTtcbiAgICB9XG4gICAgX2RldGFjaEVkaXRvcihhcHBlbmQpIHtcbiAgICAgICAgaWYgKGFwcGVuZCkge1xuICAgICAgICAgICAgdGhpcy5fcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSB0aGlzLl91c2FnZSAmJiB0aGlzLl91c2FnZS5UZXh0IHx8IHRoaXMuZWRpdG9yVGV4dDtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5zdHlsZS5mb250U2l6ZSA9IGAke2F0b20uY29uZmlnLmdldChcImVkaXRvci5mb250U2l6ZVwiKX1weCAhaW1wb3J0YW50YDtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fcHJlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcmVsZWFzZSkge1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUodGhpcy5fcmVsZWFzZSk7XG4gICAgICAgICAgICB0aGlzLl9yZWxlYXNlLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fZWRpdG9yRWxlbWVudClcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuX2VkaXRvciA9IG51bGw7XG4gICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9lbmhhbmNlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9kZXRhY2hFZGl0b3IoKTtcbiAgICAgICAgaWYgKHRoaXMuX3ByZSkge1xuICAgICAgICAgICAgdGhpcy5fcHJlLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZnVuY3Rpb24gcmVxdWVzdCh7IGZpbGVQYXRoLCBzdGFydExpbmUsIGVuZExpbmUsIHdoaXRlc3BhY2UgfSkge1xuICAgIHJldHVybiBPbW5pLnJlcXVlc3QoY2xpZW50ID0+IGNsaWVudC5oaWdobGlnaHQoe1xuICAgICAgICBCdWZmZXI6IG51bGwsXG4gICAgICAgIEZpbGVOYW1lOiBmaWxlUGF0aCxcbiAgICAgICAgTGluZXM6IF8ucmFuZ2Uoc3RhcnRMaW5lLCBlbmRMaW5lKSxcbiAgICAgICAgRXhjbHVkZUNsYXNzaWZpY2F0aW9uczogY3VzdG9tRXhjbHVkZXNcbiAgICB9LCB7IHNpbGVudDogdHJ1ZSB9KSlcbiAgICAgICAgLm1hcChyZXNwb25zZSA9PiBfKHJlc3BvbnNlLkhpZ2hsaWdodHMpXG4gICAgICAgIC5tYXAoeCA9PiAoe1xuICAgICAgICBTdGFydExpbmU6IHguU3RhcnRMaW5lIC0gc3RhcnRMaW5lLFxuICAgICAgICBTdGFydENvbHVtbjogKHguU3RhcnRMaW5lID09PSBzdGFydExpbmUgPyB4LlN0YXJ0Q29sdW1uIC0gd2hpdGVzcGFjZSA6IHguU3RhcnRDb2x1bW4pLFxuICAgICAgICBFbmRMaW5lOiB4LkVuZExpbmUgLSBzdGFydExpbmUsXG4gICAgICAgIEVuZENvbHVtbjogKHguU3RhcnRMaW5lID09PSBzdGFydExpbmUgPyB4LkVuZENvbHVtbiAtIHdoaXRlc3BhY2UgOiB4LkVuZENvbHVtbiksXG4gICAgICAgIEtpbmQ6IHguS2luZCxcbiAgICAgICAgUHJvamVjdHM6IHguUHJvamVjdHNcbiAgICB9KSlcbiAgICAgICAgLnZhbHVlKCkpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lmxlbmd0aCA+IDApO1xufVxuZXhwb3J0cy5FZGl0b3JFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWVkaXRvci1lbGVtZW50XCIsIHsgcHJvdG90eXBlOiBFZGl0b3JFbGVtZW50LnByb3RvdHlwZSB9KTtcbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7RGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtnZXRFbmhhbmNlZEdyYW1tYXIsIGF1Z21lbnRFZGl0b3IsIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnN9IGZyb20gXCIuLi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOVwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcclxuXHJcbmNvbnN0IGN1c3RvbUV4Y2x1ZGVzID0gRXhjbHVkZUNsYXNzaWZpY2F0aW9ucy5jb25jYXQoW1xyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLklkZW50aWZpZXIsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uUHJlcHJvY2Vzc29yS2V5d29yZCxcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5FeGNsdWRlZENvZGUsXHJcbl0pO1xyXG5cclxuY29uc3QgcG9vbCA9IChmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IE5VTV9UT19LRUVQID0gMTA7XHJcbiAgICBjb25zdCBQT09MOiB7IGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yOyBlbGVtZW50OiBBdG9tLlRleHRFZGl0b3JDb21wb25lbnQ7IH1bXSA9IFtdO1xyXG5cclxuICAgIGNvbnN0IGNsZWFudXBQb29sID0gXy50aHJvdHRsZShmdW5jdGlvbiBjbGVhbnVwUG9vbCgpIHtcclxuICAgICAgICBpZiAoUE9PTC5sZW5ndGggPiBOVU1fVE9fS0VFUCkge1xyXG4gICAgICAgICAgICBjb25zdCBsZW4gPSBNYXRoLm1pbihQT09MLmxlbmd0aCAtIE5VTV9UT19LRUVQLCAxMCk7XHJcbiAgICAgICAgICAgIGxldCByZW1vdmUgPSBQT09MLnNwbGljZSgwLCBsZW4pO1xyXG4gICAgICAgICAgICByZW1vdmUuZm9yRWFjaCh4ID0+IHguZWRpdG9yLmRlc3Ryb3koKSk7XHJcblxyXG4gICAgICAgICAgICBjbGVhbnVwUG9vbCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sIDEwMDAwLCB7IHRyYWlsaW5nOiB0cnVlIH0pO1xyXG5cclxuICAgIGNsYXNzIFJlc3VsdCBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgICAgICBwcml2YXRlIF9kaXNwb3NhYmxlID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB7ZWRpdG9yLCBlbGVtZW50fSA9IHRoaXM7XHJcbiAgICAgICAgICAgIChlbGVtZW50IGFzIGFueSkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIFBPT0wucHVzaCh7IGVkaXRvciwgZWxlbWVudCB9KTtcclxuXHJcbiAgICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKE9tbmkuZ3JhbW1hcnNbMF0pO1xyXG4gICAgICAgICAgICBlZGl0b3Iuc2V0VGV4dChcIlwiKTtcclxuXHJcbiAgICAgICAgICAgIGNsZWFudXBQb29sKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgcHVibGljIGVsZW1lbnQ6IEF0b20uVGV4dEVkaXRvckNvbXBvbmVudCkgeyB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcG9wdWxhdGVQb29sKCkge1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmludGVydmFsKDUwKVxyXG4gICAgICAgICAgICAudGFrZSgxMClcclxuICAgICAgICAgICAgLm1hcCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlZGl0b3JFbGVtZW50ID0gPGFueT5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYXRvbS10ZXh0LWVkaXRvclwiKTtcclxuICAgICAgICAgICAgICAgIGVkaXRvckVsZW1lbnQuc2V0QXR0cmlidXRlTm9kZShkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoXCJndXR0ZXItaGlkZGVuXCIpKTtcclxuICAgICAgICAgICAgICAgIGVkaXRvckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKFwidGFiaW5kZXhcIik7IC8vIG1ha2UgcmVhZC1vbmx5XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gKDxhbnk+ZWRpdG9yRWxlbWVudCkuZ2V0TW9kZWwoKTtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXREZWNvcmF0aW9ucyh7IGNsYXNzOiBcImN1cnNvci1saW5lXCIsIHR5cGU6IFwibGluZVwiIH0pWzBdLmRlc3Ryb3koKTsgLy8gcmVtb3ZlIHRoZSBkZWZhdWx0IHNlbGVjdGlvbiBvZiBhIGxpbmUgaW4gZWFjaCBlZGl0b3JcclxuICAgICAgICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKE9tbmkuZ3JhbW1hcnNbMF0pO1xyXG4gICAgICAgICAgICAgICAgZWRpdG9yLnNldFNvZnRXcmFwcGVkKHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGF1Z21lbnRFZGl0b3IoZWRpdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPEF0b20uVGV4dEVkaXRvckNvbXBvbmVudD5lZGl0b3JFbGVtZW50O1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZG8oKGVsZW1lbnQpID0+IFBPT0wucHVzaCh7IGVsZW1lbnQsIGVkaXRvcjogKDxhbnk+ZWxlbWVudCkuZ2V0TW9kZWwoKSB9KSlcclxuICAgICAgICAgICAgLnRvQXJyYXkoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHBvcHVsYXRlUG9vbCgpLCAxMDAwMCk7XHJcblxyXG4gICAgZnVuY3Rpb24gcmVxdWVzdCgpOiBPYnNlcnZhYmxlPFJlc3VsdD4ge1xyXG4gICAgICAgIGlmIChQT09MLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCB7ZWRpdG9yLCBlbGVtZW50fSA9IFBPT0wucG9wKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihuZXcgUmVzdWx0KGVkaXRvciwgZWxlbWVudCkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwb3B1bGF0ZVBvb2woKS5mbGF0TWFwKCgpID0+IHJlcXVlc3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZ2V0TmV4dCgpIHtcclxuICAgICAgICAgICAgaWYgKCFQT09MLmxlbmd0aCkgeyByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVzdWx0OiBudWxsIH07IH1cclxuICAgICAgICAgICAgY29uc3Qge2VkaXRvciwgZWxlbWVudH0gPSBQT09MLnBvcCgpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IG5ldyBSZXN1bHQoZWRpdG9yLCBlbGVtZW50KSB9O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVxdWVzdFxyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBFZGl0b3JFbGVtZW50IGV4dGVuZHMgSFRNTFNwYW5FbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgX3ByZTogSFRNTFByZUVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfcmVsZWFzZTogSURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9lZGl0b3JFbGVtZW50OiBBdG9tLlRleHRFZGl0b3JDb21wb25lbnQ7XHJcbiAgICBwcml2YXRlIF9lZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcclxuICAgIHByaXZhdGUgX3doaXRlc3BhY2U6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2dyYW1tYXI6IEZpcnN0TWF0ZS5HcmFtbWFyO1xyXG5cclxuICAgIHByaXZhdGUgX3VzYWdlOiBNb2RlbHMuUXVpY2tGaXg7XHJcbiAgICBwdWJsaWMgZ2V0IHVzYWdlKCkgeyByZXR1cm4gdGhpcy5fdXNhZ2U7IH1cclxuICAgIHB1YmxpYyBzZXQgdXNhZ2UodmFsdWUpIHtcclxuICAgICAgICB0aGlzLl9lZGl0b3JUZXh0ID0gbnVsbDtcclxuICAgICAgICB0aGlzLl91c2FnZSA9IHZhbHVlO1xyXG5cclxuICAgICAgICB0aGlzLl93aGl0ZXNwYWNlID0gMDtcclxuXHJcbiAgICAgICAgY29uc3QgdGV4dCA9IHRoaXMuX3VzYWdlLlRleHQ7XHJcbiAgICAgICAgY29uc3QgdXNhZ2VMZW5ndGggPSB0aGlzLl91c2FnZS5FbmRDb2x1bW4gLSB0aGlzLl91c2FnZS5Db2x1bW47XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuX3VzYWdlLkNvbHVtbjsgaSA+IC0xOyBpLS0pIHtcclxuICAgICAgICAgICAgY29uc3QgY2h1bmsgPSB0ZXh0LnN1YnN0cihpKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coY2h1bmspO1xyXG4gICAgICAgICAgICAvLyBUaGlzIHJlZ2V4IHBlcmhhcHMgbmVlZHMgdG8gYmUgaW1wcm92ZWRcclxuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSBjaHVuay5tYXRjaCgvXigoPzpAfF98W2EtekEtWl0pW1xcd10qKSg/OltcXFddfCQpLyk7XHJcbiAgICAgICAgICAgIGlmICghbWF0Y2gpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtYXRjaCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB2ID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICAgIGlmICh2Lmxlbmd0aCA9PT0gdXNhZ2VMZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3doaXRlc3BhY2UgPSB0aGlzLl91c2FnZS5Db2x1bW4gLSBpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IF8udHJpbVN0YXJ0KHZhbHVlLlRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2VkaXRvcikge1xyXG4gICAgICAgICAgICB0aGlzLnNldEVkaXRvclRleHQodGhpcy5fZ3JhbW1hcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2VkaXRvclRleHQ6IHN0cmluZztcclxuICAgIHB1YmxpYyBnZXQgZWRpdG9yVGV4dCgpIHsgcmV0dXJuIHRoaXMuX2VkaXRvclRleHQ7IH1cclxuICAgIHB1YmxpYyBzZXQgZWRpdG9yVGV4dCh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX3VzYWdlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9lZGl0b3JUZXh0ID0gdmFsdWU7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IF8udHJpbVN0YXJ0KHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRFZGl0b3JUZXh0KHRoaXMuX2dyYW1tYXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldEVkaXRvclRleHQoZ3JhbW1hcjogRmlyc3RNYXRlLkdyYW1tYXIpIHtcclxuICAgICAgICBpZiAodGhpcy5fdXNhZ2UpIHtcclxuICAgICAgICAgICAgY29uc3QgdGV4dCA9IHRoaXMuX3VzYWdlLlRleHQ7XHJcblxyXG4gICAgICAgICAgICAodGhpcy5fZWRpdG9yIGFzIGFueSkuX3NldEdyYW1tYXIoPGFueT5ncmFtbWFyKTtcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLnNldFRleHQoXy50cmltU3RhcnQodGV4dCkpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbWFya2VyID0gdGhpcy5fZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShbWzAsICt0aGlzLl91c2FnZS5Db2x1bW4gLSB0aGlzLl93aGl0ZXNwYWNlXSwgWyt0aGlzLl91c2FnZS5FbmRMaW5lIC0gK3RoaXMuX3VzYWdlLkxpbmUsICt0aGlzLl91c2FnZS5FbmRDb2x1bW4gLSB0aGlzLl93aGl0ZXNwYWNlXV0pO1xyXG4gICAgICAgICAgICB0aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7IHR5cGU6IFwiaGlnaGxpZ2h0XCIsIGNsYXNzOiBcImZpbmR1c2FnZXMtdW5kZXJsaW5lXCIgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLnNldFRleHQoXy50cmltKHRoaXMuX2VkaXRvclRleHQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9wcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IHRoaXMuX3VzYWdlICYmIHRoaXMuX3VzYWdlLlRleHQgfHwgdGhpcy5lZGl0b3JUZXh0O1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUuc3R5bGUuZm9udFNpemUgPSBgJHthdG9tLmNvbmZpZy5nZXQoXCJlZGl0b3IuZm9udFNpemVcIil9cHggIWltcG9ydGFudGA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fcHJlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmV2ZXJ0KCkge1xyXG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2RldGFjaEVkaXRvcih0cnVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZW5oYW5jZWQ6IGJvb2xlYW47XHJcbiAgICBwdWJsaWMgZW5oYW5jZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5fZW5oYW5jZWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLl9lbmhhbmNlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGNvbnN0IG5leHQgPSBwb29sLmdldE5leHQoKTtcclxuICAgICAgICBpZiAobmV4dC5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl91c2FnZSAmJiBhdG9tLmNvbmZpZy5nZXQ8Ym9vbGVhbj4oXCJvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZ1wiKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHMgPSByZXF1ZXN0KHsgZmlsZVBhdGg6IHRoaXMuX3VzYWdlLkZpbGVOYW1lLCBzdGFydExpbmU6IHRoaXMuX3VzYWdlLkxpbmUsIGVuZExpbmU6IHRoaXMuX3VzYWdlLkVuZExpbmUsIHdoaXRlc3BhY2U6IHRoaXMuX3doaXRlc3BhY2UgfSlcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbW1hciA9IHRoaXMuX2dyYW1tYXIgPSBnZXRFbmhhbmNlZEdyYW1tYXIobmV4dC5yZXN1bHQuZWRpdG9yLCBfLmZpbmQoT21uaS5ncmFtbWFycywgZyA9PiBfLnNvbWUoKDxhbnk+ZykuZmlsZVR5cGVzLCBmdCA9PiBfLmVuZHNXaXRoKHRoaXMuX3VzYWdlLkZpbGVOYW1lLCBgLiR7ZnR9YCkpKSwgeyByZWFkb25seTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+Z3JhbW1hcikuc2V0UmVzcG9uc2VzKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fYXR0YWNoRWRpdG9yKG5leHQucmVzdWx0LCBncmFtbWFyKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9hdHRhY2hFZGl0b3IobmV4dC5yZXN1bHQpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgcyA9IHBvb2wucmVxdWVzdCgpLnN1YnNjcmliZSgocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdXNhZ2UgJiYgYXRvbS5jb25maWcuZ2V0PGJvb2xlYW4+KFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmdcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcyA9IHJlcXVlc3QoeyBmaWxlUGF0aDogdGhpcy5fdXNhZ2UuRmlsZU5hbWUsIHN0YXJ0TGluZTogdGhpcy5fdXNhZ2UuTGluZSwgZW5kTGluZTogdGhpcy5fdXNhZ2UuRW5kTGluZSwgd2hpdGVzcGFjZTogdGhpcy5fd2hpdGVzcGFjZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW1tYXIgPSB0aGlzLl9ncmFtbWFyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKHJlc3VsdC5lZGl0b3IsIF8uZmluZChPbW5pLmdyYW1tYXJzLCBnID0+IF8uc29tZSgoPGFueT5nKS5maWxlVHlwZXMsIGZ0ID0+IF8uZW5kc1dpdGgodGhpcy5fdXNhZ2UuRmlsZU5hbWUsIGAuJHtmdH1gKSkpLCB7IHJlYWRvbmx5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+Z3JhbW1hcikuc2V0UmVzcG9uc2VzKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2F0dGFjaEVkaXRvcihyZXN1bHQsIGdyYW1tYXIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fYXR0YWNoRWRpdG9yKHJlc3VsdCkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUocyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYXR0YWNoRWRpdG9yKHJlc3VsdDogeyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjsgZWxlbWVudDogQXRvbS5UZXh0RWRpdG9yQ29tcG9uZW50OyBkaXNwb3NlOiAoKSA9PiB2b2lkIH0sIGdyYW1tYXI/OiBGaXJzdE1hdGUuR3JhbW1hcikge1xyXG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fcmVsZWFzZSA9IHJlc3VsdDtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChyZXN1bHQpO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQgPSByZXN1bHQuZWxlbWVudDtcclxuICAgICAgICB0aGlzLl9lZGl0b3IgPSByZXN1bHQuZWRpdG9yO1xyXG4gICAgICAgIHRoaXMuc2V0RWRpdG9yVGV4dChncmFtbWFyIHx8IHRoaXMuX2dyYW1tYXIpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoPGFueT50aGlzLl9lZGl0b3JFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9kZXRhY2hFZGl0b3IoYXBwZW5kPzogYm9vbGVhbikge1xyXG4gICAgICAgIGlmIChhcHBlbmQpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IHRoaXMuX3VzYWdlICYmIHRoaXMuX3VzYWdlLlRleHQgfHwgdGhpcy5lZGl0b3JUZXh0O1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUuc3R5bGUuZm9udFNpemUgPSBgJHthdG9tLmNvbmZpZy5nZXQoXCJlZGl0b3IuZm9udFNpemVcIil9cHggIWltcG9ydGFudGA7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fcHJlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9yZWxlYXNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUucmVtb3ZlKHRoaXMuX3JlbGVhc2UpO1xyXG4gICAgICAgICAgICB0aGlzLl9yZWxlYXNlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3JFbGVtZW50KVxyXG4gICAgICAgICAgICAodGhpcy5fZWRpdG9yRWxlbWVudCBhcyBhbnkpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9lZGl0b3IgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2VuaGFuY2VkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fZGV0YWNoRWRpdG9yKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuX3ByZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSBcIlwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVxdWVzdCh7ZmlsZVBhdGgsIHN0YXJ0TGluZSwgZW5kTGluZSwgd2hpdGVzcGFjZX06IHsgZmlsZVBhdGg6IHN0cmluZzsgc3RhcnRMaW5lOiBudW1iZXI7IGVuZExpbmU6IG51bWJlcjsgd2hpdGVzcGFjZTogbnVtYmVyOyB9KSB7XHJcbiAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGNsaWVudCA9PiBjbGllbnQuaGlnaGxpZ2h0KHtcclxuICAgICAgICBCdWZmZXI6IG51bGwsXHJcbiAgICAgICAgRmlsZU5hbWU6IGZpbGVQYXRoLFxyXG4gICAgICAgIExpbmVzOiBfLnJhbmdlKHN0YXJ0TGluZSwgZW5kTGluZSksXHJcbiAgICAgICAgRXhjbHVkZUNsYXNzaWZpY2F0aW9uczogY3VzdG9tRXhjbHVkZXNcclxuICAgIH0sIHsgc2lsZW50OiB0cnVlIH0pKVxyXG4gICAgICAgIC5tYXAocmVzcG9uc2UgPT4gXyhyZXNwb25zZS5IaWdobGlnaHRzKVxyXG4gICAgICAgICAgICAvLy5maWx0ZXIoeCA9PiB4LlN0YXJ0TGluZSA+PSByZXF1ZXN0LnN0YXJ0TGluZSAmJiB4LkVuZExpbmUgPD0gcmVxdWVzdC5lbmRMaW5lKVxyXG4gICAgICAgICAgICAubWFwKHggPT4gKHtcclxuICAgICAgICAgICAgICAgIFN0YXJ0TGluZTogeC5TdGFydExpbmUgLSBzdGFydExpbmUsXHJcbiAgICAgICAgICAgICAgICBTdGFydENvbHVtbjogKHguU3RhcnRMaW5lID09PSBzdGFydExpbmUgPyB4LlN0YXJ0Q29sdW1uIC0gd2hpdGVzcGFjZSA6IHguU3RhcnRDb2x1bW4pLFxyXG4gICAgICAgICAgICAgICAgRW5kTGluZTogeC5FbmRMaW5lIC0gc3RhcnRMaW5lLFxyXG4gICAgICAgICAgICAgICAgRW5kQ29sdW1uOiAoeC5TdGFydExpbmUgPT09IHN0YXJ0TGluZSA/IHguRW5kQ29sdW1uIC0gd2hpdGVzcGFjZSA6IHguRW5kQ29sdW1uKSxcclxuICAgICAgICAgICAgICAgIEtpbmQ6IHguS2luZCxcclxuICAgICAgICAgICAgICAgIFByb2plY3RzOiB4LlByb2plY3RzXHJcbiAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAudmFsdWUoKSlcclxuICAgICAgICAuZmlsdGVyKHggPT4geC5sZW5ndGggPiAwKTtcclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuRWRpdG9yRWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZWRpdG9yLWVsZW1lbnRcIiwgeyBwcm90b3R5cGU6IEVkaXRvckVsZW1lbnQucHJvdG90eXBlIH0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
