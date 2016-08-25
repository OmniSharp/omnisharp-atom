"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fileMonitor = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _fs = require("fs");

var fs = _interopRequireWildcard(_fs);

var _omni = require("../server/omni");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

var _atom = require("atom");

var _bufferFor = require("../operators/bufferFor");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function projectLock(solution, project, filePath) {
    var disposable = new _tsDisposables.CompositeDisposable();
    var subject = new _rxjs.Subject();
    var file = new _atom.File(filePath),
        onDidChange = file.onDidChange(function () {
        return subject.next(filePath);
    }),
        onWillThrowWatchError = file.onWillThrowWatchError(function () {
        subject.next(filePath);
        disposable.remove(onDidChange);
        onDidChange.dispose();
        _lodash2.default.delay(function () {
            onDidChange = file.onDidChange(function () {
                return subject.next(filePath);
            });
            disposable.add(onDidChange);
        }, 5000);
    });
    disposable.add(onDidChange);
    disposable.add(onWillThrowWatchError);
    return {
        observable: subject.throttleTime(30000),
        dispose: function dispose() {
            return disposable.dispose();
        }
    };
}

var FileMonitor = function () {
    function FileMonitor() {
        _classCallCheck(this, FileMonitor);

        this.filesMap = new WeakMap();
        this.required = false;
        this.title = "Project Monitor";
        this.description = "Monitors project.lock.json files for changes outside of atom, and keeps the running solution in sync";
    }

    _createClass(FileMonitor, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            var changes = (0, _bufferFor.bufferFor)(_rxjs.Observable.merge(_omni.Omni.listener.model.projectAdded, _omni.Omni.listener.model.projectChanged).map(function (project) {
                return { project: project, filePath: path.join(project.path, "project.lock.json") };
            }).filter(function (_ref) {
                var filePath = _ref.filePath;
                return fs.existsSync(filePath);
            }).flatMap(function (_ref2) {
                var project = _ref2.project;
                var filePath = _ref2.filePath;
                return _omni.Omni.getSolutionForProject(project).map(function (solution) {
                    return { solution: solution, project: project, filePath: filePath };
                });
            }).filter(function (x) {
                return !!x.solution;
            }).flatMap(function (_ref3) {
                var solution = _ref3.solution;
                var project = _ref3.project;
                var filePath = _ref3.filePath;

                if (_this.filesMap.has(project)) {
                    var v = _this.filesMap.get(project);
                    v.dispose();
                }
                var lock = projectLock(solution, project, filePath);
                _this.disposable.add(lock);
                _this.filesMap.set(project, lock);
                return lock.observable.map(function (path) {
                    return { solution: solution, filePath: filePath };
                });
            }).share(), 30000);
            this.disposable.add(changes.subscribe(function (changs) {
                _lodash2.default.each(_lodash2.default.groupBy(changs, function (x) {
                    return x.solution.uniqueId;
                }), function (chang) {
                    var solution = chang[0].solution;
                    var paths = _lodash2.default.uniq(chang.map(function (x) {
                        return x.filePath;
                    }));
                    solution.filesChanged(paths.map(function (z) {
                        return { FileName: z };
                    }));
                });
            }));
            this.disposable.add(_omni.Omni.listener.model.projectRemoved.subscribe(function (project) {
                var removedItem = _this.filesMap.get(project);
                if (removedItem) {
                    _this.filesMap.delete(project);
                    removedItem.dispose();
                }
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return FileMonitor;
}();

var fileMonitor = exports.fileMonitor = new FileMonitor();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9wcm9qZWN0LWxvY2suanMiLCJsaWIvZmVhdHVyZXMvcHJvamVjdC1sb2NrLnRzIl0sIm5hbWVzIjpbInBhdGgiLCJmcyIsInByb2plY3RMb2NrIiwic29sdXRpb24iLCJwcm9qZWN0IiwiZmlsZVBhdGgiLCJkaXNwb3NhYmxlIiwic3ViamVjdCIsImZpbGUiLCJvbkRpZENoYW5nZSIsIm5leHQiLCJvbldpbGxUaHJvd1dhdGNoRXJyb3IiLCJyZW1vdmUiLCJkaXNwb3NlIiwiZGVsYXkiLCJhZGQiLCJvYnNlcnZhYmxlIiwidGhyb3R0bGVUaW1lIiwiRmlsZU1vbml0b3IiLCJmaWxlc01hcCIsIldlYWtNYXAiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJjaGFuZ2VzIiwibWVyZ2UiLCJsaXN0ZW5lciIsIm1vZGVsIiwicHJvamVjdEFkZGVkIiwicHJvamVjdENoYW5nZWQiLCJtYXAiLCJqb2luIiwiZmlsdGVyIiwiZXhpc3RzU3luYyIsImZsYXRNYXAiLCJnZXRTb2x1dGlvbkZvclByb2plY3QiLCJ4IiwiaGFzIiwidiIsImdldCIsImxvY2siLCJzZXQiLCJzaGFyZSIsInN1YnNjcmliZSIsImVhY2giLCJncm91cEJ5IiwiY2hhbmdzIiwidW5pcXVlSWQiLCJjaGFuZyIsInBhdGhzIiwidW5pcSIsImZpbGVzQ2hhbmdlZCIsIkZpbGVOYW1lIiwieiIsInByb2plY3RSZW1vdmVkIiwicmVtb3ZlZEl0ZW0iLCJkZWxldGUiLCJmaWxlTW9uaXRvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0lDQVlBLEk7O0FEQ1o7O0lDQVlDLEU7O0FEQ1o7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUNJQSxTQUFBQyxXQUFBLENBQXFCQyxRQUFyQixFQUF5Q0MsT0FBekMsRUFBeUVDLFFBQXpFLEVBQXlGO0FBQ3JGLFFBQU1DLGFBQWEsd0NBQW5CO0FBQ0EsUUFBTUMsVUFBVSxtQkFBaEI7QUFD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QUVhO0FBQ1YsaUJBQUtQLFVBQUwsQ0FBZ0JPLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU00QyxvQ0FBYyxJQUFJdkMsV0FBSixFQUFwQiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvcHJvamVjdC1sb2NrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IEZpbGUgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IHsgYnVmZmVyRm9yIH0gZnJvbSBcIi4uL29wZXJhdG9ycy9idWZmZXJGb3JcIjtcbmZ1bmN0aW9uIHByb2plY3RMb2NrKHNvbHV0aW9uLCBwcm9qZWN0LCBmaWxlUGF0aCkge1xuICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICAgIGxldCBmaWxlID0gbmV3IEZpbGUoZmlsZVBhdGgpLCBvbkRpZENoYW5nZSA9IGZpbGUub25EaWRDaGFuZ2UoKCkgPT4gc3ViamVjdC5uZXh0KGZpbGVQYXRoKSksIG9uV2lsbFRocm93V2F0Y2hFcnJvciA9IGZpbGUub25XaWxsVGhyb3dXYXRjaEVycm9yKCgpID0+IHtcbiAgICAgICAgc3ViamVjdC5uZXh0KGZpbGVQYXRoKTtcbiAgICAgICAgZGlzcG9zYWJsZS5yZW1vdmUob25EaWRDaGFuZ2UpO1xuICAgICAgICBvbkRpZENoYW5nZS5kaXNwb3NlKCk7XG4gICAgICAgIF8uZGVsYXkoKCkgPT4ge1xuICAgICAgICAgICAgb25EaWRDaGFuZ2UgPSBmaWxlLm9uRGlkQ2hhbmdlKCgpID0+IHN1YmplY3QubmV4dChmaWxlUGF0aCkpO1xuICAgICAgICAgICAgZGlzcG9zYWJsZS5hZGQob25EaWRDaGFuZ2UpO1xuICAgICAgICB9LCA1MDAwKTtcbiAgICB9KTtcbiAgICBkaXNwb3NhYmxlLmFkZChvbkRpZENoYW5nZSk7XG4gICAgZGlzcG9zYWJsZS5hZGQob25XaWxsVGhyb3dXYXRjaEVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBvYnNlcnZhYmxlOiBzdWJqZWN0LnRocm90dGxlVGltZSgzMDAwMCksXG4gICAgICAgIGRpc3Bvc2U6ICgpID0+IGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgfTtcbn1cbmNsYXNzIEZpbGVNb25pdG9yIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5maWxlc01hcCA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiUHJvamVjdCBNb25pdG9yXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIk1vbml0b3JzIHByb2plY3QubG9jay5qc29uIGZpbGVzIGZvciBjaGFuZ2VzIG91dHNpZGUgb2YgYXRvbSwgYW5kIGtlZXBzIHRoZSBydW5uaW5nIHNvbHV0aW9uIGluIHN5bmNcIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IGNoYW5nZXMgPSBidWZmZXJGb3IoT2JzZXJ2YWJsZS5tZXJnZShPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RBZGRlZCwgT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0Q2hhbmdlZClcbiAgICAgICAgICAgIC5tYXAocHJvamVjdCA9PiAoeyBwcm9qZWN0LCBmaWxlUGF0aDogcGF0aC5qb2luKHByb2plY3QucGF0aCwgXCJwcm9qZWN0LmxvY2suanNvblwiKSB9KSlcbiAgICAgICAgICAgIC5maWx0ZXIoKHsgZmlsZVBhdGggfSkgPT4gZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpXG4gICAgICAgICAgICAuZmxhdE1hcCgoeyBwcm9qZWN0LCBmaWxlUGF0aCB9KSA9PiBPbW5pLmdldFNvbHV0aW9uRm9yUHJvamVjdChwcm9qZWN0KS5tYXAoc29sdXRpb24gPT4gKHsgc29sdXRpb24sIHByb2plY3QsIGZpbGVQYXRoIH0pKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXguc29sdXRpb24pXG4gICAgICAgICAgICAuZmxhdE1hcCgoeyBzb2x1dGlvbiwgcHJvamVjdCwgZmlsZVBhdGggfSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsZXNNYXAuaGFzKHByb2plY3QpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdiA9IHRoaXMuZmlsZXNNYXAuZ2V0KHByb2plY3QpO1xuICAgICAgICAgICAgICAgIHYuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbG9jayA9IHByb2plY3RMb2NrKHNvbHV0aW9uLCBwcm9qZWN0LCBmaWxlUGF0aCk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGxvY2spO1xuICAgICAgICAgICAgdGhpcy5maWxlc01hcC5zZXQocHJvamVjdCwgbG9jayk7XG4gICAgICAgICAgICByZXR1cm4gbG9jay5vYnNlcnZhYmxlLm1hcChwYXRoID0+ICh7IHNvbHV0aW9uLCBmaWxlUGF0aCB9KSk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuc2hhcmUoKSwgMzAwMDApO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGNoYW5nZXNcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY2hhbmdzID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChfLmdyb3VwQnkoY2hhbmdzLCB4ID0+IHguc29sdXRpb24udW5pcXVlSWQpLCBjaGFuZyA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc29sdXRpb24gPSBjaGFuZ1swXS5zb2x1dGlvbjtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRocyA9IF8udW5pcShjaGFuZy5tYXAoeCA9PiB4LmZpbGVQYXRoKSk7XG4gICAgICAgICAgICAgICAgc29sdXRpb24uZmlsZXNDaGFuZ2VkKHBhdGhzLm1hcCh6ID0+ICh7IEZpbGVOYW1lOiB6IH0pKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubW9kZWwucHJvamVjdFJlbW92ZWRcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB7XG4gICAgICAgICAgICBjb25zdCByZW1vdmVkSXRlbSA9IHRoaXMuZmlsZXNNYXAuZ2V0KHByb2plY3QpO1xuICAgICAgICAgICAgaWYgKHJlbW92ZWRJdGVtKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maWxlc01hcC5kZWxldGUocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlZEl0ZW0uZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGZpbGVNb25pdG9yID0gbmV3IEZpbGVNb25pdG9yO1xuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge0ZpbGV9IGZyb20gXCJhdG9tXCI7XHJcbmltcG9ydCB7UHJvamVjdFZpZXdNb2RlbH0gZnJvbSBcIi4uL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWxcIjtcclxuaW1wb3J0IHtTb2x1dGlvbn0gZnJvbSBcIi4uL3NlcnZlci9zb2x1dGlvblwiO1xyXG5pbXBvcnQge2J1ZmZlckZvcn0gZnJvbSBcIi4uL29wZXJhdG9ycy9idWZmZXJGb3JcIjtcclxuXHJcbmZ1bmN0aW9uIHByb2plY3RMb2NrKHNvbHV0aW9uOiBTb2x1dGlvbiwgcHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+LCBmaWxlUGF0aDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgU3ViamVjdDxzdHJpbmc+KCk7XHJcbiAgICBsZXQgZmlsZSA9IG5ldyBGaWxlKGZpbGVQYXRoKSxcclxuICAgICAgICBvbkRpZENoYW5nZSA9IGZpbGUub25EaWRDaGFuZ2UoKCkgPT4gc3ViamVjdC5uZXh0KGZpbGVQYXRoKSksXHJcbiAgICAgICAgb25XaWxsVGhyb3dXYXRjaEVycm9yID0gZmlsZS5vbldpbGxUaHJvd1dhdGNoRXJyb3IoKCkgPT4ge1xyXG4gICAgICAgICAgICBzdWJqZWN0Lm5leHQoZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICBkaXNwb3NhYmxlLnJlbW92ZShvbkRpZENoYW5nZSk7XHJcbiAgICAgICAgICAgIG9uRGlkQ2hhbmdlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgXy5kZWxheSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBvbkRpZENoYW5nZSA9IGZpbGUub25EaWRDaGFuZ2UoKCkgPT4gc3ViamVjdC5uZXh0KGZpbGVQYXRoKSk7XHJcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmFkZChvbkRpZENoYW5nZSk7XHJcbiAgICAgICAgICAgIH0sIDUwMDApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIGRpc3Bvc2FibGUuYWRkKG9uRGlkQ2hhbmdlKTtcclxuICAgIGRpc3Bvc2FibGUuYWRkKG9uV2lsbFRocm93V2F0Y2hFcnJvcik7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBvYnNlcnZhYmxlOiBzdWJqZWN0LnRocm90dGxlVGltZSgzMDAwMCksXHJcbiAgICAgICAgZGlzcG9zZTogKCkgPT4gZGlzcG9zYWJsZS5kaXNwb3NlKClcclxuICAgIH07XHJcbn1cclxuXHJcbmNsYXNzIEZpbGVNb25pdG9yIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBmaWxlc01hcCA9IG5ldyBXZWFrTWFwPFByb2plY3RWaWV3TW9kZWw8YW55PiwgSURpc3Bvc2FibGU+KCk7XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGNoYW5nZXMgPSBidWZmZXJGb3IoT2JzZXJ2YWJsZS5tZXJnZShPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RBZGRlZCwgT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0Q2hhbmdlZClcclxuICAgICAgICAgICAgLm1hcChwcm9qZWN0ID0+ICh7IHByb2plY3QsIGZpbGVQYXRoOiBwYXRoLmpvaW4ocHJvamVjdC5wYXRoLCBcInByb2plY3QubG9jay5qc29uXCIpIH0pKVxyXG4gICAgICAgICAgICAuZmlsdGVyKCh7IGZpbGVQYXRofSkgPT4gZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKCh7IHByb2plY3QsIGZpbGVQYXRofSkgPT5cclxuICAgICAgICAgICAgICAgIE9tbmkuZ2V0U29sdXRpb25Gb3JQcm9qZWN0KHByb2plY3QpLm1hcChzb2x1dGlvbiA9PiAoeyBzb2x1dGlvbiwgcHJvamVjdCwgZmlsZVBhdGggfSkpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4LnNvbHV0aW9uKVxyXG4gICAgICAgICAgICAuZmxhdE1hcCgoeyBzb2x1dGlvbiwgcHJvamVjdCwgZmlsZVBhdGggfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmlsZXNNYXAuaGFzKHByb2plY3QpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IHRoaXMuZmlsZXNNYXAuZ2V0KHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHYuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvY2sgPSBwcm9qZWN0TG9jayhzb2x1dGlvbiwgcHJvamVjdCwgZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChsb2NrKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmlsZXNNYXAuc2V0KHByb2plY3QsIGxvY2spO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxvY2sub2JzZXJ2YWJsZS5tYXAocGF0aCA9PiAoeyBzb2x1dGlvbiwgZmlsZVBhdGggfSkpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuc2hhcmUoKSwgMzAwMDApO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGNoYW5nZXNcclxuICAgICAgICAgICAgLnN1YnNjcmliZShjaGFuZ3MgPT4ge1xyXG4gICAgICAgICAgICAgICAgXy5lYWNoKF8uZ3JvdXBCeShjaGFuZ3MsIHggPT4geC5zb2x1dGlvbi51bmlxdWVJZCksIGNoYW5nID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb2x1dGlvbiA9IGNoYW5nWzBdLnNvbHV0aW9uO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gXy51bmlxKGNoYW5nLm1hcCh4ID0+IHguZmlsZVBhdGgpKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2x1dGlvbi5maWxlc0NoYW5nZWQocGF0aHMubWFwKHogPT4gKHsgRmlsZU5hbWU6IHogfSkpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0UmVtb3ZlZFxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlZEl0ZW0gPSB0aGlzLmZpbGVzTWFwLmdldChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgIGlmIChyZW1vdmVkSXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsZXNNYXAuZGVsZXRlKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZWRJdGVtLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlByb2plY3QgTW9uaXRvclwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJNb25pdG9ycyBwcm9qZWN0LmxvY2suanNvbiBmaWxlcyBmb3IgY2hhbmdlcyBvdXRzaWRlIG9mIGF0b20sIGFuZCBrZWVwcyB0aGUgcnVubmluZyBzb2x1dGlvbiBpbiBzeW5jXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBmaWxlTW9uaXRvciA9IG5ldyBGaWxlTW9uaXRvcjtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
