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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yLnRzIiwibGliL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O1FBUUE7UUFzSUE7O0FDOUlBOztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7OztBRElBLElBQU0sZUFBZSxJQUFJLEdBQUosRUFBZjtBQUNOLFNBQUEsbUJBQUEsQ0FBdUMsSUFBdkMsRUFBcUQsUUFBckQsRUFBa0k7QUFDOUgsaUJBQWEsR0FBYixDQUFpQixJQUFqQixFQUF1QixRQUF2QixFQUQ4SDtBQUU5SCxXQUFPLDRCQUFXLE1BQVgsQ0FBa0I7ZUFBTSxhQUFhLE1BQWIsQ0FBb0IsSUFBcEI7S0FBTixDQUF6QixDQUY4SDtDQUFsSTs7SUFPQTtBQWNJLG9DQUFZLE1BQVosRUFBcUMsUUFBckMsRUFBdUQ7Ozs7O0FBTC9DLGFBQUEsTUFBQSxHQUFTLElBQUksR0FBSixFQUFULENBSytDO0FBSi9DLGFBQUEsV0FBQSxHQUFjLDBDQUFkLENBSStDO0FBSC9DLGFBQUEsT0FBQSxHQUFVLEtBQVYsQ0FHK0M7QUFGL0MsYUFBQSxRQUFBLEdBQTZCLEVBQTdCLENBRStDO0FBQ25ELFlBQVUsT0FBUSxTQUFSLEVBQW1CLE9BQTdCO0FBQ0EsYUFBSyxPQUFMLEdBQW9CLE1BQXBCLENBRm1EO0FBR25ELGFBQUssT0FBTCxDQUFhLFNBQWIsR0FBeUIsSUFBekIsQ0FIbUQ7QUFJbkQsYUFBSyxTQUFMLEdBQWlCLFFBQWpCLENBSm1EO0FBS25ELGFBQUssUUFBTCxHQUFnQiw0Q0FBMEIsSUFBMUIsRUFBZ0MsU0FBUyxJQUFULENBQWhELENBTG1EO0FBT25ELFlBQU0sT0FBeUIsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixNQUFuQixDQUF6QixDQVA2QztBQVFuRCxhQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLGtCQUFuQixFQVJtRDtBQVVuRCxhQUFLLFdBQUwsQ0FBaUIsR0FB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LENBQWdCLFlBQWhCLENBQUQsRUFBZ0M7QUFDaEMscUJBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsWUFBaEIsRUFBOEIsS0FBOUIsRUFEZ0M7YUFBcEM7Ozs7NEJBS2U7QUFBSyxtQkFBTyxLQUFLLFNBQUwsQ0FBWjs7MEJBQ0MsT0FBSztBQUFJLGlCQUFLLFNBQUwsR0FBaUIsS0FBakIsQ0FBSjs7Ozs0QkFFUjtBQUFLLG1CQUFPLEtBQUssT0FBTCxDQUFaOzswQkFDQyxPQUFLO0FBQUksaUJBQUssT0FBTCxHQUFlLEtBQWYsQ0FBSjs7Ozs0QkFtQ0Y7QUFBSyxtQkFBTyxDQUFDLENBQUMsS0FBSyxRQUFMLENBQWMsTUFBZCxDQUFkOzs7OzRCQXRISTtBQUFLLG1CQUFPLHVCQUF1QixlQUF2QixDQUF1QyxZQUF2QyxFQUFQLENBQUw7Ozs7Ozs7QUFEVix1QkFBQSxlQUFBLEdBQWtCLG1CQUFsQjtBQThIbkIsU0FBQSxxQkFBQSxDQUFzQyxNQUF0QyxFQUFpRDtBQUFtQyxXQUFPLFVBQVUsQ0FBQyxDQUFPLE9BQVEsU0FBUixDQUE1RDtDQUFqRCIsImZpbGUiOiJsaWIvc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge1NvbHV0aW9ufSBmcm9tIFwiLi9zb2x1dGlvblwiO1xyXG5pbXBvcnQge1Byb2plY3RWaWV3TW9kZWwsIEVtcHR5UHJvamVjdFZpZXdNb2RlbH0gZnJvbSBcIi4vcHJvamVjdC12aWV3LW1vZGVsXCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5cclxuY29uc3QgY29udGV4dEl0ZW1zID0gbmV3IE1hcDxzdHJpbmcsIChjb250ZXh0OiBPbW5pc2hhcnBFZGl0b3JDb250ZXh0LCBlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IpID0+IGFueT4oKTtcclxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29udGV4dEl0ZW08VD4obmFtZTogc3RyaW5nLCBjYWxsYmFjazogKGNvbnRleHQ6IE9tbmlzaGFycEVkaXRvckNvbnRleHQsIGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvcikgPT4gVCkge1xyXG4gICAgY29udGV4dEl0ZW1zLnNldChuYW1lLCBjYWxsYmFjayk7XHJcbiAgICByZXR1cm4gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4gY29udGV4dEl0ZW1zLmRlbGV0ZShuYW1lKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIEF0b21UZXh0Q2hhbmdlID0geyBvbGRSYW5nZTogVGV4dEJ1ZmZlci5SYW5nZTsgbmV3UmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2U7IG9sZFRleHQ6IHN0cmluZzsgbmV3VGV4dDogc3RyaW5nOyB9O1xyXG5cclxuZXhwb3J0IGNsYXNzIE9tbmlzaGFycEVkaXRvckNvbnRleHQgaW1wbGVtZW50cyBJRGlzcG9zYWJsZSB7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBfY3JlYXRlZFN1YmplY3QgPSBuZXcgU3ViamVjdDxPbW5pc2hhcnBUZXh0RWRpdG9yPigpO1xyXG4gICAgcHVibGljIHN0YXRpYyBnZXQgY3JlYXRlZCgpIHsgcmV0dXJuIE9tbmlzaGFycEVkaXRvckNvbnRleHQuX2NyZWF0ZWRTdWJqZWN0LmFzT2JzZXJ2YWJsZSgpOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yO1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb246IFNvbHV0aW9uO1xyXG4gICAgcHJpdmF0ZSBfbWV0YWRhdGE6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIF9jb25maWc6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIF9wcm9qZWN0OiBQcm9qZWN0Vmlld01vZGVsPGFueT47XHJcbiAgICBwcml2YXRlIF9pdGVtcyA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIHByaXZhdGUgX2xvYWRlZCA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBfY2hhbmdlczogQXRvbVRleHRDaGFuZ2VbXSA9IFtdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBzb2x1dGlvbjogU29sdXRpb24pIHtcclxuICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yKS5vbW5pc2hhcnApIHJldHVybjtcclxuICAgICAgICB0aGlzLl9lZGl0b3IgPSA8YW55PmVkaXRvcjtcclxuICAgICAgICB0aGlzLl9lZGl0b3Iub21uaXNoYXJwID0gdGhpcztcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbiA9IHNvbHV0aW9uO1xyXG4gICAgICAgIHRoaXMuX3Byb2plY3QgPSBuZXcgRW1wdHlQcm9qZWN0Vmlld01vZGVsKG51bGwsIHNvbHV0aW9uLnBhdGgpO1xyXG5cclxuICAgICAgICBjb25zdCB2aWV3OiBIVE1MRWxlbWVudCA9IDxhbnk+YXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcik7XHJcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWVkaXRvclwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2VkaXRvci5vbW5pc2hhcnAgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QucmVtb3ZlKFwib21uaXNoYXJwLWVkaXRvclwiKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc29sdXRpb24ubW9kZWxcclxuICAgICAgICAgICAgICAgIC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcilcclxuICAgICAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKChwcm9qZWN0KSA9PiB0aGlzLl9wcm9qZWN0LnVwZGF0ZShwcm9qZWN0KSksXHJcbiAgICAgICAgICAgIHRoaXMuc29sdXRpb24ud2hlbkNvbm5lY3RlZCgpLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9sb2FkZWQgPSB0cnVlKSxcclxuICAgICAgICAgICAgRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5faXRlbXMuZm9yRWFjaChpdGVtID0+IGl0ZW0uZGlzcG9zZSAmJiBpdGVtLmRpc3Bvc2UoKSk7XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBzb2x1dGlvbi5vcGVuKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCkgfSkuc3Vic2NyaWJlKCksXHJcbiAgICAgICAgICAgIHNvbHV0aW9uLnVwZGF0ZWJ1ZmZlcih7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpLCBGcm9tRGlzazogdHJ1ZSB9LCB7IHNpbGVudDogdHJ1ZSB9KS5zdWJzY3JpYmUoKSxcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoc29sdXRpb24uY2xvc2UoeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSB9KS5zdWJzY3JpYmUoKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5vbldpbGxDaGFuZ2UoKGNoYW5nZTogeyBvbGRSYW5nZTogVGV4dEJ1ZmZlci5SYW5nZTsgbmV3UmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2U7IG9sZFRleHQ6IHN0cmluZzsgbmV3VGV4dDogc3RyaW5nOyB9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hDaGFuZ2UoY2hhbmdlKTtcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXNDaGFuZ2VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCksIENoYW5nZXM6IHRoaXMucG9wQ2hhbmdlcygpIH0sIHsgc2lsZW50OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgZWRpdG9yLm9uRGlkU2F2ZSgoKSA9PiBzb2x1dGlvbi51cGRhdGVidWZmZXIoeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSwgRnJvbURpc2s6IHRydWUgfSwgeyBzaWxlbnQ6IHRydWUgfSkpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgc29sdXRpb24uZGlzcG9zYWJsZS5hZGQodGhpcyk7XHJcblxyXG4gICAgICAgIE9tbmlzaGFycEVkaXRvckNvbnRleHQuX2NyZWF0ZWRTdWJqZWN0Lm5leHQoPGFueT5lZGl0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgc29sdXRpb24oKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbjsgfVxyXG4gICAgcHVibGljIGdldCBwcm9qZWN0KCkgeyByZXR1cm4gdGhpcy5fcHJvamVjdDsgfVxyXG4gICAgcHVibGljIGdldCBsb2FkZWQoKSB7IHJldHVybiB0aGlzLl9sb2FkZWQ7IH1cclxuICAgIHB1YmxpYyBvbkxvYWQ8VCBleHRlbmRzIEZ1bmN0aW9uPihjYWxsYmFjazogVCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fbG9hZGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuc29sdXRpb24ud2hlbkNvbm5lY3RlZCgpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IGNhbGxiYWNrKCkpKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgdGVtcCgpIHsgcmV0dXJuIHRoaXMuX2l0ZW1zLmhhcyhcIl9fX1RFTVBfX19cIikgJiYgdGhpcy5faXRlbXMuZ2V0KFwiX19fVEVNUF9fX1wiKSB8fCBmYWxzZTsgfVxyXG4gICAgcHVibGljIHNldCB0ZW1wKHZhbHVlOiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9pdGVtcy5oYXMoXCJfX19URU1QX19fXCIpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2l0ZW1zLnNldChcIl9fX1RFTVBfX19cIiwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IG1ldGFkYXRhKCkgeyByZXR1cm4gdGhpcy5fbWV0YWRhdGE7IH1cclxuICAgIHB1YmxpYyBzZXQgbWV0YWRhdGEodmFsdWUpIHsgdGhpcy5fbWV0YWRhdGEgPSB2YWx1ZTsgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgY29uZmlnKCkgeyByZXR1cm4gdGhpcy5fY29uZmlnOyB9XHJcbiAgICBwdWJsaWMgc2V0IGNvbmZpZyh2YWx1ZSkgeyB0aGlzLl9jb25maWcgPSB2YWx1ZTsgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQ8VD4obmFtZTogc3RyaW5nLCBjYWxsYmFjazogKGNvbnRleHQ6IE9tbmlzaGFycEVkaXRvckNvbnRleHQsIGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvcikgPT4gVCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9pdGVtcy5oYXMobmFtZSkpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pdGVtcy5nZXQobmFtZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxiYWNrKHRoaXMsIHRoaXMuX2VkaXRvcik7XHJcbiAgICAgICAgdGhpcy5faXRlbXMuc2V0KG5hbWUsIHJlc3VsdCk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0PFQ+KG5hbWU6IHN0cmluZyk6IFQge1xyXG4gICAgICAgIGlmICghdGhpcy5faXRlbXMuaGFzKG5hbWUpICYmIGNvbnRleHRJdGVtcy5oYXMobmFtZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXQobmFtZSwgY29udGV4dEl0ZW1zLmdldChuYW1lKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiA8YW55PnRoaXMuX2l0ZW1zLmdldChuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHVzaENoYW5nZShjaGFuZ2U6IEF0b21UZXh0Q2hhbmdlKSB7XHJcbiAgICAgICAgdGhpcy5fY2hhbmdlcy5wdXNoKGNoYW5nZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHBvcENoYW5nZXMoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9jaGFuZ2VzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8ubWFwKHRoaXMuX2NoYW5nZXMuc3BsaWNlKDAsIHRoaXMuX2NoYW5nZXMubGVuZ3RoKSwgY2hhbmdlID0+IDxNb2RlbHMuTGluZVBvc2l0aW9uU3BhblRleHRDaGFuZ2U+e1xyXG4gICAgICAgICAgICBOZXdUZXh0OiBjaGFuZ2UubmV3VGV4dCxcclxuICAgICAgICAgICAgU3RhcnRMaW5lOiBjaGFuZ2Uub2xkUmFuZ2Uuc3RhcnQucm93LFxyXG4gICAgICAgICAgICBTdGFydENvbHVtbjogY2hhbmdlLm9sZFJhbmdlLnN0YXJ0LmNvbHVtbixcclxuICAgICAgICAgICAgRW5kTGluZTogY2hhbmdlLm9sZFJhbmdlLmVuZC5yb3csXHJcbiAgICAgICAgICAgIEVuZENvbHVtbjogY2hhbmdlLm9sZFJhbmdlLmVuZC5jb2x1bW5cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGhhc0NoYW5nZXMoKSB7IHJldHVybiAhIXRoaXMuX2NoYW5nZXMubGVuZ3RoOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgT21uaXNoYXJwVGV4dEVkaXRvciBleHRlbmRzIEF0b20uVGV4dEVkaXRvciB7XHJcbiAgICBvbW5pc2hhcnA6IE9tbmlzaGFycEVkaXRvckNvbnRleHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc09tbmlzaGFycFRleHRFZGl0b3IoZWRpdG9yOiBhbnkpOiBlZGl0b3IgaXMgT21uaXNoYXJwVGV4dEVkaXRvciB7IHJldHVybiBlZGl0b3IgJiYgISEoPGFueT5lZGl0b3IpLm9tbmlzaGFycDsgfVxyXG4iLCJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IEVtcHR5UHJvamVjdFZpZXdNb2RlbCB9IGZyb20gXCIuL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgU3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5jb25zdCBjb250ZXh0SXRlbXMgPSBuZXcgTWFwKCk7XG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb250ZXh0SXRlbShuYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnRleHRJdGVtcy5zZXQobmFtZSwgY2FsbGJhY2spO1xuICAgIHJldHVybiBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiBjb250ZXh0SXRlbXMuZGVsZXRlKG5hbWUpKTtcbn1cbmV4cG9ydCBjbGFzcyBPbW5pc2hhcnBFZGl0b3JDb250ZXh0IHtcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3IsIHNvbHV0aW9uKSB7XG4gICAgICAgIHRoaXMuX2l0ZW1zID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fbG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2NoYW5nZXMgPSBbXTtcbiAgICAgICAgaWYgKGVkaXRvci5vbW5pc2hhcnApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX2VkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgdGhpcy5fZWRpdG9yLm9tbmlzaGFycCA9IHRoaXM7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uID0gc29sdXRpb247XG4gICAgICAgIHRoaXMuX3Byb2plY3QgPSBuZXcgRW1wdHlQcm9qZWN0Vmlld01vZGVsKG51bGwsIHNvbHV0aW9uLnBhdGgpO1xuICAgICAgICBjb25zdCB2aWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcik7XG4gICAgICAgIHZpZXcuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1lZGl0b3JcIik7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvci5vbW5pc2hhcnAgPSBudWxsO1xuICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QucmVtb3ZlKFwib21uaXNoYXJwLWVkaXRvclwiKTtcbiAgICAgICAgfSwgc29sdXRpb24ubW9kZWxcbiAgICAgICAgICAgIC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcilcbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKChwcm9qZWN0KSA9PiB0aGlzLl9wcm9qZWN0LnVwZGF0ZShwcm9qZWN0KSksIHRoaXMuc29sdXRpb24ud2hlbkNvbm5lY3RlZCgpLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9sb2FkZWQgPSB0cnVlKSwgRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5faXRlbXMuZm9yRWFjaChpdGVtID0+IGl0ZW0uZGlzcG9zZSAmJiBpdGVtLmRpc3Bvc2UoKSk7XG4gICAgICAgIH0pLCBzb2x1dGlvbi5vcGVuKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCkgfSkuc3Vic2NyaWJlKCksIHNvbHV0aW9uLnVwZGF0ZWJ1ZmZlcih7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpLCBGcm9tRGlzazogdHJ1ZSB9LCB7IHNpbGVudDogdHJ1ZSB9KS5zdWJzY3JpYmUoKSwgKCkgPT4ge1xuICAgICAgICAgICAgc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoc29sdXRpb24uY2xvc2UoeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSB9KS5zdWJzY3JpYmUoKSk7XG4gICAgICAgIH0sIGVkaXRvci5nZXRCdWZmZXIoKS5vbldpbGxDaGFuZ2UoKGNoYW5nZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wdXNoQ2hhbmdlKGNoYW5nZSk7XG4gICAgICAgIH0pLCBlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGFzQ2hhbmdlcykge1xuICAgICAgICAgICAgICAgIHNvbHV0aW9uLnVwZGF0ZWJ1ZmZlcih7IEZpbGVOYW1lOiBlZGl0b3IuZ2V0UGF0aCgpLCBDaGFuZ2VzOiB0aGlzLnBvcENoYW5nZXMoKSB9LCB7IHNpbGVudDogdHJ1ZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksIGVkaXRvci5vbkRpZFNhdmUoKCkgPT4gc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCksIEZyb21EaXNrOiB0cnVlIH0sIHsgc2lsZW50OiB0cnVlIH0pKSk7XG4gICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKHRoaXMpO1xuICAgICAgICBPbW5pc2hhcnBFZGl0b3JDb250ZXh0Ll9jcmVhdGVkU3ViamVjdC5uZXh0KGVkaXRvcik7XG4gICAgfVxuICAgIHN0YXRpYyBnZXQgY3JlYXRlZCgpIHsgcmV0dXJuIE9tbmlzaGFycEVkaXRvckNvbnRleHQuX2NyZWF0ZWRTdWJqZWN0LmFzT2JzZXJ2YWJsZSgpOyB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGdldCBzb2x1dGlvbigpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uOyB9XG4gICAgZ2V0IHByb2plY3QoKSB7IHJldHVybiB0aGlzLl9wcm9qZWN0OyB9XG4gICAgZ2V0IGxvYWRlZCgpIHsgcmV0dXJuIHRoaXMuX2xvYWRlZDsgfVxuICAgIG9uTG9hZChjYWxsYmFjaykge1xuICAgICAgICBpZiAoIXRoaXMuX2xvYWRlZCkge1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5zb2x1dGlvbi53aGVuQ29ubmVjdGVkKClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IGNhbGxiYWNrKCkpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgICBnZXQgdGVtcCgpIHsgcmV0dXJuIHRoaXMuX2l0ZW1zLmhhcyhcIl9fX1RFTVBfX19cIikgJiYgdGhpcy5faXRlbXMuZ2V0KFwiX19fVEVNUF9fX1wiKSB8fCBmYWxzZTsgfVxuICAgIHNldCB0ZW1wKHZhbHVlKSB7XG4gICAgICAgIGlmICghdGhpcy5faXRlbXMuaGFzKFwiX19fVEVNUF9fX1wiKSkge1xuICAgICAgICAgICAgdGhpcy5faXRlbXMuc2V0KFwiX19fVEVNUF9fX1wiLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IG1ldGFkYXRhKCkgeyByZXR1cm4gdGhpcy5fbWV0YWRhdGE7IH1cbiAgICBzZXQgbWV0YWRhdGEodmFsdWUpIHsgdGhpcy5fbWV0YWRhdGEgPSB2YWx1ZTsgfVxuICAgIGdldCBjb25maWcoKSB7IHJldHVybiB0aGlzLl9jb25maWc7IH1cbiAgICBzZXQgY29uZmlnKHZhbHVlKSB7IHRoaXMuX2NvbmZpZyA9IHZhbHVlOyB9XG4gICAgc2V0KG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0aGlzLl9pdGVtcy5oYXMobmFtZSkpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXRlbXMuZ2V0KG5hbWUpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjayh0aGlzLCB0aGlzLl9lZGl0b3IpO1xuICAgICAgICB0aGlzLl9pdGVtcy5zZXQobmFtZSwgcmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgZ2V0KG5hbWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pdGVtcy5oYXMobmFtZSkgJiYgY29udGV4dEl0ZW1zLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgdGhpcy5zZXQobmFtZSwgY29udGV4dEl0ZW1zLmdldChuYW1lKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2l0ZW1zLmdldChuYW1lKTtcbiAgICB9XG4gICAgcHVzaENoYW5nZShjaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fY2hhbmdlcy5wdXNoKGNoYW5nZSk7XG4gICAgfVxuICAgIHBvcENoYW5nZXMoKSB7XG4gICAgICAgIGlmICghdGhpcy5fY2hhbmdlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfLm1hcCh0aGlzLl9jaGFuZ2VzLnNwbGljZSgwLCB0aGlzLl9jaGFuZ2VzLmxlbmd0aCksIGNoYW5nZSA9PiAoe1xuICAgICAgICAgICAgTmV3VGV4dDogY2hhbmdlLm5ld1RleHQsXG4gICAgICAgICAgICBTdGFydExpbmU6IGNoYW5nZS5vbGRSYW5nZS5zdGFydC5yb3csXG4gICAgICAgICAgICBTdGFydENvbHVtbjogY2hhbmdlLm9sZFJhbmdlLnN0YXJ0LmNvbHVtbixcbiAgICAgICAgICAgIEVuZExpbmU6IGNoYW5nZS5vbGRSYW5nZS5lbmQucm93LFxuICAgICAgICAgICAgRW5kQ29sdW1uOiBjaGFuZ2Uub2xkUmFuZ2UuZW5kLmNvbHVtblxuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGdldCBoYXNDaGFuZ2VzKCkgeyByZXR1cm4gISF0aGlzLl9jaGFuZ2VzLmxlbmd0aDsgfVxufVxuT21uaXNoYXJwRWRpdG9yQ29udGV4dC5fY3JlYXRlZFN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuZXhwb3J0IGZ1bmN0aW9uIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpIHsgcmV0dXJuIGVkaXRvciAmJiAhIWVkaXRvci5vbW5pc2hhcnA7IH1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
