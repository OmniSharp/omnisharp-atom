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
        this.disposable = new _omnisharpClient.CompositeDisposable();
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

        var _setupCodecheck2 = this._setupCodecheck(_solution);

        var diagnostics = _setupCodecheck2.diagnostics;
        var diagnosticsByFile = _setupCodecheck2.diagnosticsByFile;
        var diagnosticsCounts = _setupCodecheck2.diagnosticsCounts;

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
        this.disposable.add(_omnisharpClient.Disposable.create(function () {
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
            }).cache(1);
            var diagnosticsByFile = baseCodecheck.map(function (files) {
                var map = new Map();
                _lodash2.default.each(files, function (file) {
                    map.set(file, _this2.diagnosticsByFile.get(file));
                });
                return map;
            }).cache(1);
            var diagnosticsCounts = baseCodecheck.map(function (x) {
                return _this2.diagnosticCounts;
            }).cache(1);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvdmlldy1tb2RlbC5qcyIsImxpYi9zZXJ2ZXIvdmlldy1tb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUVBOzs7Ozs7QUNBQSxJQUFJLFVBQTBCLFFBQVEsU0FBUixDQUE5Qjs7SUFXQSxTLFdBQUEsUztBQWlESSx1QkFBb0IsU0FBcEIsRUFBdUM7QUFBQTs7QUFBQTs7QUFBbkIsYUFBQSxTQUFBLEdBQUEsU0FBQTtBQXpDYixhQUFBLFVBQUEsR0FBYSwwQ0FBYjtBQUtBLGFBQUEsTUFBQSxHQUEwQixFQUExQjtBQUNBLGFBQUEsYUFBQSxHQUFnQixTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBaEI7QUFDQSxhQUFBLGlCQUFBLEdBQW9CLElBQUksR0FBSixFQUFwQjtBQU9BLGFBQUEsZ0JBQUEsR0FBaUQsRUFBRSxPQUFPLENBQVQsRUFBWSxTQUFTLENBQXJCLEVBQXdCLFFBQVEsQ0FBaEMsRUFBakQ7QUFFQSxhQUFBLE1BQUEsR0FBaUIsQ0FBakI7QUFDQSxhQUFBLFFBQUEsR0FBbUIsQ0FBbkI7QUFDQSxhQUFBLE1BQUEsR0FBaUIsQ0FBakI7QUFHQSxhQUFBLGNBQUEsR0FBMkIsRUFBM0I7QUFDQSxhQUFBLFFBQUEsR0FBb0MsRUFBcEM7QUFDQyxhQUFBLG1CQUFBLEdBQXNCLG1CQUF0QjtBQUNBLGFBQUEscUJBQUEsR0FBd0IsbUJBQXhCO0FBQ0EsYUFBQSxxQkFBQSxHQUF3QixtQkFBeEI7QUFDQSxhQUFBLFlBQUEsR0FBZSx3QkFBNkIsQ0FBN0IsQ0FBZjtBQWdCSixhQUFLLFNBQUwsR0FBaUIsVUFBVSxRQUEzQjtBQUNBLGFBQUssWUFBTCxDQUFrQixVQUFVLFlBQTVCO0FBRUEsYUFBSyxhQUFMLENBQW1CLFNBQW5CLENBQTZCLEdBQTdCLENBQWlDLG9CQUFqQztBQUdBLGFBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixVQUFV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O0FBQUssbUJBQU8sS0FBSyxTQUFMLENBQWUsS0FBdEI7QUFBOEI7Ozs0QkFDcEM7QUFBSyxtQkFBTyxLQUFLLFNBQUwsQ0FBZSxJQUF0QjtBQUE2Qjs7OzRCQUkzQjtBQUNsQixtQkFBTyxzQkFBRSxpQkFBRSxPQUFGLENBQVUsS0FBSyxpQkFBTCxDQUF1QixNQUF2QixFQUFWLENBQUYsRUFDRixPQURFLENBQ007QUFBQSx1QkFBSyxDQUFMO0FBQUEsYUFETixFQUVGLE1BRkUsQ0FFSztBQUFBLHVCQUFLLEVBQUUsUUFBUDtBQUFBLGFBRkwsRUFFc0I7QUFBQSx1QkFBSyxFQUFFLFFBQVA7QUFBQSxhQUZ0QixFQUV1QztBQUFBLHVCQUFLLEVBQUUsSUFBUDtBQUFBLGFBRnZDLEVBRW9EO0FBQUEsdUJBQUssRUFBRSxNQUFQO0FBQUEsYUFGcEQsRUFFbUU7QUFBQSx1QkFBSyxFQUFFLElBQVA7QUFBQSxhQUZuRSxFQUdGLEtBSEUsRUFBUDtBQUlIOzs7NEJBT2U7QUFBSyxtQkFBTyxLQUFLLFNBQUwsQ0FBZSxZQUF0QjtBQUFxQyIsImZpbGUiOiJsaWIvc2VydmVyL3ZpZXctbW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBEcml2ZXJTdGF0ZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0LCBSZXBsYXlTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgbm9ybWFsaXplIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHByb2plY3RWaWV3TW9kZWxGYWN0b3J5LCB3b3Jrc3BhY2VWaWV3TW9kZWxGYWN0b3J5IH0gZnJvbSBcIi4vcHJvamVjdC12aWV3LW1vZGVsXCI7XG5pbXBvcnQgeyBPdXRwdXRNZXNzYWdlRWxlbWVudCB9IGZyb20gXCIuLi92aWV3cy9vdXRwdXQtbWVzc2FnZS1lbGVtZW50XCI7XG5sZXQgZmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuaW1wb3J0IHsgYnVmZmVyRm9yIH0gZnJvbSBcIi4uL29wZXJhdG9ycy9idWZmZXJGb3JcIjtcbmV4cG9ydCBjbGFzcyBWaWV3TW9kZWwge1xuICAgIGNvbnN0cnVjdG9yKF9zb2x1dGlvbikge1xuICAgICAgICB0aGlzLl9zb2x1dGlvbiA9IF9zb2x1dGlvbjtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBbXTtcbiAgICAgICAgdGhpcy5vdXRwdXRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5kaWFnbm9zdGljc0J5RmlsZSA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5kaWFnbm9zdGljQ291bnRzID0geyBlcnJvcjogMCwgd2FybmluZzogMCwgaGlkZGVuOiAwIH07XG4gICAgICAgIHRoaXMuZXJyb3JzID0gMDtcbiAgICAgICAgdGhpcy53YXJuaW5ncyA9IDA7XG4gICAgICAgIHRoaXMuaGlkZGVuID0gMDtcbiAgICAgICAgdGhpcy5wYWNrYWdlU291cmNlcyA9IFtdO1xuICAgICAgICB0aGlzLnByb2plY3RzID0gW107XG4gICAgICAgIHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0gPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICB0aGlzLl9zdGF0ZVN0cmVhbSA9IG5ldyBSZXBsYXlTdWJqZWN0KDEpO1xuICAgICAgICB0aGlzLl91bmlxdWVJZCA9IF9zb2x1dGlvbi51bmlxdWVJZDtcbiAgICAgICAgdGhpcy5fdXBkYXRlU3RhdGUoX3NvbHV0aW9uLmN1cnJlbnRTdGF0ZSk7XG4gICAgICAgIHRoaXMub3V0cHV0RWxlbWVudC5jbGFzc0xpc3QuYWRkKFwibWVzc2FnZXMtY29udGFpbmVyXCIpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5sb2dzXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0LnB1c2goZXZlbnQpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3V0cHV0Lmxlbmd0aCA+IDEwMDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLm91dHB1dC5zaGlmdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSwgYnVmZmVyRm9yKF9zb2x1dGlvbi5sb2dzLCAxMDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGl0ZW1zID0+IHtcbiAgICAgICAgICAgIGxldCByZW1vdmFscyA9IFtdO1xuICAgICAgICAgICAgaWYgKHRoaXMub3V0cHV0RWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPT09IDEwMDApIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92YWxzLnB1c2godGhpcy5vdXRwdXRFbGVtZW50LmNoaWxkcmVuW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgXy5lYWNoKHJlbW92YWxzLCB4ID0+IHgucmVtb3ZlKCkpO1xuICAgICAgICAgICAgICAgIF8uZWFjaChpdGVtcywgZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm91dHB1dEVsZW1lbnQuYXBwZW5kQ2hpbGQoT3V0cHV0TWVzc2FnZUVsZW1lbnQuY3JlYXRlKGV2ZW50KSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSksIF9zb2x1dGlvbi5zdGF0ZS5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLnByb2plY3RzLnNsaWNlKCksIHByb2plY3QgPT4gdGhpcy5fcHJvamVjdFJlbW92ZWRTdHJlYW0ubmV4dChwcm9qZWN0KSk7XG4gICAgICAgICAgICB0aGlzLnByb2plY3RzID0gW107XG4gICAgICAgICAgICB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmNsZWFyKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc3QgeyBkaWFnbm9zdGljcywgZGlhZ25vc3RpY3NCeUZpbGUsIGRpYWdub3N0aWNzQ291bnRzIH0gPSB0aGlzLl9zZXR1cENvZGVjaGVjayhfc29sdXRpb24pO1xuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLl9zZXR1cFN0YXR1cyhfc29sdXRpb24pO1xuICAgICAgICBjb25zdCBvdXRwdXQgPSB0aGlzLm91dHB1dDtcbiAgICAgICAgY29uc3QgX3Byb2plY3RBZGRlZFN0cmVhbSA9IHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbS5zaGFyZSgpO1xuICAgICAgICBjb25zdCBfcHJvamVjdFJlbW92ZWRTdHJlYW0gPSB0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbS5zaGFyZSgpO1xuICAgICAgICBjb25zdCBfcHJvamVjdENoYW5nZWRTdHJlYW0gPSB0aGlzLl9wcm9qZWN0Q2hhbmdlZFN0cmVhbS5zaGFyZSgpO1xuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IE9ic2VydmFibGUubWVyZ2UoX3Byb2plY3RBZGRlZFN0cmVhbSwgX3Byb2plY3RSZW1vdmVkU3RyZWFtLCBfcHJvamVjdENoYW5nZWRTdHJlYW0pXG4gICAgICAgICAgICAuc3RhcnRXaXRoKFtdKVxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgyMDApXG4gICAgICAgICAgICAubWFwKHogPT4gdGhpcy5wcm9qZWN0cylcbiAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XG4gICAgICAgIGNvbnN0IG91dHB1dE9ic2VydmFibGUgPSBfc29sdXRpb24ubG9nc1xuICAgICAgICAgICAgLmF1ZGl0VGltZSgxMDApXG4gICAgICAgICAgICAubWFwKCgpID0+IG91dHB1dCk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5fc3RhdGVTdHJlYW07XG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHtcbiAgICAgICAgICAgIGdldCBkaWFnbm9zdGljcygpIHsgcmV0dXJuIGRpYWdub3N0aWNzOyB9LFxuICAgICAgICAgICAgZ2V0IGRpYWdub3N0aWNzQ291bnRzKCkgeyByZXR1cm4gZGlhZ25vc3RpY3NDb3VudHM7IH0sXG4gICAgICAgICAgICBnZXQgZGlhZ25vc3RpY3NCeUZpbGUoKSB7IHJldHVybiBkaWFnbm9zdGljc0J5RmlsZTsgfSxcbiAgICAgICAgICAgIGdldCBvdXRwdXQoKSB7IHJldHVybiBvdXRwdXRPYnNlcnZhYmxlOyB9LFxuICAgICAgICAgICAgZ2V0IHN0YXR1cygpIHsgcmV0dXJuIHN0YXR1czsgfSxcbiAgICAgICAgICAgIGdldCBzdGF0ZSgpIHsgcmV0dXJuIHN0YXRlOyB9LFxuICAgICAgICAgICAgZ2V0IHByb2plY3RzKCkgeyByZXR1cm4gcHJvamVjdHM7IH0sXG4gICAgICAgICAgICBnZXQgcHJvamVjdEFkZGVkKCkgeyByZXR1cm4gX3Byb2plY3RBZGRlZFN0cmVhbTsgfSxcbiAgICAgICAgICAgIGdldCBwcm9qZWN0UmVtb3ZlZCgpIHsgcmV0dXJuIF9wcm9qZWN0UmVtb3ZlZFN0cmVhbTsgfSxcbiAgICAgICAgICAgIGdldCBwcm9qZWN0Q2hhbmdlZCgpIHsgcmV0dXJuIF9wcm9qZWN0Q2hhbmdlZFN0cmVhbTsgfSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24uc3RhdGUuc3Vic2NyaWJlKF8uYmluZCh0aGlzLl91cGRhdGVTdGF0ZSwgdGhpcykpKTtcbiAgICAgICAgKHdpbmRvd1tcImNsaWVudHNcIl0gfHwgKHdpbmRvd1tcImNsaWVudHNcIl0gPSBbXSkpLnB1c2godGhpcyk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLnN0YXRlLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgX3NvbHV0aW9uLnByb2plY3RzKHsgRXhjbHVkZVNvdXJjZUZpbGVzOiBmYWxzZSB9KTtcbiAgICAgICAgICAgIF9zb2x1dGlvbi5wYWNrYWdlc291cmNlKHsgUHJvamVjdFBhdGg6IF9zb2x1dGlvbi5wYXRoIH0pXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYWNrYWdlU291cmNlcyA9IHJlc3BvbnNlLlNvdXJjZXM7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5zdGF0ZS5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5wcm9qZWN0cy5zbGljZSgpLCBwcm9qZWN0ID0+IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLm9ic2VydmUucHJvamVjdEFkZGVkLnN1YnNjcmliZShwcm9qZWN0SW5mb3JtYXRpb24gPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHByb2plY3RWaWV3TW9kZWxGYWN0b3J5KHByb2plY3RJbmZvcm1hdGlvbiwgX3NvbHV0aW9uLnByb2plY3RQYXRoKSwgcHJvamVjdCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFfLnNvbWUodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0cy5wdXNoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5vYnNlcnZlLnByb2plY3RSZW1vdmVkLnN1YnNjcmliZShwcm9qZWN0SW5mb3JtYXRpb24gPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHByb2plY3RWaWV3TW9kZWxGYWN0b3J5KHByb2plY3RJbmZvcm1hdGlvbiwgX3NvbHV0aW9uLnByb2plY3RQYXRoKSwgcHJvamVjdCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIF8ucHVsbCh0aGlzLnByb2plY3RzLCBmb3VuZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0Q2hhbmdlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHsgcGF0aDogcHJvamVjdC5wYXRoIH0pO1xuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZC51cGRhdGUocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtLm5leHQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0cy5zdWJzY3JpYmUoY29udGV4dCA9PiB7XG4gICAgICAgICAgICBfLmVhY2god29ya3NwYWNlVmlld01vZGVsRmFjdG9yeShjb250ZXh0LnJlc3BvbnNlLCBfc29sdXRpb24ucHJvamVjdFBhdGgpLCBwcm9qZWN0ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IF8uZmluZCh0aGlzLnByb2plY3RzLCB7IHBhdGg6IHByb2plY3QucGF0aCB9KTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmQudXBkYXRlKHByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0Q2hhbmdlZFN0cmVhbS5uZXh0KHByb2plY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0cy5wdXNoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0pO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5wcm9qZWN0cywgeCA9PiB4LmRpc3Bvc2UoKSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZ2V0IHVuaXF1ZUlkKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24udW5pcXVlSWQ7IH1cbiAgICBnZXQgaW5kZXgoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbi5pbmRleDsgfVxuICAgIGdldCBwYXRoKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24ucGF0aDsgfVxuICAgIGdldCBkaWFnbm9zdGljcygpIHtcbiAgICAgICAgcmV0dXJuIF8oXy50b0FycmF5KHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUudmFsdWVzKCkpKVxuICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB4KVxuICAgICAgICAgICAgLnNvcnRCeSh4ID0+IHguTG9nTGV2ZWwsIHggPT4geC5GaWxlTmFtZSwgeCA9PiB4LkxpbmUsIHggPT4geC5Db2x1bW4sIHggPT4geC5UZXh0KVxuICAgICAgICAgICAgLnZhbHVlKCk7XG4gICAgfVxuICAgIGdldCBzdGF0ZSgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uLmN1cnJlbnRTdGF0ZTsgfVxuICAgIDtcbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0Rm9yUGF0aChlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgICAgICAgLmZpbHRlcigoKSA9PiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0Rm9yUGF0aChwYXRoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzT24gJiYgdGhpcy5wcm9qZWN0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3QgPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeCA9PiB4LmZpbGVzU2V0LmhhcyhwYXRoKSk7XG4gICAgICAgICAgICBpZiAocHJvamVjdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHByb2plY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm9ic2VydmUucHJvamVjdEFkZGVkLmZpbHRlcih4ID0+IF8uc3RhcnRzV2l0aChwYXRoLCB4LnBhdGgpKS50YWtlKDEpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0Q29udGFpbmluZ0VkaXRvcihlZGl0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdENvbnRhaW5pbmdGaWxlKGVkaXRvci5nZXRQYXRoKCkpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0Q29udGFpbmluZ0ZpbGUocGF0aCkge1xuICAgICAgICBpZiAodGhpcy5pc09uICYmIHRoaXMucHJvamVjdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0ID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHggPT4gXy5pbmNsdWRlcyh4LnNvdXJjZUZpbGVzLCBub3JtYWxpemUocGF0aCkpKTtcbiAgICAgICAgICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YocHJvamVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9ic2VydmUucHJvamVjdEFkZGVkXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IF8uaW5jbHVkZXMoeC5zb3VyY2VGaWxlcywgbm9ybWFsaXplKHBhdGgpKSlcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgICAgIC5kZWZhdWx0SWZFbXB0eShudWxsKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfdXBkYXRlU3RhdGUoc3RhdGUpIHtcbiAgICAgICAgdGhpcy5pc09uID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RpbmcgfHwgc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZDtcbiAgICAgICAgdGhpcy5pc09mZiA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQ7XG4gICAgICAgIHRoaXMuaXNDb25uZWN0aW5nID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3Rpbmc7XG4gICAgICAgIHRoaXMuaXNSZWFkeSA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQ7XG4gICAgICAgIHRoaXMuaXNFcnJvciA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5FcnJvcjtcbiAgICAgICAgdGhpcy5fc3RhdGVTdHJlYW0ubmV4dCh0aGlzKTtcbiAgICB9XG4gICAgX3NldHVwQ29kZWNoZWNrKF9zb2x1dGlvbikge1xuICAgICAgICBjb25zdCBiYXNlQ29kZWNoZWNrID0gX3NvbHV0aW9uLm9ic2VydmUuZGlhZ25vc3RpY1xuICAgICAgICAgICAgLm1hcChkYXRhID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gW107XG4gICAgICAgICAgICBjb25zdCBjb3VudHMgPSB0aGlzLmRpYWdub3N0aWNDb3VudHM7XG4gICAgICAgICAgICBfLmVhY2goZGF0YS5SZXN1bHRzLCByZXN1bHQgPT4ge1xuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2gocmVzdWx0LkZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5kaWFnbm9zdGljc0J5RmlsZS5oYXMocmVzdWx0LkZpbGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGQgPSB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmdldChyZXN1bHQuRmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmRlbGV0ZShyZXN1bHQuRmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBncm91cGVkID0gXy5ncm91cEJ5KG9sZCwgeCA9PiB4LkxvZ0xldmVsLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgICAgICAgICBfLmVhY2goZ3JvdXBlZCwgKGl0ZW1zLCBrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghXy5pc051bWJlcihjb3VudHNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudHNba2V5XSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudHNba2V5XSAtPSBpdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY291bnRzW2tleV0gPCAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50c1trZXldID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUuc2V0KHJlc3VsdC5GaWxlTmFtZSwgXy5zb3J0QnkocmVzdWx0LlF1aWNrRml4ZXMsIHggPT4geC5MaW5lLCBxdWlja0ZpeCA9PiBxdWlja0ZpeC5Mb2dMZXZlbCwgeCA9PiB4LlRleHQpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBncm91cGVkID0gXy5ncm91cEJ5KHJlc3VsdC5RdWlja0ZpeGVzLCB4ID0+IHguTG9nTGV2ZWwudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICAgICAgXy5lYWNoKGdyb3VwZWQsIChpdGVtcywga2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghXy5pc051bWJlcihjb3VudHNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50c1trZXldID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb3VudHNba2V5XSArPSBpdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmaWxlcztcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgICAgICBjb25zdCBkaWFnbm9zdGljcyA9IGJhc2VDb2RlY2hlY2tcbiAgICAgICAgICAgIC5tYXAoeCA9PiB0aGlzLmRpYWdub3N0aWNzKVxuICAgICAgICAgICAgLmNhY2hlKDEpO1xuICAgICAgICBjb25zdCBkaWFnbm9zdGljc0J5RmlsZSA9IGJhc2VDb2RlY2hlY2tcbiAgICAgICAgICAgIC5tYXAoZmlsZXMgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgXy5lYWNoKGZpbGVzLCBmaWxlID0+IHtcbiAgICAgICAgICAgICAgICBtYXAuc2V0KGZpbGUsIHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUuZ2V0KGZpbGUpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG1hcDtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYWNoZSgxKTtcbiAgICAgICAgY29uc3QgZGlhZ25vc3RpY3NDb3VudHMgPSBiYXNlQ29kZWNoZWNrXG4gICAgICAgICAgICAubWFwKHggPT4gdGhpcy5kaWFnbm9zdGljQ291bnRzKVxuICAgICAgICAgICAgLmNhY2hlKDEpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGJhc2VDb2RlY2hlY2suc3Vic2NyaWJlKCkpO1xuICAgICAgICByZXR1cm4geyBkaWFnbm9zdGljcywgZGlhZ25vc3RpY3NCeUZpbGUsIGRpYWdub3N0aWNzQ291bnRzIH07XG4gICAgfVxuICAgIF9zZXR1cFN0YXR1cyhfc29sdXRpb24pIHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gX3NvbHV0aW9uLnN0YXR1c1xuICAgICAgICAgICAgLnN0YXJ0V2l0aCh7fSlcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH1cbn1cbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtTb2x1dGlvbn0gZnJvbSBcIi4vc29sdXRpb25cIjtcclxuaW1wb3J0IHtNb2RlbHMsIERyaXZlclN0YXRlLCBPbW5pc2hhcnBDbGllbnRTdGF0dXN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgUmVwbGF5U3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtub3JtYWxpemV9IGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7UHJvamVjdFZpZXdNb2RlbCwgcHJvamVjdFZpZXdNb2RlbEZhY3RvcnksIHdvcmtzcGFjZVZpZXdNb2RlbEZhY3Rvcnl9IGZyb20gXCIuL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xyXG5pbXBvcnQge091dHB1dE1lc3NhZ2VFbGVtZW50fSBmcm9tIFwiLi4vdmlld3Mvb3V0cHV0LW1lc3NhZ2UtZWxlbWVudFwiO1xyXG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcclxuaW1wb3J0IHtidWZmZXJGb3J9IGZyb20gXCIuLi9vcGVyYXRvcnMvYnVmZmVyRm9yXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFZNVmlld1N0YXRlIHtcclxuICAgIGlzT2ZmOiBib29sZWFuO1xyXG4gICAgaXNDb25uZWN0aW5nOiBib29sZWFuO1xyXG4gICAgaXNPbjogYm9vbGVhbjtcclxuICAgIGlzUmVhZHk6IGJvb2xlYW47XHJcbiAgICBpc0Vycm9yOiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVmlld01vZGVsIGltcGxlbWVudHMgVk1WaWV3U3RhdGUsIElEaXNwb3NhYmxlIHtcclxuICAgIHB1YmxpYyBpc09mZjogYm9vbGVhbjtcclxuICAgIHB1YmxpYyBpc0Nvbm5lY3Rpbmc6IGJvb2xlYW47XHJcbiAgICBwdWJsaWMgaXNPbjogYm9vbGVhbjtcclxuICAgIHB1YmxpYyBpc1JlYWR5OiBib29sZWFuO1xyXG4gICAgcHVibGljIGlzRXJyb3I6IGJvb2xlYW47XHJcblxyXG4gICAgcHJpdmF0ZSBfdW5pcXVlSWQ6IHN0cmluZztcclxuICAgIHB1YmxpYyBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIHB1YmxpYyBnZXQgdW5pcXVlSWQoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbi51bmlxdWVJZDsgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgaW5kZXgoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbi5pbmRleDsgfVxyXG4gICAgcHVibGljIGdldCBwYXRoKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24ucGF0aDsgfVxyXG4gICAgcHVibGljIG91dHB1dDogT3V0cHV0TWVzc2FnZVtdID0gW107XHJcbiAgICBwdWJsaWMgb3V0cHV0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICBwdWJsaWMgZGlhZ25vc3RpY3NCeUZpbGUgPSBuZXcgTWFwPHN0cmluZywgTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPigpO1xyXG4gICAgcHVibGljIGdldCBkaWFnbm9zdGljcygpIHtcclxuICAgICAgICByZXR1cm4gXyhfLnRvQXJyYXkodGhpcy5kaWFnbm9zdGljc0J5RmlsZS52YWx1ZXMoKSkpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKHggPT4geClcclxuICAgICAgICAgICAgLnNvcnRCeSh4ID0+IHguTG9nTGV2ZWwsIHggPT4geC5GaWxlTmFtZSwgeCA9PiB4LkxpbmUsIHggPT4geC5Db2x1bW4sIHggPT4geC5UZXh0KVxyXG4gICAgICAgICAgICAudmFsdWUoKTtcclxuICAgIH1cclxuICAgIHB1YmxpYyBkaWFnbm9zdGljQ291bnRzOiB7IFtpbmRleDogc3RyaW5nXTogbnVtYmVyOyB9ID0geyBlcnJvcjogMCwgd2FybmluZzogMCwgaGlkZGVuOiAwIH07XHJcblxyXG4gICAgcHVibGljIGVycm9yczogbnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyB3YXJuaW5nczogbnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyBoaWRkZW46IG51bWJlciA9IDA7XHJcblxyXG4gICAgcHVibGljIGdldCBzdGF0ZSgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uLmN1cnJlbnRTdGF0ZTsgfTtcclxuICAgIHB1YmxpYyBwYWNrYWdlU291cmNlczogc3RyaW5nW10gPSBbXTtcclxuICAgIHB1YmxpYyBwcm9qZWN0czogUHJvamVjdFZpZXdNb2RlbDxhbnk+W10gPSBbXTtcclxuICAgIHByaXZhdGUgX3Byb2plY3RBZGRlZFN0cmVhbSA9IG5ldyBTdWJqZWN0PFByb2plY3RWaWV3TW9kZWw8YW55Pj4oKTtcclxuICAgIHByaXZhdGUgX3Byb2plY3RSZW1vdmVkU3RyZWFtID0gbmV3IFN1YmplY3Q8UHJvamVjdFZpZXdNb2RlbDxhbnk+PigpO1xyXG4gICAgcHJpdmF0ZSBfcHJvamVjdENoYW5nZWRTdHJlYW0gPSBuZXcgU3ViamVjdDxQcm9qZWN0Vmlld01vZGVsPGFueT4+KCk7XHJcbiAgICBwcml2YXRlIF9zdGF0ZVN0cmVhbSA9IG5ldyBSZXBsYXlTdWJqZWN0PFZpZXdNb2RlbD4oMSk7XHJcblxyXG4gICAgcHVibGljIG9ic2VydmU6IHtcclxuICAgICAgICBkaWFnbm9zdGljczogT2JzZXJ2YWJsZTxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+O1xyXG4gICAgICAgIGRpYWdub3N0aWNzQ291bnRzOiBPYnNlcnZhYmxlPHsgW2luZGV4OiBzdHJpbmddOiBudW1iZXI7IH0+O1xyXG4gICAgICAgIGRpYWdub3N0aWNzQnlGaWxlOiBPYnNlcnZhYmxlPE1hcDxzdHJpbmcsIE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4+O1xyXG4gICAgICAgIG91dHB1dDogT2JzZXJ2YWJsZTxPdXRwdXRNZXNzYWdlW10+O1xyXG4gICAgICAgIHN0YXR1czogT2JzZXJ2YWJsZTxPbW5pc2hhcnBDbGllbnRTdGF0dXM+O1xyXG4gICAgICAgIHN0YXRlOiBPYnNlcnZhYmxlPFZpZXdNb2RlbD47XHJcbiAgICAgICAgcHJvamVjdEFkZGVkOiBPYnNlcnZhYmxlPFByb2plY3RWaWV3TW9kZWw8YW55Pj47XHJcbiAgICAgICAgcHJvamVjdFJlbW92ZWQ6IE9ic2VydmFibGU8UHJvamVjdFZpZXdNb2RlbDxhbnk+PjtcclxuICAgICAgICBwcm9qZWN0Q2hhbmdlZDogT2JzZXJ2YWJsZTxQcm9qZWN0Vmlld01vZGVsPGFueT4+O1xyXG4gICAgICAgIHByb2plY3RzOiBPYnNlcnZhYmxlPFByb2plY3RWaWV3TW9kZWw8YW55PltdPjtcclxuICAgIH07XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfc29sdXRpb246IFNvbHV0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5fdW5pcXVlSWQgPSBfc29sdXRpb24udW5pcXVlSWQ7XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlU3RhdGUoX3NvbHV0aW9uLmN1cnJlbnRTdGF0ZSk7XHJcblxyXG4gICAgICAgIHRoaXMub3V0cHV0RWxlbWVudC5jbGFzc0xpc3QuYWRkKFwibWVzc2FnZXMtY29udGFpbmVyXCIpO1xyXG5cclxuICAgICAgICAvLyBNYW5hZ2Ugb3VyIGJ1aWxkIGxvZyBmb3IgZGlzcGxheVxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLmxvZ3NcclxuICAgICAgICAgICAgLnN1YnNjcmliZShldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm91dHB1dC5wdXNoKGV2ZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vdXRwdXQubGVuZ3RoID4gMTAwMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3V0cHV0LnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBidWZmZXJGb3IoX3NvbHV0aW9uLmxvZ3MsIDEwMClcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoaXRlbXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCByZW1vdmFsczogRWxlbWVudFtdID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3V0cHV0RWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPT09IDEwMDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZhbHMucHVzaCh0aGlzLm91dHB1dEVsZW1lbnQuY2hpbGRyZW5baV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF8uZWFjaChyZW1vdmFscywgeCA9PiB4LnJlbW92ZSgpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF8uZWFjaChpdGVtcywgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdXRwdXRFbGVtZW50LmFwcGVuZENoaWxkKE91dHB1dE1lc3NhZ2VFbGVtZW50LmNyZWF0ZShldmVudCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBfc29sdXRpb24uc3RhdGUuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoKHRoaXMucHJvamVjdHMuc2xpY2UoKSwgcHJvamVjdCA9PiB0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbS5uZXh0KHByb2plY3QpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2plY3RzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaWFnbm9zdGljc0J5RmlsZS5jbGVhcigpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zdCB7ZGlhZ25vc3RpY3MsIGRpYWdub3N0aWNzQnlGaWxlLCBkaWFnbm9zdGljc0NvdW50c30gPSB0aGlzLl9zZXR1cENvZGVjaGVjayhfc29sdXRpb24pO1xyXG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuX3NldHVwU3RhdHVzKF9zb2x1dGlvbik7XHJcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5vdXRwdXQ7XHJcblxyXG4gICAgICAgIGNvbnN0IF9wcm9qZWN0QWRkZWRTdHJlYW0gPSB0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0uc2hhcmUoKTtcclxuICAgICAgICBjb25zdCBfcHJvamVjdFJlbW92ZWRTdHJlYW0gPSB0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbS5zaGFyZSgpO1xyXG4gICAgICAgIGNvbnN0IF9wcm9qZWN0Q2hhbmdlZFN0cmVhbSA9IHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtLnNoYXJlKCk7XHJcbiAgICAgICAgY29uc3QgcHJvamVjdHMgPSBPYnNlcnZhYmxlLm1lcmdlKF9wcm9qZWN0QWRkZWRTdHJlYW0sIF9wcm9qZWN0UmVtb3ZlZFN0cmVhbSwgX3Byb2plY3RDaGFuZ2VkU3RyZWFtKVxyXG4gICAgICAgICAgICAuc3RhcnRXaXRoKDxhbnk+W10pXHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwKVxyXG4gICAgICAgICAgICAubWFwKHogPT4gdGhpcy5wcm9qZWN0cylcclxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgb3V0cHV0T2JzZXJ2YWJsZSA9IF9zb2x1dGlvbi5sb2dzXHJcbiAgICAgICAgICAgIC5hdWRpdFRpbWUoMTAwKVxyXG4gICAgICAgICAgICAubWFwKCgpID0+IG91dHB1dCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5fc3RhdGVTdHJlYW07XHJcblxyXG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHtcclxuICAgICAgICAgICAgZ2V0IGRpYWdub3N0aWNzKCkgeyByZXR1cm4gZGlhZ25vc3RpY3M7IH0sXHJcbiAgICAgICAgICAgIGdldCBkaWFnbm9zdGljc0NvdW50cygpIHsgcmV0dXJuIGRpYWdub3N0aWNzQ291bnRzOyB9LFxyXG4gICAgICAgICAgICBnZXQgZGlhZ25vc3RpY3NCeUZpbGUoKSB7IHJldHVybiBkaWFnbm9zdGljc0J5RmlsZTsgfSxcclxuICAgICAgICAgICAgZ2V0IG91dHB1dCgpIHsgcmV0dXJuIG91dHB1dE9ic2VydmFibGU7IH0sXHJcbiAgICAgICAgICAgIGdldCBzdGF0dXMoKSB7IHJldHVybiBzdGF0dXM7IH0sXHJcbiAgICAgICAgICAgIGdldCBzdGF0ZSgpIHsgcmV0dXJuIDxPYnNlcnZhYmxlPFZpZXdNb2RlbD4+PGFueT5zdGF0ZTsgfSxcclxuICAgICAgICAgICAgZ2V0IHByb2plY3RzKCkgeyByZXR1cm4gcHJvamVjdHM7IH0sXHJcbiAgICAgICAgICAgIGdldCBwcm9qZWN0QWRkZWQoKSB7IHJldHVybiBfcHJvamVjdEFkZGVkU3RyZWFtOyB9LFxyXG4gICAgICAgICAgICBnZXQgcHJvamVjdFJlbW92ZWQoKSB7IHJldHVybiBfcHJvamVjdFJlbW92ZWRTdHJlYW07IH0sXHJcbiAgICAgICAgICAgIGdldCBwcm9qZWN0Q2hhbmdlZCgpIHsgcmV0dXJuIF9wcm9qZWN0Q2hhbmdlZFN0cmVhbTsgfSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5zdGF0ZS5zdWJzY3JpYmUoXy5iaW5kKHRoaXMuX3VwZGF0ZVN0YXRlLCB0aGlzKSkpO1xyXG5cclxuICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xyXG4gICAgICAgICh3aW5kb3dbXCJjbGllbnRzXCJdIHx8ICh3aW5kb3dbXCJjbGllbnRzXCJdID0gW10pKS5wdXNoKHRoaXMpOyAgLy9URU1QXHJcbiAgICAgICAgLyogdHNsaW50OmVuYWJsZSAqL1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5zdGF0ZS5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgX3NvbHV0aW9uLnByb2plY3RzKHsgRXhjbHVkZVNvdXJjZUZpbGVzOiBmYWxzZSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBfc29sdXRpb24ucGFja2FnZXNvdXJjZSh7IFByb2plY3RQYXRoOiBfc29sdXRpb24ucGF0aCB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhY2thZ2VTb3VyY2VzID0gcmVzcG9uc2UuU291cmNlcztcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5zdGF0ZS5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLnByb2plY3RzLnNsaWNlKCksIHByb2plY3QgPT4gdGhpcy5fcHJvamVjdFJlbW92ZWRTdHJlYW0ubmV4dChwcm9qZWN0KSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5vYnNlcnZlLnByb2plY3RBZGRlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcclxuICAgICAgICAgICAgXy5lYWNoKHByb2plY3RWaWV3TW9kZWxGYWN0b3J5KHByb2plY3RJbmZvcm1hdGlvbiwgX3NvbHV0aW9uLnByb2plY3RQYXRoKSwgcHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIV8uc29tZSh0aGlzLnByb2plY3RzLCB7IHBhdGg6IHByb2plY3QucGF0aCB9KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdHMucHVzaChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5vYnNlcnZlLnByb2plY3RSZW1vdmVkLnN1YnNjcmliZShwcm9qZWN0SW5mb3JtYXRpb24gPT4ge1xyXG4gICAgICAgICAgICBfLmVhY2gocHJvamVjdFZpZXdNb2RlbEZhY3RvcnkocHJvamVjdEluZm9ybWF0aW9uLCBfc29sdXRpb24ucHJvamVjdFBhdGgpLCBwcm9qZWN0ID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kOiBQcm9qZWN0Vmlld01vZGVsPGFueT4gPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICBfLnB1bGwodGhpcy5wcm9qZWN0cywgZm91bmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0Q2hhbmdlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcclxuICAgICAgICAgICAgXy5lYWNoKHByb2plY3RWaWV3TW9kZWxGYWN0b3J5KHByb2plY3RJbmZvcm1hdGlvbiwgX3NvbHV0aW9uLnByb2plY3RQYXRoKSwgcHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZDogUHJvamVjdFZpZXdNb2RlbDxhbnk+ID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHsgcGF0aDogcHJvamVjdC5wYXRoIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm91bmQudXBkYXRlKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtLm5leHQocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0cy5zdWJzY3JpYmUoY29udGV4dCA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaCh3b3Jrc3BhY2VWaWV3TW9kZWxGYWN0b3J5KGNvbnRleHQucmVzcG9uc2UsIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmQ6IFByb2plY3RWaWV3TW9kZWw8YW55PiA9IF8uZmluZCh0aGlzLnByb2plY3RzLCB7IHBhdGg6IHByb2plY3QucGF0aCB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kLnVwZGF0ZShwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0Q2hhbmdlZFN0cmVhbS5uZXh0KHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2plY3RzLnB1c2gocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtLm5leHQocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0pO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0pO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5fcHJvamVjdFJlbW92ZWRTdHJlYW0pO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgXy5lYWNoKHRoaXMucHJvamVjdHMsIHggPT4geC5kaXNwb3NlKCkpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdEZvclBhdGgoZWRpdG9yLmdldFBhdGgoKSlcclxuICAgICAgICAgICAgLmZpbHRlcigoKSA9PiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRQcm9qZWN0Rm9yUGF0aChwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodGhpcy5pc09uICYmIHRoaXMucHJvamVjdHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3QgPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeCA9PiB4LmZpbGVzU2V0LmhhcyhwYXRoKSk7XHJcbiAgICAgICAgICAgIGlmIChwcm9qZWN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihwcm9qZWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JzZXJ2ZS5wcm9qZWN0QWRkZWQuZmlsdGVyKHggPT4gXy5zdGFydHNXaXRoKHBhdGgsIHgucGF0aCkpLnRha2UoMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFByb2plY3RDb250YWluaW5nRWRpdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdENvbnRhaW5pbmdGaWxlKGVkaXRvci5nZXRQYXRoKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRQcm9qZWN0Q29udGFpbmluZ0ZpbGUocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNPbiAmJiB0aGlzLnByb2plY3RzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0ID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHggPT4gXy5pbmNsdWRlcyh4LnNvdXJjZUZpbGVzLCBub3JtYWxpemUocGF0aCkpKTtcclxuICAgICAgICAgICAgaWYgKHByb2plY3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHByb2plY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKG51bGwpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9ic2VydmUucHJvamVjdEFkZGVkXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4gXy5pbmNsdWRlcyh4LnNvdXJjZUZpbGVzLCBub3JtYWxpemUocGF0aCkpKVxyXG4gICAgICAgICAgICAgICAgLnRha2UoMSlcclxuICAgICAgICAgICAgICAgIC5kZWZhdWx0SWZFbXB0eShudWxsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfdXBkYXRlU3RhdGUoc3RhdGU6IERyaXZlclN0YXRlKSB7XHJcbiAgICAgICAgdGhpcy5pc09uID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RpbmcgfHwgc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZDtcclxuICAgICAgICB0aGlzLmlzT2ZmID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZDtcclxuICAgICAgICB0aGlzLmlzQ29ubmVjdGluZyA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0aW5nO1xyXG4gICAgICAgIHRoaXMuaXNSZWFkeSA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQ7XHJcbiAgICAgICAgdGhpcy5pc0Vycm9yID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkVycm9yO1xyXG5cclxuICAgICAgICB0aGlzLl9zdGF0ZVN0cmVhbS5uZXh0KHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NldHVwQ29kZWNoZWNrKF9zb2x1dGlvbjogU29sdXRpb24pIHtcclxuICAgICAgICBjb25zdCBiYXNlQ29kZWNoZWNrID0gX3NvbHV0aW9uLm9ic2VydmUuZGlhZ25vc3RpY1xyXG4gICAgICAgICAgICAubWFwKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZXM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb3VudHMgPSB0aGlzLmRpYWdub3N0aWNDb3VudHM7XHJcbiAgICAgICAgICAgICAgICBfLmVhY2goZGF0YS5SZXN1bHRzLCByZXN1bHQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbGVzLnB1c2gocmVzdWx0LkZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kaWFnbm9zdGljc0J5RmlsZS5oYXMocmVzdWx0LkZpbGVOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGQgPSB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmdldChyZXN1bHQuRmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmRlbGV0ZShyZXN1bHQuRmlsZU5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBlZCA9IF8uZ3JvdXBCeShvbGQsIHggPT4geC5Mb2dMZXZlbC50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXy5lYWNoKGdyb3VwZWQsIChpdGVtcywga2V5KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNOdW1iZXIoY291bnRzW2tleV0pKSB7IGNvdW50c1trZXldID0gMDsgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnRzW2tleV0gLT0gaXRlbXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvdW50c1trZXldIDwgMCkgY291bnRzW2tleV0gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUuc2V0KHJlc3VsdC5GaWxlTmFtZSwgXy5zb3J0QnkocmVzdWx0LlF1aWNrRml4ZXMsIHggPT4geC5MaW5lLCBxdWlja0ZpeCA9PiBxdWlja0ZpeC5Mb2dMZXZlbCwgeCA9PiB4LlRleHQpKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBncm91cGVkID0gXy5ncm91cEJ5KHJlc3VsdC5RdWlja0ZpeGVzLCB4ID0+IHguTG9nTGV2ZWwudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoKGdyb3VwZWQsIChpdGVtcywga2V5KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghXy5pc051bWJlcihjb3VudHNba2V5XSkpIHsgY291bnRzW2tleV0gPSAwOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50c1trZXldICs9IGl0ZW1zLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGVzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGlhZ25vc3RpY3MgPSBiYXNlQ29kZWNoZWNrXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiB0aGlzLmRpYWdub3N0aWNzKVxyXG4gICAgICAgICAgICAuY2FjaGUoMSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRpYWdub3N0aWNzQnlGaWxlID0gYmFzZUNvZGVjaGVja1xyXG4gICAgICAgICAgICAubWFwKGZpbGVzID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXA8c3RyaW5nLCBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KCk7XHJcbiAgICAgICAgICAgICAgICBfLmVhY2goZmlsZXMsIGZpbGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcC5zZXQoZmlsZSwgdGhpcy5kaWFnbm9zdGljc0J5RmlsZS5nZXQoZmlsZSkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2FjaGUoMSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRpYWdub3N0aWNzQ291bnRzID0gYmFzZUNvZGVjaGVja1xyXG4gICAgICAgICAgICAubWFwKHggPT4gdGhpcy5kaWFnbm9zdGljQ291bnRzKVxyXG4gICAgICAgICAgICAuY2FjaGUoMSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYmFzZUNvZGVjaGVjay5zdWJzY3JpYmUoKSk7XHJcbiAgICAgICAgcmV0dXJuIHsgZGlhZ25vc3RpY3MsIGRpYWdub3N0aWNzQnlGaWxlLCBkaWFnbm9zdGljc0NvdW50cyB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NldHVwU3RhdHVzKF9zb2x1dGlvbjogU29sdXRpb24pIHtcclxuICAgICAgICBjb25zdCBzdGF0dXMgPSBfc29sdXRpb24uc3RhdHVzXHJcbiAgICAgICAgICAgIC5zdGFydFdpdGgoPGFueT57fSlcclxuICAgICAgICAgICAgLnNoYXJlKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBzdGF0dXM7XHJcbiAgICB9XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
