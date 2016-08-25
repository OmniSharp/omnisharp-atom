"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.rename = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _tsDisposables = require("ts-disposables");

var _renameView = require("../views/rename-view");

var _omni = require("../server/omni");

var _applyChanges = require("../services/apply-changes");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Rename = function () {
    function Rename() {
        _classCallCheck(this, Rename);

        this.required = true;
        this.title = "Rename";
        this.description = "Adds command to rename symbols.";
    }

    _createClass(Rename, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.renameView = new _renameView.RenameView();
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:rename", function (e) {
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
                _this.rename();
            }));
            this.disposable.add(_omni.Omni.listener.rename.subscribe(function (data) {
                (0, _applyChanges.applyAllChanges)(data.response.Changes);
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "rename",
        value: function rename() {
            var editor = atom.workspace.getActiveTextEditor();
            var wordToRename = void 0;
            if (editor) {
                wordToRename = editor.getWordUnderCursor();
                wordToRename = _lodash2.default.trimEnd(wordToRename, "(");
                atom.workspace.addTopPanel({
                    item: this.renameView
                });
            }
            return this.renameView.configure(wordToRename);
        }
    }]);

    return Rename;
}();

var rename = exports.rename = new Rename();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9yZW5hbWUuanMiLCJsaWIvZmVhdHVyZXMvcmVuYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztJQ0VBO0FBQUEsc0JBQUE7OztBQXFDVyxhQUFBLFFBQUEsR0FBVyxJQUFYLENBckNYO0FBc0NXLGFBQUEsS0FBQSxHQUFRLFFBQVIsQ0F0Q1g7QUF1Q1csYUFBQSxXQUFBLEdBQWMsaUNBQWQsQ0F2Q1g7S0FBQTs7OzttQ0FJbUI7OztBQUNYLGlCQUFLLFVBQUwsR0FBa0Isd0NBQWxCLENBRFc7QUFFWCxpQkFBSyxVQUFMLEdBQWtCLDRCQUFsQixDQUZXO0FBR1gsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLHVCQUExQixFQUFtRCxVQUFDLENBQUQsRUFBRTtBQUNyRSxrQkFBRSx3QkFBRixHQURxRTtBQUVyRSxrQkFBRSxlQUFGLEdBRnFFO0FBR3JFLGtCQUFFLGNBQUYsR0FIcUU7QUFJckUsc0JBQUssTUFBTCxHQUpxRTthQUFGLENBQXZFLEVBSFc7QUFVWCxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLE1BQWQsQ0FBcUIsU0FBckIsQ0FBK0IsVUFBQyxJQUFELEVBQUs7QUFDcEQsbURBQWdCLEtBQUssUUFBTCxDQUFjLE9BQWQsQ0FBaEIsQ0FEb0Q7YUFBTCxDQUFuRCxFQVZXOzs7O2tDQWVEO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7O2lDQUlEO0FBQ1QsZ0JBQU0sU0FBUyxLQUFLLFNBQUwsQ0FBZSxtQkFBZixFQUFULENBREc7QUFFVCxnQkFBSSxxQkFBSixDQUZTO0FBR1QsZ0JBQUksTUFBSixFQUFZO0FBQ1IsK0JBQW9CLE9BQU8sa0JBQVAsRUFBcEIsQ0FEUTtBQUdSLCtCQUFlLGlCQUFFLE9BQUYsQ0FBVSxZQUFWLEVBQXdCLEdBQXhCLENBQWYsQ0FIUTtBQUlSLHFCQUFLLFNBQUwsQ0FBZSxXQUFmLENBQTJCO0FBQ3ZCLDBCQUFNLEtBQUssVUFBTDtpQkFEVixFQUpRO2FBQVo7QUFRQSxtQkFBTyxLQUFLLFVBQUwsQ0FBZ0IsU0FBaEIsQ0FBMEIsWUFBMUIsQ0FBUCxDQVhTOzs7Ozs7O0FBa0JWLElBQU0sMEJBQVMsSUFBSSxNQUFKLEVBQVQiLCJmaWxlIjoibGliL2ZlYXR1cmVzL3JlbmFtZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IFJlbmFtZVZpZXcgfSBmcm9tIFwiLi4vdmlld3MvcmVuYW1lLXZpZXdcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IGFwcGx5QWxsQ2hhbmdlcyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9hcHBseS1jaGFuZ2VzXCI7XG5jbGFzcyBSZW5hbWUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiUmVuYW1lXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgY29tbWFuZCB0byByZW5hbWUgc3ltYm9scy5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMucmVuYW1lVmlldyA9IG5ldyBSZW5hbWVWaWV3KCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnJlbmFtZVwiLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnJlbmFtZSgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5yZW5hbWUuc3Vic2NyaWJlKChkYXRhKSA9PiB7XG4gICAgICAgICAgICBhcHBseUFsbENoYW5nZXMoZGF0YS5yZXNwb25zZS5DaGFuZ2VzKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICByZW5hbWUoKSB7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICAgICAgbGV0IHdvcmRUb1JlbmFtZTtcbiAgICAgICAgaWYgKGVkaXRvcikge1xuICAgICAgICAgICAgd29yZFRvUmVuYW1lID0gZWRpdG9yLmdldFdvcmRVbmRlckN1cnNvcigpO1xuICAgICAgICAgICAgd29yZFRvUmVuYW1lID0gXy50cmltRW5kKHdvcmRUb1JlbmFtZSwgXCIoXCIpO1xuICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2UuYWRkVG9wUGFuZWwoe1xuICAgICAgICAgICAgICAgIGl0ZW06IHRoaXMucmVuYW1lVmlld1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucmVuYW1lVmlldy5jb25maWd1cmUod29yZFRvUmVuYW1lKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgcmVuYW1lID0gbmV3IFJlbmFtZTtcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtSZW5hbWVWaWV3fSBmcm9tIFwiLi4vdmlld3MvcmVuYW1lLXZpZXdcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHthcHBseUFsbENoYW5nZXN9IGZyb20gXCIuLi9zZXJ2aWNlcy9hcHBseS1jaGFuZ2VzXCI7XHJcblxyXG5jbGFzcyBSZW5hbWUgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHJlbmFtZVZpZXc6IFJlbmFtZVZpZXc7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5yZW5hbWVWaWV3ID0gbmV3IFJlbmFtZVZpZXcoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpyZW5hbWVcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmFtZSgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnJlbmFtZS5zdWJzY3JpYmUoKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgYXBwbHlBbGxDaGFuZ2VzKGRhdGEucmVzcG9uc2UuQ2hhbmdlcyk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlbmFtZSgpIHtcclxuICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XHJcbiAgICAgICAgbGV0IHdvcmRUb1JlbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIGlmIChlZGl0b3IpIHtcclxuICAgICAgICAgICAgd29yZFRvUmVuYW1lID0gPGFueT5lZGl0b3IuZ2V0V29yZFVuZGVyQ3Vyc29yKCk7XHJcbiAgICAgICAgICAgIC8vIFdvcmQgdW5kZXIgY3Vyc29yIGNhbiBzb21ldGltZXMgcmV0dXJuIHRoZSBvcGVuIGJyYWNrZXQgaWYgdGhlIHdvcmQgaXMgc2VsZWN0ZWQuXHJcbiAgICAgICAgICAgIHdvcmRUb1JlbmFtZSA9IF8udHJpbUVuZCh3b3JkVG9SZW5hbWUsIFwiKFwiKTtcclxuICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2UuYWRkVG9wUGFuZWwoe1xyXG4gICAgICAgICAgICAgICAgaXRlbTogdGhpcy5yZW5hbWVWaWV3XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5yZW5hbWVWaWV3LmNvbmZpZ3VyZSh3b3JkVG9SZW5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlJlbmFtZVwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIGNvbW1hbmQgdG8gcmVuYW1lIHN5bWJvbHMuXCI7XHJcbn1cclxuZXhwb3J0IGNvbnN0IHJlbmFtZSA9IG5ldyBSZW5hbWU7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
