'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.rename = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

var _applyChanges = require('../services/apply-changes');

var _renameView = require('../views/rename-view');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Rename = function () {
    function Rename() {
        _classCallCheck(this, Rename);

        this.required = true;
        this.title = 'Rename';
        this.description = 'Adds command to rename symbols.';
    }

    _createClass(Rename, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.renameView = new _renameView.RenameView();
            this.disposable.add(_omni.Omni.addTextEditorCommand('omnisharp-atom:rename', function (e) {
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
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: 'rename',
        value: function rename() {
            var editor = atom.workspace.getActiveTextEditor();
            var wordToRename = void 0;
            if (editor) {
                wordToRename = editor.getWordUnderCursor();
                wordToRename = (0, _lodash.trimEnd)(wordToRename, '(');
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9yZW5hbWUudHMiXSwibmFtZXMiOlsiUmVuYW1lIiwicmVxdWlyZWQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwiZGlzcG9zYWJsZSIsInJlbmFtZVZpZXciLCJhZGQiLCJhZGRUZXh0RWRpdG9yQ29tbWFuZCIsImUiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJzdG9wUHJvcGFnYXRpb24iLCJwcmV2ZW50RGVmYXVsdCIsInJlbmFtZSIsImxpc3RlbmVyIiwic3Vic2NyaWJlIiwiZGF0YSIsInJlc3BvbnNlIiwiQ2hhbmdlcyIsImRpc3Bvc2UiLCJlZGl0b3IiLCJhdG9tIiwid29ya3NwYWNlIiwiZ2V0QWN0aXZlVGV4dEVkaXRvciIsIndvcmRUb1JlbmFtZSIsImdldFdvcmRVbmRlckN1cnNvciIsImFkZFRvcFBhbmVsIiwiaXRlbSIsImNvbmZpZ3VyZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7SUFFQUEsTTtBQUFBLHNCQUFBO0FBQUE7O0FBQ1csYUFBQUMsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBQyxLQUFBLEdBQVEsUUFBUjtBQUNBLGFBQUFDLFdBQUEsR0FBYyxpQ0FBZDtBQXFDVjs7OzttQ0FoQ2tCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsaUJBQUtDLFVBQUwsR0FBa0IsNEJBQWxCO0FBQ0EsaUJBQUtELFVBQUwsQ0FBZ0JFLEdBQWhCLENBQW9CLFdBQUtDLG9CQUFMLENBQTBCLHVCQUExQixFQUFtRCxhQUFDO0FBQ3BFQyxrQkFBRUMsd0JBQUY7QUFDQUQsa0JBQUVFLGVBQUY7QUFDQUYsa0JBQUVHLGNBQUY7QUFDQSxzQkFBS0MsTUFBTDtBQUNILGFBTG1CLENBQXBCO0FBT0EsaUJBQUtSLFVBQUwsQ0FBZ0JFLEdBQWhCLENBQW9CLFdBQUtPLFFBQUwsQ0FBY0QsTUFBZCxDQUFxQkUsU0FBckIsQ0FBK0IsZ0JBQUk7QUFDbkQsbURBQWdCQyxLQUFLQyxRQUFMLENBQWNDLE9BQTlCO0FBQ0gsYUFGbUIsQ0FBcEI7QUFHSDs7O2tDQUVhO0FBQ1YsaUJBQUtiLFVBQUwsQ0FBZ0JjLE9BQWhCO0FBQ0g7OztpQ0FFWTtBQUNULGdCQUFNQyxTQUFTQyxLQUFLQyxTQUFMLENBQWVDLG1CQUFmLEVBQWY7QUFDQSxnQkFBSUMscUJBQUo7QUFDQSxnQkFBSUosTUFBSixFQUFZO0FBQ1JJLCtCQUFvQkosT0FBT0ssa0JBQVAsRUFBcEI7QUFFQUQsK0JBQWUscUJBQVFBLFlBQVIsRUFBc0IsR0FBdEIsQ0FBZjtBQUNBSCxxQkFBS0MsU0FBTCxDQUFlSSxXQUFmLENBQTJCO0FBQ3ZCQywwQkFBTSxLQUFLckI7QUFEWSxpQkFBM0I7QUFHSDtBQUNELG1CQUFPLEtBQUtBLFVBQUwsQ0FBZ0JzQixTQUFoQixDQUEwQkosWUFBMUIsQ0FBUDtBQUNIOzs7Ozs7QUFFRSxJQUFNWCwwQkFBUyxJQUFJWixNQUFKLEVBQWYiLCJmaWxlIjoibGliL2ZlYXR1cmVzL3JlbmFtZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHRyaW1FbmQgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5pbXBvcnQgeyBPbW5pIH0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5pbXBvcnQgeyBhcHBseUFsbENoYW5nZXMgfSBmcm9tICcuLi9zZXJ2aWNlcy9hcHBseS1jaGFuZ2VzJztcclxuaW1wb3J0IHsgUmVuYW1lVmlldyB9IGZyb20gJy4uL3ZpZXdzL3JlbmFtZS12aWV3JztcclxuXHJcbmNsYXNzIFJlbmFtZSBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSAnUmVuYW1lJztcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9ICdBZGRzIGNvbW1hbmQgdG8gcmVuYW1lIHN5bWJvbHMuJztcclxuXHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIHJlbmFtZVZpZXc6IFJlbmFtZVZpZXc7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5yZW5hbWVWaWV3ID0gbmV3IFJlbmFtZVZpZXcoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoJ29tbmlzaGFycC1hdG9tOnJlbmFtZScsIGUgPT4ge1xyXG4gICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVuYW1lKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIucmVuYW1lLnN1YnNjcmliZShkYXRhID0+IHtcclxuICAgICAgICAgICAgYXBwbHlBbGxDaGFuZ2VzKGRhdGEucmVzcG9uc2UuQ2hhbmdlcyk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlbmFtZSgpIHtcclxuICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XHJcbiAgICAgICAgbGV0IHdvcmRUb1JlbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIGlmIChlZGl0b3IpIHtcclxuICAgICAgICAgICAgd29yZFRvUmVuYW1lID0gPGFueT5lZGl0b3IuZ2V0V29yZFVuZGVyQ3Vyc29yKCk7XHJcbiAgICAgICAgICAgIC8vIFdvcmQgdW5kZXIgY3Vyc29yIGNhbiBzb21ldGltZXMgcmV0dXJuIHRoZSBvcGVuIGJyYWNrZXQgaWYgdGhlIHdvcmQgaXMgc2VsZWN0ZWQuXHJcbiAgICAgICAgICAgIHdvcmRUb1JlbmFtZSA9IHRyaW1FbmQod29yZFRvUmVuYW1lLCAnKCcpO1xyXG4gICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5hZGRUb3BQYW5lbCh7XHJcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLnJlbmFtZVZpZXdcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbmFtZVZpZXcuY29uZmlndXJlKHdvcmRUb1JlbmFtZSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0IGNvbnN0IHJlbmFtZSA9IG5ldyBSZW5hbWUoKTtcclxuIl19
