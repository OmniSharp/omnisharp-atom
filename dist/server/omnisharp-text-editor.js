"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OmnisharpEditorContext = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.registerContextItem = registerContextItem;
exports.isOmnisharpTextEditor = isOmnisharpTextEditor;

var _omnisharpClient = require("omnisharp-client");

var _projectViewModel = require("./project-view-model");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var contextItems = new Map();
function registerContextItem(name, callback) {
    contextItems.set(name, callback);
    return _omnisharpClient.Disposable.create(function () {
        return contextItems.delete(name);
    });
}

var OmnisharpEditorContext = exports.OmnisharpEditorContext = function () {
    function OmnisharpEditorContext(editor, solution) {
        var _this = this;

        _classCallCheck(this, OmnisharpEditorContext);

        this._items = new Map();
        this._disposable = new _omnisharpClient.CompositeDisposable();
        this._loaded = false;
        this._changes = [];
        if (editor.omnisharp) return;
        this._editor = editor;
        this._editor.omnisharp = this;
        this._solution = solution;
        this._project = new _projectViewModel.EmptyProjectViewModel(null, solution.path);
        var view = atom.views.getView(editor);
        view.classList.add("omnisharp-editor");
        this._disposable.add(function () {
            _this._editor.omnisharp = null;
            view.classList.remove("omnisharp-editor");
        }, solution.model.getProjectForEditor(editor).take(1).subscribe(function (project) {
            return _this._project.update(project);
        }), this.solution.whenConnected().subscribe(function () {
            return _this._loaded = true;
        }), _omnisharpClient.Disposable.create(function () {
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
        key: "dispose",
        value: function dispose() {
            this._disposable.dispose();
        }
    }, {
        key: "onLoad",
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
        key: "set",
        value: function set(name, callback) {
            if (this._items.has(name)) return this._items.get(name);
            var result = callback(this, this._editor);
            this._items.set(name, result);
            return result;
        }
    }, {
        key: "get",
        value: function get(name) {
            if (!this._items.has(name) && contextItems.has(name)) {
                this.set(name, contextItems.get(name));
            }
            return this._items.get(name);
        }
    }, {
        key: "pushChange",
        value: function pushChange(change) {
            this._changes.push(change);
        }
    }, {
        key: "popChanges",
        value: function popChanges() {
            if (!this._changes.length) {
                return null;
            }
            return _lodash2.default.map(this._changes.splice(0, this._changes.length), function (change) {
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
        key: "solution",
        get: function get() {
            return this._solution;
        }
    }, {
        key: "project",
        get: function get() {
            return this._project;
        }
    }, {
        key: "loaded",
        get: function get() {
            return this._loaded;
        }
    }, {
        key: "temp",
        get: function get() {
            return this._items.has("___TEMP___") && this._items.get("___TEMP___") || false;
        },
        set: function set(value) {
            if (!this._items.has("___TEMP___")) {
                this._items.set("___TEMP___", value);
            }
        }
    }, {
        key: "metadata",
        get: function get() {
            return this._metadata;
        },
        set: function set(value) {
            this._metadata = value;
        }
    }, {
        key: "config",
        get: function get() {
            return this._config;
        },
        set: function set(value) {
            this._config = value;
        }
    }, {
        key: "hasChanges",
        get: function get() {
            return !!this._changes.length;
        }
    }], [{
        key: "created",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yLnRzIiwibGliL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O1FBUUEsbUIsR0FBQSxtQjtRQXNJQSxxQixHQUFBLHFCOztBQzlJQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7QURJQSxJQUFNLGVBQWUsSUFBSSxHQUFKLEVBQXJCO0FBQ0EsU0FBQSxtQkFBQSxDQUF1QyxJQUF2QyxFQUFxRCxRQUFyRCxFQUFrSTtBQUM5SCxpQkFBYSxHQUFiLENBQWlCLElBQWpCLEVBQXVCLFFBQXZCO0FBQ0EsV0FBTyw0QkFBVyxNQUFYLENBQWtCO0FBQUEsZUFBTSxhQUFhLE1BQWIsQ0FBb0IsSUFBcEIsQ0FBTjtBQUFBLEtBQWxCLENBQVA7QUFDSDs7SUFJRCxzQixXQUFBLHNCO0FBY0ksb0NBQVksTUFBWixFQUFxQyxRQUFyQyxFQUF1RDtBQUFBOztBQUFBOztBQUwvQyxhQUFBLE1BQUEsR0FBUyxJQUFJLEdBQUosRUFBVDtBQUNBLGFBQUEsV0FBQSxHQUFjLDBDQUFkO0FBQ0EsYUFBQSxPQUFBLEdBQVUsS0FBVjtBQUNBLGFBQUEsUUFBQSxHQUE2QixFQUE3QjtBQUdKLFlBQVUsT0FBUSxTQUFsQixFQUE2QjtBQUM3QixhQUFLLE9BQUwsR0FBb0IsTUFBcEI7QUFDQSxhQUFLLE9BQUwsQ0FBYSxTQUFiLEdBQXlCLElBQXpCO0FBQ0EsYUFBSyxTQUFMLEdBQWlCLFFBQWpCO0FBQ0EsYUFBSyxRQUFMLEdBQWdCLDRDQUEwQixJQUExQixFQUFnQyxTQUFTLElBQXpDLENBQWhCO0FBRUEsWUFBTSxPQUF5QixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQS9CO0FBQ0EsYUFBSyxTQUFMLENBQWUsR0FBZixDQUFtQixrQkFBbkI7QUFFQSxhQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FDSSxZQUFBO0FBQ0ksa0JBQUssT0FBTCxD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b0M7QUFDaEMscUJBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsWUFBaEIsRUFBOEIsS0FBOUI7QUFDSDtBQUNKOzs7NEJBRWtCO0FBQUssbUJBQU8sS0FBSyxTQUFaO0FBQXdCLFM7MEJBQzVCLEssRUFBSztBQUFJLGlCQUFLLFNBQUwsR0FBaUIsS0FBakI7QUFBeUI7Ozs0QkFFckM7QUFBSyxtQkFBTyxLQUFLLE9BQVo7QUFBc0IsUzswQkFDMUIsSyxFQUFLO0FBQUksaUJBQUssT0FBTCxHQUFlLEtBQWY7QUFBdUI7Ozs0QkFtQzdCO0FBQUssbUJBQU8sQ0FBQyxDQUFDLEtBQUssUUFBTCxDQUFjLE1BQXZCO0FBQWdDOzs7NEJBdEhqQztBQUFLLG1CQUFPLHVCQUF1QixlQUF2QixDQUF1QyxZQUF2QyxFQUFQO0FBQStEOzs7Ozs7QUFEOUUsdUJBQUEsZUFBQSxHQUFrQixtQkFBbEI7QUE4SG5CLFNBQUEscUJBQUEsQ0FBc0MsTUFBdEMsRUFBaUQ7QUFBbUMsV0FBTyxVQUFVLENBQUMsQ0FBTyxPQUFRLFNBQWpDO0FBQTZDIiwiZmlsZSI6ImxpYi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7U29sdXRpb259IGZyb20gXCIuL3NvbHV0aW9uXCI7XHJcbmltcG9ydCB7UHJvamVjdFZpZXdNb2RlbCwgRW1wdHlQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi9wcm9qZWN0LXZpZXctbW9kZWxcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge1N1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcblxyXG5jb25zdCBjb250ZXh0SXRlbXMgPSBuZXcgTWFwPHN0cmluZywgKGNvbnRleHQ6IE9tbmlzaGFycEVkaXRvckNvbnRleHQsIGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvcikgPT4gYW55PigpO1xyXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb250ZXh0SXRlbTxUPihuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAoY29udGV4dDogT21uaXNoYXJwRWRpdG9yQ29udGV4dCwgZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yKSA9PiBUKSB7XHJcbiAgICBjb250ZXh0SXRlbXMuc2V0KG5hbWUsIGNhbGxiYWNrKTtcclxuICAgIHJldHVybiBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiBjb250ZXh0SXRlbXMuZGVsZXRlKG5hbWUpKTtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgQXRvbVRleHRDaGFuZ2UgPSB7IG9sZFJhbmdlOiBUZXh0QnVmZmVyLlJhbmdlOyBuZXdSYW5nZTogVGV4dEJ1ZmZlci5SYW5nZTsgb2xkVGV4dDogc3RyaW5nOyBuZXdUZXh0OiBzdHJpbmc7IH07XHJcblxyXG5leHBvcnQgY2xhc3MgT21uaXNoYXJwRWRpdG9yQ29udGV4dCBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgc3RhdGljIF9jcmVhdGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0PE9tbmlzaGFycFRleHRFZGl0b3I+KCk7XHJcbiAgICBwdWJsaWMgc3RhdGljIGdldCBjcmVhdGVkKCkgeyByZXR1cm4gT21uaXNoYXJwRWRpdG9yQ29udGV4dC5fY3JlYXRlZFN1YmplY3QuYXNPYnNlcnZhYmxlKCk7IH1cclxuXHJcbiAgICBwcml2YXRlIF9lZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3I7XHJcbiAgICBwcml2YXRlIF9zb2x1dGlvbjogU29sdXRpb247XHJcbiAgICBwcml2YXRlIF9tZXRhZGF0YTogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX2NvbmZpZzogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX3Byb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55PjtcclxuICAgIHByaXZhdGUgX2l0ZW1zID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgcHJpdmF0ZSBfbG9hZGVkID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIF9jaGFuZ2VzOiBBdG9tVGV4dENoYW5nZVtdID0gW107XHJcblxyXG4gICAgY29uc3RydWN0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIHNvbHV0aW9uOiBTb2x1dGlvbikge1xyXG4gICAgICAgIGlmICgoPGFueT5lZGl0b3IpLm9tbmlzaGFycCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvciA9IDxhbnk+ZWRpdG9yO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvci5vbW5pc2hhcnAgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uID0gc29sdXRpb247XHJcbiAgICAgICAgdGhpcy5fcHJvamVjdCA9IG5ldyBFbXB0eVByb2plY3RWaWV3TW9kZWwobnVsbCwgc29sdXRpb24ucGF0aCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXc6IEhUTUxFbGVtZW50ID0gPGFueT5hdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcclxuICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtZWRpdG9yXCIpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZWRpdG9yLm9tbmlzaGFycCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJvbW5pc2hhcnAtZWRpdG9yXCIpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzb2x1dGlvbi5tb2RlbFxyXG4gICAgICAgICAgICAgICAgLmdldFByb2plY3RGb3JFZGl0b3IoZWRpdG9yKVxyXG4gICAgICAgICAgICAgICAgLnRha2UoMSlcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHByb2plY3QpID0+IHRoaXMuX3Byb2plY3QudXBkYXRlKHByb2plY3QpKSxcclxuICAgICAgICAgICAgdGhpcy5zb2x1dGlvbi53aGVuQ29ubmVjdGVkKCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2xvYWRlZCA9IHRydWUpLFxyXG4gICAgICAgICAgICBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9pdGVtcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5kaXNwb3NlICYmIGl0ZW0uZGlzcG9zZSgpKTtcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIHNvbHV0aW9uLm9wZW4oeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSB9KS5zdWJzY3JpYmUoKSxcclxuICAgICAgICAgICAgc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCksIEZyb21EaXNrOiB0cnVlIH0sIHsgc2lsZW50OiB0cnVlIH0pLnN1YnNjcmliZSgpLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChzb2x1dGlvbi5jbG9zZSh7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpIH0pLnN1YnNjcmliZSgpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLm9uV2lsbENoYW5nZSgoY2hhbmdlOiB7IG9sZFJhbmdlOiBUZXh0QnVmZmVyLlJhbmdlOyBuZXdSYW5nZTogVGV4dEJ1ZmZlci5SYW5nZTsgb2xkVGV4dDogc3RyaW5nOyBuZXdUZXh0OiBzdHJpbmc7IH0pID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaENoYW5nZShjaGFuZ2UpO1xyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc0NoYW5nZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBzb2x1dGlvbi51cGRhdGVidWZmZXIoeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSwgQ2hhbmdlczogdGhpcy5wb3BDaGFuZ2VzKCkgfSwgeyBzaWxlbnQ6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBlZGl0b3Iub25EaWRTYXZlKCgpID0+IHNvbHV0aW9uLnVwZGF0ZWJ1ZmZlcih7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpLCBGcm9tRGlzazogdHJ1ZSB9LCB7IHNpbGVudDogdHJ1ZSB9KSlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZCh0aGlzKTtcclxuXHJcbiAgICAgICAgT21uaXNoYXJwRWRpdG9yQ29udGV4dC5fY3JlYXRlZFN1YmplY3QubmV4dCg8YW55PmVkaXRvcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBzb2x1dGlvbigpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uOyB9XHJcbiAgICBwdWJsaWMgZ2V0IHByb2plY3QoKSB7IHJldHVybiB0aGlzLl9wcm9qZWN0OyB9XHJcbiAgICBwdWJsaWMgZ2V0IGxvYWRlZCgpIHsgcmV0dXJuIHRoaXMuX2xvYWRlZDsgfVxyXG4gICAgcHVibGljIG9uTG9hZDxUIGV4dGVuZHMgRnVuY3Rpb24+KGNhbGxiYWNrOiBUKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9sb2FkZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5zb2x1dGlvbi53aGVuQ29ubmVjdGVkKClcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gY2FsbGJhY2soKSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCB0ZW1wKCkgeyByZXR1cm4gdGhpcy5faXRlbXMuaGFzKFwiX19fVEVNUF9fX1wiKSAmJiB0aGlzLl9pdGVtcy5nZXQoXCJfX19URU1QX19fXCIpIHx8IGZhbHNlOyB9XHJcbiAgICBwdWJsaWMgc2V0IHRlbXAodmFsdWU6IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2l0ZW1zLmhhcyhcIl9fX1RFTVBfX19cIikpIHtcclxuICAgICAgICAgICAgdGhpcy5faXRlbXMuc2V0KFwiX19fVEVNUF9fX1wiLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgbWV0YWRhdGEoKSB7IHJldHVybiB0aGlzLl9tZXRhZGF0YTsgfVxyXG4gICAgcHVibGljIHNldCBtZXRhZGF0YSh2YWx1ZSkgeyB0aGlzLl9tZXRhZGF0YSA9IHZhbHVlOyB9XHJcblxyXG4gICAgcHVibGljIGdldCBjb25maWcoKSB7IHJldHVybiB0aGlzLl9jb25maWc7IH1cclxuICAgIHB1YmxpYyBzZXQgY29uZmlnKHZhbHVlKSB7IHRoaXMuX2NvbmZpZyA9IHZhbHVlOyB9XHJcblxyXG4gICAgcHVibGljIHNldDxUPihuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAoY29udGV4dDogT21uaXNoYXJwRWRpdG9yQ29udGV4dCwgZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yKSA9PiBUKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2l0ZW1zLmhhcyhuYW1lKSlcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2l0ZW1zLmdldChuYW1lKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gY2FsbGJhY2sodGhpcywgdGhpcy5fZWRpdG9yKTtcclxuICAgICAgICB0aGlzLl9pdGVtcy5zZXQobmFtZSwgcmVzdWx0KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQ8VD4obmFtZTogc3RyaW5nKTogVCB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9pdGVtcy5oYXMobmFtZSkgJiYgY29udGV4dEl0ZW1zLmhhcyhuYW1lKSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldChuYW1lLCBjb250ZXh0SXRlbXMuZ2V0KG5hbWUpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIDxhbnk+dGhpcy5faXRlbXMuZ2V0KG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwdXNoQ2hhbmdlKGNoYW5nZTogQXRvbVRleHRDaGFuZ2UpIHtcclxuICAgICAgICB0aGlzLl9jaGFuZ2VzLnB1c2goY2hhbmdlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcG9wQ2hhbmdlcygpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2NoYW5nZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5tYXAodGhpcy5fY2hhbmdlcy5zcGxpY2UoMCwgdGhpcy5fY2hhbmdlcy5sZW5ndGgpLCBjaGFuZ2UgPT4gPE1vZGVscy5MaW5lUG9zaXRpb25TcGFuVGV4dENoYW5nZT57XHJcbiAgICAgICAgICAgIE5ld1RleHQ6IGNoYW5nZS5uZXdUZXh0LFxyXG4gICAgICAgICAgICBTdGFydExpbmU6IGNoYW5nZS5vbGRSYW5nZS5zdGFydC5yb3csXHJcbiAgICAgICAgICAgIFN0YXJ0Q29sdW1uOiBjaGFuZ2Uub2xkUmFuZ2Uuc3RhcnQuY29sdW1uLFxyXG4gICAgICAgICAgICBFbmRMaW5lOiBjaGFuZ2Uub2xkUmFuZ2UuZW5kLnJvdyxcclxuICAgICAgICAgICAgRW5kQ29sdW1uOiBjaGFuZ2Uub2xkUmFuZ2UuZW5kLmNvbHVtblxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgaGFzQ2hhbmdlcygpIHsgcmV0dXJuICEhdGhpcy5fY2hhbmdlcy5sZW5ndGg7IH1cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBPbW5pc2hhcnBUZXh0RWRpdG9yIGV4dGVuZHMgQXRvbS5UZXh0RWRpdG9yIHtcclxuICAgIG9tbmlzaGFycDogT21uaXNoYXJwRWRpdG9yQ29udGV4dDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3I6IGFueSk6IGVkaXRvciBpcyBPbW5pc2hhcnBUZXh0RWRpdG9yIHsgcmV0dXJuIGVkaXRvciAmJiAhISg8YW55PmVkaXRvcikub21uaXNoYXJwOyB9XHJcbiIsImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgRW1wdHlQcm9qZWN0Vmlld01vZGVsIH0gZnJvbSBcIi4vcHJvamVjdC12aWV3LW1vZGVsXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmNvbnN0IGNvbnRleHRJdGVtcyA9IG5ldyBNYXAoKTtcbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbnRleHRJdGVtKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgY29udGV4dEl0ZW1zLnNldChuYW1lLCBjYWxsYmFjayk7XG4gICAgcmV0dXJuIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IGNvbnRleHRJdGVtcy5kZWxldGUobmFtZSkpO1xufVxuZXhwb3J0IGNsYXNzIE9tbmlzaGFycEVkaXRvckNvbnRleHQge1xuICAgIGNvbnN0cnVjdG9yKGVkaXRvciwgc29sdXRpb24pIHtcbiAgICAgICAgdGhpcy5faXRlbXMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9sb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fY2hhbmdlcyA9IFtdO1xuICAgICAgICBpZiAoZWRpdG9yLm9tbmlzaGFycClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLl9lZGl0b3Iub21uaXNoYXJwID0gdGhpcztcbiAgICAgICAgdGhpcy5fc29sdXRpb24gPSBzb2x1dGlvbjtcbiAgICAgICAgdGhpcy5fcHJvamVjdCA9IG5ldyBFbXB0eVByb2plY3RWaWV3TW9kZWwobnVsbCwgc29sdXRpb24ucGF0aCk7XG4gICAgICAgIGNvbnN0IHZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWVkaXRvclwiKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLm9tbmlzaGFycCA9IG51bGw7XG4gICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJvbW5pc2hhcnAtZWRpdG9yXCIpO1xuICAgICAgICB9LCBzb2x1dGlvbi5tb2RlbFxuICAgICAgICAgICAgLmdldFByb2plY3RGb3JFZGl0b3IoZWRpdG9yKVxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHByb2plY3QpID0+IHRoaXMuX3Byb2plY3QudXBkYXRlKHByb2plY3QpKSwgdGhpcy5zb2x1dGlvbi53aGVuQ29ubmVjdGVkKCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2xvYWRlZCA9IHRydWUpLCBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9pdGVtcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5kaXNwb3NlICYmIGl0ZW0uZGlzcG9zZSgpKTtcbiAgICAgICAgfSksIHNvbHV0aW9uLm9wZW4oeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSB9KS5zdWJzY3JpYmUoKSwgc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCksIEZyb21EaXNrOiB0cnVlIH0sIHsgc2lsZW50OiB0cnVlIH0pLnN1YnNjcmliZSgpLCAoKSA9PiB7XG4gICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChzb2x1dGlvbi5jbG9zZSh7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpIH0pLnN1YnNjcmliZSgpKTtcbiAgICAgICAgfSwgZWRpdG9yLmdldEJ1ZmZlcigpLm9uV2lsbENoYW5nZSgoY2hhbmdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnB1c2hDaGFuZ2UoY2hhbmdlKTtcbiAgICAgICAgfSksIGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZygoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5oYXNDaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCksIENoYW5nZXM6IHRoaXMucG9wQ2hhbmdlcygpIH0sIHsgc2lsZW50OiB0cnVlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSwgZWRpdG9yLm9uRGlkU2F2ZSgoKSA9PiBzb2x1dGlvbi51cGRhdGVidWZmZXIoeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSwgRnJvbURpc2s6IHRydWUgfSwgeyBzaWxlbnQ6IHRydWUgfSkpKTtcbiAgICAgICAgc29sdXRpb24uZGlzcG9zYWJsZS5hZGQodGhpcyk7XG4gICAgICAgIE9tbmlzaGFycEVkaXRvckNvbnRleHQuX2NyZWF0ZWRTdWJqZWN0Lm5leHQoZWRpdG9yKTtcbiAgICB9XG4gICAgc3RhdGljIGdldCBjcmVhdGVkKCkgeyByZXR1cm4gT21uaXNoYXJwRWRpdG9yQ29udGV4dC5fY3JlYXRlZFN1YmplY3QuYXNPYnNlcnZhYmxlKCk7IH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgZ2V0IHNvbHV0aW9uKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb247IH1cbiAgICBnZXQgcHJvamVjdCgpIHsgcmV0dXJuIHRoaXMuX3Byb2plY3Q7IH1cbiAgICBnZXQgbG9hZGVkKCkgeyByZXR1cm4gdGhpcy5fbG9hZGVkOyB9XG4gICAgb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGhpcy5fbG9hZGVkKSB7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLnNvbHV0aW9uLndoZW5Db25uZWN0ZWQoKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gY2FsbGJhY2soKSkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICAgIGdldCB0ZW1wKCkgeyByZXR1cm4gdGhpcy5faXRlbXMuaGFzKFwiX19fVEVNUF9fX1wiKSAmJiB0aGlzLl9pdGVtcy5nZXQoXCJfX19URU1QX19fXCIpIHx8IGZhbHNlOyB9XG4gICAgc2V0IHRlbXAodmFsdWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pdGVtcy5oYXMoXCJfX19URU1QX19fXCIpKSB7XG4gICAgICAgICAgICB0aGlzLl9pdGVtcy5zZXQoXCJfX19URU1QX19fXCIsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgbWV0YWRhdGEoKSB7IHJldHVybiB0aGlzLl9tZXRhZGF0YTsgfVxuICAgIHNldCBtZXRhZGF0YSh2YWx1ZSkgeyB0aGlzLl9tZXRhZGF0YSA9IHZhbHVlOyB9XG4gICAgZ2V0IGNvbmZpZygpIHsgcmV0dXJuIHRoaXMuX2NvbmZpZzsgfVxuICAgIHNldCBjb25maWcodmFsdWUpIHsgdGhpcy5fY29uZmlnID0gdmFsdWU7IH1cbiAgICBzZXQobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHRoaXMuX2l0ZW1zLmhhcyhuYW1lKSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pdGVtcy5nZXQobmFtZSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxiYWNrKHRoaXMsIHRoaXMuX2VkaXRvcik7XG4gICAgICAgIHRoaXMuX2l0ZW1zLnNldChuYW1lLCByZXN1bHQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBnZXQobmFtZSkge1xuICAgICAgICBpZiAoIXRoaXMuX2l0ZW1zLmhhcyhuYW1lKSAmJiBjb250ZXh0SXRlbXMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICB0aGlzLnNldChuYW1lLCBjb250ZXh0SXRlbXMuZ2V0KG5hbWUpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5faXRlbXMuZ2V0KG5hbWUpO1xuICAgIH1cbiAgICBwdXNoQ2hhbmdlKGNoYW5nZSkge1xuICAgICAgICB0aGlzLl9jaGFuZ2VzLnB1c2goY2hhbmdlKTtcbiAgICB9XG4gICAgcG9wQ2hhbmdlcygpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9jaGFuZ2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF8ubWFwKHRoaXMuX2NoYW5nZXMuc3BsaWNlKDAsIHRoaXMuX2NoYW5nZXMubGVuZ3RoKSwgY2hhbmdlID0+ICh7XG4gICAgICAgICAgICBOZXdUZXh0OiBjaGFuZ2UubmV3VGV4dCxcbiAgICAgICAgICAgIFN0YXJ0TGluZTogY2hhbmdlLm9sZFJhbmdlLnN0YXJ0LnJvdyxcbiAgICAgICAgICAgIFN0YXJ0Q29sdW1uOiBjaGFuZ2Uub2xkUmFuZ2Uuc3RhcnQuY29sdW1uLFxuICAgICAgICAgICAgRW5kTGluZTogY2hhbmdlLm9sZFJhbmdlLmVuZC5yb3csXG4gICAgICAgICAgICBFbmRDb2x1bW46IGNoYW5nZS5vbGRSYW5nZS5lbmQuY29sdW1uXG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZ2V0IGhhc0NoYW5nZXMoKSB7IHJldHVybiAhIXRoaXMuX2NoYW5nZXMubGVuZ3RoOyB9XG59XG5PbW5pc2hhcnBFZGl0b3JDb250ZXh0Ll9jcmVhdGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG5leHBvcnQgZnVuY3Rpb24gaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikgeyByZXR1cm4gZWRpdG9yICYmICEhZWRpdG9yLm9tbmlzaGFycDsgfVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
