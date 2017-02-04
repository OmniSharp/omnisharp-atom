'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Omni = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _lodash = require('lodash');

var _omnisharpClient = require('omnisharp-client');

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _rxjs = require('rxjs');

var _semver = require('semver');

var _tsDisposables = require('ts-disposables');

var _metadataEditor = require('./metadata-editor');

var _omnisharpTextEditor = require('./omnisharp-text-editor');

var _solutionManager = require('./solution-manager');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEBOUNCE_TIMEOUT = 100;
var statefulProperties = ['isOff', 'isConnecting', 'isOn', 'isReady', 'isError'];
function wrapEditorObservable(observable) {
    return observable.subscribeOn(_rxjs.Scheduler.async).observeOn(_rxjs.Scheduler.async).filter(function (editor) {
        return !editor || editor && !editor.isDestroyed();
    });
}

var OmniManager = function () {
    function OmniManager() {
        _classCallCheck(this, OmniManager);

        this._underlyingEditors = new Set();
        this._supportedExtensions = ['project.json', '.cs', '.csx'];
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
        this._diagnostics = this._diagnosticsSubject.publishReplay(1).refCount();
        this._diagnosticCountsSubject = new _rxjs.Subject();
        this._diagnosticCounts = this._diagnosticCountsSubject.publishReplay(1).refCount();
        this._diagnosticsByFileSubject = new _rxjs.Subject();
        this._diagnosticsByFile = this._diagnosticsByFileSubject.publishReplay(1).refCount();
        this._isOff = true;
    }

    _createClass(OmniManager, [{
        key: 'activate',
        value: function activate() {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this.disposable.add((0, _metadataEditor.metadataOpener)());
            var editors = this._createTextEditorObservable(this.disposable);
            this._editors = wrapEditorObservable(editors.filter(function (x) {
                return !x.omnisharp.config;
            }));
            this._configEditors = wrapEditorObservable(editors.filter(function (x) {
                return x.omnisharp.config;
            }));
            this.disposable.add(_solutionManager.SolutionManager.activeSolution.subscribe(function (solution) {
                (0, _lodash.each)((0, _lodash.filter)(atom.workspace.getTextEditors(), function (x) {
                    return _this._isOmniSharpEditor(x) && !x.omnisharp;
                }), function (x) {
                    _solutionManager.SolutionManager.getSolutionForEditor(x);
                });
            }));
            _solutionManager.SolutionManager.activate(this._activeEditorOrConfigEditor);
            this.disposable.add(_solutionManager.SolutionManager.solutionAggregateObserver.state.subscribe(function (z) {
                _this._isOff = (0, _lodash.every)(z, function (x) {
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
                return (0, _lodash.flatMap)(data, function (x) {
                    return x.value;
                });
            });
            var codeCheckCountAggregate = this.aggregateListener.listenTo(function (z) {
                return z.model.observe.diagnosticsCounts;
            }).debounceTime(200).map(function (items) {
                var result = {};
                (0, _lodash.each)(items, function (y) {
                    (0, _lodash.each)(y.value, function (x, k) {
                        if (!result[k]) {
                            result[k] = 0;
                        }
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
                (0, _lodash.each)(x, function (z) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = z.value[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var _step$value = _slicedToArray(_step.value, 2),
                                file = _step$value[0],
                                diagnostics = _step$value[1];

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
            this.disposable.add(atom.config.observe('omnisharp-atom.showDiagnosticsForAllSolutions', function (enabled) {
                showDiagnosticsForAllSolutions.next(enabled);
            }));
            this.disposable.add(showDiagnosticsForAllSolutions);
            var baseDiagnostics = _rxjs.Observable.combineLatest(this.activeModel.startWith(null), showDiagnosticsForAllSolutions, showDiagnosticsForAllSolutions.skip(1).startWith(atom.config.get('omnisharp-atom.showDiagnosticsForAllSolutions')), function (model, enabled, wasEnabled) {
                return { model: model, enabled: enabled, wasEnabled: wasEnabled };
            }).filter(function (ctx) {
                return !(ctx.enabled && ctx.wasEnabled === ctx.enabled);
            }).share();
            this.disposable.add(baseDiagnostics.switchMap(function (ctx) {
                var enabled = ctx.enabled,
                    model = ctx.model;

                if (enabled) {
                    return codeCheckAggregate;
                } else if (model) {
                    return model.observe.diagnostics;
                }
                return _rxjs.Observable.of([]);
            }).startWith([]).subscribe(this._diagnosticsSubject), baseDiagnostics.switchMap(function (ctx) {
                var enabled = ctx.enabled,
                    model = ctx.model;

                if (enabled) {
                    return codeCheckCountAggregate;
                } else if (model) {
                    return model.observe.diagnosticsCounts;
                }
                return _rxjs.Observable.empty();
            }).startWith({}).subscribe(this._diagnosticCountsSubject), baseDiagnostics.switchMap(function (ctx) {
                var enabled = ctx.enabled,
                    model = ctx.model;

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
        key: 'dispose',
        value: function dispose() {
            if (_solutionManager.SolutionManager._unitTestMode_) {
                return;
            }
            this.disposable.dispose();
            _solutionManager.SolutionManager.deactivate();
        }
    }, {
        key: 'connect',
        value: function connect() {
            _solutionManager.SolutionManager.connect();
        }
    }, {
        key: 'disconnect',
        value: function disconnect() {
            _solutionManager.SolutionManager.disconnect();
        }
    }, {
        key: 'toggle',
        value: function toggle() {
            if (_solutionManager.SolutionManager.connected) {
                _solutionManager.SolutionManager.disconnect();
            } else {
                _solutionManager.SolutionManager.connect();
            }
        }
    }, {
        key: 'navigateTo',
        value: function navigateTo(response) {
            return _rxjs.Observable.fromPromise(atom.workspace.open(response.FileName, { initialLine: response.Line, initialColumn: response.Column }));
        }
    }, {
        key: 'getFrameworks',
        value: function getFrameworks(projects) {
            var frameworks = (0, _lodash.map)(projects, function (project) {
                return project.indexOf('+') === -1 ? '' : project.split('+')[1];
            }).filter(function (fw) {
                return fw.length > 0;
            });
            return frameworks.join(',');
        }
    }, {
        key: 'addTextEditorCommand',
        value: function addTextEditorCommand(commandName, callback) {
            var _this2 = this;

            return atom.commands.add('atom-text-editor', commandName, function (event) {
                var editor = atom.workspace.getActiveTextEditor();
                if (!editor) {
                    return;
                }
                if ((0, _lodash.some)(_this2._supportedExtensions, function (ext) {
                    return (0, _lodash.endsWith)(editor.getPath(), ext);
                })) {
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    callback(event);
                }
            });
        }
    }, {
        key: 'request',
        value: function request(editor, callback) {
            if ((0, _lodash.isFunction)(editor)) {
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
        key: 'getProject',
        value: function getProject(editor) {
            if ((0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor) && editor.omnisharp.project) {
                return _rxjs.Observable.of(editor.omnisharp.project);
            }
            return _solutionManager.SolutionManager.getSolutionForEditor(editor).flatMap(function (z) {
                return z.model.getProjectForEditor(editor);
            }).take(1);
        }
    }, {
        key: 'getSolutionForProject',
        value: function getSolutionForProject(project) {
            return _rxjs.Observable.of((0, _lodash.first)((0, _lodash.filter)(_solutionManager.SolutionManager.activeSolutions, function (solution) {
                return (0, _lodash.some)(solution.model.projects, function (p) {
                    return p.name === project.name;
                });
            })));
        }
    }, {
        key: 'getSolutionForEditor',
        value: function getSolutionForEditor(editor) {
            if ((0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor)) {
                return _rxjs.Observable.of(editor.omnisharp.solution);
            }
            return _solutionManager.SolutionManager.getSolutionForEditor(editor);
        }
    }, {
        key: 'switchActiveModel',
        value: function switchActiveModel(callback) {
            var _this3 = this;

            var outerCd = new _tsDisposables.CompositeDisposable();
            outerCd.add(this.activeModel.filter(function (z) {
                return !!z;
            }).subscribe(function (model) {
                var cd = new _tsDisposables.CompositeDisposable();
                outerCd.add(cd);
                model.disposable.add(cd);
                cd.add(_this3.activeModel.filter(function (active) {
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
        key: 'switchActiveSolution',
        value: function switchActiveSolution(callback) {
            var _this4 = this;

            var outerCd = new _tsDisposables.CompositeDisposable();
            outerCd.add(this.activeSolution.filter(function (z) {
                return !!z;
            }).subscribe(function (solution) {
                var cd = new _tsDisposables.CompositeDisposable();
                outerCd.add(cd);
                solution.disposable.add(cd);
                cd.add(_this4.activeSolution.filter(function (active) {
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
        key: 'switchActiveEditor',
        value: function switchActiveEditor(callback) {
            var _this5 = this;

            var outerCd = new _tsDisposables.CompositeDisposable();
            outerCd.add(this.activeEditor.filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                var cd = new _tsDisposables.CompositeDisposable();
                outerCd.add(cd);
                editor.omnisharp.solution.disposable.add(cd);
                cd.add(_this5.activeEditor.filter(function (active) {
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
        key: 'whenEditorConnected',
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
        key: 'switchActiveConfigEditor',
        value: function switchActiveConfigEditor(callback) {
            var _this6 = this;

            var outerCd = new _tsDisposables.CompositeDisposable();
            outerCd.add(this.activeConfigEditor.filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                var cd = new _tsDisposables.CompositeDisposable();
                outerCd.add(cd);
                editor.omnisharp.solution.disposable.add(cd);
                cd.add(_this6.activeConfigEditor.filter(function (active) {
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
        key: 'switchActiveEditorOrConfigEditor',
        value: function switchActiveEditorOrConfigEditor(callback) {
            var _this7 = this;

            var outerCd = new _tsDisposables.CompositeDisposable();
            outerCd.add(this.activeEditorOrConfigEditor.filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                var cd = new _tsDisposables.CompositeDisposable();
                outerCd.add(cd);
                cd.add(_this7.activeEditorOrConfigEditor.filter(function (active) {
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
        key: 'eachEditor',
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
        key: 'eachConfigEditor',
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
        key: 'registerConfiguration',
        value: function registerConfiguration(callback) {
            _solutionManager.SolutionManager.registerConfiguration(callback);
        }
    }, {
        key: 'isValidGrammar',
        value: function isValidGrammar(grammar) {
            return (0, _lodash.some)(this.grammars, { scopeName: grammar.scopeName });
        }
    }, {
        key: 'atomVersionGreaterThan',
        value: function atomVersionGreaterThan(version) {
            return (0, _semver.gt)(atom.getVersion(), version);
        }
    }, {
        key: '_isOmniSharpEditor',
        value: function _isOmniSharpEditor(editor) {
            return (0, _lodash.some)(this._supportedExtensions, function (ext) {
                return (0, _lodash.endsWith)(editor.getPath(), ext);
            });
        }
    }, {
        key: '_createTextEditorObservable',
        value: function _createTextEditorObservable(disposable) {
            var _this8 = this;

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
                _this8._underlyingEditors.add(editor);
                editor.omnisharp.config = (0, _lodash.endsWith)(editor.getPath(), 'project.json');
                var dis = _tsDisposables.Disposable.create(function () {
                    _this8._underlyingEditors.delete(editor);
                });
                _this8.disposable.add(dis, editor.onDidDestroy(function () {
                    return dis.dispose();
                }));
                editor.omnisharp.solution.disposable.add(dis);
            }));
            var liveEditors = _omnisharpTextEditor.OmnisharpEditorContext.created;
            return _rxjs.Observable.merge(_rxjs.Observable.defer(function () {
                return _rxjs.Observable.from(_this8._underlyingEditors);
            }), liveEditors);
        }
    }, {
        key: '_createSafeGuard',
        value: function _createSafeGuard(extensions, disposable) {
            var _this9 = this;

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
                    if (nextEditor && _this9._isOmniSharpEditor(nextEditor)) {
                        atom.notifications.addInfo('OmniSharp', { detail: 'Functionality will limited until the file has been saved.' });
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
        key: 'viewModelStatefulProperties',
        get: function get() {
            return statefulProperties;
        }
    }, {
        key: 'diagnostics',
        get: function get() {
            return this._diagnostics;
        }
    }, {
        key: 'diagnosticsCounts',
        get: function get() {
            return this._diagnosticCounts;
        }
    }, {
        key: 'diagnosticsByFile',
        get: function get() {
            return this._diagnosticsByFile;
        }
    }, {
        key: 'isOff',
        get: function get() {
            return this._isOff;
        }
    }, {
        key: 'isOn',
        get: function get() {
            return !this.isOff;
        }
    }, {
        key: 'listener',
        get: function get() {
            return _solutionManager.SolutionManager.solutionObserver;
        }
    }, {
        key: 'aggregateListener',
        get: function get() {
            return _solutionManager.SolutionManager.solutionAggregateObserver;
        }
    }, {
        key: 'solutions',
        get: function get() {
            return _rxjs.Observable.defer(function () {
                return _rxjs.Observable.from(_solutionManager.SolutionManager.activeSolutions);
            });
        }
    }, {
        key: 'activeModel',
        get: function get() {
            return _solutionManager.SolutionManager.activeSolution.map(function (z) {
                return z.model;
            });
        }
    }, {
        key: 'activeSolution',
        get: function get() {
            return _solutionManager.SolutionManager.activeSolution;
        }
    }, {
        key: 'activeEditor',
        get: function get() {
            return this._activeEditor;
        }
    }, {
        key: 'activeConfigEditor',
        get: function get() {
            return this._activeConfigEditor;
        }
    }, {
        key: 'activeEditorOrConfigEditor',
        get: function get() {
            return this._activeEditorOrConfigEditor;
        }
    }, {
        key: 'activeProject',
        get: function get() {
            return this._activeProject;
        }
    }, {
        key: 'activeFramework',
        get: function get() {
            return this._activeFramework;
        }
    }, {
        key: 'editors',
        get: function get() {
            return this._editors;
        }
    }, {
        key: 'configEditors',
        get: function get() {
            return this._configEditors;
        }
    }, {
        key: '_kick_in_the_pants_',
        get: function get() {
            return _solutionManager.SolutionManager._kick_in_the_pants_;
        }
    }, {
        key: 'grammars',
        get: function get() {
            var _this10 = this;

            return (0, _lodash.filter)(atom.grammars.getGrammars(), function (grammar) {
                return (0, _lodash.some)(_this10._supportedExtensions, function (ext) {
                    return (0, _lodash.some)(grammar.fileTypes, function (ft) {
                        return (0, _lodash.trimStart)(ext, '.') === ft;
                    });
                });
            });
        }
    }, {
        key: 'packageDir',
        get: function get() {
            if (!this._packageDir) {
                console.info('getPackageDirPaths: ' + atom.packages.getPackageDirPaths());
                this._packageDir = (0, _lodash.find)(atom.packages.getPackageDirPaths(), function (packagePath) {
                    console.info('packagePath ' + packagePath + ' exists: ' + fs.existsSync(path.join(packagePath, 'omnisharp-atom')));
                    return fs.existsSync(path.join(packagePath, 'omnisharp-atom'));
                });
                if (!this._packageDir) {
                    this._packageDir = path.resolve(__dirname, '../../..');
                }
            }
            return this._packageDir;
        }
    }, {
        key: 'atomVersion',
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvb21uaS50cyJdLCJuYW1lcyI6WyJmcyIsInBhdGgiLCJERUJPVU5DRV9USU1FT1VUIiwic3RhdGVmdWxQcm9wZXJ0aWVzIiwid3JhcEVkaXRvck9ic2VydmFibGUiLCJvYnNlcnZhYmxlIiwic3Vic2NyaWJlT24iLCJhc3luYyIsIm9ic2VydmVPbiIsImZpbHRlciIsImVkaXRvciIsImlzRGVzdHJveWVkIiwiT21uaU1hbmFnZXIiLCJfdW5kZXJseWluZ0VkaXRvcnMiLCJTZXQiLCJfc3VwcG9ydGVkRXh0ZW5zaW9ucyIsIl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QiLCJfYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3IiLCJkZWJvdW5jZVRpbWUiLCJwdWJsaXNoUmVwbGF5IiwicmVmQ291bnQiLCJfYWN0aXZlRWRpdG9yIiwibWFwIiwieCIsIm9tbmlzaGFycCIsImNvbmZpZyIsIl9hY3RpdmVDb25maWdFZGl0b3IiLCJfYWN0aXZlUHJvamVjdCIsInN3aXRjaE1hcCIsInNvbHV0aW9uIiwibW9kZWwiLCJnZXRQcm9qZWN0Rm9yRWRpdG9yIiwiZGlzdGluY3RVbnRpbENoYW5nZWQiLCJfYWN0aXZlRnJhbWV3b3JrIiwicHJvamVjdCIsIm9ic2VydmUiLCJhY3RpdmVGcmFtZXdvcmsiLCJmcmFtZXdvcmsiLCJfZGlhZ25vc3RpY3NTdWJqZWN0IiwiX2RpYWdub3N0aWNzIiwiX2RpYWdub3N0aWNDb3VudHNTdWJqZWN0IiwiX2RpYWdub3N0aWNDb3VudHMiLCJfZGlhZ25vc3RpY3NCeUZpbGVTdWJqZWN0IiwiX2RpYWdub3N0aWNzQnlGaWxlIiwiX2lzT2ZmIiwiZGlzcG9zYWJsZSIsImFkZCIsImVkaXRvcnMiLCJfY3JlYXRlVGV4dEVkaXRvck9ic2VydmFibGUiLCJfZWRpdG9ycyIsIl9jb25maWdFZGl0b3JzIiwiYWN0aXZlU29sdXRpb24iLCJzdWJzY3JpYmUiLCJhdG9tIiwid29ya3NwYWNlIiwiZ2V0VGV4dEVkaXRvcnMiLCJfaXNPbW5pU2hhcnBFZGl0b3IiLCJnZXRTb2x1dGlvbkZvckVkaXRvciIsImFjdGl2YXRlIiwic29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlciIsInN0YXRlIiwieiIsInZhbHVlIiwiRGlzY29ubmVjdGVkIiwiRXJyb3IiLCJkaXMiLCJvYnNlcnZlQWN0aXZlUGFuZUl0ZW0iLCJwYW5lIiwiZ2V0R3JhbW1hciIsImdldFBhdGgiLCJpc1ZhbGlkR3JhbW1hciIsIm9ic2VydmVyIiwibmV4dCIsImRpc3Bvc2UiLCJjb25jYXRNYXAiLCJvZiIsImNyZWF0ZSIsImNvZGVDaGVja0FnZ3JlZ2F0ZSIsImFnZ3JlZ2F0ZUxpc3RlbmVyIiwibGlzdGVuVG8iLCJkaWFnbm9zdGljcyIsImRhdGEiLCJjb2RlQ2hlY2tDb3VudEFnZ3JlZ2F0ZSIsImRpYWdub3N0aWNzQ291bnRzIiwicmVzdWx0IiwiaXRlbXMiLCJ5IiwiayIsImNvZGVDaGVja0J5RmlsZUFnZ3JlZ2F0ZSIsImRpYWdub3N0aWNzQnlGaWxlIiwiTWFwIiwiZmlsZSIsInNldCIsInNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucyIsImVuYWJsZWQiLCJiYXNlRGlhZ25vc3RpY3MiLCJjb21iaW5lTGF0ZXN0IiwiYWN0aXZlTW9kZWwiLCJzdGFydFdpdGgiLCJza2lwIiwiZ2V0Iiwid2FzRW5hYmxlZCIsImN0eCIsInNoYXJlIiwiZW1wdHkiLCJfdW5pdFRlc3RNb2RlXyIsImRlYWN0aXZhdGUiLCJjb25uZWN0IiwiZGlzY29ubmVjdCIsImNvbm5lY3RlZCIsInJlc3BvbnNlIiwiZnJvbVByb21pc2UiLCJvcGVuIiwiRmlsZU5hbWUiLCJpbml0aWFsTGluZSIsIkxpbmUiLCJpbml0aWFsQ29sdW1uIiwiQ29sdW1uIiwicHJvamVjdHMiLCJmcmFtZXdvcmtzIiwiaW5kZXhPZiIsInNwbGl0IiwiZnciLCJsZW5ndGgiLCJqb2luIiwiY29tbWFuZE5hbWUiLCJjYWxsYmFjayIsImNvbW1hbmRzIiwiZ2V0QWN0aXZlVGV4dEVkaXRvciIsImV4dCIsImV2ZW50Iiwic3RvcFByb3BhZ2F0aW9uIiwic3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIiwic29sdXRpb25DYWxsYmFjayIsIndpdGhFZGl0b3IiLCJzb2x1dGlvblJlc3VsdCIsInRha2UiLCJmbGF0TWFwIiwiYWN0aXZlU29sdXRpb25zIiwicCIsIm5hbWUiLCJvdXRlckNkIiwiY2QiLCJhY3RpdmUiLCJyZW1vdmUiLCJhY3RpdmVFZGl0b3IiLCJ3aGVuQ29ubmVjdGVkIiwiYWN0aXZlQ29uZmlnRWRpdG9yIiwiYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3IiLCJvbkRpZERlc3Ryb3kiLCJyZWdpc3RlckNvbmZpZ3VyYXRpb24iLCJncmFtbWFyIiwiZ3JhbW1hcnMiLCJzY29wZU5hbWUiLCJ2ZXJzaW9uIiwiZ2V0VmVyc2lvbiIsInNhZmVHdWFyZCIsIl9jcmVhdGVTYWZlR3VhcmQiLCJvYnNlcnZlVGV4dEVkaXRvcnMiLCJtZXJnZSIsIm1lcmdlTWFwIiwiY3JlYXRlZCIsImRlbGV0ZSIsImxpdmVFZGl0b3JzIiwiZGVmZXIiLCJmcm9tIiwiZXh0ZW5zaW9ucyIsImVkaXRvclN1YmplY3QiLCJlZGl0b3JPYnNlcnZhYmxlIiwiemlwIiwibmV4dEVkaXRvciIsIm5vdGlmaWNhdGlvbnMiLCJhZGRJbmZvIiwiZGV0YWlsIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJkaXNwb3NlciIsIm9uRGlkQ2hhbmdlUGF0aCIsImlzT2ZmIiwic29sdXRpb25PYnNlcnZlciIsIl9raWNrX2luX3RoZV9wYW50c18iLCJnZXRHcmFtbWFycyIsImZpbGVUeXBlcyIsImZ0IiwiX3BhY2thZ2VEaXIiLCJjb25zb2xlIiwiaW5mbyIsInBhY2thZ2VzIiwiZ2V0UGFja2FnZURpclBhdGhzIiwicGFja2FnZVBhdGgiLCJleGlzdHNTeW5jIiwiX19kaXJuYW1lIiwiX2F0b21WZXJzaW9uIiwiT21uaSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFDQTs7SUFBWUEsRTs7QUFDWjs7QUFFQTs7QUFFQTs7SUFBWUMsSTs7QUFDWjs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQTs7Ozs7O0FBSUEsSUFBTUMsbUJBQW1CLEdBQXpCO0FBQ0EsSUFBTUMscUJBQXFCLENBQUMsT0FBRCxFQUFVLGNBQVYsRUFBMEIsTUFBMUIsRUFBa0MsU0FBbEMsRUFBNkMsU0FBN0MsQ0FBM0I7QUFFQSxTQUFBQyxvQkFBQSxDQUE4QkMsVUFBOUIsRUFBMEU7QUFDdEUsV0FBT0EsV0FDRkMsV0FERSxDQUNVLGdCQUFVQyxLQURwQixFQUVGQyxTQUZFLENBRVEsZ0JBQVVELEtBRmxCLEVBR0ZFLE1BSEUsQ0FHSztBQUFBLGVBQVUsQ0FBQ0MsTUFBRCxJQUFXQSxVQUFVLENBQUNBLE9BQU9DLFdBQVAsRUFBaEM7QUFBQSxLQUhMLENBQVA7QUFJSDs7SUFFREMsVztBQUFBLDJCQUFBO0FBQUE7O0FBS1ksYUFBQUMsa0JBQUEsR0FBcUIsSUFBSUMsR0FBSixFQUFyQjtBQUNBLGFBQUFDLG9CQUFBLEdBQXVCLENBQUMsY0FBRCxFQUFpQixLQUFqQixFQUF3QixNQUF4QixDQUF2QjtBQU1BLGFBQUFDLGtDQUFBLEdBQXFDLDBCQUEwQyxJQUExQyxDQUFyQztBQUNBLGFBQUFDLDJCQUFBLEdBQThCYixxQkFBNEQsS0FBS1ksa0NBQWpFLEVBQ2pDRSxZQURpQyxDQUNwQmhCLGdCQURvQixFQUVqQ2lCLGFBRmlDLENBRW5CLENBRm1CLEVBR2pDQyxRQUhpQyxFQUE5QjtBQUtBLGFBQUFDLGFBQUEsR0FBZ0JqQixxQkFBNEQsS0FBS1ksa0NBQWpFLEVBQ25CRSxZQURtQixDQUNOaEIsZ0JBRE0sRUFFbkJvQixHQUZtQixDQUVmO0FBQUEsbUJBQUtDLEtBQUtBLEVBQUVDLFNBQVAsSUFBb0IsQ0FBQ0QsRUFBRUMsU0FBRixDQUFZQyxNQUFqQyxHQUEwQ0YsQ0FBMUMsR0FBOEMsSUFBbkQ7QUFBQSxTQUZlLEVBR25CSixhQUhtQixDQUdMLENBSEssRUFJbkJDLFFBSm1CLEVBQWhCO0FBTUEsYUFBQU0sbUJBQUEsR0FBc0J0QixxQkFBNEQsS0FBS1ksa0NBQWpFLEVBQ3pCRSxZQUR5QixDQUNaaEIsZ0JBRFksRUFFekJvQixHQUZ5QixDQUVyQjtBQUFBLG1CQUFLQyxLQUFLQSxFQUFFQyxTQUFQLElBQW9CRCxFQUFFQyxTQUFGLENBQVlDLE1BQWhDLEdBQXlDRixDQUF6QyxHQUE2QyxJQUFsRDtBQUFBLFNBRnFCLEVBR3pCSixhQUh5QixDQUdYLENBSFcsRUFJekJDLFFBSnlCLEVBQXRCO0FBTUEsYUFBQU8sY0FBQSxHQUFpQixLQUFLViwyQkFBTCxDQUNwQlIsTUFEb0IsQ0FDYjtBQUFBLG1CQUFVQyxVQUFVLENBQUNBLE9BQU9DLFdBQVAsRUFBckI7QUFBQSxTQURhLEVBRXBCaUIsU0FGb0IsQ0FFVjtBQUFBLG1CQUFVbEIsT0FBT2MsU0FBUCxDQUFpQkssUUFBakIsQ0FBMEJDLEtBQTFCLENBQWdDQyxtQkFBaEMsQ0FBb0RyQixNQUFwRCxDQUFWO0FBQUEsU0FGVSxFQUdwQnNCLG9CQUhvQixHQUlwQmIsYUFKb0IsQ0FJTixDQUpNLEVBS3BCQyxRQUxvQixFQUFqQjtBQU9BLGFBQUFhLGdCQUFBLEdBQW1CLEtBQUtoQiwyQkFBTCxDQUN0QlIsTUFEc0IsQ0FDZjtBQUFBLG1CQUFVQyxVQUFVLENBQUNBLE9BQU9DLFdBQVAsRUFBckI7QUFBQSxTQURlLEVBRXRCaUIsU0FGc0IsQ0FFWjtBQUFBLG1CQUFVbEIsT0FBT2MsU0FBUCxDQUFpQkssUUFBakIsQ0FBMEJDLEtBQTFCLENBQWdDQyxtQkFBaEMsQ0FBb0RyQixNQUFwRCxDQUFWO0FBQUEsU0FGWSxFQUd0QmtCLFNBSHNCLENBR1o7QUFBQSxtQkFBV00sUUFBUUMsT0FBUixDQUFnQkMsZUFBM0I7QUFBQSxTQUhZLEVBR2dDLFVBQUNGLE9BQUQsRUFBVUcsU0FBVjtBQUFBLG1CQUF5QixFQUFFSCxnQkFBRixFQUFXRyxvQkFBWCxFQUF6QjtBQUFBLFNBSGhDLEVBSXRCTCxvQkFKc0IsR0FLdEJiLGFBTHNCLENBS1IsQ0FMUSxFQU10QkMsUUFOc0IsRUFBbkI7QUFRQSxhQUFBa0IsbUJBQUEsR0FBc0IsbUJBQXRCO0FBQ0EsYUFBQUMsWUFBQSxHQUFlLEtBQUtELG1CQUFMLENBQXlCbkIsYUFBekIsQ0FBdUMsQ0FBdkMsRUFBMENDLFFBQTFDLEVBQWY7QUFHQSxhQUFBb0Isd0JBQUEsR0FBMkIsbUJBQTNCO0FBQ0EsYUFBQUMsaUJBQUEsR0FBb0IsS0FBS0Qsd0JBQUwsQ0FBOEJyQixhQUE5QixDQUE0QyxDQUE1QyxFQUErQ0MsUUFBL0MsRUFBcEI7QUFHQSxhQUFBc0IseUJBQUEsR0FBNEIsbUJBQTVCO0FBQ0EsYUFBQUMsa0JBQUEsR0FBcUIsS0FBS0QseUJBQUwsQ0FBK0J2QixhQUEvQixDQUE2QyxDQUE3QyxFQUFnREMsUUFBaEQsRUFBckI7QUFHQSxhQUFBd0IsTUFBQSxHQUFTLElBQVQ7QUE0bEJYOzs7O21DQXRsQmtCO0FBQUE7O0FBQ1gsaUJBQUtDLFVBQUwsR0FBa0Isd0NBQWxCO0FBQ0EsaUJBQUtBLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLHFDQUFwQjtBQUVBLGdCQUFNQyxVQUFVLEtBQUtDLDJCQUFMLENBQWlDLEtBQUtILFVBQXRDLENBQWhCO0FBQ0EsaUJBQUtJLFFBQUwsR0FBZ0I3QyxxQkFBcUIyQyxRQUFRdEMsTUFBUixDQUFlO0FBQUEsdUJBQUssQ0FBQ2MsRUFBRUMsU0FBRixDQUFZQyxNQUFsQjtBQUFBLGFBQWYsQ0FBckIsQ0FBaEI7QUFDQSxpQkFBS3lCLGNBQUwsR0FBc0I5QyxxQkFBcUIyQyxRQUFRdEMsTUFBUixDQUFlO0FBQUEsdUJBQUtjLEVBQUVDLFNBQUYsQ0FBWUMsTUFBakI7QUFBQSxhQUFmLENBQXJCLENBQXRCO0FBR0EsaUJBQUtvQixVQUFMLENBQWdCQyxHQUFoQixDQUFvQixpQ0FBZ0JLLGNBQWhCLENBQStCQyxTQUEvQixDQUF5QyxvQkFBUTtBQUNqRSxrQ0FBSyxvQkFBT0MsS0FBS0MsU0FBTCxDQUFlQyxjQUFmLEVBQVAsRUFBd0M7QUFBQSwyQkFBSyxNQUFLQyxrQkFBTCxDQUF3QmpDLENBQXhCLEtBQThCLENBQU9BLEVBQUdDLFNBQTdDO0FBQUEsaUJBQXhDLENBQUwsRUFBc0csYUFBQztBQUNuRyxxREFBZ0JpQyxvQkFBaEIsQ0FBcUNsQyxDQUFyQztBQUNILGlCQUZEO0FBR0gsYUFKbUIsQ0FBcEI7QUFNQSw2Q0FBZ0JtQyxRQUFoQixDQUF5QixLQUFLekMsMkJBQTlCO0FBR0EsaUJBQUs0QixVQUFMLENBQWdCQyxHQUFoQixDQUNJLGlDQUFnQmEseUJBQWhCLENBQTBDQyxLQUExQyxDQUNLUixTQURMLENBQ2UsYUFBQztBQUNSLHNCQUFLUixNQUFMLEdBQWMsbUJBQU1pQixDQUFOLEVBQVM7QUFBQSwyQkFBS3RDLEVBQUV1QyxLQUFGLEtBQVksNkJBQVlDLFlBQXhCLElBQXdDeEMsRUFBRXVDLEtBQUYsS0FBWSw2QkFBWUUsS0FBckU7QUFBQSxpQkFBVCxDQUFkO0FBQ0gsYUFITCxDQURKO0FBTUEsaUJBQUtuQixVQUFMLENBQWdCQyxHQUFoQixDQUNJLHVDQUFrQyxvQkFBUTtBQUN0QyxvQkFBTW1CLE1BQU1aLEtBQUtDLFNBQUwsQ0FBZVkscUJBQWYsQ0FBcUMsVUFBQ0MsSUFBRCxFQUFVO0FBQ3ZELHdCQUFJQSxRQUFRQSxLQUFLQyxVQUFiLElBQTJCRCxLQUFLRSxPQUFoQyxJQUEyQyxNQUFLQyxjQUFMLENBQW9CSCxLQUFLQyxVQUFMLEVBQXBCLENBQS9DLEVBQXVGO0FBQ25GRyxpQ0FBU0MsSUFBVCxDQUErQkwsSUFBL0I7QUFDQTtBQUNIO0FBQ0RJLDZCQUFTQyxJQUFULENBQWMsSUFBZDtBQUNILGlCQU5XLENBQVo7QUFRQSx1QkFBTztBQUFBLDJCQUFNUCxJQUFJUSxPQUFKLEVBQU47QUFBQSxpQkFBUDtBQUNILGFBVkQsRUFXS0MsU0FYTCxDQVdlLGdCQUFJO0FBQ1gsb0JBQUksQ0FBQ1AsSUFBRCxJQUFTLGdEQUFzQkEsSUFBdEIsQ0FBYixFQUEwQztBQUN0QywyQkFBTyxpQkFBV1EsRUFBWCxDQUFjUixJQUFkLENBQVA7QUFDSDtBQUNELHVCQUFPL0QscUJBQ0gsaUNBQWdCcUQsb0JBQWhCLENBQXFDVSxJQUFyQyxFQUNLN0MsR0FETCxDQUNTO0FBQUEsMkJBQTJCNkMsSUFBM0I7QUFBQSxpQkFEVCxDQURHLENBQVA7QUFJSCxhQW5CTCxFQW9CS2YsU0FwQkwsQ0FvQmUsS0FBS3BDLGtDQXBCcEIsQ0FESjtBQXVCQSxpQkFBSzZCLFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CLDBCQUFXOEIsTUFBWCxDQUFrQixZQUFBO0FBQ2xDLHNCQUFLNUQsa0NBQUwsQ0FBd0N3RCxJQUF4QyxDQUE2QyxJQUE3QztBQUNILGFBRm1CLENBQXBCO0FBT0EsZ0JBQU1LLHFCQUFxQixLQUFLQyxpQkFBTCxDQUF1QkMsUUFBdkIsQ0FBZ0M7QUFBQSx1QkFBS2xCLEVBQUUvQixLQUFGLENBQVFLLE9BQVIsQ0FBZ0I2QyxXQUFyQjtBQUFBLGFBQWhDLEVBQ3RCOUQsWUFEc0IsQ0FDVCxHQURTLEVBRXRCSSxHQUZzQixDQUVsQjtBQUFBLHVCQUFRLHFCQUFRMkQsSUFBUixFQUFjO0FBQUEsMkJBQUsxRCxFQUFFdUMsS0FBUDtBQUFBLGlCQUFkLENBQVI7QUFBQSxhQUZrQixDQUEzQjtBQUlBLGdCQUFNb0IsMEJBQTBCLEtBQUtKLGlCQUFMLENBQXVCQyxRQUF2QixDQUFnQztBQUFBLHVCQUFLbEIsRUFBRS9CLEtBQUYsQ0FBUUssT0FBUixDQUFnQmdELGlCQUFyQjtBQUFBLGFBQWhDLEVBQzNCakUsWUFEMkIsQ0FDZCxHQURjLEVBRTNCSSxHQUYyQixDQUV2QixpQkFBSztBQUNOLG9CQUFNOEQsU0FBc0QsRUFBNUQ7QUFDQSxrQ0FBS0MsS0FBTCxFQUFZLGFBQUM7QUFDVCxzQ0FBS0MsRUFBRXhCLEtBQVAsRUFBYyxVQUFDdkMsQ0FBRCxFQUFJZ0UsQ0FBSixFQUFLO0FBQ2YsNEJBQUksQ0FBQ0gsT0FBT0csQ0FBUCxDQUFMLEVBQWdCO0FBQ1pILG1DQUFPRyxDQUFQLElBQVksQ0FBWjtBQUNIO0FBQ0RILCtCQUFPRyxDQUFQLEtBQWFoRSxDQUFiO0FBQ0gscUJBTEQ7QUFNSCxpQkFQRDtBQVFBLHVCQUFPNkQsTUFBUDtBQUNILGFBYjJCLENBQWhDO0FBZUEsZ0JBQU1JLDJCQUEyQixLQUFLVixpQkFBTCxDQUF1QkMsUUFBdkIsQ0FBZ0M7QUFBQSx1QkFBS2xCLEVBQUUvQixLQUFGLENBQVFLLE9BQVIsQ0FBZ0JzRCxpQkFBaEIsQ0FBa0NuRSxHQUFsQyxDQUFzQztBQUFBLDJCQUFLdUMsRUFBRS9CLEtBQUYsQ0FBUTJELGlCQUFiO0FBQUEsaUJBQXRDLENBQUw7QUFBQSxhQUFoQyxFQUM1QnZFLFlBRDRCLENBQ2YsR0FEZSxFQUU1QkksR0FGNEIsQ0FFeEIsYUFBQztBQUNGLG9CQUFNQSxNQUFNLElBQUlvRSxHQUFKLEVBQVo7QUFDQSxrQ0FBS25FLENBQUwsRUFBUSxhQUFDO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQ0wsNkNBQWtDc0MsRUFBRUMsS0FBcEMsOEhBQTJDO0FBQUE7QUFBQSxnQ0FBL0I2QixJQUErQjtBQUFBLGdDQUF6QlgsV0FBeUI7O0FBQ3ZDMUQsZ0NBQUlzRSxHQUFKLENBQVFELElBQVIsRUFBY1gsV0FBZDtBQUNIO0FBSEk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUlSLGlCQUpEO0FBS0EsdUJBQU8xRCxHQUFQO0FBQ0gsYUFWNEIsQ0FBakM7QUFZQSxnQkFBTXVFLGlDQUFpQyx3QkFBMkIsQ0FBM0IsQ0FBdkM7QUFDQSxpQkFBS2hELFVBQUwsQ0FBZ0JDLEdBQWhCLENBQW9CTyxLQUFLNUIsTUFBTCxDQUFZVSxPQUFaLENBQW9CLCtDQUFwQixFQUFxRSxtQkFBTztBQUM1RjBELCtDQUErQnJCLElBQS9CLENBQW9Dc0IsT0FBcEM7QUFDSCxhQUZtQixDQUFwQjtBQUlBLGlCQUFLakQsVUFBTCxDQUFnQkMsR0FBaEIsQ0FBb0IrQyw4QkFBcEI7QUFFQSxnQkFBTUUsa0JBQWtCLGlCQUFXQyxhQUFYLENBQ3BCLEtBQUtDLFdBQUwsQ0FBaUJDLFNBQWpCLENBQTJCLElBQTNCLENBRG9CLEVBRXBCTCw4QkFGb0IsRUFHcEJBLCtCQUNLTSxJQURMLENBQ1UsQ0FEVixFQUVLRCxTQUZMLENBRWU3QyxLQUFLNUIsTUFBTCxDQUFZMkUsR0FBWixDQUF5QiwrQ0FBekIsQ0FGZixDQUhvQixFQU1wQixVQUFDdEUsS0FBRCxFQUFRZ0UsT0FBUixFQUFpQk8sVUFBakI7QUFBQSx1QkFBaUMsRUFBRXZFLFlBQUYsRUFBU2dFLGdCQUFULEVBQWtCTyxzQkFBbEIsRUFBakM7QUFBQSxhQU5vQixFQVFuQjVGLE1BUm1CLENBUVo7QUFBQSx1QkFBUSxFQUFFNkYsSUFBSVIsT0FBSixJQUFlUSxJQUFJRCxVQUFKLEtBQW1CQyxJQUFJUixPQUF4QyxDQUFSO0FBQUEsYUFSWSxFQVNuQlMsS0FUbUIsRUFBeEI7QUFXQSxpQkFBSzFELFVBQUwsQ0FBZ0JDLEdBQWhCLENBQ0lpRCxnQkFDS25FLFNBREwsQ0FDZSxlQUFHO0FBQUEsb0JBQ0ZrRSxPQURFLEdBQ2lCUSxHQURqQixDQUNGUixPQURFO0FBQUEsb0JBQ09oRSxLQURQLEdBQ2lCd0UsR0FEakIsQ0FDT3hFLEtBRFA7O0FBR1Ysb0JBQUlnRSxPQUFKLEVBQWE7QUFDVCwyQkFBT2pCLGtCQUFQO0FBQ0gsaUJBRkQsTUFFTyxJQUFJL0MsS0FBSixFQUFXO0FBQ2QsMkJBQU9BLE1BQU1LLE9BQU4sQ0FBYzZDLFdBQXJCO0FBQ0g7QUFFRCx1QkFBTyxpQkFBV0wsRUFBWCxDQUFjLEVBQWQsQ0FBUDtBQUNILGFBWEwsRUFZS3VCLFNBWkwsQ0FZZSxFQVpmLEVBYUs5QyxTQWJMLENBYWUsS0FBS2QsbUJBYnBCLENBREosRUFlSXlELGdCQUNLbkUsU0FETCxDQUNlLGVBQUc7QUFBQSxvQkFDRmtFLE9BREUsR0FDaUJRLEdBRGpCLENBQ0ZSLE9BREU7QUFBQSxvQkFDT2hFLEtBRFAsR0FDaUJ3RSxHQURqQixDQUNPeEUsS0FEUDs7QUFHVixvQkFBSWdFLE9BQUosRUFBYTtBQUNULDJCQUFPWix1QkFBUDtBQUNILGlCQUZELE1BRU8sSUFBSXBELEtBQUosRUFBVztBQUNkLDJCQUFPQSxNQUFNSyxPQUFOLENBQWNnRCxpQkFBckI7QUFDSDtBQUVELHVCQUFZLGlCQUFXcUIsS0FBWCxFQUFaO0FBQ0gsYUFYTCxFQVlLTixTQVpMLENBWWUsRUFaZixFQWFLOUMsU0FiTCxDQWFlLEtBQUtaLHdCQWJwQixDQWZKLEVBNkJJdUQsZ0JBQ0tuRSxTQURMLENBQ2UsZUFBRztBQUFBLG9CQUNGa0UsT0FERSxHQUNpQlEsR0FEakIsQ0FDRlIsT0FERTtBQUFBLG9CQUNPaEUsS0FEUCxHQUNpQndFLEdBRGpCLENBQ094RSxLQURQOztBQUdWLG9CQUFJZ0UsT0FBSixFQUFhO0FBQ1QsMkJBQU9OLHdCQUFQO0FBQ0gsaUJBRkQsTUFFTyxJQUFJMUQsS0FBSixFQUFXO0FBQ2QsMkJBQU9BLE1BQU1LLE9BQU4sQ0FBY3NELGlCQUFkLENBQWdDbkUsR0FBaEMsQ0FBb0M7QUFBQSwrQkFBS1EsTUFBTTJELGlCQUFYO0FBQUEscUJBQXBDLENBQVA7QUFDSDtBQUVELHVCQUFPLGlCQUFXZCxFQUFYLENBQWMsSUFBSWUsR0FBSixFQUFkLENBQVA7QUFDSCxhQVhMLEVBWUtRLFNBWkwsQ0FZZSxJQUFJUixHQUFKLEVBWmYsRUFhS3RDLFNBYkwsQ0FhZSxLQUFLVix5QkFicEIsQ0E3Qko7QUE0Q0g7OztrQ0FFYTtBQUNWLGdCQUFJLGlDQUFnQitELGNBQXBCLEVBQW9DO0FBQUU7QUFBUztBQUMvQyxpQkFBSzVELFVBQUwsQ0FBZ0I0QixPQUFoQjtBQUNBLDZDQUFnQmlDLFVBQWhCO0FBQ0g7OztrQ0FFYTtBQUFLLDZDQUFnQkMsT0FBaEI7QUFBNEI7OztxQ0FFOUI7QUFBSyw2Q0FBZ0JDLFVBQWhCO0FBQStCOzs7aUNBRXhDO0FBQ1QsZ0JBQUksaUNBQWdCQyxTQUFwQixFQUErQjtBQUMzQixpREFBZ0JELFVBQWhCO0FBQ0gsYUFGRCxNQUVPO0FBQ0gsaURBQWdCRCxPQUFoQjtBQUNIO0FBQ0o7OzttQ0FFaUJHLFEsRUFBNkQ7QUFDM0UsbUJBQU8saUJBQVdDLFdBQVgsQ0FDSDFELEtBQUtDLFNBQUwsQ0FBZTBELElBQWYsQ0FBb0JGLFNBQVNHLFFBQTdCLEVBQTRDLEVBQUVDLGFBQWFKLFNBQVNLLElBQXhCLEVBQThCQyxlQUFlTixTQUFTTyxNQUF0RCxFQUE1QyxDQURHLENBQVA7QUFHSDs7O3NDQUVvQkMsUSxFQUFrQjtBQUNuQyxnQkFBTUMsYUFBYSxpQkFBSUQsUUFBSixFQUFjLFVBQUNwRixPQUFELEVBQWdCO0FBQzdDLHVCQUFPQSxRQUFRc0YsT0FBUixDQUFnQixHQUFoQixNQUF5QixDQUFDLENBQTFCLEdBQThCLEVBQTlCLEdBQW1DdEYsUUFBUXVGLEtBQVIsQ0FBYyxHQUFkLEVBQW1CLENBQW5CLENBQTFDO0FBQ0gsYUFGa0IsRUFFaEJoSCxNQUZnQixDQUVULFVBQUNpSCxFQUFEO0FBQUEsdUJBQWdCQSxHQUFHQyxNQUFILEdBQVksQ0FBNUI7QUFBQSxhQUZTLENBQW5CO0FBR0EsbUJBQU9KLFdBQVdLLElBQVgsQ0FBZ0IsR0FBaEIsQ0FBUDtBQUNIOzs7NkNBRTJCQyxXLEVBQXFCQyxRLEVBQWlDO0FBQUE7O0FBQzlFLG1CQUFPekUsS0FBSzBFLFFBQUwsQ0FBY2pGLEdBQWQsQ0FBa0Isa0JBQWxCLEVBQXNDK0UsV0FBdEMsRUFBbUQsaUJBQUs7QUFDM0Qsb0JBQU1uSCxTQUFTMkMsS0FBS0MsU0FBTCxDQUFlMEUsbUJBQWYsRUFBZjtBQUNBLG9CQUFJLENBQUN0SCxNQUFMLEVBQWE7QUFDVDtBQUNIO0FBRUQsb0JBQUksa0JBQUssT0FBS0ssb0JBQVYsRUFBZ0M7QUFBQSwyQkFBTyxzQkFBU0wsT0FBTzJELE9BQVAsRUFBVCxFQUEyQjRELEdBQTNCLENBQVA7QUFBQSxpQkFBaEMsQ0FBSixFQUE2RTtBQUN6RUMsMEJBQU1DLGVBQU47QUFDQUQsMEJBQU1FLHdCQUFOO0FBQ0FOLDZCQUFTSSxLQUFUO0FBQ0g7QUFDSixhQVhNLENBQVA7QUFZSDs7O2dDQXFDR3hILE0sRUFDQW9ILFEsRUFBZ0Q7QUFDaEQsZ0JBQUksd0JBQVdwSCxNQUFYLENBQUosRUFBd0I7QUFDcEJvSCwyQkFBZ0JwSCxNQUFoQjtBQUNBQSx5QkFBUyxJQUFUO0FBQ0g7QUFFRCxnQkFBSSxDQUFDQSxNQUFMLEVBQWE7QUFDVEEseUJBQVMyQyxLQUFLQyxTQUFMLENBQWUwRSxtQkFBZixFQUFUO0FBQ0g7QUFFRCxnQkFBTUssbUJBQW1CLFNBQW5CQSxnQkFBbUIsQ0FBQ3hHLFFBQUQ7QUFBQSx1QkFBd0JpRyxTQUFTakcsU0FBU3lHLFVBQVQsQ0FBeUI1SCxNQUF6QixDQUFULENBQXhCO0FBQUEsYUFBekI7QUFFQSxnQkFBSTBFLGVBQUo7QUFDQSxnQkFBSTFFLFVBQVUsZ0RBQXNCQSxNQUF0QixDQUFkLEVBQTZDO0FBQ3pDMEUseUJBQVNpRCxpQkFBaUIzSCxPQUFPYyxTQUFQLENBQWlCSyxRQUFsQyxFQUNKMEUsS0FESSxFQUFUO0FBRUFuQix1QkFBT2hDLFNBQVA7QUFDQSx1QkFBT2dDLE1BQVA7QUFDSDtBQUVELGdCQUFJbUQsdUJBQUo7QUFDQSxnQkFBSTdILE1BQUosRUFBWTtBQUNSNkgsaUNBQWlCLGlDQUFnQjlFLG9CQUFoQixDQUFzRC9DLE1BQXRELENBQWpCO0FBQ0gsYUFGRCxNQUVPO0FBQ0g2SCxpQ0FBaUIsaUNBQWdCcEYsY0FBaEIsQ0FBK0JxRixJQUEvQixDQUFvQyxDQUFwQyxDQUFqQjtBQUNIO0FBRURwRCxxQkFBU21ELGVBQ0o5SCxNQURJLENBQ0c7QUFBQSx1QkFBSyxDQUFDLENBQUNvRCxDQUFQO0FBQUEsYUFESCxFQUVKNEUsT0FGSSxDQUVJSixnQkFGSixFQUdKOUIsS0FISSxFQUFUO0FBT0FuQixtQkFBT2hDLFNBQVA7QUFFQSxtQkFBT2dDLE1BQVA7QUFDSDs7O21DQUVpQjFFLE0sRUFBdUI7QUFDckMsZ0JBQUksZ0RBQXNCQSxNQUF0QixLQUFpQ0EsT0FBT2MsU0FBUCxDQUFpQlUsT0FBdEQsRUFBK0Q7QUFDM0QsdUJBQU8saUJBQVd5QyxFQUFYLENBQWNqRSxPQUFPYyxTQUFQLENBQWlCVSxPQUEvQixDQUFQO0FBQ0g7QUFFRCxtQkFBTyxpQ0FBZ0J1QixvQkFBaEIsQ0FBcUMvQyxNQUFyQyxFQUNGK0gsT0FERSxDQUNNO0FBQUEsdUJBQUs1RSxFQUFFL0IsS0FBRixDQUFRQyxtQkFBUixDQUE0QnJCLE1BQTVCLENBQUw7QUFBQSxhQUROLEVBRUY4SCxJQUZFLENBRUcsQ0FGSCxDQUFQO0FBR0g7Ozs4Q0FFNEJ0RyxPLEVBQThCO0FBQ3ZELG1CQUFPLGlCQUFXeUMsRUFBWCxDQUNILG1CQUFNLG9CQUFPLGlDQUFnQitELGVBQXZCLEVBQXdDO0FBQUEsdUJBQVksa0JBQUs3RyxTQUFTQyxLQUFULENBQWV3RixRQUFwQixFQUE4QjtBQUFBLDJCQUFLcUIsRUFBRUMsSUFBRixLQUFXMUcsUUFBUTBHLElBQXhCO0FBQUEsaUJBQTlCLENBQVo7QUFBQSxhQUF4QyxDQUFOLENBREcsQ0FBUDtBQUdIOzs7NkNBRTJCbEksTSxFQUF1QjtBQUMvQyxnQkFBSSxnREFBc0JBLE1BQXRCLENBQUosRUFBbUM7QUFDL0IsdUJBQU8saUJBQVdpRSxFQUFYLENBQWNqRSxPQUFPYyxTQUFQLENBQWlCSyxRQUEvQixDQUFQO0FBQ0g7QUFFRCxtQkFBTyxpQ0FBZ0I0QixvQkFBaEIsQ0FBcUMvQyxNQUFyQyxDQUFQO0FBQ0g7OzswQ0FTd0JvSCxRLEVBQTZEO0FBQUE7O0FBQ2xGLGdCQUFNZSxVQUFVLHdDQUFoQjtBQUNBQSxvQkFBUS9GLEdBQVIsQ0FBWSxLQUFLbUQsV0FBTCxDQUFpQnhGLE1BQWpCLENBQXdCO0FBQUEsdUJBQUssQ0FBQyxDQUFDb0QsQ0FBUDtBQUFBLGFBQXhCLEVBQWtDVCxTQUFsQyxDQUE0QyxpQkFBSztBQUN6RCxvQkFBTTBGLEtBQUssd0NBQVg7QUFDQUQsd0JBQVEvRixHQUFSLENBQVlnRyxFQUFaO0FBQ0FoSCxzQkFBTWUsVUFBTixDQUFpQkMsR0FBakIsQ0FBcUJnRyxFQUFyQjtBQUVBQSxtQkFBR2hHLEdBQUgsQ0FBTyxPQUFLbUQsV0FBTCxDQUFpQnhGLE1BQWpCLENBQXdCO0FBQUEsMkJBQVVzSSxXQUFXakgsS0FBckI7QUFBQSxpQkFBeEIsRUFDRnNCLFNBREUsQ0FDUSxZQUFBO0FBQ1B0QiwwQkFBTWUsVUFBTixDQUFpQm1HLE1BQWpCLENBQXdCRixFQUF4QjtBQUNBRCw0QkFBUUcsTUFBUixDQUFlRixFQUFmO0FBQ0FBLHVCQUFHckUsT0FBSDtBQUNILGlCQUxFLENBQVA7QUFPQXFELHlCQUFTaEcsS0FBVCxFQUFnQmdILEVBQWhCO0FBQ0gsYUFiVyxDQUFaO0FBZUEsbUJBQU9ELE9BQVA7QUFDSDs7OzZDQU0yQmYsUSxFQUErRDtBQUFBOztBQUN2RixnQkFBTWUsVUFBVSx3Q0FBaEI7QUFDQUEsb0JBQVEvRixHQUFSLENBQVksS0FBS0ssY0FBTCxDQUFvQjFDLE1BQXBCLENBQTJCO0FBQUEsdUJBQUssQ0FBQyxDQUFDb0QsQ0FBUDtBQUFBLGFBQTNCLEVBQXFDVCxTQUFyQyxDQUErQyxvQkFBUTtBQUMvRCxvQkFBTTBGLEtBQUssd0NBQVg7QUFDQUQsd0JBQVEvRixHQUFSLENBQVlnRyxFQUFaO0FBQ0FqSCx5QkFBU2dCLFVBQVQsQ0FBb0JDLEdBQXBCLENBQXdCZ0csRUFBeEI7QUFFQUEsbUJBQUdoRyxHQUFILENBQU8sT0FBS0ssY0FBTCxDQUFvQjFDLE1BQXBCLENBQTJCO0FBQUEsMkJBQVVzSSxXQUFXbEgsUUFBckI7QUFBQSxpQkFBM0IsRUFDRnVCLFNBREUsQ0FDUSxZQUFBO0FBQ1B2Qiw2QkFBU2dCLFVBQVQsQ0FBb0JtRyxNQUFwQixDQUEyQkYsRUFBM0I7QUFDQUQsNEJBQVFHLE1BQVIsQ0FBZUYsRUFBZjtBQUNBQSx1QkFBR3JFLE9BQUg7QUFDSCxpQkFMRSxDQUFQO0FBT0FxRCx5QkFBU2pHLFFBQVQsRUFBbUJpSCxFQUFuQjtBQUNILGFBYlcsQ0FBWjtBQWVBLG1CQUFPRCxPQUFQO0FBQ0g7OzsyQ0FNeUJmLFEsRUFBeUU7QUFBQTs7QUFDL0YsZ0JBQU1lLFVBQVUsd0NBQWhCO0FBQ0FBLG9CQUFRL0YsR0FBUixDQUFZLEtBQUttRyxZQUFMLENBQWtCeEksTUFBbEIsQ0FBeUI7QUFBQSx1QkFBSyxDQUFDLENBQUNvRCxDQUFQO0FBQUEsYUFBekIsRUFBbUNULFNBQW5DLENBQTZDLGtCQUFNO0FBQzNELG9CQUFNMEYsS0FBSyx3Q0FBWDtBQUNBRCx3QkFBUS9GLEdBQVIsQ0FBWWdHLEVBQVo7QUFDQXBJLHVCQUFPYyxTQUFQLENBQWlCSyxRQUFqQixDQUEwQmdCLFVBQTFCLENBQXFDQyxHQUFyQyxDQUF5Q2dHLEVBQXpDO0FBRUFBLG1CQUFHaEcsR0FBSCxDQUFPLE9BQUttRyxZQUFMLENBQWtCeEksTUFBbEIsQ0FBeUI7QUFBQSwyQkFBVXNJLFdBQVdySSxNQUFyQjtBQUFBLGlCQUF6QixFQUNGMEMsU0FERSxDQUNRLFlBQUE7QUFDUDFDLDJCQUFPYyxTQUFQLENBQWlCSyxRQUFqQixDQUEwQmdCLFVBQTFCLENBQXFDbUcsTUFBckMsQ0FBNENGLEVBQTVDO0FBQ0FELDRCQUFRRyxNQUFSLENBQWVGLEVBQWY7QUFDQUEsdUJBQUdyRSxPQUFIO0FBQ0gsaUJBTEUsQ0FBUDtBQU9BcUQseUJBQVNwSCxNQUFULEVBQWlCb0ksRUFBakI7QUFDSCxhQWJXLENBQVo7QUFlQSxtQkFBT0QsT0FBUDtBQUNIOzs7NENBRTBCbkksTSxFQUF1QjtBQUM5QyxnQkFBSSxnREFBc0JBLE1BQXRCLENBQUosRUFBbUM7QUFDL0IsdUJBQU9BLE9BQU9jLFNBQVAsQ0FBaUJLLFFBQWpCLENBQ0ZxSCxhQURFLEdBRUY1SCxHQUZFLENBRUU7QUFBQSwyQkFBS1osTUFBTDtBQUFBLGlCQUZGLENBQVA7QUFHSDtBQUVELG1CQUFPLGlDQUFnQitDLG9CQUFoQixDQUFxQy9DLE1BQXJDLEVBQ0YrSCxPQURFLENBQ007QUFBQSx1QkFBWTVHLFNBQVNxSCxhQUFULEVBQVo7QUFBQSxhQUROLEVBQzRDO0FBQUEsdUJBQTRCeEksTUFBNUI7QUFBQSxhQUQ1QyxDQUFQO0FBRUg7OztpREFNK0JvSCxRLEVBQXlFO0FBQUE7O0FBQ3JHLGdCQUFNZSxVQUFVLHdDQUFoQjtBQUNBQSxvQkFBUS9GLEdBQVIsQ0FBWSxLQUFLcUcsa0JBQUwsQ0FBd0IxSSxNQUF4QixDQUErQjtBQUFBLHVCQUFLLENBQUMsQ0FBQ29ELENBQVA7QUFBQSxhQUEvQixFQUF5Q1QsU0FBekMsQ0FBbUQsa0JBQU07QUFDakUsb0JBQU0wRixLQUFLLHdDQUFYO0FBQ0FELHdCQUFRL0YsR0FBUixDQUFZZ0csRUFBWjtBQUNBcEksdUJBQU9jLFNBQVAsQ0FBaUJLLFFBQWpCLENBQTBCZ0IsVUFBMUIsQ0FBcUNDLEdBQXJDLENBQXlDZ0csRUFBekM7QUFFQUEsbUJBQUdoRyxHQUFILENBQU8sT0FBS3FHLGtCQUFMLENBQXdCMUksTUFBeEIsQ0FBK0I7QUFBQSwyQkFBVXNJLFdBQVdySSxNQUFyQjtBQUFBLGlCQUEvQixFQUNGMEMsU0FERSxDQUNRLFlBQUE7QUFDUDFDLDJCQUFPYyxTQUFQLENBQWlCSyxRQUFqQixDQUEwQmdCLFVBQTFCLENBQXFDbUcsTUFBckMsQ0FBNENGLEVBQTVDO0FBQ0FELDRCQUFRRyxNQUFSLENBQWVGLEVBQWY7QUFDQUEsdUJBQUdyRSxPQUFIO0FBQ0gsaUJBTEUsQ0FBUDtBQU9BcUQseUJBQVNwSCxNQUFULEVBQWlCb0ksRUFBakI7QUFDSCxhQWJXLENBQVo7QUFlQSxtQkFBT0QsT0FBUDtBQUNIOzs7eURBTXVDZixRLEVBQXlFO0FBQUE7O0FBQzdHLGdCQUFNZSxVQUFVLHdDQUFoQjtBQUNBQSxvQkFBUS9GLEdBQVIsQ0FBWSxLQUFLc0csMEJBQUwsQ0FBZ0MzSSxNQUFoQyxDQUF1QztBQUFBLHVCQUFLLENBQUMsQ0FBQ29ELENBQVA7QUFBQSxhQUF2QyxFQUFpRFQsU0FBakQsQ0FBMkQsa0JBQU07QUFDekUsb0JBQU0wRixLQUFLLHdDQUFYO0FBQ0FELHdCQUFRL0YsR0FBUixDQUFZZ0csRUFBWjtBQUVBQSxtQkFBR2hHLEdBQUgsQ0FBTyxPQUFLc0csMEJBQUwsQ0FBZ0MzSSxNQUFoQyxDQUF1QztBQUFBLDJCQUFVc0ksV0FBV3JJLE1BQXJCO0FBQUEsaUJBQXZDLEVBQ0YwQyxTQURFLENBQ1EsWUFBQTtBQUNQeUYsNEJBQVFHLE1BQVIsQ0FBZUYsRUFBZjtBQUNBQSx1QkFBR3JFLE9BQUg7QUFDSCxpQkFKRSxDQUFQO0FBTUFxRCx5QkFBU3BILE1BQVQsRUFBaUJvSSxFQUFqQjtBQUNILGFBWFcsQ0FBWjtBQWFBLG1CQUFPRCxPQUFQO0FBQ0g7OzttQ0FrQmlCZixRLEVBQXlFO0FBQ3ZGLGdCQUFNZSxVQUFVLHdDQUFoQjtBQUNBQSxvQkFBUS9GLEdBQVIsQ0FBWSxLQUFLRyxRQUFMLENBQWNHLFNBQWQsQ0FBd0Isa0JBQU07QUFDdEMsb0JBQU0wRixLQUFLLHdDQUFYO0FBQ0FELHdCQUFRL0YsR0FBUixDQUFZZ0csRUFBWjtBQUNBcEksdUJBQU9jLFNBQVAsQ0FBaUJLLFFBQWpCLENBQTBCZ0IsVUFBMUIsQ0FBcUNDLEdBQXJDLENBQXlDZ0csRUFBekM7QUFFQUEsbUJBQUdoRyxHQUFILENBQU9wQyxPQUFPMkksWUFBUCxDQUFxQixZQUFBO0FBQ3hCM0ksMkJBQU9jLFNBQVAsQ0FBaUJLLFFBQWpCLENBQTBCZ0IsVUFBMUIsQ0FBcUNtRyxNQUFyQyxDQUE0Q0YsRUFBNUM7QUFDQUQsNEJBQVFHLE1BQVIsQ0FBZUYsRUFBZjtBQUNBQSx1QkFBR3JFLE9BQUg7QUFDSCxpQkFKTSxDQUFQO0FBTUFxRCx5QkFBU3BILE1BQVQsRUFBaUJvSSxFQUFqQjtBQUNILGFBWlcsQ0FBWjtBQWNBLG1CQUFPRCxPQUFQO0FBQ0g7Ozt5Q0FFdUJmLFEsRUFBeUU7QUFDN0YsZ0JBQU1lLFVBQVUsd0NBQWhCO0FBQ0FBLG9CQUFRL0YsR0FBUixDQUFZLEtBQUtJLGNBQUwsQ0FBb0JFLFNBQXBCLENBQThCLGtCQUFNO0FBQzVDLG9CQUFNMEYsS0FBSyx3Q0FBWDtBQUNBRCx3QkFBUS9GLEdBQVIsQ0FBWWdHLEVBQVo7QUFDQXBJLHVCQUFPYyxTQUFQLENBQWlCSyxRQUFqQixDQUEwQmdCLFVBQTFCLENBQXFDQyxHQUFyQyxDQUF5Q2dHLEVBQXpDO0FBRUFBLG1CQUFHaEcsR0FBSCxDQUFPcEMsT0FBTzJJLFlBQVAsQ0FBcUIsWUFBQTtBQUN4QjNJLDJCQUFPYyxTQUFQLENBQWlCSyxRQUFqQixDQUEwQmdCLFVBQTFCLENBQXFDbUcsTUFBckMsQ0FBNENGLEVBQTVDO0FBQ0FELDRCQUFRRyxNQUFSLENBQWVGLEVBQWY7QUFDQUEsdUJBQUdyRSxPQUFIO0FBQ0gsaUJBSk0sQ0FBUDtBQU1BcUQseUJBQVNwSCxNQUFULEVBQWlCb0ksRUFBakI7QUFDSCxhQVpXLENBQVo7QUFjQSxtQkFBT0QsT0FBUDtBQUNIOzs7OENBRTRCZixRLEVBQXNDO0FBQy9ELDZDQUFnQndCLHFCQUFoQixDQUFzQ3hCLFFBQXRDO0FBQ0g7Ozt1Q0FhcUJ5QixPLEVBQTBCO0FBQzVDLG1CQUFPLGtCQUFLLEtBQUtDLFFBQVYsRUFBb0IsRUFBRUMsV0FBaUJGLFFBQVNFLFNBQTVCLEVBQXBCLENBQVA7QUFDSDs7OytDQXlCNkJDLE8sRUFBZTtBQUN6QyxtQkFBTyxnQkFBY3JHLEtBQUtzRyxVQUFMLEVBQWQsRUFBaUNELE9BQWpDLENBQVA7QUFDSDs7OzJDQUUwQmhKLE0sRUFBdUI7QUFDOUMsbUJBQU8sa0JBQUssS0FBS0ssb0JBQVYsRUFBZ0M7QUFBQSx1QkFBTyxzQkFBU0wsT0FBTzJELE9BQVAsRUFBVCxFQUEyQjRELEdBQTNCLENBQVA7QUFBQSxhQUFoQyxDQUFQO0FBQ0g7OztvREFFbUNwRixVLEVBQStCO0FBQUE7O0FBQy9ELGdCQUFNK0csWUFBWSxLQUFLQyxnQkFBTCxDQUFzQixLQUFLOUksb0JBQTNCLEVBQWlEOEIsVUFBakQsQ0FBbEI7QUFFQSxnQkFBTWlILHFCQUFxQix1Q0FBa0Msb0JBQVE7QUFDakUsb0JBQU03RixNQUFNWixLQUFLQyxTQUFMLENBQWV3RyxrQkFBZixDQUFrQyxVQUFDcEosTUFBRCxFQUF3QjtBQUNsRTZELDZCQUFTQyxJQUFULENBQWM5RCxNQUFkO0FBQ0gsaUJBRlcsQ0FBWjtBQUlBLHVCQUFPO0FBQUEsMkJBQU11RCxJQUFJUSxPQUFKLEVBQU47QUFBQSxpQkFBUDtBQUNILGFBTjBCLEVBTXhCOEIsS0FOd0IsRUFBM0I7QUFRQSxpQkFBSzFELFVBQUwsQ0FBZ0JDLEdBQWhCLENBQ0ksaUJBQVdpSCxLQUFYLENBQWlCRCxtQkFBbUJySixNQUFuQixDQUEwQjtBQUFBLHVCQUFLLENBQUMsQ0FBQ2MsRUFBRThDLE9BQUYsRUFBUDtBQUFBLGFBQTFCLENBQWpCLEVBQWdFdUYsU0FBaEUsRUFDS0ksUUFETCxDQUNjO0FBQUEsdUJBQVUsaUNBQWdCdkcsb0JBQWhCLENBQXFDL0MsTUFBckMsQ0FBVjtBQUFBLGFBRGQsRUFDc0UsVUFBQ0EsTUFBRCxFQUFTbUIsUUFBVDtBQUFBLHVCQUE0Q25CLE1BQTVDO0FBQUEsYUFEdEUsRUFFSzBDLFNBRkwsRUFESixFQUlJLDRDQUF1QjZHLE9BQXZCLENBQ0s3RyxTQURMLENBQ2Usa0JBQU07QUFDYix1QkFBS3ZDLGtCQUFMLENBQXdCaUMsR0FBeEIsQ0FBNEJwQyxNQUE1QjtBQUNBQSx1QkFBT2MsU0FBUCxDQUFpQkMsTUFBakIsR0FBMEIsc0JBQVNmLE9BQU8yRCxPQUFQLEVBQVQsRUFBMkIsY0FBM0IsQ0FBMUI7QUFFQSxvQkFBTUosTUFBTSwwQkFBV1csTUFBWCxDQUFrQixZQUFBO0FBQzFCLDJCQUFLL0Qsa0JBQUwsQ0FBd0JxSixNQUF4QixDQUErQnhKLE1BQS9CO0FBQ0gsaUJBRlcsQ0FBWjtBQUlBLHVCQUFLbUMsVUFBTCxDQUFnQkMsR0FBaEIsQ0FDSW1CLEdBREosRUFFSXZELE9BQU8ySSxZQUFQLENBQW9CO0FBQUEsMkJBQU1wRixJQUFJUSxPQUFKLEVBQU47QUFBQSxpQkFBcEIsQ0FGSjtBQUtBL0QsdUJBQU9jLFNBQVAsQ0FBaUJLLFFBQWpCLENBQTBCZ0IsVUFBMUIsQ0FBcUNDLEdBQXJDLENBQXlDbUIsR0FBekM7QUFDSCxhQWZMLENBSko7QUFzQkEsZ0JBQU1rRyxjQUFjLDRDQUF1QkYsT0FBM0M7QUFDQSxtQkFBTyxpQkFBV0YsS0FBWCxDQUNILGlCQUFXSyxLQUFYLENBQWlCO0FBQUEsdUJBQU0saUJBQVdDLElBQVgsQ0FBMkMsT0FBS3hKLGtCQUFoRCxDQUFOO0FBQUEsYUFBakIsQ0FERyxFQUVIc0osV0FGRyxDQUFQO0FBSUg7Ozt5Q0FFd0JHLFUsRUFBc0J6SCxVLEVBQStCO0FBQUE7O0FBQzFFLGdCQUFNMEgsZ0JBQWdCLG1CQUF0QjtBQUVBMUgsdUJBQVdDLEdBQVgsQ0FBZU8sS0FBS0MsU0FBTCxDQUFlWSxxQkFBZixDQUFxQyxVQUFDQyxJQUFEO0FBQUEsdUJBQWVvRyxjQUFjL0YsSUFBZCxDQUFtQkwsSUFBbkIsQ0FBZjtBQUFBLGFBQXJDLENBQWY7QUFDQSxnQkFBTXFHLG1CQUFtQkQsY0FBYzlKLE1BQWQsQ0FBcUI7QUFBQSx1QkFBS29ELEtBQUssQ0FBQyxDQUFDQSxFQUFFTyxVQUFkO0FBQUEsYUFBckIsRUFBK0M4QixTQUEvQyxDQUF5RCxJQUF6RCxDQUF6QjtBQUVBLG1CQUFPLGlCQUFXdUUsR0FBWCxDQUFlRCxnQkFBZixFQUFpQ0EsaUJBQWlCckUsSUFBakIsQ0FBc0IsQ0FBdEIsQ0FBakMsRUFBMkQsVUFBQ3pGLE1BQUQsRUFBU2dLLFVBQVQ7QUFBQSx1QkFBeUIsRUFBRWhLLGNBQUYsRUFBVWdLLHNCQUFWLEVBQXpCO0FBQUEsYUFBM0QsRUFDRnhKLFlBREUsQ0FDVyxFQURYLEVBRUZVLFNBRkUsQ0FFUSxnQkFBZTtBQUFBLG9CQUFaOEksVUFBWSxRQUFaQSxVQUFZOztBQUN0QixvQkFBTXpLLE9BQU95SyxXQUFXckcsT0FBWCxFQUFiO0FBQ0Esb0JBQUksQ0FBQ3BFLElBQUwsRUFBVztBQUVQLHdCQUFJeUssY0FBYyxPQUFLbEgsa0JBQUwsQ0FBd0JrSCxVQUF4QixDQUFsQixFQUF1RDtBQUNuRHJILDZCQUFLc0gsYUFBTCxDQUFtQkMsT0FBbkIsQ0FBMkIsV0FBM0IsRUFBd0MsRUFBRUMsUUFBUSwyREFBVixFQUF4QztBQUNIO0FBRUQsMkJBQU8sSUFBSUMsT0FBSixDQUE2QixVQUFDQyxPQUFELEVBQVVDLE1BQVYsRUFBZ0I7QUFDaEQsNEJBQU1DLFdBQVdQLFdBQVdRLGVBQVgsQ0FBMkIsWUFBQTtBQUN4Q0gsb0NBQVFMLFVBQVI7QUFDQU8scUNBQVN4RyxPQUFUO0FBQ0gseUJBSGdCLENBQWpCO0FBSUgscUJBTE0sQ0FBUDtBQU1IO0FBRUQsdUJBQU9xRyxRQUFRQyxPQUFSLENBQWdCLElBQWhCLENBQVA7QUFDSCxhQW5CRSxFQW9CRnRLLE1BcEJFLENBb0JLO0FBQUEsdUJBQUssQ0FBQyxDQUFDYyxDQUFQO0FBQUEsYUFwQkwsQ0FBUDtBQXFCSDs7OzRCQTFvQnFDO0FBQUssbUJBQU9wQixrQkFBUDtBQUE0Qjs7OzRCQXFDakQ7QUFBSyxtQkFBTyxLQUFLb0MsWUFBWjtBQUEyQjs7OzRCQUkxQjtBQUFLLG1CQUFPLEtBQUtFLGlCQUFaO0FBQWdDOzs7NEJBSXJDO0FBQUssbUJBQU8sS0FBS0Usa0JBQVo7QUFBaUM7Ozs0QkFJbEQ7QUFBSyxtQkFBTyxLQUFLQyxNQUFaO0FBQXFCOzs7NEJBQzNCO0FBQUssbUJBQU8sQ0FBQyxLQUFLdUksS0FBYjtBQUFxQjs7OzRCQTJNdEI7QUFDZixtQkFBTyxpQ0FBZ0JDLGdCQUF2QjtBQUNIOzs7NEJBTTJCO0FBQ3hCLG1CQUFPLGlDQUFnQnpILHlCQUF2QjtBQUNIOzs7NEJBTW1CO0FBQ2hCLG1CQUFPLGlCQUFXeUcsS0FBWCxDQUFpQjtBQUFBLHVCQUFNLGlCQUFXQyxJQUFYLENBQTBCLGlDQUFnQjNCLGVBQTFDLENBQU47QUFBQSxhQUFqQixDQUFQO0FBQ0g7Ozs0QkErRXFCO0FBQ2xCLG1CQUFPLGlDQUFnQnZGLGNBQWhCLENBQStCN0IsR0FBL0IsQ0FBbUM7QUFBQSx1QkFBS3VDLEVBQUUvQixLQUFQO0FBQUEsYUFBbkMsQ0FBUDtBQUNIOzs7NEJBc0J3QjtBQUNyQixtQkFBTyxpQ0FBZ0JxQixjQUF2QjtBQUNIOzs7NEJBc0JzQjtBQUNuQixtQkFBTyxLQUFLOUIsYUFBWjtBQUNIOzs7NEJBaUM0QjtBQUN6QixtQkFBTyxLQUFLSyxtQkFBWjtBQUNIOzs7NEJBc0JvQztBQUNqQyxtQkFBTyxLQUFLVCwyQkFBWjtBQUNIOzs7NEJBb0J1QjtBQUNwQixtQkFBTyxLQUFLVSxjQUFaO0FBQ0g7Ozs0QkFFeUI7QUFDdEIsbUJBQU8sS0FBS00sZ0JBQVo7QUFDSDs7OzRCQUVpQjtBQUNkLG1CQUFPLEtBQUtnQixRQUFaO0FBQ0g7Ozs0QkFFdUI7QUFDcEIsbUJBQU8sS0FBS0MsY0FBWjtBQUNIOzs7NEJBNEM4QjtBQUMzQixtQkFBTyxpQ0FBZ0JtSSxtQkFBdkI7QUFDSDs7OzRCQUVrQjtBQUFBOztBQUNmLG1CQUFPLG9CQUFPaEksS0FBS21HLFFBQUwsQ0FBYzhCLFdBQWQsRUFBUCxFQUNIO0FBQUEsdUJBQVcsa0JBQUssUUFBS3ZLLG9CQUFWLEVBQ1A7QUFBQSwyQkFBTyxrQkFBV3dJLFFBQVNnQyxTQUFwQixFQUNIO0FBQUEsK0JBQU0sdUJBQVV0RCxHQUFWLEVBQWUsR0FBZixNQUF3QnVELEVBQTlCO0FBQUEscUJBREcsQ0FBUDtBQUFBLGlCQURPLENBQVg7QUFBQSxhQURHLENBQVA7QUFJSDs7OzRCQU1vQjtBQUNqQixnQkFBSSxDQUFDLEtBQUtDLFdBQVYsRUFBdUI7QUFDbkJDLHdCQUFRQyxJQUFSLDBCQUFvQ3RJLEtBQUt1SSxRQUFMLENBQWNDLGtCQUFkLEVBQXBDO0FBQ0EscUJBQUtKLFdBQUwsR0FBbUIsa0JBQUtwSSxLQUFLdUksUUFBTCxDQUFjQyxrQkFBZCxFQUFMLEVBQXlDLHVCQUFXO0FBQ25FSCw0QkFBUUMsSUFBUixrQkFBNEJHLFdBQTVCLGlCQUFtRDlMLEdBQUcrTCxVQUFILENBQWM5TCxLQUFLMkgsSUFBTCxDQUFVa0UsV0FBVixFQUF1QixnQkFBdkIsQ0FBZCxDQUFuRDtBQUNBLDJCQUFPOUwsR0FBRytMLFVBQUgsQ0FBYzlMLEtBQUsySCxJQUFMLENBQVVrRSxXQUFWLEVBQXVCLGdCQUF2QixDQUFkLENBQVA7QUFDSCxpQkFIa0IsQ0FBbkI7QUFNQSxvQkFBSSxDQUFDLEtBQUtMLFdBQVYsRUFBdUI7QUFDbkIseUJBQUtBLFdBQUwsR0FBbUJ4TCxLQUFLOEssT0FBTCxDQUFhaUIsU0FBYixFQUF3QixVQUF4QixDQUFuQjtBQUNIO0FBQ0o7QUFDRCxtQkFBTyxLQUFLUCxXQUFaO0FBQ0g7Ozs0QkFFcUI7QUFDbEIsZ0JBQUksQ0FBQyxLQUFLUSxZQUFWLEVBQXdCO0FBQ3BCLHFCQUFLQSxZQUFMLEdBQW9CLG1CQUFnQjVJLEtBQUtzRyxVQUFMLEVBQWhCLENBQXBCO0FBQ0g7QUFDRCxtQkFBTyxLQUFLc0MsWUFBWjtBQUNIOzs7Ozs7QUFpRkUsSUFBTUMsc0JBQU8sSUFBSXRMLFdBQUosRUFBYiIsImZpbGUiOiJsaWIvc2VydmVyL29tbmkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bWF4LWZpbGUtbGluZS1jb3VudFxyXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCB7IGVhY2gsIGVuZHNXaXRoLCBldmVyeSwgZmlsdGVyLCBmaW5kLCBmaXJzdCwgZmxhdE1hcCwgaXNGdW5jdGlvbiwgbWFwLCBzb21lLCB0cmltU3RhcnQgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBNb2RlbHMgfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHsgRHJpdmVyU3RhdGUgfSBmcm9tICdvbW5pc2hhcnAtY2xpZW50JztcclxuaW1wb3J0IHsgY3JlYXRlT2JzZXJ2YWJsZSB9IGZyb20gJ29tbmlzaGFycC1jbGllbnQnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBCZWhhdmlvclN1YmplY3QsIE9ic2VydmFibGUsIFJlcGxheVN1YmplY3QsIFNjaGVkdWxlciwgU3ViamVjdCB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBndCBhcyBzZW12ZXJHdCwgU2VtVmVyIH0gZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGUgfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcbmltcG9ydCB7IG1ldGFkYXRhT3BlbmVyIH0gZnJvbSAnLi9tZXRhZGF0YS1lZGl0b3InO1xyXG5pbXBvcnQgeyBpc09tbmlzaGFycFRleHRFZGl0b3IsIE9tbmlzaGFycEVkaXRvckNvbnRleHQsIElPbW5pc2hhcnBUZXh0RWRpdG9yIH0gZnJvbSAnLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3InO1xyXG5pbXBvcnQgeyBQcm9qZWN0Vmlld01vZGVsIH0gZnJvbSAnLi9wcm9qZWN0LXZpZXctbW9kZWwnO1xyXG5pbXBvcnQgeyBTb2x1dGlvbiB9IGZyb20gJy4vc29sdXRpb24nO1xyXG5pbXBvcnQgeyBTb2x1dGlvbk1hbmFnZXIgfSBmcm9tICcuL3NvbHV0aW9uLW1hbmFnZXInO1xyXG5pbXBvcnQgeyBWaWV3TW9kZWwgfSBmcm9tICcuL3ZpZXctbW9kZWwnO1xyXG5cclxuLy8gVGltZSB3ZSB3YWl0IHRvIHRyeSBhbmQgZG8gb3VyIGFjdGl2ZSBzd2l0Y2ggdGFza3MuXHJcbmNvbnN0IERFQk9VTkNFX1RJTUVPVVQgPSAxMDA7XHJcbmNvbnN0IHN0YXRlZnVsUHJvcGVydGllcyA9IFsnaXNPZmYnLCAnaXNDb25uZWN0aW5nJywgJ2lzT24nLCAnaXNSZWFkeScsICdpc0Vycm9yJ107XHJcblxyXG5mdW5jdGlvbiB3cmFwRWRpdG9yT2JzZXJ2YWJsZShvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPElPbW5pc2hhcnBUZXh0RWRpdG9yPikge1xyXG4gICAgcmV0dXJuIG9ic2VydmFibGVcclxuICAgICAgICAuc3Vic2NyaWJlT24oU2NoZWR1bGVyLmFzeW5jKVxyXG4gICAgICAgIC5vYnNlcnZlT24oU2NoZWR1bGVyLmFzeW5jKVxyXG4gICAgICAgIC5maWx0ZXIoZWRpdG9yID0+ICFlZGl0b3IgfHwgZWRpdG9yICYmICFlZGl0b3IuaXNEZXN0cm95ZWQoKSk7XHJcbn1cclxuXHJcbmNsYXNzIE9tbmlNYW5hZ2VyIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIHByaXZhdGUgX2VkaXRvcnM6IE9ic2VydmFibGU8SU9tbmlzaGFycFRleHRFZGl0b3I+O1xyXG4gICAgcHJpdmF0ZSBfY29uZmlnRWRpdG9yczogT2JzZXJ2YWJsZTxJT21uaXNoYXJwVGV4dEVkaXRvcj47XHJcbiAgICBwcml2YXRlIF91bmRlcmx5aW5nRWRpdG9ycyA9IG5ldyBTZXQ8SU9tbmlzaGFycFRleHRFZGl0b3I+KCk7XHJcbiAgICBwcml2YXRlIF9zdXBwb3J0ZWRFeHRlbnNpb25zID0gWydwcm9qZWN0Lmpzb24nLCAnLmNzJywgJy5jc3gnXTtcclxuICAgIHByaXZhdGUgX3BhY2thZ2VEaXI6IHN0cmluZztcclxuICAgIHByaXZhdGUgX2F0b21WZXJzaW9uOiBTZW1WZXI7XHJcblxyXG4gICAgcHVibGljIGdldCB2aWV3TW9kZWxTdGF0ZWZ1bFByb3BlcnRpZXMoKSB7IHJldHVybiBzdGF0ZWZ1bFByb3BlcnRpZXM7IH1cclxuXHJcbiAgICBwcml2YXRlIF9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QgPSBuZXcgQmVoYXZpb3JTdWJqZWN0PElPbW5pc2hhcnBUZXh0RWRpdG9yPihudWxsKTtcclxuICAgIHByaXZhdGUgX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yID0gd3JhcEVkaXRvck9ic2VydmFibGUoPE9ic2VydmFibGU8SU9tbmlzaGFycFRleHRFZGl0b3I+Pjxhbnk+dGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KVxyXG4gICAgICAgIC5kZWJvdW5jZVRpbWUoREVCT1VOQ0VfVElNRU9VVClcclxuICAgICAgICAucHVibGlzaFJlcGxheSgxKVxyXG4gICAgICAgIC5yZWZDb3VudCgpO1xyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2ZUVkaXRvciA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKDxPYnNlcnZhYmxlPElPbW5pc2hhcnBUZXh0RWRpdG9yPj48YW55PnRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yU3ViamVjdClcclxuICAgICAgICAuZGVib3VuY2VUaW1lKERFQk9VTkNFX1RJTUVPVVQpXHJcbiAgICAgICAgLm1hcCh4ID0+IHggJiYgeC5vbW5pc2hhcnAgJiYgIXgub21uaXNoYXJwLmNvbmZpZyA/IHggOiBudWxsKVxyXG4gICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXHJcbiAgICAgICAgLnJlZkNvdW50KCk7XHJcblxyXG4gICAgcHJpdmF0ZSBfYWN0aXZlQ29uZmlnRWRpdG9yID0gd3JhcEVkaXRvck9ic2VydmFibGUoPE9ic2VydmFibGU8SU9tbmlzaGFycFRleHRFZGl0b3I+Pjxhbnk+dGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KVxyXG4gICAgICAgIC5kZWJvdW5jZVRpbWUoREVCT1VOQ0VfVElNRU9VVClcclxuICAgICAgICAubWFwKHggPT4geCAmJiB4Lm9tbmlzaGFycCAmJiB4Lm9tbmlzaGFycC5jb25maWcgPyB4IDogbnVsbClcclxuICAgICAgICAucHVibGlzaFJlcGxheSgxKVxyXG4gICAgICAgIC5yZWZDb3VudCgpO1xyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2ZVByb2plY3QgPSB0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclxyXG4gICAgICAgIC5maWx0ZXIoZWRpdG9yID0+IGVkaXRvciAmJiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpXHJcbiAgICAgICAgLnN3aXRjaE1hcChlZGl0b3IgPT4gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5tb2RlbC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikpXHJcbiAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKClcclxuICAgICAgICAucHVibGlzaFJlcGxheSgxKVxyXG4gICAgICAgIC5yZWZDb3VudCgpO1xyXG5cclxuICAgIHByaXZhdGUgX2FjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yXHJcbiAgICAgICAgLmZpbHRlcihlZGl0b3IgPT4gZWRpdG9yICYmICFlZGl0b3IuaXNEZXN0cm95ZWQoKSlcclxuICAgICAgICAuc3dpdGNoTWFwKGVkaXRvciA9PiBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLm1vZGVsLmdldFByb2plY3RGb3JFZGl0b3IoZWRpdG9yKSlcclxuICAgICAgICAuc3dpdGNoTWFwKHByb2plY3QgPT4gcHJvamVjdC5vYnNlcnZlLmFjdGl2ZUZyYW1ld29yaywgKHByb2plY3QsIGZyYW1ld29yaykgPT4gKHsgcHJvamVjdCwgZnJhbWV3b3JrIH0pKVxyXG4gICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpXHJcbiAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcclxuICAgICAgICAucmVmQ291bnQoKTtcclxuXHJcbiAgICBwcml2YXRlIF9kaWFnbm9zdGljc1N1YmplY3QgPSBuZXcgU3ViamVjdDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KCk7XHJcbiAgICBwcml2YXRlIF9kaWFnbm9zdGljcyA9IHRoaXMuX2RpYWdub3N0aWNzU3ViamVjdC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XHJcbiAgICBwdWJsaWMgZ2V0IGRpYWdub3N0aWNzKCkgeyByZXR1cm4gdGhpcy5fZGlhZ25vc3RpY3M7IH1cclxuXHJcbiAgICBwcml2YXRlIF9kaWFnbm9zdGljQ291bnRzU3ViamVjdCA9IG5ldyBTdWJqZWN0PHsgW2tleTogc3RyaW5nXTogbnVtYmVyOyB9PigpO1xyXG4gICAgcHJpdmF0ZSBfZGlhZ25vc3RpY0NvdW50cyA9IHRoaXMuX2RpYWdub3N0aWNDb3VudHNTdWJqZWN0LnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcclxuICAgIHB1YmxpYyBnZXQgZGlhZ25vc3RpY3NDb3VudHMoKSB7IHJldHVybiB0aGlzLl9kaWFnbm9zdGljQ291bnRzOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBfZGlhZ25vc3RpY3NCeUZpbGVTdWJqZWN0ID0gbmV3IFN1YmplY3Q8TWFwPHN0cmluZywgTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPj4oKTtcclxuICAgIHByaXZhdGUgX2RpYWdub3N0aWNzQnlGaWxlID0gdGhpcy5fZGlhZ25vc3RpY3NCeUZpbGVTdWJqZWN0LnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcclxuICAgIHB1YmxpYyBnZXQgZGlhZ25vc3RpY3NCeUZpbGUoKSB7IHJldHVybiB0aGlzLl9kaWFnbm9zdGljc0J5RmlsZTsgfVxyXG5cclxuICAgIHByaXZhdGUgX2lzT2ZmID0gdHJ1ZTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0IGlzT2ZmKCkgeyByZXR1cm4gdGhpcy5faXNPZmY7IH1cclxuICAgIHB1YmxpYyBnZXQgaXNPbigpIHsgcmV0dXJuICF0aGlzLmlzT2ZmOyB9XHJcblxyXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm1heC1mdW5jLWJvZHktbGVuZ3RoXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKG1ldGFkYXRhT3BlbmVyKCkpO1xyXG5cclxuICAgICAgICBjb25zdCBlZGl0b3JzID0gdGhpcy5fY3JlYXRlVGV4dEVkaXRvck9ic2VydmFibGUodGhpcy5kaXNwb3NhYmxlKTtcclxuICAgICAgICB0aGlzLl9lZGl0b3JzID0gd3JhcEVkaXRvck9ic2VydmFibGUoZWRpdG9ycy5maWx0ZXIoeCA9PiAheC5vbW5pc2hhcnAuY29uZmlnKSk7XHJcbiAgICAgICAgdGhpcy5fY29uZmlnRWRpdG9ycyA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKGVkaXRvcnMuZmlsdGVyKHggPT4geC5vbW5pc2hhcnAuY29uZmlnKSk7XHJcblxyXG4gICAgICAgIC8vIFJlc3RvcmUgc29sdXRpb25zIGFmdGVyIHRoZSBzZXJ2ZXIgd2FzIGRpc2Nvbm5lY3RlZFxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uLnN1YnNjcmliZShzb2x1dGlvbiA9PiB7XHJcbiAgICAgICAgICAgIGVhY2goZmlsdGVyKGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCksIHggPT4gdGhpcy5faXNPbW5pU2hhcnBFZGl0b3IoeCkgJiYgISg8YW55PngpLm9tbmlzaGFycCksIHggPT4ge1xyXG4gICAgICAgICAgICAgICAgU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKHgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIFNvbHV0aW9uTWFuYWdlci5hY3RpdmF0ZSh0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvcik7XHJcblxyXG4gICAgICAgIC8vIHdlIGFyZSBvbmx5IG9mZiBpZiBhbGwgb3VyIHNvbHV0aW9ucyBhcmUgZGlzY29ubmN0ZWQgb3IgZXJyb2VkLlxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIFNvbHV0aW9uTWFuYWdlci5zb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyLnN0YXRlXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHogPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2lzT2ZmID0gZXZlcnkoeiwgeCA9PiB4LnZhbHVlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQgfHwgeC52YWx1ZSA9PT0gRHJpdmVyU3RhdGUuRXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBjcmVhdGVPYnNlcnZhYmxlPEF0b20uVGV4dEVkaXRvcj4ob2JzZXJ2ZXIgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGlzID0gYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKChwYW5lOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocGFuZSAmJiBwYW5lLmdldEdyYW1tYXIgJiYgcGFuZS5nZXRQYXRoICYmIHRoaXMuaXNWYWxpZEdyYW1tYXIocGFuZS5nZXRHcmFtbWFyKCkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLm5leHQoPEF0b20uVGV4dEVkaXRvcj5wYW5lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5uZXh0KG51bGwpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuICgpID0+IGRpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKHBhbmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFuZSB8fCBpc09tbmlzaGFycFRleHRFZGl0b3IocGFuZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YocGFuZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3cmFwRWRpdG9yT2JzZXJ2YWJsZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKHBhbmUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKHggPT4gPElPbW5pc2hhcnBUZXh0RWRpdG9yPnBhbmUpXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yU3ViamVjdCkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0Lm5leHQobnVsbCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAvLyBDYWNoZSB0aGlzIHJlc3VsdCwgYmVjYXVzZSB0aGUgdW5kZXJseWluZyBpbXBsZW1lbnRhdGlvbiBvZiBvYnNlcnZlIHdpbGxcclxuICAgICAgICAvLyAgICBjcmVhdGUgYSBjYWNoZSBvZiB0aGUgbGFzdCByZWNpZXZlZCB2YWx1ZS4gIFRoaXMgYWxsb3dzIHVzIHRvIHBpY2sgcGlja1xyXG4gICAgICAgIC8vICAgIHVwIGZyb20gd2hlcmUgd2UgbGVmdCBvZmYuXHJcbiAgICAgICAgY29uc3QgY29kZUNoZWNrQWdncmVnYXRlID0gdGhpcy5hZ2dyZWdhdGVMaXN0ZW5lci5saXN0ZW5Ubyh6ID0+IHoubW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljcylcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgyMDApXHJcbiAgICAgICAgICAgIC5tYXAoZGF0YSA9PiBmbGF0TWFwKGRhdGEsIHggPT4geC52YWx1ZSkpO1xyXG5cclxuICAgICAgICBjb25zdCBjb2RlQ2hlY2tDb3VudEFnZ3JlZ2F0ZSA9IHRoaXMuYWdncmVnYXRlTGlzdGVuZXIubGlzdGVuVG8oeiA9PiB6Lm1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3NDb3VudHMpXHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwKVxyXG4gICAgICAgICAgICAubWFwKGl0ZW1zID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdDogdHlwZW9mIFZpZXdNb2RlbC5wcm90b3R5cGUuZGlhZ25vc3RpY0NvdW50cyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgZWFjaChpdGVtcywgeSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWFjaCh5LnZhbHVlLCAoeCwgaykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdFtrXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2tdID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRba10gKz0geDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGNvZGVDaGVja0J5RmlsZUFnZ3JlZ2F0ZSA9IHRoaXMuYWdncmVnYXRlTGlzdGVuZXIubGlzdGVuVG8oeiA9PiB6Lm1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3NCeUZpbGUubWFwKHggPT4gei5tb2RlbC5kaWFnbm9zdGljc0J5RmlsZSkpXHJcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwKVxyXG4gICAgICAgICAgICAubWFwKHggPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWFwID0gbmV3IE1hcDxzdHJpbmcsIE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4oKTtcclxuICAgICAgICAgICAgICAgIGVhY2goeCwgeiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBbZmlsZSwgZGlhZ25vc3RpY3NdIG9mIHoudmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFwLnNldChmaWxlLCBkaWFnbm9zdGljcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zID0gbmV3IFJlcGxheVN1YmplY3Q8Ym9vbGVhbj4oMSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdvbW5pc2hhcnAtYXRvbS5zaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnMnLCBlbmFibGVkID0+IHtcclxuICAgICAgICAgICAgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zLm5leHQoZW5hYmxlZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGJhc2VEaWFnbm9zdGljcyA9IE9ic2VydmFibGUuY29tYmluZUxhdGVzdCggLy8gQ29tYmluZSBib3RoIHRoZSBhY3RpdmUgbW9kZWwgYW5kIHRoZSBjb25maWd1cmF0aW9uIGNoYW5nZXMgdG9nZXRoZXJcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVNb2RlbC5zdGFydFdpdGgobnVsbCksXHJcbiAgICAgICAgICAgIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucyxcclxuICAgICAgICAgICAgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zXHJcbiAgICAgICAgICAgICAgICAuc2tpcCgxKVxyXG4gICAgICAgICAgICAgICAgLnN0YXJ0V2l0aChhdG9tLmNvbmZpZy5nZXQ8Ym9vbGVhbj4oJ29tbmlzaGFycC1hdG9tLnNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucycpKSxcclxuICAgICAgICAgICAgKG1vZGVsLCBlbmFibGVkLCB3YXNFbmFibGVkKSA9PiAoeyBtb2RlbCwgZW5hYmxlZCwgd2FzRW5hYmxlZCB9KSlcclxuICAgICAgICAgICAgLy8gSWYgdGhlIHNldHRpbmcgaXMgZW5hYmxlZCAoYW5kIGhhc25cInQgY2hhbmdlZCkgdGhlbiB3ZSBkb25cInQgbmVlZCB0byByZWRvIHRoZSBzdWJzY3JpcHRpb25cclxuICAgICAgICAgICAgLmZpbHRlcihjdHggPT4gKCEoY3R4LmVuYWJsZWQgJiYgY3R4Lndhc0VuYWJsZWQgPT09IGN0eC5lbmFibGVkKSkpXHJcbiAgICAgICAgICAgIC5zaGFyZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgICBiYXNlRGlhZ25vc3RpY3NcclxuICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoY3R4ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGVuYWJsZWQsIG1vZGVsIH0gPSBjdHg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2RlQ2hlY2tBZ2dyZWdhdGU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9kZWwub2JzZXJ2ZS5kaWFnbm9zdGljcztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKFtdKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKFtdKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSh0aGlzLl9kaWFnbm9zdGljc1N1YmplY3QpLFxyXG4gICAgICAgICAgICBiYXNlRGlhZ25vc3RpY3NcclxuICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoY3R4ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IGVuYWJsZWQsIG1vZGVsIH0gPSBjdHg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2RlQ2hlY2tDb3VudEFnZ3JlZ2F0ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtb2RlbC5vYnNlcnZlLmRpYWdub3N0aWNzQ291bnRzO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxhbnk+T2JzZXJ2YWJsZS5lbXB0eTx7IFtpbmRleDogc3RyaW5nXTogbnVtYmVyOyB9PigpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5zdGFydFdpdGgoe30pXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHRoaXMuX2RpYWdub3N0aWNDb3VudHNTdWJqZWN0KSxcclxuICAgICAgICAgICAgYmFzZURpYWdub3N0aWNzXHJcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKGN0eCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBlbmFibGVkLCBtb2RlbCB9ID0gY3R4O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29kZUNoZWNrQnlGaWxlQWdncmVnYXRlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vZGVsLm9ic2VydmUuZGlhZ25vc3RpY3NCeUZpbGUubWFwKHggPT4gbW9kZWwuZGlhZ25vc3RpY3NCeUZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YobmV3IE1hcDxzdHJpbmcsIE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4oKSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnN0YXJ0V2l0aChuZXcgTWFwPHN0cmluZywgTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPigpKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSh0aGlzLl9kaWFnbm9zdGljc0J5RmlsZVN1YmplY3QpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICBpZiAoU29sdXRpb25NYW5hZ2VyLl91bml0VGVzdE1vZGVfKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgU29sdXRpb25NYW5hZ2VyLmRlYWN0aXZhdGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29ubmVjdCgpIHsgU29sdXRpb25NYW5hZ2VyLmNvbm5lY3QoKTsgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNjb25uZWN0KCkgeyBTb2x1dGlvbk1hbmFnZXIuZGlzY29ubmVjdCgpOyB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZSgpIHtcclxuICAgICAgICBpZiAoU29sdXRpb25NYW5hZ2VyLmNvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIFNvbHV0aW9uTWFuYWdlci5jb25uZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuYXZpZ2F0ZVRvKHJlc3BvbnNlOiB7IEZpbGVOYW1lOiBzdHJpbmc7IExpbmU6IG51bWJlcjsgQ29sdW1uOiBudW1iZXI7IH0pIHtcclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZShcclxuICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihyZXNwb25zZS5GaWxlTmFtZSwgPGFueT57IGluaXRpYWxMaW5lOiByZXNwb25zZS5MaW5lLCBpbml0aWFsQ29sdW1uOiByZXNwb25zZS5Db2x1bW4gfSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRGcmFtZXdvcmtzKHByb2plY3RzOiBzdHJpbmdbXSk6IHN0cmluZyB7XHJcbiAgICAgICAgY29uc3QgZnJhbWV3b3JrcyA9IG1hcChwcm9qZWN0cywgKHByb2plY3Q6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gcHJvamVjdC5pbmRleE9mKCcrJykgPT09IC0xID8gJycgOiBwcm9qZWN0LnNwbGl0KCcrJylbMV07XHJcbiAgICAgICAgfSkuZmlsdGVyKChmdzogc3RyaW5nKSA9PiBmdy5sZW5ndGggPiAwKTtcclxuICAgICAgICByZXR1cm4gZnJhbWV3b3Jrcy5qb2luKCcsJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZFRleHRFZGl0b3JDb21tYW5kKGNvbW1hbmROYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAoLi4uYXJnczogYW55W10pID0+IGFueSkge1xyXG4gICAgICAgIHJldHVybiBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsIGNvbW1hbmROYW1lLCBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcclxuICAgICAgICAgICAgaWYgKCFlZGl0b3IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHNvbWUodGhpcy5fc3VwcG9ydGVkRXh0ZW5zaW9ucywgZXh0ID0+IGVuZHNXaXRoKGVkaXRvci5nZXRQYXRoKCksIGV4dCkpKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIHByb3BlcnR5IGNhbiBiZSB1c2VkIHRvIGxpc3RlbiB0byBhbnkgZXZlbnQgdGhhdCBtaWdodCBjb21lIGFjcm9zcyBvbiBhbnkgc29sdXRpb25zLlxyXG4gICAgICogVGhpcyBpcyBhIG1vc3RseSBmdW5jdGlvbmFsIHJlcGxhY2VtZW50IGZvciBgcmVnaXN0ZXJDb25maWd1cmF0aW9uYCwgdGhvdWdoIHRoZXJlIGhhcyBiZWVuXHJcbiAgICAgKiAgICAgb25lIHBsYWNlIHdoZXJlIGByZWdpc3RlckNvbmZpZ3VyYXRpb25gIGNvdWxkIG5vdCBiZSByZXBsYWNlZC5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCBsaXN0ZW5lcigpIHtcclxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLnNvbHV0aW9uT2JzZXJ2ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIHByb3BlcnR5IGNhbiBiZSB1c2VkIHRvIG9ic2VydmUgdG8gdGhlIGFnZ3JlZ2F0ZSBvciBjb21iaW5lZCByZXNwb25zZXMgdG8gYW55IGV2ZW50LlxyXG4gICAgICogQSBnb29kIGV4YW1wbGUgb2YgdGhpcyBpcywgZm9yIGNvZGUgY2hlY2sgZXJyb3JzLCB0byBhZ2dyZWdhdGUgYWxsIGVycm9ycyBhY3Jvc3MgYWxsIG9wZW4gc29sdXRpb25zLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0IGFnZ3JlZ2F0ZUxpc3RlbmVyKCkge1xyXG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuc29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlcjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgcHJvcGVydHkgZ2V0cyBhIGxpc3Qgb2Ygc29sdXRpb25zIGFzIGFuIG9ic2VydmFibGUuXHJcbiAgICAgKiBOT1RFOiBUaGlzIHByb3BlcnR5IHdpbGwgbm90IGVtaXQgYWRkaXRpb25zIG9yIHJlbW92YWxzIG9mIHNvbHV0aW9ucy5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCBzb2x1dGlvbnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZGVmZXIoKCkgPT4gT2JzZXJ2YWJsZS5mcm9tPFNvbHV0aW9uPihTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIFRoaXMgbWV0aG9kIGFsbG93cyB1cyB0byBmb3JnZXQgYWJvdXQgdGhlIGVudGlyZSBzb2x1dGlvbiBtb2RlbC5cclxuICAgICAqIENhbGwgdGhpcyBtZXRob2Qgd2l0aCBhIHNwZWNpZmljIGVkaXRvciwgb3IganVzdCB3aXRoIGEgY2FsbGJhY2sgdG8gY2FwdHVyZSB0aGUgY3VycmVudCBlZGl0b3JcclxuICAgICAqXHJcbiAgICAgKiBUaGUgY2FsbGJhY2sgd2lsbCB0aGVuIGlzc3VlIHRoZSByZXF1ZXN0XHJcbiAgICAgKiBOT1RFOiBUaGlzIEFQSSBvbmx5IGV4cG9zZXMgdGhlIG9wZXJhdGlvbiBBcGkgYW5kIGRvZXNuXCJ0IGV4cG9zZSB0aGUgZXZlbnQgYXBpLCBhcyB3ZSBhcmUgcmVxdWVzdGluZyBzb21ldGhpbmcgdG8gaGFwcGVuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZXF1ZXN0PFQ+KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gT2JzZXJ2YWJsZTxUPik6IE9ic2VydmFibGU8VD47XHJcbiAgICBwdWJsaWMgcmVxdWVzdDxUPihjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gT2JzZXJ2YWJsZTxUPik6IE9ic2VydmFibGU8VD47XHJcbiAgICBwdWJsaWMgcmVxdWVzdDxUPihcclxuICAgICAgICBlZGl0b3I6IEF0b20uVGV4dEVkaXRvciB8ICgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBPYnNlcnZhYmxlPFQ+IHwgUHJvbWlzZTxUPiksXHJcbiAgICAgICAgY2FsbGJhY2s/OiAoc29sdXRpb246IFNvbHV0aW9uKSA9PiBPYnNlcnZhYmxlPFQ+KTogT2JzZXJ2YWJsZTxUPiB7XHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oZWRpdG9yKSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayA9IDxhbnk+ZWRpdG9yO1xyXG4gICAgICAgICAgICBlZGl0b3IgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFlZGl0b3IpIHtcclxuICAgICAgICAgICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc29sdXRpb25DYWxsYmFjayA9IChzb2x1dGlvbjogU29sdXRpb24pID0+IGNhbGxiYWNrKHNvbHV0aW9uLndpdGhFZGl0b3IoPGFueT5lZGl0b3IpKTtcclxuXHJcbiAgICAgICAgbGV0IHJlc3VsdDogT2JzZXJ2YWJsZTxUPjtcclxuICAgICAgICBpZiAoZWRpdG9yICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHNvbHV0aW9uQ2FsbGJhY2soZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbilcclxuICAgICAgICAgICAgICAgIC5zaGFyZSgpO1xyXG4gICAgICAgICAgICByZXN1bHQuc3Vic2NyaWJlKCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc29sdXRpb25SZXN1bHQ6IE9ic2VydmFibGU8U29sdXRpb24+O1xyXG4gICAgICAgIGlmIChlZGl0b3IpIHtcclxuICAgICAgICAgICAgc29sdXRpb25SZXN1bHQgPSBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoPEF0b20uVGV4dEVkaXRvcj5lZGl0b3IpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNvbHV0aW9uUmVzdWx0ID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uLnRha2UoMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXN1bHQgPSBzb2x1dGlvblJlc3VsdFxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxyXG4gICAgICAgICAgICAuZmxhdE1hcChzb2x1dGlvbkNhbGxiYWNrKVxyXG4gICAgICAgICAgICAuc2hhcmUoKTtcclxuXHJcbiAgICAgICAgLy8gRW5zdXJlIHRoYXQgdGhlIHVuZGVyeWluZyBwcm9taXNlIGlzIGNvbm5lY3RlZFxyXG4gICAgICAgIC8vICAgKGlmIHdlIGRvblwidCBzdWJzY3JpYmUgdG8gdGhlIHJldXNsdCBvZiB0aGUgcmVxdWVzdCwgd2hpY2ggaXMgbm90IGEgcmVxdWlyZW1lbnQpLlxyXG4gICAgICAgIHJlc3VsdC5zdWJzY3JpYmUoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0UHJvamVjdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIGlmIChpc09tbmlzaGFycFRleHRFZGl0b3IoZWRpdG9yKSAmJiBlZGl0b3Iub21uaXNoYXJwLnByb2plY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoZWRpdG9yLm9tbmlzaGFycC5wcm9qZWN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKVxyXG4gICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHoubW9kZWwuZ2V0UHJvamVjdEZvckVkaXRvcihlZGl0b3IpKVxyXG4gICAgICAgICAgICAudGFrZSgxKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0U29sdXRpb25Gb3JQcm9qZWN0KHByb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55Pikge1xyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKFxyXG4gICAgICAgICAgICBmaXJzdChmaWx0ZXIoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucywgc29sdXRpb24gPT4gc29tZShzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cywgcCA9PiBwLm5hbWUgPT09IHByb2plY3QubmFtZSkpKVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWxsb3dzIGZvciB2aWV3cyB0byBvYnNlcnZlIHRoZSBhY3RpdmUgbW9kZWwgYXMgaXQgY2hhbmdlcyBiZXR3ZWVuIGVkaXRvcnNcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldCBhY3RpdmVNb2RlbCgpIHtcclxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uLm1hcCh6ID0+IHoubW9kZWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzd2l0Y2hBY3RpdmVNb2RlbChjYWxsYmFjazogKG1vZGVsOiBWaWV3TW9kZWwsIGNkOiBDb21wb3NpdGVEaXNwb3NhYmxlKSA9PiB2b2lkKTogSURpc3Bvc2FibGUge1xyXG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlTW9kZWwuZmlsdGVyKHogPT4gISF6KS5zdWJzY3JpYmUobW9kZWwgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcclxuICAgICAgICAgICAgbW9kZWwuZGlzcG9zYWJsZS5hZGQoY2QpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlTW9kZWwuZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IG1vZGVsKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwuZGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjYWxsYmFjayhtb2RlbCwgY2QpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBhY3RpdmVTb2x1dGlvbigpIHtcclxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzd2l0Y2hBY3RpdmVTb2x1dGlvbihjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbiwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpID0+IHZvaWQpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5hY3RpdmVTb2x1dGlvbi5maWx0ZXIoeiA9PiAhIXopLnN1YnNjcmliZShzb2x1dGlvbiA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xyXG4gICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChjZCk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQodGhpcy5hY3RpdmVTb2x1dGlvbi5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gc29sdXRpb24pXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLnJlbW92ZShjZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHNvbHV0aW9uLCBjZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZUVkaXRvcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlRWRpdG9yO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzd2l0Y2hBY3RpdmVFZGl0b3IoY2FsbGJhY2s6IChlZGl0b3I6IElPbW5pc2hhcnBUZXh0RWRpdG9yLCBjZDogQ29tcG9zaXRlRGlzcG9zYWJsZSkgPT4gdm9pZCk6IElEaXNwb3NhYmxlIHtcclxuICAgICAgICBjb25zdCBvdXRlckNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICBvdXRlckNkLmFkZCh0aGlzLmFjdGl2ZUVkaXRvci5maWx0ZXIoeiA9PiAhIXopLnN1YnNjcmliZShlZGl0b3IgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcclxuICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChjZCk7XHJcblxyXG4gICAgICAgICAgICBjZC5hZGQodGhpcy5hY3RpdmVFZGl0b3IuZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IGVkaXRvcilcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICBjYWxsYmFjayhlZGl0b3IsIGNkKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHJldHVybiBvdXRlckNkO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3aGVuRWRpdG9yQ29ubmVjdGVkKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uXHJcbiAgICAgICAgICAgICAgICAud2hlbkNvbm5lY3RlZCgpXHJcbiAgICAgICAgICAgICAgICAubWFwKHogPT4gZWRpdG9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChzb2x1dGlvbiA9PiBzb2x1dGlvbi53aGVuQ29ubmVjdGVkKCksICgpID0+IDxJT21uaXNoYXJwVGV4dEVkaXRvcj5lZGl0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlQ29uZmlnRWRpdG9yKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVDb25maWdFZGl0b3I7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN3aXRjaEFjdGl2ZUNvbmZpZ0VkaXRvcihjYWxsYmFjazogKGVkaXRvcjogSU9tbmlzaGFycFRleHRFZGl0b3IsIGNkOiBDb21wb3NpdGVEaXNwb3NhYmxlKSA9PiB2b2lkKTogSURpc3Bvc2FibGUge1xyXG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlQ29uZmlnRWRpdG9yLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xyXG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZCh0aGlzLmFjdGl2ZUNvbmZpZ0VkaXRvci5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gZWRpdG9yKVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5kaXNwb3NhYmxlLnJlbW92ZShjZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBhY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvcigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3I7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN3aXRjaEFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yKGNhbGxiYWNrOiAoZWRpdG9yOiBJT21uaXNoYXJwVGV4dEVkaXRvciwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpID0+IHZvaWQpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvci5maWx0ZXIoeiA9PiAhIXopLnN1YnNjcmliZShlZGl0b3IgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZCh0aGlzLmFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yLmZpbHRlcihhY3RpdmUgPT4gYWN0aXZlICE9PSBlZGl0b3IpXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZVByb2plY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVByb2plY3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBhY3RpdmVGcmFtZXdvcmsoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUZyYW1ld29yaztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGVkaXRvcnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VkaXRvcnM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBjb25maWdFZGl0b3JzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9jb25maWdFZGl0b3JzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlYWNoRWRpdG9yKGNhbGxiYWNrOiAoZWRpdG9yOiBJT21uaXNoYXJwVGV4dEVkaXRvciwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpID0+IHZvaWQpOiBJRGlzcG9zYWJsZSB7XHJcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5fZWRpdG9ycy5zdWJzY3JpYmUoZWRpdG9yID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XHJcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoY2QpO1xyXG5cclxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9KSkpO1xyXG5cclxuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZWFjaENvbmZpZ0VkaXRvcihjYWxsYmFjazogKGVkaXRvcjogSU9tbmlzaGFycFRleHRFZGl0b3IsIGNkOiBDb21wb3NpdGVEaXNwb3NhYmxlKSA9PiB2b2lkKTogSURpc3Bvc2FibGUge1xyXG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuX2NvbmZpZ0VkaXRvcnMuc3Vic2NyaWJlKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xyXG4gICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKGNkKTtcclxuXHJcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLmRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcclxuICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfSkpKTtcclxuXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gdm9pZCkge1xyXG4gICAgICAgIFNvbHV0aW9uTWFuYWdlci5yZWdpc3RlckNvbmZpZ3VyYXRpb24oY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0IF9raWNrX2luX3RoZV9wYW50c18oKSB7XHJcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5fa2lja19pbl90aGVfcGFudHNfO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgZ3JhbW1hcnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlcihhdG9tLmdyYW1tYXJzLmdldEdyYW1tYXJzKCksXHJcbiAgICAgICAgICAgIGdyYW1tYXIgPT4gc29tZSh0aGlzLl9zdXBwb3J0ZWRFeHRlbnNpb25zLFxyXG4gICAgICAgICAgICAgICAgZXh0ID0+IHNvbWUoKDxhbnk+Z3JhbW1hcikuZmlsZVR5cGVzLFxyXG4gICAgICAgICAgICAgICAgICAgIGZ0ID0+IHRyaW1TdGFydChleHQsICcuJykgPT09IGZ0KSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpc1ZhbGlkR3JhbW1hcihncmFtbWFyOiBGaXJzdE1hdGUuR3JhbW1hcikge1xyXG4gICAgICAgIHJldHVybiBzb21lKHRoaXMuZ3JhbW1hcnMsIHsgc2NvcGVOYW1lOiAoPGFueT5ncmFtbWFyKS5zY29wZU5hbWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBwYWNrYWdlRGlyKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fcGFja2FnZURpcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oYGdldFBhY2thZ2VEaXJQYXRoczogJHthdG9tLnBhY2thZ2VzLmdldFBhY2thZ2VEaXJQYXRocygpfWApO1xyXG4gICAgICAgICAgICB0aGlzLl9wYWNrYWdlRGlyID0gZmluZChhdG9tLnBhY2thZ2VzLmdldFBhY2thZ2VEaXJQYXRocygpLCBwYWNrYWdlUGF0aCA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYHBhY2thZ2VQYXRoICR7cGFja2FnZVBhdGh9IGV4aXN0czogJHtmcy5leGlzdHNTeW5jKHBhdGguam9pbihwYWNrYWdlUGF0aCwgJ29tbmlzaGFycC1hdG9tJykpfWApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhY2thZ2VQYXRoLCAnb21uaXNoYXJwLWF0b20nKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRmFsbGJhY2ssIHRoaXMgaXMgZm9yIHVuaXQgdGVzdGluZyBvbiB0cmF2aXMgbWFpbmx5XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5fcGFja2FnZURpcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFja2FnZURpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi8uLicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9wYWNrYWdlRGlyO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgYXRvbVZlcnNpb24oKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9hdG9tVmVyc2lvbikge1xyXG4gICAgICAgICAgICB0aGlzLl9hdG9tVmVyc2lvbiA9IG5ldyBTZW1WZXIoPGFueT5hdG9tLmdldFZlcnNpb24oKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9hdG9tVmVyc2lvbjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXRvbVZlcnNpb25HcmVhdGVyVGhhbih2ZXJzaW9uOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gc2VtdmVyR3QoPGFueT5hdG9tLmdldFZlcnNpb24oKSwgdmVyc2lvbik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfaXNPbW5pU2hhcnBFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICByZXR1cm4gc29tZSh0aGlzLl9zdXBwb3J0ZWRFeHRlbnNpb25zLCBleHQgPT4gZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfY3JlYXRlVGV4dEVkaXRvck9ic2VydmFibGUoZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZSkge1xyXG4gICAgICAgIGNvbnN0IHNhZmVHdWFyZCA9IHRoaXMuX2NyZWF0ZVNhZmVHdWFyZCh0aGlzLl9zdXBwb3J0ZWRFeHRlbnNpb25zLCBkaXNwb3NhYmxlKTtcclxuXHJcbiAgICAgICAgY29uc3Qgb2JzZXJ2ZVRleHRFZGl0b3JzID0gY3JlYXRlT2JzZXJ2YWJsZTxBdG9tLlRleHRFZGl0b3I+KG9ic2VydmVyID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZGlzID0gYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKChlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIubmV4dChlZGl0b3IpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiBkaXMuZGlzcG9zZSgpO1xyXG4gICAgICAgIH0pLnNoYXJlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgIE9ic2VydmFibGUubWVyZ2Uob2JzZXJ2ZVRleHRFZGl0b3JzLmZpbHRlcih4ID0+ICEheC5nZXRQYXRoKCkpLCBzYWZlR3VhcmQpXHJcbiAgICAgICAgICAgICAgICAubWVyZ2VNYXAoZWRpdG9yID0+IFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpLCAoZWRpdG9yLCBzb2x1dGlvbikgPT4gPElPbW5pc2hhcnBUZXh0RWRpdG9yPmVkaXRvcilcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKSxcclxuICAgICAgICAgICAgT21uaXNoYXJwRWRpdG9yQ29udGV4dC5jcmVhdGVkXHJcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGVkaXRvciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdW5kZXJseWluZ0VkaXRvcnMuYWRkKGVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5jb25maWcgPSBlbmRzV2l0aChlZGl0b3IuZ2V0UGF0aCgpLCAncHJvamVjdC5qc29uJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpcyA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdW5kZXJseWluZ0VkaXRvcnMuZGVsZXRlKGVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiBkaXMuZGlzcG9zZSgpKVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoZGlzKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3QgbGl2ZUVkaXRvcnMgPSBPbW5pc2hhcnBFZGl0b3JDb250ZXh0LmNyZWF0ZWQ7XHJcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUubWVyZ2UoXHJcbiAgICAgICAgICAgIE9ic2VydmFibGUuZGVmZXIoKCkgPT4gT2JzZXJ2YWJsZS5mcm9tPElPbW5pc2hhcnBUZXh0RWRpdG9yPig8YW55PnRoaXMuX3VuZGVybHlpbmdFZGl0b3JzKSksXHJcbiAgICAgICAgICAgIGxpdmVFZGl0b3JzXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIF9jcmVhdGVTYWZlR3VhcmQoZXh0ZW5zaW9uczogc3RyaW5nW10sIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGUpIHtcclxuICAgICAgICBjb25zdCBlZGl0b3JTdWJqZWN0ID0gbmV3IFN1YmplY3Q8SU9tbmlzaGFycFRleHRFZGl0b3I+KCk7XHJcblxyXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbSgocGFuZTogYW55KSA9PiBlZGl0b3JTdWJqZWN0Lm5leHQocGFuZSkpKTtcclxuICAgICAgICBjb25zdCBlZGl0b3JPYnNlcnZhYmxlID0gZWRpdG9yU3ViamVjdC5maWx0ZXIoeiA9PiB6ICYmICEhei5nZXRHcmFtbWFyKS5zdGFydFdpdGgobnVsbCk7XHJcblxyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLnppcChlZGl0b3JPYnNlcnZhYmxlLCBlZGl0b3JPYnNlcnZhYmxlLnNraXAoMSksIChlZGl0b3IsIG5leHRFZGl0b3IpID0+ICh7IGVkaXRvciwgbmV4dEVkaXRvciB9KSlcclxuICAgICAgICAgICAgLmRlYm91bmNlVGltZSg1MClcclxuICAgICAgICAgICAgLnN3aXRjaE1hcCgoeyBuZXh0RWRpdG9yIH0pID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSBuZXh0RWRpdG9yLmdldFBhdGgoKTtcclxuICAgICAgICAgICAgICAgIGlmICghcGF0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGVkaXRvciBpc25cInQgc2F2ZWQgeWV0LlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0RWRpdG9yICYmIHRoaXMuX2lzT21uaVNoYXJwRWRpdG9yKG5leHRFZGl0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKCdPbW5pU2hhcnAnLCB7IGRldGFpbDogJ0Z1bmN0aW9uYWxpdHkgd2lsbCBsaW1pdGVkIHVudGlsIHRoZSBmaWxlIGhhcyBiZWVuIHNhdmVkLicgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8QXRvbS5UZXh0RWRpdG9yPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2VyID0gbmV4dEVkaXRvci5vbkRpZENoYW5nZVBhdGgoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShuZXh0RWRpdG9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3Bvc2VyLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpleHBvcnQtbmFtZSB2YXJpYWJsZS1uYW1lXHJcbmV4cG9ydCBjb25zdCBPbW5pID0gbmV3IE9tbmlNYW5hZ2VyKCk7XHJcbiJdfQ==
