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
            }
        }
    }]);

    return CodeFormat;
}();

var codeFormat = exports.codeFormat = new CodeFormat();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC50cyJdLCJuYW1lcyI6WyJDb2RlRm9ybWF0IiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsImFkZCIsImFkZFRleHRFZGl0b3JDb21tYW5kIiwiZm9ybWF0Iiwic3dpdGNoQWN0aXZlRWRpdG9yIiwiZWRpdG9yIiwiY2QiLCJvbkRpZEluc2VydFRleHQiLCJldmVudCIsInRleHQiLCJsZW5ndGgiLCJjaGFyQ29kZUF0IiwicmVxdWVzdCIsInNvbHV0aW9uIiwiZm9ybWF0QWZ0ZXJLZXlzdHJva2UiLCJDaGFyYWN0ZXIiLCJzdWJzY3JpYmUiLCJkYXRhIiwiZGlzcG9zZSIsImF0b20iLCJ3b3Jrc3BhY2UiLCJnZXRBY3RpdmVUZXh0RWRpdG9yIiwiYnVmZmVyIiwiZ2V0QnVmZmVyIiwiTGluZSIsIkNvbHVtbiIsIkVuZExpbmUiLCJnZXRMaW5lQ291bnQiLCJFbmRDb2x1bW4iLCJmb3JtYXRSYW5nZSIsImRvIiwiY29kZUZvcm1hdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUFFQUEsVTtBQUFBLDBCQUFBO0FBQUE7O0FBMENXLGFBQUFDLFFBQUEsR0FBVyxLQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLGFBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsOEJBQWQ7QUFDVjs7OzttQ0ExQ2tCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsaUJBQUtBLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtDLG9CQUFMLENBQTBCLDRCQUExQixFQUF3RDtBQUFBLHVCQUFNLE1BQUtDLE1BQUwsRUFBTjtBQUFBLGFBQXhELENBQXBCO0FBRUEsaUJBQUtILFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtHLGtCQUFMLENBQXdCLFVBQUNDLE1BQUQsRUFBU0MsRUFBVCxFQUFXO0FBQ25EQSxtQkFBR0wsR0FBSCxDQUFPSSxPQUFPRSxlQUFQLENBQXVCLGlCQUFLO0FBQy9CLHdCQUFJQyxNQUFNQyxJQUFOLENBQVdDLE1BQVgsR0FBb0IsQ0FBeEIsRUFBMkI7QUFFM0Isd0JBQUlGLE1BQU1DLElBQU4sS0FBZSxHQUFmLElBQXNCRCxNQUFNQyxJQUFOLEtBQWUsR0FBckMsSUFBNENELE1BQU1DLElBQU4sS0FBZSxHQUEzRCxJQUFrRUQsTUFBTUMsSUFBTixDQUFXRSxVQUFYLENBQXNCLENBQXRCLE1BQTZCLEVBQW5HLEVBQXVHO0FBQ25HLG1DQUFLQyxPQUFMLENBQWFQLE1BQWIsRUFBcUI7QUFBQSxtQ0FBWVEsU0FBU0Msb0JBQVQsQ0FBOEIsRUFBRUMsV0FBV1AsTUFBTUMsSUFBbkIsRUFBOUIsQ0FBWjtBQUFBLHlCQUFyQixFQUNLTyxTQURMLENBQ2U7QUFBQSxtQ0FBUSxnQ0FBYVgsTUFBYixFQUFxQlksSUFBckIsQ0FBUjtBQUFBLHlCQURmO0FBRUg7QUFDSixpQkFQTSxDQUFQO0FBUUgsYUFUbUIsQ0FBcEI7QUFVSDs7O2tDQUVhO0FBQ1YsaUJBQUtqQixVQUFMLENBQWdCa0IsT0FBaEI7QUFDSDs7O2lDQUVZO0FBQ1QsZ0JBQU1iLFNBQVNjLEtBQUtDLFNBQUwsQ0FBZUMsbUJBQWYsRUFBZjtBQUNBLGdCQUFJaEIsTUFBSixFQUFZO0FBQ1Isb0JBQU1pQixTQUFTakIsT0FBT2tCLFNBQVAsRUFBZjtBQUNBLDJCQUFLWCxPQUFMLENBQWFQLE1BQWIsRUFBcUIsb0JBQVE7QUFDekIsd0JBQU1PLFVBQXFDO0FBQ3ZDWSw4QkFBTSxDQURpQztBQUV2Q0MsZ0NBQVEsQ0FGK0I7QUFHdkNDLGlDQUFTSixPQUFPSyxZQUFQLEtBQXdCLENBSE07QUFJdkNDLG1DQUFXO0FBSjRCLHFCQUEzQztBQU9BLDJCQUFPZixTQUNGZ0IsV0FERSxDQUNVakIsT0FEVixFQUVGa0IsRUFGRSxDQUVDO0FBQUEsK0JBQVEsZ0NBQWF6QixNQUFiLEVBQXFCWSxJQUFyQixDQUFSO0FBQUEscUJBRkQsQ0FBUDtBQUdILGlCQVhEO0FBWUg7QUFDSjs7Ozs7O0FBTUUsSUFBTWMsa0NBQWEsSUFBSW5DLFVBQUosRUFBbkIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2NvZGUtZm9ybWF0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtNb2RlbHN9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHtPbW5pfSBmcm9tICcuLi9zZXJ2ZXIvb21uaSc7XHJcbmltcG9ydCB7YXBwbHlDaGFuZ2VzfSBmcm9tICcuLi9zZXJ2aWNlcy9hcHBseS1jaGFuZ2VzJztcclxuXHJcbmNsYXNzIENvZGVGb3JtYXQgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKCdvbW5pc2hhcnAtYXRvbTpjb2RlLWZvcm1hdCcsICgpID0+IHRoaXMuZm9ybWF0KCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkSW5zZXJ0VGV4dChldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dC5sZW5ndGggPiAxKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQgPT09ICc7JyB8fCBldmVudC50ZXh0ID09PSAnfScgfHwgZXZlbnQudGV4dCA9PT0gJ3snIHx8IGV2ZW50LnRleHQuY2hhckNvZGVBdCgwKSA9PT0gMTApIHtcclxuICAgICAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5mb3JtYXRBZnRlcktleXN0cm9rZSh7IENoYXJhY3RlcjogZXZlbnQudGV4dCB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IGFwcGx5Q2hhbmdlcyhlZGl0b3IsIGRhdGEpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmb3JtYXQoKSB7XHJcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gICAgICAgIGlmIChlZGl0b3IpIHtcclxuICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xyXG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gPE1vZGVscy5Gb3JtYXRSYW5nZVJlcXVlc3Q+e1xyXG4gICAgICAgICAgICAgICAgICAgIExpbmU6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIEVuZExpbmU6IGJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDEsXHJcbiAgICAgICAgICAgICAgICAgICAgRW5kQ29sdW1uOiAwLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc29sdXRpb25cclxuICAgICAgICAgICAgICAgICAgICAuZm9ybWF0UmFuZ2UocmVxdWVzdClcclxuICAgICAgICAgICAgICAgICAgICAuZG8oZGF0YSA9PiBhcHBseUNoYW5nZXMoZWRpdG9yLCBkYXRhKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdDb2RlIEZvcm1hdCc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnU3VwcG9ydCBmb3IgY29kZSBmb3JtYXR0aW5nLic7XHJcbn1cclxuZXhwb3J0IGNvbnN0IGNvZGVGb3JtYXQgPSBuZXcgQ29kZUZvcm1hdDtcclxuIl19
