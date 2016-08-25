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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9yZW5hbWUuanMiLCJsaWIvZmVhdHVyZXMvcmVuYW1lLnRzIl0sIm5hbWVzIjpbIlJlbmFtZSIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJyZW5hbWVWaWV3IiwiYWRkIiwiYWRkVGV4dEVkaXRvckNvbW1hbmQiLCJlIiwic3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIiwic3RvcFByb3BhZ2F0aW9uIiwicHJldmVudERlZmF1bHQiLCJyZW5hbWUiLCJsaXN0ZW5lciIsInN1YnNjcmliZSIsImRhdGEiLCJyZXNwb25zZSIsIkNoYW5nZXMiLCJkaXNwb3NlIiwiZWRpdG9yIiwiYXRvbSIsIndvcmtzcGFjZSIsImdldEFjdGl2ZVRleHRFZGl0b3IiLCJ3b3JkVG9SZW5hbWUiLCJnZXRXb3JkVW5kZXJDdXJzb3IiLCJ0cmltRW5kIiwiYWRkVG9wUGFuZWwiLCJpdGVtIiwiY29uZmlndXJlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7SUNFQUEsTTtBQUFBLHNCQUFBO0FBQUE7O0FBcUNXLGFBQUFDLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQUMsS0FBQSxHQUFRLFFBQVI7QUFDQSxhQUFBQyxXQUFBLEdBQWMsaUNBQWQ7QUFDVjs7OzttQ0FwQ2tCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsaUJBQUtDLFVBQUwsR0FBa0IsNEJBQWxCO0FBQ0EsaUJBQUtELFVBQUwsQ0FBZ0JFLEdBQWhCLENBQW9CLFdBQUtDLG9CQUFMLENBQTBCLHVCQUExQixFQUFtRCxVQUFDQyxDQUFELEVBQUU7QUFDckVBLGtCQUFFQyx3QkFBRjtBQUNBRCxrQkFBRUUsZUFBRjtBQUNBRixrQkFBRUcsY0FBRjtBQUNBLHNCQUFLQyxNQUFMO0FBQ0gsYUFMbUIsQ0FBcEI7QUFPQSxpQkFBS1IsVUFBTCxDQUFnQkUsR0FBaEIsQ0FBb0IsV0FBS08sUUFBTCxDQUFjRCxNQUFkLENBQXFCRSxTQUFyQixDQUErQixVQUFDQyxJQUFELEVBQUs7QUFDcEQsbURBQWdCQSxLQUFLQyxRQUFMLENBQWNDLE9BQTlCO0FBQ0gsYUFGbUIsQ0FBcEI7QUFHSDs7O2tDQUVhO0FBQ1YsaUJBQUtiLFVBQUwsQ0FBZ0JjLE9BQWhCO0FBQ0g7OztpQ0FFWTtBQUNULGdCQUFNQyxTQUFTQyxLQUFLQyxTQUFMLENBQWVDLG1CQUFmLEVBQWY7QUFDQSxnQkFBSUMscUJBQUo7QUFDQSxnQkFBSUosTUFBSixFQUFZO0FBQ1JJLCtCQUFvQkosT0FBT0ssa0JBQVAsRUFBcEI7QUFFQUQsK0JBQWUsaUJBQUVFLE9BQUYsQ0FBVUYsWUFBVixFQUF3QixHQUF4QixDQUFmO0FBQ0FILHFCQUFLQyxTQUFMLENBQWVLLFdBQWYsQ0FBMkI7QUFDdkJDLDBCQUFNLEtBQUt0QjtBQURZLGlCQUEzQjtBQUdIO0FBQ0QsbUJBQU8sS0FBS0EsVUFBTCxDQUFnQnVCLFNBQWhCLENBQTBCTCxZQUExQixDQUFQO0FBQ0g7Ozs7OztBQU1FLElBQU1YLDBCQUFTLElBQUlaLE1BQUosRUFBZiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvcmVuYW1lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgUmVuYW1lVmlldyB9IGZyb20gXCIuLi92aWV3cy9yZW5hbWUtdmlld1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgYXBwbHlBbGxDaGFuZ2VzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL2FwcGx5LWNoYW5nZXNcIjtcbmNsYXNzIFJlbmFtZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJSZW5hbWVcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBjb21tYW5kIHRvIHJlbmFtZSBzeW1ib2xzLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5yZW5hbWVWaWV3ID0gbmV3IFJlbmFtZVZpZXcoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206cmVuYW1lXCIsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMucmVuYW1lKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnJlbmFtZS5zdWJzY3JpYmUoKGRhdGEpID0+IHtcbiAgICAgICAgICAgIGFwcGx5QWxsQ2hhbmdlcyhkYXRhLnJlc3BvbnNlLkNoYW5nZXMpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHJlbmFtZSgpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICBsZXQgd29yZFRvUmVuYW1lO1xuICAgICAgICBpZiAoZWRpdG9yKSB7XG4gICAgICAgICAgICB3b3JkVG9SZW5hbWUgPSBlZGl0b3IuZ2V0V29yZFVuZGVyQ3Vyc29yKCk7XG4gICAgICAgICAgICB3b3JkVG9SZW5hbWUgPSBfLnRyaW1FbmQod29yZFRvUmVuYW1lLCBcIihcIik7XG4gICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5hZGRUb3BQYW5lbCh7XG4gICAgICAgICAgICAgICAgaXRlbTogdGhpcy5yZW5hbWVWaWV3XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5yZW5hbWVWaWV3LmNvbmZpZ3VyZSh3b3JkVG9SZW5hbWUpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCByZW5hbWUgPSBuZXcgUmVuYW1lO1xuIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge1JlbmFtZVZpZXd9IGZyb20gXCIuLi92aWV3cy9yZW5hbWUtdmlld1wiO1xyXG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xyXG5pbXBvcnQge2FwcGx5QWxsQ2hhbmdlc30gZnJvbSBcIi4uL3NlcnZpY2VzL2FwcGx5LWNoYW5nZXNcIjtcclxuXHJcbmNsYXNzIFJlbmFtZSBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgcmVuYW1lVmlldzogUmVuYW1lVmlldztcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLnJlbmFtZVZpZXcgPSBuZXcgUmVuYW1lVmlldygpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnJlbmFtZVwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVuYW1lKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIucmVuYW1lLnN1YnNjcmliZSgoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICBhcHBseUFsbENoYW5nZXMoZGF0YS5yZXNwb25zZS5DaGFuZ2VzKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVuYW1lKCkge1xyXG4gICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICAgICAgICBsZXQgd29yZFRvUmVuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgaWYgKGVkaXRvcikge1xyXG4gICAgICAgICAgICB3b3JkVG9SZW5hbWUgPSA8YW55PmVkaXRvci5nZXRXb3JkVW5kZXJDdXJzb3IoKTtcclxuICAgICAgICAgICAgLy8gV29yZCB1bmRlciBjdXJzb3IgY2FuIHNvbWV0aW1lcyByZXR1cm4gdGhlIG9wZW4gYnJhY2tldCBpZiB0aGUgd29yZCBpcyBzZWxlY3RlZC5cclxuICAgICAgICAgICAgd29yZFRvUmVuYW1lID0gXy50cmltRW5kKHdvcmRUb1JlbmFtZSwgXCIoXCIpO1xyXG4gICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5hZGRUb3BQYW5lbCh7XHJcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLnJlbmFtZVZpZXdcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbmFtZVZpZXcuY29uZmlndXJlKHdvcmRUb1JlbmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiUmVuYW1lXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgY29tbWFuZCB0byByZW5hbWUgc3ltYm9scy5cIjtcclxufVxyXG5leHBvcnQgY29uc3QgcmVuYW1lID0gbmV3IFJlbmFtZTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
