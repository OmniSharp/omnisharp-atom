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

var _omnisharpClient = require("omnisharp-client");

var _atom = require("atom");

var _bufferFor = require("../operators/bufferFor");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function projectLock(solution, project, filePath) {
    var disposable = new _omnisharpClient.CompositeDisposable();
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

            this.disposable = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9wcm9qZWN0LWxvY2suanMiLCJsaWIvZmVhdHVyZXMvcHJvamVjdC1sb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQ0FZOztBRENaOztJQ0FZOztBRENaOztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FDSUEsU0FBQSxXQUFBLENBQXFCLFFBQXJCLEVBQXlDLE9BQXpDLEVBQXlFLFFBQXpFLEVBQXlGO0FBQ3JGLFFBQU0sYUFBYSwwQ0FBYixDQUQrRTtBQUVyRixRQUFNLFVBQVUsbUJBQVYsQ0FGK0U7QUFHckYsUUFBSSxPQUFPLGVBQVMsUUFBVCxDQUFQO1FBQ0EsY0FBYyxLQUFLLFdBQUwsQ0FBaUI7ZUFBTSxRQUFRLElBQVIsQ0FBYSxRQUFiO0tBQU4sQ0FBL0I7UUFDQSx3QkFBd0IsS0FBSyxxQkFBTCxDQUEyQixZQUFBO0FBQy9DLGdCQUFRLElBQVIsQ0FBYSxRQUFiLEVBRCtDO0FBRS9DLG1CQUFXLE1BQVgsQ0FBa0IsV0FBbEIsRUFGK0M7QUFHL0Msb0JBQVksT0FBWixHQUgrQztBQUkvQyx5QkFBRSxLQUFGLENBQVEsWUFBQTtBQUNKLDBCQUFjLEtBQUssV0FBTCxDQUFpQjt1QkFBTSxRQUFRLElBQVIsQ0FBYSxRQUFiO2FBQU4sQ0FBL0IsQ0FESTtBQUVKLHVCQUFXLEdBQVgsQ0FBZSxXQUFmLEVBRkk7U0FBQSxFQUdMLElBSEgsRUFKK0M7S0FBQSxDQUFuRCxDQUxpRjtBQWVyRixlQUFXLEdBQVgsQ0FBZSxXQUFmLEVBZnFGO0FBZ0JyRixlQUFXLEdBQVgsQ0FBZSxxQkFBZixFQWhCcUY7QUFrQnJGLFdBQU87QUFDSCxvQkFBWSxRQUFRLFlBQVIsQ0FBcUIsS0FBckIsQ0FBWjtBQUNBLGlCQUFTO21CQUFNLFdBQVcsT0FBWDtTQUFOO0tBRmIsQ0FsQnFGO0NBQXpGOztJQXdCQTtBQUFBLDJCQUFBOzs7QUFFWSxhQUFBLFFBQUEsR0FBVyxJQUFJLE9BQUos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QUFLLFVBQUwsQ0FBZ0IsT0FBaEIsR0FEVTs7Ozs7OztBQVNYLElBQU0sb0NBQWMsSUFBSSxXQUFKLEVBQWQiLCJmaWxlIjoibGliL2ZlYXR1cmVzL3Byb2plY3QtbG9jay5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IEZpbGUgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IHsgYnVmZmVyRm9yIH0gZnJvbSBcIi4uL29wZXJhdG9ycy9idWZmZXJGb3JcIjtcbmZ1bmN0aW9uIHByb2plY3RMb2NrKHNvbHV0aW9uLCBwcm9qZWN0LCBmaWxlUGF0aCkge1xuICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICAgIGxldCBmaWxlID0gbmV3IEZpbGUoZmlsZVBhdGgpLCBvbkRpZENoYW5nZSA9IGZpbGUub25EaWRDaGFuZ2UoKCkgPT4gc3ViamVjdC5uZXh0KGZpbGVQYXRoKSksIG9uV2lsbFRocm93V2F0Y2hFcnJvciA9IGZpbGUub25XaWxsVGhyb3dXYXRjaEVycm9yKCgpID0+IHtcbiAgICAgICAgc3ViamVjdC5uZXh0KGZpbGVQYXRoKTtcbiAgICAgICAgZGlzcG9zYWJsZS5yZW1vdmUob25EaWRDaGFuZ2UpO1xuICAgICAgICBvbkRpZENoYW5nZS5kaXNwb3NlKCk7XG4gICAgICAgIF8uZGVsYXkoKCkgPT4ge1xuICAgICAgICAgICAgb25EaWRDaGFuZ2UgPSBmaWxlLm9uRGlkQ2hhbmdlKCgpID0+IHN1YmplY3QubmV4dChmaWxlUGF0aCkpO1xuICAgICAgICAgICAgZGlzcG9zYWJsZS5hZGQob25EaWRDaGFuZ2UpO1xuICAgICAgICB9LCA1MDAwKTtcbiAgICB9KTtcbiAgICBkaXNwb3NhYmxlLmFkZChvbkRpZENoYW5nZSk7XG4gICAgZGlzcG9zYWJsZS5hZGQob25XaWxsVGhyb3dXYXRjaEVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBvYnNlcnZhYmxlOiBzdWJqZWN0LnRocm90dGxlVGltZSgzMDAwMCksXG4gICAgICAgIGRpc3Bvc2U6ICgpID0+IGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgfTtcbn1cbmNsYXNzIEZpbGVNb25pdG9yIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5maWxlc01hcCA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiUHJvamVjdCBNb25pdG9yXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIk1vbml0b3JzIHByb2plY3QubG9jay5qc29uIGZpbGVzIGZvciBjaGFuZ2VzIG91dHNpZGUgb2YgYXRvbSwgYW5kIGtlZXBzIHRoZSBydW5uaW5nIHNvbHV0aW9uIGluIHN5bmNcIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IGNoYW5nZXMgPSBidWZmZXJGb3IoT2JzZXJ2YWJsZS5tZXJnZShPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RBZGRlZCwgT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0Q2hhbmdlZClcbiAgICAgICAgICAgIC5tYXAocHJvamVjdCA9PiAoeyBwcm9qZWN0LCBmaWxlUGF0aDogcGF0aC5qb2luKHByb2plY3QucGF0aCwgXCJwcm9qZWN0LmxvY2suanNvblwiKSB9KSlcbiAgICAgICAgICAgIC5maWx0ZXIoKHsgZmlsZVBhdGggfSkgPT4gZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpXG4gICAgICAgICAgICAuZmxhdE1hcCgoeyBwcm9qZWN0LCBmaWxlUGF0aCB9KSA9PiBPbW5pLmdldFNvbHV0aW9uRm9yUHJvamVjdChwcm9qZWN0KS5tYXAoc29sdXRpb24gPT4gKHsgc29sdXRpb24sIHByb2plY3QsIGZpbGVQYXRoIH0pKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXguc29sdXRpb24pXG4gICAgICAgICAgICAuZmxhdE1hcCgoeyBzb2x1dGlvbiwgcHJvamVjdCwgZmlsZVBhdGggfSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsZXNNYXAuaGFzKHByb2plY3QpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdiA9IHRoaXMuZmlsZXNNYXAuZ2V0KHByb2plY3QpO1xuICAgICAgICAgICAgICAgIHYuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbG9jayA9IHByb2plY3RMb2NrKHNvbHV0aW9uLCBwcm9qZWN0LCBmaWxlUGF0aCk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGxvY2spO1xuICAgICAgICAgICAgdGhpcy5maWxlc01hcC5zZXQocHJvamVjdCwgbG9jayk7XG4gICAgICAgICAgICByZXR1cm4gbG9jay5vYnNlcnZhYmxlLm1hcChwYXRoID0+ICh7IHNvbHV0aW9uLCBmaWxlUGF0aCB9KSk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuc2hhcmUoKSwgMzAwMDApO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGNoYW5nZXNcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY2hhbmdzID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChfLmdyb3VwQnkoY2hhbmdzLCB4ID0+IHguc29sdXRpb24udW5pcXVlSWQpLCBjaGFuZyA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc29sdXRpb24gPSBjaGFuZ1swXS5zb2x1dGlvbjtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRocyA9IF8udW5pcShjaGFuZy5tYXAoeCA9PiB4LmZpbGVQYXRoKSk7XG4gICAgICAgICAgICAgICAgc29sdXRpb24uZmlsZXNDaGFuZ2VkKHBhdGhzLm1hcCh6ID0+ICh7IEZpbGVOYW1lOiB6IH0pKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubW9kZWwucHJvamVjdFJlbW92ZWRcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB7XG4gICAgICAgICAgICBjb25zdCByZW1vdmVkSXRlbSA9IHRoaXMuZmlsZXNNYXAuZ2V0KHByb2plY3QpO1xuICAgICAgICAgICAgaWYgKHJlbW92ZWRJdGVtKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maWxlc01hcC5kZWxldGUocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlZEl0ZW0uZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGZpbGVNb25pdG9yID0gbmV3IEZpbGVNb25pdG9yO1xuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7RmlsZX0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi4vc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xyXG5pbXBvcnQge1NvbHV0aW9ufSBmcm9tIFwiLi4vc2VydmVyL3NvbHV0aW9uXCI7XHJcbmltcG9ydCB7YnVmZmVyRm9yfSBmcm9tIFwiLi4vb3BlcmF0b3JzL2J1ZmZlckZvclwiO1xyXG5cclxuZnVuY3Rpb24gcHJvamVjdExvY2soc29sdXRpb246IFNvbHV0aW9uLCBwcm9qZWN0OiBQcm9qZWN0Vmlld01vZGVsPGFueT4sIGZpbGVQYXRoOiBzdHJpbmcpIHtcclxuICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgY29uc3Qgc3ViamVjdCA9IG5ldyBTdWJqZWN0PHN0cmluZz4oKTtcclxuICAgIGxldCBmaWxlID0gbmV3IEZpbGUoZmlsZVBhdGgpLFxyXG4gICAgICAgIG9uRGlkQ2hhbmdlID0gZmlsZS5vbkRpZENoYW5nZSgoKSA9PiBzdWJqZWN0Lm5leHQoZmlsZVBhdGgpKSxcclxuICAgICAgICBvbldpbGxUaHJvd1dhdGNoRXJyb3IgPSBmaWxlLm9uV2lsbFRocm93V2F0Y2hFcnJvcigoKSA9PiB7XHJcbiAgICAgICAgICAgIHN1YmplY3QubmV4dChmaWxlUGF0aCk7XHJcbiAgICAgICAgICAgIGRpc3Bvc2FibGUucmVtb3ZlKG9uRGlkQ2hhbmdlKTtcclxuICAgICAgICAgICAgb25EaWRDaGFuZ2UuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICBfLmRlbGF5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIG9uRGlkQ2hhbmdlID0gZmlsZS5vbkRpZENoYW5nZSgoKSA9PiBzdWJqZWN0Lm5leHQoZmlsZVBhdGgpKTtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuYWRkKG9uRGlkQ2hhbmdlKTtcclxuICAgICAgICAgICAgfSwgNTAwMCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgZGlzcG9zYWJsZS5hZGQob25EaWRDaGFuZ2UpO1xyXG4gICAgZGlzcG9zYWJsZS5hZGQob25XaWxsVGhyb3dXYXRjaEVycm9yKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIG9ic2VydmFibGU6IHN1YmplY3QudGhyb3R0bGVUaW1lKDMwMDAwKSxcclxuICAgICAgICBkaXNwb3NlOiAoKSA9PiBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxyXG4gICAgfTtcclxufVxyXG5cclxuY2xhc3MgRmlsZU1vbml0b3IgaW1wbGVtZW50cyBJRmVhdHVyZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIGZpbGVzTWFwID0gbmV3IFdlYWtNYXA8UHJvamVjdFZpZXdNb2RlbDxhbnk+LCBJRGlzcG9zYWJsZT4oKTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgY29uc3QgY2hhbmdlcyA9IGJ1ZmZlckZvcihPYnNlcnZhYmxlLm1lcmdlKE9tbmkubGlzdGVuZXIubW9kZWwucHJvamVjdEFkZGVkLCBPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RDaGFuZ2VkKVxyXG4gICAgICAgICAgICAubWFwKHByb2plY3QgPT4gKHsgcHJvamVjdCwgZmlsZVBhdGg6IHBhdGguam9pbihwcm9qZWN0LnBhdGgsIFwicHJvamVjdC5sb2NrLmpzb25cIikgfSkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoKHsgZmlsZVBhdGh9KSA9PiBmcy5leGlzdHNTeW5jKGZpbGVQYXRoKSlcclxuICAgICAgICAgICAgLmZsYXRNYXAoKHsgcHJvamVjdCwgZmlsZVBhdGh9KSA9PlxyXG4gICAgICAgICAgICAgICAgT21uaS5nZXRTb2x1dGlvbkZvclByb2plY3QocHJvamVjdCkubWFwKHNvbHV0aW9uID0+ICh7IHNvbHV0aW9uLCBwcm9qZWN0LCBmaWxlUGF0aCB9KSkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXguc29sdXRpb24pXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKCh7IHNvbHV0aW9uLCBwcm9qZWN0LCBmaWxlUGF0aCB9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5maWxlc01hcC5oYXMocHJvamVjdCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2ID0gdGhpcy5maWxlc01hcC5nZXQocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdi5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jayA9IHByb2plY3RMb2NrKHNvbHV0aW9uLCBwcm9qZWN0LCBmaWxlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGxvY2spO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maWxlc01hcC5zZXQocHJvamVjdCwgbG9jayk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9jay5vYnNlcnZhYmxlLm1hcChwYXRoID0+ICh7IHNvbHV0aW9uLCBmaWxlUGF0aCB9KSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5zaGFyZSgpLCAzMDAwMCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoY2hhbmdlc1xyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGNoYW5ncyA9PiB7XHJcbiAgICAgICAgICAgICAgICBfLmVhY2goXy5ncm91cEJ5KGNoYW5ncywgeCA9PiB4LnNvbHV0aW9uLnVuaXF1ZUlkKSwgY2hhbmcgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uID0gY2hhbmdbMF0uc29sdXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aHMgPSBfLnVuaXEoY2hhbmcubWFwKHggPT4geC5maWxlUGF0aCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvbHV0aW9uLmZpbGVzQ2hhbmdlZChwYXRocy5tYXAoeiA9PiAoeyBGaWxlTmFtZTogeiB9KSkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RSZW1vdmVkXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVkSXRlbSA9IHRoaXMuZmlsZXNNYXAuZ2V0KHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlbW92ZWRJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxlc01hcC5kZWxldGUocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZEl0ZW0uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9IFwiUHJvamVjdCBNb25pdG9yXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIk1vbml0b3JzIHByb2plY3QubG9jay5qc29uIGZpbGVzIGZvciBjaGFuZ2VzIG91dHNpZGUgb2YgYXRvbSwgYW5kIGtlZXBzIHRoZSBydW5uaW5nIHNvbHV0aW9uIGluIHN5bmNcIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGZpbGVNb25pdG9yID0gbmV3IEZpbGVNb25pdG9yO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
