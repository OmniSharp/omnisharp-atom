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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci5qcyIsImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci50cyJdLCJuYW1lcyI6WyJwYXRoIiwiU09MVVRJT05fTE9BRF9USU1FIiwib3BlblNlbGVjdExpc3QiLCJTb2x1dGlvbkluc3RhbmNlTWFuYWdlciIsIl91bml0VGVzdE1vZGVfIiwiX2tpY2tfaW5fdGhlX3BhbnRzXyIsIl9jb25maWd1cmF0aW9ucyIsIlNldCIsIl9zb2x1dGlvbnMiLCJNYXAiLCJfc29sdXRpb25Qcm9qZWN0cyIsIl90ZW1wb3JhcnlTb2x1dGlvbnMiLCJXZWFrTWFwIiwiX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcCIsIl9maW5kU29sdXRpb25DYWNoZSIsIl9jYW5kaWRhdGVGaW5kZXJDYWNoZSIsIl9hY3RpdmF0ZWQiLCJfbmV4dEluZGV4IiwiX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucyIsIl9hY3RpdmVTb2x1dGlvbnMiLCJfb2JzZXJ2YXRpb24iLCJfY29tYmluYXRpb24iLCJfYWN0aXZlU29sdXRpb24iLCJfYWN0aXZlU29sdXRpb25PYnNlcmFibGUiLCJkaXN0aW5jdFVudGlsQ2hhbmdlZCIsImZpbHRlciIsInoiLCJwdWJsaXNoUmVwbGF5IiwicmVmQ291bnQiLCJfYWN0aXZhdGVkU3ViamVjdCIsImFjdGl2ZUVkaXRvciIsIl9kaXNwb3NhYmxlIiwiX3NvbHV0aW9uRGlzcG9zYWJsZSIsIl9hdG9tUHJvamVjdHMiLCJhZGQiLCJfYWN0aXZlU2VhcmNoIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ1bmRlZmluZWQiLCJfc3Vic2NyaWJlVG9BdG9tUHJvamVjdFRyYWNrZXIiLCJmbGF0TWFwIiwiZ2V0U29sdXRpb25Gb3JFZGl0b3IiLCJzdWJzY3JpYmUiLCJuZXh0IiwieCIsImFjdGl2YXRlIiwiYWN0aXZhdGVkU3ViamVjdCIsImZvckVhY2giLCJzb2x1dGlvbiIsImNvbm5lY3QiLCJkaXNwb3NlIiwiZGlzY29ubmVjdCIsImNsZWFyIiwicmVtb3ZlZCIsImhhcyIsIl9yZW1vdmVTb2x1dGlvbiIsInByb2plY3QiLCJhZGRlZCIsIm1hcCIsIl9jYW5kaWRhdGVGaW5kZXIiLCJmcm9tIiwiY2FuZGlkYXRlcyIsIl9maW5kUmVwb3NpdG9yeUZvclBhdGgiLCJjYW5kaWRhdGUiLCJyZXBvIiwidG9BcnJheSIsInRvUHJvbWlzZSIsInRoZW4iLCJuZXdDYW5kaWRhdGVzIiwiZGlmZmVyZW5jZSIsImZyb21JdGVyYXRvciIsImtleXMiLCJmaW5kIiwiaXNQcm9qZWN0Iiwib3JpZ2luYWxGaWxlIiwiZm91bmQiLCJyZXBvcyIsImFkZENhbmRpZGF0ZXNJbk9yZGVyIiwiX2FkZFNvbHV0aW9uIiwiY2FuZGlkYXRlT2JzZXJ2YWJsZSIsIndvcmtpbmdQYXRoIiwiYXRvbSIsImdldFJlcG9zaXRvcmllcyIsImRpcmVjdG9yeSIsImdldFdvcmtpbmdEaXJlY3RvcnkiLCJub3JtYWxpemUiLCJ0YWtlIiwidGVtcG9yYXJ5IiwicHJvamVjdFBhdGgiLCJlbmRzV2l0aCIsImRpcm5hbWUiLCJnZXQiLCJpc0Rpc3Bvc2VkIiwib2YiLCJkaXNwb3NlciIsImluZGV4IiwicmVwb3NpdG9yeSIsInJ1bnRpbWUiLCJDbHJPck1vbm8iLCJDb3JlQ2xyIiwiaXNGb2xkZXJQZXJGaWxlIiwiY2QiLCJkaXNwb3NhYmxlIiwic2V0IiwiY3JlYXRlIiwicmVtb3ZlIiwicHVsbCIsImRlbGV0ZSIsImdldFZhbHVlIiwibGVuZ3RoIiwiY29uZmlnIiwidGVtcEQiLCJwdXNoIiwicmVzdWx0IiwiX2FkZFNvbHV0aW9uU3Vic2NyaXB0aW9ucyIsImVycm9yUmVzdWx0Iiwic3RhdGUiLCJFcnJvciIsImRlbGF5IiwiY29tcGxldGUiLCJtb2RlbCIsIm9ic2VydmUiLCJwcm9qZWN0QWRkZWQiLCJwcm9qZWN0UmVtb3ZlZCIsInByb2plY3RzIiwiZGVib3VuY2VUaW1lIiwidGltZW91dCIsInF1ZXVlIiwicmVmQ291bnREaXNwb3NhYmxlIiwiZW1wdHkiLCJzb21lIiwiX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMiLCJleHQiLCJsb2NhdGlvbiIsInNvbHV0aW9uVmFsdWUiLCJfZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aCIsIl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aCIsImVkaXRvciIsIl9nZXRTb2x1dGlvbkZvckVkaXRvciIsImlzRGVzdHJveWVkIiwiY29udGV4dCIsInRlbXAiLCJnZXREaXNwb3NhYmxlIiwib25EaWREZXN0cm95IiwiZ2V0UGF0aCIsIm9tbmlzaGFycCIsIm1ldGFkYXRhIiwiY3VycmVudFN0YXRlIiwiRGlzY29ubmVjdGVkIiwiX3NldHVwRWRpdG9yV2l0aENvbnRleHQiLCJkbyIsInNsbiIsImNiIiwicGF0aHMiLCJpbnRlcnNlY3QiLCJfaW50ZXJzZWN0UGF0aE1ldGhvZCIsIl9pbnRlcnNlY3RQYXRoIiwiX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24iLCJzZWdtZW50cyIsInNwbGl0Iiwic2VwIiwibWFwcGVkTG9jYXRpb25zIiwibG9jIiwiam9pbiIsImwiLCJzdWJqZWN0IiwiZWFjaCIsIl9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgiLCJyIiwibm90aWZpY2F0aW9ucyIsImFkZEluZm8iLCJ3aXRoQ2FuZGlkYXRlcyIsImxvZ2dlciIsInNvbHV0aW9uSW5kZXBlbmRlbnRTb3VyY2VGaWxlc1RvU2VhcmNoIiwic2xucyIsIml0ZW1zIiwiYXN5bmNSZXN1bHQiLCJsaXN0VmlldyIsImRpc3BsYXlOYW1lIiwibmFtZSIsInVuc2hpZnQiLCJtZXNzYWdlIiwidGV4dCIsIm9uQ2xvc2VkIiwiZGVmZXIiLCJ0b2dnbGUiLCJjYWxsYmFjayIsInZhbGlkU29sdXRpb25QYXRocyIsInJldmVyc2UiLCJpbnRlcnNlY3Rpb24iLCJlbnRyaWVzIiwibG9nIiwiZXJyb3IiLCJjb25zb2xlIiwiaXRlcmF0b3IiLCJ2YWx1ZXMiLCJkb25lIiwidmFsdWUiLCJDb25uZWN0ZWQiLCJhc3luY1N1YmplY3QiLCJjZHMiLCJzbGljZSIsInNo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QVQ7QUFDSDtBQUVELFdBQU9vSSxLQUFQO0FBQ0g7QUFHTSxJQUFNOEIsNENBQWtCLElBQUkxTSx1QkFBSixFQUF4QiIsImZpbGUiOiJsaWIvc2VydmVyL3NvbHV0aW9uLW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBBc3luY1N1YmplY3QsIEJlaGF2aW9yU3ViamVjdCwgU2NoZWR1bGVyLCBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IFJlZkNvdW50RGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgU29sdXRpb24gfSBmcm9tIFwiLi9zb2x1dGlvblwiO1xuaW1wb3J0IHsgQXRvbVByb2plY3RUcmFja2VyIH0gZnJvbSBcIi4vYXRvbS1wcm9qZWN0c1wiO1xuaW1wb3J0IHsgU29sdXRpb25PYnNlcnZlciwgU29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlciB9IGZyb20gXCIuL2NvbXBvc2l0ZS1zb2x1dGlvblwiO1xuaW1wb3J0IHsgRHJpdmVyU3RhdGUsIGZpbmRDYW5kaWRhdGVzLCBSdW50aW1lIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IEdlbmVyaWNTZWxlY3RMaXN0VmlldyB9IGZyb20gXCIuLi92aWV3cy9nZW5lcmljLWxpc3Qtdmlld1wiO1xuaW1wb3J0IHsgaXNPbW5pc2hhcnBUZXh0RWRpdG9yLCBPbW5pc2hhcnBFZGl0b3JDb250ZXh0IH0gZnJvbSBcIi4vb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XG5jb25zdCBTT0xVVElPTl9MT0FEX1RJTUUgPSAzMDAwMDtcbmxldCBvcGVuU2VsZWN0TGlzdDtcbmNsYXNzIFNvbHV0aW9uSW5zdGFuY2VNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fdW5pdFRlc3RNb2RlXyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9raWNrX2luX3RoZV9wYW50c18gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fY29uZmlndXJhdGlvbnMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25Qcm9qZWN0cyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zID0gbmV3IFdlYWtNYXAoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwID0gbmV3IFdlYWtNYXAoKTtcbiAgICAgICAgdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX2NhbmRpZGF0ZUZpbmRlckNhY2hlID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fbmV4dEluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5fc3BlY2lhbENhc2VFeHRlbnNpb25zID0gW1wiLmNzeFwiLF07XG4gICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLl9vYnNlcnZhdGlvbiA9IG5ldyBTb2x1dGlvbk9ic2VydmVyKCk7XG4gICAgICAgIHRoaXMuX2NvbWJpbmF0aW9uID0gbmV3IFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb24gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KG51bGwpO1xuICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbk9ic2VyYWJsZSA9IHRoaXMuX2FjdGl2ZVNvbHV0aW9uLmRpc3RpbmN0VW50aWxDaGFuZ2VkKCkuZmlsdGVyKHogPT4gISF6KS5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZFN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICAgIH1cbiAgICBnZXQgbG9nZ2VyKCkge1xuICAgICAgICBpZiAodGhpcy5fdW5pdFRlc3RNb2RlXyB8fCB0aGlzLl9raWNrX2luX3RoZV9wYW50c18pIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbG9nOiAoKSA9PiB7IH0sXG4gICAgICAgICAgICAgICAgZXJyb3I6ICgpID0+IHsgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29uc29sZTtcbiAgICB9XG4gICAgZ2V0IF9fc3BlY2lhbENhc2VFeHRlbnNpb25zKCkgeyByZXR1cm4gdGhpcy5fc3BlY2lhbENhc2VFeHRlbnNpb25zOyB9XG4gICAgZ2V0IGFjdGl2ZVNvbHV0aW9ucygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNvbHV0aW9ucztcbiAgICB9XG4gICAgZ2V0IHNvbHV0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vYnNlcnZhdGlvbjtcbiAgICB9XG4gICAgZ2V0IHNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb21iaW5hdGlvbjtcbiAgICB9XG4gICAgZ2V0IGFjdGl2ZVNvbHV0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlU29sdXRpb25PYnNlcmFibGU7XG4gICAgfVxuICAgIGdldCBhY3RpdmF0ZWRTdWJqZWN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZhdGVkU3ViamVjdDtcbiAgICB9XG4gICAgYWN0aXZhdGUoYWN0aXZlRWRpdG9yKSB7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmF0ZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9hdG9tUHJvamVjdHMgPSBuZXcgQXRvbVByb2plY3RUcmFja2VyKCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX2F0b21Qcm9qZWN0cyk7XG4gICAgICAgIHRoaXMuX2FjdGl2ZVNlYXJjaCA9IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICB0aGlzLl9zdWJzY3JpYmVUb0F0b21Qcm9qZWN0VHJhY2tlcigpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhY3RpdmVFZGl0b3JcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHRoaXMuZ2V0U29sdXRpb25Gb3JFZGl0b3IoeikpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHggPT4gdGhpcy5fYWN0aXZlU29sdXRpb24ubmV4dCh4KSkpO1xuICAgICAgICB0aGlzLl9hdG9tUHJvamVjdHMuYWN0aXZhdGUoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5hY3RpdmF0ZWRTdWJqZWN0Lm5leHQodHJ1ZSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZSk7XG4gICAgfVxuICAgIGNvbm5lY3QoKSB7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5mb3JFYWNoKHNvbHV0aW9uID0+IHNvbHV0aW9uLmNvbm5lY3QoKSk7XG4gICAgfVxuICAgIGRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5mb3JFYWNoKHNvbHV0aW9uID0+IHNvbHV0aW9uLmRpc3Bvc2UoKSk7XG4gICAgfVxuICAgIGRlYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvblByb2plY3RzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmNsZWFyKCk7XG4gICAgfVxuICAgIGdldCBjb25uZWN0ZWQoKSB7XG4gICAgICAgIGNvbnN0IGl0ZXJhdG9yID0gdGhpcy5fc29sdXRpb25zLnZhbHVlcygpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIHdoaWxlICghcmVzdWx0LmRvbmUpXG4gICAgICAgICAgICBpZiAocmVzdWx0LnZhbHVlLmN1cnJlbnRTdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIF9zdWJzY3JpYmVUb0F0b21Qcm9qZWN0VHJhY2tlcigpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fYXRvbVByb2plY3RzLnJlbW92ZWRcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB0aGlzLl9zb2x1dGlvbnMuaGFzKHopKVxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3JlbW92ZVNvbHV0aW9uKHByb2plY3QpKSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX2F0b21Qcm9qZWN0cy5hZGRlZFxuICAgICAgICAgICAgLmZpbHRlcihwcm9qZWN0ID0+ICF0aGlzLl9zb2x1dGlvblByb2plY3RzLmhhcyhwcm9qZWN0KSlcbiAgICAgICAgICAgIC5tYXAocHJvamVjdCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FuZGlkYXRlRmluZGVyKHByb2plY3QpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoY2FuZGlkYXRlcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbShjYW5kaWRhdGVzKVxuICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCh4ID0+IHRoaXMuX2ZpbmRSZXBvc2l0b3J5Rm9yUGF0aCh4LnBhdGgpLCAoY2FuZGlkYXRlLCByZXBvKSA9PiAoeyBjYW5kaWRhdGUsIHJlcG8gfSkpXG4gICAgICAgICAgICAgICAgICAgIC50b0FycmF5KClcbiAgICAgICAgICAgICAgICAgICAgLnRvUHJvbWlzZSgpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKHJlcG9zID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3Q2FuZGlkYXRlcyA9IF8uZGlmZmVyZW5jZShjYW5kaWRhdGVzLm1hcCh6ID0+IHoucGF0aCksIGZyb21JdGVyYXRvcih0aGlzLl9zb2x1dGlvbnMua2V5cygpKSkubWFwKHogPT4gXy5maW5kKGNhbmRpZGF0ZXMsIHsgcGF0aDogeiB9KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKHsgcGF0aCwgaXNQcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQocmVwb3MsIHggPT4geC5jYW5kaWRhdGUucGF0aCA9PT0gcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBvID0gZm91bmQgJiYgZm91bmQucmVwbztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHBhdGgsIGlzUHJvamVjdCwgcmVwbywgb3JpZ2luYWxGaWxlIH07XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWRkQ2FuZGlkYXRlc0luT3JkZXIobmV3Q2FuZGlkYXRlcywgKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCBvcmlnaW5hbEZpbGUpID0+IHRoaXMuX2FkZFNvbHV0aW9uKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCB7IG9yaWdpbmFsRmlsZSwgcHJvamVjdCB9KSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS50b1Byb21pc2UoKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY2FuZGlkYXRlT2JzZXJ2YWJsZSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2ggPSB0aGlzLl9hY3RpdmVTZWFyY2gudGhlbigoKSA9PiBjYW5kaWRhdGVPYnNlcnZhYmxlKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBfZmluZFJlcG9zaXRvcnlGb3JQYXRoKHdvcmtpbmdQYXRoKSB7XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20oYXRvbS5wcm9qZWN0LmdldFJlcG9zaXRvcmllcygpIHx8IFtdKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheClcbiAgICAgICAgICAgIC5tYXAocmVwbyA9PiAoeyByZXBvLCBkaXJlY3Rvcnk6IHJlcG8uZ2V0V29ya2luZ0RpcmVjdG9yeSgpIH0pKVxuICAgICAgICAgICAgLmZpbHRlcigoeyBkaXJlY3RvcnkgfSkgPT4gcGF0aC5ub3JtYWxpemUoZGlyZWN0b3J5KSA9PT0gcGF0aC5ub3JtYWxpemUod29ya2luZ1BhdGgpKVxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5tYXAoeCA9PiB4LnJlcG8pO1xuICAgIH1cbiAgICBfYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgdGVtcG9yYXJ5ID0gZmFsc2UsIHByb2plY3QsIG9yaWdpbmFsRmlsZSB9KSB7XG4gICAgICAgIGNvbnN0IHByb2plY3RQYXRoID0gY2FuZGlkYXRlO1xuICAgICAgICBpZiAoXy5lbmRzV2l0aChjYW5kaWRhdGUsIFwiLnNsblwiKSkge1xuICAgICAgICAgICAgY2FuZGlkYXRlID0gcGF0aC5kaXJuYW1lKGNhbmRpZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNvbHV0aW9uO1xuICAgICAgICBpZiAodGhpcy5fc29sdXRpb25zLmhhcyhjYW5kaWRhdGUpKSB7XG4gICAgICAgICAgICBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9ucy5nZXQoY2FuZGlkYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwcm9qZWN0ICYmIHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuaGFzKHByb2plY3QpKSB7XG4gICAgICAgICAgICBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuZ2V0KHByb2plY3QpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzb2x1dGlvbiAmJiAhc29sdXRpb24uaXNEaXNwb3NlZCkge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoc29sdXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNvbHV0aW9uICYmIHNvbHV0aW9uLmlzRGlzcG9zZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2VyID0gdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLmdldChzb2x1dGlvbik7XG4gICAgICAgICAgICBkaXNwb3Nlci5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgc29sdXRpb24gPSBuZXcgU29sdXRpb24oe1xuICAgICAgICAgICAgcHJvamVjdFBhdGg6IHByb2plY3RQYXRoLFxuICAgICAgICAgICAgaW5kZXg6ICsrdGhpcy5fbmV4dEluZGV4LFxuICAgICAgICAgICAgdGVtcG9yYXJ5OiB0ZW1wb3JhcnksXG4gICAgICAgICAgICByZXBvc2l0b3J5OiByZXBvLFxuICAgICAgICAgICAgcnVudGltZTogXy5lbmRzV2l0aChvcmlnaW5hbEZpbGUsIFwiLmNzeFwiKSA/IFJ1bnRpbWUuQ2xyT3JNb25vIDogUnVudGltZS5Db3JlQ2xyXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIWlzUHJvamVjdCkge1xuICAgICAgICAgICAgc29sdXRpb24uaXNGb2xkZXJQZXJGaWxlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQoc29sdXRpb24pO1xuICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChjZCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcC5zZXQoc29sdXRpb24sIGNkKTtcbiAgICAgICAgc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgc29sdXRpb24uY29ubmVjdCA9ICgpID0+IHRoaXMuX2FkZFNvbHV0aW9uKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCB7IHRlbXBvcmFyeSwgcHJvamVjdCB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLnJlbW92ZShjZCk7XG4gICAgICAgICAgICBfLnB1bGwodGhpcy5fYWN0aXZlU29sdXRpb25zLCBzb2x1dGlvbik7XG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZGVsZXRlKGNhbmRpZGF0ZSk7XG4gICAgICAgICAgICBpZiAodGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuZGVsZXRlKHNvbHV0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9hY3RpdmVTb2x1dGlvbi5nZXRWYWx1ZSgpID09PSBzb2x1dGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQodGhpcy5fYWN0aXZlU29sdXRpb25zLmxlbmd0aCA/IHRoaXMuX2FjdGl2ZVNvbHV0aW9uc1swXSA6IG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyYXRpb25zLmZvckVhY2goY29uZmlnID0+IGNvbmZpZyhzb2x1dGlvbikpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuc2V0KGNhbmRpZGF0ZSwgc29sdXRpb24pO1xuICAgICAgICBjZC5hZGQodGhpcy5fb2JzZXJ2YXRpb24uYWRkKHNvbHV0aW9uKSk7XG4gICAgICAgIGNkLmFkZCh0aGlzLl9jb21iaW5hdGlvbi5hZGQoc29sdXRpb24pKTtcbiAgICAgICAgaWYgKHRlbXBvcmFyeSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcEQgPSBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7IH0pO1xuICAgICAgICAgICAgdGVtcEQuZGlzcG9zZSgpO1xuICAgICAgICAgICAgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLnNldChzb2x1dGlvbiwgbmV3IFJlZkNvdW50RGlzcG9zYWJsZSh0ZW1wRCkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9ucy5wdXNoKHNvbHV0aW9uKTtcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZVNvbHV0aW9ucy5sZW5ndGggPT09IDEpXG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbi5uZXh0KHNvbHV0aW9uKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fYWRkU29sdXRpb25TdWJzY3JpcHRpb25zKHNvbHV0aW9uLCBjZCk7XG4gICAgICAgIHNvbHV0aW9uLmNvbm5lY3QoKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgX2FkZFNvbHV0aW9uU3Vic2NyaXB0aW9ucyhzb2x1dGlvbiwgY2QpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IEFzeW5jU3ViamVjdCgpO1xuICAgICAgICBjb25zdCBlcnJvclJlc3VsdCA9IHNvbHV0aW9uLnN0YXRlXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuRXJyb3IpXG4gICAgICAgICAgICAuZGVsYXkoMTAwKVxuICAgICAgICAgICAgLnRha2UoMSk7XG4gICAgICAgIGNkLmFkZChlcnJvclJlc3VsdC5zdWJzY3JpYmUoKCkgPT4gcmVzdWx0LmNvbXBsZXRlKCkpKTtcbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdEFkZGVkLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuc2V0KHByb2plY3QucGF0aCwgc29sdXRpb24pKSk7XG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RSZW1vdmVkLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuZGVsZXRlKHByb2plY3QucGF0aCkpKTtcbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdHNcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwKVxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5tYXAoKCkgPT4gc29sdXRpb24pXG4gICAgICAgICAgICAudGltZW91dChTT0xVVElPTl9MT0FEX1RJTUUsIFNjaGVkdWxlci5xdWV1ZSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgcmVzdWx0Lm5leHQoc29sdXRpb24pO1xuICAgICAgICAgICAgcmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdC5jb21wbGV0ZSgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIF9yZW1vdmVTb2x1dGlvbihjYW5kaWRhdGUpIHtcbiAgICAgICAgaWYgKF8uZW5kc1dpdGgoY2FuZGlkYXRlLCBcIi5zbG5cIikpIHtcbiAgICAgICAgICAgIGNhbmRpZGF0ZSA9IHBhdGguZGlybmFtZShjYW5kaWRhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNvbHV0aW9uID0gdGhpcy5fc29sdXRpb25zLmdldChjYW5kaWRhdGUpO1xuICAgICAgICBjb25zdCByZWZDb3VudERpc3Bvc2FibGUgPSBzb2x1dGlvbiAmJiB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuaGFzKHNvbHV0aW9uKSAmJiB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuZ2V0KHNvbHV0aW9uKTtcbiAgICAgICAgaWYgKHJlZkNvdW50RGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgcmVmQ291bnREaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIGlmICghcmVmQ291bnREaXNwb3NhYmxlLmlzRGlzcG9zZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLmdldChzb2x1dGlvbik7XG4gICAgICAgICAgICBpZiAoZGlzcG9zYWJsZSlcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRTb2x1dGlvbkZvclBhdGgocGF0aCkge1xuICAgICAgICBpZiAoIXBhdGgpXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICBjb25zdCBpc0ZvbGRlclBlckZpbGUgPSBfLnNvbWUodGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgocGF0aCwgZXh0KSk7XG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gcGF0aDtcbiAgICAgICAgaWYgKCFsb2NhdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzb2x1dGlvblZhbHVlID0gdGhpcy5fZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcbiAgICAgICAgaWYgKHNvbHV0aW9uVmFsdWUpXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvblZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpO1xuICAgIH1cbiAgICBnZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcikuZmlsdGVyKCgpID0+ICFlZGl0b3IuaXNEZXN0cm95ZWQoKSk7XG4gICAgfVxuICAgIF9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvciwgc29sdXRpb24pIHtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IG5ldyBPbW5pc2hhcnBFZGl0b3JDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBlZGl0b3I7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGNvbnRleHQpO1xuICAgICAgICBpZiAoc29sdXRpb24gJiYgIWNvbnRleHQudGVtcCAmJiB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuaGFzKHNvbHV0aW9uKSkge1xuICAgICAgICAgICAgY29uc3QgcmVmQ291bnREaXNwb3NhYmxlID0gdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmdldChzb2x1dGlvbik7XG4gICAgICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gcmVmQ291bnREaXNwb3NhYmxlLmdldERpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIGNvbnRleHQudGVtcCA9IHRydWU7XG4gICAgICAgICAgICBjb250ZXh0LnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZVNvbHV0aW9uKHNvbHV0aW9uLnBhdGgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIF9nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpIHtcbiAgICAgICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSBlZGl0b3IuZ2V0UGF0aCgpO1xuICAgICAgICBpZiAoIWxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc09tbmlzaGFycFRleHRFZGl0b3IoZWRpdG9yKSkge1xuICAgICAgICAgICAgaWYgKGVkaXRvci5vbW5pc2hhcnAubWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgc29sdXRpb24gPSBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uO1xuICAgICAgICAgICAgaWYgKHNvbHV0aW9uLmN1cnJlbnRTdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkICYmIGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLmF1dG9TdGFydE9uQ29tcGF0aWJsZUZpbGVcIikpXG4gICAgICAgICAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xuICAgICAgICAgICAgaWYgKHNvbHV0aW9uLmN1cnJlbnRTdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoc29sdXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlzRm9sZGVyUGVyRmlsZSA9IF8uc29tZSh0aGlzLl9fc3BlY2lhbENhc2VFeHRlbnNpb25zLCBleHQgPT4gXy5lbmRzV2l0aChlZGl0b3IuZ2V0UGF0aCgpLCBleHQpKTtcbiAgICAgICAgY29uc3Qgc29sdXRpb24gPSB0aGlzLl9nZXRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpO1xuICAgICAgICBpZiAoc29sdXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yLCBzb2x1dGlvbik7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpXG4gICAgICAgICAgICAuZG8oKHNsbikgPT4gdGhpcy5fc2V0dXBFZGl0b3JXaXRoQ29udGV4dChlZGl0b3IsIHNsbikpO1xuICAgIH1cbiAgICBfaXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgY2IpIHtcbiAgICAgICAgZm9yIChjb25zdCBzb2x1dGlvbiBvZiB0aGlzLl9hY3RpdmVTb2x1dGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5pc0ZvbGRlclBlckZpbGUpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCBwYXRocyA9IHNvbHV0aW9uLm1vZGVsLnByb2plY3RzLm1hcCh6ID0+IHoucGF0aCk7XG4gICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uLCBwYXRocyk7XG4gICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiKGludGVyc2VjdCwgc29sdXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIF9nZXRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgaWYgKGxvY2F0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGguZGlybmFtZShsb2NhdGlvbik7XG4gICAgICAgICAgICBpZiAodGhpcy5fc29sdXRpb25zLmhhcyhkaXJlY3RvcnkpKVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9zb2x1dGlvbnMuZ2V0KGRpcmVjdG9yeSk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdCA9IHRoaXMuX2ludGVyc2VjdFBhdGgobG9jYXRpb24pO1xuICAgICAgICAgICAgaWYgKGludGVyc2VjdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9zb2x1dGlvbnMuZ2V0KGludGVyc2VjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4gc29sdXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBfZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSkge1xuICAgICAgICBjb25zdCBkaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUobG9jYXRpb24pO1xuICAgICAgICBpZiAoIXRoaXMuX2FjdGl2YXRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZhdGVkU3ViamVjdC50YWtlKDEpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gdGhpcy5fZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNlZ21lbnRzID0gbG9jYXRpb24uc3BsaXQocGF0aC5zZXApO1xuICAgICAgICBjb25zdCBtYXBwZWRMb2NhdGlvbnMgPSBzZWdtZW50cy5tYXAoKGxvYywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBfLnRha2Uoc2VnbWVudHMsIGluZGV4ICsgMSkuam9pbihwYXRoLnNlcCk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKGxldCBsIG9mIG1hcHBlZExvY2F0aW9ucykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmhhcyhsKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5nZXQobCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3ViamVjdCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgXy5lYWNoKG1hcHBlZExvY2F0aW9ucywgbCA9PiB7XG4gICAgICAgICAgICB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5zZXQobCwgc3ViamVjdCk7XG4gICAgICAgICAgICBzdWJqZWN0LnN1YnNjcmliZSh7IGNvbXBsZXRlOiAoKSA9PiB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5kZWxldGUobCkgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBwcm9qZWN0ID0gdGhpcy5faW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGRpcmVjdG9yeSk7XG4gICAgICAgIGNvbnN0IGNiID0gKGNhbmRpZGF0ZXMpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fYWN0aXZhdGVkKSB7XG4gICAgICAgICAgICAgICAgXy5kZWxheShjYiwgU09MVVRJT05fTE9BRF9USU1FKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHIgPSB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQoc29sdXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChyKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2gudGhlbigoKSA9PiBPYnNlcnZhYmxlLmZyb20oY2FuZGlkYXRlcylcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCh4ID0+IHRoaXMuX2ZpbmRSZXBvc2l0b3J5Rm9yUGF0aCh4LnBhdGgpLCAoY2FuZGlkYXRlLCByZXBvKSA9PiAoeyBjYW5kaWRhdGUsIHJlcG8gfSkpXG4gICAgICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKSlcbiAgICAgICAgICAgICAgICAudGhlbihyZXBvcyA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3Q2FuZGlkYXRlcyA9IF8uZGlmZmVyZW5jZShjYW5kaWRhdGVzLm1hcCh6ID0+IHoucGF0aCksIGZyb21JdGVyYXRvcih0aGlzLl9zb2x1dGlvbnMua2V5cygpKSkubWFwKHogPT4gXy5maW5kKGNhbmRpZGF0ZXMsIHsgcGF0aDogeiB9KSlcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoeyBwYXRoLCBpc1Byb2plY3QsIG9yaWdpbmFsRmlsZSB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHJlcG9zLCB4ID0+IHguY2FuZGlkYXRlLnBhdGggPT09IHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBvID0gZm91bmQgJiYgZm91bmQucmVwbztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgcGF0aCwgaXNQcm9qZWN0LCByZXBvLCBvcmlnaW5hbEZpbGUgfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBhZGRDYW5kaWRhdGVzSW5PcmRlcihuZXdDYW5kaWRhdGVzLCAoY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIG9yaWdpbmFsRmlsZSkgPT4gdGhpcy5fYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgdGVtcG9yYXJ5OiAhcHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pKVxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gdGhpcy5faXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgKGludGVyc2VjdCwgc29sdXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQoc29sdXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YmplY3QuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uKSB8fCB0aGlzLl9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgobG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fc29sdXRpb25zLmhhcyhpbnRlcnNlY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHRoaXMuX3NvbHV0aW9ucy5nZXQoaW50ZXJzZWN0KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhgQ291bGQgbm90IGZpbmQgYSBzb2x1dGlvbiBmb3IgXCIke2xvY2F0aW9ufVwiYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2NhbmRpZGF0ZUZpbmRlcihkaXJlY3RvcnkpLnN1YnNjcmliZShjYik7XG4gICAgICAgIHJldHVybiBzdWJqZWN0O1xuICAgIH1cbiAgICBfY2FuZGlkYXRlRmluZGVyKGRpcmVjdG9yeSkge1xuICAgICAgICByZXR1cm4gZmluZENhbmRpZGF0ZXMud2l0aENhbmRpZGF0ZXMoZGlyZWN0b3J5LCB0aGlzLmxvZ2dlciwge1xuICAgICAgICAgICAgc29sdXRpb25JbmRlcGVuZGVudFNvdXJjZUZpbGVzVG9TZWFyY2g6IHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMubWFwKHogPT4gXCIqXCIgKyB6KVxuICAgICAgICB9KVxuICAgICAgICAgICAgLmZsYXRNYXAoY2FuZGlkYXRlcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBzbG5zID0gXy5maWx0ZXIoY2FuZGlkYXRlcywgeCA9PiBfLmVuZHNXaXRoKHgucGF0aCwgXCIuc2xuXCIpKTtcbiAgICAgICAgICAgIGlmIChzbG5zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtcyA9IF8uZGlmZmVyZW5jZShjYW5kaWRhdGVzLCBzbG5zKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3luY1Jlc3VsdCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5uZXh0KGl0ZW1zKTtcbiAgICAgICAgICAgICAgICBjb25zdCBsaXN0VmlldyA9IG5ldyBHZW5lcmljU2VsZWN0TGlzdFZpZXcoXCJcIiwgc2xucy5tYXAoeCA9PiAoeyBkaXNwbGF5TmFtZTogeC5wYXRoLCBuYW1lOiB4LnBhdGggfSkpLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLnVuc2hpZnQoLi4uc2xucy5maWx0ZXIoeCA9PiB4LnBhdGggPT09IHJlc3VsdCkpO1xuICAgICAgICAgICAgICAgICAgICBfLmVhY2goY2FuZGlkYXRlcywgeCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYW5kaWRhdGVGaW5kZXJDYWNoZS5hZGQoeC5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxpc3RWaWV3Lm1lc3NhZ2UudGV4dChcIlBsZWFzZSBzZWxlY3QgYSBzb2x1dGlvbiB0byBsb2FkLlwiKTtcbiAgICAgICAgICAgICAgICBpZiAob3BlblNlbGVjdExpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgb3BlblNlbGVjdExpc3Qub25DbG9zZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghXy5zb21lKHNsbnMsIHggPT4gdGhpcy5fY2FuZGlkYXRlRmluZGVyQ2FjaGUuaGFzKHgucGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5kZWZlcigoKSA9PiBsaXN0Vmlldy50b2dnbGUoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIF8uZGVmZXIoKCkgPT4gbGlzdFZpZXcudG9nZ2xlKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5kbyh7IGNvbXBsZXRlOiAoKSA9PiBvcGVuU2VsZWN0TGlzdCA9IG51bGwgfSk7XG4gICAgICAgICAgICAgICAgb3BlblNlbGVjdExpc3QgPSBsaXN0VmlldztcbiAgICAgICAgICAgICAgICByZXR1cm4gYXN5bmNSZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihjYW5kaWRhdGVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjaykge1xuICAgICAgICB0aGlzLl9jb25maWd1cmF0aW9ucy5hZGQoY2FsbGJhY2spO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBjYWxsYmFjayhzb2x1dGlvbikpO1xuICAgIH1cbiAgICBfaW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgcGF0aHMpIHtcbiAgICAgICAgY29uc3QgdmFsaWRTb2x1dGlvblBhdGhzID0gcGF0aHM7XG4gICAgICAgIGNvbnN0IHNlZ21lbnRzID0gbG9jYXRpb24uc3BsaXQocGF0aC5zZXApO1xuICAgICAgICBjb25zdCBtYXBwZWRMb2NhdGlvbnMgPSBzZWdtZW50cy5tYXAoKGxvYywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBfLnRha2Uoc2VnbWVudHMsIGluZGV4ICsgMSkuam9pbihwYXRoLnNlcCk7XG4gICAgICAgIH0pO1xuICAgICAgICBtYXBwZWRMb2NhdGlvbnMucmV2ZXJzZSgpO1xuICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSBfLmludGVyc2VjdGlvbihtYXBwZWRMb2NhdGlvbnMsIHZhbGlkU29sdXRpb25QYXRocylbMF07XG4gICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnRlcnNlY3Q7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2ludGVyc2VjdFBhdGgobG9jYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb24sIGZyb21JdGVyYXRvcih0aGlzLl9zb2x1dGlvbnMuZW50cmllcygpKVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6WzFdLmlzRm9sZGVyUGVyRmlsZSkubWFwKHogPT4gelswXSkpO1xuICAgIH1cbiAgICBfaW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGxvY2F0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uLCB0aGlzLl9hdG9tUHJvamVjdHMucGF0aHMpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFkZENhbmRpZGF0ZXNJbk9yZGVyKGNhbmRpZGF0ZXMsIGNiKSB7XG4gICAgY29uc3QgYXN5bmNTdWJqZWN0ID0gbmV3IEFzeW5jU3ViamVjdCgpO1xuICAgIGlmICghY2FuZGlkYXRlcy5sZW5ndGgpIHtcbiAgICAgICAgYXN5bmNTdWJqZWN0Lm5leHQoY2FuZGlkYXRlcyk7XG4gICAgICAgIGFzeW5jU3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICByZXR1cm4gYXN5bmNTdWJqZWN0LnRvUHJvbWlzZSgpO1xuICAgIH1cbiAgICBjb25zdCBjZHMgPSBjYW5kaWRhdGVzLnNsaWNlKCk7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gY2RzLnNoaWZ0KCk7XG4gICAgY29uc3QgaGFuZGxlQ2FuZGlkYXRlID0gKGNhbmQpID0+IHtcbiAgICAgICAgY2IoY2FuZC5wYXRoLCBjYW5kLnJlcG8sIGNhbmQuaXNQcm9qZWN0LCBjYW5kLm9yaWdpbmFsRmlsZSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY2RzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjYW5kID0gY2RzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZUNhbmRpZGF0ZShjYW5kKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jU3ViamVjdC5uZXh0KGNhbmRpZGF0ZXMpO1xuICAgICAgICAgICAgICAgICAgICBhc3luY1N1YmplY3QuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgaGFuZGxlQ2FuZGlkYXRlKGNhbmRpZGF0ZSk7XG4gICAgcmV0dXJuIGFzeW5jU3ViamVjdC50b1Byb21pc2UoKTtcbn1cbmZ1bmN0aW9uIGZyb21JdGVyYXRvcihpdGVyYXRvcikge1xuICAgIGNvbnN0IGl0ZW1zID0gW107XG4gICAgbGV0IHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICB3aGlsZSAoIXJlc3VsdC5kb25lKSB7XG4gICAgICAgIGl0ZW1zLnB1c2gocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgIH1cbiAgICByZXR1cm4gaXRlbXM7XG59XG5leHBvcnQgY29uc3QgU29sdXRpb25NYW5hZ2VyID0gbmV3IFNvbHV0aW9uSW5zdGFuY2VNYW5hZ2VyKCk7XG4iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBBc3luY1N1YmplY3QsIEJlaGF2aW9yU3ViamVjdCwgU2NoZWR1bGVyLCBTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge1JlZkNvdW50RGlzcG9zYWJsZSwgSURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge1NvbHV0aW9ufSBmcm9tIFwiLi9zb2x1dGlvblwiO1xyXG5pbXBvcnQge0F0b21Qcm9qZWN0VHJhY2tlcn0gZnJvbSBcIi4vYXRvbS1wcm9qZWN0c1wiO1xyXG5pbXBvcnQge1NvbHV0aW9uT2JzZXJ2ZXIsIFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXJ9IGZyb20gXCIuL2NvbXBvc2l0ZS1zb2x1dGlvblwiO1xyXG5pbXBvcnQge0RyaXZlclN0YXRlLCBmaW5kQ2FuZGlkYXRlcywgUnVudGltZSwgQ2FuZGlkYXRlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge0dlbmVyaWNTZWxlY3RMaXN0Vmlld30gZnJvbSBcIi4uL3ZpZXdzL2dlbmVyaWMtbGlzdC12aWV3XCI7XHJcbmltcG9ydCB7T21uaXNoYXJwVGV4dEVkaXRvciwgaXNPbW5pc2hhcnBUZXh0RWRpdG9yLCBPbW5pc2hhcnBFZGl0b3JDb250ZXh0fSBmcm9tIFwiLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcclxuXHJcbnR5cGUgUkVQT1NJVE9SWSA9IHsgZ2V0V29ya2luZ0RpcmVjdG9yeSgpOiBzdHJpbmc7IH07XHJcbmNvbnN0IFNPTFVUSU9OX0xPQURfVElNRSA9IDMwMDAwO1xyXG5cclxubGV0IG9wZW5TZWxlY3RMaXN0OiBHZW5lcmljU2VsZWN0TGlzdFZpZXc7XHJcbmNsYXNzIFNvbHV0aW9uSW5zdGFuY2VNYW5hZ2VyIHtcclxuICAgIC8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuICAgIHB1YmxpYyBfdW5pdFRlc3RNb2RlXyA9IGZhbHNlO1xyXG4gICAgcHVibGljIF9raWNrX2luX3RoZV9wYW50c18gPSBmYWxzZTtcclxuXHJcbiAgICBwcml2YXRlIGdldCBsb2dnZXIoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3VuaXRUZXN0TW9kZV8gfHwgdGhpcy5fa2lja19pbl90aGVfcGFudHNfKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBsb2c6ICgpID0+IHsvKiAqLyB9LFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6ICgpID0+IHsvKiAqLyB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY29uc29sZTtcclxuICAgIH1cclxuICAgIC8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX3NvbHV0aW9uRGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX2F0b21Qcm9qZWN0czogQXRvbVByb2plY3RUcmFja2VyO1xyXG5cclxuICAgIHByaXZhdGUgX2NvbmZpZ3VyYXRpb25zID0gbmV3IFNldDwoc29sdXRpb246IFNvbHV0aW9uKSA9PiB2b2lkPigpO1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25zID0gbmV3IE1hcDxzdHJpbmcsIFNvbHV0aW9uPigpO1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25Qcm9qZWN0cyA9IG5ldyBNYXA8c3RyaW5nLCBTb2x1dGlvbj4oKTtcclxuICAgIHByaXZhdGUgX3RlbXBvcmFyeVNvbHV0aW9ucyA9IG5ldyBXZWFrTWFwPFNvbHV0aW9uLCBSZWZDb3VudERpc3Bvc2FibGU+KCk7XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlU29sdXRpb25NYXAgPSBuZXcgV2Vha01hcDxTb2x1dGlvbiwgSURpc3Bvc2FibGU+KCk7XHJcbiAgICBwcml2YXRlIF9maW5kU29sdXRpb25DYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBPYnNlcnZhYmxlPFNvbHV0aW9uPj4oKTtcclxuICAgIHByaXZhdGUgX2NhbmRpZGF0ZUZpbmRlckNhY2hlID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcblxyXG4gICAgcHJpdmF0ZSBfYWN0aXZhdGVkID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIF9uZXh0SW5kZXggPSAwO1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZlU2VhcmNoOiBQcm9taXNlPGFueT47XHJcblxyXG4gICAgLy8gVGhlc2UgZXh0ZW5zaW9ucyBvbmx5IHN1cHBvcnQgc2VydmVyIHBlciBmb2xkZXIsIHVubGlrZSBub3JtYWwgY3MgZmlsZXMuXHJcbiAgICBwcml2YXRlIF9zcGVjaWFsQ2FzZUV4dGVuc2lvbnMgPSBbXCIuY3N4XCIsIC8qXCIuY2FrZVwiKi9dO1xyXG4gICAgcHVibGljIGdldCBfX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucygpIHsgcmV0dXJuIHRoaXMuX3NwZWNpYWxDYXNlRXh0ZW5zaW9uczsgfVxyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2ZVNvbHV0aW9uczogU29sdXRpb25bXSA9IFtdO1xyXG4gICAgcHVibGljIGdldCBhY3RpdmVTb2x1dGlvbnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNvbHV0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICAvLyB0aGlzIHNvbHV0aW9uIGNhbiBiZSB1c2VkIHRvIG9ic2VydmUgYmVoYXZpb3IgYWNyb3NzIGFsbCBzb2x1dGlvbi5cclxuICAgIHByaXZhdGUgX29ic2VydmF0aW9uID0gbmV3IFNvbHV0aW9uT2JzZXJ2ZXIoKTtcclxuICAgIHB1YmxpYyBnZXQgc29sdXRpb25PYnNlcnZlcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fb2JzZXJ2YXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdGhpcyBzb2x1dGlvbiBjYW4gYmUgdXNlZCB0byBhZ2dyZWdhdGUgYmVoYXZpb3IgYWNyb3NzIGFsbCBzb2x1dGlvbnNcclxuICAgIHByaXZhdGUgX2NvbWJpbmF0aW9uID0gbmV3IFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIoKTtcclxuICAgIHB1YmxpYyBnZXQgc29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY29tYmluYXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWN0aXZlU29sdXRpb24gPSBuZXcgQmVoYXZpb3JTdWJqZWN0PFNvbHV0aW9uPihudWxsKTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZVNvbHV0aW9uT2JzZXJhYmxlID0gdGhpcy5fYWN0aXZlU29sdXRpb24uZGlzdGluY3RVbnRpbENoYW5nZWQoKS5maWx0ZXIoeiA9PiAhIXopLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlU29sdXRpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNvbHV0aW9uT2JzZXJhYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2YXRlZFN1YmplY3QgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xyXG4gICAgcHJpdmF0ZSBnZXQgYWN0aXZhdGVkU3ViamVjdCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZhdGVkU3ViamVjdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoYWN0aXZlRWRpdG9yOiBPYnNlcnZhYmxlPE9tbmlzaGFycFRleHRFZGl0b3I+KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2YXRlZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuX2F0b21Qcm9qZWN0cyA9IG5ldyBBdG9tUHJvamVjdFRyYWNrZXIoKTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMpO1xyXG5cclxuICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2ggPSBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuXHJcbiAgICAgICAgLy8gbW9uaXRvciBhdG9tIHByb2plY3QgcGF0aHNcclxuICAgICAgICB0aGlzLl9zdWJzY3JpYmVUb0F0b21Qcm9qZWN0VHJhY2tlcigpO1xyXG5cclxuICAgICAgICAvLyBXZSB1c2UgdGhlIGFjdGl2ZSBlZGl0b3Igb24gb21uaXNoYXJwQXRvbSB0b1xyXG4gICAgICAgIC8vIGNyZWF0ZSBhbm90aGVyIG9ic2VydmFibGUgdGhhdCBjaG5hZ2VzIHdoZW4gd2UgZ2V0IGEgbmV3IHNvbHV0aW9uLlxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGFjdGl2ZUVkaXRvclxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxyXG4gICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHRoaXMuZ2V0U29sdXRpb25Gb3JFZGl0b3IoeikpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoeCA9PiB0aGlzLl9hY3RpdmVTb2x1dGlvbi5uZXh0KHgpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2F0b21Qcm9qZWN0cy5hY3RpdmF0ZSgpO1xyXG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5hY3RpdmF0ZWRTdWJqZWN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fc29sdXRpb25EaXNwb3NhYmxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29ubmVjdCgpIHtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBzb2x1dGlvbi5jb25uZWN0KCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNjb25uZWN0KCkge1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5mb3JFYWNoKHNvbHV0aW9uID0+IHNvbHV0aW9uLmRpc3Bvc2UoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuY2xlYXIoKTtcclxuICAgICAgICB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5jbGVhcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgY29ubmVjdGVkKCkge1xyXG4gICAgICAgIGNvbnN0IGl0ZXJhdG9yID0gdGhpcy5fc29sdXRpb25zLnZhbHVlcygpO1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcclxuICAgICAgICB3aGlsZSAoIXJlc3VsdC5kb25lKVxyXG4gICAgICAgICAgICBpZiAocmVzdWx0LnZhbHVlLmN1cnJlbnRTdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3N1YnNjcmliZVRvQXRvbVByb2plY3RUcmFja2VyKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX2F0b21Qcm9qZWN0cy5yZW1vdmVkXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB0aGlzLl9zb2x1dGlvbnMuaGFzKHopKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fcmVtb3ZlU29sdXRpb24ocHJvamVjdCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fYXRvbVByb2plY3RzLmFkZGVkXHJcbiAgICAgICAgICAgIC5maWx0ZXIocHJvamVjdCA9PiAhdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5oYXMocHJvamVjdCkpXHJcbiAgICAgICAgICAgIC5tYXAocHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FuZGlkYXRlRmluZGVyKHByb2plY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoY2FuZGlkYXRlcyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20oY2FuZGlkYXRlcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4gdGhpcy5fZmluZFJlcG9zaXRvcnlGb3JQYXRoKHgucGF0aCksIChjYW5kaWRhdGUsIHJlcG8pID0+ICh7IGNhbmRpZGF0ZSwgcmVwbyB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVwb3MgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbmRpZGF0ZXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcy5tYXAoeiA9PiB6LnBhdGgpLCBmcm9tSXRlcmF0b3IodGhpcy5fc29sdXRpb25zLmtleXMoKSkpLm1hcCh6ID0+IF8uZmluZChjYW5kaWRhdGVzLCB7IHBhdGg6IHogfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKHsgcGF0aCwgaXNQcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQocmVwb3MsIHggPT4geC5jYW5kaWRhdGUucGF0aCA9PT0gcGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBvID0gZm91bmQgJiYgZm91bmQucmVwbztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHBhdGgsIGlzUHJvamVjdCwgcmVwbywgb3JpZ2luYWxGaWxlIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhZGRDYW5kaWRhdGVzSW5PcmRlcihuZXdDYW5kaWRhdGVzLCAoY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIG9yaWdpbmFsRmlsZSkgPT4gdGhpcy5fYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgb3JpZ2luYWxGaWxlLCBwcm9qZWN0IH0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pLnRvUHJvbWlzZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGNhbmRpZGF0ZU9ic2VydmFibGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlU2VhcmNoID0gdGhpcy5fYWN0aXZlU2VhcmNoLnRoZW4oKCkgPT4gY2FuZGlkYXRlT2JzZXJ2YWJsZSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9maW5kUmVwb3NpdG9yeUZvclBhdGgod29ya2luZ1BhdGg6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb208UkVQT1NJVE9SWT4oYXRvbS5wcm9qZWN0LmdldFJlcG9zaXRvcmllcygpIHx8IFtdKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxyXG4gICAgICAgICAgICAubWFwKHJlcG8gPT4gKHsgcmVwbywgZGlyZWN0b3J5OiByZXBvLmdldFdvcmtpbmdEaXJlY3RvcnkoKSB9KSlcclxuICAgICAgICAgICAgLmZpbHRlcigoe2RpcmVjdG9yeX0pID0+IHBhdGgubm9ybWFsaXplKGRpcmVjdG9yeSkgPT09IHBhdGgubm9ybWFsaXplKHdvcmtpbmdQYXRoKSlcclxuICAgICAgICAgICAgLnRha2UoMSlcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHgucmVwbyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWRkU29sdXRpb24oY2FuZGlkYXRlOiBzdHJpbmcsIHJlcG86IFJFUE9TSVRPUlksIGlzUHJvamVjdDogYm9vbGVhbiwge3RlbXBvcmFyeSA9IGZhbHNlLCBwcm9qZWN0LCBvcmlnaW5hbEZpbGV9OiB7IGRlbGF5PzogbnVtYmVyOyB0ZW1wb3Jhcnk/OiBib29sZWFuOyBwcm9qZWN0Pzogc3RyaW5nOyBvcmlnaW5hbEZpbGU/OiBzdHJpbmc7IH0pIHtcclxuICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IGNhbmRpZGF0ZTtcclxuICAgICAgICBpZiAoXy5lbmRzV2l0aChjYW5kaWRhdGUsIFwiLnNsblwiKSkge1xyXG4gICAgICAgICAgICBjYW5kaWRhdGUgPSBwYXRoLmRpcm5hbWUoY2FuZGlkYXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzb2x1dGlvbjogU29sdXRpb247XHJcbiAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoY2FuZGlkYXRlKSkge1xyXG4gICAgICAgICAgICBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9ucy5nZXQoY2FuZGlkYXRlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHByb2plY3QgJiYgdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5oYXMocHJvamVjdCkpIHtcclxuICAgICAgICAgICAgc29sdXRpb24gPSB0aGlzLl9zb2x1dGlvblByb2plY3RzLmdldChwcm9qZWN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiAmJiAhc29sdXRpb24uaXNEaXNwb3NlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChzb2x1dGlvbiAmJiBzb2x1dGlvbi5pc0Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2VyID0gdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLmdldChzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIGRpc3Bvc2VyLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNvbHV0aW9uID0gbmV3IFNvbHV0aW9uKHtcclxuICAgICAgICAgICAgcHJvamVjdFBhdGg6IHByb2plY3RQYXRoLFxyXG4gICAgICAgICAgICBpbmRleDogKyt0aGlzLl9uZXh0SW5kZXgsXHJcbiAgICAgICAgICAgIHRlbXBvcmFyeTogdGVtcG9yYXJ5LFxyXG4gICAgICAgICAgICByZXBvc2l0b3J5OiA8YW55PnJlcG8sXHJcbiAgICAgICAgICAgIHJ1bnRpbWU6IF8uZW5kc1dpdGgob3JpZ2luYWxGaWxlLCBcIi5jc3hcIikgPyBSdW50aW1lLkNsck9yTW9ubyA6IFJ1bnRpbWUuQ29yZUNsclxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIWlzUHJvamVjdCkge1xyXG4gICAgICAgICAgICBzb2x1dGlvbi5pc0ZvbGRlclBlckZpbGUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHNvbHV0aW9uKTtcclxuICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChjZCk7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLnNldChzb2x1dGlvbiwgY2QpO1xyXG5cclxuICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uLmNvbm5lY3QgPSAoKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3JhcnksIHByb2plY3QgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgXy5wdWxsKHRoaXMuX2FjdGl2ZVNvbHV0aW9ucywgc29sdXRpb24pO1xyXG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZGVsZXRlKGNhbmRpZGF0ZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5kZWxldGUoc29sdXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fYWN0aXZlU29sdXRpb24uZ2V0VmFsdWUoKSA9PT0gc29sdXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQodGhpcy5fYWN0aXZlU29sdXRpb25zLmxlbmd0aCA/IHRoaXMuX2FjdGl2ZVNvbHV0aW9uc1swXSA6IG51bGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9jb25maWd1cmF0aW9ucy5mb3JFYWNoKGNvbmZpZyA9PiBjb25maWcoc29sdXRpb24pKTtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuc2V0KGNhbmRpZGF0ZSwgc29sdXRpb24pO1xyXG5cclxuICAgICAgICAvLyBrZWVwIHRyYWNrIG9mIHRoZSBhY3RpdmUgc29sdXRpb25zXHJcbiAgICAgICAgY2QuYWRkKHRoaXMuX29ic2VydmF0aW9uLmFkZChzb2x1dGlvbikpO1xyXG4gICAgICAgIGNkLmFkZCh0aGlzLl9jb21iaW5hdGlvbi5hZGQoc29sdXRpb24pKTtcclxuXHJcbiAgICAgICAgaWYgKHRlbXBvcmFyeSkge1xyXG4gICAgICAgICAgICBjb25zdCB0ZW1wRCA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHsgLyogKi8gfSk7XHJcbiAgICAgICAgICAgIHRlbXBELmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLnNldChzb2x1dGlvbiwgbmV3IFJlZkNvdW50RGlzcG9zYWJsZSh0ZW1wRCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb25zLnB1c2goc29sdXRpb24pO1xyXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID09PSAxKVxyXG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbi5uZXh0KHNvbHV0aW9uKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fYWRkU29sdXRpb25TdWJzY3JpcHRpb25zKHNvbHV0aW9uLCBjZCk7XHJcbiAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xyXG4gICAgICAgIHJldHVybiA8T2JzZXJ2YWJsZTxTb2x1dGlvbj4+PGFueT5yZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWRkU29sdXRpb25TdWJzY3JpcHRpb25zKHNvbHV0aW9uOiBTb2x1dGlvbiwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgQXN5bmNTdWJqZWN0PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIGNvbnN0IGVycm9yUmVzdWx0ID0gc29sdXRpb24uc3RhdGVcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkVycm9yKVxyXG4gICAgICAgICAgICAuZGVsYXkoMTAwKVxyXG4gICAgICAgICAgICAudGFrZSgxKTtcclxuXHJcbiAgICAgICAgY2QuYWRkKGVycm9yUmVzdWx0LnN1YnNjcmliZSgoKSA9PiByZXN1bHQuY29tcGxldGUoKSkpOyAvLyBJZiB0aGlzIHNvbHV0aW9uIGVycm9ycyBtb3ZlIG9uIHRvIHRoZSBuZXh0XHJcblxyXG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RBZGRlZC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLl9zb2x1dGlvblByb2plY3RzLnNldChwcm9qZWN0LnBhdGgsIHNvbHV0aW9uKSkpO1xyXG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RSZW1vdmVkLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuZGVsZXRlKHByb2plY3QucGF0aCkpKTtcclxuXHJcbiAgICAgICAgLy8gV2FpdCBmb3IgdGhlIHByb2plY3RzIHRvIHJldHVybiBmcm9tIHRoZSBzb2x1dGlvblxyXG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RzXHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwKVxyXG4gICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAubWFwKCgpID0+IHNvbHV0aW9uKVxyXG4gICAgICAgICAgICAudGltZW91dChTT0xVVElPTl9MT0FEX1RJTUUsIFNjaGVkdWxlci5xdWV1ZSkgLy8gV2FpdCAzMCBzZWNvbmRzIGZvciB0aGUgcHJvamVjdCB0byBsb2FkLlxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIFdlIGxvYWRlZCBzdWNjZXNzZnVsbHkgcmV0dXJuIHRoZSBzb2x1dGlvblxyXG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5leHQoc29sdXRpb24pO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIE1vdmUgYWxvbmcuXHJcbiAgICAgICAgICAgICAgICByZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3JlbW92ZVNvbHV0aW9uKGNhbmRpZGF0ZTogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKF8uZW5kc1dpdGgoY2FuZGlkYXRlLCBcIi5zbG5cIikpIHtcclxuICAgICAgICAgICAgY2FuZGlkYXRlID0gcGF0aC5kaXJuYW1lKGNhbmRpZGF0ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9ucy5nZXQoY2FuZGlkYXRlKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVmQ291bnREaXNwb3NhYmxlID0gc29sdXRpb24gJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikgJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmdldChzb2x1dGlvbik7XHJcbiAgICAgICAgaWYgKHJlZkNvdW50RGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICByZWZDb3VudERpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICBpZiAoIXJlZkNvdW50RGlzcG9zYWJsZS5pc0Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGtlZXAgdHJhY2sgb2YgdGhlIHJlbW92ZWQgc29sdXRpb25zXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uKSB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcC5nZXQoc29sdXRpb24pO1xyXG4gICAgICAgICAgICBpZiAoZGlzcG9zYWJsZSkgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRTb2x1dGlvbkZvclBhdGgocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKCFwYXRoKVxyXG4gICAgICAgICAgICAvLyBObyB0ZXh0IGVkaXRvciBmb3VuZFxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxTb2x1dGlvbj4oKTtcclxuXHJcbiAgICAgICAgY29uc3QgaXNGb2xkZXJQZXJGaWxlID0gXy5zb21lKHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKHBhdGgsIGV4dCkpO1xyXG5cclxuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IHBhdGg7XHJcbiAgICAgICAgaWYgKCFsb2NhdGlvbikge1xyXG4gICAgICAgICAgICAvLyBUZXh0IGVkaXRvciBub3Qgc2F2ZWQgeWV0P1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxTb2x1dGlvbj4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNvbHV0aW9uVmFsdWUgPSB0aGlzLl9nZXRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpO1xyXG5cclxuICAgICAgICBpZiAoc29sdXRpb25WYWx1ZSlcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoc29sdXRpb25WYWx1ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKS5maWx0ZXIoKCkgPT4gIWVkaXRvci5pc0Rlc3Ryb3llZCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBzb2x1dGlvbjogU29sdXRpb24pIHtcclxuICAgICAgICBjb25zdCBjb250ZXh0ID0gbmV3IE9tbmlzaGFycEVkaXRvckNvbnRleHQoZWRpdG9yLCBzb2x1dGlvbik7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0OiBPbW5pc2hhcnBUZXh0RWRpdG9yID0gPGFueT5lZGl0b3I7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoY29udGV4dCk7XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiAmJiAhY29udGV4dC50ZW1wICYmIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5oYXMoc29sdXRpb24pKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlZkNvdW50RGlzcG9zYWJsZSA9IHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5nZXQoc29sdXRpb24pO1xyXG4gICAgICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gcmVmQ291bnREaXNwb3NhYmxlLmdldERpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgY29udGV4dC50ZW1wID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29udGV4dC5zb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlU29sdXRpb24oc29sdXRpb24ucGF0aCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICBpZiAoIWVkaXRvcikge1xyXG4gICAgICAgICAgICAvLyBObyB0ZXh0IGVkaXRvciBmb3VuZFxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxTb2x1dGlvbj4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gZWRpdG9yLmdldFBhdGgoKTtcclxuICAgICAgICBpZiAoIWxvY2F0aW9uKSB7XHJcbiAgICAgICAgICAgIC8vIFRleHQgZWRpdG9yIG5vdCBzYXZlZCB5ZXQ/XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XHJcbiAgICAgICAgICAgIGlmIChlZGl0b3Iub21uaXNoYXJwLm1ldGFkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjbGllbnQgLyBzZXJ2ZXIgZG9lc25cInQgd29yayBjdXJyZW50bHkgZm9yIG1ldGFkYXRhIGRvY3VtZW50cy5cclxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzb2x1dGlvbiA9IGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb247XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGUgc29sdXRpb24gaGFzIGRpc2Nvbm5lY3RlZCwgcmVjb25uZWN0IGl0XHJcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCAmJiBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5hdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlXCIpKVxyXG4gICAgICAgICAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2xpZW50IGlzIGluIGFuIGludmFsaWQgc3RhdGVcclxuICAgICAgICAgICAgaWYgKHNvbHV0aW9uLmN1cnJlbnRTdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpc0ZvbGRlclBlckZpbGUgPSBfLnNvbWUodGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSk7XHJcbiAgICAgICAgY29uc3Qgc29sdXRpb24gPSB0aGlzLl9nZXRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpO1xyXG4gICAgICAgIGlmIChzb2x1dGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLl9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSlcclxuICAgICAgICAgICAgLmRvKChzbG4pID0+IHRoaXMuX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yLCBzbG4pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uPFQ+KGxvY2F0aW9uOiBzdHJpbmcsIGNiOiAoaW50ZXJzZWN0OiBzdHJpbmcsIHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gVCkge1xyXG4gICAgICAgIGZvciAoY29uc3Qgc29sdXRpb24gb2YgdGhpcy5fYWN0aXZlU29sdXRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIGRvblwidCBjaGVjayBmb3IgZm9sZGVyIGJhc2VkIHNvbHV0aW9uc1xyXG4gICAgICAgICAgICBpZiAoc29sdXRpb24uaXNGb2xkZXJQZXJGaWxlKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gc29sdXRpb24ubW9kZWwucHJvamVjdHMubWFwKHogPT4gei5wYXRoKTtcclxuICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgcGF0aHMpO1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IoaW50ZXJzZWN0LCBzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbjogc3RyaW5nLCBpc0ZvbGRlclBlckZpbGU6IGJvb2xlYW4pOiBTb2x1dGlvbiB7XHJcbiAgICAgICAgaWYgKGxvY2F0aW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGb2xkZXJQZXJGaWxlKSB7XHJcbiAgICAgICAgICAgIC8vIENTWCBhcmUgc3BlY2lhbCwgYW5kIG5lZWQgYSBzb2x1dGlvbiBwZXIgZGlyZWN0b3J5LlxyXG4gICAgICAgICAgICBjb25zdCBkaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUobG9jYXRpb24pO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fc29sdXRpb25zLmhhcyhkaXJlY3RvcnkpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvbHV0aW9ucy5nZXQoZGlyZWN0b3J5KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdCA9IHRoaXMuX2ludGVyc2VjdFBhdGgobG9jYXRpb24pO1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29sdXRpb25zLmdldChpbnRlcnNlY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xyXG4gICAgICAgICAgICAvLyBBdHRlbXB0IHRvIHNlZSBpZiB0aGlzIGZpbGUgaXMgcGFydCBhIHNvbHV0aW9uXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4gc29sdXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb246IHN0cmluZywgaXNGb2xkZXJQZXJGaWxlOiBib29sZWFuKTogT2JzZXJ2YWJsZTxTb2x1dGlvbj4ge1xyXG4gICAgICAgIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGguZGlybmFtZShsb2NhdGlvbik7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fYWN0aXZhdGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGl2YXRlZFN1YmplY3QudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gdGhpcy5fZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBsb2NhdGlvbi5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgICAgY29uc3QgbWFwcGVkTG9jYXRpb25zID0gc2VnbWVudHMubWFwKChsb2MsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLnRha2Uoc2VnbWVudHMsIGluZGV4ICsgMSkuam9pbihwYXRoLnNlcCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGwgb2YgbWFwcGVkTG9jYXRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9maW5kU29sdXRpb25DYWNoZS5oYXMobCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5nZXQobCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgQXN5bmNTdWJqZWN0PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIF8uZWFjaChtYXBwZWRMb2NhdGlvbnMsIGwgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5zZXQobCwgPE9ic2VydmFibGU8U29sdXRpb24+Pjxhbnk+c3ViamVjdCk7XHJcbiAgICAgICAgICAgIHN1YmplY3Quc3Vic2NyaWJlKHsgY29tcGxldGU6ICgpID0+IHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmRlbGV0ZShsKSB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgcHJvamVjdCA9IHRoaXMuX2ludGVyc2VjdEF0b21Qcm9qZWN0UGF0aChkaXJlY3RvcnkpO1xyXG4gICAgICAgIGNvbnN0IGNiID0gKGNhbmRpZGF0ZXM6IENhbmRpZGF0ZVtdKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFdlIG9ubHkgd2FudCB0byBzZWFyY2ggZm9yIHNvbHV0aW9ucyBhZnRlciB0aGUgbWFpbiBzb2x1dGlvbnMgaGF2ZSBiZWVuIHByb2Nlc3NlZC5cclxuICAgICAgICAgICAgLy8gV2UgY2FuIGdldCBpbnRvIHRoaXMgcmFjZSBjb25kaXRpb24gaWYgdGhlIHVzZXIgaGFzIHdpbmRvd3MgdGhhdCB3ZXJlIG9wZW5lZCBwcmV2aW91c2x5LlxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2FjdGl2YXRlZCkge1xyXG4gICAgICAgICAgICAgICAgXy5kZWxheShjYiwgU09MVVRJT05fTE9BRF9USU1FKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFpc0ZvbGRlclBlckZpbGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gc2VlIGlmIHRoaXMgZmlsZSBpcyBwYXJ0IGEgc29sdXRpb25cclxuICAgICAgICAgICAgICAgIGNvbnN0IHIgPSB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dChzb2x1dGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocikgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2gudGhlbigoKSA9PiBPYnNlcnZhYmxlLmZyb20oY2FuZGlkYXRlcylcclxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4gdGhpcy5fZmluZFJlcG9zaXRvcnlGb3JQYXRoKHgucGF0aCksIChjYW5kaWRhdGUsIHJlcG8pID0+ICh7IGNhbmRpZGF0ZSwgcmVwbyB9KSlcclxuICAgICAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKSlcclxuICAgICAgICAgICAgICAgIC50aGVuKHJlcG9zID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdDYW5kaWRhdGVzID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMubWFwKHogPT4gei5wYXRoKSwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5rZXlzKCkpKS5tYXAoeiA9PiBfLmZpbmQoY2FuZGlkYXRlcywgeyBwYXRoOiB6IH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKCh7IHBhdGgsIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHJlcG9zLCB4ID0+IHguY2FuZGlkYXRlLnBhdGggPT09IHBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbyA9IGZvdW5kICYmIGZvdW5kLnJlcG87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBwYXRoLCBpc1Byb2plY3QsIHJlcG8sIG9yaWdpbmFsRmlsZSB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBhZGRDYW5kaWRhdGVzSW5PcmRlcihuZXdDYW5kaWRhdGVzLCAoY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIG9yaWdpbmFsRmlsZSkgPT4gdGhpcy5fYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgdGVtcG9yYXJ5OiAhcHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gc2VlIGlmIHRoaXMgZmlsZSBpcyBwYXJ0IGEgc29sdXRpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gdGhpcy5faXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgKGludGVyc2VjdCwgc29sdXRpb24pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHNvbHV0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHIpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uKSB8fCB0aGlzLl9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgobG9jYXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyc2VjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zb2x1dGlvbnMuaGFzKGludGVyc2VjdCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHRoaXMuX3NvbHV0aW9ucy5nZXQoaW50ZXJzZWN0KSk7IC8vIFRoZSBib29sZWFuIG1lYW5zIHRoaXMgc29sdXRpb24gaXMgdGVtcG9yYXJ5LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYENvdWxkIG5vdCBmaW5kIGEgc29sdXRpb24gZm9yIFwiJHtsb2NhdGlvbn1cImApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbmRpZGF0ZUZpbmRlcihkaXJlY3RvcnkpLnN1YnNjcmliZShjYik7XHJcblxyXG4gICAgICAgIHJldHVybiA8T2JzZXJ2YWJsZTxTb2x1dGlvbj4+PGFueT5zdWJqZWN0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2NhbmRpZGF0ZUZpbmRlcihkaXJlY3Rvcnk6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBmaW5kQ2FuZGlkYXRlcy53aXRoQ2FuZGlkYXRlcyhkaXJlY3RvcnksIHRoaXMubG9nZ2VyLCB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uSW5kZXBlbmRlbnRTb3VyY2VGaWxlc1RvU2VhcmNoOiB0aGlzLl9fc3BlY2lhbENhc2VFeHRlbnNpb25zLm1hcCh6ID0+IFwiKlwiICsgeilcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZmxhdE1hcChjYW5kaWRhdGVzID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNsbnMgPSBfLmZpbHRlcihjYW5kaWRhdGVzLCB4ID0+IF8uZW5kc1dpdGgoeC5wYXRoLCBcIi5zbG5cIikpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNsbnMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMsIHNsbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzeW5jUmVzdWx0ID0gbmV3IEFzeW5jU3ViamVjdDx0eXBlb2YgY2FuZGlkYXRlcz4oKTtcclxuICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5uZXh0KGl0ZW1zKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaGFuZGxlIG11bHRpcGxlIHNvbHV0aW9ucy5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsaXN0VmlldyA9IG5ldyBHZW5lcmljU2VsZWN0TGlzdFZpZXcoXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2xucy5tYXAoeCA9PiAoeyBkaXNwbGF5TmFtZTogeC5wYXRoLCBuYW1lOiB4LnBhdGggfSkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLnVuc2hpZnQoLi4uc2xucy5maWx0ZXIoeCA9PiB4LnBhdGggPT09IHJlc3VsdCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5lYWNoKGNhbmRpZGF0ZXMsIHggPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhbmRpZGF0ZUZpbmRlckNhY2hlLmFkZCh4LnBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RWaWV3Lm1lc3NhZ2UudGV4dChcIlBsZWFzZSBzZWxlY3QgYSBzb2x1dGlvbiB0byBsb2FkLlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvdyB0aGUgdmlld1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcGVuU2VsZWN0TGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuU2VsZWN0TGlzdC5vbkNsb3NlZC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLnNvbWUoc2xucywgeCA9PiB0aGlzLl9jYW5kaWRhdGVGaW5kZXJDYWNoZS5oYXMoeC5wYXRoKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmRlZmVyKCgpID0+IGxpc3RWaWV3LnRvZ2dsZSgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXy5kZWZlcigoKSA9PiBsaXN0Vmlldy50b2dnbGUoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5kbyh7IGNvbXBsZXRlOiAoKSA9PiBvcGVuU2VsZWN0TGlzdCA9IG51bGwgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3BlblNlbGVjdExpc3QgPSBsaXN0VmlldztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxPYnNlcnZhYmxlPHR5cGVvZiBjYW5kaWRhdGVzPj48YW55PmFzeW5jUmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihjYW5kaWRhdGVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gdm9pZCkge1xyXG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyYXRpb25zLmFkZChjYWxsYmFjayk7XHJcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLmZvckVhY2goc29sdXRpb24gPT4gY2FsbGJhY2soc29sdXRpb24pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uOiBzdHJpbmcsIHBhdGhzPzogc3RyaW5nW10pIHtcclxuICAgICAgICBjb25zdCB2YWxpZFNvbHV0aW9uUGF0aHMgPSBwYXRocztcclxuXHJcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBsb2NhdGlvbi5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgICAgY29uc3QgbWFwcGVkTG9jYXRpb25zID0gc2VnbWVudHMubWFwKChsb2MsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLnRha2Uoc2VnbWVudHMsIGluZGV4ICsgMSkuam9pbihwYXRoLnNlcCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIExvb2sgZm9yIHRoZSBjbG9zZXN0IG1hdGNoIGZpcnN0LlxyXG4gICAgICAgIG1hcHBlZExvY2F0aW9ucy5yZXZlcnNlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGludGVyc2VjdDogc3RyaW5nID0gXy5pbnRlcnNlY3Rpb24obWFwcGVkTG9jYXRpb25zLCB2YWxpZFNvbHV0aW9uUGF0aHMpWzBdO1xyXG4gICAgICAgIGlmIChpbnRlcnNlY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGludGVyc2VjdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaW50ZXJzZWN0UGF0aChsb2NhdGlvbjogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb24sIGZyb21JdGVyYXRvcih0aGlzLl9zb2x1dGlvbnMuZW50cmllcygpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXpbMV0uaXNGb2xkZXJQZXJGaWxlKS5tYXAoeiA9PiB6WzBdKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGxvY2F0aW9uOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgdGhpcy5fYXRvbVByb2plY3RzLnBhdGhzKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gYWRkQ2FuZGlkYXRlc0luT3JkZXIoY2FuZGlkYXRlczogeyBwYXRoOiBzdHJpbmc7IHJlcG86IFJFUE9TSVRPUlk7IGlzUHJvamVjdDogYm9vbGVhbjsgb3JpZ2luYWxGaWxlOiBzdHJpbmc7IH1bXSwgY2I6IChjYW5kaWRhdGU6IHN0cmluZywgcmVwbzogUkVQT1NJVE9SWSwgaXNQcm9qZWN0OiBib29sZWFuLCBvcmlnaW5hbEZpbGU6IHN0cmluZykgPT4gT2JzZXJ2YWJsZTxTb2x1dGlvbj4pIHtcclxuICAgIGNvbnN0IGFzeW5jU3ViamVjdCA9IG5ldyBBc3luY1N1YmplY3QoKTtcclxuXHJcbiAgICBpZiAoIWNhbmRpZGF0ZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgYXN5bmNTdWJqZWN0Lm5leHQoY2FuZGlkYXRlcyk7XHJcbiAgICAgICAgYXN5bmNTdWJqZWN0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jU3ViamVjdC50b1Byb21pc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjZHMgPSBjYW5kaWRhdGVzLnNsaWNlKCk7XHJcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBjZHMuc2hpZnQoKTtcclxuICAgIGNvbnN0IGhhbmRsZUNhbmRpZGF0ZSA9IChjYW5kOiB7IHBhdGg6IHN0cmluZzsgcmVwbzogUkVQT1NJVE9SWTsgaXNQcm9qZWN0OiBib29sZWFuOyBvcmlnaW5hbEZpbGU6IHN0cmluZzsgfSkgPT4ge1xyXG4gICAgICAgIGNiKGNhbmQucGF0aCwgY2FuZC5yZXBvLCBjYW5kLmlzUHJvamVjdCwgY2FuZC5vcmlnaW5hbEZpbGUpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2RzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYW5kID0gY2RzLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUNhbmRpZGF0ZShjYW5kKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3luY1N1YmplY3QubmV4dChjYW5kaWRhdGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNTdWJqZWN0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBoYW5kbGVDYW5kaWRhdGUoY2FuZGlkYXRlKTtcclxuICAgIHJldHVybiBhc3luY1N1YmplY3QudG9Qcm9taXNlKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZyb21JdGVyYXRvcjxUPihpdGVyYXRvcjogSXRlcmFibGVJdGVyYXRvcjxUPikge1xyXG4gICAgY29uc3QgaXRlbXM6IFRbXSA9IFtdO1xyXG4gICAgbGV0IHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcclxuICAgIHdoaWxlICghcmVzdWx0LmRvbmUpIHtcclxuICAgICAgICBpdGVtcy5wdXNoKHJlc3VsdC52YWx1ZSk7XHJcblxyXG4gICAgICAgIHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXRlbXM7XHJcbn1cclxuXHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuZXhwb3J0IGNvbnN0IFNvbHV0aW9uTWFuYWdlciA9IG5ldyBTb2x1dGlvbkluc3RhbmNlTWFuYWdlcigpO1xyXG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
