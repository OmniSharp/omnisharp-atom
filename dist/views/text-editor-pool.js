"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EditorElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

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
            this._disposable = _tsDisposables.Disposable.create(function () {
                var editor = _this.editor,
                    element = _this.element;

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
            var _POOL$pop = POOL.pop(),
                editor = _POOL$pop.editor,
                element = _POOL$pop.element;

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

            var _POOL$pop2 = POOL.pop(),
                editor = _POOL$pop2.editor,
                element = _POOL$pop2.element;

            return { success: true, result: new Result(editor, element) };
        },

        request: request
    };
}();

var EditorElement = exports.EditorElement = function (_HTMLSpanElement) {
    _inherits(EditorElement, _HTMLSpanElement);

    function EditorElement() {
        _classCallCheck(this, EditorElement);

        return _possibleConstructorReturn(this, (EditorElement.__proto__ || Object.getPrototypeOf(EditorElement)).apply(this, arguments));
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
            this._disposable = new _tsDisposables.CompositeDisposable();
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
    var filePath = _ref.filePath,
        startLine = _ref.startLine,
        endLine = _ref.endLine,
        whitespace = _ref.whitespace;

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90ZXh0LWVkaXRvci1wb29sLmpzIiwibGliL3ZpZXdzL3RleHQtZWRpdG9yLXBvb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztBQ0VBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTFCO0FBRUosSUFBTSxpQkFBaUIsbUNBQXVCLE1BQXZCLENBQThCLENBQ2pELENBRGlELEVBRWpELENBRmlELEVBR2pELEVBSGlELENBQTlCLENBQWpCO0FBTU4sSUFBTSxPQUFPLFlBQUM7QUFDVixRQUFNLGNBQWMsRUFBZCxDQURJO0FBRVYsUUFBTSxPQUEwRSxFQUExRSxDQUZJO0FBSVYsUUFBTSxjQUFjLGlCQUFFLFFBQUYsQ0FBVyxTQUFBLFdBQUEsR0FBQTtBQUMzQixZQUFJLEtBQUssTUFBTCxHQUFjLFdBQWQsRUFBMkI7QUFDM0IsZ0JBQU0sTUFBTSxLQUFLLEdBQUwsQ0FBUyxLQUFLLE1BQUwsR0FBYyxXQUFkLEVBQTJCLEVBQXBDLENBQU4sQ0FEcUI7QUFFM0IsZ0JBQUksU0FBUyxLQUFLLE1BQUwsQ0FBWSxDQUFaLEVBQWUsR0FBZixDQUFULENBRnVCO0FBRzNCLG1CQUFPLE9BQVAsQ0FBZTt1QkFBSyxFQUFFLE1BQUYsQ0FBUyxPQUFUO2FBQUwsQ0FBZixDQUgyQjtBQUszQiwwQkFMMkI7U0FBL0I7S0FEMkIsRUFRNUIsS0FSaUIsRUFRVixFQUFFLFVBQVUsSUFBVixFQVJRLENBQWQsQ0FKSTs7UUFjVjtBQVlJLHdCQUFtQixNQUFuQixFQUFtRCxPQUFuRCxFQUFvRjs7Ozs7QUFBakUsaUJBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBaUU7QUFBakMsaUJBQUEsT0FBQSxHQUFBLE9BQUEsQ0FBaUM7QUFYNUUsaUJBQUEsV0FBQSxHQUFjLDBCQUFXLE1BQVgsQ0FBa0IsWUFBQTtvQkFDN0I7b0JBQVEsd0JBRHFCOztBQUVuQyx3QkFBZ0IsTUFBaEIsR0FG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Q0FEc0k7Q0FBMUk7QUFxQk0sUUFBUyxhQUFULEdBQStCLFNBQVUsZUFBVixDQUEwQiwwQkFBMUIsRUFBc0QsRUFBRSxXQUFXLGNBQWMsU0FBZCxFQUFuRSxDQUEvQiIsImZpbGUiOiJsaWIvdmlld3MvdGV4dC1lZGl0b3ItcG9vbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgRGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgZ2V0RW5oYW5jZWRHcmFtbWFyLCBhdWdtZW50RWRpdG9yLCBFeGNsdWRlQ2xhc3NpZmljYXRpb25zIH0gZnJvbSBcIi4uL2ZlYXR1cmVzL2hpZ2hsaWdodC12MS45XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5sZXQgZmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuY29uc3QgY3VzdG9tRXhjbHVkZXMgPSBFeGNsdWRlQ2xhc3NpZmljYXRpb25zLmNvbmNhdChbXG4gICAgOCxcbiAgICA5LFxuICAgIDEwLFxuXSk7XG5jb25zdCBwb29sID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBOVU1fVE9fS0VFUCA9IDEwO1xuICAgIGNvbnN0IFBPT0wgPSBbXTtcbiAgICBjb25zdCBjbGVhbnVwUG9vbCA9IF8udGhyb3R0bGUoZnVuY3Rpb24gY2xlYW51cFBvb2woKSB7XG4gICAgICAgIGlmIChQT09MLmxlbmd0aCA+IE5VTV9UT19LRUVQKSB7XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBNYXRoLm1pbihQT09MLmxlbmd0aCAtIE5VTV9UT19LRUVQLCAxMCk7XG4gICAgICAgICAgICBsZXQgcmVtb3ZlID0gUE9PTC5zcGxpY2UoMCwgbGVuKTtcbiAgICAgICAgICAgIHJlbW92ZS5mb3JFYWNoKHggPT4geC5lZGl0b3IuZGVzdHJveSgpKTtcbiAgICAgICAgICAgIGNsZWFudXBQb29sKCk7XG4gICAgICAgIH1cbiAgICB9LCAxMDAwMCwgeyB0cmFpbGluZzogdHJ1ZSB9KTtcbiAgICBjbGFzcyBSZXN1bHQge1xuICAgICAgICBjb25zdHJ1Y3RvcihlZGl0b3IsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBlZGl0b3IsIGVsZW1lbnQgfSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBQT09MLnB1c2goeyBlZGl0b3IsIGVsZW1lbnQgfSk7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIoT21uaS5ncmFtbWFyc1swXSk7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnNldFRleHQoXCJcIik7XG4gICAgICAgICAgICAgICAgY2xlYW51cFBvb2woKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBwb3B1bGF0ZVBvb2woKSB7XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmludGVydmFsKDUwKVxuICAgICAgICAgICAgLnRha2UoMTApXG4gICAgICAgICAgICAubWFwKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYXRvbS10ZXh0LWVkaXRvclwiKTtcbiAgICAgICAgICAgIGVkaXRvckVsZW1lbnQuc2V0QXR0cmlidXRlTm9kZShkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoXCJndXR0ZXItaGlkZGVuXCIpKTtcbiAgICAgICAgICAgIGVkaXRvckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKFwidGFiaW5kZXhcIik7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBlZGl0b3JFbGVtZW50LmdldE1vZGVsKCk7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0RGVjb3JhdGlvbnMoeyBjbGFzczogXCJjdXJzb3ItbGluZVwiLCB0eXBlOiBcImxpbmVcIiB9KVswXS5kZXN0cm95KCk7XG4gICAgICAgICAgICBlZGl0b3Iuc2V0R3JhbW1hcihPbW5pLmdyYW1tYXJzWzBdKTtcbiAgICAgICAgICAgIGVkaXRvci5zZXRTb2Z0V3JhcHBlZCh0cnVlKTtcbiAgICAgICAgICAgIGF1Z21lbnRFZGl0b3IoZWRpdG9yKTtcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3JFbGVtZW50O1xuICAgICAgICB9KVxuICAgICAgICAgICAgLmRvKChlbGVtZW50KSA9PiBQT09MLnB1c2goeyBlbGVtZW50LCBlZGl0b3I6IGVsZW1lbnQuZ2V0TW9kZWwoKSB9KSlcbiAgICAgICAgICAgIC50b0FycmF5KCk7XG4gICAgfVxuICAgIHNldFRpbWVvdXQoKCkgPT4gcG9wdWxhdGVQb29sKCksIDEwMDAwKTtcbiAgICBmdW5jdGlvbiByZXF1ZXN0KCkge1xuICAgICAgICBpZiAoUE9PTC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgZWRpdG9yLCBlbGVtZW50IH0gPSBQT09MLnBvcCgpO1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YobmV3IFJlc3VsdChlZGl0b3IsIGVsZW1lbnQpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwb3B1bGF0ZVBvb2woKS5mbGF0TWFwKCgpID0+IHJlcXVlc3QoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0TmV4dCgpIHtcbiAgICAgICAgICAgIGlmICghUE9PTC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVzdWx0OiBudWxsIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB7IGVkaXRvciwgZWxlbWVudCB9ID0gUE9PTC5wb3AoKTtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogbmV3IFJlc3VsdChlZGl0b3IsIGVsZW1lbnQpIH07XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVlc3RcbiAgICB9O1xufSkoKTtcbmV4cG9ydCBjbGFzcyBFZGl0b3JFbGVtZW50IGV4dGVuZHMgSFRNTFNwYW5FbGVtZW50IHtcbiAgICBnZXQgdXNhZ2UoKSB7IHJldHVybiB0aGlzLl91c2FnZTsgfVxuICAgIHNldCB1c2FnZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLl9lZGl0b3JUZXh0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fdXNhZ2UgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fd2hpdGVzcGFjZSA9IDA7XG4gICAgICAgIGNvbnN0IHRleHQgPSB0aGlzLl91c2FnZS5UZXh0O1xuICAgICAgICBjb25zdCB1c2FnZUxlbmd0aCA9IHRoaXMuX3VzYWdlLkVuZENvbHVtbiAtIHRoaXMuX3VzYWdlLkNvbHVtbjtcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuX3VzYWdlLkNvbHVtbjsgaSA+IC0xOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IGNodW5rID0gdGV4dC5zdWJzdHIoaSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjaHVuayk7XG4gICAgICAgICAgICBjb25zdCBtYXRjaCA9IGNodW5rLm1hdGNoKC9eKCg/OkB8X3xbYS16QS1aXSlbXFx3XSopKD86W1xcV118JCkvKTtcbiAgICAgICAgICAgIGlmICghbWF0Y2gpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtYXRjaCk7XG4gICAgICAgICAgICBjb25zdCB2ID0gbWF0Y2hbMV07XG4gICAgICAgICAgICBpZiAodi5sZW5ndGggPT09IHVzYWdlTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2hpdGVzcGFjZSA9IHRoaXMuX3VzYWdlLkNvbHVtbiAtIGk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3ByZSkge1xuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IF8udHJpbVN0YXJ0KHZhbHVlLlRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3IpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RWRpdG9yVGV4dCh0aGlzLl9ncmFtbWFyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgZWRpdG9yVGV4dCgpIHsgcmV0dXJuIHRoaXMuX2VkaXRvclRleHQ7IH1cbiAgICBzZXQgZWRpdG9yVGV4dCh2YWx1ZSkge1xuICAgICAgICB0aGlzLl91c2FnZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2VkaXRvclRleHQgPSB2YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMuX3ByZSkge1xuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IF8udHJpbVN0YXJ0KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fZWRpdG9yKSB7XG4gICAgICAgICAgICB0aGlzLnNldEVkaXRvclRleHQodGhpcy5fZ3JhbW1hcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0RWRpdG9yVGV4dChncmFtbWFyKSB7XG4gICAgICAgIGlmICh0aGlzLl91c2FnZSkge1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IHRoaXMuX3VzYWdlLlRleHQ7XG4gICAgICAgICAgICB0aGlzLl9lZGl0b3IuX3NldEdyYW1tYXIoZ3JhbW1hcik7XG4gICAgICAgICAgICB0aGlzLl9lZGl0b3Iuc2V0VGV4dChfLnRyaW1TdGFydCh0ZXh0KSk7XG4gICAgICAgICAgICBjb25zdCBtYXJrZXIgPSB0aGlzLl9lZGl0b3IubWFya0J1ZmZlclJhbmdlKFtbMCwgK3RoaXMuX3VzYWdlLkNvbHVtbiAtIHRoaXMuX3doaXRlc3BhY2VdLCBbK3RoaXMuX3VzYWdlLkVuZExpbmUgLSArdGhpcy5fdXNhZ2UuTGluZSwgK3RoaXMuX3VzYWdlLkVuZENvbHVtbiAtIHRoaXMuX3doaXRlc3BhY2VdXSk7XG4gICAgICAgICAgICB0aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7IHR5cGU6IFwiaGlnaGxpZ2h0XCIsIGNsYXNzOiBcImZpbmR1c2FnZXMtdW5kZXJsaW5lXCIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9lZGl0b3Iuc2V0VGV4dChfLnRyaW0odGhpcy5fZWRpdG9yVGV4dCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBpZiAoIXRoaXMuX3ByZSkge1xuICAgICAgICAgICAgdGhpcy5fcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSB0aGlzLl91c2FnZSAmJiB0aGlzLl91c2FnZS5UZXh0IHx8IHRoaXMuZWRpdG9yVGV4dDtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5zdHlsZS5mb250U2l6ZSA9IGAke2F0b20uY29uZmlnLmdldChcImVkaXRvci5mb250U2l6ZVwiKX1weCAhaW1wb3J0YW50YDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX3ByZSk7XG4gICAgfVxuICAgIHJldmVydCgpIHtcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fZGV0YWNoRWRpdG9yKHRydWUpKTtcbiAgICB9XG4gICAgZW5oYW5jZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2VuaGFuY2VkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLl9lbmhhbmNlZCA9IHRydWU7XG4gICAgICAgIGNvbnN0IG5leHQgPSBwb29sLmdldE5leHQoKTtcbiAgICAgICAgaWYgKG5leHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3VzYWdlICYmIGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nXCIpKSB7XG4gICAgICAgICAgICAgICAgbGV0IHMgPSByZXF1ZXN0KHsgZmlsZVBhdGg6IHRoaXMuX3VzYWdlLkZpbGVOYW1lLCBzdGFydExpbmU6IHRoaXMuX3VzYWdlLkxpbmUsIGVuZExpbmU6IHRoaXMuX3VzYWdlLkVuZExpbmUsIHdoaXRlc3BhY2U6IHRoaXMuX3doaXRlc3BhY2UgfSlcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW1tYXIgPSB0aGlzLl9ncmFtbWFyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKG5leHQucmVzdWx0LmVkaXRvciwgXy5maW5kKE9tbmkuZ3JhbW1hcnMsIGcgPT4gXy5zb21lKGcuZmlsZVR5cGVzLCBmdCA9PiBfLmVuZHNXaXRoKHRoaXMuX3VzYWdlLkZpbGVOYW1lLCBgLiR7ZnR9YCkpKSwgeyByZWFkb25seTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgZ3JhbW1hci5zZXRSZXNwb25zZXMocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9hdHRhY2hFZGl0b3IobmV4dC5yZXN1bHQsIGdyYW1tYXIpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9hdHRhY2hFZGl0b3IobmV4dC5yZXN1bHQpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCBzID0gcG9vbC5yZXF1ZXN0KCkuc3Vic2NyaWJlKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdXNhZ2UgJiYgYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmdcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHMgPSByZXF1ZXN0KHsgZmlsZVBhdGg6IHRoaXMuX3VzYWdlLkZpbGVOYW1lLCBzdGFydExpbmU6IHRoaXMuX3VzYWdlLkxpbmUsIGVuZExpbmU6IHRoaXMuX3VzYWdlLkVuZExpbmUsIHdoaXRlc3BhY2U6IHRoaXMuX3doaXRlc3BhY2UgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbW1hciA9IHRoaXMuX2dyYW1tYXIgPSBnZXRFbmhhbmNlZEdyYW1tYXIocmVzdWx0LmVkaXRvciwgXy5maW5kKE9tbmkuZ3JhbW1hcnMsIGcgPT4gXy5zb21lKGcuZmlsZVR5cGVzLCBmdCA9PiBfLmVuZHNXaXRoKHRoaXMuX3VzYWdlLkZpbGVOYW1lLCBgLiR7ZnR9YCkpKSwgeyByZWFkb25seTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyYW1tYXIuc2V0UmVzcG9uc2VzKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2F0dGFjaEVkaXRvcihyZXN1bHQsIGdyYW1tYXIpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHMpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2F0dGFjaEVkaXRvcihyZXN1bHQpKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLnJlbW92ZShzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2F0dGFjaEVkaXRvcihyZXN1bHQsIGdyYW1tYXIpIHtcbiAgICAgICAgaWYgKHRoaXMuX3ByZSkge1xuICAgICAgICAgICAgdGhpcy5fcHJlLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5fcHJlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZWxlYXNlID0gcmVzdWx0O1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChyZXN1bHQpO1xuICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50ID0gcmVzdWx0LmVsZW1lbnQ7XG4gICAgICAgIHRoaXMuX2VkaXRvciA9IHJlc3VsdC5lZGl0b3I7XG4gICAgICAgIHRoaXMuc2V0RWRpdG9yVGV4dChncmFtbWFyIHx8IHRoaXMuX2dyYW1tYXIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2VkaXRvckVsZW1lbnQpO1xuICAgIH1cbiAgICBfZGV0YWNoRWRpdG9yKGFwcGVuZCkge1xuICAgICAgICBpZiAoYXBwZW5kKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IHRoaXMuX3VzYWdlICYmIHRoaXMuX3VzYWdlLlRleHQgfHwgdGhpcy5lZGl0b3JUZXh0O1xuICAgICAgICAgICAgdGhpcy5fcHJlLnN0eWxlLmZvbnRTaXplID0gYCR7YXRvbS5jb25maWcuZ2V0KFwiZWRpdG9yLmZvbnRTaXplXCIpfXB4ICFpbXBvcnRhbnRgO1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9wcmUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9yZWxlYXNlKSB7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLl9yZWxlYXNlKTtcbiAgICAgICAgICAgIHRoaXMuX3JlbGVhc2UuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3JFbGVtZW50KVxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudC5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2VuaGFuY2VkID0gZmFsc2U7XG4gICAgfVxuICAgIGRldGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2RldGFjaEVkaXRvcigpO1xuICAgICAgICBpZiAodGhpcy5fcHJlKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmUucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLl9wcmUuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5mdW5jdGlvbiByZXF1ZXN0KHsgZmlsZVBhdGgsIHN0YXJ0TGluZSwgZW5kTGluZSwgd2hpdGVzcGFjZSB9KSB7XG4gICAgcmV0dXJuIE9tbmkucmVxdWVzdChjbGllbnQgPT4gY2xpZW50LmhpZ2hsaWdodCh7XG4gICAgICAgIEJ1ZmZlcjogbnVsbCxcbiAgICAgICAgRmlsZU5hbWU6IGZpbGVQYXRoLFxuICAgICAgICBMaW5lczogXy5yYW5nZShzdGFydExpbmUsIGVuZExpbmUpLFxuICAgICAgICBFeGNsdWRlQ2xhc3NpZmljYXRpb25zOiBjdXN0b21FeGNsdWRlc1xuICAgIH0sIHsgc2lsZW50OiB0cnVlIH0pKVxuICAgICAgICAubWFwKHJlc3BvbnNlID0+IF8ocmVzcG9uc2UuSGlnaGxpZ2h0cylcbiAgICAgICAgLm1hcCh4ID0+ICh7XG4gICAgICAgIFN0YXJ0TGluZTogeC5TdGFydExpbmUgLSBzdGFydExpbmUsXG4gICAgICAgIFN0YXJ0Q29sdW1uOiAoeC5TdGFydExpbmUgPT09IHN0YXJ0TGluZSA/IHguU3RhcnRDb2x1bW4gLSB3aGl0ZXNwYWNlIDogeC5TdGFydENvbHVtbiksXG4gICAgICAgIEVuZExpbmU6IHguRW5kTGluZSAtIHN0YXJ0TGluZSxcbiAgICAgICAgRW5kQ29sdW1uOiAoeC5TdGFydExpbmUgPT09IHN0YXJ0TGluZSA/IHguRW5kQ29sdW1uIC0gd2hpdGVzcGFjZSA6IHguRW5kQ29sdW1uKSxcbiAgICAgICAgS2luZDogeC5LaW5kLFxuICAgICAgICBQcm9qZWN0czogeC5Qcm9qZWN0c1xuICAgIH0pKVxuICAgICAgICAudmFsdWUoKSlcbiAgICAgICAgLmZpbHRlcih4ID0+IHgubGVuZ3RoID4gMCk7XG59XG5leHBvcnRzLkVkaXRvckVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZWRpdG9yLWVsZW1lbnRcIiwgeyBwcm90b3R5cGU6IEVkaXRvckVsZW1lbnQucHJvdG90eXBlIH0pO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtnZXRFbmhhbmNlZEdyYW1tYXIsIGF1Z21lbnRFZGl0b3IsIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnN9IGZyb20gXCIuLi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOVwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcclxuXHJcbmNvbnN0IGN1c3RvbUV4Y2x1ZGVzID0gRXhjbHVkZUNsYXNzaWZpY2F0aW9ucy5jb25jYXQoW1xyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLklkZW50aWZpZXIsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uUHJlcHJvY2Vzc29yS2V5d29yZCxcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5FeGNsdWRlZENvZGUsXHJcbl0pO1xyXG5cclxuY29uc3QgcG9vbCA9IChmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IE5VTV9UT19LRUVQID0gMTA7XHJcbiAgICBjb25zdCBQT09MOiB7IGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yOyBlbGVtZW50OiBBdG9tLlRleHRFZGl0b3JDb21wb25lbnQ7IH1bXSA9IFtdO1xyXG5cclxuICAgIGNvbnN0IGNsZWFudXBQb29sID0gXy50aHJvdHRsZShmdW5jdGlvbiBjbGVhbnVwUG9vbCgpIHtcclxuICAgICAgICBpZiAoUE9PTC5sZW5ndGggPiBOVU1fVE9fS0VFUCkge1xyXG4gICAgICAgICAgICBjb25zdCBsZW4gPSBNYXRoLm1pbihQT09MLmxlbmd0aCAtIE5VTV9UT19LRUVQLCAxMCk7XHJcbiAgICAgICAgICAgIGxldCByZW1vdmUgPSBQT09MLnNwbGljZSgwLCBsZW4pO1xyXG4gICAgICAgICAgICByZW1vdmUuZm9yRWFjaCh4ID0+IHguZWRpdG9yLmRlc3Ryb3koKSk7XHJcblxyXG4gICAgICAgICAgICBjbGVhbnVwUG9vbCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sIDEwMDAwLCB7IHRyYWlsaW5nOiB0cnVlIH0pO1xyXG5cclxuICAgIGNsYXNzIFJlc3VsdCBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgICAgICBwcml2YXRlIF9kaXNwb3NhYmxlID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB7ZWRpdG9yLCBlbGVtZW50fSA9IHRoaXM7XHJcbiAgICAgICAgICAgIChlbGVtZW50IGFzIGFueSkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIFBPT0wucHVzaCh7IGVkaXRvciwgZWxlbWVudCB9KTtcclxuXHJcbiAgICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKE9tbmkuZ3JhbW1hcnNbMF0pO1xyXG4gICAgICAgICAgICBlZGl0b3Iuc2V0VGV4dChcIlwiKTtcclxuXHJcbiAgICAgICAgICAgIGNsZWFudXBQb29sKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgcHVibGljIGVsZW1lbnQ6IEF0b20uVGV4dEVkaXRvckNvbXBvbmVudCkgeyB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcG9wdWxhdGVQb29sKCkge1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmludGVydmFsKDUwKVxyXG4gICAgICAgICAgICAudGFrZSgxMClcclxuICAgICAgICAgICAgLm1hcCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlZGl0b3JFbGVtZW50ID0gPGFueT5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYXRvbS10ZXh0LWVkaXRvclwiKTtcclxuICAgICAgICAgICAgICAgIGVkaXRvckVsZW1lbnQuc2V0QXR0cmlidXRlTm9kZShkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoXCJndXR0ZXItaGlkZGVuXCIpKTtcclxuICAgICAgICAgICAgICAgIGVkaXRvckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKFwidGFiaW5kZXhcIik7IC8vIG1ha2UgcmVhZC1vbmx5XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gKDxhbnk+ZWRpdG9yRWxlbWVudCkuZ2V0TW9kZWwoKTtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXREZWNvcmF0aW9ucyh7IGNsYXNzOiBcImN1cnNvci1saW5lXCIsIHR5cGU6IFwibGluZVwiIH0pWzBdLmRlc3Ryb3koKTsgLy8gcmVtb3ZlIHRoZSBkZWZhdWx0IHNlbGVjdGlvbiBvZiBhIGxpbmUgaW4gZWFjaCBlZGl0b3JcclxuICAgICAgICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKE9tbmkuZ3JhbW1hcnNbMF0pO1xyXG4gICAgICAgICAgICAgICAgZWRpdG9yLnNldFNvZnRXcmFwcGVkKHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGF1Z21lbnRFZGl0b3IoZWRpdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPEF0b20uVGV4dEVkaXRvckNvbXBvbmVudD5lZGl0b3JFbGVtZW50O1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZG8oKGVsZW1lbnQpID0+IFBPT0wucHVzaCh7IGVsZW1lbnQsIGVkaXRvcjogKDxhbnk+ZWxlbWVudCkuZ2V0TW9kZWwoKSB9KSlcclxuICAgICAgICAgICAgLnRvQXJyYXkoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHBvcHVsYXRlUG9vbCgpLCAxMDAwMCk7XHJcblxyXG4gICAgZnVuY3Rpb24gcmVxdWVzdCgpOiBPYnNlcnZhYmxlPFJlc3VsdD4ge1xyXG4gICAgICAgIGlmIChQT09MLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCB7ZWRpdG9yLCBlbGVtZW50fSA9IFBPT0wucG9wKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihuZXcgUmVzdWx0KGVkaXRvciwgZWxlbWVudCkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwb3B1bGF0ZVBvb2woKS5mbGF0TWFwKCgpID0+IHJlcXVlc3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZ2V0TmV4dCgpIHtcclxuICAgICAgICAgICAgaWYgKCFQT09MLmxlbmd0aCkgeyByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVzdWx0OiBudWxsIH07IH1cclxuICAgICAgICAgICAgY29uc3Qge2VkaXRvciwgZWxlbWVudH0gPSBQT09MLnBvcCgpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IG5ldyBSZXN1bHQoZWRpdG9yLCBlbGVtZW50KSB9O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVxdWVzdFxyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBFZGl0b3JFbGVtZW50IGV4dGVuZHMgSFRNTFNwYW5FbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgX3ByZTogSFRNTFByZUVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfcmVsZWFzZTogSURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9lZGl0b3JFbGVtZW50OiBBdG9tLlRleHRFZGl0b3JDb21wb25lbnQ7XHJcbiAgICBwcml2YXRlIF9lZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcclxuICAgIHByaXZhdGUgX3doaXRlc3BhY2U6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2dyYW1tYXI6IEZpcnN0TWF0ZS5HcmFtbWFyO1xyXG5cclxuICAgIHByaXZhdGUgX3VzYWdlOiBNb2RlbHMuUXVpY2tGaXg7XHJcbiAgICBwdWJsaWMgZ2V0IHVzYWdlKCkgeyByZXR1cm4gdGhpcy5fdXNhZ2U7IH1cclxuICAgIHB1YmxpYyBzZXQgdXNhZ2UodmFsdWUpIHtcclxuICAgICAgICB0aGlzLl9lZGl0b3JUZXh0ID0gbnVsbDtcclxuICAgICAgICB0aGlzLl91c2FnZSA9IHZhbHVlO1xyXG5cclxuICAgICAgICB0aGlzLl93aGl0ZXNwYWNlID0gMDtcclxuXHJcbiAgICAgICAgY29uc3QgdGV4dCA9IHRoaXMuX3VzYWdlLlRleHQ7XHJcbiAgICAgICAgY29uc3QgdXNhZ2VMZW5ndGggPSB0aGlzLl91c2FnZS5FbmRDb2x1bW4gLSB0aGlzLl91c2FnZS5Db2x1bW47XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuX3VzYWdlLkNvbHVtbjsgaSA+IC0xOyBpLS0pIHtcclxuICAgICAgICAgICAgY29uc3QgY2h1bmsgPSB0ZXh0LnN1YnN0cihpKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coY2h1bmspO1xyXG4gICAgICAgICAgICAvLyBUaGlzIHJlZ2V4IHBlcmhhcHMgbmVlZHMgdG8gYmUgaW1wcm92ZWRcclxuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSBjaHVuay5tYXRjaCgvXigoPzpAfF98W2EtekEtWl0pW1xcd10qKSg/OltcXFddfCQpLyk7XHJcbiAgICAgICAgICAgIGlmICghbWF0Y2gpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtYXRjaCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB2ID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICAgIGlmICh2Lmxlbmd0aCA9PT0gdXNhZ2VMZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3doaXRlc3BhY2UgPSB0aGlzLl91c2FnZS5Db2x1bW4gLSBpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IF8udHJpbVN0YXJ0KHZhbHVlLlRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2VkaXRvcikge1xyXG4gICAgICAgICAgICB0aGlzLnNldEVkaXRvclRleHQodGhpcy5fZ3JhbW1hcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2VkaXRvclRleHQ6IHN0cmluZztcclxuICAgIHB1YmxpYyBnZXQgZWRpdG9yVGV4dCgpIHsgcmV0dXJuIHRoaXMuX2VkaXRvclRleHQ7IH1cclxuICAgIHB1YmxpYyBzZXQgZWRpdG9yVGV4dCh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX3VzYWdlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9lZGl0b3JUZXh0ID0gdmFsdWU7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IF8udHJpbVN0YXJ0KHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRFZGl0b3JUZXh0KHRoaXMuX2dyYW1tYXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldEVkaXRvclRleHQoZ3JhbW1hcjogRmlyc3RNYXRlLkdyYW1tYXIpIHtcclxuICAgICAgICBpZiAodGhpcy5fdXNhZ2UpIHtcclxuICAgICAgICAgICAgY29uc3QgdGV4dCA9IHRoaXMuX3VzYWdlLlRleHQ7XHJcblxyXG4gICAgICAgICAgICAodGhpcy5fZWRpdG9yIGFzIGFueSkuX3NldEdyYW1tYXIoPGFueT5ncmFtbWFyKTtcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLnNldFRleHQoXy50cmltU3RhcnQodGV4dCkpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbWFya2VyID0gdGhpcy5fZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShbWzAsICt0aGlzLl91c2FnZS5Db2x1bW4gLSB0aGlzLl93aGl0ZXNwYWNlXSwgWyt0aGlzLl91c2FnZS5FbmRMaW5lIC0gK3RoaXMuX3VzYWdlLkxpbmUsICt0aGlzLl91c2FnZS5FbmRDb2x1bW4gLSB0aGlzLl93aGl0ZXNwYWNlXV0pO1xyXG4gICAgICAgICAgICB0aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7IHR5cGU6IFwiaGlnaGxpZ2h0XCIsIGNsYXNzOiBcImZpbmR1c2FnZXMtdW5kZXJsaW5lXCIgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLnNldFRleHQoXy50cmltKHRoaXMuX2VkaXRvclRleHQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9wcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IHRoaXMuX3VzYWdlICYmIHRoaXMuX3VzYWdlLlRleHQgfHwgdGhpcy5lZGl0b3JUZXh0O1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUuc3R5bGUuZm9udFNpemUgPSBgJHthdG9tLmNvbmZpZy5nZXQoXCJlZGl0b3IuZm9udFNpemVcIil9cHggIWltcG9ydGFudGA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fcHJlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmV2ZXJ0KCkge1xyXG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2RldGFjaEVkaXRvcih0cnVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZW5oYW5jZWQ6IGJvb2xlYW47XHJcbiAgICBwdWJsaWMgZW5oYW5jZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5fZW5oYW5jZWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLl9lbmhhbmNlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGNvbnN0IG5leHQgPSBwb29sLmdldE5leHQoKTtcclxuICAgICAgICBpZiAobmV4dC5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl91c2FnZSAmJiBhdG9tLmNvbmZpZy5nZXQ8Ym9vbGVhbj4oXCJvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZ1wiKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHMgPSByZXF1ZXN0KHsgZmlsZVBhdGg6IHRoaXMuX3VzYWdlLkZpbGVOYW1lLCBzdGFydExpbmU6IHRoaXMuX3VzYWdlLkxpbmUsIGVuZExpbmU6IHRoaXMuX3VzYWdlLkVuZExpbmUsIHdoaXRlc3BhY2U6IHRoaXMuX3doaXRlc3BhY2UgfSlcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbW1hciA9IHRoaXMuX2dyYW1tYXIgPSBnZXRFbmhhbmNlZEdyYW1tYXIobmV4dC5yZXN1bHQuZWRpdG9yLCBfLmZpbmQoT21uaS5ncmFtbWFycywgZyA9PiBfLnNvbWUoKDxhbnk+ZykuZmlsZVR5cGVzLCBmdCA9PiBfLmVuZHNXaXRoKHRoaXMuX3VzYWdlLkZpbGVOYW1lLCBgLiR7ZnR9YCkpKSwgeyByZWFkb25seTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+Z3JhbW1hcikuc2V0UmVzcG9uc2VzKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fYXR0YWNoRWRpdG9yKG5leHQucmVzdWx0LCBncmFtbWFyKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9hdHRhY2hFZGl0b3IobmV4dC5yZXN1bHQpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgcyA9IHBvb2wucmVxdWVzdCgpLnN1YnNjcmliZSgocmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdXNhZ2UgJiYgYXRvbS5jb25maWcuZ2V0PGJvb2xlYW4+KFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmdcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcyA9IHJlcXVlc3QoeyBmaWxlUGF0aDogdGhpcy5fdXNhZ2UuRmlsZU5hbWUsIHN0YXJ0TGluZTogdGhpcy5fdXNhZ2UuTGluZSwgZW5kTGluZTogdGhpcy5fdXNhZ2UuRW5kTGluZSwgd2hpdGVzcGFjZTogdGhpcy5fd2hpdGVzcGFjZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW1tYXIgPSB0aGlzLl9ncmFtbWFyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKHJlc3VsdC5lZGl0b3IsIF8uZmluZChPbW5pLmdyYW1tYXJzLCBnID0+IF8uc29tZSgoPGFueT5nKS5maWxlVHlwZXMsIGZ0ID0+IF8uZW5kc1dpdGgodGhpcy5fdXNhZ2UuRmlsZU5hbWUsIGAuJHtmdH1gKSkpLCB7IHJlYWRvbmx5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+Z3JhbW1hcikuc2V0UmVzcG9uc2VzKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2F0dGFjaEVkaXRvcihyZXN1bHQsIGdyYW1tYXIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fYXR0YWNoRWRpdG9yKHJlc3VsdCkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUocyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYXR0YWNoRWRpdG9yKHJlc3VsdDogeyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjsgZWxlbWVudDogQXRvbS5UZXh0RWRpdG9yQ29tcG9uZW50OyBkaXNwb3NlOiAoKSA9PiB2b2lkIH0sIGdyYW1tYXI/OiBGaXJzdE1hdGUuR3JhbW1hcikge1xyXG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fcmVsZWFzZSA9IHJlc3VsdDtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChyZXN1bHQpO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQgPSByZXN1bHQuZWxlbWVudDtcclxuICAgICAgICB0aGlzLl9lZGl0b3IgPSByZXN1bHQuZWRpdG9yO1xyXG4gICAgICAgIHRoaXMuc2V0RWRpdG9yVGV4dChncmFtbWFyIHx8IHRoaXMuX2dyYW1tYXIpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoPGFueT50aGlzLl9lZGl0b3JFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9kZXRhY2hFZGl0b3IoYXBwZW5kPzogYm9vbGVhbikge1xyXG4gICAgICAgIGlmIChhcHBlbmQpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IHRoaXMuX3VzYWdlICYmIHRoaXMuX3VzYWdlLlRleHQgfHwgdGhpcy5lZGl0b3JUZXh0O1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUuc3R5bGUuZm9udFNpemUgPSBgJHthdG9tLmNvbmZpZy5nZXQoXCJlZGl0b3IuZm9udFNpemVcIil9cHggIWltcG9ydGFudGA7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fcHJlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9yZWxlYXNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUucmVtb3ZlKHRoaXMuX3JlbGVhc2UpO1xyXG4gICAgICAgICAgICB0aGlzLl9yZWxlYXNlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3JFbGVtZW50KVxyXG4gICAgICAgICAgICAodGhpcy5fZWRpdG9yRWxlbWVudCBhcyBhbnkpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9lZGl0b3IgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2VuaGFuY2VkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fZGV0YWNoRWRpdG9yKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuX3ByZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSBcIlwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVxdWVzdCh7ZmlsZVBhdGgsIHN0YXJ0TGluZSwgZW5kTGluZSwgd2hpdGVzcGFjZX06IHsgZmlsZVBhdGg6IHN0cmluZzsgc3RhcnRMaW5lOiBudW1iZXI7IGVuZExpbmU6IG51bWJlcjsgd2hpdGVzcGFjZTogbnVtYmVyOyB9KSB7XHJcbiAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGNsaWVudCA9PiBjbGllbnQuaGlnaGxpZ2h0KHtcclxuICAgICAgICBCdWZmZXI6IG51bGwsXHJcbiAgICAgICAgRmlsZU5hbWU6IGZpbGVQYXRoLFxyXG4gICAgICAgIExpbmVzOiBfLnJhbmdlKHN0YXJ0TGluZSwgZW5kTGluZSksXHJcbiAgICAgICAgRXhjbHVkZUNsYXNzaWZpY2F0aW9uczogY3VzdG9tRXhjbHVkZXNcclxuICAgIH0sIHsgc2lsZW50OiB0cnVlIH0pKVxyXG4gICAgICAgIC5tYXAocmVzcG9uc2UgPT4gXyhyZXNwb25zZS5IaWdobGlnaHRzKVxyXG4gICAgICAgICAgICAvLy5maWx0ZXIoeCA9PiB4LlN0YXJ0TGluZSA+PSByZXF1ZXN0LnN0YXJ0TGluZSAmJiB4LkVuZExpbmUgPD0gcmVxdWVzdC5lbmRMaW5lKVxyXG4gICAgICAgICAgICAubWFwKHggPT4gKHtcclxuICAgICAgICAgICAgICAgIFN0YXJ0TGluZTogeC5TdGFydExpbmUgLSBzdGFydExpbmUsXHJcbiAgICAgICAgICAgICAgICBTdGFydENvbHVtbjogKHguU3RhcnRMaW5lID09PSBzdGFydExpbmUgPyB4LlN0YXJ0Q29sdW1uIC0gd2hpdGVzcGFjZSA6IHguU3RhcnRDb2x1bW4pLFxyXG4gICAgICAgICAgICAgICAgRW5kTGluZTogeC5FbmRMaW5lIC0gc3RhcnRMaW5lLFxyXG4gICAgICAgICAgICAgICAgRW5kQ29sdW1uOiAoeC5TdGFydExpbmUgPT09IHN0YXJ0TGluZSA/IHguRW5kQ29sdW1uIC0gd2hpdGVzcGFjZSA6IHguRW5kQ29sdW1uKSxcclxuICAgICAgICAgICAgICAgIEtpbmQ6IHguS2luZCxcclxuICAgICAgICAgICAgICAgIFByb2plY3RzOiB4LlByb2plY3RzXHJcbiAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAudmFsdWUoKSlcclxuICAgICAgICAuZmlsdGVyKHggPT4geC5sZW5ndGggPiAwKTtcclxufVxyXG5cclxuKDxhbnk+ZXhwb3J0cykuRWRpdG9yRWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZWRpdG9yLWVsZW1lbnRcIiwgeyBwcm90b3R5cGU6IEVkaXRvckVsZW1lbnQucHJvdG90eXBlIH0pO1xyXG4iXX0=
