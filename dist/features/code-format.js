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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC5qcyIsImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztJQ0dBO0FBQUEsMEJBQUE7OztBQTBDVyxhQUFBLFFBQUEsR0FBVyxLQUFYLENBMUNYO0FBMkNXLGFBQUEsS0FBQSxHQUFRLGFBQVIsQ0EzQ1g7QUE0Q1csYUFBQSxXQUFBLEdBQWMsOEJBQWQsQ0E1Q1g7S0FBQTs7OzttQ0FHbUI7OztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCLENBRFc7QUFFWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssb0JBQUwsQ0FBMEIsNEJBQTFCLEVBQXdEO3VCQUFNLE1BQUssTUFBTDthQUFOLENBQTVFLEVBRlc7QUFJWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssa0JBQUwsQ0FBd0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBQ25ELG1CQUFHLEdBQUgsQ0FBTyxPQUFPLGVBQVAsQ0FBdUIsaUJBQUs7QUFDL0Isd0JBQUksTUFBTSxJQUFOLENBQVcsTUFBWCxHQUFvQixDQUFwQixFQUF1QixPQUEzQjtBQUVBLHdCQUFJLE1BQU0sSUFBTixLQUFlLEdBQWYsSUFBc0IsTUFBTSxJQUFOLEtBQWUsR0FBZixJQUFzQixNQUFNLElBQU4sS0FBZSxHQUFmLElBQXNCLE1BQU0sSUFBTixDQUFXLFVBQVgsQ0FBc0IsQ0FBdEIsTUFBNkIsRUFBN0IsRUFBaUM7QUFDbkcsbUNBQUssT0FBTCxDQUFhLE1BQWIsRUFBcUI7bUNBQVksU0FBUyxvQkFBVCxDQUE4QixFQUFFLFdBQVcsTUFBTSxJQUFOLEVBQTNDO3lCQUFaLENBQXJCLENBQ0ssU0FETCxDQUNlO21DQUFRLGdDQUFhLE1BQWIsRUFBcUIsSUFBckI7eUJBQVIsQ0FEZixDQURtRztxQkFBdkc7aUJBSDBCLENBQTlCLEVBRG1EO2FBQVgsQ0FBNUMsRUFKVzs7OztrQ0FnQkQ7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCLEdBRFU7Ozs7aUNBSUQ7QUFDVCxnQkFBTSxTQUFTLEtBQUssU0FBTCxDQUFlLG1CQUFmLEVBQVQsQ0FERztBQUVULGdCQUFJLE1BQUosRUFBWTs7QUFDUix3QkFBTSxTQUFTLE9BQU8sU0FBUCxFQUFUO0FBQ04sK0JBQUssT0FBTCxDQUFhLE1BQWIsRUFBcUIsb0JBQVE7QUFDekIsNEJBQU0sVUFBcUM7QUFDdkMsa0NBQU0sQ0FBTjtBQUNBLG9DQUFRLENBQVI7QUFDQSxxQ0FBUyxPQUFPLFlBQVAsS0FBd0IsQ0FBeEI7QUFDVCx1Q0FBVyxDQUFYO3lCQUpFLENBRG1CO0FBUXpCLCtCQUFPLFNBQ0YsV0FERSxDQUNVLE9BRFYsRUFFRixFQUZFLENBRUMsVUFBQyxJQUFEO21DQUFVLGdDQUFhLE1BQWIsRUFBcUIsSUFBckI7eUJBQVYsQ0FGUixDQVJ5QjtxQkFBUixDQUFyQjtxQkFGUTthQUFaOzs7Ozs7O0FBcUJELElBQU0sa0NBQWEsSUFBSSxVQUFKLEVBQWIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2NvZGUtZm9ybWF0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBhcHBseUNoYW5nZXMgfSBmcm9tIFwiLi4vc2VydmljZXMvYXBwbHktY2hhbmdlc1wiO1xuY2xhc3MgQ29kZUZvcm1hdCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiQ29kZSBGb3JtYXRcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiU3VwcG9ydCBmb3IgY29kZSBmb3JtYXR0aW5nLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206Y29kZS1mb3JtYXRcIiwgKCkgPT4gdGhpcy5mb3JtYXQoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkSW5zZXJ0VGV4dChldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQubGVuZ3RoID4gMSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0ID09PSBcIjtcIiB8fCBldmVudC50ZXh0ID09PSBcIn1cIiB8fCBldmVudC50ZXh0ID09PSBcIntcIiB8fCBldmVudC50ZXh0LmNoYXJDb2RlQXQoMCkgPT09IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmZvcm1hdEFmdGVyS2V5c3Ryb2tlKHsgQ2hhcmFjdGVyOiBldmVudC50ZXh0IH0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IGFwcGx5Q2hhbmdlcyhlZGl0b3IsIGRhdGEpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgZm9ybWF0KCkge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgIGlmIChlZGl0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgICAgICAgICBMaW5lOiAwLFxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IDAsXG4gICAgICAgICAgICAgICAgICAgIEVuZExpbmU6IGJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDEsXG4gICAgICAgICAgICAgICAgICAgIEVuZENvbHVtbjogMCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzb2x1dGlvblxuICAgICAgICAgICAgICAgICAgICAuZm9ybWF0UmFuZ2UocmVxdWVzdClcbiAgICAgICAgICAgICAgICAgICAgLmRvKChkYXRhKSA9PiBhcHBseUNoYW5nZXMoZWRpdG9yLCBkYXRhKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBjb2RlRm9ybWF0ID0gbmV3IENvZGVGb3JtYXQ7XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge2FwcGx5Q2hhbmdlc30gZnJvbSBcIi4uL3NlcnZpY2VzL2FwcGx5LWNoYW5nZXNcIjtcclxuXHJcbmNsYXNzIENvZGVGb3JtYXQgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206Y29kZS1mb3JtYXRcIiwgKCkgPT4gdGhpcy5mb3JtYXQoKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRJbnNlcnRUZXh0KGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0Lmxlbmd0aCA+IDEpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dCA9PT0gXCI7XCIgfHwgZXZlbnQudGV4dCA9PT0gXCJ9XCIgfHwgZXZlbnQudGV4dCA9PT0gXCJ7XCIgfHwgZXZlbnQudGV4dC5jaGFyQ29kZUF0KDApID09PSAxMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmZvcm1hdEFmdGVyS2V5c3Ryb2tlKHsgQ2hhcmFjdGVyOiBldmVudC50ZXh0IH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGRhdGEgPT4gYXBwbHlDaGFuZ2VzKGVkaXRvciwgZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGZvcm1hdCgpIHtcclxuICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XHJcbiAgICAgICAgaWYgKGVkaXRvcikge1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XHJcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSA8TW9kZWxzLkZvcm1hdFJhbmdlUmVxdWVzdD57XHJcbiAgICAgICAgICAgICAgICAgICAgTGluZTogMCxcclxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgRW5kTGluZTogYnVmZmVyLmdldExpbmVDb3VudCgpIC0gMSxcclxuICAgICAgICAgICAgICAgICAgICBFbmRDb2x1bW46IDAsXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBzb2x1dGlvblxyXG4gICAgICAgICAgICAgICAgICAgIC5mb3JtYXRSYW5nZShyZXF1ZXN0KVxyXG4gICAgICAgICAgICAgICAgICAgIC5kbygoZGF0YSkgPT4gYXBwbHlDaGFuZ2VzKGVkaXRvciwgZGF0YSkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkNvZGUgRm9ybWF0XCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlN1cHBvcnQgZm9yIGNvZGUgZm9ybWF0dGluZy5cIjtcclxufVxyXG5leHBvcnQgY29uc3QgY29kZUZvcm1hdCA9IG5ldyBDb2RlRm9ybWF0O1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
