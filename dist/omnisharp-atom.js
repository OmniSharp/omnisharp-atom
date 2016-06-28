"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _fs = require("fs");

var fs = _interopRequireWildcard(_fs);

var _omni = require("./server/omni");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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

            this.disposable = new _omnisharpClient.CompositeDisposable();
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
                }).subscribe({ complete: function complete() {
                        _this.disposable.add(atom.workspace.observeTextEditors(function (editor) {
                            _this.detectAutoToggleGrammar(editor);
                        }));
                        _this._activated.next(true);
                        _this._activated.complete();
                    } }));
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
            var packageDir = _omni.Omni.packageDir;
            var featureDir = packageDir + "/omnisharp-atom/lib/" + folder;
            function loadFeature(file) {
                var result = require("./" + folder + "/" + file);
                console.info("Loading feature \"" + folder + "/" + file + "\"...");
                return result;
            }
            return _rxjs.Observable.bindNodeCallback(fs.readdir)(featureDir).flatMap(function (files) {
                return files;
            }).filter(function (file) {
                return (/\.js$/.test(file)
                );
            }).flatMap(function (file) {
                return _rxjs.Observable.bindNodeCallback(fs.stat)(featureDir + "/" + file);
            }, function (file, stat) {
                return { file: file, stat: stat };
            }).filter(function (z) {
                return !z.stat.isDirectory();
            }).map(function (z) {
                return {
                    file: (folder + "/" + path.basename(z.file)).replace(/\.js$/, ""),
                    load: function load() {
                        var feature = loadFeature(z.file);
                        var features = [];
                        _lodash2.default.each(feature, function (value, key) {
                            if (!_lodash2.default.isFunction(value)) {
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
            }).toArray().do({ complete: function complete() {
                    atom.config.setSchema("omnisharp-atom", {
                        type: "object",
                        properties: _this3.config
                    });
                } }).concatMap(function (x) {
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
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
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
                if (path.basename(editor.getPath()) === "project.json") {
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
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9vbW5pc2hhcnAtYXRvbS5qcyIsImxpYi9vbW5pc2hhcnAtYXRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7SUNBWTs7QURDWjs7SUNBWTs7QURDWjs7Ozs7Ozs7QUNHQSxJQUFNLFFBQVEsUUFBUSxRQUFSLEtBQXFCLE9BQXJCOztJQUVkO0FBQUEsNkJBQUE7OztBQTZUVyxhQUFBLE1BQUEsR0FBUztBQUNaLHVDQUEyQjtBQUN2Qix1QkFBTyw0QkFBUDtBQUNBLDZCQUFhLHlFQUFiO0FBQ0Esc0JBQU0sU0FBTjtBQUNBLHlCQUFTLElBQVQ7YUFKSjtBQU1BLDJCQUFlO0FBQ1gsdUJBQU8sZ0JBQVA7QUFDQSw2QkFBYSw4Q0FBYjtBQUNBLHNCQUFNLFNBQU47QUFDQSx5QkFBUyxLQUFUO2FBSko7QUFNQSw0Q0FBZ0M7QUFDNUIsdUJBQU8sb0NBQVA7QUFDQSw2QkFBYSxnSkFBYjtBQUNBLHNCQUFNLFNBQU47QUFDQSx5QkFBUyxLQUFUO2FBSko7QUFNQSxtQ0FBdUI7QUFDbkIsdUJBQU8sNEJBQVA7QUFDQSw2QkFBYSx3RUFBYjtBQUNBLHNCQUFNLFNBQU47QUFDQSx5QkFBUyxLQUFUO2FBSko7QUFNQSw4Q0FBa0M7QUFDOUIsdUJBQU8sc0NBQVA7QUFDQSw2QkFBYSw2RkFBYjtBQUNBLHNCQUFNLFNBQU47QUFDQSx5QkFBUyxLQUFUO2FBSko7QUFNQSxzQkFBVTtBQUNOLHVCQUFPLHFEQUFQO0FBQ0EsNkJBQWEsd0VBQWI7QUFDQSxzQkFBTSxTQUFOO0FBQ0EseUJBQVMsSUFBVDthQUpKO0FBTUEsZ0NBQW9CO0FBQ2hCLHVCQUFPLGtEQUFQO0FBQ0EsNEJBQVksNkVBQVo7QUFDQSxzQkFBTSxTQUFOO0FBQ0EseUJBQVMsS0FBVDthQUpKO0FBTUEsK0JBQW1CO0FBQ2YsdUJBQU8sZ0RBQVA7QUFDQSxzQkFBTSxTQUFOO0FBQ0EseUJBQVMsSUFBVDthQUhKO0FBS0EscUNBQXlCO0FBQ3JC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SUFBSSxhQUFKLEVBQWpCIiwiZmlsZSI6ImxpYi9vbW5pc2hhcnAtYXRvbS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIEFzeW5jU3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuL3NlcnZlci9vbW5pXCI7XG5jb25zdCB3aW4zMiA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIjtcbmNsYXNzIE9tbmlTaGFycEF0b20ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgICAgICAgIGF1dG9TdGFydE9uQ29tcGF0aWJsZUZpbGU6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJBdXRvc3RhcnQgT21uaXNoYXJwIFJvc2x5blwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkF1dG9tYXRpY2FsbHkgc3RhcnRzIE9tbmlzaGFycCBSb3NseW4gd2hlbiBhIGNvbXBhdGlibGUgZmlsZSBpcyBvcGVuZWQuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRldmVsb3Blck1vZGU6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJEZXZlbG9wZXIgTW9kZVwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk91dHB1dHMgZGV0YWlsZWQgc2VydmVyIGNhbGxzIGluIGNvbnNvbGUubG9nXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJTaG93IERpYWdub3N0aWNzIGZvciBhbGwgU29sdXRpb25zXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQWR2YW5jZWQ6IFRoaXMgd2lsbCBzaG93IGRpYWdub3N0aWNzIGZvciBhbGwgb3BlbiBzb2x1dGlvbnMuICBOT1RFOiBNYXkgdGFrZSBhIHJlc3RhcnQgb3IgY2hhbmdlIHRvIGVhY2ggc2VydmVyIHRvIHRha2UgZWZmZWN0IHdoZW4gdHVybmVkIG9uLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5hYmxlQWR2YW5jZWRGaWxlTmV3OiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiRW5hYmxlIGBBZHZhbmNlZCBGaWxlIE5ld2BcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJFbmFibGUgYEFkdmFuY2VkIEZpbGUgTmV3YCB3aGVuIGRvaW5nIGN0cmwtbi9jbWQtbiB3aXRoaW4gYSBDIyBlZGl0b3IuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9uczoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlVzZSBMZWZ0LUxhYmVsIGNvbHVtbiBpbiBTdWdnZXN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3dzIHJldHVybiB0eXBlcyBpbiBhIHJpZ2h0LWFsaWduZWQgY29sdW1uIHRvIHRoZSBsZWZ0IG9mIHRoZSBjb21wbGV0aW9uIHN1Z2dlc3Rpb24gdGV4dC5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZUljb25zOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiVXNlIHVuaXF1ZSBpY29ucyBmb3Iga2luZCBpbmRpY2F0b3JzIGluIFN1Z2dlc3Rpb25zXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2hvd3Mga2luZHMgd2l0aCB1bmlxdWUgaWNvbnMgcmF0aGVyIHRoYW4gYXV0b2NvbXBsZXRlIGRlZmF1bHQgc3R5bGVzLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhdXRvQWRqdXN0VHJlZVZpZXc6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJBZGp1c3QgdGhlIHRyZWUgdmlldyB0byBtYXRjaCB0aGUgc29sdXRpb24gcm9vdC5cIixcbiAgICAgICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IGFkanVzdCB0aGUgdHJlZXZpZXcgdG8gYmUgdGhlIHJvb3Qgb2YgdGhlIHNvbHV0aW9uLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmFnQWRqdXN0VHJlZVZpZXc6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJTaG93IHRoZSBub3RpZmljYXRpb25zIHRvIEFkanVzdCB0aGUgdHJlZSB2aWV3XCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGF1dG9BZGRFeHRlcm5hbFByb2plY3RzOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiQWRkIGV4dGVybmFsIHByb2plY3RzIHRvIHRoZSB0cmVlIHZpZXcuXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJUaGlzIHdpbGwgYXV0b21hdGljYWxseSBhZGQgZXh0ZXJuYWwgc291cmNlcyB0byB0aGUgdHJlZSB2aWV3LlxcbiBFeHRlcm5hbCBzb3VyY2VzIGFyZSBhbnkgcHJvamVjdHMgdGhhdCBhcmUgbG9hZGVkIG91dHNpZGUgb2YgdGhlIHNvbHV0aW9uIHJvb3QuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYWdBZGRFeHRlcm5hbFByb2plY3RzOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyB0aGUgbm90aWZpY2F0aW9ucyB0byBhZGQgb3IgcmVtb3ZlIGV4dGVybmFsIHByb2plY3RzXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhpZGVMaW50ZXJJbnRlcmZhY2U6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJIaWRlIHRoZSBsaW50ZXIgaW50ZXJmYWNlIHdoZW4gdXNpbmcgb21uaXNoYXJwLWF0b20gZWRpdG9yc1wiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3YW50TWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJSZXF1ZXN0IG1ldGFkYXRhIGRlZmluaXRpb24gd2l0aCBHb3RvIERlZmluaXRpb25cIixcbiAgICAgICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlJlcXVlc3Qgc3ltYm9sIG1ldGFkYXRhIGZyb20gdGhlIHNlcnZlciwgd2hlbiB1c2luZyBnby10by1kZWZpbml0aW9uLiAgVGhpcyBpcyBkaXNhYmxlZCBieSBkZWZhdWx0IG9uIExpbnV4LCBkdWUgdG8gaXNzdWVzIHdpdGggUm9zbHluIG9uIE1vbm8uXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogd2luMzJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhbHRHb3RvRGVmaW5pdGlvbjoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkFsdCBHbyBUbyBEZWZpbml0aW9uXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJVc2UgdGhlIGFsdCBrZXkgaW5zdGVhZCBvZiB0aGUgY3RybC9jbWQga2V5IGZvciBnb3RvIGRlZmludGlvbiBtb3VzZSBvdmVyLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2hvd0hpZGRlbkRpYWdub3N0aWNzOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyAnSGlkZGVuJyBkaWFnbm9zdGljcyBpbiB0aGUgbGludGVyXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJTaG93IG9yIGhpZGUgaGlkZGVuIGRpYWdub3N0aWNzIGluIHRoZSBsaW50ZXIsIHRoaXMgZG9lcyBub3QgYWZmZWN0IGdyZXlpbmcgb3V0IG9mIG5hbWVzcGFjZXMgdGhhdCBhcmUgdW51c2VkLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgYWN0aXZhdGUoc3RhdGUpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgICAgIHRoaXMuX3N0YXJ0ZWQgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmVLZXliaW5kaW5ncygpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGVcIiwgKCkgPT4gdGhpcy50b2dnbGUoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpmaXgtdXNpbmdzXCIsICgpID0+IE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maXh1c2luZ3Moe30pKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzZXR0aW5nc1wiLCAoKSA9PiBhdG9tLndvcmtzcGFjZS5vcGVuKFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlc1wiKVxuICAgICAgICAgICAgLnRoZW4odGFiID0+IHtcbiAgICAgICAgICAgIGlmICh0YWIgJiYgdGFiLmdldFVSSSAmJiB0YWIuZ2V0VVJJKCkgIT09IFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlcy9vbW5pc2hhcnAtYXRvbVwiKSB7XG4gICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXMvb21uaXNoYXJwLWF0b21cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKSk7XG4gICAgICAgIGNvbnN0IGdyYW1tYXJzID0gYXRvbS5ncmFtbWFycztcbiAgICAgICAgY29uc3QgZ3JhbW1hckNiID0gKGdyYW1tYXIpID0+IHtcbiAgICAgICAgICAgIGlmIChfLmZpbmQoT21uaS5ncmFtbWFycywgKGdtcikgPT4gZ21yLnNjb3BlTmFtZSA9PT0gZ3JhbW1hci5zY29wZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgYXRvbS5ncmFtbWFycy5zdGFydElkRm9yU2NvcGUoZ3JhbW1hci5zY29wZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9tbmlzaGFycFNjb3BlTmFtZSA9IGAke2dyYW1tYXIuc2NvcGVOYW1lfS5vbW5pc2hhcnBgO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjb3BlSWQgPSBncmFtbWFycy5pZHNCeVNjb3BlW2dyYW1tYXIuc2NvcGVOYW1lXTtcbiAgICAgICAgICAgICAgICBncmFtbWFycy5pZHNCeVNjb3BlW29tbmlzaGFycFNjb3BlTmFtZV0gPSBzY29wZUlkO1xuICAgICAgICAgICAgICAgIGdyYW1tYXJzLnNjb3Blc0J5SWRbc2NvcGVJZF0gPSBvbW5pc2hhcnBTY29wZU5hbWU7XG4gICAgICAgICAgICAgICAgZ3JhbW1hci5zY29wZU5hbWUgPSBvbW5pc2hhcnBTY29wZU5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIF8uZWFjaChncmFtbWFycy5ncmFtbWFycywgZ3JhbW1hckNiKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmdyYW1tYXJzLm9uRGlkQWRkR3JhbW1hcihncmFtbWFyQ2IpKTtcbiAgICAgICAgcmVxdWlyZShcImF0b20tcGFja2FnZS1kZXBzXCIpLmluc3RhbGwoXCJvbW5pc2hhcnAtYXRvbVwiKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiQWN0aXZhdGluZyBvbW5pc2hhcnAtYXRvbSBzb2x1dGlvbiB0cmFja2luZy4uLlwiKTtcbiAgICAgICAgICAgIE9tbmkuYWN0aXZhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaSk7XG4gICAgICAgICAgICB0aGlzLl9zdGFydGVkLm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLl9zdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmxvYWRGZWF0dXJlcyh0aGlzLmdldEZlYXR1cmVzKFwiYXRvbVwiKS5kZWxheShPbW5pW1wiX2tpY2tfaW5fdGhlX3BhbnRzX1wiXSA/IDAgOiAyMDAwKSkudG9Qcm9taXNlKCkpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBsZXQgc3RhcnRpbmdPYnNlcnZhYmxlID0gT21uaS5hY3RpdmVTb2x1dGlvblxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAgICAgLnRha2UoMSk7XG4gICAgICAgICAgICBpZiAoT21uaVtcIl9raWNrX2luX3RoZV9wYW50c19cIl0pIHtcbiAgICAgICAgICAgICAgICBzdGFydGluZ09ic2VydmFibGUgPSBPYnNlcnZhYmxlLm9mKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzdGFydGluZ09ic2VydmFibGVcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiB0aGlzLmxvYWRGZWF0dXJlcyh0aGlzLmdldEZlYXR1cmVzKFwiZmVhdHVyZXNcIikpKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoeyBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyKGVkaXRvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZhdGVkLm5leHQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlZC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH0gfSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0RmVhdHVyZXMoZm9sZGVyKSB7XG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdCA9IGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tOmZlYXR1cmUtd2hpdGUtbGlzdFwiKTtcbiAgICAgICAgY29uc3QgZmVhdHVyZUxpc3QgPSBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbTpmZWF0dXJlLWxpc3RcIik7XG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdFVuZGVmaW5lZCA9ICh0eXBlb2Ygd2hpdGVMaXN0ID09PSBcInVuZGVmaW5lZFwiKTtcbiAgICAgICAgY29uc29sZS5pbmZvKGBHZXR0aW5nIGZlYXR1cmVzIGZvciBcIiR7Zm9sZGVyfVwiLi4uYCk7XG4gICAgICAgIGNvbnN0IHBhY2thZ2VEaXIgPSBPbW5pLnBhY2thZ2VEaXI7XG4gICAgICAgIGNvbnN0IGZlYXR1cmVEaXIgPSBgJHtwYWNrYWdlRGlyfS9vbW5pc2hhcnAtYXRvbS9saWIvJHtmb2xkZXJ9YDtcbiAgICAgICAgZnVuY3Rpb24gbG9hZEZlYXR1cmUoZmlsZSkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVxdWlyZShgLi8ke2ZvbGRlcn0vJHtmaWxlfWApO1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKGBMb2FkaW5nIGZlYXR1cmUgXCIke2ZvbGRlcn0vJHtmaWxlfVwiLi4uYCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmJpbmROb2RlQ2FsbGJhY2soZnMucmVhZGRpcikoZmVhdHVyZURpcilcbiAgICAgICAgICAgIC5mbGF0TWFwKGZpbGVzID0+IGZpbGVzKVxuICAgICAgICAgICAgLmZpbHRlcihmaWxlID0+IC9cXC5qcyQvLnRlc3QoZmlsZSkpXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlID0+IE9ic2VydmFibGUuYmluZE5vZGVDYWxsYmFjayhmcy5zdGF0KShgJHtmZWF0dXJlRGlyfS8ke2ZpbGV9YCksIChmaWxlLCBzdGF0KSA9PiAoeyBmaWxlLCBzdGF0IH0pKVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6LnN0YXQuaXNEaXJlY3RvcnkoKSlcbiAgICAgICAgICAgIC5tYXAoeiA9PiAoe1xuICAgICAgICAgICAgZmlsZTogYCR7Zm9sZGVyfS8ke3BhdGguYmFzZW5hbWUoei5maWxlKX1gLnJlcGxhY2UoL1xcLmpzJC8sIFwiXCIpLFxuICAgICAgICAgICAgbG9hZDogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZlYXR1cmUgPSBsb2FkRmVhdHVyZSh6LmZpbGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZlYXR1cmVzID0gW107XG4gICAgICAgICAgICAgICAgXy5lYWNoKGZlYXR1cmUsICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghXy5pc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZS5yZXF1aXJlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnW2tleV0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBgJHt2YWx1ZS50aXRsZX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogdmFsdWUuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAoXy5oYXModmFsdWUsIFwiZGVmYXVsdFwiKSA/IHZhbHVlLmRlZmF1bHQgOiB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmZWF0dXJlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXksIGFjdGl2YXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGl2YXRlRmVhdHVyZSh3aGl0ZUxpc3RVbmRlZmluZWQsIGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbShmZWF0dXJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKVxuICAgICAgICAgICAgLmZpbHRlcihsID0+IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd2hpdGVMaXN0ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAod2hpdGVMaXN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uaW5jbHVkZXMoZmVhdHVyZUxpc3QsIGwuZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIV8uaW5jbHVkZXMoZmVhdHVyZUxpc3QsIGwuZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsb2FkRmVhdHVyZXMoZmVhdHVyZXMpIHtcbiAgICAgICAgcmV0dXJuIGZlYXR1cmVzXG4gICAgICAgICAgICAuY29uY2F0TWFwKHogPT4gei5sb2FkKCkpXG4gICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAuY29uY2F0TWFwKHggPT4geClcbiAgICAgICAgICAgIC5tYXAoZiA9PiBmLmFjdGl2YXRlKCkpXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxuICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgLmRvKHsgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBhdG9tLmNvbmZpZy5zZXRTY2hlbWEoXCJvbW5pc2hhcnAtYXRvbVwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHRoaXMuY29uZmlnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IH0pXG4gICAgICAgICAgICAuY29uY2F0TWFwKHggPT4geClcbiAgICAgICAgICAgIC5kbyh4ID0+IHgoKSk7XG4gICAgfVxuICAgIGFjdGl2YXRlRmVhdHVyZSh3aGl0ZUxpc3RVbmRlZmluZWQsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IG51bGw7XG4gICAgICAgIGxldCBmaXJzdFJ1biA9IHRydWU7XG4gICAgICAgIGlmICh3aGl0ZUxpc3RVbmRlZmluZWQgJiYgXy5oYXModGhpcy5jb25maWcsIGtleSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZ0tleSA9IGBvbW5pc2hhcnAtYXRvbS4ke2tleX1gO1xuICAgICAgICAgICAgbGV0IGVuYWJsZURpc3Bvc2FibGUsIGRpc2FibGVEaXNwb3NhYmxlO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKGNvbmZpZ0tleSwgZW5hYmxlZCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXNhYmxlRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZURpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNhYmxlRGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXgpIHsgfVxuICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlID0gYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWZlYXR1cmU6ZW5hYmxlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCB0cnVlKSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZW5hYmxlRGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW5hYmxlRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc2FibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQWN0aXZhdGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUuYWN0aXZhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbih2YWx1ZVtcImF0dGFjaFwiXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdFJ1bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZURpc3Bvc2FibGUgPSBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTpkaXNhYmxlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCBmYWxzZSkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc2FibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmlyc3RSdW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWZlYXR1cmU6dG9nZ2xlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZ0tleSkpKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xuICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbih2YWx1ZVtcImF0dGFjaFwiXSkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZVtcImF0dGFjaFwiXSgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7IHRyeSB7XG4gICAgICAgICAgICB2YWx1ZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGV4KSB7IH0gfSkpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBkZXRlY3RBdXRvVG9nZ2xlR3JhbW1hcihlZGl0b3IpIHtcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgICAgIHRoaXMuZGV0ZWN0R3JhbW1hcihlZGl0b3IsIGdyYW1tYXIpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZENoYW5nZUdyYW1tYXIoKGdtcikgPT4gdGhpcy5kZXRlY3RHcmFtbWFyKGVkaXRvciwgZ21yKSkpO1xuICAgIH1cbiAgICBkZXRlY3RHcmFtbWFyKGVkaXRvciwgZ3JhbW1hcikge1xuICAgICAgICBpZiAoIWF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLmF1dG9TdGFydE9uQ29tcGF0aWJsZUZpbGVcIikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoT21uaS5pc1ZhbGlkR3JhbW1hcihncmFtbWFyKSkge1xuICAgICAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGdyYW1tYXIubmFtZSA9PT0gXCJKU09OXCIpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVkaXRvci5nZXRQYXRoKCkpID09PSBcInByb2plY3QuanNvblwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdG9nZ2xlKCkge1xuICAgICAgICBpZiAoT21uaS5pc09mZikge1xuICAgICAgICAgICAgT21uaS5jb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoT21uaS5pc09uKSB7XG4gICAgICAgICAgICBPbW5pLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkZWFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBjb25zdW1lU3RhdHVzQmFyKHN0YXR1c0Jhcikge1xuICAgICAgICBsZXQgZiA9IHJlcXVpcmUoXCIuL2F0b20vc3RhdHVzLWJhclwiKTtcbiAgICAgICAgZi5zdGF0dXNCYXIuc2V0dXAoc3RhdHVzQmFyKTtcbiAgICAgICAgZiA9IHJlcXVpcmUoXCIuL2F0b20vZnJhbWV3b3JrLXNlbGVjdG9yXCIpO1xuICAgICAgICBmLmZyYW1ld29ya1NlbGVjdG9yLnNldHVwKHN0YXR1c0Jhcik7XG4gICAgICAgIGYgPSByZXF1aXJlKFwiLi9hdG9tL2ZlYXR1cmUtYnV0dG9uc1wiKTtcbiAgICAgICAgZi5mZWF0dXJlRWRpdG9yQnV0dG9ucy5zZXR1cChzdGF0dXNCYXIpO1xuICAgIH1cbiAgICBjb25zdW1lWWVvbWFuRW52aXJvbm1lbnQoZ2VuZXJhdG9yU2VydmljZSkge1xuICAgICAgICBjb25zdCB7IGdlbmVyYXRvckFzcG5ldCB9ID0gcmVxdWlyZShcIi4vYXRvbS9nZW5lcmF0b3ItYXNwbmV0XCIpO1xuICAgICAgICBnZW5lcmF0b3JBc3BuZXQuc2V0dXAoZ2VuZXJhdG9yU2VydmljZSk7XG4gICAgfVxuICAgIHByb3ZpZGVBdXRvY29tcGxldGUoKSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9zZXJ2aWNlcy9jb21wbGV0aW9uLXByb3ZpZGVyXCIpO1xuICAgIH1cbiAgICBwcm92aWRlTGludGVyKCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHByb3ZpZGVQcm9qZWN0SnNvbigpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoXCIuL3NlcnZpY2VzL3Byb2plY3QtcHJvdmlkZXJcIikuY29uY2F0KHJlcXVpcmUoXCIuL3NlcnZpY2VzL2ZyYW1ld29yay1wcm92aWRlclwiKSk7XG4gICAgfVxuICAgIGNvbnN1bWVMaW50ZXIobGludGVyKSB7XG4gICAgICAgIGNvbnN0IExpbnRlclByb3ZpZGVyID0gcmVxdWlyZShcIi4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyXCIpO1xuICAgICAgICBjb25zdCBsaW50ZXJzID0gTGludGVyUHJvdmlkZXIucHJvdmlkZXI7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKGxpbnRlcnMsIGwgPT4ge1xuICAgICAgICAgICAgICAgIGxpbnRlci5kZWxldGVMaW50ZXIobCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKExpbnRlclByb3ZpZGVyLmluaXQobGludGVyKSk7XG4gICAgfVxuICAgIGNvbnN1bWVJbmRpZUxpbnRlcihsaW50ZXIpIHtcbiAgICAgICAgcmVxdWlyZShcIi4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyXCIpLnJlZ2lzdGVySW5kaWUobGludGVyLCB0aGlzLmRpc3Bvc2FibGUpO1xuICAgIH1cbiAgICBjb25maWd1cmVLZXliaW5kaW5ncygpIHtcbiAgICAgICAgbGV0IGRpc3Bvc2FibGU7XG4gICAgICAgIGNvbnN0IG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyA9IE9tbmkucGFja2FnZURpciArIFwiL29tbmlzaGFycC1hdG9tL2tleW1hcHMvb21uaXNoYXJwLWZpbGUtbmV3LmNzb25cIjtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20uZW5hYmxlQWR2YW5jZWRGaWxlTmV3XCIsIChlbmFibGVkKSA9PiB7XG4gICAgICAgICAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUgPSBhdG9tLmtleW1hcHMubG9hZEtleW1hcChvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpc3Bvc2FibGUpXG4gICAgICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIGF0b20ua2V5bWFwcy5yZW1vdmVCaW5kaW5nc0Zyb21Tb3VyY2Uob21uaXNoYXJwQWR2YW5jZWRGaWxlTmV3KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gbmV3IE9tbmlTaGFycEF0b207XG4iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgQXN5bmNTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xyXG5cclxuLy8gVE9ETzogUmVtb3ZlIHRoZXNlIGF0IHNvbWUgcG9pbnQgdG8gc3RyZWFtIGxpbmUgc3RhcnR1cC5cclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi9zZXJ2ZXIvb21uaVwiO1xyXG5jb25zdCB3aW4zMiA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIjtcclxuXHJcbmNsYXNzIE9tbmlTaGFycEF0b20ge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgLy8gSW50ZXJuYWw6IFVzZWQgYnkgdW5pdCB0ZXN0aW5nIHRvIG1ha2Ugc3VyZSB0aGUgcGx1Z2luIGlzIGNvbXBsZXRlbHkgYWN0aXZhdGVkLlxyXG4gICAgcHJpdmF0ZSBfc3RhcnRlZDogQXN5bmNTdWJqZWN0PGJvb2xlYW4+O1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZhdGVkOiBBc3luY1N1YmplY3Q8Ym9vbGVhbj47XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKHN0YXRlOiBhbnkpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgICAgICB0aGlzLl9zdGFydGVkID0gbmV3IEFzeW5jU3ViamVjdDxib29sZWFuPigpO1xyXG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IG5ldyBBc3luY1N1YmplY3Q8Ym9vbGVhbj4oKTtcclxuXHJcbiAgICAgICAgdGhpcy5jb25maWd1cmVLZXliaW5kaW5ncygpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGVcIiwgKCkgPT4gdGhpcy50b2dnbGUoKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmZpeC11c2luZ3NcIiwgKCkgPT4gT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpeHVzaW5ncyh7fSkpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206c2V0dGluZ3NcIiwgKCkgPT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXNcIilcclxuICAgICAgICAgICAgLnRoZW4odGFiID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0YWIgJiYgdGFiLmdldFVSSSAmJiB0YWIuZ2V0VVJJKCkgIT09IFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlcy9vbW5pc2hhcnAtYXRvbVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXMvb21uaXNoYXJwLWF0b21cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGdyYW1tYXJzID0gKDxhbnk+YXRvbS5ncmFtbWFycyk7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hckNiID0gKGdyYW1tYXI6IHsgc2NvcGVOYW1lOiBzdHJpbmc7IH0pID0+IHtcclxuICAgICAgICAgICAgaWYgKF8uZmluZChPbW5pLmdyYW1tYXJzLCAoZ21yOiBhbnkpID0+IGdtci5zY29wZU5hbWUgPT09IGdyYW1tYXIuc2NvcGVOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gZW5zdXJlIHRoZSBzY29wZSBoYXMgYmVlbiBpbml0ZWRcclxuICAgICAgICAgICAgICAgIGF0b20uZ3JhbW1hcnMuc3RhcnRJZEZvclNjb3BlKGdyYW1tYXIuc2NvcGVOYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBvbW5pc2hhcnBTY29wZU5hbWUgPSBgJHtncmFtbWFyLnNjb3BlTmFtZX0ub21uaXNoYXJwYDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjb3BlSWQgPSBncmFtbWFycy5pZHNCeVNjb3BlW2dyYW1tYXIuc2NvcGVOYW1lXTtcclxuICAgICAgICAgICAgICAgIGdyYW1tYXJzLmlkc0J5U2NvcGVbb21uaXNoYXJwU2NvcGVOYW1lXSA9IHNjb3BlSWQ7XHJcbiAgICAgICAgICAgICAgICBncmFtbWFycy5zY29wZXNCeUlkW3Njb3BlSWRdID0gb21uaXNoYXJwU2NvcGVOYW1lO1xyXG4gICAgICAgICAgICAgICAgZ3JhbW1hci5zY29wZU5hbWUgPSBvbW5pc2hhcnBTY29wZU5hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIF8uZWFjaChncmFtbWFycy5ncmFtbWFycywgZ3JhbW1hckNiKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uZ3JhbW1hcnMub25EaWRBZGRHcmFtbWFyKGdyYW1tYXJDYikpO1xyXG5cclxuICAgICAgICByZXF1aXJlKFwiYXRvbS1wYWNrYWdlLWRlcHNcIikuaW5zdGFsbChcIm9tbmlzaGFycC1hdG9tXCIpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIkFjdGl2YXRpbmcgb21uaXNoYXJwLWF0b20gc29sdXRpb24gdHJhY2tpbmcuLi5cIik7XHJcbiAgICAgICAgICAgICAgICBPbW5pLmFjdGl2YXRlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0ZWQubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0ZWQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5sb2FkRmVhdHVyZXModGhpcy5nZXRGZWF0dXJlcyhcImF0b21cIikuZGVsYXkoT21uaVtcIl9raWNrX2luX3RoZV9wYW50c19cIl0gPyAwIDogMjAwMCkpLnRvUHJvbWlzZSgpKVxyXG4gICAgICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBzdGFydGluZ09ic2VydmFibGUgPSBPbW5pLmFjdGl2ZVNvbHV0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcclxuICAgICAgICAgICAgICAgICAgICAudGFrZSgxKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgICAgICAgICAgICAgaWYgKE9tbmlbXCJfa2lja19pbl90aGVfcGFudHNfXCJdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRpbmdPYnNlcnZhYmxlID0gT2JzZXJ2YWJsZS5vZihudWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gT25seSBhY3RpdmF0ZSBmZWF0dXJlcyBvbmNlIHdlIGhhdmUgYSBzb2x1dGlvbiFcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc3RhcnRpbmdPYnNlcnZhYmxlXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gdGhpcy5sb2FkRmVhdHVyZXModGhpcy5nZXRGZWF0dXJlcyhcImZlYXR1cmVzXCIpKSlcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHsgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyKGVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlZC5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmF0ZWQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IH0pKTtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRGZWF0dXJlcyhmb2xkZXI6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdCA9IGF0b20uY29uZmlnLmdldDxib29sZWFuPihcIm9tbmlzaGFycC1hdG9tOmZlYXR1cmUtd2hpdGUtbGlzdFwiKTtcclxuICAgICAgICBjb25zdCBmZWF0dXJlTGlzdCA9IGF0b20uY29uZmlnLmdldDxzdHJpbmdbXT4oXCJvbW5pc2hhcnAtYXRvbTpmZWF0dXJlLWxpc3RcIik7XHJcbiAgICAgICAgY29uc3Qgd2hpdGVMaXN0VW5kZWZpbmVkID0gKHR5cGVvZiB3aGl0ZUxpc3QgPT09IFwidW5kZWZpbmVkXCIpO1xyXG5cclxuICAgICAgICBjb25zb2xlLmluZm8oYEdldHRpbmcgZmVhdHVyZXMgZm9yIFwiJHtmb2xkZXJ9XCIuLi5gKTtcclxuXHJcbiAgICAgICAgY29uc3QgcGFja2FnZURpciA9IE9tbmkucGFja2FnZURpcjtcclxuICAgICAgICBjb25zdCBmZWF0dXJlRGlyID0gYCR7cGFja2FnZURpcn0vb21uaXNoYXJwLWF0b20vbGliLyR7Zm9sZGVyfWA7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGxvYWRGZWF0dXJlKGZpbGU6IHN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSByZXF1aXJlKGAuLyR7Zm9sZGVyfS8ke2ZpbGV9YCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgTG9hZGluZyBmZWF0dXJlIFwiJHtmb2xkZXJ9LyR7ZmlsZX1cIi4uLmApO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0Oy8vXy52YWx1ZXMocmVzdWx0KS5maWx0ZXIoZmVhdHVyZSA9PiAhXy5pc0Z1bmN0aW9uKGZlYXR1cmUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmJpbmROb2RlQ2FsbGJhY2soZnMucmVhZGRpcikoZmVhdHVyZURpcilcclxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZXMgPT4gZmlsZXMpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoZmlsZSA9PiAvXFwuanMkLy50ZXN0KGZpbGUpKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlID0+IE9ic2VydmFibGUuYmluZE5vZGVDYWxsYmFjayhmcy5zdGF0KShgJHtmZWF0dXJlRGlyfS8ke2ZpbGV9YCksIChmaWxlLCBzdGF0KSA9PiAoeyBmaWxlLCBzdGF0IH0pKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXouc3RhdC5pc0RpcmVjdG9yeSgpKVxyXG4gICAgICAgICAgICAubWFwKHogPT4gKHtcclxuICAgICAgICAgICAgICAgIGZpbGU6IGAke2ZvbGRlcn0vJHtwYXRoLmJhc2VuYW1lKHouZmlsZSl9YC5yZXBsYWNlKC9cXC5qcyQvLCBcIlwiKSxcclxuICAgICAgICAgICAgICAgIGxvYWQ6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmZWF0dXJlID0gbG9hZEZlYXR1cmUoei5maWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmVhdHVyZXM6IHsga2V5OiBzdHJpbmcsIGFjdGl2YXRlOiAoKSA9PiAoKSA9PiB2b2lkIH1bXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIF8uZWFjaChmZWF0dXJlLCAodmFsdWU6IElGZWF0dXJlLCBrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWUucmVxdWlyZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ1trZXldID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogYCR7dmFsdWUudGl0bGV9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHZhbHVlLmRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogKF8uaGFzKHZhbHVlLCBcImRlZmF1bHRcIikgPyB2YWx1ZS5kZWZhdWx0IDogdHJ1ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSwgYWN0aXZhdGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZCwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbTx7IGtleTogc3RyaW5nLCBhY3RpdmF0ZTogKCkgPT4gKCkgPT4gdm9pZCB9PihmZWF0dXJlcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAuZmlsdGVyKGwgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aGl0ZUxpc3QgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAod2hpdGVMaXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF8uaW5jbHVkZXMoZmVhdHVyZUxpc3QsIGwuZmlsZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhXy5pbmNsdWRlcyhmZWF0dXJlTGlzdCwgbC5maWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxvYWRGZWF0dXJlcyhmZWF0dXJlczogT2JzZXJ2YWJsZTx7IGZpbGU6IHN0cmluZzsgbG9hZDogKCkgPT4gT2JzZXJ2YWJsZTx7IGtleTogc3RyaW5nLCBhY3RpdmF0ZTogKCkgPT4gKCkgPT4gdm9pZCB9PiB9Pikge1xyXG4gICAgICAgIHJldHVybiBmZWF0dXJlc1xyXG4gICAgICAgICAgICAuY29uY2F0TWFwKHogPT4gei5sb2FkKCkpXHJcbiAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgLmNvbmNhdE1hcCh4ID0+IHgpXHJcbiAgICAgICAgICAgIC5tYXAoZiA9PiBmLmFjdGl2YXRlKCkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXHJcbiAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgLmRvKHsgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICg8YW55PmF0b20uY29uZmlnKS5zZXRTY2hlbWEoXCJvbW5pc2hhcnAtYXRvbVwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB0aGlzLmNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH19KVxyXG4gICAgICAgICAgICAuY29uY2F0TWFwKHggPT4geClcclxuICAgICAgICAgICAgLmRvKHggPT4geCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZDogYm9vbGVhbiwga2V5OiBzdHJpbmcsIHZhbHVlOiBJRmVhdHVyZSkge1xyXG4gICAgICAgIGxldCByZXN1bHQ6ICgpID0+IHZvaWQgPSBudWxsO1xyXG4gICAgICAgIGxldCBmaXJzdFJ1biA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vIFdoaXRlbGlzdCBpcyB1c2VkIGZvciB1bml0IHRlc3RpbmcsIHdlIGRvblwidCB3YW50IHRoZSBjb25maWcgdG8gbWFrZSBjaGFuZ2VzIGhlcmVcclxuICAgICAgICBpZiAod2hpdGVMaXN0VW5kZWZpbmVkICYmIF8uaGFzKHRoaXMuY29uZmlnLCBrZXkpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZ0tleSA9IGBvbW5pc2hhcnAtYXRvbS4ke2tleX1gO1xyXG4gICAgICAgICAgICBsZXQgZW5hYmxlRGlzcG9zYWJsZTogSURpc3Bvc2FibGUsIGRpc2FibGVEaXNwb3NhYmxlOiBJRGlzcG9zYWJsZTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKGNvbmZpZ0tleSwgZW5hYmxlZCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzYWJsZURpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZURpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc2FibGVEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZURpc3Bvc2FibGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHsgdmFsdWUuZGlzcG9zZSgpOyB9IGNhdGNoIChleCkgeyAvKiAqLyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUgPSBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTplbmFibGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksIHRydWUpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVuYWJsZURpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZW5hYmxlRGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNhYmxlRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBY3RpdmF0aW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLmFjdGl2YXRlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odmFsdWVbXCJhdHRhY2hcIl0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdFJ1bikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtcImF0dGFjaFwiXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgYG9tbmlzaGFycC1mZWF0dXJlOmRpc2FibGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksIGZhbHNlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNhYmxlRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBmaXJzdFJ1biA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG5cclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTp0b2dnbGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksICFhdG9tLmNvbmZpZy5nZXQoY29uZmlnS2V5KSkpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbih2YWx1ZVtcImF0dGFjaFwiXSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZVtcImF0dGFjaFwiXSgpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7IHRyeSB7IHZhbHVlLmRpc3Bvc2UoKTsgfSBjYXRjaCAoZXgpIHsgLyogKi8gfSB9KSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XHJcbiAgICAgICAgdGhpcy5kZXRlY3RHcmFtbWFyKGVkaXRvciwgZ3JhbW1hcik7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VHcmFtbWFyKChnbXI6IEZpcnN0TWF0ZS5HcmFtbWFyKSA9PiB0aGlzLmRldGVjdEdyYW1tYXIoZWRpdG9yLCBnbXIpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkZXRlY3RHcmFtbWFyKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBncmFtbWFyOiBGaXJzdE1hdGUuR3JhbW1hcikge1xyXG4gICAgICAgIGlmICghYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZVwiKSkge1xyXG4gICAgICAgICAgICByZXR1cm47IC8vc2hvcnQgb3V0LCBpZiBzZXR0aW5nIHRvIG5vdCBhdXRvIHN0YXJ0IGlzIGVuYWJsZWRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChPbW5pLmlzVmFsaWRHcmFtbWFyKGdyYW1tYXIpKSB7XHJcbiAgICAgICAgICAgIGlmIChPbW5pLmlzT2ZmKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChncmFtbWFyLm5hbWUgPT09IFwiSlNPTlwiKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVkaXRvci5nZXRQYXRoKCkpID09PSBcInByb2plY3QuanNvblwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoT21uaS5pc09mZikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZSgpIHtcclxuICAgICAgICBpZiAoT21uaS5pc09mZikge1xyXG4gICAgICAgICAgICBPbW5pLmNvbm5lY3QoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKE9tbmkuaXNPbikge1xyXG4gICAgICAgICAgICBPbW5pLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uc3VtZVN0YXR1c0JhcihzdGF0dXNCYXI6IGFueSkge1xyXG4gICAgICAgIGxldCBmID0gcmVxdWlyZShcIi4vYXRvbS9zdGF0dXMtYmFyXCIpO1xyXG4gICAgICAgIGYuc3RhdHVzQmFyLnNldHVwKHN0YXR1c0Jhcik7XHJcbiAgICAgICAgZiA9IHJlcXVpcmUoXCIuL2F0b20vZnJhbWV3b3JrLXNlbGVjdG9yXCIpO1xyXG4gICAgICAgIGYuZnJhbWV3b3JrU2VsZWN0b3Iuc2V0dXAoc3RhdHVzQmFyKTtcclxuICAgICAgICBmID0gcmVxdWlyZShcIi4vYXRvbS9mZWF0dXJlLWJ1dHRvbnNcIik7XHJcbiAgICAgICAgZi5mZWF0dXJlRWRpdG9yQnV0dG9ucy5zZXR1cChzdGF0dXNCYXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuICAgIHB1YmxpYyBjb25zdW1lWWVvbWFuRW52aXJvbm1lbnQoZ2VuZXJhdG9yU2VydmljZTogYW55KSB7XHJcbiAgICAgICAgY29uc3Qge2dlbmVyYXRvckFzcG5ldH0gPSByZXF1aXJlKFwiLi9hdG9tL2dlbmVyYXRvci1hc3BuZXRcIik7XHJcbiAgICAgICAgZ2VuZXJhdG9yQXNwbmV0LnNldHVwKGdlbmVyYXRvclNlcnZpY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcm92aWRlQXV0b2NvbXBsZXRlKCkge1xyXG4gICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9zZXJ2aWNlcy9jb21wbGV0aW9uLXByb3ZpZGVyXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcm92aWRlTGludGVyKCk6IGFueVtdIHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgLy9jb25zdCBMaW50ZXJQcm92aWRlciA9IHJlcXVpcmUoXCIuL3NlcnZpY2VzL2xpbnRlci1wcm92aWRlclwiKTtcclxuICAgICAgICAvL3JldHVybiBMaW50ZXJQcm92aWRlci5wcm92aWRlcjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJvdmlkZVByb2plY3RKc29uKCkge1xyXG4gICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9zZXJ2aWNlcy9wcm9qZWN0LXByb3ZpZGVyXCIpLmNvbmNhdChyZXF1aXJlKFwiLi9zZXJ2aWNlcy9mcmFtZXdvcmstcHJvdmlkZXJcIikpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25zdW1lTGludGVyKGxpbnRlcjogYW55KSB7XHJcbiAgICAgICAgY29uc3QgTGludGVyUHJvdmlkZXIgPSByZXF1aXJlKFwiLi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXJcIik7XHJcbiAgICAgICAgY29uc3QgbGludGVycyA9IExpbnRlclByb3ZpZGVyLnByb3ZpZGVyO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgXy5lYWNoKGxpbnRlcnMsIGwgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGludGVyLmRlbGV0ZUxpbnRlcihsKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKExpbnRlclByb3ZpZGVyLmluaXQobGludGVyKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbnN1bWVJbmRpZUxpbnRlcihsaW50ZXI6IGFueSkge1xyXG4gICAgICAgIHJlcXVpcmUoXCIuL3NlcnZpY2VzL2xpbnRlci1wcm92aWRlclwiKS5yZWdpc3RlckluZGllKGxpbnRlciwgdGhpcy5kaXNwb3NhYmxlKTtcclxuICAgIH1cclxuICAgIC8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5cclxuICAgIHByaXZhdGUgY29uZmlndXJlS2V5YmluZGluZ3MoKSB7XHJcbiAgICAgICAgbGV0IGRpc3Bvc2FibGU6IEV2ZW50S2l0LkRpc3Bvc2FibGU7XHJcbiAgICAgICAgY29uc3Qgb21uaXNoYXJwQWR2YW5jZWRGaWxlTmV3ID0gT21uaS5wYWNrYWdlRGlyICsgXCIvb21uaXNoYXJwLWF0b20va2V5bWFwcy9vbW5pc2hhcnAtZmlsZS1uZXcuY3NvblwiO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLmVuYWJsZUFkdmFuY2VkRmlsZU5ld1wiLCAoZW5hYmxlZDogYm9vbGVhbikgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZSA9IGF0b20ua2V5bWFwcy5sb2FkS2V5bWFwKG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGlzcG9zYWJsZSkgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBhdG9tLmtleW1hcHMucmVtb3ZlQmluZGluZ3NGcm9tU291cmNlKG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbmZpZyA9IHtcclxuICAgICAgICBhdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkF1dG9zdGFydCBPbW5pc2hhcnAgUm9zbHluXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkF1dG9tYXRpY2FsbHkgc3RhcnRzIE9tbmlzaGFycCBSb3NseW4gd2hlbiBhIGNvbXBhdGlibGUgZmlsZSBpcyBvcGVuZWQuXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZXZlbG9wZXJNb2RlOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkRldmVsb3BlciBNb2RlXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk91dHB1dHMgZGV0YWlsZWQgc2VydmVyIGNhbGxzIGluIGNvbnNvbGUubG9nXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgRGlhZ25vc3RpY3MgZm9yIGFsbCBTb2x1dGlvbnNcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQWR2YW5jZWQ6IFRoaXMgd2lsbCBzaG93IGRpYWdub3N0aWNzIGZvciBhbGwgb3BlbiBzb2x1dGlvbnMuICBOT1RFOiBNYXkgdGFrZSBhIHJlc3RhcnQgb3IgY2hhbmdlIHRvIGVhY2ggc2VydmVyIHRvIHRha2UgZWZmZWN0IHdoZW4gdHVybmVkIG9uLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVuYWJsZUFkdmFuY2VkRmlsZU5ldzoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJFbmFibGUgYEFkdmFuY2VkIEZpbGUgTmV3YFwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJFbmFibGUgYEFkdmFuY2VkIEZpbGUgTmV3YCB3aGVuIGRvaW5nIGN0cmwtbi9jbWQtbiB3aXRoaW4gYSBDIyBlZGl0b3IuXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnM6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiVXNlIExlZnQtTGFiZWwgY29sdW1uIGluIFN1Z2dlc3Rpb25zXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3dzIHJldHVybiB0eXBlcyBpbiBhIHJpZ2h0LWFsaWduZWQgY29sdW1uIHRvIHRoZSBsZWZ0IG9mIHRoZSBjb21wbGV0aW9uIHN1Z2dlc3Rpb24gdGV4dC5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICB1c2VJY29uczoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJVc2UgdW5pcXVlIGljb25zIGZvciBraW5kIGluZGljYXRvcnMgaW4gU3VnZ2VzdGlvbnNcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2hvd3Mga2luZHMgd2l0aCB1bmlxdWUgaWNvbnMgcmF0aGVyIHRoYW4gYXV0b2NvbXBsZXRlIGRlZmF1bHQgc3R5bGVzLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b0FkanVzdFRyZWVWaWV3OiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkFkanVzdCB0aGUgdHJlZSB2aWV3IHRvIG1hdGNoIHRoZSBzb2x1dGlvbiByb290LlwiLFxyXG4gICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IGFkanVzdCB0aGUgdHJlZXZpZXcgdG8gYmUgdGhlIHJvb3Qgb2YgdGhlIHNvbHV0aW9uLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIG5hZ0FkanVzdFRyZWVWaWV3OiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgdGhlIG5vdGlmaWNhdGlvbnMgdG8gQWRqdXN0IHRoZSB0cmVlIHZpZXdcIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9BZGRFeHRlcm5hbFByb2plY3RzOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkFkZCBleHRlcm5hbCBwcm9qZWN0cyB0byB0aGUgdHJlZSB2aWV3LlwiLFxyXG4gICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IGFkZCBleHRlcm5hbCBzb3VyY2VzIHRvIHRoZSB0cmVlIHZpZXcuXFxuIEV4dGVybmFsIHNvdXJjZXMgYXJlIGFueSBwcm9qZWN0cyB0aGF0IGFyZSBsb2FkZWQgb3V0c2lkZSBvZiB0aGUgc29sdXRpb24gcm9vdC5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBuYWdBZGRFeHRlcm5hbFByb2plY3RzOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgdGhlIG5vdGlmaWNhdGlvbnMgdG8gYWRkIG9yIHJlbW92ZSBleHRlcm5hbCBwcm9qZWN0c1wiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGlkZUxpbnRlckludGVyZmFjZToge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJIaWRlIHRoZSBsaW50ZXIgaW50ZXJmYWNlIHdoZW4gdXNpbmcgb21uaXNoYXJwLWF0b20gZWRpdG9yc1wiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd2FudE1ldGFkYXRhOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlJlcXVlc3QgbWV0YWRhdGEgZGVmaW5pdGlvbiB3aXRoIEdvdG8gRGVmaW5pdGlvblwiLFxyXG4gICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlJlcXVlc3Qgc3ltYm9sIG1ldGFkYXRhIGZyb20gdGhlIHNlcnZlciwgd2hlbiB1c2luZyBnby10by1kZWZpbml0aW9uLiAgVGhpcyBpcyBkaXNhYmxlZCBieSBkZWZhdWx0IG9uIExpbnV4LCBkdWUgdG8gaXNzdWVzIHdpdGggUm9zbHluIG9uIE1vbm8uXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB3aW4zMlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYWx0R290b0RlZmluaXRpb246IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQWx0IEdvIFRvIERlZmluaXRpb25cIixcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJVc2UgdGhlIGFsdCBrZXkgaW5zdGVhZCBvZiB0aGUgY3RybC9jbWQga2V5IGZvciBnb3RvIGRlZmludGlvbiBtb3VzZSBvdmVyLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNob3dIaWRkZW5EaWFnbm9zdGljczoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJTaG93ICdIaWRkZW4nIGRpYWdub3N0aWNzIGluIHRoZSBsaW50ZXJcIixcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJTaG93IG9yIGhpZGUgaGlkZGVuIGRpYWdub3N0aWNzIGluIHRoZSBsaW50ZXIsIHRoaXMgZG9lcyBub3QgYWZmZWN0IGdyZXlpbmcgb3V0IG9mIG5hbWVzcGFjZXMgdGhhdCBhcmUgdW51c2VkLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IE9tbmlTaGFycEF0b207XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
