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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9vbW5pc2hhcnAtYXRvbS5qcyIsImxpYi9vbW5pc2hhcnAtYXRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQ0dBLElBQU0sUUFBUSxRQUFRLFFBQVIsS0FBcUIsT0FBbkM7O0lBRUEsYTtBQUFBLDZCQUFBO0FBQUE7O0FBZ1VXLGFBQUEsTUFBQSxHQUFTO0FBQ1osdUNBQTJCO0FBQ3ZCLHVCQUFPLDRCQURnQjtBQUV2Qiw2QkFBYSx5RUFGVTtBQUd2QixzQkFBTSxTQUhpQjtBQUl2Qix5QkFBUztBQUpjLGFBRGY7QUFPWiwyQkFBZTtBQUNYLHVCQUFPLGdCQURJO0FBRVgsNkJBQWEsOENBRkY7QUFHWCxzQkFBTSxTQUhLO0FBSVgseUJBQVM7QUFKRSxhQVBIO0FBYVosNENBQWdDO0FBQzVCLHVCQUFPLG9DQURxQjtBQUU1Qiw2QkFBYSxnSkFGZTtBQUc1QixzQkFBTSxTQUhzQjtBQUk1Qix5QkFBUztBQUptQixhQWJwQjtBQW1CWixtQ0FBdUI7QUFDbkIsdUJBQU8sNEJBRFk7QUFFbkIsNkJBQWEsd0VBRk07QUFHbkIsc0JBQU0sU0FIYTtBQUluQix5QkFBUztBQUpVLGFBbkJYO0FBeUJaLDhDQUFrQztBQUM5Qix1QkFBTyxzQ0FEdUI7QUFFOUIsNkJBQWEsNkZBRmlCO0FBRzlCLHNCQUFNLFNBSHdCO0FBSTlCLHlCQUFTO0FBSnFCLGFBekJ0QjtBQStCWixzQkFBVTtBQUNOLHVCQUFPLHFEQUREO0FBRU4sNkJBQWEsd0VBRlA7QUFHTixzQkFBTSxTQUhBO0FBSU4seUJBQVM7QUFKSCxhQS9CRTtBQXFDWixnQ0FBb0I7QUFDaEIsdUJBQU8sa0RBRFM7QUFFaEIsNEJBQVksNkVBRkk7QUFHaEIsc0JBQU0sU0FIVTtBQUloQix5QkFBUztBQUpPLGFBckNSO0FBMkNaLCtCQUFtQjtBQUNmLHVCQUFPLGdEQURRO0FBRWYsc0JBQU0sU0FGUztBQUdmLHlC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LFFBQVEsNkJBQVIsRUFBdUMsTUFBdkMsQ0FBOEMsUUFBUSwrQkFBUixDQUE5QyxDQUFQO0FBQ0g7OztzQ0FFb0IsTSxFQUFXO0FBQzVCLGdCQUFNLGlCQUFpQixRQUFRLDRCQUFSLENBQXZCO0FBQ0EsZ0JBQU0sVUFBVSxlQUFlLFFBQS9CO0FBRUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQiw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDbEMsaUNBQUUsSUFBRixDQUFPLE9BQVAsRUFBZ0IsYUFBQztBQUNiLDJCQUFPLFlBQVAsQ0FBb0IsQ0FBcEI7QUFDSCxpQkFGRDtBQUdILGFBSm1CLENBQXBCO0FBTUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixlQUFlLElBQWYsQ0FBb0IsTUFBcEIsQ0FBcEI7QUFDSDs7OzJDQUV5QixNLEVBQVc7QUFDakMsb0JBQVEsNEJBQVIsRUFBc0MsYUFBdEMsQ0FBb0QsTUFBcEQsRUFBNEQsS0FBSyxVQUFqRTtBQUNIOzs7K0NBRzJCO0FBQ3hCLGdCQUFJLG1CQUFKO0FBQ0EsZ0JBQU0sMkJBQTJCLFdBQUssVUFBTCxHQUFrQixpREFBbkQ7QUFDQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0Isc0NBQXBCLEVBQTRELFVBQUMsT0FBRCxFQUFpQjtBQUM3RixvQkFBSSxPQUFKLEVBQWE7QUFDVCxpQ0FBYSxLQUFLLE9BQUwsQ0FBYSxVQUFiLENBQXdCLHdCQUF4QixDQUFiO0FBQ0gsaUJBRkQsTUFFTztBQUNILHdCQUFJLFVBQUosRUFBZ0IsV0FBVyxPQUFYO0FBQ2hCLHlCQUFLLE9BQUwsQ0FBYSx3QkFBYixDQUFzQyx3QkFBdEM7QUFDSDtBQUNKLGFBUG1CLENBQXBCO0FBUUg7Ozs7OztBQXVGTCxPQUFPLE9BQVAsR0FBaUIsSUFBSSxhQUFKLEVBQWpCIiwiZmlsZSI6ImxpYi9vbW5pc2hhcnAtYXRvbS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIEFzeW5jU3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4vc2VydmVyL29tbmlcIjtcbmNvbnN0IHdpbjMyID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiO1xuY2xhc3MgT21uaVNoYXJwQXRvbSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0ge1xuICAgICAgICAgICAgYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZToge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkF1dG9zdGFydCBPbW5pc2hhcnAgUm9zbHluXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQXV0b21hdGljYWxseSBzdGFydHMgT21uaXNoYXJwIFJvc2x5biB3aGVuIGEgY29tcGF0aWJsZSBmaWxlIGlzIG9wZW5lZC5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGV2ZWxvcGVyTW9kZToge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkRldmVsb3BlciBNb2RlXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiT3V0cHV0cyBkZXRhaWxlZCBzZXJ2ZXIgY2FsbHMgaW4gY29uc29sZS5sb2dcIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9uczoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgRGlhZ25vc3RpY3MgZm9yIGFsbCBTb2x1dGlvbnNcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBZHZhbmNlZDogVGhpcyB3aWxsIHNob3cgZGlhZ25vc3RpY3MgZm9yIGFsbCBvcGVuIHNvbHV0aW9ucy4gIE5PVEU6IE1heSB0YWtlIGEgcmVzdGFydCBvciBjaGFuZ2UgdG8gZWFjaCBzZXJ2ZXIgdG8gdGFrZSBlZmZlY3Qgd2hlbiB0dXJuZWQgb24uXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmFibGVBZHZhbmNlZEZpbGVOZXc6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJFbmFibGUgYEFkdmFuY2VkIEZpbGUgTmV3YFwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkVuYWJsZSBgQWR2YW5jZWQgRmlsZSBOZXdgIHdoZW4gZG9pbmcgY3RybC1uL2NtZC1uIHdpdGhpbiBhIEMjIGVkaXRvci5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiVXNlIExlZnQtTGFiZWwgY29sdW1uIGluIFN1Z2dlc3Rpb25zXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2hvd3MgcmV0dXJuIHR5cGVzIGluIGEgcmlnaHQtYWxpZ25lZCBjb2x1bW4gdG8gdGhlIGxlZnQgb2YgdGhlIGNvbXBsZXRpb24gc3VnZ2VzdGlvbiB0ZXh0LlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXNlSWNvbnM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJVc2UgdW5pcXVlIGljb25zIGZvciBraW5kIGluZGljYXRvcnMgaW4gU3VnZ2VzdGlvbnNcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTaG93cyBraW5kcyB3aXRoIHVuaXF1ZSBpY29ucyByYXRoZXIgdGhhbiBhdXRvY29tcGxldGUgZGVmYXVsdCBzdHlsZXMuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGF1dG9BZGp1c3RUcmVlVmlldzoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkFkanVzdCB0aGUgdHJlZSB2aWV3IHRvIG1hdGNoIHRoZSBzb2x1dGlvbiByb290LlwiLFxuICAgICAgICAgICAgICAgIGRlc2NycHRpb246IFwiVGhpcyB3aWxsIGF1dG9tYXRpY2FsbHkgYWRqdXN0IHRoZSB0cmVldmlldyB0byBiZSB0aGUgcm9vdCBvZiB0aGUgc29sdXRpb24uXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYWdBZGp1c3RUcmVlVmlldzoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgdGhlIG5vdGlmaWNhdGlvbnMgdG8gQWRqdXN0IHRoZSB0cmVlIHZpZXdcIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXV0b0FkZEV4dGVybmFsUHJvamVjdHM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJBZGQgZXh0ZXJuYWwgcHJvamVjdHMgdG8gdGhlIHRyZWUgdmlldy5cIixcbiAgICAgICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IGFkZCBleHRlcm5hbCBzb3VyY2VzIHRvIHRoZSB0cmVlIHZpZXcuXFxuIEV4dGVybmFsIHNvdXJjZXMgYXJlIGFueSBwcm9qZWN0cyB0aGF0IGFyZSBsb2FkZWQgb3V0c2lkZSBvZiB0aGUgc29sdXRpb24gcm9vdC5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5hZ0FkZEV4dGVybmFsUHJvamVjdHM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJTaG93IHRoZSBub3RpZmljYXRpb25zIHRvIGFkZCBvciByZW1vdmUgZXh0ZXJuYWwgcHJvamVjdHNcIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGlkZUxpbnRlckludGVyZmFjZToge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkhpZGUgdGhlIGxpbnRlciBpbnRlcmZhY2Ugd2hlbiB1c2luZyBvbW5pc2hhcnAtYXRvbSBlZGl0b3JzXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHdhbnRNZXRhZGF0YToge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlJlcXVlc3QgbWV0YWRhdGEgZGVmaW5pdGlvbiB3aXRoIEdvdG8gRGVmaW5pdGlvblwiLFxuICAgICAgICAgICAgICAgIGRlc2NycHRpb246IFwiUmVxdWVzdCBzeW1ib2wgbWV0YWRhdGEgZnJvbSB0aGUgc2VydmVyLCB3aGVuIHVzaW5nIGdvLXRvLWRlZmluaXRpb24uICBUaGlzIGlzIGRpc2FibGVkIGJ5IGRlZmF1bHQgb24gTGludXgsIGR1ZSB0byBpc3N1ZXMgd2l0aCBSb3NseW4gb24gTW9uby5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB3aW4zMlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFsdEdvdG9EZWZpbml0aW9uOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiQWx0IEdvIFRvIERlZmluaXRpb25cIixcbiAgICAgICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlVzZSB0aGUgYWx0IGtleSBpbnN0ZWFkIG9mIHRoZSBjdHJsL2NtZCBrZXkgZm9yIGdvdG8gZGVmaW50aW9uIG1vdXNlIG92ZXIuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG93SGlkZGVuRGlhZ25vc3RpY3M6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJTaG93ICdIaWRkZW4nIGRpYWdub3N0aWNzIGluIHRoZSBsaW50ZXJcIixcbiAgICAgICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlNob3cgb3IgaGlkZSBoaWRkZW4gZGlhZ25vc3RpY3MgaW4gdGhlIGxpbnRlciwgdGhpcyBkb2VzIG5vdCBhZmZlY3QgZ3JleWluZyBvdXQgb2YgbmFtZXNwYWNlcyB0aGF0IGFyZSB1bnVzZWQuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBhY3RpdmF0ZShzdGF0ZSkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgICAgICAgdGhpcy5fc3RhcnRlZCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gbmV3IEFzeW5jU3ViamVjdCgpO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyZUtleWJpbmRpbmdzKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnRvZ2dsZVwiLCAoKSA9PiB0aGlzLnRvZ2dsZSgpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmZpeC11c2luZ3NcIiwgKCkgPT4gT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpeHVzaW5ncyh7fSkpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnNldHRpbmdzXCIsICgpID0+IGF0b20ud29ya3NwYWNlLm9wZW4oXCJhdG9tOi8vY29uZmlnL3BhY2thZ2VzXCIpXG4gICAgICAgICAgICAudGhlbih0YWIgPT4ge1xuICAgICAgICAgICAgaWYgKHRhYiAmJiB0YWIuZ2V0VVJJICYmIHRhYi5nZXRVUkkoKSAhPT0gXCJhdG9tOi8vY29uZmlnL3BhY2thZ2VzL29tbmlzaGFycC1hdG9tXCIpIHtcbiAgICAgICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlcy9vbW5pc2hhcnAtYXRvbVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpKTtcbiAgICAgICAgY29uc3QgZ3JhbW1hcnMgPSBhdG9tLmdyYW1tYXJzO1xuICAgICAgICBjb25zdCBncmFtbWFyQ2IgPSAoZ3JhbW1hcikgPT4ge1xuICAgICAgICAgICAgaWYgKF8uZmluZChPbW5pLmdyYW1tYXJzLCAoZ21yKSA9PiBnbXIuc2NvcGVOYW1lID09PSBncmFtbWFyLnNjb3BlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICBhdG9tLmdyYW1tYXJzLnN0YXJ0SWRGb3JTY29wZShncmFtbWFyLnNjb3BlTmFtZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb21uaXNoYXJwU2NvcGVOYW1lID0gYCR7Z3JhbW1hci5zY29wZU5hbWV9Lm9tbmlzaGFycGA7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NvcGVJZCA9IGdyYW1tYXJzLmlkc0J5U2NvcGVbZ3JhbW1hci5zY29wZU5hbWVdO1xuICAgICAgICAgICAgICAgIGdyYW1tYXJzLmlkc0J5U2NvcGVbb21uaXNoYXJwU2NvcGVOYW1lXSA9IHNjb3BlSWQ7XG4gICAgICAgICAgICAgICAgZ3JhbW1hcnMuc2NvcGVzQnlJZFtzY29wZUlkXSA9IG9tbmlzaGFycFNjb3BlTmFtZTtcbiAgICAgICAgICAgICAgICBncmFtbWFyLnNjb3BlTmFtZSA9IG9tbmlzaGFycFNjb3BlTmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgXy5lYWNoKGdyYW1tYXJzLmdyYW1tYXJzLCBncmFtbWFyQ2IpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uZ3JhbW1hcnMub25EaWRBZGRHcmFtbWFyKGdyYW1tYXJDYikpO1xuICAgICAgICByZXF1aXJlKFwiYXRvbS1wYWNrYWdlLWRlcHNcIikuaW5zdGFsbChcIm9tbmlzaGFycC1hdG9tXCIpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJBY3RpdmF0aW5nIG9tbmlzaGFycC1hdG9tIHNvbHV0aW9uIHRyYWNraW5nLi4uXCIpO1xuICAgICAgICAgICAgT21uaS5hY3RpdmF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pKTtcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0ZWQubmV4dCh0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0ZWQuY29tcGxldGUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMubG9hZEZlYXR1cmVzKHRoaXMuZ2V0RmVhdHVyZXMoXCJhdG9tXCIpLmRlbGF5KE9tbmlbXCJfa2lja19pbl90aGVfcGFudHNfXCJdID8gMCA6IDIwMDApKS50b1Byb21pc2UoKSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGxldCBzdGFydGluZ09ic2VydmFibGUgPSBPbW5pLmFjdGl2ZVNvbHV0aW9uXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcbiAgICAgICAgICAgICAgICAudGFrZSgxKTtcbiAgICAgICAgICAgIGlmIChPbW5pW1wiX2tpY2tfaW5fdGhlX3BhbnRzX1wiXSkge1xuICAgICAgICAgICAgICAgIHN0YXJ0aW5nT2JzZXJ2YWJsZSA9IE9ic2VydmFibGUub2YobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHN0YXJ0aW5nT2JzZXJ2YWJsZVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IHRoaXMubG9hZEZlYXR1cmVzKHRoaXMuZ2V0RmVhdHVyZXMoXCJmZWF0dXJlc1wiKSkpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSh7XG4gICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoKGVkaXRvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXRlY3RBdXRvVG9nZ2xlR3JhbW1hcihlZGl0b3IpO1xuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlZC5uZXh0KHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmF0ZWQuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRGZWF0dXJlcyhmb2xkZXIpIHtcbiAgICAgICAgY29uc3Qgd2hpdGVMaXN0ID0gYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b206ZmVhdHVyZS13aGl0ZS1saXN0XCIpO1xuICAgICAgICBjb25zdCBmZWF0dXJlTGlzdCA9IGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tOmZlYXR1cmUtbGlzdFwiKTtcbiAgICAgICAgY29uc3Qgd2hpdGVMaXN0VW5kZWZpbmVkID0gKHR5cGVvZiB3aGl0ZUxpc3QgPT09IFwidW5kZWZpbmVkXCIpO1xuICAgICAgICBjb25zb2xlLmluZm8oYEdldHRpbmcgZmVhdHVyZXMgZm9yIFwiJHtmb2xkZXJ9XCIuLi5gKTtcbiAgICAgICAgY29uc3QgZmVhdHVyZURpciA9IGAke19fZGlybmFtZX0vJHtmb2xkZXJ9YDtcbiAgICAgICAgZnVuY3Rpb24gbG9hZEZlYXR1cmUoZmlsZSkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVxdWlyZShgLi8ke2ZvbGRlcn0vJHtmaWxlfWApO1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKGBMb2FkaW5nIGZlYXR1cmUgXCIke2ZvbGRlcn0vJHtmaWxlfVwiLi4uYCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmJpbmROb2RlQ2FsbGJhY2soZnMucmVhZGRpcikoZmVhdHVyZURpcilcbiAgICAgICAgICAgIC5mbGF0TWFwKGZpbGVzID0+IGZpbGVzKVxuICAgICAgICAgICAgLmZpbHRlcihmaWxlID0+IC9cXC5qcyQvLnRlc3QoZmlsZSkpXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlID0+IE9ic2VydmFibGUuYmluZE5vZGVDYWxsYmFjayhmcy5zdGF0KShgJHtmZWF0dXJlRGlyfS8ke2ZpbGV9YCksIChmaWxlLCBzdGF0KSA9PiAoeyBmaWxlLCBzdGF0IH0pKVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6LnN0YXQuaXNEaXJlY3RvcnkoKSlcbiAgICAgICAgICAgIC5tYXAoeiA9PiAoe1xuICAgICAgICAgICAgZmlsZTogYCR7Zm9sZGVyfS8ke3BhdGguYmFzZW5hbWUoei5maWxlKX1gLnJlcGxhY2UoL1xcLmpzJC8sIFwiXCIpLFxuICAgICAgICAgICAgbG9hZDogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZlYXR1cmUgPSBsb2FkRmVhdHVyZSh6LmZpbGUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZlYXR1cmVzID0gW107XG4gICAgICAgICAgICAgICAgXy5lYWNoKGZlYXR1cmUsICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghXy5pc0Z1bmN0aW9uKHZhbHVlKSAmJiAhXy5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZS5yZXF1aXJlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnW2tleV0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBgJHt2YWx1ZS50aXRsZX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogdmFsdWUuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAoXy5oYXModmFsdWUsIFwiZGVmYXVsdFwiKSA/IHZhbHVlLmRlZmF1bHQgOiB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmZWF0dXJlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXksIGFjdGl2YXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGl2YXRlRmVhdHVyZSh3aGl0ZUxpc3RVbmRlZmluZWQsIGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbShmZWF0dXJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKVxuICAgICAgICAgICAgLmZpbHRlcihsID0+IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd2hpdGVMaXN0ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAod2hpdGVMaXN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uaW5jbHVkZXMoZmVhdHVyZUxpc3QsIGwuZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIV8uaW5jbHVkZXMoZmVhdHVyZUxpc3QsIGwuZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsb2FkRmVhdHVyZXMoZmVhdHVyZXMpIHtcbiAgICAgICAgcmV0dXJuIGZlYXR1cmVzXG4gICAgICAgICAgICAuY29uY2F0TWFwKHogPT4gei5sb2FkKCkpXG4gICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAuY29uY2F0TWFwKHggPT4geClcbiAgICAgICAgICAgIC5tYXAoZiA9PiBmLmFjdGl2YXRlKCkpXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxuICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgLmRvKHtcbiAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgYXRvbS5jb25maWcuc2V0U2NoZW1hKFwib21uaXNoYXJwLWF0b21cIiwge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB0aGlzLmNvbmZpZ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAgICAgLmNvbmNhdE1hcCh4ID0+IHgpXG4gICAgICAgICAgICAuZG8oeCA9PiB4KCkpO1xuICAgIH1cbiAgICBhY3RpdmF0ZUZlYXR1cmUod2hpdGVMaXN0VW5kZWZpbmVkLCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBudWxsO1xuICAgICAgICBsZXQgZmlyc3RSdW4gPSB0cnVlO1xuICAgICAgICBpZiAod2hpdGVMaXN0VW5kZWZpbmVkICYmIF8uaGFzKHRoaXMuY29uZmlnLCBrZXkpKSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWdLZXkgPSBgb21uaXNoYXJwLWF0b20uJHtrZXl9YDtcbiAgICAgICAgICAgIGxldCBlbmFibGVEaXNwb3NhYmxlLCBkaXNhYmxlRGlzcG9zYWJsZTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWdLZXksIGVuYWJsZWQgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzYWJsZURpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzYWJsZURpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZURpc3Bvc2FibGUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGV4KSB7IH1cbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgYG9tbmlzaGFycC1mZWF0dXJlOmVuYWJsZS0ke18ua2ViYWJDYXNlKGtleSl9YCwgKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZ0tleSwgdHJ1ZSkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVuYWJsZURpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVuYWJsZURpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNhYmxlRGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEFjdGl2YXRpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLmFjdGl2YXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odmFsdWVbXCJhdHRhY2hcIl0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3RSdW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtcImF0dGFjaFwiXSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtcImF0dGFjaFwiXSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlID0gYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWZlYXR1cmU6ZGlzYWJsZS0ke18ua2ViYWJDYXNlKGtleSl9YCwgKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZ0tleSwgZmFsc2UpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNhYmxlRGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpcnN0UnVuID0gZmFsc2U7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgYG9tbmlzaGFycC1mZWF0dXJlOnRvZ2dsZS0ke18ua2ViYWJDYXNlKGtleSl9YCwgKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZ0tleSwgIWF0b20uY29uZmlnLmdldChjb25maWdLZXkpKSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUuYWN0aXZhdGUoKTtcbiAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odmFsdWVbXCJhdHRhY2hcIl0pKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVbXCJhdHRhY2hcIl0oKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4geyB0cnkge1xuICAgICAgICAgICAgdmFsdWUuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChleCkgeyB9IH0pKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgZGV0ZWN0QXV0b1RvZ2dsZUdyYW1tYXIoZWRpdG9yKSB7XG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xuICAgICAgICB0aGlzLmRldGVjdEdyYW1tYXIoZWRpdG9yLCBncmFtbWFyKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VHcmFtbWFyKChnbXIpID0+IHRoaXMuZGV0ZWN0R3JhbW1hcihlZGl0b3IsIGdtcikpKTtcbiAgICB9XG4gICAgZGV0ZWN0R3JhbW1hcihlZGl0b3IsIGdyYW1tYXIpIHtcbiAgICAgICAgaWYgKCFhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5hdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlXCIpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE9tbmkuaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcikpIHtcbiAgICAgICAgICAgIGlmIChPbW5pLmlzT2ZmKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50b2dnbGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChncmFtbWFyLm5hbWUgPT09IFwiSlNPTlwiKSB7XG4gICAgICAgICAgICBpZiAocGF0aC5iYXNlbmFtZShlZGl0b3IuZ2V0UGF0aCgpKSA9PT0gXCJwcm9qZWN0Lmpzb25cIikge1xuICAgICAgICAgICAgICAgIGlmIChPbW5pLmlzT2ZmKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcbiAgICAgICAgICAgIE9tbmkuY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKE9tbmkuaXNPbikge1xuICAgICAgICAgICAgT21uaS5kaXNjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZGVhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgY29uc3VtZVN0YXR1c0JhcihzdGF0dXNCYXIpIHtcbiAgICAgICAgbGV0IGYgPSByZXF1aXJlKFwiLi9hdG9tL3N0YXR1cy1iYXJcIik7XG4gICAgICAgIGYuc3RhdHVzQmFyLnNldHVwKHN0YXR1c0Jhcik7XG4gICAgICAgIGYgPSByZXF1aXJlKFwiLi9hdG9tL2ZyYW1ld29yay1zZWxlY3RvclwiKTtcbiAgICAgICAgZi5mcmFtZXdvcmtTZWxlY3Rvci5zZXR1cChzdGF0dXNCYXIpO1xuICAgICAgICBmID0gcmVxdWlyZShcIi4vYXRvbS9mZWF0dXJlLWJ1dHRvbnNcIik7XG4gICAgICAgIGYuZmVhdHVyZUVkaXRvckJ1dHRvbnMuc2V0dXAoc3RhdHVzQmFyKTtcbiAgICB9XG4gICAgY29uc3VtZVllb21hbkVudmlyb25tZW50KGdlbmVyYXRvclNlcnZpY2UpIHtcbiAgICAgICAgY29uc3QgeyBnZW5lcmF0b3JBc3BuZXQgfSA9IHJlcXVpcmUoXCIuL2F0b20vZ2VuZXJhdG9yLWFzcG5ldFwiKTtcbiAgICAgICAgZ2VuZXJhdG9yQXNwbmV0LnNldHVwKGdlbmVyYXRvclNlcnZpY2UpO1xuICAgIH1cbiAgICBwcm92aWRlQXV0b2NvbXBsZXRlKCkge1xuICAgICAgICByZXR1cm4gcmVxdWlyZShcIi4vc2VydmljZXMvY29tcGxldGlvbi1wcm92aWRlclwiKTtcbiAgICB9XG4gICAgcHJvdmlkZUxpbnRlcigpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBwcm92aWRlUHJvamVjdEpzb24oKSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9zZXJ2aWNlcy9wcm9qZWN0LXByb3ZpZGVyXCIpLmNvbmNhdChyZXF1aXJlKFwiLi9zZXJ2aWNlcy9mcmFtZXdvcmstcHJvdmlkZXJcIikpO1xuICAgIH1cbiAgICBjb25zdW1lTGludGVyKGxpbnRlcikge1xuICAgICAgICBjb25zdCBMaW50ZXJQcm92aWRlciA9IHJlcXVpcmUoXCIuL3NlcnZpY2VzL2xpbnRlci1wcm92aWRlclwiKTtcbiAgICAgICAgY29uc3QgbGludGVycyA9IExpbnRlclByb3ZpZGVyLnByb3ZpZGVyO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChsaW50ZXJzLCBsID0+IHtcbiAgICAgICAgICAgICAgICBsaW50ZXIuZGVsZXRlTGludGVyKGwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChMaW50ZXJQcm92aWRlci5pbml0KGxpbnRlcikpO1xuICAgIH1cbiAgICBjb25zdW1lSW5kaWVMaW50ZXIobGludGVyKSB7XG4gICAgICAgIHJlcXVpcmUoXCIuL3NlcnZpY2VzL2xpbnRlci1wcm92aWRlclwiKS5yZWdpc3RlckluZGllKGxpbnRlciwgdGhpcy5kaXNwb3NhYmxlKTtcbiAgICB9XG4gICAgY29uZmlndXJlS2V5YmluZGluZ3MoKSB7XG4gICAgICAgIGxldCBkaXNwb3NhYmxlO1xuICAgICAgICBjb25zdCBvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcgPSBPbW5pLnBhY2thZ2VEaXIgKyBcIi9vbW5pc2hhcnAtYXRvbS9rZXltYXBzL29tbmlzaGFycC1maWxlLW5ldy5jc29uXCI7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLmVuYWJsZUFkdmFuY2VkRmlsZU5ld1wiLCAoZW5hYmxlZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlID0gYXRvbS5rZXltYXBzLmxvYWRLZXltYXAob21uaXNoYXJwQWR2YW5jZWRGaWxlTmV3KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChkaXNwb3NhYmxlKVxuICAgICAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICBhdG9tLmtleW1hcHMucmVtb3ZlQmluZGluZ3NGcm9tU291cmNlKG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBPbW5pU2hhcnBBdG9tO1xuIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge09ic2VydmFibGUsIEFzeW5jU3ViamVjdH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5cclxuLy8gVE9ETzogUmVtb3ZlIHRoZXNlIGF0IHNvbWUgcG9pbnQgdG8gc3RyZWFtIGxpbmUgc3RhcnR1cC5cclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi9zZXJ2ZXIvb21uaVwiO1xyXG5jb25zdCB3aW4zMiA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIjtcclxuXHJcbmNsYXNzIE9tbmlTaGFycEF0b20ge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgLy8gSW50ZXJuYWw6IFVzZWQgYnkgdW5pdCB0ZXN0aW5nIHRvIG1ha2Ugc3VyZSB0aGUgcGx1Z2luIGlzIGNvbXBsZXRlbHkgYWN0aXZhdGVkLlxyXG4gICAgcHJpdmF0ZSBfc3RhcnRlZDogQXN5bmNTdWJqZWN0PGJvb2xlYW4+O1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZhdGVkOiBBc3luY1N1YmplY3Q8Ym9vbGVhbj47XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKHN0YXRlOiBhbnkpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgICAgICB0aGlzLl9zdGFydGVkID0gbmV3IEFzeW5jU3ViamVjdDxib29sZWFuPigpO1xyXG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IG5ldyBBc3luY1N1YmplY3Q8Ym9vbGVhbj4oKTtcclxuXHJcbiAgICAgICAgdGhpcy5jb25maWd1cmVLZXliaW5kaW5ncygpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGVcIiwgKCkgPT4gdGhpcy50b2dnbGUoKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmZpeC11c2luZ3NcIiwgKCkgPT4gT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpeHVzaW5ncyh7fSkpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206c2V0dGluZ3NcIiwgKCkgPT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXNcIilcclxuICAgICAgICAgICAgLnRoZW4odGFiID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0YWIgJiYgdGFiLmdldFVSSSAmJiB0YWIuZ2V0VVJJKCkgIT09IFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlcy9vbW5pc2hhcnAtYXRvbVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXMvb21uaXNoYXJwLWF0b21cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGdyYW1tYXJzID0gKDxhbnk+YXRvbS5ncmFtbWFycyk7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hckNiID0gKGdyYW1tYXI6IHsgc2NvcGVOYW1lOiBzdHJpbmc7IH0pID0+IHtcclxuICAgICAgICAgICAgaWYgKF8uZmluZChPbW5pLmdyYW1tYXJzLCAoZ21yOiBhbnkpID0+IGdtci5zY29wZU5hbWUgPT09IGdyYW1tYXIuc2NvcGVOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gZW5zdXJlIHRoZSBzY29wZSBoYXMgYmVlbiBpbml0ZWRcclxuICAgICAgICAgICAgICAgIGF0b20uZ3JhbW1hcnMuc3RhcnRJZEZvclNjb3BlKGdyYW1tYXIuc2NvcGVOYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBvbW5pc2hhcnBTY29wZU5hbWUgPSBgJHtncmFtbWFyLnNjb3BlTmFtZX0ub21uaXNoYXJwYDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjb3BlSWQgPSBncmFtbWFycy5pZHNCeVNjb3BlW2dyYW1tYXIuc2NvcGVOYW1lXTtcclxuICAgICAgICAgICAgICAgIGdyYW1tYXJzLmlkc0J5U2NvcGVbb21uaXNoYXJwU2NvcGVOYW1lXSA9IHNjb3BlSWQ7XHJcbiAgICAgICAgICAgICAgICBncmFtbWFycy5zY29wZXNCeUlkW3Njb3BlSWRdID0gb21uaXNoYXJwU2NvcGVOYW1lO1xyXG4gICAgICAgICAgICAgICAgZ3JhbW1hci5zY29wZU5hbWUgPSBvbW5pc2hhcnBTY29wZU5hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIF8uZWFjaChncmFtbWFycy5ncmFtbWFycywgZ3JhbW1hckNiKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uZ3JhbW1hcnMub25EaWRBZGRHcmFtbWFyKGdyYW1tYXJDYikpO1xyXG5cclxuICAgICAgICByZXF1aXJlKFwiYXRvbS1wYWNrYWdlLWRlcHNcIikuaW5zdGFsbChcIm9tbmlzaGFycC1hdG9tXCIpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIkFjdGl2YXRpbmcgb21uaXNoYXJwLWF0b20gc29sdXRpb24gdHJhY2tpbmcuLi5cIik7XHJcbiAgICAgICAgICAgICAgICBPbW5pLmFjdGl2YXRlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0ZWQubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0ZWQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5sb2FkRmVhdHVyZXModGhpcy5nZXRGZWF0dXJlcyhcImF0b21cIikuZGVsYXkoT21uaVtcIl9raWNrX2luX3RoZV9wYW50c19cIl0gPyAwIDogMjAwMCkpLnRvUHJvbWlzZSgpKVxyXG4gICAgICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBzdGFydGluZ09ic2VydmFibGUgPSBPbW5pLmFjdGl2ZVNvbHV0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcclxuICAgICAgICAgICAgICAgICAgICAudGFrZSgxKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgICAgICAgICAgICAgaWYgKE9tbmlbXCJfa2lja19pbl90aGVfcGFudHNfXCJdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRpbmdPYnNlcnZhYmxlID0gT2JzZXJ2YWJsZS5vZihudWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gT25seSBhY3RpdmF0ZSBmZWF0dXJlcyBvbmNlIHdlIGhhdmUgYSBzb2x1dGlvbiFcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc3RhcnRpbmdPYnNlcnZhYmxlXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gdGhpcy5sb2FkRmVhdHVyZXModGhpcy5nZXRGZWF0dXJlcyhcImZlYXR1cmVzXCIpKSlcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKChlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0QXV0b1RvZ2dsZUdyYW1tYXIoZWRpdG9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmF0ZWQubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlZC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEZlYXR1cmVzKGZvbGRlcjogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3Qgd2hpdGVMaXN0ID0gYXRvbS5jb25maWcuZ2V0PGJvb2xlYW4+KFwib21uaXNoYXJwLWF0b206ZmVhdHVyZS13aGl0ZS1saXN0XCIpO1xyXG4gICAgICAgIGNvbnN0IGZlYXR1cmVMaXN0ID0gYXRvbS5jb25maWcuZ2V0PHN0cmluZ1tdPihcIm9tbmlzaGFycC1hdG9tOmZlYXR1cmUtbGlzdFwiKTtcclxuICAgICAgICBjb25zdCB3aGl0ZUxpc3RVbmRlZmluZWQgPSAodHlwZW9mIHdoaXRlTGlzdCA9PT0gXCJ1bmRlZmluZWRcIik7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuaW5mbyhgR2V0dGluZyBmZWF0dXJlcyBmb3IgXCIke2ZvbGRlcn1cIi4uLmApO1xyXG5cclxuICAgICAgICBjb25zdCBmZWF0dXJlRGlyID0gYCR7X19kaXJuYW1lfS8ke2ZvbGRlcn1gO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBsb2FkRmVhdHVyZShmaWxlOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVxdWlyZShgLi8ke2ZvbGRlcn0vJHtmaWxlfWApO1xyXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oYExvYWRpbmcgZmVhdHVyZSBcIiR7Zm9sZGVyfS8ke2ZpbGV9XCIuLi5gKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDsvL18udmFsdWVzKHJlc3VsdCkuZmlsdGVyKGZlYXR1cmUgPT4gIV8uaXNGdW5jdGlvbihmZWF0dXJlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnJlYWRkaXIpKGZlYXR1cmVEaXIpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKGZpbGVzID0+IGZpbGVzKVxyXG4gICAgICAgICAgICAuZmlsdGVyKGZpbGUgPT4gL1xcLmpzJC8udGVzdChmaWxlKSlcclxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZSA9PiBPYnNlcnZhYmxlLmJpbmROb2RlQ2FsbGJhY2soZnMuc3RhdCkoYCR7ZmVhdHVyZURpcn0vJHtmaWxlfWApLCAoZmlsZSwgc3RhdCkgPT4gKHsgZmlsZSwgc3RhdCB9KSlcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6LnN0YXQuaXNEaXJlY3RvcnkoKSlcclxuICAgICAgICAgICAgLm1hcCh6ID0+ICh7XHJcbiAgICAgICAgICAgICAgICBmaWxlOiBgJHtmb2xkZXJ9LyR7cGF0aC5iYXNlbmFtZSh6LmZpbGUpfWAucmVwbGFjZSgvXFwuanMkLywgXCJcIiksXHJcbiAgICAgICAgICAgICAgICBsb2FkOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmVhdHVyZSA9IGxvYWRGZWF0dXJlKHouZmlsZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZlYXR1cmVzOiB7IGtleTogc3RyaW5nLCBhY3RpdmF0ZTogKCkgPT4gKCkgPT4gdm9pZCB9W10gPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBfLmVhY2goZmVhdHVyZSwgKHZhbHVlOiBJRmVhdHVyZSwga2V5OiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfLmlzRnVuY3Rpb24odmFsdWUpICYmICFfLmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbHVlLnJlcXVpcmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maWdba2V5XSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGAke3ZhbHVlLnRpdGxlfWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB2YWx1ZS5kZXNjcmlwdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IChfLmhhcyh2YWx1ZSwgXCJkZWZhdWx0XCIpID8gdmFsdWUuZGVmYXVsdCA6IHRydWUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmZWF0dXJlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXksIGFjdGl2YXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGl2YXRlRmVhdHVyZSh3aGl0ZUxpc3RVbmRlZmluZWQsIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb208eyBrZXk6IHN0cmluZywgYWN0aXZhdGU6ICgpID0+ICgpID0+IHZvaWQgfT4oZmVhdHVyZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KSlcclxuICAgICAgICAgICAgLmZpbHRlcihsID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2hpdGVMaXN0ID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHdoaXRlTGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfLmluY2x1ZGVzKGZlYXR1cmVMaXN0LCBsLmZpbGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIV8uaW5jbHVkZXMoZmVhdHVyZUxpc3QsIGwuZmlsZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBsb2FkRmVhdHVyZXMoZmVhdHVyZXM6IE9ic2VydmFibGU8eyBmaWxlOiBzdHJpbmc7IGxvYWQ6ICgpID0+IE9ic2VydmFibGU8eyBrZXk6IHN0cmluZywgYWN0aXZhdGU6ICgpID0+ICgpID0+IHZvaWQgfT4gfT4pIHtcclxuICAgICAgICByZXR1cm4gZmVhdHVyZXNcclxuICAgICAgICAgICAgLmNvbmNhdE1hcCh6ID0+IHoubG9hZCgpKVxyXG4gICAgICAgICAgICAudG9BcnJheSgpXHJcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeCA9PiB4KVxyXG4gICAgICAgICAgICAubWFwKGYgPT4gZi5hY3RpdmF0ZSgpKVxyXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxyXG4gICAgICAgICAgICAudG9BcnJheSgpXHJcbiAgICAgICAgICAgIC5kbyh7XHJcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICg8YW55PmF0b20uY29uZmlnKS5zZXRTY2hlbWEoXCJvbW5pc2hhcnAtYXRvbVwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHRoaXMuY29uZmlnXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeCA9PiB4KVxyXG4gICAgICAgICAgICAuZG8oeCA9PiB4KCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZUZlYXR1cmUod2hpdGVMaXN0VW5kZWZpbmVkOiBib29sZWFuLCBrZXk6IHN0cmluZywgdmFsdWU6IElGZWF0dXJlKSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdDogKCkgPT4gdm9pZCA9IG51bGw7XHJcbiAgICAgICAgbGV0IGZpcnN0UnVuID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgLy8gV2hpdGVsaXN0IGlzIHVzZWQgZm9yIHVuaXQgdGVzdGluZywgd2UgZG9uXCJ0IHdhbnQgdGhlIGNvbmZpZyB0byBtYWtlIGNoYW5nZXMgaGVyZVxyXG4gICAgICAgIGlmICh3aGl0ZUxpc3RVbmRlZmluZWQgJiYgXy5oYXModGhpcy5jb25maWcsIGtleSkpIHtcclxuICAgICAgICAgICAgY29uc3QgY29uZmlnS2V5ID0gYG9tbmlzaGFycC1hdG9tLiR7a2V5fWA7XHJcbiAgICAgICAgICAgIGxldCBlbmFibGVEaXNwb3NhYmxlOiBJRGlzcG9zYWJsZSwgZGlzYWJsZURpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlnS2V5LCBlbmFibGVkID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXNhYmxlRGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzYWJsZURpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB0cnkgeyB2YWx1ZS5kaXNwb3NlKCk7IH0gY2F0Y2ggKGV4KSB7IC8qICovIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgYG9tbmlzaGFycC1mZWF0dXJlOmVuYWJsZS0ke18ua2ViYWJDYXNlKGtleSl9YCwgKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZ0tleSwgdHJ1ZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZW5hYmxlRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmFibGVEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc2FibGVEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEFjdGl2YXRpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUuYWN0aXZhdGUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbih2YWx1ZVtcImF0dGFjaFwiXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0UnVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbXCJhdHRhY2hcIl0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlID0gYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWZlYXR1cmU6ZGlzYWJsZS0ke18ua2ViYWJDYXNlKGtleSl9YCwgKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZ0tleSwgZmFsc2UpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc2FibGVEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGZpcnN0UnVuID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcblxyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgYG9tbmlzaGFycC1mZWF0dXJlOnRvZ2dsZS0ke18ua2ViYWJDYXNlKGtleSl9YCwgKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZ0tleSwgIWF0b20uY29uZmlnLmdldChjb25maWdLZXkpKSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhbHVlLmFjdGl2YXRlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlW1wiYXR0YWNoXCJdKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHsgdHJ5IHsgdmFsdWUuZGlzcG9zZSgpOyB9IGNhdGNoIChleCkgeyAvKiAqLyB9IH0pKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZGV0ZWN0QXV0b1RvZ2dsZUdyYW1tYXIoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcclxuICAgICAgICBjb25zdCBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcclxuICAgICAgICB0aGlzLmRldGVjdEdyYW1tYXIoZWRpdG9yLCBncmFtbWFyKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZENoYW5nZUdyYW1tYXIoKGdtcjogRmlyc3RNYXRlLkdyYW1tYXIpID0+IHRoaXMuZGV0ZWN0R3JhbW1hcihlZGl0b3IsIGdtcikpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRldGVjdEdyYW1tYXIoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGdyYW1tYXI6IEZpcnN0TWF0ZS5HcmFtbWFyKSB7XHJcbiAgICAgICAgaWYgKCFhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5hdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlXCIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjsgLy9zaG9ydCBvdXQsIGlmIHNldHRpbmcgdG8gbm90IGF1dG8gc3RhcnQgaXMgZW5hYmxlZFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKE9tbmkuaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcikpIHtcclxuICAgICAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKGdyYW1tYXIubmFtZSA9PT0gXCJKU09OXCIpIHtcclxuICAgICAgICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZWRpdG9yLmdldFBhdGgoKSkgPT09IFwicHJvamVjdC5qc29uXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChPbW5pLmlzT2ZmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9nZ2xlKCkge1xyXG4gICAgICAgIGlmIChPbW5pLmlzT2ZmKSB7XHJcbiAgICAgICAgICAgIE9tbmkuY29ubmVjdCgpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoT21uaS5pc09uKSB7XHJcbiAgICAgICAgICAgIE9tbmkuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGVhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25zdW1lU3RhdHVzQmFyKHN0YXR1c0JhcjogYW55KSB7XHJcbiAgICAgICAgbGV0IGYgPSByZXF1aXJlKFwiLi9hdG9tL3N0YXR1cy1iYXJcIik7XHJcbiAgICAgICAgZi5zdGF0dXNCYXIuc2V0dXAoc3RhdHVzQmFyKTtcclxuICAgICAgICBmID0gcmVxdWlyZShcIi4vYXRvbS9mcmFtZXdvcmstc2VsZWN0b3JcIik7XHJcbiAgICAgICAgZi5mcmFtZXdvcmtTZWxlY3Rvci5zZXR1cChzdGF0dXNCYXIpO1xyXG4gICAgICAgIGYgPSByZXF1aXJlKFwiLi9hdG9tL2ZlYXR1cmUtYnV0dG9uc1wiKTtcclxuICAgICAgICBmLmZlYXR1cmVFZGl0b3JCdXR0b25zLnNldHVwKHN0YXR1c0Jhcik7XHJcbiAgICB9XHJcblxyXG4gICAgLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG4gICAgcHVibGljIGNvbnN1bWVZZW9tYW5FbnZpcm9ubWVudChnZW5lcmF0b3JTZXJ2aWNlOiBhbnkpIHtcclxuICAgICAgICBjb25zdCB7Z2VuZXJhdG9yQXNwbmV0fSA9IHJlcXVpcmUoXCIuL2F0b20vZ2VuZXJhdG9yLWFzcG5ldFwiKTtcclxuICAgICAgICBnZW5lcmF0b3JBc3BuZXQuc2V0dXAoZ2VuZXJhdG9yU2VydmljZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByb3ZpZGVBdXRvY29tcGxldGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoXCIuL3NlcnZpY2VzL2NvbXBsZXRpb24tcHJvdmlkZXJcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByb3ZpZGVMaW50ZXIoKTogYW55W10ge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAvL2NvbnN0IExpbnRlclByb3ZpZGVyID0gcmVxdWlyZShcIi4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyXCIpO1xyXG4gICAgICAgIC8vcmV0dXJuIExpbnRlclByb3ZpZGVyLnByb3ZpZGVyO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcm92aWRlUHJvamVjdEpzb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoXCIuL3NlcnZpY2VzL3Byb2plY3QtcHJvdmlkZXJcIikuY29uY2F0KHJlcXVpcmUoXCIuL3NlcnZpY2VzL2ZyYW1ld29yay1wcm92aWRlclwiKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbnN1bWVMaW50ZXIobGludGVyOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBMaW50ZXJQcm92aWRlciA9IHJlcXVpcmUoXCIuL3NlcnZpY2VzL2xpbnRlci1wcm92aWRlclwiKTtcclxuICAgICAgICBjb25zdCBsaW50ZXJzID0gTGludGVyUHJvdmlkZXIucHJvdmlkZXI7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBfLmVhY2gobGludGVycywgbCA9PiB7XHJcbiAgICAgICAgICAgICAgICBsaW50ZXIuZGVsZXRlTGludGVyKGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoTGludGVyUHJvdmlkZXIuaW5pdChsaW50ZXIpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uc3VtZUluZGllTGludGVyKGxpbnRlcjogYW55KSB7XHJcbiAgICAgICAgcmVxdWlyZShcIi4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyXCIpLnJlZ2lzdGVySW5kaWUobGludGVyLCB0aGlzLmRpc3Bvc2FibGUpO1xyXG4gICAgfVxyXG4gICAgLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcblxyXG4gICAgcHJpdmF0ZSBjb25maWd1cmVLZXliaW5kaW5ncygpIHtcclxuICAgICAgICBsZXQgZGlzcG9zYWJsZTogRXZlbnRLaXQuRGlzcG9zYWJsZTtcclxuICAgICAgICBjb25zdCBvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcgPSBPbW5pLnBhY2thZ2VEaXIgKyBcIi9vbW5pc2hhcnAtYXRvbS9rZXltYXBzL29tbmlzaGFycC1maWxlLW5ldy5jc29uXCI7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20uZW5hYmxlQWR2YW5jZWRGaWxlTmV3XCIsIChlbmFibGVkOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlID0gYXRvbS5rZXltYXBzLmxvYWRLZXltYXAob21uaXNoYXJwQWR2YW5jZWRGaWxlTmV3KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChkaXNwb3NhYmxlKSBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIGF0b20ua2V5bWFwcy5yZW1vdmVCaW5kaW5nc0Zyb21Tb3VyY2Uob21uaXNoYXJwQWR2YW5jZWRGaWxlTmV3KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uZmlnID0ge1xyXG4gICAgICAgIGF1dG9TdGFydE9uQ29tcGF0aWJsZUZpbGU6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQXV0b3N0YXJ0IE9tbmlzaGFycCBSb3NseW5cIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQXV0b21hdGljYWxseSBzdGFydHMgT21uaXNoYXJwIFJvc2x5biB3aGVuIGEgY29tcGF0aWJsZSBmaWxlIGlzIG9wZW5lZC5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRldmVsb3Blck1vZGU6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiRGV2ZWxvcGVyIE1vZGVcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiT3V0cHV0cyBkZXRhaWxlZCBzZXJ2ZXIgY2FsbHMgaW4gY29uc29sZS5sb2dcIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnM6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyBEaWFnbm9zdGljcyBmb3IgYWxsIFNvbHV0aW9uc1wiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBZHZhbmNlZDogVGhpcyB3aWxsIHNob3cgZGlhZ25vc3RpY3MgZm9yIGFsbCBvcGVuIHNvbHV0aW9ucy4gIE5PVEU6IE1heSB0YWtlIGEgcmVzdGFydCBvciBjaGFuZ2UgdG8gZWFjaCBzZXJ2ZXIgdG8gdGFrZSBlZmZlY3Qgd2hlbiB0dXJuZWQgb24uXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW5hYmxlQWR2YW5jZWRGaWxlTmV3OiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkVuYWJsZSBgQWR2YW5jZWQgRmlsZSBOZXdgXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkVuYWJsZSBgQWR2YW5jZWQgRmlsZSBOZXdgIHdoZW4gZG9pbmcgY3RybC1uL2NtZC1uIHdpdGhpbiBhIEMjIGVkaXRvci5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICB1c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9uczoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJVc2UgTGVmdC1MYWJlbCBjb2x1bW4gaW4gU3VnZ2VzdGlvbnNcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2hvd3MgcmV0dXJuIHR5cGVzIGluIGEgcmlnaHQtYWxpZ25lZCBjb2x1bW4gdG8gdGhlIGxlZnQgb2YgdGhlIGNvbXBsZXRpb24gc3VnZ2VzdGlvbiB0ZXh0LlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVzZUljb25zOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlVzZSB1bmlxdWUgaWNvbnMgZm9yIGtpbmQgaW5kaWNhdG9ycyBpbiBTdWdnZXN0aW9uc1wiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTaG93cyBraW5kcyB3aXRoIHVuaXF1ZSBpY29ucyByYXRoZXIgdGhhbiBhdXRvY29tcGxldGUgZGVmYXVsdCBzdHlsZXMuXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvQWRqdXN0VHJlZVZpZXc6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQWRqdXN0IHRoZSB0cmVlIHZpZXcgdG8gbWF0Y2ggdGhlIHNvbHV0aW9uIHJvb3QuXCIsXHJcbiAgICAgICAgICAgIGRlc2NycHRpb246IFwiVGhpcyB3aWxsIGF1dG9tYXRpY2FsbHkgYWRqdXN0IHRoZSB0cmVldmlldyB0byBiZSB0aGUgcm9vdCBvZiB0aGUgc29sdXRpb24uXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbmFnQWRqdXN0VHJlZVZpZXc6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyB0aGUgbm90aWZpY2F0aW9ucyB0byBBZGp1c3QgdGhlIHRyZWUgdmlld1wiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b0FkZEV4dGVybmFsUHJvamVjdHM6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQWRkIGV4dGVybmFsIHByb2plY3RzIHRvIHRoZSB0cmVlIHZpZXcuXCIsXHJcbiAgICAgICAgICAgIGRlc2NycHRpb246IFwiVGhpcyB3aWxsIGF1dG9tYXRpY2FsbHkgYWRkIGV4dGVybmFsIHNvdXJjZXMgdG8gdGhlIHRyZWUgdmlldy5cXG4gRXh0ZXJuYWwgc291cmNlcyBhcmUgYW55IHByb2plY3RzIHRoYXQgYXJlIGxvYWRlZCBvdXRzaWRlIG9mIHRoZSBzb2x1dGlvbiByb290LlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIG5hZ0FkZEV4dGVybmFsUHJvamVjdHM6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyB0aGUgbm90aWZpY2F0aW9ucyB0byBhZGQgb3IgcmVtb3ZlIGV4dGVybmFsIHByb2plY3RzXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBoaWRlTGludGVySW50ZXJmYWNlOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkhpZGUgdGhlIGxpbnRlciBpbnRlcmZhY2Ugd2hlbiB1c2luZyBvbW5pc2hhcnAtYXRvbSBlZGl0b3JzXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICB3YW50TWV0YWRhdGE6IHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiUmVxdWVzdCBtZXRhZGF0YSBkZWZpbml0aW9uIHdpdGggR290byBEZWZpbml0aW9uXCIsXHJcbiAgICAgICAgICAgIGRlc2NycHRpb246IFwiUmVxdWVzdCBzeW1ib2wgbWV0YWRhdGEgZnJvbSB0aGUgc2VydmVyLCB3aGVuIHVzaW5nIGdvLXRvLWRlZmluaXRpb24uICBUaGlzIGlzIGRpc2FibGVkIGJ5IGRlZmF1bHQgb24gTGludXgsIGR1ZSB0byBpc3N1ZXMgd2l0aCBSb3NseW4gb24gTW9uby5cIixcclxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHdpbjMyXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhbHRHb3RvRGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJBbHQgR28gVG8gRGVmaW5pdGlvblwiLFxyXG4gICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlVzZSB0aGUgYWx0IGtleSBpbnN0ZWFkIG9mIHRoZSBjdHJsL2NtZCBrZXkgZm9yIGdvdG8gZGVmaW50aW9uIG1vdXNlIG92ZXIuXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2hvd0hpZGRlbkRpYWdub3N0aWNzOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgJ0hpZGRlbicgZGlhZ25vc3RpY3MgaW4gdGhlIGxpbnRlclwiLFxyXG4gICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlNob3cgb3IgaGlkZSBoaWRkZW4gZGlhZ25vc3RpY3MgaW4gdGhlIGxpbnRlciwgdGhpcyBkb2VzIG5vdCBhZmZlY3QgZ3JleWluZyBvdXQgb2YgbmFtZXNwYWNlcyB0aGF0IGFyZSB1bnVzZWQuXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgT21uaVNoYXJwQXRvbTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
