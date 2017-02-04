'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeFormat = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

var _applyChanges = require('../services/apply-changes');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CodeFormat = function () {
    function CodeFormat() {
        _classCallCheck(this, CodeFormat);

        this.required = false;
        this.title = 'Code Format';
        this.description = 'Support for code formatting.';
    }

    _createClass(CodeFormat, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:code-format', function () {
                return _this.format();
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                cd.add(editor.onDidInsertText(function (event) {
                    if (event.text.length > 1) return;
                    if (event.text === ';' || event.text === '}' || event.text === '{' || event.text.charCodeAt(0) === 10) {
                        _omni.Omni.request(editor, function (solution) {
                            return solution.formatAfterKeystroke({ Character: event.text });
                        }).subscribe(function (data) {
                            return (0, _applyChanges.applyChanges)(editor, data);
                        });
                    }
                }));
            }));
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: 'format',
        value: function format() {
            var editor = atom.workspace.getActiveTextEditor();
            if (editor) {
                (function () {
                    var buffer = editor.getBuffer();
                    _omni.Omni.request(editor, function (solution) {
                        var request = {
                            Line: 0,
                            Column: 0,
                            EndLine: buffer.getLineCount() - 1,
                            EndColumn: 0
                        };
                        return solution.formatRange(request).do(function (data) {
                            return (0, _applyChanges.applyChanges)(editor, data);
                        });
                    });
                })();
            }
        }
    }]);

    return CodeFormat;
}();

var codeFormat = exports.codeFormat = new CodeFormat();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC50cyJdLCJuYW1lcyI6WyJDb2RlRm9ybWF0IiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsImFkZCIsImFkZFRleHRFZGl0b3JDb21tYW5kIiwiZm9ybWF0Iiwic3dpdGNoQWN0aXZlRWRpdG9yIiwiZWRpdG9yIiwiY2QiLCJvbkRpZEluc2VydFRleHQiLCJldmVudCIsInRleHQiLCJsZW5ndGgiLCJjaGFyQ29kZUF0IiwicmVxdWVzdCIsInNvbHV0aW9uIiwiZm9ybWF0QWZ0ZXJLZXlzdHJva2UiLCJDaGFyYWN0ZXIiLCJzdWJzY3JpYmUiLCJkYXRhIiwiZGlzcG9zZSIsImF0b20iLCJ3b3Jrc3BhY2UiLCJnZXRBY3RpdmVUZXh0RWRpdG9yIiwiYnVmZmVyIiwiZ2V0QnVmZmVyIiwiTGluZSIsIkNvbHVtbiIsIkVuZExpbmUiLCJnZXRMaW5lQ291bnQiLCJFbmRDb2x1bW4iLCJmb3JtYXRSYW5nZSIsImRvIiwiY29kZUZvcm1hdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUFFQUEsVTtBQUFBLDBCQUFBO0FBQUE7O0FBMENXLGFBQUFDLFFBQUEsR0FBVyxLQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLGFBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsOEJBQWQ7QUFDVjs7OzttQ0ExQ2tCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsaUJBQUtBLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtDLG9CQUFMLENBQTBCLDRCQUExQixFQUF3RDtBQUFBLHVCQUFNLE1BQUtDLE1BQUwsRUFBTjtBQUFBLGFBQXhELENBQXBCO0FBRUEsaUJBQUtILFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtHLGtCQUFMLENBQXdCLFVBQUNDLE1BQUQsRUFBU0MsRUFBVCxFQUFXO0FBQ25EQSxtQkFBR0wsR0FBSCxDQUFPSSxPQUFPRSxlQUFQLENBQXVCLGlCQUFLO0FBQy9CLHdCQUFJQyxNQUFNQyxJQUFOLENBQVdDLE1BQVgsR0FBb0IsQ0FBeEIsRUFBMkI7QUFFM0Isd0JBQUlGLE1BQU1DLElBQU4sS0FBZSxHQUFmLElBQXNCRCxNQUFNQyxJQUFOLEtBQWUsR0FBckMsSUFBNENELE1BQU1DLElBQU4sS0FBZSxHQUEzRCxJQUFrRUQsTUFBTUMsSUFBTixDQUFXRSxVQUFYLENBQXNCLENBQXRCLE1BQTZCLEVBQW5HLEVBQXVHO0FBQ25HLG1DQUFLQyxPQUFMLENBQWFQLE1BQWIsRUFBcUI7QUFBQSxtQ0FBWVEsU0FBU0Msb0JBQVQsQ0FBOEIsRUFBRUMsV0FBV1AsTUFBTUMsSUFBbkIsRUFBOUIsQ0FBWjtBQUFBLHlCQUFyQixFQUNLTyxTQURMLENBQ2U7QUFBQSxtQ0FBUSxnQ0FBYVgsTUFBYixFQUFxQlksSUFBckIsQ0FBUjtBQUFBLHlCQURmO0FBRUg7QUFDSixpQkFQTSxDQUFQO0FBUUgsYUFUbUIsQ0FBcEI7QUFVSDs7O2tDQUVhO0FBQ1YsaUJBQUtqQixVQUFMLENBQWdCa0IsT0FBaEI7QUFDSDs7O2lDQUVZO0FBQ1QsZ0JBQU1iLFNBQVNjLEtBQUtDLFNBQUwsQ0FBZUMsbUJBQWYsRUFBZjtBQUNBLGdCQUFJaEIsTUFBSixFQUFZO0FBQUE7QUFDUix3QkFBTWlCLFNBQVNqQixPQUFPa0IsU0FBUCxFQUFmO0FBQ0EsK0JBQUtYLE9BQUwsQ0FBYVAsTUFBYixFQUFxQixvQkFBUTtBQUN6Qiw0QkFBTU8sVUFBcUM7QUFDdkNZLGtDQUFNLENBRGlDO0FBRXZDQyxvQ0FBUSxDQUYrQjtBQUd2Q0MscUNBQVNKLE9BQU9LLFlBQVAsS0FBd0IsQ0FITTtBQUl2Q0MsdUNBQVc7QUFKNEIseUJBQTNDO0FBT0EsK0JBQU9mLFNBQ0ZnQixXQURFLENBQ1VqQixPQURWLEVBRUZrQixFQUZFLENBRUM7QUFBQSxtQ0FBUSxnQ0FBYXpCLE1BQWIsRUFBcUJZLElBQXJCLENBQVI7QUFBQSx5QkFGRCxDQUFQO0FBR0gscUJBWEQ7QUFGUTtBQWNYO0FBQ0o7Ozs7OztBQU1FLElBQU1jLGtDQUFhLElBQUluQyxVQUFKLEVBQW5CIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TW9kZWxzfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7T21uaX0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5pbXBvcnQge2FwcGx5Q2hhbmdlc30gZnJvbSAnLi4vc2VydmljZXMvYXBwbHktY2hhbmdlcyc7XHJcblxyXG5jbGFzcyBDb2RlRm9ybWF0IGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZCgnb21uaXNoYXJwLWF0b206Y29kZS1mb3JtYXQnLCAoKSA9PiB0aGlzLmZvcm1hdCgpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZEluc2VydFRleHQoZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQubGVuZ3RoID4gMSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0ID09PSAnOycgfHwgZXZlbnQudGV4dCA9PT0gJ30nIHx8IGV2ZW50LnRleHQgPT09ICd7JyB8fCBldmVudC50ZXh0LmNoYXJDb2RlQXQoMCkgPT09IDEwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uZm9ybWF0QWZ0ZXJLZXlzdHJva2UoeyBDaGFyYWN0ZXI6IGV2ZW50LnRleHQgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiBhcHBseUNoYW5nZXMoZWRpdG9yLCBkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZm9ybWF0KCkge1xyXG4gICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICAgICAgICBpZiAoZWRpdG9yKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcclxuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IDxNb2RlbHMuRm9ybWF0UmFuZ2VSZXF1ZXN0PntcclxuICAgICAgICAgICAgICAgICAgICBMaW5lOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIENvbHVtbjogMCxcclxuICAgICAgICAgICAgICAgICAgICBFbmRMaW5lOiBidWZmZXIuZ2V0TGluZUNvdW50KCkgLSAxLFxyXG4gICAgICAgICAgICAgICAgICAgIEVuZENvbHVtbjogMCxcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvbHV0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgLmZvcm1hdFJhbmdlKHJlcXVlc3QpXHJcbiAgICAgICAgICAgICAgICAgICAgLmRvKGRhdGEgPT4gYXBwbHlDaGFuZ2VzKGVkaXRvciwgZGF0YSkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSAnQ29kZSBGb3JtYXQnO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gJ1N1cHBvcnQgZm9yIGNvZGUgZm9ybWF0dGluZy4nO1xyXG59XHJcbmV4cG9ydCBjb25zdCBjb2RlRm9ybWF0ID0gbmV3IENvZGVGb3JtYXQ7XHJcbiJdfQ==
