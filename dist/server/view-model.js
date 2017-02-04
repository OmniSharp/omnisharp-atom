'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ViewModel = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _omnisharpClient = require('omnisharp-client');

var _path = require('path');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _outputMessageElement = require('../views/output-message-element');

var _projectViewModel = require('./project-view-model');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ViewModel = exports.ViewModel = function () {
    function ViewModel(_solution) {
        var _this = this;

        _classCallCheck(this, ViewModel);

        this._solution = _solution;
        this.disposable = new _tsDisposables.CompositeDisposable();
        this.output = [];
        this.outputElement = document.createElement('div');
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
        this.outputElement.classList.add('messages-container');
        this.disposable.add(_solution.logs.subscribe(function (event) {
            _this.output.push(event);
            if (_this.output.length > 1000) {
                _this.output.shift();
            }
        }), _solution.logs.subscribe(function (item) {
            if (_this.outputElement.children.length === 1000) {
                _this.outputElement.children[0].remove();
            }
            _this.outputElement.appendChild(_outputMessageElement.OutputMessageElement.create(item));
        }), _solution.state.filter(function (z) {
            return z === _omnisharpClient.DriverState.Disconnected;
        }).subscribe(function () {
            (0, _lodash.each)(_this.projects.slice(), function (project) {
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
        this.disposable.add(_solution.state.subscribe((0, _lodash.bind)(this._updateState, this)));
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
            (0, _lodash.each)(_this.projects.slice(), function (project) {
                return _this._projectRemovedStream.next(project);
            });
        }));
        this.disposable.add(_solution.observe.projectAdded.subscribe(function (projectInformation) {
            (0, _lodash.each)((0, _projectViewModel.projectViewModelFactory)(projectInformation, _solution.projectPath), function (project) {
                if (!(0, _lodash.some)(_this.projects, { path: project.path })) {
                    _this.projects.push(project);
                    _this._projectAddedStream.next(project);
                }
            });
        }));
        this.disposable.add(_solution.observe.projectRemoved.subscribe(function (projectInformation) {
            (0, _lodash.each)((0, _projectViewModel.projectViewModelFactory)(projectInformation, _solution.projectPath), function (project) {
                var found = (0, _lodash.find)(_this.projects, { path: project.path });
                if (found) {
                    (0, _lodash.pull)(_this.projects, found);
                    _this._projectRemovedStream.next(project);
                }
            });
        }));
        this.disposable.add(_solution.observe.projectChanged.subscribe(function (projectInformation) {
            (0, _lodash.each)((0, _projectViewModel.projectViewModelFactory)(projectInformation, _solution.projectPath), function (project) {
                var found = (0, _lodash.find)(_this.projects, { path: project.path });
                if (found) {
                    found.update(project);
                    _this._projectChangedStream.next(project);
                }
            });
        }));
        this.disposable.add(_solution.observe.projects.subscribe(function (context) {
            (0, _lodash.each)((0, _projectViewModel.workspaceViewModelFactory)(context.response, _solution.projectPath), function (project) {
                var found = (0, _lodash.find)(_this.projects, { path: project.path });
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
            (0, _lodash.each)(_this.projects, function (x) {
                return x.dispose();
            });
        }));
    }

    _createClass(ViewModel, [{
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: 'getProjectForEditor',
        value: function getProjectForEditor(editor) {
            return this.getProjectForPath(editor.getPath()).filter(function () {
                return !editor.isDestroyed();
            });
        }
    }, {
        key: 'getProjectForPath',
        value: function getProjectForPath(path) {
            if (this.isOn && this.projects.length) {
                var project = (0, _lodash.find)(this.projects, function (x) {
                    return x.filesSet.has(path);
                });
                if (project) {
                    return _rxjs.Observable.of(project);
                }
            }
            return this.observe.projectAdded.filter(function (x) {
                return (0, _lodash.startsWith)(path, x.path);
            }).take(1);
        }
    }, {
        key: 'getProjectContainingEditor',
        value: function getProjectContainingEditor(editor) {
            return this.getProjectContainingFile(editor.getPath());
        }
    }, {
        key: 'getProjectContainingFile',
        value: function getProjectContainingFile(path) {
            if (this.isOn && this.projects.length) {
                var project = (0, _lodash.find)(this.projects, function (x) {
                    return (0, _lodash.includes)(x.sourceFiles, (0, _path.normalize)(path));
                });
                if (project) {
                    return _rxjs.Observable.of(project);
                }
                return _rxjs.Observable.of(null);
            } else {
                return this.observe.projectAdded.filter(function (x) {
                    return (0, _lodash.includes)(x.sourceFiles, (0, _path.normalize)(path));
                }).take(1).defaultIfEmpty(null);
            }
        }
    }, {
        key: '_updateState',
        value: function _updateState(state) {
            this.isOn = state === _omnisharpClient.DriverState.Connecting || state === _omnisharpClient.DriverState.Connected;
            this.isOff = state === _omnisharpClient.DriverState.Disconnected;
            this.isConnecting = state === _omnisharpClient.DriverState.Connecting;
            this.isReady = state === _omnisharpClient.DriverState.Connected;
            this.isError = state === _omnisharpClient.DriverState.Error;
            this._stateStream.next(this);
        }
    }, {
        key: '_setupCodecheck',
        value: function _setupCodecheck(_solution) {
            var _this2 = this;

            var baseCodecheck = _solution.observe.diagnostic.map(function (data) {
                var files = [];
                var counts = _this2.diagnosticCounts;
                (0, _lodash.each)(data.Results, function (result) {
                    files.push(result.FileName);
                    if (_this2.diagnosticsByFile.has(result.FileName)) {
                        var old = _this2.diagnosticsByFile.get(result.FileName);
                        _this2.diagnosticsByFile.delete(result.FileName);
                        var _grouped = (0, _lodash.groupBy)(old, function (x) {
                            return x.LogLevel.toLowerCase();
                        });
                        (0, _lodash.each)(_grouped, function (items, key) {
                            if (!(0, _lodash.isNumber)(counts[key])) {
                                counts[key] = 0;
                            }
                            counts[key] -= items.length;
                            if (counts[key] < 0) counts[key] = 0;
                        });
                    }
                    _this2.diagnosticsByFile.set(result.FileName, (0, _lodash.sortBy)(result.QuickFixes, function (x) {
                        return x.Line;
                    }, function (quickFix) {
                        return quickFix.LogLevel;
                    }, function (x) {
                        return x.Text;
                    }));
                    var grouped = (0, _lodash.groupBy)(result.QuickFixes, function (x) {
                        return x.LogLevel.toLowerCase();
                    });
                    (0, _lodash.each)(grouped, function (items, key) {
                        if (!(0, _lodash.isNumber)(counts[key])) {
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
                (0, _lodash.each)(files, function (file) {
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
        key: '_setupStatus',
        value: function _setupStatus(_solution) {
            var status = _solution.status.startWith({}).share();
            return status;
        }
    }, {
        key: 'uniqueId',
        get: function get() {
            return this._solution.uniqueId;
        }
    }, {
        key: 'index',
        get: function get() {
            return this._solution.index;
        }
    }, {
        key: 'path',
        get: function get() {
            return this._solution.path;
        }
    }, {
        key: 'diagnostics',
        get: function get() {
            var results = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.diagnosticsByFile.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var result = _step.value;

                    results.push.apply(results, _toConsumableArray(result));
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

            return (0, _lodash.sortBy)(results, function (x) {
                return x.LogLevel;
            }, function (x) {
                return x.FileName;
            }, function (x) {
                return x.Line;
            }, function (x) {
                return x.Column;
            }, function (x) {
                return x.Text;
            });
        }
    }, {
        key: 'state',
        get: function get() {
            return this._solution.currentState;
        }
    }]);

    return ViewModel;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvdmlldy1tb2RlbC50cyJdLCJuYW1lcyI6WyJWaWV3TW9kZWwiLCJfc29sdXRpb24iLCJkaXNwb3NhYmxlIiwib3V0cHV0Iiwib3V0cHV0RWxlbWVudCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImRpYWdub3N0aWNzQnlGaWxlIiwiTWFwIiwiZGlhZ25vc3RpY0NvdW50cyIsImVycm9yIiwid2FybmluZyIsImhpZGRlbiIsImVycm9ycyIsIndhcm5pbmdzIiwicGFja2FnZVNvdXJjZXMiLCJwcm9qZWN0cyIsIl9wcm9qZWN0QWRkZWRTdHJlYW0iLCJfcHJvamVjdFJlbW92ZWRTdHJlYW0iLCJfcHJvamVjdENoYW5nZWRTdHJlYW0iLCJfc3RhdGVTdHJlYW0iLCJfdW5pcXVlSWQiLCJ1bmlxdWVJZCIsIl91cGRhdGVTdGF0ZSIsImN1cnJlbnRTdGF0ZSIsImNsYXNzTGlzdCIsImFkZCIsImxvZ3MiLCJzdWJzY3JpYmUiLCJwdXNoIiwiZXZlbnQiLCJsZW5ndGgiLCJzaGlmdCIsImNoaWxkcmVuIiwicmVtb3ZlIiwiYXBwZW5kQ2hpbGQiLCJjcmVhdGUiLCJpdGVtIiwic3RhdGUiLCJmaWx0ZXIiLCJ6IiwiRGlzY29ubmVjdGVkIiwic2xpY2UiLCJuZXh0IiwicHJvamVjdCIsImNsZWFyIiwiX3NldHVwQ29kZWNoZWNrIiwiZGlhZ25vc3RpY3MiLCJkaWFnbm9zdGljc0NvdW50cyIsInN0YXR1cyIsIl9zZXR1cFN0YXR1cyIsInNoYXJlIiwibWVyZ2UiLCJzdGFydFdpdGgiLCJkZWJvdW5jZVRpbWUiLCJtYXAiLCJwdWJsaXNoUmVwbGF5IiwicmVmQ291bnQiLCJvdXRwdXRPYnNlcnZhYmxlIiwiYXVkaXRUaW1lIiwib2JzZXJ2ZSIsInByb2plY3RBZGRlZCIsInByb2plY3RSZW1vdmVkIiwicHJvamVjdENoYW5nZWQiLCJ3aW5kb3ciLCJDb25uZWN0ZWQiLCJFeGNsdWRlU291cmNlRmlsZXMiLCJwYWNrYWdlc291cmNlIiwiUHJvamVjdFBhdGgiLCJwYXRoIiwicmVzcG9uc2UiLCJTb3VyY2VzIiwicHJvamVjdEluZm9ybWF0aW9uIiwicHJvamVjdFBhdGgiLCJmb3VuZCIsInVwZGF0ZSIsImNvbnRleHQiLCJ4IiwiZGlzcG9zZSIsImVkaXRvciIsImdldFByb2plY3RGb3JQYXRoIiwiZ2V0UGF0aCIsImlzRGVzdHJveWVkIiwiaXNPbiIsImZpbGVzU2V0IiwiaGFzIiwib2YiLCJ0YWtlIiwiZ2V0UHJvamVjdENvbnRhaW5pbmdGaWxlIiwic291cmNlRmlsZXMiLCJkZWZhdWx0SWZFbXB0eSIsIkNvbm5lY3RpbmciLCJpc09mZiIsImlzQ29ubmVjdGluZyIsImlzUmVhZHkiLCJpc0Vycm9yIiwiRXJyb3IiLCJiYXNlQ29kZWNoZWNrIiwiZGlhZ25vc3RpYyIsImZpbGVzIiwiY291bnRzIiwiZGF0YSIsIlJlc3VsdHMiLCJyZXN1bHQiLCJGaWxlTmFtZSIsIm9sZCIsImdldCIsImRlbGV0ZSIsImdyb3VwZWQiLCJMb2dMZXZlbCIsInRvTG93ZXJDYXNlIiwiaXRlbXMiLCJrZXkiLCJzZXQiLCJRdWlja0ZpeGVzIiwiTGluZSIsInF1aWNrRml4IiwiVGV4dCIsImZpbGUiLCJpbmRleCIsInJlc3VsdHMiLCJ2YWx1ZXMiLCJDb2x1bW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7SUFXTUEsUyxXQUFBQSxTO0FBbURGLHVCQUFvQkMsU0FBcEIsRUFBdUM7QUFBQTs7QUFBQTs7QUFBbkIsYUFBQUEsU0FBQSxHQUFBQSxTQUFBO0FBM0NiLGFBQUFDLFVBQUEsR0FBYSx3Q0FBYjtBQUtBLGFBQUFDLE1BQUEsR0FBMEIsRUFBMUI7QUFDQSxhQUFBQyxhQUFBLEdBQWdCQyxTQUFTQyxhQUFULENBQXVCLEtBQXZCLENBQWhCO0FBQ0EsYUFBQUMsaUJBQUEsR0FBb0IsSUFBSUMsR0FBSixFQUFwQjtBQVNBLGFBQUFDLGdCQUFBLEdBQWlELEVBQUVDLE9BQU8sQ0FB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QkFBUTNGLElBQVIsbUNBQWdCMEUsTUFBaEI7QUFDSDtBQUppQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQU1sQixtQkFBTyxvQkFBT2lCLE9BQVAsRUFBZ0I7QUFBQSx1QkFBSzNDLEVBQUVnQyxRQUFQO0FBQUEsYUFBaEIsRUFBaUM7QUFBQSx1QkFBS2hDLEVBQUUyQixRQUFQO0FBQUEsYUFBakMsRUFBa0Q7QUFBQSx1QkFBSzNCLEVBQUVzQyxJQUFQO0FBQUEsYUFBbEQsRUFBK0Q7QUFBQSx1QkFBS3RDLEVBQUU2QyxNQUFQO0FBQUEsYUFBL0QsRUFBOEU7QUFBQSx1QkFBSzdDLEVBQUV3QyxJQUFQO0FBQUEsYUFBOUUsQ0FBUDtBQUNIOzs7NEJBT2U7QUFBSyxtQkFBTyxLQUFLcEgsU0FBTCxDQUFldUIsWUFBdEI7QUFBcUMiLCJmaWxlIjoibGliL3NlcnZlci92aWV3LW1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZmxhdE1hcCwgc29ydEJ5LCBpZGVudGl0eSwgZWFjaCwgc29tZSwgcHVsbCwgZmluZCwgaW5jbHVkZXMsIHN0YXJ0c1dpdGgsIGJpbmQsIGdyb3VwQnksIGlzTnVtYmVyIH0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHsgRHJpdmVyU3RhdGUsIE1vZGVscywgSU9tbmlzaGFycENsaWVudFN0YXR1cyB9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQgeyBub3JtYWxpemUgfSBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgUmVwbGF5U3ViamVjdCwgU3ViamVjdCB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHsgT3V0cHV0TWVzc2FnZUVsZW1lbnQgfSBmcm9tICcuLi92aWV3cy9vdXRwdXQtbWVzc2FnZS1lbGVtZW50JztcclxuaW1wb3J0IHsgcHJvamVjdFZpZXdNb2RlbEZhY3RvcnksIHdvcmtzcGFjZVZpZXdNb2RlbEZhY3RvcnksIFByb2plY3RWaWV3TW9kZWwgfSBmcm9tICcuL3Byb2plY3Qtdmlldy1tb2RlbCc7XHJcbmltcG9ydCB7IFNvbHV0aW9uIH0gZnJvbSAnLi9zb2x1dGlvbic7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFZNVmlld1N0YXRlIHtcclxuICAgIGlzT2ZmOiBib29sZWFuO1xyXG4gICAgaXNDb25uZWN0aW5nOiBib29sZWFuO1xyXG4gICAgaXNPbjogYm9vbGVhbjtcclxuICAgIGlzUmVhZHk6IGJvb2xlYW47XHJcbiAgICBpc0Vycm9yOiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVmlld01vZGVsIGltcGxlbWVudHMgVk1WaWV3U3RhdGUsIElEaXNwb3NhYmxlIHtcclxuICAgIHB1YmxpYyBpc09mZjogYm9vbGVhbjtcclxuICAgIHB1YmxpYyBpc0Nvbm5lY3Rpbmc6IGJvb2xlYW47XHJcbiAgICBwdWJsaWMgaXNPbjogYm9vbGVhbjtcclxuICAgIHB1YmxpYyBpc1JlYWR5OiBib29sZWFuO1xyXG4gICAgcHVibGljIGlzRXJyb3I6IGJvb2xlYW47XHJcblxyXG4gICAgcHJpdmF0ZSBfdW5pcXVlSWQ6IHN0cmluZztcclxuICAgIHB1YmxpYyBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIHB1YmxpYyBnZXQgdW5pcXVlSWQoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbi51bmlxdWVJZDsgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgaW5kZXgoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbi5pbmRleDsgfVxyXG4gICAgcHVibGljIGdldCBwYXRoKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24ucGF0aDsgfVxyXG4gICAgcHVibGljIG91dHB1dDogT3V0cHV0TWVzc2FnZVtdID0gW107XHJcbiAgICBwdWJsaWMgb3V0cHV0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgcHVibGljIGRpYWdub3N0aWNzQnlGaWxlID0gbmV3IE1hcDxzdHJpbmcsIE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4oKTtcclxuICAgIHB1YmxpYyBnZXQgZGlhZ25vc3RpY3MoKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0czogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgcmVzdWx0IG9mIHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUudmFsdWVzKCkpIHtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKC4uLnJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc29ydEJ5KHJlc3VsdHMsIHggPT4geC5Mb2dMZXZlbCwgeCA9PiB4LkZpbGVOYW1lLCB4ID0+IHguTGluZSwgeCA9PiB4LkNvbHVtbiwgeCA9PiB4LlRleHQpO1xyXG4gICAgfVxyXG4gICAgcHVibGljIGRpYWdub3N0aWNDb3VudHM6IHsgW2luZGV4OiBzdHJpbmddOiBudW1iZXI7IH0gPSB7IGVycm9yOiAwLCB3YXJuaW5nOiAwLCBoaWRkZW46IDAgfTtcclxuXHJcbiAgICBwdWJsaWMgZXJyb3JzOiBudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHdhcm5pbmdzOiBudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIGhpZGRlbjogbnVtYmVyID0gMDtcclxuXHJcbiAgICBwdWJsaWMgZ2V0IHN0YXRlKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24uY3VycmVudFN0YXRlOyB9O1xyXG4gICAgcHVibGljIHBhY2thZ2VTb3VyY2VzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgcHVibGljIHByb2plY3RzOiBQcm9qZWN0Vmlld01vZGVsPGFueT5bXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBfcHJvamVjdEFkZGVkU3RyZWFtID0gbmV3IFN1YmplY3Q8UHJvamVjdFZpZXdNb2RlbDxhbnk+PigpO1xyXG4gICAgcHJpdmF0ZSBfcHJvamVjdFJlbW92ZWRTdHJlYW0gPSBuZXcgU3ViamVjdDxQcm9qZWN0Vmlld01vZGVsPGFueT4+KCk7XHJcbiAgICBwcml2YXRlIF9wcm9qZWN0Q2hhbmdlZFN0cmVhbSA9IG5ldyBTdWJqZWN0PFByb2plY3RWaWV3TW9kZWw8YW55Pj4oKTtcclxuICAgIHByaXZhdGUgX3N0YXRlU3RyZWFtID0gbmV3IFJlcGxheVN1YmplY3Q8Vmlld01vZGVsPigxKTtcclxuXHJcbiAgICBwdWJsaWMgb2JzZXJ2ZToge1xyXG4gICAgICAgIGRpYWdub3N0aWNzOiBPYnNlcnZhYmxlPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT47XHJcbiAgICAgICAgZGlhZ25vc3RpY3NDb3VudHM6IE9ic2VydmFibGU8eyBbaW5kZXg6IHN0cmluZ106IG51bWJlcjsgfT47XHJcbiAgICAgICAgZGlhZ25vc3RpY3NCeUZpbGU6IE9ic2VydmFibGU8TWFwPHN0cmluZywgTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPj47XHJcbiAgICAgICAgb3V0cHV0OiBPYnNlcnZhYmxlPE91dHB1dE1lc3NhZ2VbXT47XHJcbiAgICAgICAgc3RhdHVzOiBPYnNlcnZhYmxlPElPbW5pc2hhcnBDbGllbnRTdGF0dXM+O1xyXG4gICAgICAgIHN0YXRlOiBPYnNlcnZhYmxlPFZpZXdNb2RlbD47XHJcbiAgICAgICAgcHJvamVjdEFkZGVkOiBPYnNlcnZhYmxlPFByb2plY3RWaWV3TW9kZWw8YW55Pj47XHJcbiAgICAgICAgcHJvamVjdFJlbW92ZWQ6IE9ic2VydmFibGU8UHJvamVjdFZpZXdNb2RlbDxhbnk+PjtcclxuICAgICAgICBwcm9qZWN0Q2hhbmdlZDogT2JzZXJ2YWJsZTxQcm9qZWN0Vmlld01vZGVsPGFueT4+O1xyXG4gICAgICAgIHByb2plY3RzOiBPYnNlcnZhYmxlPFByb2plY3RWaWV3TW9kZWw8YW55PltdPjtcclxuICAgIH07XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfc29sdXRpb246IFNvbHV0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5fdW5pcXVlSWQgPSBfc29sdXRpb24udW5pcXVlSWQ7XHJcbiAgICAgICAgdGhpcy5fdXBkYXRlU3RhdGUoX3NvbHV0aW9uLmN1cnJlbnRTdGF0ZSk7XHJcblxyXG4gICAgICAgIHRoaXMub3V0cHV0RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdtZXNzYWdlcy1jb250YWluZXInKTtcclxuXHJcbiAgICAgICAgLy8gTWFuYWdlIG91ciBidWlsZCBsb2cgZm9yIGRpc3BsYXlcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5sb2dzXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vdXRwdXQucHVzaChldmVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3V0cHV0Lmxlbmd0aCA+IDEwMDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm91dHB1dC5zaGlmdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgX3NvbHV0aW9uLmxvZ3NcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3V0cHV0RWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPT09IDEwMDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdXRwdXRFbGVtZW50LmNoaWxkcmVuWzBdLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdXRwdXRFbGVtZW50LmFwcGVuZENoaWxkKE91dHB1dE1lc3NhZ2VFbGVtZW50LmNyZWF0ZShpdGVtKSk7XHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgX3NvbHV0aW9uLnN0YXRlLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZClcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGVhY2godGhpcy5wcm9qZWN0cy5zbGljZSgpLCBwcm9qZWN0ID0+IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmNsZWFyKCk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHtkaWFnbm9zdGljcywgZGlhZ25vc3RpY3NCeUZpbGUsIGRpYWdub3N0aWNzQ291bnRzfSA9IHRoaXMuX3NldHVwQ29kZWNoZWNrKF9zb2x1dGlvbik7XHJcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gdGhpcy5fc2V0dXBTdGF0dXMoX3NvbHV0aW9uKTtcclxuICAgICAgICBjb25zdCBvdXRwdXQgPSB0aGlzLm91dHB1dDtcclxuXHJcbiAgICAgICAgY29uc3QgX3Byb2plY3RBZGRlZFN0cmVhbSA9IHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbS5zaGFyZSgpO1xyXG4gICAgICAgIGNvbnN0IF9wcm9qZWN0UmVtb3ZlZFN0cmVhbSA9IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLnNoYXJlKCk7XHJcbiAgICAgICAgY29uc3QgX3Byb2plY3RDaGFuZ2VkU3RyZWFtID0gdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0uc2hhcmUoKTtcclxuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IE9ic2VydmFibGUubWVyZ2UoX3Byb2plY3RBZGRlZFN0cmVhbSwgX3Byb2plY3RSZW1vdmVkU3RyZWFtLCBfcHJvamVjdENoYW5nZWRTdHJlYW0pXHJcbiAgICAgICAgICAgIC5zdGFydFdpdGgoPGFueT5bXSlcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgyMDApXHJcbiAgICAgICAgICAgIC5tYXAoeiA9PiB0aGlzLnByb2plY3RzKVxyXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xyXG5cclxuICAgICAgICBjb25zdCBvdXRwdXRPYnNlcnZhYmxlID0gX3NvbHV0aW9uLmxvZ3NcclxuICAgICAgICAgICAgLmF1ZGl0VGltZSgxMDApXHJcbiAgICAgICAgICAgIC5tYXAoKCkgPT4gb3V0cHV0KTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLl9zdGF0ZVN0cmVhbTtcclxuXHJcbiAgICAgICAgdGhpcy5vYnNlcnZlID0ge1xyXG4gICAgICAgICAgICBnZXQgZGlhZ25vc3RpY3MoKSB7IHJldHVybiBkaWFnbm9zdGljczsgfSxcclxuICAgICAgICAgICAgZ2V0IGRpYWdub3N0aWNzQ291bnRzKCkgeyByZXR1cm4gZGlhZ25vc3RpY3NDb3VudHM7IH0sXHJcbiAgICAgICAgICAgIGdldCBkaWFnbm9zdGljc0J5RmlsZSgpIHsgcmV0dXJuIGRpYWdub3N0aWNzQnlGaWxlOyB9LFxyXG4gICAgICAgICAgICBnZXQgb3V0cHV0KCkgeyByZXR1cm4gb3V0cHV0T2JzZXJ2YWJsZTsgfSxcclxuICAgICAgICAgICAgZ2V0IHN0YXR1cygpIHsgcmV0dXJuIHN0YXR1czsgfSxcclxuICAgICAgICAgICAgZ2V0IHN0YXRlKCkgeyByZXR1cm4gPE9ic2VydmFibGU8Vmlld01vZGVsPj48YW55PnN0YXRlOyB9LFxyXG4gICAgICAgICAgICBnZXQgcHJvamVjdHMoKSB7IHJldHVybiBwcm9qZWN0czsgfSxcclxuICAgICAgICAgICAgZ2V0IHByb2plY3RBZGRlZCgpIHsgcmV0dXJuIF9wcm9qZWN0QWRkZWRTdHJlYW07IH0sXHJcbiAgICAgICAgICAgIGdldCBwcm9qZWN0UmVtb3ZlZCgpIHsgcmV0dXJuIF9wcm9qZWN0UmVtb3ZlZFN0cmVhbTsgfSxcclxuICAgICAgICAgICAgZ2V0IHByb2plY3RDaGFuZ2VkKCkgeyByZXR1cm4gX3Byb2plY3RDaGFuZ2VkU3RyZWFtOyB9LFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLnN0YXRlLnN1YnNjcmliZShiaW5kKHRoaXMuX3VwZGF0ZVN0YXRlLCB0aGlzKSkpO1xyXG5cclxuICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xyXG4gICAgICAgICh3aW5kb3dbXCJjbGllbnRzXCJdIHx8ICh3aW5kb3dbXCJjbGllbnRzXCJdID0gW10pKS5wdXNoKHRoaXMpOyAgLy9URU1QXHJcbiAgICAgICAgLyogdHNsaW50OmVuYWJsZSAqL1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5zdGF0ZS5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgX3NvbHV0aW9uLnByb2plY3RzKHsgRXhjbHVkZVNvdXJjZUZpbGVzOiBmYWxzZSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBfc29sdXRpb24ucGFja2FnZXNvdXJjZSh7IFByb2plY3RQYXRoOiBfc29sdXRpb24ucGF0aCB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhY2thZ2VTb3VyY2VzID0gcmVzcG9uc2UuU291cmNlcztcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5zdGF0ZS5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGVhY2godGhpcy5wcm9qZWN0cy5zbGljZSgpLCBwcm9qZWN0ID0+IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCkpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0QWRkZWQuc3Vic2NyaWJlKHByb2plY3RJbmZvcm1hdGlvbiA9PiB7XHJcbiAgICAgICAgICAgIGVhY2gocHJvamVjdFZpZXdNb2RlbEZhY3RvcnkocHJvamVjdEluZm9ybWF0aW9uLCBfc29sdXRpb24ucHJvamVjdFBhdGgpLCBwcm9qZWN0ID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghc29tZSh0aGlzLnByb2plY3RzLCB7IHBhdGg6IHByb2plY3QucGF0aCB9KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdHMucHVzaChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5vYnNlcnZlLnByb2plY3RSZW1vdmVkLnN1YnNjcmliZShwcm9qZWN0SW5mb3JtYXRpb24gPT4ge1xyXG4gICAgICAgICAgICBlYWNoKHByb2plY3RWaWV3TW9kZWxGYWN0b3J5KHByb2plY3RJbmZvcm1hdGlvbiwgX3NvbHV0aW9uLnByb2plY3RQYXRoKSwgcHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZDogUHJvamVjdFZpZXdNb2RlbDxhbnk+ID0gZmluZCh0aGlzLnByb2plY3RzLCB7IHBhdGg6IHByb2plY3QucGF0aCB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHB1bGwodGhpcy5wcm9qZWN0cywgZm91bmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0Q2hhbmdlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcclxuICAgICAgICAgICAgZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmQ6IFByb2plY3RWaWV3TW9kZWw8YW55PiA9IGZpbmQodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZC51cGRhdGUocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5vYnNlcnZlLnByb2plY3RzLnN1YnNjcmliZShjb250ZXh0ID0+IHtcclxuICAgICAgICAgICAgZWFjaCh3b3Jrc3BhY2VWaWV3TW9kZWxGYWN0b3J5KGNvbnRleHQucmVzcG9uc2UsIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmQ6IFByb2plY3RWaWV3TW9kZWw8YW55PiA9IGZpbmQodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZC51cGRhdGUocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0cy5wdXNoKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbS5uZXh0KHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGVhY2godGhpcy5wcm9qZWN0cywgeCA9PiB4LmRpc3Bvc2UoKSk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFByb2plY3RGb3JFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0Rm9yUGF0aChlZGl0b3IuZ2V0UGF0aCgpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKCgpID0+ICFlZGl0b3IuaXNEZXN0cm95ZWQoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFByb2plY3RGb3JQYXRoKHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLmlzT24gJiYgdGhpcy5wcm9qZWN0cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9IGZpbmQodGhpcy5wcm9qZWN0cywgeCA9PiB4LmZpbGVzU2V0LmhhcyhwYXRoKSk7XHJcbiAgICAgICAgICAgIGlmIChwcm9qZWN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihwcm9qZWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JzZXJ2ZS5wcm9qZWN0QWRkZWQuZmlsdGVyKHggPT4gc3RhcnRzV2l0aChwYXRoLCB4LnBhdGgpKS50YWtlKDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRQcm9qZWN0Q29udGFpbmluZ0VkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFByb2plY3RDb250YWluaW5nRmlsZShlZGl0b3IuZ2V0UGF0aCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0UHJvamVjdENvbnRhaW5pbmdGaWxlKHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLmlzT24gJiYgdGhpcy5wcm9qZWN0cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9IGZpbmQodGhpcy5wcm9qZWN0cywgeCA9PiBpbmNsdWRlcyh4LnNvdXJjZUZpbGVzLCBub3JtYWxpemUocGF0aCkpKTtcclxuICAgICAgICAgICAgaWYgKHByb2plY3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHByb2plY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKG51bGwpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9ic2VydmUucHJvamVjdEFkZGVkXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4gaW5jbHVkZXMoeC5zb3VyY2VGaWxlcywgbm9ybWFsaXplKHBhdGgpKSlcclxuICAgICAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgICAgICAuZGVmYXVsdElmRW1wdHkobnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3VwZGF0ZVN0YXRlKHN0YXRlOiBEcml2ZXJTdGF0ZSkge1xyXG4gICAgICAgIHRoaXMuaXNPbiA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0aW5nIHx8IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQ7XHJcbiAgICAgICAgdGhpcy5pc09mZiA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQ7XHJcbiAgICAgICAgdGhpcy5pc0Nvbm5lY3RpbmcgPSBzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGluZztcclxuICAgICAgICB0aGlzLmlzUmVhZHkgPSBzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkO1xyXG4gICAgICAgIHRoaXMuaXNFcnJvciA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5FcnJvcjtcclxuXHJcbiAgICAgICAgdGhpcy5fc3RhdGVTdHJlYW0ubmV4dCh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zZXR1cENvZGVjaGVjayhfc29sdXRpb246IFNvbHV0aW9uKSB7XHJcbiAgICAgICAgY29uc3QgYmFzZUNvZGVjaGVjayA9IF9zb2x1dGlvbi5vYnNlcnZlLmRpYWdub3N0aWNcclxuICAgICAgICAgICAgLm1hcChkYXRhID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY291bnRzID0gdGhpcy5kaWFnbm9zdGljQ291bnRzO1xyXG4gICAgICAgICAgICAgICAgZWFjaChkYXRhLlJlc3VsdHMsIHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZXMucHVzaChyZXN1bHQuRmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmhhcyhyZXN1bHQuRmlsZU5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZCA9IHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUuZ2V0KHJlc3VsdC5GaWxlTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlhZ25vc3RpY3NCeUZpbGUuZGVsZXRlKHJlc3VsdC5GaWxlTmFtZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncm91cGVkID0gZ3JvdXBCeShvbGQsIHggPT4geC5Mb2dMZXZlbC50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWFjaChncm91cGVkLCAoaXRlbXMsIGtleSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc051bWJlcihjb3VudHNba2V5XSkpIHsgY291bnRzW2tleV0gPSAwOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudHNba2V5XSAtPSBpdGVtcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY291bnRzW2tleV0gPCAwKSBjb3VudHNba2V5XSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaWFnbm9zdGljc0J5RmlsZS5zZXQocmVzdWx0LkZpbGVOYW1lLCBzb3J0QnkocmVzdWx0LlF1aWNrRml4ZXMsIHggPT4geC5MaW5lLCBxdWlja0ZpeCA9PiBxdWlja0ZpeC5Mb2dMZXZlbCwgeCA9PiB4LlRleHQpKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBncm91cGVkID0gZ3JvdXBCeShyZXN1bHQuUXVpY2tGaXhlcywgeCA9PiB4LkxvZ0xldmVsLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVhY2goZ3JvdXBlZCwgKGl0ZW1zLCBrZXkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc051bWJlcihjb3VudHNba2V5XSkpIHsgY291bnRzW2tleV0gPSAwOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50c1trZXldICs9IGl0ZW1zLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGVzO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGlhZ25vc3RpY3MgPSBiYXNlQ29kZWNoZWNrXHJcbiAgICAgICAgICAgIC5tYXAoeCA9PiB0aGlzLmRpYWdub3N0aWNzKVxyXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xyXG5cclxuICAgICAgICBjb25zdCBkaWFnbm9zdGljc0J5RmlsZSA9IGJhc2VDb2RlY2hlY2tcclxuICAgICAgICAgICAgLm1hcChmaWxlcyA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtYXAgPSBuZXcgTWFwPHN0cmluZywgTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPigpO1xyXG4gICAgICAgICAgICAgICAgZWFjaChmaWxlcywgZmlsZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFwLnNldChmaWxlLCB0aGlzLmRpYWdub3N0aWNzQnlGaWxlLmdldChmaWxlKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRpYWdub3N0aWNzQ291bnRzID0gYmFzZUNvZGVjaGVja1xyXG4gICAgICAgICAgICAubWFwKHggPT4gdGhpcy5kaWFnbm9zdGljQ291bnRzKVxyXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGJhc2VDb2RlY2hlY2suc3Vic2NyaWJlKCkpO1xyXG4gICAgICAgIHJldHVybiB7IGRpYWdub3N0aWNzLCBkaWFnbm9zdGljc0J5RmlsZSwgZGlhZ25vc3RpY3NDb3VudHMgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zZXR1cFN0YXR1cyhfc29sdXRpb246IFNvbHV0aW9uKSB7XHJcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gX3NvbHV0aW9uLnN0YXR1c1xyXG4gICAgICAgICAgICAuc3RhcnRXaXRoKDxhbnk+e30pXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gc3RhdHVzO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==
