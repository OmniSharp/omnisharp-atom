"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AtomProjectTracker = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

var _lodash = require("lodash");

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
        key: "activate",
        value: function activate() {
            var _this = this;

            this.updatePaths(atom.project.getPaths());
            this._disposable.add(atom.project.onDidChangePaths(function (paths) {
                return _this.updatePaths(paths);
            }));
        }
    }, {
        key: "updatePaths",
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
        key: "dispose",
        value: function dispose() {
            this._disposable.dispose();
        }
    }, {
        key: "added",
        get: function get() {
            return this._addedSubject;
        }
    }, {
        key: "removed",
        get: function get() {
            return this._removedSubject;
        }
    }, {
        key: "paths",
        get: function get() {
            return this._projectPaths.slice();
        }
    }]);

    return AtomProjectTracker;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvYXRvbS1wcm9qZWN0cy5qcyIsImxpYi9zZXJ2ZXIvYXRvbS1wcm9qZWN0cy50cyJdLCJuYW1lcyI6WyJBdG9tUHJvamVjdFRyYWNrZXIiLCJfZGlzcG9zYWJsZSIsIl9wcm9qZWN0UGF0aHMiLCJfYWRkZWRTdWJqZWN0IiwiX3JlbW92ZWRTdWJqZWN0IiwidXBkYXRlUGF0aHMiLCJhdG9tIiwicHJvamVjdCIsImdldFBhdGhzIiwiYWRkIiwib25EaWRDaGFuZ2VQYXRocyIsInBhdGhzIiwiYWRkZWRQYXRocyIsInJlbW92ZWRQYXRocyIsIm5leHQiLCJkaXNwb3NlIiwic2xpY2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0lDRUFBLGtCLFdBQUFBLGtCO0FBQUEsa0NBQUE7QUFBQTs7QUFDWSxhQUFBQyxXQUFBLEdBQWMsd0NBQWQ7QUFDQSxhQUFBQyxhQUFBLEdBQTBCLEVBQTFCO0FBQ0EsYUFBQUMsYUFBQSxHQUFnQixtQkFBaEI7QUFDQSxhQUFBQyxlQUFBLEdBQWtCLG1CQUFsQjtBQXlCWDs7OzttQ0FuQmtCO0FBQUE7O0FBRVgsaUJBQUtDLFdBQUwsQ0FBaUJDLEtBQUtDLE9BQUwsQ0FBYUMsUUFBYixFQUFqQjtBQUNBLGlCQUFLUCxXQUFMLENBQWlCUSxHQUFqQixDQUFxQkgsS0FBS0MsT0FBTCxDQUFhRyxnQkFBYixDQUE4QixVQUFDQyxLQUFEO0FBQUEsdUJBQXFCLE1BQUtOLFdBQUwsQ0FBaUJNLEtBQWpCLENBQXJCO0FBQUEsYUFBOUIsQ0FBckI7QUFDSDs7O29DQUVtQkEsSyxFQUFlO0FBQy9CLGdCQUFNQyxhQUFhLHdCQUFXRCxLQUFYLEVBQWtCLEtBQUtULGFBQXZCLENBQW5CO0FBQ0EsZ0JBQU1XLGVBQWUsd0JBQVcsS0FBS1gsYUFBaEIsRUFBK0JTLEtBQS9CLENBQXJCO0FBRitCO0FBQUE7QUFBQTs7QUFBQTtBQUkvQixxQ0FBb0JDLFVBQXBCO0FBQUEsd0JBQVNMLE9BQVQ7O0FBQWdDLHlCQUFLSixhQUFMLENBQW1CVyxJQUFuQixDQUF3QlAsT0FBeEI7QUFBaEM7QUFKK0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFLL0Isc0NBQW9CTSxZQUFwQjtBQUFBLHdCQUFTTixRQUFUOztBQUFrQyx5QkFBS0gsZUFBTCxDQUFxQlUsSUFBckIsQ0FBMEJQLFFBQTFCO0FBQWxDO0FBTCtCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBTy9CLGlCQUFLTCxhQUFMLEdBQXFCUyxLQUFyQjtBQUNIOzs7a0NBRWE7QUFDVixpQkFBS1YsV0FBTCxDQUFpQmMsT0FBakI7QUFDSDs7OzRCQXRCZTtBQUFLLG1CQUFPLEtBQUtaLGFBQVo7QUFBNEI7Ozs0QkFDL0I7QUFBSyxtQkFBTyxLQUFLQyxlQUFaO0FBQThCOzs7NEJBQ3JDO0FBQUssbUJBQU8sS0FBS0YsYUFBTCxDQUFtQmMsS0FBbkIsRUFBUDtBQUFvQyIsImZpbGUiOiJsaWIvc2VydmVyL2F0b20tcHJvamVjdHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IGRpZmZlcmVuY2UgfSBmcm9tIFwibG9kYXNoXCI7XG5leHBvcnQgY2xhc3MgQXRvbVByb2plY3RUcmFja2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX3Byb2plY3RQYXRocyA9IFtdO1xuICAgICAgICB0aGlzLl9hZGRlZFN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICB0aGlzLl9yZW1vdmVkU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgfVxuICAgIGdldCBhZGRlZCgpIHsgcmV0dXJuIHRoaXMuX2FkZGVkU3ViamVjdDsgfVxuICAgIGdldCByZW1vdmVkKCkgeyByZXR1cm4gdGhpcy5fcmVtb3ZlZFN1YmplY3Q7IH1cbiAgICBnZXQgcGF0aHMoKSB7IHJldHVybiB0aGlzLl9wcm9qZWN0UGF0aHMuc2xpY2UoKTsgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZVBhdGhzKGF0b20ucHJvamVjdC5nZXRQYXRocygpKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHMoKHBhdGhzKSA9PiB0aGlzLnVwZGF0ZVBhdGhzKHBhdGhzKSkpO1xuICAgIH1cbiAgICB1cGRhdGVQYXRocyhwYXRocykge1xuICAgICAgICBjb25zdCBhZGRlZFBhdGhzID0gZGlmZmVyZW5jZShwYXRocywgdGhpcy5fcHJvamVjdFBhdGhzKTtcbiAgICAgICAgY29uc3QgcmVtb3ZlZFBhdGhzID0gZGlmZmVyZW5jZSh0aGlzLl9wcm9qZWN0UGF0aHMsIHBhdGhzKTtcbiAgICAgICAgZm9yIChsZXQgcHJvamVjdCBvZiBhZGRlZFBhdGhzKVxuICAgICAgICAgICAgdGhpcy5fYWRkZWRTdWJqZWN0Lm5leHQocHJvamVjdCk7XG4gICAgICAgIGZvciAobGV0IHByb2plY3Qgb2YgcmVtb3ZlZFBhdGhzKVxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlZFN1YmplY3QubmV4dChwcm9qZWN0KTtcbiAgICAgICAgdGhpcy5fcHJvamVjdFBhdGhzID0gcGF0aHM7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7U3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7ZGlmZmVyZW5jZX0gZnJvbSBcImxvZGFzaFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEF0b21Qcm9qZWN0VHJhY2tlciBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgcHJpdmF0ZSBfcHJvamVjdFBhdGhzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBfYWRkZWRTdWJqZWN0ID0gbmV3IFN1YmplY3Q8c3RyaW5nPigpO1xyXG4gICAgcHJpdmF0ZSBfcmVtb3ZlZFN1YmplY3QgPSBuZXcgU3ViamVjdDxzdHJpbmc+KCk7XHJcblxyXG4gICAgcHVibGljIGdldCBhZGRlZCgpIHsgcmV0dXJuIHRoaXMuX2FkZGVkU3ViamVjdDsgfVxyXG4gICAgcHVibGljIGdldCByZW1vdmVkKCkgeyByZXR1cm4gdGhpcy5fcmVtb3ZlZFN1YmplY3Q7IH1cclxuICAgIHB1YmxpYyBnZXQgcGF0aHMoKSB7IHJldHVybiB0aGlzLl9wcm9qZWN0UGF0aHMuc2xpY2UoKTsgfVxyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICAvLyBtb25pdG9yIGF0b20gcHJvamVjdCBwYXRoc1xyXG4gICAgICAgIHRoaXMudXBkYXRlUGF0aHMoYXRvbS5wcm9qZWN0LmdldFBhdGhzKCkpO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzKChwYXRoczogc3RyaW5nW10pID0+IHRoaXMudXBkYXRlUGF0aHMocGF0aHMpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVQYXRocyhwYXRoczogc3RyaW5nW10pIHtcclxuICAgICAgICBjb25zdCBhZGRlZFBhdGhzID0gZGlmZmVyZW5jZShwYXRocywgdGhpcy5fcHJvamVjdFBhdGhzKTtcclxuICAgICAgICBjb25zdCByZW1vdmVkUGF0aHMgPSBkaWZmZXJlbmNlKHRoaXMuX3Byb2plY3RQYXRocywgcGF0aHMpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBwcm9qZWN0IG9mIGFkZGVkUGF0aHMpIHRoaXMuX2FkZGVkU3ViamVjdC5uZXh0KHByb2plY3QpO1xyXG4gICAgICAgIGZvciAobGV0IHByb2plY3Qgb2YgcmVtb3ZlZFBhdGhzKSB0aGlzLl9yZW1vdmVkU3ViamVjdC5uZXh0KHByb2plY3QpO1xyXG5cclxuICAgICAgICB0aGlzLl9wcm9qZWN0UGF0aHMgPSBwYXRocztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
