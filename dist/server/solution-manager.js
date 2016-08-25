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

var _tsDisposables = require("ts-disposables");

var _solution2 = require("./solution");

var _atomProjects = require("./atom-projects");

var _compositeSolution = require("./composite-solution");

var _omnisharpClient = require("omnisharp-client");

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
            this._disposable = new _tsDisposables.CompositeDisposable();
            this._solutionDisposable = new _tsDisposables.CompositeDisposable();
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
            var cd = new _tsDisposables.CompositeDisposable();
            this._solutionDisposable.add(solution);
            solution.disposable.add(cd);
            this._disposableSolutionMap.set(solution, cd);
            solution.disposable.add(_tsDisposables.Disposable.create(function () {
                solution.connect = function () {
                    return _this3._addSolution(candidate, repo, isProject, { temporary: temporary, project: project });
                };
            }));
            cd.add(_tsDisposables.Disposable.create(function () {
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
                var tempD = _tsDisposables.Disposable.create(function () {});
                tempD.dispose();
                this._temporarySolutions.set(solution, new _tsDisposables.RefCountDisposable(tempD));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci5qcyIsImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0lDQVk7O0FEQ1o7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7QUNHQSxJQUFNLHFCQUFxQixLQUFyQjtBQUVOLElBQUksdUJBQUo7O0lBQ0E7QUFBQSx1Q0FBQTs7O0FBRVcsYUFBQSxjQUFBLEdBQWlCLEtBQWpCLENBRlg7QUFHVyxhQUFBLG1CQUFBLEdBQXNCLEtBQXRCLENBSFg7QUFvQlksYUFBQSxlQUFBLEdBQWtCLElBQUksR0FBSixFQUFsQixDQXBCWjtBQXFCWSxhQUFBLFVBQUEsR0FBYSxJQUFJLEdBQUosRUFBYixDQXJCWjtBQXNCWSxhQUFBLGlCQUFBLEdBQW9CLElBQUksR0FBSixFQUFwQixDQXRCWjtBQXVCWSxhQUFBLG1CQUFBLEdBQXNCLElBQUksT0FBSixFQUF0QixDQXZCWjtBQXdCWSxhQUFBLHNCQUFBLEdBQXlCLElBQUksT0FBSixFQUF6QixDQXhCWjtBQXlCWSxhQUFBLGtCQUFBLEdBQXFCLElBQUksR0FBSixFQUFyQixDQXpCWjtBQTBCWSxhQUFBLHFCQUFBLEdBQXdCLElBQUksR0FBSixFQUF4QixDQTFCWjtBQTRCWSxhQUFBLFVBQUEsR0FBYSxLQUFiLENBNUJaO0FBNkJZLGFBQUEsVUFBQSxHQUFhLENBQWIsQ0E3Qlo7QUFpQ1ksYUFBQSxzQkFBQSxHQUF5QixDQUFDLE1BQUQsQ0FBekIsQ0FqQ1o7QUFvQ1ksYUFBQSxnQkFBQSxHQUErQixFQUEvQixDQXBDWjtBQTBDWSxhQUFBLFlBQUEsR0FBZSx5Q0FBZixDQTFDWjtBQWdEWSxhQUFBLFlBQUEsR0FBZSxrREFBZixDQWhEWjtBQXFEWSxhQUFBLGVBQUEsR0FBa0IsMEJBQThCLElBQTlCLENBQWxCLENBckRaO0FBc0RZLGFB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SSxNQUFKLEVBQVk7QUFDWiwyQkFBTyxJQUFJLEtBQUosRUFBUCxDQURZO0FBRVosb0NBQWdCLElBQWhCLEVBRlk7aUJBQWhCLE1BR087QUFDSCxpQ0FBYSxJQUFiLENBQWtCLFVBQWxCLEVBREc7QUFFSCxpQ0FBYSxRQUFiLEdBRkc7aUJBSFA7YUFETTtTQUZsQixFQUR3RztLQUFwRixDQVgwTTtBQXlCbE8sb0JBQWdCLFNBQWhCLEVBekJrTztBQTBCbE8sV0FBTyxhQUFhLFNBQWIsRUFBUCxDQTFCa087Q0FBdE87QUE2QkEsU0FBQSxZQUFBLENBQXlCLFFBQXpCLEVBQXNEO0FBQ2xELFFBQU0sUUFBYSxFQUFiLENBRDRDO0FBRWxELFFBQUksU0FBUyxTQUFTLElBQVQsRUFBVCxDQUY4QztBQUdsRCxXQUFPLENBQUMsT0FBTyxJQUFQLEVBQWE7QUFDakIsY0FBTSxJQUFOLENBQVcsT0FBTyxLQUFQLENBQVgsQ0FEaUI7QUFHakIsaUJBQVMsU0FBUyxJQUFULEVBQVQsQ0FIaUI7S0FBckI7QUFNQSxXQUFPLEtBQVAsQ0FUa0Q7Q0FBdEQ7QUFhTyxJQUFNLDRDQUFrQixJQUFJLHVCQUFKLEVBQWxCIiwiZmlsZSI6ImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIEFzeW5jU3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0LCBTY2hlZHVsZXIsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgUmVmQ291bnREaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBTb2x1dGlvbiB9IGZyb20gXCIuL3NvbHV0aW9uXCI7XG5pbXBvcnQgeyBBdG9tUHJvamVjdFRyYWNrZXIgfSBmcm9tIFwiLi9hdG9tLXByb2plY3RzXCI7XG5pbXBvcnQgeyBTb2x1dGlvbk9ic2VydmVyLCBTb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyIH0gZnJvbSBcIi4vY29tcG9zaXRlLXNvbHV0aW9uXCI7XG5pbXBvcnQgeyBEcml2ZXJTdGF0ZSwgZmluZENhbmRpZGF0ZXMsIFJ1bnRpbWUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgR2VuZXJpY1NlbGVjdExpc3RWaWV3IH0gZnJvbSBcIi4uL3ZpZXdzL2dlbmVyaWMtbGlzdC12aWV3XCI7XG5pbXBvcnQgeyBpc09tbmlzaGFycFRleHRFZGl0b3IsIE9tbmlzaGFycEVkaXRvckNvbnRleHQgfSBmcm9tIFwiLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcbmNvbnN0IFNPTFVUSU9OX0xPQURfVElNRSA9IDMwMDAwO1xubGV0IG9wZW5TZWxlY3RMaXN0O1xuY2xhc3MgU29sdXRpb25JbnN0YW5jZU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl91bml0VGVzdE1vZGVfID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2tpY2tfaW5fdGhlX3BhbnRzXyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9jb25maWd1cmF0aW9ucyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25zID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvblByb2plY3RzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMgPSBuZXcgV2Vha01hcCgpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAgPSBuZXcgV2Vha01hcCgpO1xuICAgICAgICB0aGlzLl9maW5kU29sdXRpb25DYWNoZSA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fY2FuZGlkYXRlRmluZGVyQ2FjaGUgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9uZXh0SW5kZXggPSAwO1xuICAgICAgICB0aGlzLl9zcGVjaWFsQ2FzZUV4dGVuc2lvbnMgPSBbXCIuY3N4XCIsXTtcbiAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb25zID0gW107XG4gICAgICAgIHRoaXMuX29ic2VydmF0aW9uID0gbmV3IFNvbHV0aW9uT2JzZXJ2ZXIoKTtcbiAgICAgICAgdGhpcy5fY29tYmluYXRpb24gPSBuZXcgU29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlcigpO1xuICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbiA9IG5ldyBCZWhhdmlvclN1YmplY3QobnVsbCk7XG4gICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uT2JzZXJhYmxlID0gdGhpcy5fYWN0aXZlU29sdXRpb24uZGlzdGluY3RVbnRpbENoYW5nZWQoKS5maWx0ZXIoeiA9PiAhIXopLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgfVxuICAgIGdldCBsb2dnZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLl91bml0VGVzdE1vZGVfIHx8IHRoaXMuX2tpY2tfaW5fdGhlX3BhbnRzXykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBsb2c6ICgpID0+IHsgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogKCkgPT4geyB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb25zb2xlO1xuICAgIH1cbiAgICBnZXQgX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMoKSB7IHJldHVybiB0aGlzLl9zcGVjaWFsQ2FzZUV4dGVuc2lvbnM7IH1cbiAgICBnZXQgYWN0aXZlU29sdXRpb25zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlU29sdXRpb25zO1xuICAgIH1cbiAgICBnZXQgc29sdXRpb25PYnNlcnZlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX29ic2VydmF0aW9uO1xuICAgIH1cbiAgICBnZXQgc29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbWJpbmF0aW9uO1xuICAgIH1cbiAgICBnZXQgYWN0aXZlU29sdXRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVTb2x1dGlvbk9ic2VyYWJsZTtcbiAgICB9XG4gICAgZ2V0IGFjdGl2YXRlZFN1YmplY3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmF0ZWRTdWJqZWN0O1xuICAgIH1cbiAgICBhY3RpdmF0ZShhY3RpdmVFZGl0b3IpIHtcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2YXRlZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX2F0b21Qcm9qZWN0cyA9IG5ldyBBdG9tUHJvamVjdFRyYWNrZXIoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fYXRvbVByb2plY3RzKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlU2VhcmNoID0gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgIHRoaXMuX3N1YnNjcmliZVRvQXRvbVByb2plY3RUcmFja2VyKCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGFjdGl2ZUVkaXRvclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcbiAgICAgICAgICAgIC5mbGF0TWFwKHogPT4gdGhpcy5nZXRTb2x1dGlvbkZvckVkaXRvcih6KSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoeCA9PiB0aGlzLl9hY3RpdmVTb2x1dGlvbi5uZXh0KHgpKSk7XG4gICAgICAgIHRoaXMuX2F0b21Qcm9qZWN0cy5hY3RpdmF0ZSgpO1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmFjdGl2YXRlZFN1YmplY3QubmV4dCh0cnVlKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fc29sdXRpb25EaXNwb3NhYmxlKTtcbiAgICB9XG4gICAgY29ubmVjdCgpIHtcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLmZvckVhY2goc29sdXRpb24gPT4gc29sdXRpb24uY29ubmVjdCgpKTtcbiAgICB9XG4gICAgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLmZvckVhY2goc29sdXRpb24gPT4gc29sdXRpb24uZGlzcG9zZSgpKTtcbiAgICB9XG4gICAgZGVhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuY2xlYXIoKTtcbiAgICB9XG4gICAgZ2V0IGNvbm5lY3RlZCgpIHtcbiAgICAgICAgY29uc3QgaXRlcmF0b3IgPSB0aGlzLl9zb2x1dGlvbnMudmFsdWVzKCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgd2hpbGUgKCFyZXN1bHQuZG9uZSlcbiAgICAgICAgICAgIGlmIChyZXN1bHQudmFsdWUuY3VycmVudFN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgX3N1YnNjcmliZVRvQXRvbVByb2plY3RUcmFja2VyKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMucmVtb3ZlZFxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHRoaXMuX3NvbHV0aW9ucy5oYXMoeikpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fcmVtb3ZlU29sdXRpb24ocHJvamVjdCkpKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fYXRvbVByb2plY3RzLmFkZGVkXG4gICAgICAgICAgICAuZmlsdGVyKHByb2plY3QgPT4gIXRoaXMuX3NvbHV0aW9uUHJvamVjdHMuaGFzKHByb2plY3QpKVxuICAgICAgICAgICAgLm1hcChwcm9qZWN0ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYW5kaWRhdGVGaW5kZXIocHJvamVjdClcbiAgICAgICAgICAgICAgICAuZmxhdE1hcChjYW5kaWRhdGVzID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKGNhbmRpZGF0ZXMpXG4gICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4gdGhpcy5fZmluZFJlcG9zaXRvcnlGb3JQYXRoKHgucGF0aCksIChjYW5kaWRhdGUsIHJlcG8pID0+ICh7IGNhbmRpZGF0ZSwgcmVwbyB9KSlcbiAgICAgICAgICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgICAgICAgICAudG9Qcm9taXNlKClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVwb3MgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdDYW5kaWRhdGVzID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMubWFwKHogPT4gei5wYXRoKSwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5rZXlzKCkpKS5tYXAoeiA9PiBfLmZpbmQoY2FuZGlkYXRlcywgeyBwYXRoOiB6IH0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoeyBwYXRoLCBpc1Byb2plY3QsIG9yaWdpbmFsRmlsZSB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IF8uZmluZChyZXBvcywgeCA9PiB4LmNhbmRpZGF0ZS5wYXRoID09PSBwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcG8gPSBmb3VuZCAmJiBmb3VuZC5yZXBvO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgcGF0aCwgaXNQcm9qZWN0LCByZXBvLCBvcmlnaW5hbEZpbGUgfTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhZGRDYW5kaWRhdGVzSW5PcmRlcihuZXdDYW5kaWRhdGVzLCAoY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIG9yaWdpbmFsRmlsZSkgPT4gdGhpcy5fYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgb3JpZ2luYWxGaWxlLCBwcm9qZWN0IH0pKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLnRvUHJvbWlzZSgpO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLnN1YnNjcmliZShjYW5kaWRhdGVPYnNlcnZhYmxlID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNlYXJjaCA9IHRoaXMuX2FjdGl2ZVNlYXJjaC50aGVuKCgpID0+IGNhbmRpZGF0ZU9ic2VydmFibGUpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIF9maW5kUmVwb3NpdG9yeUZvclBhdGgod29ya2luZ1BhdGgpIHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbShhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKCkgfHwgW10pXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxuICAgICAgICAgICAgLm1hcChyZXBvID0+ICh7IHJlcG8sIGRpcmVjdG9yeTogcmVwby5nZXRXb3JraW5nRGlyZWN0b3J5KCkgfSkpXG4gICAgICAgICAgICAuZmlsdGVyKCh7IGRpcmVjdG9yeSB9KSA9PiBwYXRoLm5vcm1hbGl6ZShkaXJlY3RvcnkpID09PSBwYXRoLm5vcm1hbGl6ZSh3b3JraW5nUGF0aCkpXG4gICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgLm1hcCh4ID0+IHgucmVwbyk7XG4gICAgfVxuICAgIF9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3JhcnkgPSBmYWxzZSwgcHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pIHtcbiAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSBjYW5kaWRhdGU7XG4gICAgICAgIGlmIChfLmVuZHNXaXRoKGNhbmRpZGF0ZSwgXCIuc2xuXCIpKSB7XG4gICAgICAgICAgICBjYW5kaWRhdGUgPSBwYXRoLmRpcm5hbWUoY2FuZGlkYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc29sdXRpb247XG4gICAgICAgIGlmICh0aGlzLl9zb2x1dGlvbnMuaGFzKGNhbmRpZGF0ZSkpIHtcbiAgICAgICAgICAgIHNvbHV0aW9uID0gdGhpcy5fc29sdXRpb25zLmdldChjYW5kaWRhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByb2plY3QgJiYgdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5oYXMocHJvamVjdCkpIHtcbiAgICAgICAgICAgIHNvbHV0aW9uID0gdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5nZXQocHJvamVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNvbHV0aW9uICYmICFzb2x1dGlvbi5pc0Rpc3Bvc2VkKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc29sdXRpb24gJiYgc29sdXRpb24uaXNEaXNwb3NlZCkge1xuICAgICAgICAgICAgY29uc3QgZGlzcG9zZXIgPSB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuZ2V0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgIGRpc3Bvc2VyLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBzb2x1dGlvbiA9IG5ldyBTb2x1dGlvbih7XG4gICAgICAgICAgICBwcm9qZWN0UGF0aDogcHJvamVjdFBhdGgsXG4gICAgICAgICAgICBpbmRleDogKyt0aGlzLl9uZXh0SW5kZXgsXG4gICAgICAgICAgICB0ZW1wb3Jhcnk6IHRlbXBvcmFyeSxcbiAgICAgICAgICAgIHJlcG9zaXRvcnk6IHJlcG8sXG4gICAgICAgICAgICBydW50aW1lOiBfLmVuZHNXaXRoKG9yaWdpbmFsRmlsZSwgXCIuY3N4XCIpID8gUnVudGltZS5DbHJPck1vbm8gOiBSdW50aW1lLkNvcmVDbHJcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghaXNQcm9qZWN0KSB7XG4gICAgICAgICAgICBzb2x1dGlvbi5pc0ZvbGRlclBlckZpbGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZChzb2x1dGlvbik7XG4gICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLnNldChzb2x1dGlvbiwgY2QpO1xuICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBzb2x1dGlvbi5jb25uZWN0ID0gKCkgPT4gdGhpcy5fYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgdGVtcG9yYXJ5LCBwcm9qZWN0IH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgIF8ucHVsbCh0aGlzLl9hY3RpdmVTb2x1dGlvbnMsIHNvbHV0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9ucy5kZWxldGUoY2FuZGlkYXRlKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuaGFzKHNvbHV0aW9uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5kZWxldGUoc29sdXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZVNvbHV0aW9uLmdldFZhbHVlKCkgPT09IHNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb24ubmV4dCh0aGlzLl9hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID8gdGhpcy5fYWN0aXZlU29sdXRpb25zWzBdIDogbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fY29uZmlndXJhdGlvbnMuZm9yRWFjaChjb25maWcgPT4gY29uZmlnKHNvbHV0aW9uKSk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5zZXQoY2FuZGlkYXRlLCBzb2x1dGlvbik7XG4gICAgICAgIGNkLmFkZCh0aGlzLl9vYnNlcnZhdGlvbi5hZGQoc29sdXRpb24pKTtcbiAgICAgICAgY2QuYWRkKHRoaXMuX2NvbWJpbmF0aW9uLmFkZChzb2x1dGlvbikpO1xuICAgICAgICBpZiAodGVtcG9yYXJ5KSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wRCA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHsgfSk7XG4gICAgICAgICAgICB0ZW1wRC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuc2V0KHNvbHV0aW9uLCBuZXcgUmVmQ291bnREaXNwb3NhYmxlKHRlbXBEKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb25zLnB1c2goc29sdXRpb24pO1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZlU29sdXRpb25zLmxlbmd0aCA9PT0gMSlcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQoc29sdXRpb24pO1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9hZGRTb2x1dGlvblN1YnNjcmlwdGlvbnMoc29sdXRpb24sIGNkKTtcbiAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBfYWRkU29sdXRpb25TdWJzY3JpcHRpb25zKHNvbHV0aW9uLCBjZCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgICAgIGNvbnN0IGVycm9yUmVzdWx0ID0gc29sdXRpb24uc3RhdGVcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5FcnJvcilcbiAgICAgICAgICAgIC5kZWxheSgxMDApXG4gICAgICAgICAgICAudGFrZSgxKTtcbiAgICAgICAgY2QuYWRkKGVycm9yUmVzdWx0LnN1YnNjcmliZSgoKSA9PiByZXN1bHQuY29tcGxldGUoKSkpO1xuICAgICAgICBjZC5hZGQoc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0QWRkZWQuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5zZXQocHJvamVjdC5wYXRoLCBzb2x1dGlvbikpKTtcbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdFJlbW92ZWQuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5kZWxldGUocHJvamVjdC5wYXRoKSkpO1xuICAgICAgICBjZC5hZGQoc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0c1xuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDApXG4gICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgLm1hcCgoKSA9PiBzb2x1dGlvbilcbiAgICAgICAgICAgIC50aW1lb3V0KFNPTFVUSU9OX0xPQURfVElNRSwgU2NoZWR1bGVyLnF1ZXVlKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICByZXN1bHQubmV4dChzb2x1dGlvbik7XG4gICAgICAgICAgICByZXN1bHQuY29tcGxldGUoKTtcbiAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgcmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgX3JlbW92ZVNvbHV0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICBpZiAoXy5lbmRzV2l0aChjYW5kaWRhdGUsIFwiLnNsblwiKSkge1xuICAgICAgICAgICAgY2FuZGlkYXRlID0gcGF0aC5kaXJuYW1lKGNhbmRpZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc29sdXRpb24gPSB0aGlzLl9zb2x1dGlvbnMuZ2V0KGNhbmRpZGF0ZSk7XG4gICAgICAgIGNvbnN0IHJlZkNvdW50RGlzcG9zYWJsZSA9IHNvbHV0aW9uICYmIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5oYXMoc29sdXRpb24pICYmIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5nZXQoc29sdXRpb24pO1xuICAgICAgICBpZiAocmVmQ291bnREaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICByZWZDb3VudERpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgaWYgKCFyZWZDb3VudERpc3Bvc2FibGUuaXNEaXNwb3NlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc29sdXRpb24pIHtcbiAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuZ2V0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgIGlmIChkaXNwb3NhYmxlKVxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldFNvbHV0aW9uRm9yUGF0aChwYXRoKSB7XG4gICAgICAgIGlmICghcGF0aClcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIGNvbnN0IGlzRm9sZGVyUGVyRmlsZSA9IF8uc29tZSh0aGlzLl9fc3BlY2lhbENhc2VFeHRlbnNpb25zLCBleHQgPT4gXy5lbmRzV2l0aChwYXRoLCBleHQpKTtcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSBwYXRoO1xuICAgICAgICBpZiAoIWxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNvbHV0aW9uVmFsdWUgPSB0aGlzLl9nZXRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpO1xuICAgICAgICBpZiAoc29sdXRpb25WYWx1ZSlcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uVmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSk7XG4gICAgfVxuICAgIGdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKS5maWx0ZXIoKCkgPT4gIWVkaXRvci5pc0Rlc3Ryb3llZCgpKTtcbiAgICB9XG4gICAgX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yLCBzb2x1dGlvbikge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gbmV3IE9tbmlzaGFycEVkaXRvckNvbnRleHQoZWRpdG9yLCBzb2x1dGlvbik7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGVkaXRvcjtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoY29udGV4dCk7XG4gICAgICAgIGlmIChzb2x1dGlvbiAmJiAhY29udGV4dC50ZW1wICYmIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5oYXMoc29sdXRpb24pKSB7XG4gICAgICAgICAgICBjb25zdCByZWZDb3VudERpc3Bvc2FibGUgPSB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuZ2V0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSByZWZDb3VudERpc3Bvc2FibGUuZ2V0RGlzcG9zYWJsZSgpO1xuICAgICAgICAgICAgY29udGV4dC50ZW1wID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRleHQuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlU29sdXRpb24oc29sdXRpb24ucGF0aCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgX2dldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcikge1xuICAgICAgICBpZiAoIWVkaXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IGVkaXRvci5nZXRQYXRoKCk7XG4gICAgICAgIGlmICghbG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICBpZiAoZWRpdG9yLm9tbmlzaGFycC5tZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBzb2x1dGlvbiA9IGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb247XG4gICAgICAgICAgICBpZiAoc29sdXRpb24uY3VycmVudFN0YXRlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQgJiYgYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZVwiKSlcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5jb25uZWN0KCk7XG4gICAgICAgICAgICBpZiAoc29sdXRpb24uY3VycmVudFN0YXRlID09PSBEcml2ZXJTdGF0ZS5FcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaXNGb2xkZXJQZXJGaWxlID0gXy5zb21lKHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKGVkaXRvci5nZXRQYXRoKCksIGV4dCkpO1xuICAgICAgICBjb25zdCBzb2x1dGlvbiA9IHRoaXMuX2dldFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSk7XG4gICAgICAgIGlmIChzb2x1dGlvbikge1xuICAgICAgICAgICAgdGhpcy5fc2V0dXBFZGl0b3JXaXRoQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSlcbiAgICAgICAgICAgIC5kbygoc2xuKSA9PiB0aGlzLl9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvciwgc2xuKSk7XG4gICAgfVxuICAgIF9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCBjYikge1xuICAgICAgICBmb3IgKGNvbnN0IHNvbHV0aW9uIG9mIHRoaXMuX2FjdGl2ZVNvbHV0aW9ucykge1xuICAgICAgICAgICAgaWYgKHNvbHV0aW9uLmlzRm9sZGVyUGVyRmlsZSlcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gc29sdXRpb24ubW9kZWwucHJvamVjdHMubWFwKHogPT4gei5wYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdCA9IHRoaXMuX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb24sIHBhdGhzKTtcbiAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IoaW50ZXJzZWN0LCBzb2x1dGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2dldFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSkge1xuICAgICAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRm9sZGVyUGVyRmlsZSkge1xuICAgICAgICAgICAgY29uc3QgZGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lKGxvY2F0aW9uKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zb2x1dGlvbnMuaGFzKGRpcmVjdG9yeSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvbHV0aW9ucy5nZXQoZGlyZWN0b3J5KTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gdGhpcy5faW50ZXJzZWN0UGF0aChsb2NhdGlvbik7XG4gICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvbHV0aW9ucy5nZXQoaW50ZXJzZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIChpbnRlcnNlY3QsIHNvbHV0aW9uKSA9PiBzb2x1dGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIF9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGguZGlybmFtZShsb2NhdGlvbik7XG4gICAgICAgIGlmICghdGhpcy5fYWN0aXZhdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmF0ZWRTdWJqZWN0LnRha2UoMSlcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBsb2NhdGlvbi5zcGxpdChwYXRoLnNlcCk7XG4gICAgICAgIGNvbnN0IG1hcHBlZExvY2F0aW9ucyA9IHNlZ21lbnRzLm1hcCgobG9jLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIF8udGFrZShzZWdtZW50cywgaW5kZXggKyAxKS5qb2luKHBhdGguc2VwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAobGV0IGwgb2YgbWFwcGVkTG9jYXRpb25zKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuaGFzKGwpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmdldChsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdWJqZWN0ID0gbmV3IEFzeW5jU3ViamVjdCgpO1xuICAgICAgICBfLmVhY2gobWFwcGVkTG9jYXRpb25zLCBsID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLnNldChsLCBzdWJqZWN0KTtcbiAgICAgICAgICAgIHN1YmplY3Quc3Vic2NyaWJlKHsgY29tcGxldGU6ICgpID0+IHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmRlbGV0ZShsKSB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHByb2plY3QgPSB0aGlzLl9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgoZGlyZWN0b3J5KTtcbiAgICAgICAgY29uc3QgY2IgPSAoY2FuZGlkYXRlcykgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9hY3RpdmF0ZWQpIHtcbiAgICAgICAgICAgICAgICBfLmRlbGF5KGNiLCBTT0xVVElPTl9MT0FEX1RJTUUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgciA9IHRoaXMuX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIChpbnRlcnNlY3QsIHNvbHV0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dChzb2x1dGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNlYXJjaC50aGVuKCgpID0+IE9ic2VydmFibGUuZnJvbShjYW5kaWRhdGVzKVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4gdGhpcy5fZmluZFJlcG9zaXRvcnlGb3JQYXRoKHgucGF0aCksIChjYW5kaWRhdGUsIHJlcG8pID0+ICh7IGNhbmRpZGF0ZSwgcmVwbyB9KSlcbiAgICAgICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAgICAgLnRvUHJvbWlzZSgpKVxuICAgICAgICAgICAgICAgIC50aGVuKHJlcG9zID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdDYW5kaWRhdGVzID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMubWFwKHogPT4gei5wYXRoKSwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5rZXlzKCkpKS5tYXAoeiA9PiBfLmZpbmQoY2FuZGlkYXRlcywgeyBwYXRoOiB6IH0pKVxuICAgICAgICAgICAgICAgICAgICAubWFwKCh7IHBhdGgsIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQocmVwb3MsIHggPT4geC5jYW5kaWRhdGUucGF0aCA9PT0gcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcG8gPSBmb3VuZCAmJiBmb3VuZC5yZXBvO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBwYXRoLCBpc1Byb2plY3QsIHJlcG8sIG9yaWdpbmFsRmlsZSB9O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFkZENhbmRpZGF0ZXNJbk9yZGVyKG5ld0NhbmRpZGF0ZXMsIChjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3Jhcnk6ICFwcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dChzb2x1dGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdCA9IHRoaXMuX2ludGVyc2VjdFBhdGgobG9jYXRpb24pIHx8IHRoaXMuX2ludGVyc2VjdEF0b21Qcm9qZWN0UGF0aChsb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zb2x1dGlvbnMuaGFzKGludGVyc2VjdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQodGhpcy5fc29sdXRpb25zLmdldChpbnRlcnNlY3QpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKGBDb3VsZCBub3QgZmluZCBhIHNvbHV0aW9uIGZvciBcIiR7bG9jYXRpb259XCJgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fY2FuZGlkYXRlRmluZGVyKGRpcmVjdG9yeSkuc3Vic2NyaWJlKGNiKTtcbiAgICAgICAgcmV0dXJuIHN1YmplY3Q7XG4gICAgfVxuICAgIF9jYW5kaWRhdGVGaW5kZXIoZGlyZWN0b3J5KSB7XG4gICAgICAgIHJldHVybiBmaW5kQ2FuZGlkYXRlcy53aXRoQ2FuZGlkYXRlcyhkaXJlY3RvcnksIHRoaXMubG9nZ2VyLCB7XG4gICAgICAgICAgICBzb2x1dGlvbkluZGVwZW5kZW50U291cmNlRmlsZXNUb1NlYXJjaDogdGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucy5tYXAoeiA9PiBcIipcIiArIHopXG4gICAgICAgIH0pXG4gICAgICAgICAgICAuZmxhdE1hcChjYW5kaWRhdGVzID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNsbnMgPSBfLmZpbHRlcihjYW5kaWRhdGVzLCB4ID0+IF8uZW5kc1dpdGgoeC5wYXRoLCBcIi5zbG5cIikpO1xuICAgICAgICAgICAgaWYgKHNsbnMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMsIHNsbnMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzeW5jUmVzdWx0ID0gbmV3IEFzeW5jU3ViamVjdCgpO1xuICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0Lm5leHQoaXRlbXMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpc3RWaWV3ID0gbmV3IEdlbmVyaWNTZWxlY3RMaXN0VmlldyhcIlwiLCBzbG5zLm1hcCh4ID0+ICh7IGRpc3BsYXlOYW1lOiB4LnBhdGgsIG5hbWU6IHgucGF0aCB9KSksIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdCguLi5zbG5zLmZpbHRlcih4ID0+IHgucGF0aCA9PT0gcmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgICAgIF8uZWFjaChjYW5kaWRhdGVzLCB4ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhbmRpZGF0ZUZpbmRlckNhY2hlLmFkZCh4LnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbGlzdFZpZXcubWVzc2FnZS50ZXh0KFwiUGxlYXNlIHNlbGVjdCBhIHNvbHV0aW9uIHRvIGxvYWQuXCIpO1xuICAgICAgICAgICAgICAgIGlmIChvcGVuU2VsZWN0TGlzdCkge1xuICAgICAgICAgICAgICAgICAgICBvcGVuU2VsZWN0TGlzdC5vbkNsb3NlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLnNvbWUoc2xucywgeCA9PiB0aGlzLl9jYW5kaWRhdGVGaW5kZXJDYWNoZS5oYXMoeC5wYXRoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmRlZmVyKCgpID0+IGxpc3RWaWV3LnRvZ2dsZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgXy5kZWZlcigoKSA9PiBsaXN0Vmlldy50b2dnbGUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmRvKHsgY29tcGxldGU6ICgpID0+IG9wZW5TZWxlY3RMaXN0ID0gbnVsbCB9KTtcbiAgICAgICAgICAgICAgICBvcGVuU2VsZWN0TGlzdCA9IGxpc3RWaWV3O1xuICAgICAgICAgICAgICAgIHJldHVybiBhc3luY1Jlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGNhbmRpZGF0ZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVnaXN0ZXJDb25maWd1cmF0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyYXRpb25zLmFkZChjYWxsYmFjayk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5mb3JFYWNoKHNvbHV0aW9uID0+IGNhbGxiYWNrKHNvbHV0aW9uKSk7XG4gICAgfVxuICAgIF9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uLCBwYXRocykge1xuICAgICAgICBjb25zdCB2YWxpZFNvbHV0aW9uUGF0aHMgPSBwYXRocztcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBsb2NhdGlvbi5zcGxpdChwYXRoLnNlcCk7XG4gICAgICAgIGNvbnN0IG1hcHBlZExvY2F0aW9ucyA9IHNlZ21lbnRzLm1hcCgobG9jLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIF8udGFrZShzZWdtZW50cywgaW5kZXggKyAxKS5qb2luKHBhdGguc2VwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG1hcHBlZExvY2F0aW9ucy5yZXZlcnNlKCk7XG4gICAgICAgIGNvbnN0IGludGVyc2VjdCA9IF8uaW50ZXJzZWN0aW9uKG1hcHBlZExvY2F0aW9ucywgdmFsaWRTb2x1dGlvblBhdGhzKVswXTtcbiAgICAgICAgaWYgKGludGVyc2VjdCkge1xuICAgICAgICAgICAgcmV0dXJuIGludGVyc2VjdDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfaW50ZXJzZWN0UGF0aChsb2NhdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5lbnRyaWVzKCkpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXpbMV0uaXNGb2xkZXJQZXJGaWxlKS5tYXAoeiA9PiB6WzBdKSk7XG4gICAgfVxuICAgIF9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgobG9jYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb24sIHRoaXMuX2F0b21Qcm9qZWN0cy5wYXRocyk7XG4gICAgfVxufVxuZnVuY3Rpb24gYWRkQ2FuZGlkYXRlc0luT3JkZXIoY2FuZGlkYXRlcywgY2IpIHtcbiAgICBjb25zdCBhc3luY1N1YmplY3QgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgaWYgKCFjYW5kaWRhdGVzLmxlbmd0aCkge1xuICAgICAgICBhc3luY1N1YmplY3QubmV4dChjYW5kaWRhdGVzKTtcbiAgICAgICAgYXN5bmNTdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICAgIHJldHVybiBhc3luY1N1YmplY3QudG9Qcm9taXNlKCk7XG4gICAgfVxuICAgIGNvbnN0IGNkcyA9IGNhbmRpZGF0ZXMuc2xpY2UoKTtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBjZHMuc2hpZnQoKTtcbiAgICBjb25zdCBoYW5kbGVDYW5kaWRhdGUgPSAoY2FuZCkgPT4ge1xuICAgICAgICBjYihjYW5kLnBhdGgsIGNhbmQucmVwbywgY2FuZC5pc1Byb2plY3QsIGNhbmQub3JpZ2luYWxGaWxlKVxuICAgICAgICAgICAgLnN1YnNjcmliZSh7XG4gICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbmQgPSBjZHMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlQ2FuZGlkYXRlKGNhbmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmNTdWJqZWN0Lm5leHQoY2FuZGlkYXRlcyk7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jU3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBoYW5kbGVDYW5kaWRhdGUoY2FuZGlkYXRlKTtcbiAgICByZXR1cm4gYXN5bmNTdWJqZWN0LnRvUHJvbWlzZSgpO1xufVxuZnVuY3Rpb24gZnJvbUl0ZXJhdG9yKGl0ZXJhdG9yKSB7XG4gICAgY29uc3QgaXRlbXMgPSBbXTtcbiAgICBsZXQgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgIHdoaWxlICghcmVzdWx0LmRvbmUpIHtcbiAgICAgICAgaXRlbXMucHVzaChyZXN1bHQudmFsdWUpO1xuICAgICAgICByZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgfVxuICAgIHJldHVybiBpdGVtcztcbn1cbmV4cG9ydCBjb25zdCBTb2x1dGlvbk1hbmFnZXIgPSBuZXcgU29sdXRpb25JbnN0YW5jZU1hbmFnZXIoKTtcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIEFzeW5jU3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0LCBTY2hlZHVsZXIsIFN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7UmVmQ291bnREaXNwb3NhYmxlLCBJRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XHJcbmltcG9ydCB7U29sdXRpb259IGZyb20gXCIuL3NvbHV0aW9uXCI7XHJcbmltcG9ydCB7QXRvbVByb2plY3RUcmFja2VyfSBmcm9tIFwiLi9hdG9tLXByb2plY3RzXCI7XHJcbmltcG9ydCB7U29sdXRpb25PYnNlcnZlciwgU29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlcn0gZnJvbSBcIi4vY29tcG9zaXRlLXNvbHV0aW9uXCI7XHJcbmltcG9ydCB7RHJpdmVyU3RhdGUsIGZpbmRDYW5kaWRhdGVzLCBSdW50aW1lLCBDYW5kaWRhdGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7R2VuZXJpY1NlbGVjdExpc3RWaWV3fSBmcm9tIFwiLi4vdmlld3MvZ2VuZXJpYy1saXN0LXZpZXdcIjtcclxuaW1wb3J0IHtPbW5pc2hhcnBUZXh0RWRpdG9yLCBpc09tbmlzaGFycFRleHRFZGl0b3IsIE9tbmlzaGFycEVkaXRvckNvbnRleHR9IGZyb20gXCIuL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xyXG5cclxudHlwZSBSRVBPU0lUT1JZID0geyBnZXRXb3JraW5nRGlyZWN0b3J5KCk6IHN0cmluZzsgfTtcclxuY29uc3QgU09MVVRJT05fTE9BRF9USU1FID0gMzAwMDA7XHJcblxyXG5sZXQgb3BlblNlbGVjdExpc3Q6IEdlbmVyaWNTZWxlY3RMaXN0VmlldztcclxuY2xhc3MgU29sdXRpb25JbnN0YW5jZU1hbmFnZXIge1xyXG4gICAgLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG4gICAgcHVibGljIF91bml0VGVzdE1vZGVfID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgX2tpY2tfaW5fdGhlX3BhbnRzXyA9IGZhbHNlO1xyXG5cclxuICAgIHByaXZhdGUgZ2V0IGxvZ2dlcigpIHtcclxuICAgICAgICBpZiAodGhpcy5fdW5pdFRlc3RNb2RlXyB8fCB0aGlzLl9raWNrX2luX3RoZV9wYW50c18pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIGxvZzogKCkgPT4gey8qICovIH0sXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogKCkgPT4gey8qICovIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBjb25zb2xlO1xyXG4gICAgfVxyXG4gICAgLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25EaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfYXRvbVByb2plY3RzOiBBdG9tUHJvamVjdFRyYWNrZXI7XHJcblxyXG4gICAgcHJpdmF0ZSBfY29uZmlndXJhdGlvbnMgPSBuZXcgU2V0PChzb2x1dGlvbjogU29sdXRpb24pID0+IHZvaWQ+KCk7XHJcbiAgICBwcml2YXRlIF9zb2x1dGlvbnMgPSBuZXcgTWFwPHN0cmluZywgU29sdXRpb24+KCk7XHJcbiAgICBwcml2YXRlIF9zb2x1dGlvblByb2plY3RzID0gbmV3IE1hcDxzdHJpbmcsIFNvbHV0aW9uPigpO1xyXG4gICAgcHJpdmF0ZSBfdGVtcG9yYXJ5U29sdXRpb25zID0gbmV3IFdlYWtNYXA8U29sdXRpb24sIFJlZkNvdW50RGlzcG9zYWJsZT4oKTtcclxuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcCA9IG5ldyBXZWFrTWFwPFNvbHV0aW9uLCBJRGlzcG9zYWJsZT4oKTtcclxuICAgIHByaXZhdGUgX2ZpbmRTb2x1dGlvbkNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIE9ic2VydmFibGU8U29sdXRpb24+PigpO1xyXG4gICAgcHJpdmF0ZSBfY2FuZGlkYXRlRmluZGVyQ2FjaGUgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuXHJcbiAgICBwcml2YXRlIF9hY3RpdmF0ZWQgPSBmYWxzZTtcclxuICAgIHByaXZhdGUgX25leHRJbmRleCA9IDA7XHJcbiAgICBwcml2YXRlIF9hY3RpdmVTZWFyY2g6IFByb21pc2U8YW55PjtcclxuXHJcbiAgICAvLyBUaGVzZSBleHRlbnNpb25zIG9ubHkgc3VwcG9ydCBzZXJ2ZXIgcGVyIGZvbGRlciwgdW5saWtlIG5vcm1hbCBjcyBmaWxlcy5cclxuICAgIHByaXZhdGUgX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucyA9IFtcIi5jc3hcIiwgLypcIi5jYWtlXCIqL107XHJcbiAgICBwdWJsaWMgZ2V0IF9fc3BlY2lhbENhc2VFeHRlbnNpb25zKCkgeyByZXR1cm4gdGhpcy5fc3BlY2lhbENhc2VFeHRlbnNpb25zOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWN0aXZlU29sdXRpb25zOiBTb2x1dGlvbltdID0gW107XHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZVNvbHV0aW9ucygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlU29sdXRpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRoaXMgc29sdXRpb24gY2FuIGJlIHVzZWQgdG8gb2JzZXJ2ZSBiZWhhdmlvciBhY3Jvc3MgYWxsIHNvbHV0aW9uLlxyXG4gICAgcHJpdmF0ZSBfb2JzZXJ2YXRpb24gPSBuZXcgU29sdXRpb25PYnNlcnZlcigpO1xyXG4gICAgcHVibGljIGdldCBzb2x1dGlvbk9ic2VydmVyKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9vYnNlcnZhdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICAvLyB0aGlzIHNvbHV0aW9uIGNhbiBiZSB1c2VkIHRvIGFnZ3JlZ2F0ZSBiZWhhdmlvciBhY3Jvc3MgYWxsIHNvbHV0aW9uc1xyXG4gICAgcHJpdmF0ZSBfY29tYmluYXRpb24gPSBuZXcgU29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlcigpO1xyXG4gICAgcHVibGljIGdldCBzb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9jb21iaW5hdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hY3RpdmVTb2x1dGlvbiA9IG5ldyBCZWhhdmlvclN1YmplY3Q8U29sdXRpb24+KG51bGwpO1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZlU29sdXRpb25PYnNlcmFibGUgPSB0aGlzLl9hY3RpdmVTb2x1dGlvbi5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpLmZpbHRlcih6ID0+ICEheikucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xyXG4gICAgcHVibGljIGdldCBhY3RpdmVTb2x1dGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlU29sdXRpb25PYnNlcmFibGU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWN0aXZhdGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0PGJvb2xlYW4+KCk7XHJcbiAgICBwcml2YXRlIGdldCBhY3RpdmF0ZWRTdWJqZWN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmF0ZWRTdWJqZWN0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZShhY3RpdmVFZGl0b3I6IE9ic2VydmFibGU8T21uaXNoYXJwVGV4dEVkaXRvcj4pIHtcclxuICAgICAgICBpZiAodGhpcy5fYWN0aXZhdGVkKSByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5fYXRvbVByb2plY3RzID0gbmV3IEF0b21Qcm9qZWN0VHJhY2tlcigpO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX2F0b21Qcm9qZWN0cyk7XHJcblxyXG4gICAgICAgIHRoaXMuX2FjdGl2ZVNlYXJjaCA9IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG5cclxuICAgICAgICAvLyBtb25pdG9yIGF0b20gcHJvamVjdCBwYXRoc1xyXG4gICAgICAgIHRoaXMuX3N1YnNjcmliZVRvQXRvbVByb2plY3RUcmFja2VyKCk7XHJcblxyXG4gICAgICAgIC8vIFdlIHVzZSB0aGUgYWN0aXZlIGVkaXRvciBvbiBvbW5pc2hhcnBBdG9tIHRvXHJcbiAgICAgICAgLy8gY3JlYXRlIGFub3RoZXIgb2JzZXJ2YWJsZSB0aGF0IGNobmFnZXMgd2hlbiB3ZSBnZXQgYSBuZXcgc29sdXRpb24uXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYWN0aXZlRWRpdG9yXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKHogPT4gdGhpcy5nZXRTb2x1dGlvbkZvckVkaXRvcih6KSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZSh4ID0+IHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQoeCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5fYXRvbVByb2plY3RzLmFjdGl2YXRlKCk7XHJcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmFjdGl2YXRlZFN1YmplY3QubmV4dCh0cnVlKTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25uZWN0KCkge1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5mb3JFYWNoKHNvbHV0aW9uID0+IHNvbHV0aW9uLmNvbm5lY3QoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc2Nvbm5lY3QoKSB7XHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLmZvckVhY2goc29sdXRpb24gPT4gc29sdXRpb24uZGlzcG9zZSgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGVhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLl9hY3RpdmF0ZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLmNsZWFyKCk7XHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmNsZWFyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBjb25uZWN0ZWQoKSB7XHJcbiAgICAgICAgY29uc3QgaXRlcmF0b3IgPSB0aGlzLl9zb2x1dGlvbnMudmFsdWVzKCk7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xyXG4gICAgICAgIHdoaWxlICghcmVzdWx0LmRvbmUpXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQudmFsdWUuY3VycmVudFN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9BdG9tUHJvamVjdFRyYWNrZXIoKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fYXRvbVByb2plY3RzLnJlbW92ZWRcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHRoaXMuX3NvbHV0aW9ucy5oYXMoeikpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLl9yZW1vdmVTb2x1dGlvbihwcm9qZWN0KSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMuYWRkZWRcclxuICAgICAgICAgICAgLmZpbHRlcihwcm9qZWN0ID0+ICF0aGlzLl9zb2x1dGlvblByb2plY3RzLmhhcyhwcm9qZWN0KSlcclxuICAgICAgICAgICAgLm1hcChwcm9qZWN0ID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYW5kaWRhdGVGaW5kZXIocHJvamVjdClcclxuICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcChjYW5kaWRhdGVzID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbShjYW5kaWRhdGVzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB0aGlzLl9maW5kUmVwb3NpdG9yeUZvclBhdGgoeC5wYXRoKSwgKGNhbmRpZGF0ZSwgcmVwbykgPT4gKHsgY2FuZGlkYXRlLCByZXBvIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvUHJvbWlzZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihyZXBvcyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3Q2FuZGlkYXRlcyA9IF8uZGlmZmVyZW5jZShjYW5kaWRhdGVzLm1hcCh6ID0+IHoucGF0aCksIGZyb21JdGVyYXRvcih0aGlzLl9zb2x1dGlvbnMua2V5cygpKSkubWFwKHogPT4gXy5maW5kKGNhbmRpZGF0ZXMsIHsgcGF0aDogeiB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoeyBwYXRoLCBpc1Byb2plY3QsIG9yaWdpbmFsRmlsZSB9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IF8uZmluZChyZXBvcywgeCA9PiB4LmNhbmRpZGF0ZS5wYXRoID09PSBwYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcG8gPSBmb3VuZCAmJiBmb3VuZC5yZXBvO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgcGF0aCwgaXNQcm9qZWN0LCByZXBvLCBvcmlnaW5hbEZpbGUgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFkZENhbmRpZGF0ZXNJbk9yZGVyKG5ld0NhbmRpZGF0ZXMsIChjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyBvcmlnaW5hbEZpbGUsIHByb2plY3QgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkudG9Qcm9taXNlKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY2FuZGlkYXRlT2JzZXJ2YWJsZSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2ggPSB0aGlzLl9hY3RpdmVTZWFyY2gudGhlbigoKSA9PiBjYW5kaWRhdGVPYnNlcnZhYmxlKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2ZpbmRSZXBvc2l0b3J5Rm9yUGF0aCh3b3JraW5nUGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbTxSRVBPU0lUT1JZPihhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKCkgfHwgW10pXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXHJcbiAgICAgICAgICAgIC5tYXAocmVwbyA9PiAoeyByZXBvLCBkaXJlY3Rvcnk6IHJlcG8uZ2V0V29ya2luZ0RpcmVjdG9yeSgpIH0pKVxyXG4gICAgICAgICAgICAuZmlsdGVyKCh7ZGlyZWN0b3J5fSkgPT4gcGF0aC5ub3JtYWxpemUoZGlyZWN0b3J5KSA9PT0gcGF0aC5ub3JtYWxpemUod29ya2luZ1BhdGgpKVxyXG4gICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAubWFwKHggPT4geC5yZXBvKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hZGRTb2x1dGlvbihjYW5kaWRhdGU6IHN0cmluZywgcmVwbzogUkVQT1NJVE9SWSwgaXNQcm9qZWN0OiBib29sZWFuLCB7dGVtcG9yYXJ5ID0gZmFsc2UsIHByb2plY3QsIG9yaWdpbmFsRmlsZX06IHsgZGVsYXk/OiBudW1iZXI7IHRlbXBvcmFyeT86IGJvb2xlYW47IHByb2plY3Q/OiBzdHJpbmc7IG9yaWdpbmFsRmlsZT86IHN0cmluZzsgfSkge1xyXG4gICAgICAgIGNvbnN0IHByb2plY3RQYXRoID0gY2FuZGlkYXRlO1xyXG4gICAgICAgIGlmIChfLmVuZHNXaXRoKGNhbmRpZGF0ZSwgXCIuc2xuXCIpKSB7XHJcbiAgICAgICAgICAgIGNhbmRpZGF0ZSA9IHBhdGguZGlybmFtZShjYW5kaWRhdGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHNvbHV0aW9uOiBTb2x1dGlvbjtcclxuICAgICAgICBpZiAodGhpcy5fc29sdXRpb25zLmhhcyhjYW5kaWRhdGUpKSB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uID0gdGhpcy5fc29sdXRpb25zLmdldChjYW5kaWRhdGUpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocHJvamVjdCAmJiB0aGlzLl9zb2x1dGlvblByb2plY3RzLmhhcyhwcm9qZWN0KSkge1xyXG4gICAgICAgICAgICBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuZ2V0KHByb2plY3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uICYmICFzb2x1dGlvbi5pc0Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNvbHV0aW9uICYmIHNvbHV0aW9uLmlzRGlzcG9zZWQpIHtcclxuICAgICAgICAgICAgY29uc3QgZGlzcG9zZXIgPSB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuZ2V0KHNvbHV0aW9uKTtcclxuICAgICAgICAgICAgZGlzcG9zZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc29sdXRpb24gPSBuZXcgU29sdXRpb24oe1xyXG4gICAgICAgICAgICBwcm9qZWN0UGF0aDogcHJvamVjdFBhdGgsXHJcbiAgICAgICAgICAgIGluZGV4OiArK3RoaXMuX25leHRJbmRleCxcclxuICAgICAgICAgICAgdGVtcG9yYXJ5OiB0ZW1wb3JhcnksXHJcbiAgICAgICAgICAgIHJlcG9zaXRvcnk6IDxhbnk+cmVwbyxcclxuICAgICAgICAgICAgcnVudGltZTogXy5lbmRzV2l0aChvcmlnaW5hbEZpbGUsIFwiLmNzeFwiKSA/IFJ1bnRpbWUuQ2xyT3JNb25vIDogUnVudGltZS5Db3JlQ2xyXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICghaXNQcm9qZWN0KSB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uLmlzRm9sZGVyUGVyRmlsZSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQoc29sdXRpb24pO1xyXG4gICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuc2V0KHNvbHV0aW9uLCBjZCk7XHJcblxyXG4gICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgc29sdXRpb24uY29ubmVjdCA9ICgpID0+IHRoaXMuX2FkZFNvbHV0aW9uKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCB7IHRlbXBvcmFyeSwgcHJvamVjdCB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICBfLnB1bGwodGhpcy5fYWN0aXZlU29sdXRpb25zLCBzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9ucy5kZWxldGUoY2FuZGlkYXRlKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuaGFzKHNvbHV0aW9uKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmRlbGV0ZShzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9hY3RpdmVTb2x1dGlvbi5nZXRWYWx1ZSgpID09PSBzb2x1dGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb24ubmV4dCh0aGlzLl9hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID8gdGhpcy5fYWN0aXZlU29sdXRpb25zWzBdIDogbnVsbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyYXRpb25zLmZvckVhY2goY29uZmlnID0+IGNvbmZpZyhzb2x1dGlvbikpO1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5zZXQoY2FuZGlkYXRlLCBzb2x1dGlvbik7XHJcblxyXG4gICAgICAgIC8vIGtlZXAgdHJhY2sgb2YgdGhlIGFjdGl2ZSBzb2x1dGlvbnNcclxuICAgICAgICBjZC5hZGQodGhpcy5fb2JzZXJ2YXRpb24uYWRkKHNvbHV0aW9uKSk7XHJcbiAgICAgICAgY2QuYWRkKHRoaXMuX2NvbWJpbmF0aW9uLmFkZChzb2x1dGlvbikpO1xyXG5cclxuICAgICAgICBpZiAodGVtcG9yYXJ5KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRlbXBEID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4geyAvKiAqLyB9KTtcclxuICAgICAgICAgICAgdGVtcEQuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuc2V0KHNvbHV0aW9uLCBuZXcgUmVmQ291bnREaXNwb3NhYmxlKHRlbXBEKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbnMucHVzaChzb2x1dGlvbik7XHJcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZVNvbHV0aW9ucy5sZW5ndGggPT09IDEpXHJcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQoc29sdXRpb24pO1xyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9hZGRTb2x1dGlvblN1YnNjcmlwdGlvbnMoc29sdXRpb24sIGNkKTtcclxuICAgICAgICBzb2x1dGlvbi5jb25uZWN0KCk7XHJcbiAgICAgICAgcmV0dXJuIDxPYnNlcnZhYmxlPFNvbHV0aW9uPj48YW55PnJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hZGRTb2x1dGlvblN1YnNjcmlwdGlvbnMoc29sdXRpb246IFNvbHV0aW9uLCBjZDogQ29tcG9zaXRlRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBBc3luY1N1YmplY3Q8U29sdXRpb24+KCk7XHJcbiAgICAgICAgY29uc3QgZXJyb3JSZXN1bHQgPSBzb2x1dGlvbi5zdGF0ZVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuRXJyb3IpXHJcbiAgICAgICAgICAgIC5kZWxheSgxMDApXHJcbiAgICAgICAgICAgIC50YWtlKDEpO1xyXG5cclxuICAgICAgICBjZC5hZGQoZXJyb3JSZXN1bHQuc3Vic2NyaWJlKCgpID0+IHJlc3VsdC5jb21wbGV0ZSgpKSk7IC8vIElmIHRoaXMgc29sdXRpb24gZXJyb3JzIG1vdmUgb24gdG8gdGhlIG5leHRcclxuXHJcbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdEFkZGVkLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuc2V0KHByb2plY3QucGF0aCwgc29sdXRpb24pKSk7XHJcbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdFJlbW92ZWQuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5kZWxldGUocHJvamVjdC5wYXRoKSkpO1xyXG5cclxuICAgICAgICAvLyBXYWl0IGZvciB0aGUgcHJvamVjdHMgdG8gcmV0dXJuIGZyb20gdGhlIHNvbHV0aW9uXHJcbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdHNcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDApXHJcbiAgICAgICAgICAgIC50YWtlKDEpXHJcbiAgICAgICAgICAgIC5tYXAoKCkgPT4gc29sdXRpb24pXHJcbiAgICAgICAgICAgIC50aW1lb3V0KFNPTFVUSU9OX0xPQURfVElNRSwgU2NoZWR1bGVyLnF1ZXVlKSAvLyBXYWl0IDMwIHNlY29uZHMgZm9yIHRoZSBwcm9qZWN0IHRvIGxvYWQuXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gV2UgbG9hZGVkIHN1Y2Nlc3NmdWxseSByZXR1cm4gdGhlIHNvbHV0aW9uXHJcbiAgICAgICAgICAgICAgICByZXN1bHQubmV4dChzb2x1dGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gTW92ZSBhbG9uZy5cclxuICAgICAgICAgICAgICAgIHJlc3VsdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfcmVtb3ZlU29sdXRpb24oY2FuZGlkYXRlOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoXy5lbmRzV2l0aChjYW5kaWRhdGUsIFwiLnNsblwiKSkge1xyXG4gICAgICAgICAgICBjYW5kaWRhdGUgPSBwYXRoLmRpcm5hbWUoY2FuZGlkYXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNvbHV0aW9uID0gdGhpcy5fc29sdXRpb25zLmdldChjYW5kaWRhdGUpO1xyXG5cclxuICAgICAgICBjb25zdCByZWZDb3VudERpc3Bvc2FibGUgPSBzb2x1dGlvbiAmJiB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuaGFzKHNvbHV0aW9uKSAmJiB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuZ2V0KHNvbHV0aW9uKTtcclxuICAgICAgICBpZiAocmVmQ291bnREaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgIHJlZkNvdW50RGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIGlmICghcmVmQ291bnREaXNwb3NhYmxlLmlzRGlzcG9zZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8ga2VlcCB0cmFjayBvZiB0aGUgcmVtb3ZlZCBzb2x1dGlvbnNcclxuICAgICAgICBpZiAoc29sdXRpb24pIHtcclxuICAgICAgICAgICAgc29sdXRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLmdldChzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIGlmIChkaXNwb3NhYmxlKSBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFNvbHV0aW9uRm9yUGF0aChwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoIXBhdGgpXHJcbiAgICAgICAgICAgIC8vIE5vIHRleHQgZWRpdG9yIGZvdW5kXHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG5cclxuICAgICAgICBjb25zdCBpc0ZvbGRlclBlckZpbGUgPSBfLnNvbWUodGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgocGF0aCwgZXh0KSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gcGF0aDtcclxuICAgICAgICBpZiAoIWxvY2F0aW9uKSB7XHJcbiAgICAgICAgICAgIC8vIFRleHQgZWRpdG9yIG5vdCBzYXZlZCB5ZXQ/XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc29sdXRpb25WYWx1ZSA9IHRoaXMuX2dldFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSk7XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvblZhbHVlKVxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvblZhbHVlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpLmZpbHRlcigoKSA9PiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIHNvbHV0aW9uOiBTb2x1dGlvbikge1xyXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgT21uaXNoYXJwRWRpdG9yQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKTtcclxuICAgICAgICBjb25zdCByZXN1bHQ6IE9tbmlzaGFycFRleHRFZGl0b3IgPSA8YW55PmVkaXRvcjtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChjb250ZXh0KTtcclxuXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uICYmICFjb250ZXh0LnRlbXAgJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVmQ291bnREaXNwb3NhYmxlID0gdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmdldChzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSByZWZDb3VudERpc3Bvc2FibGUuZ2V0RGlzcG9zYWJsZSgpO1xyXG4gICAgICAgICAgICBjb250ZXh0LnRlbXAgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb250ZXh0LnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVTb2x1dGlvbihzb2x1dGlvbi5wYXRoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIGlmICghZWRpdG9yKSB7XHJcbiAgICAgICAgICAgIC8vIE5vIHRleHQgZWRpdG9yIGZvdW5kXHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSBlZGl0b3IuZ2V0UGF0aCgpO1xyXG4gICAgICAgIGlmICghbG9jYXRpb24pIHtcclxuICAgICAgICAgICAgLy8gVGV4dCBlZGl0b3Igbm90IHNhdmVkIHlldD9cclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8U29sdXRpb24+KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcclxuICAgICAgICAgICAgaWYgKGVkaXRvci5vbW5pc2hhcnAubWV0YWRhdGEpIHtcclxuICAgICAgICAgICAgICAgIC8vIGNsaWVudCAvIHNlcnZlciBkb2VzblwidCB3b3JrIGN1cnJlbnRseSBmb3IgbWV0YWRhdGEgZG9jdW1lbnRzLlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8U29sdXRpb24+KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uID0gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbjtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIHRoZSBzb2x1dGlvbiBoYXMgZGlzY29ubmVjdGVkLCByZWNvbm5lY3QgaXRcclxuICAgICAgICAgICAgaWYgKHNvbHV0aW9uLmN1cnJlbnRTdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkICYmIGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLmF1dG9TdGFydE9uQ29tcGF0aWJsZUZpbGVcIikpXHJcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5jb25uZWN0KCk7XHJcblxyXG4gICAgICAgICAgICAvLyBDbGllbnQgaXMgaW4gYW4gaW52YWxpZCBzdGF0ZVxyXG4gICAgICAgICAgICBpZiAoc29sdXRpb24uY3VycmVudFN0YXRlID09PSBEcml2ZXJTdGF0ZS5FcnJvcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8U29sdXRpb24+KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGlzRm9sZGVyUGVyRmlsZSA9IF8uc29tZSh0aGlzLl9fc3BlY2lhbENhc2VFeHRlbnNpb25zLCBleHQgPT4gXy5lbmRzV2l0aChlZGl0b3IuZ2V0UGF0aCgpLCBleHQpKTtcclxuICAgICAgICBjb25zdCBzb2x1dGlvbiA9IHRoaXMuX2dldFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSk7XHJcbiAgICAgICAgaWYgKHNvbHV0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yLCBzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKVxyXG4gICAgICAgICAgICAuZG8oKHNsbikgPT4gdGhpcy5fc2V0dXBFZGl0b3JXaXRoQ29udGV4dChlZGl0b3IsIHNsbikpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb248VD4obG9jYXRpb246IHN0cmluZywgY2I6IChpbnRlcnNlY3Q6IHN0cmluZywgc29sdXRpb246IFNvbHV0aW9uKSA9PiBUKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBzb2x1dGlvbiBvZiB0aGlzLl9hY3RpdmVTb2x1dGlvbnMpIHtcclxuICAgICAgICAgICAgLy8gV2UgZG9uXCJ0IGNoZWNrIGZvciBmb2xkZXIgYmFzZWQgc29sdXRpb25zXHJcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5pc0ZvbGRlclBlckZpbGUpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcGF0aHMgPSBzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cy5tYXAoeiA9PiB6LnBhdGgpO1xyXG4gICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uLCBwYXRocyk7XHJcbiAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjYihpbnRlcnNlY3QsIHNvbHV0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9nZXRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uOiBzdHJpbmcsIGlzRm9sZGVyUGVyRmlsZTogYm9vbGVhbik6IFNvbHV0aW9uIHtcclxuICAgICAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0ZvbGRlclBlckZpbGUpIHtcclxuICAgICAgICAgICAgLy8gQ1NYIGFyZSBzcGVjaWFsLCBhbmQgbmVlZCBhIHNvbHV0aW9uIHBlciBkaXJlY3RvcnkuXHJcbiAgICAgICAgICAgIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGguZGlybmFtZShsb2NhdGlvbik7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9zb2x1dGlvbnMuaGFzKGRpcmVjdG9yeSkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29sdXRpb25zLmdldChkaXJlY3RvcnkpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gdGhpcy5faW50ZXJzZWN0UGF0aChsb2NhdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9zb2x1dGlvbnMuZ2V0KGludGVyc2VjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaXNGb2xkZXJQZXJGaWxlKSB7XHJcbiAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gc2VlIGlmIHRoaXMgZmlsZSBpcyBwYXJ0IGEgc29sdXRpb25cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIChpbnRlcnNlY3QsIHNvbHV0aW9uKSA9PiBzb2x1dGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbjogc3RyaW5nLCBpc0ZvbGRlclBlckZpbGU6IGJvb2xlYW4pOiBPYnNlcnZhYmxlPFNvbHV0aW9uPiB7XHJcbiAgICAgICAgY29uc3QgZGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lKGxvY2F0aW9uKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9hY3RpdmF0ZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZhdGVkU3ViamVjdC50YWtlKDEpXHJcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGxvY2F0aW9uLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgICBjb25zdCBtYXBwZWRMb2NhdGlvbnMgPSBzZWdtZW50cy5tYXAoKGxvYywgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIF8udGFrZShzZWdtZW50cywgaW5kZXggKyAxKS5qb2luKHBhdGguc2VwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbCBvZiBtYXBwZWRMb2NhdGlvbnMpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmhhcyhsKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmdldChsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3ViamVjdCA9IG5ldyBBc3luY1N1YmplY3Q8U29sdXRpb24+KCk7XHJcbiAgICAgICAgXy5lYWNoKG1hcHBlZExvY2F0aW9ucywgbCA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLnNldChsLCA8T2JzZXJ2YWJsZTxTb2x1dGlvbj4+PGFueT5zdWJqZWN0KTtcclxuICAgICAgICAgICAgc3ViamVjdC5zdWJzY3JpYmUoeyBjb21wbGV0ZTogKCkgPT4gdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuZGVsZXRlKGwpIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBwcm9qZWN0ID0gdGhpcy5faW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGRpcmVjdG9yeSk7XHJcbiAgICAgICAgY29uc3QgY2IgPSAoY2FuZGlkYXRlczogQ2FuZGlkYXRlW10pID0+IHtcclxuICAgICAgICAgICAgLy8gV2Ugb25seSB3YW50IHRvIHNlYXJjaCBmb3Igc29sdXRpb25zIGFmdGVyIHRoZSBtYWluIHNvbHV0aW9ucyBoYXZlIGJlZW4gcHJvY2Vzc2VkLlxyXG4gICAgICAgICAgICAvLyBXZSBjYW4gZ2V0IGludG8gdGhpcyByYWNlIGNvbmRpdGlvbiBpZiB0aGUgdXNlciBoYXMgd2luZG93cyB0aGF0IHdlcmUgb3BlbmVkIHByZXZpb3VzbHkuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5fYWN0aXZhdGVkKSB7XHJcbiAgICAgICAgICAgICAgICBfLmRlbGF5KGNiLCBTT0xVVElPTl9MT0FEX1RJTUUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gQXR0ZW1wdCB0byBzZWUgaWYgdGhpcyBmaWxlIGlzIHBhcnQgYSBzb2x1dGlvblxyXG4gICAgICAgICAgICAgICAgY29uc3QgciA9IHRoaXMuX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIChpbnRlcnNlY3QsIHNvbHV0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHNvbHV0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChyKSByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNlYXJjaC50aGVuKCgpID0+IE9ic2VydmFibGUuZnJvbShjYW5kaWRhdGVzKVxyXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB0aGlzLl9maW5kUmVwb3NpdG9yeUZvclBhdGgoeC5wYXRoKSwgKGNhbmRpZGF0ZSwgcmVwbykgPT4gKHsgY2FuZGlkYXRlLCByZXBvIH0pKVxyXG4gICAgICAgICAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgICAgICAgICAgLnRvUHJvbWlzZSgpKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVwb3MgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbmRpZGF0ZXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcy5tYXAoeiA9PiB6LnBhdGgpLCBmcm9tSXRlcmF0b3IodGhpcy5fc29sdXRpb25zLmtleXMoKSkpLm1hcCh6ID0+IF8uZmluZChjYW5kaWRhdGVzLCB7IHBhdGg6IHogfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKHsgcGF0aCwgaXNQcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQocmVwb3MsIHggPT4geC5jYW5kaWRhdGUucGF0aCA9PT0gcGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBvID0gZm91bmQgJiYgZm91bmQucmVwbztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHBhdGgsIGlzUHJvamVjdCwgcmVwbywgb3JpZ2luYWxGaWxlIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGFkZENhbmRpZGF0ZXNJbk9yZGVyKG5ld0NhbmRpZGF0ZXMsIChjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3Jhcnk6ICFwcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNGb2xkZXJQZXJGaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXR0ZW1wdCB0byBzZWUgaWYgdGhpcyBmaWxlIGlzIHBhcnQgYSBzb2x1dGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQoc29sdXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocikgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdCA9IHRoaXMuX2ludGVyc2VjdFBhdGgobG9jYXRpb24pIHx8IHRoaXMuX2ludGVyc2VjdEF0b21Qcm9qZWN0UGF0aChsb2NhdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoaW50ZXJzZWN0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQodGhpcy5fc29sdXRpb25zLmdldChpbnRlcnNlY3QpKTsgLy8gVGhlIGJvb2xlYW4gbWVhbnMgdGhpcyBzb2x1dGlvbiBpcyB0ZW1wb3JhcnkuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhgQ291bGQgbm90IGZpbmQgYSBzb2x1dGlvbiBmb3IgXCIke2xvY2F0aW9ufVwiYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5fY2FuZGlkYXRlRmluZGVyKGRpcmVjdG9yeSkuc3Vic2NyaWJlKGNiKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIDxPYnNlcnZhYmxlPFNvbHV0aW9uPj48YW55PnN1YmplY3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfY2FuZGlkYXRlRmluZGVyKGRpcmVjdG9yeTogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbmRDYW5kaWRhdGVzLndpdGhDYW5kaWRhdGVzKGRpcmVjdG9yeSwgdGhpcy5sb2dnZXIsIHtcclxuICAgICAgICAgICAgc29sdXRpb25JbmRlcGVuZGVudFNvdXJjZUZpbGVzVG9TZWFyY2g6IHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMubWFwKHogPT4gXCIqXCIgKyB6KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKGNhbmRpZGF0ZXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2xucyA9IF8uZmlsdGVyKGNhbmRpZGF0ZXMsIHggPT4gXy5lbmRzV2l0aCh4LnBhdGgsIFwiLnNsblwiKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2xucy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcywgc2xucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXN5bmNSZXN1bHQgPSBuZXcgQXN5bmNTdWJqZWN0PHR5cGVvZiBjYW5kaWRhdGVzPigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0Lm5leHQoaXRlbXMpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBoYW5kbGUgbXVsdGlwbGUgc29sdXRpb25zLlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxpc3RWaWV3ID0gbmV3IEdlbmVyaWNTZWxlY3RMaXN0VmlldyhcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzbG5zLm1hcCh4ID0+ICh7IGRpc3BsYXlOYW1lOiB4LnBhdGgsIG5hbWU6IHgucGF0aCB9KSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChyZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXMudW5zaGlmdCguLi5zbG5zLmZpbHRlcih4ID0+IHgucGF0aCA9PT0gcmVzdWx0KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmVhY2goY2FuZGlkYXRlcywgeCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FuZGlkYXRlRmluZGVyQ2FjaGUuYWRkKHgucGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdFZpZXcubWVzc2FnZS50ZXh0KFwiUGxlYXNlIHNlbGVjdCBhIHNvbHV0aW9uIHRvIGxvYWQuXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93IHRoZSB2aWV3XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wZW5TZWxlY3RMaXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5TZWxlY3RMaXN0Lm9uQ2xvc2VkLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV8uc29tZShzbG5zLCB4ID0+IHRoaXMuX2NhbmRpZGF0ZUZpbmRlckNhY2hlLmhhcyh4LnBhdGgpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uZGVmZXIoKCkgPT4gbGlzdFZpZXcudG9nZ2xlKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfLmRlZmVyKCgpID0+IGxpc3RWaWV3LnRvZ2dsZSgpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmRvKHsgY29tcGxldGU6ICgpID0+IG9wZW5TZWxlY3RMaXN0ID0gbnVsbCB9KTtcclxuICAgICAgICAgICAgICAgICAgICBvcGVuU2VsZWN0TGlzdCA9IGxpc3RWaWV3O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gPE9ic2VydmFibGU8dHlwZW9mIGNhbmRpZGF0ZXM+Pjxhbnk+YXN5bmNSZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGNhbmRpZGF0ZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVnaXN0ZXJDb25maWd1cmF0aW9uKGNhbGxiYWNrOiAoc29sdXRpb246IFNvbHV0aW9uKSA9PiB2b2lkKSB7XHJcbiAgICAgICAgdGhpcy5fY29uZmlndXJhdGlvbnMuYWRkKGNhbGxiYWNrKTtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBjYWxsYmFjayhzb2x1dGlvbikpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb246IHN0cmluZywgcGF0aHM/OiBzdHJpbmdbXSkge1xyXG4gICAgICAgIGNvbnN0IHZhbGlkU29sdXRpb25QYXRocyA9IHBhdGhzO1xyXG5cclxuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGxvY2F0aW9uLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgICBjb25zdCBtYXBwZWRMb2NhdGlvbnMgPSBzZWdtZW50cy5tYXAoKGxvYywgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIF8udGFrZShzZWdtZW50cywgaW5kZXggKyAxKS5qb2luKHBhdGguc2VwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gTG9vayBmb3IgdGhlIGNsb3Nlc3QgbWF0Y2ggZmlyc3QuXHJcbiAgICAgICAgbWFwcGVkTG9jYXRpb25zLnJldmVyc2UoKTtcclxuXHJcbiAgICAgICAgY29uc3QgaW50ZXJzZWN0OiBzdHJpbmcgPSBfLmludGVyc2VjdGlvbihtYXBwZWRMb2NhdGlvbnMsIHZhbGlkU29sdXRpb25QYXRocylbMF07XHJcbiAgICAgICAgaWYgKGludGVyc2VjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJzZWN0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5lbnRyaWVzKCkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhelsxXS5pc0ZvbGRlclBlckZpbGUpLm1hcCh6ID0+IHpbMF0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgobG9jYXRpb246IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uLCB0aGlzLl9hdG9tUHJvamVjdHMucGF0aHMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRDYW5kaWRhdGVzSW5PcmRlcihjYW5kaWRhdGVzOiB7IHBhdGg6IHN0cmluZzsgcmVwbzogUkVQT1NJVE9SWTsgaXNQcm9qZWN0OiBib29sZWFuOyBvcmlnaW5hbEZpbGU6IHN0cmluZzsgfVtdLCBjYjogKGNhbmRpZGF0ZTogc3RyaW5nLCByZXBvOiBSRVBPU0lUT1JZLCBpc1Byb2plY3Q6IGJvb2xlYW4sIG9yaWdpbmFsRmlsZTogc3RyaW5nKSA9PiBPYnNlcnZhYmxlPFNvbHV0aW9uPikge1xyXG4gICAgY29uc3QgYXN5bmNTdWJqZWN0ID0gbmV3IEFzeW5jU3ViamVjdCgpO1xyXG5cclxuICAgIGlmICghY2FuZGlkYXRlcy5sZW5ndGgpIHtcclxuICAgICAgICBhc3luY1N1YmplY3QubmV4dChjYW5kaWRhdGVzKTtcclxuICAgICAgICBhc3luY1N1YmplY3QuY29tcGxldGUoKTtcclxuICAgICAgICByZXR1cm4gYXN5bmNTdWJqZWN0LnRvUHJvbWlzZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNkcyA9IGNhbmRpZGF0ZXMuc2xpY2UoKTtcclxuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGNkcy5zaGlmdCgpO1xyXG4gICAgY29uc3QgaGFuZGxlQ2FuZGlkYXRlID0gKGNhbmQ6IHsgcGF0aDogc3RyaW5nOyByZXBvOiBSRVBPU0lUT1JZOyBpc1Byb2plY3Q6IGJvb2xlYW47IG9yaWdpbmFsRmlsZTogc3RyaW5nOyB9KSA9PiB7XHJcbiAgICAgICAgY2IoY2FuZC5wYXRoLCBjYW5kLnJlcG8sIGNhbmQuaXNQcm9qZWN0LCBjYW5kLm9yaWdpbmFsRmlsZSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZSh7XHJcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbmQgPSBjZHMuc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlQ2FuZGlkYXRlKGNhbmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jU3ViamVjdC5uZXh0KGNhbmRpZGF0ZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3luY1N1YmplY3QuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIGhhbmRsZUNhbmRpZGF0ZShjYW5kaWRhdGUpO1xyXG4gICAgcmV0dXJuIGFzeW5jU3ViamVjdC50b1Byb21pc2UoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZnJvbUl0ZXJhdG9yPFQ+KGl0ZXJhdG9yOiBJdGVyYWJsZUl0ZXJhdG9yPFQ+KSB7XHJcbiAgICBjb25zdCBpdGVtczogVFtdID0gW107XHJcbiAgICBsZXQgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xyXG4gICAgd2hpbGUgKCFyZXN1bHQuZG9uZSkge1xyXG4gICAgICAgIGl0ZW1zLnB1c2gocmVzdWx0LnZhbHVlKTtcclxuXHJcbiAgICAgICAgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpdGVtcztcclxufVxyXG5cclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5leHBvcnQgY29uc3QgU29sdXRpb25NYW5hZ2VyID0gbmV3IFNvbHV0aW9uSW5zdGFuY2VNYW5hZ2VyKCk7XHJcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
