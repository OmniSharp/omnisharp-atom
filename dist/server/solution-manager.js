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
                            var path = _ref.path,
                                isProject = _ref.isProject,
                                originalFile = _ref.originalFile;

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

            var _ref3$temporary = _ref3.temporary,
                temporary = _ref3$temporary === undefined ? false : _ref3$temporary,
                project = _ref3.project,
                originalFile = _ref3.originalFile;

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
                        var path = _ref4.path,
                            isProject = _ref4.isProject,
                            originalFile = _ref4.originalFile;

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
                                openSelectList = null;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci5qcyIsImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0lDQVk7O0FEQ1o7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7QUNHQSxJQUFNLHFCQUFxQixLQUFyQjtBQUVOLElBQUksdUJBQUo7O0lBQ0E7QUFBQSx1Q0FBQTs7O0FBRVcsYUFBQSxjQUFBLEdBQWlCLEtBQWpCLENBRlg7QUFHVyxhQUFBLG1CQUFBLEdBQXNCLEtBQXRCLENBSFg7QUFvQlksYUFBQSxlQUFBLEdBQWtCLElBQUksR0FBSixFQUFsQixDQXBCWjtBQXFCWSxhQUFBLFVBQUEsR0FBYSxJQUFJLEdBQUosRUFBYixDQXJCWjtBQXNCWSxhQUFBLGlCQUFBLEdBQW9CLElBQUksR0FBSixFQUFwQixDQXRCWjtBQXVCWSxhQUFBLG1CQUFBLEdBQXNCLElBQUksT0FBSixFQUF0QixDQXZCWjtBQXdCWSxhQUFBLHNCQUFBLEdBQXlCLElBQUksT0FBSixFQUF6QixDQXhCWjtBQXlCWSxhQUFBLGtCQUFBLEdBQXFCLElBQUksR0FBSixFQUFyQixDQXpCWjtBQTBCWSxhQUFBLHFCQUFBLEdBQXdCLElBQUksR0FBSixFQUF4QixDQTFCWjtBQTRCWSxhQUFBLFVBQUEsR0FBYSxLQUFiLENBNUJaO0FBNkJZLGFBQUEsVUFBQSxHQUFhLENBQWIsQ0E3Qlo7QUFpQ1ksYUFBQSxzQkFBQSxHQUF5QixDQUFDLE1BQUQsQ0FBekIsQ0FqQ1o7QUFvQ1ksYUFBQSxnQkFBQSxHQUErQixFQUEvQixDQXBDWjtBQTBDWSxhQUFBLFlBQUEsR0FBZSx5Q0FBZixDQTFDWjtBQWdEWSxhQUFBLFlBQUEsR0FBZSxrREFBZixDQWhEWjtBQXFEWSxhQUFBLGVBQUEsR0FBa0IsMEJBQThCLElBQTlCLENBQWxCLENBckRaO0FBc0RZLGFB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Q0FBZ0IsSUFBaEIsRUFGWTtpQkFBaEIsTUFHTztBQUNILGlDQUFhLElBQWIsQ0FBa0IsVUFBbEIsRUFERztBQUVILGlDQUFhLFFBQWIsR0FGRztpQkFIUDthQURNO1NBRmxCLEVBRHdHO0tBQXBGLENBWDBNO0FBeUJsTyxvQkFBZ0IsU0FBaEIsRUF6QmtPO0FBMEJsTyxXQUFPLGFBQWEsU0FBYixFQUFQLENBMUJrTztDQUF0TztBQTZCQSxTQUFBLFlBQUEsQ0FBeUIsUUFBekIsRUFBc0Q7QUFDbEQsUUFBTSxRQUFhLEVBQWIsQ0FENEM7QUFFbEQsUUFBSSxTQUFTLFNBQVMsSUFBVCxFQUFULENBRjhDO0FBR2xELFdBQU8sQ0FBQyxPQUFPLElBQVAsRUFBYTtBQUNqQixjQUFNLElBQU4sQ0FBVyxPQUFPLEtBQVAsQ0FBWCxDQURpQjtBQUdqQixpQkFBUyxTQUFTLElBQVQsRUFBVCxDQUhpQjtLQUFyQjtBQU1BLFdBQU8sS0FBUCxDQVRrRDtDQUF0RDtBQWFPLElBQU0sNENBQWtCLElBQUksdUJBQUosRUFBbEIiLCJmaWxlIjoibGliL3NlcnZlci9zb2x1dGlvbi1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgQXN5bmNTdWJqZWN0LCBCZWhhdmlvclN1YmplY3QsIFNjaGVkdWxlciwgU3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBSZWZDb3VudERpc3Bvc2FibGUsIERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcbmltcG9ydCB7IFNvbHV0aW9uIH0gZnJvbSBcIi4vc29sdXRpb25cIjtcbmltcG9ydCB7IEF0b21Qcm9qZWN0VHJhY2tlciB9IGZyb20gXCIuL2F0b20tcHJvamVjdHNcIjtcbmltcG9ydCB7IFNvbHV0aW9uT2JzZXJ2ZXIsIFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIgfSBmcm9tIFwiLi9jb21wb3NpdGUtc29sdXRpb25cIjtcbmltcG9ydCB7IERyaXZlclN0YXRlLCBmaW5kQ2FuZGlkYXRlcywgUnVudGltZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBHZW5lcmljU2VsZWN0TGlzdFZpZXcgfSBmcm9tIFwiLi4vdmlld3MvZ2VuZXJpYy1saXN0LXZpZXdcIjtcbmltcG9ydCB7IGlzT21uaXNoYXJwVGV4dEVkaXRvciwgT21uaXNoYXJwRWRpdG9yQ29udGV4dCB9IGZyb20gXCIuL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xuY29uc3QgU09MVVRJT05fTE9BRF9USU1FID0gMzAwMDA7XG5sZXQgb3BlblNlbGVjdExpc3Q7XG5jbGFzcyBTb2x1dGlvbkluc3RhbmNlTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX3VuaXRUZXN0TW9kZV8gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fa2lja19pbl90aGVfcGFudHNfID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2NvbmZpZ3VyYXRpb25zID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uUHJvamVjdHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucyA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcCA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9jYW5kaWRhdGVGaW5kZXJDYWNoZSA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX25leHRJbmRleCA9IDA7XG4gICAgICAgIHRoaXMuX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucyA9IFtcIi5jc3hcIixdO1xuICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fb2JzZXJ2YXRpb24gPSBuZXcgU29sdXRpb25PYnNlcnZlcigpO1xuICAgICAgICB0aGlzLl9jb21iaW5hdGlvbiA9IG5ldyBTb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyKCk7XG4gICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uID0gbmV3IEJlaGF2aW9yU3ViamVjdChudWxsKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb25PYnNlcmFibGUgPSB0aGlzLl9hY3RpdmVTb2x1dGlvbi5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpLmZpbHRlcih6ID0+ICEheikucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZWRTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICB9XG4gICAgZ2V0IGxvZ2dlcigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3VuaXRUZXN0TW9kZV8gfHwgdGhpcy5fa2lja19pbl90aGVfcGFudHNfKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGxvZzogKCkgPT4geyB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiAoKSA9PiB7IH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbnNvbGU7XG4gICAgfVxuICAgIGdldCBfX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucygpIHsgcmV0dXJuIHRoaXMuX3NwZWNpYWxDYXNlRXh0ZW5zaW9uczsgfVxuICAgIGdldCBhY3RpdmVTb2x1dGlvbnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVTb2x1dGlvbnM7XG4gICAgfVxuICAgIGdldCBzb2x1dGlvbk9ic2VydmVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fb2JzZXJ2YXRpb247XG4gICAgfVxuICAgIGdldCBzb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29tYmluYXRpb247XG4gICAgfVxuICAgIGdldCBhY3RpdmVTb2x1dGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNvbHV0aW9uT2JzZXJhYmxlO1xuICAgIH1cbiAgICBnZXQgYWN0aXZhdGVkU3ViamVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2YXRlZFN1YmplY3Q7XG4gICAgfVxuICAgIGFjdGl2YXRlKGFjdGl2ZUVkaXRvcikge1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZhdGVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fYXRvbVByb2plY3RzID0gbmV3IEF0b21Qcm9qZWN0VHJhY2tlcigpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMpO1xuICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2ggPSBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgdGhpcy5fc3Vic2NyaWJlVG9BdG9tUHJvamVjdFRyYWNrZXIoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYWN0aXZlRWRpdG9yXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxuICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB0aGlzLmdldFNvbHV0aW9uRm9yRWRpdG9yKHopKVxuICAgICAgICAgICAgLnN1YnNjcmliZSh4ID0+IHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQoeCkpKTtcbiAgICAgICAgdGhpcy5fYXRvbVByb2plY3RzLmFjdGl2YXRlKCk7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuYWN0aXZhdGVkU3ViamVjdC5uZXh0KHRydWUpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUpO1xuICAgIH1cbiAgICBjb25uZWN0KCkge1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBzb2x1dGlvbi5jb25uZWN0KCkpO1xuICAgIH1cbiAgICBkaXNjb25uZWN0KCkge1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBzb2x1dGlvbi5kaXNwb3NlKCkpO1xuICAgIH1cbiAgICBkZWFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5jbGVhcigpO1xuICAgIH1cbiAgICBnZXQgY29ubmVjdGVkKCkge1xuICAgICAgICBjb25zdCBpdGVyYXRvciA9IHRoaXMuX3NvbHV0aW9ucy52YWx1ZXMoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICB3aGlsZSAoIXJlc3VsdC5kb25lKVxuICAgICAgICAgICAgaWYgKHJlc3VsdC52YWx1ZS5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBfc3Vic2NyaWJlVG9BdG9tUHJvamVjdFRyYWNrZXIoKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX2F0b21Qcm9qZWN0cy5yZW1vdmVkXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gdGhpcy5fc29sdXRpb25zLmhhcyh6KSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLl9yZW1vdmVTb2x1dGlvbihwcm9qZWN0KSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMuYWRkZWRcbiAgICAgICAgICAgIC5maWx0ZXIocHJvamVjdCA9PiAhdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5oYXMocHJvamVjdCkpXG4gICAgICAgICAgICAubWFwKHByb2plY3QgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhbmRpZGF0ZUZpbmRlcihwcm9qZWN0KVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKGNhbmRpZGF0ZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20oY2FuZGlkYXRlcylcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB0aGlzLl9maW5kUmVwb3NpdG9yeUZvclBhdGgoeC5wYXRoKSwgKGNhbmRpZGF0ZSwgcmVwbykgPT4gKHsgY2FuZGlkYXRlLCByZXBvIH0pKVxuICAgICAgICAgICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihyZXBvcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbmRpZGF0ZXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcy5tYXAoeiA9PiB6LnBhdGgpLCBmcm9tSXRlcmF0b3IodGhpcy5fc29sdXRpb25zLmtleXMoKSkpLm1hcCh6ID0+IF8uZmluZChjYW5kaWRhdGVzLCB7IHBhdGg6IHogfSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKCh7IHBhdGgsIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHJlcG9zLCB4ID0+IHguY2FuZGlkYXRlLnBhdGggPT09IHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbyA9IGZvdW5kICYmIGZvdW5kLnJlcG87XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBwYXRoLCBpc1Byb2plY3QsIHJlcG8sIG9yaWdpbmFsRmlsZSB9O1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFkZENhbmRpZGF0ZXNJbk9yZGVyKG5ld0NhbmRpZGF0ZXMsIChjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyBvcmlnaW5hbEZpbGUsIHByb2plY3QgfSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkudG9Qcm9taXNlKCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGNhbmRpZGF0ZU9ic2VydmFibGUgPT4ge1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlU2VhcmNoID0gdGhpcy5fYWN0aXZlU2VhcmNoLnRoZW4oKCkgPT4gY2FuZGlkYXRlT2JzZXJ2YWJsZSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgX2ZpbmRSZXBvc2l0b3J5Rm9yUGF0aCh3b3JraW5nUGF0aCkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKSB8fCBbXSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgICAgICAgICAubWFwKHJlcG8gPT4gKHsgcmVwbywgZGlyZWN0b3J5OiByZXBvLmdldFdvcmtpbmdEaXJlY3RvcnkoKSB9KSlcbiAgICAgICAgICAgIC5maWx0ZXIoKHsgZGlyZWN0b3J5IH0pID0+IHBhdGgubm9ybWFsaXplKGRpcmVjdG9yeSkgPT09IHBhdGgubm9ybWFsaXplKHdvcmtpbmdQYXRoKSlcbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAubWFwKHggPT4geC5yZXBvKTtcbiAgICB9XG4gICAgX2FkZFNvbHV0aW9uKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCB7IHRlbXBvcmFyeSA9IGZhbHNlLCBwcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkge1xuICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IGNhbmRpZGF0ZTtcbiAgICAgICAgaWYgKF8uZW5kc1dpdGgoY2FuZGlkYXRlLCBcIi5zbG5cIikpIHtcbiAgICAgICAgICAgIGNhbmRpZGF0ZSA9IHBhdGguZGlybmFtZShjYW5kaWRhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzb2x1dGlvbjtcbiAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoY2FuZGlkYXRlKSkge1xuICAgICAgICAgICAgc29sdXRpb24gPSB0aGlzLl9zb2x1dGlvbnMuZ2V0KGNhbmRpZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJvamVjdCAmJiB0aGlzLl9zb2x1dGlvblByb2plY3RzLmhhcyhwcm9qZWN0KSkge1xuICAgICAgICAgICAgc29sdXRpb24gPSB0aGlzLl9zb2x1dGlvblByb2plY3RzLmdldChwcm9qZWN0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc29sdXRpb24gJiYgIXNvbHV0aW9uLmlzRGlzcG9zZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzb2x1dGlvbiAmJiBzb2x1dGlvbi5pc0Rpc3Bvc2VkKSB7XG4gICAgICAgICAgICBjb25zdCBkaXNwb3NlciA9IHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcC5nZXQoc29sdXRpb24pO1xuICAgICAgICAgICAgZGlzcG9zZXIuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHNvbHV0aW9uID0gbmV3IFNvbHV0aW9uKHtcbiAgICAgICAgICAgIHByb2plY3RQYXRoOiBwcm9qZWN0UGF0aCxcbiAgICAgICAgICAgIGluZGV4OiArK3RoaXMuX25leHRJbmRleCxcbiAgICAgICAgICAgIHRlbXBvcmFyeTogdGVtcG9yYXJ5LFxuICAgICAgICAgICAgcmVwb3NpdG9yeTogcmVwbyxcbiAgICAgICAgICAgIHJ1bnRpbWU6IF8uZW5kc1dpdGgob3JpZ2luYWxGaWxlLCBcIi5jc3hcIikgPyBSdW50aW1lLkNsck9yTW9ubyA6IFJ1bnRpbWUuQ29yZUNsclxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFpc1Byb2plY3QpIHtcbiAgICAgICAgICAgIHNvbHV0aW9uLmlzRm9sZGVyUGVyRmlsZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHNvbHV0aW9uKTtcbiAgICAgICAgc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoY2QpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuc2V0KHNvbHV0aW9uLCBjZCk7XG4gICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHNvbHV0aW9uLmNvbm5lY3QgPSAoKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3JhcnksIHByb2plY3QgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgXy5wdWxsKHRoaXMuX2FjdGl2ZVNvbHV0aW9ucywgc29sdXRpb24pO1xuICAgICAgICAgICAgdGhpcy5fc29sdXRpb25zLmRlbGV0ZShjYW5kaWRhdGUpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5oYXMoc29sdXRpb24pKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmRlbGV0ZShzb2x1dGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fYWN0aXZlU29sdXRpb24uZ2V0VmFsdWUoKSA9PT0gc29sdXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbi5uZXh0KHRoaXMuX2FjdGl2ZVNvbHV0aW9ucy5sZW5ndGggPyB0aGlzLl9hY3RpdmVTb2x1dGlvbnNbMF0gOiBudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9jb25maWd1cmF0aW9ucy5mb3JFYWNoKGNvbmZpZyA9PiBjb25maWcoc29sdXRpb24pKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLnNldChjYW5kaWRhdGUsIHNvbHV0aW9uKTtcbiAgICAgICAgY2QuYWRkKHRoaXMuX29ic2VydmF0aW9uLmFkZChzb2x1dGlvbikpO1xuICAgICAgICBjZC5hZGQodGhpcy5fY29tYmluYXRpb24uYWRkKHNvbHV0aW9uKSk7XG4gICAgICAgIGlmICh0ZW1wb3JhcnkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXBEID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4geyB9KTtcbiAgICAgICAgICAgIHRlbXBELmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5zZXQoc29sdXRpb24sIG5ldyBSZWZDb3VudERpc3Bvc2FibGUodGVtcEQpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbnMucHVzaChzb2x1dGlvbik7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID09PSAxKVxuICAgICAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb24ubmV4dChzb2x1dGlvbik7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2FkZFNvbHV0aW9uU3Vic2NyaXB0aW9ucyhzb2x1dGlvbiwgY2QpO1xuICAgICAgICBzb2x1dGlvbi5jb25uZWN0KCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIF9hZGRTb2x1dGlvblN1YnNjcmlwdGlvbnMoc29sdXRpb24sIGNkKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgY29uc3QgZXJyb3JSZXN1bHQgPSBzb2x1dGlvbi5zdGF0ZVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkVycm9yKVxuICAgICAgICAgICAgLmRlbGF5KDEwMClcbiAgICAgICAgICAgIC50YWtlKDEpO1xuICAgICAgICBjZC5hZGQoZXJyb3JSZXN1bHQuc3Vic2NyaWJlKCgpID0+IHJlc3VsdC5jb21wbGV0ZSgpKSk7XG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RBZGRlZC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLl9zb2x1dGlvblByb2plY3RzLnNldChwcm9qZWN0LnBhdGgsIHNvbHV0aW9uKSkpO1xuICAgICAgICBjZC5hZGQoc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0UmVtb3ZlZC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLl9zb2x1dGlvblByb2plY3RzLmRlbGV0ZShwcm9qZWN0LnBhdGgpKSk7XG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RzXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMClcbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAubWFwKCgpID0+IHNvbHV0aW9uKVxuICAgICAgICAgICAgLnRpbWVvdXQoU09MVVRJT05fTE9BRF9USU1FLCBTY2hlZHVsZXIucXVldWUpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdC5uZXh0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgIHJlc3VsdC5jb21wbGV0ZSgpO1xuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICByZXN1bHQuY29tcGxldGUoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBfcmVtb3ZlU29sdXRpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgIGlmIChfLmVuZHNXaXRoKGNhbmRpZGF0ZSwgXCIuc2xuXCIpKSB7XG4gICAgICAgICAgICBjYW5kaWRhdGUgPSBwYXRoLmRpcm5hbWUoY2FuZGlkYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9ucy5nZXQoY2FuZGlkYXRlKTtcbiAgICAgICAgY29uc3QgcmVmQ291bnREaXNwb3NhYmxlID0gc29sdXRpb24gJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikgJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmdldChzb2x1dGlvbik7XG4gICAgICAgIGlmIChyZWZDb3VudERpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgIHJlZkNvdW50RGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICBpZiAoIXJlZkNvdW50RGlzcG9zYWJsZS5pc0Rpc3Bvc2VkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzb2x1dGlvbikge1xuICAgICAgICAgICAgc29sdXRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcC5nZXQoc29sdXRpb24pO1xuICAgICAgICAgICAgaWYgKGRpc3Bvc2FibGUpXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0U29sdXRpb25Gb3JQYXRoKHBhdGgpIHtcbiAgICAgICAgaWYgKCFwYXRoKVxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgY29uc3QgaXNGb2xkZXJQZXJGaWxlID0gXy5zb21lKHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKHBhdGgsIGV4dCkpO1xuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IHBhdGg7XG4gICAgICAgIGlmICghbG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc29sdXRpb25WYWx1ZSA9IHRoaXMuX2dldFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSk7XG4gICAgICAgIGlmIChzb2x1dGlvblZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoc29sdXRpb25WYWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcbiAgICB9XG4gICAgZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpLmZpbHRlcigoKSA9PiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpO1xuICAgIH1cbiAgICBfc2V0dXBFZGl0b3JXaXRoQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKSB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgT21uaXNoYXJwRWRpdG9yQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZWRpdG9yO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChjb250ZXh0KTtcbiAgICAgICAgaWYgKHNvbHV0aW9uICYmICFjb250ZXh0LnRlbXAgJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZkNvdW50RGlzcG9zYWJsZSA9IHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5nZXQoc29sdXRpb24pO1xuICAgICAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHJlZkNvdW50RGlzcG9zYWJsZS5nZXREaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBjb250ZXh0LnRlbXAgPSB0cnVlO1xuICAgICAgICAgICAgY29udGV4dC5zb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVTb2x1dGlvbihzb2x1dGlvbi5wYXRoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBfZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKSB7XG4gICAgICAgIGlmICghZWRpdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gZWRpdG9yLmdldFBhdGgoKTtcbiAgICAgICAgaWYgKCFsb2NhdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcbiAgICAgICAgICAgIGlmIChlZGl0b3Iub21uaXNoYXJwLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uID0gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbjtcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCAmJiBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5hdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlXCIpKVxuICAgICAgICAgICAgICAgIHNvbHV0aW9uLmNvbm5lY3QoKTtcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpc0ZvbGRlclBlckZpbGUgPSBfLnNvbWUodGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSk7XG4gICAgICAgIGNvbnN0IHNvbHV0aW9uID0gdGhpcy5fZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcbiAgICAgICAgaWYgKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoc29sdXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKVxuICAgICAgICAgICAgLmRvKChzbG4pID0+IHRoaXMuX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yLCBzbG4pKTtcbiAgICB9XG4gICAgX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIGNiKSB7XG4gICAgICAgIGZvciAoY29uc3Qgc29sdXRpb24gb2YgdGhpcy5fYWN0aXZlU29sdXRpb25zKSB7XG4gICAgICAgICAgICBpZiAoc29sdXRpb24uaXNGb2xkZXJQZXJGaWxlKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3QgcGF0aHMgPSBzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cy5tYXAoeiA9PiB6LnBhdGgpO1xuICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgcGF0aHMpO1xuICAgICAgICAgICAgaWYgKGludGVyc2VjdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYihpbnRlcnNlY3QsIHNvbHV0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBfZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgIGlmIChsb2NhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgICAgICBjb25zdCBkaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUobG9jYXRpb24pO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoZGlyZWN0b3J5KSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29sdXRpb25zLmdldChkaXJlY3RvcnkpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uKTtcbiAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29sdXRpb25zLmdldChpbnRlcnNlY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgKGludGVyc2VjdCwgc29sdXRpb24pID0+IHNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgX2ZpbmRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lKGxvY2F0aW9uKTtcbiAgICAgICAgaWYgKCF0aGlzLl9hY3RpdmF0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGl2YXRlZFN1YmplY3QudGFrZSgxKVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IHRoaXMuX2ZpbmRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGxvY2F0aW9uLnNwbGl0KHBhdGguc2VwKTtcbiAgICAgICAgY29uc3QgbWFwcGVkTG9jYXRpb25zID0gc2VnbWVudHMubWFwKChsb2MsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gXy50YWtlKHNlZ21lbnRzLCBpbmRleCArIDEpLmpvaW4ocGF0aC5zZXApO1xuICAgICAgICB9KTtcbiAgICAgICAgZm9yIChsZXQgbCBvZiBtYXBwZWRMb2NhdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9maW5kU29sdXRpb25DYWNoZS5oYXMobCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuZ2V0KGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgICAgIF8uZWFjaChtYXBwZWRMb2NhdGlvbnMsIGwgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuc2V0KGwsIHN1YmplY3QpO1xuICAgICAgICAgICAgc3ViamVjdC5zdWJzY3JpYmUoeyBjb21wbGV0ZTogKCkgPT4gdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuZGVsZXRlKGwpIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgcHJvamVjdCA9IHRoaXMuX2ludGVyc2VjdEF0b21Qcm9qZWN0UGF0aChkaXJlY3RvcnkpO1xuICAgICAgICBjb25zdCBjYiA9IChjYW5kaWRhdGVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2FjdGl2YXRlZCkge1xuICAgICAgICAgICAgICAgIF8uZGVsYXkoY2IsIFNPTFVUSU9OX0xPQURfVElNRSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByID0gdGhpcy5faXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgKGludGVyc2VjdCwgc29sdXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAocilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fYWN0aXZlU2VhcmNoLnRoZW4oKCkgPT4gT2JzZXJ2YWJsZS5mcm9tKGNhbmRpZGF0ZXMpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB0aGlzLl9maW5kUmVwb3NpdG9yeUZvclBhdGgoeC5wYXRoKSwgKGNhbmRpZGF0ZSwgcmVwbykgPT4gKHsgY2FuZGlkYXRlLCByZXBvIH0pKVxuICAgICAgICAgICAgICAgIC50b0FycmF5KClcbiAgICAgICAgICAgICAgICAudG9Qcm9taXNlKCkpXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVwb3MgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbmRpZGF0ZXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcy5tYXAoeiA9PiB6LnBhdGgpLCBmcm9tSXRlcmF0b3IodGhpcy5fc29sdXRpb25zLmtleXMoKSkpLm1hcCh6ID0+IF8uZmluZChjYW5kaWRhdGVzLCB7IHBhdGg6IHogfSkpXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKHsgcGF0aCwgaXNQcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IF8uZmluZChyZXBvcywgeCA9PiB4LmNhbmRpZGF0ZS5wYXRoID09PSBwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbyA9IGZvdW5kICYmIGZvdW5kLnJlcG87XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHBhdGgsIGlzUHJvamVjdCwgcmVwbywgb3JpZ2luYWxGaWxlIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYWRkQ2FuZGlkYXRlc0luT3JkZXIobmV3Q2FuZGlkYXRlcywgKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCBvcmlnaW5hbEZpbGUpID0+IHRoaXMuX2FkZFNvbHV0aW9uKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCB7IHRlbXBvcmFyeTogIXByb2plY3QsIG9yaWdpbmFsRmlsZSB9KSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgciA9IHRoaXMuX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIChpbnRlcnNlY3QsIHNvbHV0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gdGhpcy5faW50ZXJzZWN0UGF0aChsb2NhdGlvbikgfHwgdGhpcy5faW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyc2VjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoaW50ZXJzZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dCh0aGlzLl9zb2x1dGlvbnMuZ2V0KGludGVyc2VjdCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYENvdWxkIG5vdCBmaW5kIGEgc29sdXRpb24gZm9yIFwiJHtsb2NhdGlvbn1cImApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9jYW5kaWRhdGVGaW5kZXIoZGlyZWN0b3J5KS5zdWJzY3JpYmUoY2IpO1xuICAgICAgICByZXR1cm4gc3ViamVjdDtcbiAgICB9XG4gICAgX2NhbmRpZGF0ZUZpbmRlcihkaXJlY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIGZpbmRDYW5kaWRhdGVzLndpdGhDYW5kaWRhdGVzKGRpcmVjdG9yeSwgdGhpcy5sb2dnZXIsIHtcbiAgICAgICAgICAgIHNvbHV0aW9uSW5kZXBlbmRlbnRTb3VyY2VGaWxlc1RvU2VhcmNoOiB0aGlzLl9fc3BlY2lhbENhc2VFeHRlbnNpb25zLm1hcCh6ID0+IFwiKlwiICsgeilcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5mbGF0TWFwKGNhbmRpZGF0ZXMgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc2xucyA9IF8uZmlsdGVyKGNhbmRpZGF0ZXMsIHggPT4gXy5lbmRzV2l0aCh4LnBhdGgsIFwiLnNsblwiKSk7XG4gICAgICAgICAgICBpZiAoc2xucy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcywgc2xucyk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXN5bmNSZXN1bHQgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQubmV4dChpdGVtcyk7XG4gICAgICAgICAgICAgICAgY29uc3QgbGlzdFZpZXcgPSBuZXcgR2VuZXJpY1NlbGVjdExpc3RWaWV3KFwiXCIsIHNsbnMubWFwKHggPT4gKHsgZGlzcGxheU5hbWU6IHgucGF0aCwgbmFtZTogeC5wYXRoIH0pKSwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpdGVtcy51bnNoaWZ0KC4uLnNsbnMuZmlsdGVyKHggPT4geC5wYXRoID09PSByZXN1bHQpKTtcbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoKGNhbmRpZGF0ZXMsIHggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FuZGlkYXRlRmluZGVyQ2FjaGUuYWRkKHgucGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBsaXN0Vmlldy5tZXNzYWdlLnRleHQoXCJQbGVhc2Ugc2VsZWN0IGEgc29sdXRpb24gdG8gbG9hZC5cIik7XG4gICAgICAgICAgICAgICAgaWYgKG9wZW5TZWxlY3RMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5TZWxlY3RMaXN0Lm9uQ2xvc2VkLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV8uc29tZShzbG5zLCB4ID0+IHRoaXMuX2NhbmRpZGF0ZUZpbmRlckNhY2hlLmhhcyh4LnBhdGgpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uZGVmZXIoKCkgPT4gbGlzdFZpZXcudG9nZ2xlKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfLmRlZmVyKCgpID0+IGxpc3RWaWV3LnRvZ2dsZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuZG8oeyBjb21wbGV0ZTogKCkgPT4geyBvcGVuU2VsZWN0TGlzdCA9IG51bGw7IH0gfSk7XG4gICAgICAgICAgICAgICAgb3BlblNlbGVjdExpc3QgPSBsaXN0VmlldztcbiAgICAgICAgICAgICAgICByZXR1cm4gYXN5bmNSZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihjYW5kaWRhdGVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjaykge1xuICAgICAgICB0aGlzLl9jb25maWd1cmF0aW9ucy5hZGQoY2FsbGJhY2spO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBjYWxsYmFjayhzb2x1dGlvbikpO1xuICAgIH1cbiAgICBfaW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgcGF0aHMpIHtcbiAgICAgICAgY29uc3QgdmFsaWRTb2x1dGlvblBhdGhzID0gcGF0aHM7XG4gICAgICAgIGNvbnN0IHNlZ21lbnRzID0gbG9jYXRpb24uc3BsaXQocGF0aC5zZXApO1xuICAgICAgICBjb25zdCBtYXBwZWRMb2NhdGlvbnMgPSBzZWdtZW50cy5tYXAoKGxvYywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBfLnRha2Uoc2VnbWVudHMsIGluZGV4ICsgMSkuam9pbihwYXRoLnNlcCk7XG4gICAgICAgIH0pO1xuICAgICAgICBtYXBwZWRMb2NhdGlvbnMucmV2ZXJzZSgpO1xuICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSBfLmludGVyc2VjdGlvbihtYXBwZWRMb2NhdGlvbnMsIHZhbGlkU29sdXRpb25QYXRocylbMF07XG4gICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnRlcnNlY3Q7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2ludGVyc2VjdFBhdGgobG9jYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb24sIGZyb21JdGVyYXRvcih0aGlzLl9zb2x1dGlvbnMuZW50cmllcygpKVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6WzFdLmlzRm9sZGVyUGVyRmlsZSkubWFwKHogPT4gelswXSkpO1xuICAgIH1cbiAgICBfaW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGxvY2F0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uLCB0aGlzLl9hdG9tUHJvamVjdHMucGF0aHMpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFkZENhbmRpZGF0ZXNJbk9yZGVyKGNhbmRpZGF0ZXMsIGNiKSB7XG4gICAgY29uc3QgYXN5bmNTdWJqZWN0ID0gbmV3IEFzeW5jU3ViamVjdCgpO1xuICAgIGlmICghY2FuZGlkYXRlcy5sZW5ndGgpIHtcbiAgICAgICAgYXN5bmNTdWJqZWN0Lm5leHQoY2FuZGlkYXRlcyk7XG4gICAgICAgIGFzeW5jU3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICByZXR1cm4gYXN5bmNTdWJqZWN0LnRvUHJvbWlzZSgpO1xuICAgIH1cbiAgICBjb25zdCBjZHMgPSBjYW5kaWRhdGVzLnNsaWNlKCk7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gY2RzLnNoaWZ0KCk7XG4gICAgY29uc3QgaGFuZGxlQ2FuZGlkYXRlID0gKGNhbmQpID0+IHtcbiAgICAgICAgY2IoY2FuZC5wYXRoLCBjYW5kLnJlcG8sIGNhbmQuaXNQcm9qZWN0LCBjYW5kLm9yaWdpbmFsRmlsZSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY2RzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjYW5kID0gY2RzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZUNhbmRpZGF0ZShjYW5kKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jU3ViamVjdC5uZXh0KGNhbmRpZGF0ZXMpO1xuICAgICAgICAgICAgICAgICAgICBhc3luY1N1YmplY3QuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgaGFuZGxlQ2FuZGlkYXRlKGNhbmRpZGF0ZSk7XG4gICAgcmV0dXJuIGFzeW5jU3ViamVjdC50b1Byb21pc2UoKTtcbn1cbmZ1bmN0aW9uIGZyb21JdGVyYXRvcihpdGVyYXRvcikge1xuICAgIGNvbnN0IGl0ZW1zID0gW107XG4gICAgbGV0IHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICB3aGlsZSAoIXJlc3VsdC5kb25lKSB7XG4gICAgICAgIGl0ZW1zLnB1c2gocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgIH1cbiAgICByZXR1cm4gaXRlbXM7XG59XG5leHBvcnQgY29uc3QgU29sdXRpb25NYW5hZ2VyID0gbmV3IFNvbHV0aW9uSW5zdGFuY2VNYW5hZ2VyKCk7XG4iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBBc3luY1N1YmplY3QsIEJlaGF2aW9yU3ViamVjdCwgU2NoZWR1bGVyLCBTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge1JlZkNvdW50RGlzcG9zYWJsZSwgSURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge1NvbHV0aW9ufSBmcm9tIFwiLi9zb2x1dGlvblwiO1xyXG5pbXBvcnQge0F0b21Qcm9qZWN0VHJhY2tlcn0gZnJvbSBcIi4vYXRvbS1wcm9qZWN0c1wiO1xyXG5pbXBvcnQge1NvbHV0aW9uT2JzZXJ2ZXIsIFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXJ9IGZyb20gXCIuL2NvbXBvc2l0ZS1zb2x1dGlvblwiO1xyXG5pbXBvcnQge0RyaXZlclN0YXRlLCBmaW5kQ2FuZGlkYXRlcywgUnVudGltZSwgQ2FuZGlkYXRlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge0dlbmVyaWNTZWxlY3RMaXN0Vmlld30gZnJvbSBcIi4uL3ZpZXdzL2dlbmVyaWMtbGlzdC12aWV3XCI7XHJcbmltcG9ydCB7T21uaXNoYXJwVGV4dEVkaXRvciwgaXNPbW5pc2hhcnBUZXh0RWRpdG9yLCBPbW5pc2hhcnBFZGl0b3JDb250ZXh0fSBmcm9tIFwiLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcclxuXHJcbnR5cGUgUkVQT1NJVE9SWSA9IHsgZ2V0V29ya2luZ0RpcmVjdG9yeSgpOiBzdHJpbmc7IH07XHJcbmNvbnN0IFNPTFVUSU9OX0xPQURfVElNRSA9IDMwMDAwO1xyXG5cclxubGV0IG9wZW5TZWxlY3RMaXN0OiBHZW5lcmljU2VsZWN0TGlzdFZpZXc7XHJcbmNsYXNzIFNvbHV0aW9uSW5zdGFuY2VNYW5hZ2VyIHtcclxuICAgIC8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuICAgIHB1YmxpYyBfdW5pdFRlc3RNb2RlXyA9IGZhbHNlO1xyXG4gICAgcHVibGljIF9raWNrX2luX3RoZV9wYW50c18gPSBmYWxzZTtcclxuXHJcbiAgICBwcml2YXRlIGdldCBsb2dnZXIoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3VuaXRUZXN0TW9kZV8gfHwgdGhpcy5fa2lja19pbl90aGVfcGFudHNfKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBsb2c6ICgpID0+IHsvKiAqLyB9LFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6ICgpID0+IHsvKiAqLyB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY29uc29sZTtcclxuICAgIH1cclxuICAgIC8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX3NvbHV0aW9uRGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX2F0b21Qcm9qZWN0czogQXRvbVByb2plY3RUcmFja2VyO1xyXG5cclxuICAgIHByaXZhdGUgX2NvbmZpZ3VyYXRpb25zID0gbmV3IFNldDwoc29sdXRpb246IFNvbHV0aW9uKSA9PiB2b2lkPigpO1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25zID0gbmV3IE1hcDxzdHJpbmcsIFNvbHV0aW9uPigpO1xyXG4gICAgcHJpdmF0ZSBfc29sdXRpb25Qcm9qZWN0cyA9IG5ldyBNYXA8c3RyaW5nLCBTb2x1dGlvbj4oKTtcclxuICAgIHByaXZhdGUgX3RlbXBvcmFyeVNvbHV0aW9ucyA9IG5ldyBXZWFrTWFwPFNvbHV0aW9uLCBSZWZDb3VudERpc3Bvc2FibGU+KCk7XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlU29sdXRpb25NYXAgPSBuZXcgV2Vha01hcDxTb2x1dGlvbiwgSURpc3Bvc2FibGU+KCk7XHJcbiAgICBwcml2YXRlIF9maW5kU29sdXRpb25DYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBPYnNlcnZhYmxlPFNvbHV0aW9uPj4oKTtcclxuICAgIHByaXZhdGUgX2NhbmRpZGF0ZUZpbmRlckNhY2hlID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcblxyXG4gICAgcHJpdmF0ZSBfYWN0aXZhdGVkID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIF9uZXh0SW5kZXggPSAwO1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZlU2VhcmNoOiBQcm9taXNlPGFueT47XHJcblxyXG4gICAgLy8gVGhlc2UgZXh0ZW5zaW9ucyBvbmx5IHN1cHBvcnQgc2VydmVyIHBlciBmb2xkZXIsIHVubGlrZSBub3JtYWwgY3MgZmlsZXMuXHJcbiAgICBwcml2YXRlIF9zcGVjaWFsQ2FzZUV4dGVuc2lvbnMgPSBbXCIuY3N4XCIsIC8qXCIuY2FrZVwiKi9dO1xyXG4gICAgcHVibGljIGdldCBfX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucygpIHsgcmV0dXJuIHRoaXMuX3NwZWNpYWxDYXNlRXh0ZW5zaW9uczsgfVxyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2ZVNvbHV0aW9uczogU29sdXRpb25bXSA9IFtdO1xyXG4gICAgcHVibGljIGdldCBhY3RpdmVTb2x1dGlvbnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNvbHV0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICAvLyB0aGlzIHNvbHV0aW9uIGNhbiBiZSB1c2VkIHRvIG9ic2VydmUgYmVoYXZpb3IgYWNyb3NzIGFsbCBzb2x1dGlvbi5cclxuICAgIHByaXZhdGUgX29ic2VydmF0aW9uID0gbmV3IFNvbHV0aW9uT2JzZXJ2ZXIoKTtcclxuICAgIHB1YmxpYyBnZXQgc29sdXRpb25PYnNlcnZlcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fb2JzZXJ2YXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdGhpcyBzb2x1dGlvbiBjYW4gYmUgdXNlZCB0byBhZ2dyZWdhdGUgYmVoYXZpb3IgYWNyb3NzIGFsbCBzb2x1dGlvbnNcclxuICAgIHByaXZhdGUgX2NvbWJpbmF0aW9uID0gbmV3IFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIoKTtcclxuICAgIHB1YmxpYyBnZXQgc29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY29tYmluYXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWN0aXZlU29sdXRpb24gPSBuZXcgQmVoYXZpb3JTdWJqZWN0PFNvbHV0aW9uPihudWxsKTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZVNvbHV0aW9uT2JzZXJhYmxlID0gdGhpcy5fYWN0aXZlU29sdXRpb24uZGlzdGluY3RVbnRpbENoYW5nZWQoKS5maWx0ZXIoeiA9PiAhIXopLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlU29sdXRpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNvbHV0aW9uT2JzZXJhYmxlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2YXRlZFN1YmplY3QgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xyXG4gICAgcHJpdmF0ZSBnZXQgYWN0aXZhdGVkU3ViamVjdCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZhdGVkU3ViamVjdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoYWN0aXZlRWRpdG9yOiBPYnNlcnZhYmxlPE9tbmlzaGFycFRleHRFZGl0b3I+KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2YXRlZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuX2F0b21Qcm9qZWN0cyA9IG5ldyBBdG9tUHJvamVjdFRyYWNrZXIoKTtcclxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMpO1xyXG5cclxuICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2ggPSBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuXHJcbiAgICAgICAgLy8gbW9uaXRvciBhdG9tIHByb2plY3QgcGF0aHNcclxuICAgICAgICB0aGlzLl9zdWJzY3JpYmVUb0F0b21Qcm9qZWN0VHJhY2tlcigpO1xyXG5cclxuICAgICAgICAvLyBXZSB1c2UgdGhlIGFjdGl2ZSBlZGl0b3Igb24gb21uaXNoYXJwQXRvbSB0b1xyXG4gICAgICAgIC8vIGNyZWF0ZSBhbm90aGVyIG9ic2VydmFibGUgdGhhdCBjaG5hZ2VzIHdoZW4gd2UgZ2V0IGEgbmV3IHNvbHV0aW9uLlxyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGFjdGl2ZUVkaXRvclxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxyXG4gICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHRoaXMuZ2V0U29sdXRpb25Gb3JFZGl0b3IoeikpXHJcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoeCA9PiB0aGlzLl9hY3RpdmVTb2x1dGlvbi5uZXh0KHgpKSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2F0b21Qcm9qZWN0cy5hY3RpdmF0ZSgpO1xyXG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5hY3RpdmF0ZWRTdWJqZWN0Lm5leHQodHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fc29sdXRpb25EaXNwb3NhYmxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29ubmVjdCgpIHtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBzb2x1dGlvbi5jb25uZWN0KCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNjb25uZWN0KCkge1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5mb3JFYWNoKHNvbHV0aW9uID0+IHNvbHV0aW9uLmRpc3Bvc2UoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuY2xlYXIoKTtcclxuICAgICAgICB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5jbGVhcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgY29ubmVjdGVkKCkge1xyXG4gICAgICAgIGNvbnN0IGl0ZXJhdG9yID0gdGhpcy5fc29sdXRpb25zLnZhbHVlcygpO1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcclxuICAgICAgICB3aGlsZSAoIXJlc3VsdC5kb25lKVxyXG4gICAgICAgICAgICBpZiAocmVzdWx0LnZhbHVlLmN1cnJlbnRTdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3N1YnNjcmliZVRvQXRvbVByb2plY3RUcmFja2VyKCkge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX2F0b21Qcm9qZWN0cy5yZW1vdmVkXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB0aGlzLl9zb2x1dGlvbnMuaGFzKHopKVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fcmVtb3ZlU29sdXRpb24ocHJvamVjdCkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fYXRvbVByb2plY3RzLmFkZGVkXHJcbiAgICAgICAgICAgIC5maWx0ZXIocHJvamVjdCA9PiAhdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5oYXMocHJvamVjdCkpXHJcbiAgICAgICAgICAgIC5tYXAocHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FuZGlkYXRlRmluZGVyKHByb2plY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoY2FuZGlkYXRlcyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20oY2FuZGlkYXRlcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4gdGhpcy5fZmluZFJlcG9zaXRvcnlGb3JQYXRoKHgucGF0aCksIChjYW5kaWRhdGUsIHJlcG8pID0+ICh7IGNhbmRpZGF0ZSwgcmVwbyB9KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVwb3MgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NhbmRpZGF0ZXMgPSBfLmRpZmZlcmVuY2UoY2FuZGlkYXRlcy5tYXAoeiA9PiB6LnBhdGgpLCBmcm9tSXRlcmF0b3IodGhpcy5fc29sdXRpb25zLmtleXMoKSkpLm1hcCh6ID0+IF8uZmluZChjYW5kaWRhdGVzLCB7IHBhdGg6IHogfSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKHsgcGF0aCwgaXNQcm9qZWN0LCBvcmlnaW5hbEZpbGUgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQocmVwb3MsIHggPT4geC5jYW5kaWRhdGUucGF0aCA9PT0gcGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBvID0gZm91bmQgJiYgZm91bmQucmVwbztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHBhdGgsIGlzUHJvamVjdCwgcmVwbywgb3JpZ2luYWxGaWxlIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhZGRDYW5kaWRhdGVzSW5PcmRlcihuZXdDYW5kaWRhdGVzLCAoY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIG9yaWdpbmFsRmlsZSkgPT4gdGhpcy5fYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgb3JpZ2luYWxGaWxlLCBwcm9qZWN0IH0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pLnRvUHJvbWlzZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGNhbmRpZGF0ZU9ic2VydmFibGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlU2VhcmNoID0gdGhpcy5fYWN0aXZlU2VhcmNoLnRoZW4oKCkgPT4gY2FuZGlkYXRlT2JzZXJ2YWJsZSk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9maW5kUmVwb3NpdG9yeUZvclBhdGgod29ya2luZ1BhdGg6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb208UkVQT1NJVE9SWT4oYXRvbS5wcm9qZWN0LmdldFJlcG9zaXRvcmllcygpIHx8IFtdKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxyXG4gICAgICAgICAgICAubWFwKHJlcG8gPT4gKHsgcmVwbywgZGlyZWN0b3J5OiByZXBvLmdldFdvcmtpbmdEaXJlY3RvcnkoKSB9KSlcclxuICAgICAgICAgICAgLmZpbHRlcigoe2RpcmVjdG9yeX0pID0+IHBhdGgubm9ybWFsaXplKGRpcmVjdG9yeSkgPT09IHBhdGgubm9ybWFsaXplKHdvcmtpbmdQYXRoKSlcclxuICAgICAgICAgICAgLnRha2UoMSlcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHgucmVwbyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWRkU29sdXRpb24oY2FuZGlkYXRlOiBzdHJpbmcsIHJlcG86IFJFUE9TSVRPUlksIGlzUHJvamVjdDogYm9vbGVhbiwge3RlbXBvcmFyeSA9IGZhbHNlLCBwcm9qZWN0LCBvcmlnaW5hbEZpbGV9OiB7IGRlbGF5PzogbnVtYmVyOyB0ZW1wb3Jhcnk/OiBib29sZWFuOyBwcm9qZWN0Pzogc3RyaW5nOyBvcmlnaW5hbEZpbGU/OiBzdHJpbmc7IH0pIHtcclxuICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IGNhbmRpZGF0ZTtcclxuICAgICAgICBpZiAoXy5lbmRzV2l0aChjYW5kaWRhdGUsIFwiLnNsblwiKSkge1xyXG4gICAgICAgICAgICBjYW5kaWRhdGUgPSBwYXRoLmRpcm5hbWUoY2FuZGlkYXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzb2x1dGlvbjogU29sdXRpb247XHJcbiAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoY2FuZGlkYXRlKSkge1xyXG4gICAgICAgICAgICBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9ucy5nZXQoY2FuZGlkYXRlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHByb2plY3QgJiYgdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5oYXMocHJvamVjdCkpIHtcclxuICAgICAgICAgICAgc29sdXRpb24gPSB0aGlzLl9zb2x1dGlvblByb2plY3RzLmdldChwcm9qZWN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiAmJiAhc29sdXRpb24uaXNEaXNwb3NlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChzb2x1dGlvbiAmJiBzb2x1dGlvbi5pc0Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2VyID0gdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLmdldChzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIGRpc3Bvc2VyLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNvbHV0aW9uID0gbmV3IFNvbHV0aW9uKHtcclxuICAgICAgICAgICAgcHJvamVjdFBhdGg6IHByb2plY3RQYXRoLFxyXG4gICAgICAgICAgICBpbmRleDogKyt0aGlzLl9uZXh0SW5kZXgsXHJcbiAgICAgICAgICAgIHRlbXBvcmFyeTogdGVtcG9yYXJ5LFxyXG4gICAgICAgICAgICByZXBvc2l0b3J5OiA8YW55PnJlcG8sXHJcbiAgICAgICAgICAgIHJ1bnRpbWU6IF8uZW5kc1dpdGgob3JpZ2luYWxGaWxlLCBcIi5jc3hcIikgPyBSdW50aW1lLkNsck9yTW9ubyA6IFJ1bnRpbWUuQ29yZUNsclxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIWlzUHJvamVjdCkge1xyXG4gICAgICAgICAgICBzb2x1dGlvbi5pc0ZvbGRlclBlckZpbGUgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHNvbHV0aW9uKTtcclxuICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChjZCk7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLnNldChzb2x1dGlvbiwgY2QpO1xyXG5cclxuICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uLmNvbm5lY3QgPSAoKSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3JhcnksIHByb2plY3QgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgXy5wdWxsKHRoaXMuX2FjdGl2ZVNvbHV0aW9ucywgc29sdXRpb24pO1xyXG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZGVsZXRlKGNhbmRpZGF0ZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5kZWxldGUoc29sdXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fYWN0aXZlU29sdXRpb24uZ2V0VmFsdWUoKSA9PT0gc29sdXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQodGhpcy5fYWN0aXZlU29sdXRpb25zLmxlbmd0aCA/IHRoaXMuX2FjdGl2ZVNvbHV0aW9uc1swXSA6IG51bGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9jb25maWd1cmF0aW9ucy5mb3JFYWNoKGNvbmZpZyA9PiBjb25maWcoc29sdXRpb24pKTtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuc2V0KGNhbmRpZGF0ZSwgc29sdXRpb24pO1xyXG5cclxuICAgICAgICAvLyBrZWVwIHRyYWNrIG9mIHRoZSBhY3RpdmUgc29sdXRpb25zXHJcbiAgICAgICAgY2QuYWRkKHRoaXMuX29ic2VydmF0aW9uLmFkZChzb2x1dGlvbikpO1xyXG4gICAgICAgIGNkLmFkZCh0aGlzLl9jb21iaW5hdGlvbi5hZGQoc29sdXRpb24pKTtcclxuXHJcbiAgICAgICAgaWYgKHRlbXBvcmFyeSkge1xyXG4gICAgICAgICAgICBjb25zdCB0ZW1wRCA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHsgLyogKi8gfSk7XHJcbiAgICAgICAgICAgIHRlbXBELmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLnNldChzb2x1dGlvbiwgbmV3IFJlZkNvdW50RGlzcG9zYWJsZSh0ZW1wRCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb25zLnB1c2goc29sdXRpb24pO1xyXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID09PSAxKVxyXG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbi5uZXh0KHNvbHV0aW9uKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fYWRkU29sdXRpb25TdWJzY3JpcHRpb25zKHNvbHV0aW9uLCBjZCk7XHJcbiAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xyXG4gICAgICAgIHJldHVybiA8T2JzZXJ2YWJsZTxTb2x1dGlvbj4+PGFueT5yZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWRkU29sdXRpb25TdWJzY3JpcHRpb25zKHNvbHV0aW9uOiBTb2x1dGlvbiwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgQXN5bmNTdWJqZWN0PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIGNvbnN0IGVycm9yUmVzdWx0ID0gc29sdXRpb24uc3RhdGVcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkVycm9yKVxyXG4gICAgICAgICAgICAuZGVsYXkoMTAwKVxyXG4gICAgICAgICAgICAudGFrZSgxKTtcclxuXHJcbiAgICAgICAgY2QuYWRkKGVycm9yUmVzdWx0LnN1YnNjcmliZSgoKSA9PiByZXN1bHQuY29tcGxldGUoKSkpOyAvLyBJZiB0aGlzIHNvbHV0aW9uIGVycm9ycyBtb3ZlIG9uIHRvIHRoZSBuZXh0XHJcblxyXG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RBZGRlZC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLl9zb2x1dGlvblByb2plY3RzLnNldChwcm9qZWN0LnBhdGgsIHNvbHV0aW9uKSkpO1xyXG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RSZW1vdmVkLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuZGVsZXRlKHByb2plY3QucGF0aCkpKTtcclxuXHJcbiAgICAgICAgLy8gV2FpdCBmb3IgdGhlIHByb2plY3RzIHRvIHJldHVybiBmcm9tIHRoZSBzb2x1dGlvblxyXG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RzXHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwKVxyXG4gICAgICAgICAgICAudGFrZSgxKVxyXG4gICAgICAgICAgICAubWFwKCgpID0+IHNvbHV0aW9uKVxyXG4gICAgICAgICAgICAudGltZW91dChTT0xVVElPTl9MT0FEX1RJTUUsIFNjaGVkdWxlci5xdWV1ZSkgLy8gV2FpdCAzMCBzZWNvbmRzIGZvciB0aGUgcHJvamVjdCB0byBsb2FkLlxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIFdlIGxvYWRlZCBzdWNjZXNzZnVsbHkgcmV0dXJuIHRoZSBzb2x1dGlvblxyXG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5leHQoc29sdXRpb24pO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIE1vdmUgYWxvbmcuXHJcbiAgICAgICAgICAgICAgICByZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3JlbW92ZVNvbHV0aW9uKGNhbmRpZGF0ZTogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKF8uZW5kc1dpdGgoY2FuZGlkYXRlLCBcIi5zbG5cIikpIHtcclxuICAgICAgICAgICAgY2FuZGlkYXRlID0gcGF0aC5kaXJuYW1lKGNhbmRpZGF0ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9ucy5nZXQoY2FuZGlkYXRlKTtcclxuXHJcbiAgICAgICAgY29uc3QgcmVmQ291bnREaXNwb3NhYmxlID0gc29sdXRpb24gJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikgJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmdldChzb2x1dGlvbik7XHJcbiAgICAgICAgaWYgKHJlZkNvdW50RGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICByZWZDb3VudERpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICBpZiAoIXJlZkNvdW50RGlzcG9zYWJsZS5pc0Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGtlZXAgdHJhY2sgb2YgdGhlIHJlbW92ZWQgc29sdXRpb25zXHJcbiAgICAgICAgaWYgKHNvbHV0aW9uKSB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcC5nZXQoc29sdXRpb24pO1xyXG4gICAgICAgICAgICBpZiAoZGlzcG9zYWJsZSkgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRTb2x1dGlvbkZvclBhdGgocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKCFwYXRoKVxyXG4gICAgICAgICAgICAvLyBObyB0ZXh0IGVkaXRvciBmb3VuZFxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxTb2x1dGlvbj4oKTtcclxuXHJcbiAgICAgICAgY29uc3QgaXNGb2xkZXJQZXJGaWxlID0gXy5zb21lKHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKHBhdGgsIGV4dCkpO1xyXG5cclxuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IHBhdGg7XHJcbiAgICAgICAgaWYgKCFsb2NhdGlvbikge1xyXG4gICAgICAgICAgICAvLyBUZXh0IGVkaXRvciBub3Qgc2F2ZWQgeWV0P1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxTb2x1dGlvbj4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNvbHV0aW9uVmFsdWUgPSB0aGlzLl9nZXRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpO1xyXG5cclxuICAgICAgICBpZiAoc29sdXRpb25WYWx1ZSlcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoc29sdXRpb25WYWx1ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKS5maWx0ZXIoKCkgPT4gIWVkaXRvci5pc0Rlc3Ryb3llZCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBzb2x1dGlvbjogU29sdXRpb24pIHtcclxuICAgICAgICBjb25zdCBjb250ZXh0ID0gbmV3IE9tbmlzaGFycEVkaXRvckNvbnRleHQoZWRpdG9yLCBzb2x1dGlvbik7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0OiBPbW5pc2hhcnBUZXh0RWRpdG9yID0gPGFueT5lZGl0b3I7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoY29udGV4dCk7XHJcblxyXG4gICAgICAgIGlmIChzb2x1dGlvbiAmJiAhY29udGV4dC50ZW1wICYmIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5oYXMoc29sdXRpb24pKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlZkNvdW50RGlzcG9zYWJsZSA9IHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5nZXQoc29sdXRpb24pO1xyXG4gICAgICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gcmVmQ291bnREaXNwb3NhYmxlLmdldERpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgY29udGV4dC50ZW1wID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29udGV4dC5zb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlU29sdXRpb24oc29sdXRpb24ucGF0aCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICBpZiAoIWVkaXRvcikge1xyXG4gICAgICAgICAgICAvLyBObyB0ZXh0IGVkaXRvciBmb3VuZFxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxTb2x1dGlvbj4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gZWRpdG9yLmdldFBhdGgoKTtcclxuICAgICAgICBpZiAoIWxvY2F0aW9uKSB7XHJcbiAgICAgICAgICAgIC8vIFRleHQgZWRpdG9yIG5vdCBzYXZlZCB5ZXQ/XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XHJcbiAgICAgICAgICAgIGlmIChlZGl0b3Iub21uaXNoYXJwLm1ldGFkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjbGllbnQgLyBzZXJ2ZXIgZG9lc25cInQgd29yayBjdXJyZW50bHkgZm9yIG1ldGFkYXRhIGRvY3VtZW50cy5cclxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzb2x1dGlvbiA9IGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb247XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGUgc29sdXRpb24gaGFzIGRpc2Nvbm5lY3RlZCwgcmVjb25uZWN0IGl0XHJcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCAmJiBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5hdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlXCIpKVxyXG4gICAgICAgICAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2xpZW50IGlzIGluIGFuIGludmFsaWQgc3RhdGVcclxuICAgICAgICAgICAgaWYgKHNvbHV0aW9uLmN1cnJlbnRTdGF0ZSA9PT0gRHJpdmVyU3RhdGUuRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpc0ZvbGRlclBlckZpbGUgPSBfLnNvbWUodGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSk7XHJcbiAgICAgICAgY29uc3Qgc29sdXRpb24gPSB0aGlzLl9nZXRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpO1xyXG4gICAgICAgIGlmIChzb2x1dGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLl9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSlcclxuICAgICAgICAgICAgLmRvKChzbG4pID0+IHRoaXMuX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yLCBzbG4pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uPFQ+KGxvY2F0aW9uOiBzdHJpbmcsIGNiOiAoaW50ZXJzZWN0OiBzdHJpbmcsIHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gVCkge1xyXG4gICAgICAgIGZvciAoY29uc3Qgc29sdXRpb24gb2YgdGhpcy5fYWN0aXZlU29sdXRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIGRvblwidCBjaGVjayBmb3IgZm9sZGVyIGJhc2VkIHNvbHV0aW9uc1xyXG4gICAgICAgICAgICBpZiAoc29sdXRpb24uaXNGb2xkZXJQZXJGaWxlKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGhzID0gc29sdXRpb24ubW9kZWwucHJvamVjdHMubWFwKHogPT4gei5wYXRoKTtcclxuICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgcGF0aHMpO1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IoaW50ZXJzZWN0LCBzb2x1dGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbjogc3RyaW5nLCBpc0ZvbGRlclBlckZpbGU6IGJvb2xlYW4pOiBTb2x1dGlvbiB7XHJcbiAgICAgICAgaWYgKGxvY2F0aW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGb2xkZXJQZXJGaWxlKSB7XHJcbiAgICAgICAgICAgIC8vIENTWCBhcmUgc3BlY2lhbCwgYW5kIG5lZWQgYSBzb2x1dGlvbiBwZXIgZGlyZWN0b3J5LlxyXG4gICAgICAgICAgICBjb25zdCBkaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUobG9jYXRpb24pO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fc29sdXRpb25zLmhhcyhkaXJlY3RvcnkpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvbHV0aW9ucy5nZXQoZGlyZWN0b3J5KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdCA9IHRoaXMuX2ludGVyc2VjdFBhdGgobG9jYXRpb24pO1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29sdXRpb25zLmdldChpbnRlcnNlY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xyXG4gICAgICAgICAgICAvLyBBdHRlbXB0IHRvIHNlZSBpZiB0aGlzIGZpbGUgaXMgcGFydCBhIHNvbHV0aW9uXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4gc29sdXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb246IHN0cmluZywgaXNGb2xkZXJQZXJGaWxlOiBib29sZWFuKTogT2JzZXJ2YWJsZTxTb2x1dGlvbj4ge1xyXG4gICAgICAgIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGguZGlybmFtZShsb2NhdGlvbik7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fYWN0aXZhdGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGl2YXRlZFN1YmplY3QudGFrZSgxKVxyXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gdGhpcy5fZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBsb2NhdGlvbi5zcGxpdChwYXRoLnNlcCk7XHJcbiAgICAgICAgY29uc3QgbWFwcGVkTG9jYXRpb25zID0gc2VnbWVudHMubWFwKChsb2MsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLnRha2Uoc2VnbWVudHMsIGluZGV4ICsgMSkuam9pbihwYXRoLnNlcCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGwgb2YgbWFwcGVkTG9jYXRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9maW5kU29sdXRpb25DYWNoZS5oYXMobCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5nZXQobCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgQXN5bmNTdWJqZWN0PFNvbHV0aW9uPigpO1xyXG4gICAgICAgIF8uZWFjaChtYXBwZWRMb2NhdGlvbnMsIGwgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5zZXQobCwgPE9ic2VydmFibGU8U29sdXRpb24+Pjxhbnk+c3ViamVjdCk7XHJcbiAgICAgICAgICAgIHN1YmplY3Quc3Vic2NyaWJlKHsgY29tcGxldGU6ICgpID0+IHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmRlbGV0ZShsKSB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgcHJvamVjdCA9IHRoaXMuX2ludGVyc2VjdEF0b21Qcm9qZWN0UGF0aChkaXJlY3RvcnkpO1xyXG4gICAgICAgIGNvbnN0IGNiID0gKGNhbmRpZGF0ZXM6IENhbmRpZGF0ZVtdKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFdlIG9ubHkgd2FudCB0byBzZWFyY2ggZm9yIHNvbHV0aW9ucyBhZnRlciB0aGUgbWFpbiBzb2x1dGlvbnMgaGF2ZSBiZWVuIHByb2Nlc3NlZC5cclxuICAgICAgICAgICAgLy8gV2UgY2FuIGdldCBpbnRvIHRoaXMgcmFjZSBjb25kaXRpb24gaWYgdGhlIHVzZXIgaGFzIHdpbmRvd3MgdGhhdCB3ZXJlIG9wZW5lZCBwcmV2aW91c2x5LlxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2FjdGl2YXRlZCkge1xyXG4gICAgICAgICAgICAgICAgXy5kZWxheShjYiwgU09MVVRJT05fTE9BRF9USU1FKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFpc0ZvbGRlclBlckZpbGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gc2VlIGlmIHRoaXMgZmlsZSBpcyBwYXJ0IGEgc29sdXRpb25cclxuICAgICAgICAgICAgICAgIGNvbnN0IHIgPSB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dChzb2x1dGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocikgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2gudGhlbigoKSA9PiBPYnNlcnZhYmxlLmZyb20oY2FuZGlkYXRlcylcclxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4gdGhpcy5fZmluZFJlcG9zaXRvcnlGb3JQYXRoKHgucGF0aCksIChjYW5kaWRhdGUsIHJlcG8pID0+ICh7IGNhbmRpZGF0ZSwgcmVwbyB9KSlcclxuICAgICAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKSlcclxuICAgICAgICAgICAgICAgIC50aGVuKHJlcG9zID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdDYW5kaWRhdGVzID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMubWFwKHogPT4gei5wYXRoKSwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5rZXlzKCkpKS5tYXAoeiA9PiBfLmZpbmQoY2FuZGlkYXRlcywgeyBwYXRoOiB6IH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKCh7IHBhdGgsIGlzUHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHJlcG9zLCB4ID0+IHguY2FuZGlkYXRlLnBhdGggPT09IHBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbyA9IGZvdW5kICYmIGZvdW5kLnJlcG87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBwYXRoLCBpc1Byb2plY3QsIHJlcG8sIG9yaWdpbmFsRmlsZSB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBhZGRDYW5kaWRhdGVzSW5PcmRlcihuZXdDYW5kaWRhdGVzLCAoY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIG9yaWdpbmFsRmlsZSkgPT4gdGhpcy5fYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgdGVtcG9yYXJ5OiAhcHJvamVjdCwgb3JpZ2luYWxGaWxlIH0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gc2VlIGlmIHRoaXMgZmlsZSBpcyBwYXJ0IGEgc29sdXRpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gdGhpcy5faXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgKGludGVyc2VjdCwgc29sdXRpb24pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHNvbHV0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHIpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uKSB8fCB0aGlzLl9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgobG9jYXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyc2VjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zb2x1dGlvbnMuaGFzKGludGVyc2VjdCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHRoaXMuX3NvbHV0aW9ucy5nZXQoaW50ZXJzZWN0KSk7IC8vIFRoZSBib29sZWFuIG1lYW5zIHRoaXMgc29sdXRpb24gaXMgdGVtcG9yYXJ5LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYENvdWxkIG5vdCBmaW5kIGEgc29sdXRpb24gZm9yIFwiJHtsb2NhdGlvbn1cImApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbmRpZGF0ZUZpbmRlcihkaXJlY3RvcnkpLnN1YnNjcmliZShjYik7XHJcblxyXG4gICAgICAgIHJldHVybiA8T2JzZXJ2YWJsZTxTb2x1dGlvbj4+PGFueT5zdWJqZWN0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2NhbmRpZGF0ZUZpbmRlcihkaXJlY3Rvcnk6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBmaW5kQ2FuZGlkYXRlcy53aXRoQ2FuZGlkYXRlcyhkaXJlY3RvcnksIHRoaXMubG9nZ2VyLCB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uSW5kZXBlbmRlbnRTb3VyY2VGaWxlc1RvU2VhcmNoOiB0aGlzLl9fc3BlY2lhbENhc2VFeHRlbnNpb25zLm1hcCh6ID0+IFwiKlwiICsgeilcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZmxhdE1hcChjYW5kaWRhdGVzID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNsbnMgPSBfLmZpbHRlcihjYW5kaWRhdGVzLCB4ID0+IF8uZW5kc1dpdGgoeC5wYXRoLCBcIi5zbG5cIikpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNsbnMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMsIHNsbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzeW5jUmVzdWx0ID0gbmV3IEFzeW5jU3ViamVjdDx0eXBlb2YgY2FuZGlkYXRlcz4oKTtcclxuICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5uZXh0KGl0ZW1zKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaGFuZGxlIG11bHRpcGxlIHNvbHV0aW9ucy5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsaXN0VmlldyA9IG5ldyBHZW5lcmljU2VsZWN0TGlzdFZpZXcoXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2xucy5tYXAoeCA9PiAoeyBkaXNwbGF5TmFtZTogeC5wYXRoLCBuYW1lOiB4LnBhdGggfSkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLnVuc2hpZnQoLi4uc2xucy5maWx0ZXIoeCA9PiB4LnBhdGggPT09IHJlc3VsdCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5lYWNoKGNhbmRpZGF0ZXMsIHggPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhbmRpZGF0ZUZpbmRlckNhY2hlLmFkZCh4LnBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RWaWV3Lm1lc3NhZ2UudGV4dChcIlBsZWFzZSBzZWxlY3QgYSBzb2x1dGlvbiB0byBsb2FkLlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvdyB0aGUgdmlld1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcGVuU2VsZWN0TGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuU2VsZWN0TGlzdC5vbkNsb3NlZC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLnNvbWUoc2xucywgeCA9PiB0aGlzLl9jYW5kaWRhdGVGaW5kZXJDYWNoZS5oYXMoeC5wYXRoKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmRlZmVyKCgpID0+IGxpc3RWaWV3LnRvZ2dsZSgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNSZXN1bHQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXy5kZWZlcigoKSA9PiBsaXN0Vmlldy50b2dnbGUoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5kbyh7IGNvbXBsZXRlOiAoKSA9PiB7IG9wZW5TZWxlY3RMaXN0ID0gbnVsbDsgfSB9KTtcclxuICAgICAgICAgICAgICAgICAgICBvcGVuU2VsZWN0TGlzdCA9IGxpc3RWaWV3O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gPE9ic2VydmFibGU8dHlwZW9mIGNhbmRpZGF0ZXM+Pjxhbnk+YXN5bmNSZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGNhbmRpZGF0ZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVnaXN0ZXJDb25maWd1cmF0aW9uKGNhbGxiYWNrOiAoc29sdXRpb246IFNvbHV0aW9uKSA9PiB2b2lkKSB7XHJcbiAgICAgICAgdGhpcy5fY29uZmlndXJhdGlvbnMuYWRkKGNhbGxiYWNrKTtcclxuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBjYWxsYmFjayhzb2x1dGlvbikpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb246IHN0cmluZywgcGF0aHM/OiBzdHJpbmdbXSkge1xyXG4gICAgICAgIGNvbnN0IHZhbGlkU29sdXRpb25QYXRocyA9IHBhdGhzO1xyXG5cclxuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGxvY2F0aW9uLnNwbGl0KHBhdGguc2VwKTtcclxuICAgICAgICBjb25zdCBtYXBwZWRMb2NhdGlvbnMgPSBzZWdtZW50cy5tYXAoKGxvYywgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIF8udGFrZShzZWdtZW50cywgaW5kZXggKyAxKS5qb2luKHBhdGguc2VwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gTG9vayBmb3IgdGhlIGNsb3Nlc3QgbWF0Y2ggZmlyc3QuXHJcbiAgICAgICAgbWFwcGVkTG9jYXRpb25zLnJldmVyc2UoKTtcclxuXHJcbiAgICAgICAgY29uc3QgaW50ZXJzZWN0OiBzdHJpbmcgPSBfLmludGVyc2VjdGlvbihtYXBwZWRMb2NhdGlvbnMsIHZhbGlkU29sdXRpb25QYXRocylbMF07XHJcbiAgICAgICAgaWYgKGludGVyc2VjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaW50ZXJzZWN0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5lbnRyaWVzKCkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhelsxXS5pc0ZvbGRlclBlckZpbGUpLm1hcCh6ID0+IHpbMF0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgobG9jYXRpb246IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uLCB0aGlzLl9hdG9tUHJvamVjdHMucGF0aHMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRDYW5kaWRhdGVzSW5PcmRlcihjYW5kaWRhdGVzOiB7IHBhdGg6IHN0cmluZzsgcmVwbzogUkVQT1NJVE9SWTsgaXNQcm9qZWN0OiBib29sZWFuOyBvcmlnaW5hbEZpbGU6IHN0cmluZzsgfVtdLCBjYjogKGNhbmRpZGF0ZTogc3RyaW5nLCByZXBvOiBSRVBPU0lUT1JZLCBpc1Byb2plY3Q6IGJvb2xlYW4sIG9yaWdpbmFsRmlsZTogc3RyaW5nKSA9PiBPYnNlcnZhYmxlPFNvbHV0aW9uPikge1xyXG4gICAgY29uc3QgYXN5bmNTdWJqZWN0ID0gbmV3IEFzeW5jU3ViamVjdCgpO1xyXG5cclxuICAgIGlmICghY2FuZGlkYXRlcy5sZW5ndGgpIHtcclxuICAgICAgICBhc3luY1N1YmplY3QubmV4dChjYW5kaWRhdGVzKTtcclxuICAgICAgICBhc3luY1N1YmplY3QuY29tcGxldGUoKTtcclxuICAgICAgICByZXR1cm4gYXN5bmNTdWJqZWN0LnRvUHJvbWlzZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNkcyA9IGNhbmRpZGF0ZXMuc2xpY2UoKTtcclxuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGNkcy5zaGlmdCgpO1xyXG4gICAgY29uc3QgaGFuZGxlQ2FuZGlkYXRlID0gKGNhbmQ6IHsgcGF0aDogc3RyaW5nOyByZXBvOiBSRVBPU0lUT1JZOyBpc1Byb2plY3Q6IGJvb2xlYW47IG9yaWdpbmFsRmlsZTogc3RyaW5nOyB9KSA9PiB7XHJcbiAgICAgICAgY2IoY2FuZC5wYXRoLCBjYW5kLnJlcG8sIGNhbmQuaXNQcm9qZWN0LCBjYW5kLm9yaWdpbmFsRmlsZSlcclxuICAgICAgICAgICAgLnN1YnNjcmliZSh7XHJcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbmQgPSBjZHMuc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlQ2FuZGlkYXRlKGNhbmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jU3ViamVjdC5uZXh0KGNhbmRpZGF0ZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3luY1N1YmplY3QuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIGhhbmRsZUNhbmRpZGF0ZShjYW5kaWRhdGUpO1xyXG4gICAgcmV0dXJuIGFzeW5jU3ViamVjdC50b1Byb21pc2UoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZnJvbUl0ZXJhdG9yPFQ+KGl0ZXJhdG9yOiBJdGVyYWJsZUl0ZXJhdG9yPFQ+KSB7XHJcbiAgICBjb25zdCBpdGVtczogVFtdID0gW107XHJcbiAgICBsZXQgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xyXG4gICAgd2hpbGUgKCFyZXN1bHQuZG9uZSkge1xyXG4gICAgICAgIGl0ZW1zLnB1c2gocmVzdWx0LnZhbHVlKTtcclxuXHJcbiAgICAgICAgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpdGVtcztcclxufVxyXG5cclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5leHBvcnQgY29uc3QgU29sdXRpb25NYW5hZ2VyID0gbmV3IFNvbHV0aW9uSW5zdGFuY2VNYW5hZ2VyKCk7XHJcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG4iXX0=
