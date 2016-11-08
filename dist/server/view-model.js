"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ViewModel = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omnisharpClient = require("omnisharp-client");

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

var _path = require("path");

var _projectViewModel = require("./project-view-model");

var _outputMessageElement = require("../views/output-message-element");

var _bufferFor = require("../operators/bufferFor");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fastdom = require("fastdom");

var ViewModel = exports.ViewModel = function () {
    function ViewModel(_solution) {
        var _this = this;

        _classCallCheck(this, ViewModel);

        this._solution = _solution;
        this.disposable = new _tsDisposables.CompositeDisposable();
        this.output = [];
        this.outputElement = document.createElement("div");
        this.diagnosticsByFile = new Map();
        this.diagnosticCounts = { error: 0, warning: 0, hidden: 0 };
        this.errors = 0;
        this.warnings = 0;
        this.hidden = 0;
        this.packageSources = [];
        this.projects = [];
        this._projectAddedStream = new _rxjs.Subject();
        this._projectRemovedStream = new _rxjs.Subject();
        this._projectChangedStream = new _rxjs.Subject();
        this._stateStream = new _rxjs.ReplaySubject(1);
        this._uniqueId = _solution.uniqueId;
        this._updateState(_solution.currentState);
        this.outputElement.classList.add("messages-container");
        this.disposable.add(_solution.logs.subscribe(function (event) {
            _this.output.push(event);
            if (_this.output.length > 1000) {
                _this.output.shift();
            }
        }), (0, _bufferFor.bufferFor)(_solution.logs, 100).subscribe(function (items) {
            var removals = [];
            if (_this.outputElement.children.length === 1000) {
                for (var i = 0; i < items.length; i++) {
                    removals.push(_this.outputElement.children[i]);
                }
            }
            fastdom.mutate(function () {
                _lodash2.default.each(removals, function (x) {
                    return x.remove();
                });
                _lodash2.default.each(items, function (event) {
                    _this.outputElement.appendChild(_outputMessageElement.OutputMessageElement.create(event));
                });
            });
        }), _solution.state.filter(function (z) {
            return z === _omnisharpClient.DriverState.Disconnected;
        }).subscribe(function () {
            _lodash2.default.each(_this.projects.slice(), function (project) {
                return _this._projectRemovedStream.next(project);
            });
            _this.projects = [];
            _this.diagnosticsByFile.clear();
        }));

        var _setupCodecheck2 = this._setupCodecheck(_solution),
            diagnostics = _setupCodecheck2.diagnostics,
            diagnosticsByFile = _setupCodecheck2.diagnosticsByFile,
            diagnosticsCounts = _setupCodecheck2.diagnosticsCounts;

        var status = this._setupStatus(_solution);
        var output = this.output;
        var _projectAddedStream = this._projectAddedStream.share();
        var _projectRemovedStream = this._projectRemovedStream.share();
        var _projectChangedStream = this._projectChangedStream.share();
        var projects = _rxjs.Observable.merge(_projectAddedStream, _projectRemovedStream, _projectChangedStream).startWith([]).debounceTime(200).map(function (z) {
            return _this.projects;
        }).publishReplay(1).refCount();
        var outputObservable = _solution.logs.auditTime(100).map(function () {
            return output;
        });
        var state = this._stateStream;
        this.observe = {
            get diagnostics() {
                return diagnostics;
            },
            get diagnosticsCounts() {
                return diagnosticsCounts;
            },
            get diagnosticsByFile() {
                return diagnosticsByFile;
            },
            get output() {
                return outputObservable;
            },
            get status() {
                return status;
            },
            get state() {
                return state;
            },
            get projects() {
                return projects;
            },
            get projectAdded() {
                return _projectAddedStream;
            },
            get projectRemoved() {
                return _projectRemovedStream;
            },
            get projectChanged() {
                return _projectChangedStream;
            }
        };
        this.disposable.add(_solution.state.subscribe(_lodash2.default.bind(this._updateState, this)));
        (window["clients"] || (window["clients"] = [])).push(this);
        this.disposable.add(_solution.state.filter(function (z) {
            return z === _omnisharpClient.DriverState.Connected;
        }).subscribe(function () {
            _solution.projects({ ExcludeSourceFiles: false });
            _solution.packagesource({ ProjectPath: _solution.path }).subscribe(function (response) {
                _this.packageSources = response.Sources;
            });
        }));
        this.disposable.add(_solution.state.filter(function (z) {
            return z === _omnisharpClient.DriverState.Disconnected;
        }).subscribe(function () {
            _lodash2.default.each(_this.projects.slice(), function (project) {
                return _this._projectRemovedStream.next(project);
            });
        }));
        this.disposable.add(_solution.observe.projectAdded.subscribe(function (projectInformation) {
            _lodash2.default.each((0, _projectViewModel.projectViewModelFactory)(projectInformation, _solution.projectPath), function (project) {
                if (!_lodash2.default.some(_this.projects, { path: project.path })) {
                    _this.projects.push(project);
                    _this._projectAddedStream.next(project);
                }
            });
        }));
        this.disposable.add(_solution.observe.projectRemoved.subscribe(function (projectInformation) {
            _lodash2.default.each((0, _projectViewModel.projectViewModelFactory)(projectInformation, _solution.projectPath), function (project) {
                var found = _lodash2.default.find(_this.projects, { path: project.path });
                if (found) {
                    _lodash2.default.pull(_this.projects, found);
                    _this._projectRemovedStream.next(project);
                }
            });
        }));
        this.disposable.add(_solution.observe.projectChanged.subscribe(function (projectInformation) {
            _lodash2.default.each((0, _projectViewModel.projectViewModelFactory)(projectInformation, _solution.projectPath), function (project) {
                var found = _lodash2.default.find(_this.projects, { path: project.path });
                if (found) {
                    found.update(project);
                    _this._projectChangedStream.next(project);
                }
            });
        }));
        this.disposable.add(_solution.observe.projects.subscribe(function (context) {
            _lodash2.default.each((0, _projectViewModel.workspaceViewModelFactory)(context.response, _solution.projectPath), function (project) {
                var found = _lodash2.default.find(_this.projects, { path: project.path });
                if (found) {
                    found.update(project);
                    _this._projectChangedStream.next(project);
                } else {
                    _this.projects.push(project);
                    _this._projectAddedStream.next(project);
                }
            });
        }));
        this.disposable.add(this._projectAddedStream);
        this.disposable.add(this._projectChangedStream);
        this.disposable.add(this._projectRemovedStream);
        this.disposable.add(_tsDisposables.Disposable.create(function () {
            _lodash2.default.each(_this.projects, function (x) {
                return x.dispose();
            });
        }));
    }

    _createClass(ViewModel, [{
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "getProjectForEditor",
        value: function getProjectForEditor(editor) {
            return this.getProjectForPath(editor.getPath()).filter(function () {
                return !editor.isDestroyed();
            });
        }
    }, {
        key: "getProjectForPath",
        value: function getProjectForPath(path) {
            if (this.isOn && this.projects.length) {
                var project = _lodash2.default.find(this.projects, function (x) {
                    return x.filesSet.has(path);
                });
                if (project) {
                    return _rxjs.Observable.of(project);
                }
            }
            return this.observe.projectAdded.filter(function (x) {
                return _lodash2.default.startsWith(path, x.path);
            }).take(1);
        }
    }, {
        key: "getProjectContainingEditor",
        value: function getProjectContainingEditor(editor) {
            return this.getProjectContainingFile(editor.getPath());
        }
    }, {
        key: "getProjectContainingFile",
        value: function getProjectContainingFile(path) {
            if (this.isOn && this.projects.length) {
                var project = _lodash2.default.find(this.projects, function (x) {
                    return _lodash2.default.includes(x.sourceFiles, (0, _path.normalize)(path));
                });
                if (project) {
                    return _rxjs.Observable.of(project);
                }
                return _rxjs.Observable.of(null);
            } else {
                return this.observe.projectAdded.filter(function (x) {
                    return _lodash2.default.includes(x.sourceFiles, (0, _path.normalize)(path));
                }).take(1).defaultIfEmpty(null);
            }
        }
    }, {
        key: "_updateState",
        value: function _updateState(state) {
            this.isOn = state === _omnisharpClient.DriverState.Connecting || state === _omnisharpClient.DriverState.Connected;
            this.isOff = state === _omnisharpClient.DriverState.Disconnected;
            this.isConnecting = state === _omnisharpClient.DriverState.Connecting;
            this.isReady = state === _omnisharpClient.DriverState.Connected;
            this.isError = state === _omnisharpClient.DriverState.Error;
            this._stateStream.next(this);
        }
    }, {
        key: "_setupCodecheck",
        value: function _setupCodecheck(_solution) {
            var _this2 = this;

            var baseCodecheck = _solution.observe.diagnostic.map(function (data) {
                var files = [];
                var counts = _this2.diagnosticCounts;
                _lodash2.default.each(data.Results, function (result) {
                    files.push(result.FileName);
                    if (_this2.diagnosticsByFile.has(result.FileName)) {
                        var old = _this2.diagnosticsByFile.get(result.FileName);
                        _this2.diagnosticsByFile.delete(result.FileName);
                        var _grouped = _lodash2.default.groupBy(old, function (x) {
                            return x.LogLevel.toLowerCase();
                        });
                        _lodash2.default.each(_grouped, function (items, key) {
                            if (!_lodash2.default.isNumber(counts[key])) {
                                counts[key] = 0;
                            }
                            counts[key] -= items.length;
                            if (counts[key] < 0) counts[key] = 0;
                        });
                    }
                    _this2.diagnosticsByFile.set(result.FileName, _lodash2.default.sortBy(result.QuickFixes, function (x) {
                        return x.Line;
                    }, function (quickFix) {
                        return quickFix.LogLevel;
                    }, function (x) {
                        return x.Text;
                    }));
                    var grouped = _lodash2.default.groupBy(result.QuickFixes, function (x) {
                        return x.LogLevel.toLowerCase();
                    });
                    _lodash2.default.each(grouped, function (items, key) {
                        if (!_lodash2.default.isNumber(counts[key])) {
                            counts[key] = 0;
                        }
                        counts[key] += items.length;
                    });
                });
                return files;
            }).share();
            var diagnostics = baseCodecheck.map(function (x) {
                return _this2.diagnostics;
            }).publishReplay(1).refCount();
            var diagnosticsByFile = baseCodecheck.map(function (files) {
                var map = new Map();
                _lodash2.default.each(files, function (file) {
                    map.set(file, _this2.diagnosticsByFile.get(file));
                });
                return map;
            }).publishReplay(1).refCount();
            var diagnosticsCounts = baseCodecheck.map(function (x) {
                return _this2.diagnosticCounts;
            }).publishReplay(1).refCount();
            this.disposable.add(baseCodecheck.subscribe());
            return { diagnostics: diagnostics, diagnosticsByFile: diagnosticsByFile, diagnosticsCounts: diagnosticsCounts };
        }
    }, {
        key: "_setupStatus",
        value: function _setupStatus(_solution) {
            var status = _solution.status.startWith({}).share();
            return status;
        }
    }, {
        key: "uniqueId",
        get: function get() {
            return this._solution.uniqueId;
        }
    }, {
        key: "index",
        get: function get() {
            return this._solution.index;
        }
    }, {
        key: "path",
        get: function get() {
            return this._solution.path;
        }
    }, {
        key: "diagnostics",
        get: function get() {
            return (0, _lodash2.default)(_lodash2.default.toArray(this.diagnosticsByFile.values())).flatMap(function (x) {
                return x;
            }).sortBy(function (x) {
                return x.LogLevel;
            }, function (x) {
                return x.FileName;
            }, function (x) {
                return x.Line;
            }, function (x) {
                return x.Column;
            }, function (x) {
                return x.Text;
            }).value();
        }
    }, {
        key: "state",
        get: function get() {
            return this._solution.currentState;
        }
    }]);

    return ViewModel;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvdmlldy1tb2RlbC5qcyIsImxpYi9zZXJ2ZXIvdmlldy1tb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOzs7Ozs7QUNBQSxJQUFJLFVBQTBCLFFBQVEsU0FBUixDQUExQjs7SUFXSjtBQWlESSx1QkFBb0IsU0FBcEIsRUFBdUM7Ozs7O0FBQW5CLGFBQUEsU0FBQSxHQUFBLFNBQUEsQ0FBbUI7QUF6Q2hDLGFBQUEsVUFBQSxHQUFhLHdDQUFiLENBeUNnQztBQXBDaEMsYUFBQSxNQUFBLEdBQTBCLEVBQTFCLENBb0NnQztBQW5DaEMsYUFBQSxhQUFBLEdBQWdCLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUFoQixDQW1DZ0M7QUFsQ2hDLGFBQUEsaUJBQUEsR0FBb0IsSUFBSSxHQUFKLEVBQXBCLENBa0NnQztBQTNCaEMsYUFBQSxnQkFBQSxHQUFpRCxFQUFFLE9BQU8sQ0FBUCxFQUFVLFNBQVMsQ0FBVCxFQUFZLFFBQVEsQ0FBUixFQUF6RSxDQTJCZ0M7QUF6QmhDLGFBQUEsTUFBQSxHQUFpQixDQUFqQixDQXlCZ0M7QUF4QmhDLGFBQUEsUUFBQSxHQUFtQixDQUFuQixDQXdCZ0M7QUF2QmhDLGFBQUEsTUFBQSxHQUFpQixDQUFqQixDQXVCZ0M7QUFwQmhDLGFBQUEsY0FBQSxHQUEyQixFQUEzQixDQW9CZ0M7QUFuQmhDLGFBQUEsUUFBQSxHQUFvQyxFQUFwQyxDQW1CZ0M7QUFsQi9CLGFBQUEsbUJBQUEsR0FBc0IsbUJBQXRCLENBa0IrQjtBQWpCL0IsYUFBQSxxQkFBQSxHQUF3QixtQkFBeEIsQ0FpQitCO0FBaEIvQixhQUFBLHFCQUFBLEdBQXdCLG1CQUF4QixDQWdCK0I7QUFmL0IsYUFBQSxZQUFBLEdBQWUsd0JBQTZCLENBQTdCLENBQWYsQ0FlK0I7QUFDbkMsYUFBSyxTQUFMLEdBQWlCLFVBQVUsUUFBVixDQURrQjtB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QWxDaUM7QUE0Q3ZDLGdCQUFNLG9CQUFvQixjQUNyQixHQURxQixDQUNqQjt1QkFBSyxPQUFLLGdCQUFMO2FBQUwsQ0FEaUIsQ0FFckIsYUFGcUIsQ0FFUCxDQUZPLEVBRUosUUFGSSxFQUFwQixDQTVDaUM7QUFnRHZDLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsY0FBYyxTQUFkLEVBQXBCLEVBaER1QztBQWlEdkMsbUJBQU8sRUFBRSx3QkFBRixFQUFlLG9DQUFmLEVBQWtDLG9DQUFsQyxFQUFQLENBakR1Qzs7OztxQ0FvRHRCLFdBQW1CO0FBQ3BDLGdCQUFNLFNBQVMsVUFBVSxNQUFWLENBQ1YsU0FEVSxDQUNLLEVBREwsRUFFVixLQUZVLEVBQVQsQ0FEOEI7QUFLcEMsbUJBQU8sTUFBUCxDQUxvQzs7Ozs0QkE1UnJCO0FBQUssbUJBQU8sS0FBSyxTQUFMLENBQWUsUUFBZixDQUFaOzs7OzRCQUVIO0FBQUssbUJBQU8sS0FBSyxTQUFMLENBQWUsS0FBZixDQUFaOzs7OzRCQUNEO0FBQUssbUJBQU8sS0FBSyxTQUFMLENBQWUsSUFBZixDQUFaOzs7OzRCQUlPO0FBQ2xCLG1CQUFPLHNCQUFFLGlCQUFFLE9BQUYsQ0FBVSxLQUFLLGlCQUFMLENBQXVCLE1BQXZCLEVBQVYsQ0FBRixFQUNGLE9BREUsQ0FDTTt1QkFBSzthQUFMLENBRE4sQ0FFRixNQUZFLENBRUs7dUJBQUssRUFBRSxRQUFGO2FBQUwsRUFBaUI7dUJBQUssRUFBRSxRQUFGO2FBQUwsRUFBaUI7dUJBQUssRUFBRSxJQUFGO2FBQUwsRUFBYTt1QkFBSyxFQUFFLE1BQUY7YUFBTCxFQUFlO3VCQUFLLEVBQUUsSUFBRjthQUFMLENBRm5FLENBR0YsS0FIRSxFQUFQLENBRGtCOzs7OzRCQVlOO0FBQUssbUJBQU8sS0FBSyxTQUFMLENBQWUsWUFBZixDQUFaIiwiZmlsZSI6ImxpYi9zZXJ2ZXIvdmlldy1tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IERyaXZlclN0YXRlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QsIFJlcGxheVN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgbm9ybWFsaXplIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHByb2plY3RWaWV3TW9kZWxGYWN0b3J5LCB3b3Jrc3BhY2VWaWV3TW9kZWxGYWN0b3J5IH0gZnJvbSBcIi4vcHJvamVjdC12aWV3LW1vZGVsXCI7XG5pbXBvcnQgeyBPdXRwdXRNZXNzYWdlRWxlbWVudCB9IGZyb20gXCIuLi92aWV3cy9vdXRwdXQtbWVzc2FnZS1lbGVtZW50XCI7XG5sZXQgZmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuaW1wb3J0IHsgYnVmZmVyRm9yIH0gZnJvbSBcIi4uL29wZXJhdG9ycy9idWZmZXJGb3JcIjtcbmV4cG9ydCBjbGFzcyBWaWV3TW9kZWwge1xuICAgIGNvbnN0cnVjdG9yKF9zb2x1dGlvbikge1xuICAgICAgICB0aGlzLl9zb2x1dGlvbiA9IF9zb2x1dGlvbjtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBbXTtcbiAgICAgICAgdGhpcy5vdXRwdXRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5kaWFnbm9zdGljc0J5RmlsZSA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5kaWFnbm9zdGljQ291bnRzID0geyBlcnJvcjogMCwgd2FybmluZzogMCwgaGlkZGVuOiAwIH07XG4gICAgICAgIHRoaXMuZXJyb3JzID0gMDtcbiAgICAgICAgdGhpcy53YXJuaW5ncyA9IDA7XG4gICAgICAgIHRoaXMuaGlkZGVuID0gMDtcbiAgICAgICAgdGhpcy5wYWNrYWdlU291cmNlcyA9IFtdO1xuICAgICAgICB0aGlzLnByb2plY3RzID0gW107XG4gICAgICAgIHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0gPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICB0aGlzLl9zdGF0ZVN0cmVhbSA9IG5ldyBSZXBsYXlTdWJqZWN0KDEpO1xuICAgICAgICB0aGlzLl91bmlxdWVJZCA9IF9zb2x1dGlvbi51bmlxdWVJZDtcbiAgICAgICAgdGhpcy5fdXBkYXRlU3RhdGUoX3NvbHV0aW9uLmN1cnJlbnRTdGF0ZSk7XG4gICAgICAgIHRoaXMub3V0cHV0RWxlbWVudC5jbGFzc0xpc3QuYWRkKFwibWVzc2FnZXMtY29udGFpbmVyXCIpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5sb2dzXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0LnB1c2goZXZlbnQpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3V0cHV0Lmxlbmd0aCA+IDEwMDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLm91dHB1dC5zaGlmdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSwgYnVmZmVyRm9yKF9zb2x1dGlvbi5sb2dzLCAxMDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGl0ZW1zID0+IHtcbiAgICAgICAgICAgIGxldCByZW1vdmFscyA9IFtdO1xuICAgICAgICAgICAgaWYgKHRoaXMub3V0cHV0RWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPT09IDEwMDApIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92YWxzLnB1c2godGhpcy5vdXRwdXRFbGVtZW50LmNoaWxkcmVuW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgXy5lYWNoKHJlbW92YWxzLCB4ID0+IHgucmVtb3ZlKCkpO1xuICAgICAgICAgICAgICAgIF8uZWFjaChpdGVtcywgZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm91dHB1dEVsZW1lbnQuYXBwZW5kQ2hpbGQoT3V0cHV0TWVzc2FnZUVsZW1lbnQuY3JlYXRlKGV2ZW50KSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSksIF9zb2x1dGlvbi5zdGF0ZS5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLnByb2plY3RzLnNsaWNlKCksIHByb2plY3QgPT4gdGhpcy5fcHJvamVjdFJlbW92ZWRTdHJlYW0ubmV4dChwcm9qZWN0KSk7XG4gICAgICAgICAgICB0aGlzLnByb2plY3RzID0gW107XG4gICAgICAgICAgICB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmNsZWFyKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc3QgeyBkaWFnbm9zdGljcywgZGlhZ25vc3RpY3NCeUZpbGUsIGRpYWdub3N0aWNzQ291bnRzIH0gPSB0aGlzLl9zZXR1cENvZGVjaGVjayhfc29sdXRpb24pO1xuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLl9zZXR1cFN0YXR1cyhfc29sdXRpb24pO1xuICAgICAgICBjb25zdCBvdXRwdXQgPSB0aGlzLm91dHB1dDtcbiAgICAgICAgY29uc3QgX3Byb2plY3RBZGRlZFN0cmVhbSA9IHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbS5zaGFyZSgpO1xuICAgICAgICBjb25zdCBfcHJvamVjdFJlbW92ZWRTdHJlYW0gPSB0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbS5zaGFyZSgpO1xuICAgICAgICBjb25zdCBfcHJvamVjdENoYW5nZWRTdHJlYW0gPSB0aGlzLl9wcm9qZWN0Q2hhbmdlZFN0cmVhbS5zaGFyZSgpO1xuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IE9ic2VydmFibGUubWVyZ2UoX3Byb2plY3RBZGRlZFN0cmVhbSwgX3Byb2plY3RSZW1vdmVkU3RyZWFtLCBfcHJvamVjdENoYW5nZWRTdHJlYW0pXG4gICAgICAgICAgICAuc3RhcnRXaXRoKFtdKVxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgyMDApXG4gICAgICAgICAgICAubWFwKHogPT4gdGhpcy5wcm9qZWN0cylcbiAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XG4gICAgICAgIGNvbnN0IG91dHB1dE9ic2VydmFibGUgPSBfc29sdXRpb24ubG9nc1xuICAgICAgICAgICAgLmF1ZGl0VGltZSgxMDApXG4gICAgICAgICAgICAubWFwKCgpID0+IG91dHB1dCk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5fc3RhdGVTdHJlYW07XG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHtcbiAgICAgICAgICAgIGdldCBkaWFnbm9zdGljcygpIHsgcmV0dXJuIGRpYWdub3N0aWNzOyB9LFxuICAgICAgICAgICAgZ2V0IGRpYWdub3N0aWNzQ291bnRzKCkgeyByZXR1cm4gZGlhZ25vc3RpY3NDb3VudHM7IH0sXG4gICAgICAgICAgICBnZXQgZGlhZ25vc3RpY3NCeUZpbGUoKSB7IHJldHVybiBkaWFnbm9zdGljc0J5RmlsZTsgfSxcbiAgICAgICAgICAgIGdldCBvdXRwdXQoKSB7IHJldHVybiBvdXRwdXRPYnNlcnZhYmxlOyB9LFxuICAgICAgICAgICAgZ2V0IHN0YXR1cygpIHsgcmV0dXJuIHN0YXR1czsgfSxcbiAgICAgICAgICAgIGdldCBzdGF0ZSgpIHsgcmV0dXJuIHN0YXRlOyB9LFxuICAgICAgICAgICAgZ2V0IHByb2plY3RzKCkgeyByZXR1cm4gcHJvamVjdHM7IH0sXG4gICAgICAgICAgICBnZXQgcHJvamVjdEFkZGVkKCkgeyByZXR1cm4gX3Byb2plY3RBZGRlZFN0cmVhbTsgfSxcbiAgICAgICAgICAgIGdldCBwcm9qZWN0UmVtb3ZlZCgpIHsgcmV0dXJuIF9wcm9qZWN0UmVtb3ZlZFN0cmVhbTsgfSxcbiAgICAgICAgICAgIGdldCBwcm9qZWN0Q2hhbmdlZCgpIHsgcmV0dXJuIF9wcm9qZWN0Q2hhbmdlZFN0cmVhbTsgfSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24uc3RhdGUuc3Vic2NyaWJlKF8uYmluZCh0aGlzLl91cGRhdGVTdGF0ZSwgdGhpcykpKTtcbiAgICAgICAgKHdpbmRvd1tcImNsaWVudHNcIl0gfHwgKHdpbmRvd1tcImNsaWVudHNcIl0gPSBbXSkpLnB1c2godGhpcyk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLnN0YXRlLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgX3NvbHV0aW9uLnByb2plY3RzKHsgRXhjbHVkZVNvdXJjZUZpbGVzOiBmYWxzZSB9KTtcbiAgICAgICAgICAgIF9zb2x1dGlvbi5wYWNrYWdlc291cmNlKHsgUHJvamVjdFBhdGg6IF9zb2x1dGlvbi5wYXRoIH0pXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYWNrYWdlU291cmNlcyA9IHJlc3BvbnNlLlNvdXJjZXM7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5zdGF0ZS5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5wcm9qZWN0cy5zbGljZSgpLCBwcm9qZWN0ID0+IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLm9ic2VydmUucHJvamVjdEFkZGVkLnN1YnNjcmliZShwcm9qZWN0SW5mb3JtYXRpb24gPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHByb2plY3RWaWV3TW9kZWxGYWN0b3J5KHByb2plY3RJbmZvcm1hdGlvbiwgX3NvbHV0aW9uLnByb2plY3RQYXRoKSwgcHJvamVjdCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFfLnNvbWUodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0cy5wdXNoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5vYnNlcnZlLnByb2plY3RSZW1vdmVkLnN1YnNjcmliZShwcm9qZWN0SW5mb3JtYXRpb24gPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHByb2plY3RWaWV3TW9kZWxGYWN0b3J5KHByb2plY3RJbmZvcm1hdGlvbiwgX3NvbHV0aW9uLnByb2plY3RQYXRoKSwgcHJvamVjdCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIF8ucHVsbCh0aGlzLnByb2plY3RzLCBmb3VuZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0Q2hhbmdlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHsgcGF0aDogcHJvamVjdC5wYXRoIH0pO1xuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZC51cGRhdGUocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtLm5leHQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0cy5zdWJzY3JpYmUoY29udGV4dCA9PiB7XG4gICAgICAgICAgICBfLmVhY2god29ya3NwYWNlVmlld01vZGVsRmFjdG9yeShjb250ZXh0LnJlc3BvbnNlLCBfc29sdXRpb24ucHJvamVjdFBhdGgpLCBwcm9qZWN0ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IF8uZmluZCh0aGlzLnByb2plY3RzLCB7IHBhdGg6IHByb2plY3QucGF0aCB9KTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmQudXBkYXRlKHByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0Q2hhbmdlZFN0cmVhbS5uZXh0KHByb2plY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0cy5wdXNoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0pO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5wcm9qZWN0cywgeCA9PiB4LmRpc3Bvc2UoKSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZ2V0IHVuaXF1ZUlkKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24udW5pcXVlSWQ7IH1cbiAgICBnZXQgaW5kZXgoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbi5pbmRleDsgfVxuICAgIGdldCBwYXRoKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24ucGF0aDsgfVxuICAgIGdldCBkaWFnbm9zdGljcygpIHtcbiAgICAgICAgcmV0dXJuIF8oXy50b0FycmF5KHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUudmFsdWVzKCkpKVxuICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB4KVxuICAgICAgICAgICAgLnNvcnRCeSh4ID0+IHguTG9nTGV2ZWwsIHggPT4geC5GaWxlTmFtZSwgeCA9PiB4LkxpbmUsIHggPT4geC5Db2x1bW4sIHggPT4geC5UZXh0KVxuICAgICAgICAgICAgLnZhbHVlKCk7XG4gICAgfVxuICAgIGdldCBzdGF0ZSgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uLmN1cnJlbnRTdGF0ZTsgfVxuICAgIDtcbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0Rm9yUGF0aChlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgICAgICAgLmZpbHRlcigoKSA9PiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0Rm9yUGF0aChwYXRoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzT24gJiYgdGhpcy5wcm9qZWN0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3QgPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeCA9PiB4LmZpbGVzU2V0LmhhcyhwYXRoKSk7XG4gICAgICAgICAgICBpZiAocHJvamVjdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHByb2plY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm9ic2VydmUucHJvamVjdEFkZGVkLmZpbHRlcih4ID0+IF8uc3RhcnRzV2l0aChwYXRoLCB4LnBhdGgpKS50YWtlKDEpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0Q29udGFpbmluZ0VkaXRvcihlZGl0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdENvbnRhaW5pbmdGaWxlKGVkaXRvci5nZXRQYXRoKCkpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0Q29udGFpbmluZ0ZpbGUocGF0aCkge1xuICAgICAgICBpZiAodGhpcy5pc09uICYmIHRoaXMucHJvamVjdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0ID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHggPT4gXy5pbmNsdWRlcyh4LnNvdXJjZUZpbGVzLCBub3JtYWxpemUocGF0aCkpKTtcbiAgICAgICAgICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YocHJvamVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9ic2VydmUucHJvamVjdEFkZGVkXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IF8uaW5jbHVkZXMoeC5zb3VyY2VGaWxlcywgbm9ybWFsaXplKHBhdGgpKSlcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgICAgIC5kZWZhdWx0SWZFbXB0eShudWxsKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfdXBkYXRlU3RhdGUoc3RhdGUpIHtcbiAgICAgICAgdGhpcy5pc09uID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RpbmcgfHwgc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZDtcbiAgICAgICAgdGhpcy5pc09mZiA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQ7XG4gICAgICAgIHRoaXMuaXNDb25uZWN0aW5nID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3Rpbmc7XG4gICAgICAgIHRoaXMuaXNSZWFkeSA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQ7XG4gICAgICAgIHRoaXMuaXNFcnJvciA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5FcnJvcjtcbiAgICAgICAgdGhpcy5fc3RhdGVTdHJlYW0ubmV4dCh0aGlzKTtcbiAgICB9XG4gICAgX3NldHVwQ29kZWNoZWNrKF9zb2x1dGlvbikge1xuICAgICAgICBjb25zdCBiYXNlQ29kZWNoZWNrID0gX3NvbHV0aW9uLm9ic2VydmUuZGlhZ25vc3RpY1xuICAgICAgICAgICAgLm1hcChkYXRhID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gW107XG4gICAgICAgICAgICBjb25zdCBjb3VudHMgPSB0aGlzLmRpYWdub3N0aWNDb3VudHM7XG4gICAgICAgICAgICBfLmVhY2goZGF0YS5SZXN1bHRzLCByZXN1bHQgPT4ge1xuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2gocmVzdWx0LkZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5kaWFnbm9zdGljc0J5RmlsZS5oYXMocmVzdWx0LkZpbGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGQgPSB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmdldChyZXN1bHQuRmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmRlbGV0ZShyZXN1bHQuRmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBncm91cGVkID0gXy5ncm91cEJ5KG9sZCwgeCA9PiB4LkxvZ0xldmVsLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgICAgICAgICBfLmVhY2goZ3JvdXBlZCwgKGl0ZW1zLCBrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghXy5pc051bWJlcihjb3VudHNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudHNba2V5XSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudHNba2V5XSAtPSBpdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY291bnRzW2tleV0gPCAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50c1trZXldID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUuc2V0KHJlc3VsdC5GaWxlTmFtZSwgXy5zb3J0QnkocmVzdWx0LlF1aWNrRml4ZXMsIHggPT4geC5MaW5lLCBxdWlja0ZpeCA9PiBxdWlja0ZpeC5Mb2dMZXZlbCwgeCA9PiB4LlRleHQpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBncm91cGVkID0gXy5ncm91cEJ5KHJlc3VsdC5RdWlja0ZpeGVzLCB4ID0+IHguTG9nTGV2ZWwudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICAgICAgXy5lYWNoKGdyb3VwZWQsIChpdGVtcywga2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghXy5pc051bWJlcihjb3VudHNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50c1trZXldID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb3VudHNba2V5XSArPSBpdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmaWxlcztcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgICAgICBjb25zdCBkaWFnbm9zdGljcyA9IGJhc2VDb2RlY2hlY2tcbiAgICAgICAgICAgIC5tYXAoeCA9PiB0aGlzLmRpYWdub3N0aWNzKVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcbiAgICAgICAgY29uc3QgZGlhZ25vc3RpY3NCeUZpbGUgPSBiYXNlQ29kZWNoZWNrXG4gICAgICAgICAgICAubWFwKGZpbGVzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIF8uZWFjaChmaWxlcywgZmlsZSA9PiB7XG4gICAgICAgICAgICAgICAgbWFwLnNldChmaWxlLCB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmdldChmaWxlKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBtYXA7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuICAgICAgICBjb25zdCBkaWFnbm9zdGljc0NvdW50cyA9IGJhc2VDb2RlY2hlY2tcbiAgICAgICAgICAgIC5tYXAoeCA9PiB0aGlzLmRpYWdub3N0aWNDb3VudHMpXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGJhc2VDb2RlY2hlY2suc3Vic2NyaWJlKCkpO1xuICAgICAgICByZXR1cm4geyBkaWFnbm9zdGljcywgZGlhZ25vc3RpY3NCeUZpbGUsIGRpYWdub3N0aWNzQ291bnRzIH07XG4gICAgfVxuICAgIF9zZXR1cFN0YXR1cyhfc29sdXRpb24pIHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gX3NvbHV0aW9uLnN0YXR1c1xuICAgICAgICAgICAgLnN0YXJ0V2l0aCh7fSlcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH1cbn1cbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtTb2x1dGlvbn0gZnJvbSBcIi4vc29sdXRpb25cIjtcclxuaW1wb3J0IHtNb2RlbHMsIERyaXZlclN0YXRlLCBPbW5pc2hhcnBDbGllbnRTdGF0dXN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgUmVwbGF5U3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7bm9ybWFsaXplfSBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge1Byb2plY3RWaWV3TW9kZWwsIHByb2plY3RWaWV3TW9kZWxGYWN0b3J5LCB3b3Jrc3BhY2VWaWV3TW9kZWxGYWN0b3J5fSBmcm9tIFwiLi9wcm9qZWN0LXZpZXctbW9kZWxcIjtcclxuaW1wb3J0IHtPdXRwdXRNZXNzYWdlRWxlbWVudH0gZnJvbSBcIi4uL3ZpZXdzL291dHB1dC1tZXNzYWdlLWVsZW1lbnRcIjtcclxubGV0IGZhc3Rkb206IHR5cGVvZiBGYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XHJcbmltcG9ydCB7YnVmZmVyRm9yfSBmcm9tIFwiLi4vb3BlcmF0b3JzL2J1ZmZlckZvclwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBWTVZpZXdTdGF0ZSB7XHJcbiAgICBpc09mZjogYm9vbGVhbjtcclxuICAgIGlzQ29ubmVjdGluZzogYm9vbGVhbjtcclxuICAgIGlzT246IGJvb2xlYW47XHJcbiAgICBpc1JlYWR5OiBib29sZWFuO1xyXG4gICAgaXNFcnJvcjogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFZpZXdNb2RlbCBpbXBsZW1lbnRzIFZNVmlld1N0YXRlLCBJRGlzcG9zYWJsZSB7XHJcbiAgICBwdWJsaWMgaXNPZmY6IGJvb2xlYW47XHJcbiAgICBwdWJsaWMgaXNDb25uZWN0aW5nOiBib29sZWFuO1xyXG4gICAgcHVibGljIGlzT246IGJvb2xlYW47XHJcbiAgICBwdWJsaWMgaXNSZWFkeTogYm9vbGVhbjtcclxuICAgIHB1YmxpYyBpc0Vycm9yOiBib29sZWFuO1xyXG5cclxuICAgIHByaXZhdGUgX3VuaXF1ZUlkOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICBwdWJsaWMgZ2V0IHVuaXF1ZUlkKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24udW5pcXVlSWQ7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGluZGV4KCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24uaW5kZXg7IH1cclxuICAgIHB1YmxpYyBnZXQgcGF0aCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uLnBhdGg7IH1cclxuICAgIHB1YmxpYyBvdXRwdXQ6IE91dHB1dE1lc3NhZ2VbXSA9IFtdO1xyXG4gICAgcHVibGljIG91dHB1dEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgcHVibGljIGRpYWdub3N0aWNzQnlGaWxlID0gbmV3IE1hcDxzdHJpbmcsIE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4oKTtcclxuICAgIHB1YmxpYyBnZXQgZGlhZ25vc3RpY3MoKSB7XHJcbiAgICAgICAgcmV0dXJuIF8oXy50b0FycmF5KHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUudmFsdWVzKCkpKVxyXG4gICAgICAgICAgICAuZmxhdE1hcCh4ID0+IHgpXHJcbiAgICAgICAgICAgIC5zb3J0QnkoeCA9PiB4LkxvZ0xldmVsLCB4ID0+IHguRmlsZU5hbWUsIHggPT4geC5MaW5lLCB4ID0+IHguQ29sdW1uLCB4ID0+IHguVGV4dClcclxuICAgICAgICAgICAgLnZhbHVlKCk7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgZGlhZ25vc3RpY0NvdW50czogeyBbaW5kZXg6IHN0cmluZ106IG51bWJlcjsgfSA9IHsgZXJyb3I6IDAsIHdhcm5pbmc6IDAsIGhpZGRlbjogMCB9O1xyXG5cclxuICAgIHB1YmxpYyBlcnJvcnM6IG51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgd2FybmluZ3M6IG51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgaGlkZGVuOiBudW1iZXIgPSAwO1xyXG5cclxuICAgIHB1YmxpYyBnZXQgc3RhdGUoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbi5jdXJyZW50U3RhdGU7IH07XHJcbiAgICBwdWJsaWMgcGFja2FnZVNvdXJjZXM6IHN0cmluZ1tdID0gW107XHJcbiAgICBwdWJsaWMgcHJvamVjdHM6IFByb2plY3RWaWV3TW9kZWw8YW55PltdID0gW107XHJcbiAgICBwcml2YXRlIF9wcm9qZWN0QWRkZWRTdHJlYW0gPSBuZXcgU3ViamVjdDxQcm9qZWN0Vmlld01vZGVsPGFueT4+KCk7XHJcbiAgICBwcml2YXRlIF9wcm9qZWN0UmVtb3ZlZFN0cmVhbSA9IG5ldyBTdWJqZWN0PFByb2plY3RWaWV3TW9kZWw8YW55Pj4oKTtcclxuICAgIHByaXZhdGUgX3Byb2plY3RDaGFuZ2VkU3RyZWFtID0gbmV3IFN1YmplY3Q8UHJvamVjdFZpZXdNb2RlbDxhbnk+PigpO1xyXG4gICAgcHJpdmF0ZSBfc3RhdGVTdHJlYW0gPSBuZXcgUmVwbGF5U3ViamVjdDxWaWV3TW9kZWw+KDEpO1xyXG5cclxuICAgIHB1YmxpYyBvYnNlcnZlOiB7XHJcbiAgICAgICAgZGlhZ25vc3RpY3M6IE9ic2VydmFibGU8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPjtcclxuICAgICAgICBkaWFnbm9zdGljc0NvdW50czogT2JzZXJ2YWJsZTx7IFtpbmRleDogc3RyaW5nXTogbnVtYmVyOyB9PjtcclxuICAgICAgICBkaWFnbm9zdGljc0J5RmlsZTogT2JzZXJ2YWJsZTxNYXA8c3RyaW5nLCBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+PjtcclxuICAgICAgICBvdXRwdXQ6IE9ic2VydmFibGU8T3V0cHV0TWVzc2FnZVtdPjtcclxuICAgICAgICBzdGF0dXM6IE9ic2VydmFibGU8T21uaXNoYXJwQ2xpZW50U3RhdHVzPjtcclxuICAgICAgICBzdGF0ZTogT2JzZXJ2YWJsZTxWaWV3TW9kZWw+O1xyXG4gICAgICAgIHByb2plY3RBZGRlZDogT2JzZXJ2YWJsZTxQcm9qZWN0Vmlld01vZGVsPGFueT4+O1xyXG4gICAgICAgIHByb2plY3RSZW1vdmVkOiBPYnNlcnZhYmxlPFByb2plY3RWaWV3TW9kZWw8YW55Pj47XHJcbiAgICAgICAgcHJvamVjdENoYW5nZWQ6IE9ic2VydmFibGU8UHJvamVjdFZpZXdNb2RlbDxhbnk+PjtcclxuICAgICAgICBwcm9qZWN0czogT2JzZXJ2YWJsZTxQcm9qZWN0Vmlld01vZGVsPGFueT5bXT47XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX3NvbHV0aW9uOiBTb2x1dGlvbikge1xyXG4gICAgICAgIHRoaXMuX3VuaXF1ZUlkID0gX3NvbHV0aW9uLnVuaXF1ZUlkO1xyXG4gICAgICAgIHRoaXMuX3VwZGF0ZVN0YXRlKF9zb2x1dGlvbi5jdXJyZW50U3RhdGUpO1xyXG5cclxuICAgICAgICB0aGlzLm91dHB1dEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIm1lc3NhZ2VzLWNvbnRhaW5lclwiKTtcclxuXHJcbiAgICAgICAgLy8gTWFuYWdlIG91ciBidWlsZCBsb2cgZm9yIGRpc3BsYXlcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5sb2dzXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vdXRwdXQucHVzaChldmVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3V0cHV0Lmxlbmd0aCA+IDEwMDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm91dHB1dC5zaGlmdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgYnVmZmVyRm9yKF9zb2x1dGlvbi5sb2dzLCAxMDApXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGl0ZW1zID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVtb3ZhbHM6IEVsZW1lbnRbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm91dHB1dEVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID09PSAxMDAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92YWxzLnB1c2godGhpcy5vdXRwdXRFbGVtZW50LmNoaWxkcmVuW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfLmVhY2gocmVtb3ZhbHMsIHggPT4geC5yZW1vdmUoKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfLmVhY2goaXRlbXMsIGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3V0cHV0RWxlbWVudC5hcHBlbmRDaGlsZChPdXRwdXRNZXNzYWdlRWxlbWVudC5jcmVhdGUoZXZlbnQpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgX3NvbHV0aW9uLnN0YXRlLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZClcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIF8uZWFjaCh0aGlzLnByb2plY3RzLnNsaWNlKCksIHByb2plY3QgPT4gdGhpcy5fcHJvamVjdFJlbW92ZWRTdHJlYW0ubmV4dChwcm9qZWN0KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0cyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUuY2xlYXIoKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3Qge2RpYWdub3N0aWNzLCBkaWFnbm9zdGljc0J5RmlsZSwgZGlhZ25vc3RpY3NDb3VudHN9ID0gdGhpcy5fc2V0dXBDb2RlY2hlY2soX3NvbHV0aW9uKTtcclxuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLl9zZXR1cFN0YXR1cyhfc29sdXRpb24pO1xyXG4gICAgICAgIGNvbnN0IG91dHB1dCA9IHRoaXMub3V0cHV0O1xyXG5cclxuICAgICAgICBjb25zdCBfcHJvamVjdEFkZGVkU3RyZWFtID0gdGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtLnNoYXJlKCk7XHJcbiAgICAgICAgY29uc3QgX3Byb2plY3RSZW1vdmVkU3RyZWFtID0gdGhpcy5fcHJvamVjdFJlbW92ZWRTdHJlYW0uc2hhcmUoKTtcclxuICAgICAgICBjb25zdCBfcHJvamVjdENoYW5nZWRTdHJlYW0gPSB0aGlzLl9wcm9qZWN0Q2hhbmdlZFN0cmVhbS5zaGFyZSgpO1xyXG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gT2JzZXJ2YWJsZS5tZXJnZShfcHJvamVjdEFkZGVkU3RyZWFtLCBfcHJvamVjdFJlbW92ZWRTdHJlYW0sIF9wcm9qZWN0Q2hhbmdlZFN0cmVhbSlcclxuICAgICAgICAgICAgLnN0YXJ0V2l0aCg8YW55PltdKVxyXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDIwMClcclxuICAgICAgICAgICAgLm1hcCh6ID0+IHRoaXMucHJvamVjdHMpXHJcbiAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IG91dHB1dE9ic2VydmFibGUgPSBfc29sdXRpb24ubG9nc1xyXG4gICAgICAgICAgICAuYXVkaXRUaW1lKDEwMClcclxuICAgICAgICAgICAgLm1hcCgoKSA9PiBvdXRwdXQpO1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuX3N0YXRlU3RyZWFtO1xyXG5cclxuICAgICAgICB0aGlzLm9ic2VydmUgPSB7XHJcbiAgICAgICAgICAgIGdldCBkaWFnbm9zdGljcygpIHsgcmV0dXJuIGRpYWdub3N0aWNzOyB9LFxyXG4gICAgICAgICAgICBnZXQgZGlhZ25vc3RpY3NDb3VudHMoKSB7IHJldHVybiBkaWFnbm9zdGljc0NvdW50czsgfSxcclxuICAgICAgICAgICAgZ2V0IGRpYWdub3N0aWNzQnlGaWxlKCkgeyByZXR1cm4gZGlhZ25vc3RpY3NCeUZpbGU7IH0sXHJcbiAgICAgICAgICAgIGdldCBvdXRwdXQoKSB7IHJldHVybiBvdXRwdXRPYnNlcnZhYmxlOyB9LFxyXG4gICAgICAgICAgICBnZXQgc3RhdHVzKCkgeyByZXR1cm4gc3RhdHVzOyB9LFxyXG4gICAgICAgICAgICBnZXQgc3RhdGUoKSB7IHJldHVybiA8T2JzZXJ2YWJsZTxWaWV3TW9kZWw+Pjxhbnk+c3RhdGU7IH0sXHJcbiAgICAgICAgICAgIGdldCBwcm9qZWN0cygpIHsgcmV0dXJuIHByb2plY3RzOyB9LFxyXG4gICAgICAgICAgICBnZXQgcHJvamVjdEFkZGVkKCkgeyByZXR1cm4gX3Byb2plY3RBZGRlZFN0cmVhbTsgfSxcclxuICAgICAgICAgICAgZ2V0IHByb2plY3RSZW1vdmVkKCkgeyByZXR1cm4gX3Byb2plY3RSZW1vdmVkU3RyZWFtOyB9LFxyXG4gICAgICAgICAgICBnZXQgcHJvamVjdENoYW5nZWQoKSB7IHJldHVybiBfcHJvamVjdENoYW5nZWRTdHJlYW07IH0sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24uc3RhdGUuc3Vic2NyaWJlKF8uYmluZCh0aGlzLl91cGRhdGVTdGF0ZSwgdGhpcykpKTtcclxuXHJcbiAgICAgICAgLyogdHNsaW50OmRpc2FibGUgKi9cclxuICAgICAgICAod2luZG93W1wiY2xpZW50c1wiXSB8fCAod2luZG93W1wiY2xpZW50c1wiXSA9IFtdKSkucHVzaCh0aGlzKTsgIC8vVEVNUFxyXG4gICAgICAgIC8qIHRzbGludDplbmFibGUgKi9cclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24uc3RhdGUuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIF9zb2x1dGlvbi5wcm9qZWN0cyh7IEV4Y2x1ZGVTb3VyY2VGaWxlczogZmFsc2UgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgX3NvbHV0aW9uLnBhY2thZ2Vzb3VyY2UoeyBQcm9qZWN0UGF0aDogX3NvbHV0aW9uLnBhdGggfSlcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYWNrYWdlU291cmNlcyA9IHJlc3BvbnNlLlNvdXJjZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24uc3RhdGUuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICBfLmVhY2godGhpcy5wcm9qZWN0cy5zbGljZSgpLCBwcm9qZWN0ID0+IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCkpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0QWRkZWQuc3Vic2NyaWJlKHByb2plY3RJbmZvcm1hdGlvbiA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFfLnNvbWUodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2plY3RzLnB1c2gocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtLm5leHQocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0UmVtb3ZlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcclxuICAgICAgICAgICAgXy5lYWNoKHByb2plY3RWaWV3TW9kZWxGYWN0b3J5KHByb2plY3RJbmZvcm1hdGlvbiwgX3NvbHV0aW9uLnByb2plY3RQYXRoKSwgcHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZDogUHJvamVjdFZpZXdNb2RlbDxhbnk+ID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHsgcGF0aDogcHJvamVjdC5wYXRoIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgXy5wdWxsKHRoaXMucHJvamVjdHMsIGZvdW5kKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbS5uZXh0KHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLm9ic2VydmUucHJvamVjdENoYW5nZWQuc3Vic2NyaWJlKHByb2plY3RJbmZvcm1hdGlvbiA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmQ6IFByb2plY3RWaWV3TW9kZWw8YW55PiA9IF8uZmluZCh0aGlzLnByb2plY3RzLCB7IHBhdGg6IHByb2plY3QucGF0aCB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kLnVwZGF0ZShwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0Q2hhbmdlZFN0cmVhbS5uZXh0KHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLm9ic2VydmUucHJvamVjdHMuc3Vic2NyaWJlKGNvbnRleHQgPT4ge1xyXG4gICAgICAgICAgICBfLmVhY2god29ya3NwYWNlVmlld01vZGVsRmFjdG9yeShjb250ZXh0LnJlc3BvbnNlLCBfc29sdXRpb24ucHJvamVjdFBhdGgpLCBwcm9qZWN0ID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kOiBQcm9qZWN0Vmlld01vZGVsPGFueT4gPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZC51cGRhdGUocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0cy5wdXNoKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbS5uZXh0KHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLnByb2plY3RzLCB4ID0+IHguZGlzcG9zZSgpKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0UHJvamVjdEZvckVkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFByb2plY3RGb3JQYXRoKGVkaXRvci5nZXRQYXRoKCkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoKCkgPT4gIWVkaXRvci5pc0Rlc3Ryb3llZCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0UHJvamVjdEZvclBhdGgocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNPbiAmJiB0aGlzLnByb2plY3RzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0ID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHggPT4geC5maWxlc1NldC5oYXMocGF0aCkpO1xyXG4gICAgICAgICAgICBpZiAocHJvamVjdCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YocHJvamVjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLm9ic2VydmUucHJvamVjdEFkZGVkLmZpbHRlcih4ID0+IF8uc3RhcnRzV2l0aChwYXRoLCB4LnBhdGgpKS50YWtlKDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRQcm9qZWN0Q29udGFpbmluZ0VkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFByb2plY3RDb250YWluaW5nRmlsZShlZGl0b3IuZ2V0UGF0aCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0UHJvamVjdENvbnRhaW5pbmdGaWxlKHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLmlzT24gJiYgdGhpcy5wcm9qZWN0cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9IF8uZmluZCh0aGlzLnByb2plY3RzLCB4ID0+IF8uaW5jbHVkZXMoeC5zb3VyY2VGaWxlcywgbm9ybWFsaXplKHBhdGgpKSk7XHJcbiAgICAgICAgICAgIGlmIChwcm9qZWN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihwcm9qZWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihudWxsKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vYnNlcnZlLnByb2plY3RBZGRlZFxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IF8uaW5jbHVkZXMoeC5zb3VyY2VGaWxlcywgbm9ybWFsaXplKHBhdGgpKSlcclxuICAgICAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgICAgICAuZGVmYXVsdElmRW1wdHkobnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3VwZGF0ZVN0YXRlKHN0YXRlOiBEcml2ZXJTdGF0ZSkge1xyXG4gICAgICAgIHRoaXMuaXNPbiA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0aW5nIHx8IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQ7XHJcbiAgICAgICAgdGhpcy5pc09mZiA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQ7XHJcbiAgICAgICAgdGhpcy5pc0Nvbm5lY3RpbmcgPSBzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGluZztcclxuICAgICAgICB0aGlzLmlzUmVhZHkgPSBzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkO1xyXG4gICAgICAgIHRoaXMuaXNFcnJvciA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5FcnJvcjtcclxuXHJcbiAgICAgICAgdGhpcy5fc3RhdGVTdHJlYW0ubmV4dCh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zZXR1cENvZGVjaGVjayhfc29sdXRpb246IFNvbHV0aW9uKSB7XHJcbiAgICAgICAgY29uc3QgYmFzZUNvZGVjaGVjayA9IF9zb2x1dGlvbi5vYnNlcnZlLmRpYWdub3N0aWNcclxuICAgICAgICAgICAgLm1hcChkYXRhID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY291bnRzID0gdGhpcy5kaWFnbm9zdGljQ291bnRzO1xyXG4gICAgICAgICAgICAgICAgXy5lYWNoKGRhdGEuUmVzdWx0cywgcmVzdWx0ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmaWxlcy5wdXNoKHJlc3VsdC5GaWxlTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUuaGFzKHJlc3VsdC5GaWxlTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkID0gdGhpcy5kaWFnbm9zdGljc0J5RmlsZS5nZXQocmVzdWx0LkZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaWFnbm9zdGljc0J5RmlsZS5kZWxldGUocmVzdWx0LkZpbGVOYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwZWQgPSBfLmdyb3VwQnkob2xkLCB4ID0+IHguTG9nTGV2ZWwudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF8uZWFjaChncm91cGVkLCAoaXRlbXMsIGtleSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLmlzTnVtYmVyKGNvdW50c1trZXldKSkgeyBjb3VudHNba2V5XSA9IDA7IH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50c1trZXldIC09IGl0ZW1zLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb3VudHNba2V5XSA8IDApIGNvdW50c1trZXldID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLnNldChyZXN1bHQuRmlsZU5hbWUsIF8uc29ydEJ5KHJlc3VsdC5RdWlja0ZpeGVzLCB4ID0+IHguTGluZSwgcXVpY2tGaXggPT4gcXVpY2tGaXguTG9nTGV2ZWwsIHggPT4geC5UZXh0KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBlZCA9IF8uZ3JvdXBCeShyZXN1bHQuUXVpY2tGaXhlcywgeCA9PiB4LkxvZ0xldmVsLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8uZWFjaChncm91cGVkLCAoaXRlbXMsIGtleSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNOdW1iZXIoY291bnRzW2tleV0pKSB7IGNvdW50c1trZXldID0gMDsgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudHNba2V5XSArPSBpdGVtcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlcztcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnNoYXJlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRpYWdub3N0aWNzID0gYmFzZUNvZGVjaGVja1xyXG4gICAgICAgICAgICAubWFwKHggPT4gdGhpcy5kaWFnbm9zdGljcylcclxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGlhZ25vc3RpY3NCeUZpbGUgPSBiYXNlQ29kZWNoZWNrXHJcbiAgICAgICAgICAgIC5tYXAoZmlsZXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWFwID0gbmV3IE1hcDxzdHJpbmcsIE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4oKTtcclxuICAgICAgICAgICAgICAgIF8uZWFjaChmaWxlcywgZmlsZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFwLnNldChmaWxlLCB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmdldChmaWxlKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRpYWdub3N0aWNzQ291bnRzID0gYmFzZUNvZGVjaGVja1xyXG4gICAgICAgICAgICAubWFwKHggPT4gdGhpcy5kaWFnbm9zdGljQ291bnRzKVxyXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGJhc2VDb2RlY2hlY2suc3Vic2NyaWJlKCkpO1xyXG4gICAgICAgIHJldHVybiB7IGRpYWdub3N0aWNzLCBkaWFnbm9zdGljc0J5RmlsZSwgZGlhZ25vc3RpY3NDb3VudHMgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zZXR1cFN0YXR1cyhfc29sdXRpb246IFNvbHV0aW9uKSB7XHJcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gX3NvbHV0aW9uLnN0YXR1c1xyXG4gICAgICAgICAgICAuc3RhcnRXaXRoKDxhbnk+e30pXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gc3RhdHVzO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==
