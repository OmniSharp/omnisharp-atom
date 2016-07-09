"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeFormat = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

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

            this.disposable = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC5qcyIsImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztJQ0dBLFU7QUFBQSwwQkFBQTtBQUFBOztBQTBDVyxhQUFBLFFBQUEsR0FBVyxLQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsYUFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLDhCQUFkO0FBQ1Y7Ozs7bUNBMUNrQjtBQUFBOztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLDRCQUExQixFQUF3RDtBQUFBLHVCQUFNLE1BQUssTUFBTCxFQUFOO0FBQUEsYUFBeEQsQ0FBcEI7QUFFQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssa0JBQUwsQ0FBd0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBQ25ELG1CQUFHLEdBQUgsQ0FBTyxPQUFPLGVBQVAsQ0FBdUIsaUJBQUs7QUFDL0Isd0JBQUksTUFBTSxJQUFOLENBQVcsTUFBWCxHQUFvQixDQUF4QixFQUEyQjtBQUUzQix3QkFBSSxNQUFNLElBQU4sS0FBZSxHQUFmLElBQXNCLE1BQU0sSUFBTixLQUFlLEdBQXJDLElBQTRDLE1BQU0sSUFBTixLQUFlLEdBQTNELElBQWtFLE1BQU0sSUFBTixDQUFXLFVBQVgsQ0FBc0IsQ0FBdEIsTUFBNkIsRUFBbkcsRUFBdUc7QUFDbkcsbUNBQUssT0FBTCxDQUFhLE1BQWIsRUFBcUI7QUFBQSxtQ0FBWSxTQUFTLG9CQUFULENBQThCLEVBQUUsV0FBVyxNQUFNLElBQW5CLEVBQTlCLENBQVo7QUFBQSx5QkFBckIsRUFDSyxTQURMLENBQ2U7QUFBQSxtQ0FBUSxnQ0FBYSxNQUFiLEVBQXFCLElBQXJCLENBQVI7QUFBQSx5QkFEZjtBQUVIO0FBQ0osaUJBUE0sQ0FBUDtBQVFILGFBVG1CLENBQXBCO0FBVUg7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7O2lDQUVZO0FBQ1QsZ0JBQU0sU0FBUyxLQUFLLFNBQUwsQ0FBZSxtQkFBZixFQUFmO0FBQ0EsZ0JBQUksTUFBSixFQUFZO0FBQUE7QUFDUix3QkFBTSxTQUFTLE9BQU8sU0FBUCxFQUFmO0FBQ0EsK0JBQUssT0FBTCxDQUFhLE1BQWIsRUFBcUIsb0JBQVE7QUFDekIsNEJBQU0sVUFBcUM7QUFDdkMsa0NBQU0sQ0FEaUM7QUFFdkMsb0NBQVEsQ0FGK0I7QUFHdkMscUNBQVMsT0FBTyxZQUFQLEtBQXdCLENBSE07QUFJdkMsdUNBQVc7QUFKNEIseUJBQTNDO0FBT0EsK0JBQU8sU0FDRixXQURFLENBQ1UsT0FEVixFQUVGLEVBRkUsQ0FFQyxVQUFDLElBQUQ7QUFBQSxtQ0FBVSxnQ0FBYSxNQUFiLEVBQXFCLElBQXJCLENBQVY7QUFBQSx5QkFGRCxDQUFQO0FBR0gscUJBWEQ7QUFGUTtBQWNYO0FBQ0o7Ozs7OztBQU1FLElBQU0sa0NBQWEsSUFBSSxVQUFKLEVBQW5CIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgYXBwbHlDaGFuZ2VzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL2FwcGx5LWNoYW5nZXNcIjtcbmNsYXNzIENvZGVGb3JtYXQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkNvZGUgRm9ybWF0XCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIlN1cHBvcnQgZm9yIGNvZGUgZm9ybWF0dGluZy5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmNvZGUtZm9ybWF0XCIsICgpID0+IHRoaXMuZm9ybWF0KCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZEluc2VydFRleHQoZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0Lmxlbmd0aCA+IDEpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dCA9PT0gXCI7XCIgfHwgZXZlbnQudGV4dCA9PT0gXCJ9XCIgfHwgZXZlbnQudGV4dCA9PT0gXCJ7XCIgfHwgZXZlbnQudGV4dC5jaGFyQ29kZUF0KDApID09PSAxMCkge1xuICAgICAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5mb3JtYXRBZnRlcktleXN0cm9rZSh7IENoYXJhY3RlcjogZXZlbnQudGV4dCB9KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiBhcHBseUNoYW5nZXMoZWRpdG9yLCBkYXRhKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGZvcm1hdCgpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICBpZiAoZWRpdG9yKSB7XG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgTGluZTogMCxcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiAwLFxuICAgICAgICAgICAgICAgICAgICBFbmRMaW5lOiBidWZmZXIuZ2V0TGluZUNvdW50KCkgLSAxLFxuICAgICAgICAgICAgICAgICAgICBFbmRDb2x1bW46IDAsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc29sdXRpb25cbiAgICAgICAgICAgICAgICAgICAgLmZvcm1hdFJhbmdlKHJlcXVlc3QpXG4gICAgICAgICAgICAgICAgICAgIC5kbygoZGF0YSkgPT4gYXBwbHlDaGFuZ2VzKGVkaXRvciwgZGF0YSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgY29uc3QgY29kZUZvcm1hdCA9IG5ldyBDb2RlRm9ybWF0O1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHthcHBseUNoYW5nZXN9IGZyb20gXCIuLi9zZXJ2aWNlcy9hcHBseS1jaGFuZ2VzXCI7XHJcblxyXG5jbGFzcyBDb2RlRm9ybWF0IGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmNvZGUtZm9ybWF0XCIsICgpID0+IHRoaXMuZm9ybWF0KCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkSW5zZXJ0VGV4dChldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dC5sZW5ndGggPiAxKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQgPT09IFwiO1wiIHx8IGV2ZW50LnRleHQgPT09IFwifVwiIHx8IGV2ZW50LnRleHQgPT09IFwie1wiIHx8IGV2ZW50LnRleHQuY2hhckNvZGVBdCgwKSA9PT0gMTApIHtcclxuICAgICAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5mb3JtYXRBZnRlcktleXN0cm9rZSh7IENoYXJhY3RlcjogZXZlbnQudGV4dCB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IGFwcGx5Q2hhbmdlcyhlZGl0b3IsIGRhdGEpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmb3JtYXQoKSB7XHJcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gICAgICAgIGlmIChlZGl0b3IpIHtcclxuICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xyXG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gPE1vZGVscy5Gb3JtYXRSYW5nZVJlcXVlc3Q+e1xyXG4gICAgICAgICAgICAgICAgICAgIExpbmU6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIEVuZExpbmU6IGJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDEsXHJcbiAgICAgICAgICAgICAgICAgICAgRW5kQ29sdW1uOiAwLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc29sdXRpb25cclxuICAgICAgICAgICAgICAgICAgICAuZm9ybWF0UmFuZ2UocmVxdWVzdClcclxuICAgICAgICAgICAgICAgICAgICAuZG8oKGRhdGEpID0+IGFwcGx5Q2hhbmdlcyhlZGl0b3IsIGRhdGEpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJDb2RlIEZvcm1hdFwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJTdXBwb3J0IGZvciBjb2RlIGZvcm1hdHRpbmcuXCI7XHJcbn1cclxuZXhwb3J0IGNvbnN0IGNvZGVGb3JtYXQgPSBuZXcgQ29kZUZvcm1hdDtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
