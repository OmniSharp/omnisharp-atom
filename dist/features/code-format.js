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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC5qcyIsImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC50cyJdLCJuYW1lcyI6WyJDb2RlRm9ybWF0IiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsImFkZCIsImFkZFRleHRFZGl0b3JDb21tYW5kIiwiZm9ybWF0Iiwic3dpdGNoQWN0aXZlRWRpdG9yIiwiZWRpdG9yIiwiY2QiLCJvbkRpZEluc2VydFRleHQiLCJldmVudCIsInRleHQiLCJsZW5ndGgiLCJjaGFyQ29kZUF0IiwicmVxdWVzdCIsInNvbHV0aW9uIiwiZm9ybWF0QWZ0ZXJLZXlzdHJva2UiLCJDaGFyYWN0ZXIiLCJzdWJzY3JpYmUiLCJkYXRhIiwiZGlzcG9zZSIsImF0b20iLCJ3b3Jrc3BhY2UiLCJnZXRBY3RpdmVUZXh0RWRpdG9yIiwiYnVmZmVyIiwiZ2V0QnVmZmVyIiwiTGluZSIsIkNvbHVtbiIsIkVuZExpbmUiLCJnZXRMaW5lQ291bnQiLCJFbmRDb2x1bW4iLCJmb3JtYXRSYW5nZSIsImRvIiwiY29kZUZvcm1hdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7SUNHQUEsVTtBQUFBLDBCQUFBO0FBQUE7O0FBMENXLGFBQUFDLFFBQUEsR0FBVyxLQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLGFBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsOEJBQWQ7QUFDVjs7OzttQ0ExQ2tCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsaUJBQUtBLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtDLG9CQUFMLENBQTBCLDRCQUExQixFQUF3RDtBQUFBLHVCQUFNLE1BQUtDLE1BQUwsRUFBTjtBQUFBLGFBQXhELENBQXBCO0FBRUEsaUJBQUtILFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLFdBQUtHLGtCQUFMLENBQXdCLFVBQUNDLE1BQUQsRUFBU0MsRUFBVCxFQUFXO0FBQ25EQSxtQkFBR0wsR0FBSCxDQUFPSSxPQUFPRSxlQUFQLENBQXVCLGlCQUFLO0FBQy9CLHdCQUFJQyxNQUFNQyxJQUFOLENBQVdDLE1BQVgsR0FBb0IsQ0FBeEIsRUFBMkI7QUFFM0Isd0JBQUlGLE1BQU1DLElBQU4sS0FBZSxHQUFmLElBQXNCRCxNQUFNQyxJQUFOLEtBQWUsR0FBckMsSUFBNENELE1BQU1DLElBQU4sS0FBZSxHQUEzRCxJQUFrRUQsTUFBTUMsSUFBTixDQUFXRSxVQUFYLENBQXNCLENBQXRCLE1BQTZCLEVBQW5HLEVBQXVHO0FBQ25HLG1DQUFLQyxPQUFMLENBQWFQLE1BQWIsRUFBcUI7QUFBQSxtQ0FBWVEsU0FBU0Msb0JBQVQsQ0FBOEIsRUFBRUMsV0FBV1AsTUFBTUMsSUFBbkIsRUFBOUIsQ0FBWjtBQUFBLHlCQUFyQixFQUNLTyxTQURMLENBQ2U7QUFBQSxtQ0FBUSxnQ0FBYVgsTUFBYixFQUFxQlksSUFBckIsQ0FBUjtBQUFBLHlCQURmO0FBRUg7QUFDSixpQkFQTSxDQUFQO0FBUUgsYUFUbUIsQ0FBcEI7QUFVSDs7O2tDQUVhO0FBQ1YsaUJBQUtqQixVQUFMLENBQWdCa0IsT0FBaEI7QUFDSDs7O2lDQUVZO0FBQ1QsZ0JBQU1iLFNBQVNjLEtBQUtDLFNBQUwsQ0FBZUMsbUJBQWYsRUFBZjtBQUNBLGdCQUFJaEIsTUFBSixFQUFZO0FBQUE7QUFDUix3QkFBTWlCLFNBQVNqQixPQUFPa0IsU0FBUCxFQUFmO0FBQ0EsK0JBQUtYLE9BQUwsQ0FBYVAsTUFBYixFQUFxQixvQkFBUTtBQUN6Qiw0QkFBTU8sVUFBcUM7QUFDdkNZLGtDQUFNLENBRGlDO0FBRXZDQyxvQ0FBUSxDQUYrQjtBQUd2Q0MscUNBQVNKLE9BQU9LLFlBQVAsS0FBd0IsQ0FITTtBQUl2Q0MsdUNBQVc7QUFKNEIseUJBQTNDO0FBT0EsK0JBQU9mLFNBQ0ZnQixXQURFLENBQ1VqQixPQURWLEVBRUZrQixFQUZFLENBRUMsVUFBQ2IsSUFBRDtBQUFBLG1DQUFVLGdDQUFhWixNQUFiLEVBQXFCWSxJQUFyQixDQUFWO0FBQUEseUJBRkQsQ0FBUDtBQUdILHFCQVhEO0FBRlE7QUFjWDtBQUNKOzs7Ozs7QUFNRSxJQUFNYyxrQ0FBYSxJQUFJbkMsVUFBSixFQUFuQiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvY29kZS1mb3JtYXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBhcHBseUNoYW5nZXMgfSBmcm9tIFwiLi4vc2VydmljZXMvYXBwbHktY2hhbmdlc1wiO1xuY2xhc3MgQ29kZUZvcm1hdCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiQ29kZSBGb3JtYXRcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiU3VwcG9ydCBmb3IgY29kZSBmb3JtYXR0aW5nLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206Y29kZS1mb3JtYXRcIiwgKCkgPT4gdGhpcy5mb3JtYXQoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkSW5zZXJ0VGV4dChldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQubGVuZ3RoID4gMSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0ID09PSBcIjtcIiB8fCBldmVudC50ZXh0ID09PSBcIn1cIiB8fCBldmVudC50ZXh0ID09PSBcIntcIiB8fCBldmVudC50ZXh0LmNoYXJDb2RlQXQoMCkgPT09IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmZvcm1hdEFmdGVyS2V5c3Ryb2tlKHsgQ2hhcmFjdGVyOiBldmVudC50ZXh0IH0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IGFwcGx5Q2hhbmdlcyhlZGl0b3IsIGRhdGEpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgZm9ybWF0KCkge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgIGlmIChlZGl0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgICAgICAgICBMaW5lOiAwLFxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IDAsXG4gICAgICAgICAgICAgICAgICAgIEVuZExpbmU6IGJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDEsXG4gICAgICAgICAgICAgICAgICAgIEVuZENvbHVtbjogMCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzb2x1dGlvblxuICAgICAgICAgICAgICAgICAgICAuZm9ybWF0UmFuZ2UocmVxdWVzdClcbiAgICAgICAgICAgICAgICAgICAgLmRvKChkYXRhKSA9PiBhcHBseUNoYW5nZXMoZWRpdG9yLCBkYXRhKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBjb2RlRm9ybWF0ID0gbmV3IENvZGVGb3JtYXQ7XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHthcHBseUNoYW5nZXN9IGZyb20gXCIuLi9zZXJ2aWNlcy9hcHBseS1jaGFuZ2VzXCI7XHJcblxyXG5jbGFzcyBDb2RlRm9ybWF0IGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmNvZGUtZm9ybWF0XCIsICgpID0+IHRoaXMuZm9ybWF0KCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xyXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkSW5zZXJ0VGV4dChldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dC5sZW5ndGggPiAxKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQgPT09IFwiO1wiIHx8IGV2ZW50LnRleHQgPT09IFwifVwiIHx8IGV2ZW50LnRleHQgPT09IFwie1wiIHx8IGV2ZW50LnRleHQuY2hhckNvZGVBdCgwKSA9PT0gMTApIHtcclxuICAgICAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5mb3JtYXRBZnRlcktleXN0cm9rZSh7IENoYXJhY3RlcjogZXZlbnQudGV4dCB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IGFwcGx5Q2hhbmdlcyhlZGl0b3IsIGRhdGEpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBmb3JtYXQoKSB7XHJcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gICAgICAgIGlmIChlZGl0b3IpIHtcclxuICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xyXG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gPE1vZGVscy5Gb3JtYXRSYW5nZVJlcXVlc3Q+e1xyXG4gICAgICAgICAgICAgICAgICAgIExpbmU6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIEVuZExpbmU6IGJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDEsXHJcbiAgICAgICAgICAgICAgICAgICAgRW5kQ29sdW1uOiAwLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc29sdXRpb25cclxuICAgICAgICAgICAgICAgICAgICAuZm9ybWF0UmFuZ2UocmVxdWVzdClcclxuICAgICAgICAgICAgICAgICAgICAuZG8oKGRhdGEpID0+IGFwcGx5Q2hhbmdlcyhlZGl0b3IsIGRhdGEpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJDb2RlIEZvcm1hdFwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJTdXBwb3J0IGZvciBjb2RlIGZvcm1hdHRpbmcuXCI7XHJcbn1cclxuZXhwb3J0IGNvbnN0IGNvZGVGb3JtYXQgPSBuZXcgQ29kZUZvcm1hdDtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
