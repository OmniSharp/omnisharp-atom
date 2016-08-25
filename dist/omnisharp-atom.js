"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _tsDisposables = require("ts-disposables");

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _omni = require("./server/omni");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var win32 = process.platform === "win32";

var OmniSharpAtom = function () {
    function OmniSharpAtom() {
        _classCallCheck(this, OmniSharpAtom);

        this.config = {
            autoStartOnCompatibleFile: {
                title: "Autostart Omnisharp Roslyn",
                description: "Automatically starts Omnisharp Roslyn when a compatible file is opened.",
                type: "boolean",
                default: true
            },
            developerMode: {
                title: "Developer Mode",
                description: "Outputs detailed server calls in console.log",
                type: "boolean",
                default: false
            },
            showDiagnosticsForAllSolutions: {
                title: "Show Diagnostics for all Solutions",
                description: "Advanced: This will show diagnostics for all open solutions.  NOTE: May take a restart or change to each server to take effect when turned on.",
                type: "boolean",
                default: false
            },
            enableAdvancedFileNew: {
                title: "Enable `Advanced File New`",
                description: "Enable `Advanced File New` when doing ctrl-n/cmd-n within a C# editor.",
                type: "boolean",
                default: false
            },
            useLeftLabelColumnForSuggestions: {
                title: "Use Left-Label column in Suggestions",
                description: "Shows return types in a right-aligned column to the left of the completion suggestion text.",
                type: "boolean",
                default: false
            },
            useIcons: {
                title: "Use unique icons for kind indicators in Suggestions",
                description: "Shows kinds with unique icons rather than autocomplete default styles.",
                type: "boolean",
                default: true
            },
            autoAdjustTreeView: {
                title: "Adjust the tree view to match the solution root.",
                descrption: "This will automatically adjust the treeview to be the root of the solution.",
                type: "boolean",
                default: false
            },
            nagAdjustTreeView: {
                title: "Show the notifications to Adjust the tree view",
                type: "boolean",
                default: true
            },
            autoAddExternalProjects: {
                title: "Add external projects to the tree view.",
                descrption: "This will automatically add external sources to the tree view.\n External sources are any projects that are loaded outside of the solution root.",
                type: "boolean",
                default: false
            },
            nagAddExternalProjects: {
                title: "Show the notifications to add or remove external projects",
                type: "boolean",
                default: true
            },
            hideLinterInterface: {
                title: "Hide the linter interface when using omnisharp-atom editors",
                type: "boolean",
                default: true
            },
            wantMetadata: {
                title: "Request metadata definition with Goto Definition",
                descrption: "Request symbol metadata from the server, when using go-to-definition.  This is disabled by default on Linux, due to issues with Roslyn on Mono.",
                type: "boolean",
                default: win32
            },
            altGotoDefinition: {
                title: "Alt Go To Definition",
                descrption: "Use the alt key instead of the ctrl/cmd key for goto defintion mouse over.",
                type: "boolean",
                default: false
            },
            showHiddenDiagnostics: {
                title: "Show 'Hidden' diagnostics in the linter",
                descrption: "Show or hide hidden diagnostics in the linter, this does not affect greying out of namespaces that are unused.",
                type: "boolean",
                default: true
            }
        };
    }

    _createClass(OmniSharpAtom, [{
        key: "activate",
        value: function activate(state) {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this._started = new _rxjs.AsyncSubject();
            this._activated = new _rxjs.AsyncSubject();
            this.configureKeybindings();
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:toggle", function () {
                return _this.toggle();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:fix-usings", function () {
                return _omni.Omni.request(function (solution) {
                    return solution.fixusings({});
                });
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:settings", function () {
                return atom.workspace.open("atom://config/packages").then(function (tab) {
                    if (tab && tab.getURI && tab.getURI() !== "atom://config/packages/omnisharp-atom") {
                        atom.workspace.open("atom://config/packages/omnisharp-atom");
                    }
                });
            }));
            var grammars = atom.grammars;
            var grammarCb = function grammarCb(grammar) {
                if (_lodash2.default.find(_omni.Omni.grammars, function (gmr) {
                    return gmr.scopeName === grammar.scopeName;
                })) {
                    atom.grammars.startIdForScope(grammar.scopeName);
                    var omnisharpScopeName = grammar.scopeName + ".omnisharp";
                    var scopeId = grammars.idsByScope[grammar.scopeName];
                    grammars.idsByScope[omnisharpScopeName] = scopeId;
                    grammars.scopesById[scopeId] = omnisharpScopeName;
                    grammar.scopeName = omnisharpScopeName;
                }
            };
            _lodash2.default.each(grammars.grammars, grammarCb);
            this.disposable.add(atom.grammars.onDidAddGrammar(grammarCb));
            require("atom-package-deps").install("omnisharp-atom").then(function () {
                console.info("Activating omnisharp-atom solution tracking...");
                _omni.Omni.activate();
                _this.disposable.add(_omni.Omni);
                _this._started.next(true);
                _this._started.complete();
            }).then(function () {
                return _this.loadFeatures(_this.getFeatures("atom").delay(_omni.Omni["_kick_in_the_pants_"] ? 0 : 2000)).toPromise();
            }).then(function () {
                var startingObservable = _omni.Omni.activeSolution.filter(function (z) {
                    return !!z;
                }).take(1);
                if (_omni.Omni["_kick_in_the_pants_"]) {
                    startingObservable = _rxjs.Observable.of(null);
                }
                _this.disposable.add(startingObservable.flatMap(function () {
                    return _this.loadFeatures(_this.getFeatures("features"));
                }).subscribe({
                    complete: function complete() {
                        _this.disposable.add(atom.workspace.observeTextEditors(function (editor) {
                            _this.detectAutoToggleGrammar(editor);
                        }));
                        _this._activated.next(true);
                        _this._activated.complete();
                    }
                }));
            });
        }
    }, {
        key: "getFeatures",
        value: function getFeatures(folder) {
            var _this2 = this;

            var whiteList = atom.config.get("omnisharp-atom:feature-white-list");
            var featureList = atom.config.get("omnisharp-atom:feature-list");
            var whiteListUndefined = typeof whiteList === "undefined";
            console.info("Getting features for \"" + folder + "\"...");
            var featureDir = __dirname + "/" + folder;
            function loadFeature(file) {
                var result = require("./" + folder + "/" + file);
                console.info("Loading feature \"" + folder + "/" + file + "\"...");
                return result;
            }
            return _rxjs.Observable.bindNodeCallback(_fs2.default.readdir)(featureDir).flatMap(function (files) {
                return files;
            }).filter(function (file) {
                return (/\.js$/.test(file)
                );
            }).flatMap(function (file) {
                return _rxjs.Observable.bindNodeCallback(_fs2.default.stat)(featureDir + "/" + file);
            }, function (file, stat) {
                return { file: file, stat: stat };
            }).filter(function (z) {
                return !z.stat.isDirectory();
            }).map(function (z) {
                return {
                    file: (folder + "/" + _path2.default.basename(z.file)).replace(/\.js$/, ""),
                    load: function load() {
                        var feature = loadFeature(z.file);
                        var features = [];
                        _lodash2.default.each(feature, function (value, key) {
                            if (!_lodash2.default.isFunction(value) && !_lodash2.default.isArray(value)) {
                                if (!value.required) {
                                    _this2.config[key] = {
                                        title: "" + value.title,
                                        description: value.description,
                                        type: "boolean",
                                        default: _lodash2.default.has(value, "default") ? value.default : true
                                    };
                                }
                                features.push({
                                    key: key, activate: function activate() {
                                        return _this2.activateFeature(whiteListUndefined, key, value);
                                    }
                                });
                            }
                        });
                        return _rxjs.Observable.from(features);
                    }
                };
            }).filter(function (l) {
                if (typeof whiteList === "undefined") {
                    return true;
                }
                if (whiteList) {
                    return _lodash2.default.includes(featureList, l.file);
                } else {
                    return !_lodash2.default.includes(featureList, l.file);
                }
            });
        }
    }, {
        key: "loadFeatures",
        value: function loadFeatures(features) {
            var _this3 = this;

            return features.concatMap(function (z) {
                return z.load();
            }).toArray().concatMap(function (x) {
                return x;
            }).map(function (f) {
                return f.activate();
            }).filter(function (x) {
                return !!x;
            }).toArray().do({
                complete: function complete() {
                    atom.config.setSchema("omnisharp-atom", {
                        type: "object",
                        properties: _this3.config
                    });
                }
            }).concatMap(function (x) {
                return x;
            }).do(function (x) {
                return x();
            });
        }
    }, {
        key: "activateFeature",
        value: function activateFeature(whiteListUndefined, key, value) {
            var _this4 = this;

            var result = null;
            var firstRun = true;
            if (whiteListUndefined && _lodash2.default.has(this.config, key)) {
                (function () {
                    var configKey = "omnisharp-atom." + key;
                    var enableDisposable = void 0,
                        disableDisposable = void 0;
                    _this4.disposable.add(atom.config.observe(configKey, function (enabled) {
                        if (!enabled) {
                            if (disableDisposable) {
                                disableDisposable.dispose();
                                _this4.disposable.remove(disableDisposable);
                                disableDisposable = null;
                            }
                            try {
                                value.dispose();
                            } catch (ex) {}
                            enableDisposable = atom.commands.add("atom-workspace", "omnisharp-feature:enable-" + _lodash2.default.kebabCase(key), function () {
                                return atom.config.set(configKey, true);
                            });
                            _this4.disposable.add(enableDisposable);
                        } else {
                            if (enableDisposable) {
                                enableDisposable.dispose();
                                _this4.disposable.remove(disableDisposable);
                                enableDisposable = null;
                            }
                            console.info("Activating feature \"" + key + "\"...");
                            value.activate();
                            if (_lodash2.default.isFunction(value["attach"])) {
                                if (firstRun) {
                                    result = function result() {
                                        console.info("Attaching feature \"" + key + "\"...");
                                        value["attach"]();
                                    };
                                } else {
                                    console.info("Attaching feature \"" + key + "\"...");
                                    value["attach"]();
                                }
                            }
                            disableDisposable = atom.commands.add("atom-workspace", "omnisharp-feature:disable-" + _lodash2.default.kebabCase(key), function () {
                                return atom.config.set(configKey, false);
                            });
                            _this4.disposable.add(disableDisposable);
                        }
                        firstRun = false;
                    }));
                    _this4.disposable.add(atom.commands.add("atom-workspace", "omnisharp-feature:toggle-" + _lodash2.default.kebabCase(key), function () {
                        return atom.config.set(configKey, !atom.config.get(configKey));
                    }));
                })();
            } else {
                value.activate();
                if (_lodash2.default.isFunction(value["attach"])) {
                    result = function result() {
                        console.info("Attaching feature \"" + key + "\"...");
                        value["attach"]();
                    };
                }
            }
            this.disposable.add(_tsDisposables.Disposable.create(function () {
                try {
                    value.dispose();
                } catch (ex) {}
            }));
            return result;
        }
    }, {
        key: "detectAutoToggleGrammar",
        value: function detectAutoToggleGrammar(editor) {
            var _this5 = this;

            var grammar = editor.getGrammar();
            this.detectGrammar(editor, grammar);
            this.disposable.add(editor.onDidChangeGrammar(function (gmr) {
                return _this5.detectGrammar(editor, gmr);
            }));
        }
    }, {
        key: "detectGrammar",
        value: function detectGrammar(editor, grammar) {
            if (!atom.config.get("omnisharp-atom.autoStartOnCompatibleFile")) {
                return;
            }
            if (_omni.Omni.isValidGrammar(grammar)) {
                if (_omni.Omni.isOff) {
                    this.toggle();
                }
            } else if (grammar.name === "JSON") {
                if (_path2.default.basename(editor.getPath()) === "project.json") {
                    if (_omni.Omni.isOff) {
                        this.toggle();
                    }
                }
            }
        }
    }, {
        key: "toggle",
        value: function toggle() {
            if (_omni.Omni.isOff) {
                _omni.Omni.connect();
            } else if (_omni.Omni.isOn) {
                _omni.Omni.disconnect();
            }
        }
    }, {
        key: "deactivate",
        value: function deactivate() {
            this.disposable.dispose();
        }
    }, {
        key: "consumeStatusBar",
        value: function consumeStatusBar(statusBar) {
            var f = require("./atom/status-bar");
            f.statusBar.setup(statusBar);
            f = require("./atom/framework-selector");
            f.frameworkSelector.setup(statusBar);
            f = require("./atom/feature-buttons");
            f.featureEditorButtons.setup(statusBar);
        }
    }, {
        key: "consumeYeomanEnvironment",
        value: function consumeYeomanEnvironment(generatorService) {
            var _require = require("./atom/generator-aspnet");

            var generatorAspnet = _require.generatorAspnet;

            generatorAspnet.setup(generatorService);
        }
    }, {
        key: "provideAutocomplete",
        value: function provideAutocomplete() {
            return require("./services/completion-provider");
        }
    }, {
        key: "provideLinter",
        value: function provideLinter() {
            return [];
        }
    }, {
        key: "provideProjectJson",
        value: function provideProjectJson() {
            return require("./services/project-provider").concat(require("./services/framework-provider"));
        }
    }, {
        key: "consumeLinter",
        value: function consumeLinter(linter) {
            var LinterProvider = require("./services/linter-provider");
            var linters = LinterProvider.provider;
            this.disposable.add(_tsDisposables.Disposable.create(function () {
                _lodash2.default.each(linters, function (l) {
                    linter.deleteLinter(l);
                });
            }));
            this.disposable.add(LinterProvider.init(linter));
        }
    }, {
        key: "consumeIndieLinter",
        value: function consumeIndieLinter(linter) {
            require("./services/linter-provider").registerIndie(linter, this.disposable);
        }
    }, {
        key: "configureKeybindings",
        value: function configureKeybindings() {
            var disposable = void 0;
            var omnisharpAdvancedFileNew = _omni.Omni.packageDir + "/omnisharp-atom/keymaps/omnisharp-file-new.cson";
            this.disposable.add(atom.config.observe("omnisharp-atom.enableAdvancedFileNew", function (enabled) {
                if (enabled) {
                    disposable = atom.keymaps.loadKeymap(omnisharpAdvancedFileNew);
                } else {
                    if (disposable) disposable.dispose();
                    atom.keymaps.removeBindingsFromSource(omnisharpAdvancedFileNew);
                }
            }));
        }
    }]);

    return OmniSharpAtom;
}();

module.exports = new OmniSharpAtom();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9vbW5pc2hhcnAtYXRvbS5qcyIsImxpYi9vbW5pc2hhcnAtYXRvbS50cyJdLCJuYW1lcyI6WyJ3aW4zMiIsInByb2Nlc3MiLCJwbGF0Zm9ybSIsIk9tbmlTaGFycEF0b20iLCJjb25maWciLCJhdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsInR5cGUiLCJkZWZhdWx0IiwiZGV2ZWxvcGVyTW9kZSIsInNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucyIsImVuYWJsZUFkdmFuY2VkRmlsZU5ldyIsInVzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zIiwidXNlSWNvbnMiLCJhdXRvQWRqdXN0VHJlZVZpZXciLCJkZXNjcnB0aW9uIiwibmFnQWRqdXN0VHJlZVZpZXciLCJhdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyIsIm5hZ0FkZEV4dGVybmFsUHJvamVjdHMiLCJoaWRlTGludGVySW50ZXJmYWNlIiwid2FudE1ldGFkYXRhIiwiYWx0R290b0RlZmluaXRpb24iLCJzaG93SGlkZGVuRGlhZ25vc3RpY3MiLCJzdGF0ZSIsImRpc3Bvc2FibGUiLCJfc3RhcnRlZCIsIl9hY3RpdmF0ZWQiLCJjb25maWd1cmVLZXliaW5kaW5ncyIsImFkZCIsImF0b20iLCJjb21tYW5kcyIsInRvZ2dsZSIsInJlcXVlc3QiLCJzb2x1dGlvbiIsImZpeHVzaW5ncyIsIndvcmtzcGFjZSIsIm9wZW4iLCJ0aGVuIiwidGFiIiwiZ2V0VVJJIiwiZ3JhbW1hcnMiLCJncmFtbWFyQ2IiLCJncmFtbWFyIiwiZmluZCIsImdtciIsInNjb3BlTmFtZSIsInN0YXJ0SWRGb3JTY29wZSIsIm9tbmlzaGFycFNjb3BlTmFtZSIsInNjb3BlSWQiLCJpZHNCeVNjb3BlIiwic2NvcGVzQnlJZCIsImVhY2giLCJvbkRpZEFkZEdyYW1tYXIiLCJyZXF1aXJlIiwiaW5zdGFsbCIsImNvbnNvbGUiLCJpbmZvIiwiYWN0aXZhdGUiLCJuZXh0IiwiY29tcGxldGUiLCJsb2FkRmVhdHVyZXMiLCJnZXRGZWF0dXJlcyIsImRlbGF5IiwidG9Qcm9taXNlIiwic3RhcnRpbmdPYnNlcnZhYmxlIiwiYWN0aXZlU29sdXRpb24iLCJmaWx0ZXIiLCJ6IiwidGFrZSIsIm9mIiwiZmxhdE1hcCIsInN1YnNjcmliZSIsIm9ic2VydmVUZXh0RWRpdG9ycyIsImVkaXRvciIsImRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyIiwiZm9sZGVyIiwid2hpdGVMaXN0IiwiZ2V0IiwiZmVhdHVyZUxpc3QiLCJ3aGl0ZUxpc3RVbmRlZmluZWQiLCJmZWF0dXJlRGlyIiwiX19kaXJuYW1lIiwibG9hZEZlYXR1cmUiLCJmaWxlIiwicmVzdWx0IiwiYmluZE5vZGVDYWxsYmFjayIsInJlYWRkaXIiLCJmaWxlcyIsInRlc3QiLCJzdGF0IiwiaXNEaXJlY3RvcnkiLCJtYXAiLCJiYXNlbmFtZSIsInJlcGxhY2UiLCJsb2FkIiwiZmVhdHVyZSIsImZlYXR1cmVzIiwidmFsdWUiLCJrZXkiLCJpc0Z1bmN0aW9uIiwiaXNBcnJheSIsInJlcXVpcmVkIiwiaGFzIiwicHVzaCIsImFjdGl2YXRlRmVhdHVyZSIsImZyb20iLCJpbmNsdWRlcyIsImwiLCJjb25jYXRNYXAiLCJ0b0FycmF5IiwieCIsImYiLCJkbyIsInNldFNjaGVtYSIsInByb3BlcnRpZXMiLCJmaXJzdFJ1biIsImNvbmZpZ0tleSIsImVuYWJsZURpc3Bvc2FibGUiLCJkaXNhYmxlRGlzcG9zYWJsZSIsIm9ic2VydmUiLCJlbmFibGVkIiwiZGlzcG9zZSIsInJlbW92ZSIsImV4Iiwia2ViYWJDYXNlIiwic2V0IiwiY3JlYXRlIiwiZ2V0R3JhbW1hciIsImRldGVjdEdyYW1tYXIiLCJvbkRpZENoYW5nZUdyYW1tYXIiLCJpc1ZhbGlkR3JhbW1hciIsImlzT2ZmIiwibmFtZSIsImdldFBhdGgiLCJjb25uZWN0IiwiaXNPbiIsImRpc2Nvbm5lY3QiLCJzdGF0dXNCYXIiLCJzZXR1cCIsImZyYW1ld29ya1NlbGVjdG9yIiwiZmVhdHVyZUVkaXRvckJ1dHRvbnMiLCJnZW5lcmF0b3JTZXJ2aWNlIiwiZ2VuZXJhdG9yQXNwbmV0IiwiY29uY2F0IiwibGludGVyIiwiTGludGVyUHJvdmlkZXIiLCJsaW50ZXJzIiwicHJvdmlkZXIiLCJkZWxldGVMaW50ZXIiLCJpbml0IiwicmVnaXN0ZXJJbmRpZSIsIm9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyIsInBhY2thZ2VEaXIiLCJrZXltYXBzIiwibG9hZEtleW1hcCIsInJlbW92ZUJpbmRpbmdzRnJvbVNvdXJjZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FDR0EsSUFBTUEsUUFBUUMsUUFBUUMsUUFBUixLQUFxQixPQUFuQzs7SUFFQUMsYTtBQUFBLDZCQUFBO0FBQUE7O0FBZ1VXLGFBQUFDLE1BQUEsR0FBUztBQUNaQyx1Q0FBMkI7QUFDdkJDLHVCQUFPLDRCQURnQjtBQUV2QkMsNkJBQWEseUVBRlU7QUFHdkJDLHNCQUFNLFNBSGlCO0FBSXZCQyx5QkFBUztBQUpjLGFBRGY7QUFPWkMsMkJBQWU7QUFDWEosdUJBQU8sZ0JBREk7QUFFWEMsNkJBQWEsOENBRkY7QUFHWEMsc0JBQU0sU0FISztBQUlYQyx5QkFBUztBQUpFLGFBUEg7QUFhWkUsNENBQWdDO0FBQzVCTCx1QkFBTyxvQ0FEcUI7QUFFNUJDLDZCQUFhLGdKQUZlO0FBRzVCQyxzQkFBTSxTQUhzQjtBQUk1QkMseUJBQVM7QUFKbUIsYUFicEI7QUFtQlpHLG1DQUF1QjtBQUNuQk4sdUJBQU8sNEJBRFk7QUFFbkJDLDZCQUFhLHdFQUZNO0FBR25CQyxzQkFBTSxTQUhhO0FBSW5CQyx5QkFBUztBQUpVLGFBbkJYO0FBeUJaSSw4Q0FBa0M7QUFDOUJQLHVCQUFPLHNDQUR1QjtBQUU5QkMsNkJBQWEsNkZBRmlCO0FBRzlCQyxzQkFBTSxTQUh3QjtBQUk5QkMseUJBQVM7QUFKcUIsYUF6QnRCO0FBK0JaSyxzQkFBVTtBQUNOUix1QkFBTyxx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YXRvbS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIEFzeW5jU3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcInRzLWRpc3Bvc2FibGVzXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuL3NlcnZlci9vbW5pXCI7XG5jb25zdCB3aW4zMiA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIjtcbmNsYXNzIE9tbmlTaGFycEF0b20ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgICAgICAgIGF1dG9TdGFydE9uQ29tcGF0aWJsZUZpbGU6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJBdXRvc3RhcnQgT21uaXNoYXJwIFJvc2x5blwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkF1dG9tYXRpY2FsbHkgc3RhcnRzIE9tbmlzaGFycCBSb3NseW4gd2hlbiBhIGNvbXBhdGlibGUgZmlsZSBpcyBvcGVuZWQuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRldmVsb3Blck1vZGU6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJEZXZlbG9wZXIgTW9kZVwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk91dHB1dHMgZGV0YWlsZWQgc2VydmVyIGNhbGxzIGluIGNvbnNvbGUubG9nXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJTaG93IERpYWdub3N0aWNzIGZvciBhbGwgU29sdXRpb25zXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQWR2YW5jZWQ6IFRoaXMgd2lsbCBzaG93IGRpYWdub3N0aWNzIGZvciBhbGwgb3BlbiBzb2x1dGlvbnMuICBOT1RFOiBNYXkgdGFrZSBhIHJlc3RhcnQgb3IgY2hhbmdlIHRvIGVhY2ggc2VydmVyIHRvIHRha2UgZWZmZWN0IHdoZW4gdHVybmVkIG9uLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5hYmxlQWR2YW5jZWRGaWxlTmV3OiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiRW5hYmxlIGBBZHZhbmNlZCBGaWxlIE5ld2BcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJFbmFibGUgYEFkdmFuY2VkIEZpbGUgTmV3YCB3aGVuIGRvaW5nIGN0cmwtbi9jbWQtbiB3aXRoaW4gYSBDIyBlZGl0b3IuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9uczoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlVzZSBMZWZ0LUxhYmVsIGNvbHVtbiBpbiBTdWdnZXN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3dzIHJldHVybiB0eXBlcyBpbiBhIHJpZ2h0LWFsaWduZWQgY29sdW1uIHRvIHRoZSBsZWZ0IG9mIHRoZSBjb21wbGV0aW9uIHN1Z2dlc3Rpb24gdGV4dC5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZUljb25zOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiVXNlIHVuaXF1ZSBpY29ucyBmb3Iga2luZCBpbmRpY2F0b3JzIGluIFN1Z2dlc3Rpb25zXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2hvd3Mga2luZHMgd2l0aCB1bmlxdWUgaWNvbnMgcmF0aGVyIHRoYW4gYXV0b2NvbXBsZXRlIGRlZmF1bHQgc3R5bGVzLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhdXRvQWRqdXN0VHJlZVZpZXc6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJBZGp1c3QgdGhlIHRyZWUgdmlldyB0byBtYXRjaCB0aGUgc29sdXRpb24gcm9vdC5cIixcbiAgICAgICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IGFkanVzdCB0aGUgdHJlZXZpZXcgdG8gYmUgdGhlIHJvb3Qgb2YgdGhlIHNvbHV0aW9uLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmFnQWRqdXN0VHJlZVZpZXc6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJTaG93IHRoZSBub3RpZmljYXRpb25zIHRvIEFkanVzdCB0aGUgdHJlZSB2aWV3XCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGF1dG9BZGRFeHRlcm5hbFByb2plY3RzOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiQWRkIGV4dGVybmFsIHByb2plY3RzIHRvIHRoZSB0cmVlIHZpZXcuXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJUaGlzIHdpbGwgYXV0b21hdGljYWxseSBhZGQgZXh0ZXJuYWwgc291cmNlcyB0byB0aGUgdHJlZSB2aWV3LlxcbiBFeHRlcm5hbCBzb3VyY2VzIGFyZSBhbnkgcHJvamVjdHMgdGhhdCBhcmUgbG9hZGVkIG91dHNpZGUgb2YgdGhlIHNvbHV0aW9uIHJvb3QuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYWdBZGRFeHRlcm5hbFByb2plY3RzOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyB0aGUgbm90aWZpY2F0aW9ucyB0byBhZGQgb3IgcmVtb3ZlIGV4dGVybmFsIHByb2plY3RzXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhpZGVMaW50ZXJJbnRlcmZhY2U6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJIaWRlIHRoZSBsaW50ZXIgaW50ZXJmYWNlIHdoZW4gdXNpbmcgb21uaXNoYXJwLWF0b20gZWRpdG9yc1wiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3YW50TWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJSZXF1ZXN0IG1ldGFkYXRhIGRlZmluaXRpb24gd2l0aCBHb3RvIERlZmluaXRpb25cIixcbiAgICAgICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlJlcXVlc3Qgc3ltYm9sIG1ldGFkYXRhIGZyb20gdGhlIHNlcnZlciwgd2hlbiB1c2luZyBnby10by1kZWZpbml0aW9uLiAgVGhpcyBpcyBkaXNhYmxlZCBieSBkZWZhdWx0IG9uIExpbnV4LCBkdWUgdG8gaXNzdWVzIHdpdGggUm9zbHluIG9uIE1vbm8uXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogd2luMzJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhbHRHb3RvRGVmaW5pdGlvbjoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkFsdCBHbyBUbyBEZWZpbml0aW9uXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJVc2UgdGhlIGFsdCBrZXkgaW5zdGVhZCBvZiB0aGUgY3RybC9jbWQga2V5IGZvciBnb3RvIGRlZmludGlvbiBtb3VzZSBvdmVyLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2hvd0hpZGRlbkRpYWdub3N0aWNzOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyAnSGlkZGVuJyBkaWFnbm9zdGljcyBpbiB0aGUgbGludGVyXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJTaG93IG9yIGhpZGUgaGlkZGVuIGRpYWdub3N0aWNzIGluIHRoZSBsaW50ZXIsIHRoaXMgZG9lcyBub3QgYWZmZWN0IGdyZXlpbmcgb3V0IG9mIG5hbWVzcGFjZXMgdGhhdCBhcmUgdW51c2VkLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgYWN0aXZhdGUoc3RhdGUpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgICAgIHRoaXMuX3N0YXJ0ZWQgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmVLZXliaW5kaW5ncygpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGVcIiwgKCkgPT4gdGhpcy50b2dnbGUoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpmaXgtdXNpbmdzXCIsICgpID0+IE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maXh1c2luZ3Moe30pKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzZXR0aW5nc1wiLCAoKSA9PiBhdG9tLndvcmtzcGFjZS5vcGVuKFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlc1wiKVxuICAgICAgICAgICAgLnRoZW4odGFiID0+IHtcbiAgICAgICAgICAgIGlmICh0YWIgJiYgdGFiLmdldFVSSSAmJiB0YWIuZ2V0VVJJKCkgIT09IFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlcy9vbW5pc2hhcnAtYXRvbVwiKSB7XG4gICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXMvb21uaXNoYXJwLWF0b21cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKSk7XG4gICAgICAgIGNvbnN0IGdyYW1tYXJzID0gYXRvbS5ncmFtbWFycztcbiAgICAgICAgY29uc3QgZ3JhbW1hckNiID0gKGdyYW1tYXIpID0+IHtcbiAgICAgICAgICAgIGlmIChfLmZpbmQoT21uaS5ncmFtbWFycywgKGdtcikgPT4gZ21yLnNjb3BlTmFtZSA9PT0gZ3JhbW1hci5zY29wZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgYXRvbS5ncmFtbWFycy5zdGFydElkRm9yU2NvcGUoZ3JhbW1hci5zY29wZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9tbmlzaGFycFNjb3BlTmFtZSA9IGAke2dyYW1tYXIuc2NvcGVOYW1lfS5vbW5pc2hhcnBgO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjb3BlSWQgPSBncmFtbWFycy5pZHNCeVNjb3BlW2dyYW1tYXIuc2NvcGVOYW1lXTtcbiAgICAgICAgICAgICAgICBncmFtbWFycy5pZHNCeVNjb3BlW29tbmlzaGFycFNjb3BlTmFtZV0gPSBzY29wZUlkO1xuICAgICAgICAgICAgICAgIGdyYW1tYXJzLnNjb3Blc0J5SWRbc2NvcGVJZF0gPSBvbW5pc2hhcnBTY29wZU5hbWU7XG4gICAgICAgICAgICAgICAgZ3JhbW1hci5zY29wZU5hbWUgPSBvbW5pc2hhcnBTY29wZU5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIF8uZWFjaChncmFtbWFycy5ncmFtbWFycywgZ3JhbW1hckNiKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmdyYW1tYXJzLm9uRGlkQWRkR3JhbW1hcihncmFtbWFyQ2IpKTtcbiAgICAgICAgcmVxdWlyZShcImF0b20tcGFja2FnZS1kZXBzXCIpLmluc3RhbGwoXCJvbW5pc2hhcnAtYXRvbVwiKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiQWN0aXZhdGluZyBvbW5pc2hhcnAtYXRvbSBzb2x1dGlvbiB0cmFja2luZy4uLlwiKTtcbiAgICAgICAgICAgIE9tbmkuYWN0aXZhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaSk7XG4gICAgICAgICAgICB0aGlzLl9zdGFydGVkLm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLl9zdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmxvYWRGZWF0dXJlcyh0aGlzLmdldEZlYXR1cmVzKFwiYXRvbVwiKS5kZWxheShPbW5pW1wiX2tpY2tfaW5fdGhlX3BhbnRzX1wiXSA/IDAgOiAyMDAwKSkudG9Qcm9taXNlKCkpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBsZXQgc3RhcnRpbmdPYnNlcnZhYmxlID0gT21uaS5hY3RpdmVTb2x1dGlvblxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAgICAgLnRha2UoMSk7XG4gICAgICAgICAgICBpZiAoT21uaVtcIl9raWNrX2luX3RoZV9wYW50c19cIl0pIHtcbiAgICAgICAgICAgICAgICBzdGFydGluZ09ic2VydmFibGUgPSBPYnNlcnZhYmxlLm9mKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzdGFydGluZ09ic2VydmFibGVcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiB0aGlzLmxvYWRGZWF0dXJlcyh0aGlzLmdldEZlYXR1cmVzKFwiZmVhdHVyZXNcIikpKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKChlZGl0b3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0QXV0b1RvZ2dsZUdyYW1tYXIoZWRpdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmF0ZWQubmV4dCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZhdGVkLmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0RmVhdHVyZXMoZm9sZGVyKSB7XG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdCA9IGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tOmZlYXR1cmUtd2hpdGUtbGlzdFwiKTtcbiAgICAgICAgY29uc3QgZmVhdHVyZUxpc3QgPSBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbTpmZWF0dXJlLWxpc3RcIik7XG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdFVuZGVmaW5lZCA9ICh0eXBlb2Ygd2hpdGVMaXN0ID09PSBcInVuZGVmaW5lZFwiKTtcbiAgICAgICAgY29uc29sZS5pbmZvKGBHZXR0aW5nIGZlYXR1cmVzIGZvciBcIiR7Zm9sZGVyfVwiLi4uYCk7XG4gICAgICAgIGNvbnN0IGZlYXR1cmVEaXIgPSBgJHtfX2Rpcm5hbWV9LyR7Zm9sZGVyfWA7XG4gICAgICAgIGZ1bmN0aW9uIGxvYWRGZWF0dXJlKGZpbGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlcXVpcmUoYC4vJHtmb2xkZXJ9LyR7ZmlsZX1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgTG9hZGluZyBmZWF0dXJlIFwiJHtmb2xkZXJ9LyR7ZmlsZX1cIi4uLmApO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnJlYWRkaXIpKGZlYXR1cmVEaXIpXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlcyA9PiBmaWxlcylcbiAgICAgICAgICAgIC5maWx0ZXIoZmlsZSA9PiAvXFwuanMkLy50ZXN0KGZpbGUpKVxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZSA9PiBPYnNlcnZhYmxlLmJpbmROb2RlQ2FsbGJhY2soZnMuc3RhdCkoYCR7ZmVhdHVyZURpcn0vJHtmaWxlfWApLCAoZmlsZSwgc3RhdCkgPT4gKHsgZmlsZSwgc3RhdCB9KSlcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhei5zdGF0LmlzRGlyZWN0b3J5KCkpXG4gICAgICAgICAgICAubWFwKHogPT4gKHtcbiAgICAgICAgICAgIGZpbGU6IGAke2ZvbGRlcn0vJHtwYXRoLmJhc2VuYW1lKHouZmlsZSl9YC5yZXBsYWNlKC9cXC5qcyQvLCBcIlwiKSxcbiAgICAgICAgICAgIGxvYWQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmZWF0dXJlID0gbG9hZEZlYXR1cmUoei5maWxlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmZWF0dXJlcyA9IFtdO1xuICAgICAgICAgICAgICAgIF8uZWFjaChmZWF0dXJlLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNGdW5jdGlvbih2YWx1ZSkgJiYgIV8uaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWUucmVxdWlyZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ1trZXldID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogYCR7dmFsdWUudGl0bGV9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHZhbHVlLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogKF8uaGFzKHZhbHVlLCBcImRlZmF1bHRcIikgPyB2YWx1ZS5kZWZhdWx0IDogdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5LCBhY3RpdmF0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmF0ZUZlYXR1cmUod2hpdGVMaXN0VW5kZWZpbmVkLCBrZXksIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20oZmVhdHVyZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSlcbiAgICAgICAgICAgIC5maWx0ZXIobCA9PiB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHdoaXRlTGlzdCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdoaXRlTGlzdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLmluY2x1ZGVzKGZlYXR1cmVMaXN0LCBsLmZpbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFfLmluY2x1ZGVzKGZlYXR1cmVMaXN0LCBsLmZpbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgbG9hZEZlYXR1cmVzKGZlYXR1cmVzKSB7XG4gICAgICAgIHJldHVybiBmZWF0dXJlc1xuICAgICAgICAgICAgLmNvbmNhdE1hcCh6ID0+IHoubG9hZCgpKVxuICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgLmNvbmNhdE1hcCh4ID0+IHgpXG4gICAgICAgICAgICAubWFwKGYgPT4gZi5hY3RpdmF0ZSgpKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheClcbiAgICAgICAgICAgIC50b0FycmF5KClcbiAgICAgICAgICAgIC5kbyh7XG4gICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGF0b20uY29uZmlnLnNldFNjaGVtYShcIm9tbmlzaGFycC1hdG9tXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogdGhpcy5jb25maWdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeCA9PiB4KVxuICAgICAgICAgICAgLmRvKHggPT4geCgpKTtcbiAgICB9XG4gICAgYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gbnVsbDtcbiAgICAgICAgbGV0IGZpcnN0UnVuID0gdHJ1ZTtcbiAgICAgICAgaWYgKHdoaXRlTGlzdFVuZGVmaW5lZCAmJiBfLmhhcyh0aGlzLmNvbmZpZywga2V5KSkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnS2V5ID0gYG9tbmlzaGFycC1hdG9tLiR7a2V5fWA7XG4gICAgICAgICAgICBsZXQgZW5hYmxlRGlzcG9zYWJsZSwgZGlzYWJsZURpc3Bvc2FibGU7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlnS2V5LCBlbmFibGVkID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpc2FibGVEaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc2FibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChleCkgeyB9XG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUgPSBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTplbmFibGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksIHRydWUpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlbmFibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmFibGVEaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzYWJsZURpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBY3RpdmF0aW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlW1wiYXR0YWNoXCJdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0UnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbXCJhdHRhY2hcIl0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbXCJhdHRhY2hcIl0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgYG9tbmlzaGFycC1mZWF0dXJlOmRpc2FibGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksIGZhbHNlKSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzYWJsZURpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaXJzdFJ1biA9IGZhbHNlO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTp0b2dnbGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksICFhdG9tLmNvbmZpZy5nZXQoY29uZmlnS2V5KSkpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlLmFjdGl2YXRlKCk7XG4gICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlW1wiYXR0YWNoXCJdKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHsgdHJ5IHtcbiAgICAgICAgICAgIHZhbHVlLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXgpIHsgfSB9KSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyKGVkaXRvcikge1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICAgICAgdGhpcy5kZXRlY3RHcmFtbWFyKGVkaXRvciwgZ3JhbW1hcik7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hcigoZ21yKSA9PiB0aGlzLmRldGVjdEdyYW1tYXIoZWRpdG9yLCBnbXIpKSk7XG4gICAgfVxuICAgIGRldGVjdEdyYW1tYXIoZWRpdG9yLCBncmFtbWFyKSB7XG4gICAgICAgIGlmICghYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZVwiKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChPbW5pLmlzVmFsaWRHcmFtbWFyKGdyYW1tYXIpKSB7XG4gICAgICAgICAgICBpZiAoT21uaS5pc09mZikge1xuICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZ3JhbW1hci5uYW1lID09PSBcIkpTT05cIikge1xuICAgICAgICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZWRpdG9yLmdldFBhdGgoKSkgPT09IFwicHJvamVjdC5qc29uXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoT21uaS5pc09mZikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB0b2dnbGUoKSB7XG4gICAgICAgIGlmIChPbW5pLmlzT2ZmKSB7XG4gICAgICAgICAgICBPbW5pLmNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChPbW5pLmlzT24pIHtcbiAgICAgICAgICAgIE9tbmkuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRlYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyKSB7XG4gICAgICAgIGxldCBmID0gcmVxdWlyZShcIi4vYXRvbS9zdGF0dXMtYmFyXCIpO1xuICAgICAgICBmLnN0YXR1c0Jhci5zZXR1cChzdGF0dXNCYXIpO1xuICAgICAgICBmID0gcmVxdWlyZShcIi4vYXRvbS9mcmFtZXdvcmstc2VsZWN0b3JcIik7XG4gICAgICAgIGYuZnJhbWV3b3JrU2VsZWN0b3Iuc2V0dXAoc3RhdHVzQmFyKTtcbiAgICAgICAgZiA9IHJlcXVpcmUoXCIuL2F0b20vZmVhdHVyZS1idXR0b25zXCIpO1xuICAgICAgICBmLmZlYXR1cmVFZGl0b3JCdXR0b25zLnNldHVwKHN0YXR1c0Jhcik7XG4gICAgfVxuICAgIGNvbnN1bWVZZW9tYW5FbnZpcm9ubWVudChnZW5lcmF0b3JTZXJ2aWNlKSB7XG4gICAgICAgIGNvbnN0IHsgZ2VuZXJhdG9yQXNwbmV0IH0gPSByZXF1aXJlKFwiLi9hdG9tL2dlbmVyYXRvci1hc3BuZXRcIik7XG4gICAgICAgIGdlbmVyYXRvckFzcG5ldC5zZXR1cChnZW5lcmF0b3JTZXJ2aWNlKTtcbiAgICB9XG4gICAgcHJvdmlkZUF1dG9jb21wbGV0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoXCIuL3NlcnZpY2VzL2NvbXBsZXRpb24tcHJvdmlkZXJcIik7XG4gICAgfVxuICAgIHByb3ZpZGVMaW50ZXIoKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgcHJvdmlkZVByb2plY3RKc29uKCkge1xuICAgICAgICByZXR1cm4gcmVxdWlyZShcIi4vc2VydmljZXMvcHJvamVjdC1wcm92aWRlclwiKS5jb25jYXQocmVxdWlyZShcIi4vc2VydmljZXMvZnJhbWV3b3JrLXByb3ZpZGVyXCIpKTtcbiAgICB9XG4gICAgY29uc3VtZUxpbnRlcihsaW50ZXIpIHtcbiAgICAgICAgY29uc3QgTGludGVyUHJvdmlkZXIgPSByZXF1aXJlKFwiLi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXJcIik7XG4gICAgICAgIGNvbnN0IGxpbnRlcnMgPSBMaW50ZXJQcm92aWRlci5wcm92aWRlcjtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2gobGludGVycywgbCA9PiB7XG4gICAgICAgICAgICAgICAgbGludGVyLmRlbGV0ZUxpbnRlcihsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoTGludGVyUHJvdmlkZXIuaW5pdChsaW50ZXIpKTtcbiAgICB9XG4gICAgY29uc3VtZUluZGllTGludGVyKGxpbnRlcikge1xuICAgICAgICByZXF1aXJlKFwiLi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXJcIikucmVnaXN0ZXJJbmRpZShsaW50ZXIsIHRoaXMuZGlzcG9zYWJsZSk7XG4gICAgfVxuICAgIGNvbmZpZ3VyZUtleWJpbmRpbmdzKCkge1xuICAgICAgICBsZXQgZGlzcG9zYWJsZTtcbiAgICAgICAgY29uc3Qgb21uaXNoYXJwQWR2YW5jZWRGaWxlTmV3ID0gT21uaS5wYWNrYWdlRGlyICsgXCIvb21uaXNoYXJwLWF0b20va2V5bWFwcy9vbW5pc2hhcnAtZmlsZS1uZXcuY3NvblwiO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5lbmFibGVBZHZhbmNlZEZpbGVOZXdcIiwgKGVuYWJsZWQpID0+IHtcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZSA9IGF0b20ua2V5bWFwcy5sb2FkS2V5bWFwKG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlzcG9zYWJsZSlcbiAgICAgICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgYXRvbS5rZXltYXBzLnJlbW92ZUJpbmRpbmdzRnJvbVNvdXJjZShvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBuZXcgT21uaVNoYXJwQXRvbTtcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBBc3luY1N1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XHJcblxyXG4vLyBUT0RPOiBSZW1vdmUgdGhlc2UgYXQgc29tZSBwb2ludCB0byBzdHJlYW0gbGluZSBzdGFydHVwLlxyXG5pbXBvcnQge09tbml9IGZyb20gXCIuL3NlcnZlci9vbW5pXCI7XHJcbmNvbnN0IHdpbjMyID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiO1xyXG5cclxuY2xhc3MgT21uaVNoYXJwQXRvbSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICAvLyBJbnRlcm5hbDogVXNlZCBieSB1bml0IHRlc3RpbmcgdG8gbWFrZSBzdXJlIHRoZSBwbHVnaW4gaXMgY29tcGxldGVseSBhY3RpdmF0ZWQuXHJcbiAgICBwcml2YXRlIF9zdGFydGVkOiBBc3luY1N1YmplY3Q8Ym9vbGVhbj47XHJcbiAgICBwcml2YXRlIF9hY3RpdmF0ZWQ6IEFzeW5jU3ViamVjdDxib29sZWFuPjtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoc3RhdGU6IGFueSkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0ZWQgPSBuZXcgQXN5bmNTdWJqZWN0PGJvb2xlYW4+KCk7XHJcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gbmV3IEFzeW5jU3ViamVjdDxib29sZWFuPigpO1xyXG5cclxuICAgICAgICB0aGlzLmNvbmZpZ3VyZUtleWJpbmRpbmdzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnRvZ2dsZVwiLCAoKSA9PiB0aGlzLnRvZ2dsZSgpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Zml4LXVzaW5nc1wiLCAoKSA9PiBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZml4dXNpbmdzKHt9KSkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzZXR0aW5nc1wiLCAoKSA9PiBhdG9tLndvcmtzcGFjZS5vcGVuKFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlc1wiKVxyXG4gICAgICAgICAgICAudGhlbih0YWIgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRhYiAmJiB0YWIuZ2V0VVJJICYmIHRhYi5nZXRVUkkoKSAhPT0gXCJhdG9tOi8vY29uZmlnL3BhY2thZ2VzL29tbmlzaGFycC1hdG9tXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlcy9vbW5pc2hhcnAtYXRvbVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpKTtcclxuXHJcbiAgICAgICAgY29uc3QgZ3JhbW1hcnMgPSAoPGFueT5hdG9tLmdyYW1tYXJzKTtcclxuICAgICAgICBjb25zdCBncmFtbWFyQ2IgPSAoZ3JhbW1hcjogeyBzY29wZU5hbWU6IHN0cmluZzsgfSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoXy5maW5kKE9tbmkuZ3JhbW1hcnMsIChnbXI6IGFueSkgPT4gZ21yLnNjb3BlTmFtZSA9PT0gZ3JhbW1hci5zY29wZU5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmUgdGhlIHNjb3BlIGhhcyBiZWVuIGluaXRlZFxyXG4gICAgICAgICAgICAgICAgYXRvbS5ncmFtbWFycy5zdGFydElkRm9yU2NvcGUoZ3JhbW1hci5zY29wZU5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IG9tbmlzaGFycFNjb3BlTmFtZSA9IGAke2dyYW1tYXIuc2NvcGVOYW1lfS5vbW5pc2hhcnBgO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NvcGVJZCA9IGdyYW1tYXJzLmlkc0J5U2NvcGVbZ3JhbW1hci5zY29wZU5hbWVdO1xyXG4gICAgICAgICAgICAgICAgZ3JhbW1hcnMuaWRzQnlTY29wZVtvbW5pc2hhcnBTY29wZU5hbWVdID0gc2NvcGVJZDtcclxuICAgICAgICAgICAgICAgIGdyYW1tYXJzLnNjb3Blc0J5SWRbc2NvcGVJZF0gPSBvbW5pc2hhcnBTY29wZU5hbWU7XHJcbiAgICAgICAgICAgICAgICBncmFtbWFyLnNjb3BlTmFtZSA9IG9tbmlzaGFycFNjb3BlTmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXy5lYWNoKGdyYW1tYXJzLmdyYW1tYXJzLCBncmFtbWFyQ2IpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5ncmFtbWFycy5vbkRpZEFkZEdyYW1tYXIoZ3JhbW1hckNiKSk7XHJcblxyXG4gICAgICAgIHJlcXVpcmUoXCJhdG9tLXBhY2thZ2UtZGVwc1wiKS5pbnN0YWxsKFwib21uaXNoYXJwLWF0b21cIilcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiQWN0aXZhdGluZyBvbW5pc2hhcnAtYXRvbSBzb2x1dGlvbiB0cmFja2luZy4uLlwiKTtcclxuICAgICAgICAgICAgICAgIE9tbmkuYWN0aXZhdGUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRlZC5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRlZC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmxvYWRGZWF0dXJlcyh0aGlzLmdldEZlYXR1cmVzKFwiYXRvbVwiKS5kZWxheShPbW5pW1wiX2tpY2tfaW5fdGhlX3BhbnRzX1wiXSA/IDAgOiAyMDAwKSkudG9Qcm9taXNlKCkpXHJcbiAgICAgICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0aW5nT2JzZXJ2YWJsZSA9IE9tbmkuYWN0aXZlU29sdXRpb25cclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxyXG4gICAgICAgICAgICAgICAgICAgIC50YWtlKDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICAgICAgICAgICAgICBpZiAoT21uaVtcIl9raWNrX2luX3RoZV9wYW50c19cIl0pIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFydGluZ09ic2VydmFibGUgPSBPYnNlcnZhYmxlLm9mKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGFjdGl2YXRlIGZlYXR1cmVzIG9uY2Ugd2UgaGF2ZSBhIHNvbHV0aW9uIVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzdGFydGluZ09ic2VydmFibGVcclxuICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiB0aGlzLmxvYWRGZWF0dXJlcyh0aGlzLmdldEZlYXR1cmVzKFwiZmVhdHVyZXNcIikpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXRlY3RBdXRvVG9nZ2xlR3JhbW1hcihlZGl0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlZC5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZhdGVkLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RmVhdHVyZXMoZm9sZGVyOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCB3aGl0ZUxpc3QgPSBhdG9tLmNvbmZpZy5nZXQ8Ym9vbGVhbj4oXCJvbW5pc2hhcnAtYXRvbTpmZWF0dXJlLXdoaXRlLWxpc3RcIik7XHJcbiAgICAgICAgY29uc3QgZmVhdHVyZUxpc3QgPSBhdG9tLmNvbmZpZy5nZXQ8c3RyaW5nW10+KFwib21uaXNoYXJwLWF0b206ZmVhdHVyZS1saXN0XCIpO1xyXG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdFVuZGVmaW5lZCA9ICh0eXBlb2Ygd2hpdGVMaXN0ID09PSBcInVuZGVmaW5lZFwiKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5pbmZvKGBHZXR0aW5nIGZlYXR1cmVzIGZvciBcIiR7Zm9sZGVyfVwiLi4uYCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGZlYXR1cmVEaXIgPSBgJHtfX2Rpcm5hbWV9LyR7Zm9sZGVyfWA7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGxvYWRGZWF0dXJlKGZpbGU6IHN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSByZXF1aXJlKGAuLyR7Zm9sZGVyfS8ke2ZpbGV9YCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgTG9hZGluZyBmZWF0dXJlIFwiJHtmb2xkZXJ9LyR7ZmlsZX1cIi4uLmApO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0Oy8vXy52YWx1ZXMocmVzdWx0KS5maWx0ZXIoZmVhdHVyZSA9PiAhXy5pc0Z1bmN0aW9uKGZlYXR1cmUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmJpbmROb2RlQ2FsbGJhY2soZnMucmVhZGRpcikoZmVhdHVyZURpcilcclxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZXMgPT4gZmlsZXMpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoZmlsZSA9PiAvXFwuanMkLy50ZXN0KGZpbGUpKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlID0+IE9ic2VydmFibGUuYmluZE5vZGVDYWxsYmFjayhmcy5zdGF0KShgJHtmZWF0dXJlRGlyfS8ke2ZpbGV9YCksIChmaWxlLCBzdGF0KSA9PiAoeyBmaWxlLCBzdGF0IH0pKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXouc3RhdC5pc0RpcmVjdG9yeSgpKVxyXG4gICAgICAgICAgICAubWFwKHogPT4gKHtcclxuICAgICAgICAgICAgICAgIGZpbGU6IGAke2ZvbGRlcn0vJHtwYXRoLmJhc2VuYW1lKHouZmlsZSl9YC5yZXBsYWNlKC9cXC5qcyQvLCBcIlwiKSxcclxuICAgICAgICAgICAgICAgIGxvYWQ6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmZWF0dXJlID0gbG9hZEZlYXR1cmUoei5maWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmVhdHVyZXM6IHsga2V5OiBzdHJpbmcsIGFjdGl2YXRlOiAoKSA9PiAoKSA9PiB2b2lkIH1bXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIF8uZWFjaChmZWF0dXJlLCAodmFsdWU6IElGZWF0dXJlLCBrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNGdW5jdGlvbih2YWx1ZSkgJiYgIV8uaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWUucmVxdWlyZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ1trZXldID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogYCR7dmFsdWUudGl0bGV9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHZhbHVlLmRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogKF8uaGFzKHZhbHVlLCBcImRlZmF1bHRcIikgPyB2YWx1ZS5kZWZhdWx0IDogdHJ1ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSwgYWN0aXZhdGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZCwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbTx7IGtleTogc3RyaW5nLCBhY3RpdmF0ZTogKCkgPT4gKCkgPT4gdm9pZCB9PihmZWF0dXJlcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAuZmlsdGVyKGwgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aGl0ZUxpc3QgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAod2hpdGVMaXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF8uaW5jbHVkZXMoZmVhdHVyZUxpc3QsIGwuZmlsZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhXy5pbmNsdWRlcyhmZWF0dXJlTGlzdCwgbC5maWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxvYWRGZWF0dXJlcyhmZWF0dXJlczogT2JzZXJ2YWJsZTx7IGZpbGU6IHN0cmluZzsgbG9hZDogKCkgPT4gT2JzZXJ2YWJsZTx7IGtleTogc3RyaW5nLCBhY3RpdmF0ZTogKCkgPT4gKCkgPT4gdm9pZCB9PiB9Pikge1xyXG4gICAgICAgIHJldHVybiBmZWF0dXJlc1xyXG4gICAgICAgICAgICAuY29uY2F0TWFwKHogPT4gei5sb2FkKCkpXHJcbiAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgLmNvbmNhdE1hcCh4ID0+IHgpXHJcbiAgICAgICAgICAgIC5tYXAoZiA9PiBmLmFjdGl2YXRlKCkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXHJcbiAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgLmRvKHtcclxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgKDxhbnk+YXRvbS5jb25maWcpLnNldFNjaGVtYShcIm9tbmlzaGFycC1hdG9tXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogdGhpcy5jb25maWdcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNvbmNhdE1hcCh4ID0+IHgpXHJcbiAgICAgICAgICAgIC5kbyh4ID0+IHgoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlRmVhdHVyZSh3aGl0ZUxpc3RVbmRlZmluZWQ6IGJvb2xlYW4sIGtleTogc3RyaW5nLCB2YWx1ZTogSUZlYXR1cmUpIHtcclxuICAgICAgICBsZXQgcmVzdWx0OiAoKSA9PiB2b2lkID0gbnVsbDtcclxuICAgICAgICBsZXQgZmlyc3RSdW4gPSB0cnVlO1xyXG5cclxuICAgICAgICAvLyBXaGl0ZWxpc3QgaXMgdXNlZCBmb3IgdW5pdCB0ZXN0aW5nLCB3ZSBkb25cInQgd2FudCB0aGUgY29uZmlnIHRvIG1ha2UgY2hhbmdlcyBoZXJlXHJcbiAgICAgICAgaWYgKHdoaXRlTGlzdFVuZGVmaW5lZCAmJiBfLmhhcyh0aGlzLmNvbmZpZywga2V5KSkge1xyXG4gICAgICAgICAgICBjb25zdCBjb25maWdLZXkgPSBgb21uaXNoYXJwLWF0b20uJHtrZXl9YDtcclxuICAgICAgICAgICAgbGV0IGVuYWJsZURpc3Bvc2FibGU6IElEaXNwb3NhYmxlLCBkaXNhYmxlRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWdLZXksIGVuYWJsZWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpc2FibGVEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNhYmxlRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7IHZhbHVlLmRpc3Bvc2UoKTsgfSBjYXRjaCAoZXgpIHsgLyogKi8gfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlID0gYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWZlYXR1cmU6ZW5hYmxlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCB0cnVlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlbmFibGVEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVuYWJsZURpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzYWJsZURpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQWN0aXZhdGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlW1wiYXR0YWNoXCJdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3RSdW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtcImF0dGFjaFwiXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbXCJhdHRhY2hcIl0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZURpc3Bvc2FibGUgPSBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTpkaXNhYmxlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCBmYWxzZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzYWJsZURpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZmlyc3RSdW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWZlYXR1cmU6dG9nZ2xlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZ0tleSkpKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFsdWUuYWN0aXZhdGUoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odmFsdWVbXCJhdHRhY2hcIl0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVbXCJhdHRhY2hcIl0oKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4geyB0cnkgeyB2YWx1ZS5kaXNwb3NlKCk7IH0gY2F0Y2ggKGV4KSB7IC8qICovIH0gfSkpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkZXRlY3RBdXRvVG9nZ2xlR3JhbW1hcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xyXG4gICAgICAgIHRoaXMuZGV0ZWN0R3JhbW1hcihlZGl0b3IsIGdyYW1tYXIpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hcigoZ21yOiBGaXJzdE1hdGUuR3JhbW1hcikgPT4gdGhpcy5kZXRlY3RHcmFtbWFyKGVkaXRvciwgZ21yKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZGV0ZWN0R3JhbW1hcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgZ3JhbW1hcjogRmlyc3RNYXRlLkdyYW1tYXIpIHtcclxuICAgICAgICBpZiAoIWF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLmF1dG9TdGFydE9uQ29tcGF0aWJsZUZpbGVcIikpIHtcclxuICAgICAgICAgICAgcmV0dXJuOyAvL3Nob3J0IG91dCwgaWYgc2V0dGluZyB0byBub3QgYXV0byBzdGFydCBpcyBlbmFibGVkXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoT21uaS5pc1ZhbGlkR3JhbW1hcihncmFtbWFyKSkge1xyXG4gICAgICAgICAgICBpZiAoT21uaS5pc09mZikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50b2dnbGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoZ3JhbW1hci5uYW1lID09PSBcIkpTT05cIikge1xyXG4gICAgICAgICAgICBpZiAocGF0aC5iYXNlbmFtZShlZGl0b3IuZ2V0UGF0aCgpKSA9PT0gXCJwcm9qZWN0Lmpzb25cIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b2dnbGUoKSB7XHJcbiAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcclxuICAgICAgICAgICAgT21uaS5jb25uZWN0KCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChPbW5pLmlzT24pIHtcclxuICAgICAgICAgICAgT21uaS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyOiBhbnkpIHtcclxuICAgICAgICBsZXQgZiA9IHJlcXVpcmUoXCIuL2F0b20vc3RhdHVzLWJhclwiKTtcclxuICAgICAgICBmLnN0YXR1c0Jhci5zZXR1cChzdGF0dXNCYXIpO1xyXG4gICAgICAgIGYgPSByZXF1aXJlKFwiLi9hdG9tL2ZyYW1ld29yay1zZWxlY3RvclwiKTtcclxuICAgICAgICBmLmZyYW1ld29ya1NlbGVjdG9yLnNldHVwKHN0YXR1c0Jhcik7XHJcbiAgICAgICAgZiA9IHJlcXVpcmUoXCIuL2F0b20vZmVhdHVyZS1idXR0b25zXCIpO1xyXG4gICAgICAgIGYuZmVhdHVyZUVkaXRvckJ1dHRvbnMuc2V0dXAoc3RhdHVzQmFyKTtcclxuICAgIH1cclxuXHJcbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbiAgICBwdWJsaWMgY29uc3VtZVllb21hbkVudmlyb25tZW50KGdlbmVyYXRvclNlcnZpY2U6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHtnZW5lcmF0b3JBc3BuZXR9ID0gcmVxdWlyZShcIi4vYXRvbS9nZW5lcmF0b3ItYXNwbmV0XCIpO1xyXG4gICAgICAgIGdlbmVyYXRvckFzcG5ldC5zZXR1cChnZW5lcmF0b3JTZXJ2aWNlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJvdmlkZUF1dG9jb21wbGV0ZSgpIHtcclxuICAgICAgICByZXR1cm4gcmVxdWlyZShcIi4vc2VydmljZXMvY29tcGxldGlvbi1wcm92aWRlclwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJvdmlkZUxpbnRlcigpOiBhbnlbXSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIC8vY29uc3QgTGludGVyUHJvdmlkZXIgPSByZXF1aXJlKFwiLi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXJcIik7XHJcbiAgICAgICAgLy9yZXR1cm4gTGludGVyUHJvdmlkZXIucHJvdmlkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByb3ZpZGVQcm9qZWN0SnNvbigpIHtcclxuICAgICAgICByZXR1cm4gcmVxdWlyZShcIi4vc2VydmljZXMvcHJvamVjdC1wcm92aWRlclwiKS5jb25jYXQocmVxdWlyZShcIi4vc2VydmljZXMvZnJhbWV3b3JrLXByb3ZpZGVyXCIpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uc3VtZUxpbnRlcihsaW50ZXI6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IExpbnRlclByb3ZpZGVyID0gcmVxdWlyZShcIi4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyXCIpO1xyXG4gICAgICAgIGNvbnN0IGxpbnRlcnMgPSBMaW50ZXJQcm92aWRlci5wcm92aWRlcjtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaChsaW50ZXJzLCBsID0+IHtcclxuICAgICAgICAgICAgICAgIGxpbnRlci5kZWxldGVMaW50ZXIobCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChMaW50ZXJQcm92aWRlci5pbml0KGxpbnRlcikpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25zdW1lSW5kaWVMaW50ZXIobGludGVyOiBhbnkpIHtcclxuICAgICAgICByZXF1aXJlKFwiLi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXJcIikucmVnaXN0ZXJJbmRpZShsaW50ZXIsIHRoaXMuZGlzcG9zYWJsZSk7XHJcbiAgICB9XHJcbiAgICAvKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuXHJcbiAgICBwcml2YXRlIGNvbmZpZ3VyZUtleWJpbmRpbmdzKCkge1xyXG4gICAgICAgIGxldCBkaXNwb3NhYmxlOiBFdmVudEtpdC5EaXNwb3NhYmxlO1xyXG4gICAgICAgIGNvbnN0IG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyA9IE9tbmkucGFja2FnZURpciArIFwiL29tbmlzaGFycC1hdG9tL2tleW1hcHMvb21uaXNoYXJwLWZpbGUtbmV3LmNzb25cIjtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5lbmFibGVBZHZhbmNlZEZpbGVOZXdcIiwgKGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUgPSBhdG9tLmtleW1hcHMubG9hZEtleW1hcChvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRpc3Bvc2FibGUpIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgYXRvbS5rZXltYXBzLnJlbW92ZUJpbmRpbmdzRnJvbVNvdXJjZShvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25maWcgPSB7XHJcbiAgICAgICAgYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZToge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJBdXRvc3RhcnQgT21uaXNoYXJwIFJvc2x5blwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBdXRvbWF0aWNhbGx5IHN0YXJ0cyBPbW5pc2hhcnAgUm9zbHluIHdoZW4gYSBjb21wYXRpYmxlIGZpbGUgaXMgb3BlbmVkLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGV2ZWxvcGVyTW9kZToge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJEZXZlbG9wZXIgTW9kZVwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJPdXRwdXRzIGRldGFpbGVkIHNlcnZlciBjYWxscyBpbiBjb25zb2xlLmxvZ1wiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9uczoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJTaG93IERpYWdub3N0aWNzIGZvciBhbGwgU29sdXRpb25zXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFkdmFuY2VkOiBUaGlzIHdpbGwgc2hvdyBkaWFnbm9zdGljcyBmb3IgYWxsIG9wZW4gc29sdXRpb25zLiAgTk9URTogTWF5IHRha2UgYSByZXN0YXJ0IG9yIGNoYW5nZSB0byBlYWNoIHNlcnZlciB0byB0YWtlIGVmZmVjdCB3aGVuIHR1cm5lZCBvbi5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbmFibGVBZHZhbmNlZEZpbGVOZXc6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiRW5hYmxlIGBBZHZhbmNlZCBGaWxlIE5ld2BcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRW5hYmxlIGBBZHZhbmNlZCBGaWxlIE5ld2Agd2hlbiBkb2luZyBjdHJsLW4vY21kLW4gd2l0aGluIGEgQyMgZWRpdG9yLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlVzZSBMZWZ0LUxhYmVsIGNvbHVtbiBpbiBTdWdnZXN0aW9uc1wiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTaG93cyByZXR1cm4gdHlwZXMgaW4gYSByaWdodC1hbGlnbmVkIGNvbHVtbiB0byB0aGUgbGVmdCBvZiB0aGUgY29tcGxldGlvbiBzdWdnZXN0aW9uIHRleHQuXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXNlSWNvbnM6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiVXNlIHVuaXF1ZSBpY29ucyBmb3Iga2luZCBpbmRpY2F0b3JzIGluIFN1Z2dlc3Rpb25zXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3dzIGtpbmRzIHdpdGggdW5pcXVlIGljb25zIHJhdGhlciB0aGFuIGF1dG9jb21wbGV0ZSBkZWZhdWx0IHN0eWxlcy5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9BZGp1c3RUcmVlVmlldzoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJBZGp1c3QgdGhlIHRyZWUgdmlldyB0byBtYXRjaCB0aGUgc29sdXRpb24gcm9vdC5cIixcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJUaGlzIHdpbGwgYXV0b21hdGljYWxseSBhZGp1c3QgdGhlIHRyZWV2aWV3IHRvIGJlIHRoZSByb290IG9mIHRoZSBzb2x1dGlvbi5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBuYWdBZGp1c3RUcmVlVmlldzoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJTaG93IHRoZSBub3RpZmljYXRpb25zIHRvIEFkanVzdCB0aGUgdHJlZSB2aWV3XCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvQWRkRXh0ZXJuYWxQcm9qZWN0czoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJBZGQgZXh0ZXJuYWwgcHJvamVjdHMgdG8gdGhlIHRyZWUgdmlldy5cIixcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJUaGlzIHdpbGwgYXV0b21hdGljYWxseSBhZGQgZXh0ZXJuYWwgc291cmNlcyB0byB0aGUgdHJlZSB2aWV3LlxcbiBFeHRlcm5hbCBzb3VyY2VzIGFyZSBhbnkgcHJvamVjdHMgdGhhdCBhcmUgbG9hZGVkIG91dHNpZGUgb2YgdGhlIHNvbHV0aW9uIHJvb3QuXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbmFnQWRkRXh0ZXJuYWxQcm9qZWN0czoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJTaG93IHRoZSBub3RpZmljYXRpb25zIHRvIGFkZCBvciByZW1vdmUgZXh0ZXJuYWwgcHJvamVjdHNcIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhpZGVMaW50ZXJJbnRlcmZhY2U6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiSGlkZSB0aGUgbGludGVyIGludGVyZmFjZSB3aGVuIHVzaW5nIG9tbmlzaGFycC1hdG9tIGVkaXRvcnNcIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdhbnRNZXRhZGF0YToge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJSZXF1ZXN0IG1ldGFkYXRhIGRlZmluaXRpb24gd2l0aCBHb3RvIERlZmluaXRpb25cIixcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJSZXF1ZXN0IHN5bWJvbCBtZXRhZGF0YSBmcm9tIHRoZSBzZXJ2ZXIsIHdoZW4gdXNpbmcgZ28tdG8tZGVmaW5pdGlvbi4gIFRoaXMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdCBvbiBMaW51eCwgZHVlIHRvIGlzc3VlcyB3aXRoIFJvc2x5biBvbiBNb25vLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogd2luMzJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFsdEdvdG9EZWZpbml0aW9uOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkFsdCBHbyBUbyBEZWZpbml0aW9uXCIsXHJcbiAgICAgICAgICAgIGRlc2NycHRpb246IFwiVXNlIHRoZSBhbHQga2V5IGluc3RlYWQgb2YgdGhlIGN0cmwvY21kIGtleSBmb3IgZ290byBkZWZpbnRpb24gbW91c2Ugb3Zlci5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaG93SGlkZGVuRGlhZ25vc3RpY3M6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyAnSGlkZGVuJyBkaWFnbm9zdGljcyBpbiB0aGUgbGludGVyXCIsXHJcbiAgICAgICAgICAgIGRlc2NycHRpb246IFwiU2hvdyBvciBoaWRlIGhpZGRlbiBkaWFnbm9zdGljcyBpbiB0aGUgbGludGVyLCB0aGlzIGRvZXMgbm90IGFmZmVjdCBncmV5aW5nIG91dCBvZiBuYW1lc3BhY2VzIHRoYXQgYXJlIHVudXNlZC5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBPbW5pU2hhcnBBdG9tO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
