'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EditorElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _highlightV = require('../features/highlight-v1.9');

var _omni = require('../server/omni');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var customExcludes = _highlightV.ExcludeClassifications.concat([8, 9, 10]);
var pool = function () {
    var NUM_TO_KEEP = 10;
    var POOL = [];
    var cleanupPool = (0, _lodash.throttle)(function cleanupPool() {
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
                editor.setText('');
                cleanupPool();
            });
        }

        _createClass(Result, [{
            key: 'dispose',
            value: function dispose() {
                this._disposable.dispose();
            }
        }]);

        return Result;
    }();

    function populatePool() {
        return _rxjs.Observable.interval(50).take(10).map(function () {
            var editorElement = document.createElement('atom-text-editor');
            editorElement.setAttributeNode(document.createAttribute('gutter-hidden'));
            editorElement.removeAttribute('tabindex');
            var editor = editorElement.getModel();
            editor.getDecorations({ class: 'cursor-line', type: 'line' })[0].destroy();
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
        key: 'setEditorText',
        value: function setEditorText(grammar) {
            if (this._usage) {
                var text = this._usage.Text;
                this._editor._setGrammar(grammar);
                this._editor.setText((0, _lodash.trimStart)(text));
                var marker = this._editor.markBufferRange([[0, +this._usage.Column - this._whitespace], [+this._usage.EndLine - +this._usage.Line, +this._usage.EndColumn - this._whitespace]]);
                this._editor.decorateMarker(marker, { type: 'highlight', class: 'findusages-underline' });
            } else {
                this._editor.setText((0, _lodash.trim)(this._editorText));
            }
        }
    }, {
        key: 'attachedCallback',
        value: function attachedCallback() {
            this._disposable = new _tsDisposables.CompositeDisposable();
            if (!this._pre) {
                this._pre = document.createElement('pre');
                this._pre.innerText = this._usage && this._usage.Text || this.editorText;
                this._pre.style.fontSize = atom.config.get('editor.fontSize') + 'px !important';
            }
            this.appendChild(this._pre);
        }
    }, {
        key: 'revert',
        value: function revert() {
            this._detachEditor(true);
        }
    }, {
        key: 'enhance',
        value: function enhance() {
            var _this3 = this;

            if (this._enhanced) return;
            this._enhanced = true;
            var next = pool.getNext();
            if (next.success) {
                if (this._usage && atom.config.get('omnisharp-atom.enhancedHighlighting')) {
                    var s = request({ filePath: this._usage.FileName, startLine: this._usage.Line, endLine: this._usage.EndLine, whitespace: this._whitespace }).subscribe(function (response) {
                        var grammar = _this3._grammar = (0, _highlightV.getEnhancedGrammar)(next.result.editor, (0, _lodash.find)(_omni.Omni.grammars, function (g) {
                            return (0, _lodash.some)(g.fileTypes, function (ft) {
                                return (0, _lodash.endsWith)(_this3._usage.FileName, '.' + ft);
                            });
                        }), { readonly: true });
                        grammar.setResponses(response);
                        _this3._attachEditor(next.result, grammar);
                    });
                    this._disposable.add(s);
                    return;
                }
                this._attachEditor(next.result);
            } else {
                (function () {
                    var s = pool.request().subscribe(function (result) {
                        if (_this3._usage && atom.config.get('omnisharp-atom.enhancedHighlighting')) {
                            var _s = request({ filePath: _this3._usage.FileName, startLine: _this3._usage.Line, endLine: _this3._usage.EndLine, whitespace: _this3._whitespace }).subscribe(function (response) {
                                var grammar = _this3._grammar = (0, _highlightV.getEnhancedGrammar)(result.editor, (0, _lodash.find)(_omni.Omni.grammars, function (g) {
                                    return (0, _lodash.some)(g.fileTypes, function (ft) {
                                        return (0, _lodash.endsWith)(_this3._usage.FileName, '.' + ft);
                                    });
                                }), { readonly: true });
                                grammar.setResponses(response);
                                _this3._attachEditor(result, grammar);
                            });
                            _this3._disposable.add(_s);
                            return;
                        }
                        _this3._attachEditor(result);
                        _this3._disposable.remove(s);
                    });
                    _this3._disposable.add(s);
                })();
            }
        }
    }, {
        key: '_attachEditor',
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
        key: '_detachEditor',
        value: function _detachEditor(append) {
            if (append) {
                this._pre = document.createElement('pre');
                this._pre.innerText = this._usage && this._usage.Text || this.editorText;
                this._pre.style.fontSize = atom.config.get('editor.fontSize') + 'px !important';
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
        key: 'detachedCallback',
        value: function detachedCallback() {
            this._detachEditor();
            if (this._pre) {
                this._pre.remove();
                this._pre.innerText = '';
            }
            this._disposable.dispose();
        }
    }, {
        key: 'usage',
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
                this._pre.innerText = (0, _lodash.trimStart)(value.Text);
            }
            if (this._editor) {
                this.setEditorText(this._grammar);
            }
        }
    }, {
        key: 'editorText',
        get: function get() {
            return this._editorText;
        },
        set: function set(value) {
            this._usage = null;
            this._editorText = value;
            if (this._pre) {
                this._pre.innerText = (0, _lodash.trimStart)(value);
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
            Lines: (0, _lodash.range)(startLine, endLine),
            ExcludeClassifications: customExcludes
        }, { silent: true });
    }).map(function (response) {
        return (0, _lodash.map)(response.Highlights, function (x) {
            return {
                StartLine: x.StartLine - startLine,
                StartColumn: x.StartLine === startLine ? x.StartColumn - whitespace : x.StartColumn,
                EndLine: x.EndLine - startLine,
                EndColumn: x.StartLine === startLine ? x.EndColumn - whitespace : x.EndColumn,
                Kind: x.Kind,
                Projects: x.Projects
            };
        });
    }).filter(function (x) {
        return x.length > 0;
    });
}
exports.EditorElement = document.registerElement('omnisharp-editor-element', { prototype: EditorElement.prototype });
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90ZXh0LWVkaXRvci1wb29sLnRzIl0sIm5hbWVzIjpbImN1c3RvbUV4Y2x1ZGVzIiwiY29uY2F0IiwicG9vbCIsIk5VTV9UT19LRUVQIiwiUE9PTCIsImNsZWFudXBQb29sIiwibGVuZ3RoIiwibGVuIiwiTWF0aCIsIm1pbiIsInJlbW92ZSIsInNwbGljZSIsImZvckVhY2giLCJ4IiwiZWRpdG9yIiwiZGVzdHJveSIsInRyYWlsaW5nIiwiUmVzdWx0IiwiZWxlbWVudCIsIl9kaXNwb3NhYmxlIiwiY3JlYXRlIiwicHVzaCIsInNldEdyYW1tYXIiLCJncmFtbWFycyIsInNldFRleHQiLCJkaXNwb3NlIiwicG9wdWxhdGVQb29sIiwiaW50ZXJ2YWwiLCJ0YWtlIiwibWFwIiwiZWRpdG9yRWxlbWVudCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZU5vZGUiLCJjcmVhdGVBdHRyaWJ1dGUiLCJyZW1vdmVBdHRyaWJ1dGUiLCJnZXRNb2RlbCIsImdldERlY29yYXRpb25zIiwiY2xhc3MiLCJ0eXBlIiwic2V0U29mdFdyYXBwZWQiLCJkbyIsInRvQXJyYXkiLCJzZXRUaW1lb3V0IiwicmVxdWVzdCIsInBvcCIsIm9mIiwiZmxhdE1hcCIsImdldE5leHQiLCJzdWNjZXNzIiwicmVzdWx0IiwiRWRpdG9yRWxlbWVudCIsImdyYW1tYXIiLCJfdXNhZ2UiLCJ0ZXh0IiwiVGV4dCIsIl9lZGl0b3IiLCJfc2V0R3JhbW1hciIsIm1hcmtlciIsIm1hcmtCdWZmZXJSYW5nZSIsIkNvbHVtbiIsIl93aGl0ZXNwYWNlIiwiRW5kTGluZSIsIkxpbmUiLCJFbmRDb2x1bW4iLCJkZWNvcmF0ZU1hcmtlciIsIl9lZGl0b3JUZXh0IiwiX3ByZSIsImlubmVyVGV4dCIsImVkaXRvclRleHQiLCJzdHlsZSIsImZvbnRTaXplIiwiYXRvbSIsImNvbmZpZyIsImdldCIsImFwcGVuZENoaWxkIiwiX2RldGFjaEVkaXRvciIsIl9lbmhhbmNlZCIsIm5leHQiLCJzIiwiZmlsZVBhdGgiLCJGaWxlTmFtZSIsInN0YXJ0TGluZSIsImVuZExpbmUiLCJ3aGl0ZXNwYWNlIiwic3Vic2NyaWJlIiwiX2dyYW1tYXIiLCJnIiwiZmlsZVR5cGVzIiwiZnQiLCJyZWFkb25seSIsInNldFJlc3BvbnNlcyIsInJlc3BvbnNlIiwiX2F0dGFjaEVkaXRvciIsImFkZCIsIl9yZWxlYXNlIiwiX2VkaXRvckVsZW1lbnQiLCJzZXRFZGl0b3JUZXh0IiwiYXBwZW5kIiwidmFsdWUiLCJ1c2FnZUxlbmd0aCIsImkiLCJjaHVuayIsInN1YnN0ciIsImNvbnNvbGUiLCJsb2ciLCJtYXRjaCIsInYiLCJIVE1MU3BhbkVsZW1lbnQiLCJjbGllbnQiLCJoaWdobGlnaHQiLCJCdWZmZXIiLCJMaW5lcyIsIkV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMiLCJzaWxlbnQiLCJIaWdobGlnaHRzIiwiU3RhcnRMaW5lIiwiU3RhcnRDb2x1bW4iLCJLaW5kIiwiUHJvamVjdHMiLCJmaWx0ZXIiLCJleHBvcnRzIiwicmVnaXN0ZXJFbGVtZW50IiwicHJvdG90eXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQSxJQUFNQSxpQkFBaUIsbUNBQXVCQyxNQUF2QixDQUE4QixDQUNqRCxDQURpRCxFQUVqRCxDQUZpRCxFQUdqRCxFQUhpRCxDQUE5QixDQUF2QjtBQU1BLElBQU1DLE9BQVEsWUFBQTtBQUNWLFFBQU1DLGNBQWMsRUFBcEI7QUFDQSxRQUFNQyxPQUEwRSxFQUFoRjtBQUVBLFFBQU1DLGNBQWMsc0JBQVMsU0FBQUEsV0FBQSxHQUFBO0FBQ3pCLFlBQUlELEtBQUtFLE1BQUwsR0FBY0gsV0FBbEIsRUFBK0I7QUFDM0IsZ0JBQU1JLE1BQU1DLEtBQUtDLEdBQUwsQ0FBU0wsS0FBS0UsTUFBTCxHQUFjSCxXQUF2QixFQUFvQyxFQUFwQyxDQUFaO0FBQ0EsZ0JBQU1PLFNBQVNOLEtBQUtPLE1BQUwsQ0FBWSxDQUFaLEVBQWVK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QyxvQkFBUSxJQURtQztBQUUzQzlCLHNCQUFVRCxRQUZpQztBQUczQ2dDLG1CQUFPLG1CQUFNOUIsU0FBTixFQUFpQkMsT0FBakIsQ0FIb0M7QUFJM0M4QixvQ0FBd0JqSDtBQUptQixTQUFqQixFQUszQixFQUFFa0gsUUFBUSxJQUFWLEVBTDJCLENBQVY7QUFBQSxLQUFiLEVBTUZyRixHQU5FLENBTUU7QUFBQSxlQUFZLGlCQUFJK0QsU0FBU3VCLFVBQWIsRUFFYjtBQUFBLG1CQUFNO0FBQ0ZDLDJCQUFXdkcsRUFBRXVHLFNBQUYsR0FBY2xDLFNBRHZCO0FBRUZtQyw2QkFBY3hHLEVBQUV1RyxTQUFGLEtBQWdCbEMsU0FBaEIsR0FBNEJyRSxFQUFFd0csV0FBRixHQUFnQmpDLFVBQTVDLEdBQXlEdkUsRUFBRXdHLFdBRnZFO0FBR0Z2RCx5QkFBU2pELEVBQUVpRCxPQUFGLEdBQVlvQixTQUhuQjtBQUlGbEIsMkJBQVluRCxFQUFFdUcsU0FBRixLQUFnQmxDLFNBQWhCLEdBQTRCckUsRUFBRW1ELFNBQUYsR0FBY29CLFVBQTFDLEdBQXVEdkUsRUFBRW1ELFNBSm5FO0FBS0ZzRCxzQkFBTXpHLEVBQUV5RyxJQUxOO0FBTUZDLDBCQUFVMUcsRUFBRTBHO0FBTlYsYUFBTjtBQUFBLFNBRmEsQ0FBWjtBQUFBLEtBTkYsRUFnQkZDLE1BaEJFLENBZ0JLO0FBQUEsZUFBSzNHLEVBQUVQLE1BQUYsR0FBVyxDQUFoQjtBQUFBLEtBaEJMLENBQVA7QUFpQkg7QUFFS21ILFFBQVN0RSxhQUFULEdBQStCcEIsU0FBVTJGLGVBQVYsQ0FBMEIsMEJBQTFCLEVBQXNELEVBQUVDLFdBQVd4RSxjQUFjd0UsU0FBM0IsRUFBdEQsQ0FBL0IiLCJmaWxlIjoibGliL3ZpZXdzL3RleHQtZWRpdG9yLXBvb2wuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0cmltU3RhcnQsIHRyaW0sIGZpbmQsIHJhbmdlLCB0aHJvdHRsZSwgc29tZSwgZW5kc1dpdGgsIG1hcCB9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7IE1vZGVscyB9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlIH0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5pbXBvcnQgeyBhdWdtZW50RWRpdG9yLCBnZXRFbmhhbmNlZEdyYW1tYXIsIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMgfSBmcm9tICcuLi9mZWF0dXJlcy9oaWdobGlnaHQtdjEuOSc7XHJcbmltcG9ydCB7IE9tbmkgfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcblxyXG5jb25zdCBjdXN0b21FeGNsdWRlcyA9IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMuY29uY2F0KFtcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5JZGVudGlmaWVyLFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLlByZXByb2Nlc3NvcktleXdvcmQsXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uRXhjbHVkZWRDb2RlLFxyXG5dKTtcclxuXHJcbmNvbnN0IHBvb2wgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgTlVNX1RPX0tFRVAgPSAxMDtcclxuICAgIGNvbnN0IFBPT0w6IHsgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3I7IGVsZW1lbnQ6IEF0b20uVGV4dEVkaXRvckNvbXBvbmVudDsgfVtdID0gW107XHJcblxyXG4gICAgY29uc3QgY2xlYW51cFBvb2wgPSB0aHJvdHRsZShmdW5jdGlvbiBjbGVhbnVwUG9vbCgpIHtcclxuICAgICAgICBpZiAoUE9PTC5sZW5ndGggPiBOVU1fVE9fS0VFUCkge1xyXG4gICAgICAgICAgICBjb25zdCBsZW4gPSBNYXRoLm1pbihQT09MLmxlbmd0aCAtIE5VTV9UT19LRUVQLCAxMCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZSA9IFBPT0wuc3BsaWNlKDAsIGxlbik7XHJcbiAgICAgICAgICAgIHJlbW92ZS5mb3JFYWNoKHggPT4geC5lZGl0b3IuZGVzdHJveSgpKTtcclxuXHJcbiAgICAgICAgICAgIGNsZWFudXBQb29sKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgMTAwMDAsIHsgdHJhaWxpbmc6IHRydWUgfSk7XHJcblxyXG4gICAgY2xhc3MgUmVzdWx0IGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgICAgIHByaXZhdGUgX2Rpc3Bvc2FibGUgPSBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHtlZGl0b3IsIGVsZW1lbnR9ID0gdGhpcztcclxuICAgICAgICAgICAgKGVsZW1lbnQgYXMgYW55KS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgUE9PTC5wdXNoKHsgZWRpdG9yLCBlbGVtZW50IH0pO1xyXG5cclxuICAgICAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIoT21uaS5ncmFtbWFyc1swXSk7XHJcbiAgICAgICAgICAgIGVkaXRvci5zZXRUZXh0KCcnKTtcclxuXHJcbiAgICAgICAgICAgIGNsZWFudXBQb29sKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgcHVibGljIGVsZW1lbnQ6IEF0b20uVGV4dEVkaXRvckNvbXBvbmVudCkgeyB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcG9wdWxhdGVQb29sKCkge1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmludGVydmFsKDUwKVxyXG4gICAgICAgICAgICAudGFrZSgxMClcclxuICAgICAgICAgICAgLm1hcCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlZGl0b3JFbGVtZW50ID0gPGFueT5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdG9tLXRleHQtZWRpdG9yJyk7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3JFbGVtZW50LnNldEF0dHJpYnV0ZU5vZGUoZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKCdndXR0ZXItaGlkZGVuJykpO1xyXG4gICAgICAgICAgICAgICAgZWRpdG9yRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7IC8vIG1ha2UgcmVhZC1vbmx5XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gKDxhbnk+ZWRpdG9yRWxlbWVudCkuZ2V0TW9kZWwoKTtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXREZWNvcmF0aW9ucyh7IGNsYXNzOiAnY3Vyc29yLWxpbmUnLCB0eXBlOiAnbGluZScgfSlbMF0uZGVzdHJveSgpOyAvLyByZW1vdmUgdGhlIGRlZmF1bHQgc2VsZWN0aW9uIG9mIGEgbGluZSBpbiBlYWNoIGVkaXRvclxyXG4gICAgICAgICAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIoT21uaS5ncmFtbWFyc1swXSk7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3Iuc2V0U29mdFdyYXBwZWQodHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYXVnbWVudEVkaXRvcihlZGl0b3IpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiA8QXRvbS5UZXh0RWRpdG9yQ29tcG9uZW50PmVkaXRvckVsZW1lbnQ7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5kbyhlbGVtZW50ID0+IFBPT0wucHVzaCh7IGVsZW1lbnQsIGVkaXRvcjogKDxhbnk+ZWxlbWVudCkuZ2V0TW9kZWwoKSB9KSlcclxuICAgICAgICAgICAgLnRvQXJyYXkoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHBvcHVsYXRlUG9vbCgpLCAxMDAwMCk7XHJcblxyXG4gICAgZnVuY3Rpb24gcmVxdWVzdCgpOiBPYnNlcnZhYmxlPFJlc3VsdD4ge1xyXG4gICAgICAgIGlmIChQT09MLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCB7ZWRpdG9yLCBlbGVtZW50fSA9IFBPT0wucG9wKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihuZXcgUmVzdWx0KGVkaXRvciwgZWxlbWVudCkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwb3B1bGF0ZVBvb2woKS5mbGF0TWFwKCgpID0+IHJlcXVlc3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZ2V0TmV4dCgpIHtcclxuICAgICAgICAgICAgaWYgKCFQT09MLmxlbmd0aCkgeyByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVzdWx0OiBudWxsIH07IH1cclxuICAgICAgICAgICAgY29uc3Qge2VkaXRvciwgZWxlbWVudH0gPSBQT09MLnBvcCgpO1xyXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IG5ldyBSZXN1bHQoZWRpdG9yLCBlbGVtZW50KSB9O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVxdWVzdFxyXG4gICAgfTtcclxufSkoKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBFZGl0b3JFbGVtZW50IGV4dGVuZHMgSFRNTFNwYW5FbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcclxuICAgIHByaXZhdGUgX3ByZTogSFRNTFByZUVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfcmVsZWFzZTogSURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9lZGl0b3JFbGVtZW50OiBBdG9tLlRleHRFZGl0b3JDb21wb25lbnQ7XHJcbiAgICBwcml2YXRlIF9lZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcclxuICAgIHByaXZhdGUgX3doaXRlc3BhY2U6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2dyYW1tYXI6IEZpcnN0TWF0ZS5HcmFtbWFyO1xyXG5cclxuICAgIHByaXZhdGUgX3VzYWdlOiBNb2RlbHMuUXVpY2tGaXg7XHJcbiAgICBwdWJsaWMgZ2V0IHVzYWdlKCkgeyByZXR1cm4gdGhpcy5fdXNhZ2U7IH1cclxuICAgIHB1YmxpYyBzZXQgdXNhZ2UodmFsdWUpIHtcclxuICAgICAgICB0aGlzLl9lZGl0b3JUZXh0ID0gbnVsbDtcclxuICAgICAgICB0aGlzLl91c2FnZSA9IHZhbHVlO1xyXG5cclxuICAgICAgICB0aGlzLl93aGl0ZXNwYWNlID0gMDtcclxuXHJcbiAgICAgICAgY29uc3QgdGV4dCA9IHRoaXMuX3VzYWdlLlRleHQ7XHJcbiAgICAgICAgY29uc3QgdXNhZ2VMZW5ndGggPSB0aGlzLl91c2FnZS5FbmRDb2x1bW4gLSB0aGlzLl91c2FnZS5Db2x1bW47XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuX3VzYWdlLkNvbHVtbjsgaSA+IC0xOyBpLS0pIHtcclxuICAgICAgICAgICAgY29uc3QgY2h1bmsgPSB0ZXh0LnN1YnN0cihpKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coY2h1bmspO1xyXG4gICAgICAgICAgICAvLyBUaGlzIHJlZ2V4IHBlcmhhcHMgbmVlZHMgdG8gYmUgaW1wcm92ZWRcclxuICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSBjaHVuay5tYXRjaCgvXigoPzpAfF98W2EtekEtWl0pW1xcd10qKSg/OltcXFddfCQpLyk7XHJcbiAgICAgICAgICAgIGlmICghbWF0Y2gpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtYXRjaCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB2ID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICAgIGlmICh2Lmxlbmd0aCA9PT0gdXNhZ2VMZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3doaXRlc3BhY2UgPSB0aGlzLl91c2FnZS5Db2x1bW4gLSBpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IHRyaW1TdGFydCh2YWx1ZS5UZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRFZGl0b3JUZXh0KHRoaXMuX2dyYW1tYXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9lZGl0b3JUZXh0OiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IGVkaXRvclRleHQoKSB7IHJldHVybiB0aGlzLl9lZGl0b3JUZXh0OyB9XHJcbiAgICBwdWJsaWMgc2V0IGVkaXRvclRleHQodmFsdWUpIHtcclxuICAgICAgICB0aGlzLl91c2FnZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yVGV4dCA9IHZhbHVlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fcHJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSB0cmltU3RhcnQodmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2VkaXRvcikge1xyXG4gICAgICAgICAgICB0aGlzLnNldEVkaXRvclRleHQodGhpcy5fZ3JhbW1hcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0RWRpdG9yVGV4dChncmFtbWFyOiBGaXJzdE1hdGUuR3JhbW1hcikge1xyXG4gICAgICAgIGlmICh0aGlzLl91c2FnZSkge1xyXG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gdGhpcy5fdXNhZ2UuVGV4dDtcclxuXHJcbiAgICAgICAgICAgICh0aGlzLl9lZGl0b3IgYXMgYW55KS5fc2V0R3JhbW1hcig8YW55PmdyYW1tYXIpO1xyXG4gICAgICAgICAgICB0aGlzLl9lZGl0b3Iuc2V0VGV4dCh0cmltU3RhcnQodGV4dCkpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbWFya2VyID0gdGhpcy5fZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShbWzAsICt0aGlzLl91c2FnZS5Db2x1bW4gLSB0aGlzLl93aGl0ZXNwYWNlXSwgWyt0aGlzLl91c2FnZS5FbmRMaW5lIC0gK3RoaXMuX3VzYWdlLkxpbmUsICt0aGlzLl91c2FnZS5FbmRDb2x1bW4gLSB0aGlzLl93aGl0ZXNwYWNlXV0pO1xyXG4gICAgICAgICAgICB0aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7IHR5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogJ2ZpbmR1c2FnZXMtdW5kZXJsaW5lJyB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9lZGl0b3Iuc2V0VGV4dCh0cmltKHRoaXMuX2VkaXRvclRleHQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9wcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSB0aGlzLl91c2FnZSAmJiB0aGlzLl91c2FnZS5UZXh0IHx8IHRoaXMuZWRpdG9yVGV4dDtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLnN0eWxlLmZvbnRTaXplID0gYCR7YXRvbS5jb25maWcuZ2V0KCdlZGl0b3IuZm9udFNpemUnKX1weCAhaW1wb3J0YW50YDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9wcmUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXZlcnQoKSB7XHJcbiAgICAgICAgdGhpcy5fZGV0YWNoRWRpdG9yKHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2VuaGFuY2VkOiBib29sZWFuO1xyXG4gICAgcHVibGljIGVuaGFuY2UoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2VuaGFuY2VkKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5fZW5oYW5jZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBjb25zdCBuZXh0ID0gcG9vbC5nZXROZXh0KCk7XHJcbiAgICAgICAgaWYgKG5leHQuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fdXNhZ2UgJiYgYXRvbS5jb25maWcuZ2V0PGJvb2xlYW4+KCdvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZycpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gcmVxdWVzdCh7IGZpbGVQYXRoOiB0aGlzLl91c2FnZS5GaWxlTmFtZSwgc3RhcnRMaW5lOiB0aGlzLl91c2FnZS5MaW5lLCBlbmRMaW5lOiB0aGlzLl91c2FnZS5FbmRMaW5lLCB3aGl0ZXNwYWNlOiB0aGlzLl93aGl0ZXNwYWNlIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW1tYXIgPSB0aGlzLl9ncmFtbWFyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKG5leHQucmVzdWx0LmVkaXRvciwgZmluZChPbW5pLmdyYW1tYXJzLCBnID0+IHNvbWUoKDxhbnk+ZykuZmlsZVR5cGVzLCBmdCA9PiBlbmRzV2l0aCh0aGlzLl91c2FnZS5GaWxlTmFtZSwgYC4ke2Z0fWApKSksIHsgcmVhZG9ubHk6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmdyYW1tYXIpLnNldFJlc3BvbnNlcyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2F0dGFjaEVkaXRvcihuZXh0LnJlc3VsdCwgZ3JhbW1hcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9hdHRhY2hFZGl0b3IobmV4dC5yZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHMgPSBwb29sLnJlcXVlc3QoKS5zdWJzY3JpYmUocmVzdWx0ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl91c2FnZSAmJiBhdG9tLmNvbmZpZy5nZXQ8Ym9vbGVhbj4oJ29tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gcmVxdWVzdCh7IGZpbGVQYXRoOiB0aGlzLl91c2FnZS5GaWxlTmFtZSwgc3RhcnRMaW5lOiB0aGlzLl91c2FnZS5MaW5lLCBlbmRMaW5lOiB0aGlzLl91c2FnZS5FbmRMaW5lLCB3aGl0ZXNwYWNlOiB0aGlzLl93aGl0ZXNwYWNlIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbW1hciA9IHRoaXMuX2dyYW1tYXIgPSBnZXRFbmhhbmNlZEdyYW1tYXIocmVzdWx0LmVkaXRvciwgZmluZChPbW5pLmdyYW1tYXJzLCBnID0+IHNvbWUoKDxhbnk+ZykuZmlsZVR5cGVzLCBmdCA9PiBlbmRzV2l0aCh0aGlzLl91c2FnZS5GaWxlTmFtZSwgYC4ke2Z0fWApKSksIHsgcmVhZG9ubHk6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5ncmFtbWFyKS5zZXRSZXNwb25zZXMocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXR0YWNoRWRpdG9yKHJlc3VsdCwgZ3JhbW1hcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuX2F0dGFjaEVkaXRvcihyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUocyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYXR0YWNoRWRpdG9yKHJlc3VsdDogeyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcjsgZWxlbWVudDogQXRvbS5UZXh0RWRpdG9yQ29tcG9uZW50OyBkaXNwb3NlOiAoKSA9PiB2b2lkIH0sIGdyYW1tYXI/OiBGaXJzdE1hdGUuR3JhbW1hcikge1xyXG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fcmVsZWFzZSA9IHJlc3VsdDtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChyZXN1bHQpO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQgPSByZXN1bHQuZWxlbWVudDtcclxuICAgICAgICB0aGlzLl9lZGl0b3IgPSByZXN1bHQuZWRpdG9yO1xyXG4gICAgICAgIHRoaXMuc2V0RWRpdG9yVGV4dChncmFtbWFyIHx8IHRoaXMuX2dyYW1tYXIpO1xyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoPGFueT50aGlzLl9lZGl0b3JFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9kZXRhY2hFZGl0b3IoYXBwZW5kPzogYm9vbGVhbikge1xyXG4gICAgICAgIGlmIChhcHBlbmQpIHtcclxuICAgICAgICAgICAgdGhpcy5fcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJyk7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSB0aGlzLl91c2FnZSAmJiB0aGlzLl91c2FnZS5UZXh0IHx8IHRoaXMuZWRpdG9yVGV4dDtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLnN0eWxlLmZvbnRTaXplID0gYCR7YXRvbS5jb25maWcuZ2V0KCdlZGl0b3IuZm9udFNpemUnKX1weCAhaW1wb3J0YW50YDtcclxuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9wcmUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3JlbGVhc2UpIHtcclxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUodGhpcy5fcmVsZWFzZSk7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbGVhc2UuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2VkaXRvckVsZW1lbnQpXHJcbiAgICAgICAgICAgICh0aGlzLl9lZGl0b3JFbGVtZW50IGFzIGFueSkucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX2VkaXRvciA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fZW5oYW5jZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGV0YWNoZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLl9kZXRhY2hFZGl0b3IoKTtcclxuICAgICAgICBpZiAodGhpcy5fcHJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVxdWVzdCh7ZmlsZVBhdGgsIHN0YXJ0TGluZSwgZW5kTGluZSwgd2hpdGVzcGFjZX06IHsgZmlsZVBhdGg6IHN0cmluZzsgc3RhcnRMaW5lOiBudW1iZXI7IGVuZExpbmU6IG51bWJlcjsgd2hpdGVzcGFjZTogbnVtYmVyOyB9KSB7XHJcbiAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGNsaWVudCA9PiBjbGllbnQuaGlnaGxpZ2h0KHtcclxuICAgICAgICBCdWZmZXI6IG51bGwsXHJcbiAgICAgICAgRmlsZU5hbWU6IGZpbGVQYXRoLFxyXG4gICAgICAgIExpbmVzOiByYW5nZShzdGFydExpbmUsIGVuZExpbmUpLFxyXG4gICAgICAgIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnM6IGN1c3RvbUV4Y2x1ZGVzXHJcbiAgICB9LCB7IHNpbGVudDogdHJ1ZSB9KSlcclxuICAgICAgICAubWFwKHJlc3BvbnNlID0+IG1hcChyZXNwb25zZS5IaWdobGlnaHRzLFxyXG4gICAgICAgICAgICAvLy5maWx0ZXIoeCA9PiB4LlN0YXJ0TGluZSA+PSByZXF1ZXN0LnN0YXJ0TGluZSAmJiB4LkVuZExpbmUgPD0gcmVxdWVzdC5lbmRMaW5lKVxyXG4gICAgICAgICAgICB4ID0+ICh7XHJcbiAgICAgICAgICAgICAgICBTdGFydExpbmU6IHguU3RhcnRMaW5lIC0gc3RhcnRMaW5lLFxyXG4gICAgICAgICAgICAgICAgU3RhcnRDb2x1bW46ICh4LlN0YXJ0TGluZSA9PT0gc3RhcnRMaW5lID8geC5TdGFydENvbHVtbiAtIHdoaXRlc3BhY2UgOiB4LlN0YXJ0Q29sdW1uKSxcclxuICAgICAgICAgICAgICAgIEVuZExpbmU6IHguRW5kTGluZSAtIHN0YXJ0TGluZSxcclxuICAgICAgICAgICAgICAgIEVuZENvbHVtbjogKHguU3RhcnRMaW5lID09PSBzdGFydExpbmUgPyB4LkVuZENvbHVtbiAtIHdoaXRlc3BhY2UgOiB4LkVuZENvbHVtbiksXHJcbiAgICAgICAgICAgICAgICBLaW5kOiB4LktpbmQsXHJcbiAgICAgICAgICAgICAgICBQcm9qZWN0czogeC5Qcm9qZWN0c1xyXG4gICAgICAgICAgICB9KSkpXHJcbiAgICAgICAgLmZpbHRlcih4ID0+IHgubGVuZ3RoID4gMCk7XHJcbn1cclxuXHJcbig8YW55PmV4cG9ydHMpLkVkaXRvckVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KCdvbW5pc2hhcnAtZWRpdG9yLWVsZW1lbnQnLCB7IHByb3RvdHlwZTogRWRpdG9yRWxlbWVudC5wcm90b3R5cGUgfSk7XHJcbiJdfQ==
