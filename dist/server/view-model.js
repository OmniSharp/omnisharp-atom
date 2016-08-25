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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvdmlldy1tb2RlbC5qcyIsImxpYi9zZXJ2ZXIvdmlldy1tb2RlbC50cyJdLCJuYW1lcyI6WyJmYXN0ZG9tIiwicmVxdWlyZSIsIlZpZXdNb2RlbCIsIl9zb2x1dGlvbiIsImRpc3Bvc2FibGUiLCJvdXRwdXQiLCJvdXRwdXRFbGVtZW50IiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiZGlhZ25vc3RpY3NCeUZpbGUiLCJNYXAiLCJkaWFnbm9zdGljQ291bnRzIiwiZXJyb3IiLCJ3YXJuaW5nIiwiaGlkZGVuIiwiZXJyb3JzIiwid2FybmluZ3MiLCJwYWNrYWdlU291cmNlcyIsInByb2plY3RzIiwiX3Byb2plY3RBZGRlZFN0cmVhbSIsIl9wcm9qZWN0UmVtb3ZlZFN0cmVhbSIsIl9wcm9qZWN0Q2hhbmdlZFN0cmVhbSIsIl9zdGF0ZVN0cmVhbSIsIl91bmlxdWVJZCIsInVuaXF1ZUlkIiwiX3VwZGF0ZVN0YXRlIiwiY3VycmVudFN0YXRlIiwiY2xhc3NMaXN0IiwiYWRkIiwibG9ncyIsInN1YnNjcmliZSIsInB1c2giLCJldmVudCIsImxlbmd0aCIsInNoaWZ0IiwicmVtb3ZhbHMiLCJjaGlsZHJlbiIsImkiLCJpdGVtcyIsIm11dGF0ZSIsImVhY2giLCJ4IiwicmVtb3ZlIiwiYXBwZW5kQ2hpbGQiLCJjcmVhdGUiLCJzdGF0ZSIsImZpbHRlciIsInoiLCJEaXNjb25uZWN0ZWQiLCJzbGljZSIsIm5leHQiLCJwcm9qZWN0IiwiY2xlYXIiLCJfc2V0dXBDb2RlY2hlY2siLCJkaWFnbm9zdGljcyIsImRpYWdub3N0aWNzQ291bnRzIiwic3RhdHVzIiwiX3NldHVwU3RhdHVzIiwic2hhcmUiLCJtZXJnZSIsInN0YXJ0V2l0aCIsImRlYm91bmNlVGltZSIsIm1hcCIsInB1Ymxpc2hSZXBsYXkiLCJyZWZDb3VudCIsIm91dHB1dE9ic2VydmFibGUiLCJhdWRpdFRpbWUiLCJvYnNlcnZlIiwicHJvamVjdEFkZGVkIiwicHJvamVjdFJlbW92ZWQiLCJwcm9qZWN0Q2hhbmdlZCIsImJpbmQiLCJ3aW5kb3ciLCJDb25uZWN0ZWQiLCJFeGNsdWRlU291cmNlRmlsZXMiLCJwYWNrYWdlc291cmNlIiwiUHJvamVjdFBhdGgiLCJwYXRoIiwicmVzcG9uc2UiLCJTb3VyY2VzIiwicHJvamVjdEluZm9ybWF0aW9uIiwicHJvamVjdFBhdGgiLCJzb21lIiwiZm91bmQiLCJmaW5kIiwicHVsbCIsInVwZGF0ZSIsImNvbnRleHQiLCJkaXNwb3NlIiwiZWRpdG9yIiwiZ2V0UHJvamVjdEZvclBhdGgiLCJnZXRQYXRoIiwiaXNEZXN0cm95ZWQiLCJpc09uIiwiZmlsZXNTZXQiLCJoYXMiLCJvZiIsInN0YXJ0c1dpdGgiLCJ0YWtlIiwiZ2V0UHJvamVjdENvbnRhaW5pbmdGaWxlIiwiaW5jbHVkZXMiLCJzb3VyY2VGaWxlcyIsImRlZmF1bHRJZkVtcHR5IiwiQ29ubmVjdGluZyIsImlzT2ZmIiwiaXNDb25uZWN0aW5nIiwiaXNSZWFkeSIsImlzRXJyb3IiLCJFcnJvciIsImJhc2VDb2RlY2hlY2siLCJkaWFnbm9zdGljIiwiZmlsZXMiLCJjb3VudHMiLCJkYXRhIiwiUmVzdWx0cyIsInJlc3VsdCIsIkZpbGVOYW1lIiwib2xkIiwiZ2V0IiwiZGVsZXRlIiwiZ3JvdXBlZCIsImdyb3VwQnkiLCJMb2dMZXZlbCIsInRvTG93ZXJDYXNlIiwia2V5IiwiaXNOdW1iZXIiLCJzZXQiLCJzb3J0QnkiLCJRdWlja0ZpeGVzIiwiTGluZSIsInF1aWNrRml4IiwiVGV4dCIsImNhY2hlIiwiZmlsZSIsImluZGV4IiwidG9BcnJheSIsInZhbHVlcyIsImZsYXRNYXAiLCJDb2x1bW4iLCJ2YWx1ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7Ozs7O0FDQUEsSUFBSUEsVUFBMEJDLFFBQVEsU0FBUixDQUE5Qjs7SUFXQUMsUyxXQUFBQSxTO0FBaURJLHVCQUFvQkMsU0FBcEIsRUFBdUM7QUFB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dEIsRUFFdUM7QUFBQSx1QkFBSzNFLEVBQUV3RixJQUFQO0FBQUEsYUFGdkMsRUFFb0Q7QUFBQSx1QkFBS3hGLEVBQUVpRyxNQUFQO0FBQUEsYUFGcEQsRUFFbUU7QUFBQSx1QkFBS2pHLEVBQUUwRixJQUFQO0FBQUEsYUFGbkUsRUFHRlEsS0FIRSxFQUFQO0FBSUg7Ozs0QkFPZTtBQUFLLG1CQUFPLEtBQUt4SSxTQUFMLENBQWV1QixZQUF0QjtBQUFxQyIsImZpbGUiOiJsaWIvc2VydmVyL3ZpZXctbW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBEcml2ZXJTdGF0ZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJqZWN0LCBSZXBsYXlTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZSB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBwcm9qZWN0Vmlld01vZGVsRmFjdG9yeSwgd29ya3NwYWNlVmlld01vZGVsRmFjdG9yeSB9IGZyb20gXCIuL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xuaW1wb3J0IHsgT3V0cHV0TWVzc2FnZUVsZW1lbnQgfSBmcm9tIFwiLi4vdmlld3Mvb3V0cHV0LW1lc3NhZ2UtZWxlbWVudFwiO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmltcG9ydCB7IGJ1ZmZlckZvciB9IGZyb20gXCIuLi9vcGVyYXRvcnMvYnVmZmVyRm9yXCI7XG5leHBvcnQgY2xhc3MgVmlld01vZGVsIHtcbiAgICBjb25zdHJ1Y3Rvcihfc29sdXRpb24pIHtcbiAgICAgICAgdGhpcy5fc29sdXRpb24gPSBfc29sdXRpb247XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMub3V0cHV0ID0gW107XG4gICAgICAgIHRoaXMub3V0cHV0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuZGlhZ25vc3RpY0NvdW50cyA9IHsgZXJyb3I6IDAsIHdhcm5pbmc6IDAsIGhpZGRlbjogMCB9O1xuICAgICAgICB0aGlzLmVycm9ycyA9IDA7XG4gICAgICAgIHRoaXMud2FybmluZ3MgPSAwO1xuICAgICAgICB0aGlzLmhpZGRlbiA9IDA7XG4gICAgICAgIHRoaXMucGFja2FnZVNvdXJjZXMgPSBbXTtcbiAgICAgICAgdGhpcy5wcm9qZWN0cyA9IFtdO1xuICAgICAgICB0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0gPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICB0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5fc3RhdGVTdHJlYW0gPSBuZXcgUmVwbGF5U3ViamVjdCgxKTtcbiAgICAgICAgdGhpcy5fdW5pcXVlSWQgPSBfc29sdXRpb24udW5pcXVlSWQ7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVN0YXRlKF9zb2x1dGlvbi5jdXJyZW50U3RhdGUpO1xuICAgICAgICB0aGlzLm91dHB1dEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIm1lc3NhZ2VzLWNvbnRhaW5lclwiKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ubG9nc1xuICAgICAgICAgICAgLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICAgICAgICB0aGlzLm91dHB1dC5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgIGlmICh0aGlzLm91dHB1dC5sZW5ndGggPiAxMDAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vdXRwdXQuc2hpZnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksIGJ1ZmZlckZvcihfc29sdXRpb24ubG9ncywgMTAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZShpdGVtcyA9PiB7XG4gICAgICAgICAgICBsZXQgcmVtb3ZhbHMgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLm91dHB1dEVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID09PSAxMDAwKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmFscy5wdXNoKHRoaXMub3V0cHV0RWxlbWVudC5jaGlsZHJlbltpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIF8uZWFjaChyZW1vdmFscywgeCA9PiB4LnJlbW92ZSgpKTtcbiAgICAgICAgICAgICAgICBfLmVhY2goaXRlbXMsIGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdXRwdXRFbGVtZW50LmFwcGVuZENoaWxkKE91dHB1dE1lc3NhZ2VFbGVtZW50LmNyZWF0ZShldmVudCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLCBfc29sdXRpb24uc3RhdGUuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5wcm9qZWN0cy5zbGljZSgpLCBwcm9qZWN0ID0+IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCkpO1xuICAgICAgICAgICAgdGhpcy5wcm9qZWN0cyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5kaWFnbm9zdGljc0J5RmlsZS5jbGVhcigpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNvbnN0IHsgZGlhZ25vc3RpY3MsIGRpYWdub3N0aWNzQnlGaWxlLCBkaWFnbm9zdGljc0NvdW50cyB9ID0gdGhpcy5fc2V0dXBDb2RlY2hlY2soX3NvbHV0aW9uKTtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy5fc2V0dXBTdGF0dXMoX3NvbHV0aW9uKTtcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5vdXRwdXQ7XG4gICAgICAgIGNvbnN0IF9wcm9qZWN0QWRkZWRTdHJlYW0gPSB0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0uc2hhcmUoKTtcbiAgICAgICAgY29uc3QgX3Byb2plY3RSZW1vdmVkU3RyZWFtID0gdGhpcy5fcHJvamVjdFJlbW92ZWRTdHJlYW0uc2hhcmUoKTtcbiAgICAgICAgY29uc3QgX3Byb2plY3RDaGFuZ2VkU3RyZWFtID0gdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0uc2hhcmUoKTtcbiAgICAgICAgY29uc3QgcHJvamVjdHMgPSBPYnNlcnZhYmxlLm1lcmdlKF9wcm9qZWN0QWRkZWRTdHJlYW0sIF9wcm9qZWN0UmVtb3ZlZFN0cmVhbSwgX3Byb2plY3RDaGFuZ2VkU3RyZWFtKVxuICAgICAgICAgICAgLnN0YXJ0V2l0aChbXSlcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwKVxuICAgICAgICAgICAgLm1hcCh6ID0+IHRoaXMucHJvamVjdHMpXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuICAgICAgICBjb25zdCBvdXRwdXRPYnNlcnZhYmxlID0gX3NvbHV0aW9uLmxvZ3NcbiAgICAgICAgICAgIC5hdWRpdFRpbWUoMTAwKVxuICAgICAgICAgICAgLm1hcCgoKSA9PiBvdXRwdXQpO1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuX3N0YXRlU3RyZWFtO1xuICAgICAgICB0aGlzLm9ic2VydmUgPSB7XG4gICAgICAgICAgICBnZXQgZGlhZ25vc3RpY3MoKSB7IHJldHVybiBkaWFnbm9zdGljczsgfSxcbiAgICAgICAgICAgIGdldCBkaWFnbm9zdGljc0NvdW50cygpIHsgcmV0dXJuIGRpYWdub3N0aWNzQ291bnRzOyB9LFxuICAgICAgICAgICAgZ2V0IGRpYWdub3N0aWNzQnlGaWxlKCkgeyByZXR1cm4gZGlhZ25vc3RpY3NCeUZpbGU7IH0sXG4gICAgICAgICAgICBnZXQgb3V0cHV0KCkgeyByZXR1cm4gb3V0cHV0T2JzZXJ2YWJsZTsgfSxcbiAgICAgICAgICAgIGdldCBzdGF0dXMoKSB7IHJldHVybiBzdGF0dXM7IH0sXG4gICAgICAgICAgICBnZXQgc3RhdGUoKSB7IHJldHVybiBzdGF0ZTsgfSxcbiAgICAgICAgICAgIGdldCBwcm9qZWN0cygpIHsgcmV0dXJuIHByb2plY3RzOyB9LFxuICAgICAgICAgICAgZ2V0IHByb2plY3RBZGRlZCgpIHsgcmV0dXJuIF9wcm9qZWN0QWRkZWRTdHJlYW07IH0sXG4gICAgICAgICAgICBnZXQgcHJvamVjdFJlbW92ZWQoKSB7IHJldHVybiBfcHJvamVjdFJlbW92ZWRTdHJlYW07IH0sXG4gICAgICAgICAgICBnZXQgcHJvamVjdENoYW5nZWQoKSB7IHJldHVybiBfcHJvamVjdENoYW5nZWRTdHJlYW07IH0sXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLnN0YXRlLnN1YnNjcmliZShfLmJpbmQodGhpcy5fdXBkYXRlU3RhdGUsIHRoaXMpKSk7XG4gICAgICAgICh3aW5kb3dbXCJjbGllbnRzXCJdIHx8ICh3aW5kb3dbXCJjbGllbnRzXCJdID0gW10pKS5wdXNoKHRoaXMpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5zdGF0ZS5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIF9zb2x1dGlvbi5wcm9qZWN0cyh7IEV4Y2x1ZGVTb3VyY2VGaWxlczogZmFsc2UgfSk7XG4gICAgICAgICAgICBfc29sdXRpb24ucGFja2FnZXNvdXJjZSh7IFByb2plY3RQYXRoOiBfc29sdXRpb24ucGF0aCB9KVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucGFja2FnZVNvdXJjZXMgPSByZXNwb25zZS5Tb3VyY2VzO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24uc3RhdGUuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMucHJvamVjdHMuc2xpY2UoKSwgcHJvamVjdCA9PiB0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbS5uZXh0KHByb2plY3QpKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5vYnNlcnZlLnByb2plY3RBZGRlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghXy5zb21lKHRoaXMucHJvamVjdHMsIHsgcGF0aDogcHJvamVjdC5wYXRoIH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdHMucHVzaChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtLm5leHQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0UmVtb3ZlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHsgcGF0aDogcHJvamVjdC5wYXRoIH0pO1xuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICBfLnB1bGwodGhpcy5wcm9qZWN0cywgZm91bmQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbS5uZXh0KHByb2plY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLm9ic2VydmUucHJvamVjdENoYW5nZWQuc3Vic2NyaWJlKHByb2plY3RJbmZvcm1hdGlvbiA9PiB7XG4gICAgICAgICAgICBfLmVhY2gocHJvamVjdFZpZXdNb2RlbEZhY3RvcnkocHJvamVjdEluZm9ybWF0aW9uLCBfc29sdXRpb24ucHJvamVjdFBhdGgpLCBwcm9qZWN0ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IF8uZmluZCh0aGlzLnByb2plY3RzLCB7IHBhdGg6IHByb2plY3QucGF0aCB9KTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmQudXBkYXRlKHByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0Q2hhbmdlZFN0cmVhbS5uZXh0KHByb2plY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLm9ic2VydmUucHJvamVjdHMuc3Vic2NyaWJlKGNvbnRleHQgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHdvcmtzcGFjZVZpZXdNb2RlbEZhY3RvcnkoY29udGV4dC5yZXNwb25zZSwgX3NvbHV0aW9uLnByb2plY3RQYXRoKSwgcHJvamVjdCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kLnVwZGF0ZShwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdHMucHVzaChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtLm5leHQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0pO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMucHJvamVjdHMsIHggPT4geC5kaXNwb3NlKCkpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGdldCB1bmlxdWVJZCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uLnVuaXF1ZUlkOyB9XG4gICAgZ2V0IGluZGV4KCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24uaW5kZXg7IH1cbiAgICBnZXQgcGF0aCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uLnBhdGg7IH1cbiAgICBnZXQgZGlhZ25vc3RpY3MoKSB7XG4gICAgICAgIHJldHVybiBfKF8udG9BcnJheSh0aGlzLmRpYWdub3N0aWNzQnlGaWxlLnZhbHVlcygpKSlcbiAgICAgICAgICAgIC5mbGF0TWFwKHggPT4geClcbiAgICAgICAgICAgIC5zb3J0QnkoeCA9PiB4LkxvZ0xldmVsLCB4ID0+IHguRmlsZU5hbWUsIHggPT4geC5MaW5lLCB4ID0+IHguQ29sdW1uLCB4ID0+IHguVGV4dClcbiAgICAgICAgICAgIC52YWx1ZSgpO1xuICAgIH1cbiAgICBnZXQgc3RhdGUoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbi5jdXJyZW50U3RhdGU7IH1cbiAgICA7XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgZ2V0UHJvamVjdEZvckVkaXRvcihlZGl0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdEZvclBhdGgoZWRpdG9yLmdldFBhdGgoKSlcbiAgICAgICAgICAgIC5maWx0ZXIoKCkgPT4gIWVkaXRvci5pc0Rlc3Ryb3llZCgpKTtcbiAgICB9XG4gICAgZ2V0UHJvamVjdEZvclBhdGgocGF0aCkge1xuICAgICAgICBpZiAodGhpcy5pc09uICYmIHRoaXMucHJvamVjdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0ID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHggPT4geC5maWxlc1NldC5oYXMocGF0aCkpO1xuICAgICAgICAgICAgaWYgKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihwcm9qZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5vYnNlcnZlLnByb2plY3RBZGRlZC5maWx0ZXIoeCA9PiBfLnN0YXJ0c1dpdGgocGF0aCwgeC5wYXRoKSkudGFrZSgxKTtcbiAgICB9XG4gICAgZ2V0UHJvamVjdENvbnRhaW5pbmdFZGl0b3IoZWRpdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFByb2plY3RDb250YWluaW5nRmlsZShlZGl0b3IuZ2V0UGF0aCgpKTtcbiAgICB9XG4gICAgZ2V0UHJvamVjdENvbnRhaW5pbmdGaWxlKHBhdGgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNPbiAmJiB0aGlzLnByb2plY3RzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9IF8uZmluZCh0aGlzLnByb2plY3RzLCB4ID0+IF8uaW5jbHVkZXMoeC5zb3VyY2VGaWxlcywgbm9ybWFsaXplKHBhdGgpKSk7XG4gICAgICAgICAgICBpZiAocHJvamVjdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHByb2plY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vYnNlcnZlLnByb2plY3RBZGRlZFxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiBfLmluY2x1ZGVzKHguc291cmNlRmlsZXMsIG5vcm1hbGl6ZShwYXRoKSkpXG4gICAgICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgICAgICAuZGVmYXVsdElmRW1wdHkobnVsbCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX3VwZGF0ZVN0YXRlKHN0YXRlKSB7XG4gICAgICAgIHRoaXMuaXNPbiA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0aW5nIHx8IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQ7XG4gICAgICAgIHRoaXMuaXNPZmYgPSBzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkO1xuICAgICAgICB0aGlzLmlzQ29ubmVjdGluZyA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0aW5nO1xuICAgICAgICB0aGlzLmlzUmVhZHkgPSBzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkO1xuICAgICAgICB0aGlzLmlzRXJyb3IgPSBzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRXJyb3I7XG4gICAgICAgIHRoaXMuX3N0YXRlU3RyZWFtLm5leHQodGhpcyk7XG4gICAgfVxuICAgIF9zZXR1cENvZGVjaGVjayhfc29sdXRpb24pIHtcbiAgICAgICAgY29uc3QgYmFzZUNvZGVjaGVjayA9IF9zb2x1dGlvbi5vYnNlcnZlLmRpYWdub3N0aWNcbiAgICAgICAgICAgIC5tYXAoZGF0YSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWxlcyA9IFtdO1xuICAgICAgICAgICAgY29uc3QgY291bnRzID0gdGhpcy5kaWFnbm9zdGljQ291bnRzO1xuICAgICAgICAgICAgXy5lYWNoKGRhdGEuUmVzdWx0cywgcmVzdWx0ID0+IHtcbiAgICAgICAgICAgICAgICBmaWxlcy5wdXNoKHJlc3VsdC5GaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUuaGFzKHJlc3VsdC5GaWxlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkID0gdGhpcy5kaWFnbm9zdGljc0J5RmlsZS5nZXQocmVzdWx0LkZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaWFnbm9zdGljc0J5RmlsZS5kZWxldGUocmVzdWx0LkZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBlZCA9IF8uZ3JvdXBCeShvbGQsIHggPT4geC5Mb2dMZXZlbC50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoKGdyb3VwZWQsIChpdGVtcywga2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNOdW1iZXIoY291bnRzW2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnRzW2tleV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRzW2tleV0gLT0gaXRlbXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvdW50c1trZXldIDwgMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudHNba2V5XSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLnNldChyZXN1bHQuRmlsZU5hbWUsIF8uc29ydEJ5KHJlc3VsdC5RdWlja0ZpeGVzLCB4ID0+IHguTGluZSwgcXVpY2tGaXggPT4gcXVpY2tGaXguTG9nTGV2ZWwsIHggPT4geC5UZXh0KSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JvdXBlZCA9IF8uZ3JvdXBCeShyZXN1bHQuUXVpY2tGaXhlcywgeCA9PiB4LkxvZ0xldmVsLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgICAgIF8uZWFjaChncm91cGVkLCAoaXRlbXMsIGtleSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNOdW1iZXIoY291bnRzW2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudHNba2V5XSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY291bnRzW2tleV0gKz0gaXRlbXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZmlsZXM7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICAgICAgY29uc3QgZGlhZ25vc3RpY3MgPSBiYXNlQ29kZWNoZWNrXG4gICAgICAgICAgICAubWFwKHggPT4gdGhpcy5kaWFnbm9zdGljcylcbiAgICAgICAgICAgIC5jYWNoZSgxKTtcbiAgICAgICAgY29uc3QgZGlhZ25vc3RpY3NCeUZpbGUgPSBiYXNlQ29kZWNoZWNrXG4gICAgICAgICAgICAubWFwKGZpbGVzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIF8uZWFjaChmaWxlcywgZmlsZSA9PiB7XG4gICAgICAgICAgICAgICAgbWFwLnNldChmaWxlLCB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmdldChmaWxlKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBtYXA7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuY2FjaGUoMSk7XG4gICAgICAgIGNvbnN0IGRpYWdub3N0aWNzQ291bnRzID0gYmFzZUNvZGVjaGVja1xuICAgICAgICAgICAgLm1hcCh4ID0+IHRoaXMuZGlhZ25vc3RpY0NvdW50cylcbiAgICAgICAgICAgIC5jYWNoZSgxKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChiYXNlQ29kZWNoZWNrLnN1YnNjcmliZSgpKTtcbiAgICAgICAgcmV0dXJuIHsgZGlhZ25vc3RpY3MsIGRpYWdub3N0aWNzQnlGaWxlLCBkaWFnbm9zdGljc0NvdW50cyB9O1xuICAgIH1cbiAgICBfc2V0dXBTdGF0dXMoX3NvbHV0aW9uKSB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IF9zb2x1dGlvbi5zdGF0dXNcbiAgICAgICAgICAgIC5zdGFydFdpdGgoe30pXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9XG59XG4iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7U29sdXRpb259IGZyb20gXCIuL3NvbHV0aW9uXCI7XHJcbmltcG9ydCB7TW9kZWxzLCBEcml2ZXJTdGF0ZSwgT21uaXNoYXJwQ2xpZW50U3RhdHVzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIFJlcGxheVN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge25vcm1hbGl6ZX0gZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsLCBwcm9qZWN0Vmlld01vZGVsRmFjdG9yeSwgd29ya3NwYWNlVmlld01vZGVsRmFjdG9yeX0gZnJvbSBcIi4vcHJvamVjdC12aWV3LW1vZGVsXCI7XHJcbmltcG9ydCB7T3V0cHV0TWVzc2FnZUVsZW1lbnR9IGZyb20gXCIuLi92aWV3cy9vdXRwdXQtbWVzc2FnZS1lbGVtZW50XCI7XHJcbmxldCBmYXN0ZG9tOiB0eXBlb2YgRmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xyXG5pbXBvcnQge2J1ZmZlckZvcn0gZnJvbSBcIi4uL29wZXJhdG9ycy9idWZmZXJGb3JcIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVk1WaWV3U3RhdGUge1xyXG4gICAgaXNPZmY6IGJvb2xlYW47XHJcbiAgICBpc0Nvbm5lY3Rpbmc6IGJvb2xlYW47XHJcbiAgICBpc09uOiBib29sZWFuO1xyXG4gICAgaXNSZWFkeTogYm9vbGVhbjtcclxuICAgIGlzRXJyb3I6IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBWaWV3TW9kZWwgaW1wbGVtZW50cyBWTVZpZXdTdGF0ZSwgSURpc3Bvc2FibGUge1xyXG4gICAgcHVibGljIGlzT2ZmOiBib29sZWFuO1xyXG4gICAgcHVibGljIGlzQ29ubmVjdGluZzogYm9vbGVhbjtcclxuICAgIHB1YmxpYyBpc09uOiBib29sZWFuO1xyXG4gICAgcHVibGljIGlzUmVhZHk6IGJvb2xlYW47XHJcbiAgICBwdWJsaWMgaXNFcnJvcjogYm9vbGVhbjtcclxuXHJcbiAgICBwcml2YXRlIF91bmlxdWVJZDogc3RyaW5nO1xyXG4gICAgcHVibGljIGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgcHVibGljIGdldCB1bmlxdWVJZCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uLnVuaXF1ZUlkOyB9XHJcblxyXG4gICAgcHVibGljIGdldCBpbmRleCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uLmluZGV4OyB9XHJcbiAgICBwdWJsaWMgZ2V0IHBhdGgoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbi5wYXRoOyB9XHJcbiAgICBwdWJsaWMgb3V0cHV0OiBPdXRwdXRNZXNzYWdlW10gPSBbXTtcclxuICAgIHB1YmxpYyBvdXRwdXRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgIHB1YmxpYyBkaWFnbm9zdGljc0J5RmlsZSA9IG5ldyBNYXA8c3RyaW5nLCBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KCk7XHJcbiAgICBwdWJsaWMgZ2V0IGRpYWdub3N0aWNzKCkge1xyXG4gICAgICAgIHJldHVybiBfKF8udG9BcnJheSh0aGlzLmRpYWdub3N0aWNzQnlGaWxlLnZhbHVlcygpKSlcclxuICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB4KVxyXG4gICAgICAgICAgICAuc29ydEJ5KHggPT4geC5Mb2dMZXZlbCwgeCA9PiB4LkZpbGVOYW1lLCB4ID0+IHguTGluZSwgeCA9PiB4LkNvbHVtbiwgeCA9PiB4LlRleHQpXHJcbiAgICAgICAgICAgIC52YWx1ZSgpO1xyXG4gICAgfVxyXG4gICAgcHVibGljIGRpYWdub3N0aWNDb3VudHM6IHsgW2luZGV4OiBzdHJpbmddOiBudW1iZXI7IH0gPSB7IGVycm9yOiAwLCB3YXJuaW5nOiAwLCBoaWRkZW46IDAgfTtcclxuXHJcbiAgICBwdWJsaWMgZXJyb3JzOiBudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHdhcm5pbmdzOiBudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIGhpZGRlbjogbnVtYmVyID0gMDtcclxuXHJcbiAgICBwdWJsaWMgZ2V0IHN0YXRlKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24uY3VycmVudFN0YXRlOyB9O1xyXG4gICAgcHVibGljIHBhY2thZ2VTb3VyY2VzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgcHVibGljIHByb2plY3RzOiBQcm9qZWN0Vmlld01vZGVsPGFueT5bXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBfcHJvamVjdEFkZGVkU3RyZWFtID0gbmV3IFN1YmplY3Q8UHJvamVjdFZpZXdNb2RlbDxhbnk+PigpO1xyXG4gICAgcHJpdmF0ZSBfcHJvamVjdFJlbW92ZWRTdHJlYW0gPSBuZXcgU3ViamVjdDxQcm9qZWN0Vmlld01vZGVsPGFueT4+KCk7XHJcbiAgICBwcml2YXRlIF9wcm9qZWN0Q2hhbmdlZFN0cmVhbSA9IG5ldyBTdWJqZWN0PFByb2plY3RWaWV3TW9kZWw8YW55Pj4oKTtcclxuICAgIHByaXZhdGUgX3N0YXRlU3RyZWFtID0gbmV3IFJlcGxheVN1YmplY3Q8Vmlld01vZGVsPigxKTtcclxuXHJcbiAgICBwdWJsaWMgb2JzZXJ2ZToge1xyXG4gICAgICAgIGRpYWdub3N0aWNzOiBPYnNlcnZhYmxlPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT47XHJcbiAgICAgICAgZGlhZ25vc3RpY3NDb3VudHM6IE9ic2VydmFibGU8eyBbaW5kZXg6IHN0cmluZ106IG51bWJlcjsgfT47XHJcbiAgICAgICAgZGlhZ25vc3RpY3NCeUZpbGU6IE9ic2VydmFibGU8TWFwPHN0cmluZywgTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPj47XHJcbiAgICAgICAgb3V0cHV0OiBPYnNlcnZhYmxlPE91dHB1dE1lc3NhZ2VbXT47XHJcbiAgICAgICAgc3RhdHVzOiBPYnNlcnZhYmxlPE9tbmlzaGFycENsaWVudFN0YXR1cz47XHJcbiAgICAgICAgc3RhdGU6IE9ic2VydmFibGU8Vmlld01vZGVsPjtcclxuICAgICAgICBwcm9qZWN0QWRkZWQ6IE9ic2VydmFibGU8UHJvamVjdFZpZXdNb2RlbDxhbnk+PjtcclxuICAgICAgICBwcm9qZWN0UmVtb3ZlZDogT2JzZXJ2YWJsZTxQcm9qZWN0Vmlld01vZGVsPGFueT4+O1xyXG4gICAgICAgIHByb2plY3RDaGFuZ2VkOiBPYnNlcnZhYmxlPFByb2plY3RWaWV3TW9kZWw8YW55Pj47XHJcbiAgICAgICAgcHJvamVjdHM6IE9ic2VydmFibGU8UHJvamVjdFZpZXdNb2RlbDxhbnk+W10+O1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zb2x1dGlvbjogU29sdXRpb24pIHtcclxuICAgICAgICB0aGlzLl91bmlxdWVJZCA9IF9zb2x1dGlvbi51bmlxdWVJZDtcclxuICAgICAgICB0aGlzLl91cGRhdGVTdGF0ZShfc29sdXRpb24uY3VycmVudFN0YXRlKTtcclxuXHJcbiAgICAgICAgdGhpcy5vdXRwdXRFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJtZXNzYWdlcy1jb250YWluZXJcIik7XHJcblxyXG4gICAgICAgIC8vIE1hbmFnZSBvdXIgYnVpbGQgbG9nIGZvciBkaXNwbGF5XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ubG9nc1xyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMub3V0cHV0LnB1c2goZXZlbnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm91dHB1dC5sZW5ndGggPiAxMDAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdXRwdXQuc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIGJ1ZmZlckZvcihfc29sdXRpb24ubG9ncywgMTAwKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShpdGVtcyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbW92YWxzOiBFbGVtZW50W10gPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vdXRwdXRFbGVtZW50LmNoaWxkcmVuLmxlbmd0aCA9PT0gMTAwMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmFscy5wdXNoKHRoaXMub3V0cHV0RWxlbWVudC5jaGlsZHJlbltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXy5lYWNoKHJlbW92YWxzLCB4ID0+IHgucmVtb3ZlKCkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm91dHB1dEVsZW1lbnQuYXBwZW5kQ2hpbGQoT3V0cHV0TWVzc2FnZUVsZW1lbnQuY3JlYXRlKGV2ZW50KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIF9zb2x1dGlvbi5zdGF0ZS5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBfLmVhY2godGhpcy5wcm9qZWN0cy5zbGljZSgpLCBwcm9qZWN0ID0+IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmNsZWFyKCk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHtkaWFnbm9zdGljcywgZGlhZ25vc3RpY3NCeUZpbGUsIGRpYWdub3N0aWNzQ291bnRzfSA9IHRoaXMuX3NldHVwQ29kZWNoZWNrKF9zb2x1dGlvbik7XHJcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy5fc2V0dXBTdGF0dXMoX3NvbHV0aW9uKTtcclxuICAgICAgICBjb25zdCBvdXRwdXQgPSB0aGlzLm91dHB1dDtcclxuXHJcbiAgICAgICAgY29uc3QgX3Byb2plY3RBZGRlZFN0cmVhbSA9IHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbS5zaGFyZSgpO1xyXG4gICAgICAgIGNvbnN0IF9wcm9qZWN0UmVtb3ZlZFN0cmVhbSA9IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLnNoYXJlKCk7XHJcbiAgICAgICAgY29uc3QgX3Byb2plY3RDaGFuZ2VkU3RyZWFtID0gdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0uc2hhcmUoKTtcclxuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IE9ic2VydmFibGUubWVyZ2UoX3Byb2plY3RBZGRlZFN0cmVhbSwgX3Byb2plY3RSZW1vdmVkU3RyZWFtLCBfcHJvamVjdENoYW5nZWRTdHJlYW0pXHJcbiAgICAgICAgICAgIC5zdGFydFdpdGgoPGFueT5bXSlcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgyMDApXHJcbiAgICAgICAgICAgIC5tYXAoeiA9PiB0aGlzLnByb2plY3RzKVxyXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xyXG5cclxuICAgICAgICBjb25zdCBvdXRwdXRPYnNlcnZhYmxlID0gX3NvbHV0aW9uLmxvZ3NcclxuICAgICAgICAgICAgLmF1ZGl0VGltZSgxMDApXHJcbiAgICAgICAgICAgIC5tYXAoKCkgPT4gb3V0cHV0KTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLl9zdGF0ZVN0cmVhbTtcclxuXHJcbiAgICAgICAgdGhpcy5vYnNlcnZlID0ge1xyXG4gICAgICAgICAgICBnZXQgZGlhZ25vc3RpY3MoKSB7IHJldHVybiBkaWFnbm9zdGljczsgfSxcclxuICAgICAgICAgICAgZ2V0IGRpYWdub3N0aWNzQ291bnRzKCkgeyByZXR1cm4gZGlhZ25vc3RpY3NDb3VudHM7IH0sXHJcbiAgICAgICAgICAgIGdldCBkaWFnbm9zdGljc0J5RmlsZSgpIHsgcmV0dXJuIGRpYWdub3N0aWNzQnlGaWxlOyB9LFxyXG4gICAgICAgICAgICBnZXQgb3V0cHV0KCkgeyByZXR1cm4gb3V0cHV0T2JzZXJ2YWJsZTsgfSxcclxuICAgICAgICAgICAgZ2V0IHN0YXR1cygpIHsgcmV0dXJuIHN0YXR1czsgfSxcclxuICAgICAgICAgICAgZ2V0IHN0YXRlKCkgeyByZXR1cm4gPE9ic2VydmFibGU8Vmlld01vZGVsPj48YW55PnN0YXRlOyB9LFxyXG4gICAgICAgICAgICBnZXQgcHJvamVjdHMoKSB7IHJldHVybiBwcm9qZWN0czsgfSxcclxuICAgICAgICAgICAgZ2V0IHByb2plY3RBZGRlZCgpIHsgcmV0dXJuIF9wcm9qZWN0QWRkZWRTdHJlYW07IH0sXHJcbiAgICAgICAgICAgIGdldCBwcm9qZWN0UmVtb3ZlZCgpIHsgcmV0dXJuIF9wcm9qZWN0UmVtb3ZlZFN0cmVhbTsgfSxcclxuICAgICAgICAgICAgZ2V0IHByb2plY3RDaGFuZ2VkKCkgeyByZXR1cm4gX3Byb2plY3RDaGFuZ2VkU3RyZWFtOyB9LFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLnN0YXRlLnN1YnNjcmliZShfLmJpbmQodGhpcy5fdXBkYXRlU3RhdGUsIHRoaXMpKSk7XHJcblxyXG4gICAgICAgIC8qIHRzbGludDpkaXNhYmxlICovXHJcbiAgICAgICAgKHdpbmRvd1tcImNsaWVudHNcIl0gfHwgKHdpbmRvd1tcImNsaWVudHNcIl0gPSBbXSkpLnB1c2godGhpcyk7ICAvL1RFTVBcclxuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlICovXHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLnN0YXRlLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZClcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBfc29sdXRpb24ucHJvamVjdHMoeyBFeGNsdWRlU291cmNlRmlsZXM6IGZhbHNlIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIF9zb2x1dGlvbi5wYWNrYWdlc291cmNlKHsgUHJvamVjdFBhdGg6IF9zb2x1dGlvbi5wYXRoIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFja2FnZVNvdXJjZXMgPSByZXNwb25zZS5Tb3VyY2VzO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLnN0YXRlLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgXy5lYWNoKHRoaXMucHJvamVjdHMuc2xpY2UoKSwgcHJvamVjdCA9PiB0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbS5uZXh0KHByb2plY3QpKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLm9ic2VydmUucHJvamVjdEFkZGVkLnN1YnNjcmliZShwcm9qZWN0SW5mb3JtYXRpb24gPT4ge1xyXG4gICAgICAgICAgICBfLmVhY2gocHJvamVjdFZpZXdNb2RlbEZhY3RvcnkocHJvamVjdEluZm9ybWF0aW9uLCBfc29sdXRpb24ucHJvamVjdFBhdGgpLCBwcm9qZWN0ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghXy5zb21lKHRoaXMucHJvamVjdHMsIHsgcGF0aDogcHJvamVjdC5wYXRoIH0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0cy5wdXNoKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbS5uZXh0KHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLm9ic2VydmUucHJvamVjdFJlbW92ZWQuc3Vic2NyaWJlKHByb2plY3RJbmZvcm1hdGlvbiA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmQ6IFByb2plY3RWaWV3TW9kZWw8YW55PiA9IF8uZmluZCh0aGlzLnByb2plY3RzLCB7IHBhdGg6IHByb2plY3QucGF0aCB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIF8ucHVsbCh0aGlzLnByb2plY3RzLCBmb3VuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdFJlbW92ZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5vYnNlcnZlLnByb2plY3RDaGFuZ2VkLnN1YnNjcmliZShwcm9qZWN0SW5mb3JtYXRpb24gPT4ge1xyXG4gICAgICAgICAgICBfLmVhY2gocHJvamVjdFZpZXdNb2RlbEZhY3RvcnkocHJvamVjdEluZm9ybWF0aW9uLCBfc29sdXRpb24ucHJvamVjdFBhdGgpLCBwcm9qZWN0ID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kOiBQcm9qZWN0Vmlld01vZGVsPGFueT4gPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZC51cGRhdGUocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5vYnNlcnZlLnByb2plY3RzLnN1YnNjcmliZShjb250ZXh0ID0+IHtcclxuICAgICAgICAgICAgXy5lYWNoKHdvcmtzcGFjZVZpZXdNb2RlbEZhY3RvcnkoY29udGV4dC5yZXNwb25zZSwgX3NvbHV0aW9uLnByb2plY3RQYXRoKSwgcHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZDogUHJvamVjdFZpZXdNb2RlbDxhbnk+ID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHsgcGF0aDogcHJvamVjdC5wYXRoIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm91bmQudXBkYXRlKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtLm5leHQocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdHMucHVzaChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9wcm9qZWN0Q2hhbmdlZFN0cmVhbSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBfLmVhY2godGhpcy5wcm9qZWN0cywgeCA9PiB4LmRpc3Bvc2UoKSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFByb2plY3RGb3JFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0Rm9yUGF0aChlZGl0b3IuZ2V0UGF0aCgpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKCgpID0+ICFlZGl0b3IuaXNEZXN0cm95ZWQoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFByb2plY3RGb3JQYXRoKHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLmlzT24gJiYgdGhpcy5wcm9qZWN0cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9IF8uZmluZCh0aGlzLnByb2plY3RzLCB4ID0+IHguZmlsZXNTZXQuaGFzKHBhdGgpKTtcclxuICAgICAgICAgICAgaWYgKHByb2plY3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHByb2plY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5vYnNlcnZlLnByb2plY3RBZGRlZC5maWx0ZXIoeCA9PiBfLnN0YXJ0c1dpdGgocGF0aCwgeC5wYXRoKSkudGFrZSgxKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0UHJvamVjdENvbnRhaW5pbmdFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0Q29udGFpbmluZ0ZpbGUoZWRpdG9yLmdldFBhdGgoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFByb2plY3RDb250YWluaW5nRmlsZShwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodGhpcy5pc09uICYmIHRoaXMucHJvamVjdHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3QgPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeCA9PiBfLmluY2x1ZGVzKHguc291cmNlRmlsZXMsIG5vcm1hbGl6ZShwYXRoKSkpO1xyXG4gICAgICAgICAgICBpZiAocHJvamVjdCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YocHJvamVjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YobnVsbCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub2JzZXJ2ZS5wcm9qZWN0QWRkZWRcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiBfLmluY2x1ZGVzKHguc291cmNlRmlsZXMsIG5vcm1hbGl6ZShwYXRoKSkpXHJcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgLmRlZmF1bHRJZkVtcHR5KG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF91cGRhdGVTdGF0ZShzdGF0ZTogRHJpdmVyU3RhdGUpIHtcclxuICAgICAgICB0aGlzLmlzT24gPSBzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGluZyB8fCBzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkO1xyXG4gICAgICAgIHRoaXMuaXNPZmYgPSBzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkO1xyXG4gICAgICAgIHRoaXMuaXNDb25uZWN0aW5nID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3Rpbmc7XHJcbiAgICAgICAgdGhpcy5pc1JlYWR5ID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZDtcclxuICAgICAgICB0aGlzLmlzRXJyb3IgPSBzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRXJyb3I7XHJcblxyXG4gICAgICAgIHRoaXMuX3N0YXRlU3RyZWFtLm5leHQodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc2V0dXBDb2RlY2hlY2soX3NvbHV0aW9uOiBTb2x1dGlvbikge1xyXG4gICAgICAgIGNvbnN0IGJhc2VDb2RlY2hlY2sgPSBfc29sdXRpb24ub2JzZXJ2ZS5kaWFnbm9zdGljXHJcbiAgICAgICAgICAgIC5tYXAoZGF0YSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50cyA9IHRoaXMuZGlhZ25vc3RpY0NvdW50cztcclxuICAgICAgICAgICAgICAgIF8uZWFjaChkYXRhLlJlc3VsdHMsIHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZXMucHVzaChyZXN1bHQuRmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmhhcyhyZXN1bHQuRmlsZU5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZCA9IHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUuZ2V0KHJlc3VsdC5GaWxlTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUuZGVsZXRlKHJlc3VsdC5GaWxlTmFtZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncm91cGVkID0gXy5ncm91cEJ5KG9sZCwgeCA9PiB4LkxvZ0xldmVsLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfLmVhY2goZ3JvdXBlZCwgKGl0ZW1zLCBrZXkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghXy5pc051bWJlcihjb3VudHNba2V5XSkpIHsgY291bnRzW2tleV0gPSAwOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudHNba2V5XSAtPSBpdGVtcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY291bnRzW2tleV0gPCAwKSBjb3VudHNba2V5XSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaWFnbm9zdGljc0J5RmlsZS5zZXQocmVzdWx0LkZpbGVOYW1lLCBfLnNvcnRCeShyZXN1bHQuUXVpY2tGaXhlcywgeCA9PiB4LkxpbmUsIHF1aWNrRml4ID0+IHF1aWNrRml4LkxvZ0xldmVsLCB4ID0+IHguVGV4dCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwZWQgPSBfLmdyb3VwQnkocmVzdWx0LlF1aWNrRml4ZXMsIHggPT4geC5Mb2dMZXZlbC50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgICAgICAgICAgICAgICBfLmVhY2goZ3JvdXBlZCwgKGl0ZW1zLCBrZXkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLmlzTnVtYmVyKGNvdW50c1trZXldKSkgeyBjb3VudHNba2V5XSA9IDA7IH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRzW2tleV0gKz0gaXRlbXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsZXM7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBkaWFnbm9zdGljcyA9IGJhc2VDb2RlY2hlY2tcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHRoaXMuZGlhZ25vc3RpY3MpXHJcbiAgICAgICAgICAgIC5jYWNoZSgxKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGlhZ25vc3RpY3NCeUZpbGUgPSBiYXNlQ29kZWNoZWNrXHJcbiAgICAgICAgICAgIC5tYXAoZmlsZXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWFwID0gbmV3IE1hcDxzdHJpbmcsIE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4oKTtcclxuICAgICAgICAgICAgICAgIF8uZWFjaChmaWxlcywgZmlsZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFwLnNldChmaWxlLCB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmdldChmaWxlKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jYWNoZSgxKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGlhZ25vc3RpY3NDb3VudHMgPSBiYXNlQ29kZWNoZWNrXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiB0aGlzLmRpYWdub3N0aWNDb3VudHMpXHJcbiAgICAgICAgICAgIC5jYWNoZSgxKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChiYXNlQ29kZWNoZWNrLnN1YnNjcmliZSgpKTtcclxuICAgICAgICByZXR1cm4geyBkaWFnbm9zdGljcywgZGlhZ25vc3RpY3NCeUZpbGUsIGRpYWdub3N0aWNzQ291bnRzIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc2V0dXBTdGF0dXMoX3NvbHV0aW9uOiBTb2x1dGlvbikge1xyXG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IF9zb2x1dGlvbi5zdGF0dXNcclxuICAgICAgICAgICAgLnN0YXJ0V2l0aCg8YW55Pnt9KVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN0YXR1cztcclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
