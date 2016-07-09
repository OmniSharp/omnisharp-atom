"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AtomProjectTracker = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _lodash = require("lodash");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AtomProjectTracker = exports.AtomProjectTracker = function () {
    function AtomProjectTracker() {
        _classCallCheck(this, AtomProjectTracker);

        this._disposable = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvYXRvbS1wcm9qZWN0cy5qcyIsImxpYi9zZXJ2ZXIvYXRvbS1wcm9qZWN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztJQ0VBLGtCLFdBQUEsa0I7QUFBQSxrQ0FBQTtBQUFBOztBQUNZLGFBQUEsV0FBQSxHQUFjLDBDQUFkO0FBQ0EsYUFBQSxhQUFBLEdBQTBCLEVBQTFCO0FBQ0EsYUFBQSxhQUFBLEdBQWdCLG1CQUFoQjtBQUNBLGFBQUEsZUFBQSxHQUFrQixtQkFBbEI7QUF5Qlg7Ozs7bUNBbkJrQjtBQUFBOztBQUVYLGlCQUFLLFdBQUwsQ0FBaUIsS0FBSyxPQUFMLENBQWEsUUFBYixFQUFqQjtBQUNBLGlCQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsS0FBSyxPQUFMLENBQWEsZ0JBQWIsQ0FBOEIsVUFBQyxLQUFEO0FBQUEsdUJBQXFCLE1BQUssV0FBTCxDQUFpQixLQUFqQixDQUFyQjtBQUFBLGFBQTlCLENBQXJCO0FBQ0g7OztvQ0FFbUIsSyxFQUFlO0FBQy9CLGdCQUFNLGFBQWEsd0JBQVcsS0FBWCxFQUFrQixLQUFLLGFBQXZCLENBQW5CO0FBQ0EsZ0JBQU0sZUFBZSx3QkFBVyxLQUFLLGFBQWhCLEVBQStCLEtBQS9CLENBQXJCO0FBRitCO0FBQUE7QUFBQTs7QUFBQTtBQUkvQixxQ0FBb0IsVUFBcEI7QUFBQSx3QkFBUyxPQUFUOztBQUFnQyx5QkFBSyxhQUFMLENBQW1CLElBQW5CLENBQXdCLE9BQXhCO0FBQWhDO0FBSitCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBSy9CLHNDQUFvQixZQUFwQjtBQUFBLHdCQUFTLFFBQVQ7O0FBQWtDLHlCQUFLLGVBQUwsQ0FBcUIsSUFBckIsQ0FBMEIsUUFBMUI7QUFBbEM7QUFMK0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFPL0IsaUJBQUssYUFBTCxHQUFxQixLQUFyQjtBQUNIOzs7a0NBRWE7QUFDVixpQkFBSyxXQUFMLENBQWlCLE9BQWpCO0FBQ0g7Ozs0QkF0QmU7QUFBSyxtQkFBTyxLQUFLLGFBQVo7QUFBNEI7Ozs0QkFDL0I7QUFBSyxtQkFBTyxLQUFLLGVBQVo7QUFBOEI7Ozs0QkFDckM7QUFBSyxtQkFBTyxLQUFLLGFBQUwsQ0FBbUIsS0FBbkIsRUFBUDtBQUFvQyIsImZpbGUiOiJsaWIvc2VydmVyL2F0b20tcHJvamVjdHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgZGlmZmVyZW5jZSB9IGZyb20gXCJsb2Rhc2hcIjtcbmV4cG9ydCBjbGFzcyBBdG9tUHJvamVjdFRyYWNrZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fcHJvamVjdFBhdGhzID0gW107XG4gICAgICAgIHRoaXMuX2FkZGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuX3JlbW92ZWRTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICB9XG4gICAgZ2V0IGFkZGVkKCkgeyByZXR1cm4gdGhpcy5fYWRkZWRTdWJqZWN0OyB9XG4gICAgZ2V0IHJlbW92ZWQoKSB7IHJldHVybiB0aGlzLl9yZW1vdmVkU3ViamVjdDsgfVxuICAgIGdldCBwYXRocygpIHsgcmV0dXJuIHRoaXMuX3Byb2plY3RQYXRocy5zbGljZSgpOyB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlUGF0aHMoYXRvbS5wcm9qZWN0LmdldFBhdGhzKCkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocygocGF0aHMpID0+IHRoaXMudXBkYXRlUGF0aHMocGF0aHMpKSk7XG4gICAgfVxuICAgIHVwZGF0ZVBhdGhzKHBhdGhzKSB7XG4gICAgICAgIGNvbnN0IGFkZGVkUGF0aHMgPSBkaWZmZXJlbmNlKHBhdGhzLCB0aGlzLl9wcm9qZWN0UGF0aHMpO1xuICAgICAgICBjb25zdCByZW1vdmVkUGF0aHMgPSBkaWZmZXJlbmNlKHRoaXMuX3Byb2plY3RQYXRocywgcGF0aHMpO1xuICAgICAgICBmb3IgKGxldCBwcm9qZWN0IG9mIGFkZGVkUGF0aHMpXG4gICAgICAgICAgICB0aGlzLl9hZGRlZFN1YmplY3QubmV4dChwcm9qZWN0KTtcbiAgICAgICAgZm9yIChsZXQgcHJvamVjdCBvZiByZW1vdmVkUGF0aHMpXG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVkU3ViamVjdC5uZXh0KHByb2plY3QpO1xuICAgICAgICB0aGlzLl9wcm9qZWN0UGF0aHMgPSBwYXRocztcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge2RpZmZlcmVuY2V9IGZyb20gXCJsb2Rhc2hcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBBdG9tUHJvamVjdFRyYWNrZXIgaW1wbGVtZW50cyBJRGlzcG9zYWJsZSB7XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIHByaXZhdGUgX3Byb2plY3RQYXRoczogc3RyaW5nW10gPSBbXTtcclxuICAgIHByaXZhdGUgX2FkZGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0PHN0cmluZz4oKTtcclxuICAgIHByaXZhdGUgX3JlbW92ZWRTdWJqZWN0ID0gbmV3IFN1YmplY3Q8c3RyaW5nPigpO1xyXG5cclxuICAgIHB1YmxpYyBnZXQgYWRkZWQoKSB7IHJldHVybiB0aGlzLl9hZGRlZFN1YmplY3Q7IH1cclxuICAgIHB1YmxpYyBnZXQgcmVtb3ZlZCgpIHsgcmV0dXJuIHRoaXMuX3JlbW92ZWRTdWJqZWN0OyB9XHJcbiAgICBwdWJsaWMgZ2V0IHBhdGhzKCkgeyByZXR1cm4gdGhpcy5fcHJvamVjdFBhdGhzLnNsaWNlKCk7IH1cclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgLy8gbW9uaXRvciBhdG9tIHByb2plY3QgcGF0aHNcclxuICAgICAgICB0aGlzLnVwZGF0ZVBhdGhzKGF0b20ucHJvamVjdC5nZXRQYXRocygpKTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocygocGF0aHM6IHN0cmluZ1tdKSA9PiB0aGlzLnVwZGF0ZVBhdGhzKHBhdGhzKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlUGF0aHMocGF0aHM6IHN0cmluZ1tdKSB7XHJcbiAgICAgICAgY29uc3QgYWRkZWRQYXRocyA9IGRpZmZlcmVuY2UocGF0aHMsIHRoaXMuX3Byb2plY3RQYXRocyk7XHJcbiAgICAgICAgY29uc3QgcmVtb3ZlZFBhdGhzID0gZGlmZmVyZW5jZSh0aGlzLl9wcm9qZWN0UGF0aHMsIHBhdGhzKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcHJvamVjdCBvZiBhZGRlZFBhdGhzKSB0aGlzLl9hZGRlZFN1YmplY3QubmV4dChwcm9qZWN0KTtcclxuICAgICAgICBmb3IgKGxldCBwcm9qZWN0IG9mIHJlbW92ZWRQYXRocykgdGhpcy5fcmVtb3ZlZFN1YmplY3QubmV4dChwcm9qZWN0KTtcclxuXHJcbiAgICAgICAgdGhpcy5fcHJvamVjdFBhdGhzID0gcGF0aHM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
