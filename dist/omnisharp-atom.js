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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9vbW5pc2hhcnAtYXRvbS5qcyIsImxpYi9vbW5pc2hhcnAtYXRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQ0dBLElBQU0sUUFBUSxRQUFRLFFBQVIsS0FBcUIsT0FBckI7O0lBRWQ7QUFBQSw2QkFBQTs7O0FBZ1VXLGFBQUEsTUFBQSxHQUFTO0FBQ1osdUNBQTJCO0FBQ3ZCLHVCQUFPLDRCQUFQO0FBQ0EsNkJBQWEseUVBQWI7QUFDQSxzQkFBTSxTQUFOO0FBQ0EseUJBQVMsSUFBVDthQUpKO0FBTUEsMkJBQWU7QUFDWCx1QkFBTyxnQkFBUDtBQUNBLDZCQUFhLDhDQUFiO0FBQ0Esc0JBQU0sU0FBTjtBQUNBLHlCQUFTLEtBQVQ7YUFKSjtBQU1BLDRDQUFnQztBQUM1Qix1QkFBTyxvQ0FBUDtBQUNBLDZCQUFhLGdKQUFiO0FBQ0Esc0JBQU0sU0FBTjtBQUNBLHlCQUFTLEtBQVQ7YUFKSjtBQU1BLG1DQUF1QjtBQUNuQix1QkFBTyw0QkFBUDtBQUNBLDZCQUFhLHdFQUFiO0FBQ0Esc0JBQU0sU0FBTjtBQUNBLHlCQUFTLEtBQVQ7YUFKSjtBQU1BLDhDQUFrQztBQUM5Qix1QkFBTyxzQ0FBUDtBQUNBLDZCQUFhLDZGQUFiO0FBQ0Esc0JBQU0sU0FBTjtBQUNBLHlCQUFTLEtBQVQ7YUFKSjtBQU1BLHNCQUFVO0FBQ04sdUJBQU8scURBQVA7QUFDQSw2QkFBYSx3RUFBYjtBQUNBLHNCQUFNLFNBQU47QUFDQSx5QkFBUyxJQUFUO2FBSko7QUFNQSxnQ0FBb0I7QUFDaEIsdUJBQU8sa0RBQVA7QUFDQSw0QkFBWSw2RUFBWjtBQUNBLHNCQUFNLFNBQU47QUFDQSx5QkFBUyxLQUFUO2FBSko7QUFNQSwrQkFBbUI7QUFDZix1QkFBTyxnREFBUDtBQUNBLHNCQUFNLFNBQU47QUFDQSx5QkFBUyxJQUFUO2FBSEo7QUFLQSxxQ0FBeUI7QUFDckIsdUJBQU8seUNB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LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgQXN5bmNTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi9zZXJ2ZXIvb21uaVwiO1xuY29uc3Qgd2luMzIgPSBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCI7XG5jbGFzcyBPbW5pU2hhcnBBdG9tIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICBhdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiQXV0b3N0YXJ0IE9tbmlzaGFycCBSb3NseW5cIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBdXRvbWF0aWNhbGx5IHN0YXJ0cyBPbW5pc2hhcnAgUm9zbHluIHdoZW4gYSBjb21wYXRpYmxlIGZpbGUgaXMgb3BlbmVkLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXZlbG9wZXJNb2RlOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiRGV2ZWxvcGVyIE1vZGVcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJPdXRwdXRzIGRldGFpbGVkIHNlcnZlciBjYWxscyBpbiBjb25zb2xlLmxvZ1wiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyBEaWFnbm9zdGljcyBmb3IgYWxsIFNvbHV0aW9uc1wiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFkdmFuY2VkOiBUaGlzIHdpbGwgc2hvdyBkaWFnbm9zdGljcyBmb3IgYWxsIG9wZW4gc29sdXRpb25zLiAgTk9URTogTWF5IHRha2UgYSByZXN0YXJ0IG9yIGNoYW5nZSB0byBlYWNoIHNlcnZlciB0byB0YWtlIGVmZmVjdCB3aGVuIHR1cm5lZCBvbi5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuYWJsZUFkdmFuY2VkRmlsZU5ldzoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkVuYWJsZSBgQWR2YW5jZWQgRmlsZSBOZXdgXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRW5hYmxlIGBBZHZhbmNlZCBGaWxlIE5ld2Agd2hlbiBkb2luZyBjdHJsLW4vY21kLW4gd2l0aGluIGEgQyMgZWRpdG9yLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJVc2UgTGVmdC1MYWJlbCBjb2x1bW4gaW4gU3VnZ2VzdGlvbnNcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTaG93cyByZXR1cm4gdHlwZXMgaW4gYSByaWdodC1hbGlnbmVkIGNvbHVtbiB0byB0aGUgbGVmdCBvZiB0aGUgY29tcGxldGlvbiBzdWdnZXN0aW9uIHRleHQuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VJY29uczoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlVzZSB1bmlxdWUgaWNvbnMgZm9yIGtpbmQgaW5kaWNhdG9ycyBpbiBTdWdnZXN0aW9uc1wiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3dzIGtpbmRzIHdpdGggdW5pcXVlIGljb25zIHJhdGhlciB0aGFuIGF1dG9jb21wbGV0ZSBkZWZhdWx0IHN0eWxlcy5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXV0b0FkanVzdFRyZWVWaWV3OiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiQWRqdXN0IHRoZSB0cmVlIHZpZXcgdG8gbWF0Y2ggdGhlIHNvbHV0aW9uIHJvb3QuXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJUaGlzIHdpbGwgYXV0b21hdGljYWxseSBhZGp1c3QgdGhlIHRyZWV2aWV3IHRvIGJlIHRoZSByb290IG9mIHRoZSBzb2x1dGlvbi5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5hZ0FkanVzdFRyZWVWaWV3OiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyB0aGUgbm90aWZpY2F0aW9ucyB0byBBZGp1c3QgdGhlIHRyZWUgdmlld1wiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhdXRvQWRkRXh0ZXJuYWxQcm9qZWN0czoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkFkZCBleHRlcm5hbCBwcm9qZWN0cyB0byB0aGUgdHJlZSB2aWV3LlwiLFxuICAgICAgICAgICAgICAgIGRlc2NycHRpb246IFwiVGhpcyB3aWxsIGF1dG9tYXRpY2FsbHkgYWRkIGV4dGVybmFsIHNvdXJjZXMgdG8gdGhlIHRyZWUgdmlldy5cXG4gRXh0ZXJuYWwgc291cmNlcyBhcmUgYW55IHByb2plY3RzIHRoYXQgYXJlIGxvYWRlZCBvdXRzaWRlIG9mIHRoZSBzb2x1dGlvbiByb290LlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmFnQWRkRXh0ZXJuYWxQcm9qZWN0czoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgdGhlIG5vdGlmaWNhdGlvbnMgdG8gYWRkIG9yIHJlbW92ZSBleHRlcm5hbCBwcm9qZWN0c1wiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoaWRlTGludGVySW50ZXJmYWNlOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiSGlkZSB0aGUgbGludGVyIGludGVyZmFjZSB3aGVuIHVzaW5nIG9tbmlzaGFycC1hdG9tIGVkaXRvcnNcIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd2FudE1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiUmVxdWVzdCBtZXRhZGF0YSBkZWZpbml0aW9uIHdpdGggR290byBEZWZpbml0aW9uXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJSZXF1ZXN0IHN5bWJvbCBtZXRhZGF0YSBmcm9tIHRoZSBzZXJ2ZXIsIHdoZW4gdXNpbmcgZ28tdG8tZGVmaW5pdGlvbi4gIFRoaXMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdCBvbiBMaW51eCwgZHVlIHRvIGlzc3VlcyB3aXRoIFJvc2x5biBvbiBNb25vLlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHdpbjMyXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWx0R290b0RlZmluaXRpb246IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJBbHQgR28gVG8gRGVmaW5pdGlvblwiLFxuICAgICAgICAgICAgICAgIGRlc2NycHRpb246IFwiVXNlIHRoZSBhbHQga2V5IGluc3RlYWQgb2YgdGhlIGN0cmwvY21kIGtleSBmb3IgZ290byBkZWZpbnRpb24gbW91c2Ugb3Zlci5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNob3dIaWRkZW5EaWFnbm9zdGljczoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgJ0hpZGRlbicgZGlhZ25vc3RpY3MgaW4gdGhlIGxpbnRlclwiLFxuICAgICAgICAgICAgICAgIGRlc2NycHRpb246IFwiU2hvdyBvciBoaWRlIGhpZGRlbiBkaWFnbm9zdGljcyBpbiB0aGUgbGludGVyLCB0aGlzIGRvZXMgbm90IGFmZmVjdCBncmV5aW5nIG91dCBvZiBuYW1lc3BhY2VzIHRoYXQgYXJlIHVudXNlZC5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGFjdGl2YXRlKHN0YXRlKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICAgICAgICB0aGlzLl9zdGFydGVkID0gbmV3IEFzeW5jU3ViamVjdCgpO1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZWQgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuY29uZmlndXJlS2V5YmluZGluZ3MoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206dG9nZ2xlXCIsICgpID0+IHRoaXMudG9nZ2xlKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Zml4LXVzaW5nc1wiLCAoKSA9PiBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZml4dXNpbmdzKHt9KSkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206c2V0dGluZ3NcIiwgKCkgPT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXNcIilcbiAgICAgICAgICAgIC50aGVuKHRhYiA9PiB7XG4gICAgICAgICAgICBpZiAodGFiICYmIHRhYi5nZXRVUkkgJiYgdGFiLmdldFVSSSgpICE9PSBcImF0b206Ly9jb25maWcvcGFja2FnZXMvb21uaXNoYXJwLWF0b21cIikge1xuICAgICAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oXCJhdG9tOi8vY29uZmlnL3BhY2thZ2VzL29tbmlzaGFycC1hdG9tXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSkpO1xuICAgICAgICBjb25zdCBncmFtbWFycyA9IGF0b20uZ3JhbW1hcnM7XG4gICAgICAgIGNvbnN0IGdyYW1tYXJDYiA9IChncmFtbWFyKSA9PiB7XG4gICAgICAgICAgICBpZiAoXy5maW5kKE9tbmkuZ3JhbW1hcnMsIChnbXIpID0+IGdtci5zY29wZU5hbWUgPT09IGdyYW1tYXIuc2NvcGVOYW1lKSkge1xuICAgICAgICAgICAgICAgIGF0b20uZ3JhbW1hcnMuc3RhcnRJZEZvclNjb3BlKGdyYW1tYXIuc2NvcGVOYW1lKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbW5pc2hhcnBTY29wZU5hbWUgPSBgJHtncmFtbWFyLnNjb3BlTmFtZX0ub21uaXNoYXJwYDtcbiAgICAgICAgICAgICAgICBjb25zdCBzY29wZUlkID0gZ3JhbW1hcnMuaWRzQnlTY29wZVtncmFtbWFyLnNjb3BlTmFtZV07XG4gICAgICAgICAgICAgICAgZ3JhbW1hcnMuaWRzQnlTY29wZVtvbW5pc2hhcnBTY29wZU5hbWVdID0gc2NvcGVJZDtcbiAgICAgICAgICAgICAgICBncmFtbWFycy5zY29wZXNCeUlkW3Njb3BlSWRdID0gb21uaXNoYXJwU2NvcGVOYW1lO1xuICAgICAgICAgICAgICAgIGdyYW1tYXIuc2NvcGVOYW1lID0gb21uaXNoYXJwU2NvcGVOYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBfLmVhY2goZ3JhbW1hcnMuZ3JhbW1hcnMsIGdyYW1tYXJDYik7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5ncmFtbWFycy5vbkRpZEFkZEdyYW1tYXIoZ3JhbW1hckNiKSk7XG4gICAgICAgIHJlcXVpcmUoXCJhdG9tLXBhY2thZ2UtZGVwc1wiKS5pbnN0YWxsKFwib21uaXNoYXJwLWF0b21cIilcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIkFjdGl2YXRpbmcgb21uaXNoYXJwLWF0b20gc29sdXRpb24gdHJhY2tpbmcuLi5cIik7XG4gICAgICAgICAgICBPbW5pLmFjdGl2YXRlKCk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkpO1xuICAgICAgICAgICAgdGhpcy5fc3RhcnRlZC5uZXh0KHRydWUpO1xuICAgICAgICAgICAgdGhpcy5fc3RhcnRlZC5jb21wbGV0ZSgpO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5sb2FkRmVhdHVyZXModGhpcy5nZXRGZWF0dXJlcyhcImF0b21cIikuZGVsYXkoT21uaVtcIl9raWNrX2luX3RoZV9wYW50c19cIl0gPyAwIDogMjAwMCkpLnRvUHJvbWlzZSgpKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgbGV0IHN0YXJ0aW5nT2JzZXJ2YWJsZSA9IE9tbmkuYWN0aXZlU29sdXRpb25cbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxuICAgICAgICAgICAgICAgIC50YWtlKDEpO1xuICAgICAgICAgICAgaWYgKE9tbmlbXCJfa2lja19pbl90aGVfcGFudHNfXCJdKSB7XG4gICAgICAgICAgICAgICAgc3RhcnRpbmdPYnNlcnZhYmxlID0gT2JzZXJ2YWJsZS5vZihudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc3RhcnRpbmdPYnNlcnZhYmxlXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gdGhpcy5sb2FkRmVhdHVyZXModGhpcy5nZXRGZWF0dXJlcyhcImZlYXR1cmVzXCIpKSlcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyKGVkaXRvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZhdGVkLm5leHQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlZC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldEZlYXR1cmVzKGZvbGRlcikge1xuICAgICAgICBjb25zdCB3aGl0ZUxpc3QgPSBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbTpmZWF0dXJlLXdoaXRlLWxpc3RcIik7XG4gICAgICAgIGNvbnN0IGZlYXR1cmVMaXN0ID0gYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b206ZmVhdHVyZS1saXN0XCIpO1xuICAgICAgICBjb25zdCB3aGl0ZUxpc3RVbmRlZmluZWQgPSAodHlwZW9mIHdoaXRlTGlzdCA9PT0gXCJ1bmRlZmluZWRcIik7XG4gICAgICAgIGNvbnNvbGUuaW5mbyhgR2V0dGluZyBmZWF0dXJlcyBmb3IgXCIke2ZvbGRlcn1cIi4uLmApO1xuICAgICAgICBjb25zdCBmZWF0dXJlRGlyID0gYCR7X19kaXJuYW1lfS8ke2ZvbGRlcn1gO1xuICAgICAgICBmdW5jdGlvbiBsb2FkRmVhdHVyZShmaWxlKSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSByZXF1aXJlKGAuLyR7Zm9sZGVyfS8ke2ZpbGV9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oYExvYWRpbmcgZmVhdHVyZSBcIiR7Zm9sZGVyfS8ke2ZpbGV9XCIuLi5gKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuYmluZE5vZGVDYWxsYmFjayhmcy5yZWFkZGlyKShmZWF0dXJlRGlyKVxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZXMgPT4gZmlsZXMpXG4gICAgICAgICAgICAuZmlsdGVyKGZpbGUgPT4gL1xcLmpzJC8udGVzdChmaWxlKSlcbiAgICAgICAgICAgIC5mbGF0TWFwKGZpbGUgPT4gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnN0YXQpKGAke2ZlYXR1cmVEaXJ9LyR7ZmlsZX1gKSwgKGZpbGUsIHN0YXQpID0+ICh7IGZpbGUsIHN0YXQgfSkpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXouc3RhdC5pc0RpcmVjdG9yeSgpKVxuICAgICAgICAgICAgLm1hcCh6ID0+ICh7XG4gICAgICAgICAgICBmaWxlOiBgJHtmb2xkZXJ9LyR7cGF0aC5iYXNlbmFtZSh6LmZpbGUpfWAucmVwbGFjZSgvXFwuanMkLywgXCJcIiksXG4gICAgICAgICAgICBsb2FkOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmVhdHVyZSA9IGxvYWRGZWF0dXJlKHouZmlsZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmVhdHVyZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBfLmVhY2goZmVhdHVyZSwgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfLmlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbHVlLnJlcXVpcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maWdba2V5XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGAke3ZhbHVlLnRpdGxlfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB2YWx1ZS5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IChfLmhhcyh2YWx1ZSwgXCJkZWZhdWx0XCIpID8gdmFsdWUuZGVmYXVsdCA6IHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSwgYWN0aXZhdGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZCwga2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKGZlYXR1cmVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpXG4gICAgICAgICAgICAuZmlsdGVyKGwgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aGl0ZUxpc3QgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3aGl0ZUxpc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5pbmNsdWRlcyhmZWF0dXJlTGlzdCwgbC5maWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAhXy5pbmNsdWRlcyhmZWF0dXJlTGlzdCwgbC5maWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxvYWRGZWF0dXJlcyhmZWF0dXJlcykge1xuICAgICAgICByZXR1cm4gZmVhdHVyZXNcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeiA9PiB6LmxvYWQoKSlcbiAgICAgICAgICAgIC50b0FycmF5KClcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeCA9PiB4KVxuICAgICAgICAgICAgLm1hcChmID0+IGYuYWN0aXZhdGUoKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAuZG8oe1xuICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBhdG9tLmNvbmZpZy5zZXRTY2hlbWEoXCJvbW5pc2hhcnAtYXRvbVwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHRoaXMuY29uZmlnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuY29uY2F0TWFwKHggPT4geClcbiAgICAgICAgICAgIC5kbyh4ID0+IHgoKSk7XG4gICAgfVxuICAgIGFjdGl2YXRlRmVhdHVyZSh3aGl0ZUxpc3RVbmRlZmluZWQsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IG51bGw7XG4gICAgICAgIGxldCBmaXJzdFJ1biA9IHRydWU7XG4gICAgICAgIGlmICh3aGl0ZUxpc3RVbmRlZmluZWQgJiYgXy5oYXModGhpcy5jb25maWcsIGtleSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZ0tleSA9IGBvbW5pc2hhcnAtYXRvbS4ke2tleX1gO1xuICAgICAgICAgICAgbGV0IGVuYWJsZURpc3Bvc2FibGUsIGRpc2FibGVEaXNwb3NhYmxlO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKGNvbmZpZ0tleSwgZW5hYmxlZCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXNhYmxlRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZURpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNhYmxlRGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXgpIHsgfVxuICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlID0gYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWZlYXR1cmU6ZW5hYmxlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCB0cnVlKSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZW5hYmxlRGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW5hYmxlRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc2FibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQWN0aXZhdGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUuYWN0aXZhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbih2YWx1ZVtcImF0dGFjaFwiXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdFJ1bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZURpc3Bvc2FibGUgPSBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTpkaXNhYmxlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCBmYWxzZSkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc2FibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmlyc3RSdW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWZlYXR1cmU6dG9nZ2xlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZ0tleSkpKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xuICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbih2YWx1ZVtcImF0dGFjaFwiXSkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZVtcImF0dGFjaFwiXSgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7IHRyeSB7XG4gICAgICAgICAgICB2YWx1ZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGV4KSB7IH0gfSkpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBkZXRlY3RBdXRvVG9nZ2xlR3JhbW1hcihlZGl0b3IpIHtcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgICAgIHRoaXMuZGV0ZWN0R3JhbW1hcihlZGl0b3IsIGdyYW1tYXIpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZENoYW5nZUdyYW1tYXIoKGdtcikgPT4gdGhpcy5kZXRlY3RHcmFtbWFyKGVkaXRvciwgZ21yKSkpO1xuICAgIH1cbiAgICBkZXRlY3RHcmFtbWFyKGVkaXRvciwgZ3JhbW1hcikge1xuICAgICAgICBpZiAoIWF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLmF1dG9TdGFydE9uQ29tcGF0aWJsZUZpbGVcIikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoT21uaS5pc1ZhbGlkR3JhbW1hcihncmFtbWFyKSkge1xuICAgICAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGdyYW1tYXIubmFtZSA9PT0gXCJKU09OXCIpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVkaXRvci5nZXRQYXRoKCkpID09PSBcInByb2plY3QuanNvblwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdG9nZ2xlKCkge1xuICAgICAgICBpZiAoT21uaS5pc09mZikge1xuICAgICAgICAgICAgT21uaS5jb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoT21uaS5pc09uKSB7XG4gICAgICAgICAgICBPbW5pLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkZWFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBjb25zdW1lU3RhdHVzQmFyKHN0YXR1c0Jhcikge1xuICAgICAgICBsZXQgZiA9IHJlcXVpcmUoXCIuL2F0b20vc3RhdHVzLWJhclwiKTtcbiAgICAgICAgZi5zdGF0dXNCYXIuc2V0dXAoc3RhdHVzQmFyKTtcbiAgICAgICAgZiA9IHJlcXVpcmUoXCIuL2F0b20vZnJhbWV3b3JrLXNlbGVjdG9yXCIpO1xuICAgICAgICBmLmZyYW1ld29ya1NlbGVjdG9yLnNldHVwKHN0YXR1c0Jhcik7XG4gICAgICAgIGYgPSByZXF1aXJlKFwiLi9hdG9tL2ZlYXR1cmUtYnV0dG9uc1wiKTtcbiAgICAgICAgZi5mZWF0dXJlRWRpdG9yQnV0dG9ucy5zZXR1cChzdGF0dXNCYXIpO1xuICAgIH1cbiAgICBjb25zdW1lWWVvbWFuRW52aXJvbm1lbnQoZ2VuZXJhdG9yU2VydmljZSkge1xuICAgICAgICBjb25zdCB7IGdlbmVyYXRvckFzcG5ldCB9ID0gcmVxdWlyZShcIi4vYXRvbS9nZW5lcmF0b3ItYXNwbmV0XCIpO1xuICAgICAgICBnZW5lcmF0b3JBc3BuZXQuc2V0dXAoZ2VuZXJhdG9yU2VydmljZSk7XG4gICAgfVxuICAgIHByb3ZpZGVBdXRvY29tcGxldGUoKSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9zZXJ2aWNlcy9jb21wbGV0aW9uLXByb3ZpZGVyXCIpO1xuICAgIH1cbiAgICBwcm92aWRlTGludGVyKCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHByb3ZpZGVQcm9qZWN0SnNvbigpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoXCIuL3NlcnZpY2VzL3Byb2plY3QtcHJvdmlkZXJcIikuY29uY2F0KHJlcXVpcmUoXCIuL3NlcnZpY2VzL2ZyYW1ld29yay1wcm92aWRlclwiKSk7XG4gICAgfVxuICAgIGNvbnN1bWVMaW50ZXIobGludGVyKSB7XG4gICAgICAgIGNvbnN0IExpbnRlclByb3ZpZGVyID0gcmVxdWlyZShcIi4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyXCIpO1xuICAgICAgICBjb25zdCBsaW50ZXJzID0gTGludGVyUHJvdmlkZXIucHJvdmlkZXI7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKGxpbnRlcnMsIGwgPT4ge1xuICAgICAgICAgICAgICAgIGxpbnRlci5kZWxldGVMaW50ZXIobCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKExpbnRlclByb3ZpZGVyLmluaXQobGludGVyKSk7XG4gICAgfVxuICAgIGNvbnN1bWVJbmRpZUxpbnRlcihsaW50ZXIpIHtcbiAgICAgICAgcmVxdWlyZShcIi4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyXCIpLnJlZ2lzdGVySW5kaWUobGludGVyLCB0aGlzLmRpc3Bvc2FibGUpO1xuICAgIH1cbiAgICBjb25maWd1cmVLZXliaW5kaW5ncygpIHtcbiAgICAgICAgbGV0IGRpc3Bvc2FibGU7XG4gICAgICAgIGNvbnN0IG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyA9IE9tbmkucGFja2FnZURpciArIFwiL29tbmlzaGFycC1hdG9tL2tleW1hcHMvb21uaXNoYXJwLWZpbGUtbmV3LmNzb25cIjtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20uZW5hYmxlQWR2YW5jZWRGaWxlTmV3XCIsIChlbmFibGVkKSA9PiB7XG4gICAgICAgICAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUgPSBhdG9tLmtleW1hcHMubG9hZEtleW1hcChvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpc3Bvc2FibGUpXG4gICAgICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIGF0b20ua2V5bWFwcy5yZW1vdmVCaW5kaW5nc0Zyb21Tb3VyY2Uob21uaXNoYXJwQWR2YW5jZWRGaWxlTmV3KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gbmV3IE9tbmlTaGFycEF0b207XG4iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCB7T2JzZXJ2YWJsZSwgQXN5bmNTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XHJcblxyXG4vLyBUT0RPOiBSZW1vdmUgdGhlc2UgYXQgc29tZSBwb2ludCB0byBzdHJlYW0gbGluZSBzdGFydHVwLlxyXG5pbXBvcnQge09tbml9IGZyb20gXCIuL3NlcnZlci9vbW5pXCI7XHJcbmNvbnN0IHdpbjMyID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiO1xyXG5cclxuY2xhc3MgT21uaVNoYXJwQXRvbSB7XHJcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICAvLyBJbnRlcm5hbDogVXNlZCBieSB1bml0IHRlc3RpbmcgdG8gbWFrZSBzdXJlIHRoZSBwbHVnaW4gaXMgY29tcGxldGVseSBhY3RpdmF0ZWQuXHJcbiAgICBwcml2YXRlIF9zdGFydGVkOiBBc3luY1N1YmplY3Q8Ym9vbGVhbj47XHJcbiAgICBwcml2YXRlIF9hY3RpdmF0ZWQ6IEFzeW5jU3ViamVjdDxib29sZWFuPjtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGUoc3RhdGU6IGFueSkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0ZWQgPSBuZXcgQXN5bmNTdWJqZWN0PGJvb2xlYW4+KCk7XHJcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gbmV3IEFzeW5jU3ViamVjdDxib29sZWFuPigpO1xyXG5cclxuICAgICAgICB0aGlzLmNvbmZpZ3VyZUtleWJpbmRpbmdzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnRvZ2dsZVwiLCAoKSA9PiB0aGlzLnRvZ2dsZSgpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Zml4LXVzaW5nc1wiLCAoKSA9PiBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZml4dXNpbmdzKHt9KSkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpzZXR0aW5nc1wiLCAoKSA9PiBhdG9tLndvcmtzcGFjZS5vcGVuKFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlc1wiKVxyXG4gICAgICAgICAgICAudGhlbih0YWIgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRhYiAmJiB0YWIuZ2V0VVJJICYmIHRhYi5nZXRVUkkoKSAhPT0gXCJhdG9tOi8vY29uZmlnL3BhY2thZ2VzL29tbmlzaGFycC1hdG9tXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlcy9vbW5pc2hhcnAtYXRvbVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpKTtcclxuXHJcbiAgICAgICAgY29uc3QgZ3JhbW1hcnMgPSAoPGFueT5hdG9tLmdyYW1tYXJzKTtcclxuICAgICAgICBjb25zdCBncmFtbWFyQ2IgPSAoZ3JhbW1hcjogeyBzY29wZU5hbWU6IHN0cmluZzsgfSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoXy5maW5kKE9tbmkuZ3JhbW1hcnMsIChnbXI6IGFueSkgPT4gZ21yLnNjb3BlTmFtZSA9PT0gZ3JhbW1hci5zY29wZU5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmUgdGhlIHNjb3BlIGhhcyBiZWVuIGluaXRlZFxyXG4gICAgICAgICAgICAgICAgYXRvbS5ncmFtbWFycy5zdGFydElkRm9yU2NvcGUoZ3JhbW1hci5zY29wZU5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IG9tbmlzaGFycFNjb3BlTmFtZSA9IGAke2dyYW1tYXIuc2NvcGVOYW1lfS5vbW5pc2hhcnBgO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NvcGVJZCA9IGdyYW1tYXJzLmlkc0J5U2NvcGVbZ3JhbW1hci5zY29wZU5hbWVdO1xyXG4gICAgICAgICAgICAgICAgZ3JhbW1hcnMuaWRzQnlTY29wZVtvbW5pc2hhcnBTY29wZU5hbWVdID0gc2NvcGVJZDtcclxuICAgICAgICAgICAgICAgIGdyYW1tYXJzLnNjb3Blc0J5SWRbc2NvcGVJZF0gPSBvbW5pc2hhcnBTY29wZU5hbWU7XHJcbiAgICAgICAgICAgICAgICBncmFtbWFyLnNjb3BlTmFtZSA9IG9tbmlzaGFycFNjb3BlTmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXy5lYWNoKGdyYW1tYXJzLmdyYW1tYXJzLCBncmFtbWFyQ2IpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5ncmFtbWFycy5vbkRpZEFkZEdyYW1tYXIoZ3JhbW1hckNiKSk7XHJcblxyXG4gICAgICAgIHJlcXVpcmUoXCJhdG9tLXBhY2thZ2UtZGVwc1wiKS5pbnN0YWxsKFwib21uaXNoYXJwLWF0b21cIilcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiQWN0aXZhdGluZyBvbW5pc2hhcnAtYXRvbSBzb2x1dGlvbiB0cmFja2luZy4uLlwiKTtcclxuICAgICAgICAgICAgICAgIE9tbmkuYWN0aXZhdGUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRlZC5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRlZC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmxvYWRGZWF0dXJlcyh0aGlzLmdldEZlYXR1cmVzKFwiYXRvbVwiKS5kZWxheShPbW5pW1wiX2tpY2tfaW5fdGhlX3BhbnRzX1wiXSA/IDAgOiAyMDAwKSkudG9Qcm9taXNlKCkpXHJcbiAgICAgICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0aW5nT2JzZXJ2YWJsZSA9IE9tbmkuYWN0aXZlU29sdXRpb25cclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxyXG4gICAgICAgICAgICAgICAgICAgIC50YWtlKDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICAgICAgICAgICAgICBpZiAoT21uaVtcIl9raWNrX2luX3RoZV9wYW50c19cIl0pIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFydGluZ09ic2VydmFibGUgPSBPYnNlcnZhYmxlLm9mKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGFjdGl2YXRlIGZlYXR1cmVzIG9uY2Ugd2UgaGF2ZSBhIHNvbHV0aW9uIVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzdGFydGluZ09ic2VydmFibGVcclxuICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiB0aGlzLmxvYWRGZWF0dXJlcyh0aGlzLmdldEZlYXR1cmVzKFwiZmVhdHVyZXNcIikpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXRlY3RBdXRvVG9nZ2xlR3JhbW1hcihlZGl0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlZC5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZhdGVkLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RmVhdHVyZXMoZm9sZGVyOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCB3aGl0ZUxpc3QgPSBhdG9tLmNvbmZpZy5nZXQ8Ym9vbGVhbj4oXCJvbW5pc2hhcnAtYXRvbTpmZWF0dXJlLXdoaXRlLWxpc3RcIik7XHJcbiAgICAgICAgY29uc3QgZmVhdHVyZUxpc3QgPSBhdG9tLmNvbmZpZy5nZXQ8c3RyaW5nW10+KFwib21uaXNoYXJwLWF0b206ZmVhdHVyZS1saXN0XCIpO1xyXG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdFVuZGVmaW5lZCA9ICh0eXBlb2Ygd2hpdGVMaXN0ID09PSBcInVuZGVmaW5lZFwiKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5pbmZvKGBHZXR0aW5nIGZlYXR1cmVzIGZvciBcIiR7Zm9sZGVyfVwiLi4uYCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGZlYXR1cmVEaXIgPSBgJHtfX2Rpcm5hbWV9LyR7Zm9sZGVyfWA7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGxvYWRGZWF0dXJlKGZpbGU6IHN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSByZXF1aXJlKGAuLyR7Zm9sZGVyfS8ke2ZpbGV9YCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgTG9hZGluZyBmZWF0dXJlIFwiJHtmb2xkZXJ9LyR7ZmlsZX1cIi4uLmApO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0Oy8vXy52YWx1ZXMocmVzdWx0KS5maWx0ZXIoZmVhdHVyZSA9PiAhXy5pc0Z1bmN0aW9uKGZlYXR1cmUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmJpbmROb2RlQ2FsbGJhY2soZnMucmVhZGRpcikoZmVhdHVyZURpcilcclxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZXMgPT4gZmlsZXMpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoZmlsZSA9PiAvXFwuanMkLy50ZXN0KGZpbGUpKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlID0+IE9ic2VydmFibGUuYmluZE5vZGVDYWxsYmFjayhmcy5zdGF0KShgJHtmZWF0dXJlRGlyfS8ke2ZpbGV9YCksIChmaWxlLCBzdGF0KSA9PiAoeyBmaWxlLCBzdGF0IH0pKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXouc3RhdC5pc0RpcmVjdG9yeSgpKVxyXG4gICAgICAgICAgICAubWFwKHogPT4gKHtcclxuICAgICAgICAgICAgICAgIGZpbGU6IGAke2ZvbGRlcn0vJHtwYXRoLmJhc2VuYW1lKHouZmlsZSl9YC5yZXBsYWNlKC9cXC5qcyQvLCBcIlwiKSxcclxuICAgICAgICAgICAgICAgIGxvYWQ6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmZWF0dXJlID0gbG9hZEZlYXR1cmUoei5maWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmVhdHVyZXM6IHsga2V5OiBzdHJpbmcsIGFjdGl2YXRlOiAoKSA9PiAoKSA9PiB2b2lkIH1bXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIF8uZWFjaChmZWF0dXJlLCAodmFsdWU6IElGZWF0dXJlLCBrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWUucmVxdWlyZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ1trZXldID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogYCR7dmFsdWUudGl0bGV9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHZhbHVlLmRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogKF8uaGFzKHZhbHVlLCBcImRlZmF1bHRcIikgPyB2YWx1ZS5kZWZhdWx0IDogdHJ1ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSwgYWN0aXZhdGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZCwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbTx7IGtleTogc3RyaW5nLCBhY3RpdmF0ZTogKCkgPT4gKCkgPT4gdm9pZCB9PihmZWF0dXJlcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAuZmlsdGVyKGwgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aGl0ZUxpc3QgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAod2hpdGVMaXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF8uaW5jbHVkZXMoZmVhdHVyZUxpc3QsIGwuZmlsZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhXy5pbmNsdWRlcyhmZWF0dXJlTGlzdCwgbC5maWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxvYWRGZWF0dXJlcyhmZWF0dXJlczogT2JzZXJ2YWJsZTx7IGZpbGU6IHN0cmluZzsgbG9hZDogKCkgPT4gT2JzZXJ2YWJsZTx7IGtleTogc3RyaW5nLCBhY3RpdmF0ZTogKCkgPT4gKCkgPT4gdm9pZCB9PiB9Pikge1xyXG4gICAgICAgIHJldHVybiBmZWF0dXJlc1xyXG4gICAgICAgICAgICAuY29uY2F0TWFwKHogPT4gei5sb2FkKCkpXHJcbiAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgLmNvbmNhdE1hcCh4ID0+IHgpXHJcbiAgICAgICAgICAgIC5tYXAoZiA9PiBmLmFjdGl2YXRlKCkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXHJcbiAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgLmRvKHtcclxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgKDxhbnk+YXRvbS5jb25maWcpLnNldFNjaGVtYShcIm9tbmlzaGFycC1hdG9tXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogdGhpcy5jb25maWdcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNvbmNhdE1hcCh4ID0+IHgpXHJcbiAgICAgICAgICAgIC5kbyh4ID0+IHgoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlRmVhdHVyZSh3aGl0ZUxpc3RVbmRlZmluZWQ6IGJvb2xlYW4sIGtleTogc3RyaW5nLCB2YWx1ZTogSUZlYXR1cmUpIHtcclxuICAgICAgICBsZXQgcmVzdWx0OiAoKSA9PiB2b2lkID0gbnVsbDtcclxuICAgICAgICBsZXQgZmlyc3RSdW4gPSB0cnVlO1xyXG5cclxuICAgICAgICAvLyBXaGl0ZWxpc3QgaXMgdXNlZCBmb3IgdW5pdCB0ZXN0aW5nLCB3ZSBkb25cInQgd2FudCB0aGUgY29uZmlnIHRvIG1ha2UgY2hhbmdlcyBoZXJlXHJcbiAgICAgICAgaWYgKHdoaXRlTGlzdFVuZGVmaW5lZCAmJiBfLmhhcyh0aGlzLmNvbmZpZywga2V5KSkge1xyXG4gICAgICAgICAgICBjb25zdCBjb25maWdLZXkgPSBgb21uaXNoYXJwLWF0b20uJHtrZXl9YDtcclxuICAgICAgICAgICAgbGV0IGVuYWJsZURpc3Bvc2FibGU6IElEaXNwb3NhYmxlLCBkaXNhYmxlRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWdLZXksIGVuYWJsZWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpc2FibGVEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNhYmxlRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7IHZhbHVlLmRpc3Bvc2UoKTsgfSBjYXRjaCAoZXgpIHsgLyogKi8gfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlID0gYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWZlYXR1cmU6ZW5hYmxlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCB0cnVlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlbmFibGVEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVuYWJsZURpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzYWJsZURpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQWN0aXZhdGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlW1wiYXR0YWNoXCJdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3RSdW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtcImF0dGFjaFwiXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbXCJhdHRhY2hcIl0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZURpc3Bvc2FibGUgPSBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTpkaXNhYmxlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCBmYWxzZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzYWJsZURpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZmlyc3RSdW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWZlYXR1cmU6dG9nZ2xlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZ0tleSkpKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFsdWUuYWN0aXZhdGUoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odmFsdWVbXCJhdHRhY2hcIl0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVbXCJhdHRhY2hcIl0oKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4geyB0cnkgeyB2YWx1ZS5kaXNwb3NlKCk7IH0gY2F0Y2ggKGV4KSB7IC8qICovIH0gfSkpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkZXRlY3RBdXRvVG9nZ2xlR3JhbW1hcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xyXG4gICAgICAgIHRoaXMuZGV0ZWN0R3JhbW1hcihlZGl0b3IsIGdyYW1tYXIpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hcigoZ21yOiBGaXJzdE1hdGUuR3JhbW1hcikgPT4gdGhpcy5kZXRlY3RHcmFtbWFyKGVkaXRvciwgZ21yKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZGV0ZWN0R3JhbW1hcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgZ3JhbW1hcjogRmlyc3RNYXRlLkdyYW1tYXIpIHtcclxuICAgICAgICBpZiAoIWF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLmF1dG9TdGFydE9uQ29tcGF0aWJsZUZpbGVcIikpIHtcclxuICAgICAgICAgICAgcmV0dXJuOyAvL3Nob3J0IG91dCwgaWYgc2V0dGluZyB0byBub3QgYXV0byBzdGFydCBpcyBlbmFibGVkXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoT21uaS5pc1ZhbGlkR3JhbW1hcihncmFtbWFyKSkge1xyXG4gICAgICAgICAgICBpZiAoT21uaS5pc09mZikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50b2dnbGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoZ3JhbW1hci5uYW1lID09PSBcIkpTT05cIikge1xyXG4gICAgICAgICAgICBpZiAocGF0aC5iYXNlbmFtZShlZGl0b3IuZ2V0UGF0aCgpKSA9PT0gXCJwcm9qZWN0Lmpzb25cIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b2dnbGUoKSB7XHJcbiAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcclxuICAgICAgICAgICAgT21uaS5jb25uZWN0KCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChPbW5pLmlzT24pIHtcclxuICAgICAgICAgICAgT21uaS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyOiBhbnkpIHtcclxuICAgICAgICBsZXQgZiA9IHJlcXVpcmUoXCIuL2F0b20vc3RhdHVzLWJhclwiKTtcclxuICAgICAgICBmLnN0YXR1c0Jhci5zZXR1cChzdGF0dXNCYXIpO1xyXG4gICAgICAgIGYgPSByZXF1aXJlKFwiLi9hdG9tL2ZyYW1ld29yay1zZWxlY3RvclwiKTtcclxuICAgICAgICBmLmZyYW1ld29ya1NlbGVjdG9yLnNldHVwKHN0YXR1c0Jhcik7XHJcbiAgICAgICAgZiA9IHJlcXVpcmUoXCIuL2F0b20vZmVhdHVyZS1idXR0b25zXCIpO1xyXG4gICAgICAgIGYuZmVhdHVyZUVkaXRvckJ1dHRvbnMuc2V0dXAoc3RhdHVzQmFyKTtcclxuICAgIH1cclxuXHJcbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbiAgICBwdWJsaWMgY29uc3VtZVllb21hbkVudmlyb25tZW50KGdlbmVyYXRvclNlcnZpY2U6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHtnZW5lcmF0b3JBc3BuZXR9ID0gcmVxdWlyZShcIi4vYXRvbS9nZW5lcmF0b3ItYXNwbmV0XCIpO1xyXG4gICAgICAgIGdlbmVyYXRvckFzcG5ldC5zZXR1cChnZW5lcmF0b3JTZXJ2aWNlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJvdmlkZUF1dG9jb21wbGV0ZSgpIHtcclxuICAgICAgICByZXR1cm4gcmVxdWlyZShcIi4vc2VydmljZXMvY29tcGxldGlvbi1wcm92aWRlclwiKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJvdmlkZUxpbnRlcigpOiBhbnlbXSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIC8vY29uc3QgTGludGVyUHJvdmlkZXIgPSByZXF1aXJlKFwiLi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXJcIik7XHJcbiAgICAgICAgLy9yZXR1cm4gTGludGVyUHJvdmlkZXIucHJvdmlkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByb3ZpZGVQcm9qZWN0SnNvbigpIHtcclxuICAgICAgICByZXR1cm4gcmVxdWlyZShcIi4vc2VydmljZXMvcHJvamVjdC1wcm92aWRlclwiKS5jb25jYXQocmVxdWlyZShcIi4vc2VydmljZXMvZnJhbWV3b3JrLXByb3ZpZGVyXCIpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uc3VtZUxpbnRlcihsaW50ZXI6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IExpbnRlclByb3ZpZGVyID0gcmVxdWlyZShcIi4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyXCIpO1xyXG4gICAgICAgIGNvbnN0IGxpbnRlcnMgPSBMaW50ZXJQcm92aWRlci5wcm92aWRlcjtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIF8uZWFjaChsaW50ZXJzLCBsID0+IHtcclxuICAgICAgICAgICAgICAgIGxpbnRlci5kZWxldGVMaW50ZXIobCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChMaW50ZXJQcm92aWRlci5pbml0KGxpbnRlcikpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25zdW1lSW5kaWVMaW50ZXIobGludGVyOiBhbnkpIHtcclxuICAgICAgICByZXF1aXJlKFwiLi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXJcIikucmVnaXN0ZXJJbmRpZShsaW50ZXIsIHRoaXMuZGlzcG9zYWJsZSk7XHJcbiAgICB9XHJcbiAgICAvKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuXHJcbiAgICBwcml2YXRlIGNvbmZpZ3VyZUtleWJpbmRpbmdzKCkge1xyXG4gICAgICAgIGxldCBkaXNwb3NhYmxlOiBFdmVudEtpdC5EaXNwb3NhYmxlO1xyXG4gICAgICAgIGNvbnN0IG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyA9IE9tbmkucGFja2FnZURpciArIFwiL29tbmlzaGFycC1hdG9tL2tleW1hcHMvb21uaXNoYXJwLWZpbGUtbmV3LmNzb25cIjtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5lbmFibGVBZHZhbmNlZEZpbGVOZXdcIiwgKGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUgPSBhdG9tLmtleW1hcHMubG9hZEtleW1hcChvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRpc3Bvc2FibGUpIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgYXRvbS5rZXltYXBzLnJlbW92ZUJpbmRpbmdzRnJvbVNvdXJjZShvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25maWcgPSB7XHJcbiAgICAgICAgYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZToge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJBdXRvc3RhcnQgT21uaXNoYXJwIFJvc2x5blwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBdXRvbWF0aWNhbGx5IHN0YXJ0cyBPbW5pc2hhcnAgUm9zbHluIHdoZW4gYSBjb21wYXRpYmxlIGZpbGUgaXMgb3BlbmVkLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGV2ZWxvcGVyTW9kZToge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJEZXZlbG9wZXIgTW9kZVwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJPdXRwdXRzIGRldGFpbGVkIHNlcnZlciBjYWxscyBpbiBjb25zb2xlLmxvZ1wiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9uczoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJTaG93IERpYWdub3N0aWNzIGZvciBhbGwgU29sdXRpb25zXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFkdmFuY2VkOiBUaGlzIHdpbGwgc2hvdyBkaWFnbm9zdGljcyBmb3IgYWxsIG9wZW4gc29sdXRpb25zLiAgTk9URTogTWF5IHRha2UgYSByZXN0YXJ0IG9yIGNoYW5nZSB0byBlYWNoIHNlcnZlciB0byB0YWtlIGVmZmVjdCB3aGVuIHR1cm5lZCBvbi5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbmFibGVBZHZhbmNlZEZpbGVOZXc6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiRW5hYmxlIGBBZHZhbmNlZCBGaWxlIE5ld2BcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRW5hYmxlIGBBZHZhbmNlZCBGaWxlIE5ld2Agd2hlbiBkb2luZyBjdHJsLW4vY21kLW4gd2l0aGluIGEgQyMgZWRpdG9yLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlVzZSBMZWZ0LUxhYmVsIGNvbHVtbiBpbiBTdWdnZXN0aW9uc1wiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTaG93cyByZXR1cm4gdHlwZXMgaW4gYSByaWdodC1hbGlnbmVkIGNvbHVtbiB0byB0aGUgbGVmdCBvZiB0aGUgY29tcGxldGlvbiBzdWdnZXN0aW9uIHRleHQuXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXNlSWNvbnM6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiVXNlIHVuaXF1ZSBpY29ucyBmb3Iga2luZCBpbmRpY2F0b3JzIGluIFN1Z2dlc3Rpb25zXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3dzIGtpbmRzIHdpdGggdW5pcXVlIGljb25zIHJhdGhlciB0aGFuIGF1dG9jb21wbGV0ZSBkZWZhdWx0IHN0eWxlcy5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9BZGp1c3RUcmVlVmlldzoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJBZGp1c3QgdGhlIHRyZWUgdmlldyB0byBtYXRjaCB0aGUgc29sdXRpb24gcm9vdC5cIixcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJUaGlzIHdpbGwgYXV0b21hdGljYWxseSBhZGp1c3QgdGhlIHRyZWV2aWV3IHRvIGJlIHRoZSByb290IG9mIHRoZSBzb2x1dGlvbi5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBuYWdBZGp1c3RUcmVlVmlldzoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJTaG93IHRoZSBub3RpZmljYXRpb25zIHRvIEFkanVzdCB0aGUgdHJlZSB2aWV3XCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvQWRkRXh0ZXJuYWxQcm9qZWN0czoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJBZGQgZXh0ZXJuYWwgcHJvamVjdHMgdG8gdGhlIHRyZWUgdmlldy5cIixcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJUaGlzIHdpbGwgYXV0b21hdGljYWxseSBhZGQgZXh0ZXJuYWwgc291cmNlcyB0byB0aGUgdHJlZSB2aWV3LlxcbiBFeHRlcm5hbCBzb3VyY2VzIGFyZSBhbnkgcHJvamVjdHMgdGhhdCBhcmUgbG9hZGVkIG91dHNpZGUgb2YgdGhlIHNvbHV0aW9uIHJvb3QuXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbmFnQWRkRXh0ZXJuYWxQcm9qZWN0czoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJTaG93IHRoZSBub3RpZmljYXRpb25zIHRvIGFkZCBvciByZW1vdmUgZXh0ZXJuYWwgcHJvamVjdHNcIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhpZGVMaW50ZXJJbnRlcmZhY2U6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiSGlkZSB0aGUgbGludGVyIGludGVyZmFjZSB3aGVuIHVzaW5nIG9tbmlzaGFycC1hdG9tIGVkaXRvcnNcIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdhbnRNZXRhZGF0YToge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJSZXF1ZXN0IG1ldGFkYXRhIGRlZmluaXRpb24gd2l0aCBHb3RvIERlZmluaXRpb25cIixcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJSZXF1ZXN0IHN5bWJvbCBtZXRhZGF0YSBmcm9tIHRoZSBzZXJ2ZXIsIHdoZW4gdXNpbmcgZ28tdG8tZGVmaW5pdGlvbi4gIFRoaXMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdCBvbiBMaW51eCwgZHVlIHRvIGlzc3VlcyB3aXRoIFJvc2x5biBvbiBNb25vLlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogd2luMzJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFsdEdvdG9EZWZpbml0aW9uOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkFsdCBHbyBUbyBEZWZpbml0aW9uXCIsXHJcbiAgICAgICAgICAgIGRlc2NycHRpb246IFwiVXNlIHRoZSBhbHQga2V5IGluc3RlYWQgb2YgdGhlIGN0cmwvY21kIGtleSBmb3IgZ290byBkZWZpbnRpb24gbW91c2Ugb3Zlci5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaG93SGlkZGVuRGlhZ25vc3RpY3M6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyAnSGlkZGVuJyBkaWFnbm9zdGljcyBpbiB0aGUgbGludGVyXCIsXHJcbiAgICAgICAgICAgIGRlc2NycHRpb246IFwiU2hvdyBvciBoaWRlIGhpZGRlbiBkaWFnbm9zdGljcyBpbiB0aGUgbGludGVyLCB0aGlzIGRvZXMgbm90IGFmZmVjdCBncmV5aW5nIG91dCBvZiBuYW1lc3BhY2VzIHRoYXQgYXJlIHVudXNlZC5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBPbW5pU2hhcnBBdG9tO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
