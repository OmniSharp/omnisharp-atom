"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Omni = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _tsDisposables = require("ts-disposables");

var _solutionManager = require("./solution-manager");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require("fs");

var fs = _interopRequireWildcard(_fs);

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _omnisharpTextEditor = require("./omnisharp-text-editor");

var _metadataEditor = require("./metadata-editor");

var _semver = require("semver");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEBOUNCE_TIMEOUT = 100;
var statefulProperties = ["isOff", "isConnecting", "isOn", "isReady", "isError"];
function wrapEditorObservable(observable) {
    return observable.subscribeOn(_rxjs.Scheduler.async).observeOn(_rxjs.Scheduler.async).filter(function (editor) {
        return !editor || editor && !editor.isDestroyed();
    });
}

var OmniManager = function () {
    function OmniManager() {
        _classCallCheck(this, OmniManager);

        this._underlyingEditors = new Set();
        this._activeEditorOrConfigEditorSubject = new _rxjs.BehaviorSubject(null);
        this._activeEditorOrConfigEditor = wrapEditorObservable(this._activeEditorOrConfigEditorSubject).debounceTime(DEBOUNCE_TIMEOUT).publishReplay(1).refCount();
        this._activeEditor = wrapEditorObservable(this._activeEditorOrConfigEditorSubject).debounceTime(DEBOUNCE_TIMEOUT).map(function (x) {
            return x && x.omnisharp && !x.omnisharp.config ? x : null;
        }).publishReplay(1).refCount();
        this._activeConfigEditor = wrapEditorObservable(this._activeEditorOrConfigEditorSubject).debounceTime(DEBOUNCE_TIMEOUT).map(function (x) {
            return x && x.omnisharp && x.omnisharp.config ? x : null;
        }).publishReplay(1).refCount();
        this._activeProject = this._activeEditorOrConfigEditor.filter(function (editor) {
            return editor && !editor.isDestroyed();
        }).switchMap(function (editor) {
            return editor.omnisharp.solution.model.getProjectForEditor(editor);
        }).distinctUntilChanged().publishReplay(1).refCount();
        this._activeFramework = this._activeEditorOrConfigEditor.filter(function (editor) {
            return editor && !editor.isDestroyed();
        }).switchMap(function (editor) {
            return editor.omnisharp.solution.model.getProjectForEditor(editor);
        }).switchMap(function (project) {
            return project.observe.activeFramework;
        }, function (project, framework) {
            return { project: project, framework: framework };
        }).distinctUntilChanged().publishReplay(1).refCount();
        this._diagnosticsSubject = new _rxjs.Subject();
        this._diagnostics = this._diagnosticsSubject.cache(1);
        this._diagnosticCountsSubject = new _rxjs.Subject();
        this._diagnosticCounts = this._diagnosticCountsSubject.cache(1);
        this._diagnosticsByFileSubject = new _rxjs.Subject();
        this._diagnosticsByFile = this._diagnosticsByFileSubject.cache(1);
        this._isOff = true;
        this._supportedExtensions = ["project.json", ".cs", ".csx"];
    }

    _createClass(OmniManager, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add((0, _metadataEditor.metadataOpener)());
            var editors = this.createTextEditorObservable(this.disposable);
            this._editors = wrapEditorObservable(editors.filter(function (x) {
                return !x.omnisharp.config;
            }));
            this._configEditors = wrapEditorObservable(editors.filter(function (x) {
                return x.omnisharp.config;
            }));
            this.disposable.add(_solutionManager.SolutionManager.activeSolution.subscribe(function (solution) {
                (0, _lodash2.default)(atom.workspace.getTextEditors()).filter(function (x) {
                    return _this._isOmniSharpEditor(x);
                }).filter(function (x) {
                    return !x.omnisharp;
                }).each(function (x) {
                    return _solutionManager.SolutionManager.getSolutionForEditor(x);
                });
            }));
            _solutionManager.SolutionManager.activate(this._activeEditorOrConfigEditor);
            this.disposable.add(_solutionManager.SolutionManager.solutionAggregateObserver.state.subscribe(function (z) {
                return _this._isOff = _lodash2.default.every(z, function (x) {
                    return x.value === _omnisharpClient.DriverState.Disconnected || x.value === _omnisharpClient.DriverState.Error;
                });
            }));
            this.disposable.add((0, _omnisharpClient.createObservable)(function (observer) {
                var dis = atom.workspace.observeActivePaneItem(function (pane) {
                    if (pane && pane.getGrammar && pane.getPath && _this.isValidGrammar(pane.getGrammar())) {
                        observer.next(pane);
                        return;
                    }
                    observer.next(null);
                });
                return function () {
                    return dis.dispose();
                };
            }).concatMap(function (pane) {
                if (!pane || (0, _omnisharpTextEditor.isOmnisharpTextEditor)(pane)) {
                    return _rxjs.Observable.of(pane);
                }
                return wrapEditorObservable(_solutionManager.SolutionManager.getSolutionForEditor(pane).map(function (x) {
                    return pane;
                }));
            }).subscribe(this._activeEditorOrConfigEditorSubject));
            this.disposable.add(_tsDisposables.Disposable.create(function () {
                _this._activeEditorOrConfigEditorSubject.next(null);
            }));
            var codeCheckAggregate = this.aggregateListener.listenTo(function (z) {
                return z.model.observe.diagnostics;
            }).debounceTime(200).map(function (data) {
                return (0, _lodash2.default)(data).flatMap(function (x) {
                    return x.value;
                }).value();
            });
            var codeCheckCountAggregate = this.aggregateListener.listenTo(function (z) {
                return z.model.observe.diagnosticsCounts;
            }).debounceTime(200).map(function (items) {
                var result = {};
                _lodash2.default.each(items, function (y) {
                    _lodash2.default.each(y.value, function (x, k) {
                        if (!result[k]) result[k] = 0;
                        result[k] += x;
                    });
                });
                return result;
            });
            var codeCheckByFileAggregate = this.aggregateListener.listenTo(function (z) {
                return z.model.observe.diagnosticsByFile.map(function (x) {
                    return z.model.diagnosticsByFile;
                });
            }).debounceTime(200).map(function (x) {
                var map = new Map();
                _lodash2.default.each(x, function (z) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = z.value[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var _step$value = _slicedToArray(_step.value, 2);

                            var file = _step$value[0];
                            var diagnostics = _step$value[1];

                            map.set(file, diagnostics);
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
                });
                return map;
            });
            var showDiagnosticsForAllSolutions = new _rxjs.ReplaySubject(1);
            this.disposable.add(atom.config.observe("omnisharp-atom.showDiagnosticsForAllSolutions", function (enabled) {
                showDiagnosticsForAllSolutions.next(enabled);
            }));
            this.disposable.add(showDiagnosticsForAllSolutions);
            var baseDiagnostics = _rxjs.Observable.combineLatest(this.activeModel.startWith(null), showDiagnosticsForAllSolutions, showDiagnosticsForAllSolutions.skip(1).startWith(atom.config.get("omnisharp-atom.showDiagnosticsForAllSolutions")), function (model, enabled, wasEnabled) {
                return { model: model, enabled: enabled, wasEnabled: wasEnabled };
            }).filter(function (ctx) {
                return !(ctx.enabled && ctx.wasEnabled === ctx.enabled);
            }).share();
            this.disposable.add(baseDiagnostics.switchMap(function (ctx) {
                var enabled = ctx.enabled;
                var model = ctx.model;

                if (enabled) {
                    return codeCheckAggregate;
                } else if (model) {
                    return model.observe.diagnostics;
                }
                return _rxjs.Observable.of([]);
            }).startWith([]).subscribe(this._diagnosticsSubject), baseDiagnostics.switchMap(function (ctx) {
                var enabled = ctx.enabled;
                var model = ctx.model;

                if (enabled) {
                    return codeCheckCountAggregate;
                } else if (model) {
                    return model.observe.diagnosticsCounts;
                }
                return _rxjs.Observable.empty();
            }).startWith({}).subscribe(this._diagnosticCountsSubject), baseDiagnostics.switchMap(function (ctx) {
                var enabled = ctx.enabled;
                var model = ctx.model;

                if (enabled) {
                    return codeCheckByFileAggregate;
                } else if (model) {
                    return model.observe.diagnosticsByFile.map(function (x) {
                        return model.diagnosticsByFile;
                    });
                }
                return _rxjs.Observable.of(new Map());
            }).startWith(new Map()).subscribe(this._diagnosticsByFileSubject));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            if (_solutionManager.SolutionManager._unitTestMode_) return;
            this.disposable.dispose();
            _solutionManager.SolutionManager.deactivate();
        }
    }, {
        key: "connect",
        value: function connect() {
            _solutionManager.SolutionManager.connect();
        }
    }, {
        key: "disconnect",
        value: function disconnect() {
            _solutionManager.SolutionManager.disconnect();
        }
    }, {
        key: "toggle",
        value: function toggle() {
            if (_solutionManager.SolutionManager.connected) {
                _solutionManager.SolutionManager.disconnect();
            } else {
                _solutionManager.SolutionManager.connect();
            }
        }
    }, {
        key: "navigateTo",
        value: function navigateTo(response) {
            return _rxjs.Observable.fromPromise(atom.workspace.open(response.FileName, { initialLine: response.Line, initialColumn: response.Column }));
        }
    }, {
        key: "getFrameworks",
        value: function getFrameworks(projects) {
            var frameworks = _lodash2.default.map(projects, function (project) {
                return project.indexOf("+") === -1 ? "" : project.split("+")[1];
            }).filter(function (fw) {
                return fw.length > 0;
            });
            return frameworks.join(",");
        }
    }, {
        key: "addTextEditorCommand",
        value: function addTextEditorCommand(commandName, callback) {
            var _this2 = this;

            return atom.commands.add("atom-text-editor", commandName, function (event) {
                var editor = atom.workspace.getActiveTextEditor();
                if (!editor) {
                    return;
                }
                ;
                if (_lodash2.default.some(_this2._supportedExtensions, function (ext) {
                    return _lodash2.default.endsWith(editor.getPath(), ext);
                })) {
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    callback(event);
                }
            });
        }
    }, {
        key: "_isOmniSharpEditor",
        value: function _isOmniSharpEditor(editor) {
            return _lodash2.default.some(this._supportedExtensions, function (ext) {
                return _lodash2.default.endsWith(editor.getPath(), ext);
            });
        }
    }, {
        key: "createTextEditorObservable",
        value: function createTextEditorObservable(disposable) {
            var _this3 = this;

            var safeGuard = this._createSafeGuard(this._supportedExtensions, disposable);
            var observeTextEditors = (0, _omnisharpClient.createObservable)(function (observer) {
                var dis = atom.workspace.observeTextEditors(function (editor) {
                    observer.next(editor);
                });
                return function () {
                    return dis.dispose();
                };
            }).share();
            this.disposable.add(_rxjs.Observable.merge(observeTextEditors.filter(function (x) {
                return !!x.getPath();
            }), safeGuard).mergeMap(function (editor) {
                return _solutionManager.SolutionManager.getSolutionForEditor(editor);
            }, function (editor, solution) {
                return editor;
            }).subscribe(), _omnisharpTextEditor.OmnisharpEditorContext.created.subscribe(function (editor) {
                _this3._underlyingEditors.add(editor);
                editor.omnisharp.config = _lodash2.default.endsWith(editor.getPath(), "project.json");
                var dis = _tsDisposables.Disposable.create(function () {
                    _this3._underlyingEditors.delete(editor);
                });
                _this3.disposable.add(dis, editor.onDidDestroy(function () {
                    return dis.dispose();
                }));
                editor.omnisharp.solution.disposable.add(dis);
            }));
            var liveEditors = _omnisharpTextEditor.OmnisharpEditorContext.created;
            return _rxjs.Observable.merge(_rxjs.Observable.defer(function () {
                return _rxjs.Observable.from(_this3._underlyingEditors);
            }), liveEditors);
        }
    }, {
        key: "_createSafeGuard",
        value: function _createSafeGuard(extensions, disposable) {
            var _this4 = this;

            var editorSubject = new _rxjs.Subject();
            disposable.add(atom.workspace.observeActivePaneItem(function (pane) {
                return editorSubject.next(pane);
            }));
            var editorObservable = editorSubject.filter(function (z) {
                return z && !!z.getGrammar;
            }).startWith(null);
            return _rxjs.Observable.zip(editorObservable, editorObservable.skip(1), function (editor, nextEditor) {
                return { editor: editor, nextEditor: nextEditor };
            }).debounceTime(50).switchMap(function (_ref) {
                var nextEditor = _ref.nextEditor;

                var path = nextEditor.getPath();
                if (!path) {
                    if (nextEditor && _this4._isOmniSharpEditor(nextEditor)) {
                        atom.notifications.addInfo("OmniSharp", { detail: "Functionality will limited until the file has been saved." });
                    }
                    return new Promise(function (resolve, reject) {
                        var disposer = nextEditor.onDidChangePath(function () {
                            resolve(nextEditor);
                            disposer.dispose();
                        });
                    });
                }
                return Promise.resolve(null);
            }).filter(function (x) {
                return !!x;
            });
        }
    }, {
        key: "request",
        value: function request(editor, callback) {
            if (_lodash2.default.isFunction(editor)) {
                callback = editor;
                editor = null;
            }
            if (!editor) {
                editor = atom.workspace.getActiveTextEditor();
            }
            var solutionCallback = function solutionCallback(solution) {
                return callback(solution.withEditor(editor));
            };
            var result = void 0;
            if (editor && (0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor)) {
                result = solutionCallback(editor.omnisharp.solution).share();
                result.subscribe();
                return result;
            }
            var solutionResult = void 0;
            if (editor) {
                solutionResult = _solutionManager.SolutionManager.getSolutionForEditor(editor);
            } else {
                solutionResult = _solutionManager.SolutionManager.activeSolution.take(1);
            }
            result = solutionResult.filter(function (z) {
                return !!z;
            }).flatMap(solutionCallback).share();
            result.subscribe();
            return result;
        }
    }, {
        key: "getProject",
        value: function getProject(editor) {
            if ((0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor) && editor.omnisharp.project) {
                return _rxjs.Observable.of(editor.omnisharp.project);
            }
            return _solutionManager.SolutionManager.getSolutionForEditor(editor).flatMap(function (z) {
                return z.model.getProjectForEditor(editor);
            }).take(1);
        }
    }, {
        key: "getSolutionForProject",
        value: function getSolutionForProject(project) {
            return _rxjs.Observable.of((0, _lodash2.default)(_solutionManager.SolutionManager.activeSolutions).filter(function (solution) {
                return _lodash2.default.some(solution.model.projects, function (p) {
                    return p.name === project.name;
                });
            }).first());
        }
    }, {
        key: "getSolutionForEditor",
        value: function getSolutionForEditor(editor) {
            if ((0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor)) {
                return _rxjs.Observable.of(editor.omnisharp.solution);
            }
            return _solutionManager.SolutionManager.getSolutionForEditor(editor);
        }
    }, {
        key: "switchActiveModel",
        value: function switchActiveModel(callback) {
            var _this5 = this;

            var outerCd = new _tsDisposables.CompositeDisposable();
            outerCd.add(this.activeModel.filter(function (z) {
                return !!z;
            }).subscribe(function (model) {
                var cd = new _tsDisposables.CompositeDisposable();
                outerCd.add(cd);
                model.disposable.add(cd);
                cd.add(_this5.activeModel.filter(function (active) {
                    return active !== model;
                }).subscribe(function () {
                    model.disposable.remove(cd);
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(model, cd);
            }));
            return outerCd;
        }
    }, {
        key: "switchActiveSolution",
        value: function switchActiveSolution(callback) {
            var _this6 = this;

            var outerCd = new _tsDisposables.CompositeDisposable();
            outerCd.add(this.activeSolution.filter(function (z) {
                return !!z;
            }).subscribe(function (solution) {
                var cd = new _tsDisposables.CompositeDisposable();
                outerCd.add(cd);
                solution.disposable.add(cd);
                cd.add(_this6.activeSolution.filter(function (active) {
                    return active !== solution;
                }).subscribe(function () {
                    solution.disposable.remove(cd);
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(solution, cd);
            }));
            return outerCd;
        }
    }, {
        key: "switchActiveEditor",
        value: function switchActiveEditor(callback) {
            var _this7 = this;

            var outerCd = new _tsDisposables.CompositeDisposable();
            outerCd.add(this.activeEditor.filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                var cd = new _tsDisposables.CompositeDisposable();
                outerCd.add(cd);
                editor.omnisharp.solution.disposable.add(cd);
                cd.add(_this7.activeEditor.filter(function (active) {
                    return active !== editor;
                }).subscribe(function () {
                    editor.omnisharp.solution.disposable.remove(cd);
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(editor, cd);
            }));
            return outerCd;
        }
    }, {
        key: "whenEditorConnected",
        value: function whenEditorConnected(editor) {
            if ((0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor)) {
                return editor.omnisharp.solution.whenConnected().map(function (z) {
                    return editor;
                });
            }
            return _solutionManager.SolutionManager.getSolutionForEditor(editor).flatMap(function (solution) {
                return solution.whenConnected();
            }, function () {
                return editor;
            });
        }
    }, {
        key: "switchActiveConfigEditor",
        value: function switchActiveConfigEditor(callback) {
            var _this8 = this;

            var outerCd = new _tsDisposables.CompositeDisposable();
            outerCd.add(this.activeConfigEditor.filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                var cd = new _tsDisposables.CompositeDisposable();
                outerCd.add(cd);
                editor.omnisharp.solution.disposable.add(cd);
                cd.add(_this8.activeConfigEditor.filter(function (active) {
                    return active !== editor;
                }).subscribe(function () {
                    editor.omnisharp.solution.disposable.remove(cd);
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(editor, cd);
            }));
            return outerCd;
        }
    }, {
        key: "switchActiveEditorOrConfigEditor",
        value: function switchActiveEditorOrConfigEditor(callback) {
            var _this9 = this;

            var outerCd = new _tsDisposables.CompositeDisposable();
            outerCd.add(this.activeEditorOrConfigEditor.filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                var cd = new _tsDisposables.CompositeDisposable();
                outerCd.add(cd);
                cd.add(_this9.activeEditorOrConfigEditor.filter(function (active) {
                    return active !== editor;
                }).subscribe(function () {
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(editor, cd);
            }));
            return outerCd;
        }
    }, {
        key: "eachEditor",
        value: function eachEditor(callback) {
            var outerCd = new _tsDisposables.CompositeDisposable();
            outerCd.add(this._editors.subscribe(function (editor) {
                var cd = new _tsDisposables.CompositeDisposable();
                outerCd.add(cd);
                editor.omnisharp.solution.disposable.add(cd);
                cd.add(editor.onDidDestroy(function () {
                    editor.omnisharp.solution.disposable.remove(cd);
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(editor, cd);
            }));
            return outerCd;
        }
    }, {
        key: "eachConfigEditor",
        value: function eachConfigEditor(callback) {
            var outerCd = new _tsDisposables.CompositeDisposable();
            outerCd.add(this._configEditors.subscribe(function (editor) {
                var cd = new _tsDisposables.CompositeDisposable();
                outerCd.add(cd);
                editor.omnisharp.solution.disposable.add(cd);
                cd.add(editor.onDidDestroy(function () {
                    editor.omnisharp.solution.disposable.remove(cd);
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(editor, cd);
            }));
            return outerCd;
        }
    }, {
        key: "registerConfiguration",
        value: function registerConfiguration(callback) {
            _solutionManager.SolutionManager.registerConfiguration(callback);
        }
    }, {
        key: "isValidGrammar",
        value: function isValidGrammar(grammar) {
            return _lodash2.default.some(this.grammars, { scopeName: grammar.scopeName });
        }
    }, {
        key: "atomVersionGreaterThan",
        value: function atomVersionGreaterThan(version) {
            return (0, _semver.gt)(atom.getVersion(), version);
        }
    }, {
        key: "viewModelStatefulProperties",
        get: function get() {
            return statefulProperties;
        }
    }, {
        key: "diagnostics",
        get: function get() {
            return this._diagnostics;
        }
    }, {
        key: "diagnosticsCounts",
        get: function get() {
            return this._diagnosticCounts;
        }
    }, {
        key: "diagnosticsByFile",
        get: function get() {
            return this._diagnosticsByFile;
        }
    }, {
        key: "isOff",
        get: function get() {
            return this._isOff;
        }
    }, {
        key: "isOn",
        get: function get() {
            return !this.isOff;
        }
    }, {
        key: "listener",
        get: function get() {
            return _solutionManager.SolutionManager.solutionObserver;
        }
    }, {
        key: "aggregateListener",
        get: function get() {
            return _solutionManager.SolutionManager.solutionAggregateObserver;
        }
    }, {
        key: "solutions",
        get: function get() {
            return _rxjs.Observable.defer(function () {
                return _rxjs.Observable.from(_solutionManager.SolutionManager.activeSolutions);
            });
        }
    }, {
        key: "activeModel",
        get: function get() {
            return _solutionManager.SolutionManager.activeSolution.map(function (z) {
                return z.model;
            });
        }
    }, {
        key: "activeSolution",
        get: function get() {
            return _solutionManager.SolutionManager.activeSolution;
        }
    }, {
        key: "activeEditor",
        get: function get() {
            return this._activeEditor;
        }
    }, {
        key: "activeConfigEditor",
        get: function get() {
            return this._activeConfigEditor;
        }
    }, {
        key: "activeEditorOrConfigEditor",
        get: function get() {
            return this._activeEditorOrConfigEditor;
        }
    }, {
        key: "activeProject",
        get: function get() {
            return this._activeProject;
        }
    }, {
        key: "activeFramework",
        get: function get() {
            return this._activeFramework;
        }
    }, {
        key: "editors",
        get: function get() {
            return this._editors;
        }
    }, {
        key: "configEditors",
        get: function get() {
            return this._configEditors;
        }
    }, {
        key: "_kick_in_the_pants_",
        get: function get() {
            return _solutionManager.SolutionManager._kick_in_the_pants_;
        }
    }, {
        key: "grammars",
        get: function get() {
            var _this10 = this;

            return _lodash2.default.filter(atom.grammars.getGrammars(), function (grammar) {
                return _lodash2.default.some(_this10._supportedExtensions, function (ext) {
                    return _lodash2.default.some(grammar.fileTypes, function (ft) {
                        return _lodash2.default.trimStart(ext, ".") === ft;
                    });
                });
            });
        }
    }, {
        key: "packageDir",
        get: function get() {
            if (!this._packageDir) {
                console.info("getPackageDirPaths: " + atom.packages.getPackageDirPaths());
                this._packageDir = _lodash2.default.find(atom.packages.getPackageDirPaths(), function (packagePath) {
                    console.info("packagePath " + packagePath + " exists: " + fs.existsSync(path.join(packagePath, "omnisharp-atom")));
                    return fs.existsSync(path.join(packagePath, "omnisharp-atom"));
                });
                if (!this._packageDir) {
                    this._packageDir = path.resolve(__dirname, "../../..");
                }
            }
            return this._packageDir;
        }
    }, {
        key: "atomVersion",
        get: function get() {
            if (!this._atomVersion) {
                this._atomVersion = new _semver.SemVer(atom.getVersion());
            }
            return this._atomVersion;
        }
    }]);

    return OmniManager;
}();

var Omni = exports.Omni = new OmniManager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvb21uaS5qcyIsImxpYi9zZXJ2ZXIvb21uaS50cyJdLCJuYW1lcyI6WyJmcyIsInBhdGgiLCJERUJPVU5DRV9USU1FT1VUIiwic3RhdGVmdWxQcm9wZXJ0aWVzIiwid3JhcEVkaXRvck9ic2VydmFibGUiLCJvYnNlcnZhYmxlIiwic3Vic2NyaWJlT24iLCJhc3luYyIsIm9ic2VydmVPbiIsImZpbHRlciIsImVkaXRvciIsImlzRGVzdHJveWVkIiwiT21uaU1hbmFnZXIiLCJfdW5kZXJseWluZ0VkaXRvcnMiLCJTZXQiLCJfYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0IiwiX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yIiwiZGVib3VuY2VUaW1lIiwicHVibGlzaFJlcGxheSIsInJlZkNvdW50IiwiX2FjdGl2ZUVkaXRvciIsIm1hcCIsIngiLCJvbW5pc2hhcnAiLCJjb25maWciLCJfYWN0aXZlQ29uZmlnRWRpdG9yIiwiX2FjdGl2ZVByb2plY3QiLCJzd2l0Y2hNYXAiLCJzb2x1dGlvbiIsIm1vZGVsIiwiZ2V0UHJvamVjdEZvckVkaXRvciIsImRpc3RpbmN0VW50aWxDaGFuZ2VkIiwiX2FjdGl2ZUZyYW1ld29yayIsInByb2plY3QiLCJvYnNlcnZlIiwiYWN0aXZlRnJhbWV3b3JrIiwiZnJhbWV3b3JrIiwiX2RpYWdub3N0aWNzU3ViamVjdCIsIl9kaWFnbm9zdGljcyIsImNhY2hlIiwiX2RpYWdub3N0aWNDb3VudHNTdWJqZWN0IiwiX2RpYWdub3N0aWNDb3VudHMiLCJfZGlhZ25vc3RpY3NCeUZpbGVTdWJqZWN0IiwiX2RpYWdub3N0aWNzQnlGaWxlIiwiX2lzT2ZmIiwiX3N1cHBvcnRlZEV4dGVuc2lvbnMiLCJkaXNwb3NhYmxlIiwiYWRkIiwiZWRpdG9ycyIsImNyZWF0ZVRleHRFZGl0b3JPYnNlcnZhYmxlIiwiX2VkaXRvcnMiLCJfY29uZmlnRWRpdG9ycyIsImFjdGl2ZVNvbHV0aW9uIiwic3Vic2NyaWJlIiwiYXRvbSIsIndvcmtzcGFjZSIsImdldFRleHRFZGl0b3JzIiwiX2lzT21uaVNoYXJwRWRpdG9yIiwiZWFjaCIsImdldFNvbHV0aW9uRm9yRWRpdG9yIiwiYWN0aXZhdGUiLCJzb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyIiwic3RhdGUiLCJldmVyeSIsInoiLCJ2YWx1ZSIsIkRpc2Nvbm5lY3RlZCIsIkVycm9yIiwiZGlzIiwib2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtIiwicGFuZSIsImdldEdyYW1tYXIiLCJnZXRQYXRoIiwiaXNWYWxpZEdyYW1tYXIiLCJvYnNlcnZlciIsIm5leHQiLCJkaXNwb3NlIiwiY29uY2F0TWFwIiwib2YiLCJjcmVhdGUiLCJjb2RlQ2hlY2tBZ2dyZWdhdGUiLCJhZ2dyZWdhdGVMaXN0ZW5lciIsImxpc3RlblRvIiwiZGlhZ25vc3RpY3MiLCJkYXRhIiwiZmxhdE1hcCIsImNvZGVDaGVja0NvdW50QWdncmVnYXRlIiwiZGlhZ25vc3RpY3NDb3VudHMiLCJyZXN1bHQiLCJpdGVtcyIsInkiLCJrIiwiY29kZUNoZWNrQnlGaWxlQWdncmVnYXRlIiwiZGlhZ25vc3RpY3NCeUZpbGUiLCJNYXAiLCJmaWxlIiwic2V0Iiwic2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zIiwiZW5hYmxlZCIsImJhc2VEaWFnbm9zdGljcyIsImNvbWJpbmVMYXRlc3QiLCJhY3RpdmVNb2RlbCIsInN0YXJ0V2l0aCIsInNraXAiLCJnZXQiLCJ3YXNFbmFibGVkIiwiY3R4Iiwic2hhcmUiLCJlbXB0eSIsIl91bml0VGVzdE1vZGVfIiwiZGVhY3RpdmF0ZSIsImNvbm5lY3QiLCJkaXNjb25uZWN0IiwiY29ubmVjdGVkIiwicmVzcG9uc2UiLCJmcm9tUHJvbWlzZSIsIm9wZW4iLCJGaWxlTmFtZSIsImluaXRpYWxMaW5lIiwiTGluZSIsImluaXRpYWxDb2x1bW4iLCJDb2x1bW4iLCJwcm9qZWN0cyIsImZyYW1ld29ya3MiLCJpbmRleE9mIiwic3BsaXQiLCJmdyIsImxlbmd0aCIsImpvaW4iLCJjb21tYW5kTmFtZSIsImNhbGxiYWNrIiwiY29tbWFuZHMiLCJldmVudCIsImdldEFjdGl2ZVRleHRFZGl0b3IiLCJzb21lIiwiZW5kc1dpdGgiLCJleHQiLCJzdG9wUHJvcGFnYXRpb24iLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJzYWZlR3VhcmQiLCJfY3JlYXRlU2FmZUd1YXJkIiwib2JzZXJ2ZVRleHRFZGl0b3JzIiwibWVyZ2UiLCJtZXJnZU1hcCIsImNyZWF0ZWQiLCJkZWxldGUiLCJvbkRpZERlc3Ryb3kiLCJsaXZlRWRpdG9ycyIsImRlZmVyIiwiZnJvbSIsImV4dGVuc2lvbnMiLCJlZGl0b3JTdWJqZWN0IiwiZWRpdG9yT2JzZXJ2YWJsZSIsInppcCIsIm5leHRFZGl0b3IiLCJub3RpZmljYXRpb25zIiwiYWRkSW5mbyIsImRldGFpbCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiZGlzcG9zZXIiLCJvbkRpZENoYW5nZVBhdGgiLCJpc0Z1bmN0aW9uIiwic29sdXRpb25DYWxsYmFjayIsIndpdGhFZGl0b3IiLCJzb2x1dGlvblJlc3VsdCIsInRha2UiLCJhY3RpdmVTb2x1dGlvbnMiLCJwIiwibmFtZSIsImZpcnN0Iiwib3V0ZXJDZCIsImNkIiwiYWN0aXZlIiwicmVtb3ZlIiwiYWN0aXZlRWRpdG9yIiwid2hlbkNvbm5lY3RlZCIsImFjdGl2ZUNvbmZpZ0VkaXRvciIsImFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yIiwicmVnaXN0ZXJDb25maWd1cmF0aW9uIiwiZ3JhbW1hciIsImdyYW1tYXJzIiwic2NvcGVOYW1lIiwidmVyc2lvbiIsImdldFZlcnNpb24iLCJpc09mZiIsInNvbHV0aW9uT2JzZXJ2ZXIiLCJfa2lja19pbl90aGVfcGFudHNfIiwiZ2V0R3JhbW1hcnMiLCJmaWxlVHlwZXMiLCJ0cmltU3RhcnQiLCJmdCIsIl9wYWNrYWdlRGlyIiwiY29uc29sZSIsImluZm8iLCJwYWNrYWdlcyIsImdldFBhY2thZ2VEaXJQYXRocyIsImZpbmQiLCJwYWNrYWdlUGF0aCIs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ZCxFQUFQLEVBQTJDLFVBQVNFLFdBQVQsRUFBb0I7QUFDOUVMLDRCQUFRQyxJQUFSLGtCQUE0QkksV0FBNUIsaUJBQW1Edk0sR0FBR3dNLFVBQUgsQ0FBY3ZNLEtBQUsrSCxJQUFMLENBQVV1RSxXQUFWLEVBQXVCLGdCQUF2QixDQUFkLENBQW5EO0FBQ0EsMkJBQU92TSxHQUFHd00sVUFBSCxDQUFjdk0sS0FBSytILElBQUwsQ0FBVXVFLFdBQVYsRUFBdUIsZ0JBQXZCLENBQWQsQ0FBUDtBQUNILGlCQUhrQixDQUFuQjtBQU1BLG9CQUFJLENBQUMsS0FBS04sV0FBVixFQUF1QjtBQUNuQix5QkFBS0EsV0FBTCxHQUFtQmhNLEtBQUs4SixPQUFMLENBQWEwQyxTQUFiLEVBQXdCLFVBQXhCLENBQW5CO0FBQ0g7QUFDSjtBQUNELG1CQUFPLEtBQUtSLFdBQVo7QUFDSDs7OzRCQUdxQjtBQUNsQixnQkFBSSxDQUFDLEtBQUtTLFlBQVYsRUFBd0I7QUFDcEIscUJBQUtBLFlBQUwsR0FBb0IsbUJBQWdCcEosS0FBS21JLFVBQUwsRUFBaEIsQ0FBcEI7QUFDSDtBQUNELG1CQUFPLEtBQUtpQixZQUFaO0FBQ0g7Ozs7OztBQVFFLElBQU1DLHNCQUFPLElBQUkvTCxXQUFKLEVBQWIiLCJmaWxlIjoibGliL3NlcnZlci9vbW5pLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSwgUmVwbGF5U3ViamVjdCwgU3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0LCBTY2hlZHVsZXIgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgY3JlYXRlT2JzZXJ2YWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgeyBTb2x1dGlvbk1hbmFnZXIgfSBmcm9tIFwiLi9zb2x1dGlvbi1tYW5hZ2VyXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBEcml2ZXJTdGF0ZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGlzT21uaXNoYXJwVGV4dEVkaXRvciwgT21uaXNoYXJwRWRpdG9yQ29udGV4dCB9IGZyb20gXCIuL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xuaW1wb3J0IHsgbWV0YWRhdGFPcGVuZXIgfSBmcm9tIFwiLi9tZXRhZGF0YS1lZGl0b3JcIjtcbmltcG9ydCB7IFNlbVZlciwgZ3QgYXMgc2VtdmVyR3QgfSBmcm9tIFwic2VtdmVyXCI7XG5jb25zdCBERUJPVU5DRV9USU1FT1VUID0gMTAwO1xuY29uc3Qgc3RhdGVmdWxQcm9wZXJ0aWVzID0gW1wiaXNPZmZcIiwgXCJpc0Nvbm5lY3RpbmdcIiwgXCJpc09uXCIsIFwiaXNSZWFkeVwiLCBcImlzRXJyb3JcIl07XG5mdW5jdGlvbiB3cmFwRWRpdG9yT2JzZXJ2YWJsZShvYnNlcnZhYmxlKSB7XG4gICAgcmV0dXJuIG9ic2VydmFibGVcbiAgICAgICAgLnN1YnNjcmliZU9uKFNjaGVkdWxlci5hc3luYylcbiAgICAgICAgLm9ic2VydmVPbihTY2hlZHVsZXIuYXN5bmMpXG4gICAgICAgIC5maWx0ZXIoZWRpdG9yID0+ICFlZGl0b3IgfHwgZWRpdG9yICYmICFlZGl0b3IuaXNEZXN0cm95ZWQoKSk7XG59XG5jbGFzcyBPbW5pTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX3VuZGVybHlpbmdFZGl0b3JzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QgPSBuZXcgQmVoYXZpb3JTdWJqZWN0KG51bGwpO1xuICAgICAgICB0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvciA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yU3ViamVjdClcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoREVCT1VOQ0VfVElNRU9VVClcbiAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXG4gICAgICAgICAgICAucmVmQ291bnQoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlRWRpdG9yID0gd3JhcEVkaXRvck9ic2VydmFibGUodGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KVxuICAgICAgICAgICAgLmRlYm91bmNlVGltZShERUJPVU5DRV9USU1FT1VUKVxuICAgICAgICAgICAgLm1hcCh4ID0+IHggJiYgeC5vbW5pc2hhcnAgJiYgIXgub21uaXNoYXJwLmNvbmZpZyA/IHggOiBudWxsKVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcbiAgICAgICAgICAgIC5yZWZDb3VudCgpO1xuICAgICAgICB0aGlzLl9hY3RpdmVDb25maWdFZGl0b3IgPSB3cmFwRWRpdG9yT2JzZXJ2YWJsZSh0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QpXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKERFQk9VTkNFX1RJTUVPVVQpXG4gICAgICAgICAgICAubWFwKHggPT4geCAmJiB4Lm9tbmlzaGFycCAmJiB4Lm9tbmlzaGFycC5jb25maWcgPyB4IDogbnVsbClcbiAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXG4gICAgICAgICAgICAucmVmQ291bnQoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlUHJvamVjdCA9IHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yXG4gICAgICAgICAgICAuZmlsdGVyKGVkaXRvciA9PiBlZGl0b3IgJiYgIWVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgLnN3aXRjaE1hcChlZGl0b3IgPT4gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5tb2RlbC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikpXG4gICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcbiAgICAgICAgICAgIC5yZWZDb3VudCgpO1xuICAgICAgICB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclxuICAgICAgICAgICAgLmZpbHRlcihlZGl0b3IgPT4gZWRpdG9yICYmICFlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAoZWRpdG9yID0+IGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24ubW9kZWwuZ2V0UHJvamVjdEZvckVkaXRvcihlZGl0b3IpKVxuICAgICAgICAgICAgLnN3aXRjaE1hcChwcm9qZWN0ID0+IHByb2plY3Qub2JzZXJ2ZS5hY3RpdmVGcmFtZXdvcmssIChwcm9qZWN0LCBmcmFtZXdvcmspID0+ICh7IHByb2plY3QsIGZyYW1ld29yayB9KSlcbiAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKVxuICAgICAgICAgICAgLnJlZkNvdW50KCk7XG4gICAgICAgIHRoaXMuX2RpYWdub3N0aWNzU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuX2RpYWdub3N0aWNzID0gdGhpcy5fZGlhZ25vc3RpY3NTdWJqZWN0LmNhY2hlKDEpO1xuICAgICAgICB0aGlzLl9kaWFnbm9zdGljQ291bnRzU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuX2RpYWdub3N0aWNDb3VudHMgPSB0aGlzLl9kaWFnbm9zdGljQ291bnRzU3ViamVjdC5jYWNoZSgxKTtcbiAgICAgICAgdGhpcy5fZGlhZ25vc3RpY3NCeUZpbGVTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5fZGlhZ25vc3RpY3NCeUZpbGUgPSB0aGlzLl9kaWFnbm9zdGljc0J5RmlsZVN1YmplY3QuY2FjaGUoMSk7XG4gICAgICAgIHRoaXMuX2lzT2ZmID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fc3VwcG9ydGVkRXh0ZW5zaW9ucyA9IFtcInByb2plY3QuanNvblwiLCBcIi5jc1wiLCBcIi5jc3hcIixdO1xuICAgIH1cbiAgICBnZXQgdmlld01vZGVsU3RhdGVmdWxQcm9wZXJ0aWVzKCkgeyByZXR1cm4gc3RhdGVmdWxQcm9wZXJ0aWVzOyB9XG4gICAgZ2V0IGRpYWdub3N0aWNzKCkgeyByZXR1cm4gdGhpcy5fZGlhZ25vc3RpY3M7IH1cbiAgICBnZXQgZGlhZ25vc3RpY3NDb3VudHMoKSB7IHJldHVybiB0aGlzLl9kaWFnbm9zdGljQ291bnRzOyB9XG4gICAgZ2V0IGRpYWdub3N0aWNzQnlGaWxlKCkgeyByZXR1cm4gdGhpcy5fZGlhZ25vc3RpY3NCeUZpbGU7IH1cbiAgICBnZXQgaXNPZmYoKSB7IHJldHVybiB0aGlzLl9pc09mZjsgfVxuICAgIGdldCBpc09uKCkgeyByZXR1cm4gIXRoaXMuaXNPZmY7IH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQobWV0YWRhdGFPcGVuZXIoKSk7XG4gICAgICAgIGNvbnN0IGVkaXRvcnMgPSB0aGlzLmNyZWF0ZVRleHRFZGl0b3JPYnNlcnZhYmxlKHRoaXMuZGlzcG9zYWJsZSk7XG4gICAgICAgIHRoaXMuX2VkaXRvcnMgPSB3cmFwRWRpdG9yT2JzZXJ2YWJsZShlZGl0b3JzLmZpbHRlcih4ID0+ICF4Lm9tbmlzaGFycC5jb25maWcpKTtcbiAgICAgICAgdGhpcy5fY29uZmlnRWRpdG9ycyA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKGVkaXRvcnMuZmlsdGVyKHggPT4geC5vbW5pc2hhcnAuY29uZmlnKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uLnN1YnNjcmliZShzb2x1dGlvbiA9PiB7XG4gICAgICAgICAgICBfKGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkpXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IHRoaXMuX2lzT21uaVNoYXJwRWRpdG9yKHgpKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAheC5vbW5pc2hhcnApXG4gICAgICAgICAgICAgICAgLmVhY2goeCA9PiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoeCkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIFNvbHV0aW9uTWFuYWdlci5hY3RpdmF0ZSh0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvcik7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoU29sdXRpb25NYW5hZ2VyLnNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIuc3RhdGUuc3Vic2NyaWJlKHogPT4gdGhpcy5faXNPZmYgPSBfLmV2ZXJ5KHosIHggPT4geC52YWx1ZSA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkIHx8IHgudmFsdWUgPT09IERyaXZlclN0YXRlLkVycm9yKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGNyZWF0ZU9ic2VydmFibGUob2JzZXJ2ZXIgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGlzID0gYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKChwYW5lKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBhbmUgJiYgcGFuZS5nZXRHcmFtbWFyICYmIHBhbmUuZ2V0UGF0aCAmJiB0aGlzLmlzVmFsaWRHcmFtbWFyKHBhbmUuZ2V0R3JhbW1hcigpKSkge1xuICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5uZXh0KHBhbmUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9ic2VydmVyLm5leHQobnVsbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiBkaXMuZGlzcG9zZSgpO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLmNvbmNhdE1hcCgocGFuZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFwYW5lIHx8IGlzT21uaXNoYXJwVGV4dEVkaXRvcihwYW5lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHBhbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHdyYXBFZGl0b3JPYnNlcnZhYmxlKFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcihwYW5lKVxuICAgICAgICAgICAgICAgIC5tYXAoeCA9PiBwYW5lKSk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yU3ViamVjdCkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yU3ViamVjdC5uZXh0KG51bGwpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNvbnN0IGNvZGVDaGVja0FnZ3JlZ2F0ZSA9IHRoaXMuYWdncmVnYXRlTGlzdGVuZXIubGlzdGVuVG8oeiA9PiB6Lm1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3MpXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDIwMClcbiAgICAgICAgICAgIC5tYXAoZGF0YSA9PiBfKGRhdGEpLmZsYXRNYXAoeCA9PiB4LnZhbHVlKS52YWx1ZSgpKTtcbiAgICAgICAgY29uc3QgY29kZUNoZWNrQ291bnRBZ2dyZWdhdGUgPSB0aGlzLmFnZ3JlZ2F0ZUxpc3RlbmVyLmxpc3RlblRvKHogPT4gei5tb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzQ291bnRzKVxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgyMDApXG4gICAgICAgICAgICAubWFwKGl0ZW1zID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCAoeSkgPT4ge1xuICAgICAgICAgICAgICAgIF8uZWFjaCh5LnZhbHVlLCAoeCwgaykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdFtrXSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtrXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtrXSArPSB4O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgY29kZUNoZWNrQnlGaWxlQWdncmVnYXRlID0gdGhpcy5hZ2dyZWdhdGVMaXN0ZW5lci5saXN0ZW5Ubyh6ID0+IHoubW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljc0J5RmlsZS5tYXAoeCA9PiB6Lm1vZGVsLmRpYWdub3N0aWNzQnlGaWxlKSlcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwKVxuICAgICAgICAgICAgLm1hcCh4ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIF8uZWFjaCh4LCB6ID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBbZmlsZSwgZGlhZ25vc3RpY3NdIG9mIHoudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFwLnNldChmaWxlLCBkaWFnbm9zdGljcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbWFwO1xuICAgICAgICB9KTtcbiAgICAgICAgbGV0IHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucyA9IG5ldyBSZXBsYXlTdWJqZWN0KDEpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5zaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnNcIiwgZnVuY3Rpb24gKGVuYWJsZWQpIHtcbiAgICAgICAgICAgIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucy5uZXh0KGVuYWJsZWQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zKTtcbiAgICAgICAgY29uc3QgYmFzZURpYWdub3N0aWNzID0gT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KHRoaXMuYWN0aXZlTW9kZWwuc3RhcnRXaXRoKG51bGwpLCBzaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnMsIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucy5za2lwKDEpLnN0YXJ0V2l0aChhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5zaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnNcIikpLCAobW9kZWwsIGVuYWJsZWQsIHdhc0VuYWJsZWQpID0+ICh7IG1vZGVsLCBlbmFibGVkLCB3YXNFbmFibGVkIH0pKVxuICAgICAgICAgICAgLmZpbHRlcihjdHggPT4gKCEoY3R4LmVuYWJsZWQgJiYgY3R4Lndhc0VuYWJsZWQgPT09IGN0eC5lbmFibGVkKSkpXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChiYXNlRGlhZ25vc3RpY3NcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAoY3R4ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgZW5hYmxlZCwgbW9kZWwgfSA9IGN0eDtcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvZGVDaGVja0FnZ3JlZ2F0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG1vZGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihbXSk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhcnRXaXRoKFtdKVxuICAgICAgICAgICAgLnN1YnNjcmliZSh0aGlzLl9kaWFnbm9zdGljc1N1YmplY3QpLCBiYXNlRGlhZ25vc3RpY3NcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAoY3R4ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgZW5hYmxlZCwgbW9kZWwgfSA9IGN0eDtcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvZGVDaGVja0NvdW50QWdncmVnYXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobW9kZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljc0NvdW50cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhcnRXaXRoKHt9KVxuICAgICAgICAgICAgLnN1YnNjcmliZSh0aGlzLl9kaWFnbm9zdGljQ291bnRzU3ViamVjdCksIGJhc2VEaWFnbm9zdGljc1xuICAgICAgICAgICAgLnN3aXRjaE1hcChjdHggPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBlbmFibGVkLCBtb2RlbCB9ID0gY3R4O1xuICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29kZUNoZWNrQnlGaWxlQWdncmVnYXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobW9kZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljc0J5RmlsZS5tYXAoeCA9PiBtb2RlbC5kaWFnbm9zdGljc0J5RmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihuZXcgTWFwKCkpO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXJ0V2l0aChuZXcgTWFwKCkpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHRoaXMuX2RpYWdub3N0aWNzQnlGaWxlU3ViamVjdCkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICBpZiAoU29sdXRpb25NYW5hZ2VyLl91bml0VGVzdE1vZGVfKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICBTb2x1dGlvbk1hbmFnZXIuZGVhY3RpdmF0ZSgpO1xuICAgIH1cbiAgICBjb25uZWN0KCkgeyBTb2x1dGlvbk1hbmFnZXIuY29ubmVjdCgpOyB9XG4gICAgZGlzY29ubmVjdCgpIHsgU29sdXRpb25NYW5hZ2VyLmRpc2Nvbm5lY3QoKTsgfVxuICAgIHRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKFNvbHV0aW9uTWFuYWdlci5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIFNvbHV0aW9uTWFuYWdlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG5hdmlnYXRlVG8ocmVzcG9uc2UpIHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbVByb21pc2UoYXRvbS53b3Jrc3BhY2Uub3BlbihyZXNwb25zZS5GaWxlTmFtZSwgeyBpbml0aWFsTGluZTogcmVzcG9uc2UuTGluZSwgaW5pdGlhbENvbHVtbjogcmVzcG9uc2UuQ29sdW1uIH0pKTtcbiAgICB9XG4gICAgZ2V0RnJhbWV3b3Jrcyhwcm9qZWN0cykge1xuICAgICAgICBjb25zdCBmcmFtZXdvcmtzID0gXy5tYXAocHJvamVjdHMsIChwcm9qZWN0KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcHJvamVjdC5pbmRleE9mKFwiK1wiKSA9PT0gLTEgPyBcIlwiIDogcHJvamVjdC5zcGxpdChcIitcIilbMV07XG4gICAgICAgIH0pLmZpbHRlcigoZncpID0+IGZ3Lmxlbmd0aCA+IDApO1xuICAgICAgICByZXR1cm4gZnJhbWV3b3Jrcy5qb2luKFwiLFwiKTtcbiAgICB9XG4gICAgYWRkVGV4dEVkaXRvckNvbW1hbmQoY29tbWFuZE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3JcIiwgY29tbWFuZE5hbWUsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICAgICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA7XG4gICAgICAgICAgICBpZiAoXy5zb21lKHRoaXMuX3N1cHBvcnRlZEV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKGVkaXRvci5nZXRQYXRoKCksIGV4dCkpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgX2lzT21uaVNoYXJwRWRpdG9yKGVkaXRvcikge1xuICAgICAgICByZXR1cm4gXy5zb21lKHRoaXMuX3N1cHBvcnRlZEV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKGVkaXRvci5nZXRQYXRoKCksIGV4dCkpO1xuICAgIH1cbiAgICBjcmVhdGVUZXh0RWRpdG9yT2JzZXJ2YWJsZShkaXNwb3NhYmxlKSB7XG4gICAgICAgIGNvbnN0IHNhZmVHdWFyZCA9IHRoaXMuX2NyZWF0ZVNhZmVHdWFyZCh0aGlzLl9zdXBwb3J0ZWRFeHRlbnNpb25zLCBkaXNwb3NhYmxlKTtcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZVRleHRFZGl0b3JzID0gY3JlYXRlT2JzZXJ2YWJsZShvYnNlcnZlciA9PiB7XG4gICAgICAgICAgICBjb25zdCBkaXMgPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoKGVkaXRvcikgPT4ge1xuICAgICAgICAgICAgICAgIG9ic2VydmVyLm5leHQoZWRpdG9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IGRpcy5kaXNwb3NlKCk7XG4gICAgICAgIH0pLnNoYXJlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT2JzZXJ2YWJsZS5tZXJnZShvYnNlcnZlVGV4dEVkaXRvcnMuZmlsdGVyKHggPT4gISF4LmdldFBhdGgoKSksIHNhZmVHdWFyZClcbiAgICAgICAgICAgIC5tZXJnZU1hcChlZGl0b3IgPT4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvciksIChlZGl0b3IsIHNvbHV0aW9uKSA9PiBlZGl0b3IpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCksIE9tbmlzaGFycEVkaXRvckNvbnRleHQuY3JlYXRlZFxuICAgICAgICAgICAgLnN1YnNjcmliZShlZGl0b3IgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdW5kZXJseWluZ0VkaXRvcnMuYWRkKGVkaXRvcik7XG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmNvbmZpZyA9IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgXCJwcm9qZWN0Lmpzb25cIik7XG4gICAgICAgICAgICBjb25zdCBkaXMgPSBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdW5kZXJseWluZ0VkaXRvcnMuZGVsZXRlKGVkaXRvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzLCBlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IGRpcy5kaXNwb3NlKCkpKTtcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoZGlzKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBjb25zdCBsaXZlRWRpdG9ycyA9IE9tbmlzaGFycEVkaXRvckNvbnRleHQuY3JlYXRlZDtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUubWVyZ2UoT2JzZXJ2YWJsZS5kZWZlcigoKSA9PiBPYnNlcnZhYmxlLmZyb20odGhpcy5fdW5kZXJseWluZ0VkaXRvcnMpKSwgbGl2ZUVkaXRvcnMpO1xuICAgIH1cbiAgICBfY3JlYXRlU2FmZUd1YXJkKGV4dGVuc2lvbnMsIGRpc3Bvc2FibGUpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbSgocGFuZSkgPT4gZWRpdG9yU3ViamVjdC5uZXh0KHBhbmUpKSk7XG4gICAgICAgIGNvbnN0IGVkaXRvck9ic2VydmFibGUgPSBlZGl0b3JTdWJqZWN0LmZpbHRlcih6ID0+IHogJiYgISF6LmdldEdyYW1tYXIpLnN0YXJ0V2l0aChudWxsKTtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuemlwKGVkaXRvck9ic2VydmFibGUsIGVkaXRvck9ic2VydmFibGUuc2tpcCgxKSwgKGVkaXRvciwgbmV4dEVkaXRvcikgPT4gKHsgZWRpdG9yLCBuZXh0RWRpdG9yIH0pKVxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSg1MClcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAoKHsgbmV4dEVkaXRvciB9KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gbmV4dEVkaXRvci5nZXRQYXRoKCk7XG4gICAgICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgICAgICBpZiAobmV4dEVkaXRvciAmJiB0aGlzLl9pc09tbmlTaGFycEVkaXRvcihuZXh0RWRpdG9yKSkge1xuICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhcIk9tbmlTaGFycFwiLCB7IGRldGFpbDogXCJGdW5jdGlvbmFsaXR5IHdpbGwgbGltaXRlZCB1bnRpbCB0aGUgZmlsZSBoYXMgYmVlbiBzYXZlZC5cIiB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcG9zZXIgPSBuZXh0RWRpdG9yLm9uRGlkQ2hhbmdlUGF0aCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5leHRFZGl0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcG9zZXIuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KTtcbiAgICB9XG4gICAgZ2V0IGxpc3RlbmVyKCkge1xuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLnNvbHV0aW9uT2JzZXJ2ZXI7XG4gICAgfVxuICAgIGdldCBhZ2dyZWdhdGVMaXN0ZW5lcigpIHtcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5zb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyO1xuICAgIH1cbiAgICBnZXQgc29sdXRpb25zKCkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5kZWZlcigoKSA9PiBPYnNlcnZhYmxlLmZyb20oU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucykpO1xuICAgIH1cbiAgICByZXF1ZXN0KGVkaXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihlZGl0b3IpKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGVkaXRvcjtcbiAgICAgICAgICAgIGVkaXRvciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgICAgICAgIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzb2x1dGlvbkNhbGxiYWNrID0gKHNvbHV0aW9uKSA9PiBjYWxsYmFjayhzb2x1dGlvbi53aXRoRWRpdG9yKGVkaXRvcikpO1xuICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICBpZiAoZWRpdG9yICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBzb2x1dGlvbkNhbGxiYWNrKGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24pXG4gICAgICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgICAgICAgICByZXN1bHQuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGxldCBzb2x1dGlvblJlc3VsdDtcbiAgICAgICAgaWYgKGVkaXRvcikge1xuICAgICAgICAgICAgc29sdXRpb25SZXN1bHQgPSBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNvbHV0aW9uUmVzdWx0ID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uLnRha2UoMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gc29sdXRpb25SZXN1bHRcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAuZmxhdE1hcChzb2x1dGlvbkNhbGxiYWNrKVxuICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgICAgIHJlc3VsdC5zdWJzY3JpYmUoKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgZ2V0UHJvamVjdChlZGl0b3IpIHtcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpICYmIGVkaXRvci5vbW5pc2hhcnAucHJvamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoZWRpdG9yLm9tbmlzaGFycC5wcm9qZWN0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcilcbiAgICAgICAgICAgIC5mbGF0TWFwKHogPT4gei5tb2RlbC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikpXG4gICAgICAgICAgICAudGFrZSgxKTtcbiAgICB9XG4gICAgZ2V0U29sdXRpb25Gb3JQcm9qZWN0KHByb2plY3QpIHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoXyhTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zKVxuICAgICAgICAgICAgLmZpbHRlcihzb2x1dGlvbiA9PiBfLnNvbWUoc29sdXRpb24ubW9kZWwucHJvamVjdHMsIHAgPT4gcC5uYW1lID09PSBwcm9qZWN0Lm5hbWUpKVxuICAgICAgICAgICAgLmZpcnN0KCkpO1xuICAgIH1cbiAgICBnZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpIHtcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcik7XG4gICAgfVxuICAgIGdldCBhY3RpdmVNb2RlbCgpIHtcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbi5tYXAoeiA9PiB6Lm1vZGVsKTtcbiAgICB9XG4gICAgc3dpdGNoQWN0aXZlTW9kZWwoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlTW9kZWwuZmlsdGVyKHogPT4gISF6KS5zdWJzY3JpYmUobW9kZWwgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xuICAgICAgICAgICAgbW9kZWwuZGlzcG9zYWJsZS5hZGQoY2QpO1xuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlTW9kZWwuZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IG1vZGVsKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIG1vZGVsLmRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2FsbGJhY2sobW9kZWwsIGNkKTtcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcbiAgICB9XG4gICAgZ2V0IGFjdGl2ZVNvbHV0aW9uKCkge1xuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uO1xuICAgIH1cbiAgICBzd2l0Y2hBY3RpdmVTb2x1dGlvbihjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBvdXRlckNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5hY3RpdmVTb2x1dGlvbi5maWx0ZXIoeiA9PiAhIXopLnN1YnNjcmliZShzb2x1dGlvbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XG4gICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChjZCk7XG4gICAgICAgICAgICBjZC5hZGQodGhpcy5hY3RpdmVTb2x1dGlvbi5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gc29sdXRpb24pXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgc29sdXRpb24uZGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjYWxsYmFjayhzb2x1dGlvbiwgY2QpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHJldHVybiBvdXRlckNkO1xuICAgIH1cbiAgICBnZXQgYWN0aXZlRWRpdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlRWRpdG9yO1xuICAgIH1cbiAgICBzd2l0Y2hBY3RpdmVFZGl0b3IoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlRWRpdG9yLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcbiAgICAgICAgICAgIGNkLmFkZCh0aGlzLmFjdGl2ZUVkaXRvci5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gZWRpdG9yKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjYWxsYmFjayhlZGl0b3IsIGNkKTtcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcbiAgICB9XG4gICAgd2hlbkVkaXRvckNvbm5lY3RlZChlZGl0b3IpIHtcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvblxuICAgICAgICAgICAgICAgIC53aGVuQ29ubmVjdGVkKClcbiAgICAgICAgICAgICAgICAubWFwKHogPT4gZWRpdG9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcilcbiAgICAgICAgICAgIC5mbGF0TWFwKHNvbHV0aW9uID0+IHNvbHV0aW9uLndoZW5Db25uZWN0ZWQoKSwgKCkgPT4gZWRpdG9yKTtcbiAgICB9XG4gICAgZ2V0IGFjdGl2ZUNvbmZpZ0VkaXRvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUNvbmZpZ0VkaXRvcjtcbiAgICB9XG4gICAgc3dpdGNoQWN0aXZlQ29uZmlnRWRpdG9yKGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBvdXRlckNkLmFkZCh0aGlzLmFjdGl2ZUNvbmZpZ0VkaXRvci5maWx0ZXIoeiA9PiAhIXopLnN1YnNjcmliZShlZGl0b3IgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xuICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChjZCk7XG4gICAgICAgICAgICBjZC5hZGQodGhpcy5hY3RpdmVDb25maWdFZGl0b3IuZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IGVkaXRvcilcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XG4gICAgfVxuICAgIGdldCBhY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yO1xuICAgIH1cbiAgICBzd2l0Y2hBY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvcihjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBvdXRlckNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvci5maWx0ZXIoeiA9PiAhIXopLnN1YnNjcmliZShlZGl0b3IgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3IuZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IGVkaXRvcilcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XG4gICAgfVxuICAgIGdldCBhY3RpdmVQcm9qZWN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlUHJvamVjdDtcbiAgICB9XG4gICAgZ2V0IGFjdGl2ZUZyYW1ld29yaygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUZyYW1ld29yaztcbiAgICB9XG4gICAgZ2V0IGVkaXRvcnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lZGl0b3JzO1xuICAgIH1cbiAgICBnZXQgY29uZmlnRWRpdG9ycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZ0VkaXRvcnM7XG4gICAgfVxuICAgIGVhY2hFZGl0b3IoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuX2VkaXRvcnMuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5kaXNwb3NhYmxlLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH0pKSk7XG4gICAgICAgICAgICBjYWxsYmFjayhlZGl0b3IsIGNkKTtcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcbiAgICB9XG4gICAgZWFjaENvbmZpZ0VkaXRvcihjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBvdXRlckNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5fY29uZmlnRWRpdG9ycy5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoY2QpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCgpID0+IHtcbiAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfSkpKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHJldHVybiBvdXRlckNkO1xuICAgIH1cbiAgICByZWdpc3RlckNvbmZpZ3VyYXRpb24oY2FsbGJhY2spIHtcbiAgICAgICAgU29sdXRpb25NYW5hZ2VyLnJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjayk7XG4gICAgfVxuICAgIGdldCBfa2lja19pbl90aGVfcGFudHNfKCkge1xuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLl9raWNrX2luX3RoZV9wYW50c187XG4gICAgfVxuICAgIGdldCBncmFtbWFycygpIHtcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGF0b20uZ3JhbW1hcnMuZ2V0R3JhbW1hcnMoKSwgZ3JhbW1hciA9PiBfLnNvbWUodGhpcy5fc3VwcG9ydGVkRXh0ZW5zaW9ucywgZXh0ID0+IF8uc29tZShncmFtbWFyLmZpbGVUeXBlcywgZnQgPT4gXy50cmltU3RhcnQoZXh0LCBcIi5cIikgPT09IGZ0KSkpO1xuICAgIH1cbiAgICBpc1ZhbGlkR3JhbW1hcihncmFtbWFyKSB7XG4gICAgICAgIHJldHVybiBfLnNvbWUodGhpcy5ncmFtbWFycywgeyBzY29wZU5hbWU6IGdyYW1tYXIuc2NvcGVOYW1lIH0pO1xuICAgIH1cbiAgICBnZXQgcGFja2FnZURpcigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9wYWNrYWdlRGlyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oYGdldFBhY2thZ2VEaXJQYXRoczogJHthdG9tLnBhY2thZ2VzLmdldFBhY2thZ2VEaXJQYXRocygpfWApO1xuICAgICAgICAgICAgdGhpcy5fcGFja2FnZURpciA9IF8uZmluZChhdG9tLnBhY2thZ2VzLmdldFBhY2thZ2VEaXJQYXRocygpLCBmdW5jdGlvbiAocGFja2FnZVBhdGgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYHBhY2thZ2VQYXRoICR7cGFja2FnZVBhdGh9IGV4aXN0czogJHtmcy5leGlzdHNTeW5jKHBhdGguam9pbihwYWNrYWdlUGF0aCwgXCJvbW5pc2hhcnAtYXRvbVwiKSl9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhY2thZ2VQYXRoLCBcIm9tbmlzaGFycC1hdG9tXCIpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9wYWNrYWdlRGlyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFja2FnZURpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vLi4vLi5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhY2thZ2VEaXI7XG4gICAgfVxuICAgIGdldCBhdG9tVmVyc2lvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9hdG9tVmVyc2lvbikge1xuICAgICAgICAgICAgdGhpcy5fYXRvbVZlcnNpb24gPSBuZXcgU2VtVmVyKGF0b20uZ2V0VmVyc2lvbigpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fYXRvbVZlcnNpb247XG4gICAgfVxuICAgIGF0b21WZXJzaW9uR3JlYXRlclRoYW4odmVyc2lvbikge1xuICAgICAgICByZXR1cm4gc2VtdmVyR3QoYXRvbS5nZXRWZXJzaW9uKCksIHZlcnNpb24pO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBPbW5pID0gbmV3IE9tbmlNYW5hZ2VyO1xuIiwiaW1wb3J0IHtPYnNlcnZhYmxlLCBSZXBsYXlTdWJqZWN0LCBTdWJqZWN0LCBCZWhhdmlvclN1YmplY3QsIFNjaGVkdWxlcn0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtjcmVhdGVPYnNlcnZhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwidHMtZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtTb2x1dGlvbk1hbmFnZXJ9IGZyb20gXCIuL3NvbHV0aW9uLW1hbmFnZXJcIjtcclxuaW1wb3J0IHtTb2x1dGlvbn0gZnJvbSBcIi4vc29sdXRpb25cIjtcclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge0RyaXZlclN0YXRlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge1Byb2plY3RWaWV3TW9kZWx9IGZyb20gXCIuL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xyXG5pbXBvcnQge1ZpZXdNb2RlbH0gZnJvbSBcIi4vdmlldy1tb2RlbFwiO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pc2hhcnBUZXh0RWRpdG9yLCBpc09tbmlzaGFycFRleHRFZGl0b3IsIE9tbmlzaGFycEVkaXRvckNvbnRleHR9IGZyb20gXCIuL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xyXG5pbXBvcnQge21ldGFkYXRhT3BlbmVyfSBmcm9tIFwiLi9tZXRhZGF0YS1lZGl0b3JcIjtcclxuaW1wb3J0IHtTZW1WZXIsIGd0IGFzIHNlbXZlckd0fSBmcm9tIFwic2VtdmVyXCI7XHJcblxyXG4vLyBUaW1lIHdlIHdhaXQgdG8gdHJ5IGFuZCBkbyBvdXIgYWN0aXZlIHN3aXRjaCB0YXNrcy5cclxuY29uc3QgREVCT1VOQ0VfVElNRU9VVCA9IDEwMDtcclxuY29uc3Qgc3RhdGVmdWxQcm9wZXJ0aWVzID0gW1wiaXNPZmZcIiwgXCJpc0Nvbm5lY3RpbmdcIiwgXCJpc09uXCIsIFwiaXNSZWFkeVwiLCBcImlzRXJyb3JcIl07XHJcblxyXG5mdW5jdGlvbiB3cmFwRWRpdG9yT2JzZXJ2YWJsZShvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPE9tbmlzaGFycFRleHRFZGl0b3I+KSB7XHJcbiAgICByZXR1cm4gb2JzZXJ2YWJsZVxyXG4gICAgICAgIC5zdWJzY3JpYmVPbihTY2hlZHVsZXIuYXN5bmMpXHJcbiAgICAgICAgLm9ic2VydmVPbihTY2hlZHVsZXIuYXN5bmMpXHJcbiAgICAgICAgLmZpbHRlcihlZGl0b3IgPT4gIWVkaXRvciB8fCBlZGl0b3IgJiYgIWVkaXRvci5pc0Rlc3Ryb3llZCgpKTtcclxufVxyXG5cclxuY2xhc3MgT21uaU1hbmFnZXIgaW1wbGVtZW50cyBJRGlzcG9zYWJsZSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgcHJpdmF0ZSBfZWRpdG9yczogT2JzZXJ2YWJsZTxPbW5pc2hhcnBUZXh0RWRpdG9yPjtcclxuICAgIHByaXZhdGUgX2NvbmZpZ0VkaXRvcnM6IE9ic2VydmFibGU8T21uaXNoYXJwVGV4dEVkaXRvcj47XHJcbiAgICBwcml2YXRlIF91bmRlcmx5aW5nRWRpdG9ycyA9IG5ldyBTZXQ8T21uaXNoYXJwVGV4dEVkaXRvcj4oKTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0IHZpZXdNb2RlbFN0YXRlZnVsUHJvcGVydGllcygpIHsgcmV0dXJuIHN0YXRlZnVsUHJvcGVydGllczsgfVxyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yU3ViamVjdCA9IG5ldyBCZWhhdmlvclN1YmplY3Q8T21uaXNoYXJwVGV4dEVkaXRvcj4obnVsbCk7XHJcbiAgICBwcml2YXRlIF9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvciA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKDxPYnNlcnZhYmxlPE9tbmlzaGFycFRleHRFZGl0b3I+Pjxhbnk+dGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KVxyXG4gICAgICAgIC5kZWJvdW5jZVRpbWUoREVCT1VOQ0VfVElNRU9VVClcclxuICAgICAgICAucHVibGlzaFJlcGxheSgxKVxyXG4gICAgICAgIC5yZWZDb3VudCgpO1xyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2ZUVkaXRvciA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKDxPYnNlcnZhYmxlPE9tbmlzaGFycFRleHRFZGl0b3I+Pjxhbnk+dGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KVxyXG4gICAgICAgIC5kZWJvdW5jZVRpbWUoREVCT1VOQ0VfVElNRU9VVClcclxuICAgICAgICAubWFwKHggPT4geCAmJiB4Lm9tbmlzaGFycCAmJiAheC5vbW5pc2hhcnAuY29uZmlnID8geCA6IG51bGwpXHJcbiAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcclxuICAgICAgICAucmVmQ291bnQoKTtcclxuXHJcbiAgICBwcml2YXRlIF9hY3RpdmVDb25maWdFZGl0b3IgPSB3cmFwRWRpdG9yT2JzZXJ2YWJsZSg8T2JzZXJ2YWJsZTxPbW5pc2hhcnBUZXh0RWRpdG9yPj48YW55PnRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yU3ViamVjdClcclxuICAgICAgICAuZGVib3VuY2VUaW1lKERFQk9VTkNFX1RJTUVPVVQpXHJcbiAgICAgICAgLm1hcCh4ID0+IHggJiYgeC5vbW5pc2hhcnAgJiYgeC5vbW5pc2hhcnAuY29uZmlnID8geCA6IG51bGwpXHJcbiAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcclxuICAgICAgICAucmVmQ291bnQoKTtcclxuXHJcbiAgICBwcml2YXRlIF9hY3RpdmVQcm9qZWN0ID0gdGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JcclxuICAgICAgICAuZmlsdGVyKGVkaXRvciA9PiBlZGl0b3IgJiYgIWVkaXRvci5pc0Rlc3Ryb3llZCgpKVxyXG4gICAgICAgIC5zd2l0Y2hNYXAoZWRpdG9yID0+IGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24ubW9kZWwuZ2V0UHJvamVjdEZvckVkaXRvcihlZGl0b3IpKVxyXG4gICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpXHJcbiAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcclxuICAgICAgICAucmVmQ291bnQoKTtcclxuXHJcbiAgICBwcml2YXRlIF9hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclxyXG4gICAgICAgIC5maWx0ZXIoZWRpdG9yID0+IGVkaXRvciAmJiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpXHJcbiAgICAgICAgLnN3aXRjaE1hcChlZGl0b3IgPT4gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5tb2RlbC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikpXHJcbiAgICAgICAgLnN3aXRjaE1hcChwcm9qZWN0ID0+IHByb2plY3Qub2JzZXJ2ZS5hY3RpdmVGcmFtZXdvcmssIChwcm9qZWN0LCBmcmFtZXdvcmspID0+ICh7IHByb2plY3QsIGZyYW1ld29yayB9KSlcclxuICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKVxyXG4gICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXHJcbiAgICAgICAgLnJlZkNvdW50KCk7XHJcblxyXG4gICAgcHJpdmF0ZSBfZGlhZ25vc3RpY3NTdWJqZWN0ID0gbmV3IFN1YmplY3Q8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPigpO1xyXG4gICAgcHJpdmF0ZSBfZGlhZ25vc3RpY3MgPSB0aGlzLl9kaWFnbm9zdGljc1N1YmplY3QuY2FjaGUoMSk7XHJcbiAgICBwdWJsaWMgZ2V0IGRpYWdub3N0aWNzKCkgeyByZXR1cm4gdGhpcy5fZGlhZ25vc3RpY3M7IH1cclxuXHJcbiAgICBwcml2YXRlIF9kaWFnbm9zdGljQ291bnRzU3ViamVjdCA9IG5ldyBTdWJqZWN0PHsgW2tleTogc3RyaW5nXTogbnVtYmVyOyB9PigpO1xyXG4gICAgcHJpdmF0ZSBfZGlhZ25vc3RpY0NvdW50cyA9IHRoaXMuX2RpYWdub3N0aWNDb3VudHNTdWJqZWN0LmNhY2hlKDEpO1xyXG4gICAgcHVibGljIGdldCBkaWFnbm9zdGljc0NvdW50cygpIHsgcmV0dXJuIHRoaXMuX2RpYWdub3N0aWNDb3VudHM7IH1cclxuXHJcbiAgICBwcml2YXRlIF9kaWFnbm9zdGljc0J5RmlsZVN1YmplY3QgPSBuZXcgU3ViamVjdDxNYXA8c3RyaW5nLCBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+PigpO1xyXG4gICAgcHJpdmF0ZSBfZGlhZ25vc3RpY3NCeUZpbGUgPSB0aGlzLl9kaWFnbm9zdGljc0J5RmlsZVN1YmplY3QuY2FjaGUoMSk7XHJcbiAgICBwdWJsaWMgZ2V0IGRpYWdub3N0aWNzQnlGaWxlKCkgeyByZXR1cm4gdGhpcy5fZGlhZ25vc3RpY3NCeUZpbGU7IH1cclxuXHJcbiAgICBwcml2YXRlIF9pc09mZiA9IHRydWU7XHJcblxyXG4gICAgcHVibGljIGdldCBpc09mZigpIHsgcmV0dXJuIHRoaXMuX2lzT2ZmOyB9XHJcbiAgICBwdWJsaWMgZ2V0IGlzT24oKSB7IHJldHVybiAhdGhpcy5pc09mZjsgfVxyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKG1ldGFkYXRhT3BlbmVyKCkpO1xyXG5cclxuICAgICAgICBjb25zdCBlZGl0b3JzID0gdGhpcy5jcmVhdGVUZXh0RWRpdG9yT2JzZXJ2YWJsZSh0aGlzLmRpc3Bvc2FibGUpO1xyXG4gICAgICAgIHRoaXMuX2VkaXRvcnMgPSB3cmFwRWRpdG9yT2JzZXJ2YWJsZShlZGl0b3JzLmZpbHRlcih4ID0+ICF4Lm9tbmlzaGFycC5jb25maWcpKTtcclxuICAgICAgICB0aGlzLl9jb25maWdFZGl0b3JzID0gd3JhcEVkaXRvck9ic2VydmFibGUoZWRpdG9ycy5maWx0ZXIoeCA9PiB4Lm9tbmlzaGFycC5jb25maWcpKTtcclxuXHJcbiAgICAgICAgLy8gUmVzdG9yZSBzb2x1dGlvbnMgYWZ0ZXIgdGhlIHNlcnZlciB3YXMgZGlzY29ubmVjdGVkXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb24uc3Vic2NyaWJlKHNvbHV0aW9uID0+IHtcclxuICAgICAgICAgICAgXyhhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IHRoaXMuX2lzT21uaVNoYXJwRWRpdG9yKHgpKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEoPGFueT54KS5vbW5pc2hhcnApXHJcbiAgICAgICAgICAgICAgICAuZWFjaCh4ID0+IFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcih4KSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBTb2x1dGlvbk1hbmFnZXIuYWN0aXZhdGUodGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3IpO1xyXG5cclxuICAgICAgICAvLyB3ZSBhcmUgb25seSBvZmYgaWYgYWxsIG91ciBzb2x1dGlvbnMgYXJlIGRpc2Nvbm5jdGVkIG9yIGVycm9lZC5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFNvbHV0aW9uTWFuYWdlci5zb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyLnN0YXRlLnN1YnNjcmliZSh6ID0+IHRoaXMuX2lzT2ZmID0gXy5ldmVyeSh6LCB4ID0+IHgudmFsdWUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCB8fCB4LnZhbHVlID09PSBEcml2ZXJTdGF0ZS5FcnJvcikpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgY3JlYXRlT2JzZXJ2YWJsZTxBdG9tLlRleHRFZGl0b3I+KG9ic2VydmVyID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRpcyA9IGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbSgocGFuZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhbmUgJiYgcGFuZS5nZXRHcmFtbWFyICYmIHBhbmUuZ2V0UGF0aCAmJiB0aGlzLmlzVmFsaWRHcmFtbWFyKHBhbmUuZ2V0R3JhbW1hcigpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5uZXh0KDxBdG9tLlRleHRFZGl0b3I+cGFuZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgb2JzZXJ2ZXIubmV4dChudWxsKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiBkaXMuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmNvbmNhdE1hcCgocGFuZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFuZSB8fCBpc09tbmlzaGFycFRleHRFZGl0b3IocGFuZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YocGFuZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3cmFwRWRpdG9yT2JzZXJ2YWJsZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKHBhbmUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKHggPT4gPE9tbmlzaGFycFRleHRFZGl0b3I+cGFuZSlcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUodGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QubmV4dChudWxsKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIC8vIENhY2hlIHRoaXMgcmVzdWx0LCBiZWNhdXNlIHRoZSB1bmRlcmx5aW5nIGltcGxlbWVudGF0aW9uIG9mIG9ic2VydmUgd2lsbFxyXG4gICAgICAgIC8vICAgIGNyZWF0ZSBhIGNhY2hlIG9mIHRoZSBsYXN0IHJlY2lldmVkIHZhbHVlLiAgVGhpcyBhbGxvd3MgdXMgdG8gcGljayBwaWNrXHJcbiAgICAgICAgLy8gICAgdXAgZnJvbSB3aGVyZSB3ZSBsZWZ0IG9mZi5cclxuICAgICAgICBjb25zdCBjb2RlQ2hlY2tBZ2dyZWdhdGUgPSB0aGlzLmFnZ3JlZ2F0ZUxpc3RlbmVyLmxpc3RlblRvKHogPT4gei5tb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzKVxyXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDIwMClcclxuICAgICAgICAgICAgLm1hcChkYXRhID0+IF8oZGF0YSkuZmxhdE1hcCh4ID0+IHgudmFsdWUpLnZhbHVlKCkpO1xyXG5cclxuICAgICAgICBjb25zdCBjb2RlQ2hlY2tDb3VudEFnZ3JlZ2F0ZSA9IHRoaXMuYWdncmVnYXRlTGlzdGVuZXIubGlzdGVuVG8oeiA9PiB6Lm1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3NDb3VudHMpXHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwKVxyXG4gICAgICAgICAgICAubWFwKGl0ZW1zID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdDogdHlwZW9mIFZpZXdNb2RlbC5wcm90b3R5cGUuZGlhZ25vc3RpY0NvdW50cyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCAoeSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIF8uZWFjaCh5LnZhbHVlLCAoeCwgaykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdFtrXSkgcmVzdWx0W2tdID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2tdICs9IHg7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBjb2RlQ2hlY2tCeUZpbGVBZ2dyZWdhdGUgPSB0aGlzLmFnZ3JlZ2F0ZUxpc3RlbmVyLmxpc3RlblRvKHogPT4gei5tb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzQnlGaWxlLm1hcCh4ID0+IHoubW9kZWwuZGlhZ25vc3RpY3NCeUZpbGUpKVxyXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDIwMClcclxuICAgICAgICAgICAgLm1hcCh4ID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXA8c3RyaW5nLCBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KCk7XHJcbiAgICAgICAgICAgICAgICBfLmVhY2goeCwgeiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgW2ZpbGUsIGRpYWdub3N0aWNzXSBvZiB6LnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcC5zZXQoZmlsZSwgZGlhZ25vc3RpY3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBzaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnMgPSBuZXcgUmVwbGF5U3ViamVjdDxib29sZWFuPigxKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5zaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnNcIiwgZnVuY3Rpb24oZW5hYmxlZCkge1xyXG4gICAgICAgICAgICBzaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnMubmV4dChlbmFibGVkKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zKTtcclxuXHJcbiAgICAgICAgY29uc3QgYmFzZURpYWdub3N0aWNzID0gT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KCAvLyBDb21iaW5lIGJvdGggdGhlIGFjdGl2ZSBtb2RlbCBhbmQgdGhlIGNvbmZpZ3VyYXRpb24gY2hhbmdlcyB0b2dldGhlclxyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZU1vZGVsLnN0YXJ0V2l0aChudWxsKSwgPE9ic2VydmFibGU8Ym9vbGVhbj4+PGFueT5zaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnMsIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucy5za2lwKDEpLnN0YXJ0V2l0aChhdG9tLmNvbmZpZy5nZXQ8Ym9vbGVhbj4oXCJvbW5pc2hhcnAtYXRvbS5zaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnNcIikpLFxyXG4gICAgICAgICAgICAobW9kZWwsIGVuYWJsZWQsIHdhc0VuYWJsZWQpID0+ICh7IG1vZGVsLCBlbmFibGVkLCB3YXNFbmFibGVkIH0pKVxyXG4gICAgICAgICAgICAvLyBJZiB0aGUgc2V0dGluZyBpcyBlbmFibGVkIChhbmQgaGFzblwidCBjaGFuZ2VkKSB0aGVuIHdlIGRvblwidCBuZWVkIHRvIHJlZG8gdGhlIHN1YnNjcmlwdGlvblxyXG4gICAgICAgICAgICAuZmlsdGVyKGN0eCA9PiAoIShjdHguZW5hYmxlZCAmJiBjdHgud2FzRW5hYmxlZCA9PT0gY3R4LmVuYWJsZWQpKSlcclxuICAgICAgICAgICAgLnNoYXJlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIGJhc2VEaWFnbm9zdGljc1xyXG4gICAgICAgICAgICAgICAgLnN3aXRjaE1hcChjdHggPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHtlbmFibGVkLCBtb2RlbH0gPSBjdHg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2RlQ2hlY2tBZ2dyZWdhdGU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljcztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKFtdKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKFtdKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSh0aGlzLl9kaWFnbm9zdGljc1N1YmplY3QpLFxyXG4gICAgICAgICAgICBiYXNlRGlhZ25vc3RpY3NcclxuICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoY3R4ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7ZW5hYmxlZCwgbW9kZWx9ID0gY3R4O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29kZUNoZWNrQ291bnRBZ2dyZWdhdGU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljc0NvdW50cztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiA8YW55Pk9ic2VydmFibGUuZW1wdHk8eyBbaW5kZXg6IHN0cmluZ106IG51bWJlcjsgfT4oKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKHt9KVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSh0aGlzLl9kaWFnbm9zdGljQ291bnRzU3ViamVjdCksXHJcbiAgICAgICAgICAgIGJhc2VEaWFnbm9zdGljc1xyXG4gICAgICAgICAgICAgICAgLnN3aXRjaE1hcChjdHggPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHtlbmFibGVkLCBtb2RlbH0gPSBjdHg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2RlQ2hlY2tCeUZpbGVBZ2dyZWdhdGU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljc0J5RmlsZS5tYXAoeCA9PiBtb2RlbC5kaWFnbm9zdGljc0J5RmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihuZXcgTWFwPHN0cmluZywgTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPigpKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKG5ldyBNYXA8c3RyaW5nLCBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KCkpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHRoaXMuX2RpYWdub3N0aWNzQnlGaWxlU3ViamVjdClcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIGlmIChTb2x1dGlvbk1hbmFnZXIuX3VuaXRUZXN0TW9kZV8pIHJldHVybjtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgIFNvbHV0aW9uTWFuYWdlci5kZWFjdGl2YXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbm5lY3QoKSB7IFNvbHV0aW9uTWFuYWdlci5jb25uZWN0KCk7IH1cclxuXHJcbiAgICBwdWJsaWMgZGlzY29ubmVjdCgpIHsgU29sdXRpb25NYW5hZ2VyLmRpc2Nvbm5lY3QoKTsgfVxyXG5cclxuICAgIHB1YmxpYyB0b2dnbGUoKSB7XHJcbiAgICAgICAgaWYgKFNvbHV0aW9uTWFuYWdlci5jb25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgU29sdXRpb25NYW5hZ2VyLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuY29ubmVjdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbmF2aWdhdGVUbyhyZXNwb25zZTogeyBGaWxlTmFtZTogc3RyaW5nOyBMaW5lOiBudW1iZXI7IENvbHVtbjogbnVtYmVyOyB9KSB7XHJcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbVByb21pc2UoPFByb21pc2U8QXRvbS5UZXh0RWRpdG9yPj48YW55PmF0b20ud29ya3NwYWNlLm9wZW4ocmVzcG9uc2UuRmlsZU5hbWUsIDxhbnk+eyBpbml0aWFsTGluZTogcmVzcG9uc2UuTGluZSwgaW5pdGlhbENvbHVtbjogcmVzcG9uc2UuQ29sdW1uIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RnJhbWV3b3Jrcyhwcm9qZWN0czogc3RyaW5nW10pOiBzdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IGZyYW1ld29ya3MgPSBfLm1hcChwcm9qZWN0cywgKHByb2plY3Q6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gcHJvamVjdC5pbmRleE9mKFwiK1wiKSA9PT0gLTEgPyBcIlwiIDogcHJvamVjdC5zcGxpdChcIitcIilbMV07XHJcbiAgICAgICAgfSkuZmlsdGVyKChmdzogc3RyaW5nKSA9PiBmdy5sZW5ndGggPiAwKTtcclxuICAgICAgICByZXR1cm4gZnJhbWV3b3Jrcy5qb2luKFwiLFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkVGV4dEVkaXRvckNvbW1hbmQoY29tbWFuZE5hbWU6IHN0cmluZywgY2FsbGJhY2s6ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS10ZXh0LWVkaXRvclwiLCBjb21tYW5kTmFtZSwgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICAgICAgICAgICAgaWYgKCFlZGl0b3IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLnNvbWUodGhpcy5fc3VwcG9ydGVkRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSkpIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhldmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9pc09tbmlTaGFycEVkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIHJldHVybiBfLnNvbWUodGhpcy5fc3VwcG9ydGVkRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVUZXh0RWRpdG9yT2JzZXJ2YWJsZShkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgY29uc3Qgc2FmZUd1YXJkID0gdGhpcy5fY3JlYXRlU2FmZUd1YXJkKHRoaXMuX3N1cHBvcnRlZEV4dGVuc2lvbnMsIGRpc3Bvc2FibGUpO1xyXG5cclxuICAgICAgICBjb25zdCBvYnNlcnZlVGV4dEVkaXRvcnMgPSBjcmVhdGVPYnNlcnZhYmxlPEF0b20uVGV4dEVkaXRvcj4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBkaXMgPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBvYnNlcnZlci5uZXh0KGVkaXRvcik7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuICgpID0+IGRpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgfSkuc2hhcmUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgT2JzZXJ2YWJsZS5tZXJnZShvYnNlcnZlVGV4dEVkaXRvcnMuZmlsdGVyKHggPT4gISF4LmdldFBhdGgoKSksIHNhZmVHdWFyZClcclxuICAgICAgICAgICAgICAgIC5tZXJnZU1hcChlZGl0b3IgPT4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvciksIChlZGl0b3IsIHNvbHV0aW9uKSA9PiA8T21uaXNoYXJwVGV4dEVkaXRvcj5lZGl0b3IpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCksXHJcbiAgICAgICAgICAgIE9tbmlzaGFycEVkaXRvckNvbnRleHQuY3JlYXRlZFxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShlZGl0b3IgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3VuZGVybHlpbmdFZGl0b3JzLmFkZChlZGl0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuY29uZmlnID0gXy5lbmRzV2l0aChlZGl0b3IuZ2V0UGF0aCgpLCBcInByb2plY3QuanNvblwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzID0gRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl91bmRlcmx5aW5nRWRpdG9ycy5kZWxldGUoZWRpdG9yKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IGRpcy5kaXNwb3NlKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChkaXMpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zdCBsaXZlRWRpdG9ycyA9IE9tbmlzaGFycEVkaXRvckNvbnRleHQuY3JlYXRlZDtcclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5tZXJnZShcclxuICAgICAgICAgICAgT2JzZXJ2YWJsZS5kZWZlcigoKSA9PiBPYnNlcnZhYmxlLmZyb208T21uaXNoYXJwVGV4dEVkaXRvcj4oPGFueT50aGlzLl91bmRlcmx5aW5nRWRpdG9ycykpLFxyXG4gICAgICAgICAgICBsaXZlRWRpdG9yc1xyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfY3JlYXRlU2FmZUd1YXJkKGV4dGVuc2lvbnM6IHN0cmluZ1tdLCBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgY29uc3QgZWRpdG9yU3ViamVjdCA9IG5ldyBTdWJqZWN0PE9tbmlzaGFycFRleHRFZGl0b3I+KCk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbSgocGFuZTogYW55KSA9PiBlZGl0b3JTdWJqZWN0Lm5leHQocGFuZSkpKTtcclxuICAgICAgICBjb25zdCBlZGl0b3JPYnNlcnZhYmxlID0gZWRpdG9yU3ViamVjdC5maWx0ZXIoeiA9PiB6ICYmICEhei5nZXRHcmFtbWFyKS5zdGFydFdpdGgobnVsbCk7XHJcblxyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLnppcChlZGl0b3JPYnNlcnZhYmxlLCBlZGl0b3JPYnNlcnZhYmxlLnNraXAoMSksIChlZGl0b3IsIG5leHRFZGl0b3IpID0+ICh7IGVkaXRvciwgbmV4dEVkaXRvciB9KSlcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSg1MClcclxuICAgICAgICAgICAgLnN3aXRjaE1hcCgoe25leHRFZGl0b3J9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gbmV4dEVkaXRvci5nZXRQYXRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXBhdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBlZGl0b3IgaXNuXCJ0IHNhdmVkIHlldC5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dEVkaXRvciAmJiB0aGlzLl9pc09tbmlTaGFycEVkaXRvcihuZXh0RWRpdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhcIk9tbmlTaGFycFwiLCB7IGRldGFpbDogXCJGdW5jdGlvbmFsaXR5IHdpbGwgbGltaXRlZCB1bnRpbCB0aGUgZmlsZSBoYXMgYmVlbiBzYXZlZC5cIiB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxBdG9tLlRleHRFZGl0b3I+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcG9zZXIgPSBuZXh0RWRpdG9yLm9uRGlkQ2hhbmdlUGF0aCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5leHRFZGl0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcG9zZXIuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgcHJvcGVydHkgY2FuIGJlIHVzZWQgdG8gbGlzdGVuIHRvIGFueSBldmVudCB0aGF0IG1pZ2h0IGNvbWUgYWNyb3NzIG9uIGFueSBzb2x1dGlvbnMuXHJcbiAgICAgKiBUaGlzIGlzIGEgbW9zdGx5IGZ1bmN0aW9uYWwgcmVwbGFjZW1lbnQgZm9yIGByZWdpc3RlckNvbmZpZ3VyYXRpb25gLCB0aG91Z2ggdGhlcmUgaGFzIGJlZW5cclxuICAgICAqICAgICBvbmUgcGxhY2Ugd2hlcmUgYHJlZ2lzdGVyQ29uZmlndXJhdGlvbmAgY291bGQgbm90IGJlIHJlcGxhY2VkLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0IGxpc3RlbmVyKCkge1xyXG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuc29sdXRpb25PYnNlcnZlcjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgcHJvcGVydHkgY2FuIGJlIHVzZWQgdG8gb2JzZXJ2ZSB0byB0aGUgYWdncmVnYXRlIG9yIGNvbWJpbmVkIHJlc3BvbnNlcyB0byBhbnkgZXZlbnQuXHJcbiAgICAgKiBBIGdvb2QgZXhhbXBsZSBvZiB0aGlzIGlzLCBmb3IgY29kZSBjaGVjayBlcnJvcnMsIHRvIGFnZ3JlZ2F0ZSBhbGwgZXJyb3JzIGFjcm9zcyBhbGwgb3BlbiBzb2x1dGlvbnMuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXQgYWdncmVnYXRlTGlzdGVuZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5zb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBwcm9wZXJ0eSBnZXRzIGEgbGlzdCBvZiBzb2x1dGlvbnMgYXMgYW4gb2JzZXJ2YWJsZS5cclxuICAgICAqIE5PVEU6IFRoaXMgcHJvcGVydHkgd2lsbCBub3QgZW1pdCBhZGRpdGlvbnMgb3IgcmVtb3ZhbHMgb2Ygc29sdXRpb25zLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0IHNvbHV0aW9ucygpIHtcclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5kZWZlcigoKSA9PiBPYnNlcnZhYmxlLmZyb208U29sdXRpb24+KFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMpKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgbWV0aG9kIGFsbG93cyB1cyB0byBmb3JnZXQgYWJvdXQgdGhlIGVudGlyZSBzb2x1dGlvbiBtb2RlbC5cclxuICAgICAqIENhbGwgdGhpcyBtZXRob2Qgd2l0aCBhIHNwZWNpZmljIGVkaXRvciwgb3IganVzdCB3aXRoIGEgY2FsbGJhY2sgdG8gY2FwdHVyZSB0aGUgY3VycmVudCBlZGl0b3JcclxuICAgICAqXHJcbiAgICAgKiBUaGUgY2FsbGJhY2sgd2lsbCB0aGVuIGlzc3VlIHRoZSByZXF1ZXN0XHJcbiAgICAgKiBOT1RFOiBUaGlzIEFQSSBvbmx5IGV4cG9zZXMgdGhlIG9wZXJhdGlvbiBBcGkgYW5kIGRvZXNuXCJ0IGV4cG9zZSB0aGUgZXZlbnQgYXBpLCBhcyB3ZSBhcmUgcmVxdWVzdGluZyBzb21ldGhpbmcgdG8gaGFwcGVuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZXF1ZXN0PFQ+KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gT2JzZXJ2YWJsZTxUPik6IE9ic2VydmFibGU8VD47XHJcbiAgICBwdWJsaWMgcmVxdWVzdDxUPihjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gT2JzZXJ2YWJsZTxUPik6IE9ic2VydmFibGU8VD47XHJcbiAgICBwdWJsaWMgcmVxdWVzdDxUPihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciB8ICgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBPYnNlcnZhYmxlPFQ+IHwgUHJvbWlzZTxUPiksIGNhbGxiYWNrPzogKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gT2JzZXJ2YWJsZTxUPik6IE9ic2VydmFibGU8VD4ge1xyXG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24oZWRpdG9yKSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayA9IDxhbnk+ZWRpdG9yO1xyXG4gICAgICAgICAgICBlZGl0b3IgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFlZGl0b3IpIHtcclxuICAgICAgICAgICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc29sdXRpb25DYWxsYmFjayA9IChzb2x1dGlvbjogU29sdXRpb24pID0+IGNhbGxiYWNrKHNvbHV0aW9uLndpdGhFZGl0b3IoPGFueT5lZGl0b3IpKTtcclxuXHJcbiAgICAgICAgbGV0IHJlc3VsdDogT2JzZXJ2YWJsZTxUPjtcclxuICAgICAgICBpZiAoZWRpdG9yICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHNvbHV0aW9uQ2FsbGJhY2soZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbilcclxuICAgICAgICAgICAgICAgIC5zaGFyZSgpO1xyXG4gICAgICAgICAgICByZXN1bHQuc3Vic2NyaWJlKCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc29sdXRpb25SZXN1bHQ6IE9ic2VydmFibGU8U29sdXRpb24+O1xyXG4gICAgICAgIGlmIChlZGl0b3IpIHtcclxuICAgICAgICAgICAgc29sdXRpb25SZXN1bHQgPSBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoPEF0b20uVGV4dEVkaXRvcj5lZGl0b3IpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uUmVzdWx0ID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uLnRha2UoMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXN1bHQgPSBzb2x1dGlvblJlc3VsdFxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxyXG4gICAgICAgICAgICAuZmxhdE1hcChzb2x1dGlvbkNhbGxiYWNrKVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuXHJcbiAgICAgICAgLy8gRW5zdXJlIHRoYXQgdGhlIHVuZGVyeWluZyBwcm9taXNlIGlzIGNvbm5lY3RlZFxyXG4gICAgICAgIC8vICAgKGlmIHdlIGRvblwidCBzdWJzY3JpYmUgdG8gdGhlIHJldXNsdCBvZiB0aGUgcmVxdWVzdCwgd2hpY2ggaXMgbm90IGEgcmVxdWlyZW1lbnQpLlxyXG4gICAgICAgIHJlc3VsdC5zdWJzY3JpYmUoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0UHJvamVjdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIGlmIChpc09tbmlzaGFycFRleHRFZGl0b3IoZWRpdG9yKSAmJiBlZGl0b3Iub21uaXNoYXJwLnByb2plY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoZWRpdG9yLm9tbmlzaGFycC5wcm9qZWN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKVxyXG4gICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHoubW9kZWwuZ2V0UHJvamVjdEZvckVkaXRvcihlZGl0b3IpKVxyXG4gICAgICAgICAgICAudGFrZSgxKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0U29sdXRpb25Gb3JQcm9qZWN0KHByb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55Pikge1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKFxyXG4gICAgICAgICAgICBfKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHNvbHV0aW9uID0+IF8uc29tZShzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cywgcCA9PiBwLm5hbWUgPT09IHByb2plY3QubmFtZSkpXHJcbiAgICAgICAgICAgICAgICAuZmlyc3QoKVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWxsb3dzIGZvciB2aWV3cyB0byBvYnNlcnZlIHRoZSBhY3RpdmUgbW9kZWwgYXMgaXQgY2hhbmdlcyBiZXR3ZWVuIGVkaXRvcnNcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCBhY3RpdmVNb2RlbCgpIHtcclxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uLm1hcCh6ID0+IHoubW9kZWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzd2l0Y2hBY3RpdmVNb2RlbChjYWxsYmFjazogKG1vZGVsOiBWaWV3TW9kZWwsIGNkOiBDb21wb3NpdGVEaXNwb3NhYmxlKSA9PiB2b2lkKTogSURpc3Bvc2FibGUge1xyXG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlTW9kZWwuZmlsdGVyKHogPT4gISF6KS5zdWJzY3JpYmUobW9kZWwgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcclxuICAgICAgICAgICAgbW9kZWwuZGlzcG9zYWJsZS5hZGQoY2QpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlTW9kZWwuZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IG1vZGVsKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwuZGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjYWxsYmFjayhtb2RlbCwgY2QpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBhY3RpdmVTb2x1dGlvbigpIHtcclxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzd2l0Y2hBY3RpdmVTb2x1dGlvbihjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbiwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpID0+IHZvaWQpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5hY3RpdmVTb2x1dGlvbi5maWx0ZXIoeiA9PiAhIXopLnN1YnNjcmliZShzb2x1dGlvbiA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xyXG4gICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChjZCk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQodGhpcy5hY3RpdmVTb2x1dGlvbi5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gc29sdXRpb24pXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLnJlbW92ZShjZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHNvbHV0aW9uLCBjZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZUVkaXRvcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlRWRpdG9yO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzd2l0Y2hBY3RpdmVFZGl0b3IoY2FsbGJhY2s6IChlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IsIGNkOiBDb21wb3NpdGVEaXNwb3NhYmxlKSA9PiB2b2lkKTogSURpc3Bvc2FibGUge1xyXG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlRWRpdG9yLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xyXG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZCh0aGlzLmFjdGl2ZUVkaXRvci5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gZWRpdG9yKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5kaXNwb3NhYmxlLnJlbW92ZShjZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdoZW5FZGl0b3JDb25uZWN0ZWQoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICBpZiAoaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb25cclxuICAgICAgICAgICAgICAgIC53aGVuQ29ubmVjdGVkKClcclxuICAgICAgICAgICAgICAgIC5tYXAoeiA9PiBlZGl0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKHNvbHV0aW9uID0+IHNvbHV0aW9uLndoZW5Db25uZWN0ZWQoKSwgKCkgPT4gPE9tbmlzaGFycFRleHRFZGl0b3I+ZWRpdG9yKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZUNvbmZpZ0VkaXRvcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlQ29uZmlnRWRpdG9yO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzd2l0Y2hBY3RpdmVDb25maWdFZGl0b3IoY2FsbGJhY2s6IChlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IsIGNkOiBDb21wb3NpdGVEaXNwb3NhYmxlKSA9PiB2b2lkKTogSURpc3Bvc2FibGUge1xyXG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlQ29uZmlnRWRpdG9yLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xyXG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZCh0aGlzLmFjdGl2ZUNvbmZpZ0VkaXRvci5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gZWRpdG9yKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5kaXNwb3NhYmxlLnJlbW92ZShjZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBhY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3I7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN3aXRjaEFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yKGNhbGxiYWNrOiAoZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yLCBjZDogQ29tcG9zaXRlRGlzcG9zYWJsZSkgPT4gdm9pZCk6IElEaXNwb3NhYmxlIHtcclxuICAgICAgICBjb25zdCBvdXRlckNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBvdXRlckNkLmFkZCh0aGlzLmFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3IuZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IGVkaXRvcilcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjYWxsYmFjayhlZGl0b3IsIGNkKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHJldHVybiBvdXRlckNkO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlUHJvamVjdCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlUHJvamVjdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZUZyYW1ld29yaygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlRnJhbWV3b3JrO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgZWRpdG9ycygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZWRpdG9ycztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGNvbmZpZ0VkaXRvcnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZ0VkaXRvcnM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVhY2hFZGl0b3IoY2FsbGJhY2s6IChlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IsIGNkOiBDb21wb3NpdGVEaXNwb3NhYmxlKSA9PiB2b2lkKTogSURpc3Bvc2FibGUge1xyXG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuX2VkaXRvcnMuc3Vic2NyaWJlKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xyXG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfSkpKTtcclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGVhY2hDb25maWdFZGl0b3IoY2FsbGJhY2s6IChlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IsIGNkOiBDb21wb3NpdGVEaXNwb3NhYmxlKSA9PiB2b2lkKTogSURpc3Bvc2FibGUge1xyXG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuX2NvbmZpZ0VkaXRvcnMuc3Vic2NyaWJlKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xyXG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfSkpKTtcclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gdm9pZCkge1xyXG4gICAgICAgIFNvbHV0aW9uTWFuYWdlci5yZWdpc3RlckNvbmZpZ3VyYXRpb24oY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IF9raWNrX2luX3RoZV9wYW50c18oKSB7XHJcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5fa2lja19pbl90aGVfcGFudHNfO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3N1cHBvcnRlZEV4dGVuc2lvbnMgPSBbXCJwcm9qZWN0Lmpzb25cIiwgXCIuY3NcIiwgXCIuY3N4XCIsIC8qXCIuY2FrZVwiKi9dO1xyXG5cclxuICAgIHB1YmxpYyBnZXQgZ3JhbW1hcnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGF0b20uZ3JhbW1hcnMuZ2V0R3JhbW1hcnMoKSxcclxuICAgICAgICAgICAgZ3JhbW1hciA9PiBfLnNvbWUodGhpcy5fc3VwcG9ydGVkRXh0ZW5zaW9ucyxcclxuICAgICAgICAgICAgICAgIGV4dCA9PiBfLnNvbWUoKDxhbnk+Z3JhbW1hcikuZmlsZVR5cGVzLFxyXG4gICAgICAgICAgICAgICAgICAgIGZ0ID0+IF8udHJpbVN0YXJ0KGV4dCwgXCIuXCIpID09PSBmdCkpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcjogRmlyc3RNYXRlLkdyYW1tYXIpIHtcclxuICAgICAgICByZXR1cm4gXy5zb21lKHRoaXMuZ3JhbW1hcnMsIHsgc2NvcGVOYW1lOiAoZ3JhbW1hciBhcyBhbnkpLnNjb3BlTmFtZSB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9wYWNrYWdlRGlyOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgZ2V0IHBhY2thZ2VEaXIoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9wYWNrYWdlRGlyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgZ2V0UGFja2FnZURpclBhdGhzOiAke2F0b20ucGFja2FnZXMuZ2V0UGFja2FnZURpclBhdGhzKCl9YCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3BhY2thZ2VEaXIgPSBfLmZpbmQoYXRvbS5wYWNrYWdlcy5nZXRQYWNrYWdlRGlyUGF0aHMoKSwgZnVuY3Rpb24ocGFja2FnZVBhdGgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgcGFja2FnZVBhdGggJHtwYWNrYWdlUGF0aH0gZXhpc3RzOiAke2ZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhY2thZ2VQYXRoLCBcIm9tbmlzaGFycC1hdG9tXCIpKX1gKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmcy5leGlzdHNTeW5jKHBhdGguam9pbihwYWNrYWdlUGF0aCwgXCJvbW5pc2hhcnAtYXRvbVwiKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRmFsbGJhY2ssIHRoaXMgaXMgZm9yIHVuaXQgdGVzdGluZyBvbiB0cmF2aXMgbWFpbmx5XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5fcGFja2FnZURpcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFja2FnZURpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vLi4vLi5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhY2thZ2VEaXI7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYXRvbVZlcnNpb246IFNlbVZlcjtcclxuICAgIHB1YmxpYyBnZXQgYXRvbVZlcnNpb24oKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9hdG9tVmVyc2lvbikge1xyXG4gICAgICAgICAgICB0aGlzLl9hdG9tVmVyc2lvbiA9IG5ldyBTZW1WZXIoPGFueT5hdG9tLmdldFZlcnNpb24oKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9hdG9tVmVyc2lvbjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXRvbVZlcnNpb25HcmVhdGVyVGhhbih2ZXJzaW9uOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gc2VtdmVyR3QoPGFueT5hdG9tLmdldFZlcnNpb24oKSwgdmVyc2lvbik7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuZXhwb3J0IGNvbnN0IE9tbmkgPSBuZXcgT21uaU1hbmFnZXI7XHJcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
