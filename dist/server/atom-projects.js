'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AtomProjectTracker = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AtomProjectTracker = exports.AtomProjectTracker = function () {
    function AtomProjectTracker() {
        _classCallCheck(this, AtomProjectTracker);

        this._disposable = new _tsDisposables.CompositeDisposable();
        this._projectPaths = [];
        this._addedSubject = new _rxjs.Subject();
        this._removedSubject = new _rxjs.Subject();
    }

    _createClass(AtomProjectTracker, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.updatePaths(atom.project.getPaths());
            this._disposable.add(atom.project.onDidChangePaths(function (paths) {
                return _this.updatePaths(paths);
            }));
        }
    }, {
        key: 'updatePaths',
        value: function updatePaths(paths) {
            var addedPaths = (0, _lodash.difference)(paths, this._projectPaths);
            var removedPaths = (0, _lodash.difference)(this._projectPaths, paths);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = addedPaths[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var project = _step.value;

                    this._addedSubject.next(project);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = removedPaths[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _project = _step2.value;

                    this._removedSubject.next(_project);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            this._projectPaths = paths;
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this._disposable.dispose();
        }
    }, {
        key: 'added',
        get: function get() {
            return this._addedSubject;
        }
    }, {
        key: 'removed',
        get: function get() {
            return this._removedSubject;
        }
    }, {
        key: 'paths',
        get: function get() {
            return this._projectPaths.slice();
        }
    }]);

    return AtomProjectTracker;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvYXRvbS1wcm9qZWN0cy50cyJdLCJuYW1lcyI6WyJBdG9tUHJvamVjdFRyYWNrZXIiLCJfZGlzcG9zYWJsZSIsIl9wcm9qZWN0UGF0aHMiLCJfYWRkZWRTdWJqZWN0IiwiX3JlbW92ZWRTdWJqZWN0IiwidXBkYXRlUGF0aHMiLCJhdG9tIiwicHJvamVjdCIsImdldFBhdGhzIiwiYWRkIiwib25EaWRDaGFuZ2VQYXRocyIsInBhdGhzIiwiYWRkZWRQYXRocyIsInJlbW92ZWRQYXRocyIsIm5leHQiLCJkaXNwb3NlIiwic2xpY2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0lBRU1BLGtCLFdBQUFBLGtCO0FBQU4sa0NBQUE7QUFBQTs7QUFDWSxhQUFBQyxXQUFBLEdBQWMsd0NBQWQ7QUFDQSxhQUFBQyxhQUFBLEdBQTBCLEVBQTFCO0FBQ0EsYUFBQUMsYUFBQSxHQUFnQixtQkFBaEI7QUFDQSxhQUFBQyxlQUFBLEdBQWtCLG1CQUFsQjtBQXlCWDs7OzttQ0FuQmtCO0FBQUE7O0FBRVgsaUJBQUtDLFdBQUwsQ0FBaUJDLEtBQUtDLE9BQUwsQ0FBYUMsUUFBYixFQUFqQjtBQUNBLGlCQUFLUCxXQUFMLENBQWlCUSxHQUFqQixDQUFxQkgsS0FBS0MsT0FBTCxDQUFhRyxnQkFBYixDQUE4QixVQUFDQyxLQUFEO0FBQUEsdUJBQXFCLE1BQUtOLFdBQUwsQ0FBaUJNLEtBQWpCLENBQXJCO0FBQUEsYUFBOUIsQ0FBckI7QUFDSDs7O29DQUVtQkEsSyxFQUFlO0FBQy9CLGdCQUFNQyxhQUFhLHdCQUFXRCxLQUFYLEVBQWtCLEtBQUtULGFBQXZCLENBQW5CO0FBQ0EsZ0JBQU1XLGVBQWUsd0JBQVcsS0FBS1gsYUFBaEIsRUFBK0JTLEtBQS9CLENBQXJCO0FBRitCO0FBQUE7QUFBQTs7QUFBQTtBQUkvQixxQ0FBc0JDLFVBQXRCO0FBQUEsd0JBQVdMLE9BQVg7O0FBQWtDLHlCQUFLSixhQUFMLENBQW1CVyxJQUFuQixDQUF3QlAsT0FBeEI7QUFBbEM7QUFKK0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFLL0Isc0NBQXNCTSxZQUF0QjtBQUFBLHdCQUFXTixRQUFYOztBQUFvQyx5QkFBS0gsZUFBTCxDQUFxQlUsSUFBckIsQ0FBMEJQLFFBQTFCO0FBQXBDO0FBTCtCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBTy9CLGlCQUFLTCxhQUFMLEdBQXFCUyxLQUFyQjtBQUNIOzs7a0NBRWE7QUFDVixpQkFBS1YsV0FBTCxDQUFpQmMsT0FBakI7QUFDSDs7OzRCQXRCZTtBQUFLLG1CQUFPLEtBQUtaLGFBQVo7QUFBNEI7Ozs0QkFDL0I7QUFBSyxtQkFBTyxLQUFLQyxlQUFaO0FBQThCOzs7NEJBQ3JDO0FBQUssbUJBQU8sS0FBS0YsYUFBTCxDQUFtQmMsS0FBbkIsRUFBUDtBQUFvQyIsImZpbGUiOiJsaWIvc2VydmVyL2F0b20tcHJvamVjdHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2RpZmZlcmVuY2V9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7U3ViamVjdH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBBdG9tUHJvamVjdFRyYWNrZXIgaW1wbGVtZW50cyBJRGlzcG9zYWJsZSB7XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIHByaXZhdGUgX3Byb2plY3RQYXRoczogc3RyaW5nW10gPSBbXTtcclxuICAgIHByaXZhdGUgX2FkZGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0PHN0cmluZz4oKTtcclxuICAgIHByaXZhdGUgX3JlbW92ZWRTdWJqZWN0ID0gbmV3IFN1YmplY3Q8c3RyaW5nPigpO1xyXG5cclxuICAgIHB1YmxpYyBnZXQgYWRkZWQoKSB7IHJldHVybiB0aGlzLl9hZGRlZFN1YmplY3Q7IH1cclxuICAgIHB1YmxpYyBnZXQgcmVtb3ZlZCgpIHsgcmV0dXJuIHRoaXMuX3JlbW92ZWRTdWJqZWN0OyB9XHJcbiAgICBwdWJsaWMgZ2V0IHBhdGhzKCkgeyByZXR1cm4gdGhpcy5fcHJvamVjdFBhdGhzLnNsaWNlKCk7IH1cclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgLy8gbW9uaXRvciBhdG9tIHByb2plY3QgcGF0aHNcclxuICAgICAgICB0aGlzLnVwZGF0ZVBhdGhzKGF0b20ucHJvamVjdC5nZXRQYXRocygpKTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocygocGF0aHM6IHN0cmluZ1tdKSA9PiB0aGlzLnVwZGF0ZVBhdGhzKHBhdGhzKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlUGF0aHMocGF0aHM6IHN0cmluZ1tdKSB7XHJcbiAgICAgICAgY29uc3QgYWRkZWRQYXRocyA9IGRpZmZlcmVuY2UocGF0aHMsIHRoaXMuX3Byb2plY3RQYXRocyk7XHJcbiAgICAgICAgY29uc3QgcmVtb3ZlZFBhdGhzID0gZGlmZmVyZW5jZSh0aGlzLl9wcm9qZWN0UGF0aHMsIHBhdGhzKTtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIGFkZGVkUGF0aHMpIHRoaXMuX2FkZGVkU3ViamVjdC5uZXh0KHByb2plY3QpO1xyXG4gICAgICAgIGZvciAoY29uc3QgcHJvamVjdCBvZiByZW1vdmVkUGF0aHMpIHRoaXMuX3JlbW92ZWRTdWJqZWN0Lm5leHQocHJvamVjdCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3Byb2plY3RQYXRocyA9IHBhdGhzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==
