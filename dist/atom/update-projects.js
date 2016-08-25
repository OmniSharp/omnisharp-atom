"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.updateProject = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

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

            this.disposable = new _tsDisposables.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3VwZGF0ZS1wcm9qZWN0cy5qcyIsImxpYi9hdG9tL3VwZGF0ZS1wcm9qZWN0cy50cyJdLCJuYW1lcyI6WyJmcyIsInN0YXQiLCJiaW5kTm9kZUNhbGxiYWNrIiwiVXBkYXRlUHJvamVjdCIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJhdG9tIiwiY29uZmlnIiwib2JzZXJ2ZSIsInZhbHVlIiwiX2F1dG9BZGp1c3RUcmVlVmlldyIsIl9uYWdBZGp1c3RUcmVlVmlldyIsIl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyIsIl9uYWdBZGRFeHRlcm5hbFByb2plY3RzIiwiX3BhdGhzIiwicHJvamVjdCIsImdldFBhdGhzIiwib25EaWRDaGFuZ2VQYXRocyIsInBhdGhzIiwiYWRkIiwibGlzdGVuZXIiLCJtb2RlbCIsInByb2plY3RBZGRlZCIsImZpbHRlciIsInN0YXJ0c1dpdGgiLCJ6IiwicGF0aCIsInNvbHV0aW9uUGF0aCIsInNvbWUiLCJ4IiwibGVuZ3RoIiwic3Vic2NyaWJlIiwiaGFuZGxlUHJvamVjdEFkZGVkIiwicHJvamVjdFJlbW92ZWQiLCJoYW5kbGVQcm9qZWN0UmVtb3ZlZCIsInJlZ2lzdGVyQ29uZmlndXJhdGlvbiIsInNvbHV0aW9uIiwidGVtcG9yYXJ5IiwiZmluZCIsImFkanVzdFRyZWVWaWV3Iiwibm90aWZpY2F0aW9uIiwibm90aWZpY2F0aW9ucyIsImFkZEluZm8iLCJkZXRhaWwiLCJidXR0b25zIiwidGV4dCIsImNsYXNzTmFtZSIsIm9uRGlkQ2xpY2siLCJkaXNtaXNzIiwiZGlzbWlzc2FibGUiLCJvbGRQYXRoIiwibmV3UGF0aCIsIm5ld1BhdGhzIiwic2xpY2UiLCJzcGxpY2UiLCJmaW5kSW5kZXgiLCJzZXRQYXRocyIsInByb2plY3RzIiwiZnJvbSIsInVuaXEiLCJtYXAiLCJmbGF0TWFwIiwic3QiLCJpc0RpcmVjdG9yeSIsInRvQXJyYXkiLCJnZXRQcm9qZWN0RGlyZWN0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O0FBSDhCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFJbEMsaUJBSkQsTUFJTyxJQUFJLE9BQUtGLHVCQUFULEVBQWtDO0FBQUE7QUFDckMsNEJBQUkyQixlQUFlbEMsS0FBS21DLGFBQUwsQ0FBbUJDLE9BQW5CLDhCQUE2RDtBQUM1RUMsb0NBQVF6QixNQUFNaUQsSUFBTixDQUFXLElBQVgsQ0FEb0U7QUFFNUUvRCxpSkFGNEU7QUFHNUV3QyxxQ0FBUyxDQUNMO0FBQ0lDLHNDQUFNLE1BRFY7QUFFSUMsMkNBQVcsYUFGZjtBQUdJQyw0Q0FBWSxzQkFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUNSLDhEQUFzQjdCLEtBQXRCLG1JQUE2QjtBQUFBLGdEQUFsQkgsU0FBa0I7O0FBQ3pCVCxpREFBS1MsT0FBTCxDQUFhcUQsVUFBYixDQUF3QnJELFNBQXhCO0FBQ0g7QUFITztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUlSeUIsaURBQWFRLE9BQWI7QUFDSDtBQVJMLDZCQURLLEVBVUY7QUFDQ0gsc0NBQU0sU0FEUDtBQUVDRSw0Q0FBWSxzQkFBQTtBQUNSUCxpREFBYVEsT0FBYjtBQUNIO0FBSkYsNkJBVkUsQ0FIbUU7QUFvQjVFQyx5Q0FBYTtBQXBCK0QseUJBQTdELENBQW5CO0FBRHFDO0FBdUJ4QztBQUNKLGFBOUJMO0FBK0JIOzs7aUNBRVksQ0FBWTs7O2tDQUVYO0FBQ1YsaUJBQUs1QyxVQUFMLENBQWdCZ0UsT0FBaEI7QUFDSDs7Ozs7O0FBT0UsSUFBTUMsd0NBQWdCLElBQUlyRSxhQUFKLEVBQXRCIiwiZmlsZSI6ImxpYi9hdG9tL3VwZGF0ZS1wcm9qZWN0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5jb25zdCBzdGF0ID0gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnN0YXQpO1xuaW1wb3J0IHsgZGlybmFtZSB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBidWZmZXJGb3IgfSBmcm9tIFwiLi4vb3BlcmF0b3JzL2J1ZmZlckZvclwiO1xuY2xhc3MgVXBkYXRlUHJvamVjdCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJBdG9tIFByb2plY3QgVXBkYXRlclwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgZm9yIGRldGVjdGluZyBleHRlcm5hbCBwcm9qZWN0cyBhbmQgaWYgYXRvbSBpcyBsb29raW5nIGF0IHRoZSB3cm9uZyBwcm9qZWN0IGZvbGRlci5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5hdXRvQWRqdXN0VHJlZVZpZXdcIiwgKHZhbHVlKSA9PiB0aGlzLl9hdXRvQWRqdXN0VHJlZVZpZXcgPSB2YWx1ZSk7XG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5uYWdBZGp1c3RUcmVlVmlld1wiLCAodmFsdWUpID0+IHRoaXMuX25hZ0FkanVzdFRyZWVWaWV3ID0gdmFsdWUpO1xuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20uYXV0b0FkZEV4dGVybmFsUHJvamVjdHNcIiwgKHZhbHVlKSA9PiB0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyA9IHZhbHVlKTtcbiAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLm5hZ0FkZEV4dGVybmFsUHJvamVjdHNcIiwgKHZhbHVlKSA9PiB0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzID0gdmFsdWUpO1xuICAgICAgICB0aGlzLl9wYXRocyA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpO1xuICAgICAgICBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocygocGF0aHMpID0+IHRoaXMuX3BhdGhzID0gcGF0aHMpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGJ1ZmZlckZvcihPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RBZGRlZFxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzIHx8IHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIV8uc3RhcnRzV2l0aCh6LnBhdGgsIHouc29sdXRpb25QYXRoKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhXy5zb21lKHRoaXMuX3BhdGhzLCB4ID0+IF8uc3RhcnRzV2l0aCh6LnBhdGgsIHgpKSksIDEwMDApXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5sZW5ndGggPiAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuaGFuZGxlUHJvamVjdEFkZGVkKHByb2plY3QpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYnVmZmVyRm9yKE9tbmkubGlzdGVuZXIubW9kZWwucHJvamVjdFJlbW92ZWRcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyB8fCB0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzKVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICFfLnN0YXJ0c1dpdGgoei5wYXRoLCB6LnNvbHV0aW9uUGF0aCkpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gXy5zb21lKHRoaXMuX3BhdGhzLCB4ID0+IF8uc3RhcnRzV2l0aCh6LnBhdGgsIHgpKSksIDEwMDApXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5sZW5ndGggPiAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuaGFuZGxlUHJvamVjdFJlbW92ZWQocHJvamVjdCkpKTtcbiAgICAgICAgT21uaS5yZWdpc3RlckNvbmZpZ3VyYXRpb24oc29sdXRpb24gPT4ge1xuICAgICAgICAgICAgaWYgKCFzb2x1dGlvbi50ZW1wb3JhcnkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gXy5maW5kKHRoaXMuX3BhdGhzLCB4ID0+IF8uc3RhcnRzV2l0aCh4LCBzb2x1dGlvbi5wYXRoKSAmJiB4ICE9PSBzb2x1dGlvbi5wYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYXV0b0FkanVzdFRyZWVWaWV3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkanVzdFRyZWVWaWV3KHBhdGgsIHNvbHV0aW9uLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuX25hZ0FkanVzdFRyZWVWaWV3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oXCJTaG93IHNvbHV0aW9uIHJvb3Q/XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGAke3BhdGh9XFxuLT4gJHtzb2x1dGlvbi5wYXRofWAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiSXQgYXBwZWFycyB0aGUgc29sdXRpb24gcm9vdCBpcyBub3QgZGlzcGxheWVkIGluIHRoZSB0cmVldmlldy4gIFdvdWxkIHlvdSBsaWtlIHRvIHNob3cgdGhlIGVudGlyZSBzb2x1dGlvbiBpbiB0aGUgdHJlZSB2aWV3P1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJPa2F5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IFwiYnRuLXN1Y2Nlc3NcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkanVzdFRyZWVWaWV3KHBhdGgsIHNvbHV0aW9uLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiRGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFkanVzdFRyZWVWaWV3KG9sZFBhdGgsIG5ld1BhdGgpIHtcbiAgICAgICAgY29uc3QgbmV3UGF0aHMgPSB0aGlzLl9wYXRocy5zbGljZSgpO1xuICAgICAgICBuZXdQYXRocy5zcGxpY2UoXy5maW5kSW5kZXgodGhpcy5fcGF0aHMsIG9sZFBhdGgpLCAxLCBuZXdQYXRoKTtcbiAgICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKG5ld1BhdGhzKTtcbiAgICB9XG4gICAgZ2V0UHJvamVjdERpcmVjdG9yaWVzKHByb2plY3RzKSB7XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20oXy51bmlxKHByb2plY3RzLm1hcCh6ID0+IHoucGF0aCkpKVxuICAgICAgICAgICAgLmZsYXRNYXAocHJvamVjdCA9PiBzdGF0KHByb2plY3QpLCAocHJvamVjdCwgc3QpID0+IHtcbiAgICAgICAgICAgIGlmIChzdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2plY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGlybmFtZShwcm9qZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgICAgIC50b0FycmF5KCk7XG4gICAgfVxuICAgIGhhbmRsZVByb2plY3RBZGRlZChwcm9qZWN0cykge1xuICAgICAgICB0aGlzLmdldFByb2plY3REaXJlY3Rvcmllcyhwcm9qZWN0cylcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocGF0aHMgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XG4gICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5hZGRQYXRoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYEFkZCBleHRlcm5hbCBwcm9qZWN0cz9gLCB7XG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogcGF0aHMuam9pbihcIlxcblwiKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGBXZSBoYXZlIGRldGVjdGVkIGV4dGVybmFsIHByb2plY3RzIHdvdWxkIHlvdSBsaWtlIHRvIGFkZCB0aGVtIHRvIHRoZSB0cmVldmlldz9gLFxuICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJPa2F5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJ0bi1zdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcGF0aHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5hZGRQYXRoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiRGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBoYW5kbGVQcm9qZWN0UmVtb3ZlZChwcm9qZWN0cykge1xuICAgICAgICB0aGlzLmdldFByb2plY3REaXJlY3Rvcmllcyhwcm9qZWN0cylcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocGF0aHMgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XG4gICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYFJlbW92ZSBleHRlcm5hbCBwcm9qZWN0cz9gLCB7XG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogcGF0aHMuam9pbihcIlxcblwiKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGBXZSBoYXZlIGRldGVjdGVkIGV4dGVybmFsIHByb2plY3RzIGhhdmUgYmVlbiByZW1vdmVkLCB3b3VsZCB5b3UgbGlrZSB0byByZW1vdmUgdGhlbSBmcm9tIHRoZSB0cmVldmlldz9gLFxuICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJPa2F5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJ0bi1zdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcGF0aHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiRGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhdHRhY2goKSB7IH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCB1cGRhdGVQcm9qZWN0ID0gbmV3IFVwZGF0ZVByb2plY3Q7XG4iLCJpbXBvcnQge09ic2VydmFibGV9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi4vc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcclxuY29uc3Qgc3RhdCA9IE9ic2VydmFibGUuYmluZE5vZGVDYWxsYmFjayhmcy5zdGF0KTtcclxuaW1wb3J0IHtkaXJuYW1lfSBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge2J1ZmZlckZvcn0gZnJvbSBcIi4uL29wZXJhdG9ycy9idWZmZXJGb3JcIjtcclxuXHJcbmNsYXNzIFVwZGF0ZVByb2plY3QgaW1wbGVtZW50cyBJQXRvbUZlYXR1cmUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfcGF0aHM6IHN0cmluZ1tdO1xyXG5cclxuICAgIHByaXZhdGUgX2F1dG9BZGp1c3RUcmVlVmlldzogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX25hZ0FkanVzdFRyZWVWaWV3OiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfYXV0b0FkZEV4dGVybmFsUHJvamVjdHM6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIF9uYWdBZGRFeHRlcm5hbFByb2plY3RzOiBib29sZWFuO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20uYXV0b0FkanVzdFRyZWVWaWV3XCIsICh2YWx1ZTogYm9vbGVhbikgPT4gdGhpcy5fYXV0b0FkanVzdFRyZWVWaWV3ID0gdmFsdWUpO1xyXG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5uYWdBZGp1c3RUcmVlVmlld1wiLCAodmFsdWU6IGJvb2xlYW4pID0+IHRoaXMuX25hZ0FkanVzdFRyZWVWaWV3ID0gdmFsdWUpO1xyXG5cclxuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20uYXV0b0FkZEV4dGVybmFsUHJvamVjdHNcIiwgKHZhbHVlOiBib29sZWFuKSA9PiB0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyA9IHZhbHVlKTtcclxuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20ubmFnQWRkRXh0ZXJuYWxQcm9qZWN0c1wiLCAodmFsdWU6IGJvb2xlYW4pID0+IHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMgPSB2YWx1ZSk7XHJcblxyXG4gICAgICAgIC8vIFdlXCJyZSBrZWVwaW5nIHRyYWNrIG9mIHBhdGhzLCBqdXN0IHNvIHdlIGhhdmUgYSBsb2NhbCByZWZlcmVuY2VcclxuICAgICAgICB0aGlzLl9wYXRocyA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpO1xyXG4gICAgICAgIGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzKChwYXRoczogYW55W10pID0+IHRoaXMuX3BhdGhzID0gcGF0aHMpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBidWZmZXJGb3IoXHJcbiAgICAgICAgICAgICAgICBPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RBZGRlZFxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyB8fCB0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhXy5zdGFydHNXaXRoKHoucGF0aCwgei5zb2x1dGlvblBhdGgpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhXy5zb21lKHRoaXMuX3BhdGhzLCB4ID0+IF8uc3RhcnRzV2l0aCh6LnBhdGgsIHgpKSksXHJcbiAgICAgICAgICAgICAgICAxMDAwKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHoubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLmhhbmRsZVByb2plY3RBZGRlZChwcm9qZWN0KSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBidWZmZXJGb3IoXHJcbiAgICAgICAgICAgICAgICBPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RSZW1vdmVkXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzIHx8IHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICFfLnN0YXJ0c1dpdGgoei5wYXRoLCB6LnNvbHV0aW9uUGF0aCkpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IF8uc29tZSh0aGlzLl9wYXRocywgeCA9PiBfLnN0YXJ0c1dpdGgoei5wYXRoLCB4KSkpLFxyXG4gICAgICAgICAgICAgICAgMTAwMClcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6Lmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5oYW5kbGVQcm9qZWN0UmVtb3ZlZChwcm9qZWN0KSkpO1xyXG5cclxuICAgICAgICBPbW5pLnJlZ2lzdGVyQ29uZmlndXJhdGlvbihzb2x1dGlvbiA9PiB7XHJcbiAgICAgICAgICAgIGlmICghc29sdXRpb24udGVtcG9yYXJ5KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gXy5maW5kKHRoaXMuX3BhdGhzLCB4ID0+IF8uc3RhcnRzV2l0aCh4LCBzb2x1dGlvbi5wYXRoKSAmJiB4ICE9PSBzb2x1dGlvbi5wYXRoKTtcclxuICAgICAgICAgICAgICAgIGlmIChwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9BZGp1c3RUcmVlVmlldykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkanVzdFRyZWVWaWV3KHBhdGgsIHNvbHV0aW9uLnBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fbmFnQWRqdXN0VHJlZVZpZXcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm90aWZ5IGZvciBhZGp1c3RtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhcIlNob3cgc29sdXRpb24gcm9vdD9cIiwgPGFueT57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGAke3BhdGh9XFxuLT4gJHtzb2x1dGlvbi5wYXRofWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJJdCBhcHBlYXJzIHRoZSBzb2x1dGlvbiByb290IGlzIG5vdCBkaXNwbGF5ZWQgaW4gdGhlIHRyZWV2aWV3LiAgV291bGQgeW91IGxpa2UgdG8gc2hvdyB0aGUgZW50aXJlIHNvbHV0aW9uIGluIHRoZSB0cmVlIHZpZXc/XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIk9rYXlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJ0bi1zdWNjZXNzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRqdXN0VHJlZVZpZXcocGF0aCwgc29sdXRpb24ucGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIkRpc21pc3NcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFkanVzdFRyZWVWaWV3KG9sZFBhdGg6IHN0cmluZywgbmV3UGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgbmV3UGF0aHMgPSB0aGlzLl9wYXRocy5zbGljZSgpO1xyXG4gICAgICAgIG5ld1BhdGhzLnNwbGljZShfLmZpbmRJbmRleCh0aGlzLl9wYXRocywgb2xkUGF0aCksIDEsIG5ld1BhdGgpO1xyXG4gICAgICAgIGF0b20ucHJvamVjdC5zZXRQYXRocyg8YW55Pm5ld1BhdGhzKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFByb2plY3REaXJlY3Rvcmllcyhwcm9qZWN0czogUHJvamVjdFZpZXdNb2RlbDxhbnk+W10pIHtcclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tPHN0cmluZz4oXy51bmlxKHByb2plY3RzLm1hcCh6ID0+IHoucGF0aCkpKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChwcm9qZWN0ID0+IHN0YXQocHJvamVjdCksIChwcm9qZWN0LCBzdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0LmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvamVjdDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRpcm5hbWUocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50b0FycmF5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBoYW5kbGVQcm9qZWN0QWRkZWQocHJvamVjdHM6IFByb2plY3RWaWV3TW9kZWw8YW55PltdKSB7XHJcbiAgICAgICAgdGhpcy5nZXRQcm9qZWN0RGlyZWN0b3JpZXMocHJvamVjdHMpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocGF0aHMgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5hZGRQYXRoKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fbmFnQWRkRXh0ZXJuYWxQcm9qZWN0cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhgQWRkIGV4dGVybmFsIHByb2plY3RzP2AsIDxhbnk+e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IHBhdGhzLmpvaW4oXCJcXG5cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgV2UgaGF2ZSBkZXRlY3RlZCBleHRlcm5hbCBwcm9qZWN0cyB3b3VsZCB5b3UgbGlrZSB0byBhZGQgdGhlbSB0byB0aGUgdHJlZXZpZXc/YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiT2theVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogXCJidG4tc3VjY2Vzc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdG9tLnByb2plY3QuYWRkUGF0aChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJEaXNtaXNzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBoYW5kbGVQcm9qZWN0UmVtb3ZlZChwcm9qZWN0czogUHJvamVjdFZpZXdNb2RlbDxhbnk+W10pIHtcclxuICAgICAgICB0aGlzLmdldFByb2plY3REaXJlY3Rvcmllcyhwcm9qZWN0cylcclxuICAgICAgICAgICAgLnN1YnNjcmliZShwYXRocyA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYXV0b0FkZEV4dGVybmFsUHJvamVjdHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcGF0aHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5wcm9qZWN0LnJlbW92ZVBhdGgocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKGBSZW1vdmUgZXh0ZXJuYWwgcHJvamVjdHM/YCwgPGFueT57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogcGF0aHMuam9pbihcIlxcblwiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGBXZSBoYXZlIGRldGVjdGVkIGV4dGVybmFsIHByb2plY3RzIGhhdmUgYmVlbiByZW1vdmVkLCB3b3VsZCB5b3UgbGlrZSB0byByZW1vdmUgdGhlbSBmcm9tIHRoZSB0cmVldmlldz9gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJPa2F5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJ0bi1zdWNjZXNzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcGF0aHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiRGlzbWlzc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2goKSB7IC8qICovIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkF0b20gUHJvamVjdCBVcGRhdGVyXCI7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCBmb3IgZGV0ZWN0aW5nIGV4dGVybmFsIHByb2plY3RzIGFuZCBpZiBhdG9tIGlzIGxvb2tpbmcgYXQgdGhlIHdyb25nIHByb2plY3QgZm9sZGVyLlwiO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgdXBkYXRlUHJvamVjdCA9IG5ldyBVcGRhdGVQcm9qZWN0O1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
