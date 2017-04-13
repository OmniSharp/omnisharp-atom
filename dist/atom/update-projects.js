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
                    var path = (0, _lodash.find)(_this._paths, function (x) {
                        return (0, _lodash.startsWith)(x, solution.path) && x !== solution.path;
                    });
                    if (path) {
                        if (_this._autoAdjustTreeView) {
                            _this._adjustTreeView(path, solution.path);
                        } else if (_this._nagAdjustTreeView) {
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
                        }
                    }
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
                }
            });
        }
    }]);

    return UpdateProject;
}();

var updateProject = exports.updateProject = new UpdateProject();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3VwZGF0ZS1wcm9qZWN0cy50cyJdLCJuYW1lcyI6WyJmcyIsInN0YXQiLCJiaW5kTm9kZUNhbGxiYWNrIiwiVXBkYXRlUHJvamVjdCIsInJlcXVpcmVkIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImRpc3Bvc2FibGUiLCJhdG9tIiwiY29uZmlnIiwib2JzZXJ2ZSIsInZhbHVlIiwiX2F1dG9BZGp1c3RUcmVlVmlldyIsIl9uYWdBZGp1c3RUcmVlVmlldyIsIl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyIsIl9uYWdBZGRFeHRlcm5hbFByb2plY3RzIiwiX3BhdGhzIiwicHJvamVjdCIsImdldFBhdGhzIiwib25EaWRDaGFuZ2VQYXRocyIsInBhdGhzIiwiYWRkIiwibGlzdGVuZXIiLCJtb2RlbCIsInByb2plY3RBZGRlZCIsImZpbHRlciIsInoiLCJwYXRoIiwic29sdXRpb25QYXRoIiwieCIsInN1YnNjcmliZSIsIl9oYW5kbGVQcm9qZWN0QWRkZWQiLCJwcm9qZWN0UmVtb3ZlZCIsIl9oYW5kbGVQcm9qZWN0UmVtb3ZlZCIsInJlZ2lzdGVyQ29uZmlndXJhdGlvbiIsInNvbHV0aW9uIiwidGVtcG9yYXJ5IiwiX2FkanVzdFRyZWVWaWV3Iiwibm90aWZpY2F0aW9uIiwibm90aWZpY2F0aW9ucyIsImFkZEluZm8iLCJkZXRhaWwiLCJidXR0b25zIiwidGV4dCIsImNsYXNzTmFtZSIsIm9uRGlkQ2xpY2siLCJkaXNtaXNzIiwiZGlzbWlzc2FibGUiLCJkaXNwb3NlIiwib2xkUGF0aCIsIm5ld1BhdGgiLCJuZXdQYXRocyIsInNsaWNlIiwic3BsaWNlIiwic2V0UGF0aHMiLCJwcm9qZWN0cyIsImZyb20iLCJtYXAiLCJmbGF0TWFwIiwic3QiLCJpc0RpcmVjdG9yeSIsInRvQXJyYXkiLCJfZ2V0UHJvamVjdERpcmVjdG9yaWVzIiwiYWRkUGF0aCIsImpvaW4iLCJyZW1vdmVQYXRoIiwidXBkYXRlUHJvamVjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7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S0FBdEIsbUlBQTZCO0FBQUEsNENBQWxCSCxTQUFrQjs7QUFDekJULDZDQUFLUyxPQUFMLENBQWFnRCxVQUFiLENBQXdCaEQsU0FBeEI7QUFDSDtBQUhPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBSVJxQiw2Q0FBYVEsT0FBYjtBQUNIO0FBUkwseUJBREssRUFVRjtBQUNDSCxrQ0FBTSxTQURQO0FBRUNFLHdDQUFZLHNCQUFBO0FBQ1JQLDZDQUFhUSxPQUFiO0FBQ0g7QUFKRix5QkFWRSxDQUhxRTtBQW9COUVDLHFDQUFhO0FBcEJpRSxxQkFBN0QsQ0FBckI7QUFzQkg7QUFDSixhQTlCTDtBQStCSDs7Ozs7O0FBSUUsSUFBTW1CLHdDQUFnQixJQUFJL0QsYUFBSixFQUF0QiIsImZpbGUiOiJsaWIvYXRvbS91cGRhdGUtcHJvamVjdHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCB7IGZpbmQsIGZpbmRJbmRleCwgc29tZSwgc3RhcnRzV2l0aCwgdW5pcSB9IGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ3RzLWRpc3Bvc2FibGVzJztcclxuaW1wb3J0IHsgT21uaSB9IGZyb20gJy4uL3NlcnZlci9vbW5pJztcclxuaW1wb3J0IHsgUHJvamVjdFZpZXdNb2RlbCB9IGZyb20gJy4uL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWwnO1xyXG5jb25zdCBzdGF0ID0gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnN0YXQpO1xyXG5pbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSAncGF0aCc7XHJcblxyXG5jbGFzcyBVcGRhdGVQcm9qZWN0IGltcGxlbWVudHMgSUF0b21GZWF0dXJlIHtcclxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XHJcbiAgICBwdWJsaWMgdGl0bGUgPSAnQXRvbSBQcm9qZWN0IFVwZGF0ZXInO1xyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gJ0FkZHMgc3VwcG9ydCBmb3IgZGV0ZWN0aW5nIGV4dGVybmFsIHByb2plY3RzIGFuZCBpZiBhdG9tIGlzIGxvb2tpbmcgYXQgdGhlIHdyb25nIHByb2plY3QgZm9sZGVyLic7XHJcblxyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfcGF0aHM6IHN0cmluZ1tdO1xyXG5cclxuICAgIHByaXZhdGUgX2F1dG9BZGp1c3RUcmVlVmlldzogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgX25hZ0FkanVzdFRyZWVWaWV3OiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBfYXV0b0FkZEV4dGVybmFsUHJvamVjdHM6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIF9uYWdBZGRFeHRlcm5hbFByb2plY3RzOiBib29sZWFuO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdvbW5pc2hhcnAtYXRvbS5hdXRvQWRqdXN0VHJlZVZpZXcnLCAodmFsdWU6IGJvb2xlYW4pID0+IHRoaXMuX2F1dG9BZGp1c3RUcmVlVmlldyA9IHZhbHVlKTtcclxuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdvbW5pc2hhcnAtYXRvbS5uYWdBZGp1c3RUcmVlVmlldycsICh2YWx1ZTogYm9vbGVhbikgPT4gdGhpcy5fbmFnQWRqdXN0VHJlZVZpZXcgPSB2YWx1ZSk7XHJcblxyXG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ29tbmlzaGFycC1hdG9tLmF1dG9BZGRFeHRlcm5hbFByb2plY3RzJywgKHZhbHVlOiBib29sZWFuKSA9PiB0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyA9IHZhbHVlKTtcclxuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdvbW5pc2hhcnAtYXRvbS5uYWdBZGRFeHRlcm5hbFByb2plY3RzJywgKHZhbHVlOiBib29sZWFuKSA9PiB0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzID0gdmFsdWUpO1xyXG5cclxuICAgICAgICAvLyBXZVwicmUga2VlcGluZyB0cmFjayBvZiBwYXRocywganVzdCBzbyB3ZSBoYXZlIGEgbG9jYWwgcmVmZXJlbmNlXHJcbiAgICAgICAgdGhpcy5fcGF0aHMgPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKTtcclxuICAgICAgICBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocygocGF0aHM6IGFueVtdKSA9PiB0aGlzLl9wYXRocyA9IHBhdGhzKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0QWRkZWRcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyB8fCB0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICFzdGFydHNXaXRoKHoucGF0aCwgei5zb2x1dGlvblBhdGgpKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICFzb21lKHRoaXMuX3BhdGhzLCB4ID0+IHN0YXJ0c1dpdGgoei5wYXRoLCB4KSkpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5faGFuZGxlUHJvamVjdEFkZGVkKFtwcm9qZWN0XSkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0UmVtb3ZlZFxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzIHx8IHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gIXN0YXJ0c1dpdGgoei5wYXRoLCB6LnNvbHV0aW9uUGF0aCkpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gc29tZSh0aGlzLl9wYXRocywgeCA9PiBzdGFydHNXaXRoKHoucGF0aCwgeCkpKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX2hhbmRsZVByb2plY3RSZW1vdmVkKFtwcm9qZWN0XSkpKTtcclxuXHJcbiAgICAgICAgT21uaS5yZWdpc3RlckNvbmZpZ3VyYXRpb24oc29sdXRpb24gPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXNvbHV0aW9uLnRlbXBvcmFyeSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGZpbmQodGhpcy5fcGF0aHMsIHggPT4gc3RhcnRzV2l0aCh4LCBzb2x1dGlvbi5wYXRoKSAmJiB4ICE9PSBzb2x1dGlvbi5wYXRoKTtcclxuICAgICAgICAgICAgICAgIGlmIChwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9BZGp1c3RUcmVlVmlldykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hZGp1c3RUcmVlVmlldyhwYXRoLCBzb2x1dGlvbi5wYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX25hZ0FkanVzdFRyZWVWaWV3KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vdGlmeSBmb3IgYWRqdXN0bWVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbygnU2hvdyBzb2x1dGlvbiByb290PycsIDxhbnk+e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBgJHtwYXRofVxcbi0+ICR7c29sdXRpb24ucGF0aH1gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm1heC1saW5lLWxlbmd0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJdCBhcHBlYXJzIHRoZSBzb2x1dGlvbiByb290IGlzIG5vdCBkaXNwbGF5ZWQgaW4gdGhlIHRyZWV2aWV3LiAgV291bGQgeW91IGxpa2UgdG8gc2hvdyB0aGUgZW50aXJlIHNvbHV0aW9uIGluIHRoZSB0cmVlIHZpZXc/JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdPa2F5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiAnYnRuLXN1Y2Nlc3MnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hZGp1c3RUcmVlVmlldyhwYXRoLCBzb2x1dGlvbi5wYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdEaXNtaXNzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoKCkgeyAvKiAqLyB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hZGp1c3RUcmVlVmlldyhvbGRQYXRoOiBzdHJpbmcsIG5ld1BhdGg6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IG5ld1BhdGhzID0gdGhpcy5fcGF0aHMuc2xpY2UoKTtcclxuICAgICAgICBuZXdQYXRocy5zcGxpY2UoZmluZEluZGV4KHRoaXMuX3BhdGhzLCBvbGRQYXRoKSwgMSwgbmV3UGF0aCk7XHJcbiAgICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKDxhbnk+bmV3UGF0aHMpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2dldFByb2plY3REaXJlY3Rvcmllcyhwcm9qZWN0czogUHJvamVjdFZpZXdNb2RlbDxhbnk+W10pIHtcclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tPHN0cmluZz4odW5pcShwcm9qZWN0cy5tYXAoeiA9PiB6LnBhdGgpKSlcclxuICAgICAgICAgICAgLmZsYXRNYXAocHJvamVjdCA9PiBzdGF0KHByb2plY3QpLCAocHJvamVjdCwgc3QpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChzdC5pc0RpcmVjdG9yeSgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb2plY3Q7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkaXJuYW1lKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAudG9BcnJheSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2hhbmRsZVByb2plY3RBZGRlZChwcm9qZWN0czogUHJvamVjdFZpZXdNb2RlbDxhbnk+W10pIHtcclxuICAgICAgICB0aGlzLl9nZXRQcm9qZWN0RGlyZWN0b3JpZXMocHJvamVjdHMpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocGF0aHMgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5hZGRQYXRoKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fbmFnQWRkRXh0ZXJuYWxQcm9qZWN0cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKGBBZGQgZXh0ZXJuYWwgcHJvamVjdHM/YCwgPGFueT57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogcGF0aHMuam9pbignXFxuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgV2UgaGF2ZSBkZXRlY3RlZCBleHRlcm5hbCBwcm9qZWN0cyB3b3VsZCB5b3UgbGlrZSB0byBhZGQgdGhlbSB0byB0aGUgdHJlZXZpZXc/YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdPa2F5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdidG4tc3VjY2VzcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcGF0aHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5hZGRQYXRoKHByb2plY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnRGlzbWlzcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaGFuZGxlUHJvamVjdFJlbW92ZWQocHJvamVjdHM6IFByb2plY3RWaWV3TW9kZWw8YW55PltdKSB7XHJcbiAgICAgICAgdGhpcy5fZ2V0UHJvamVjdERpcmVjdG9yaWVzKHByb2plY3RzKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHBhdGhzID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvamVjdCBvZiBwYXRocykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdG9tLnByb2plY3QucmVtb3ZlUGF0aChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhgUmVtb3ZlIGV4dGVybmFsIHByb2plY3RzP2AsIDxhbnk+e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IHBhdGhzLmpvaW4oJ1xcbicpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYFdlIGhhdmUgZGV0ZWN0ZWQgZXh0ZXJuYWwgcHJvamVjdHMgaGF2ZSBiZWVuIHJlbW92ZWQsIHdvdWxkIHlvdSBsaWtlIHRvIHJlbW92ZSB0aGVtIGZyb20gdGhlIHRyZWV2aWV3P2AsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnT2theScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiAnYnRuLXN1Y2Nlc3MnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdG9tLnByb2plY3QucmVtb3ZlUGF0aChwcm9qZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnRGlzbWlzcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpleHBvcnQtbmFtZVxyXG5leHBvcnQgY29uc3QgdXBkYXRlUHJvamVjdCA9IG5ldyBVcGRhdGVQcm9qZWN0KCk7XHJcbiJdfQ==
