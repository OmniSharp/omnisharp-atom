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
                var project = _ref2.project,
                    filePath = _ref2.filePath;
                return _omni.Omni.getSolutionForProject(project).map(function (solution) {
                    return { solution: solution, project: project, filePath: filePath };
                });
            }).filter(function (x) {
                return !!x.solution;
            }).flatMap(function (_ref3) {
                var solution = _ref3.solution,
                    project = _ref3.project,
                    filePath = _ref3.filePath;

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9wcm9qZWN0LWxvY2suanMiLCJsaWIvZmVhdHVyZXMvcHJvamVjdC1sb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQ0FZOztBRENaOztJQ0FZOztBRENaOztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FDSUEsU0FBQSxXQUFBLENBQXFCLFFBQXJCLEVBQXlDLE9BQXpDLEVBQXlFLFFBQXpFLEVBQXlGO0FBQ3JGLFFBQU0sYUFBYSx3Q0FBYixDQUQrRTtBQUVyRixRQUFNLFVBQVUsbUJBQVYsQ0FGK0U7QUFHckYsUUFBSSxPQUFPLGVBQVMsUUFBVCxDQUFQO1FBQ0EsY0FBYyxLQUFLLFdBQUwsQ0FBaUI7ZUFBTSxRQUFRLElBQVIsQ0FBYSxRQUFiO0tBQU4sQ0FBL0I7UUFDQSx3QkFBd0IsS0FBSyxxQkFBTCxDQUEyQixZQUFBO0FBQy9DLGdCQUFRLElBQVIsQ0FBYSxRQUFiLEVBRCtDO0FBRS9DLG1CQUFXLE1BQVgsQ0FBa0IsV0FBbEIsRUFGK0M7QUFHL0Msb0JBQVksT0FBWixHQUgrQztBQUkvQyx5QkFBRSxLQUFGLENBQVEsWUFBQTtBQUNKLDBCQUFjLEtBQUssV0FBTCxDQUFpQjt1QkFBTSxRQUFRLElBQVIsQ0FBYSxRQUFiO2FBQU4sQ0FBL0IsQ0FESTtBQUVKLHVCQUFXLEdBQVgsQ0FBZSxXQUFmLEVBRkk7U0FBQSxFQUdMLElBSEgsRUFKK0M7S0FBQSxDQUFuRCxDQUxpRjtBQWVyRixlQUFXLEdBQVgsQ0FBZSxXQUFmLEVBZnFGO0FBZ0JyRixlQUFXLEdBQVgsQ0FBZSxxQkFBZixFQWhCcUY7QUFrQnJGLFdBQU87QUFDSCxvQkFBWSxRQUFRLFlBQVIsQ0FBcUIsS0FBckIsQ0FBWjtBQUNBLGlCQUFTO21CQUFNLFdBQVcsT0FBWDtTQUFOO0tBRmIsQ0FsQnFGO0NBQXpGOztJQXdCQTtBQUFBLDJCQUFBOzs7QUFFWSxhQUFBLFFBQUEsR0FBVyxJQUFJLE9BQUos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T0FBaEIsR0FEVTs7Ozs7OztBQVNYLElBQU0sb0NBQWMsSUFBSSxXQUFKLEVBQWQiLCJmaWxlIjoibGliL2ZlYXR1cmVzL3Byb2plY3QtbG9jay5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBGaWxlIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCB7IGJ1ZmZlckZvciB9IGZyb20gXCIuLi9vcGVyYXRvcnMvYnVmZmVyRm9yXCI7XG5mdW5jdGlvbiBwcm9qZWN0TG9jayhzb2x1dGlvbiwgcHJvamVjdCwgZmlsZVBhdGgpIHtcbiAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICBjb25zdCBzdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICBsZXQgZmlsZSA9IG5ldyBGaWxlKGZpbGVQYXRoKSwgb25EaWRDaGFuZ2UgPSBmaWxlLm9uRGlkQ2hhbmdlKCgpID0+IHN1YmplY3QubmV4dChmaWxlUGF0aCkpLCBvbldpbGxUaHJvd1dhdGNoRXJyb3IgPSBmaWxlLm9uV2lsbFRocm93V2F0Y2hFcnJvcigoKSA9PiB7XG4gICAgICAgIHN1YmplY3QubmV4dChmaWxlUGF0aCk7XG4gICAgICAgIGRpc3Bvc2FibGUucmVtb3ZlKG9uRGlkQ2hhbmdlKTtcbiAgICAgICAgb25EaWRDaGFuZ2UuZGlzcG9zZSgpO1xuICAgICAgICBfLmRlbGF5KCgpID0+IHtcbiAgICAgICAgICAgIG9uRGlkQ2hhbmdlID0gZmlsZS5vbkRpZENoYW5nZSgoKSA9PiBzdWJqZWN0Lm5leHQoZmlsZVBhdGgpKTtcbiAgICAgICAgICAgIGRpc3Bvc2FibGUuYWRkKG9uRGlkQ2hhbmdlKTtcbiAgICAgICAgfSwgNTAwMCk7XG4gICAgfSk7XG4gICAgZGlzcG9zYWJsZS5hZGQob25EaWRDaGFuZ2UpO1xuICAgIGRpc3Bvc2FibGUuYWRkKG9uV2lsbFRocm93V2F0Y2hFcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb2JzZXJ2YWJsZTogc3ViamVjdC50aHJvdHRsZVRpbWUoMzAwMDApLFxuICAgICAgICBkaXNwb3NlOiAoKSA9PiBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgIH07XG59XG5jbGFzcyBGaWxlTW9uaXRvciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZmlsZXNNYXAgPSBuZXcgV2Vha01hcCgpO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlByb2plY3QgTW9uaXRvclwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJNb25pdG9ycyBwcm9qZWN0LmxvY2suanNvbiBmaWxlcyBmb3IgY2hhbmdlcyBvdXRzaWRlIG9mIGF0b20sIGFuZCBrZWVwcyB0aGUgcnVubmluZyBzb2x1dGlvbiBpbiBzeW5jXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBjaGFuZ2VzID0gYnVmZmVyRm9yKE9ic2VydmFibGUubWVyZ2UoT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0QWRkZWQsIE9tbmkubGlzdGVuZXIubW9kZWwucHJvamVjdENoYW5nZWQpXG4gICAgICAgICAgICAubWFwKHByb2plY3QgPT4gKHsgcHJvamVjdCwgZmlsZVBhdGg6IHBhdGguam9pbihwcm9qZWN0LnBhdGgsIFwicHJvamVjdC5sb2NrLmpzb25cIikgfSkpXG4gICAgICAgICAgICAuZmlsdGVyKCh7IGZpbGVQYXRoIH0pID0+IGZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpKVxuICAgICAgICAgICAgLmZsYXRNYXAoKHsgcHJvamVjdCwgZmlsZVBhdGggfSkgPT4gT21uaS5nZXRTb2x1dGlvbkZvclByb2plY3QocHJvamVjdCkubWFwKHNvbHV0aW9uID0+ICh7IHNvbHV0aW9uLCBwcm9qZWN0LCBmaWxlUGF0aCB9KSkpXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4LnNvbHV0aW9uKVxuICAgICAgICAgICAgLmZsYXRNYXAoKHsgc29sdXRpb24sIHByb2plY3QsIGZpbGVQYXRoIH0pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbGVzTWFwLmhhcyhwcm9qZWN0KSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmZpbGVzTWFwLmdldChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB2LmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGxvY2sgPSBwcm9qZWN0TG9jayhzb2x1dGlvbiwgcHJvamVjdCwgZmlsZVBhdGgpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChsb2NrKTtcbiAgICAgICAgICAgIHRoaXMuZmlsZXNNYXAuc2V0KHByb2plY3QsIGxvY2spO1xuICAgICAgICAgICAgcmV0dXJuIGxvY2sub2JzZXJ2YWJsZS5tYXAocGF0aCA9PiAoeyBzb2x1dGlvbiwgZmlsZVBhdGggfSkpO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLnNoYXJlKCksIDMwMDAwKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChjaGFuZ2VzXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGNoYW5ncyA9PiB7XG4gICAgICAgICAgICBfLmVhY2goXy5ncm91cEJ5KGNoYW5ncywgeCA9PiB4LnNvbHV0aW9uLnVuaXF1ZUlkKSwgY2hhbmcgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uID0gY2hhbmdbMF0uc29sdXRpb247XG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aHMgPSBfLnVuaXEoY2hhbmcubWFwKHggPT4geC5maWxlUGF0aCkpO1xuICAgICAgICAgICAgICAgIHNvbHV0aW9uLmZpbGVzQ2hhbmdlZChwYXRocy5tYXAoeiA9PiAoeyBGaWxlTmFtZTogeiB9KSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RSZW1vdmVkXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVtb3ZlZEl0ZW0gPSB0aGlzLmZpbGVzTWFwLmdldChwcm9qZWN0KTtcbiAgICAgICAgICAgIGlmIChyZW1vdmVkSXRlbSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlsZXNNYXAuZGVsZXRlKHByb2plY3QpO1xuICAgICAgICAgICAgICAgIHJlbW92ZWRJdGVtLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBmaWxlTW9uaXRvciA9IG5ldyBGaWxlTW9uaXRvcjtcbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtGaWxlfSBmcm9tIFwiYXRvbVwiO1xyXG5pbXBvcnQge1Byb2plY3RWaWV3TW9kZWx9IGZyb20gXCIuLi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsXCI7XHJcbmltcG9ydCB7U29sdXRpb259IGZyb20gXCIuLi9zZXJ2ZXIvc29sdXRpb25cIjtcclxuaW1wb3J0IHtidWZmZXJGb3J9IGZyb20gXCIuLi9vcGVyYXRvcnMvYnVmZmVyRm9yXCI7XHJcblxyXG5mdW5jdGlvbiBwcm9qZWN0TG9jayhzb2x1dGlvbjogU29sdXRpb24sIHByb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55PiwgZmlsZVBhdGg6IHN0cmluZykge1xyXG4gICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICBjb25zdCBzdWJqZWN0ID0gbmV3IFN1YmplY3Q8c3RyaW5nPigpO1xyXG4gICAgbGV0IGZpbGUgPSBuZXcgRmlsZShmaWxlUGF0aCksXHJcbiAgICAgICAgb25EaWRDaGFuZ2UgPSBmaWxlLm9uRGlkQ2hhbmdlKCgpID0+IHN1YmplY3QubmV4dChmaWxlUGF0aCkpLFxyXG4gICAgICAgIG9uV2lsbFRocm93V2F0Y2hFcnJvciA9IGZpbGUub25XaWxsVGhyb3dXYXRjaEVycm9yKCgpID0+IHtcclxuICAgICAgICAgICAgc3ViamVjdC5uZXh0KGZpbGVQYXRoKTtcclxuICAgICAgICAgICAgZGlzcG9zYWJsZS5yZW1vdmUob25EaWRDaGFuZ2UpO1xyXG4gICAgICAgICAgICBvbkRpZENoYW5nZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIF8uZGVsYXkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgb25EaWRDaGFuZ2UgPSBmaWxlLm9uRGlkQ2hhbmdlKCgpID0+IHN1YmplY3QubmV4dChmaWxlUGF0aCkpO1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5hZGQob25EaWRDaGFuZ2UpO1xyXG4gICAgICAgICAgICB9LCA1MDAwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICBkaXNwb3NhYmxlLmFkZChvbkRpZENoYW5nZSk7XHJcbiAgICBkaXNwb3NhYmxlLmFkZChvbldpbGxUaHJvd1dhdGNoRXJyb3IpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgb2JzZXJ2YWJsZTogc3ViamVjdC50aHJvdHRsZVRpbWUoMzAwMDApLFxyXG4gICAgICAgIGRpc3Bvc2U6ICgpID0+IGRpc3Bvc2FibGUuZGlzcG9zZSgpXHJcbiAgICB9O1xyXG59XHJcblxyXG5jbGFzcyBGaWxlTW9uaXRvciBpbXBsZW1lbnRzIElGZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgZmlsZXNNYXAgPSBuZXcgV2Vha01hcDxQcm9qZWN0Vmlld01vZGVsPGFueT4sIElEaXNwb3NhYmxlPigpO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBjaGFuZ2VzID0gYnVmZmVyRm9yKE9ic2VydmFibGUubWVyZ2UoT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0QWRkZWQsIE9tbmkubGlzdGVuZXIubW9kZWwucHJvamVjdENoYW5nZWQpXHJcbiAgICAgICAgICAgIC5tYXAocHJvamVjdCA9PiAoeyBwcm9qZWN0LCBmaWxlUGF0aDogcGF0aC5qb2luKHByb2plY3QucGF0aCwgXCJwcm9qZWN0LmxvY2suanNvblwiKSB9KSlcclxuICAgICAgICAgICAgLmZpbHRlcigoeyBmaWxlUGF0aH0pID0+IGZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpKVxyXG4gICAgICAgICAgICAuZmxhdE1hcCgoeyBwcm9qZWN0LCBmaWxlUGF0aH0pID0+XHJcbiAgICAgICAgICAgICAgICBPbW5pLmdldFNvbHV0aW9uRm9yUHJvamVjdChwcm9qZWN0KS5tYXAoc29sdXRpb24gPT4gKHsgc29sdXRpb24sIHByb2plY3QsIGZpbGVQYXRoIH0pKSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheC5zb2x1dGlvbilcclxuICAgICAgICAgICAgLmZsYXRNYXAoKHsgc29sdXRpb24sIHByb2plY3QsIGZpbGVQYXRoIH0pID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpbGVzTWFwLmhhcyhwcm9qZWN0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmZpbGVzTWFwLmdldChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB2LmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2NrID0gcHJvamVjdExvY2soc29sdXRpb24sIHByb2plY3QsIGZpbGVQYXRoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQobG9jayk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGVzTWFwLnNldChwcm9qZWN0LCBsb2NrKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsb2NrLm9ic2VydmFibGUubWFwKHBhdGggPT4gKHsgc29sdXRpb24sIGZpbGVQYXRoIH0pKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnNoYXJlKCksIDMwMDAwKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChjaGFuZ2VzXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY2hhbmdzID0+IHtcclxuICAgICAgICAgICAgICAgIF8uZWFjaChfLmdyb3VwQnkoY2hhbmdzLCB4ID0+IHguc29sdXRpb24udW5pcXVlSWQpLCBjaGFuZyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc29sdXRpb24gPSBjaGFuZ1swXS5zb2x1dGlvbjtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRocyA9IF8udW5pcShjaGFuZy5tYXAoeCA9PiB4LmZpbGVQYXRoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29sdXRpb24uZmlsZXNDaGFuZ2VkKHBhdGhzLm1hcCh6ID0+ICh7IEZpbGVOYW1lOiB6IH0pKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubW9kZWwucHJvamVjdFJlbW92ZWRcclxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZWRJdGVtID0gdGhpcy5maWxlc01hcC5nZXQocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVtb3ZlZEl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGVzTWFwLmRlbGV0ZShwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICByZW1vdmVkSXRlbS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJQcm9qZWN0IE1vbml0b3JcIjtcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiTW9uaXRvcnMgcHJvamVjdC5sb2NrLmpzb24gZmlsZXMgZm9yIGNoYW5nZXMgb3V0c2lkZSBvZiBhdG9tLCBhbmQga2VlcHMgdGhlIHJ1bm5pbmcgc29sdXRpb24gaW4gc3luY1wiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZmlsZU1vbml0b3IgPSBuZXcgRmlsZU1vbml0b3I7XHJcbiJdfQ==
