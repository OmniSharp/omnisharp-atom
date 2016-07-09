"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Omni = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

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

            this.disposable = new _omnisharpClient.CompositeDisposable();
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
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
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
                var dis = _omnisharpClient.Disposable.create(function () {
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

            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this.activeModel.filter(function (z) {
                return !!z;
            }).subscribe(function (model) {
                var cd = new _omnisharpClient.CompositeDisposable();
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

            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this.activeSolution.filter(function (z) {
                return !!z;
            }).subscribe(function (solution) {
                var cd = new _omnisharpClient.CompositeDisposable();
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

            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this.activeEditor.filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                var cd = new _omnisharpClient.CompositeDisposable();
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

            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this.activeConfigEditor.filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                var cd = new _omnisharpClient.CompositeDisposable();
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

            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this.activeEditorOrConfigEditor.filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                var cd = new _omnisharpClient.CompositeDisposable();
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
            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this._editors.subscribe(function (editor) {
                var cd = new _omnisharpClient.CompositeDisposable();
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
            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this._configEditors.subscribe(function (editor) {
                var cd = new _omnisharpClient.CompositeDisposable();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvb21uaS5qcyIsImxpYi9zZXJ2ZXIvb21uaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBRUE7O0lDR1ksRTs7QURGWjs7SUNHWSxJOztBREZaOztBQUNBOztBQUNBOzs7Ozs7OztBQ09BLElBQU0sbUJBQW1CLEdBQXpCO0FBQ0EsSUFBTSxxQkFBcUIsQ0FBQyxPQUFELEVBQVUsY0FBVixFQUEwQixNQUExQixFQUFrQyxTQUFsQyxFQUE2QyxTQUE3QyxDQUEzQjtBQUVBLFNBQUEsb0JBQUEsQ0FBOEIsVUFBOUIsRUFBeUU7QUFDckUsV0FBTyxXQUNGLFdBREUsQ0FDVSxnQkFBVSxLQURwQixFQUVGLFNBRkUsQ0FFUSxnQkFBVSxLQUZsQixFQUdGLE1BSEUsQ0FHSztBQUFBLGVBQVUsQ0FBQyxNQUFELElBQVcsVUFBVSxDQUFDLE9BQU8sV0FBUCxFQUFoQztBQUFBLEtBSEwsQ0FBUDtBQUlIOztJQUVELFc7QUFBQSwyQkFBQTtBQUFBOztBQUtZLGFBQUEsa0JBQUEsR0FBcUIsSUFBSSxHQUFKLEVBQXJCO0FBSUEsYUFBQSxrQ0FBQSxHQUFxQywwQkFBeUMsSUFBekMsQ0FBckM7QUFDQSxhQUFBLDJCQUFBLEdBQThCLHFCQUEyRCxLQUFLLGtDQUFoRSxFQUNqQyxZQURpQyxDQUNwQixnQkFEb0IsRUFFakMsYUFGaUMsQ0FFbkIsQ0FGbUIsRUFHakMsUUFIaUMsRUFBOUI7QUFLQSxhQUFBLGFBQUEsR0FBZ0IscUJBQTJELEtBQUssa0NBQWhFLEVBQ25CLFlBRG1CLENBQ04sZ0JBRE0sRUFFbkIsR0FGbUIsQ0FFZjtBQUFBLG1CQUFLLEtBQUssRUFBRSxTQUFQLElBQW9CLENBQUMsRUFBRSxTQUFGLENBQVksTUFBakMsR0FBMEMsQ0FBMUMsR0FBOEMsSUFBbkQ7QUFBQSxTQUZlLEVBR25CLGFBSG1CLENBR0wsQ0FISyxFQUluQixRQUptQixFQUFoQjtBQU1BLGFBQUEs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YnNlcnZhYmxlLCBSZXBsYXlTdWJqZWN0LCBTdWJqZWN0LCBCZWhhdmlvclN1YmplY3QsIFNjaGVkdWxlciB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBjcmVhdGVPYnNlcnZhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IFNvbHV0aW9uTWFuYWdlciB9IGZyb20gXCIuL3NvbHV0aW9uLW1hbmFnZXJcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IERyaXZlclN0YXRlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgaXNPbW5pc2hhcnBUZXh0RWRpdG9yLCBPbW5pc2hhcnBFZGl0b3JDb250ZXh0IH0gZnJvbSBcIi4vb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XG5pbXBvcnQgeyBtZXRhZGF0YU9wZW5lciB9IGZyb20gXCIuL21ldGFkYXRhLWVkaXRvclwiO1xuaW1wb3J0IHsgU2VtVmVyLCBndCBhcyBzZW12ZXJHdCB9IGZyb20gXCJzZW12ZXJcIjtcbmNvbnN0IERFQk9VTkNFX1RJTUVPVVQgPSAxMDA7XG5jb25zdCBzdGF0ZWZ1bFByb3BlcnRpZXMgPSBbXCJpc09mZlwiLCBcImlzQ29ubmVjdGluZ1wiLCBcImlzT25cIiwgXCJpc1JlYWR5XCIsIFwiaXNFcnJvclwiXTtcbmZ1bmN0aW9uIHdyYXBFZGl0b3JPYnNlcnZhYmxlKG9ic2VydmFibGUpIHtcbiAgICByZXR1cm4gb2JzZXJ2YWJsZVxuICAgICAgICAuc3Vic2NyaWJlT24oU2NoZWR1bGVyLmFzeW5jKVxuICAgICAgICAub2JzZXJ2ZU9uKFNjaGVkdWxlci5hc3luYylcbiAgICAgICAgLmZpbHRlcihlZGl0b3IgPT4gIWVkaXRvciB8fCBlZGl0b3IgJiYgIWVkaXRvci5pc0Rlc3Ryb3llZCgpKTtcbn1cbmNsYXNzIE9tbmlNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fdW5kZXJseWluZ0VkaXRvcnMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yU3ViamVjdCA9IG5ldyBCZWhhdmlvclN1YmplY3QobnVsbCk7XG4gICAgICAgIHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yID0gd3JhcEVkaXRvck9ic2VydmFibGUodGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KVxuICAgICAgICAgICAgLmRlYm91bmNlVGltZShERUJPVU5DRV9USU1FT1VUKVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcbiAgICAgICAgICAgIC5yZWZDb3VudCgpO1xuICAgICAgICB0aGlzLl9hY3RpdmVFZGl0b3IgPSB3cmFwRWRpdG9yT2JzZXJ2YWJsZSh0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QpXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKERFQk9VTkNFX1RJTUVPVVQpXG4gICAgICAgICAgICAubWFwKHggPT4geCAmJiB4Lm9tbmlzaGFycCAmJiAheC5vbW5pc2hhcnAuY29uZmlnID8geCA6IG51bGwpXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKVxuICAgICAgICAgICAgLnJlZkNvdW50KCk7XG4gICAgICAgIHRoaXMuX2FjdGl2ZUNvbmZpZ0VkaXRvciA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yU3ViamVjdClcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoREVCT1VOQ0VfVElNRU9VVClcbiAgICAgICAgICAgIC5tYXAoeCA9PiB4ICYmIHgub21uaXNoYXJwICYmIHgub21uaXNoYXJwLmNvbmZpZyA/IHggOiBudWxsKVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcbiAgICAgICAgICAgIC5yZWZDb3VudCgpO1xuICAgICAgICB0aGlzLl9hY3RpdmVQcm9qZWN0ID0gdGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JcbiAgICAgICAgICAgIC5maWx0ZXIoZWRpdG9yID0+IGVkaXRvciAmJiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgICAgICAuc3dpdGNoTWFwKGVkaXRvciA9PiBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLm1vZGVsLmdldFByb2plY3RGb3JFZGl0b3IoZWRpdG9yKSlcbiAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKVxuICAgICAgICAgICAgLnJlZkNvdW50KCk7XG4gICAgICAgIHRoaXMuX2FjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yXG4gICAgICAgICAgICAuZmlsdGVyKGVkaXRvciA9PiBlZGl0b3IgJiYgIWVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgLnN3aXRjaE1hcChlZGl0b3IgPT4gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5tb2RlbC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikpXG4gICAgICAgICAgICAuc3dpdGNoTWFwKHByb2plY3QgPT4gcHJvamVjdC5vYnNlcnZlLmFjdGl2ZUZyYW1ld29yaywgKHByb2plY3QsIGZyYW1ld29yaykgPT4gKHsgcHJvamVjdCwgZnJhbWV3b3JrIH0pKVxuICAgICAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKClcbiAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXG4gICAgICAgICAgICAucmVmQ291bnQoKTtcbiAgICAgICAgdGhpcy5fZGlhZ25vc3RpY3NTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5fZGlhZ25vc3RpY3MgPSB0aGlzLl9kaWFnbm9zdGljc1N1YmplY3QuY2FjaGUoMSk7XG4gICAgICAgIHRoaXMuX2RpYWdub3N0aWNDb3VudHNTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5fZGlhZ25vc3RpY0NvdW50cyA9IHRoaXMuX2RpYWdub3N0aWNDb3VudHNTdWJqZWN0LmNhY2hlKDEpO1xuICAgICAgICB0aGlzLl9kaWFnbm9zdGljc0J5RmlsZVN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICB0aGlzLl9kaWFnbm9zdGljc0J5RmlsZSA9IHRoaXMuX2RpYWdub3N0aWNzQnlGaWxlU3ViamVjdC5jYWNoZSgxKTtcbiAgICAgICAgdGhpcy5faXNPZmYgPSB0cnVlO1xuICAgICAgICB0aGlzLl9zdXBwb3J0ZWRFeHRlbnNpb25zID0gW1wicHJvamVjdC5qc29uXCIsIFwiLmNzXCIsIFwiLmNzeFwiLF07XG4gICAgfVxuICAgIGdldCB2aWV3TW9kZWxTdGF0ZWZ1bFByb3BlcnRpZXMoKSB7IHJldHVybiBzdGF0ZWZ1bFByb3BlcnRpZXM7IH1cbiAgICBnZXQgZGlhZ25vc3RpY3MoKSB7IHJldHVybiB0aGlzLl9kaWFnbm9zdGljczsgfVxuICAgIGdldCBkaWFnbm9zdGljc0NvdW50cygpIHsgcmV0dXJuIHRoaXMuX2RpYWdub3N0aWNDb3VudHM7IH1cbiAgICBnZXQgZGlhZ25vc3RpY3NCeUZpbGUoKSB7IHJldHVybiB0aGlzLl9kaWFnbm9zdGljc0J5RmlsZTsgfVxuICAgIGdldCBpc09mZigpIHsgcmV0dXJuIHRoaXMuX2lzT2ZmOyB9XG4gICAgZ2V0IGlzT24oKSB7IHJldHVybiAhdGhpcy5pc09mZjsgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChtZXRhZGF0YU9wZW5lcigpKTtcbiAgICAgICAgY29uc3QgZWRpdG9ycyA9IHRoaXMuY3JlYXRlVGV4dEVkaXRvck9ic2VydmFibGUodGhpcy5kaXNwb3NhYmxlKTtcbiAgICAgICAgdGhpcy5fZWRpdG9ycyA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKGVkaXRvcnMuZmlsdGVyKHggPT4gIXgub21uaXNoYXJwLmNvbmZpZykpO1xuICAgICAgICB0aGlzLl9jb25maWdFZGl0b3JzID0gd3JhcEVkaXRvck9ic2VydmFibGUoZWRpdG9ycy5maWx0ZXIoeCA9PiB4Lm9tbmlzaGFycC5jb25maWcpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb24uc3Vic2NyaWJlKHNvbHV0aW9uID0+IHtcbiAgICAgICAgICAgIF8oYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKSlcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4gdGhpcy5faXNPbW5pU2hhcnBFZGl0b3IoeCkpXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+ICF4Lm9tbmlzaGFycClcbiAgICAgICAgICAgICAgICAuZWFjaCh4ID0+IFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcih4KSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgU29sdXRpb25NYW5hZ2VyLmFjdGl2YXRlKHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChTb2x1dGlvbk1hbmFnZXIuc29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlci5zdGF0ZS5zdWJzY3JpYmUoeiA9PiB0aGlzLl9pc09mZiA9IF8uZXZlcnkoeiwgeCA9PiB4LnZhbHVlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQgfHwgeC52YWx1ZSA9PT0gRHJpdmVyU3RhdGUuRXJyb3IpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoY3JlYXRlT2JzZXJ2YWJsZShvYnNlcnZlciA9PiB7XG4gICAgICAgICAgICBjb25zdCBkaXMgPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlQWN0aXZlUGFuZUl0ZW0oKHBhbmUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocGFuZSAmJiBwYW5lLmdldEdyYW1tYXIgJiYgcGFuZS5nZXRQYXRoICYmIHRoaXMuaXNWYWxpZEdyYW1tYXIocGFuZS5nZXRHcmFtbWFyKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLm5leHQocGFuZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIubmV4dChudWxsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IGRpcy5kaXNwb3NlKCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuY29uY2F0TWFwKChwYW5lKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXBhbmUgfHwgaXNPbW5pc2hhcnBUZXh0RWRpdG9yKHBhbmUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YocGFuZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gd3JhcEVkaXRvck9ic2VydmFibGUoU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKHBhbmUpXG4gICAgICAgICAgICAgICAgLm1hcCh4ID0+IHBhbmUpKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUodGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0Lm5leHQobnVsbCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc3QgY29kZUNoZWNrQWdncmVnYXRlID0gdGhpcy5hZ2dyZWdhdGVMaXN0ZW5lci5saXN0ZW5Ubyh6ID0+IHoubW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljcylcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwKVxuICAgICAgICAgICAgLm1hcChkYXRhID0+IF8oZGF0YSkuZmxhdE1hcCh4ID0+IHgudmFsdWUpLnZhbHVlKCkpO1xuICAgICAgICBjb25zdCBjb2RlQ2hlY2tDb3VudEFnZ3JlZ2F0ZSA9IHRoaXMuYWdncmVnYXRlTGlzdGVuZXIubGlzdGVuVG8oeiA9PiB6Lm1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3NDb3VudHMpXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDIwMClcbiAgICAgICAgICAgIC5tYXAoaXRlbXMgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICBfLmVhY2goaXRlbXMsICh5KSA9PiB7XG4gICAgICAgICAgICAgICAgXy5lYWNoKHkudmFsdWUsICh4LCBrKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVzdWx0W2tdKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2tdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2tdICs9IHg7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBjb2RlQ2hlY2tCeUZpbGVBZ2dyZWdhdGUgPSB0aGlzLmFnZ3JlZ2F0ZUxpc3RlbmVyLmxpc3RlblRvKHogPT4gei5tb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzQnlGaWxlLm1hcCh4ID0+IHoubW9kZWwuZGlhZ25vc3RpY3NCeUZpbGUpKVxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgyMDApXG4gICAgICAgICAgICAubWFwKHggPT4ge1xuICAgICAgICAgICAgY29uc3QgbWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgXy5lYWNoKHgsIHogPT4ge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IFtmaWxlLCBkaWFnbm9zdGljc10gb2Ygei52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBtYXAuc2V0KGZpbGUsIGRpYWdub3N0aWNzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBtYXA7XG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zID0gbmV3IFJlcGxheVN1YmplY3QoMSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLnNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9uc1wiLCBmdW5jdGlvbiAoZW5hYmxlZCkge1xuICAgICAgICAgICAgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zLm5leHQoZW5hYmxlZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnMpO1xuICAgICAgICBjb25zdCBiYXNlRGlhZ25vc3RpY3MgPSBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QodGhpcy5hY3RpdmVNb2RlbC5zdGFydFdpdGgobnVsbCksIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucywgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zLnNraXAoMSkuc3RhcnRXaXRoKGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLnNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9uc1wiKSksIChtb2RlbCwgZW5hYmxlZCwgd2FzRW5hYmxlZCkgPT4gKHsgbW9kZWwsIGVuYWJsZWQsIHdhc0VuYWJsZWQgfSkpXG4gICAgICAgICAgICAuZmlsdGVyKGN0eCA9PiAoIShjdHguZW5hYmxlZCAmJiBjdHgud2FzRW5hYmxlZCA9PT0gY3R4LmVuYWJsZWQpKSlcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGJhc2VEaWFnbm9zdGljc1xuICAgICAgICAgICAgLnN3aXRjaE1hcChjdHggPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBlbmFibGVkLCBtb2RlbCB9ID0gY3R4O1xuICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29kZUNoZWNrQWdncmVnYXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobW9kZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKFtdKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydFdpdGgoW10pXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHRoaXMuX2RpYWdub3N0aWNzU3ViamVjdCksIGJhc2VEaWFnbm9zdGljc1xuICAgICAgICAgICAgLnN3aXRjaE1hcChjdHggPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBlbmFibGVkLCBtb2RlbCB9ID0gY3R4O1xuICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29kZUNoZWNrQ291bnRBZ2dyZWdhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChtb2RlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzQ291bnRzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydFdpdGgoe30pXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHRoaXMuX2RpYWdub3N0aWNDb3VudHNTdWJqZWN0KSwgYmFzZURpYWdub3N0aWNzXG4gICAgICAgICAgICAuc3dpdGNoTWFwKGN0eCA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IGVuYWJsZWQsIG1vZGVsIH0gPSBjdHg7XG4gICAgICAgICAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2RlQ2hlY2tCeUZpbGVBZ2dyZWdhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChtb2RlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzQnlGaWxlLm1hcCh4ID0+IG1vZGVsLmRpYWdub3N0aWNzQnlGaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKG5ldyBNYXAoKSk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhcnRXaXRoKG5ldyBNYXAoKSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUodGhpcy5fZGlhZ25vc3RpY3NCeUZpbGVTdWJqZWN0KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIGlmIChTb2x1dGlvbk1hbmFnZXIuX3VuaXRUZXN0TW9kZV8pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIFNvbHV0aW9uTWFuYWdlci5kZWFjdGl2YXRlKCk7XG4gICAgfVxuICAgIGNvbm5lY3QoKSB7IFNvbHV0aW9uTWFuYWdlci5jb25uZWN0KCk7IH1cbiAgICBkaXNjb25uZWN0KCkgeyBTb2x1dGlvbk1hbmFnZXIuZGlzY29ubmVjdCgpOyB9XG4gICAgdG9nZ2xlKCkge1xuICAgICAgICBpZiAoU29sdXRpb25NYW5hZ2VyLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgU29sdXRpb25NYW5hZ2VyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIFNvbHV0aW9uTWFuYWdlci5jb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbmF2aWdhdGVUbyhyZXNwb25zZSkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZShhdG9tLndvcmtzcGFjZS5vcGVuKHJlc3BvbnNlLkZpbGVOYW1lLCB7IGluaXRpYWxMaW5lOiByZXNwb25zZS5MaW5lLCBpbml0aWFsQ29sdW1uOiByZXNwb25zZS5Db2x1bW4gfSkpO1xuICAgIH1cbiAgICBnZXRGcmFtZXdvcmtzKHByb2plY3RzKSB7XG4gICAgICAgIGNvbnN0IGZyYW1ld29ya3MgPSBfLm1hcChwcm9qZWN0cywgKHByb2plY3QpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwcm9qZWN0LmluZGV4T2YoXCIrXCIpID09PSAtMSA/IFwiXCIgOiBwcm9qZWN0LnNwbGl0KFwiK1wiKVsxXTtcbiAgICAgICAgfSkuZmlsdGVyKChmdykgPT4gZncubGVuZ3RoID4gMCk7XG4gICAgICAgIHJldHVybiBmcmFtZXdvcmtzLmpvaW4oXCIsXCIpO1xuICAgIH1cbiAgICBhZGRUZXh0RWRpdG9yQ29tbWFuZChjb21tYW5kTmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS10ZXh0LWVkaXRvclwiLCBjb21tYW5kTmFtZSwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgICAgICBpZiAoIWVkaXRvcikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDtcbiAgICAgICAgICAgIGlmIChfLnNvbWUodGhpcy5fc3VwcG9ydGVkRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfaXNPbW5pU2hhcnBFZGl0b3IoZWRpdG9yKSB7XG4gICAgICAgIHJldHVybiBfLnNvbWUodGhpcy5fc3VwcG9ydGVkRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSk7XG4gICAgfVxuICAgIGNyZWF0ZVRleHRFZGl0b3JPYnNlcnZhYmxlKGRpc3Bvc2FibGUpIHtcbiAgICAgICAgY29uc3Qgc2FmZUd1YXJkID0gdGhpcy5fY3JlYXRlU2FmZUd1YXJkKHRoaXMuX3N1cHBvcnRlZEV4dGVuc2lvbnMsIGRpc3Bvc2FibGUpO1xuICAgICAgICBjb25zdCBvYnNlcnZlVGV4dEVkaXRvcnMgPSBjcmVhdGVPYnNlcnZhYmxlKG9ic2VydmVyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRpcyA9IGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yKSA9PiB7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIubmV4dChlZGl0b3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gKCkgPT4gZGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgfSkuc2hhcmUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPYnNlcnZhYmxlLm1lcmdlKG9ic2VydmVUZXh0RWRpdG9ycy5maWx0ZXIoeCA9PiAhIXguZ2V0UGF0aCgpKSwgc2FmZUd1YXJkKVxuICAgICAgICAgICAgLm1lcmdlTWFwKGVkaXRvciA9PiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKSwgKGVkaXRvciwgc29sdXRpb24pID0+IGVkaXRvcilcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKSwgT21uaXNoYXJwRWRpdG9yQ29udGV4dC5jcmVhdGVkXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICB0aGlzLl91bmRlcmx5aW5nRWRpdG9ycy5hZGQoZWRpdG9yKTtcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuY29uZmlnID0gXy5lbmRzV2l0aChlZGl0b3IuZ2V0UGF0aCgpLCBcInByb2plY3QuanNvblwiKTtcbiAgICAgICAgICAgIGNvbnN0IGRpcyA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl91bmRlcmx5aW5nRWRpdG9ycy5kZWxldGUoZWRpdG9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXMsIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4gZGlzLmRpc3Bvc2UoKSkpO1xuICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChkaXMpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNvbnN0IGxpdmVFZGl0b3JzID0gT21uaXNoYXJwRWRpdG9yQ29udGV4dC5jcmVhdGVkO1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5tZXJnZShPYnNlcnZhYmxlLmRlZmVyKCgpID0+IE9ic2VydmFibGUuZnJvbSh0aGlzLl91bmRlcmx5aW5nRWRpdG9ycykpLCBsaXZlRWRpdG9ycyk7XG4gICAgfVxuICAgIF9jcmVhdGVTYWZlR3VhcmQoZXh0ZW5zaW9ucywgZGlzcG9zYWJsZSkge1xuICAgICAgICBjb25zdCBlZGl0b3JTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKChwYW5lKSA9PiBlZGl0b3JTdWJqZWN0Lm5leHQocGFuZSkpKTtcbiAgICAgICAgY29uc3QgZWRpdG9yT2JzZXJ2YWJsZSA9IGVkaXRvclN1YmplY3QuZmlsdGVyKHogPT4geiAmJiAhIXouZ2V0R3JhbW1hcikuc3RhcnRXaXRoKG51bGwpO1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS56aXAoZWRpdG9yT2JzZXJ2YWJsZSwgZWRpdG9yT2JzZXJ2YWJsZS5za2lwKDEpLCAoZWRpdG9yLCBuZXh0RWRpdG9yKSA9PiAoeyBlZGl0b3IsIG5leHRFZGl0b3IgfSkpXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwKVxuICAgICAgICAgICAgLnN3aXRjaE1hcCgoeyBuZXh0RWRpdG9yIH0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBuZXh0RWRpdG9yLmdldFBhdGgoKTtcbiAgICAgICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgICAgIGlmIChuZXh0RWRpdG9yICYmIHRoaXMuX2lzT21uaVNoYXJwRWRpdG9yKG5leHRFZGl0b3IpKSB7XG4gICAgICAgICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKFwiT21uaVNoYXJwXCIsIHsgZGV0YWlsOiBcIkZ1bmN0aW9uYWxpdHkgd2lsbCBsaW1pdGVkIHVudGlsIHRoZSBmaWxlIGhhcyBiZWVuIHNhdmVkLlwiIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwb3NlciA9IG5leHRFZGl0b3Iub25EaWRDaGFuZ2VQYXRoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobmV4dEVkaXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3Nlci5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpO1xuICAgIH1cbiAgICBnZXQgbGlzdGVuZXIoKSB7XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuc29sdXRpb25PYnNlcnZlcjtcbiAgICB9XG4gICAgZ2V0IGFnZ3JlZ2F0ZUxpc3RlbmVyKCkge1xuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLnNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXI7XG4gICAgfVxuICAgIGdldCBzb2x1dGlvbnMoKSB7XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmRlZmVyKCgpID0+IE9ic2VydmFibGUuZnJvbShTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zKSk7XG4gICAgfVxuICAgIHJlcXVlc3QoZWRpdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGVkaXRvcikpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gZWRpdG9yO1xuICAgICAgICAgICAgZWRpdG9yID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWVkaXRvcikge1xuICAgICAgICAgICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNvbHV0aW9uQ2FsbGJhY2sgPSAoc29sdXRpb24pID0+IGNhbGxiYWNrKHNvbHV0aW9uLndpdGhFZGl0b3IoZWRpdG9yKSk7XG4gICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgIGlmIChlZGl0b3IgJiYgaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHNvbHV0aW9uQ2FsbGJhY2soZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbilcbiAgICAgICAgICAgICAgICAuc2hhcmUoKTtcbiAgICAgICAgICAgIHJlc3VsdC5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNvbHV0aW9uUmVzdWx0O1xuICAgICAgICBpZiAoZWRpdG9yKSB7XG4gICAgICAgICAgICBzb2x1dGlvblJlc3VsdCA9IFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc29sdXRpb25SZXN1bHQgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb24udGFrZSgxKTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBzb2x1dGlvblJlc3VsdFxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcbiAgICAgICAgICAgIC5mbGF0TWFwKHNvbHV0aW9uQ2FsbGJhY2spXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICAgICAgcmVzdWx0LnN1YnNjcmliZSgpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBnZXRQcm9qZWN0KGVkaXRvcikge1xuICAgICAgICBpZiAoaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikgJiYgZWRpdG9yLm9tbmlzaGFycC5wcm9qZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihlZGl0b3Iub21uaXNoYXJwLnByb2plY3QpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKVxuICAgICAgICAgICAgLmZsYXRNYXAoeiA9PiB6Lm1vZGVsLmdldFByb2plY3RGb3JFZGl0b3IoZWRpdG9yKSlcbiAgICAgICAgICAgIC50YWtlKDEpO1xuICAgIH1cbiAgICBnZXRTb2x1dGlvbkZvclByb2plY3QocHJvamVjdCkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihfKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMpXG4gICAgICAgICAgICAuZmlsdGVyKHNvbHV0aW9uID0+IF8uc29tZShzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cywgcCA9PiBwLm5hbWUgPT09IHByb2plY3QubmFtZSkpXG4gICAgICAgICAgICAuZmlyc3QoKSk7XG4gICAgfVxuICAgIGdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcikge1xuICAgICAgICBpZiAoaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKTtcbiAgICB9XG4gICAgZ2V0IGFjdGl2ZU1vZGVsKCkge1xuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uLm1hcCh6ID0+IHoubW9kZWwpO1xuICAgIH1cbiAgICBzd2l0Y2hBY3RpdmVNb2RlbChjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBvdXRlckNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5hY3RpdmVNb2RlbC5maWx0ZXIoeiA9PiAhIXopLnN1YnNjcmliZShtb2RlbCA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XG4gICAgICAgICAgICBtb2RlbC5kaXNwb3NhYmxlLmFkZChjZCk7XG4gICAgICAgICAgICBjZC5hZGQodGhpcy5hY3RpdmVNb2RlbC5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gbW9kZWwpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgbW9kZWwuZGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjYWxsYmFjayhtb2RlbCwgY2QpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHJldHVybiBvdXRlckNkO1xuICAgIH1cbiAgICBnZXQgYWN0aXZlU29sdXRpb24oKSB7XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb247XG4gICAgfVxuICAgIHN3aXRjaEFjdGl2ZVNvbHV0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBvdXRlckNkLmFkZCh0aGlzLmFjdGl2ZVNvbHV0aW9uLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKHNvbHV0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcbiAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcbiAgICAgICAgICAgIGNkLmFkZCh0aGlzLmFjdGl2ZVNvbHV0aW9uLmZpbHRlcihhY3RpdmUgPT4gYWN0aXZlICE9PSBzb2x1dGlvbilcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKHNvbHV0aW9uLCBjZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XG4gICAgfVxuICAgIGdldCBhY3RpdmVFZGl0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVFZGl0b3I7XG4gICAgfVxuICAgIHN3aXRjaEFjdGl2ZUVkaXRvcihjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBvdXRlckNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5hY3RpdmVFZGl0b3IuZmlsdGVyKHogPT4gISF6KS5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoY2QpO1xuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlRWRpdG9yLmZpbHRlcihhY3RpdmUgPT4gYWN0aXZlICE9PSBlZGl0b3IpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5kaXNwb3NhYmxlLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHJldHVybiBvdXRlckNkO1xuICAgIH1cbiAgICB3aGVuRWRpdG9yQ29ubmVjdGVkKGVkaXRvcikge1xuICAgICAgICBpZiAoaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uXG4gICAgICAgICAgICAgICAgLndoZW5Db25uZWN0ZWQoKVxuICAgICAgICAgICAgICAgIC5tYXAoeiA9PiBlZGl0b3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKVxuICAgICAgICAgICAgLmZsYXRNYXAoc29sdXRpb24gPT4gc29sdXRpb24ud2hlbkNvbm5lY3RlZCgpLCAoKSA9PiBlZGl0b3IpO1xuICAgIH1cbiAgICBnZXQgYWN0aXZlQ29uZmlnRWRpdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlQ29uZmlnRWRpdG9yO1xuICAgIH1cbiAgICBzd2l0Y2hBY3RpdmVDb25maWdFZGl0b3IoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlQ29uZmlnRWRpdG9yLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcbiAgICAgICAgICAgIGNkLmFkZCh0aGlzLmFjdGl2ZUNvbmZpZ0VkaXRvci5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gZWRpdG9yKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjYWxsYmFjayhlZGl0b3IsIGNkKTtcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcbiAgICB9XG4gICAgZ2V0IGFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3I7XG4gICAgfVxuICAgIHN3aXRjaEFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yKGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBvdXRlckNkLmFkZCh0aGlzLmFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XG4gICAgICAgICAgICBjZC5hZGQodGhpcy5hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvci5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gZWRpdG9yKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjYWxsYmFjayhlZGl0b3IsIGNkKTtcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcbiAgICB9XG4gICAgZ2V0IGFjdGl2ZVByb2plY3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVQcm9qZWN0O1xuICAgIH1cbiAgICBnZXQgYWN0aXZlRnJhbWV3b3JrKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlRnJhbWV3b3JrO1xuICAgIH1cbiAgICBnZXQgZWRpdG9ycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VkaXRvcnM7XG4gICAgfVxuICAgIGdldCBjb25maWdFZGl0b3JzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29uZmlnRWRpdG9ycztcbiAgICB9XG4gICAgZWFjaEVkaXRvcihjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBvdXRlckNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5fZWRpdG9ycy5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoY2QpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCgpID0+IHtcbiAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfSkpKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHJldHVybiBvdXRlckNkO1xuICAgIH1cbiAgICBlYWNoQ29uZmlnRWRpdG9yKGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBvdXRlckNkLmFkZCh0aGlzLl9jb25maWdFZGl0b3JzLnN1YnNjcmliZShlZGl0b3IgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xuICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChjZCk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9KSkpO1xuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XG4gICAgfVxuICAgIHJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjaykge1xuICAgICAgICBTb2x1dGlvbk1hbmFnZXIucmVnaXN0ZXJDb25maWd1cmF0aW9uKGNhbGxiYWNrKTtcbiAgICB9XG4gICAgZ2V0IF9raWNrX2luX3RoZV9wYW50c18oKSB7XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuX2tpY2tfaW5fdGhlX3BhbnRzXztcbiAgICB9XG4gICAgZ2V0IGdyYW1tYXJzKCkge1xuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXRvbS5ncmFtbWFycy5nZXRHcmFtbWFycygpLCBncmFtbWFyID0+IF8uc29tZSh0aGlzLl9zdXBwb3J0ZWRFeHRlbnNpb25zLCBleHQgPT4gXy5zb21lKGdyYW1tYXIuZmlsZVR5cGVzLCBmdCA9PiBfLnRyaW1TdGFydChleHQsIFwiLlwiKSA9PT0gZnQpKSk7XG4gICAgfVxuICAgIGlzVmFsaWRHcmFtbWFyKGdyYW1tYXIpIHtcbiAgICAgICAgcmV0dXJuIF8uc29tZSh0aGlzLmdyYW1tYXJzLCB7IHNjb3BlTmFtZTogZ3JhbW1hci5zY29wZU5hbWUgfSk7XG4gICAgfVxuICAgIGdldCBwYWNrYWdlRGlyKCkge1xuICAgICAgICBpZiAoIXRoaXMuX3BhY2thZ2VEaXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgZ2V0UGFja2FnZURpclBhdGhzOiAke2F0b20ucGFja2FnZXMuZ2V0UGFja2FnZURpclBhdGhzKCl9YCk7XG4gICAgICAgICAgICB0aGlzLl9wYWNrYWdlRGlyID0gXy5maW5kKGF0b20ucGFja2FnZXMuZ2V0UGFja2FnZURpclBhdGhzKCksIGZ1bmN0aW9uIChwYWNrYWdlUGF0aCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgcGFja2FnZVBhdGggJHtwYWNrYWdlUGF0aH0gZXhpc3RzOiAke2ZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhY2thZ2VQYXRoLCBcIm9tbmlzaGFycC1hdG9tXCIpKX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4ocGFja2FnZVBhdGgsIFwib21uaXNoYXJwLWF0b21cIikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3BhY2thZ2VEaXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYWNrYWdlRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi8uLi8uLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fcGFja2FnZURpcjtcbiAgICB9XG4gICAgZ2V0IGF0b21WZXJzaW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2F0b21WZXJzaW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9hdG9tVmVyc2lvbiA9IG5ldyBTZW1WZXIoYXRvbS5nZXRWZXJzaW9uKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9hdG9tVmVyc2lvbjtcbiAgICB9XG4gICAgYXRvbVZlcnNpb25HcmVhdGVyVGhhbih2ZXJzaW9uKSB7XG4gICAgICAgIHJldHVybiBzZW12ZXJHdChhdG9tLmdldFZlcnNpb24oKSwgdmVyc2lvbik7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IE9tbmkgPSBuZXcgT21uaU1hbmFnZXI7XG4iLCJpbXBvcnQge09ic2VydmFibGUsIFJlcGxheVN1YmplY3QsIFN1YmplY3QsIEJlaGF2aW9yU3ViamVjdCwgU2NoZWR1bGVyfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlLCBjcmVhdGVPYnNlcnZhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge1NvbHV0aW9uTWFuYWdlcn0gZnJvbSBcIi4vc29sdXRpb24tbWFuYWdlclwiO1xyXG5pbXBvcnQge1NvbHV0aW9ufSBmcm9tIFwiLi9zb2x1dGlvblwiO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7RHJpdmVyU3RhdGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCB7UHJvamVjdFZpZXdNb2RlbH0gZnJvbSBcIi4vcHJvamVjdC12aWV3LW1vZGVsXCI7XHJcbmltcG9ydCB7Vmlld01vZGVsfSBmcm9tIFwiLi92aWV3LW1vZGVsXCI7XHJcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQge09tbmlzaGFycFRleHRFZGl0b3IsIGlzT21uaXNoYXJwVGV4dEVkaXRvciwgT21uaXNoYXJwRWRpdG9yQ29udGV4dH0gZnJvbSBcIi4vb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XHJcbmltcG9ydCB7bWV0YWRhdGFPcGVuZXJ9IGZyb20gXCIuL21ldGFkYXRhLWVkaXRvclwiO1xyXG5pbXBvcnQge1NlbVZlciwgZ3QgYXMgc2VtdmVyR3R9IGZyb20gXCJzZW12ZXJcIjtcclxuXHJcbi8vIFRpbWUgd2Ugd2FpdCB0byB0cnkgYW5kIGRvIG91ciBhY3RpdmUgc3dpdGNoIHRhc2tzLlxyXG5jb25zdCBERUJPVU5DRV9USU1FT1VUID0gMTAwO1xyXG5jb25zdCBzdGF0ZWZ1bFByb3BlcnRpZXMgPSBbXCJpc09mZlwiLCBcImlzQ29ubmVjdGluZ1wiLCBcImlzT25cIiwgXCJpc1JlYWR5XCIsIFwiaXNFcnJvclwiXTtcclxuXHJcbmZ1bmN0aW9uIHdyYXBFZGl0b3JPYnNlcnZhYmxlKG9ic2VydmFibGU6IE9ic2VydmFibGU8T21uaXNoYXJwVGV4dEVkaXRvcj4pIHtcclxuICAgIHJldHVybiBvYnNlcnZhYmxlXHJcbiAgICAgICAgLnN1YnNjcmliZU9uKFNjaGVkdWxlci5hc3luYylcclxuICAgICAgICAub2JzZXJ2ZU9uKFNjaGVkdWxlci5hc3luYylcclxuICAgICAgICAuZmlsdGVyKGVkaXRvciA9PiAhZWRpdG9yIHx8IGVkaXRvciAmJiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpO1xyXG59XHJcblxyXG5jbGFzcyBPbW5pTWFuYWdlciBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuXHJcbiAgICBwcml2YXRlIF9lZGl0b3JzOiBPYnNlcnZhYmxlPE9tbmlzaGFycFRleHRFZGl0b3I+O1xyXG4gICAgcHJpdmF0ZSBfY29uZmlnRWRpdG9yczogT2JzZXJ2YWJsZTxPbW5pc2hhcnBUZXh0RWRpdG9yPjtcclxuICAgIHByaXZhdGUgX3VuZGVybHlpbmdFZGl0b3JzID0gbmV3IFNldDxPbW5pc2hhcnBUZXh0RWRpdG9yPigpO1xyXG5cclxuICAgIHB1YmxpYyBnZXQgdmlld01vZGVsU3RhdGVmdWxQcm9wZXJ0aWVzKCkgeyByZXR1cm4gc3RhdGVmdWxQcm9wZXJ0aWVzOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxPbW5pc2hhcnBUZXh0RWRpdG9yPihudWxsKTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yID0gd3JhcEVkaXRvck9ic2VydmFibGUoPE9ic2VydmFibGU8T21uaXNoYXJwVGV4dEVkaXRvcj4+PGFueT50aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QpXHJcbiAgICAgICAgLmRlYm91bmNlVGltZShERUJPVU5DRV9USU1FT1VUKVxyXG4gICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXHJcbiAgICAgICAgLnJlZkNvdW50KCk7XHJcblxyXG4gICAgcHJpdmF0ZSBfYWN0aXZlRWRpdG9yID0gd3JhcEVkaXRvck9ic2VydmFibGUoPE9ic2VydmFibGU8T21uaXNoYXJwVGV4dEVkaXRvcj4+PGFueT50aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QpXHJcbiAgICAgICAgLmRlYm91bmNlVGltZShERUJPVU5DRV9USU1FT1VUKVxyXG4gICAgICAgIC5tYXAoeCA9PiB4ICYmIHgub21uaXNoYXJwICYmICF4Lm9tbmlzaGFycC5jb25maWcgPyB4IDogbnVsbClcclxuICAgICAgICAucHVibGlzaFJlcGxheSgxKVxyXG4gICAgICAgIC5yZWZDb3VudCgpO1xyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2ZUNvbmZpZ0VkaXRvciA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKDxPYnNlcnZhYmxlPE9tbmlzaGFycFRleHRFZGl0b3I+Pjxhbnk+dGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KVxyXG4gICAgICAgIC5kZWJvdW5jZVRpbWUoREVCT1VOQ0VfVElNRU9VVClcclxuICAgICAgICAubWFwKHggPT4geCAmJiB4Lm9tbmlzaGFycCAmJiB4Lm9tbmlzaGFycC5jb25maWcgPyB4IDogbnVsbClcclxuICAgICAgICAucHVibGlzaFJlcGxheSgxKVxyXG4gICAgICAgIC5yZWZDb3VudCgpO1xyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2ZVByb2plY3QgPSB0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclxyXG4gICAgICAgIC5maWx0ZXIoZWRpdG9yID0+IGVkaXRvciAmJiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpXHJcbiAgICAgICAgLnN3aXRjaE1hcChlZGl0b3IgPT4gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5tb2RlbC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikpXHJcbiAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKClcclxuICAgICAgICAucHVibGlzaFJlcGxheSgxKVxyXG4gICAgICAgIC5yZWZDb3VudCgpO1xyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yXHJcbiAgICAgICAgLmZpbHRlcihlZGl0b3IgPT4gZWRpdG9yICYmICFlZGl0b3IuaXNEZXN0cm95ZWQoKSlcclxuICAgICAgICAuc3dpdGNoTWFwKGVkaXRvciA9PiBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLm1vZGVsLmdldFByb2plY3RGb3JFZGl0b3IoZWRpdG9yKSlcclxuICAgICAgICAuc3dpdGNoTWFwKHByb2plY3QgPT4gcHJvamVjdC5vYnNlcnZlLmFjdGl2ZUZyYW1ld29yaywgKHByb2plY3QsIGZyYW1ld29yaykgPT4gKHsgcHJvamVjdCwgZnJhbWV3b3JrIH0pKVxyXG4gICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpXHJcbiAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcclxuICAgICAgICAucmVmQ291bnQoKTtcclxuXHJcbiAgICBwcml2YXRlIF9kaWFnbm9zdGljc1N1YmplY3QgPSBuZXcgU3ViamVjdDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KCk7XHJcbiAgICBwcml2YXRlIF9kaWFnbm9zdGljcyA9IHRoaXMuX2RpYWdub3N0aWNzU3ViamVjdC5jYWNoZSgxKTtcclxuICAgIHB1YmxpYyBnZXQgZGlhZ25vc3RpY3MoKSB7IHJldHVybiB0aGlzLl9kaWFnbm9zdGljczsgfVxyXG5cclxuICAgIHByaXZhdGUgX2RpYWdub3N0aWNDb3VudHNTdWJqZWN0ID0gbmV3IFN1YmplY3Q8eyBba2V5OiBzdHJpbmddOiBudW1iZXI7IH0+KCk7XHJcbiAgICBwcml2YXRlIF9kaWFnbm9zdGljQ291bnRzID0gdGhpcy5fZGlhZ25vc3RpY0NvdW50c1N1YmplY3QuY2FjaGUoMSk7XHJcbiAgICBwdWJsaWMgZ2V0IGRpYWdub3N0aWNzQ291bnRzKCkgeyByZXR1cm4gdGhpcy5fZGlhZ25vc3RpY0NvdW50czsgfVxyXG5cclxuICAgIHByaXZhdGUgX2RpYWdub3N0aWNzQnlGaWxlU3ViamVjdCA9IG5ldyBTdWJqZWN0PE1hcDxzdHJpbmcsIE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4+KCk7XHJcbiAgICBwcml2YXRlIF9kaWFnbm9zdGljc0J5RmlsZSA9IHRoaXMuX2RpYWdub3N0aWNzQnlGaWxlU3ViamVjdC5jYWNoZSgxKTtcclxuICAgIHB1YmxpYyBnZXQgZGlhZ25vc3RpY3NCeUZpbGUoKSB7IHJldHVybiB0aGlzLl9kaWFnbm9zdGljc0J5RmlsZTsgfVxyXG5cclxuICAgIHByaXZhdGUgX2lzT2ZmID0gdHJ1ZTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0IGlzT2ZmKCkgeyByZXR1cm4gdGhpcy5faXNPZmY7IH1cclxuICAgIHB1YmxpYyBnZXQgaXNPbigpIHsgcmV0dXJuICF0aGlzLmlzT2ZmOyB9XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQobWV0YWRhdGFPcGVuZXIoKSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGVkaXRvcnMgPSB0aGlzLmNyZWF0ZVRleHRFZGl0b3JPYnNlcnZhYmxlKHRoaXMuZGlzcG9zYWJsZSk7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9ycyA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKGVkaXRvcnMuZmlsdGVyKHggPT4gIXgub21uaXNoYXJwLmNvbmZpZykpO1xyXG4gICAgICAgIHRoaXMuX2NvbmZpZ0VkaXRvcnMgPSB3cmFwRWRpdG9yT2JzZXJ2YWJsZShlZGl0b3JzLmZpbHRlcih4ID0+IHgub21uaXNoYXJwLmNvbmZpZykpO1xyXG5cclxuICAgICAgICAvLyBSZXN0b3JlIHNvbHV0aW9ucyBhZnRlciB0aGUgc2VydmVyIHdhcyBkaXNjb25uZWN0ZWRcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbi5zdWJzY3JpYmUoc29sdXRpb24gPT4ge1xyXG4gICAgICAgICAgICBfKGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4gdGhpcy5faXNPbW5pU2hhcnBFZGl0b3IoeCkpXHJcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4gISg8YW55PngpLm9tbmlzaGFycClcclxuICAgICAgICAgICAgICAgIC5lYWNoKHggPT4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKHgpKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIFNvbHV0aW9uTWFuYWdlci5hY3RpdmF0ZSh0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvcik7XHJcblxyXG4gICAgICAgIC8vIHdlIGFyZSBvbmx5IG9mZiBpZiBhbGwgb3VyIHNvbHV0aW9ucyBhcmUgZGlzY29ubmN0ZWQgb3IgZXJyb2VkLlxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoU29sdXRpb25NYW5hZ2VyLnNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIuc3RhdGUuc3Vic2NyaWJlKHogPT4gdGhpcy5faXNPZmYgPSBfLmV2ZXJ5KHosIHggPT4geC52YWx1ZSA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkIHx8IHgudmFsdWUgPT09IERyaXZlclN0YXRlLkVycm9yKSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBjcmVhdGVPYnNlcnZhYmxlPEF0b20uVGV4dEVkaXRvcj4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGlzID0gYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKChwYW5lOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocGFuZSAmJiBwYW5lLmdldEdyYW1tYXIgJiYgcGFuZS5nZXRQYXRoICYmIHRoaXMuaXNWYWxpZEdyYW1tYXIocGFuZS5nZXRHcmFtbWFyKCkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLm5leHQoPEF0b20uVGV4dEVkaXRvcj5wYW5lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5uZXh0KG51bGwpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuICgpID0+IGRpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKChwYW5lKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYW5lIHx8IGlzT21uaXNoYXJwVGV4dEVkaXRvcihwYW5lKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihwYW5lKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdyYXBFZGl0b3JPYnNlcnZhYmxlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IocGFuZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoeCA9PiA8T21uaXNoYXJwVGV4dEVkaXRvcj5wYW5lKVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSh0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QpKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yU3ViamVjdC5uZXh0KG51bGwpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgLy8gQ2FjaGUgdGhpcyByZXN1bHQsIGJlY2F1c2UgdGhlIHVuZGVybHlpbmcgaW1wbGVtZW50YXRpb24gb2Ygb2JzZXJ2ZSB3aWxsXHJcbiAgICAgICAgLy8gICAgY3JlYXRlIGEgY2FjaGUgb2YgdGhlIGxhc3QgcmVjaWV2ZWQgdmFsdWUuICBUaGlzIGFsbG93cyB1cyB0byBwaWNrIHBpY2tcclxuICAgICAgICAvLyAgICB1cCBmcm9tIHdoZXJlIHdlIGxlZnQgb2ZmLlxyXG4gICAgICAgIGNvbnN0IGNvZGVDaGVja0FnZ3JlZ2F0ZSA9IHRoaXMuYWdncmVnYXRlTGlzdGVuZXIubGlzdGVuVG8oeiA9PiB6Lm1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3MpXHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwKVxyXG4gICAgICAgICAgICAubWFwKGRhdGEgPT4gXyhkYXRhKS5mbGF0TWFwKHggPT4geC52YWx1ZSkudmFsdWUoKSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGNvZGVDaGVja0NvdW50QWdncmVnYXRlID0gdGhpcy5hZ2dyZWdhdGVMaXN0ZW5lci5saXN0ZW5Ubyh6ID0+IHoubW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljc0NvdW50cylcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgyMDApXHJcbiAgICAgICAgICAgIC5tYXAoaXRlbXMgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0OiB0eXBlb2YgVmlld01vZGVsLnByb3RvdHlwZS5kaWFnbm9zdGljQ291bnRzID0ge307XHJcbiAgICAgICAgICAgICAgICBfLmVhY2goaXRlbXMsICh5KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoKHkudmFsdWUsICh4LCBrKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzdWx0W2tdKSByZXN1bHRba10gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRba10gKz0geDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGNvZGVDaGVja0J5RmlsZUFnZ3JlZ2F0ZSA9IHRoaXMuYWdncmVnYXRlTGlzdGVuZXIubGlzdGVuVG8oeiA9PiB6Lm1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3NCeUZpbGUubWFwKHggPT4gei5tb2RlbC5kaWFnbm9zdGljc0J5RmlsZSkpXHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwKVxyXG4gICAgICAgICAgICAubWFwKHggPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWFwID0gbmV3IE1hcDxzdHJpbmcsIE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4oKTtcclxuICAgICAgICAgICAgICAgIF8uZWFjaCh4LCB6ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBbZmlsZSwgZGlhZ25vc3RpY3NdIG9mIHoudmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFwLnNldChmaWxlLCBkaWFnbm9zdGljcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucyA9IG5ldyBSZXBsYXlTdWJqZWN0PGJvb2xlYW4+KDEpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLnNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9uc1wiLCBmdW5jdGlvbihlbmFibGVkKSB7XHJcbiAgICAgICAgICAgIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucy5uZXh0KGVuYWJsZWQpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnMpO1xyXG5cclxuICAgICAgICBjb25zdCBiYXNlRGlhZ25vc3RpY3MgPSBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoIC8vIENvbWJpbmUgYm90aCB0aGUgYWN0aXZlIG1vZGVsIGFuZCB0aGUgY29uZmlndXJhdGlvbiBjaGFuZ2VzIHRvZ2V0aGVyXHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlTW9kZWwuc3RhcnRXaXRoKG51bGwpLCA8T2JzZXJ2YWJsZTxib29sZWFuPj48YW55PnNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucywgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zLnNraXAoMSkuc3RhcnRXaXRoKGF0b20uY29uZmlnLmdldDxib29sZWFuPihcIm9tbmlzaGFycC1hdG9tLnNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9uc1wiKSksXHJcbiAgICAgICAgICAgIChtb2RlbCwgZW5hYmxlZCwgd2FzRW5hYmxlZCkgPT4gKHsgbW9kZWwsIGVuYWJsZWQsIHdhc0VuYWJsZWQgfSkpXHJcbiAgICAgICAgICAgIC8vIElmIHRoZSBzZXR0aW5nIGlzIGVuYWJsZWQgKGFuZCBoYXNuXCJ0IGNoYW5nZWQpIHRoZW4gd2UgZG9uXCJ0IG5lZWQgdG8gcmVkbyB0aGUgc3Vic2NyaXB0aW9uXHJcbiAgICAgICAgICAgIC5maWx0ZXIoY3R4ID0+ICghKGN0eC5lbmFibGVkICYmIGN0eC53YXNFbmFibGVkID09PSBjdHguZW5hYmxlZCkpKVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcclxuICAgICAgICAgICAgYmFzZURpYWdub3N0aWNzXHJcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKGN0eCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qge2VuYWJsZWQsIG1vZGVsfSA9IGN0eDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvZGVDaGVja0FnZ3JlZ2F0ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoW10pO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5zdGFydFdpdGgoW10pXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHRoaXMuX2RpYWdub3N0aWNzU3ViamVjdCksXHJcbiAgICAgICAgICAgIGJhc2VEaWFnbm9zdGljc1xyXG4gICAgICAgICAgICAgICAgLnN3aXRjaE1hcChjdHggPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHtlbmFibGVkLCBtb2RlbH0gPSBjdHg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2RlQ2hlY2tDb3VudEFnZ3JlZ2F0ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzQ291bnRzO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxhbnk+T2JzZXJ2YWJsZS5lbXB0eTx7IFtpbmRleDogc3RyaW5nXTogbnVtYmVyOyB9PigpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5zdGFydFdpdGgoe30pXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHRoaXMuX2RpYWdub3N0aWNDb3VudHNTdWJqZWN0KSxcclxuICAgICAgICAgICAgYmFzZURpYWdub3N0aWNzXHJcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKGN0eCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qge2VuYWJsZWQsIG1vZGVsfSA9IGN0eDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvZGVDaGVja0J5RmlsZUFnZ3JlZ2F0ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzQnlGaWxlLm1hcCh4ID0+IG1vZGVsLmRpYWdub3N0aWNzQnlGaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKG5ldyBNYXA8c3RyaW5nLCBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KCkpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5zdGFydFdpdGgobmV3IE1hcDxzdHJpbmcsIE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4oKSlcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUodGhpcy5fZGlhZ25vc3RpY3NCeUZpbGVTdWJqZWN0KVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgaWYgKFNvbHV0aW9uTWFuYWdlci5fdW5pdFRlc3RNb2RlXykgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgU29sdXRpb25NYW5hZ2VyLmRlYWN0aXZhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29ubmVjdCgpIHsgU29sdXRpb25NYW5hZ2VyLmNvbm5lY3QoKTsgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNjb25uZWN0KCkgeyBTb2x1dGlvbk1hbmFnZXIuZGlzY29ubmVjdCgpOyB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZSgpIHtcclxuICAgICAgICBpZiAoU29sdXRpb25NYW5hZ2VyLmNvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIFNvbHV0aW9uTWFuYWdlci5jb25uZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuYXZpZ2F0ZVRvKHJlc3BvbnNlOiB7IEZpbGVOYW1lOiBzdHJpbmc7IExpbmU6IG51bWJlcjsgQ29sdW1uOiBudW1iZXI7IH0pIHtcclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZSg8UHJvbWlzZTxBdG9tLlRleHRFZGl0b3I+Pjxhbnk+YXRvbS53b3Jrc3BhY2Uub3BlbihyZXNwb25zZS5GaWxlTmFtZSwgPGFueT57IGluaXRpYWxMaW5lOiByZXNwb25zZS5MaW5lLCBpbml0aWFsQ29sdW1uOiByZXNwb25zZS5Db2x1bW4gfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRGcmFtZXdvcmtzKHByb2plY3RzOiBzdHJpbmdbXSk6IHN0cmluZyB7XHJcbiAgICAgICAgY29uc3QgZnJhbWV3b3JrcyA9IF8ubWFwKHByb2plY3RzLCAocHJvamVjdDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBwcm9qZWN0LmluZGV4T2YoXCIrXCIpID09PSAtMSA/IFwiXCIgOiBwcm9qZWN0LnNwbGl0KFwiK1wiKVsxXTtcclxuICAgICAgICB9KS5maWx0ZXIoKGZ3OiBzdHJpbmcpID0+IGZ3Lmxlbmd0aCA+IDApO1xyXG4gICAgICAgIHJldHVybiBmcmFtZXdvcmtzLmpvaW4oXCIsXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGRUZXh0RWRpdG9yQ29tbWFuZChjb21tYW5kTmFtZTogc3RyaW5nLCBjYWxsYmFjazogKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXRleHQtZWRpdG9yXCIsIGNvbW1hbmROYW1lLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gICAgICAgICAgICBpZiAoIWVkaXRvcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uc29tZSh0aGlzLl9zdXBwb3J0ZWRFeHRlbnNpb25zLCBleHQgPT4gXy5lbmRzV2l0aChlZGl0b3IuZ2V0UGF0aCgpLCBleHQpKSkge1xyXG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGV2ZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2lzT21uaVNoYXJwRWRpdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uc29tZSh0aGlzLl9zdXBwb3J0ZWRFeHRlbnNpb25zLCBleHQgPT4gXy5lbmRzV2l0aChlZGl0b3IuZ2V0UGF0aCgpLCBleHQpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZVRleHRFZGl0b3JPYnNlcnZhYmxlKGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGUpIHtcclxuICAgICAgICBjb25zdCBzYWZlR3VhcmQgPSB0aGlzLl9jcmVhdGVTYWZlR3VhcmQodGhpcy5fc3VwcG9ydGVkRXh0ZW5zaW9ucywgZGlzcG9zYWJsZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IG9ic2VydmVUZXh0RWRpdG9ycyA9IGNyZWF0ZU9ic2VydmFibGU8QXRvbS5UZXh0RWRpdG9yPihvYnNlcnZlciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpcyA9IGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpID0+IHtcclxuICAgICAgICAgICAgICAgIG9ic2VydmVyLm5leHQoZWRpdG9yKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gKCkgPT4gZGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICB9KS5zaGFyZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBPYnNlcnZhYmxlLm1lcmdlKG9ic2VydmVUZXh0RWRpdG9ycy5maWx0ZXIoeCA9PiAhIXguZ2V0UGF0aCgpKSwgc2FmZUd1YXJkKVxyXG4gICAgICAgICAgICAgICAgLm1lcmdlTWFwKGVkaXRvciA9PiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKSwgKGVkaXRvciwgc29sdXRpb24pID0+IDxPbW5pc2hhcnBUZXh0RWRpdG9yPmVkaXRvcilcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKSxcclxuICAgICAgICAgICAgT21uaXNoYXJwRWRpdG9yQ29udGV4dC5jcmVhdGVkXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdW5kZXJseWluZ0VkaXRvcnMuYWRkKGVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5jb25maWcgPSBfLmVuZHNXaXRoKGVkaXRvci5nZXRQYXRoKCksIFwicHJvamVjdC5qc29uXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXMgPSBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3VuZGVybHlpbmdFZGl0b3JzLmRlbGV0ZShlZGl0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4gZGlzLmRpc3Bvc2UoKSlcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGRpcyk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IGxpdmVFZGl0b3JzID0gT21uaXNoYXJwRWRpdG9yQ29udGV4dC5jcmVhdGVkO1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm1lcmdlKFxyXG4gICAgICAgICAgICBPYnNlcnZhYmxlLmRlZmVyKCgpID0+IE9ic2VydmFibGUuZnJvbTxPbW5pc2hhcnBUZXh0RWRpdG9yPig8YW55PnRoaXMuX3VuZGVybHlpbmdFZGl0b3JzKSksXHJcbiAgICAgICAgICAgIGxpdmVFZGl0b3JzXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9jcmVhdGVTYWZlR3VhcmQoZXh0ZW5zaW9uczogc3RyaW5nW10sIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGUpIHtcclxuICAgICAgICBjb25zdCBlZGl0b3JTdWJqZWN0ID0gbmV3IFN1YmplY3Q8T21uaXNoYXJwVGV4dEVkaXRvcj4oKTtcclxuXHJcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKChwYW5lOiBhbnkpID0+IGVkaXRvclN1YmplY3QubmV4dChwYW5lKSkpO1xyXG4gICAgICAgIGNvbnN0IGVkaXRvck9ic2VydmFibGUgPSBlZGl0b3JTdWJqZWN0LmZpbHRlcih6ID0+IHogJiYgISF6LmdldEdyYW1tYXIpLnN0YXJ0V2l0aChudWxsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuemlwKGVkaXRvck9ic2VydmFibGUsIGVkaXRvck9ic2VydmFibGUuc2tpcCgxKSwgKGVkaXRvciwgbmV4dEVkaXRvcikgPT4gKHsgZWRpdG9yLCBuZXh0RWRpdG9yIH0pKVxyXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwKVxyXG4gICAgICAgICAgICAuc3dpdGNoTWFwKCh7bmV4dEVkaXRvcn0pID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSBuZXh0RWRpdG9yLmdldFBhdGgoKTtcclxuICAgICAgICAgICAgICAgIGlmICghcGF0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGVkaXRvciBpc25cInQgc2F2ZWQgeWV0LlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0RWRpdG9yICYmIHRoaXMuX2lzT21uaVNoYXJwRWRpdG9yKG5leHRFZGl0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKFwiT21uaVNoYXJwXCIsIHsgZGV0YWlsOiBcIkZ1bmN0aW9uYWxpdHkgd2lsbCBsaW1pdGVkIHVudGlsIHRoZSBmaWxlIGhhcyBiZWVuIHNhdmVkLlwiIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPEF0b20uVGV4dEVkaXRvcj4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwb3NlciA9IG5leHRFZGl0b3Iub25EaWRDaGFuZ2VQYXRoKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUobmV4dEVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3Nlci5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBwcm9wZXJ0eSBjYW4gYmUgdXNlZCB0byBsaXN0ZW4gdG8gYW55IGV2ZW50IHRoYXQgbWlnaHQgY29tZSBhY3Jvc3Mgb24gYW55IHNvbHV0aW9ucy5cclxuICAgICAqIFRoaXMgaXMgYSBtb3N0bHkgZnVuY3Rpb25hbCByZXBsYWNlbWVudCBmb3IgYHJlZ2lzdGVyQ29uZmlndXJhdGlvbmAsIHRob3VnaCB0aGVyZSBoYXMgYmVlblxyXG4gICAgICogICAgIG9uZSBwbGFjZSB3aGVyZSBgcmVnaXN0ZXJDb25maWd1cmF0aW9uYCBjb3VsZCBub3QgYmUgcmVwbGFjZWQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXQgbGlzdGVuZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5zb2x1dGlvbk9ic2VydmVyO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBwcm9wZXJ0eSBjYW4gYmUgdXNlZCB0byBvYnNlcnZlIHRvIHRoZSBhZ2dyZWdhdGUgb3IgY29tYmluZWQgcmVzcG9uc2VzIHRvIGFueSBldmVudC5cclxuICAgICAqIEEgZ29vZCBleGFtcGxlIG9mIHRoaXMgaXMsIGZvciBjb2RlIGNoZWNrIGVycm9ycywgdG8gYWdncmVnYXRlIGFsbCBlcnJvcnMgYWNyb3NzIGFsbCBvcGVuIHNvbHV0aW9ucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCBhZ2dyZWdhdGVMaXN0ZW5lcigpIHtcclxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLnNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIHByb3BlcnR5IGdldHMgYSBsaXN0IG9mIHNvbHV0aW9ucyBhcyBhbiBvYnNlcnZhYmxlLlxyXG4gICAgICogTk9URTogVGhpcyBwcm9wZXJ0eSB3aWxsIG5vdCBlbWl0IGFkZGl0aW9ucyBvciByZW1vdmFscyBvZiBzb2x1dGlvbnMuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXQgc29sdXRpb25zKCkge1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmRlZmVyKCgpID0+IE9ic2VydmFibGUuZnJvbTxTb2x1dGlvbj4oU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucykpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgYWxsb3dzIHVzIHRvIGZvcmdldCBhYm91dCB0aGUgZW50aXJlIHNvbHV0aW9uIG1vZGVsLlxyXG4gICAgICogQ2FsbCB0aGlzIG1ldGhvZCB3aXRoIGEgc3BlY2lmaWMgZWRpdG9yLCBvciBqdXN0IHdpdGggYSBjYWxsYmFjayB0byBjYXB0dXJlIHRoZSBjdXJyZW50IGVkaXRvclxyXG4gICAgICpcclxuICAgICAqIFRoZSBjYWxsYmFjayB3aWxsIHRoZW4gaXNzdWUgdGhlIHJlcXVlc3RcclxuICAgICAqIE5PVEU6IFRoaXMgQVBJIG9ubHkgZXhwb3NlcyB0aGUgb3BlcmF0aW9uIEFwaSBhbmQgZG9lc25cInQgZXhwb3NlIHRoZSBldmVudCBhcGksIGFzIHdlIGFyZSByZXF1ZXN0aW5nIHNvbWV0aGluZyB0byBoYXBwZW5cclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlcXVlc3Q8VD4oZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGNhbGxiYWNrOiAoc29sdXRpb246IFNvbHV0aW9uKSA9PiBPYnNlcnZhYmxlPFQ+KTogT2JzZXJ2YWJsZTxUPjtcclxuICAgIHB1YmxpYyByZXF1ZXN0PFQ+KGNhbGxiYWNrOiAoc29sdXRpb246IFNvbHV0aW9uKSA9PiBPYnNlcnZhYmxlPFQ+KTogT2JzZXJ2YWJsZTxUPjtcclxuICAgIHB1YmxpYyByZXF1ZXN0PFQ+KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yIHwgKChzb2x1dGlvbjogU29sdXRpb24pID0+IE9ic2VydmFibGU8VD4gfCBQcm9taXNlPFQ+KSwgY2FsbGJhY2s/OiAoc29sdXRpb246IFNvbHV0aW9uKSA9PiBPYnNlcnZhYmxlPFQ+KTogT2JzZXJ2YWJsZTxUPiB7XHJcbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihlZGl0b3IpKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrID0gPGFueT5lZGl0b3I7XHJcbiAgICAgICAgICAgIGVkaXRvciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWVkaXRvcikge1xyXG4gICAgICAgICAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzb2x1dGlvbkNhbGxiYWNrID0gKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gY2FsbGJhY2soc29sdXRpb24ud2l0aEVkaXRvcig8YW55PmVkaXRvcikpO1xyXG5cclxuICAgICAgICBsZXQgcmVzdWx0OiBPYnNlcnZhYmxlPFQ+O1xyXG4gICAgICAgIGlmIChlZGl0b3IgJiYgaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gc29sdXRpb25DYWxsYmFjayhlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uKVxyXG4gICAgICAgICAgICAgICAgLnNoYXJlKCk7XHJcbiAgICAgICAgICAgIHJlc3VsdC5zdWJzY3JpYmUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzb2x1dGlvblJlc3VsdDogT2JzZXJ2YWJsZTxTb2x1dGlvbj47XHJcbiAgICAgICAgaWYgKGVkaXRvcikge1xyXG4gICAgICAgICAgICBzb2x1dGlvblJlc3VsdCA9IFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcig8QXRvbS5UZXh0RWRpdG9yPmVkaXRvcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc29sdXRpb25SZXN1bHQgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb24udGFrZSgxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc3VsdCA9IHNvbHV0aW9uUmVzdWx0XHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKHNvbHV0aW9uQ2FsbGJhY2spXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG5cclxuICAgICAgICAvLyBFbnN1cmUgdGhhdCB0aGUgdW5kZXJ5aW5nIHByb21pc2UgaXMgY29ubmVjdGVkXHJcbiAgICAgICAgLy8gICAoaWYgd2UgZG9uXCJ0IHN1YnNjcmliZSB0byB0aGUgcmV1c2x0IG9mIHRoZSByZXF1ZXN0LCB3aGljaCBpcyBub3QgYSByZXF1aXJlbWVudCkuXHJcbiAgICAgICAgcmVzdWx0LnN1YnNjcmliZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRQcm9qZWN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpICYmIGVkaXRvci5vbW5pc2hhcnAucHJvamVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihlZGl0b3Iub21uaXNoYXJwLnByb2plY3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKHogPT4gei5tb2RlbC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikpXHJcbiAgICAgICAgICAgIC50YWtlKDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRTb2x1dGlvbkZvclByb2plY3QocHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+KSB7XHJcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoXHJcbiAgICAgICAgICAgIF8oU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucylcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoc29sdXRpb24gPT4gXy5zb21lKHNvbHV0aW9uLm1vZGVsLnByb2plY3RzLCBwID0+IHAubmFtZSA9PT0gcHJvamVjdC5uYW1lKSlcclxuICAgICAgICAgICAgICAgIC5maXJzdCgpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICBpZiAoaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBbGxvd3MgZm9yIHZpZXdzIHRvIG9ic2VydmUgdGhlIGFjdGl2ZSBtb2RlbCBhcyBpdCBjaGFuZ2VzIGJldHdlZW4gZWRpdG9yc1xyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZU1vZGVsKCkge1xyXG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb24ubWFwKHogPT4gei5tb2RlbCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN3aXRjaEFjdGl2ZU1vZGVsKGNhbGxiYWNrOiAobW9kZWw6IFZpZXdNb2RlbCwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpID0+IHZvaWQpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5hY3RpdmVNb2RlbC5maWx0ZXIoeiA9PiAhIXopLnN1YnNjcmliZShtb2RlbCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xyXG4gICAgICAgICAgICBtb2RlbC5kaXNwb3NhYmxlLmFkZChjZCk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQodGhpcy5hY3RpdmVNb2RlbC5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gbW9kZWwpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBtb2RlbC5kaXNwb3NhYmxlLnJlbW92ZShjZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKG1vZGVsLCBjZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZVNvbHV0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN3aXRjaEFjdGl2ZVNvbHV0aW9uKGNhbGxiYWNrOiAoc29sdXRpb246IFNvbHV0aW9uLCBjZDogQ29tcG9zaXRlRGlzcG9zYWJsZSkgPT4gdm9pZCk6IElEaXNwb3NhYmxlIHtcclxuICAgICAgICBjb25zdCBvdXRlckNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBvdXRlckNkLmFkZCh0aGlzLmFjdGl2ZVNvbHV0aW9uLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKHNvbHV0aW9uID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZCh0aGlzLmFjdGl2ZVNvbHV0aW9uLmZpbHRlcihhY3RpdmUgPT4gYWN0aXZlICE9PSBzb2x1dGlvbilcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgY2FsbGJhY2soc29sdXRpb24sIGNkKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHJldHVybiBvdXRlckNkO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlRWRpdG9yKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVFZGl0b3I7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN3aXRjaEFjdGl2ZUVkaXRvcihjYWxsYmFjazogKGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvciwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpID0+IHZvaWQpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5hY3RpdmVFZGl0b3IuZmlsdGVyKHogPT4gISF6KS5zdWJzY3JpYmUoZWRpdG9yID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XHJcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoY2QpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlRWRpdG9yLmZpbHRlcihhY3RpdmUgPT4gYWN0aXZlICE9PSBlZGl0b3IpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd2hlbkVkaXRvckNvbm5lY3RlZChlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIGlmIChpc09tbmlzaGFycFRleHRFZGl0b3IoZWRpdG9yKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvblxyXG4gICAgICAgICAgICAgICAgLndoZW5Db25uZWN0ZWQoKVxyXG4gICAgICAgICAgICAgICAgLm1hcCh6ID0+IGVkaXRvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcilcclxuICAgICAgICAgICAgLmZsYXRNYXAoc29sdXRpb24gPT4gc29sdXRpb24ud2hlbkNvbm5lY3RlZCgpLCAoKSA9PiA8T21uaXNoYXJwVGV4dEVkaXRvcj5lZGl0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlQ29uZmlnRWRpdG9yKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVDb25maWdFZGl0b3I7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN3aXRjaEFjdGl2ZUNvbmZpZ0VkaXRvcihjYWxsYmFjazogKGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvciwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpID0+IHZvaWQpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5hY3RpdmVDb25maWdFZGl0b3IuZmlsdGVyKHogPT4gISF6KS5zdWJzY3JpYmUoZWRpdG9yID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XHJcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoY2QpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlQ29uZmlnRWRpdG9yLmZpbHRlcihhY3RpdmUgPT4gYWN0aXZlICE9PSBlZGl0b3IpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvcjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3dpdGNoQWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3IoY2FsbGJhY2s6IChlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IsIGNkOiBDb21wb3NpdGVEaXNwb3NhYmxlKSA9PiB2b2lkKTogSURpc3Bvc2FibGUge1xyXG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3IuZmlsdGVyKHogPT4gISF6KS5zdWJzY3JpYmUoZWRpdG9yID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQodGhpcy5hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvci5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gZWRpdG9yKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBhY3RpdmVQcm9qZWN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVQcm9qZWN0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlRnJhbWV3b3JrKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVGcmFtZXdvcms7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBlZGl0b3JzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9lZGl0b3JzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgY29uZmlnRWRpdG9ycygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY29uZmlnRWRpdG9ycztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZWFjaEVkaXRvcihjYWxsYmFjazogKGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvciwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpID0+IHZvaWQpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5fZWRpdG9ycy5zdWJzY3JpYmUoZWRpdG9yID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XHJcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoY2QpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9KSkpO1xyXG5cclxuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZWFjaENvbmZpZ0VkaXRvcihjYWxsYmFjazogKGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvciwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpID0+IHZvaWQpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5fY29uZmlnRWRpdG9ycy5zdWJzY3JpYmUoZWRpdG9yID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XHJcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoY2QpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9KSkpO1xyXG5cclxuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVnaXN0ZXJDb25maWd1cmF0aW9uKGNhbGxiYWNrOiAoc29sdXRpb246IFNvbHV0aW9uKSA9PiB2b2lkKSB7XHJcbiAgICAgICAgU29sdXRpb25NYW5hZ2VyLnJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjayk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXQgX2tpY2tfaW5fdGhlX3BhbnRzXygpIHtcclxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLl9raWNrX2luX3RoZV9wYW50c187XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfc3VwcG9ydGVkRXh0ZW5zaW9ucyA9IFtcInByb2plY3QuanNvblwiLCBcIi5jc1wiLCBcIi5jc3hcIiwgLypcIi5jYWtlXCIqL107XHJcblxyXG4gICAgcHVibGljIGdldCBncmFtbWFycygpIHtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXRvbS5ncmFtbWFycy5nZXRHcmFtbWFycygpLFxyXG4gICAgICAgICAgICBncmFtbWFyID0+IF8uc29tZSh0aGlzLl9zdXBwb3J0ZWRFeHRlbnNpb25zLFxyXG4gICAgICAgICAgICAgICAgZXh0ID0+IF8uc29tZSgoPGFueT5ncmFtbWFyKS5maWxlVHlwZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgZnQgPT4gXy50cmltU3RhcnQoZXh0LCBcIi5cIikgPT09IGZ0KSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpc1ZhbGlkR3JhbW1hcihncmFtbWFyOiBGaXJzdE1hdGUuR3JhbW1hcikge1xyXG4gICAgICAgIHJldHVybiBfLnNvbWUodGhpcy5ncmFtbWFycywgeyBzY29wZU5hbWU6IChncmFtbWFyIGFzIGFueSkuc2NvcGVOYW1lIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3BhY2thZ2VEaXI6IHN0cmluZztcclxuICAgIHB1YmxpYyBnZXQgcGFja2FnZURpcigpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX3BhY2thZ2VEaXIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5pbmZvKGBnZXRQYWNrYWdlRGlyUGF0aHM6ICR7YXRvbS5wYWNrYWdlcy5nZXRQYWNrYWdlRGlyUGF0aHMoKX1gKTtcclxuICAgICAgICAgICAgdGhpcy5fcGFja2FnZURpciA9IF8uZmluZChhdG9tLnBhY2thZ2VzLmdldFBhY2thZ2VEaXJQYXRocygpLCBmdW5jdGlvbihwYWNrYWdlUGF0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBwYWNrYWdlUGF0aCAke3BhY2thZ2VQYXRofSBleGlzdHM6ICR7ZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4ocGFja2FnZVBhdGgsIFwib21uaXNoYXJwLWF0b21cIikpfWApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhY2thZ2VQYXRoLCBcIm9tbmlzaGFycC1hdG9tXCIpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBGYWxsYmFjaywgdGhpcyBpcyBmb3IgdW5pdCB0ZXN0aW5nIG9uIHRyYXZpcyBtYWlubHlcclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9wYWNrYWdlRGlyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYWNrYWdlRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi8uLi8uLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5fcGFja2FnZURpcjtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9hdG9tVmVyc2lvbjogU2VtVmVyO1xyXG4gICAgcHVibGljIGdldCBhdG9tVmVyc2lvbigpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2F0b21WZXJzaW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2F0b21WZXJzaW9uID0gbmV3IFNlbVZlcig8YW55PmF0b20uZ2V0VmVyc2lvbigpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0b21WZXJzaW9uO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhdG9tVmVyc2lvbkdyZWF0ZXJUaGFuKHZlcnNpb246IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBzZW12ZXJHdCg8YW55PmF0b20uZ2V0VmVyc2lvbigpLCB2ZXJzaW9uKTtcclxuICAgIH1cclxufVxyXG5cclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5leHBvcnQgY29uc3QgT21uaSA9IG5ldyBPbW5pTWFuYWdlcjtcclxuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
