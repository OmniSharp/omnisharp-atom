'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fileMonitor = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atom = require('atom');

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _lodash = require('lodash');

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function projectLock(solution, project, filePath) {
    var disposable = new _tsDisposables.CompositeDisposable();
    var subject = new _rxjs.Subject();
    var file = new _atom.File(filePath);
    var onDidChange = file.onDidChange(function () {
        return subject.next(filePath);
    });
    var onWillThrowWatchError = file.onWillThrowWatchError(function () {
        subject.next(filePath);
        disposable.remove(onDidChange);
        onDidChange.dispose();
        (0, _lodash.delay)(function () {
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

        this.required = false;
        this.title = 'Project Monitor';
        this.description = 'Monitors project.lock.json files for changes outside of atom, and keeps the running solution in sync';
        this.filesMap = new WeakMap();
    }

    _createClass(FileMonitor, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            var changes = _rxjs.Observable.merge(_omni.Omni.listener.model.projectAdded, _omni.Omni.listener.model.projectChanged).map(function (project) {
                return { project: project, filePath: path.join(project.path, 'project.lock.json') };
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
            }).share();
            this.disposable.add(changes.subscribe(function (change) {
                var solution = change[0].solution;
                solution.filesChanged({ FileName: change });
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
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return FileMonitor;
}();

var fileMonitor = exports.fileMonitor = new FileMonitor();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9wcm9qZWN0LWxvY2sudHMiXSwibmFtZXMiOlsiZnMiLCJwYXRoIiwicHJvamVjdExvY2siLCJzb2x1dGlvbiIsInByb2plY3QiLCJmaWxlUGF0aCIsImRpc3Bvc2FibGUiLCJzdWJqZWN0IiwiZmlsZSIsIm9uRGlkQ2hhbmdlIiwibmV4dCIsIm9uV2lsbFRocm93V2F0Y2hFcnJvciIsInJlbW92ZSIsImRpc3Bvc2UiLCJhZGQiLCJvYnNlcnZhYmxlIiwidGhyb3R0bGVUaW1lIiwiRmlsZU1vbml0b3IiLCJyZXF1aXJlZCIsInRpdGxlIiwiZGVzY3JpcHRpb24iLCJmaWxlc01hcCIsIldlYWtNYXAiLCJjaGFuZ2VzIiwibWVyZ2UiLCJsaXN0ZW5lciIsIm1vZGVsIiwicHJvamVjdEFkZGVkIiwicHJvamVjdENoYW5nZWQiLCJtYXAiLCJqb2luIiwiZmlsdGVyIiwiZXhpc3RzU3luYyIsImZsYXRNYXAiLCJnZXRTb2x1dGlvbkZvclByb2plY3QiLCJ4IiwiaGFzIiwidiIsImdldCIsImxvY2siLCJzZXQiLCJzaGFyZSIsInN1YnNjcmliZSIsImNoYW5nZSIsImZpbGVzQ2hhbmdlZCIsIkZpbGVOYW1lIiwicHJvamVjdFJlbW92ZWQiLCJyZW1vdmVkSXRlbSIsImRlbGV0ZSIsImZpbGVNb25pdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7SUFBWUEsRTs7QUFDWjs7QUFDQTs7SUFBWUMsSTs7QUFDWjs7QUFDQTs7QUFDQTs7Ozs7O0FBSUEsU0FBQUMsV0FBQSxDQUFxQkMsUUFBckIsRUFBeUNDLE9BQXpDLEVBQXlFQyxRQUF6RSxFQUF5RjtBQUNyRixRQUFNQyxhQUFhLHdDQUFuQjtBQUNBLFFBQU1DLFVBQVUsbUJBQWhCO0FBQ0EsUUFBTUMsT0FBTyxlQUFTSCxRQUFULENBQWI7QUFDQSxRQUFJSSxjQUFjRCxLQUFLQyxXQUFMLENBQWlCO0FBQUEsZUFBTUYsUUFBUUcsSUFBUixDQUFhTCxRQUFiLENBQU47QUFB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QUFDSCxhQWhCVyxFQWlCWG9DLEtBakJXLEVBQWhCO0FBbUJBLGlCQUFLbkMsVUFBTCxDQUFnQlEsR0FBaEIsQ0FBb0JTLFFBQ2ZtQixTQURlLENBQ0wsa0JBQU07QUFDYixvQkFBTXZDLFdBQVd3QyxPQUFPLENBQVAsRUFBVXhDLFFBQTNCO0FBQ0FBLHlCQUFTeUMsWUFBVCxDQUFzQixFQUFFQyxVQUFVRixNQUFaLEVBQXRCO0FBQ0gsYUFKZSxDQUFwQjtBQU1BLGlCQUFLckMsVUFBTCxDQUFnQlEsR0FBaEIsQ0FBb0IsV0FBS1csUUFBTCxDQUFjQyxLQUFkLENBQW9Cb0IsY0FBcEIsQ0FDZkosU0FEZSxDQUNMLG1CQUFPO0FBQ2Qsb0JBQU1LLGNBQWMsTUFBSzFCLFFBQUwsQ0FBY2lCLEdBQWQsQ0FBa0JsQyxPQUFsQixDQUFwQjtBQUNBLG9CQUFJMkMsV0FBSixFQUFpQjtBQUNiLDBCQUFLMUIsUUFBTCxDQUFjMkIsTUFBZCxDQUFxQjVDLE9BQXJCO0FBQ0EyQyxnQ0FBWWxDLE9BQVo7QUFDSDtBQUNKLGFBUGUsQ0FBcEI7QUFRSDs7O2tDQUVhO0FBQ1YsaUJBQUtQLFVBQUwsQ0FBZ0JPLE9BQWhCO0FBQ0g7Ozs7OztBQUlFLElBQU1vQyxvQ0FBYyxJQUFJaEMsV0FBSixFQUFwQiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvcHJvamVjdC1sb2NrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRmlsZSB9IGZyb20gJ2F0b20nO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCB7IGRlbGF5LCBlYWNoLCBncm91cEJ5LCBtYXAsIHVuaXEgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0IH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIElEaXNwb3NhYmxlIH0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5pbXBvcnQgeyBPbW5pIH0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5pbXBvcnQgeyBQcm9qZWN0Vmlld01vZGVsIH0gZnJvbSAnLi4vc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbCc7XHJcbmltcG9ydCB7IFNvbHV0aW9uIH0gZnJvbSAnLi4vc2VydmVyL3NvbHV0aW9uJztcclxuXHJcbmZ1bmN0aW9uIHByb2plY3RMb2NrKHNvbHV0aW9uOiBTb2x1dGlvbiwgcHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+LCBmaWxlUGF0aDogc3RyaW5nKSB7XHJcbiAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgU3ViamVjdDxzdHJpbmc+KCk7XHJcbiAgICBjb25zdCBmaWxlID0gbmV3IEZpbGUoZmlsZVBhdGgpO1xyXG4gICAgbGV0IG9uRGlkQ2hhbmdlID0gZmlsZS5vbkRpZENoYW5nZSgoKSA9PiBzdWJqZWN0Lm5leHQoZmlsZVBhdGgpKTtcclxuICAgIGNvbnN0IG9uV2lsbFRocm93V2F0Y2hFcnJvciA9IGZpbGUub25XaWxsVGhyb3dXYXRjaEVycm9yKCgpID0+IHtcclxuICAgICAgICBzdWJqZWN0Lm5leHQoZmlsZVBhdGgpO1xyXG4gICAgICAgIGRpc3Bvc2FibGUucmVtb3ZlKG9uRGlkQ2hhbmdlKTtcclxuICAgICAgICBvbkRpZENoYW5nZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgZGVsYXkoKCkgPT4ge1xyXG4gICAgICAgICAgICBvbkRpZENoYW5nZSA9IGZpbGUub25EaWRDaGFuZ2UoKCkgPT4gc3ViamVjdC5uZXh0KGZpbGVQYXRoKSk7XHJcbiAgICAgICAgICAgIGRpc3Bvc2FibGUuYWRkKG9uRGlkQ2hhbmdlKTtcclxuICAgICAgICB9LCA1MDAwKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGRpc3Bvc2FibGUuYWRkKG9uRGlkQ2hhbmdlKTtcclxuICAgIGRpc3Bvc2FibGUuYWRkKG9uV2lsbFRocm93V2F0Y2hFcnJvcik7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBvYnNlcnZhYmxlOiBzdWJqZWN0LnRocm90dGxlVGltZSgzMDAwMCksXHJcbiAgICAgICAgZGlzcG9zZTogKCkgPT4gZGlzcG9zYWJsZS5kaXNwb3NlKClcclxuICAgIH07XHJcbn1cclxuXHJcbmNsYXNzIEZpbGVNb25pdG9yIGltcGxlbWVudHMgSUZlYXR1cmUge1xyXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSAnUHJvamVjdCBNb25pdG9yJztcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9ICdNb25pdG9ycyBwcm9qZWN0LmxvY2suanNvbiBmaWxlcyBmb3IgY2hhbmdlcyBvdXRzaWRlIG9mIGF0b20sIGFuZCBrZWVwcyB0aGUgcnVubmluZyBzb2x1dGlvbiBpbiBzeW5jJztcclxuXHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIGZpbGVzTWFwID0gbmV3IFdlYWtNYXA8UHJvamVjdFZpZXdNb2RlbDxhbnk+LCBJRGlzcG9zYWJsZT4oKTtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgY29uc3QgY2hhbmdlcyA9IE9ic2VydmFibGUubWVyZ2UoT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0QWRkZWQsIE9tbmkubGlzdGVuZXIubW9kZWwucHJvamVjdENoYW5nZWQpXHJcbiAgICAgICAgICAgIC5tYXAocHJvamVjdCA9PiAoeyBwcm9qZWN0LCBmaWxlUGF0aDogcGF0aC5qb2luKHByb2plY3QucGF0aCwgJ3Byb2plY3QubG9jay5qc29uJykgfSkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoKHsgZmlsZVBhdGggfSkgPT4gZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKCh7IHByb2plY3QsIGZpbGVQYXRoIH0pID0+XHJcbiAgICAgICAgICAgICAgICBPbW5pLmdldFNvbHV0aW9uRm9yUHJvamVjdChwcm9qZWN0KS5tYXAoc29sdXRpb24gPT4gKHsgc29sdXRpb24sIHByb2plY3QsIGZpbGVQYXRoIH0pKSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheC5zb2x1dGlvbilcclxuICAgICAgICAgICAgLmZsYXRNYXAoKHsgc29sdXRpb24sIHByb2plY3QsIGZpbGVQYXRoIH0pID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpbGVzTWFwLmhhcyhwcm9qZWN0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmZpbGVzTWFwLmdldChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB2LmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2NrID0gcHJvamVjdExvY2soc29sdXRpb24sIHByb2plY3QsIGZpbGVQYXRoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQobG9jayk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGVzTWFwLnNldChwcm9qZWN0LCBsb2NrKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsb2NrLm9ic2VydmFibGUubWFwKHBhdGggPT4gKHsgc29sdXRpb24sIGZpbGVQYXRoIH0pKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnNoYXJlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoY2hhbmdlc1xyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGNoYW5nZSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzb2x1dGlvbiA9IGNoYW5nZVswXS5zb2x1dGlvbjtcclxuICAgICAgICAgICAgICAgIHNvbHV0aW9uLmZpbGVzQ2hhbmdlZCh7IEZpbGVOYW1lOiBjaGFuZ2UgfSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RSZW1vdmVkXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVkSXRlbSA9IHRoaXMuZmlsZXNNYXAuZ2V0KHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlbW92ZWRJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxlc01hcC5kZWxldGUocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZEl0ZW0uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmV4cG9ydC1uYW1lXHJcbmV4cG9ydCBjb25zdCBmaWxlTW9uaXRvciA9IG5ldyBGaWxlTW9uaXRvcigpO1xyXG4iXX0=
