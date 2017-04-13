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
                var _s = pool.request().subscribe(function (result) {
                    if (_this3._usage && atom.config.get('omnisharp-atom.enhancedHighlighting')) {
                        var _s2 = request({ filePath: _this3._usage.FileName, startLine: _this3._usage.Line, endLine: _this3._usage.EndLine, whitespace: _this3._whitespace }).subscribe(function (response) {
                            var grammar = _this3._grammar = (0, _highlightV.getEnhancedGrammar)(result.editor, (0, _lodash.find)(_omni.Omni.grammars, function (g) {
                                return (0, _lodash.some)(g.fileTypes, function (ft) {
                                    return (0, _lodash.endsWith)(_this3._usage.FileName, '.' + ft);
                                });
                            }), { readonly: true });
                            grammar.setResponses(response);
                            _this3._attachEditor(result, grammar);
                        });
                        _this3._disposable.add(_s2);
                        return;
                    }
                    _this3._attachEditor(result);
                    _this3._disposable.remove(_s);
                });
                this._disposable.add(_s);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90ZXh0LWVkaXRvci1wb29sLnRzIl0sIm5hbWVzIjpbImN1c3RvbUV4Y2x1ZGVzIiwiY29uY2F0IiwicG9vbCIsIk5VTV9UT19LRUVQIiwiUE9PTCIsImNsZWFudXBQb29sIiwibGVuZ3RoIiwibGVuIiwiTWF0aCIsIm1pbiIsInJlbW92ZSIsInNwbGljZSIsImZvckVhY2giLCJ4IiwiZWRpdG9yIiwiZGVzdHJveSIsInRyYWlsaW5nIiwiUmVzdWx0IiwiZWxlbWVudCIsIl9kaXNwb3NhYmxlIiwiY3JlYXRlIiwicHVzaCIsInNldEdyYW1tYXIiLCJncmFtbWFycyIsInNldFRleHQiLCJkaXNwb3NlIiwicG9wdWxhdGVQb29sIiwiaW50ZXJ2YWwiLCJ0YWtlIiwibWFwIiwiZWRpdG9yRWxlbWVudCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInNldEF0dHJpYnV0ZU5vZGUiLCJjcmVhdGVBdHRyaWJ1dGUiLCJyZW1vdmVBdHRyaWJ1dGUiLCJnZXRNb2RlbCIsImdldERlY29yYXRpb25zIiwiY2xhc3MiLCJ0eXBlIiwic2V0U29mdFdyYXBwZWQiLCJkbyIsInRvQXJyYXkiLCJzZXRUaW1lb3V0IiwicmVxdWVzdCIsInBvcCIsIm9mIiwiZmxhdE1hcCIsImdldE5leHQiLCJzdWNjZXNzIiwicmVzdWx0IiwiRWRpdG9yRWxlbWVudCIsImdyYW1tYXIiLCJfdXNhZ2UiLCJ0ZXh0IiwiVGV4dCIsIl9lZGl0b3IiLCJfc2V0R3JhbW1hciIsIm1hcmtlciIsIm1hcmtCdWZmZXJSYW5nZSIsIkNvbHVtbiIsIl93aGl0ZXNwYWNlIiwiRW5kTGluZSIsIkxpbmUiLCJFbmRDb2x1bW4iLCJkZWNvcmF0ZU1hcmtlciIsIl9lZGl0b3JUZXh0IiwiX3ByZSIsImlubmVyVGV4dCIsImVkaXRvclRleHQiLCJzdHlsZSIsImZvbnRTaXplIiwiYXRvbSIsImNvbmZpZyIsImdldCIsImFwcGVuZENoaWxkIiwiX2RldGFjaEVkaXRvciIsIl9lbmhhbmNlZCIsIm5leHQiLCJzIiwiZmlsZVBhdGgiLCJGaWxlTmFtZSIsInN0YXJ0TGluZSIsImVuZExpbmUiLCJ3aGl0ZXNwYWNlIiwic3Vic2NyaWJlIiwiX2dyYW1tYXIiLCJnIiwiZmlsZVR5cGVzIiwiZnQiLCJyZWFkb25seSIsInNldFJlc3BvbnNlcyIsInJlc3BvbnNlIiwiX2F0dGFjaEVkaXRvciIsImFkZCIsIl9yZWxlYXNlIiwiX2VkaXRvckVsZW1lbnQiLCJzZXRFZGl0b3JUZXh0IiwiYXBwZW5kIiwidmFsdWUiLCJ1c2FnZUxlbmd0aCIsImkiLCJjaHVuayIsInN1YnN0ciIsImNvbnNvbGUiLCJsb2ciLCJtYXRjaCIsInYiLCJIVE1MU3BhbkVsZW1lbnQiLCJjbGllbnQiLCJoaWdobGlnaHQiLCJCdWZmZXIiLCJMaW5lcyIsIkV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMiLCJzaWxlbnQiLCJIaWdobGlnaHRzIiwiU3RhcnRMaW5lIiwiU3RhcnRDb2x1bW4iLCJLaW5kIiwiUHJvamVjdHMiLCJmaWx0ZXIiLCJleHBvcnRzIiwicmVnaXN0ZXJFbGVtZW50IiwicHJvdG90eXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQSxJQUFNQSxpQkFBaUIsbUNBQXVCQyxNQUF2QixDQUE4QixDQUNqRCxDQURpRCxFQUVqRCxDQUZpRCxFQUdqRCxFQUhpRCxDQUE5QixDQUF2QjtBQU1BLElBQU1DLE9BQVEsWUFBQTtBQUNWLFFBQU1DLGNBQWMsRUFBcEI7QUFDQSxRQUFNQyxPQUEwRSxFQUFoRjtBQUVBLFFBQU1DLGNBQWMsc0JBQVMsU0FBQUEsV0FBQSxHQUFBO0FBQ3pCLFlBQUlELEtBQUtFLE1BQUwsR0FBY0gsV0FBbEIsRUFBK0I7QUFDM0IsZ0JBQU1JLE1BQU1DLEtBQUtDLEdBQUwsQ0FBU0wsS0FBS0UsTUFBTCxHQUFjSCxXQUF2QixFQUFvQyxFQUFwQyxDQUFaO0FBQ0EsZ0JBQU1PLFNBQVNOLEtBQUtPLE1BQUwsQ0FBWSxDQUFaLEVBQWVKLEdBQWYsQ0FBZjtBQUNBRyxtQkFBT0UsT0FBUCxDQUFlO0FBQUEsdUJBQUtDLEVBQUVDLE1BQUYsQ0FBU0MsT0FBVCxFQUFMO0FBQUEsYUFBZjtBQUVBVjtBQUNIO0FBQ0osS0FSbUIsRUFRakIsS0FSaUIsRUFRVixFQUFFVyxVQUFVLElBQVosRUFSVSxDQUFwQjs7QUFKVSxRQWNWQyxNQWRVO0FBMEJOLHdCQUFtQkgsTUFBbkIsRUFBbURJLE9BQW5ELEVBQW9GO0FBQUE7O0FBQUE7O0FBQWpFLGlCQUFBSixNQUFBLEdBQUFBLE1BQUE7QUFBZ0MsaUJBQUFJLE9BQUEsR0FBQUEsT0FBQTtBQVgzQyxpQkFBQUMsV0FBQSxHQUFjLDBCQUFXQyxNQUFYLENBQWtCLFlBQUE7QUFBQSxvQkFDN0JOLE1BRDZCLFNBQzdCQSxNQUQ2QjtBQUFBLG9CQUNyQkksT0FEcUIsU0FDckJBLE9BRHFCOztBQUVuQ0Esd0JBQWdCUixNQUFoQjtBQUNETixxQkFBS2lCLElBQUwsQ0FBVSxFQUFFUCxjQUFGLEVBQVVJLGdCQUFWLEVBQVY7QUFFQUosdUJBQU9RLFVBQVAsQ0FBa0IsV0FBS0MsUUFBTCxDQUFjLENBQWQsQ0FBbEI7QUFDQVQsdUJBQU9VLE9BQVAsQ0FBZSxFQUFmO0FBRUFuQjtBQUNILGFBVHFCLENBQWQ7QUFXaUY7O0FBMUJuRjtBQUFBO0FBQUEsc0NBNEJRO0FBQ1YscUJBQUtjLFdBQUwsQ0FBaUJNLE9BQWpCO0FBQ0g7QUE5Qks7O0FBQUE7QUFBQTs7QUFpQ1YsYUFBQUMsWUFBQSxHQUFBO0FBQ0ksZUFBTyxpQkFBV0MsUUFBWCxDQUFvQixFQUFwQixFQUNGQyxJQURFLENBQ0csRUFESCxFQUVGQyxHQUZFLENBRUUsWUFBQTtBQUNELGdCQUFNQyxnQkFBcUJDLFNBQVNDLGFBQVQsQ0FBdUIsa0JBQXZCLENBQTNCO0FBQ0FGLDBCQUFjRyxnQkFBZCxDQUErQkYsU0FBU0csZUFBVCxDQUF5QixlQUF6QixDQUEvQjtBQUNBSiwwQkFBY0ssZUFBZCxDQUE4QixVQUE5QjtBQUVBLGdCQUFNckIsU0FBZWdCLGNBQWVNLFFBQWYsRUFBckI7QUFDQXRCLG1CQUFPdUIsY0FBUCxDQUFzQixFQUFFQyxPQUFPLGFBQVQsRUFBd0JDLE1BQU0sTUFBOUIsRUFBdEIsRUFBOEQsQ0FBOUQsRUFBaUV4QixPQUFqRTtBQUNBRCxtQkFBT1EsVUFBUCxDQUFrQixXQUFLQyxRQUFMLENBQWMsQ0FBZCxDQUFsQjtBQUNBVCxtQkFBTzBCLGNBQVAsQ0FBc0IsSUFBdEI7QUFFQSwyQ0FBYzFCLE1BQWQ7QUFFQSxtQkFBaUNnQixhQUFqQztBQUNILFNBZkUsRUFnQkZXLEVBaEJFLENBZ0JDO0FBQUEsbUJBQVdyQyxLQUFLaUIsSUFBTCxDQUFVLEVBQUVILGdCQUFGLEVBQVdKLFFBQWNJLFFBQVNrQixRQUFULEVBQXpCLEVBQVYsQ0FBWDtBQUFBLFNBaEJELEVBaUJGTSxPQWpCRSxFQUFQO0FBa0JIO0FBRURDLGVBQVc7QUFBQSxlQUFNakIsY0FBTjtBQUFBLEtBQVgsRUFBaUMsS0FBakM7QUFFQSxhQUFBa0IsT0FBQSxHQUFBO0FBQ0ksWUFBSXhDLEtBQUtFLE1BQVQsRUFBaUI7QUFBQSw0QkFDYUYsS0FBS3lDLEdBQUwsRUFEYjtBQUFBLGdCQUNOL0IsTUFETSxhQUNOQSxNQURNO0FBQUEsZ0JBQ0VJLE9BREYsYUFDRUEsT0FERjs7QUFHYixtQkFBTyxpQkFBVzRCLEVBQVgsQ0FBYyxJQUFJN0IsTUFBSixDQUFXSCxNQUFYLEVBQW1CSSxPQUFuQixDQUFkLENBQVA7QUFDSCxTQUpELE1BSU87QUFDSCxtQkFBT1EsZUFBZXFCLE9BQWYsQ0FBdUI7QUFBQSx1QkFBTUgsU0FBTjtBQUFBLGFBQXZCLENBQVA7QUFDSDtBQUNKO0FBRUQsV0FBTztBQUNISSxlQURHLHFCQUNJO0FBQ0gsZ0JBQUksQ0FBQzVDLEtBQUtFLE1BQVYsRUFBa0I7QUFBRSx1QkFBTyxFQUFFMkMsU0FBUyxLQUFYLEVBQWtCQyxRQUFRLElBQTFCLEVBQVA7QUFBMEM7O0FBRDNELDZCQUV1QjlDLEtBQUt5QyxHQUFMLEVBRnZCO0FBQUEsZ0JBRUkvQixNQUZKLGNBRUlBLE1BRko7QUFBQSxnQkFFWUksT0FGWixjQUVZQSxPQUZaOztBQUdILG1CQUFPLEVBQUUrQixTQUFTLElBQVgsRUFBaUJDLFFBQVEsSUFBSWpDLE1BQUosQ0FBV0gsTUFBWCxFQUFtQkksT0FBbkIsQ0FBekIsRUFBUDtBQUNILFNBTEU7O0FBTUgwQjtBQU5HLEtBQVA7QUFRSCxDQTFFWSxFQUFiOztJQTRFTU8sYSxXQUFBQSxhOzs7Ozs7Ozs7OztzQ0EwRG9CQyxPLEVBQTBCO0FBQzVDLGdCQUFJLEtBQUtDLE1BQVQsRUFBaUI7QUFDYixvQkFBTUMsT0FBTyxLQUFLRCxNQUFMLENBQVlFLElBQXpCO0FBRUMscUJBQUtDLE9BQUwsQ0FBcUJDLFdBQXJCLENBQXNDTCxPQUF0QztBQUNELHFCQUFLSSxPQUFMLENBQWFoQyxPQUFiLENBQXFCLHVCQUFVOEIsSUFBVixDQUFyQjtBQUVBLG9CQUFNSSxTQUFTLEtBQUtGLE9BQUwsQ0FBYUcsZUFBYixDQUE2QixDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUMsS0FBS04sTUFBTCxDQUFZTyxNQUFiLEdBQXNCLEtBQUtDLFdBQS9CLENBQUQsRUFBOEMsQ0FBQyxDQUFDLEtBQUtSLE1BQUwsQ0FBWVMsT0FBYixHQUF1QixDQUFDLEtBQUtULE1BQUwsQ0FBWVUsSUFBckMsRUFBMkMsQ0FBQyxLQUFLVixNQUFMLENBQVlXLFNBQWIsR0FBeUIsS0FBS0gsV0FBekUsQ0FBOUMsQ0FBN0IsQ0FBZjtBQUNBLHFCQUFLTCxPQUFMLENBQWFTLGNBQWIsQ0FBNEJQLE1BQTVCLEVBQW9DLEVBQUVuQixNQUFNLFdBQVIsRUFBcUJELE9BQU8sc0JBQTVCLEVBQXBDO0FBQ0gsYUFSRCxNQVFPO0FBQ0gscUJBQUtrQixPQUFMLENBQWFoQyxPQUFiLENBQXFCLGtCQUFLLEtBQUswQyxXQUFWLENBQXJCO0FBQ0g7QUFDSjs7OzJDQUVzQjtBQUNuQixpQkFBSy9DLFdBQUwsR0FBbUIsd0NBQW5CO0FBQ0EsZ0JBQUksQ0FBQyxLQUFLZ0QsSUFBVixFQUFnQjtBQUNaLHFCQUFLQSxJQUFMLEdBQVlwQyxTQUFTQyxhQUFULENBQXVCLEtBQXZCLENBQVo7QUFDQSxxQkFBS21DLElBQUwsQ0FBVUMsU0FBVixHQUFzQixLQUFLZixNQUFMLElBQWUsS0FBS0EsTUFBTCxDQUFZRSxJQUEzQixJQUFtQyxLQUFLYyxVQUE5RDtBQUNBLHFCQUFLRixJQUFMLENBQVVHLEtBQVYsQ0FBZ0JDLFFBQWhCLEdBQThCQyxLQUFLQyxNQUFMLENBQVlDLEdBQVosQ0FBZ0IsaUJBQWhCLENBQTlCO0FBQ0g7QUFDRCxpQkFBS0MsV0FBTCxDQUFpQixLQUFLUixJQUF0QjtBQUNIOzs7aUNBRVk7QUFDVCxpQkFBS1MsYUFBTCxDQUFtQixJQUFuQjtBQUNIOzs7a0NBR2E7QUFBQTs7QUFDVixnQkFBSSxLQUFLQyxTQUFULEVBQW9CO0FBQ3BCLGlCQUFLQSxTQUFMLEdBQWlCLElBQWpCO0FBRUEsZ0JBQU1DLE9BQU81RSxLQUFLOEMsT0FBTCxFQUFiO0FBQ0EsZ0JBQUk4QixLQUFLN0IsT0FBVCxFQUFrQjtBQUNkLG9CQUFJLEtBQUtJLE1BQUwsSUFBZW1CLEtBQUtDLE1BQUwsQ0FBWUMsR0FBWixDQUF5QixxQ0FBekIsQ0FBbkIsRUFBb0Y7QUFDaEYsd0JBQU1LLElBQUluQyxRQUFRLEVBQUVvQyxVQUFVLEtBQUszQixNQUFMLENBQVk0QixRQUF4QixFQUFrQ0MsV0FBVyxLQUFLN0IsTUFBTCxDQUFZVSxJQUF6RCxFQUErRG9CLFNBQVMsS0FBSzlCLE1BQUwsQ0FBWVMsT0FBcEYsRUFBNkZzQixZQUFZLEtBQUt2QixXQUE5RyxFQUFSLEVBQ0x3QixTQURLLENBQ0ssb0JBQVE7QUFDZiw0QkFBTWpDLFVBQVUsT0FBS2tDLFFBQUwsR0FBZ0Isb0NBQW1CUixLQUFLNUIsTUFBTCxDQUFZcEMsTUFBL0IsRUFBdUMsa0JBQUssV0FBS1MsUUFBVixFQUFvQjtBQUFBLG1DQUFLLGtCQUFXZ0UsRUFBR0MsU0FBZCxFQUF5QjtBQUFBLHVDQUFNLHNCQUFTLE9BQUtuQyxNQUFMLENBQVk0QixRQUFyQixRQUFtQ1EsRUFBbkMsQ0FBTjtBQUFBLDZCQUF6QixDQUFMO0FBQUEseUJBQXBCLENBQXZDLEVBQTJJLEVBQUVDLFVBQVUsSUFBWixFQUEzSSxDQUFoQztBQUNNdEMsZ0NBQVN1QyxZQUFULENBQXNCQyxRQUF0QjtBQUNOLCtCQUFLQyxhQUFMLENBQW1CZixLQUFLNUIsTUFBeEIsRUFBZ0NFLE9BQWhDO0FBQ0gscUJBTEssQ0FBVjtBQU1BLHlCQUFLakMsV0FBTCxDQUFpQjJFLEdBQWpCLENBQXFCZixDQUFyQjtBQUNBO0FBQ0g7QUFDRCxxQkFBS2MsYUFBTCxDQUFtQmYsS0FBSzVCLE1BQXhCO0FBQ0gsYUFaRCxNQVlPO0FBQ0gsb0JBQU02QixLQUFJN0UsS0FBSzBDLE9BQUwsR0FBZXlDLFNBQWYsQ0FBeUIsa0JBQU07QUFDckMsd0JBQUksT0FBS2hDLE1BQUwsSUFBZW1CLEtBQUtDLE1BQUwsQ0FBWUMsR0FBWixDQUF5QixxQ0FBekIsQ0FBbkIsRUFBb0Y7QUFDaEYsNEJBQU1LLE1BQUluQyxRQUFRLEVBQUVvQyxVQUFVLE9BQUszQixNQUFMLENBQVk0QixRQUF4QixFQUFrQ0MsV0FBVyxPQUFLN0IsTUFBTCxDQUFZVSxJQUF6RCxFQUErRG9CLFNBQVMsT0FBSzlCLE1BQUwsQ0FBWVMsT0FBcEYsRUFBNkZzQixZQUFZLE9BQUt2QixXQUE5RyxFQUFSLEVBQ0x3QixTQURLLENBQ0ssb0JBQVE7QUFDZixnQ0FBTWpDLFVBQVUsT0FBS2tDLFFBQUwsR0FBZ0Isb0NBQW1CcEMsT0FBT3BDLE1BQTFCLEVBQWtDLGtCQUFLLFdBQUtTLFFBQVYsRUFBb0I7QUFBQSx1Q0FBSyxrQkFBV2dFLEVBQUdDLFNBQWQsRUFBeUI7QUFBQSwyQ0FBTSxzQkFBUyxPQUFLbkMsTUFBTCxDQUFZNEIsUUFBckIsUUFBbUNRLEVBQW5DLENBQU47QUFBQSxpQ0FBekIsQ0FBTDtBQUFBLDZCQUFwQixDQUFsQyxFQUFzSSxFQUFFQyxVQUFVLElBQVosRUFBdEksQ0FBaEM7QUFDTXRDLG9DQUFTdUMsWUFBVCxDQUFzQkMsUUFBdEI7QUFDTixtQ0FBS0MsYUFBTCxDQUFtQjNDLE1BQW5CLEVBQTJCRSxPQUEzQjtBQUNILHlCQUxLLENBQVY7QUFNQSwrQkFBS2pDLFdBQUwsQ0FBaUIyRSxHQUFqQixDQUFxQmYsR0FBckI7QUFDQTtBQUNIO0FBQ0QsMkJBQUtjLGFBQUwsQ0FBbUIzQyxNQUFuQjtBQUNBLDJCQUFLL0IsV0FBTCxDQUFpQlQsTUFBakIsQ0FBd0JxRSxFQUF4QjtBQUNILGlCQWJTLENBQVY7QUFjQSxxQkFBSzVELFdBQUwsQ0FBaUIyRSxHQUFqQixDQUFxQmYsRUFBckI7QUFDSDtBQUNKOzs7c0NBRXFCN0IsTSxFQUE2RkUsTyxFQUEyQjtBQUMxSSxnQkFBSSxLQUFLZSxJQUFULEVBQWU7QUFDWCxxQkFBS0EsSUFBTCxDQUFVekQsTUFBVjtBQUNBLHFCQUFLeUQsSUFBTCxHQUFZLElBQVo7QUFDSDtBQUVELGlCQUFLNEIsUUFBTCxHQUFnQjdDLE1BQWhCO0FBQ0EsaUJBQUsvQixXQUFMLENBQWlCMkUsR0FBakIsQ0FBcUI1QyxNQUFyQjtBQUNBLGlCQUFLOEMsY0FBTCxHQUFzQjlDLE9BQU9oQyxPQUE3QjtBQUNBLGlCQUFLc0MsT0FBTCxHQUFlTixPQUFPcEMsTUFBdEI7QUFDQSxpQkFBS21GLGFBQUwsQ0FBbUI3QyxXQUFXLEtBQUtrQyxRQUFuQztBQUNBLGlCQUFLWCxXQUFMLENBQXNCLEtBQUtxQixjQUEzQjtBQUNIOzs7c0NBRXFCRSxNLEVBQWdCO0FBQ2xDLGdCQUFJQSxNQUFKLEVBQVk7QUFDUixxQkFBSy9CLElBQUwsR0FBWXBDLFNBQVNDLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBWjtBQUNBLHFCQUFLbUMsSUFBTCxDQUFVQyxTQUFWLEdBQXNCLEtBQUtmLE1BQUwsSUFBZSxLQUFLQSxNQUFMLENBQVlFLElBQTNCLElBQW1DLEtBQUtjLFVBQTlEO0FBQ0EscUJBQUtGLElBQUwsQ0FBVUcsS0FBVixDQUFnQkMsUUFBaEIsR0FBOEJDLEtBQUtDLE1BQUwsQ0FBWUMsR0FBWixDQUFnQixpQkFBaEIsQ0FBOUI7QUFDQSxxQkFBS0MsV0FBTCxDQUFpQixLQUFLUixJQUF0QjtBQUNIO0FBRUQsZ0JBQUksS0FBSzRCLFFBQVQsRUFBbUI7QUFDZixxQkFBSzVFLFdBQUwsQ0FBaUJULE1BQWpCLENBQXdCLEtBQUtxRixRQUE3QjtBQUNBLHFCQUFLQSxRQUFMLENBQWN0RSxPQUFkO0FBQ0g7QUFFRCxnQkFBSSxLQUFLdUUsY0FBVCxFQUNLLEtBQUtBLGNBQUwsQ0FBNEJ0RixNQUE1QjtBQUVMLGlCQUFLOEMsT0FBTCxHQUFlLElBQWY7QUFDQSxpQkFBS3dDLGNBQUwsR0FBc0IsSUFBdEI7QUFDQSxpQkFBS25CLFNBQUwsR0FBaUIsS0FBakI7QUFDSDs7OzJDQUVzQjtBQUNuQixpQkFBS0QsYUFBTDtBQUNBLGdCQUFJLEtBQUtULElBQVQsRUFBZTtBQUNYLHFCQUFLQSxJQUFMLENBQVV6RCxNQUFWO0FBQ0EscUJBQUt5RCxJQUFMLENBQVVDLFNBQVYsR0FBc0IsRUFBdEI7QUFDSDtBQUNELGlCQUFLakQsV0FBTCxDQUFpQk0sT0FBakI7QUFDSDs7OzRCQTNKZTtBQUFLLG1CQUFPLEtBQUs0QixNQUFaO0FBQXFCLFM7MEJBQ3pCOEMsSyxFQUFLO0FBQ2xCLGlCQUFLakMsV0FBTCxHQUFtQixJQUFuQjtBQUNBLGlCQUFLYixNQUFMLEdBQWM4QyxLQUFkO0FBRUEsaUJBQUt0QyxXQUFMLEdBQW1CLENBQW5CO0FBRUEsZ0JBQU1QLE9BQU8sS0FBS0QsTUFBTCxDQUFZRSxJQUF6QjtBQUNBLGdCQUFNNkMsY0FBYyxLQUFLL0MsTUFBTCxDQUFZVyxTQUFaLEdBQXdCLEtBQUtYLE1BQUwsQ0FBWU8sTUFBeEQ7QUFDQSxpQkFBSyxJQUFJeUMsSUFBSSxLQUFLaEQsTUFBTCxDQUFZTyxNQUF6QixFQUFpQ3lDLElBQUksQ0FBQyxDQUF0QyxFQUF5Q0EsR0FBekMsRUFBOEM7QUFDMUMsb0JBQU1DLFFBQVFoRCxLQUFLaUQsTUFBTCxDQUFZRixDQUFaLENBQWQ7QUFDQUcsd0JBQVFDLEdBQVIsQ0FBWUgsS0FBWjtBQUVBLG9CQUFNSSxRQUFRSixNQUFNSSxLQUFOLENBQVksb0NBQVosQ0FBZDtBQUNBLG9CQUFJLENBQUNBLEtBQUwsRUFBWTtBQUNaRix3QkFBUUMsR0FBUixDQUFZQyxLQUFaO0FBRUEsb0JBQU1DLElBQUlELE1BQU0sQ0FBTixDQUFWO0FBQ0Esb0JBQUlDLEVBQUVyRyxNQUFGLEtBQWE4RixXQUFqQixFQUE4QjtBQUMxQix5QkFBS3ZDLFdBQUwsR0FBbUIsS0FBS1IsTUFBTCxDQUFZTyxNQUFaLEdBQXFCeUMsQ0FBeEM7QUFDQTtBQUNIO0FBQ0o7QUFFRCxnQkFBSSxLQUFLbEMsSUFBVCxFQUFlO0FBQ1gscUJBQUtBLElBQUwsQ0FBVUMsU0FBVixHQUFzQix1QkFBVStCLE1BQU01QyxJQUFoQixDQUF0QjtBQUNIO0FBRUQsZ0JBQUksS0FBS0MsT0FBVCxFQUFrQjtBQUNkLHFCQUFLeUMsYUFBTCxDQUFtQixLQUFLWCxRQUF4QjtBQUNIO0FBQ0o7Ozs0QkFHb0I7QUFBSyxtQkFBTyxLQUFLcEIsV0FBWjtBQUEwQixTOzBCQUM5QmlDLEssRUFBSztBQUN2QixpQkFBSzlDLE1BQUwsR0FBYyxJQUFkO0FBQ0EsaUJBQUthLFdBQUwsR0FBbUJpQyxLQUFuQjtBQUVBLGdCQUFJLEtBQUtoQyxJQUFULEVBQWU7QUFDWCxxQkFBS0EsSUFBTCxDQUFVQyxTQUFWLEdBQXNCLHVCQUFVK0IsS0FBVixDQUF0QjtBQUNIO0FBRUQsZ0JBQUksS0FBSzNDLE9BQVQsRUFBa0I7QUFDZCxxQkFBS3lDLGFBQUwsQ0FBbUIsS0FBS1gsUUFBeEI7QUFDSDtBQUNKOzs7O0VBeEQ4QnNCLGU7O0FBd0tuQyxTQUFBaEUsT0FBQSxPQUEwSTtBQUFBLFFBQXhIb0MsUUFBd0gsUUFBeEhBLFFBQXdIO0FBQUEsUUFBOUdFLFNBQThHLFFBQTlHQSxTQUE4RztBQUFBLFFBQW5HQyxPQUFtRyxRQUFuR0EsT0FBbUc7QUFBQSxRQUExRkMsVUFBMEYsUUFBMUZBLFVBQTBGOztBQUN0SSxXQUFPLFdBQUt4QyxPQUFMLENBQWE7QUFBQSxlQUFVaUUsT0FBT0MsU0FBUCxDQUFpQjtBQUMzQ0Msb0JBQVEsSUFEbUM7QUFFM0M5QixzQkFBVUQsUUFGaUM7QUFHM0NnQyxtQkFBTyxtQkFBTTlCLFNBQU4sRUFBaUJDLE9BQWpCLENBSG9DO0FBSTNDOEIsb0NBQXdCakg7QUFKbUIsU0FBakIsRUFLM0IsRUFBRWtILFFBQVEsSUFBVixFQUwyQixDQUFWO0FBQUEsS0FBYixFQU1GckYsR0FORSxDQU1FO0FBQUEsZUFBWSxpQkFBSStELFNBQVN1QixVQUFiLEVBRWI7QUFBQSxtQkFBTTtBQUNGQywyQkFBV3ZHLEVBQUV1RyxTQUFGLEdBQWNsQyxTQUR2QjtBQUVGbUMsNkJBQWN4RyxFQUFFdUcsU0FBRixLQUFnQmxDLFNBQWhCLEdBQTRCckUsRUFBRXdHLFdBQUYsR0FBZ0JqQyxVQUE1QyxHQUF5RHZFLEVBQUV3RyxXQUZ2RTtBQUdGdkQseUJBQVNqRCxFQUFFaUQsT0FBRixHQUFZb0IsU0FIbkI7QUFJRmxCLDJCQUFZbkQsRUFBRXVHLFNBQUYsS0FBZ0JsQyxTQUFoQixHQUE0QnJFLEVBQUVtRCxTQUFGLEdBQWNvQixVQUExQyxHQUF1RHZFLEVBQUVtRCxTQUpuRTtBQUtGc0Qsc0JBQU16RyxFQUFFeUcsSUFMTjtBQU1GQywwQkFBVTFHLEVBQUUwRztBQU5WLGFBQU47QUFBQSxTQUZhLENBQVo7QUFBQSxLQU5GLEVBZ0JGQyxNQWhCRSxDQWdCSztBQUFBLGVBQUszRyxFQUFFUCxNQUFGLEdBQVcsQ0FBaEI7QUFBQSxLQWhCTCxDQUFQO0FBaUJIO0FBRUttSCxRQUFTdEUsYUFBVCxHQUErQnBCLFNBQVUyRixlQUFWLENBQTBCLDBCQUExQixFQUFzRCxFQUFFQyxXQUFXeEUsY0FBY3dFLFNBQTNCLEVBQXRELENBQS9CIiwiZmlsZSI6ImxpYi92aWV3cy90ZXh0LWVkaXRvci1wb29sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdHJpbVN0YXJ0LCB0cmltLCBmaW5kLCByYW5nZSwgdGhyb3R0bGUsIHNvbWUsIGVuZHNXaXRoLCBtYXAgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBNb2RlbHMgfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHsgYXVnbWVudEVkaXRvciwgZ2V0RW5oYW5jZWRHcmFtbWFyLCBFeGNsdWRlQ2xhc3NpZmljYXRpb25zIH0gZnJvbSAnLi4vZmVhdHVyZXMvaGlnaGxpZ2h0LXYxLjknO1xyXG5pbXBvcnQgeyBPbW5pIH0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5cclxuY29uc3QgY3VzdG9tRXhjbHVkZXMgPSBFeGNsdWRlQ2xhc3NpZmljYXRpb25zLmNvbmNhdChbXHJcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uSWRlbnRpZmllcixcclxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5QcmVwcm9jZXNzb3JLZXl3b3JkLFxyXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLkV4Y2x1ZGVkQ29kZSxcclxuXSk7XHJcblxyXG5jb25zdCBwb29sID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IE5VTV9UT19LRUVQID0gMTA7XHJcbiAgICBjb25zdCBQT09MOiB7IGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yOyBlbGVtZW50OiBBdG9tLlRleHRFZGl0b3JDb21wb25lbnQ7IH1bXSA9IFtdO1xyXG5cclxuICAgIGNvbnN0IGNsZWFudXBQb29sID0gdGhyb3R0bGUoZnVuY3Rpb24gY2xlYW51cFBvb2woKSB7XHJcbiAgICAgICAgaWYgKFBPT0wubGVuZ3RoID4gTlVNX1RPX0tFRVApIHtcclxuICAgICAgICAgICAgY29uc3QgbGVuID0gTWF0aC5taW4oUE9PTC5sZW5ndGggLSBOVU1fVE9fS0VFUCwgMTApO1xyXG4gICAgICAgICAgICBjb25zdCByZW1vdmUgPSBQT09MLnNwbGljZSgwLCBsZW4pO1xyXG4gICAgICAgICAgICByZW1vdmUuZm9yRWFjaCh4ID0+IHguZWRpdG9yLmRlc3Ryb3koKSk7XHJcblxyXG4gICAgICAgICAgICBjbGVhbnVwUG9vbCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sIDEwMDAwLCB7IHRyYWlsaW5nOiB0cnVlIH0pO1xyXG5cclxuICAgIGNsYXNzIFJlc3VsdCBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgICAgICBwcml2YXRlIF9kaXNwb3NhYmxlID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB7ZWRpdG9yLCBlbGVtZW50fSA9IHRoaXM7XHJcbiAgICAgICAgICAgIChlbGVtZW50IGFzIGFueSkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIFBPT0wucHVzaCh7IGVkaXRvciwgZWxlbWVudCB9KTtcclxuXHJcbiAgICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKE9tbmkuZ3JhbW1hcnNbMF0pO1xyXG4gICAgICAgICAgICBlZGl0b3Iuc2V0VGV4dCgnJyk7XHJcblxyXG4gICAgICAgICAgICBjbGVhbnVwUG9vbCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIHB1YmxpYyBlbGVtZW50OiBBdG9tLlRleHRFZGl0b3JDb21wb25lbnQpIHsgfVxyXG5cclxuICAgICAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBvcHVsYXRlUG9vbCgpIHtcclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5pbnRlcnZhbCg1MClcclxuICAgICAgICAgICAgLnRha2UoMTApXHJcbiAgICAgICAgICAgIC5tYXAoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZWRpdG9yRWxlbWVudCA9IDxhbnk+ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXRvbS10ZXh0LWVkaXRvcicpO1xyXG4gICAgICAgICAgICAgICAgZWRpdG9yRWxlbWVudC5zZXRBdHRyaWJ1dGVOb2RlKGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZSgnZ3V0dGVyLWhpZGRlbicpKTtcclxuICAgICAgICAgICAgICAgIGVkaXRvckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCd0YWJpbmRleCcpOyAvLyBtYWtlIHJlYWQtb25seVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9ICg8YW55PmVkaXRvckVsZW1lbnQpLmdldE1vZGVsKCk7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0RGVjb3JhdGlvbnMoeyBjbGFzczogJ2N1cnNvci1saW5lJywgdHlwZTogJ2xpbmUnIH0pWzBdLmRlc3Ryb3koKTsgLy8gcmVtb3ZlIHRoZSBkZWZhdWx0IHNlbGVjdGlvbiBvZiBhIGxpbmUgaW4gZWFjaCBlZGl0b3JcclxuICAgICAgICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKE9tbmkuZ3JhbW1hcnNbMF0pO1xyXG4gICAgICAgICAgICAgICAgZWRpdG9yLnNldFNvZnRXcmFwcGVkKHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGF1Z21lbnRFZGl0b3IoZWRpdG9yKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPEF0b20uVGV4dEVkaXRvckNvbXBvbmVudD5lZGl0b3JFbGVtZW50O1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZG8oZWxlbWVudCA9PiBQT09MLnB1c2goeyBlbGVtZW50LCBlZGl0b3I6ICg8YW55PmVsZW1lbnQpLmdldE1vZGVsKCkgfSkpXHJcbiAgICAgICAgICAgIC50b0FycmF5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGltZW91dCgoKSA9PiBwb3B1bGF0ZVBvb2woKSwgMTAwMDApO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlcXVlc3QoKTogT2JzZXJ2YWJsZTxSZXN1bHQ+IHtcclxuICAgICAgICBpZiAoUE9PTC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3Qge2VkaXRvciwgZWxlbWVudH0gPSBQT09MLnBvcCgpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YobmV3IFJlc3VsdChlZGl0b3IsIGVsZW1lbnQpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gcG9wdWxhdGVQb29sKCkuZmxhdE1hcCgoKSA9PiByZXF1ZXN0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGdldE5leHQoKSB7XHJcbiAgICAgICAgICAgIGlmICghUE9PTC5sZW5ndGgpIHsgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlc3VsdDogbnVsbCB9OyB9XHJcbiAgICAgICAgICAgIGNvbnN0IHtlZGl0b3IsIGVsZW1lbnR9ID0gUE9PTC5wb3AoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBuZXcgUmVzdWx0KGVkaXRvciwgZWxlbWVudCkgfTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlcXVlc3RcclxuICAgIH07XHJcbn0pKCk7XHJcblxyXG5leHBvcnQgY2xhc3MgRWRpdG9yRWxlbWVudCBleHRlbmRzIEhUTUxTcGFuRWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XHJcbiAgICBwcml2YXRlIF9wcmU6IEhUTUxQcmVFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX3JlbGVhc2U6IElEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfZWRpdG9yRWxlbWVudDogQXRvbS5UZXh0RWRpdG9yQ29tcG9uZW50O1xyXG4gICAgcHJpdmF0ZSBfZWRpdG9yOiBBdG9tLlRleHRFZGl0b3I7XHJcbiAgICBwcml2YXRlIF93aGl0ZXNwYWNlOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9ncmFtbWFyOiBGaXJzdE1hdGUuR3JhbW1hcjtcclxuXHJcbiAgICBwcml2YXRlIF91c2FnZTogTW9kZWxzLlF1aWNrRml4O1xyXG4gICAgcHVibGljIGdldCB1c2FnZSgpIHsgcmV0dXJuIHRoaXMuX3VzYWdlOyB9XHJcbiAgICBwdWJsaWMgc2V0IHVzYWdlKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yVGV4dCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fdXNhZ2UgPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5fd2hpdGVzcGFjZSA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0IHRleHQgPSB0aGlzLl91c2FnZS5UZXh0O1xyXG4gICAgICAgIGNvbnN0IHVzYWdlTGVuZ3RoID0gdGhpcy5fdXNhZ2UuRW5kQ29sdW1uIC0gdGhpcy5fdXNhZ2UuQ29sdW1uO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLl91c2FnZS5Db2x1bW47IGkgPiAtMTsgaS0tKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNodW5rID0gdGV4dC5zdWJzdHIoaSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNodW5rKTtcclxuICAgICAgICAgICAgLy8gVGhpcyByZWdleCBwZXJoYXBzIG5lZWRzIHRvIGJlIGltcHJvdmVkXHJcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gY2h1bmsubWF0Y2goL14oKD86QHxffFthLXpBLVpdKVtcXHddKikoPzpbXFxXXXwkKS8pO1xyXG4gICAgICAgICAgICBpZiAoIW1hdGNoKSBjb250aW51ZTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cobWF0Y2gpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdiA9IG1hdGNoWzFdO1xyXG4gICAgICAgICAgICBpZiAodi5sZW5ndGggPT09IHVzYWdlTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl93aGl0ZXNwYWNlID0gdGhpcy5fdXNhZ2UuQ29sdW1uIC0gaTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fcHJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSB0cmltU3RhcnQodmFsdWUuVGV4dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZWRpdG9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RWRpdG9yVGV4dCh0aGlzLl9ncmFtbWFyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZWRpdG9yVGV4dDogc3RyaW5nO1xyXG4gICAgcHVibGljIGdldCBlZGl0b3JUZXh0KCkgeyByZXR1cm4gdGhpcy5fZWRpdG9yVGV4dDsgfVxyXG4gICAgcHVibGljIHNldCBlZGl0b3JUZXh0KHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fdXNhZ2UgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvclRleHQgPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3ByZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUuaW5uZXJUZXh0ID0gdHJpbVN0YXJ0KHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRFZGl0b3JUZXh0KHRoaXMuX2dyYW1tYXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldEVkaXRvclRleHQoZ3JhbW1hcjogRmlyc3RNYXRlLkdyYW1tYXIpIHtcclxuICAgICAgICBpZiAodGhpcy5fdXNhZ2UpIHtcclxuICAgICAgICAgICAgY29uc3QgdGV4dCA9IHRoaXMuX3VzYWdlLlRleHQ7XHJcblxyXG4gICAgICAgICAgICAodGhpcy5fZWRpdG9yIGFzIGFueSkuX3NldEdyYW1tYXIoPGFueT5ncmFtbWFyKTtcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLnNldFRleHQodHJpbVN0YXJ0KHRleHQpKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG1hcmtlciA9IHRoaXMuX2VkaXRvci5tYXJrQnVmZmVyUmFuZ2UoW1swLCArdGhpcy5fdXNhZ2UuQ29sdW1uIC0gdGhpcy5fd2hpdGVzcGFjZV0sIFsrdGhpcy5fdXNhZ2UuRW5kTGluZSAtICt0aGlzLl91c2FnZS5MaW5lLCArdGhpcy5fdXNhZ2UuRW5kQ29sdW1uIC0gdGhpcy5fd2hpdGVzcGFjZV1dKTtcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiAnaGlnaGxpZ2h0JywgY2xhc3M6ICdmaW5kdXNhZ2VzLXVuZGVybGluZScgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLnNldFRleHQodHJpbSh0aGlzLl9lZGl0b3JUZXh0KSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIGlmICghdGhpcy5fcHJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUuaW5uZXJUZXh0ID0gdGhpcy5fdXNhZ2UgJiYgdGhpcy5fdXNhZ2UuVGV4dCB8fCB0aGlzLmVkaXRvclRleHQ7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5zdHlsZS5mb250U2l6ZSA9IGAke2F0b20uY29uZmlnLmdldCgnZWRpdG9yLmZvbnRTaXplJyl9cHggIWltcG9ydGFudGA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fcHJlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmV2ZXJ0KCkge1xyXG4gICAgICAgIHRoaXMuX2RldGFjaEVkaXRvcih0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9lbmhhbmNlZDogYm9vbGVhbjtcclxuICAgIHB1YmxpYyBlbmhhbmNlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9lbmhhbmNlZCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuX2VuaGFuY2VkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgY29uc3QgbmV4dCA9IHBvb2wuZ2V0TmV4dCgpO1xyXG4gICAgICAgIGlmIChuZXh0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX3VzYWdlICYmIGF0b20uY29uZmlnLmdldDxib29sZWFuPignb21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmcnKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcyA9IHJlcXVlc3QoeyBmaWxlUGF0aDogdGhpcy5fdXNhZ2UuRmlsZU5hbWUsIHN0YXJ0TGluZTogdGhpcy5fdXNhZ2UuTGluZSwgZW5kTGluZTogdGhpcy5fdXNhZ2UuRW5kTGluZSwgd2hpdGVzcGFjZTogdGhpcy5fd2hpdGVzcGFjZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFtbWFyID0gdGhpcy5fZ3JhbW1hciA9IGdldEVuaGFuY2VkR3JhbW1hcihuZXh0LnJlc3VsdC5lZGl0b3IsIGZpbmQoT21uaS5ncmFtbWFycywgZyA9PiBzb21lKCg8YW55PmcpLmZpbGVUeXBlcywgZnQgPT4gZW5kc1dpdGgodGhpcy5fdXNhZ2UuRmlsZU5hbWUsIGAuJHtmdH1gKSkpLCB7IHJlYWRvbmx5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5ncmFtbWFyKS5zZXRSZXNwb25zZXMocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hdHRhY2hFZGl0b3IobmV4dC5yZXN1bHQsIGdyYW1tYXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fYXR0YWNoRWRpdG9yKG5leHQucmVzdWx0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zdCBzID0gcG9vbC5yZXF1ZXN0KCkuc3Vic2NyaWJlKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdXNhZ2UgJiYgYXRvbS5jb25maWcuZ2V0PGJvb2xlYW4+KCdvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IHJlcXVlc3QoeyBmaWxlUGF0aDogdGhpcy5fdXNhZ2UuRmlsZU5hbWUsIHN0YXJ0TGluZTogdGhpcy5fdXNhZ2UuTGluZSwgZW5kTGluZTogdGhpcy5fdXNhZ2UuRW5kTGluZSwgd2hpdGVzcGFjZTogdGhpcy5fd2hpdGVzcGFjZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW1tYXIgPSB0aGlzLl9ncmFtbWFyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKHJlc3VsdC5lZGl0b3IsIGZpbmQoT21uaS5ncmFtbWFycywgZyA9PiBzb21lKCg8YW55PmcpLmZpbGVUeXBlcywgZnQgPT4gZW5kc1dpdGgodGhpcy5fdXNhZ2UuRmlsZU5hbWUsIGAuJHtmdH1gKSkpLCB7IHJlYWRvbmx5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+Z3JhbW1hcikuc2V0UmVzcG9uc2VzKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2F0dGFjaEVkaXRvcihyZXN1bHQsIGdyYW1tYXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hdHRhY2hFZGl0b3IocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUucmVtb3ZlKHMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2F0dGFjaEVkaXRvcihyZXN1bHQ6IHsgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3I7IGVsZW1lbnQ6IEF0b20uVGV4dEVkaXRvckNvbXBvbmVudDsgZGlzcG9zZTogKCkgPT4gdm9pZCB9LCBncmFtbWFyPzogRmlyc3RNYXRlLkdyYW1tYXIpIHtcclxuICAgICAgICBpZiAodGhpcy5fcHJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgdGhpcy5fcHJlID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3JlbGVhc2UgPSByZXN1bHQ7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocmVzdWx0KTtcclxuICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50ID0gcmVzdWx0LmVsZW1lbnQ7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gcmVzdWx0LmVkaXRvcjtcclxuICAgICAgICB0aGlzLnNldEVkaXRvclRleHQoZ3JhbW1hciB8fCB0aGlzLl9ncmFtbWFyKTtcclxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKDxhbnk+dGhpcy5fZWRpdG9yRWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZGV0YWNoRWRpdG9yKGFwcGVuZD86IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAoYXBwZW5kKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUuaW5uZXJUZXh0ID0gdGhpcy5fdXNhZ2UgJiYgdGhpcy5fdXNhZ2UuVGV4dCB8fCB0aGlzLmVkaXRvclRleHQ7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5zdHlsZS5mb250U2l6ZSA9IGAke2F0b20uY29uZmlnLmdldCgnZWRpdG9yLmZvbnRTaXplJyl9cHggIWltcG9ydGFudGA7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fcHJlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9yZWxlYXNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUucmVtb3ZlKHRoaXMuX3JlbGVhc2UpO1xyXG4gICAgICAgICAgICB0aGlzLl9yZWxlYXNlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3JFbGVtZW50KVxyXG4gICAgICAgICAgICAodGhpcy5fZWRpdG9yRWxlbWVudCBhcyBhbnkpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9lZGl0b3IgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2VuaGFuY2VkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRldGFjaGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdGhpcy5fZGV0YWNoRWRpdG9yKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuX3ByZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9wcmUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSAnJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlcXVlc3Qoe2ZpbGVQYXRoLCBzdGFydExpbmUsIGVuZExpbmUsIHdoaXRlc3BhY2V9OiB7IGZpbGVQYXRoOiBzdHJpbmc7IHN0YXJ0TGluZTogbnVtYmVyOyBlbmRMaW5lOiBudW1iZXI7IHdoaXRlc3BhY2U6IG51bWJlcjsgfSkge1xyXG4gICAgcmV0dXJuIE9tbmkucmVxdWVzdChjbGllbnQgPT4gY2xpZW50LmhpZ2hsaWdodCh7XHJcbiAgICAgICAgQnVmZmVyOiBudWxsLFxyXG4gICAgICAgIEZpbGVOYW1lOiBmaWxlUGF0aCxcclxuICAgICAgICBMaW5lczogcmFuZ2Uoc3RhcnRMaW5lLCBlbmRMaW5lKSxcclxuICAgICAgICBFeGNsdWRlQ2xhc3NpZmljYXRpb25zOiBjdXN0b21FeGNsdWRlc1xyXG4gICAgfSwgeyBzaWxlbnQ6IHRydWUgfSkpXHJcbiAgICAgICAgLm1hcChyZXNwb25zZSA9PiBtYXAocmVzcG9uc2UuSGlnaGxpZ2h0cyxcclxuICAgICAgICAgICAgLy8uZmlsdGVyKHggPT4geC5TdGFydExpbmUgPj0gcmVxdWVzdC5zdGFydExpbmUgJiYgeC5FbmRMaW5lIDw9IHJlcXVlc3QuZW5kTGluZSlcclxuICAgICAgICAgICAgeCA9PiAoe1xyXG4gICAgICAgICAgICAgICAgU3RhcnRMaW5lOiB4LlN0YXJ0TGluZSAtIHN0YXJ0TGluZSxcclxuICAgICAgICAgICAgICAgIFN0YXJ0Q29sdW1uOiAoeC5TdGFydExpbmUgPT09IHN0YXJ0TGluZSA/IHguU3RhcnRDb2x1bW4gLSB3aGl0ZXNwYWNlIDogeC5TdGFydENvbHVtbiksXHJcbiAgICAgICAgICAgICAgICBFbmRMaW5lOiB4LkVuZExpbmUgLSBzdGFydExpbmUsXHJcbiAgICAgICAgICAgICAgICBFbmRDb2x1bW46ICh4LlN0YXJ0TGluZSA9PT0gc3RhcnRMaW5lID8geC5FbmRDb2x1bW4gLSB3aGl0ZXNwYWNlIDogeC5FbmRDb2x1bW4pLFxyXG4gICAgICAgICAgICAgICAgS2luZDogeC5LaW5kLFxyXG4gICAgICAgICAgICAgICAgUHJvamVjdHM6IHguUHJvamVjdHNcclxuICAgICAgICAgICAgfSkpKVxyXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lmxlbmd0aCA+IDApO1xyXG59XHJcblxyXG4oPGFueT5leHBvcnRzKS5FZGl0b3JFbGVtZW50ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudCgnb21uaXNoYXJwLWVkaXRvci1lbGVtZW50JywgeyBwcm90b3R5cGU6IEVkaXRvckVsZW1lbnQucHJvdG90eXBlIH0pO1xyXG4iXX0=
