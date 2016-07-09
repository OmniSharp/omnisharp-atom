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
            }).flatMap(function (repo) {
                return repo.async.getWorkingDirectory();
            }, function (repo, directory) {
                return { repo: repo, directory: directory };
            }).filter(function (_ref2) {
                var directory = _ref2.directory;
                return path.normalize(directory) === path.normalize(workingPath);
            }).take(1).map(function (x) {
                return x.repo.async;
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
                                return _this8._candidateFinderCache.add(x.path);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci5qcyIsImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0lDQVksSTs7QURDWjs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7Ozs7Ozs7OztBQ0lBLElBQU0scUJBQXFCLEtBQTNCO0FBRUEsSUFBSSx1QkFBSjs7SUFDQSx1QjtBQUFBLHVDQUFBO0FBQUE7O0FBRVcsYUFBQSxjQUFBLEdBQWlCLEtBQWpCO0FBQ0EsYUFBQSxtQkFBQSxHQUFzQixLQUF0QjtBQWlCQyxhQUFBLGVBQUEsR0FBa0IsSUFBSSxHQUFKLEVBQWxCO0FBQ0EsYUFBQSxVQUFBLEdBQWEsSUFBSSxHQUFKLEVBQWI7QUFDQSxhQUFBLGlCQUFBLEdBQW9CLElBQUksR0FBSixFQUFwQjtBQUNBLGFBQUEsbUJBQUEsR0FBc0IsSUFBSSxPQUFKLEVBQXRCO0FBQ0EsYUFBQSxzQkFBQSxHQUF5QixJQUFJLE9BQUosRUFBekI7QUFDQSxhQUFBLGtCQUFBLEdBQXFCLElBQUksR0FBSixFQUFyQjtBQUNBLGFBQUEscUJBQUEsR0FBd0IsSUFBSSxHQUFKLEVBQXhCO0FBRUEsYUFBQSxVQUFBLEdBQWEsS0FBYjtBQUNBLGFBQUEsVUFBQSxHQUFhLENBQWI7QUFJQSxhQUFBLHNCQUFBLEdBQXlCLENBQUMsTUFBRCxDQUF6QjtBQUdBLGFBQUEsZ0JBQUEsR0FBK0IsRUFBL0I7QUFNQSxhQUFBLFlBQUEsR0FBZSx5Q0FBZjtBQU1BLGFBQUEsWUFBQSxHQUFlLGtEQUFmO0FBS0EsYUFBQSxlQUFBLEdBQWtCLDBCQUE4QixJQUE5QixDQUFsQjtBQUNBLGFBQUEsd0JBQUEsR0FBMkIsS0FBSyxlQUFMLENBQXFCLG9CQUFyQixHQUE0QyxNQUE1QyxDQUFtRDtBQUFBLG1CQUFLLENBQUMsQ0FBQyxDQUFQO0FBQUEsU0FBbkQsRUFBNkQsYUFBN0Qs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O0FBQ0EsaUNBQWEsUUFBYjtBQUNIO0FBQ0o7QUFUTSxTQURmO0FBWUgsS0FiRDtBQWNBLG9CQUFnQixTQUFoQjtBQUNBLFdBQU8sYUFBYSxTQUFiLEVBQVA7QUFDSDtBQUVELFNBQUEsWUFBQSxDQUF5QixRQUF6QixFQUFzRDtBQUNsRCxRQUFNLFFBQWEsRUFBbkI7QUFDQSxRQUFJLFNBQVMsU0FBUyxJQUFULEVBQWI7QUFDQSxXQUFPLENBQUMsT0FBTyxJQUFmLEVBQXFCO0FBQ2pCLGNBQU0sSUFBTixDQUFXLE9BQU8sS0FBbEI7QUFFQSxpQkFBUyxTQUFTLElBQVQsRUFBVDtBQUNIO0FBRUQsV0FBTyxLQUFQO0FBQ0g7QUFHTSxJQUFNLDRDQUFrQixJQUFJLHVCQUFKLEVBQXhCIiwiZmlsZSI6ImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIEFzeW5jU3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0LCBTY2hlZHVsZXIsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgUmVmQ291bnREaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IFNvbHV0aW9uIH0gZnJvbSBcIi4vc29sdXRpb25cIjtcbmltcG9ydCB7IEF0b21Qcm9qZWN0VHJhY2tlciB9IGZyb20gXCIuL2F0b20tcHJvamVjdHNcIjtcbmltcG9ydCB7IFNvbHV0aW9uT2JzZXJ2ZXIsIFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIgfSBmcm9tIFwiLi9jb21wb3NpdGUtc29sdXRpb25cIjtcbmltcG9ydCB7IERyaXZlclN0YXRlLCBmaW5kQ2FuZGlkYXRlcywgUnVudGltZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBHZW5lcmljU2VsZWN0TGlzdFZpZXcgfSBmcm9tIFwiLi4vdmlld3MvZ2VuZXJpYy1saXN0LXZpZXdcIjtcbmltcG9ydCB7IGlzT21uaXNoYXJwVGV4dEVkaXRvciwgT21uaXNoYXJwRWRpdG9yQ29udGV4dCB9IGZyb20gXCIuL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xuY29uc3QgU09MVVRJT05fTE9BRF9USU1FID0gMzAwMDA7XG5sZXQgb3BlblNlbGVjdExpc3Q7XG5jbGFzcyBTb2x1dGlvbkluc3RhbmNlTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX3VuaXRUZXN0TW9kZV8gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fa2lja19pbl90aGVfcGFudHNfID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyYXRpb25zID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uUHJvamVjdHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucyA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcCA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9jYW5kaWRhdGVGaW5kZXJDYWNoZSA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX25leHRJbmRleCA9IDA7XG4gICAgICAgIHRoaXMuX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucyA9IFtcIi5jc3hcIixdO1xuICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fb2JzZXJ2YXRpb24gPSBuZXcgU29sdXRpb25PYnNlcnZlcigpO1xuICAgICAgICB0aGlzLl9jb21iaW5hdGlvbiA9IG5ldyBTb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyKCk7XG4gICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uID0gbmV3IEJlaGF2aW9yU3ViamVjdChudWxsKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb25PYnNlcmFibGUgPSB0aGlzLl9hY3RpdmVTb2x1dGlvbi5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpLmZpbHRlcih6ID0+ICEheikucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZWRTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICB9XG4gICAgZ2V0IGxvZ2dlcigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3VuaXRUZXN0TW9kZV8gfHwgdGhpcy5fa2lja19pbl90aGVfcGFudHNfKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGxvZzogKCkgPT4geyB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiAoKSA9PiB7IH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbnNvbGU7XG4gICAgfVxuICAgIGdldCBfX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucygpIHsgcmV0dXJuIHRoaXMuX3NwZWNpYWxDYXNlRXh0ZW5zaW9uczsgfVxuICAgIGdldCBhY3RpdmVTb2x1dGlvbnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVTb2x1dGlvbnM7XG4gICAgfVxuICAgIGdldCBzb2x1dGlvbk9ic2VydmVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fb2JzZXJ2YXRpb247XG4gICAgfVxuICAgIGdldCBzb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29tYmluYXRpb247XG4gICAgfVxuICAgIGdldCBhY3RpdmVTb2x1dGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNvbHV0aW9uT2JzZXJhYmxlO1xuICAgIH1cbiAgICBnZXQgYWN0aXZhdGVkU3ViamVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2YXRlZFN1YmplY3Q7XG4gICAgfVxuICAgIGFjdGl2YXRlKGFjdGl2ZUVkaXRvcikge1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZhdGVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fYXRvbVByb2plY3RzID0gbmV3IEF0b21Qcm9qZWN0VHJhY2tlcigpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMpO1xuICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2ggPSBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgdGhpcy5fc3Vic2NyaWJlVG9BdG9tUHJvamVjdFRyYWNrZXIoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYWN0aXZlRWRpdG9yXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxuICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB0aGlzLmdldFNvbHV0aW9uRm9yRWRpdG9yKHopKVxuICAgICAgICAgICAgLnN1YnNjcmliZSh4ID0+IHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQoeCkpKTtcbiAgICAgICAgdGhpcy5fYXRvbVByb2plY3RzLmFjdGl2YXRlKCk7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuYWN0aXZhdGVkU3ViamVjdC5uZXh0KHRydWUpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUpO1xuICAgIH1cbiAgICBjb25uZWN0KCkge1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBzb2x1dGlvbi5jb25uZWN0KCkpO1xuICAgIH1cbiAgICBkaXNjb25uZWN0KCkge1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBzb2x1dGlvbi5kaXNwb3NlKCkpO1xuICAgIH1cbiAgICBkZWFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5jbGVhcigpO1xuICAgIH1cbiAgICBnZXQgY29ubmVjdGVkKCkge1xuICAgICAgICBjb25zdCBpdGVyYXRvciA9IHRoaXMuX3NvbHV0aW9ucy52YWx1ZXMoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICB3aGlsZSAoIXJlc3VsdC5kb25lKVxuICAgICAgICAgICAgaWYgKHJlc3VsdC52YWx1ZS5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBfc3Vic2NyaWJlVG9BdG9tUHJvamVjdFRyYWNrZXIoKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX2F0b21Qcm9qZWN0cy5yZW1vdmVkXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gdGhpcy5fc29sdXRpb25zLmhhcyh6KSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLl9yZW1vdmVTb2x1dGlvbihwcm9qZWN0KSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMuYWRkZWRcbiAgICAgICAgICAgIC5maWx0ZXIocHJvamVjdCA9PiAhdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5oYXMocHJvamVjdCkpXG4gICAgICAgICAgICAubWFwKHByb2plY3QgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhbmRpZGF0ZUZpbmRlcihwcm9qZWN0KVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKGNhbmRpZGF0ZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20oY2FuZGlkYXRlcylcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB0aGlzLl9maW5kUmVwb3NpdG9yeUZvclBhdGgoeC5wYXRoKSwgKGNhbmRpZGF0ZSwgcmVwbykgPT4gKHsgY2FuZGlkYXRlLCByZXBvIH0pKVxuICAgICAgICAgICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihyZXBvcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbmRpZGF0ZXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcy5tYXAoeiA9PiB6LnBhdGgpLCBmcm9tSXRlcmF0b3IodGhpcy5fc29sdXRpb25zLmtleXMoKSkpLm1hcCh6ID0+IF8uZmluZChjYW5kaWRhdGVzLCB7IHBhdGg6IHogfSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKCh7IHBhdGgsIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHJlcG9zLCB4ID0+IHguY2FuZGlkYXRlLnBhdGggPT09IHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbyA9IGZvdW5kICYmIGZvdW5kLnJlcG87XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBwYXRoLCBpc1Byb2plY3QsIHJlcG8sIG9yaWdpbmFsRmlsZSB9O1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFkZENhbmRpZGF0ZXNJbk9yZGVyKG5ld0NhbmRpZGF0ZXMsIChjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyBvcmlnaW5hbEZpbGUsIHByb2plY3QgfSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkudG9Qcm9taXNlKCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGNhbmRpZGF0ZU9ic2VydmFibGUgPT4ge1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlU2VhcmNoID0gdGhpcy5fYWN0aXZlU2VhcmNoLnRoZW4oKCkgPT4gY2FuZGlkYXRlT2JzZXJ2YWJsZSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgX2ZpbmRSZXBvc2l0b3J5Rm9yUGF0aCh3b3JraW5nUGF0aCkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKSB8fCBbXSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgICAgICAgICAuZmxhdE1hcChyZXBvID0+IHJlcG8uYXN5bmMuZ2V0V29ya2luZ0RpcmVjdG9yeSgpLCAocmVwbywgZGlyZWN0b3J5KSA9PiAoeyByZXBvLCBkaXJlY3RvcnkgfSkpXG4gICAgICAgICAgICAuZmlsdGVyKCh7IGRpcmVjdG9yeSB9KSA9PiBwYXRoLm5vcm1hbGl6ZShkaXJlY3RvcnkpID09PSBwYXRoLm5vcm1hbGl6ZSh3b3JraW5nUGF0aCkpXG4gICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgLm1hcCh4ID0+IHgucmVwby5hc3luYyk7XG4gICAgfVxuICAgIF9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3JhcnkgPSBmYWxzZSwgcHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pIHtcbiAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSBjYW5kaWRhdGU7XG4gICAgICAgIGlmIChfLmVuZHNXaXRoKGNhbmRpZGF0ZSwgXCIuc2xuXCIpKSB7XG4gICAgICAgICAgICBjYW5kaWRhdGUgPSBwYXRoLmRpcm5hbWUoY2FuZGlkYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc29sdXRpb247XG4gICAgICAgIGlmICh0aGlzLl9zb2x1dGlvbnMuaGFzKGNhbmRpZGF0ZSkpIHtcbiAgICAgICAgICAgIHNvbHV0aW9uID0gdGhpcy5fc29sdXRpb25zLmdldChjYW5kaWRhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByb2plY3QgJiYgdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5oYXMocHJvamVjdCkpIHtcbiAgICAgICAgICAgIHNvbHV0aW9uID0gdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5nZXQocHJvamVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNvbHV0aW9uICYmICFzb2x1dGlvbi5pc0Rpc3Bvc2VkKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc29sdXRpb24gJiYgc29sdXRpb24uaXNEaXNwb3NlZCkge1xuICAgICAgICAgICAgY29uc3QgZGlzcG9zZXIgPSB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuZ2V0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgIGRpc3Bvc2VyLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBzb2x1dGlvbiA9IG5ldyBTb2x1dGlvbih7XG4gICAgICAgICAgICBwcm9qZWN0UGF0aDogcHJvamVjdFBhdGgsXG4gICAgICAgICAgICBpbmRleDogKyt0aGlzLl9uZXh0SW5kZXgsXG4gICAgICAgICAgICB0ZW1wb3Jhcnk6IHRlbXBvcmFyeSxcbiAgICAgICAgICAgIHJlcG9zaXRvcnk6IHJlcG8sXG4gICAgICAgICAgICBydW50aW1lOiBfLmVuZHNXaXRoKG9yaWdpbmFsRmlsZSwgXCIuY3N4XCIpID8gUnVudGltZS5DbHJPck1vbm8gOiBSdW50aW1lLkNvcmVDbHJcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghaXNQcm9qZWN0KSB7XG4gICAgICAgICAgICBzb2x1dGlvbi5pc0ZvbGRlclBlckZpbGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZChzb2x1dGlvbik7XG4gICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLnNldChzb2x1dGlvbiwgY2QpO1xuICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBzb2x1dGlvbi5jb25uZWN0ID0gKCkgPT4gdGhpcy5fYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgdGVtcG9yYXJ5LCBwcm9qZWN0IH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgIF8ucHVsbCh0aGlzLl9hY3RpdmVTb2x1dGlvbnMsIHNvbHV0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9ucy5kZWxldGUoY2FuZGlkYXRlKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuaGFzKHNvbHV0aW9uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5kZWxldGUoc29sdXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZVNvbHV0aW9uLmdldFZhbHVlKCkgPT09IHNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb24ubmV4dCh0aGlzLl9hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID8gdGhpcy5fYWN0aXZlU29sdXRpb25zWzBdIDogbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fY29uZmlndXJhdGlvbnMuZm9yRWFjaChjb25maWcgPT4gY29uZmlnKHNvbHV0aW9uKSk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5zZXQoY2FuZGlkYXRlLCBzb2x1dGlvbik7XG4gICAgICAgIGNkLmFkZCh0aGlzLl9vYnNlcnZhdGlvbi5hZGQoc29sdXRpb24pKTtcbiAgICAgICAgY2QuYWRkKHRoaXMuX2NvbWJpbmF0aW9uLmFkZChzb2x1dGlvbikpO1xuICAgICAgICBpZiAodGVtcG9yYXJ5KSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wRCA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHsgfSk7XG4gICAgICAgICAgICB0ZW1wRC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuc2V0KHNvbHV0aW9uLCBuZXcgUmVmQ291bnREaXNwb3NhYmxlKHRlbXBEKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb25zLnB1c2goc29sdXRpb24pO1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZlU29sdXRpb25zLmxlbmd0aCA9PT0gMSlcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQoc29sdXRpb24pO1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9hZGRTb2x1dGlvblN1YnNjcmlwdGlvbnMoc29sdXRpb24sIGNkKTtcbiAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBfYWRkU29sdXRpb25TdWJzY3JpcHRpb25zKHNvbHV0aW9uLCBjZCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgICAgIGNvbnN0IGVycm9yUmVzdWx0ID0gc29sdXRpb24uc3RhdGVcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5FcnJvcilcbiAgICAgICAgICAgIC5kZWxheSgxMDApXG4gICAgICAgICAgICAudGFrZSgxKTtcbiAgICAgICAgY2QuYWRkKGVycm9yUmVzdWx0LnN1YnNjcmliZSgoKSA9PiByZXN1bHQuY29tcGxldGUoKSkpO1xuICAgICAgICBjZC5hZGQoc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0QWRkZWQuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5zZXQocHJvamVjdC5wYXRoLCBzb2x1dGlvbikpKTtcbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdFJlbW92ZWQuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5kZWxldGUocHJvamVjdC5wYXRoKSkpO1xuICAgICAgICBjZC5hZGQoc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0c1xuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDApXG4gICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgLm1hcCgoKSA9PiBzb2x1dGlvbilcbiAgICAgICAgICAgIC50aW1lb3V0KFNPTFVUSU9OX0xPQURfVElNRSwgU2NoZWR1bGVyLnF1ZXVlKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICByZXN1bHQubmV4dChzb2x1dGlvbik7XG4gICAgICAgICAgICByZXN1bHQuY29tcGxldGUoKTtcbiAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgcmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgX3JlbW92ZVNvbHV0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICBpZiAoXy5lbmRzV2l0aChjYW5kaWRhdGUsIFwiLnNsblwiKSkge1xuICAgICAgICAgICAgY2FuZGlkYXRlID0gcGF0aC5kaXJuYW1lKGNhbmRpZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc29sdXRpb24gPSB0aGlzLl9zb2x1dGlvbnMuZ2V0KGNhbmRpZGF0ZSk7XG4gICAgICAgIGNvbnN0IHJlZkNvdW50RGlzcG9zYWJsZSA9IHNvbHV0aW9uICYmIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5oYXMoc29sdXRpb24pICYmIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5nZXQoc29sdXRpb24pO1xuICAgICAgICBpZiAocmVmQ291bnREaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICByZWZDb3VudERpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgaWYgKCFyZWZDb3VudERpc3Bvc2FibGUuaXNEaXNwb3NlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc29sdXRpb24pIHtcbiAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuZ2V0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgIGlmIChkaXNwb3NhYmxlKVxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldFNvbHV0aW9uRm9yUGF0aChwYXRoKSB7XG4gICAgICAgIGlmICghcGF0aClcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIGNvbnN0IGlzRm9sZGVyUGVyRmlsZSA9IF8uc29tZSh0aGlzLl9fc3BlY2lhbENhc2VFeHRlbnNpb25zLCBleHQgPT4gXy5lbmRzV2l0aChwYXRoLCBleHQpKTtcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSBwYXRoO1xuICAgICAgICBpZiAoIWxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNvbHV0aW9uVmFsdWUgPSB0aGlzLl9nZXRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpO1xuICAgICAgICBpZiAoc29sdXRpb25WYWx1ZSlcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uVmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSk7XG4gICAgfVxuICAgIGdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKS5maWx0ZXIoKCkgPT4gIWVkaXRvci5pc0Rlc3Ryb3llZCgpKTtcbiAgICB9XG4gICAgX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yLCBzb2x1dGlvbikge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gbmV3IE9tbmlzaGFycEVkaXRvckNvbnRleHQoZWRpdG9yLCBzb2x1dGlvbik7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGVkaXRvcjtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoY29udGV4dCk7XG4gICAgICAgIGlmIChzb2x1dGlvbiAmJiAhY29udGV4dC50ZW1wICYmIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5oYXMoc29sdXRpb24pKSB7XG4gICAgICAgICAgICBjb25zdCByZWZDb3VudERpc3Bvc2FibGUgPSB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuZ2V0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSByZWZDb3VudERpc3Bvc2FibGUuZ2V0RGlzcG9zYWJsZSgpO1xuICAgICAgICAgICAgY29udGV4dC50ZW1wID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRleHQuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlU29sdXRpb24oc29sdXRpb24ucGF0aCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgX2dldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcikge1xuICAgICAgICBpZiAoIWVkaXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IGVkaXRvci5nZXRQYXRoKCk7XG4gICAgICAgIGlmICghbG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICBpZiAoZWRpdG9yLm9tbmlzaGFycC5tZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBzb2x1dGlvbiA9IGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb247XG4gICAgICAgICAgICBpZiAoc29sdXRpb24uY3VycmVudFN0YXRlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQgJiYgYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZVwiKSlcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5jb25uZWN0KCk7XG4gICAgICAgICAgICBpZiAoc29sdXRpb24uY3VycmVudFN0YXRlID09PSBEcml2ZXJTdGF0ZS5FcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaXNGb2xkZXJQZXJGaWxlID0gXy5zb21lKHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKGVkaXRvci5nZXRQYXRoKCksIGV4dCkpO1xuICAgICAgICBjb25zdCBzb2x1dGlvbiA9IHRoaXMuX2dldFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSk7XG4gICAgICAgIGlmIChzb2x1dGlvbikge1xuICAgICAgICAgICAgdGhpcy5fc2V0dXBFZGl0b3JXaXRoQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSlcbiAgICAgICAgICAgIC5kbygoc2xuKSA9PiB0aGlzLl9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvciwgc2xuKSk7XG4gICAgfVxuICAgIF9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCBjYikge1xuICAgICAgICBmb3IgKGNvbnN0IHNvbHV0aW9uIG9mIHRoaXMuX2FjdGl2ZVNvbHV0aW9ucykge1xuICAgICAgICAgICAgaWYgKHNvbHV0aW9uLmlzRm9sZGVyUGVyRmlsZSlcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gc29sdXRpb24ubW9kZWwucHJvamVjdHMubWFwKHogPT4gei5wYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdCA9IHRoaXMuX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb24sIHBhdGhzKTtcbiAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IoaW50ZXJzZWN0LCBzb2x1dGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2dldFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSkge1xuICAgICAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRm9sZGVyUGVyRmlsZSkge1xuICAgICAgICAgICAgY29uc3QgZGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lKGxvY2F0aW9uKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zb2x1dGlvbnMuaGFzKGRpcmVjdG9yeSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvbHV0aW9ucy5nZXQoZGlyZWN0b3J5KTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gdGhpcy5faW50ZXJzZWN0UGF0aChsb2NhdGlvbik7XG4gICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvbHV0aW9ucy5nZXQoaW50ZXJzZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIChpbnRlcnNlY3QsIHNvbHV0aW9uKSA9PiBzb2x1dGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIF9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGguZGlybmFtZShsb2NhdGlvbik7XG4gICAgICAgIGlmICghdGhpcy5fYWN0aXZhdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmF0ZWRTdWJqZWN0LnRha2UoMSlcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBsb2NhdGlvbi5zcGxpdChwYXRoLnNlcCk7XG4gICAgICAgIGNvbnN0IG1hcHBlZExvY2F0aW9ucyA9IHNlZ21lbnRzLm1hcCgobG9jLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIF8udGFrZShzZWdtZW50cywgaW5kZXggKyAxKS5qb2luKHBhdGguc2VwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAobGV0IGwgb2YgbWFwcGVkTG9jYXRpb25zKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuaGFzKGwpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmdldChsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdWJqZWN0ID0gbmV3IEFzeW5jU3ViamVjdCgpO1xuICAgICAgICBfLmVhY2gobWFwcGVkTG9jYXRpb25zLCBsID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLnNldChsLCBzdWJqZWN0KTtcbiAgICAgICAgICAgIHN1YmplY3Quc3Vic2NyaWJlKHsgY29tcGxldGU6ICgpID0+IHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmRlbGV0ZShsKSB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHByb2plY3QgPSB0aGlzLl9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgoZGlyZWN0b3J5KTtcbiAgICAgICAgY29uc3QgY2IgPSAoY2FuZGlkYXRlcykgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9hY3RpdmF0ZWQpIHtcbiAgICAgICAgICAgICAgICBfLmRlbGF5KGNiLCBTT0xVVElPTl9MT0FEX1RJTUUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgciA9IHRoaXMuX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIChpbnRlcnNlY3QsIHNvbHV0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dChzb2x1dGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNlYXJjaC50aGVuKCgpID0+IE9ic2VydmFibGUuZnJvbShjYW5kaWRhdGVzKVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4gdGhpcy5fZmluZFJlcG9zaXRvcnlGb3JQYXRoKHgucGF0aCksIChjYW5kaWRhdGUsIHJlcG8pID0+ICh7IGNhbmRpZGF0ZSwgcmVwbyB9KSlcbiAgICAgICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAgICAgLnRvUHJvbWlzZSgpKVxuICAgICAgICAgICAgICAgIC50aGVuKHJlcG9zID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdDYW5kaWRhdGVzID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMubWFwKHogPT4gei5wYXRoKSwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5rZXlzKCkpKS5tYXAoeiA9PiBfLmZpbmQoY2FuZGlkYXRlcywgeyBwYXRoOiB6IH0pKVxuICAgICAgICAgICAgICAgICAgICAubWFwKCh7IHBhdGgsIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQocmVwb3MsIHggPT4geC5jYW5kaWRhdGUucGF0aCA9PT0gcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcG8gPSBmb3VuZCAmJiBmb3VuZC5yZXBvO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBwYXRoLCBpc1Byb2plY3QsIHJlcG8sIG9yaWdpbmFsRmlsZSB9O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFkZENhbmRpZGF0ZXNJbk9yZGVyKG5ld0NhbmRpZGF0ZXMsIChjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3Jhcnk6ICFwcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dChzb2x1dGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdCA9IHRoaXMuX2ludGVyc2VjdFBhdGgobG9jYXRpb24pIHx8IHRoaXMuX2ludGVyc2VjdEF0b21Qcm9qZWN0UGF0aChsb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zb2x1dGlvbnMuaGFzKGludGVyc2VjdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQodGhpcy5fc29sdXRpb25zLmdldChpbnRlcnNlY3QpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKGBDb3VsZCBub3QgZmluZCBhIHNvbHV0aW9uIGZvciBcIiR7bG9jYXRpb259XCJgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fY2FuZGlkYXRlRmluZGVyKGRpcmVjdG9yeSkuc3Vic2NyaWJlKGNiKTtcbiAgICAgICAgcmV0dXJuIHN1YmplY3Q7XG4gICAgfVxuICAgIF9jYW5kaWRhdGVGaW5kZXIoZGlyZWN0b3J5KSB7XG4gICAgICAgIHJldHVybiBmaW5kQ2FuZGlkYXRlcy53aXRoQ2FuZGlkYXRlcyhkaXJlY3RvcnksIHRoaXMubG9nZ2VyLCB7XG4gICAgICAgICAgICBzb2x1dGlvbkluZGVwZW5kZW50U291cmNlRmlsZXNUb1NlYXJjaDogdGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucy5tYXAoeiA9PiBcIipcIiArIHopXG4gICAgICAgIH0pXG4gICAgICAgICAgICAuZmxhdE1hcChjYW5kaWRhdGVzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNsbnMgPSBfLmZpbHRlcihjYW5kaWRhdGVzLCB4ID0+IF8uZW5kc1dpdGgoeC5wYXRoLCBcIi5zbG5cIikpO1xuICAgICAgICAgICAgaWYgKHNsbnMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMsIHNsbnMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzeW5jUmVzdWx0ID0gbmV3IEFzeW5jU3ViamVjdCgpO1xuICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0Lm5leHQoaXRlbXMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpc3RWaWV3ID0gbmV3IEdlbmVyaWNTZWxlY3RMaXN0VmlldyhcIlwiLCBzbG5zLm1hcCh4ID0+ICh7IGRpc3BsYXlOYW1lOiB4LnBhdGgsIG5hbWU6IHgucGF0aCB9KSksIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdCguLi5zbG5zLmZpbHRlcih4ID0+IHgucGF0aCA9PT0gcmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgICAgIF8uZWFjaChjYW5kaWRhdGVzLCB4ID0+IHRoaXMuX2NhbmRpZGF0ZUZpbmRlckNhY2hlLmFkZCh4LnBhdGgpKTtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbGlzdFZpZXcubWVzc2FnZS50ZXh0KFwiUGxlYXNlIHNlbGVjdCBhIHNvbHV0aW9uIHRvIGxvYWQuXCIpO1xuICAgICAgICAgICAgICAgIGlmIChvcGVuU2VsZWN0TGlzdCkge1xuICAgICAgICAgICAgICAgICAgICBvcGVuU2VsZWN0TGlzdC5vbkNsb3NlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLnNvbWUoc2xucywgeCA9PiB0aGlzLl9jYW5kaWRhdGVGaW5kZXJDYWNoZS5oYXMoeC5wYXRoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmRlZmVyKCgpID0+IGxpc3RWaWV3LnRvZ2dsZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgXy5kZWZlcigoKSA9PiBsaXN0Vmlldy50b2dnbGUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmRvKHsgY29tcGxldGU6ICgpID0+IG9wZW5TZWxlY3RMaXN0ID0gbnVsbCB9KTtcbiAgICAgICAgICAgICAgICBvcGVuU2VsZWN0TGlzdCA9IGxpc3RWaWV3O1xuICAgICAgICAgICAgICAgIHJldHVybiBhc3luY1Jlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGNhbmRpZGF0ZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVnaXN0ZXJDb25maWd1cmF0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyYXRpb25zLmFkZChjYWxsYmFjayk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5mb3JFYWNoKHNvbHV0aW9uID0+IGNhbGxiYWNrKHNvbHV0aW9uKSk7XG4gICAgfVxuICAgIF9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uLCBwYXRocykge1xuICAgICAgICBjb25zdCB2YWxpZFNvbHV0aW9uUGF0aHMgPSBwYXRocztcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBsb2NhdGlvbi5zcGxpdChwYXRoLnNlcCk7XG4gICAgICAgIGNvbnN0IG1hcHBlZExvY2F0aW9ucyA9IHNlZ21lbnRzLm1hcCgobG9jLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIF8udGFrZShzZWdtZW50cywgaW5kZXggKyAxKS5qb2luKHBhdGguc2VwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG1hcHBlZExvY2F0aW9ucy5yZXZlcnNlKCk7XG4gICAgICAgIGNvbnN0IGludGVyc2VjdCA9IF8uaW50ZXJzZWN0aW9uKG1hcHBlZExvY2F0aW9ucywgdmFsaWRTb2x1dGlvblBhdGhzKVswXTtcbiAgICAgICAgaWYgKGludGVyc2VjdCkge1xuICAgICAgICAgICAgcmV0dXJuIGludGVyc2VjdDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfaW50ZXJzZWN0UGF0aChsb2NhdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5lbnRyaWVzKCkpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXpbMV0uaXNGb2xkZXJQZXJGaWxlKS5tYXAoeiA9PiB6WzBdKSk7XG4gICAgfVxuICAgIF9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgobG9jYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb24sIHRoaXMuX2F0b21Qcm9qZWN0cy5wYXRocyk7XG4gICAgfVxufVxuZnVuY3Rpb24gYWRkQ2FuZGlkYXRlc0luT3JkZXIoY2FuZGlkYXRlcywgY2IpIHtcbiAgICBjb25zdCBhc3luY1N1YmplY3QgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgaWYgKCFjYW5kaWRhdGVzLmxlbmd0aCkge1xuICAgICAgICBhc3luY1N1YmplY3QubmV4dChjYW5kaWRhdGVzKTtcbiAgICAgICAgYXN5bmNTdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICAgIHJldHVybiBhc3luY1N1YmplY3QudG9Qcm9taXNlKCk7XG4gICAgfVxuICAgIGNvbnN0IGNkcyA9IGNhbmRpZGF0ZXMuc2xpY2UoKTtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBjZHMuc2hpZnQoKTtcbiAgICBjb25zdCBoYW5kbGVDYW5kaWRhdGUgPSAoY2FuZCkgPT4ge1xuICAgICAgICBjYihjYW5kLnBhdGgsIGNhbmQucmVwbywgY2FuZC5pc1Byb2plY3QsIGNhbmQub3JpZ2luYWxGaWxlKVxuICAgICAgICAgICAgLnN1YnNjcmliZSh7XG4gICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbmQgPSBjZHMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlQ2FuZGlkYXRlKGNhbmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmNTdWJqZWN0Lm5leHQoY2FuZGlkYXRlcyk7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jU3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBoYW5kbGVDYW5kaWRhdGUoY2FuZGlkYXRlKTtcbiAgICByZXR1cm4gYXN5bmNTdWJqZWN0LnRvUHJvbWlzZSgpO1xufVxuZnVuY3Rpb24gZnJvbUl0ZXJhdG9yKGl0ZXJhdG9yKSB7XG4gICAgY29uc3QgaXRlbXMgPSBbXTtcbiAgICBsZXQgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgIHdoaWxlICghcmVzdWx0LmRvbmUpIHtcbiAgICAgICAgaXRlbXMucHVzaChyZXN1bHQudmFsdWUpO1xuICAgICAgICByZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgfVxuICAgIHJldHVybiBpdGVtcztcbn1cbmV4cG9ydCBjb25zdCBTb2x1dGlvbk1hbmFnZXIgPSBuZXcgU29sdXRpb25JbnN0YW5jZU1hbmFnZXIoKTtcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIEFzeW5jU3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0LCBTY2hlZHVsZXIsIFN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7UmVmQ291bnREaXNwb3NhYmxlLCBJRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtTb2x1dGlvbn0gZnJvbSBcIi4vc29sdXRpb25cIjtcclxuaW1wb3J0IHtBdG9tUHJvamVjdFRyYWNrZXJ9IGZyb20gXCIuL2F0b20tcHJvamVjdHNcIjtcclxuaW1wb3J0IHtTb2x1dGlvbk9ic2VydmVyLCBTb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyfSBmcm9tIFwiLi9jb21wb3NpdGUtc29sdXRpb25cIjtcclxuaW1wb3J0IHtEcml2ZXJTdGF0ZSwgZmluZENhbmRpZGF0ZXMsIFJ1bnRpbWUsIENhbmRpZGF0ZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtHZW5lcmljU2VsZWN0TGlzdFZpZXd9IGZyb20gXCIuLi92aWV3cy9nZW5lcmljLWxpc3Qtdmlld1wiO1xyXG5pbXBvcnQge09tbmlzaGFycFRleHRFZGl0b3IsIGlzT21uaXNoYXJwVGV4dEVkaXRvciwgT21uaXNoYXJwRWRpdG9yQ29udGV4dH0gZnJvbSBcIi4vb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XHJcblxyXG50eXBlIEFTWU5DX1JFUE9TSVRPUlkgPSB7IGdldFdvcmtpbmdEaXJlY3RvcnkoKTogUHJvbWlzZTxzdHJpbmc+OyB9O1xyXG50eXBlIFJFUE9TSVRPUlkgPSB7IGFzeW5jOiBBU1lOQ19SRVBPU0lUT1JZOyB9O1xyXG5jb25zdCBTT0xVVElPTl9MT0FEX1RJTUUgPSAzMDAwMDtcclxuXHJcbmxldCBvcGVuU2VsZWN0TGlzdDogR2VuZXJpY1NlbGVjdExpc3RWaWV3O1xyXG5jbGFzcyBTb2x1dGlvbkluc3RhbmNlTWFuYWdlciB7XHJcbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbiAgICBwdWJsaWMgX3VuaXRUZXN0TW9kZV8gPSBmYWxzZTtcclxuICAgIHB1YmxpYyBfa2lja19pbl90aGVfcGFudHNfID0gZmFsc2U7XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgbG9nZ2VyKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl91bml0VGVzdE1vZGVfIHx8IHRoaXMuX2tpY2tfaW5fdGhlX3BhbnRzXykge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgbG9nOiAoKSA9PiB7LyogKi8gfSxcclxuICAgICAgICAgICAgICAgIGVycm9yOiAoKSA9PiB7LyogKi8gfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNvbnNvbGU7XHJcbiAgICB9XHJcbiAgICAvKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9zb2x1dGlvbkRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBwcml2YXRlIF9hdG9tUHJvamVjdHM6IEF0b21Qcm9qZWN0VHJhY2tlcjtcclxuXHJcbiAgICBwcml2YXRlIF9jb25maWd1cmF0aW9ucyA9IG5ldyBTZXQ8KHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gdm9pZD4oKTtcclxuICAgIHByaXZhdGUgX3NvbHV0aW9ucyA9IG5ldyBNYXA8c3RyaW5nLCBTb2x1dGlvbj4oKTtcclxuICAgIHByaXZhdGUgX3NvbHV0aW9uUHJvamVjdHMgPSBuZXcgTWFwPHN0cmluZywgU29sdXRpb24+KCk7XHJcbiAgICBwcml2YXRlIF90ZW1wb3JhcnlTb2x1dGlvbnMgPSBuZXcgV2Vha01hcDxTb2x1dGlvbiwgUmVmQ291bnREaXNwb3NhYmxlPigpO1xyXG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZVNvbHV0aW9uTWFwID0gbmV3IFdlYWtNYXA8U29sdXRpb24sIElEaXNwb3NhYmxlPigpO1xyXG4gICAgcHJpdmF0ZSBfZmluZFNvbHV0aW9uQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgT2JzZXJ2YWJsZTxTb2x1dGlvbj4+KCk7XHJcbiAgICBwcml2YXRlIF9jYW5kaWRhdGVGaW5kZXJDYWNoZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2YXRlZCA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBfbmV4dEluZGV4ID0gMDtcclxuICAgIHByaXZhdGUgX2FjdGl2ZVNlYXJjaDogUHJvbWlzZTxhbnk+O1xyXG5cclxuICAgIC8vIFRoZXNlIGV4dGVuc2lvbnMgb25seSBzdXBwb3J0IHNlcnZlciBwZXIgZm9sZGVyLCB1bmxpa2Ugbm9ybWFsIGNzIGZpbGVzLlxyXG4gICAgcHJpdmF0ZSBfc3BlY2lhbENhc2VFeHRlbnNpb25zID0gW1wiLmNzeFwiLCAvKlwiLmNha2VcIiovXTtcclxuICAgIHB1YmxpYyBnZXQgX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMoKSB7IHJldHVybiB0aGlzLl9zcGVjaWFsQ2FzZUV4dGVuc2lvbnM7IH1cclxuXHJcbiAgICBwcml2YXRlIF9hY3RpdmVTb2x1dGlvbnM6IFNvbHV0aW9uW10gPSBbXTtcclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlU29sdXRpb25zKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVTb2x1dGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdGhpcyBzb2x1dGlvbiBjYW4gYmUgdXNlZCB0byBvYnNlcnZlIGJlaGF2aW9yIGFjcm9zcyBhbGwgc29sdXRpb24uXHJcbiAgICBwcml2YXRlIF9vYnNlcnZhdGlvbiA9IG5ldyBTb2x1dGlvbk9ic2VydmVyKCk7XHJcbiAgICBwdWJsaWMgZ2V0IHNvbHV0aW9uT2JzZXJ2ZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX29ic2VydmF0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRoaXMgc29sdXRpb24gY2FuIGJlIHVzZWQgdG8gYWdncmVnYXRlIGJlaGF2aW9yIGFjcm9zcyBhbGwgc29sdXRpb25zXHJcbiAgICBwcml2YXRlIF9jb21iaW5hdGlvbiA9IG5ldyBTb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyKCk7XHJcbiAgICBwdWJsaWMgZ2V0IHNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbWJpbmF0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2ZVNvbHV0aW9uID0gbmV3IEJlaGF2aW9yU3ViamVjdDxTb2x1dGlvbj4obnVsbCk7XHJcbiAgICBwcml2YXRlIF9hY3RpdmVTb2x1dGlvbk9ic2VyYWJsZSA9IHRoaXMuX2FjdGl2ZVNvbHV0aW9uLmRpc3RpbmN0VW50aWxDaGFuZ2VkKCkuZmlsdGVyKHogPT4gISF6KS5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZVNvbHV0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVTb2x1dGlvbk9ic2VyYWJsZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hY3RpdmF0ZWRTdWJqZWN0ID0gbmV3IFN1YmplY3Q8Ym9vbGVhbj4oKTtcclxuICAgIHByaXZhdGUgZ2V0IGFjdGl2YXRlZFN1YmplY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2YXRlZFN1YmplY3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKGFjdGl2ZUVkaXRvcjogT2JzZXJ2YWJsZTxPbW5pc2hhcnBUZXh0RWRpdG9yPikge1xyXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmF0ZWQpIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLl9hdG9tUHJvamVjdHMgPSBuZXcgQXRvbVByb2plY3RUcmFja2VyKCk7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fYXRvbVByb2plY3RzKTtcclxuXHJcbiAgICAgICAgdGhpcy5fYWN0aXZlU2VhcmNoID0gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcblxyXG4gICAgICAgIC8vIG1vbml0b3IgYXRvbSBwcm9qZWN0IHBhdGhzXHJcbiAgICAgICAgdGhpcy5fc3Vic2NyaWJlVG9BdG9tUHJvamVjdFRyYWNrZXIoKTtcclxuXHJcbiAgICAgICAgLy8gV2UgdXNlIHRoZSBhY3RpdmUgZWRpdG9yIG9uIG9tbmlzaGFycEF0b20gdG9cclxuICAgICAgICAvLyBjcmVhdGUgYW5vdGhlciBvYnNlcnZhYmxlIHRoYXQgY2huYWdlcyB3aGVuIHdlIGdldCBhIG5ldyBzb2x1dGlvbi5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhY3RpdmVFZGl0b3JcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcclxuICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB0aGlzLmdldFNvbHV0aW9uRm9yRWRpdG9yKHopKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHggPT4gdGhpcy5fYWN0aXZlU29sdXRpb24ubmV4dCh4KSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9hdG9tUHJvamVjdHMuYWN0aXZhdGUoKTtcclxuICAgICAgICB0aGlzLl9hY3RpdmF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuYWN0aXZhdGVkU3ViamVjdC5uZXh0KHRydWUpO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbm5lY3QoKSB7XHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLmZvckVhY2goc29sdXRpb24gPT4gc29sdXRpb24uY29ubmVjdCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzY29ubmVjdCgpIHtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBzb2x1dGlvbi5kaXNwb3NlKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xyXG5cclxuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuY2xlYXIoKTtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvblByb2plY3RzLmNsZWFyKCk7XHJcbiAgICAgICAgdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuY2xlYXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGNvbm5lY3RlZCgpIHtcclxuICAgICAgICBjb25zdCBpdGVyYXRvciA9IHRoaXMuX3NvbHV0aW9ucy52YWx1ZXMoKTtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XHJcbiAgICAgICAgd2hpbGUgKCFyZXN1bHQuZG9uZSlcclxuICAgICAgICAgICAgaWYgKHJlc3VsdC52YWx1ZS5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZClcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zdWJzY3JpYmVUb0F0b21Qcm9qZWN0VHJhY2tlcigpIHtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMucmVtb3ZlZFxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gdGhpcy5fc29sdXRpb25zLmhhcyh6KSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3JlbW92ZVNvbHV0aW9uKHByb2plY3QpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX2F0b21Qcm9qZWN0cy5hZGRlZFxyXG4gICAgICAgICAgICAuZmlsdGVyKHByb2plY3QgPT4gIXRoaXMuX3NvbHV0aW9uUHJvamVjdHMuaGFzKHByb2plY3QpKVxyXG4gICAgICAgICAgICAubWFwKHByb2plY3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhbmRpZGF0ZUZpbmRlcihwcm9qZWN0KVxyXG4gICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKGNhbmRpZGF0ZXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKGNhbmRpZGF0ZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCh4ID0+IHRoaXMuX2ZpbmRSZXBvc2l0b3J5Rm9yUGF0aCh4LnBhdGgpLCAoY2FuZGlkYXRlLCByZXBvKSA9PiAoeyBjYW5kaWRhdGUsIHJlcG8gfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG9BcnJheSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG9Qcm9taXNlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKHJlcG9zID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdDYW5kaWRhdGVzID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMubWFwKHogPT4gei5wYXRoKSwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5rZXlzKCkpKS5tYXAoeiA9PiBfLmZpbmQoY2FuZGlkYXRlcywgeyBwYXRoOiB6IH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKCh7IHBhdGgsIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHJlcG9zLCB4ID0+IHguY2FuZGlkYXRlLnBhdGggPT09IHBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbyA9IGZvdW5kICYmIGZvdW5kLnJlcG87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBwYXRoLCBpc1Byb2plY3QsIHJlcG8sIG9yaWdpbmFsRmlsZSB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWRkQ2FuZGlkYXRlc0luT3JkZXIobmV3Q2FuZGlkYXRlcywgKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCBvcmlnaW5hbEZpbGUpID0+IHRoaXMuX2FkZFNvbHV0aW9uKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCB7IG9yaWdpbmFsRmlsZSwgcHJvamVjdCB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KS50b1Byb21pc2UoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZShjYW5kaWRhdGVPYnNlcnZhYmxlID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNlYXJjaCA9IHRoaXMuX2FjdGl2ZVNlYXJjaC50aGVuKCgpID0+IGNhbmRpZGF0ZU9ic2VydmFibGUpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZmluZFJlcG9zaXRvcnlGb3JQYXRoKHdvcmtpbmdQYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tPFJFUE9TSVRPUlk+KGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKSB8fCBbXSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheClcclxuICAgICAgICAgICAgLmZsYXRNYXAocmVwbyA9PiByZXBvLmFzeW5jLmdldFdvcmtpbmdEaXJlY3RvcnkoKSwgKHJlcG8sIGRpcmVjdG9yeSkgPT4gKHsgcmVwbywgZGlyZWN0b3J5IH0pKVxyXG4gICAgICAgICAgICAuZmlsdGVyKCh7ZGlyZWN0b3J5fSkgPT4gcGF0aC5ub3JtYWxpemUoZGlyZWN0b3J5KSA9PT0gcGF0aC5ub3JtYWxpemUod29ya2luZ1BhdGgpKVxyXG4gICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAubWFwKHggPT4geC5yZXBvLmFzeW5jKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hZGRTb2x1dGlvbihjYW5kaWRhdGU6IHN0cmluZywgcmVwbzogQVNZTkNfUkVQT1NJVE9SWSwgaXNQcm9qZWN0OiBib29sZWFuLCB7dGVtcG9yYXJ5ID0gZmFsc2UsIHByb2plY3QsIG9yaWdpbmFsRmlsZX06IHsgZGVsYXk/OiBudW1iZXI7IHRlbXBvcmFyeT86IGJvb2xlYW47IHByb2plY3Q/OiBzdHJpbmc7IG9yaWdpbmFsRmlsZT86IHN0cmluZzsgfSkge1xyXG4gICAgICAgIGNvbnN0IHByb2plY3RQYXRoID0gY2FuZGlkYXRlO1xyXG4gICAgICAgIGlmIChfLmVuZHNXaXRoKGNhbmRpZGF0ZSwgXCIuc2xuXCIpKSB7XHJcbiAgICAgICAgICAgIGNhbmRpZGF0ZSA9IHBhdGguZGlybmFtZShjYW5kaWRhdGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHNvbHV0aW9uOiBTb2x1dGlvbjtcclxuICAgICAgICBpZiAodGhpcy5fc29sdXRpb25zLmhhcyhjYW5kaWRhdGUpKSB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uID0gdGhpcy5fc29sdXRpb25zLmdldChjYW5kaWRhdGUpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocHJvamVjdCAmJiB0aGlzLl9zb2x1dGlvblByb2plY3RzLmhhcyhwcm9qZWN0KSkge1xyXG4gICAgICAgICAgICBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuZ2V0KHByb2plY3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uICYmICFzb2x1dGlvbi5pc0Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNvbHV0aW9uICYmIHNvbHV0aW9uLmlzRGlzcG9zZWQpIHtcclxuICAgICAgICAgICAgY29uc3QgZGlzcG9zZXIgPSB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuZ2V0KHNvbHV0aW9uKTtcclxuICAgICAgICAgICAgZGlzcG9zZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc29sdXRpb24gPSBuZXcgU29sdXRpb24oe1xyXG4gICAgICAgICAgICBwcm9qZWN0UGF0aDogcHJvamVjdFBhdGgsXHJcbiAgICAgICAgICAgIGluZGV4OiArK3RoaXMuX25leHRJbmRleCxcclxuICAgICAgICAgICAgdGVtcG9yYXJ5OiB0ZW1wb3JhcnksXHJcbiAgICAgICAgICAgIHJlcG9zaXRvcnk6IDxhbnk+cmVwbyxcclxuICAgICAgICAgICAgcnVudGltZTogXy5lbmRzV2l0aChvcmlnaW5hbEZpbGUsIFwiLmNzeFwiKSA/IFJ1bnRpbWUuQ2xyT3JNb25vIDogUnVudGltZS5Db3JlQ2xyXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICghaXNQcm9qZWN0KSB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uLmlzRm9sZGVyUGVyRmlsZSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQoc29sdXRpb24pO1xyXG4gICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuc2V0KHNvbHV0aW9uLCBjZCk7XHJcblxyXG4gICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgc29sdXRpb24uY29ubmVjdCA9ICgpID0+IHRoaXMuX2FkZFNvbHV0aW9uKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCB7IHRlbXBvcmFyeSwgcHJvamVjdCB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICBfLnB1bGwodGhpcy5fYWN0aXZlU29sdXRpb25zLCBzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9ucy5kZWxldGUoY2FuZGlkYXRlKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuaGFzKHNvbHV0aW9uKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmRlbGV0ZShzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9hY3RpdmVTb2x1dGlvbi5nZXRWYWx1ZSgpID09PSBzb2x1dGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb24ubmV4dCh0aGlzLl9hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID8gdGhpcy5fYWN0aXZlU29sdXRpb25zWzBdIDogbnVsbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyYXRpb25zLmZvckVhY2goY29uZmlnID0+IGNvbmZpZyhzb2x1dGlvbikpO1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5zZXQoY2FuZGlkYXRlLCBzb2x1dGlvbik7XHJcblxyXG4gICAgICAgIC8vIGtlZXAgdHJhY2sgb2YgdGhlIGFjdGl2ZSBzb2x1dGlvbnNcclxuICAgICAgICBjZC5hZGQodGhpcy5fb2JzZXJ2YXRpb24uYWRkKHNvbHV0aW9uKSk7XHJcbiAgICAgICAgY2QuYWRkKHRoaXMuX2NvbWJpbmF0aW9uLmFkZChzb2x1dGlvbikpO1xyXG5cclxuICAgICAgICBpZiAodGVtcG9yYXJ5KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRlbXBEID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4geyAvKiAqLyB9KTtcclxuICAgICAgICAgICAgdGVtcEQuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuc2V0KHNvbHV0aW9uLCBuZXcgUmVmQ291bnREaXNwb3NhYmxlKHRlbXBEKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbnMucHVzaChzb2x1dGlvbik7XHJcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZVNvbHV0aW9ucy5sZW5ndGggPT09IDEpXHJcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQoc29sdXRpb24pO1xyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9hZGRTb2x1dGlvblN1YnNjcmlwdGlvbnMoc29sdXRpb24sIGNkKTtcclxuICAgICAgICBzb2x1dGlvbi5jb25uZWN0KCk7XHJcbiAgICAgICAgcmV0dXJuIDxPYnNlcnZhYmxlPFNvbHV0aW9uPj48YW55PnJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hZGRTb2x1dGlvblN1YnNjcmlwdGlvbnMoc29sdXRpb246IFNvbHV0aW9uLCBjZDogQ29tcG9zaXRlRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBBc3luY1N1YmplY3Q8U29sdXRpb24+KCk7XHJcbiAgICAgICAgY29uc3QgZXJyb3JSZXN1bHQgPSBzb2x1dGlvbi5zdGF0ZVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuRXJyb3IpXHJcbiAgICAgICAgICAgIC5kZWxheSgxMDApXHJcbiAgICAgICAgICAgIC50YWtlKDEpO1xyXG5cclxuICAgICAgICBjZC5hZGQoZXJyb3JSZXN1bHQuc3Vic2NyaWJlKCgpID0+IHJlc3VsdC5jb21wbGV0ZSgpKSk7IC8vIElmIHRoaXMgc29sdXRpb24gZXJyb3JzIG1vdmUgb24gdG8gdGhlIG5leHRcclxuXHJcbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdEFkZGVkLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuc2V0KHByb2plY3QucGF0aCwgc29sdXRpb24pKSk7XHJcbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdFJlbW92ZWQuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5kZWxldGUocHJvamVjdC5wYXRoKSkpO1xyXG5cclxuICAgICAgICAvLyBXYWl0IGZvciB0aGUgcHJvamVjdHMgdG8gcmV0dXJuIGZyb20gdGhlIHNvbHV0aW9uXHJcbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdHNcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDApXHJcbiAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgIC5tYXAoKCkgPT4gc29sdXRpb24pXHJcbiAgICAgICAgICAgIC50aW1lb3V0KFNPTFVUSU9OX0xPQURfVElNRSwgU2NoZWR1bGVyLnF1ZXVlKSAvLyBXYWl0IDMwIHNlY29uZHMgZm9yIHRoZSBwcm9qZWN0IHRvIGxvYWQuXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gV2UgbG9hZGVkIHN1Y2Nlc3NmdWxseSByZXR1cm4gdGhlIHNvbHV0aW9uXHJcbiAgICAgICAgICAgICAgICByZXN1bHQubmV4dChzb2x1dGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gTW92ZSBhbG9uZy5cclxuICAgICAgICAgICAgICAgIHJlc3VsdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfcmVtb3ZlU29sdXRpb24oY2FuZGlkYXRlOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoXy5lbmRzV2l0aChjYW5kaWRhdGUsIFwiLnNsblwiKSkge1xyXG4gICAgICAgICAgICBjYW5kaWRhdGUgPSBwYXRoLmRpcm5hbWUoY2FuZGlkYXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNvbHV0aW9uID0gdGhpcy5fc29sdXRpb25zLmdldChjYW5kaWRhdGUpO1xyXG5cclxuICAgICAgICBjb25zdCByZWZDb3VudERpc3Bvc2FibGUgPSBzb2x1dGlvbiAmJiB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuaGFzKHNvbHV0aW9uKSAmJiB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuZ2V0KHNvbHV0aW9uKTtcclxuICAgICAgICBpZiAocmVmQ291bnREaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgIHJlZkNvdW50RGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIGlmICghcmVmQ291bnREaXNwb3NhYmxlLmlzRGlzcG9zZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8ga2VlcCB0cmFjayBvZiB0aGUgcmVtb3ZlZCBzb2x1dGlvbnNcclxuICAgICAgICBpZiAoc29sdXRpb24pIHtcclxuICAgICAgICAgICAgc29sdXRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLmdldChzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIGlmIChkaXNwb3NhYmxlKSBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFNvbHV0aW9uRm9yUGF0aChwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoIXBhdGgpXHJcbiAgICAgICAgICAgIC8vIE5vIHRleHQgZWRpdG9yIGZvdW5kXHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG5cclxuICAgICAgICBjb25zdCBpc0ZvbGRlclBlckZpbGUgPSBfLnNvbWUodGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgocGF0aCwgZXh0KSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gcGF0aDtcclxuICAgICAgICBpZiAoIWxvY2F0aW9uKSB7XHJcbiAgICAgICAgICAgIC8vIFRleHQgZWRpdG9yIG5vdCBzYXZlZCB5ZXQ/XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc29sdXRpb25WYWx1ZSA9IHRoaXMuX2dldFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSk7XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvblZhbHVlKVxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvblZhbHVlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpLmZpbHRlcigoKSA9PiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIHNvbHV0aW9uOiBTb2x1dGlvbikge1xyXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgT21uaXNoYXJwRWRpdG9yQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKTtcclxuICAgICAgICBjb25zdCByZXN1bHQ6IE9tbmlzaGFycFRleHRFZGl0b3IgPSA8YW55PmVkaXRvcjtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChjb250ZXh0KTtcclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uICYmICFjb250ZXh0LnRlbXAgJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVmQ291bnREaXNwb3NhYmxlID0gdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmdldChzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSByZWZDb3VudERpc3Bvc2FibGUuZ2V0RGlzcG9zYWJsZSgpO1xyXG4gICAgICAgICAgICBjb250ZXh0LnRlbXAgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb250ZXh0LnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVTb2x1dGlvbihzb2x1dGlvbi5wYXRoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIGlmICghZWRpdG9yKSB7XHJcbiAgICAgICAgICAgIC8vIE5vIHRleHQgZWRpdG9yIGZvdW5kXHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSBlZGl0b3IuZ2V0UGF0aCgpO1xyXG4gICAgICAgIGlmICghbG9jYXRpb24pIHtcclxuICAgICAgICAgICAgLy8gVGV4dCBlZGl0b3Igbm90IHNhdmVkIHlldD9cclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8U29sdXRpb24+KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcclxuICAgICAgICAgICAgaWYgKGVkaXRvci5vbW5pc2hhcnAubWV0YWRhdGEpIHtcclxuICAgICAgICAgICAgICAgIC8vIGNsaWVudCAvIHNlcnZlciBkb2VzblwidCB3b3JrIGN1cnJlbnRseSBmb3IgbWV0YWRhdGEgZG9jdW1lbnRzLlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8U29sdXRpb24+KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uID0gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbjtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIHRoZSBzb2x1dGlvbiBoYXMgZGlzY29ubmVjdGVkLCByZWNvbm5lY3QgaXRcclxuICAgICAgICAgICAgaWYgKHNvbHV0aW9uLmN1cnJlbnRTdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkICYmIGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLmF1dG9TdGFydE9uQ29tcGF0aWJsZUZpbGVcIikpXHJcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5jb25uZWN0KCk7XHJcblxyXG4gICAgICAgICAgICAvLyBDbGllbnQgaXMgaW4gYW4gaW52YWxpZCBzdGF0ZVxyXG4gICAgICAgICAgICBpZiAoc29sdXRpb24uY3VycmVudFN0YXRlID09PSBEcml2ZXJTdGF0ZS5FcnJvcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8U29sdXRpb24+KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGlzRm9sZGVyUGVyRmlsZSA9IF8uc29tZSh0aGlzLl9fc3BlY2lhbENhc2VFeHRlbnNpb25zLCBleHQgPT4gXy5lbmRzV2l0aChlZGl0b3IuZ2V0UGF0aCgpLCBleHQpKTtcclxuICAgICAgICBjb25zdCBzb2x1dGlvbiA9IHRoaXMuX2dldFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSk7XHJcbiAgICAgICAgaWYgKHNvbHV0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yLCBzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKVxyXG4gICAgICAgICAgICAuZG8oKHNsbikgPT4gdGhpcy5fc2V0dXBFZGl0b3JXaXRoQ29udGV4dChlZGl0b3IsIHNsbikpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb248VD4obG9jYXRpb246IHN0cmluZywgY2I6IChpbnRlcnNlY3Q6IHN0cmluZywgc29sdXRpb246IFNvbHV0aW9uKSA9PiBUKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBzb2x1dGlvbiBvZiB0aGlzLl9hY3RpdmVTb2x1dGlvbnMpIHtcclxuICAgICAgICAgICAgLy8gV2UgZG9uXCJ0IGNoZWNrIGZvciBmb2xkZXIgYmFzZWQgc29sdXRpb25zXHJcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5pc0ZvbGRlclBlckZpbGUpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcGF0aHMgPSBzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cy5tYXAoeiA9PiB6LnBhdGgpO1xyXG4gICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uLCBwYXRocyk7XHJcbiAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjYihpbnRlcnNlY3QsIHNvbHV0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uOiBzdHJpbmcsIGlzRm9sZGVyUGVyRmlsZTogYm9vbGVhbik6IFNvbHV0aW9uIHtcclxuICAgICAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0ZvbGRlclBlckZpbGUpIHtcclxuICAgICAgICAgICAgLy8gQ1NYIGFyZSBzcGVjaWFsLCBhbmQgbmVlZCBhIHNvbHV0aW9uIHBlciBkaXJlY3RvcnkuXHJcbiAgICAgICAgICAgIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGguZGlybmFtZShsb2NhdGlvbik7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9zb2x1dGlvbnMuaGFzKGRpcmVjdG9yeSkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29sdXRpb25zLmdldChkaXJlY3RvcnkpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gdGhpcy5faW50ZXJzZWN0UGF0aChsb2NhdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9zb2x1dGlvbnMuZ2V0KGludGVyc2VjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaXNGb2xkZXJQZXJGaWxlKSB7XHJcbiAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gc2VlIGlmIHRoaXMgZmlsZSBpcyBwYXJ0IGEgc29sdXRpb25cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIChpbnRlcnNlY3QsIHNvbHV0aW9uKSA9PiBzb2x1dGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbjogc3RyaW5nLCBpc0ZvbGRlclBlckZpbGU6IGJvb2xlYW4pOiBPYnNlcnZhYmxlPFNvbHV0aW9uPiB7XHJcbiAgICAgICAgY29uc3QgZGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lKGxvY2F0aW9uKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9hY3RpdmF0ZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZhdGVkU3ViamVjdC50YWtlKDEpXHJcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGxvY2F0aW9uLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgICBjb25zdCBtYXBwZWRMb2NhdGlvbnMgPSBzZWdtZW50cy5tYXAoKGxvYywgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIF8udGFrZShzZWdtZW50cywgaW5kZXggKyAxKS5qb2luKHBhdGguc2VwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbCBvZiBtYXBwZWRMb2NhdGlvbnMpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmhhcyhsKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmdldChsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3ViamVjdCA9IG5ldyBBc3luY1N1YmplY3Q8U29sdXRpb24+KCk7XHJcbiAgICAgICAgXy5lYWNoKG1hcHBlZExvY2F0aW9ucywgbCA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLnNldChsLCA8T2JzZXJ2YWJsZTxTb2x1dGlvbj4+PGFueT5zdWJqZWN0KTtcclxuICAgICAgICAgICAgc3ViamVjdC5zdWJzY3JpYmUoeyBjb21wbGV0ZTogKCkgPT4gdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuZGVsZXRlKGwpIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBwcm9qZWN0ID0gdGhpcy5faW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGRpcmVjdG9yeSk7XHJcbiAgICAgICAgY29uc3QgY2IgPSAoY2FuZGlkYXRlczogQ2FuZGlkYXRlW10pID0+IHtcclxuICAgICAgICAgICAgLy8gV2Ugb25seSB3YW50IHRvIHNlYXJjaCBmb3Igc29sdXRpb25zIGFmdGVyIHRoZSBtYWluIHNvbHV0aW9ucyBoYXZlIGJlZW4gcHJvY2Vzc2VkLlxyXG4gICAgICAgICAgICAvLyBXZSBjYW4gZ2V0IGludG8gdGhpcyByYWNlIGNvbmRpdGlvbiBpZiB0aGUgdXNlciBoYXMgd2luZG93cyB0aGF0IHdlcmUgb3BlbmVkIHByZXZpb3VzbHkuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5fYWN0aXZhdGVkKSB7XHJcbiAgICAgICAgICAgICAgICBfLmRlbGF5KGNiLCBTT0xVVElPTl9MT0FEX1RJTUUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gQXR0ZW1wdCB0byBzZWUgaWYgdGhpcyBmaWxlIGlzIHBhcnQgYSBzb2x1dGlvblxyXG4gICAgICAgICAgICAgICAgY29uc3QgciA9IHRoaXMuX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIChpbnRlcnNlY3QsIHNvbHV0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHNvbHV0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChyKSByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNlYXJjaC50aGVuKCgpID0+IE9ic2VydmFibGUuZnJvbShjYW5kaWRhdGVzKVxyXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB0aGlzLl9maW5kUmVwb3NpdG9yeUZvclBhdGgoeC5wYXRoKSwgKGNhbmRpZGF0ZSwgcmVwbykgPT4gKHsgY2FuZGlkYXRlLCByZXBvIH0pKVxyXG4gICAgICAgICAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgICAgICAgICAgLnRvUHJvbWlzZSgpKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVwb3MgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbmRpZGF0ZXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcy5tYXAoeiA9PiB6LnBhdGgpLCBmcm9tSXRlcmF0b3IodGhpcy5fc29sdXRpb25zLmtleXMoKSkpLm1hcCh6ID0+IF8uZmluZChjYW5kaWRhdGVzLCB7IHBhdGg6IHogfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKHsgcGF0aCwgaXNQcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQocmVwb3MsIHggPT4geC5jYW5kaWRhdGUucGF0aCA9PT0gcGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBvID0gZm91bmQgJiYgZm91bmQucmVwbztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHBhdGgsIGlzUHJvamVjdCwgcmVwbywgb3JpZ2luYWxGaWxlIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGFkZENhbmRpZGF0ZXNJbk9yZGVyKG5ld0NhbmRpZGF0ZXMsIChjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3Jhcnk6ICFwcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNGb2xkZXJQZXJGaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXR0ZW1wdCB0byBzZWUgaWYgdGhpcyBmaWxlIGlzIHBhcnQgYSBzb2x1dGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQoc29sdXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocikgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdCA9IHRoaXMuX2ludGVyc2VjdFBhdGgobG9jYXRpb24pIHx8IHRoaXMuX2ludGVyc2VjdEF0b21Qcm9qZWN0UGF0aChsb2NhdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoaW50ZXJzZWN0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQodGhpcy5fc29sdXRpb25zLmdldChpbnRlcnNlY3QpKTsgLy8gVGhlIGJvb2xlYW4gbWVhbnMgdGhpcyBzb2x1dGlvbiBpcyB0ZW1wb3JhcnkuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhgQ291bGQgbm90IGZpbmQgYSBzb2x1dGlvbiBmb3IgXCIke2xvY2F0aW9ufVwiYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5fY2FuZGlkYXRlRmluZGVyKGRpcmVjdG9yeSkuc3Vic2NyaWJlKGNiKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIDxPYnNlcnZhYmxlPFNvbHV0aW9uPj48YW55PnN1YmplY3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfY2FuZGlkYXRlRmluZGVyKGRpcmVjdG9yeTogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbmRDYW5kaWRhdGVzLndpdGhDYW5kaWRhdGVzKGRpcmVjdG9yeSwgdGhpcy5sb2dnZXIsIHtcclxuICAgICAgICAgICAgc29sdXRpb25JbmRlcGVuZGVudFNvdXJjZUZpbGVzVG9TZWFyY2g6IHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMubWFwKHogPT4gXCIqXCIgKyB6KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKGNhbmRpZGF0ZXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2xucyA9IF8uZmlsdGVyKGNhbmRpZGF0ZXMsIHggPT4gXy5lbmRzV2l0aCh4LnBhdGgsIFwiLnNsblwiKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2xucy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcywgc2xucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXN5bmNSZXN1bHQgPSBuZXcgQXN5bmNTdWJqZWN0PHR5cGVvZiBjYW5kaWRhdGVzPigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0Lm5leHQoaXRlbXMpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBoYW5kbGUgbXVsdGlwbGUgc29sdXRpb25zLlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxpc3RWaWV3ID0gbmV3IEdlbmVyaWNTZWxlY3RMaXN0VmlldyhcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzbG5zLm1hcCh4ID0+ICh7IGRpc3BsYXlOYW1lOiB4LnBhdGgsIG5hbWU6IHgucGF0aCB9KSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChyZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdCguLi5zbG5zLmZpbHRlcih4ID0+IHgucGF0aCA9PT0gcmVzdWx0KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmVhY2goY2FuZGlkYXRlcywgeCA9PiB0aGlzLl9jYW5kaWRhdGVGaW5kZXJDYWNoZS5hZGQoeC5wYXRoKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RWaWV3Lm1lc3NhZ2UudGV4dChcIlBsZWFzZSBzZWxlY3QgYSBzb2x1dGlvbiB0byBsb2FkLlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvdyB0aGUgdmlld1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcGVuU2VsZWN0TGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuU2VsZWN0TGlzdC5vbkNsb3NlZC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLnNvbWUoc2xucywgeCA9PiB0aGlzLl9jYW5kaWRhdGVGaW5kZXJDYWNoZS5oYXMoeC5wYXRoKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmRlZmVyKCgpID0+IGxpc3RWaWV3LnRvZ2dsZSgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXy5kZWZlcigoKSA9PiBsaXN0Vmlldy50b2dnbGUoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5kbyh7IGNvbXBsZXRlOiAoKSA9PiBvcGVuU2VsZWN0TGlzdCA9IG51bGwgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3BlblNlbGVjdExpc3QgPSBsaXN0VmlldztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxPYnNlcnZhYmxlPHR5cGVvZiBjYW5kaWRhdGVzPj48YW55PmFzeW5jUmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihjYW5kaWRhdGVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gdm9pZCkge1xyXG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyYXRpb25zLmFkZChjYWxsYmFjayk7XHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLmZvckVhY2goc29sdXRpb24gPT4gY2FsbGJhY2soc29sdXRpb24pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uOiBzdHJpbmcsIHBhdGhzPzogc3RyaW5nW10pIHtcclxuICAgICAgICBjb25zdCB2YWxpZFNvbHV0aW9uUGF0aHMgPSBwYXRocztcclxuXHJcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBsb2NhdGlvbi5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgICAgY29uc3QgbWFwcGVkTG9jYXRpb25zID0gc2VnbWVudHMubWFwKChsb2MsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLnRha2Uoc2VnbWVudHMsIGluZGV4ICsgMSkuam9pbihwYXRoLnNlcCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIExvb2sgZm9yIHRoZSBjbG9zZXN0IG1hdGNoIGZpcnN0LlxyXG4gICAgICAgIG1hcHBlZExvY2F0aW9ucy5yZXZlcnNlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGludGVyc2VjdDogc3RyaW5nID0gXy5pbnRlcnNlY3Rpb24obWFwcGVkTG9jYXRpb25zLCB2YWxpZFNvbHV0aW9uUGF0aHMpWzBdO1xyXG4gICAgICAgIGlmIChpbnRlcnNlY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGludGVyc2VjdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaW50ZXJzZWN0UGF0aChsb2NhdGlvbjogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb24sIGZyb21JdGVyYXRvcih0aGlzLl9zb2x1dGlvbnMuZW50cmllcygpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXpbMV0uaXNGb2xkZXJQZXJGaWxlKS5tYXAoeiA9PiB6WzBdKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGxvY2F0aW9uOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgdGhpcy5fYXRvbVByb2plY3RzLnBhdGhzKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gYWRkQ2FuZGlkYXRlc0luT3JkZXIoY2FuZGlkYXRlczogeyBwYXRoOiBzdHJpbmc7IHJlcG86IEFTWU5DX1JFUE9TSVRPUlk7IGlzUHJvamVjdDogYm9vbGVhbjsgb3JpZ2luYWxGaWxlOiBzdHJpbmc7IH1bXSwgY2I6IChjYW5kaWRhdGU6IHN0cmluZywgcmVwbzogQVNZTkNfUkVQT1NJVE9SWSwgaXNQcm9qZWN0OiBib29sZWFuLCBvcmlnaW5hbEZpbGU6IHN0cmluZykgPT4gT2JzZXJ2YWJsZTxTb2x1dGlvbj4pIHtcclxuICAgIGNvbnN0IGFzeW5jU3ViamVjdCA9IG5ldyBBc3luY1N1YmplY3QoKTtcclxuXHJcbiAgICBpZiAoIWNhbmRpZGF0ZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgYXN5bmNTdWJqZWN0Lm5leHQoY2FuZGlkYXRlcyk7XHJcbiAgICAgICAgYXN5bmNTdWJqZWN0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jU3ViamVjdC50b1Byb21pc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjZHMgPSBjYW5kaWRhdGVzLnNsaWNlKCk7XHJcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBjZHMuc2hpZnQoKTtcclxuICAgIGNvbnN0IGhhbmRsZUNhbmRpZGF0ZSA9IChjYW5kOiB7IHBhdGg6IHN0cmluZzsgcmVwbzogQVNZTkNfUkVQT1NJVE9SWTsgaXNQcm9qZWN0OiBib29sZWFuOyBvcmlnaW5hbEZpbGU6IHN0cmluZzsgfSkgPT4ge1xyXG4gICAgICAgIGNiKGNhbmQucGF0aCwgY2FuZC5yZXBvLCBjYW5kLmlzUHJvamVjdCwgY2FuZC5vcmlnaW5hbEZpbGUpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2RzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYW5kID0gY2RzLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUNhbmRpZGF0ZShjYW5kKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3luY1N1YmplY3QubmV4dChjYW5kaWRhdGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNTdWJqZWN0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBoYW5kbGVDYW5kaWRhdGUoY2FuZGlkYXRlKTtcclxuICAgIHJldHVybiBhc3luY1N1YmplY3QudG9Qcm9taXNlKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZyb21JdGVyYXRvcjxUPihpdGVyYXRvcjogSXRlcmFibGVJdGVyYXRvcjxUPikge1xyXG4gICAgY29uc3QgaXRlbXM6IFRbXSA9IFtdO1xyXG4gICAgbGV0IHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcclxuICAgIHdoaWxlICghcmVzdWx0LmRvbmUpIHtcclxuICAgICAgICBpdGVtcy5wdXNoKHJlc3VsdC52YWx1ZSk7XHJcblxyXG4gICAgICAgIHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXRlbXM7XHJcbn1cclxuXHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuZXhwb3J0IGNvbnN0IFNvbHV0aW9uTWFuYWdlciA9IG5ldyBTb2x1dGlvbkluc3RhbmNlTWFuYWdlcigpO1xyXG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
