"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SolutionManager = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _solution2 = require("./solution");

var _atomProjects = require("./atom-projects");

var _compositeSolution = require("./composite-solution");

var _genericListView = require("../views/generic-list-view");

var _omnisharpTextEditor = require("./omnisharp-text-editor");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SOLUTION_LOAD_TIME = 30000;
var openSelectList = void 0;

var SolutionInstanceManager = function () {
    function SolutionInstanceManager() {
        _classCallCheck(this, SolutionInstanceManager);

        this._unitTestMode_ = false;
        this._kick_in_the_pants_ = false;
        this._configurations = new Set();
        this._solutions = new Map();
        this._solutionProjects = new Map();
        this._temporarySolutions = new WeakMap();
        this._disposableSolutionMap = new WeakMap();
        this._findSolutionCache = new Map();
        this._candidateFinderCache = new Set();
        this._activated = false;
        this._nextIndex = 0;
        this._specialCaseExtensions = [".csx"];
        this._activeSolutions = [];
        this._observation = new _compositeSolution.SolutionObserver();
        this._combination = new _compositeSolution.SolutionAggregateObserver();
        this._activeSolution = new _rxjs.BehaviorSubject(null);
        this._activeSolutionObserable = this._activeSolution.distinctUntilChanged().filter(function (z) {
            return !!z;
        }).publishReplay(1).refCount();
        this._activatedSubject = new _rxjs.Subject();
    }

    _createClass(SolutionInstanceManager, [{
        key: "activate",
        value: function activate(activeEditor) {
            var _this = this;

            if (this._activated) return;
            this._disposable = new _omnisharpClient.CompositeDisposable();
            this._solutionDisposable = new _omnisharpClient.CompositeDisposable();
            this._atomProjects = new _atomProjects.AtomProjectTracker();
            this._disposable.add(this._atomProjects);
            this._activeSearch = Promise.resolve(undefined);
            this._subscribeToAtomProjectTracker();
            this._disposable.add(activeEditor.filter(function (z) {
                return !!z;
            }).flatMap(function (z) {
                return _this.getSolutionForEditor(z);
            }).subscribe(function (x) {
                return _this._activeSolution.next(x);
            }));
            this._atomProjects.activate();
            this._activated = true;
            this.activatedSubject.next(true);
            this._disposable.add(this._solutionDisposable);
        }
    }, {
        key: "connect",
        value: function connect() {
            this._solutions.forEach(function (solution) {
                return solution.connect();
            });
        }
    }, {
        key: "disconnect",
        value: function disconnect() {
            this._solutions.forEach(function (solution) {
                return solution.dispose();
            });
        }
    }, {
        key: "deactivate",
        value: function deactivate() {
            this._activated = false;
            this._disposable.dispose();
            this.disconnect();
            this._solutions.clear();
            this._solutionProjects.clear();
            this._findSolutionCache.clear();
        }
    }, {
        key: "_subscribeToAtomProjectTracker",
        value: function _subscribeToAtomProjectTracker() {
            var _this2 = this;

            this._disposable.add(this._atomProjects.removed.filter(function (z) {
                return _this2._solutions.has(z);
            }).subscribe(function (project) {
                return _this2._removeSolution(project);
            }));
            this._disposable.add(this._atomProjects.added.filter(function (project) {
                return !_this2._solutionProjects.has(project);
            }).map(function (project) {
                return _this2._candidateFinder(project).flatMap(function (candidates) {
                    return _rxjs.Observable.from(candidates).flatMap(function (x) {
                        return _this2._findRepositoryForPath(x.path);
                    }, function (candidate, repo) {
                        return { candidate: candidate, repo: repo };
                    }).toArray().toPromise().then(function (repos) {
                        var newCandidates = _lodash2.default.difference(candidates.map(function (z) {
                            return z.path;
                        }), fromIterator(_this2._solutions.keys())).map(function (z) {
                            return _lodash2.default.find(candidates, { path: z });
                        }).map(function (_ref) {
                            var path = _ref.path;
                            var isProject = _ref.isProject;
                            var originalFile = _ref.originalFile;

                            var found = _lodash2.default.find(repos, function (x) {
                                return x.candidate.path === path;
                            });
                            var repo = found && found.repo;
                            return { path: path, isProject: isProject, repo: repo, originalFile: originalFile };
                        });
                        return addCandidatesInOrder(newCandidates, function (candidate, repo, isProject, originalFile) {
                            return _this2._addSolution(candidate, repo, isProject, { originalFile: originalFile, project: project });
                        });
                    });
                }).toPromise();
            }).subscribe(function (candidateObservable) {
                _this2._activeSearch = _this2._activeSearch.then(function () {
                    return candidateObservable;
                });
            }));
        }
    }, {
        key: "_findRepositoryForPath",
        value: function _findRepositoryForPath(workingPath) {
            return _rxjs.Observable.from(atom.project.getRepositories() || []).filter(function (x) {
                return !!x;
            }).map(function (repo) {
                return { repo: repo, directory: repo.getWorkingDirectory() };
            }).filter(function (_ref2) {
                var directory = _ref2.directory;
                return path.normalize(directory) === path.normalize(workingPath);
            }).take(1).map(function (x) {
                return x.repo;
            });
        }
    }, {
        key: "_addSolution",
        value: function _addSolution(candidate, repo, isProject, _ref3) {
            var _this3 = this;

            var _ref3$temporary = _ref3.temporary;
            var temporary = _ref3$temporary === undefined ? false : _ref3$temporary;
            var project = _ref3.project;
            var originalFile = _ref3.originalFile;

            var projectPath = candidate;
            if (_lodash2.default.endsWith(candidate, ".sln")) {
                candidate = path.dirname(candidate);
            }
            var solution = void 0;
            if (this._solutions.has(candidate)) {
                solution = this._solutions.get(candidate);
            } else if (project && this._solutionProjects.has(project)) {
                solution = this._solutionProjects.get(project);
            }
            if (solution && !solution.isDisposed) {
                return _rxjs.Observable.of(solution);
            } else if (solution && solution.isDisposed) {
                var disposer = this._disposableSolutionMap.get(solution);
                disposer.dispose();
            }
            solution = new _solution2.Solution({
                projectPath: projectPath,
                index: ++this._nextIndex,
                temporary: temporary,
                repository: repo,
                runtime: _lodash2.default.endsWith(originalFile, ".csx") ? _omnisharpClient.Runtime.ClrOrMono : _omnisharpClient.Runtime.CoreClr
            });
            if (!isProject) {
                solution.isFolderPerFile = true;
            }
            var cd = new _omnisharpClient.CompositeDisposable();
            this._solutionDisposable.add(solution);
            solution.disposable.add(cd);
            this._disposableSolutionMap.set(solution, cd);
            solution.disposable.add(_omnisharpClient.Disposable.create(function () {
                solution.connect = function () {
                    return _this3._addSolution(candidate, repo, isProject, { temporary: temporary, project: project });
                };
            }));
            cd.add(_omnisharpClient.Disposable.create(function () {
                _this3._solutionDisposable.remove(cd);
                _lodash2.default.pull(_this3._activeSolutions, solution);
                _this3._solutions.delete(candidate);
                if (_this3._temporarySolutions.has(solution)) {
                    _this3._temporarySolutions.delete(solution);
                }
                if (_this3._activeSolution.getValue() === solution) {
                    _this3._activeSolution.next(_this3._activeSolutions.length ? _this3._activeSolutions[0] : null);
                }
            }));
            this._configurations.forEach(function (config) {
                return config(solution);
            });
            this._solutions.set(candidate, solution);
            cd.add(this._observation.add(solution));
            cd.add(this._combination.add(solution));
            if (temporary) {
                var tempD = _omnisharpClient.Disposable.create(function () {});
                tempD.dispose();
                this._temporarySolutions.set(solution, new _omnisharpClient.RefCountDisposable(tempD));
            }
            this._activeSolutions.push(solution);
            if (this._activeSolutions.length === 1) this._activeSolution.next(solution);
            var result = this._addSolutionSubscriptions(solution, cd);
            solution.connect();
            return result;
        }
    }, {
        key: "_addSolutionSubscriptions",
        value: function _addSolutionSubscriptions(solution, cd) {
            var _this4 = this;

            var result = new _rxjs.AsyncSubject();
            var errorResult = solution.state.filter(function (z) {
                return z === _omnisharpClient.DriverState.Error;
            }).delay(100).take(1);
            cd.add(errorResult.subscribe(function () {
                return result.complete();
            }));
            cd.add(solution.model.observe.projectAdded.subscribe(function (project) {
                return _this4._solutionProjects.set(project.path, solution);
            }));
            cd.add(solution.model.observe.projectRemoved.subscribe(function (project) {
                return _this4._solutionProjects.delete(project.path);
            }));
            cd.add(solution.model.observe.projects.debounceTime(100).take(1).map(function () {
                return solution;
            }).timeout(SOLUTION_LOAD_TIME, _rxjs.Scheduler.queue).subscribe(function () {
                result.next(solution);
                result.complete();
            }, function () {
                result.complete();
            }));
            return result;
        }
    }, {
        key: "_removeSolution",
        value: function _removeSolution(candidate) {
            if (_lodash2.default.endsWith(candidate, ".sln")) {
                candidate = path.dirname(candidate);
            }
            var solution = this._solutions.get(candidate);
            var refCountDisposable = solution && this._temporarySolutions.has(solution) && this._temporarySolutions.get(solution);
            if (refCountDisposable) {
                refCountDisposable.dispose();
                if (!refCountDisposable.isDisposed) {
                    return;
                }
            }
            if (solution) {
                solution.dispose();
                var disposable = this._disposableSolutionMap.get(solution);
                if (disposable) disposable.dispose();
            }
        }
    }, {
        key: "getSolutionForPath",
        value: function getSolutionForPath(path) {
            if (!path) return _rxjs.Observable.empty();
            var isFolderPerFile = _lodash2.default.some(this.__specialCaseExtensions, function (ext) {
                return _lodash2.default.endsWith(path, ext);
            });
            var location = path;
            if (!location) {
                return _rxjs.Observable.empty();
            }
            var solutionValue = this._getSolutionForUnderlyingPath(location, isFolderPerFile);
            if (solutionValue) return _rxjs.Observable.of(solutionValue);
            return this._findSolutionForUnderlyingPath(location, isFolderPerFile);
        }
    }, {
        key: "getSolutionForEditor",
        value: function getSolutionForEditor(editor) {
            return this._getSolutionForEditor(editor).filter(function () {
                return !editor.isDestroyed();
            });
        }
    }, {
        key: "_setupEditorWithContext",
        value: function _setupEditorWithContext(editor, solution) {
            var _this5 = this;

            var context = new _omnisharpTextEditor.OmnisharpEditorContext(editor, solution);
            var result = editor;
            this._disposable.add(context);
            if (solution && !context.temp && this._temporarySolutions.has(solution)) {
                (function () {
                    var refCountDisposable = _this5._temporarySolutions.get(solution);
                    var disposable = refCountDisposable.getDisposable();
                    context.temp = true;
                    context.solution.disposable.add(editor.onDidDestroy(function () {
                        disposable.dispose();
                        _this5._removeSolution(solution.path);
                    }));
                })();
            }
            return result;
        }
    }, {
        key: "_getSolutionForEditor",
        value: function _getSolutionForEditor(editor) {
            var _this6 = this;

            if (!editor) {
                return _rxjs.Observable.empty();
            }
            var location = editor.getPath();
            if (!location) {
                return _rxjs.Observable.empty();
            }
            if ((0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor)) {
                if (editor.omnisharp.metadata) {
                    return _rxjs.Observable.empty();
                }
                var _solution = editor.omnisharp.solution;
                if (_solution.currentState === _omnisharpClient.DriverState.Disconnected && atom.config.get("omnisharp-atom.autoStartOnCompatibleFile")) _solution.connect();
                if (_solution.currentState === _omnisharpClient.DriverState.Error) {
                    return _rxjs.Observable.empty();
                }
                return _rxjs.Observable.of(_solution);
            }
            var isFolderPerFile = _lodash2.default.some(this.__specialCaseExtensions, function (ext) {
                return _lodash2.default.endsWith(editor.getPath(), ext);
            });
            var solution = this._getSolutionForUnderlyingPath(location, isFolderPerFile);
            if (solution) {
                this._setupEditorWithContext(editor, solution);
                return _rxjs.Observable.of(solution);
            }
            return this._findSolutionForUnderlyingPath(location, isFolderPerFile).do(function (sln) {
                return _this6._setupEditorWithContext(editor, sln);
            });
        }
    }, {
        key: "_isPartOfAnyActiveSolution",
        value: function _isPartOfAnyActiveSolution(location, cb) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this._activeSolutions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var solution = _step.value;

                    if (solution.isFolderPerFile) continue;
                    var paths = solution.model.projects.map(function (z) {
                        return z.path;
                    });
                    var intersect = this._intersectPathMethod(location, paths);
                    if (intersect) {
                        return cb(intersect, solution);
                    }
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
        }
    }, {
        key: "_getSolutionForUnderlyingPath",
        value: function _getSolutionForUnderlyingPath(location, isFolderPerFile) {
            if (location === undefined) {
                return null;
            }
            if (isFolderPerFile) {
                var directory = path.dirname(location);
                if (this._solutions.has(directory)) return this._solutions.get(directory);
                return null;
            } else {
                var intersect = this._intersectPath(location);
                if (intersect) {
                    return this._solutions.get(intersect);
                }
            }
            if (!isFolderPerFile) {
                return this._isPartOfAnyActiveSolution(location, function (intersect, solution) {
                    return solution;
                });
            }
            return null;
        }
    }, {
        key: "_findSolutionForUnderlyingPath",
        value: function _findSolutionForUnderlyingPath(location, isFolderPerFile) {
            var _this7 = this;

            var directory = path.dirname(location);
            if (!this._activated) {
                return this.activatedSubject.take(1).flatMap(function () {
                    return _this7._findSolutionForUnderlyingPath(location, isFolderPerFile);
                });
            }
            var segments = location.split(path.sep);
            var mappedLocations = segments.map(function (loc, index) {
                return _lodash2.default.take(segments, index + 1).join(path.sep);
            });
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = mappedLocations[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var l = _step2.value;

                    if (this._findSolutionCache.has(l)) {
                        return this._findSolutionCache.get(l);
                    }
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

            var subject = new _rxjs.AsyncSubject();
            _lodash2.default.each(mappedLocations, function (l) {
                _this7._findSolutionCache.set(l, subject);
                subject.subscribe({ complete: function complete() {
                        return _this7._findSolutionCache.delete(l);
                    } });
            });
            var project = this._intersectAtomProjectPath(directory);
            var cb = function cb(candidates) {
                if (!_this7._activated) {
                    _lodash2.default.delay(cb, SOLUTION_LOAD_TIME);
                    return;
                }
                if (!isFolderPerFile) {
                    var r = _this7._isPartOfAnyActiveSolution(location, function (intersect, solution) {
                        subject.next(solution);
                        subject.complete();
                        return true;
                    });
                    if (r) return;
                }
                _this7._activeSearch.then(function () {
                    return _rxjs.Observable.from(candidates).flatMap(function (x) {
                        return _this7._findRepositoryForPath(x.path);
                    }, function (candidate, repo) {
                        return { candidate: candidate, repo: repo };
                    }).toArray().toPromise();
                }).then(function (repos) {
                    var newCandidates = _lodash2.default.difference(candidates.map(function (z) {
                        return z.path;
                    }), fromIterator(_this7._solutions.keys())).map(function (z) {
                        return _lodash2.default.find(candidates, { path: z });
                    }).map(function (_ref4) {
                        var path = _ref4.path;
                        var isProject = _ref4.isProject;
                        var originalFile = _ref4.originalFile;

                        var found = _lodash2.default.find(repos, function (x) {
                            return x.candidate.path === path;
                        });
                        var repo = found && found.repo;
                        return { path: path, isProject: isProject, repo: repo, originalFile: originalFile };
                    });
                    addCandidatesInOrder(newCandidates, function (candidate, repo, isProject, originalFile) {
                        return _this7._addSolution(candidate, repo, isProject, { temporary: !project, originalFile: originalFile });
                    }).then(function () {
                        if (!isFolderPerFile) {
                            var _r = _this7._isPartOfAnyActiveSolution(location, function (intersect, solution) {
                                subject.next(solution);
                                subject.complete();
                                return;
                            });
                            if (_r) return;
                        }
                        var intersect = _this7._intersectPath(location) || _this7._intersectAtomProjectPath(location);
                        if (intersect) {
                            if (_this7._solutions.has(intersect)) {
                                subject.next(_this7._solutions.get(intersect));
                            }
                        } else {
                            atom.notifications.addInfo("Could not find a solution for \"" + location + "\"");
                        }
                        subject.complete();
                    });
                });
            };
            this._candidateFinder(directory).subscribe(cb);
            return subject;
        }
    }, {
        key: "_candidateFinder",
        value: function _candidateFinder(directory) {
            var _this8 = this;

            return _omnisharpClient.findCandidates.withCandidates(directory, this.logger, {
                solutionIndependentSourceFilesToSearch: this.__specialCaseExtensions.map(function (z) {
                    return "*" + z;
                })
            }).flatMap(function (candidates) {
                var slns = _lodash2.default.filter(candidates, function (x) {
                    return _lodash2.default.endsWith(x.path, ".sln");
                });
                if (slns.length > 1) {
                    var _ret2 = function () {
                        var items = _lodash2.default.difference(candidates, slns);
                        var asyncResult = new _rxjs.AsyncSubject();
                        asyncResult.next(items);
                        var listView = new _genericListView.GenericSelectListView("", slns.map(function (x) {
                            return { displayName: x.path, name: x.path };
                        }), function (result) {
                            items.unshift.apply(items, _toConsumableArray(slns.filter(function (x) {
                                return x.path === result;
                            })));
                            _lodash2.default.each(candidates, function (x) {
                                _this8._candidateFinderCache.add(x.path);
                            });
                            asyncResult.complete();
                        }, function () {
                            asyncResult.complete();
                        });
                        listView.message.text("Please select a solution to load.");
                        if (openSelectList) {
                            openSelectList.onClosed.subscribe(function () {
                                if (!_lodash2.default.some(slns, function (x) {
                                    return _this8._candidateFinderCache.has(x.path);
                                })) {
                                    _lodash2.default.defer(function () {
                                        return listView.toggle();
                                    });
                                } else {
                                    asyncResult.complete();
                                }
                            });
                        } else {
                            _lodash2.default.defer(function () {
                                return listView.toggle();
                            });
                        }
                        asyncResult.do({ complete: function complete() {
                                return openSelectList = null;
                            } });
                        openSelectList = listView;
                        return {
                            v: asyncResult
                        };
                    }();

                    if ((typeof _ret2 === "undefined" ? "undefined" : _typeof(_ret2)) === "object") return _ret2.v;
                } else {
                    return _rxjs.Observable.of(candidates);
                }
            });
        }
    }, {
        key: "registerConfiguration",
        value: function registerConfiguration(callback) {
            this._configurations.add(callback);
            this._solutions.forEach(function (solution) {
                return callback(solution);
            });
        }
    }, {
        key: "_intersectPathMethod",
        value: function _intersectPathMethod(location, paths) {
            var validSolutionPaths = paths;
            var segments = location.split(path.sep);
            var mappedLocations = segments.map(function (loc, index) {
                return _lodash2.default.take(segments, index + 1).join(path.sep);
            });
            mappedLocations.reverse();
            var intersect = _lodash2.default.intersection(mappedLocations, validSolutionPaths)[0];
            if (intersect) {
                return intersect;
            }
        }
    }, {
        key: "_intersectPath",
        value: function _intersectPath(location) {
            return this._intersectPathMethod(location, fromIterator(this._solutions.entries()).filter(function (z) {
                return !z[1].isFolderPerFile;
            }).map(function (z) {
                return z[0];
            }));
        }
    }, {
        key: "_intersectAtomProjectPath",
        value: function _intersectAtomProjectPath(location) {
            return this._intersectPathMethod(location, this._atomProjects.paths);
        }
    }, {
        key: "logger",
        get: function get() {
            if (this._unitTestMode_ || this._kick_in_the_pants_) {
                return {
                    log: function log() {},
                    error: function error() {}
                };
            }
            return console;
        }
    }, {
        key: "__specialCaseExtensions",
        get: function get() {
            return this._specialCaseExtensions;
        }
    }, {
        key: "activeSolutions",
        get: function get() {
            return this._activeSolutions;
        }
    }, {
        key: "solutionObserver",
        get: function get() {
            return this._observation;
        }
    }, {
        key: "solutionAggregateObserver",
        get: function get() {
            return this._combination;
        }
    }, {
        key: "activeSolution",
        get: function get() {
            return this._activeSolutionObserable;
        }
    }, {
        key: "activatedSubject",
        get: function get() {
            return this._activatedSubject;
        }
    }, {
        key: "connected",
        get: function get() {
            var iterator = this._solutions.values();
            var result = iterator.next();
            while (!result.done) {
                if (result.value.currentState === _omnisharpClient.DriverState.Connected) return true;
            }return false;
        }
    }]);

    return SolutionInstanceManager;
}();

function addCandidatesInOrder(candidates, cb) {
    var asyncSubject = new _rxjs.AsyncSubject();
    if (!candidates.length) {
        asyncSubject.next(candidates);
        asyncSubject.complete();
        return asyncSubject.toPromise();
    }
    var cds = candidates.slice();
    var candidate = cds.shift();
    var handleCandidate = function handleCandidate(cand) {
        cb(cand.path, cand.repo, cand.isProject, cand.originalFile).subscribe({
            complete: function complete() {
                if (cds.length) {
                    cand = cds.shift();
                    handleCandidate(cand);
                } else {
                    asyncSubject.next(candidates);
                    asyncSubject.complete();
                }
            }
        });
    };
    handleCandidate(candidate);
    return asyncSubject.toPromise();
}
function fromIterator(iterator) {
    var items = [];
    var result = iterator.next();
    while (!result.done) {
        items.push(result.value);
        result = iterator.next();
    }
    return items;
}
var SolutionManager = exports.SolutionManager = new SolutionInstanceManager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci5qcyIsImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0lDQVksSTs7QURDWjs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7Ozs7Ozs7OztBQ0dBLElBQU0scUJBQXFCLEtBQTNCO0FBRUEsSUFBSSx1QkFBSjs7SUFDQSx1QjtBQUFBLHVDQUFBO0FBQUE7O0FBRVcsYUFBQSxjQUFBLEdBQWlCLEtBQWpCO0FBQ0EsYUFBQSxtQkFBQSxHQUFzQixLQUF0QjtBQWlCQyxhQUFBLGVBQUEsR0FBa0IsSUFBSSxHQUFKLEVBQWxCO0FBQ0EsYUFBQSxVQUFBLEdBQWEsSUFBSSxHQUFKLEVBQWI7QUFDQSxhQUFBLGlCQUFBLEdBQW9CLElBQUksR0FBSixFQUFwQjtBQUNBLGFBQUEsbUJBQUEsR0FBc0IsSUFBSSxPQUFKLEVBQXRCO0FBQ0EsYUFBQSxzQkFBQSxHQUF5QixJQUFJLE9BQUosRUFBekI7QUFDQSxhQUFBLGtCQUFBLEdBQXFCLElBQUksR0FBSixFQUFyQjtBQUNBLGFBQUEscUJBQUEsR0FBd0IsSUFBSSxHQUFKLEVBQXhCO0FBRUEsYUFBQSxVQUFBLEdBQWEsS0FBYjtBQUNBLGFBQUEsVUFBQSxHQUFhLENBQWI7QUFJQSxhQUFBLHNCQUFBLEdBQXlCLENBQUMsTUFBRCxDQUF6QjtBQUdBLGFBQUEsZ0JBQUEsR0FBK0IsRUFBL0I7QUFNQSxhQUFBLFlBQUEsR0FBZSx5Q0FBZjtBQU1BLGFBQUEsWUFBQSxHQUFlLGtEQUFmO0FBS0EsYUFBQSxlQUFBLEdBQWtCLDBCQUE4QixJQUE5QixDQUFsQjtBQUNBLGFBQUEsd0JBQUEsR0FBMkIsS0FBSyxlQUFMLENBQXFCLG9CQUFyQixHQUE0QyxNQUE1QyxDQUFtRDtBQUFBLG1CQUFLLENBQUMsQ0FBQyxDQUFQO0FBQUEsU0FBbkQsRUFBNkQsYUFBN0Qs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YUFBYSxTQUFiLEVBQVA7QUFDSDtBQUVELFNBQUEsWUFBQSxDQUF5QixRQUF6QixFQUFzRDtBQUNsRCxRQUFNLFFBQWEsRUFBbkI7QUFDQSxRQUFJLFNBQVMsU0FBUyxJQUFULEVBQWI7QUFDQSxXQUFPLENBQUMsT0FBTyxJQUFmLEVBQXFCO0FBQ2pCLGNBQU0sSUFBTixDQUFXLE9BQU8sS0FBbEI7QUFFQSxpQkFBUyxTQUFTLElBQVQsRUFBVDtBQUNIO0FBRUQsV0FBTyxLQUFQO0FBQ0g7QUFHTSxJQUFNLDRDQUFrQixJQUFJLHVCQUFKLEVBQXhCIiwiZmlsZSI6ImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIEFzeW5jU3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0LCBTY2hlZHVsZXIsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgUmVmQ291bnREaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IFNvbHV0aW9uIH0gZnJvbSBcIi4vc29sdXRpb25cIjtcbmltcG9ydCB7IEF0b21Qcm9qZWN0VHJhY2tlciB9IGZyb20gXCIuL2F0b20tcHJvamVjdHNcIjtcbmltcG9ydCB7IFNvbHV0aW9uT2JzZXJ2ZXIsIFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIgfSBmcm9tIFwiLi9jb21wb3NpdGUtc29sdXRpb25cIjtcbmltcG9ydCB7IERyaXZlclN0YXRlLCBmaW5kQ2FuZGlkYXRlcywgUnVudGltZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBHZW5lcmljU2VsZWN0TGlzdFZpZXcgfSBmcm9tIFwiLi4vdmlld3MvZ2VuZXJpYy1saXN0LXZpZXdcIjtcbmltcG9ydCB7IGlzT21uaXNoYXJwVGV4dEVkaXRvciwgT21uaXNoYXJwRWRpdG9yQ29udGV4dCB9IGZyb20gXCIuL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xuY29uc3QgU09MVVRJT05fTE9BRF9USU1FID0gMzAwMDA7XG5sZXQgb3BlblNlbGVjdExpc3Q7XG5jbGFzcyBTb2x1dGlvbkluc3RhbmNlTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX3VuaXRUZXN0TW9kZV8gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fa2lja19pbl90aGVfcGFudHNfID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyYXRpb25zID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uUHJvamVjdHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucyA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcCA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9jYW5kaWRhdGVGaW5kZXJDYWNoZSA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX25leHRJbmRleCA9IDA7XG4gICAgICAgIHRoaXMuX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucyA9IFtcIi5jc3hcIixdO1xuICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fb2JzZXJ2YXRpb24gPSBuZXcgU29sdXRpb25PYnNlcnZlcigpO1xuICAgICAgICB0aGlzLl9jb21iaW5hdGlvbiA9IG5ldyBTb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyKCk7XG4gICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uID0gbmV3IEJlaGF2aW9yU3ViamVjdChudWxsKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb25PYnNlcmFibGUgPSB0aGlzLl9hY3RpdmVTb2x1dGlvbi5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpLmZpbHRlcih6ID0+ICEheikucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZWRTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICB9XG4gICAgZ2V0IGxvZ2dlcigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3VuaXRUZXN0TW9kZV8gfHwgdGhpcy5fa2lja19pbl90aGVfcGFudHNfKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGxvZzogKCkgPT4geyB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiAoKSA9PiB7IH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbnNvbGU7XG4gICAgfVxuICAgIGdldCBfX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucygpIHsgcmV0dXJuIHRoaXMuX3NwZWNpYWxDYXNlRXh0ZW5zaW9uczsgfVxuICAgIGdldCBhY3RpdmVTb2x1dGlvbnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVTb2x1dGlvbnM7XG4gICAgfVxuICAgIGdldCBzb2x1dGlvbk9ic2VydmVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fb2JzZXJ2YXRpb247XG4gICAgfVxuICAgIGdldCBzb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29tYmluYXRpb247XG4gICAgfVxuICAgIGdldCBhY3RpdmVTb2x1dGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNvbHV0aW9uT2JzZXJhYmxlO1xuICAgIH1cbiAgICBnZXQgYWN0aXZhdGVkU3ViamVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2YXRlZFN1YmplY3Q7XG4gICAgfVxuICAgIGFjdGl2YXRlKGFjdGl2ZUVkaXRvcikge1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZhdGVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fYXRvbVByb2plY3RzID0gbmV3IEF0b21Qcm9qZWN0VHJhY2tlcigpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMpO1xuICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2ggPSBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgdGhpcy5fc3Vic2NyaWJlVG9BdG9tUHJvamVjdFRyYWNrZXIoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYWN0aXZlRWRpdG9yXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxuICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB0aGlzLmdldFNvbHV0aW9uRm9yRWRpdG9yKHopKVxuICAgICAgICAgICAgLnN1YnNjcmliZSh4ID0+IHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQoeCkpKTtcbiAgICAgICAgdGhpcy5fYXRvbVByb2plY3RzLmFjdGl2YXRlKCk7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuYWN0aXZhdGVkU3ViamVjdC5uZXh0KHRydWUpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUpO1xuICAgIH1cbiAgICBjb25uZWN0KCkge1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBzb2x1dGlvbi5jb25uZWN0KCkpO1xuICAgIH1cbiAgICBkaXNjb25uZWN0KCkge1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBzb2x1dGlvbi5kaXNwb3NlKCkpO1xuICAgIH1cbiAgICBkZWFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5jbGVhcigpO1xuICAgIH1cbiAgICBnZXQgY29ubmVjdGVkKCkge1xuICAgICAgICBjb25zdCBpdGVyYXRvciA9IHRoaXMuX3NvbHV0aW9ucy52YWx1ZXMoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICB3aGlsZSAoIXJlc3VsdC5kb25lKVxuICAgICAgICAgICAgaWYgKHJlc3VsdC52YWx1ZS5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBfc3Vic2NyaWJlVG9BdG9tUHJvamVjdFRyYWNrZXIoKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX2F0b21Qcm9qZWN0cy5yZW1vdmVkXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gdGhpcy5fc29sdXRpb25zLmhhcyh6KSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLl9yZW1vdmVTb2x1dGlvbihwcm9qZWN0KSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMuYWRkZWRcbiAgICAgICAgICAgIC5maWx0ZXIocHJvamVjdCA9PiAhdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5oYXMocHJvamVjdCkpXG4gICAgICAgICAgICAubWFwKHByb2plY3QgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhbmRpZGF0ZUZpbmRlcihwcm9qZWN0KVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKGNhbmRpZGF0ZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20oY2FuZGlkYXRlcylcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB0aGlzLl9maW5kUmVwb3NpdG9yeUZvclBhdGgoeC5wYXRoKSwgKGNhbmRpZGF0ZSwgcmVwbykgPT4gKHsgY2FuZGlkYXRlLCByZXBvIH0pKVxuICAgICAgICAgICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihyZXBvcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbmRpZGF0ZXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcy5tYXAoeiA9PiB6LnBhdGgpLCBmcm9tSXRlcmF0b3IodGhpcy5fc29sdXRpb25zLmtleXMoKSkpLm1hcCh6ID0+IF8uZmluZChjYW5kaWRhdGVzLCB7IHBhdGg6IHogfSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKCh7IHBhdGgsIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHJlcG9zLCB4ID0+IHguY2FuZGlkYXRlLnBhdGggPT09IHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbyA9IGZvdW5kICYmIGZvdW5kLnJlcG87XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBwYXRoLCBpc1Byb2plY3QsIHJlcG8sIG9yaWdpbmFsRmlsZSB9O1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFkZENhbmRpZGF0ZXNJbk9yZGVyKG5ld0NhbmRpZGF0ZXMsIChjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyBvcmlnaW5hbEZpbGUsIHByb2plY3QgfSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkudG9Qcm9taXNlKCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGNhbmRpZGF0ZU9ic2VydmFibGUgPT4ge1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlU2VhcmNoID0gdGhpcy5fYWN0aXZlU2VhcmNoLnRoZW4oKCkgPT4gY2FuZGlkYXRlT2JzZXJ2YWJsZSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgX2ZpbmRSZXBvc2l0b3J5Rm9yUGF0aCh3b3JraW5nUGF0aCkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKSB8fCBbXSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgICAgICAgICAubWFwKHJlcG8gPT4gKHsgcmVwbywgZGlyZWN0b3J5OiByZXBvLmdldFdvcmtpbmdEaXJlY3RvcnkoKSB9KSlcbiAgICAgICAgICAgIC5maWx0ZXIoKHsgZGlyZWN0b3J5IH0pID0+IHBhdGgubm9ybWFsaXplKGRpcmVjdG9yeSkgPT09IHBhdGgubm9ybWFsaXplKHdvcmtpbmdQYXRoKSlcbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAubWFwKHggPT4geC5yZXBvKTtcbiAgICB9XG4gICAgX2FkZFNvbHV0aW9uKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCB7IHRlbXBvcmFyeSA9IGZhbHNlLCBwcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkge1xuICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IGNhbmRpZGF0ZTtcbiAgICAgICAgaWYgKF8uZW5kc1dpdGgoY2FuZGlkYXRlLCBcIi5zbG5cIikpIHtcbiAgICAgICAgICAgIGNhbmRpZGF0ZSA9IHBhdGguZGlybmFtZShjYW5kaWRhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzb2x1dGlvbjtcbiAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoY2FuZGlkYXRlKSkge1xuICAgICAgICAgICAgc29sdXRpb24gPSB0aGlzLl9zb2x1dGlvbnMuZ2V0KGNhbmRpZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJvamVjdCAmJiB0aGlzLl9zb2x1dGlvblByb2plY3RzLmhhcyhwcm9qZWN0KSkge1xuICAgICAgICAgICAgc29sdXRpb24gPSB0aGlzLl9zb2x1dGlvblByb2plY3RzLmdldChwcm9qZWN0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc29sdXRpb24gJiYgIXNvbHV0aW9uLmlzRGlzcG9zZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzb2x1dGlvbiAmJiBzb2x1dGlvbi5pc0Rpc3Bvc2VkKSB7XG4gICAgICAgICAgICBjb25zdCBkaXNwb3NlciA9IHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcC5nZXQoc29sdXRpb24pO1xuICAgICAgICAgICAgZGlzcG9zZXIuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHNvbHV0aW9uID0gbmV3IFNvbHV0aW9uKHtcbiAgICAgICAgICAgIHByb2plY3RQYXRoOiBwcm9qZWN0UGF0aCxcbiAgICAgICAgICAgIGluZGV4OiArK3RoaXMuX25leHRJbmRleCxcbiAgICAgICAgICAgIHRlbXBvcmFyeTogdGVtcG9yYXJ5LFxuICAgICAgICAgICAgcmVwb3NpdG9yeTogcmVwbyxcbiAgICAgICAgICAgIHJ1bnRpbWU6IF8uZW5kc1dpdGgob3JpZ2luYWxGaWxlLCBcIi5jc3hcIikgPyBSdW50aW1lLkNsck9yTW9ubyA6IFJ1bnRpbWUuQ29yZUNsclxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFpc1Byb2plY3QpIHtcbiAgICAgICAgICAgIHNvbHV0aW9uLmlzRm9sZGVyUGVyRmlsZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHNvbHV0aW9uKTtcbiAgICAgICAgc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoY2QpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuc2V0KHNvbHV0aW9uLCBjZCk7XG4gICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHNvbHV0aW9uLmNvbm5lY3QgPSAoKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3JhcnksIHByb2plY3QgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgXy5wdWxsKHRoaXMuX2FjdGl2ZVNvbHV0aW9ucywgc29sdXRpb24pO1xuICAgICAgICAgICAgdGhpcy5fc29sdXRpb25zLmRlbGV0ZShjYW5kaWRhdGUpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5oYXMoc29sdXRpb24pKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmRlbGV0ZShzb2x1dGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fYWN0aXZlU29sdXRpb24uZ2V0VmFsdWUoKSA9PT0gc29sdXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbi5uZXh0KHRoaXMuX2FjdGl2ZVNvbHV0aW9ucy5sZW5ndGggPyB0aGlzLl9hY3RpdmVTb2x1dGlvbnNbMF0gOiBudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9jb25maWd1cmF0aW9ucy5mb3JFYWNoKGNvbmZpZyA9PiBjb25maWcoc29sdXRpb24pKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLnNldChjYW5kaWRhdGUsIHNvbHV0aW9uKTtcbiAgICAgICAgY2QuYWRkKHRoaXMuX29ic2VydmF0aW9uLmFkZChzb2x1dGlvbikpO1xuICAgICAgICBjZC5hZGQodGhpcy5fY29tYmluYXRpb24uYWRkKHNvbHV0aW9uKSk7XG4gICAgICAgIGlmICh0ZW1wb3JhcnkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXBEID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4geyB9KTtcbiAgICAgICAgICAgIHRlbXBELmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5zZXQoc29sdXRpb24sIG5ldyBSZWZDb3VudERpc3Bvc2FibGUodGVtcEQpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbnMucHVzaChzb2x1dGlvbik7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID09PSAxKVxuICAgICAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb24ubmV4dChzb2x1dGlvbik7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2FkZFNvbHV0aW9uU3Vic2NyaXB0aW9ucyhzb2x1dGlvbiwgY2QpO1xuICAgICAgICBzb2x1dGlvbi5jb25uZWN0KCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIF9hZGRTb2x1dGlvblN1YnNjcmlwdGlvbnMoc29sdXRpb24sIGNkKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgY29uc3QgZXJyb3JSZXN1bHQgPSBzb2x1dGlvbi5zdGF0ZVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkVycm9yKVxuICAgICAgICAgICAgLmRlbGF5KDEwMClcbiAgICAgICAgICAgIC50YWtlKDEpO1xuICAgICAgICBjZC5hZGQoZXJyb3JSZXN1bHQuc3Vic2NyaWJlKCgpID0+IHJlc3VsdC5jb21wbGV0ZSgpKSk7XG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RBZGRlZC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLl9zb2x1dGlvblByb2plY3RzLnNldChwcm9qZWN0LnBhdGgsIHNvbHV0aW9uKSkpO1xuICAgICAgICBjZC5hZGQoc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0UmVtb3ZlZC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLl9zb2x1dGlvblByb2plY3RzLmRlbGV0ZShwcm9qZWN0LnBhdGgpKSk7XG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RzXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMClcbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAubWFwKCgpID0+IHNvbHV0aW9uKVxuICAgICAgICAgICAgLnRpbWVvdXQoU09MVVRJT05fTE9BRF9USU1FLCBTY2hlZHVsZXIucXVldWUpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdC5uZXh0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgIHJlc3VsdC5jb21wbGV0ZSgpO1xuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICByZXN1bHQuY29tcGxldGUoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBfcmVtb3ZlU29sdXRpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgIGlmIChfLmVuZHNXaXRoKGNhbmRpZGF0ZSwgXCIuc2xuXCIpKSB7XG4gICAgICAgICAgICBjYW5kaWRhdGUgPSBwYXRoLmRpcm5hbWUoY2FuZGlkYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9ucy5nZXQoY2FuZGlkYXRlKTtcbiAgICAgICAgY29uc3QgcmVmQ291bnREaXNwb3NhYmxlID0gc29sdXRpb24gJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikgJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmdldChzb2x1dGlvbik7XG4gICAgICAgIGlmIChyZWZDb3VudERpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgIHJlZkNvdW50RGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICBpZiAoIXJlZkNvdW50RGlzcG9zYWJsZS5pc0Rpc3Bvc2VkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzb2x1dGlvbikge1xuICAgICAgICAgICAgc29sdXRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcC5nZXQoc29sdXRpb24pO1xuICAgICAgICAgICAgaWYgKGRpc3Bvc2FibGUpXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0U29sdXRpb25Gb3JQYXRoKHBhdGgpIHtcbiAgICAgICAgaWYgKCFwYXRoKVxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgY29uc3QgaXNGb2xkZXJQZXJGaWxlID0gXy5zb21lKHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKHBhdGgsIGV4dCkpO1xuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IHBhdGg7XG4gICAgICAgIGlmICghbG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc29sdXRpb25WYWx1ZSA9IHRoaXMuX2dldFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSk7XG4gICAgICAgIGlmIChzb2x1dGlvblZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoc29sdXRpb25WYWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcbiAgICB9XG4gICAgZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpLmZpbHRlcigoKSA9PiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpO1xuICAgIH1cbiAgICBfc2V0dXBFZGl0b3JXaXRoQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKSB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgT21uaXNoYXJwRWRpdG9yQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZWRpdG9yO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChjb250ZXh0KTtcbiAgICAgICAgaWYgKHNvbHV0aW9uICYmICFjb250ZXh0LnRlbXAgJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZkNvdW50RGlzcG9zYWJsZSA9IHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5nZXQoc29sdXRpb24pO1xuICAgICAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHJlZkNvdW50RGlzcG9zYWJsZS5nZXREaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBjb250ZXh0LnRlbXAgPSB0cnVlO1xuICAgICAgICAgICAgY29udGV4dC5zb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVTb2x1dGlvbihzb2x1dGlvbi5wYXRoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBfZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKSB7XG4gICAgICAgIGlmICghZWRpdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gZWRpdG9yLmdldFBhdGgoKTtcbiAgICAgICAgaWYgKCFsb2NhdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcbiAgICAgICAgICAgIGlmIChlZGl0b3Iub21uaXNoYXJwLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uID0gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbjtcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCAmJiBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5hdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlXCIpKVxuICAgICAgICAgICAgICAgIHNvbHV0aW9uLmNvbm5lY3QoKTtcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpc0ZvbGRlclBlckZpbGUgPSBfLnNvbWUodGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSk7XG4gICAgICAgIGNvbnN0IHNvbHV0aW9uID0gdGhpcy5fZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcbiAgICAgICAgaWYgKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoc29sdXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKVxuICAgICAgICAgICAgLmRvKChzbG4pID0+IHRoaXMuX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yLCBzbG4pKTtcbiAgICB9XG4gICAgX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIGNiKSB7XG4gICAgICAgIGZvciAoY29uc3Qgc29sdXRpb24gb2YgdGhpcy5fYWN0aXZlU29sdXRpb25zKSB7XG4gICAgICAgICAgICBpZiAoc29sdXRpb24uaXNGb2xkZXJQZXJGaWxlKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3QgcGF0aHMgPSBzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cy5tYXAoeiA9PiB6LnBhdGgpO1xuICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgcGF0aHMpO1xuICAgICAgICAgICAgaWYgKGludGVyc2VjdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYihpbnRlcnNlY3QsIHNvbHV0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBfZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgIGlmIChsb2NhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgICAgICBjb25zdCBkaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUobG9jYXRpb24pO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoZGlyZWN0b3J5KSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29sdXRpb25zLmdldChkaXJlY3RvcnkpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uKTtcbiAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29sdXRpb25zLmdldChpbnRlcnNlY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgKGludGVyc2VjdCwgc29sdXRpb24pID0+IHNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgX2ZpbmRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lKGxvY2F0aW9uKTtcbiAgICAgICAgaWYgKCF0aGlzLl9hY3RpdmF0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGl2YXRlZFN1YmplY3QudGFrZSgxKVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IHRoaXMuX2ZpbmRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGxvY2F0aW9uLnNwbGl0KHBhdGguc2VwKTtcbiAgICAgICAgY29uc3QgbWFwcGVkTG9jYXRpb25zID0gc2VnbWVudHMubWFwKChsb2MsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gXy50YWtlKHNlZ21lbnRzLCBpbmRleCArIDEpLmpvaW4ocGF0aC5zZXApO1xuICAgICAgICB9KTtcbiAgICAgICAgZm9yIChsZXQgbCBvZiBtYXBwZWRMb2NhdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9maW5kU29sdXRpb25DYWNoZS5oYXMobCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuZ2V0KGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgICAgIF8uZWFjaChtYXBwZWRMb2NhdGlvbnMsIGwgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuc2V0KGwsIHN1YmplY3QpO1xuICAgICAgICAgICAgc3ViamVjdC5zdWJzY3JpYmUoeyBjb21wbGV0ZTogKCkgPT4gdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuZGVsZXRlKGwpIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgcHJvamVjdCA9IHRoaXMuX2ludGVyc2VjdEF0b21Qcm9qZWN0UGF0aChkaXJlY3RvcnkpO1xuICAgICAgICBjb25zdCBjYiA9IChjYW5kaWRhdGVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2FjdGl2YXRlZCkge1xuICAgICAgICAgICAgICAgIF8uZGVsYXkoY2IsIFNPTFVUSU9OX0xPQURfVElNRSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByID0gdGhpcy5faXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgKGludGVyc2VjdCwgc29sdXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAocilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fYWN0aXZlU2VhcmNoLnRoZW4oKCkgPT4gT2JzZXJ2YWJsZS5mcm9tKGNhbmRpZGF0ZXMpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB0aGlzLl9maW5kUmVwb3NpdG9yeUZvclBhdGgoeC5wYXRoKSwgKGNhbmRpZGF0ZSwgcmVwbykgPT4gKHsgY2FuZGlkYXRlLCByZXBvIH0pKVxuICAgICAgICAgICAgICAgIC50b0FycmF5KClcbiAgICAgICAgICAgICAgICAudG9Qcm9taXNlKCkpXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVwb3MgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbmRpZGF0ZXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcy5tYXAoeiA9PiB6LnBhdGgpLCBmcm9tSXRlcmF0b3IodGhpcy5fc29sdXRpb25zLmtleXMoKSkpLm1hcCh6ID0+IF8uZmluZChjYW5kaWRhdGVzLCB7IHBhdGg6IHogfSkpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKHsgcGF0aCwgaXNQcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IF8uZmluZChyZXBvcywgeCA9PiB4LmNhbmRpZGF0ZS5wYXRoID09PSBwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbyA9IGZvdW5kICYmIGZvdW5kLnJlcG87XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHBhdGgsIGlzUHJvamVjdCwgcmVwbywgb3JpZ2luYWxGaWxlIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYWRkQ2FuZGlkYXRlc0luT3JkZXIobmV3Q2FuZGlkYXRlcywgKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCBvcmlnaW5hbEZpbGUpID0+IHRoaXMuX2FkZFNvbHV0aW9uKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCB7IHRlbXBvcmFyeTogIXByb2plY3QsIG9yaWdpbmFsRmlsZSB9KSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgciA9IHRoaXMuX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIChpbnRlcnNlY3QsIHNvbHV0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gdGhpcy5faW50ZXJzZWN0UGF0aChsb2NhdGlvbikgfHwgdGhpcy5faW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyc2VjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoaW50ZXJzZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dCh0aGlzLl9zb2x1dGlvbnMuZ2V0KGludGVyc2VjdCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYENvdWxkIG5vdCBmaW5kIGEgc29sdXRpb24gZm9yIFwiJHtsb2NhdGlvbn1cImApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9jYW5kaWRhdGVGaW5kZXIoZGlyZWN0b3J5KS5zdWJzY3JpYmUoY2IpO1xuICAgICAgICByZXR1cm4gc3ViamVjdDtcbiAgICB9XG4gICAgX2NhbmRpZGF0ZUZpbmRlcihkaXJlY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIGZpbmRDYW5kaWRhdGVzLndpdGhDYW5kaWRhdGVzKGRpcmVjdG9yeSwgdGhpcy5sb2dnZXIsIHtcbiAgICAgICAgICAgIHNvbHV0aW9uSW5kZXBlbmRlbnRTb3VyY2VGaWxlc1RvU2VhcmNoOiB0aGlzLl9fc3BlY2lhbENhc2VFeHRlbnNpb25zLm1hcCh6ID0+IFwiKlwiICsgeilcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5mbGF0TWFwKGNhbmRpZGF0ZXMgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc2xucyA9IF8uZmlsdGVyKGNhbmRpZGF0ZXMsIHggPT4gXy5lbmRzV2l0aCh4LnBhdGgsIFwiLnNsblwiKSk7XG4gICAgICAgICAgICBpZiAoc2xucy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcywgc2xucyk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXN5bmNSZXN1bHQgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQubmV4dChpdGVtcyk7XG4gICAgICAgICAgICAgICAgY29uc3QgbGlzdFZpZXcgPSBuZXcgR2VuZXJpY1NlbGVjdExpc3RWaWV3KFwiXCIsIHNsbnMubWFwKHggPT4gKHsgZGlzcGxheU5hbWU6IHgucGF0aCwgbmFtZTogeC5wYXRoIH0pKSwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpdGVtcy51bnNoaWZ0KC4uLnNsbnMuZmlsdGVyKHggPT4geC5wYXRoID09PSByZXN1bHQpKTtcbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoKGNhbmRpZGF0ZXMsIHggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FuZGlkYXRlRmluZGVyQ2FjaGUuYWRkKHgucGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBsaXN0Vmlldy5tZXNzYWdlLnRleHQoXCJQbGVhc2Ugc2VsZWN0IGEgc29sdXRpb24gdG8gbG9hZC5cIik7XG4gICAgICAgICAgICAgICAgaWYgKG9wZW5TZWxlY3RMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5TZWxlY3RMaXN0Lm9uQ2xvc2VkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV8uc29tZShzbG5zLCB4ID0+IHRoaXMuX2NhbmRpZGF0ZUZpbmRlckNhY2hlLmhhcyh4LnBhdGgpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uZGVmZXIoKCkgPT4gbGlzdFZpZXcudG9nZ2xlKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfLmRlZmVyKCgpID0+IGxpc3RWaWV3LnRvZ2dsZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuZG8oeyBjb21wbGV0ZTogKCkgPT4gb3BlblNlbGVjdExpc3QgPSBudWxsIH0pO1xuICAgICAgICAgICAgICAgIG9wZW5TZWxlY3RMaXN0ID0gbGlzdFZpZXc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFzeW5jUmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoY2FuZGlkYXRlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZWdpc3RlckNvbmZpZ3VyYXRpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5fY29uZmlndXJhdGlvbnMuYWRkKGNhbGxiYWNrKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLmZvckVhY2goc29sdXRpb24gPT4gY2FsbGJhY2soc29sdXRpb24pKTtcbiAgICB9XG4gICAgX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb24sIHBhdGhzKSB7XG4gICAgICAgIGNvbnN0IHZhbGlkU29sdXRpb25QYXRocyA9IHBhdGhzO1xuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGxvY2F0aW9uLnNwbGl0KHBhdGguc2VwKTtcbiAgICAgICAgY29uc3QgbWFwcGVkTG9jYXRpb25zID0gc2VnbWVudHMubWFwKChsb2MsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gXy50YWtlKHNlZ21lbnRzLCBpbmRleCArIDEpLmpvaW4ocGF0aC5zZXApO1xuICAgICAgICB9KTtcbiAgICAgICAgbWFwcGVkTG9jYXRpb25zLnJldmVyc2UoKTtcbiAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gXy5pbnRlcnNlY3Rpb24obWFwcGVkTG9jYXRpb25zLCB2YWxpZFNvbHV0aW9uUGF0aHMpWzBdO1xuICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gaW50ZXJzZWN0O1xuICAgICAgICB9XG4gICAgfVxuICAgIF9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uLCBmcm9tSXRlcmF0b3IodGhpcy5fc29sdXRpb25zLmVudHJpZXMoKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhelsxXS5pc0ZvbGRlclBlckZpbGUpLm1hcCh6ID0+IHpbMF0pKTtcbiAgICB9XG4gICAgX2ludGVyc2VjdEF0b21Qcm9qZWN0UGF0aChsb2NhdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgdGhpcy5fYXRvbVByb2plY3RzLnBhdGhzKTtcbiAgICB9XG59XG5mdW5jdGlvbiBhZGRDYW5kaWRhdGVzSW5PcmRlcihjYW5kaWRhdGVzLCBjYikge1xuICAgIGNvbnN0IGFzeW5jU3ViamVjdCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICBpZiAoIWNhbmRpZGF0ZXMubGVuZ3RoKSB7XG4gICAgICAgIGFzeW5jU3ViamVjdC5uZXh0KGNhbmRpZGF0ZXMpO1xuICAgICAgICBhc3luY1N1YmplY3QuY29tcGxldGUoKTtcbiAgICAgICAgcmV0dXJuIGFzeW5jU3ViamVjdC50b1Byb21pc2UoKTtcbiAgICB9XG4gICAgY29uc3QgY2RzID0gY2FuZGlkYXRlcy5zbGljZSgpO1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGNkcy5zaGlmdCgpO1xuICAgIGNvbnN0IGhhbmRsZUNhbmRpZGF0ZSA9IChjYW5kKSA9PiB7XG4gICAgICAgIGNiKGNhbmQucGF0aCwgY2FuZC5yZXBvLCBjYW5kLmlzUHJvamVjdCwgY2FuZC5vcmlnaW5hbEZpbGUpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FuZCA9IGNkcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVDYW5kaWRhdGUoY2FuZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhc3luY1N1YmplY3QubmV4dChjYW5kaWRhdGVzKTtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmNTdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGhhbmRsZUNhbmRpZGF0ZShjYW5kaWRhdGUpO1xuICAgIHJldHVybiBhc3luY1N1YmplY3QudG9Qcm9taXNlKCk7XG59XG5mdW5jdGlvbiBmcm9tSXRlcmF0b3IoaXRlcmF0b3IpIHtcbiAgICBjb25zdCBpdGVtcyA9IFtdO1xuICAgIGxldCByZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgd2hpbGUgKCFyZXN1bHQuZG9uZSkge1xuICAgICAgICBpdGVtcy5wdXNoKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgIHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZW1zO1xufVxuZXhwb3J0IGNvbnN0IFNvbHV0aW9uTWFuYWdlciA9IG5ldyBTb2x1dGlvbkluc3RhbmNlTWFuYWdlcigpO1xuIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgQXN5bmNTdWJqZWN0LCBCZWhhdmlvclN1YmplY3QsIFNjaGVkdWxlciwgU3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtSZWZDb3VudERpc3Bvc2FibGUsIElEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge1NvbHV0aW9ufSBmcm9tIFwiLi9zb2x1dGlvblwiO1xyXG5pbXBvcnQge0F0b21Qcm9qZWN0VHJhY2tlcn0gZnJvbSBcIi4vYXRvbS1wcm9qZWN0c1wiO1xyXG5pbXBvcnQge1NvbHV0aW9uT2JzZXJ2ZXIsIFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXJ9IGZyb20gXCIuL2NvbXBvc2l0ZS1zb2x1dGlvblwiO1xyXG5pbXBvcnQge0RyaXZlclN0YXRlLCBmaW5kQ2FuZGlkYXRlcywgUnVudGltZSwgQ2FuZGlkYXRlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge0dlbmVyaWNTZWxlY3RMaXN0Vmlld30gZnJvbSBcIi4uL3ZpZXdzL2dlbmVyaWMtbGlzdC12aWV3XCI7XHJcbmltcG9ydCB7T21uaXNoYXJwVGV4dEVkaXRvciwgaXNPbW5pc2hhcnBUZXh0RWRpdG9yLCBPbW5pc2hhcnBFZGl0b3JDb250ZXh0fSBmcm9tIFwiLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcclxuXHJcbnR5cGUgUkVQT1NJVE9SWSA9IHsgZ2V0V29ya2luZ0RpcmVjdG9yeSgpOiBzdHJpbmc7IH07XHJcbmNvbnN0IFNPTFVUSU9OX0xPQURfVElNRSA9IDMwMDAwO1xyXG5cclxubGV0IG9wZW5TZWxlY3RMaXN0OiBHZW5lcmljU2VsZWN0TGlzdFZpZXc7XHJcbmNsYXNzIFNvbHV0aW9uSW5zdGFuY2VNYW5hZ2VyIHtcclxuICAgIC8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuICAgIHB1YmxpYyBfdW5pdFRlc3RNb2RlXyA9IGZhbHNlO1xyXG4gICAgcHVibGljIF9raWNrX2luX3RoZV9wYW50c18gPSBmYWxzZTtcclxuXHJcbiAgICBwcml2YXRlIGdldCBsb2dnZXIoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3VuaXRUZXN0TW9kZV8gfHwgdGhpcy5fa2lja19pbl90aGVfcGFudHNfKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBsb2c6ICgpID0+IHsvKiAqLyB9LFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6ICgpID0+IHsvKiAqLyB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY29uc29sZTtcclxuICAgIH1cclxuICAgIC8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX3NvbHV0aW9uRGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX2F0b21Qcm9qZWN0czogQXRvbVByb2plY3RUcmFja2VyO1xyXG5cclxuICAgIHByaXZhdGUgX2NvbmZpZ3VyYXRpb25zID0gbmV3IFNldDwoc29sdXRpb246IFNvbHV0aW9uKSA9PiB2b2lkPigpO1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25zID0gbmV3IE1hcDxzdHJpbmcsIFNvbHV0aW9uPigpO1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25Qcm9qZWN0cyA9IG5ldyBNYXA8c3RyaW5nLCBTb2x1dGlvbj4oKTtcclxuICAgIHByaXZhdGUgX3RlbXBvcmFyeVNvbHV0aW9ucyA9IG5ldyBXZWFrTWFwPFNvbHV0aW9uLCBSZWZDb3VudERpc3Bvc2FibGU+KCk7XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlU29sdXRpb25NYXAgPSBuZXcgV2Vha01hcDxTb2x1dGlvbiwgSURpc3Bvc2FibGU+KCk7XHJcbiAgICBwcml2YXRlIF9maW5kU29sdXRpb25DYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBPYnNlcnZhYmxlPFNvbHV0aW9uPj4oKTtcclxuICAgIHByaXZhdGUgX2NhbmRpZGF0ZUZpbmRlckNhY2hlID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcblxyXG4gICAgcHJpdmF0ZSBfYWN0aXZhdGVkID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIF9uZXh0SW5kZXggPSAwO1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZlU2VhcmNoOiBQcm9taXNlPGFueT47XHJcblxyXG4gICAgLy8gVGhlc2UgZXh0ZW5zaW9ucyBvbmx5IHN1cHBvcnQgc2VydmVyIHBlciBmb2xkZXIsIHVubGlrZSBub3JtYWwgY3MgZmlsZXMuXHJcbiAgICBwcml2YXRlIF9zcGVjaWFsQ2FzZUV4dGVuc2lvbnMgPSBbXCIuY3N4XCIsIC8qXCIuY2FrZVwiKi9dO1xyXG4gICAgcHVibGljIGdldCBfX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucygpIHsgcmV0dXJuIHRoaXMuX3NwZWNpYWxDYXNlRXh0ZW5zaW9uczsgfVxyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2ZVNvbHV0aW9uczogU29sdXRpb25bXSA9IFtdO1xyXG4gICAgcHVibGljIGdldCBhY3RpdmVTb2x1dGlvbnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNvbHV0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICAvLyB0aGlzIHNvbHV0aW9uIGNhbiBiZSB1c2VkIHRvIG9ic2VydmUgYmVoYXZpb3IgYWNyb3NzIGFsbCBzb2x1dGlvbi5cclxuICAgIHByaXZhdGUgX29ic2VydmF0aW9uID0gbmV3IFNvbHV0aW9uT2JzZXJ2ZXIoKTtcclxuICAgIHB1YmxpYyBnZXQgc29sdXRpb25PYnNlcnZlcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fb2JzZXJ2YXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdGhpcyBzb2x1dGlvbiBjYW4gYmUgdXNlZCB0byBhZ2dyZWdhdGUgYmVoYXZpb3IgYWNyb3NzIGFsbCBzb2x1dGlvbnNcclxuICAgIHByaXZhdGUgX2NvbWJpbmF0aW9uID0gbmV3IFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIoKTtcclxuICAgIHB1YmxpYyBnZXQgc29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY29tYmluYXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWN0aXZlU29sdXRpb24gPSBuZXcgQmVoYXZpb3JTdWJqZWN0PFNvbHV0aW9uPihudWxsKTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZVNvbHV0aW9uT2JzZXJhYmxlID0gdGhpcy5fYWN0aXZlU29sdXRpb24uZGlzdGluY3RVbnRpbENoYW5nZWQoKS5maWx0ZXIoeiA9PiAhIXopLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlU29sdXRpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNvbHV0aW9uT2JzZXJhYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2YXRlZFN1YmplY3QgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xyXG4gICAgcHJpdmF0ZSBnZXQgYWN0aXZhdGVkU3ViamVjdCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZhdGVkU3ViamVjdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoYWN0aXZlRWRpdG9yOiBPYnNlcnZhYmxlPE9tbmlzaGFycFRleHRFZGl0b3I+KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2YXRlZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuX2F0b21Qcm9qZWN0cyA9IG5ldyBBdG9tUHJvamVjdFRyYWNrZXIoKTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMpO1xyXG5cclxuICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2ggPSBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuXHJcbiAgICAgICAgLy8gbW9uaXRvciBhdG9tIHByb2plY3QgcGF0aHNcclxuICAgICAgICB0aGlzLl9zdWJzY3JpYmVUb0F0b21Qcm9qZWN0VHJhY2tlcigpO1xyXG5cclxuICAgICAgICAvLyBXZSB1c2UgdGhlIGFjdGl2ZSBlZGl0b3Igb24gb21uaXNoYXJwQXRvbSB0b1xyXG4gICAgICAgIC8vIGNyZWF0ZSBhbm90aGVyIG9ic2VydmFibGUgdGhhdCBjaG5hZ2VzIHdoZW4gd2UgZ2V0IGEgbmV3IHNvbHV0aW9uLlxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGFjdGl2ZUVkaXRvclxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxyXG4gICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHRoaXMuZ2V0U29sdXRpb25Gb3JFZGl0b3IoeikpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoeCA9PiB0aGlzLl9hY3RpdmVTb2x1dGlvbi5uZXh0KHgpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2F0b21Qcm9qZWN0cy5hY3RpdmF0ZSgpO1xyXG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5hY3RpdmF0ZWRTdWJqZWN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fc29sdXRpb25EaXNwb3NhYmxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29ubmVjdCgpIHtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBzb2x1dGlvbi5jb25uZWN0KCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNjb25uZWN0KCkge1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5mb3JFYWNoKHNvbHV0aW9uID0+IHNvbHV0aW9uLmRpc3Bvc2UoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuY2xlYXIoKTtcclxuICAgICAgICB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5jbGVhcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgY29ubmVjdGVkKCkge1xyXG4gICAgICAgIGNvbnN0IGl0ZXJhdG9yID0gdGhpcy5fc29sdXRpb25zLnZhbHVlcygpO1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcclxuICAgICAgICB3aGlsZSAoIXJlc3VsdC5kb25lKVxyXG4gICAgICAgICAgICBpZiAocmVzdWx0LnZhbHVlLmN1cnJlbnRTdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3N1YnNjcmliZVRvQXRvbVByb2plY3RUcmFja2VyKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX2F0b21Qcm9qZWN0cy5yZW1vdmVkXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB0aGlzLl9zb2x1dGlvbnMuaGFzKHopKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fcmVtb3ZlU29sdXRpb24ocHJvamVjdCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fYXRvbVByb2plY3RzLmFkZGVkXHJcbiAgICAgICAgICAgIC5maWx0ZXIocHJvamVjdCA9PiAhdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5oYXMocHJvamVjdCkpXHJcbiAgICAgICAgICAgIC5tYXAocHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FuZGlkYXRlRmluZGVyKHByb2plY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoY2FuZGlkYXRlcyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20oY2FuZGlkYXRlcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4gdGhpcy5fZmluZFJlcG9zaXRvcnlGb3JQYXRoKHgucGF0aCksIChjYW5kaWRhdGUsIHJlcG8pID0+ICh7IGNhbmRpZGF0ZSwgcmVwbyB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVwb3MgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbmRpZGF0ZXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcy5tYXAoeiA9PiB6LnBhdGgpLCBmcm9tSXRlcmF0b3IodGhpcy5fc29sdXRpb25zLmtleXMoKSkpLm1hcCh6ID0+IF8uZmluZChjYW5kaWRhdGVzLCB7IHBhdGg6IHogfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKHsgcGF0aCwgaXNQcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQocmVwb3MsIHggPT4geC5jYW5kaWRhdGUucGF0aCA9PT0gcGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBvID0gZm91bmQgJiYgZm91bmQucmVwbztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHBhdGgsIGlzUHJvamVjdCwgcmVwbywgb3JpZ2luYWxGaWxlIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhZGRDYW5kaWRhdGVzSW5PcmRlcihuZXdDYW5kaWRhdGVzLCAoY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIG9yaWdpbmFsRmlsZSkgPT4gdGhpcy5fYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgb3JpZ2luYWxGaWxlLCBwcm9qZWN0IH0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pLnRvUHJvbWlzZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGNhbmRpZGF0ZU9ic2VydmFibGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlU2VhcmNoID0gdGhpcy5fYWN0aXZlU2VhcmNoLnRoZW4oKCkgPT4gY2FuZGlkYXRlT2JzZXJ2YWJsZSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9maW5kUmVwb3NpdG9yeUZvclBhdGgod29ya2luZ1BhdGg6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb208UkVQT1NJVE9SWT4oYXRvbS5wcm9qZWN0LmdldFJlcG9zaXRvcmllcygpIHx8IFtdKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxyXG4gICAgICAgICAgICAubWFwKHJlcG8gPT4gKHsgcmVwbywgZGlyZWN0b3J5OiByZXBvLmdldFdvcmtpbmdEaXJlY3RvcnkoKSB9KSlcclxuICAgICAgICAgICAgLmZpbHRlcigoe2RpcmVjdG9yeX0pID0+IHBhdGgubm9ybWFsaXplKGRpcmVjdG9yeSkgPT09IHBhdGgubm9ybWFsaXplKHdvcmtpbmdQYXRoKSlcclxuICAgICAgICAgICAgLnRha2UoMSlcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHgucmVwbyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWRkU29sdXRpb24oY2FuZGlkYXRlOiBzdHJpbmcsIHJlcG86IFJFUE9TSVRPUlksIGlzUHJvamVjdDogYm9vbGVhbiwge3RlbXBvcmFyeSA9IGZhbHNlLCBwcm9qZWN0LCBvcmlnaW5hbEZpbGV9OiB7IGRlbGF5PzogbnVtYmVyOyB0ZW1wb3Jhcnk/OiBib29sZWFuOyBwcm9qZWN0Pzogc3RyaW5nOyBvcmlnaW5hbEZpbGU/OiBzdHJpbmc7IH0pIHtcclxuICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IGNhbmRpZGF0ZTtcclxuICAgICAgICBpZiAoXy5lbmRzV2l0aChjYW5kaWRhdGUsIFwiLnNsblwiKSkge1xyXG4gICAgICAgICAgICBjYW5kaWRhdGUgPSBwYXRoLmRpcm5hbWUoY2FuZGlkYXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzb2x1dGlvbjogU29sdXRpb247XHJcbiAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoY2FuZGlkYXRlKSkge1xyXG4gICAgICAgICAgICBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9ucy5nZXQoY2FuZGlkYXRlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHByb2plY3QgJiYgdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5oYXMocHJvamVjdCkpIHtcclxuICAgICAgICAgICAgc29sdXRpb24gPSB0aGlzLl9zb2x1dGlvblByb2plY3RzLmdldChwcm9qZWN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiAmJiAhc29sdXRpb24uaXNEaXNwb3NlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChzb2x1dGlvbiAmJiBzb2x1dGlvbi5pc0Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2VyID0gdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLmdldChzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIGRpc3Bvc2VyLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNvbHV0aW9uID0gbmV3IFNvbHV0aW9uKHtcclxuICAgICAgICAgICAgcHJvamVjdFBhdGg6IHByb2plY3RQYXRoLFxyXG4gICAgICAgICAgICBpbmRleDogKyt0aGlzLl9uZXh0SW5kZXgsXHJcbiAgICAgICAgICAgIHRlbXBvcmFyeTogdGVtcG9yYXJ5LFxyXG4gICAgICAgICAgICByZXBvc2l0b3J5OiA8YW55PnJlcG8sXHJcbiAgICAgICAgICAgIHJ1bnRpbWU6IF8uZW5kc1dpdGgob3JpZ2luYWxGaWxlLCBcIi5jc3hcIikgPyBSdW50aW1lLkNsck9yTW9ubyA6IFJ1bnRpbWUuQ29yZUNsclxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIWlzUHJvamVjdCkge1xyXG4gICAgICAgICAgICBzb2x1dGlvbi5pc0ZvbGRlclBlckZpbGUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHNvbHV0aW9uKTtcclxuICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChjZCk7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLnNldChzb2x1dGlvbiwgY2QpO1xyXG5cclxuICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uLmNvbm5lY3QgPSAoKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3JhcnksIHByb2plY3QgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgXy5wdWxsKHRoaXMuX2FjdGl2ZVNvbHV0aW9ucywgc29sdXRpb24pO1xyXG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZGVsZXRlKGNhbmRpZGF0ZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5kZWxldGUoc29sdXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fYWN0aXZlU29sdXRpb24uZ2V0VmFsdWUoKSA9PT0gc29sdXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQodGhpcy5fYWN0aXZlU29sdXRpb25zLmxlbmd0aCA/IHRoaXMuX2FjdGl2ZVNvbHV0aW9uc1swXSA6IG51bGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9jb25maWd1cmF0aW9ucy5mb3JFYWNoKGNvbmZpZyA9PiBjb25maWcoc29sdXRpb24pKTtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuc2V0KGNhbmRpZGF0ZSwgc29sdXRpb24pO1xyXG5cclxuICAgICAgICAvLyBrZWVwIHRyYWNrIG9mIHRoZSBhY3RpdmUgc29sdXRpb25zXHJcbiAgICAgICAgY2QuYWRkKHRoaXMuX29ic2VydmF0aW9uLmFkZChzb2x1dGlvbikpO1xyXG4gICAgICAgIGNkLmFkZCh0aGlzLl9jb21iaW5hdGlvbi5hZGQoc29sdXRpb24pKTtcclxuXHJcbiAgICAgICAgaWYgKHRlbXBvcmFyeSkge1xyXG4gICAgICAgICAgICBjb25zdCB0ZW1wRCA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHsgLyogKi8gfSk7XHJcbiAgICAgICAgICAgIHRlbXBELmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLnNldChzb2x1dGlvbiwgbmV3IFJlZkNvdW50RGlzcG9zYWJsZSh0ZW1wRCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb25zLnB1c2goc29sdXRpb24pO1xyXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID09PSAxKVxyXG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbi5uZXh0KHNvbHV0aW9uKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fYWRkU29sdXRpb25TdWJzY3JpcHRpb25zKHNvbHV0aW9uLCBjZCk7XHJcbiAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xyXG4gICAgICAgIHJldHVybiA8T2JzZXJ2YWJsZTxTb2x1dGlvbj4+PGFueT5yZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWRkU29sdXRpb25TdWJzY3JpcHRpb25zKHNvbHV0aW9uOiBTb2x1dGlvbiwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgQXN5bmNTdWJqZWN0PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIGNvbnN0IGVycm9yUmVzdWx0ID0gc29sdXRpb24uc3RhdGVcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkVycm9yKVxyXG4gICAgICAgICAgICAuZGVsYXkoMTAwKVxyXG4gICAgICAgICAgICAudGFrZSgxKTtcclxuXHJcbiAgICAgICAgY2QuYWRkKGVycm9yUmVzdWx0LnN1YnNjcmliZSgoKSA9PiByZXN1bHQuY29tcGxldGUoKSkpOyAvLyBJZiB0aGlzIHNvbHV0aW9uIGVycm9ycyBtb3ZlIG9uIHRvIHRoZSBuZXh0XHJcblxyXG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RBZGRlZC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLl9zb2x1dGlvblByb2plY3RzLnNldChwcm9qZWN0LnBhdGgsIHNvbHV0aW9uKSkpO1xyXG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RSZW1vdmVkLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuZGVsZXRlKHByb2plY3QucGF0aCkpKTtcclxuXHJcbiAgICAgICAgLy8gV2FpdCBmb3IgdGhlIHByb2plY3RzIHRvIHJldHVybiBmcm9tIHRoZSBzb2x1dGlvblxyXG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RzXHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwKVxyXG4gICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAubWFwKCgpID0+IHNvbHV0aW9uKVxyXG4gICAgICAgICAgICAudGltZW91dChTT0xVVElPTl9MT0FEX1RJTUUsIFNjaGVkdWxlci5xdWV1ZSkgLy8gV2FpdCAzMCBzZWNvbmRzIGZvciB0aGUgcHJvamVjdCB0byBsb2FkLlxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIFdlIGxvYWRlZCBzdWNjZXNzZnVsbHkgcmV0dXJuIHRoZSBzb2x1dGlvblxyXG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5leHQoc29sdXRpb24pO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIE1vdmUgYWxvbmcuXHJcbiAgICAgICAgICAgICAgICByZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3JlbW92ZVNvbHV0aW9uKGNhbmRpZGF0ZTogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKF8uZW5kc1dpdGgoY2FuZGlkYXRlLCBcIi5zbG5cIikpIHtcclxuICAgICAgICAgICAgY2FuZGlkYXRlID0gcGF0aC5kaXJuYW1lKGNhbmRpZGF0ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9ucy5nZXQoY2FuZGlkYXRlKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVmQ291bnREaXNwb3NhYmxlID0gc29sdXRpb24gJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikgJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmdldChzb2x1dGlvbik7XHJcbiAgICAgICAgaWYgKHJlZkNvdW50RGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICByZWZDb3VudERpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICBpZiAoIXJlZkNvdW50RGlzcG9zYWJsZS5pc0Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGtlZXAgdHJhY2sgb2YgdGhlIHJlbW92ZWQgc29sdXRpb25zXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uKSB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcC5nZXQoc29sdXRpb24pO1xyXG4gICAgICAgICAgICBpZiAoZGlzcG9zYWJsZSkgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRTb2x1dGlvbkZvclBhdGgocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKCFwYXRoKVxyXG4gICAgICAgICAgICAvLyBObyB0ZXh0IGVkaXRvciBmb3VuZFxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxTb2x1dGlvbj4oKTtcclxuXHJcbiAgICAgICAgY29uc3QgaXNGb2xkZXJQZXJGaWxlID0gXy5zb21lKHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKHBhdGgsIGV4dCkpO1xyXG5cclxuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IHBhdGg7XHJcbiAgICAgICAgaWYgKCFsb2NhdGlvbikge1xyXG4gICAgICAgICAgICAvLyBUZXh0IGVkaXRvciBub3Qgc2F2ZWQgeWV0P1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxTb2x1dGlvbj4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNvbHV0aW9uVmFsdWUgPSB0aGlzLl9nZXRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpO1xyXG5cclxuICAgICAgICBpZiAoc29sdXRpb25WYWx1ZSlcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoc29sdXRpb25WYWx1ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKS5maWx0ZXIoKCkgPT4gIWVkaXRvci5pc0Rlc3Ryb3llZCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBzb2x1dGlvbjogU29sdXRpb24pIHtcclxuICAgICAgICBjb25zdCBjb250ZXh0ID0gbmV3IE9tbmlzaGFycEVkaXRvckNvbnRleHQoZWRpdG9yLCBzb2x1dGlvbik7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0OiBPbW5pc2hhcnBUZXh0RWRpdG9yID0gPGFueT5lZGl0b3I7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoY29udGV4dCk7XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiAmJiAhY29udGV4dC50ZW1wICYmIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5oYXMoc29sdXRpb24pKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlZkNvdW50RGlzcG9zYWJsZSA9IHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5nZXQoc29sdXRpb24pO1xyXG4gICAgICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gcmVmQ291bnREaXNwb3NhYmxlLmdldERpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgY29udGV4dC50ZW1wID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29udGV4dC5zb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlU29sdXRpb24oc29sdXRpb24ucGF0aCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICBpZiAoIWVkaXRvcikge1xyXG4gICAgICAgICAgICAvLyBObyB0ZXh0IGVkaXRvciBmb3VuZFxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxTb2x1dGlvbj4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gZWRpdG9yLmdldFBhdGgoKTtcclxuICAgICAgICBpZiAoIWxvY2F0aW9uKSB7XHJcbiAgICAgICAgICAgIC8vIFRleHQgZWRpdG9yIG5vdCBzYXZlZCB5ZXQ/XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XHJcbiAgICAgICAgICAgIGlmIChlZGl0b3Iub21uaXNoYXJwLm1ldGFkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjbGllbnQgLyBzZXJ2ZXIgZG9lc25cInQgd29yayBjdXJyZW50bHkgZm9yIG1ldGFkYXRhIGRvY3VtZW50cy5cclxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzb2x1dGlvbiA9IGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb247XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGUgc29sdXRpb24gaGFzIGRpc2Nvbm5lY3RlZCwgcmVjb25uZWN0IGl0XHJcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCAmJiBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5hdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlXCIpKVxyXG4gICAgICAgICAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2xpZW50IGlzIGluIGFuIGludmFsaWQgc3RhdGVcclxuICAgICAgICAgICAgaWYgKHNvbHV0aW9uLmN1cnJlbnRTdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpc0ZvbGRlclBlckZpbGUgPSBfLnNvbWUodGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSk7XHJcbiAgICAgICAgY29uc3Qgc29sdXRpb24gPSB0aGlzLl9nZXRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpO1xyXG4gICAgICAgIGlmIChzb2x1dGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLl9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSlcclxuICAgICAgICAgICAgLmRvKChzbG4pID0+IHRoaXMuX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yLCBzbG4pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uPFQ+KGxvY2F0aW9uOiBzdHJpbmcsIGNiOiAoaW50ZXJzZWN0OiBzdHJpbmcsIHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gVCkge1xyXG4gICAgICAgIGZvciAoY29uc3Qgc29sdXRpb24gb2YgdGhpcy5fYWN0aXZlU29sdXRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIGRvblwidCBjaGVjayBmb3IgZm9sZGVyIGJhc2VkIHNvbHV0aW9uc1xyXG4gICAgICAgICAgICBpZiAoc29sdXRpb24uaXNGb2xkZXJQZXJGaWxlKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gc29sdXRpb24ubW9kZWwucHJvamVjdHMubWFwKHogPT4gei5wYXRoKTtcclxuICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgcGF0aHMpO1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IoaW50ZXJzZWN0LCBzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbjogc3RyaW5nLCBpc0ZvbGRlclBlckZpbGU6IGJvb2xlYW4pOiBTb2x1dGlvbiB7XHJcbiAgICAgICAgaWYgKGxvY2F0aW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGb2xkZXJQZXJGaWxlKSB7XHJcbiAgICAgICAgICAgIC8vIENTWCBhcmUgc3BlY2lhbCwgYW5kIG5lZWQgYSBzb2x1dGlvbiBwZXIgZGlyZWN0b3J5LlxyXG4gICAgICAgICAgICBjb25zdCBkaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUobG9jYXRpb24pO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fc29sdXRpb25zLmhhcyhkaXJlY3RvcnkpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvbHV0aW9ucy5nZXQoZGlyZWN0b3J5KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdCA9IHRoaXMuX2ludGVyc2VjdFBhdGgobG9jYXRpb24pO1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29sdXRpb25zLmdldChpbnRlcnNlY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xyXG4gICAgICAgICAgICAvLyBBdHRlbXB0IHRvIHNlZSBpZiB0aGlzIGZpbGUgaXMgcGFydCBhIHNvbHV0aW9uXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4gc29sdXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb246IHN0cmluZywgaXNGb2xkZXJQZXJGaWxlOiBib29sZWFuKTogT2JzZXJ2YWJsZTxTb2x1dGlvbj4ge1xyXG4gICAgICAgIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGguZGlybmFtZShsb2NhdGlvbik7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fYWN0aXZhdGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGl2YXRlZFN1YmplY3QudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gdGhpcy5fZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBsb2NhdGlvbi5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgICAgY29uc3QgbWFwcGVkTG9jYXRpb25zID0gc2VnbWVudHMubWFwKChsb2MsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLnRha2Uoc2VnbWVudHMsIGluZGV4ICsgMSkuam9pbihwYXRoLnNlcCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGwgb2YgbWFwcGVkTG9jYXRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9maW5kU29sdXRpb25DYWNoZS5oYXMobCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5nZXQobCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgQXN5bmNTdWJqZWN0PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIF8uZWFjaChtYXBwZWRMb2NhdGlvbnMsIGwgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5zZXQobCwgPE9ic2VydmFibGU8U29sdXRpb24+Pjxhbnk+c3ViamVjdCk7XHJcbiAgICAgICAgICAgIHN1YmplY3Quc3Vic2NyaWJlKHsgY29tcGxldGU6ICgpID0+IHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmRlbGV0ZShsKSB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgcHJvamVjdCA9IHRoaXMuX2ludGVyc2VjdEF0b21Qcm9qZWN0UGF0aChkaXJlY3RvcnkpO1xyXG4gICAgICAgIGNvbnN0IGNiID0gKGNhbmRpZGF0ZXM6IENhbmRpZGF0ZVtdKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFdlIG9ubHkgd2FudCB0byBzZWFyY2ggZm9yIHNvbHV0aW9ucyBhZnRlciB0aGUgbWFpbiBzb2x1dGlvbnMgaGF2ZSBiZWVuIHByb2Nlc3NlZC5cclxuICAgICAgICAgICAgLy8gV2UgY2FuIGdldCBpbnRvIHRoaXMgcmFjZSBjb25kaXRpb24gaWYgdGhlIHVzZXIgaGFzIHdpbmRvd3MgdGhhdCB3ZXJlIG9wZW5lZCBwcmV2aW91c2x5LlxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2FjdGl2YXRlZCkge1xyXG4gICAgICAgICAgICAgICAgXy5kZWxheShjYiwgU09MVVRJT05fTE9BRF9USU1FKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFpc0ZvbGRlclBlckZpbGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gc2VlIGlmIHRoaXMgZmlsZSBpcyBwYXJ0IGEgc29sdXRpb25cclxuICAgICAgICAgICAgICAgIGNvbnN0IHIgPSB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dChzb2x1dGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocikgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2gudGhlbigoKSA9PiBPYnNlcnZhYmxlLmZyb20oY2FuZGlkYXRlcylcclxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4gdGhpcy5fZmluZFJlcG9zaXRvcnlGb3JQYXRoKHgucGF0aCksIChjYW5kaWRhdGUsIHJlcG8pID0+ICh7IGNhbmRpZGF0ZSwgcmVwbyB9KSlcclxuICAgICAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKSlcclxuICAgICAgICAgICAgICAgIC50aGVuKHJlcG9zID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdDYW5kaWRhdGVzID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMubWFwKHogPT4gei5wYXRoKSwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5rZXlzKCkpKS5tYXAoeiA9PiBfLmZpbmQoY2FuZGlkYXRlcywgeyBwYXRoOiB6IH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKCh7IHBhdGgsIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHJlcG9zLCB4ID0+IHguY2FuZGlkYXRlLnBhdGggPT09IHBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbyA9IGZvdW5kICYmIGZvdW5kLnJlcG87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBwYXRoLCBpc1Byb2plY3QsIHJlcG8sIG9yaWdpbmFsRmlsZSB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBhZGRDYW5kaWRhdGVzSW5PcmRlcihuZXdDYW5kaWRhdGVzLCAoY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIG9yaWdpbmFsRmlsZSkgPT4gdGhpcy5fYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgdGVtcG9yYXJ5OiAhcHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gc2VlIGlmIHRoaXMgZmlsZSBpcyBwYXJ0IGEgc29sdXRpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gdGhpcy5faXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgKGludGVyc2VjdCwgc29sdXRpb24pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHNvbHV0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHIpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uKSB8fCB0aGlzLl9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgobG9jYXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyc2VjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zb2x1dGlvbnMuaGFzKGludGVyc2VjdCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHRoaXMuX3NvbHV0aW9ucy5nZXQoaW50ZXJzZWN0KSk7IC8vIFRoZSBib29sZWFuIG1lYW5zIHRoaXMgc29sdXRpb24gaXMgdGVtcG9yYXJ5LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYENvdWxkIG5vdCBmaW5kIGEgc29sdXRpb24gZm9yIFwiJHtsb2NhdGlvbn1cImApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbmRpZGF0ZUZpbmRlcihkaXJlY3RvcnkpLnN1YnNjcmliZShjYik7XHJcblxyXG4gICAgICAgIHJldHVybiA8T2JzZXJ2YWJsZTxTb2x1dGlvbj4+PGFueT5zdWJqZWN0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2NhbmRpZGF0ZUZpbmRlcihkaXJlY3Rvcnk6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBmaW5kQ2FuZGlkYXRlcy53aXRoQ2FuZGlkYXRlcyhkaXJlY3RvcnksIHRoaXMubG9nZ2VyLCB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uSW5kZXBlbmRlbnRTb3VyY2VGaWxlc1RvU2VhcmNoOiB0aGlzLl9fc3BlY2lhbENhc2VFeHRlbnNpb25zLm1hcCh6ID0+IFwiKlwiICsgeilcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZmxhdE1hcChjYW5kaWRhdGVzID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNsbnMgPSBfLmZpbHRlcihjYW5kaWRhdGVzLCB4ID0+IF8uZW5kc1dpdGgoeC5wYXRoLCBcIi5zbG5cIikpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNsbnMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMsIHNsbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzeW5jUmVzdWx0ID0gbmV3IEFzeW5jU3ViamVjdDx0eXBlb2YgY2FuZGlkYXRlcz4oKTtcclxuICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5uZXh0KGl0ZW1zKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaGFuZGxlIG11bHRpcGxlIHNvbHV0aW9ucy5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsaXN0VmlldyA9IG5ldyBHZW5lcmljU2VsZWN0TGlzdFZpZXcoXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2xucy5tYXAoeCA9PiAoeyBkaXNwbGF5TmFtZTogeC5wYXRoLCBuYW1lOiB4LnBhdGggfSkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLnVuc2hpZnQoLi4uc2xucy5maWx0ZXIoeCA9PiB4LnBhdGggPT09IHJlc3VsdCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5lYWNoKGNhbmRpZGF0ZXMsIHggPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhbmRpZGF0ZUZpbmRlckNhY2hlLmFkZCh4LnBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RWaWV3Lm1lc3NhZ2UudGV4dChcIlBsZWFzZSBzZWxlY3QgYSBzb2x1dGlvbiB0byBsb2FkLlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvdyB0aGUgdmlld1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcGVuU2VsZWN0TGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuU2VsZWN0TGlzdC5vbkNsb3NlZC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLnNvbWUoc2xucywgeCA9PiB0aGlzLl9jYW5kaWRhdGVGaW5kZXJDYWNoZS5oYXMoeC5wYXRoKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmRlZmVyKCgpID0+IGxpc3RWaWV3LnRvZ2dsZSgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXy5kZWZlcigoKSA9PiBsaXN0Vmlldy50b2dnbGUoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5kbyh7IGNvbXBsZXRlOiAoKSA9PiBvcGVuU2VsZWN0TGlzdCA9IG51bGwgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3BlblNlbGVjdExpc3QgPSBsaXN0VmlldztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxPYnNlcnZhYmxlPHR5cGVvZiBjYW5kaWRhdGVzPj48YW55PmFzeW5jUmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihjYW5kaWRhdGVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gdm9pZCkge1xyXG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyYXRpb25zLmFkZChjYWxsYmFjayk7XHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLmZvckVhY2goc29sdXRpb24gPT4gY2FsbGJhY2soc29sdXRpb24pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uOiBzdHJpbmcsIHBhdGhzPzogc3RyaW5nW10pIHtcclxuICAgICAgICBjb25zdCB2YWxpZFNvbHV0aW9uUGF0aHMgPSBwYXRocztcclxuXHJcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBsb2NhdGlvbi5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgICAgY29uc3QgbWFwcGVkTG9jYXRpb25zID0gc2VnbWVudHMubWFwKChsb2MsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLnRha2Uoc2VnbWVudHMsIGluZGV4ICsgMSkuam9pbihwYXRoLnNlcCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIExvb2sgZm9yIHRoZSBjbG9zZXN0IG1hdGNoIGZpcnN0LlxyXG4gICAgICAgIG1hcHBlZExvY2F0aW9ucy5yZXZlcnNlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGludGVyc2VjdDogc3RyaW5nID0gXy5pbnRlcnNlY3Rpb24obWFwcGVkTG9jYXRpb25zLCB2YWxpZFNvbHV0aW9uUGF0aHMpWzBdO1xyXG4gICAgICAgIGlmIChpbnRlcnNlY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGludGVyc2VjdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaW50ZXJzZWN0UGF0aChsb2NhdGlvbjogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb24sIGZyb21JdGVyYXRvcih0aGlzLl9zb2x1dGlvbnMuZW50cmllcygpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXpbMV0uaXNGb2xkZXJQZXJGaWxlKS5tYXAoeiA9PiB6WzBdKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGxvY2F0aW9uOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgdGhpcy5fYXRvbVByb2plY3RzLnBhdGhzKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gYWRkQ2FuZGlkYXRlc0luT3JkZXIoY2FuZGlkYXRlczogeyBwYXRoOiBzdHJpbmc7IHJlcG86IFJFUE9TSVRPUlk7IGlzUHJvamVjdDogYm9vbGVhbjsgb3JpZ2luYWxGaWxlOiBzdHJpbmc7IH1bXSwgY2I6IChjYW5kaWRhdGU6IHN0cmluZywgcmVwbzogUkVQT1NJVE9SWSwgaXNQcm9qZWN0OiBib29sZWFuLCBvcmlnaW5hbEZpbGU6IHN0cmluZykgPT4gT2JzZXJ2YWJsZTxTb2x1dGlvbj4pIHtcclxuICAgIGNvbnN0IGFzeW5jU3ViamVjdCA9IG5ldyBBc3luY1N1YmplY3QoKTtcclxuXHJcbiAgICBpZiAoIWNhbmRpZGF0ZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgYXN5bmNTdWJqZWN0Lm5leHQoY2FuZGlkYXRlcyk7XHJcbiAgICAgICAgYXN5bmNTdWJqZWN0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jU3ViamVjdC50b1Byb21pc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjZHMgPSBjYW5kaWRhdGVzLnNsaWNlKCk7XHJcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBjZHMuc2hpZnQoKTtcclxuICAgIGNvbnN0IGhhbmRsZUNhbmRpZGF0ZSA9IChjYW5kOiB7IHBhdGg6IHN0cmluZzsgcmVwbzogUkVQT1NJVE9SWTsgaXNQcm9qZWN0OiBib29sZWFuOyBvcmlnaW5hbEZpbGU6IHN0cmluZzsgfSkgPT4ge1xyXG4gICAgICAgIGNiKGNhbmQucGF0aCwgY2FuZC5yZXBvLCBjYW5kLmlzUHJvamVjdCwgY2FuZC5vcmlnaW5hbEZpbGUpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2RzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYW5kID0gY2RzLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUNhbmRpZGF0ZShjYW5kKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3luY1N1YmplY3QubmV4dChjYW5kaWRhdGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNTdWJqZWN0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBoYW5kbGVDYW5kaWRhdGUoY2FuZGlkYXRlKTtcclxuICAgIHJldHVybiBhc3luY1N1YmplY3QudG9Qcm9taXNlKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZyb21JdGVyYXRvcjxUPihpdGVyYXRvcjogSXRlcmFibGVJdGVyYXRvcjxUPikge1xyXG4gICAgY29uc3QgaXRlbXM6IFRbXSA9IFtdO1xyXG4gICAgbGV0IHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcclxuICAgIHdoaWxlICghcmVzdWx0LmRvbmUpIHtcclxuICAgICAgICBpdGVtcy5wdXNoKHJlc3VsdC52YWx1ZSk7XHJcblxyXG4gICAgICAgIHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXRlbXM7XHJcbn1cclxuXHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuZXhwb3J0IGNvbnN0IFNvbHV0aW9uTWFuYWdlciA9IG5ldyBTb2x1dGlvbkluc3RhbmNlTWFuYWdlcigpO1xyXG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
