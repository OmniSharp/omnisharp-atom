"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.updateProject = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omni = require("../server/omni");

var _fs = require("fs");

var fs = _interopRequireWildcard(_fs);

var _path = require("path");

var _bufferFor = require("../operators/bufferFor");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var stat = _rxjs.Observable.bindNodeCallback(fs.stat);

var UpdateProject = function () {
    function UpdateProject() {
        _classCallCheck(this, UpdateProject);

        this.required = true;
        this.title = "Atom Project Updater";
        this.description = "Adds support for detecting external projects and if atom is looking at the wrong project folder.";
    }

    _createClass(UpdateProject, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            atom.config.observe("omnisharp-atom.autoAdjustTreeView", function (value) {
                return _this._autoAdjustTreeView = value;
            });
            atom.config.observe("omnisharp-atom.nagAdjustTreeView", function (value) {
                return _this._nagAdjustTreeView = value;
            });
            atom.config.observe("omnisharp-atom.autoAddExternalProjects", function (value) {
                return _this._autoAddExternalProjects = value;
            });
            atom.config.observe("omnisharp-atom.nagAddExternalProjects", function (value) {
                return _this._nagAddExternalProjects = value;
            });
            this._paths = atom.project.getPaths();
            atom.project.onDidChangePaths(function (paths) {
                return _this._paths = paths;
            });
            this.disposable.add((0, _bufferFor.bufferFor)(_omni.Omni.listener.model.projectAdded.filter(function (z) {
                return _this._autoAddExternalProjects || _this._nagAddExternalProjects;
            }).filter(function (z) {
                return !_lodash2.default.startsWith(z.path, z.solutionPath);
            }).filter(function (z) {
                return !_lodash2.default.some(_this._paths, function (x) {
                    return _lodash2.default.startsWith(z.path, x);
                });
            }), 1000).filter(function (z) {
                return z.length > 0;
            }).subscribe(function (project) {
                return _this.handleProjectAdded(project);
            }));
            this.disposable.add((0, _bufferFor.bufferFor)(_omni.Omni.listener.model.projectRemoved.filter(function (z) {
                return _this._autoAddExternalProjects || _this._nagAddExternalProjects;
            }).filter(function (z) {
                return !_lodash2.default.startsWith(z.path, z.solutionPath);
            }).filter(function (z) {
                return _lodash2.default.some(_this._paths, function (x) {
                    return _lodash2.default.startsWith(z.path, x);
                });
            }), 1000).filter(function (z) {
                return z.length > 0;
            }).subscribe(function (project) {
                return _this.handleProjectRemoved(project);
            }));
            _omni.Omni.registerConfiguration(function (solution) {
                if (!solution.temporary) {
                    (function () {
                        var path = _lodash2.default.find(_this._paths, function (x) {
                            return _lodash2.default.startsWith(x, solution.path) && x !== solution.path;
                        });
                        if (path) {
                            if (_this._autoAdjustTreeView) {
                                _this.adjustTreeView(path, solution.path);
                            } else if (_this._nagAdjustTreeView) {
                                (function () {
                                    var notification = atom.notifications.addInfo("Show solution root?", {
                                        detail: path + "\n-> " + solution.path,
                                        description: "It appears the solution root is not displayed in the treeview.  Would you like to show the entire solution in the tree view?",
                                        buttons: [{
                                            text: "Okay",
                                            className: "btn-success",
                                            onDidClick: function onDidClick() {
                                                _this.adjustTreeView(path, solution.path);
                                                notification.dismiss();
                                            }
                                        }, {
                                            text: "Dismiss",
                                            onDidClick: function onDidClick() {
                                                notification.dismiss();
                                            }
                                        }],
                                        dismissable: true
                                    });
                                })();
                            }
                        }
                    })();
                }
            });
        }
    }, {
        key: "adjustTreeView",
        value: function adjustTreeView(oldPath, newPath) {
            var newPaths = this._paths.slice();
            newPaths.splice(_lodash2.default.findIndex(this._paths, oldPath), 1, newPath);
            atom.project.setPaths(newPaths);
        }
    }, {
        key: "getProjectDirectories",
        value: function getProjectDirectories(projects) {
            return _rxjs.Observable.from(_lodash2.default.uniq(projects.map(function (z) {
                return z.path;
            }))).flatMap(function (project) {
                return stat(project);
            }, function (project, st) {
                if (st.isDirectory()) {
                    return project;
                } else {
                    return (0, _path.dirname)(project);
                }
            }).toArray();
        }
    }, {
        key: "handleProjectAdded",
        value: function handleProjectAdded(projects) {
            var _this2 = this;

            this.getProjectDirectories(projects).subscribe(function (paths) {
                if (_this2._autoAddExternalProjects) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = paths[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var project = _step.value;

                            atom.project.addPath(project);
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
                } else if (_this2._nagAddExternalProjects) {
                    (function () {
                        var notification = atom.notifications.addInfo("Add external projects?", {
                            detail: paths.join("\n"),
                            description: "We have detected external projects would you like to add them to the treeview?",
                            buttons: [{
                                text: "Okay",
                                className: "btn-success",
                                onDidClick: function onDidClick() {
                                    var _iteratorNormalCompletion2 = true;
                                    var _didIteratorError2 = false;
                                    var _iteratorError2 = undefined;

                                    try {
                                        for (var _iterator2 = paths[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                            var _project = _step2.value;

                                            atom.project.addPath(_project);
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

                                    notification.dismiss();
                                }
                            }, {
                                text: "Dismiss",
                                onDidClick: function onDidClick() {
                                    notification.dismiss();
                                }
                            }],
                            dismissable: true
                        });
                    })();
                }
            });
        }
    }, {
        key: "handleProjectRemoved",
        value: function handleProjectRemoved(projects) {
            var _this3 = this;

            this.getProjectDirectories(projects).subscribe(function (paths) {
                if (_this3._autoAddExternalProjects) {
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = paths[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var project = _step3.value;

                            atom.project.removePath(project);
                        }
                    } catch (err) {
                        _didIteratorError3 = true;
                        _iteratorError3 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                _iterator3.return();
                            }
                        } finally {
                            if (_didIteratorError3) {
                                throw _iteratorError3;
                            }
                        }
                    }
                } else if (_this3._nagAddExternalProjects) {
                    (function () {
                        var notification = atom.notifications.addInfo("Remove external projects?", {
                            detail: paths.join("\n"),
                            description: "We have detected external projects have been removed, would you like to remove them from the treeview?",
                            buttons: [{
                                text: "Okay",
                                className: "btn-success",
                                onDidClick: function onDidClick() {
                                    var _iteratorNormalCompletion4 = true;
                                    var _didIteratorError4 = false;
                                    var _iteratorError4 = undefined;

                                    try {
                                        for (var _iterator4 = paths[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                            var _project2 = _step4.value;

                                            atom.project.removePath(_project2);
                                        }
                                    } catch (err) {
                                        _didIteratorError4 = true;
                                        _iteratorError4 = err;
                                    } finally {
                                        try {
                                            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                                _iterator4.return();
                                            }
                                        } finally {
                                            if (_didIteratorError4) {
                                                throw _iteratorError4;
                                            }
                                        }
                                    }

                                    notification.dismiss();
                                }
                            }, {
                                text: "Dismiss",
                                onDidClick: function onDidClick() {
                                    notification.dismiss();
                                }
                            }],
                            dismissable: true
                        });
                    })();
                }
            });
        }
    }, {
        key: "attach",
        value: function attach() {}
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return UpdateProject;
}();

var updateProject = exports.updateProject = new UpdateProject();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3VwZGF0ZS1wcm9qZWN0cy5qcyIsImxpYi9hdG9tL3VwZGF0ZS1wcm9qZWN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztBQUNBOztBQUNBOztJQ0NZOztBRENaOztBQUNBOzs7Ozs7OztBQ0RBLElBQU0sT0FBTyxpQkFBVyxnQkFBWCxDQUE0QixHQUFHLElBQUgsQ0FBbkM7O0lBSU47QUFBQSw2QkFBQTs7O0FBeUtXLGFBQUEsUUFBQSxHQUFXLElBQVgsQ0F6S1g7QUEwS1csYUFBQSxLQUFBLEdBQVEsc0JBQVIsQ0ExS1g7QUEyS1csYUFBQSxXQUFBLEdBQWMsa0dBQWQsQ0EzS1g7S0FBQTs7OzttQ0FTbUI7OztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCLENBRFc7QUFHWCxpQkFBSyxNQUFMLENBQVksT0FBWixDQUFvQixtQ0FBcEIsRUFBeUQsVUFBQyxLQUFEO3VCQUFvQixNQUFLLG1CQUFMLEdBQTJCLEtBQTNCO2FBQXBCLENBQXpELENBSFc7QUFJWCxpQkFBSyxNQUFMLENBQVksT0FBWixDQUFvQixrQ0FBcEIsRUFBd0QsVUFBQyxLQUFEO3VCQUFvQixNQUFLLGtCQUFMLEdBQTBCLEtBQTFCO2FBQXBCLENBQXhELENBSlc7QUFNWCxpQkFBSyxNQUFMLENBQVksT0FBWixDQUFvQix3Q0FBcEIsRUFBOEQsVUFBQyxLQUFEO3VCQUFvQixNQUFLLHdCQUFMLEdBQWdDLEtBQWhDO2FBQXBCLENBQTlELENBTlc7QUFPWCxpQkFBSyxNQUFMLENBQVksT0FBWixDQUFvQix1Q0FBcEIsRUFBNkQsVUFBQyxLQUFEO3VCQUFvQixNQUFLLHVCQUFMLEdBQStCLEtBQS9CO2FBQXBCLENBQTdELENBUFc7QUFVWCxpQkFBSyxNQUFMLEdBQWMsS0FBSyxPQUFMLENBQWEsUUFBYixFQUFkLENBVlc7QUFXWCxpQkFBSyxPQUFMLENBQWEsZ0JBQWIsQ0FBOEIsVUFBQyxLQUFEO3VCQUFrQixN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QUxBLENBRGYsQ0FEMEQ7Ozs7aUNBa0NqRDs7O2tDQUVDO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQixHQURVOzs7Ozs7O0FBU1gsSUFBTSx3Q0FBZ0IsSUFBSSxhQUFKLEVBQWhCIiwiZmlsZSI6ImxpYi9hdG9tL3VwZGF0ZS1wcm9qZWN0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmNvbnN0IHN0YXQgPSBPYnNlcnZhYmxlLmJpbmROb2RlQ2FsbGJhY2soZnMuc3RhdCk7XG5pbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGJ1ZmZlckZvciB9IGZyb20gXCIuLi9vcGVyYXRvcnMvYnVmZmVyRm9yXCI7XG5jbGFzcyBVcGRhdGVQcm9qZWN0IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkF0b20gUHJvamVjdCBVcGRhdGVyXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCBmb3IgZGV0ZWN0aW5nIGV4dGVybmFsIHByb2plY3RzIGFuZCBpZiBhdG9tIGlzIGxvb2tpbmcgYXQgdGhlIHdyb25nIHByb2plY3QgZm9sZGVyLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLmF1dG9BZGp1c3RUcmVlVmlld1wiLCAodmFsdWUpID0+IHRoaXMuX2F1dG9BZGp1c3RUcmVlVmlldyA9IHZhbHVlKTtcbiAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLm5hZ0FkanVzdFRyZWVWaWV3XCIsICh2YWx1ZSkgPT4gdGhpcy5fbmFnQWRqdXN0VHJlZVZpZXcgPSB2YWx1ZSk7XG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0c1wiLCAodmFsdWUpID0+IHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzID0gdmFsdWUpO1xuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20ubmFnQWRkRXh0ZXJuYWxQcm9qZWN0c1wiLCAodmFsdWUpID0+IHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMgPSB2YWx1ZSk7XG4gICAgICAgIHRoaXMuX3BhdGhzID0gYXRvbS5wcm9qZWN0LmdldFBhdGhzKCk7XG4gICAgICAgIGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzKChwYXRocykgPT4gdGhpcy5fcGF0aHMgPSBwYXRocyk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYnVmZmVyRm9yKE9tbmkubGlzdGVuZXIubW9kZWwucHJvamVjdEFkZGVkXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gdGhpcy5fYXV0b0FkZEV4dGVybmFsUHJvamVjdHMgfHwgdGhpcy5fbmFnQWRkRXh0ZXJuYWxQcm9qZWN0cylcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhXy5zdGFydHNXaXRoKHoucGF0aCwgei5zb2x1dGlvblBhdGgpKVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICFfLnNvbWUodGhpcy5fcGF0aHMsIHggPT4gXy5zdGFydHNXaXRoKHoucGF0aCwgeCkpKSwgMTAwMClcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6Lmxlbmd0aCA+IDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5oYW5kbGVQcm9qZWN0QWRkZWQocHJvamVjdCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChidWZmZXJGb3IoT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0UmVtb3ZlZFxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzIHx8IHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIV8uc3RhcnRzV2l0aCh6LnBhdGgsIHouc29sdXRpb25QYXRoKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiBfLnNvbWUodGhpcy5fcGF0aHMsIHggPT4gXy5zdGFydHNXaXRoKHoucGF0aCwgeCkpKSwgMTAwMClcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6Lmxlbmd0aCA+IDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5oYW5kbGVQcm9qZWN0UmVtb3ZlZChwcm9qZWN0KSkpO1xuICAgICAgICBPbW5pLnJlZ2lzdGVyQ29uZmlndXJhdGlvbihzb2x1dGlvbiA9PiB7XG4gICAgICAgICAgICBpZiAoIXNvbHV0aW9uLnRlbXBvcmFyeSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSBfLmZpbmQodGhpcy5fcGF0aHMsIHggPT4gXy5zdGFydHNXaXRoKHgsIHNvbHV0aW9uLnBhdGgpICYmIHggIT09IHNvbHV0aW9uLnBhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hdXRvQWRqdXN0VHJlZVZpZXcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRqdXN0VHJlZVZpZXcocGF0aCwgc29sdXRpb24ucGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5fbmFnQWRqdXN0VHJlZVZpZXcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhcIlNob3cgc29sdXRpb24gcm9vdD9cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogYCR7cGF0aH1cXG4tPiAke3NvbHV0aW9uLnBhdGh9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJJdCBhcHBlYXJzIHRoZSBzb2x1dGlvbiByb290IGlzIG5vdCBkaXNwbGF5ZWQgaW4gdGhlIHRyZWV2aWV3LiAgV291bGQgeW91IGxpa2UgdG8gc2hvdyB0aGUgZW50aXJlIHNvbHV0aW9uIGluIHRoZSB0cmVlIHZpZXc/XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIk9rYXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogXCJidG4tc3VjY2Vzc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRqdXN0VHJlZVZpZXcocGF0aCwgc29sdXRpb24ucGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJEaXNtaXNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgYWRqdXN0VHJlZVZpZXcob2xkUGF0aCwgbmV3UGF0aCkge1xuICAgICAgICBjb25zdCBuZXdQYXRocyA9IHRoaXMuX3BhdGhzLnNsaWNlKCk7XG4gICAgICAgIG5ld1BhdGhzLnNwbGljZShfLmZpbmRJbmRleCh0aGlzLl9wYXRocywgb2xkUGF0aCksIDEsIG5ld1BhdGgpO1xuICAgICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMobmV3UGF0aHMpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0RGlyZWN0b3JpZXMocHJvamVjdHMpIHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbShfLnVuaXEocHJvamVjdHMubWFwKHogPT4gei5wYXRoKSkpXG4gICAgICAgICAgICAuZmxhdE1hcChwcm9qZWN0ID0+IHN0YXQocHJvamVjdCksIChwcm9qZWN0LCBzdCkgPT4ge1xuICAgICAgICAgICAgaWYgKHN0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvamVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBkaXJuYW1lKHByb2plY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAgICAgLnRvQXJyYXkoKTtcbiAgICB9XG4gICAgaGFuZGxlUHJvamVjdEFkZGVkKHByb2plY3RzKSB7XG4gICAgICAgIHRoaXMuZ2V0UHJvamVjdERpcmVjdG9yaWVzKHByb2plY3RzKVxuICAgICAgICAgICAgLnN1YnNjcmliZShwYXRocyA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYXV0b0FkZEV4dGVybmFsUHJvamVjdHMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcGF0aHMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXRvbS5wcm9qZWN0LmFkZFBhdGgocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5fbmFnQWRkRXh0ZXJuYWxQcm9qZWN0cykge1xuICAgICAgICAgICAgICAgIGxldCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhgQWRkIGV4dGVybmFsIHByb2plY3RzP2AsIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBwYXRocy5qb2luKFwiXFxuXCIpLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYFdlIGhhdmUgZGV0ZWN0ZWQgZXh0ZXJuYWwgcHJvamVjdHMgd291bGQgeW91IGxpa2UgdG8gYWRkIHRoZW0gdG8gdGhlIHRyZWV2aWV3P2AsXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIk9rYXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IFwiYnRuLXN1Y2Nlc3NcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvamVjdCBvZiBwYXRocykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5wcm9qZWN0LmFkZFBhdGgocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJEaXNtaXNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGhhbmRsZVByb2plY3RSZW1vdmVkKHByb2plY3RzKSB7XG4gICAgICAgIHRoaXMuZ2V0UHJvamVjdERpcmVjdG9yaWVzKHByb2plY3RzKVxuICAgICAgICAgICAgLnN1YnNjcmliZShwYXRocyA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYXV0b0FkZEV4dGVybmFsUHJvamVjdHMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcGF0aHMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXRvbS5wcm9qZWN0LnJlbW92ZVBhdGgocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5fbmFnQWRkRXh0ZXJuYWxQcm9qZWN0cykge1xuICAgICAgICAgICAgICAgIGxldCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhgUmVtb3ZlIGV4dGVybmFsIHByb2plY3RzP2AsIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBwYXRocy5qb2luKFwiXFxuXCIpLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYFdlIGhhdmUgZGV0ZWN0ZWQgZXh0ZXJuYWwgcHJvamVjdHMgaGF2ZSBiZWVuIHJlbW92ZWQsIHdvdWxkIHlvdSBsaWtlIHRvIHJlbW92ZSB0aGVtIGZyb20gdGhlIHRyZWV2aWV3P2AsXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIk9rYXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IFwiYnRuLXN1Y2Nlc3NcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvamVjdCBvZiBwYXRocykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5wcm9qZWN0LnJlbW92ZVBhdGgocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJEaXNtaXNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGF0dGFjaCgpIHsgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHVwZGF0ZVByb2plY3QgPSBuZXcgVXBkYXRlUHJvamVjdDtcbiIsImltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XHJcbmltcG9ydCB7UHJvamVjdFZpZXdNb2RlbH0gZnJvbSBcIi4uL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWxcIjtcclxuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XHJcbmNvbnN0IHN0YXQgPSBPYnNlcnZhYmxlLmJpbmROb2RlQ2FsbGJhY2soZnMuc3RhdCk7XHJcbmltcG9ydCB7ZGlybmFtZX0gZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHtidWZmZXJGb3J9IGZyb20gXCIuLi9vcGVyYXRvcnMvYnVmZmVyRm9yXCI7XHJcblxyXG5jbGFzcyBVcGRhdGVQcm9qZWN0IGltcGxlbWVudHMgSUF0b21GZWF0dXJlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX3BhdGhzOiBzdHJpbmdbXTtcclxuXHJcbiAgICBwcml2YXRlIF9hdXRvQWRqdXN0VHJlZVZpZXc6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIF9uYWdBZGp1c3RUcmVlVmlldzogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfbmFnQWRkRXh0ZXJuYWxQcm9qZWN0czogYm9vbGVhbjtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuXHJcbiAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLmF1dG9BZGp1c3RUcmVlVmlld1wiLCAodmFsdWU6IGJvb2xlYW4pID0+IHRoaXMuX2F1dG9BZGp1c3RUcmVlVmlldyA9IHZhbHVlKTtcclxuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20ubmFnQWRqdXN0VHJlZVZpZXdcIiwgKHZhbHVlOiBib29sZWFuKSA9PiB0aGlzLl9uYWdBZGp1c3RUcmVlVmlldyA9IHZhbHVlKTtcclxuXHJcbiAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLmF1dG9BZGRFeHRlcm5hbFByb2plY3RzXCIsICh2YWx1ZTogYm9vbGVhbikgPT4gdGhpcy5fYXV0b0FkZEV4dGVybmFsUHJvamVjdHMgPSB2YWx1ZSk7XHJcbiAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLm5hZ0FkZEV4dGVybmFsUHJvamVjdHNcIiwgKHZhbHVlOiBib29sZWFuKSA9PiB0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzID0gdmFsdWUpO1xyXG5cclxuICAgICAgICAvLyBXZVwicmUga2VlcGluZyB0cmFjayBvZiBwYXRocywganVzdCBzbyB3ZSBoYXZlIGEgbG9jYWwgcmVmZXJlbmNlXHJcbiAgICAgICAgdGhpcy5fcGF0aHMgPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKTtcclxuICAgICAgICBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocygocGF0aHM6IGFueVtdKSA9PiB0aGlzLl9wYXRocyA9IHBhdGhzKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgYnVmZmVyRm9yKFxyXG4gICAgICAgICAgICAgICAgT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0QWRkZWRcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gdGhpcy5fYXV0b0FkZEV4dGVybmFsUHJvamVjdHMgfHwgdGhpcy5fbmFnQWRkRXh0ZXJuYWxQcm9qZWN0cylcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gIV8uc3RhcnRzV2l0aCh6LnBhdGgsIHouc29sdXRpb25QYXRoKSlcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gIV8uc29tZSh0aGlzLl9wYXRocywgeCA9PiBfLnN0YXJ0c1dpdGgoei5wYXRoLCB4KSkpLFxyXG4gICAgICAgICAgICAgICAgMTAwMClcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6Lmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5oYW5kbGVQcm9qZWN0QWRkZWQocHJvamVjdCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgYnVmZmVyRm9yKFxyXG4gICAgICAgICAgICAgICAgT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0UmVtb3ZlZFxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyB8fCB0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhXy5zdGFydHNXaXRoKHoucGF0aCwgei5zb2x1dGlvblBhdGgpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiBfLnNvbWUodGhpcy5fcGF0aHMsIHggPT4gXy5zdGFydHNXaXRoKHoucGF0aCwgeCkpKSxcclxuICAgICAgICAgICAgICAgIDEwMDApXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gei5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuaGFuZGxlUHJvamVjdFJlbW92ZWQocHJvamVjdCkpKTtcclxuXHJcbiAgICAgICAgT21uaS5yZWdpc3RlckNvbmZpZ3VyYXRpb24oc29sdXRpb24gPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXNvbHV0aW9uLnRlbXBvcmFyeSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IF8uZmluZCh0aGlzLl9wYXRocywgeCA9PiBfLnN0YXJ0c1dpdGgoeCwgc29sdXRpb24ucGF0aCkgJiYgeCAhPT0gc29sdXRpb24ucGF0aCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocGF0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hdXRvQWRqdXN0VHJlZVZpZXcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGp1c3RUcmVlVmlldyhwYXRoLCBzb2x1dGlvbi5wYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX25hZ0FkanVzdFRyZWVWaWV3KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vdGlmeSBmb3IgYWRqdXN0bWVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oXCJTaG93IHNvbHV0aW9uIHJvb3Q/XCIsIDxhbnk+e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBgJHtwYXRofVxcbi0+ICR7c29sdXRpb24ucGF0aH1gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiSXQgYXBwZWFycyB0aGUgc29sdXRpb24gcm9vdCBpcyBub3QgZGlzcGxheWVkIGluIHRoZSB0cmVldmlldy4gIFdvdWxkIHlvdSBsaWtlIHRvIHNob3cgdGhlIGVudGlyZSBzb2x1dGlvbiBpbiB0aGUgdHJlZSB2aWV3P1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJPa2F5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogXCJidG4tc3VjY2Vzc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkanVzdFRyZWVWaWV3KHBhdGgsIHNvbHV0aW9uLnBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJEaXNtaXNzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGp1c3RUcmVlVmlldyhvbGRQYXRoOiBzdHJpbmcsIG5ld1BhdGg6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IG5ld1BhdGhzID0gdGhpcy5fcGF0aHMuc2xpY2UoKTtcclxuICAgICAgICBuZXdQYXRocy5zcGxpY2UoXy5maW5kSW5kZXgodGhpcy5fcGF0aHMsIG9sZFBhdGgpLCAxLCBuZXdQYXRoKTtcclxuICAgICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoPGFueT5uZXdQYXRocyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRQcm9qZWN0RGlyZWN0b3JpZXMocHJvamVjdHM6IFByb2plY3RWaWV3TW9kZWw8YW55PltdKSB7XHJcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbTxzdHJpbmc+KF8udW5pcShwcm9qZWN0cy5tYXAoeiA9PiB6LnBhdGgpKSlcclxuICAgICAgICAgICAgLmZsYXRNYXAocHJvamVjdCA9PiBzdGF0KHByb2plY3QpLCAocHJvamVjdCwgc3QpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChzdC5pc0RpcmVjdG9yeSgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb2plY3Q7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkaXJuYW1lKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAudG9BcnJheSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaGFuZGxlUHJvamVjdEFkZGVkKHByb2plY3RzOiBQcm9qZWN0Vmlld01vZGVsPGFueT5bXSkge1xyXG4gICAgICAgIHRoaXMuZ2V0UHJvamVjdERpcmVjdG9yaWVzKHByb2plY3RzKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHBhdGhzID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvamVjdCBvZiBwYXRocykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdG9tLnByb2plY3QuYWRkUGF0aChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYEFkZCBleHRlcm5hbCBwcm9qZWN0cz9gLCA8YW55PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBwYXRocy5qb2luKFwiXFxuXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYFdlIGhhdmUgZGV0ZWN0ZWQgZXh0ZXJuYWwgcHJvamVjdHMgd291bGQgeW91IGxpa2UgdG8gYWRkIHRoZW0gdG8gdGhlIHRyZWV2aWV3P2AsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIk9rYXlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IFwiYnRuLXN1Y2Nlc3NcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvamVjdCBvZiBwYXRocykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5wcm9qZWN0LmFkZFBhdGgocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiRGlzbWlzc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaGFuZGxlUHJvamVjdFJlbW92ZWQocHJvamVjdHM6IFByb2plY3RWaWV3TW9kZWw8YW55PltdKSB7XHJcbiAgICAgICAgdGhpcy5nZXRQcm9qZWN0RGlyZWN0b3JpZXMocHJvamVjdHMpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocGF0aHMgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fbmFnQWRkRXh0ZXJuYWxQcm9qZWN0cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhgUmVtb3ZlIGV4dGVybmFsIHByb2plY3RzP2AsIDxhbnk+e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IHBhdGhzLmpvaW4oXCJcXG5cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgV2UgaGF2ZSBkZXRlY3RlZCBleHRlcm5hbCBwcm9qZWN0cyBoYXZlIGJlZW4gcmVtb3ZlZCwgd291bGQgeW91IGxpa2UgdG8gcmVtb3ZlIHRoZW0gZnJvbSB0aGUgdHJlZXZpZXc/YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiT2theVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogXCJidG4tc3VjY2Vzc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdG9tLnByb2plY3QucmVtb3ZlUGF0aChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIkRpc21pc3NcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoKCkgeyAvKiAqLyB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xyXG4gICAgcHVibGljIHRpdGxlID0gXCJBdG9tIFByb2plY3QgVXBkYXRlclwiO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgZm9yIGRldGVjdGluZyBleHRlcm5hbCBwcm9qZWN0cyBhbmQgaWYgYXRvbSBpcyBsb29raW5nIGF0IHRoZSB3cm9uZyBwcm9qZWN0IGZvbGRlci5cIjtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHVwZGF0ZVByb2plY3QgPSBuZXcgVXBkYXRlUHJvamVjdDtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
