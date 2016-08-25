"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OmnisharpEditorContext = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.registerContextItem = registerContextItem;
exports.isOmnisharpTextEditor = isOmnisharpTextEditor;

var _tsDisposables = require("ts-disposables");

var _projectViewModel = require("./project-view-model");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yLnRzIiwibGliL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3IuanMiXSwibmFtZXMiOlsicmVnaXN0ZXJDb250ZXh0SXRlbSIsImlzT21uaXNoYXJwVGV4dEVkaXRvciIsImNvbnRleHRJdGVtcyIsIk1hcCIsIm5hbWUiLCJjYWxsYmFjayIsInNldCIsImNyZWF0ZSIsImRlbGV0ZSIsIk9tbmlzaGFycEVkaXRvckNvbnRleHQiLCJlZGl0b3IiLCJzb2x1dGlvbiIsIl9pdGVtcyIsIl9kaXNwb3NhYmxlIiwiX2xvYWRlZCIsIl9jaGFuZ2VzIiwib21uaXNoYXJwIiwiX2VkaXRvciIsIl9zb2x1dGlvbiIsIl9wcm9qZWN0IiwicGF0aCIsInZpZXciLCJhdG9tIiwidmlld3MiLCJnZXRWaWV3IiwiY2xhc3NMaXN0IiwiYWRkIiwicmVtb3ZlIiwibW9kZWwiLCJnZXRQcm9qZWN0Rm9yRWRpdG9yIiwidGFrZSIsInN1YnNjcmliZSIsInByb2plY3QiLCJ1cGRhdGUiLCJ3aGVuQ29ubmVjdGVkIiwiZm9yRWFjaCIsIml0ZW0iLCJkaXNwb3NlIiwib3BlbiIsIkZpbGVOYW1lIiwiZ2V0UGF0aCIsInVwZGF0ZWJ1ZmZlciIsIkZyb21EaXNrIiwic2lsZW50IiwiZGlzcG9zYWJsZSIsImNsb3NlIiwiZ2V0QnVmZmVyIiwib25XaWxsQ2hhbmdlIiwiY2hhbmdlIiwicHVzaENoYW5nZSIsIm9uRGlkU3RvcENoYW5naW5nIiwiaGFzQ2hhbmdlcyIsIkNoYW5nZXMiLCJwb3BDaGFuZ2VzIiwib25EaWRTYXZlIiwiX2NyZWF0ZWRTdWJqZWN0IiwibmV4dCIsImhhcyIsImdldCIsInJlc3VsdCIsInB1c2giLCJsZW5ndGgiLCJtYXAiLCJzcGxpY2UiLCJOZXdUZXh0IiwibmV3VGV4dCIsIlN0YXJ0TGluZSIsIm9sZFJhbmdlIiwic3RhcnQiLCJyb3ciLCJTdGFydENvbHVtbiIsImNvbHVtbiIsIkVuZExpbmUiLCJl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QUFLQyxRQUFaO0FBQXVCOzs7NEJBQzdCO0FBQUssbUJBQU8sS0FBS0wsT0FBWjtBQUFzQjs7OzRCQVU3QjtBQUFLLG1CQUFPLEtBQUtGLE1BQUwsQ0FBWTZDLEdBQVosQ0FBZ0IsWUFBaEIsS0FBaUMsS0FBSzdDLE1BQUwsQ0FBWThDLEdBQVosQ0FBZ0IsWUFBaEIsQ0FBakMsSUFBa0UsS0FBekU7QUFBaUYsUzswQkFDckZpQixLLEVBQWM7QUFDMUIsZ0JBQUksQ0FBQyxLQUFLL0QsTUFBTCxDQUFZNkMsR0FBWixDQUFnQixZQUFoQixDQUFMLEVBQW9DO0FBQ2hDLHFCQUFLN0MsTUFBTCxDQUFZTixHQUFaLENBQWdCLFlBQWhCLEVBQThCcUUsS0FBOUI7QUFDSDtBQUNKOzs7NEJBRWtCO0FBQUssbUJBQU8sS0FBS0MsU0FBWjtBQUF3QixTOzBCQUM1QkQsSyxFQUFLO0FBQUksaUJBQUtDLFNBQUwsR0FBaUJELEtBQWpCO0FBQXlCOzs7NEJBRXJDO0FBQUssbUJBQU8sS0FBS0UsT0FBWjtBQUFzQixTOzBCQUMxQkYsSyxFQUFLO0FBQUksaUJBQUtFLE9BQUwsR0FBZUYsS0FBZjtBQUF1Qjs7OzRCQW1DN0I7QUFBSyxtQkFBTyxDQUFDLENBQUMsS0FBSzVELFFBQUwsQ0FBYzhDLE1BQXZCO0FBQWdDOzs7NEJBdEhqQztBQUFLLG1CQUFPcEQsdUJBQXVCOEMsZUFBdkIsQ0FBdUN1QixZQUF2QyxFQUFQO0FBQStEOzs7Ozs7QUFEOUVyRSx1QkFBQThDLGVBQUEsR0FBa0IsbUJBQWxCO0FBOEhuQixTQUFBdEQscUJBQUEsQ0FBc0NTLE1BQXRDLEVBQWlEO0FBQW1DLFdBQU9BLFVBQVUsQ0FBQyxDQUFPQSxPQUFRTSxTQUFqQztBQUE2QyIsImZpbGUiOiJsaWIvc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtTb2x1dGlvbn0gZnJvbSBcIi4vc29sdXRpb25cIjtcclxuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsLCBFbXB0eVByb2plY3RWaWV3TW9kZWx9IGZyb20gXCIuL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7U3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuXHJcbmNvbnN0IGNvbnRleHRJdGVtcyA9IG5ldyBNYXA8c3RyaW5nLCAoY29udGV4dDogT21uaXNoYXJwRWRpdG9yQ29udGV4dCwgZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yKSA9PiBhbnk+KCk7XHJcbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbnRleHRJdGVtPFQ+KG5hbWU6IHN0cmluZywgY2FsbGJhY2s6IChjb250ZXh0OiBPbW5pc2hhcnBFZGl0b3JDb250ZXh0LCBlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IpID0+IFQpIHtcclxuICAgIGNvbnRleHRJdGVtcy5zZXQobmFtZSwgY2FsbGJhY2spO1xyXG4gICAgcmV0dXJuIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IGNvbnRleHRJdGVtcy5kZWxldGUobmFtZSkpO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBBdG9tVGV4dENoYW5nZSA9IHsgb2xkUmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2U7IG5ld1JhbmdlOiBUZXh0QnVmZmVyLlJhbmdlOyBvbGRUZXh0OiBzdHJpbmc7IG5ld1RleHQ6IHN0cmluZzsgfTtcclxuXHJcbmV4cG9ydCBjbGFzcyBPbW5pc2hhcnBFZGl0b3JDb250ZXh0IGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2NyZWF0ZWRTdWJqZWN0ID0gbmV3IFN1YmplY3Q8T21uaXNoYXJwVGV4dEVkaXRvcj4oKTtcclxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0IGNyZWF0ZWQoKSB7IHJldHVybiBPbW5pc2hhcnBFZGl0b3JDb250ZXh0Ll9jcmVhdGVkU3ViamVjdC5hc09ic2VydmFibGUoKTsgfVxyXG5cclxuICAgIHByaXZhdGUgX2VkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvcjtcclxuICAgIHByaXZhdGUgX3NvbHV0aW9uOiBTb2x1dGlvbjtcclxuICAgIHByaXZhdGUgX21ldGFkYXRhOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfY29uZmlnOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfcHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+O1xyXG4gICAgcHJpdmF0ZSBfaXRlbXMgPSBuZXcgTWFwPHN0cmluZywgYW55PigpO1xyXG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICBwcml2YXRlIF9sb2FkZWQgPSBmYWxzZTtcclxuICAgIHByaXZhdGUgX2NoYW5nZXM6IEF0b21UZXh0Q2hhbmdlW10gPSBbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgc29sdXRpb246IFNvbHV0aW9uKSB7XHJcbiAgICAgICAgaWYgKCg8YW55PmVkaXRvcikub21uaXNoYXJwKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gPGFueT5lZGl0b3I7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yLm9tbmlzaGFycCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5fc29sdXRpb24gPSBzb2x1dGlvbjtcclxuICAgICAgICB0aGlzLl9wcm9qZWN0ID0gbmV3IEVtcHR5UHJvamVjdFZpZXdNb2RlbChudWxsLCBzb2x1dGlvbi5wYXRoKTtcclxuXHJcbiAgICAgICAgY29uc3QgdmlldzogSFRNTEVsZW1lbnQgPSA8YW55PmF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpO1xyXG4gICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1lZGl0b3JcIik7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9lZGl0b3Iub21uaXNoYXJwID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHZpZXcuY2xhc3NMaXN0LnJlbW92ZShcIm9tbmlzaGFycC1lZGl0b3JcIik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNvbHV0aW9uLm1vZGVsXHJcbiAgICAgICAgICAgICAgICAuZ2V0UHJvamVjdEZvckVkaXRvcihlZGl0b3IpXHJcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgocHJvamVjdCkgPT4gdGhpcy5fcHJvamVjdC51cGRhdGUocHJvamVjdCkpLFxyXG4gICAgICAgICAgICB0aGlzLnNvbHV0aW9uLndoZW5Db25uZWN0ZWQoKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fbG9hZGVkID0gdHJ1ZSksXHJcbiAgICAgICAgICAgIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2l0ZW1zLmZvckVhY2goaXRlbSA9PiBpdGVtLmRpc3Bvc2UgJiYgaXRlbS5kaXNwb3NlKCkpO1xyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgc29sdXRpb24ub3Blbih7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpIH0pLnN1YnNjcmliZSgpLFxyXG4gICAgICAgICAgICBzb2x1dGlvbi51cGRhdGVidWZmZXIoeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSwgRnJvbURpc2s6IHRydWUgfSwgeyBzaWxlbnQ6IHRydWUgfSkuc3Vic2NyaWJlKCksXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKHNvbHV0aW9uLmNsb3NlKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCkgfSkuc3Vic2NyaWJlKCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkub25XaWxsQ2hhbmdlKChjaGFuZ2U6IHsgb2xkUmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2U7IG5ld1JhbmdlOiBUZXh0QnVmZmVyLlJhbmdlOyBvbGRUZXh0OiBzdHJpbmc7IG5ld1RleHQ6IHN0cmluZzsgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoQ2hhbmdlKGNoYW5nZSk7XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzQ2hhbmdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNvbHV0aW9uLnVwZGF0ZWJ1ZmZlcih7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpLCBDaGFuZ2VzOiB0aGlzLnBvcENoYW5nZXMoKSB9LCB7IHNpbGVudDogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIGVkaXRvci5vbkRpZFNhdmUoKCkgPT4gc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCksIEZyb21EaXNrOiB0cnVlIH0sIHsgc2lsZW50OiB0cnVlIH0pKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKHRoaXMpO1xyXG5cclxuICAgICAgICBPbW5pc2hhcnBFZGl0b3JDb250ZXh0Ll9jcmVhdGVkU3ViamVjdC5uZXh0KDxhbnk+ZWRpdG9yKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHNvbHV0aW9uKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb247IH1cclxuICAgIHB1YmxpYyBnZXQgcHJvamVjdCgpIHsgcmV0dXJuIHRoaXMuX3Byb2plY3Q7IH1cclxuICAgIHB1YmxpYyBnZXQgbG9hZGVkKCkgeyByZXR1cm4gdGhpcy5fbG9hZGVkOyB9XHJcbiAgICBwdWJsaWMgb25Mb2FkPFQgZXh0ZW5kcyBGdW5jdGlvbj4oY2FsbGJhY2s6IFQpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2xvYWRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLnNvbHV0aW9uLndoZW5Db25uZWN0ZWQoKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiBjYWxsYmFjaygpKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FsbGJhY2soKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHRlbXAoKSB7IHJldHVybiB0aGlzLl9pdGVtcy5oYXMoXCJfX19URU1QX19fXCIpICYmIHRoaXMuX2l0ZW1zLmdldChcIl9fX1RFTVBfX19cIikgfHwgZmFsc2U7IH1cclxuICAgIHB1YmxpYyBzZXQgdGVtcCh2YWx1ZTogYm9vbGVhbikge1xyXG4gICAgICAgIGlmICghdGhpcy5faXRlbXMuaGFzKFwiX19fVEVNUF9fX1wiKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9pdGVtcy5zZXQoXCJfX19URU1QX19fXCIsIHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBtZXRhZGF0YSgpIHsgcmV0dXJuIHRoaXMuX21ldGFkYXRhOyB9XHJcbiAgICBwdWJsaWMgc2V0IG1ldGFkYXRhKHZhbHVlKSB7IHRoaXMuX21ldGFkYXRhID0gdmFsdWU7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGNvbmZpZygpIHsgcmV0dXJuIHRoaXMuX2NvbmZpZzsgfVxyXG4gICAgcHVibGljIHNldCBjb25maWcodmFsdWUpIHsgdGhpcy5fY29uZmlnID0gdmFsdWU7IH1cclxuXHJcbiAgICBwdWJsaWMgc2V0PFQ+KG5hbWU6IHN0cmluZywgY2FsbGJhY2s6IChjb250ZXh0OiBPbW5pc2hhcnBFZGl0b3JDb250ZXh0LCBlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IpID0+IFQpIHtcclxuICAgICAgICBpZiAodGhpcy5faXRlbXMuaGFzKG5hbWUpKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXRlbXMuZ2V0KG5hbWUpO1xyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjayh0aGlzLCB0aGlzLl9lZGl0b3IpO1xyXG4gICAgICAgIHRoaXMuX2l0ZW1zLnNldChuYW1lLCByZXN1bHQpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldDxUPihuYW1lOiBzdHJpbmcpOiBUIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2l0ZW1zLmhhcyhuYW1lKSAmJiBjb250ZXh0SXRlbXMuaGFzKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsIGNvbnRleHRJdGVtcy5nZXQobmFtZSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gPGFueT50aGlzLl9pdGVtcy5nZXQobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHB1c2hDaGFuZ2UoY2hhbmdlOiBBdG9tVGV4dENoYW5nZSkge1xyXG4gICAgICAgIHRoaXMuX2NoYW5nZXMucHVzaChjaGFuZ2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwb3BDaGFuZ2VzKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fY2hhbmdlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLm1hcCh0aGlzLl9jaGFuZ2VzLnNwbGljZSgwLCB0aGlzLl9jaGFuZ2VzLmxlbmd0aCksIGNoYW5nZSA9PiA8TW9kZWxzLkxpbmVQb3NpdGlvblNwYW5UZXh0Q2hhbmdlPntcclxuICAgICAgICAgICAgTmV3VGV4dDogY2hhbmdlLm5ld1RleHQsXHJcbiAgICAgICAgICAgIFN0YXJ0TGluZTogY2hhbmdlLm9sZFJhbmdlLnN0YXJ0LnJvdyxcclxuICAgICAgICAgICAgU3RhcnRDb2x1bW46IGNoYW5nZS5vbGRSYW5nZS5zdGFydC5jb2x1bW4sXHJcbiAgICAgICAgICAgIEVuZExpbmU6IGNoYW5nZS5vbGRSYW5nZS5lbmQucm93LFxyXG4gICAgICAgICAgICBFbmRDb2x1bW46IGNoYW5nZS5vbGRSYW5nZS5lbmQuY29sdW1uXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBoYXNDaGFuZ2VzKCkgeyByZXR1cm4gISF0aGlzLl9jaGFuZ2VzLmxlbmd0aDsgfVxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE9tbmlzaGFycFRleHRFZGl0b3IgZXh0ZW5kcyBBdG9tLlRleHRFZGl0b3Ige1xyXG4gICAgb21uaXNoYXJwOiBPbW5pc2hhcnBFZGl0b3JDb250ZXh0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcjogYW55KTogZWRpdG9yIGlzIE9tbmlzaGFycFRleHRFZGl0b3IgeyByZXR1cm4gZWRpdG9yICYmICEhKDxhbnk+ZWRpdG9yKS5vbW5pc2hhcnA7IH1cclxuIiwiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgRW1wdHlQcm9qZWN0Vmlld01vZGVsIH0gZnJvbSBcIi4vcHJvamVjdC12aWV3LW1vZGVsXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmNvbnN0IGNvbnRleHRJdGVtcyA9IG5ldyBNYXAoKTtcbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbnRleHRJdGVtKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgY29udGV4dEl0ZW1zLnNldChuYW1lLCBjYWxsYmFjayk7XG4gICAgcmV0dXJuIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IGNvbnRleHRJdGVtcy5kZWxldGUobmFtZSkpO1xufVxuZXhwb3J0IGNsYXNzIE9tbmlzaGFycEVkaXRvckNvbnRleHQge1xuICAgIGNvbnN0cnVjdG9yKGVkaXRvciwgc29sdXRpb24pIHtcbiAgICAgICAgdGhpcy5faXRlbXMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9sb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fY2hhbmdlcyA9IFtdO1xuICAgICAgICBpZiAoZWRpdG9yLm9tbmlzaGFycClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLl9lZGl0b3Iub21uaXNoYXJwID0gdGhpcztcbiAgICAgICAgdGhpcy5fc29sdXRpb24gPSBzb2x1dGlvbjtcbiAgICAgICAgdGhpcy5fcHJvamVjdCA9IG5ldyBFbXB0eVByb2plY3RWaWV3TW9kZWwobnVsbCwgc29sdXRpb24ucGF0aCk7XG4gICAgICAgIGNvbnN0IHZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWVkaXRvclwiKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLm9tbmlzaGFycCA9IG51bGw7XG4gICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJvbW5pc2hhcnAtZWRpdG9yXCIpO1xuICAgICAgICB9LCBzb2x1dGlvbi5tb2RlbFxuICAgICAgICAgICAgLmdldFByb2plY3RGb3JFZGl0b3IoZWRpdG9yKVxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHByb2plY3QpID0+IHRoaXMuX3Byb2plY3QudXBkYXRlKHByb2plY3QpKSwgdGhpcy5zb2x1dGlvbi53aGVuQ29ubmVjdGVkKCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2xvYWRlZCA9IHRydWUpLCBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9pdGVtcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5kaXNwb3NlICYmIGl0ZW0uZGlzcG9zZSgpKTtcbiAgICAgICAgfSksIHNvbHV0aW9uLm9wZW4oeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSB9KS5zdWJzY3JpYmUoKSwgc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCksIEZyb21EaXNrOiB0cnVlIH0sIHsgc2lsZW50OiB0cnVlIH0pLnN1YnNjcmliZSgpLCAoKSA9PiB7XG4gICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChzb2x1dGlvbi5jbG9zZSh7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpIH0pLnN1YnNjcmliZSgpKTtcbiAgICAgICAgfSwgZWRpdG9yLmdldEJ1ZmZlcigpLm9uV2lsbENoYW5nZSgoY2hhbmdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnB1c2hDaGFuZ2UoY2hhbmdlKTtcbiAgICAgICAgfSksIGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZygoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5oYXNDaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCksIENoYW5nZXM6IHRoaXMucG9wQ2hhbmdlcygpIH0sIHsgc2lsZW50OiB0cnVlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSwgZWRpdG9yLm9uRGlkU2F2ZSgoKSA9PiBzb2x1dGlvbi51cGRhdGVidWZmZXIoeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSwgRnJvbURpc2s6IHRydWUgfSwgeyBzaWxlbnQ6IHRydWUgfSkpKTtcbiAgICAgICAgc29sdXRpb24uZGlzcG9zYWJsZS5hZGQodGhpcyk7XG4gICAgICAgIE9tbmlzaGFycEVkaXRvckNvbnRleHQuX2NyZWF0ZWRTdWJqZWN0Lm5leHQoZWRpdG9yKTtcbiAgICB9XG4gICAgc3RhdGljIGdldCBjcmVhdGVkKCkgeyByZXR1cm4gT21uaXNoYXJwRWRpdG9yQ29udGV4dC5fY3JlYXRlZFN1YmplY3QuYXNPYnNlcnZhYmxlKCk7IH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgZ2V0IHNvbHV0aW9uKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb247IH1cbiAgICBnZXQgcHJvamVjdCgpIHsgcmV0dXJuIHRoaXMuX3Byb2plY3Q7IH1cbiAgICBnZXQgbG9hZGVkKCkgeyByZXR1cm4gdGhpcy5fbG9hZGVkOyB9XG4gICAgb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGhpcy5fbG9hZGVkKSB7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLnNvbHV0aW9uLndoZW5Db25uZWN0ZWQoKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gY2FsbGJhY2soKSkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICAgIGdldCB0ZW1wKCkgeyByZXR1cm4gdGhpcy5faXRlbXMuaGFzKFwiX19fVEVNUF9fX1wiKSAmJiB0aGlzLl9pdGVtcy5nZXQoXCJfX19URU1QX19fXCIpIHx8IGZhbHNlOyB9XG4gICAgc2V0IHRlbXAodmFsdWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pdGVtcy5oYXMoXCJfX19URU1QX19fXCIpKSB7XG4gICAgICAgICAgICB0aGlzLl9pdGVtcy5zZXQoXCJfX19URU1QX19fXCIsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgbWV0YWRhdGEoKSB7IHJldHVybiB0aGlzLl9tZXRhZGF0YTsgfVxuICAgIHNldCBtZXRhZGF0YSh2YWx1ZSkgeyB0aGlzLl9tZXRhZGF0YSA9IHZhbHVlOyB9XG4gICAgZ2V0IGNvbmZpZygpIHsgcmV0dXJuIHRoaXMuX2NvbmZpZzsgfVxuICAgIHNldCBjb25maWcodmFsdWUpIHsgdGhpcy5fY29uZmlnID0gdmFsdWU7IH1cbiAgICBzZXQobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHRoaXMuX2l0ZW1zLmhhcyhuYW1lKSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pdGVtcy5nZXQobmFtZSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxiYWNrKHRoaXMsIHRoaXMuX2VkaXRvcik7XG4gICAgICAgIHRoaXMuX2l0ZW1zLnNldChuYW1lLCByZXN1bHQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBnZXQobmFtZSkge1xuICAgICAgICBpZiAoIXRoaXMuX2l0ZW1zLmhhcyhuYW1lKSAmJiBjb250ZXh0SXRlbXMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICB0aGlzLnNldChuYW1lLCBjb250ZXh0SXRlbXMuZ2V0KG5hbWUpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5faXRlbXMuZ2V0KG5hbWUpO1xuICAgIH1cbiAgICBwdXNoQ2hhbmdlKGNoYW5nZSkge1xuICAgICAgICB0aGlzLl9jaGFuZ2VzLnB1c2goY2hhbmdlKTtcbiAgICB9XG4gICAgcG9wQ2hhbmdlcygpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9jaGFuZ2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF8ubWFwKHRoaXMuX2NoYW5nZXMuc3BsaWNlKDAsIHRoaXMuX2NoYW5nZXMubGVuZ3RoKSwgY2hhbmdlID0+ICh7XG4gICAgICAgICAgICBOZXdUZXh0OiBjaGFuZ2UubmV3VGV4dCxcbiAgICAgICAgICAgIFN0YXJ0TGluZTogY2hhbmdlLm9sZFJhbmdlLnN0YXJ0LnJvdyxcbiAgICAgICAgICAgIFN0YXJ0Q29sdW1uOiBjaGFuZ2Uub2xkUmFuZ2Uuc3RhcnQuY29sdW1uLFxuICAgICAgICAgICAgRW5kTGluZTogY2hhbmdlLm9sZFJhbmdlLmVuZC5yb3csXG4gICAgICAgICAgICBFbmRDb2x1bW46IGNoYW5nZS5vbGRSYW5nZS5lbmQuY29sdW1uXG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZ2V0IGhhc0NoYW5nZXMoKSB7IHJldHVybiAhIXRoaXMuX2NoYW5nZXMubGVuZ3RoOyB9XG59XG5PbW5pc2hhcnBFZGl0b3JDb250ZXh0Ll9jcmVhdGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG5leHBvcnQgZnVuY3Rpb24gaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikgeyByZXR1cm4gZWRpdG9yICYmICEhZWRpdG9yLm9tbmlzaGFycDsgfVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
