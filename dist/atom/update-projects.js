'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.updateProject = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _lodash = require('lodash');

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _omni = require('../server/omni');

var _path = require('path');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var stat = _rxjs.Observable.bindNodeCallback(fs.stat);

var UpdateProject = function () {
    function UpdateProject() {
        _classCallCheck(this, UpdateProject);

        this.required = true;
        this.title = 'Atom Project Updater';
        this.description = 'Adds support for detecting external projects and if atom is looking at the wrong project folder.';
    }

    _createClass(UpdateProject, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            atom.config.observe('omnisharp-atom.autoAdjustTreeView', function (value) {
                return _this._autoAdjustTreeView = value;
            });
            atom.config.observe('omnisharp-atom.nagAdjustTreeView', function (value) {
                return _this._nagAdjustTreeView = value;
            });
            atom.config.observe('omnisharp-atom.autoAddExternalProjects', function (value) {
                return _this._autoAddExternalProjects = value;
            });
            atom.config.observe('omnisharp-atom.nagAddExternalProjects', function (value) {
                return _this._nagAddExternalProjects = value;
            });
            this._paths = atom.project.getPaths();
            atom.project.onDidChangePaths(function (paths) {
                return _this._paths = paths;
            });
            this.disposable.add(_omni.Omni.listener.model.projectAdded.filter(function (z) {
                return _this._autoAddExternalProjects || _this._nagAddExternalProjects;
            }).filter(function (z) {
                return !(0, _lodash.startsWith)(z.path, z.solutionPath);
            }).filter(function (z) {
                return !(0, _lodash.some)(_this._paths, function (x) {
                    return (0, _lodash.startsWith)(z.path, x);
                });
            }).subscribe(function (project) {
                return _this._handleProjectAdded([project]);
            }));
            this.disposable.add(_omni.Omni.listener.model.projectRemoved.filter(function (z) {
                return _this._autoAddExternalProjects || _this._nagAddExternalProjects;
            }).filter(function (z) {
                return !(0, _lodash.startsWith)(z.path, z.solutionPath);
            }).filter(function (z) {
                return (0, _lodash.some)(_this._paths, function (x) {
                    return (0, _lodash.startsWith)(z.path, x);
                });
            }).subscribe(function (project) {
                return _this._handleProjectRemoved([project]);
            }));
            _omni.Omni.registerConfiguration(function (solution) {
                if (!solution.temporary) {
                    (function () {
                        var path = (0, _lodash.find)(_this._paths, function (x) {
                            return (0, _lodash.startsWith)(x, solution.path) && x !== solution.path;
                        });
                        if (path) {
                            if (_this._autoAdjustTreeView) {
                                _this._adjustTreeView(path, solution.path);
                            } else if (_this._nagAdjustTreeView) {
                                (function () {
                                    var notification = atom.notifications.addInfo('Show solution root?', {
                                        detail: path + '\n-> ' + solution.path,
                                        description: 'It appears the solution root is not displayed in the treeview.  Would you like to show the entire solution in the tree view?',
                                        buttons: [{
                                            text: 'Okay',
                                            className: 'btn-success',
                                            onDidClick: function onDidClick() {
                                                _this._adjustTreeView(path, solution.path);
                                                notification.dismiss();
                                            }
                                        }, {
                                            text: 'Dismiss',
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
        key: 'attach',
        value: function attach() {}
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: '_adjustTreeView',
        value: function _adjustTreeView(oldPath, newPath) {
            var newPaths = this._paths.slice();
            newPaths.splice((0, _lodash.findIndex)(this._paths, oldPath), 1, newPath);
            atom.project.setPaths(newPaths);
        }
    }, {
        key: '_getProjectDirectories',
        value: function _getProjectDirectories(projects) {
            return _rxjs.Observable.from((0, _lodash.uniq)(projects.map(function (z) {
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
        key: '_handleProjectAdded',
        value: function _handleProjectAdded(projects) {
            var _this2 = this;

            this._getProjectDirectories(projects).subscribe(function (paths) {
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
                        var notification = atom.notifications.addInfo('Add external projects?', {
                            detail: paths.join('\n'),
                            description: 'We have detected external projects would you like to add them to the treeview?',
                            buttons: [{
                                text: 'Okay',
                                className: 'btn-success',
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
                                text: 'Dismiss',
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
        key: '_handleProjectRemoved',
        value: function _handleProjectRemoved(projects) {
            var _this3 = this;

            this._getProjectDirectories(projects).subscribe(function (paths) {
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
                        var notification = atom.notifications.addInfo('Remove external projects?', {
                            detail: paths.join('\n'),
                            description: 'We have detected external projects have been removed, would you like to remove them from the treeview?',
                            buttons: [{
                                text: 'Okay',
                                className: 'btn-success',
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
                                text: 'Dismiss',
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
    }]);

    return UpdateProject;
}();

var updateProject = exports.updateProject = new UpdateProject();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3VwZGF0ZS1wcm9qZWN0cy50cyJdLCJuYW1lcyI6WyJmcyIsInN0YXQiLCJiaW5kTm9kZUNhbGxiYWNrIiwiVXBkYXRlUHJvamVjdCIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJhdG9tIiwiY29uZmlnIiwib2JzZXJ2ZSIsInZhbHVlIiwiX2F1dG9BZGp1c3RUcmVlVmlldyIsIl9uYWdBZGp1c3RUcmVlVmlldyIsIl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyIsIl9uYWdBZGRFeHRlcm5hbFByb2plY3RzIiwiX3BhdGhzIiwicHJvamVjdCIsImdldFBhdGhzIiwib25EaWRDaGFuZ2VQYXRocyIsInBhdGhzIiwiYWRkIiwibGlzdGVuZXIiLCJtb2RlbCIsInByb2plY3RBZGRlZCIsImZpbHRlciIsInoiLCJwYXRoIiwic29sdXRpb25QYXRoIiwieCIsInN1YnNjcmliZSIsIl9oYW5kbGVQcm9qZWN0QWRkZWQiLCJwcm9qZWN0UmVtb3ZlZCIsIl9oYW5kbGVQcm9qZWN0UmVtb3ZlZCIsInJlZ2lzdGVyQ29uZmlndXJhdGlvbiIsInNvbHV0aW9uIiwidGVtcG9yYXJ5IiwiX2FkanVzdFRyZWVWaWV3Iiwibm90aWZpY2F0aW9uIiwibm90aWZpY2F0aW9ucyIsImFkZEluZm8iLCJkZXRhaWwiLCJidXR0b25zIiwidGV4dCIsImNsYXNzTmFtZSIsIm9uRGlkQ2xpY2siLCJkaXNtaXNzIiwiZGlzbWlzc2FibGUiLCJkaXNwb3NlIiwib2xkUGF0aCIsIm5ld1BhdGgiLCJuZXdQYXRocyIsInNsaWNlIiwic3BsaWNlIiwic2V0UGF0aHMiLCJwcm9qZWN0cyIsImZyb20iLCJtYXAiLCJmbGF0TWFwIiwic3QiLCJpc0RpcmVjdG9yeSIsInRvQXJyYXkiLCJfZ2V0UHJvamVjdERpcmVjdG9yaWVzIiwiYWRkUGF0aCIsImpvaW4iLCJyZW1vdmVQYXRoIiwidXBkYXRlUHJvamVjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7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WSxzQkFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUNSLDhEQUFzQnpCLEtBQXRCLG1JQUE2QjtBQUFBLGdEQUFsQkgsU0FBa0I7O0FBQ3pCVCxpREFBS1MsT0FBTCxDQUFhZ0QsVUFBYixDQUF3QmhELFNBQXhCO0FBQ0g7QUFITztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUlScUIsaURBQWFRLE9BQWI7QUFDSDtBQVJMLDZCQURLLEVBVUY7QUFDQ0gsc0NBQU0sU0FEUDtBQUVDRSw0Q0FBWSxzQkFBQTtBQUNSUCxpREFBYVEsT0FBYjtBQUNIO0FBSkYsNkJBVkUsQ0FIcUU7QUFvQjlFQyx5Q0FBYTtBQXBCaUUseUJBQTdELENBQXJCO0FBRHFDO0FBdUJ4QztBQUNKLGFBOUJMO0FBK0JIOzs7Ozs7QUFJRSxJQUFNbUIsd0NBQWdCLElBQUkvRCxhQUFKLEVBQXRCIiwiZmlsZSI6ImxpYi9hdG9tL3VwZGF0ZS1wcm9qZWN0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IHsgZmluZCwgZmluZEluZGV4LCBzb21lLCBzdGFydHNXaXRoLCB1bmlxIH0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5pbXBvcnQgeyBPbW5pIH0gZnJvbSAnLi4vc2VydmVyL29tbmknO1xyXG5pbXBvcnQgeyBQcm9qZWN0Vmlld01vZGVsIH0gZnJvbSAnLi4vc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbCc7XHJcbmNvbnN0IHN0YXQgPSBPYnNlcnZhYmxlLmJpbmROb2RlQ2FsbGJhY2soZnMuc3RhdCk7XHJcbmltcG9ydCB7IGRpcm5hbWUgfSBmcm9tICdwYXRoJztcclxuXHJcbmNsYXNzIFVwZGF0ZVByb2plY3QgaW1wbGVtZW50cyBJQXRvbUZlYXR1cmUge1xyXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcclxuICAgIHB1YmxpYyB0aXRsZSA9ICdBdG9tIFByb2plY3QgVXBkYXRlcic7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSAnQWRkcyBzdXBwb3J0IGZvciBkZXRlY3RpbmcgZXh0ZXJuYWwgcHJvamVjdHMgYW5kIGlmIGF0b20gaXMgbG9va2luZyBhdCB0aGUgd3JvbmcgcHJvamVjdCBmb2xkZXIuJztcclxuXHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9wYXRoczogc3RyaW5nW107XHJcblxyXG4gICAgcHJpdmF0ZSBfYXV0b0FkanVzdFRyZWVWaWV3OiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfbmFnQWRqdXN0VHJlZVZpZXc6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIF9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0czogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX25hZ0FkZEV4dGVybmFsUHJvamVjdHM6IGJvb2xlYW47XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ29tbmlzaGFycC1hdG9tLmF1dG9BZGp1c3RUcmVlVmlldycsICh2YWx1ZTogYm9vbGVhbikgPT4gdGhpcy5fYXV0b0FkanVzdFRyZWVWaWV3ID0gdmFsdWUpO1xyXG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ29tbmlzaGFycC1hdG9tLm5hZ0FkanVzdFRyZWVWaWV3JywgKHZhbHVlOiBib29sZWFuKSA9PiB0aGlzLl9uYWdBZGp1c3RUcmVlVmlldyA9IHZhbHVlKTtcclxuXHJcbiAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnb21uaXNoYXJwLWF0b20uYXV0b0FkZEV4dGVybmFsUHJvamVjdHMnLCAodmFsdWU6IGJvb2xlYW4pID0+IHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzID0gdmFsdWUpO1xyXG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ29tbmlzaGFycC1hdG9tLm5hZ0FkZEV4dGVybmFsUHJvamVjdHMnLCAodmFsdWU6IGJvb2xlYW4pID0+IHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMgPSB2YWx1ZSk7XHJcblxyXG4gICAgICAgIC8vIFdlXCJyZSBrZWVwaW5nIHRyYWNrIG9mIHBhdGhzLCBqdXN0IHNvIHdlIGhhdmUgYSBsb2NhbCByZWZlcmVuY2VcclxuICAgICAgICB0aGlzLl9wYXRocyA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpO1xyXG4gICAgICAgIGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzKChwYXRoczogYW55W10pID0+IHRoaXMuX3BhdGhzID0gcGF0aHMpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RBZGRlZFxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzIHx8IHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gIXN0YXJ0c1dpdGgoei5wYXRoLCB6LnNvbHV0aW9uUGF0aCkpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gIXNvbWUodGhpcy5fcGF0aHMsIHggPT4gc3RhcnRzV2l0aCh6LnBhdGgsIHgpKSlcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLl9oYW5kbGVQcm9qZWN0QWRkZWQoW3Byb2plY3RdKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RSZW1vdmVkXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gdGhpcy5fYXV0b0FkZEV4dGVybmFsUHJvamVjdHMgfHwgdGhpcy5fbmFnQWRkRXh0ZXJuYWxQcm9qZWN0cylcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhc3RhcnRzV2l0aCh6LnBhdGgsIHouc29sdXRpb25QYXRoKSlcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiBzb21lKHRoaXMuX3BhdGhzLCB4ID0+IHN0YXJ0c1dpdGgoei5wYXRoLCB4KSkpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5faGFuZGxlUHJvamVjdFJlbW92ZWQoW3Byb2plY3RdKSkpO1xyXG5cclxuICAgICAgICBPbW5pLnJlZ2lzdGVyQ29uZmlndXJhdGlvbihzb2x1dGlvbiA9PiB7XHJcbiAgICAgICAgICAgIGlmICghc29sdXRpb24udGVtcG9yYXJ5KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gZmluZCh0aGlzLl9wYXRocywgeCA9PiBzdGFydHNXaXRoKHgsIHNvbHV0aW9uLnBhdGgpICYmIHggIT09IHNvbHV0aW9uLnBhdGgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYXV0b0FkanVzdFRyZWVWaWV3KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FkanVzdFRyZWVWaWV3KHBhdGgsIHNvbHV0aW9uLnBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fbmFnQWRqdXN0VHJlZVZpZXcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm90aWZ5IGZvciBhZGp1c3RtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKCdTaG93IHNvbHV0aW9uIHJvb3Q/JywgPGFueT57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGAke3BhdGh9XFxuLT4gJHtzb2x1dGlvbi5wYXRofWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bWF4LWxpbmUtbGVuZ3RoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0l0IGFwcGVhcnMgdGhlIHNvbHV0aW9uIHJvb3QgaXMgbm90IGRpc3BsYXllZCBpbiB0aGUgdHJlZXZpZXcuICBXb3VsZCB5b3UgbGlrZSB0byBzaG93IHRoZSBlbnRpcmUgc29sdXRpb24gaW4gdGhlIHRyZWUgdmlldz8nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ09rYXknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdidG4tc3VjY2VzcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FkanVzdFRyZWVWaWV3KHBhdGgsIHNvbHV0aW9uLnBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0Rpc21pc3MnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdHRhY2goKSB7IC8qICovIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2FkanVzdFRyZWVWaWV3KG9sZFBhdGg6IHN0cmluZywgbmV3UGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgbmV3UGF0aHMgPSB0aGlzLl9wYXRocy5zbGljZSgpO1xyXG4gICAgICAgIG5ld1BhdGhzLnNwbGljZShmaW5kSW5kZXgodGhpcy5fcGF0aHMsIG9sZFBhdGgpLCAxLCBuZXdQYXRoKTtcclxuICAgICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoPGFueT5uZXdQYXRocyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0UHJvamVjdERpcmVjdG9yaWVzKHByb2plY3RzOiBQcm9qZWN0Vmlld01vZGVsPGFueT5bXSkge1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb208c3RyaW5nPih1bmlxKHByb2plY3RzLm1hcCh6ID0+IHoucGF0aCkpKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChwcm9qZWN0ID0+IHN0YXQocHJvamVjdCksIChwcm9qZWN0LCBzdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0LmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvamVjdDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRpcm5hbWUocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50b0FycmF5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaGFuZGxlUHJvamVjdEFkZGVkKHByb2plY3RzOiBQcm9qZWN0Vmlld01vZGVsPGFueT5bXSkge1xyXG4gICAgICAgIHRoaXMuX2dldFByb2plY3REaXJlY3Rvcmllcyhwcm9qZWN0cylcclxuICAgICAgICAgICAgLnN1YnNjcmliZShwYXRocyA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYXV0b0FkZEV4dGVybmFsUHJvamVjdHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcGF0aHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5wcm9qZWN0LmFkZFBhdGgocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYEFkZCBleHRlcm5hbCBwcm9qZWN0cz9gLCA8YW55PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBwYXRocy5qb2luKCdcXG4nKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGBXZSBoYXZlIGRldGVjdGVkIGV4dGVybmFsIHByb2plY3RzIHdvdWxkIHlvdSBsaWtlIHRvIGFkZCB0aGVtIHRvIHRoZSB0cmVldmlldz9gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ09rYXknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2J0bi1zdWNjZXNzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvamVjdCBvZiBwYXRocykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5wcm9qZWN0LmFkZFBhdGgocHJvamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdEaXNtaXNzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9oYW5kbGVQcm9qZWN0UmVtb3ZlZChwcm9qZWN0czogUHJvamVjdFZpZXdNb2RlbDxhbnk+W10pIHtcclxuICAgICAgICB0aGlzLl9nZXRQcm9qZWN0RGlyZWN0b3JpZXMocHJvamVjdHMpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocGF0aHMgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fbmFnQWRkRXh0ZXJuYWxQcm9qZWN0cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKGBSZW1vdmUgZXh0ZXJuYWwgcHJvamVjdHM/YCwgPGFueT57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogcGF0aHMuam9pbignXFxuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgV2UgaGF2ZSBkZXRlY3RlZCBleHRlcm5hbCBwcm9qZWN0cyBoYXZlIGJlZW4gcmVtb3ZlZCwgd291bGQgeW91IGxpa2UgdG8gcmVtb3ZlIHRoZW0gZnJvbSB0aGUgdHJlZXZpZXc/YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdPa2F5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdidG4tc3VjY2VzcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcGF0aHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdEaXNtaXNzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmV4cG9ydC1uYW1lXHJcbmV4cG9ydCBjb25zdCB1cGRhdGVQcm9qZWN0ID0gbmV3IFVwZGF0ZVByb2plY3QoKTtcclxuIl19
