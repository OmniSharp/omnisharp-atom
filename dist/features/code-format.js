"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeFormat = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tsDisposables = require("ts-disposables");

var _omni = require("../server/omni");

var _applyChanges = require("../services/apply-changes");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CodeFormat = function () {
    function CodeFormat() {
        _classCallCheck(this, CodeFormat);

        this.required = false;
        this.title = "Code Format";
        this.description = "Support for code formatting.";
    }

    _createClass(CodeFormat, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:code-format", function () {
                return _this.format();
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                cd.add(editor.onDidInsertText(function (event) {
                    if (event.text.length > 1) return;
                    if (event.text === ";" || event.text === "}" || event.text === "{" || event.text.charCodeAt(0) === 10) {
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
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "format",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC5qcyIsImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztJQ0dBO0FBQUEsMEJBQUE7OztBQTBDVyxhQUFBLFFBQUEsR0FBVyxLQUFYLENBMUNYO0FBMkNXLGFBQUEsS0FBQSxHQUFRLGFBQVIsQ0EzQ1g7QUE0Q1csYUFBQSxXQUFBLEdBQWMsOEJBQWQsQ0E1Q1g7S0FBQTs7OzttQ0FHbUI7OztBQUNYLGlCQUFLLFVBQUwsR0FBa0Isd0NBQWxCLENBRFc7QUFFWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssb0JBQUwsQ0FBMEIsNEJBQTFCLEVBQXdEO3VCQUFNLE1BQUssTUFBTDthQUFOLENBQTVFLEVBRlc7QUFJWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssa0JBQUwsQ0FBd0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBQ25ELG1CQUFHLEdBQUgsQ0FBTyxPQUFPLGVBQVAsQ0FBdUIsaUJBQUs7QUFDL0Isd0JBQUksTUFBTSxJQUFOLENBQVcsTUFBWCxHQUFvQixDQUFwQixFQUF1QixPQUEzQjtBQUVBLHdCQUFJLE1BQU0sSUFBTixLQUFlLEdBQWYsSUFBc0IsTUFBTSxJQUFOLEtBQWUsR0FBZixJQUFzQixNQUFNLElBQU4sS0FBZSxHQUFmLElBQXNCLE1BQU0sSUFBTixDQUFXLFVBQVgsQ0FBc0IsQ0FBdEIsTUFBNkIsRUFBN0IsRUFBaUM7QUFDbkcsbUNBQUssT0FBTCxDQUFhLE1BQWIsRUFBcUI7bUNBQVksU0FBUyxvQkFBVCxDQUE4QixFQUFFLFdBQVcsTUFBTSxJQUFOLEVBQTNDO3lCQUFaLENBQXJCLENBQ0ssU0FETCxDQUNlO21DQUFRLGdDQUFhLE1BQWIsRUFBcUIsSUFBckI7eUJBQVIsQ0FEZixDQURtRztxQkFBdkc7aUJBSDBCLENBQTlCLEVBRG1EO2FBQVgsQ0FBNUMsRUFKVzs7OztrQ0FnQkQ7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7aUNBSUQ7QUFDVCxnQkFBTSxTQUFTLEtBQUssU0FBTCxDQUFlLG1CQUFmLEVBQVQsQ0FERztBQUVULGdCQUFJLE1BQUosRUFBWTs7QUFDUix3QkFBTSxTQUFTLE9BQU8sU0FBUCxFQUFUO0FBQ04sK0JBQUssT0FBTCxDQUFhLE1BQWIsRUFBcUIsb0JBQVE7QUFDekIsNEJBQU0sVUFBcUM7QUFDdkMsa0NBQU0sQ0FBTjtBQUNBLG9DQUFRLENBQVI7QUFDQSxxQ0FBUyxPQUFPLFlBQVAsS0FBd0IsQ0FBeEI7QUFDVCx1Q0FBVyxDQUFYO3lCQUpFLENBRG1CO0FBUXpCLCtCQUFPLFNBQ0YsV0FERSxDQUNVLE9BRFYsRUFFRixFQUZFLENBRUMsVUFBQyxJQUFEO21DQUFVLGdDQUFhLE1BQWIsRUFBcUIsSUFBckI7eUJBQVYsQ0FGUixDQVJ5QjtxQkFBUixDQUFyQjtxQkFGUTthQUFaOzs7Ozs7O0FBcUJELElBQU0sa0NBQWEsSUFBSSxVQUFKLEVBQWIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2NvZGUtZm9ybWF0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgYXBwbHlDaGFuZ2VzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL2FwcGx5LWNoYW5nZXNcIjtcbmNsYXNzIENvZGVGb3JtYXQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkNvZGUgRm9ybWF0XCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIlN1cHBvcnQgZm9yIGNvZGUgZm9ybWF0dGluZy5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmNvZGUtZm9ybWF0XCIsICgpID0+IHRoaXMuZm9ybWF0KCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZEluc2VydFRleHQoZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0Lmxlbmd0aCA+IDEpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dCA9PT0gXCI7XCIgfHwgZXZlbnQudGV4dCA9PT0gXCJ9XCIgfHwgZXZlbnQudGV4dCA9PT0gXCJ7XCIgfHwgZXZlbnQudGV4dC5jaGFyQ29kZUF0KDApID09PSAxMCkge1xuICAgICAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5mb3JtYXRBZnRlcktleXN0cm9rZSh7IENoYXJhY3RlcjogZXZlbnQudGV4dCB9KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiBhcHBseUNoYW5nZXMoZWRpdG9yLCBkYXRhKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGZvcm1hdCgpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICBpZiAoZWRpdG9yKSB7XG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgTGluZTogMCxcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiAwLFxuICAgICAgICAgICAgICAgICAgICBFbmRMaW5lOiBidWZmZXIuZ2V0TGluZUNvdW50KCkgLSAxLFxuICAgICAgICAgICAgICAgICAgICBFbmRDb2x1bW46IDAsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc29sdXRpb25cbiAgICAgICAgICAgICAgICAgICAgLmZvcm1hdFJhbmdlKHJlcXVlc3QpXG4gICAgICAgICAgICAgICAgICAgIC5kbygoZGF0YSkgPT4gYXBwbHlDaGFuZ2VzKGVkaXRvciwgZGF0YSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgY29uc3QgY29kZUZvcm1hdCA9IG5ldyBDb2RlRm9ybWF0O1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7YXBwbHlDaGFuZ2VzfSBmcm9tIFwiLi4vc2VydmljZXMvYXBwbHktY2hhbmdlc1wiO1xyXG5cclxuY2xhc3MgQ29kZUZvcm1hdCBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpjb2RlLWZvcm1hdFwiLCAoKSA9PiB0aGlzLmZvcm1hdCgpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZEluc2VydFRleHQoZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQubGVuZ3RoID4gMSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0ID09PSBcIjtcIiB8fCBldmVudC50ZXh0ID09PSBcIn1cIiB8fCBldmVudC50ZXh0ID09PSBcIntcIiB8fCBldmVudC50ZXh0LmNoYXJDb2RlQXQoMCkgPT09IDEwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uZm9ybWF0QWZ0ZXJLZXlzdHJva2UoeyBDaGFyYWN0ZXI6IGV2ZW50LnRleHQgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiBhcHBseUNoYW5nZXMoZWRpdG9yLCBkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZm9ybWF0KCkge1xyXG4gICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICAgICAgICBpZiAoZWRpdG9yKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcclxuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IDxNb2RlbHMuRm9ybWF0UmFuZ2VSZXF1ZXN0PntcclxuICAgICAgICAgICAgICAgICAgICBMaW5lOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIENvbHVtbjogMCxcclxuICAgICAgICAgICAgICAgICAgICBFbmRMaW5lOiBidWZmZXIuZ2V0TGluZUNvdW50KCkgLSAxLFxyXG4gICAgICAgICAgICAgICAgICAgIEVuZENvbHVtbjogMCxcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvbHV0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgLmZvcm1hdFJhbmdlKHJlcXVlc3QpXHJcbiAgICAgICAgICAgICAgICAgICAgLmRvKChkYXRhKSA9PiBhcHBseUNoYW5nZXMoZWRpdG9yLCBkYXRhKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiQ29kZSBGb3JtYXRcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiU3VwcG9ydCBmb3IgY29kZSBmb3JtYXR0aW5nLlwiO1xyXG59XHJcbmV4cG9ydCBjb25zdCBjb2RlRm9ybWF0ID0gbmV3IENvZGVGb3JtYXQ7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
