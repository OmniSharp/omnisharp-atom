'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OmnisharpEditorContext = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.registerContextItem = registerContextItem;
exports.isOmnisharpTextEditor = isOmnisharpTextEditor;

var _lodash = require('lodash');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _projectViewModel = require('./project-view-model');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var contextItems = new Map();
function registerContextItem(name, callback) {
    contextItems.set(name, callback);
    return _tsDisposables.Disposable.create(function () {
        return contextItems.delete(name);
    });
}

var OmnisharpEditorContext = exports.OmnisharpEditorContext = function () {
    function OmnisharpEditorContext(editor, solution) {
        var _this = this;

        _classCallCheck(this, OmnisharpEditorContext);

        this._items = new Map();
        this._disposable = new _tsDisposables.CompositeDisposable();
        this._loaded = false;
        this._changes = [];
        if (editor.omnisharp) {
            return;
        }
        this._editor = editor;
        this._editor.omnisharp = this;
        this._solution = solution;
        this._project = new _projectViewModel.EmptyProjectViewModel(null, solution.path);
        var view = atom.views.getView(editor);
        view.classList.add('omnisharp-editor');
        this._disposable.add(function () {
            _this._editor.omnisharp = null;
            view.classList.remove('omnisharp-editor');
        }, solution.model.getProjectForEditor(editor).take(1).subscribe(function (project) {
            return _this._project.update(project);
        }), this.solution.whenConnected().subscribe(function () {
            return _this._loaded = true;
        }), _tsDisposables.Disposable.create(function () {
            _this._items.forEach(function (item) {
                return item.dispose && item.dispose();
            });
        }), solution.open({ FileName: editor.getPath() }).subscribe(), solution.updatebuffer({ FileName: editor.getPath(), FromDisk: true }, { silent: true }).subscribe(), function () {
            solution.disposable.add(solution.close({ FileName: editor.getPath() }).subscribe());
        }, editor.getBuffer().onWillChange(function (change) {
            _this.pushChange(change);
        }), editor.onDidStopChanging(function () {
            if (_this.hasChanges) {
                solution.updatebuffer({ FileName: editor.getPath(), Changes: _this.popChanges() }, { silent: true });
            }
        }), editor.onDidSave(function () {
            return solution.updatebuffer({ FileName: editor.getPath(), FromDisk: true }, { silent: true });
        }));
        solution.disposable.add(this);
        OmnisharpEditorContext._createdSubject.next(editor);
    }

    _createClass(OmnisharpEditorContext, [{
        key: 'dispose',
        value: function dispose() {
            this._disposable.dispose();
        }
    }, {
        key: 'onLoad',
        value: function onLoad(callback) {
            if (!this._loaded) {
                this._disposable.add(this.solution.whenConnected().subscribe(function () {
                    return callback();
                }));
                return;
            }
            callback();
        }
    }, {
        key: 'set',
        value: function set(name, callback) {
            if (this._items.has(name)) {
                return this._items.get(name);
            }
            var result = callback(this, this._editor);
            this._items.set(name, result);
            return result;
        }
    }, {
        key: 'get',
        value: function get(name) {
            if (!this._items.has(name) && contextItems.has(name)) {
                this.set(name, contextItems.get(name));
            }
            return this._items.get(name);
        }
    }, {
        key: 'pushChange',
        value: function pushChange(change) {
            this._changes.push(change);
        }
    }, {
        key: 'popChanges',
        value: function popChanges() {
            if (!this._changes.length) {
                return null;
            }
            return (0, _lodash.map)(this._changes.splice(0, this._changes.length), function (change) {
                return {
                    NewText: change.newText,
                    StartLine: change.oldRange.start.row,
                    StartColumn: change.oldRange.start.column,
                    EndLine: change.oldRange.end.row,
                    EndColumn: change.oldRange.end.column
                };
            });
        }
    }, {
        key: 'solution',
        get: function get() {
            return this._solution;
        }
    }, {
        key: 'project',
        get: function get() {
            return this._project;
        }
    }, {
        key: 'loaded',
        get: function get() {
            return this._loaded;
        }
    }, {
        key: 'temp',
        get: function get() {
            return this._items.has('___TEMP___') && this._items.get('___TEMP___') || false;
        },
        set: function set(value) {
            if (!this._items.has('___TEMP___')) {
                this._items.set('___TEMP___', value);
            }
        }
    }, {
        key: 'metadata',
        get: function get() {
            return this._metadata;
        },
        set: function set(value) {
            this._metadata = value;
        }
    }, {
        key: 'config',
        get: function get() {
            return this._config;
        },
        set: function set(value) {
            this._config = value;
        }
    }, {
        key: 'hasChanges',
        get: function get() {
            return !!this._changes.length;
        }
    }], [{
        key: 'created',
        get: function get() {
            return OmnisharpEditorContext._createdSubject.asObservable();
        }
    }]);

    return OmnisharpEditorContext;
}();

OmnisharpEditorContext._createdSubject = new _rxjs.Subject();
function isOmnisharpTextEditor(editor) {
    return editor && !!editor.omnisharp;
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yLnRzIl0sIm5hbWVzIjpbInJlZ2lzdGVyQ29udGV4dEl0ZW0iLCJpc09tbmlzaGFycFRleHRFZGl0b3IiLCJjb250ZXh0SXRlbXMiLCJNYXAiLCJuYW1lIiwiY2FsbGJhY2siLCJzZXQiLCJjcmVhdGUiLCJkZWxldGUiLCJPbW5pc2hhcnBFZGl0b3JDb250ZXh0IiwiZWRpdG9yIiwic29sdXRpb24iLCJfaXRlbXMiLCJfZGlzcG9zYWJsZSIsIl9sb2FkZWQiLCJfY2hhbmdlcyIsIm9tbmlzaGFycCIsIl9lZGl0b3IiLCJfc29sdXRpb24iLCJfcHJvamVjdCIsInBhdGgiLCJ2aWV3IiwiYXRvbSIsInZpZXdzIiwiZ2V0VmlldyIsImNsYXNzTGlzdCIsImFkZCIsInJlbW92ZSIsIm1vZGVsIiwiZ2V0UHJvamVjdEZvckVkaXRvciIsInRha2UiLCJzdWJzY3JpYmUiLCJ1cGRhdGUiLCJwcm9qZWN0Iiwid2hlbkNvbm5lY3RlZCIsImZvckVhY2giLCJpdGVtIiwiZGlzcG9zZSIsIm9wZW4iLCJGaWxlTmFtZSIsImdldFBhdGgiLCJ1cGRhdGVidWZmZXIiLCJGcm9tRGlzayIsInNpbGVudCIsImRpc3Bvc2FibGUiLCJjbG9zZSIsImdldEJ1ZmZlciIsIm9uV2lsbENoYW5nZSIsImNoYW5nZSIsInB1c2hDaGFuZ2UiLCJvbkRpZFN0b3BDaGFuZ2luZyIsImhhc0NoYW5nZXMiLCJDaGFuZ2VzIiwicG9wQ2hhbmdlcyIsIm9uRGlkU2F2ZSIsIl9jcmVhdGVkU3ViamVjdCIsIm5leHQiLCJoYXMiLCJnZXQiLCJyZXN1bHQiLCJwdXNoIiwibGVuZ3RoIiwic3BsaWNlIiwiTmV3VGV4dCIsIm5ld1RleHQiLCJTdGFydExpbmUiLCJvbGRSYW5nZSIsInN0YXJ0Iiwicm93IiwiU3RhcnRDb2x1bW4iLCJjb2x1bW4iLCJFbmRMaW5lIiwiZW5kIiwiRW5kQ29sdW1uIiwidmFsdWUiLCJfbWV0YWRhdGEiLCJfY29uZmln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O0FBQXNCOzs7NEJBVTdCO0FBQUssbUJBQU8sS0FBS0YsTUFBTCxDQUFZNkMsR0FBWixDQUFnQixZQUFoQixLQUFpQyxLQUFLN0MsTUFBTCxDQUFZOEMsR0FBWixDQUFnQixZQUFoQixDQUFqQyxJQUFrRSxLQUF6RTtBQUFpRixTOzBCQUNyRmdCLEssRUFBYztBQUMxQixnQkFBSSxDQUFDLEtBQUs5RCxNQUFMLENBQVk2QyxHQUFaLENBQWdCLFlBQWhCLENBQUwsRUFBb0M7QUFDaEMscUJBQUs3QyxNQUFMLENBQVlOLEdBQVosQ0FBZ0IsWUFBaEIsRUFBOEJvRSxLQUE5QjtBQUNIO0FBQ0o7Ozs0QkFFa0I7QUFBSyxtQkFBTyxLQUFLQyxTQUFaO0FBQXdCLFM7MEJBQzVCRCxLLEVBQUs7QUFBSSxpQkFBS0MsU0FBTCxHQUFpQkQsS0FBakI7QUFBeUI7Ozs0QkFFckM7QUFBSyxtQkFBTyxLQUFLRSxPQUFaO0FBQXNCLFM7MEJBQzFCRixLLEVBQUs7QUFBSSxpQkFBS0UsT0FBTCxHQUFlRixLQUFmO0FBQXVCOzs7NEJBb0M3QjtBQUFLLG1CQUFPLENBQUMsQ0FBQyxLQUFLM0QsUUFBTCxDQUFjOEMsTUFBdkI7QUFBZ0M7Ozs0QkF2SGpDO0FBQUssbUJBQU9wRCx1QkFBdUI4QyxlQUF2QixDQUF1Q3NCLFlBQXZDLEVBQVA7QUFBK0Q7Ozs7OztBQUQ5RXBFLHVCQUFBOEMsZUFBQSxHQUFrQixtQkFBbEI7QUErSGIsU0FBQXRELHFCQUFBLENBQWdDUyxNQUFoQyxFQUEyQztBQUFvQyxXQUFPQSxVQUFVLENBQUMsQ0FBT0EsT0FBUU0sU0FBakM7QUFBNkMiLCJmaWxlIjoibGliL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBtYXAgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBNb2RlbHMgfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHsgU3ViamVjdCB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHsgRW1wdHlQcm9qZWN0Vmlld01vZGVsLCBQcm9qZWN0Vmlld01vZGVsIH0gZnJvbSAnLi9wcm9qZWN0LXZpZXctbW9kZWwnO1xyXG5pbXBvcnQgeyBTb2x1dGlvbiB9IGZyb20gJy4vc29sdXRpb24nO1xyXG5cclxuY29uc3QgY29udGV4dEl0ZW1zID0gbmV3IE1hcDxzdHJpbmcsIChjb250ZXh0OiBPbW5pc2hhcnBFZGl0b3JDb250ZXh0LCBlZGl0b3I6IElPbW5pc2hhcnBUZXh0RWRpdG9yKSA9PiBhbnk+KCk7XHJcbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbnRleHRJdGVtPFQ+KG5hbWU6IHN0cmluZywgY2FsbGJhY2s6IChjb250ZXh0OiBPbW5pc2hhcnBFZGl0b3JDb250ZXh0LCBlZGl0b3I6IElPbW5pc2hhcnBUZXh0RWRpdG9yKSA9PiBUKSB7XHJcbiAgICBjb250ZXh0SXRlbXMuc2V0KG5hbWUsIGNhbGxiYWNrKTtcclxuICAgIHJldHVybiBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiBjb250ZXh0SXRlbXMuZGVsZXRlKG5hbWUpKTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQXRvbVRleHRDaGFuZ2Uge1xyXG4gICAgb2xkUmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2U7XHJcbiAgICBuZXdSYW5nZTogVGV4dEJ1ZmZlci5SYW5nZTtcclxuICAgIG9sZFRleHQ6IHN0cmluZztcclxuICAgIG5ld1RleHQ6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE9tbmlzaGFycEVkaXRvckNvbnRleHQgaW1wbGVtZW50cyBJRGlzcG9zYWJsZSB7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBfY3JlYXRlZFN1YmplY3QgPSBuZXcgU3ViamVjdDxJT21uaXNoYXJwVGV4dEVkaXRvcj4oKTtcclxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0IGNyZWF0ZWQoKSB7IHJldHVybiBPbW5pc2hhcnBFZGl0b3JDb250ZXh0Ll9jcmVhdGVkU3ViamVjdC5hc09ic2VydmFibGUoKTsgfVxyXG5cclxuICAgIHByaXZhdGUgX2VkaXRvcjogSU9tbmlzaGFycFRleHRFZGl0b3I7XHJcbiAgICBwcml2YXRlIF9zb2x1dGlvbjogU29sdXRpb247XHJcbiAgICBwcml2YXRlIF9tZXRhZGF0YTogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX2NvbmZpZzogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX3Byb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55PjtcclxuICAgIHByaXZhdGUgX2l0ZW1zID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgcHJpdmF0ZSBfbG9hZGVkID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIF9jaGFuZ2VzOiBJQXRvbVRleHRDaGFuZ2VbXSA9IFtdO1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgc29sdXRpb246IFNvbHV0aW9uKSB7XHJcbiAgICAgICAgaWYgKCg8YW55PmVkaXRvcikub21uaXNoYXJwKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHRoaXMuX2VkaXRvciA9IDxhbnk+ZWRpdG9yO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvci5vbW5pc2hhcnAgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uID0gc29sdXRpb247XHJcbiAgICAgICAgdGhpcy5fcHJvamVjdCA9IG5ldyBFbXB0eVByb2plY3RWaWV3TW9kZWwobnVsbCwgc29sdXRpb24ucGF0aCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXc6IEhUTUxFbGVtZW50ID0gPGFueT5hdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcclxuICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoJ29tbmlzaGFycC1lZGl0b3InKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2VkaXRvci5vbW5pc2hhcnAgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QucmVtb3ZlKCdvbW5pc2hhcnAtZWRpdG9yJyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNvbHV0aW9uLm1vZGVsXHJcbiAgICAgICAgICAgICAgICAuZ2V0UHJvamVjdEZvckVkaXRvcihlZGl0b3IpXHJcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3Byb2plY3QudXBkYXRlKHByb2plY3QpKSxcclxuICAgICAgICAgICAgdGhpcy5zb2x1dGlvbi53aGVuQ29ubmVjdGVkKCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2xvYWRlZCA9IHRydWUpLFxyXG4gICAgICAgICAgICBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9pdGVtcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5kaXNwb3NlICYmIGl0ZW0uZGlzcG9zZSgpKTtcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIHNvbHV0aW9uLm9wZW4oeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSB9KS5zdWJzY3JpYmUoKSxcclxuICAgICAgICAgICAgc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCksIEZyb21EaXNrOiB0cnVlIH0sIHsgc2lsZW50OiB0cnVlIH0pLnN1YnNjcmliZSgpLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChzb2x1dGlvbi5jbG9zZSh7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpIH0pLnN1YnNjcmliZSgpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLm9uV2lsbENoYW5nZSgoY2hhbmdlOiB7IG9sZFJhbmdlOiBUZXh0QnVmZmVyLlJhbmdlOyBuZXdSYW5nZTogVGV4dEJ1ZmZlci5SYW5nZTsgb2xkVGV4dDogc3RyaW5nOyBuZXdUZXh0OiBzdHJpbmc7IH0pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaENoYW5nZShjaGFuZ2UpO1xyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc0NoYW5nZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBzb2x1dGlvbi51cGRhdGVidWZmZXIoeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSwgQ2hhbmdlczogdGhpcy5wb3BDaGFuZ2VzKCkgfSwgeyBzaWxlbnQ6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBlZGl0b3Iub25EaWRTYXZlKCgpID0+IHNvbHV0aW9uLnVwZGF0ZWJ1ZmZlcih7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpLCBGcm9tRGlzazogdHJ1ZSB9LCB7IHNpbGVudDogdHJ1ZSB9KSlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZCh0aGlzKTtcclxuXHJcbiAgICAgICAgT21uaXNoYXJwRWRpdG9yQ29udGV4dC5fY3JlYXRlZFN1YmplY3QubmV4dCg8YW55PmVkaXRvcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzb2x1dGlvbigpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uOyB9XHJcbiAgICBwdWJsaWMgZ2V0IHByb2plY3QoKSB7IHJldHVybiB0aGlzLl9wcm9qZWN0OyB9XHJcbiAgICBwdWJsaWMgZ2V0IGxvYWRlZCgpIHsgcmV0dXJuIHRoaXMuX2xvYWRlZDsgfVxyXG4gICAgcHVibGljIG9uTG9hZDxUIGV4dGVuZHMgRnVuY3Rpb24+KGNhbGxiYWNrOiBUKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9sb2FkZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5zb2x1dGlvbi53aGVuQ29ubmVjdGVkKClcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gY2FsbGJhY2soKSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCB0ZW1wKCkgeyByZXR1cm4gdGhpcy5faXRlbXMuaGFzKCdfX19URU1QX19fJykgJiYgdGhpcy5faXRlbXMuZ2V0KCdfX19URU1QX19fJykgfHwgZmFsc2U7IH1cclxuICAgIHB1YmxpYyBzZXQgdGVtcCh2YWx1ZTogYm9vbGVhbikge1xyXG4gICAgICAgIGlmICghdGhpcy5faXRlbXMuaGFzKCdfX19URU1QX19fJykpIHtcclxuICAgICAgICAgICAgdGhpcy5faXRlbXMuc2V0KCdfX19URU1QX19fJywgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IG1ldGFkYXRhKCkgeyByZXR1cm4gdGhpcy5fbWV0YWRhdGE7IH1cclxuICAgIHB1YmxpYyBzZXQgbWV0YWRhdGEodmFsdWUpIHsgdGhpcy5fbWV0YWRhdGEgPSB2YWx1ZTsgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgY29uZmlnKCkgeyByZXR1cm4gdGhpcy5fY29uZmlnOyB9XHJcbiAgICBwdWJsaWMgc2V0IGNvbmZpZyh2YWx1ZSkgeyB0aGlzLl9jb25maWcgPSB2YWx1ZTsgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQ8VD4obmFtZTogc3RyaW5nLCBjYWxsYmFjazogKGNvbnRleHQ6IE9tbmlzaGFycEVkaXRvckNvbnRleHQsIGVkaXRvcjogSU9tbmlzaGFycFRleHRFZGl0b3IpID0+IFQpIHtcclxuICAgICAgICBpZiAodGhpcy5faXRlbXMuaGFzKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pdGVtcy5nZXQobmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjayh0aGlzLCB0aGlzLl9lZGl0b3IpO1xyXG4gICAgICAgIHRoaXMuX2l0ZW1zLnNldChuYW1lLCByZXN1bHQpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldDxUPihuYW1lOiBzdHJpbmcpOiBUIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2l0ZW1zLmhhcyhuYW1lKSAmJiBjb250ZXh0SXRlbXMuaGFzKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsIGNvbnRleHRJdGVtcy5nZXQobmFtZSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gPGFueT50aGlzLl9pdGVtcy5nZXQobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHB1c2hDaGFuZ2UoY2hhbmdlOiBJQXRvbVRleHRDaGFuZ2UpIHtcclxuICAgICAgICB0aGlzLl9jaGFuZ2VzLnB1c2goY2hhbmdlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcG9wQ2hhbmdlcygpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2NoYW5nZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbWFwKHRoaXMuX2NoYW5nZXMuc3BsaWNlKDAsIHRoaXMuX2NoYW5nZXMubGVuZ3RoKSwgY2hhbmdlID0+IDxNb2RlbHMuTGluZVBvc2l0aW9uU3BhblRleHRDaGFuZ2U+e1xyXG4gICAgICAgICAgICBOZXdUZXh0OiBjaGFuZ2UubmV3VGV4dCxcclxuICAgICAgICAgICAgU3RhcnRMaW5lOiBjaGFuZ2Uub2xkUmFuZ2Uuc3RhcnQucm93LFxyXG4gICAgICAgICAgICBTdGFydENvbHVtbjogY2hhbmdlLm9sZFJhbmdlLnN0YXJ0LmNvbHVtbixcclxuICAgICAgICAgICAgRW5kTGluZTogY2hhbmdlLm9sZFJhbmdlLmVuZC5yb3csXHJcbiAgICAgICAgICAgIEVuZENvbHVtbjogY2hhbmdlLm9sZFJhbmdlLmVuZC5jb2x1bW5cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGhhc0NoYW5nZXMoKSB7IHJldHVybiAhIXRoaXMuX2NoYW5nZXMubGVuZ3RoOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU9tbmlzaGFycFRleHRFZGl0b3IgZXh0ZW5kcyBBdG9tLlRleHRFZGl0b3Ige1xyXG4gICAgb21uaXNoYXJwOiBPbW5pc2hhcnBFZGl0b3JDb250ZXh0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcjogYW55KTogZWRpdG9yIGlzIElPbW5pc2hhcnBUZXh0RWRpdG9yIHsgcmV0dXJuIGVkaXRvciAmJiAhISg8YW55PmVkaXRvcikub21uaXNoYXJwOyB9XHJcbiJdfQ==
