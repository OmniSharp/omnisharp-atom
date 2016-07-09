"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9vbW5pc2hhcnAtYXRvbS5qcyIsImxpYi9vbW5pc2hhcnAtYXRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQ0dBLElBQU0sUUFBUSxRQUFRLFFBQVIsS0FBcUIsT0FBbkM7O0lBRUEsYTtBQUFBLDZCQUFBO0FBQUE7O0FBZ1VXLGFBQUEsTUFBQSxHQUFTO0FBQ1osdUNBQTJCO0FBQ3ZCLHVCQUFPLDRCQURnQjtBQUV2Qiw2QkFBYSx5RUFGVTtBQUd2QixzQkFBTSxTQUhpQjtBQUl2Qix5QkFBUztBQUpjLGFBRGY7QUFPWiwyQkFBZTtBQUNYLHVCQUFPLGdCQURJO0FBRVgsNkJBQWEsOENBRkY7QUFHWCxzQkFBTSxTQUhLO0FBSVgseUJBQVM7QUFKRSxhQVBIO0FBYVosNENBQWdDO0FBQzVCLHVCQUFPLG9DQURxQjtBQUU1Qiw2QkFBYSxnSkFGZTtBQUc1QixzQkFBTSxTQUhzQjtBQUk1Qix5QkFBUztBQUptQixhQWJwQjtBQW1CWixtQ0FBdUI7QUFDbkIsdUJBQU8sNEJBRFk7QUFFbkIsNkJBQWEsd0VBRk07QUFHbkIsc0JBQU0sU0FIYTtBQUluQix5QkFBUztBQUpVLGFBbkJYO0FBeUJaLDhDQUFrQztBQUM5Qix1QkFBTyxzQ0FEdUI7QUFFOUIsNkJBQWEsNkZBRmlCO0FBRzlCLHNCQUFNLFNBSHdCO0FBSTlCLHlCQUFTO0FBSnFCLGFBekJ0QjtBQStCWixzQkFBVTtBQUNOLHVCQUFPLHFEQUREO0FBRU4sNkJBQWEsd0VBRlA7QUFHTixzQkFBTSxTQUhBO0FBSU4seUJBQVM7QUFKSCxhQS9CRTtBQXFDWixnQ0FBb0I7QUFDaEIsdUJBQU8sa0RBRFM7QUFFaEIsNEJBQVksNkVBRkk7QUFHaEIsc0JBQU0sU0FIVTtBQUloQix5QkFBUztBQUpPLGFBckNSO0FBMkNaLCtCQUFtQjtBQUNmLHVCQUFPLGdEQURRO0FBRWYsc0JBQU0sU0FGUztBQUdmLHlC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QVIsQ0FBOUMsQ0FBUDtBQUNIOzs7c0NBRW9CLE0sRUFBVztBQUM1QixnQkFBTSxpQkFBaUIsUUFBUSw0QkFBUixDQUF2QjtBQUNBLGdCQUFNLFVBQVUsZUFBZSxRQUEvQjtBQUVBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsNEJBQVcsTUFBWCxDQUFrQixZQUFBO0FBQ2xDLGlDQUFFLElBQUYsQ0FBTyxPQUFQLEVBQWdCLGFBQUM7QUFDYiwyQkFBTyxZQUFQLENBQW9CLENBQXBCO0FBQ0gsaUJBRkQ7QUFHSCxhQUptQixDQUFwQjtBQU1BLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsZUFBZSxJQUFmLENBQW9CLE1BQXBCLENBQXBCO0FBQ0g7OzsyQ0FFeUIsTSxFQUFXO0FBQ2pDLG9CQUFRLDRCQUFSLEVBQXNDLGFBQXRDLENBQW9ELE1BQXBELEVBQTRELEtBQUssVUFBakU7QUFDSDs7OytDQUcyQjtBQUN4QixnQkFBSSxtQkFBSjtBQUNBLGdCQUFNLDJCQUEyQixXQUFLLFVBQUwsR0FBa0IsaURBQW5EO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLE1BQUwsQ0FBWSxPQUFaLENBQW9CLHNDQUFwQixFQUE0RCxVQUFDLE9BQUQsRUFBaUI7QUFDN0Ysb0JBQUksT0FBSixFQUFhO0FBQ1QsaUNBQWEsS0FBSyxPQUFMLENBQWEsVUFBYixDQUF3Qix3QkFBeEIsQ0FBYjtBQUNILGlCQUZELE1BRU87QUFDSCx3QkFBSSxVQUFKLEVBQWdCLFdBQVcsT0FBWDtBQUNoQix5QkFBSyxPQUFMLENBQWEsd0JBQWIsQ0FBc0Msd0JBQXRDO0FBQ0g7QUFDSixhQVBtQixDQUFwQjtBQVFIOzs7Ozs7QUF1RkwsT0FBTyxPQUFQLEdBQWlCLElBQUksYUFBSixFQUFqQiIsImZpbGUiOiJsaWIvb21uaXNoYXJwLWF0b20uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBBc3luY1N1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuL3NlcnZlci9vbW5pXCI7XG5jb25zdCB3aW4zMiA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIjtcbmNsYXNzIE9tbmlTaGFycEF0b20ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgICAgICAgIGF1dG9TdGFydE9uQ29tcGF0aWJsZUZpbGU6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJBdXRvc3RhcnQgT21uaXNoYXJwIFJvc2x5blwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkF1dG9tYXRpY2FsbHkgc3RhcnRzIE9tbmlzaGFycCBSb3NseW4gd2hlbiBhIGNvbXBhdGlibGUgZmlsZSBpcyBvcGVuZWQuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRldmVsb3Blck1vZGU6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJEZXZlbG9wZXIgTW9kZVwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk91dHB1dHMgZGV0YWlsZWQgc2VydmVyIGNhbGxzIGluIGNvbnNvbGUubG9nXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJTaG93IERpYWdub3N0aWNzIGZvciBhbGwgU29sdXRpb25zXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQWR2YW5jZWQ6IFRoaXMgd2lsbCBzaG93IGRpYWdub3N0aWNzIGZvciBhbGwgb3BlbiBzb2x1dGlvbnMuICBOT1RFOiBNYXkgdGFrZSBhIHJlc3RhcnQgb3IgY2hhbmdlIHRvIGVhY2ggc2VydmVyIHRvIHRha2UgZWZmZWN0IHdoZW4gdHVybmVkIG9uLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5hYmxlQWR2YW5jZWRGaWxlTmV3OiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiRW5hYmxlIGBBZHZhbmNlZCBGaWxlIE5ld2BcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJFbmFibGUgYEFkdmFuY2VkIEZpbGUgTmV3YCB3aGVuIGRvaW5nIGN0cmwtbi9jbWQtbiB3aXRoaW4gYSBDIyBlZGl0b3IuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9uczoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlVzZSBMZWZ0LUxhYmVsIGNvbHVtbiBpbiBTdWdnZXN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3dzIHJldHVybiB0eXBlcyBpbiBhIHJpZ2h0LWFsaWduZWQgY29sdW1uIHRvIHRoZSBsZWZ0IG9mIHRoZSBjb21wbGV0aW9uIHN1Z2dlc3Rpb24gdGV4dC5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZUljb25zOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiVXNlIHVuaXF1ZSBpY29ucyBmb3Iga2luZCBpbmRpY2F0b3JzIGluIFN1Z2dlc3Rpb25zXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2hvd3Mga2luZHMgd2l0aCB1bmlxdWUgaWNvbnMgcmF0aGVyIHRoYW4gYXV0b2NvbXBsZXRlIGRlZmF1bHQgc3R5bGVzLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhdXRvQWRqdXN0VHJlZVZpZXc6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJBZGp1c3QgdGhlIHRyZWUgdmlldyB0byBtYXRjaCB0aGUgc29sdXRpb24gcm9vdC5cIixcbiAgICAgICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IGFkanVzdCB0aGUgdHJlZXZpZXcgdG8gYmUgdGhlIHJvb3Qgb2YgdGhlIHNvbHV0aW9uLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmFnQWRqdXN0VHJlZVZpZXc6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJTaG93IHRoZSBub3RpZmljYXRpb25zIHRvIEFkanVzdCB0aGUgdHJlZSB2aWV3XCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGF1dG9BZGRFeHRlcm5hbFByb2plY3RzOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiQWRkIGV4dGVybmFsIHByb2plY3RzIHRvIHRoZSB0cmVlIHZpZXcuXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJUaGlzIHdpbGwgYXV0b21hdGljYWxseSBhZGQgZXh0ZXJuYWwgc291cmNlcyB0byB0aGUgdHJlZSB2aWV3LlxcbiBFeHRlcm5hbCBzb3VyY2VzIGFyZSBhbnkgcHJvamVjdHMgdGhhdCBhcmUgbG9hZGVkIG91dHNpZGUgb2YgdGhlIHNvbHV0aW9uIHJvb3QuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYWdBZGRFeHRlcm5hbFByb2plY3RzOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyB0aGUgbm90aWZpY2F0aW9ucyB0byBhZGQgb3IgcmVtb3ZlIGV4dGVybmFsIHByb2plY3RzXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhpZGVMaW50ZXJJbnRlcmZhY2U6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJIaWRlIHRoZSBsaW50ZXIgaW50ZXJmYWNlIHdoZW4gdXNpbmcgb21uaXNoYXJwLWF0b20gZWRpdG9yc1wiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3YW50TWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJSZXF1ZXN0IG1ldGFkYXRhIGRlZmluaXRpb24gd2l0aCBHb3RvIERlZmluaXRpb25cIixcbiAgICAgICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlJlcXVlc3Qgc3ltYm9sIG1ldGFkYXRhIGZyb20gdGhlIHNlcnZlciwgd2hlbiB1c2luZyBnby10by1kZWZpbml0aW9uLiAgVGhpcyBpcyBkaXNhYmxlZCBieSBkZWZhdWx0IG9uIExpbnV4LCBkdWUgdG8gaXNzdWVzIHdpdGggUm9zbHluIG9uIE1vbm8uXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogd2luMzJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhbHRHb3RvRGVmaW5pdGlvbjoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkFsdCBHbyBUbyBEZWZpbml0aW9uXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJVc2UgdGhlIGFsdCBrZXkgaW5zdGVhZCBvZiB0aGUgY3RybC9jbWQga2V5IGZvciBnb3RvIGRlZmludGlvbiBtb3VzZSBvdmVyLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2hvd0hpZGRlbkRpYWdub3N0aWNzOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyAnSGlkZGVuJyBkaWFnbm9zdGljcyBpbiB0aGUgbGludGVyXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJTaG93IG9yIGhpZGUgaGlkZGVuIGRpYWdub3N0aWNzIGluIHRoZSBsaW50ZXIsIHRoaXMgZG9lcyBub3QgYWZmZWN0IGdyZXlpbmcgb3V0IG9mIG5hbWVzcGFjZXMgdGhhdCBhcmUgdW51c2VkLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgYWN0aXZhdGUoc3RhdGUpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgICAgIHRoaXMuX3N0YXJ0ZWQgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgdGhpcy5jb25maWd1cmVLZXliaW5kaW5ncygpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGVcIiwgKCkgPT4gdGhpcy50b2dnbGUoKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpmaXgtdXNpbmdzXCIsICgpID0+IE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maXh1c2luZ3Moe30pKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzZXR0aW5nc1wiLCAoKSA9PiBhdG9tLndvcmtzcGFjZS5vcGVuKFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlc1wiKVxuICAgICAgICAgICAgLnRoZW4odGFiID0+IHtcbiAgICAgICAgICAgIGlmICh0YWIgJiYgdGFiLmdldFVSSSAmJiB0YWIuZ2V0VVJJKCkgIT09IFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlcy9vbW5pc2hhcnAtYXRvbVwiKSB7XG4gICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXMvb21uaXNoYXJwLWF0b21cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKSk7XG4gICAgICAgIGNvbnN0IGdyYW1tYXJzID0gYXRvbS5ncmFtbWFycztcbiAgICAgICAgY29uc3QgZ3JhbW1hckNiID0gKGdyYW1tYXIpID0+IHtcbiAgICAgICAgICAgIGlmIChfLmZpbmQoT21uaS5ncmFtbWFycywgKGdtcikgPT4gZ21yLnNjb3BlTmFtZSA9PT0gZ3JhbW1hci5zY29wZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgYXRvbS5ncmFtbWFycy5zdGFydElkRm9yU2NvcGUoZ3JhbW1hci5zY29wZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9tbmlzaGFycFNjb3BlTmFtZSA9IGAke2dyYW1tYXIuc2NvcGVOYW1lfS5vbW5pc2hhcnBgO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjb3BlSWQgPSBncmFtbWFycy5pZHNCeVNjb3BlW2dyYW1tYXIuc2NvcGVOYW1lXTtcbiAgICAgICAgICAgICAgICBncmFtbWFycy5pZHNCeVNjb3BlW29tbmlzaGFycFNjb3BlTmFtZV0gPSBzY29wZUlkO1xuICAgICAgICAgICAgICAgIGdyYW1tYXJzLnNjb3Blc0J5SWRbc2NvcGVJZF0gPSBvbW5pc2hhcnBTY29wZU5hbWU7XG4gICAgICAgICAgICAgICAgZ3JhbW1hci5zY29wZU5hbWUgPSBvbW5pc2hhcnBTY29wZU5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIF8uZWFjaChncmFtbWFycy5ncmFtbWFycywgZ3JhbW1hckNiKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmdyYW1tYXJzLm9uRGlkQWRkR3JhbW1hcihncmFtbWFyQ2IpKTtcbiAgICAgICAgcmVxdWlyZShcImF0b20tcGFja2FnZS1kZXBzXCIpLmluc3RhbGwoXCJvbW5pc2hhcnAtYXRvbVwiKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiQWN0aXZhdGluZyBvbW5pc2hhcnAtYXRvbSBzb2x1dGlvbiB0cmFja2luZy4uLlwiKTtcbiAgICAgICAgICAgIE9tbmkuYWN0aXZhdGUoKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaSk7XG4gICAgICAgICAgICB0aGlzLl9zdGFydGVkLm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLl9zdGFydGVkLmNvbXBsZXRlKCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmxvYWRGZWF0dXJlcyh0aGlzLmdldEZlYXR1cmVzKFwiYXRvbVwiKS5kZWxheShPbW5pW1wiX2tpY2tfaW5fdGhlX3BhbnRzX1wiXSA/IDAgOiAyMDAwKSkudG9Qcm9taXNlKCkpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBsZXQgc3RhcnRpbmdPYnNlcnZhYmxlID0gT21uaS5hY3RpdmVTb2x1dGlvblxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAgICAgLnRha2UoMSk7XG4gICAgICAgICAgICBpZiAoT21uaVtcIl9raWNrX2luX3RoZV9wYW50c19cIl0pIHtcbiAgICAgICAgICAgICAgICBzdGFydGluZ09ic2VydmFibGUgPSBPYnNlcnZhYmxlLm9mKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzdGFydGluZ09ic2VydmFibGVcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiB0aGlzLmxvYWRGZWF0dXJlcyh0aGlzLmdldEZlYXR1cmVzKFwiZmVhdHVyZXNcIikpKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKChlZGl0b3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0QXV0b1RvZ2dsZUdyYW1tYXIoZWRpdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmF0ZWQubmV4dCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZhdGVkLmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0RmVhdHVyZXMoZm9sZGVyKSB7XG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdCA9IGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tOmZlYXR1cmUtd2hpdGUtbGlzdFwiKTtcbiAgICAgICAgY29uc3QgZmVhdHVyZUxpc3QgPSBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbTpmZWF0dXJlLWxpc3RcIik7XG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdFVuZGVmaW5lZCA9ICh0eXBlb2Ygd2hpdGVMaXN0ID09PSBcInVuZGVmaW5lZFwiKTtcbiAgICAgICAgY29uc29sZS5pbmZvKGBHZXR0aW5nIGZlYXR1cmVzIGZvciBcIiR7Zm9sZGVyfVwiLi4uYCk7XG4gICAgICAgIGNvbnN0IGZlYXR1cmVEaXIgPSBgJHtfX2Rpcm5hbWV9LyR7Zm9sZGVyfWA7XG4gICAgICAgIGZ1bmN0aW9uIGxvYWRGZWF0dXJlKGZpbGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlcXVpcmUoYC4vJHtmb2xkZXJ9LyR7ZmlsZX1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgTG9hZGluZyBmZWF0dXJlIFwiJHtmb2xkZXJ9LyR7ZmlsZX1cIi4uLmApO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnJlYWRkaXIpKGZlYXR1cmVEaXIpXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlcyA9PiBmaWxlcylcbiAgICAgICAgICAgIC5maWx0ZXIoZmlsZSA9PiAvXFwuanMkLy50ZXN0KGZpbGUpKVxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZSA9PiBPYnNlcnZhYmxlLmJpbmROb2RlQ2FsbGJhY2soZnMuc3RhdCkoYCR7ZmVhdHVyZURpcn0vJHtmaWxlfWApLCAoZmlsZSwgc3RhdCkgPT4gKHsgZmlsZSwgc3RhdCB9KSlcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhei5zdGF0LmlzRGlyZWN0b3J5KCkpXG4gICAgICAgICAgICAubWFwKHogPT4gKHtcbiAgICAgICAgICAgIGZpbGU6IGAke2ZvbGRlcn0vJHtwYXRoLmJhc2VuYW1lKHouZmlsZSl9YC5yZXBsYWNlKC9cXC5qcyQvLCBcIlwiKSxcbiAgICAgICAgICAgIGxvYWQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmZWF0dXJlID0gbG9hZEZlYXR1cmUoei5maWxlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmZWF0dXJlcyA9IFtdO1xuICAgICAgICAgICAgICAgIF8uZWFjaChmZWF0dXJlLCAodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWUucmVxdWlyZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ1trZXldID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogYCR7dmFsdWUudGl0bGV9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHZhbHVlLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogKF8uaGFzKHZhbHVlLCBcImRlZmF1bHRcIikgPyB2YWx1ZS5kZWZhdWx0IDogdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5LCBhY3RpdmF0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmF0ZUZlYXR1cmUod2hpdGVMaXN0VW5kZWZpbmVkLCBrZXksIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20oZmVhdHVyZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSlcbiAgICAgICAgICAgIC5maWx0ZXIobCA9PiB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHdoaXRlTGlzdCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdoaXRlTGlzdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLmluY2x1ZGVzKGZlYXR1cmVMaXN0LCBsLmZpbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFfLmluY2x1ZGVzKGZlYXR1cmVMaXN0LCBsLmZpbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgbG9hZEZlYXR1cmVzKGZlYXR1cmVzKSB7XG4gICAgICAgIHJldHVybiBmZWF0dXJlc1xuICAgICAgICAgICAgLmNvbmNhdE1hcCh6ID0+IHoubG9hZCgpKVxuICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgLmNvbmNhdE1hcCh4ID0+IHgpXG4gICAgICAgICAgICAubWFwKGYgPT4gZi5hY3RpdmF0ZSgpKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheClcbiAgICAgICAgICAgIC50b0FycmF5KClcbiAgICAgICAgICAgIC5kbyh7XG4gICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGF0b20uY29uZmlnLnNldFNjaGVtYShcIm9tbmlzaGFycC1hdG9tXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogdGhpcy5jb25maWdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeCA9PiB4KVxuICAgICAgICAgICAgLmRvKHggPT4geCgpKTtcbiAgICB9XG4gICAgYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gbnVsbDtcbiAgICAgICAgbGV0IGZpcnN0UnVuID0gdHJ1ZTtcbiAgICAgICAgaWYgKHdoaXRlTGlzdFVuZGVmaW5lZCAmJiBfLmhhcyh0aGlzLmNvbmZpZywga2V5KSkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnS2V5ID0gYG9tbmlzaGFycC1hdG9tLiR7a2V5fWA7XG4gICAgICAgICAgICBsZXQgZW5hYmxlRGlzcG9zYWJsZSwgZGlzYWJsZURpc3Bvc2FibGU7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlnS2V5LCBlbmFibGVkID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpc2FibGVEaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc2FibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChleCkgeyB9XG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUgPSBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTplbmFibGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksIHRydWUpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlbmFibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmFibGVEaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzYWJsZURpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBY3RpdmF0aW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlW1wiYXR0YWNoXCJdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0UnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbXCJhdHRhY2hcIl0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbXCJhdHRhY2hcIl0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgYG9tbmlzaGFycC1mZWF0dXJlOmRpc2FibGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksIGZhbHNlKSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzYWJsZURpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaXJzdFJ1biA9IGZhbHNlO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTp0b2dnbGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksICFhdG9tLmNvbmZpZy5nZXQoY29uZmlnS2V5KSkpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlLmFjdGl2YXRlKCk7XG4gICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlW1wiYXR0YWNoXCJdKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHsgdHJ5IHtcbiAgICAgICAgICAgIHZhbHVlLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXgpIHsgfSB9KSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyKGVkaXRvcikge1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICAgICAgdGhpcy5kZXRlY3RHcmFtbWFyKGVkaXRvciwgZ3JhbW1hcik7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hcigoZ21yKSA9PiB0aGlzLmRldGVjdEdyYW1tYXIoZWRpdG9yLCBnbXIpKSk7XG4gICAgfVxuICAgIGRldGVjdEdyYW1tYXIoZWRpdG9yLCBncmFtbWFyKSB7XG4gICAgICAgIGlmICghYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZVwiKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChPbW5pLmlzVmFsaWRHcmFtbWFyKGdyYW1tYXIpKSB7XG4gICAgICAgICAgICBpZiAoT21uaS5pc09mZikge1xuICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZ3JhbW1hci5uYW1lID09PSBcIkpTT05cIikge1xuICAgICAgICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZWRpdG9yLmdldFBhdGgoKSkgPT09IFwicHJvamVjdC5qc29uXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoT21uaS5pc09mZikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB0b2dnbGUoKSB7XG4gICAgICAgIGlmIChPbW5pLmlzT2ZmKSB7XG4gICAgICAgICAgICBPbW5pLmNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChPbW5pLmlzT24pIHtcbiAgICAgICAgICAgIE9tbmkuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRlYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyKSB7XG4gICAgICAgIGxldCBmID0gcmVxdWlyZShcIi4vYXRvbS9zdGF0dXMtYmFyXCIpO1xuICAgICAgICBmLnN0YXR1c0Jhci5zZXR1cChzdGF0dXNCYXIpO1xuICAgICAgICBmID0gcmVxdWlyZShcIi4vYXRvbS9mcmFtZXdvcmstc2VsZWN0b3JcIik7XG4gICAgICAgIGYuZnJhbWV3b3JrU2VsZWN0b3Iuc2V0dXAoc3RhdHVzQmFyKTtcbiAgICAgICAgZiA9IHJlcXVpcmUoXCIuL2F0b20vZmVhdHVyZS1idXR0b25zXCIpO1xuICAgICAgICBmLmZlYXR1cmVFZGl0b3JCdXR0b25zLnNldHVwKHN0YXR1c0Jhcik7XG4gICAgfVxuICAgIGNvbnN1bWVZZW9tYW5FbnZpcm9ubWVudChnZW5lcmF0b3JTZXJ2aWNlKSB7XG4gICAgICAgIGNvbnN0IHsgZ2VuZXJhdG9yQXNwbmV0IH0gPSByZXF1aXJlKFwiLi9hdG9tL2dlbmVyYXRvci1hc3BuZXRcIik7XG4gICAgICAgIGdlbmVyYXRvckFzcG5ldC5zZXR1cChnZW5lcmF0b3JTZXJ2aWNlKTtcbiAgICB9XG4gICAgcHJvdmlkZUF1dG9jb21wbGV0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoXCIuL3NlcnZpY2VzL2NvbXBsZXRpb24tcHJvdmlkZXJcIik7XG4gICAgfVxuICAgIHByb3ZpZGVMaW50ZXIoKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgcHJvdmlkZVByb2plY3RKc29uKCkge1xuICAgICAgICByZXR1cm4gcmVxdWlyZShcIi4vc2VydmljZXMvcHJvamVjdC1wcm92aWRlclwiKS5jb25jYXQocmVxdWlyZShcIi4vc2VydmljZXMvZnJhbWV3b3JrLXByb3ZpZGVyXCIpKTtcbiAgICB9XG4gICAgY29uc3VtZUxpbnRlcihsaW50ZXIpIHtcbiAgICAgICAgY29uc3QgTGludGVyUHJvdmlkZXIgPSByZXF1aXJlKFwiLi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXJcIik7XG4gICAgICAgIGNvbnN0IGxpbnRlcnMgPSBMaW50ZXJQcm92aWRlci5wcm92aWRlcjtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2gobGludGVycywgbCA9PiB7XG4gICAgICAgICAgICAgICAgbGludGVyLmRlbGV0ZUxpbnRlcihsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoTGludGVyUHJvdmlkZXIuaW5pdChsaW50ZXIpKTtcbiAgICB9XG4gICAgY29uc3VtZUluZGllTGludGVyKGxpbnRlcikge1xuICAgICAgICByZXF1aXJlKFwiLi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXJcIikucmVnaXN0ZXJJbmRpZShsaW50ZXIsIHRoaXMuZGlzcG9zYWJsZSk7XG4gICAgfVxuICAgIGNvbmZpZ3VyZUtleWJpbmRpbmdzKCkge1xuICAgICAgICBsZXQgZGlzcG9zYWJsZTtcbiAgICAgICAgY29uc3Qgb21uaXNoYXJwQWR2YW5jZWRGaWxlTmV3ID0gT21uaS5wYWNrYWdlRGlyICsgXCIvb21uaXNoYXJwLWF0b20va2V5bWFwcy9vbW5pc2hhcnAtZmlsZS1uZXcuY3NvblwiO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5lbmFibGVBZHZhbmNlZEZpbGVOZXdcIiwgKGVuYWJsZWQpID0+IHtcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZSA9IGF0b20ua2V5bWFwcy5sb2FkS2V5bWFwKG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlzcG9zYWJsZSlcbiAgICAgICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgYXRvbS5rZXltYXBzLnJlbW92ZUJpbmRpbmdzRnJvbVNvdXJjZShvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBuZXcgT21uaVNoYXJwQXRvbTtcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHtPYnNlcnZhYmxlLCBBc3luY1N1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcclxuXHJcbi8vIFRPRE86IFJlbW92ZSB0aGVzZSBhdCBzb21lIHBvaW50IHRvIHN0cmVhbSBsaW5lIHN0YXJ0dXAuXHJcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4vc2VydmVyL29tbmlcIjtcclxuY29uc3Qgd2luMzIgPSBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCI7XHJcblxyXG5jbGFzcyBPbW5pU2hhcnBBdG9tIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIC8vIEludGVybmFsOiBVc2VkIGJ5IHVuaXQgdGVzdGluZyB0byBtYWtlIHN1cmUgdGhlIHBsdWdpbiBpcyBjb21wbGV0ZWx5IGFjdGl2YXRlZC5cclxuICAgIHByaXZhdGUgX3N0YXJ0ZWQ6IEFzeW5jU3ViamVjdDxib29sZWFuPjtcclxuICAgIHByaXZhdGUgX2FjdGl2YXRlZDogQXN5bmNTdWJqZWN0PGJvb2xlYW4+O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZShzdGF0ZTogYW55KSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRlZCA9IG5ldyBBc3luY1N1YmplY3Q8Ym9vbGVhbj4oKTtcclxuICAgICAgICB0aGlzLl9hY3RpdmF0ZWQgPSBuZXcgQXN5bmNTdWJqZWN0PGJvb2xlYW4+KCk7XHJcblxyXG4gICAgICAgIHRoaXMuY29uZmlndXJlS2V5YmluZGluZ3MoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206dG9nZ2xlXCIsICgpID0+IHRoaXMudG9nZ2xlKCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpmaXgtdXNpbmdzXCIsICgpID0+IE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maXh1c2luZ3Moe30pKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnNldHRpbmdzXCIsICgpID0+IGF0b20ud29ya3NwYWNlLm9wZW4oXCJhdG9tOi8vY29uZmlnL3BhY2thZ2VzXCIpXHJcbiAgICAgICAgICAgIC50aGVuKHRhYiA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFiICYmIHRhYi5nZXRVUkkgJiYgdGFiLmdldFVSSSgpICE9PSBcImF0b206Ly9jb25maWcvcGFja2FnZXMvb21uaXNoYXJwLWF0b21cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oXCJhdG9tOi8vY29uZmlnL3BhY2thZ2VzL29tbmlzaGFycC1hdG9tXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSkpO1xyXG5cclxuICAgICAgICBjb25zdCBncmFtbWFycyA9ICg8YW55PmF0b20uZ3JhbW1hcnMpO1xyXG4gICAgICAgIGNvbnN0IGdyYW1tYXJDYiA9IChncmFtbWFyOiB7IHNjb3BlTmFtZTogc3RyaW5nOyB9KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChfLmZpbmQoT21uaS5ncmFtbWFycywgKGdtcjogYW55KSA9PiBnbXIuc2NvcGVOYW1lID09PSBncmFtbWFyLnNjb3BlTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIC8vIGVuc3VyZSB0aGUgc2NvcGUgaGFzIGJlZW4gaW5pdGVkXHJcbiAgICAgICAgICAgICAgICBhdG9tLmdyYW1tYXJzLnN0YXJ0SWRGb3JTY29wZShncmFtbWFyLnNjb3BlTmFtZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qgb21uaXNoYXJwU2NvcGVOYW1lID0gYCR7Z3JhbW1hci5zY29wZU5hbWV9Lm9tbmlzaGFycGA7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY29wZUlkID0gZ3JhbW1hcnMuaWRzQnlTY29wZVtncmFtbWFyLnNjb3BlTmFtZV07XHJcbiAgICAgICAgICAgICAgICBncmFtbWFycy5pZHNCeVNjb3BlW29tbmlzaGFycFNjb3BlTmFtZV0gPSBzY29wZUlkO1xyXG4gICAgICAgICAgICAgICAgZ3JhbW1hcnMuc2NvcGVzQnlJZFtzY29wZUlkXSA9IG9tbmlzaGFycFNjb3BlTmFtZTtcclxuICAgICAgICAgICAgICAgIGdyYW1tYXIuc2NvcGVOYW1lID0gb21uaXNoYXJwU2NvcGVOYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBfLmVhY2goZ3JhbW1hcnMuZ3JhbW1hcnMsIGdyYW1tYXJDYik7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmdyYW1tYXJzLm9uRGlkQWRkR3JhbW1hcihncmFtbWFyQ2IpKTtcclxuXHJcbiAgICAgICAgcmVxdWlyZShcImF0b20tcGFja2FnZS1kZXBzXCIpLmluc3RhbGwoXCJvbW5pc2hhcnAtYXRvbVwiKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oXCJBY3RpdmF0aW5nIG9tbmlzaGFycC1hdG9tIHNvbHV0aW9uIHRyYWNraW5nLi4uXCIpO1xyXG4gICAgICAgICAgICAgICAgT21uaS5hY3RpdmF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydGVkLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydGVkLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMubG9hZEZlYXR1cmVzKHRoaXMuZ2V0RmVhdHVyZXMoXCJhdG9tXCIpLmRlbGF5KE9tbmlbXCJfa2lja19pbl90aGVfcGFudHNfXCJdID8gMCA6IDIwMDApKS50b1Byb21pc2UoKSlcclxuICAgICAgICAgICAgLyogdHNsaW50OmVuYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnRpbmdPYnNlcnZhYmxlID0gT21uaS5hY3RpdmVTb2x1dGlvblxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXHJcbiAgICAgICAgICAgICAgICAgICAgLnRha2UoMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgICAgICAgICAgICAgIGlmIChPbW5pW1wiX2tpY2tfaW5fdGhlX3BhbnRzX1wiXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0aW5nT2JzZXJ2YWJsZSA9IE9ic2VydmFibGUub2YobnVsbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE9ubHkgYWN0aXZhdGUgZmVhdHVyZXMgb25jZSB3ZSBoYXZlIGEgc29sdXRpb24hXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHN0YXJ0aW5nT2JzZXJ2YWJsZVxyXG4gICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IHRoaXMubG9hZEZlYXR1cmVzKHRoaXMuZ2V0RmVhdHVyZXMoXCJmZWF0dXJlc1wiKSkpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyKGVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZhdGVkLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmF0ZWQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRGZWF0dXJlcyhmb2xkZXI6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdCA9IGF0b20uY29uZmlnLmdldDxib29sZWFuPihcIm9tbmlzaGFycC1hdG9tOmZlYXR1cmUtd2hpdGUtbGlzdFwiKTtcclxuICAgICAgICBjb25zdCBmZWF0dXJlTGlzdCA9IGF0b20uY29uZmlnLmdldDxzdHJpbmdbXT4oXCJvbW5pc2hhcnAtYXRvbTpmZWF0dXJlLWxpc3RcIik7XHJcbiAgICAgICAgY29uc3Qgd2hpdGVMaXN0VW5kZWZpbmVkID0gKHR5cGVvZiB3aGl0ZUxpc3QgPT09IFwidW5kZWZpbmVkXCIpO1xyXG5cclxuICAgICAgICBjb25zb2xlLmluZm8oYEdldHRpbmcgZmVhdHVyZXMgZm9yIFwiJHtmb2xkZXJ9XCIuLi5gKTtcclxuXHJcbiAgICAgICAgY29uc3QgZmVhdHVyZURpciA9IGAke19fZGlybmFtZX0vJHtmb2xkZXJ9YDtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gbG9hZEZlYXR1cmUoZmlsZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlcXVpcmUoYC4vJHtmb2xkZXJ9LyR7ZmlsZX1gKTtcclxuICAgICAgICAgICAgY29uc29sZS5pbmZvKGBMb2FkaW5nIGZlYXR1cmUgXCIke2ZvbGRlcn0vJHtmaWxlfVwiLi4uYCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7Ly9fLnZhbHVlcyhyZXN1bHQpLmZpbHRlcihmZWF0dXJlID0+ICFfLmlzRnVuY3Rpb24oZmVhdHVyZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuYmluZE5vZGVDYWxsYmFjayhmcy5yZWFkZGlyKShmZWF0dXJlRGlyKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlcyA9PiBmaWxlcylcclxuICAgICAgICAgICAgLmZpbHRlcihmaWxlID0+IC9cXC5qcyQvLnRlc3QoZmlsZSkpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKGZpbGUgPT4gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnN0YXQpKGAke2ZlYXR1cmVEaXJ9LyR7ZmlsZX1gKSwgKGZpbGUsIHN0YXQpID0+ICh7IGZpbGUsIHN0YXQgfSkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhei5zdGF0LmlzRGlyZWN0b3J5KCkpXHJcbiAgICAgICAgICAgIC5tYXAoeiA9PiAoe1xyXG4gICAgICAgICAgICAgICAgZmlsZTogYCR7Zm9sZGVyfS8ke3BhdGguYmFzZW5hbWUoei5maWxlKX1gLnJlcGxhY2UoL1xcLmpzJC8sIFwiXCIpLFxyXG4gICAgICAgICAgICAgICAgbG9hZDogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZlYXR1cmUgPSBsb2FkRmVhdHVyZSh6LmZpbGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmZWF0dXJlczogeyBrZXk6IHN0cmluZywgYWN0aXZhdGU6ICgpID0+ICgpID0+IHZvaWQgfVtdID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoKGZlYXR1cmUsICh2YWx1ZTogSUZlYXR1cmUsIGtleTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghXy5pc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZS5yZXF1aXJlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnW2tleV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBgJHt2YWx1ZS50aXRsZX1gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogdmFsdWUuZGVzY3JpcHRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAoXy5oYXModmFsdWUsIFwiZGVmYXVsdFwiKSA/IHZhbHVlLmRlZmF1bHQgOiB0cnVlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5LCBhY3RpdmF0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmF0ZUZlYXR1cmUod2hpdGVMaXN0VW5kZWZpbmVkLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tPHsga2V5OiBzdHJpbmcsIGFjdGl2YXRlOiAoKSA9PiAoKSA9PiB2b2lkIH0+KGZlYXR1cmVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIobCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHdoaXRlTGlzdCA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh3aGl0ZUxpc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5pbmNsdWRlcyhmZWF0dXJlTGlzdCwgbC5maWxlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICFfLmluY2x1ZGVzKGZlYXR1cmVMaXN0LCBsLmZpbGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbG9hZEZlYXR1cmVzKGZlYXR1cmVzOiBPYnNlcnZhYmxlPHsgZmlsZTogc3RyaW5nOyBsb2FkOiAoKSA9PiBPYnNlcnZhYmxlPHsga2V5OiBzdHJpbmcsIGFjdGl2YXRlOiAoKSA9PiAoKSA9PiB2b2lkIH0+IH0+KSB7XHJcbiAgICAgICAgcmV0dXJuIGZlYXR1cmVzXHJcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeiA9PiB6LmxvYWQoKSlcclxuICAgICAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgICAgICAuY29uY2F0TWFwKHggPT4geClcclxuICAgICAgICAgICAgLm1hcChmID0+IGYuYWN0aXZhdGUoKSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheClcclxuICAgICAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgICAgICAuZG8oe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAoPGFueT5hdG9tLmNvbmZpZykuc2V0U2NoZW1hKFwib21uaXNoYXJwLWF0b21cIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB0aGlzLmNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY29uY2F0TWFwKHggPT4geClcclxuICAgICAgICAgICAgLmRvKHggPT4geCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZDogYm9vbGVhbiwga2V5OiBzdHJpbmcsIHZhbHVlOiBJRmVhdHVyZSkge1xyXG4gICAgICAgIGxldCByZXN1bHQ6ICgpID0+IHZvaWQgPSBudWxsO1xyXG4gICAgICAgIGxldCBmaXJzdFJ1biA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vIFdoaXRlbGlzdCBpcyB1c2VkIGZvciB1bml0IHRlc3RpbmcsIHdlIGRvblwidCB3YW50IHRoZSBjb25maWcgdG8gbWFrZSBjaGFuZ2VzIGhlcmVcclxuICAgICAgICBpZiAod2hpdGVMaXN0VW5kZWZpbmVkICYmIF8uaGFzKHRoaXMuY29uZmlnLCBrZXkpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZ0tleSA9IGBvbW5pc2hhcnAtYXRvbS4ke2tleX1gO1xyXG4gICAgICAgICAgICBsZXQgZW5hYmxlRGlzcG9zYWJsZTogSURpc3Bvc2FibGUsIGRpc2FibGVEaXNwb3NhYmxlOiBJRGlzcG9zYWJsZTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKGNvbmZpZ0tleSwgZW5hYmxlZCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzYWJsZURpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZURpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc2FibGVEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZURpc3Bvc2FibGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHsgdmFsdWUuZGlzcG9zZSgpOyB9IGNhdGNoIChleCkgeyAvKiAqLyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUgPSBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTplbmFibGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksIHRydWUpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVuYWJsZURpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZW5hYmxlRGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNhYmxlRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBY3RpdmF0aW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLmFjdGl2YXRlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odmFsdWVbXCJhdHRhY2hcIl0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdFJ1bikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtcImF0dGFjaFwiXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgYG9tbmlzaGFycC1mZWF0dXJlOmRpc2FibGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksIGZhbHNlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNhYmxlRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBmaXJzdFJ1biA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG5cclxuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTp0b2dnbGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksICFhdG9tLmNvbmZpZy5nZXQoY29uZmlnS2V5KSkpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbih2YWx1ZVtcImF0dGFjaFwiXSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZVtcImF0dGFjaFwiXSgpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7IHRyeSB7IHZhbHVlLmRpc3Bvc2UoKTsgfSBjYXRjaCAoZXgpIHsgLyogKi8gfSB9KSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XHJcbiAgICAgICAgdGhpcy5kZXRlY3RHcmFtbWFyKGVkaXRvciwgZ3JhbW1hcik7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VHcmFtbWFyKChnbXI6IEZpcnN0TWF0ZS5HcmFtbWFyKSA9PiB0aGlzLmRldGVjdEdyYW1tYXIoZWRpdG9yLCBnbXIpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkZXRlY3RHcmFtbWFyKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBncmFtbWFyOiBGaXJzdE1hdGUuR3JhbW1hcikge1xyXG4gICAgICAgIGlmICghYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZVwiKSkge1xyXG4gICAgICAgICAgICByZXR1cm47IC8vc2hvcnQgb3V0LCBpZiBzZXR0aW5nIHRvIG5vdCBhdXRvIHN0YXJ0IGlzIGVuYWJsZWRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChPbW5pLmlzVmFsaWRHcmFtbWFyKGdyYW1tYXIpKSB7XHJcbiAgICAgICAgICAgIGlmIChPbW5pLmlzT2ZmKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChncmFtbWFyLm5hbWUgPT09IFwiSlNPTlwiKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVkaXRvci5nZXRQYXRoKCkpID09PSBcInByb2plY3QuanNvblwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoT21uaS5pc09mZikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZSgpIHtcclxuICAgICAgICBpZiAoT21uaS5pc09mZikge1xyXG4gICAgICAgICAgICBPbW5pLmNvbm5lY3QoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKE9tbmkuaXNPbikge1xyXG4gICAgICAgICAgICBPbW5pLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uc3VtZVN0YXR1c0JhcihzdGF0dXNCYXI6IGFueSkge1xyXG4gICAgICAgIGxldCBmID0gcmVxdWlyZShcIi4vYXRvbS9zdGF0dXMtYmFyXCIpO1xyXG4gICAgICAgIGYuc3RhdHVzQmFyLnNldHVwKHN0YXR1c0Jhcik7XHJcbiAgICAgICAgZiA9IHJlcXVpcmUoXCIuL2F0b20vZnJhbWV3b3JrLXNlbGVjdG9yXCIpO1xyXG4gICAgICAgIGYuZnJhbWV3b3JrU2VsZWN0b3Iuc2V0dXAoc3RhdHVzQmFyKTtcclxuICAgICAgICBmID0gcmVxdWlyZShcIi4vYXRvbS9mZWF0dXJlLWJ1dHRvbnNcIik7XHJcbiAgICAgICAgZi5mZWF0dXJlRWRpdG9yQnV0dG9ucy5zZXR1cChzdGF0dXNCYXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuICAgIHB1YmxpYyBjb25zdW1lWWVvbWFuRW52aXJvbm1lbnQoZ2VuZXJhdG9yU2VydmljZTogYW55KSB7XHJcbiAgICAgICAgY29uc3Qge2dlbmVyYXRvckFzcG5ldH0gPSByZXF1aXJlKFwiLi9hdG9tL2dlbmVyYXRvci1hc3BuZXRcIik7XHJcbiAgICAgICAgZ2VuZXJhdG9yQXNwbmV0LnNldHVwKGdlbmVyYXRvclNlcnZpY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcm92aWRlQXV0b2NvbXBsZXRlKCkge1xyXG4gICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9zZXJ2aWNlcy9jb21wbGV0aW9uLXByb3ZpZGVyXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcm92aWRlTGludGVyKCk6IGFueVtdIHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgLy9jb25zdCBMaW50ZXJQcm92aWRlciA9IHJlcXVpcmUoXCIuL3NlcnZpY2VzL2xpbnRlci1wcm92aWRlclwiKTtcclxuICAgICAgICAvL3JldHVybiBMaW50ZXJQcm92aWRlci5wcm92aWRlcjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJvdmlkZVByb2plY3RKc29uKCkge1xyXG4gICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9zZXJ2aWNlcy9wcm9qZWN0LXByb3ZpZGVyXCIpLmNvbmNhdChyZXF1aXJlKFwiLi9zZXJ2aWNlcy9mcmFtZXdvcmstcHJvdmlkZXJcIikpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25zdW1lTGludGVyKGxpbnRlcjogYW55KSB7XHJcbiAgICAgICAgY29uc3QgTGludGVyUHJvdmlkZXIgPSByZXF1aXJlKFwiLi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXJcIik7XHJcbiAgICAgICAgY29uc3QgbGludGVycyA9IExpbnRlclByb3ZpZGVyLnByb3ZpZGVyO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgXy5lYWNoKGxpbnRlcnMsIGwgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGludGVyLmRlbGV0ZUxpbnRlcihsKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKExpbnRlclByb3ZpZGVyLmluaXQobGludGVyKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbnN1bWVJbmRpZUxpbnRlcihsaW50ZXI6IGFueSkge1xyXG4gICAgICAgIHJlcXVpcmUoXCIuL3NlcnZpY2VzL2xpbnRlci1wcm92aWRlclwiKS5yZWdpc3RlckluZGllKGxpbnRlciwgdGhpcy5kaXNwb3NhYmxlKTtcclxuICAgIH1cclxuICAgIC8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5cclxuICAgIHByaXZhdGUgY29uZmlndXJlS2V5YmluZGluZ3MoKSB7XHJcbiAgICAgICAgbGV0IGRpc3Bvc2FibGU6IEV2ZW50S2l0LkRpc3Bvc2FibGU7XHJcbiAgICAgICAgY29uc3Qgb21uaXNoYXJwQWR2YW5jZWRGaWxlTmV3ID0gT21uaS5wYWNrYWdlRGlyICsgXCIvb21uaXNoYXJwLWF0b20va2V5bWFwcy9vbW5pc2hhcnAtZmlsZS1uZXcuY3NvblwiO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLmVuYWJsZUFkdmFuY2VkRmlsZU5ld1wiLCAoZW5hYmxlZDogYm9vbGVhbikgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZSA9IGF0b20ua2V5bWFwcy5sb2FkS2V5bWFwKG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGlzcG9zYWJsZSkgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBhdG9tLmtleW1hcHMucmVtb3ZlQmluZGluZ3NGcm9tU291cmNlKG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbmZpZyA9IHtcclxuICAgICAgICBhdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkF1dG9zdGFydCBPbW5pc2hhcnAgUm9zbHluXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkF1dG9tYXRpY2FsbHkgc3RhcnRzIE9tbmlzaGFycCBSb3NseW4gd2hlbiBhIGNvbXBhdGlibGUgZmlsZSBpcyBvcGVuZWQuXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZXZlbG9wZXJNb2RlOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkRldmVsb3BlciBNb2RlXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIk91dHB1dHMgZGV0YWlsZWQgc2VydmVyIGNhbGxzIGluIGNvbnNvbGUubG9nXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgRGlhZ25vc3RpY3MgZm9yIGFsbCBTb2x1dGlvbnNcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQWR2YW5jZWQ6IFRoaXMgd2lsbCBzaG93IGRpYWdub3N0aWNzIGZvciBhbGwgb3BlbiBzb2x1dGlvbnMuICBOT1RFOiBNYXkgdGFrZSBhIHJlc3RhcnQgb3IgY2hhbmdlIHRvIGVhY2ggc2VydmVyIHRvIHRha2UgZWZmZWN0IHdoZW4gdHVybmVkIG9uLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVuYWJsZUFkdmFuY2VkRmlsZU5ldzoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJFbmFibGUgYEFkdmFuY2VkIEZpbGUgTmV3YFwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJFbmFibGUgYEFkdmFuY2VkIEZpbGUgTmV3YCB3aGVuIGRvaW5nIGN0cmwtbi9jbWQtbiB3aXRoaW4gYSBDIyBlZGl0b3IuXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnM6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiVXNlIExlZnQtTGFiZWwgY29sdW1uIGluIFN1Z2dlc3Rpb25zXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3dzIHJldHVybiB0eXBlcyBpbiBhIHJpZ2h0LWFsaWduZWQgY29sdW1uIHRvIHRoZSBsZWZ0IG9mIHRoZSBjb21wbGV0aW9uIHN1Z2dlc3Rpb24gdGV4dC5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICB1c2VJY29uczoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJVc2UgdW5pcXVlIGljb25zIGZvciBraW5kIGluZGljYXRvcnMgaW4gU3VnZ2VzdGlvbnNcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2hvd3Mga2luZHMgd2l0aCB1bmlxdWUgaWNvbnMgcmF0aGVyIHRoYW4gYXV0b2NvbXBsZXRlIGRlZmF1bHQgc3R5bGVzLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b0FkanVzdFRyZWVWaWV3OiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkFkanVzdCB0aGUgdHJlZSB2aWV3IHRvIG1hdGNoIHRoZSBzb2x1dGlvbiByb290LlwiLFxyXG4gICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IGFkanVzdCB0aGUgdHJlZXZpZXcgdG8gYmUgdGhlIHJvb3Qgb2YgdGhlIHNvbHV0aW9uLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIG5hZ0FkanVzdFRyZWVWaWV3OiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgdGhlIG5vdGlmaWNhdGlvbnMgdG8gQWRqdXN0IHRoZSB0cmVlIHZpZXdcIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9BZGRFeHRlcm5hbFByb2plY3RzOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkFkZCBleHRlcm5hbCBwcm9qZWN0cyB0byB0aGUgdHJlZSB2aWV3LlwiLFxyXG4gICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IGFkZCBleHRlcm5hbCBzb3VyY2VzIHRvIHRoZSB0cmVlIHZpZXcuXFxuIEV4dGVybmFsIHNvdXJjZXMgYXJlIGFueSBwcm9qZWN0cyB0aGF0IGFyZSBsb2FkZWQgb3V0c2lkZSBvZiB0aGUgc29sdXRpb24gcm9vdC5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBuYWdBZGRFeHRlcm5hbFByb2plY3RzOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgdGhlIG5vdGlmaWNhdGlvbnMgdG8gYWRkIG9yIHJlbW92ZSBleHRlcm5hbCBwcm9qZWN0c1wiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGlkZUxpbnRlckludGVyZmFjZToge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJIaWRlIHRoZSBsaW50ZXIgaW50ZXJmYWNlIHdoZW4gdXNpbmcgb21uaXNoYXJwLWF0b20gZWRpdG9yc1wiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd2FudE1ldGFkYXRhOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlJlcXVlc3QgbWV0YWRhdGEgZGVmaW5pdGlvbiB3aXRoIEdvdG8gRGVmaW5pdGlvblwiLFxyXG4gICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlJlcXVlc3Qgc3ltYm9sIG1ldGFkYXRhIGZyb20gdGhlIHNlcnZlciwgd2hlbiB1c2luZyBnby10by1kZWZpbml0aW9uLiAgVGhpcyBpcyBkaXNhYmxlZCBieSBkZWZhdWx0IG9uIExpbnV4LCBkdWUgdG8gaXNzdWVzIHdpdGggUm9zbHluIG9uIE1vbm8uXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB3aW4zMlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYWx0R290b0RlZmluaXRpb246IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQWx0IEdvIFRvIERlZmluaXRpb25cIixcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJVc2UgdGhlIGFsdCBrZXkgaW5zdGVhZCBvZiB0aGUgY3RybC9jbWQga2V5IGZvciBnb3RvIGRlZmludGlvbiBtb3VzZSBvdmVyLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNob3dIaWRkZW5EaWFnbm9zdGljczoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJTaG93ICdIaWRkZW4nIGRpYWdub3N0aWNzIGluIHRoZSBsaW50ZXJcIixcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJTaG93IG9yIGhpZGUgaGlkZGVuIGRpYWdub3N0aWNzIGluIHRoZSBsaW50ZXIsIHRoaXMgZG9lcyBub3QgYWZmZWN0IGdyZXlpbmcgb3V0IG9mIG5hbWVzcGFjZXMgdGhhdCBhcmUgdW51c2VkLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IE9tbmlTaGFycEF0b207XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
