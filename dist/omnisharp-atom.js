'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _lodash = require('lodash');

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _rxjs = require('rxjs');

var _tsDisposables = require('ts-disposables');

var _omni = require('./server/omni');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var win32 = process.platform === 'win32';

var OmniSharpAtom = function () {
    function OmniSharpAtom() {
        _classCallCheck(this, OmniSharpAtom);

        this.config = {
            autoStartOnCompatibleFile: {
                title: 'Autostart Omnisharp Roslyn',
                description: 'Automatically starts Omnisharp Roslyn when a compatible file is opened.',
                type: 'boolean',
                default: true
            },
            developerMode: {
                title: 'Developer Mode',
                description: 'Outputs detailed server calls in console.log',
                type: 'boolean',
                default: false
            },
            showDiagnosticsForAllSolutions: {
                title: 'Show Diagnostics for all Solutions',
                description: 'Advanced: This will show diagnostics for all open solutions.  NOTE: May take a restart or change to each server to take effect when turned on.',
                type: 'boolean',
                default: false
            },
            enableAdvancedFileNew: {
                title: 'Enable `Advanced File New`',
                description: 'Enable `Advanced File New` when doing ctrl-n/cmd-n within a C# editor.',
                type: 'boolean',
                default: false
            },
            useLeftLabelColumnForSuggestions: {
                title: 'Use Left-Label column in Suggestions',
                description: 'Shows return types in a right-aligned column to the left of the completion suggestion text.',
                type: 'boolean',
                default: false
            },
            useIcons: {
                title: 'Use unique icons for kind indicators in Suggestions',
                description: 'Shows kinds with unique icons rather than autocomplete default styles.',
                type: 'boolean',
                default: true
            },
            autoAdjustTreeView: {
                title: 'Adjust the tree view to match the solution root.',
                descrption: 'This will automatically adjust the treeview to be the root of the solution.',
                type: 'boolean',
                default: false
            },
            nagAdjustTreeView: {
                title: 'Show the notifications to Adjust the tree view',
                type: 'boolean',
                default: true
            },
            autoAddExternalProjects: {
                title: 'Add external projects to the tree view.',
                descrption: 'This will automatically add external sources to the tree view.\n External sources are any projects that are loaded outside of the solution root.',
                type: 'boolean',
                default: false
            },
            nagAddExternalProjects: {
                title: 'Show the notifications to add or remove external projects',
                type: 'boolean',
                default: true
            },
            hideLinterInterface: {
                title: 'Hide the linter interface when using omnisharp-atom editors',
                type: 'boolean',
                default: true
            },
            wantMetadata: {
                title: 'Request metadata definition with Goto Definition',
                descrption: 'Request symbol metadata from the server, when using go-to-definition.  This is disabled by default on Linux, due to issues with Roslyn on Mono.',
                type: 'boolean',
                default: win32
            },
            altGotoDefinition: {
                title: 'Alt Go To Definition',
                descrption: 'Use the alt key instead of the ctrl/cmd key for goto defintion mouse over.',
                type: 'boolean',
                default: false
            },
            showHiddenDiagnostics: {
                title: 'Show \'Hidden\' diagnostics in the linter',
                descrption: 'Show or hide hidden diagnostics in the linter, this does not affect greying out of namespaces that are unused.',
                type: 'boolean',
                default: true
            }
        };
    }

    _createClass(OmniSharpAtom, [{
        key: 'activate',
        value: function activate(state) {
            var _this = this;

            this.disposable = new _tsDisposables.CompositeDisposable();
            this._started = new _rxjs.AsyncSubject();
            this._activated = new _rxjs.AsyncSubject();
            this.configureKeybindings();
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:toggle', function () {
                return _this.toggle();
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:fix-usings', function () {
                return _omni.Omni.request(function (solution) {
                    return solution.fixusings({});
                });
            }));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:settings', function () {
                return atom.workspace.open('atom://config/packages').then(function (tab) {
                    if (tab && tab.getURI && tab.getURI() !== 'atom://config/packages/omnisharp-atom') {
                        atom.workspace.open('atom://config/packages/omnisharp-atom');
                    }
                });
            }));
            var grammars = atom.grammars;
            var grammarCb = function grammarCb(grammar) {
                if ((0, _lodash.find)(_omni.Omni.grammars, function (gmr) {
                    return gmr.scopeName === grammar.scopeName;
                })) {
                    atom.grammars.startIdForScope(grammar.scopeName);
                    var omnisharpScopeName = grammar.scopeName + '.omnisharp';
                    var scopeId = grammars.idsByScope[grammar.scopeName];
                    grammars.idsByScope[omnisharpScopeName] = scopeId;
                    grammars.scopesById[scopeId] = omnisharpScopeName;
                    grammar.scopeName = omnisharpScopeName;
                }
            };
            (0, _lodash.each)(grammars.grammars, grammarCb);
            this.disposable.add(atom.grammars.onDidAddGrammar(grammarCb));
            require('atom-package-deps').install('omnisharp-atom').then(function () {
                console.info('Activating omnisharp-atom solution tracking...');
                _omni.Omni.activate();
                _this.disposable.add(_omni.Omni);
                _this._started.next(true);
                _this._started.complete();
            }).then(function () {
                return _this.loadFeatures(_this.getFeatures('atom').delay(_omni.Omni['_kick_in_the_pants_'] ? 0 : 2000)).toPromise();
            }).then(function () {
                var startingObservable = _omni.Omni.activeSolution.filter(function (z) {
                    return !!z;
                }).take(1);
                if (_omni.Omni['_kick_in_the_pants_']) {
                    startingObservable = _rxjs.Observable.of(null);
                }
                _this.disposable.add(startingObservable.flatMap(function () {
                    return _this.loadFeatures(_this.getFeatures('features'));
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
        key: 'getFeatures',
        value: function getFeatures(folder) {
            var _this2 = this;

            var whiteList = atom.config.get('omnisharp-atom:feature-white-list');
            var featureList = atom.config.get('omnisharp-atom:feature-list');
            var whiteListUndefined = whiteList === undefined;
            console.info('Getting features for "' + folder + '"...');
            var featureDir = path.resolve(__dirname, folder);
            function loadFeature(file) {
                var result = require('./' + folder + '/' + file);
                console.info('Loading feature "' + folder + '/' + file + '"...');
                return result;
            }
            return _rxjs.Observable.bindNodeCallback(fs.readdir)(featureDir).flatMap(function (files) {
                return files;
            }).filter(function (file) {
                return (/\.js$/.test(file)
                );
            }).flatMap(function (file) {
                return _rxjs.Observable.bindNodeCallback(fs.stat)(featureDir + '/' + file);
            }, function (file, stat) {
                return { file: file, stat: stat };
            }).filter(function (z) {
                return !z.stat.isDirectory();
            }).map(function (z) {
                return {
                    file: (folder + '/' + path.basename(z.file)).replace(/\.js$/, ''),
                    load: function load() {
                        var feature = loadFeature(z.file);
                        var features = [];
                        (0, _lodash.each)(feature, function (value, key) {
                            if (!(0, _lodash.isFunction)(value) && !(0, _lodash.isArray)(value)) {
                                if (!value.required) {
                                    _this2.config[key] = {
                                        title: '' + value.title,
                                        description: value.description,
                                        type: 'boolean',
                                        default: (0, _lodash.has)(value, 'default') ? value.default : true
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
                if (whiteList === undefined) {
                    return true;
                }
                if (whiteList) {
                    return (0, _lodash.includes)(featureList, l.file);
                } else {
                    return !(0, _lodash.includes)(featureList, l.file);
                }
            });
        }
    }, {
        key: 'loadFeatures',
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
                    atom.config.setSchema('omnisharp-atom', {
                        type: 'object',
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
        key: 'activateFeature',
        value: function activateFeature(whiteListUndefined, key, value) {
            var _this4 = this;

            var result = null;
            var firstRun = true;
            if (whiteListUndefined && (0, _lodash.has)(this.config, key)) {
                (function () {
                    var configKey = 'omnisharp-atom.' + key;
                    var enableDisposable = void 0;
                    var disableDisposable = void 0;
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
                            enableDisposable = atom.commands.add('atom-workspace', 'omnisharp-feature:enable-' + (0, _lodash.kebabCase)(key), function () {
                                return atom.config.set(configKey, true);
                            });
                            _this4.disposable.add(enableDisposable);
                        } else {
                            if (enableDisposable) {
                                enableDisposable.dispose();
                                _this4.disposable.remove(disableDisposable);
                                enableDisposable = null;
                            }
                            console.info('Activating feature "' + key + '"...');
                            value.activate();
                            if ((0, _lodash.isFunction)(value['attach'])) {
                                if (firstRun) {
                                    result = function result() {
                                        console.info('Attaching feature "' + key + '"...');
                                        value['attach']();
                                    };
                                } else {
                                    console.info('Attaching feature "' + key + '"...');
                                    value['attach']();
                                }
                            }
                            disableDisposable = atom.commands.add('atom-workspace', 'omnisharp-feature:disable-' + (0, _lodash.kebabCase)(key), function () {
                                return atom.config.set(configKey, false);
                            });
                            _this4.disposable.add(disableDisposable);
                        }
                        firstRun = false;
                    }));
                    _this4.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-feature:toggle-' + (0, _lodash.kebabCase)(key), function () {
                        return atom.config.set(configKey, !atom.config.get(configKey));
                    }));
                })();
            } else {
                value.activate();
                if ((0, _lodash.isFunction)(value['attach'])) {
                    result = function result() {
                        console.info('Attaching feature "' + key + '"...');
                        value['attach']();
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
        key: 'detectAutoToggleGrammar',
        value: function detectAutoToggleGrammar(editor) {
            var _this5 = this;

            var grammar = editor.getGrammar();
            this.detectGrammar(editor, grammar);
            this.disposable.add(editor.onDidChangeGrammar(function (gmr) {
                return _this5.detectGrammar(editor, gmr);
            }));
        }
    }, {
        key: 'detectGrammar',
        value: function detectGrammar(editor, grammar) {
            if (!atom.config.get('omnisharp-atom.autoStartOnCompatibleFile')) {
                return;
            }
            if (_omni.Omni.isValidGrammar(grammar)) {
                if (_omni.Omni.isOff) {
                    this.toggle();
                }
            } else if (grammar.name === 'JSON') {
                if (path.basename(editor.getPath()) === 'project.json') {
                    if (_omni.Omni.isOff) {
                        this.toggle();
                    }
                }
            }
        }
    }, {
        key: 'toggle',
        value: function toggle() {
            if (_omni.Omni.isOff) {
                _omni.Omni.connect();
            } else if (_omni.Omni.isOn) {
                _omni.Omni.disconnect();
            }
        }
    }, {
        key: 'deactivate',
        value: function deactivate() {
            this.disposable.dispose();
        }
    }, {
        key: 'consumeStatusBar',
        value: function consumeStatusBar(statusBar) {
            var f = require('./atom/status-bar');
            f.statusBar.setup(statusBar);
            f = require('./atom/framework-selector');
            f.frameworkSelector.setup(statusBar);
            f = require('./atom/feature-buttons');
            f.featureEditorButtons.setup(statusBar);
        }
    }, {
        key: 'consumeYeomanEnvironment',
        value: function consumeYeomanEnvironment(generatorService) {
            var _require = require('./atom/generator-aspnet'),
                generatorAspnet = _require.generatorAspnet;

            generatorAspnet.setup(generatorService);
        }
    }, {
        key: 'provideAutocomplete',
        value: function provideAutocomplete() {
            return require('./services/completion-provider');
        }
    }, {
        key: 'provideLinter',
        value: function provideLinter() {
            return [];
        }
    }, {
        key: 'provideProjectJson',
        value: function provideProjectJson() {
            return require('./services/project-provider').concat(require('./services/framework-provider'));
        }
    }, {
        key: 'consumeLinter',
        value: function consumeLinter(linter) {
            var LinterProvider = require('./services/linter-provider');
            var linters = LinterProvider.provider;
            this.disposable.add(_tsDisposables.Disposable.create(function () {
                (0, _lodash.each)(linters, function (l) {
                    linter.deleteLinter(l);
                });
            }));
            this.disposable.add(LinterProvider.init(linter));
        }
    }, {
        key: 'consumeIndieLinter',
        value: function consumeIndieLinter(linter) {
            require('./services/linter-provider').registerIndie(linter, this.disposable);
        }
    }, {
        key: 'configureKeybindings',
        value: function configureKeybindings() {
            var disposable = void 0;
            var omnisharpAdvancedFileNew = _omni.Omni.packageDir + '/omnisharp-atom/keymaps/omnisharp-file-new.cson';
            this.disposable.add(atom.config.observe('omnisharp-atom.enableAdvancedFileNew', function (enabled) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9vbW5pc2hhcnAtYXRvbS50cyJdLCJuYW1lcyI6WyJmcyIsInBhdGgiLCJ3aW4zMiIsInByb2Nlc3MiLCJwbGF0Zm9ybSIsIk9tbmlTaGFycEF0b20iLCJjb25maWciLCJhdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsInR5cGUiLCJkZWZhdWx0IiwiZGV2ZWxvcGVyTW9kZSIsInNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucyIsImVuYWJsZUFkdmFuY2VkRmlsZU5ldyIsInVzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zIiwidXNlSWNvbnMiLCJhdXRvQWRqdXN0VHJlZVZpZXciLCJkZXNjcnB0aW9uIiwibmFnQWRqdXN0VHJlZVZpZXciLCJhdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyIsIm5hZ0FkZEV4dGVybmFsUHJvamVjdHMiLCJoaWRlTGludGVySW50ZXJmYWNlIiwid2FudE1ldGFkYXRhIiwiYWx0R290b0RlZmluaXRpb24iLCJzaG93SGlkZGVuRGlhZ25vc3RpY3MiLCJzdGF0ZSIsImRpc3Bvc2FibGUiLCJfc3RhcnRlZCIsIl9hY3RpdmF0ZWQiLCJjb25maWd1cmVLZXliaW5kaW5ncyIsImFkZCIsImF0b20iLCJjb21tYW5kcyIsInRvZ2dsZSIsInJlcXVlc3QiLCJzb2x1dGlvbiIsImZpeHVzaW5ncyIsIndvcmtzcGFjZSIsIm9wZW4iLCJ0aGVuIiwidGFiIiwiZ2V0VVJJIiwiZ3JhbW1hcnMiLCJncmFtbWFyQ2IiLCJncmFtbWFyIiwiZ21yIiwic2NvcGVOYW1lIiwic3RhcnRJZEZvclNjb3BlIiwib21uaXNoYXJwU2NvcGVOYW1lIiwic2NvcGVJZCIsImlkc0J5U2NvcGUiLCJzY29wZXNCeUlkIiwib25EaWRBZGRHcmFtbWFyIiwicmVxdWlyZSIsImluc3RhbGwiLCJjb25zb2xlIiwiaW5mbyIsImFjdGl2YXRlIiwibmV4dCIsImNvbXBsZXRlIiwibG9hZEZlYXR1cmVzIiwiZ2V0RmVhdHVyZXMiLCJkZWxheSIsInRvUHJvbWlzZSIsInN0YXJ0aW5nT2JzZXJ2YWJsZSIsImFjdGl2ZVNvbHV0aW9uIiwiZmlsdGVyIiwieiIsInRha2UiLCJvZiIsImZsYXRNYXAiLCJzdWJzY3JpYmUiLCJvYnNlcnZlVGV4dEVkaXRvcnMiLCJlZGl0b3IiLCJkZXRlY3RBdXRvVG9nZ2xlR3JhbW1hciIsImZvbGRlciIsIndoaXRlTGlzdCIsImdldCIsImZlYXR1cmVMaXN0Iiwid2hpdGVMaXN0VW5kZWZpbmVkIiwidW5kZWZpbmVkIiwiZmVhdHVyZURpciIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJsb2FkRmVhdHVyZSIsImZpbGUiLCJyZXN1bHQiLCJiaW5kTm9kZUNhbGxiYWNrIiwicmVhZGRpciIsImZpbGVzIiwidGVzdCIsInN0YXQiLCJpc0RpcmVjdG9yeSIsIm1hcCIsImJhc2VuYW1lIiwicmVwbGFjZSIsImxvYWQiLCJmZWF0dXJlIiwiZmVhdHVyZXMiLCJ2YWx1ZSIsImtleSIsInJlcXVpcmVkIiwicHVzaCIsImFjdGl2YXRlRmVhdHVyZSIsImZyb20iLCJsIiwiY29uY2F0TWFwIiwidG9BcnJheSIsIngiLCJmIiwiZG8iLCJzZXRTY2hlbWEiLCJwcm9wZXJ0aWVzIiwiZmlyc3RSdW4iLCJjb25maWdLZXkiLCJlbmFibGVEaXNwb3NhYmxlIiwiZGlzYWJsZURpc3Bvc2FibGUiLCJvYnNlcnZlIiwiZW5hYmxlZCIsImRpc3Bvc2UiLCJyZW1vdmUiLCJleCIsInNldCIsImNyZWF0ZSIsImdldEdyYW1tYXIiLCJkZXRlY3RHcmFtbWFyIiwib25EaWRDaGFuZ2VHcmFtbWFyIiwiaXNWYWxpZEdyYW1tYXIiLCJpc09mZiIsIm5hbWUiLCJnZXRQYXRoIiwiY29ubmVjdCIsImlzT24iLCJkaXNjb25uZWN0Iiwic3RhdHVzQmFyIiwic2V0dXAiLCJmcmFtZXdvcmtTZWxlY3RvciIsImZlYXR1cmVFZGl0b3JCdXR0b25zIiwiZ2VuZXJhdG9yU2VydmljZSIsImdlbmVyYXRvckFzcG5ldCIsImNvbmNhdCIsImxpbnRlciIsIkxpbnRlclByb3ZpZGVyIiwibGludGVycyIsInByb3ZpZGVyIiwiZGVsZXRlTGludGVyIiwiaW5pdCIsInJlZ2lzdGVySW5kaWUiLCJvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXciLCJwYWNrYWdlRGlyIiwia2V5bWFwcyIsImxvYWRLZXltYXAiLCJyZW1vdmVCaW5kaW5nc0Zyb21Tb3VyY2UiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7O0lBQVlBLEU7O0FBQ1o7O0FBQ0E7O0lBQVlDLEk7O0FBQ1o7O0FBQ0E7O0FBR0E7Ozs7OztBQUNBLElBQU1DLFFBQVFDLFFBQVFDLFFBQVIsS0FBcUIsT0FBbkM7O0lBRUFDLGE7QUFBQSw2QkFBQTtBQUFBOztBQXNVVyxhQUFBQyxNQUFBLEdBQVM7QUFDWkMsdUNBQTJCO0FBQ3ZCQyx1QkFBTyw0QkFEZ0I7QUFFdkJDLDZCQUFhLHlFQUZVO0FBR3ZCQyxzQkFBTSxTQUhpQjtBQUl2QkMseUJBQVM7QUFKYyxhQURmO0FBT1pDLDJCQUFlO0FBQ1hKLHVCQUFPLGdCQURJO0FBRVhDLDZCQUFhLDhDQUZGO0FBR1hDLHNCQUFNLFNBSEs7QUFJWEMseUJBQVM7QUFKRSxhQVBIO0FBYVpFLDRDQUFnQztBQUM1QkwsdUJBQU8sb0NBRHFCO0FBRTVCQyw2QkFBYSxnSkFGZTtBQUc1QkMsc0JBQU0sU0FIc0I7QUFJNUJDLHlCQUFTO0FBSm1CLGFBYnBCO0FBbUJaRyxtQ0FBdUI7QUFDbkJOLHVCQUFPLDRCQURZO0FBRW5CQyw2QkFBYSx3RUFGTTtBQUduQkMsc0JBQU0sU0FIYTtBQUluQkMseUJBQVM7QUFKVSxhQW5CWDtBQXlCWkksOENBQWtDO0FBQzlCUCx1QkFBTyxzQ0FEdUI7QUFFOUJDLDZCQUFhLDZGQUZpQjtBQUc5QkMsc0JBQU0sU0FId0I7QUFJOUJDLHlCQUFTO0FBSnFCLGFBekJ0QjtBQStCWkssc0JBQVU7QUFDTlIsdUJBQU8scURBREQ7QUFFTkMsNkJBQWEsd0VBRlA7QUFHTkMsc0JBQU0sU0FIQTtBQUlO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LGFBQUM7QUFDWEYsMkJBQU9JLFlBQVAsQ0FBb0J4QyxDQUFwQjtBQUNILGlCQUZEO0FBR0gsYUFKbUIsQ0FBcEI7QUFNQSxpQkFBSy9FLFVBQUwsQ0FBZ0JJLEdBQWhCLENBQW9CZ0gsZUFBZUksSUFBZixDQUFvQkwsTUFBcEIsQ0FBcEI7QUFDSDs7OzJDQUV5QkEsTSxFQUFXO0FBQ2pDeEYsb0JBQVEsNEJBQVIsRUFBc0M4RixhQUF0QyxDQUFvRE4sTUFBcEQsRUFBNEQsS0FBS25ILFVBQWpFO0FBQ0g7OzsrQ0FHMkI7QUFDeEIsZ0JBQUlBLG1CQUFKO0FBQ0EsZ0JBQU0wSCwyQkFBMkIsV0FBS0MsVUFBTCxHQUFrQixpREFBbkQ7QUFDQSxpQkFBSzNILFVBQUwsQ0FBZ0JJLEdBQWhCLENBQW9CQyxLQUFLMUIsTUFBTCxDQUFZZ0gsT0FBWixDQUFvQixzQ0FBcEIsRUFBNEQsVUFBQ0MsT0FBRCxFQUFpQjtBQUM3RixvQkFBSUEsT0FBSixFQUFhO0FBQ1Q1RixpQ0FBYUssS0FBS3VILE9BQUwsQ0FBYUMsVUFBYixDQUF3Qkgsd0JBQXhCLENBQWI7QUFDSCxpQkFGRCxNQUVPO0FBQ0gsd0JBQUkxSCxVQUFKLEVBQWdCQSxXQUFXNkYsT0FBWDtBQUNoQnhGLHlCQUFLdUgsT0FBTCxDQUFhRSx3QkFBYixDQUFzQ0osd0JBQXRDO0FBQ0g7QUFDSixhQVBtQixDQUFwQjtBQVFIOzs7Ozs7QUF1RkxLLE9BQU9DLE9BQVAsR0FBaUIsSUFBSXRKLGFBQUosRUFBakIiLCJmaWxlIjoibGliL29tbmlzaGFycC1hdG9tLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgeyBiaW5kLCBlYWNoLCBmaW5kLCBoYXMsIGluY2x1ZGVzLCBpc0FycmF5LCBpc0Z1bmN0aW9uLCBrZWJhYkNhc2UgfSBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBBc3luY1N1YmplY3QsIE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcclxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGUgfSBmcm9tICd0cy1kaXNwb3NhYmxlcyc7XHJcblxyXG4vLyBUT0RPOiBSZW1vdmUgdGhlc2UgYXQgc29tZSBwb2ludCB0byBzdHJlYW0gbGluZSBzdGFydHVwLlxyXG5pbXBvcnQgeyBPbW5pIH0gZnJvbSAnLi9zZXJ2ZXIvb21uaSc7XHJcbmNvbnN0IHdpbjMyID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJztcclxuXHJcbmNsYXNzIE9tbmlTaGFycEF0b20ge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG4gICAgLy8gSW50ZXJuYWw6IFVzZWQgYnkgdW5pdCB0ZXN0aW5nIHRvIG1ha2Ugc3VyZSB0aGUgcGx1Z2luIGlzIGNvbXBsZXRlbHkgYWN0aXZhdGVkLlxyXG4gICAgcHJpdmF0ZSBfc3RhcnRlZDogQXN5bmNTdWJqZWN0PGJvb2xlYW4+O1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZhdGVkOiBBc3luY1N1YmplY3Q8Ym9vbGVhbj47XHJcblxyXG4gICAgcHVibGljIGFjdGl2YXRlKHN0YXRlOiBhbnkpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0ZWQgPSBuZXcgQXN5bmNTdWJqZWN0PGJvb2xlYW4+KCk7XHJcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gbmV3IEFzeW5jU3ViamVjdDxib29sZWFuPigpO1xyXG5cclxuICAgICAgICB0aGlzLmNvbmZpZ3VyZUtleWJpbmRpbmdzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ29tbmlzaGFycC1hdG9tOnRvZ2dsZScsICgpID0+IHRoaXMudG9nZ2xlKCkpKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdvbW5pc2hhcnAtYXRvbTpmaXgtdXNpbmdzJywgKCkgPT4gT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpeHVzaW5ncyh7fSkpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206c2V0dGluZ3MnLCAoKSA9PiBhdG9tLndvcmtzcGFjZS5vcGVuKCdhdG9tOi8vY29uZmlnL3BhY2thZ2VzJylcclxuICAgICAgICAgICAgLnRoZW4odGFiID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0YWIgJiYgdGFiLmdldFVSSSAmJiB0YWIuZ2V0VVJJKCkgIT09ICdhdG9tOi8vY29uZmlnL3BhY2thZ2VzL29tbmlzaGFycC1hdG9tJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oJ2F0b206Ly9jb25maWcvcGFja2FnZXMvb21uaXNoYXJwLWF0b20nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpKTtcclxuXHJcbiAgICAgICAgY29uc3QgZ3JhbW1hcnMgPSAoPGFueT5hdG9tLmdyYW1tYXJzKTtcclxuICAgICAgICBjb25zdCBncmFtbWFyQ2IgPSAoZ3JhbW1hcjogeyBzY29wZU5hbWU6IHN0cmluZzsgfSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZmluZChPbW5pLmdyYW1tYXJzLCAoZ21yOiBhbnkpID0+IGdtci5zY29wZU5hbWUgPT09IGdyYW1tYXIuc2NvcGVOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gZW5zdXJlIHRoZSBzY29wZSBoYXMgYmVlbiBpbml0ZWRcclxuICAgICAgICAgICAgICAgIGF0b20uZ3JhbW1hcnMuc3RhcnRJZEZvclNjb3BlKGdyYW1tYXIuc2NvcGVOYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBvbW5pc2hhcnBTY29wZU5hbWUgPSBgJHtncmFtbWFyLnNjb3BlTmFtZX0ub21uaXNoYXJwYDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjb3BlSWQgPSBncmFtbWFycy5pZHNCeVNjb3BlW2dyYW1tYXIuc2NvcGVOYW1lXTtcclxuICAgICAgICAgICAgICAgIGdyYW1tYXJzLmlkc0J5U2NvcGVbb21uaXNoYXJwU2NvcGVOYW1lXSA9IHNjb3BlSWQ7XHJcbiAgICAgICAgICAgICAgICBncmFtbWFycy5zY29wZXNCeUlkW3Njb3BlSWRdID0gb21uaXNoYXJwU2NvcGVOYW1lO1xyXG4gICAgICAgICAgICAgICAgZ3JhbW1hci5zY29wZU5hbWUgPSBvbW5pc2hhcnBTY29wZU5hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIGVhY2goZ3JhbW1hcnMuZ3JhbW1hcnMsIGdyYW1tYXJDYik7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmdyYW1tYXJzLm9uRGlkQWRkR3JhbW1hcihncmFtbWFyQ2IpKTtcclxuXHJcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXJlcXVpcmUtaW1wb3J0c1xyXG4gICAgICAgIHJlcXVpcmUoJ2F0b20tcGFja2FnZS1kZXBzJykuaW5zdGFsbCgnb21uaXNoYXJwLWF0b20nKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ0FjdGl2YXRpbmcgb21uaXNoYXJwLWF0b20gc29sdXRpb24gdHJhY2tpbmcuLi4nKTtcclxuICAgICAgICAgICAgICAgIE9tbmkuYWN0aXZhdGUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRlZC5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRlZC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmxvYWRGZWF0dXJlcyh0aGlzLmdldEZlYXR1cmVzKCdhdG9tJykuZGVsYXkoT21uaVsnX2tpY2tfaW5fdGhlX3BhbnRzXyddID8gMCA6IDIwMDApKS50b1Byb21pc2UoKSlcclxuICAgICAgICAgICAgLyogdHNsaW50OmVuYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnRpbmdPYnNlcnZhYmxlID0gT21uaS5hY3RpdmVTb2x1dGlvblxyXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXHJcbiAgICAgICAgICAgICAgICAgICAgLnRha2UoMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgICAgICAgICAgICAgIGlmIChPbW5pWydfa2lja19pbl90aGVfcGFudHNfJ10pIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFydGluZ09ic2VydmFibGUgPSBPYnNlcnZhYmxlLm9mKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBPbmx5IGFjdGl2YXRlIGZlYXR1cmVzIG9uY2Ugd2UgaGF2ZSBhIHNvbHV0aW9uIVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzdGFydGluZ09ic2VydmFibGVcclxuICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiB0aGlzLmxvYWRGZWF0dXJlcyh0aGlzLmdldEZlYXR1cmVzKCdmZWF0dXJlcycpKSlcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKChlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0QXV0b1RvZ2dsZUdyYW1tYXIoZWRpdG9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmF0ZWQubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlZC5jb21wbGV0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEZlYXR1cmVzKGZvbGRlcjogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3Qgd2hpdGVMaXN0ID0gYXRvbS5jb25maWcuZ2V0PGJvb2xlYW4+KCdvbW5pc2hhcnAtYXRvbTpmZWF0dXJlLXdoaXRlLWxpc3QnKTtcclxuICAgICAgICBjb25zdCBmZWF0dXJlTGlzdCA9IGF0b20uY29uZmlnLmdldDxzdHJpbmdbXT4oJ29tbmlzaGFycC1hdG9tOmZlYXR1cmUtbGlzdCcpO1xyXG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdFVuZGVmaW5lZCA9IHdoaXRlTGlzdCA9PT0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICBjb25zb2xlLmluZm8oYEdldHRpbmcgZmVhdHVyZXMgZm9yIFwiJHtmb2xkZXJ9XCIuLi5gKTtcclxuXHJcbiAgICAgICAgY29uc3QgZmVhdHVyZURpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIGZvbGRlcik7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGxvYWRGZWF0dXJlKGZpbGU6IHN0cmluZykge1xyXG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tcmVxdWlyZS1pbXBvcnRzIG5vbi1saXRlcmFsLXJlcXVpcmVcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVxdWlyZShgLi8ke2ZvbGRlcn0vJHtmaWxlfWApO1xyXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oYExvYWRpbmcgZmVhdHVyZSBcIiR7Zm9sZGVyfS8ke2ZpbGV9XCIuLi5gKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDsgLy92YWx1ZXMocmVzdWx0KS5maWx0ZXIoZmVhdHVyZSA9PiAhaXNGdW5jdGlvbihmZWF0dXJlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnJlYWRkaXIpKGZlYXR1cmVEaXIpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKGZpbGVzID0+IGZpbGVzKVxyXG4gICAgICAgICAgICAuZmlsdGVyKGZpbGUgPT4gL1xcLmpzJC8udGVzdChmaWxlKSlcclxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZSA9PiBPYnNlcnZhYmxlLmJpbmROb2RlQ2FsbGJhY2soZnMuc3RhdCkoYCR7ZmVhdHVyZURpcn0vJHtmaWxlfWApLCAoZmlsZSwgc3RhdCkgPT4gKHsgZmlsZSwgc3RhdCB9KSlcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6LnN0YXQuaXNEaXJlY3RvcnkoKSlcclxuICAgICAgICAgICAgLm1hcCh6ID0+ICh7XHJcbiAgICAgICAgICAgICAgICBmaWxlOiBgJHtmb2xkZXJ9LyR7cGF0aC5iYXNlbmFtZSh6LmZpbGUpfWAucmVwbGFjZSgvXFwuanMkLywgJycpLFxyXG4gICAgICAgICAgICAgICAgbG9hZDogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZlYXR1cmUgPSBsb2FkRmVhdHVyZSh6LmZpbGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmZWF0dXJlczogeyBrZXk6IHN0cmluZywgYWN0aXZhdGU6ICgpID0+ICgpID0+IHZvaWQgfVtdID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgZWFjaChmZWF0dXJlLCAodmFsdWU6IElGZWF0dXJlLCBrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRnVuY3Rpb24odmFsdWUpICYmICFpc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZS5yZXF1aXJlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnW2tleV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBgJHt2YWx1ZS50aXRsZX1gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogdmFsdWUuZGVzY3JpcHRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogKGhhcyh2YWx1ZSwgJ2RlZmF1bHQnKSA/IHZhbHVlLmRlZmF1bHQgOiB0cnVlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmVhdHVyZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5LCBhY3RpdmF0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmF0ZUZlYXR1cmUod2hpdGVMaXN0VW5kZWZpbmVkLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tPHsga2V5OiBzdHJpbmcsIGFjdGl2YXRlOiAoKSA9PiAoKSA9PiB2b2lkIH0+KGZlYXR1cmVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIobCA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAod2hpdGVMaXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAod2hpdGVMaXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluY2x1ZGVzKGZlYXR1cmVMaXN0LCBsLmZpbGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIWluY2x1ZGVzKGZlYXR1cmVMaXN0LCBsLmZpbGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbG9hZEZlYXR1cmVzKGZlYXR1cmVzOiBPYnNlcnZhYmxlPHsgZmlsZTogc3RyaW5nOyBsb2FkOiAoKSA9PiBPYnNlcnZhYmxlPHsga2V5OiBzdHJpbmcsIGFjdGl2YXRlOiAoKSA9PiAoKSA9PiB2b2lkIH0+IH0+KSB7XHJcbiAgICAgICAgcmV0dXJuIGZlYXR1cmVzXHJcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeiA9PiB6LmxvYWQoKSlcclxuICAgICAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgICAgICAuY29uY2F0TWFwKHggPT4geClcclxuICAgICAgICAgICAgLm1hcChmID0+IGYuYWN0aXZhdGUoKSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheClcclxuICAgICAgICAgICAgLnRvQXJyYXkoKVxyXG4gICAgICAgICAgICAuZG8oe1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAoPGFueT5hdG9tLmNvbmZpZykuc2V0U2NoZW1hKCdvbW5pc2hhcnAtYXRvbScsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHRoaXMuY29uZmlnXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeCA9PiB4KVxyXG4gICAgICAgICAgICAuZG8oeCA9PiB4KCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZUZlYXR1cmUod2hpdGVMaXN0VW5kZWZpbmVkOiBib29sZWFuLCBrZXk6IHN0cmluZywgdmFsdWU6IElGZWF0dXJlKSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdDogKCkgPT4gdm9pZCA9IG51bGw7XHJcbiAgICAgICAgbGV0IGZpcnN0UnVuID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgLy8gV2hpdGVsaXN0IGlzIHVzZWQgZm9yIHVuaXQgdGVzdGluZywgd2UgZG9uXCJ0IHdhbnQgdGhlIGNvbmZpZyB0byBtYWtlIGNoYW5nZXMgaGVyZVxyXG4gICAgICAgIGlmICh3aGl0ZUxpc3RVbmRlZmluZWQgJiYgaGFzKHRoaXMuY29uZmlnLCBrZXkpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZ0tleSA9IGBvbW5pc2hhcnAtYXRvbS4ke2tleX1gO1xyXG4gICAgICAgICAgICBsZXQgZW5hYmxlRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XHJcbiAgICAgICAgICAgIGxldCBkaXNhYmxlRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWdLZXksIGVuYWJsZWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpc2FibGVEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShkaXNhYmxlRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7IHZhbHVlLmRpc3Bvc2UoKTsgfSBjYXRjaCAoZXgpIHsgLyogKi8gfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlID0gYXRvbS5jb21tYW5kcy5hZGQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdhdG9tLXdvcmtzcGFjZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGBvbW5pc2hhcnAtZmVhdHVyZTplbmFibGUtJHtrZWJhYkNhc2Uoa2V5KX1gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCB0cnVlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlbmFibGVEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVuYWJsZURpc3Bvc2FibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzYWJsZURpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQWN0aXZhdGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZVsnYXR0YWNoJ10pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdFJ1bikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlWydhdHRhY2gnXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbJ2F0dGFjaCddKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlID0gYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgYG9tbmlzaGFycC1mZWF0dXJlOmRpc2FibGUtJHtrZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCBmYWxzZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzYWJsZURpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZmlyc3RSdW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgYG9tbmlzaGFycC1mZWF0dXJlOnRvZ2dsZS0ke2tlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksICFhdG9tLmNvbmZpZy5nZXQoY29uZmlnS2V5KSkpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWVbJ2F0dGFjaCddKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlWydhdHRhY2gnXSgpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7IHRyeSB7IHZhbHVlLmRpc3Bvc2UoKTsgfSBjYXRjaCAoZXgpIHsgLyogKi8gfSB9KSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XHJcbiAgICAgICAgdGhpcy5kZXRlY3RHcmFtbWFyKGVkaXRvciwgZ3JhbW1hcik7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VHcmFtbWFyKChnbXI6IEZpcnN0TWF0ZS5HcmFtbWFyKSA9PiB0aGlzLmRldGVjdEdyYW1tYXIoZWRpdG9yLCBnbXIpKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkZXRlY3RHcmFtbWFyKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBncmFtbWFyOiBGaXJzdE1hdGUuR3JhbW1hcikge1xyXG4gICAgICAgIGlmICghYXRvbS5jb25maWcuZ2V0KCdvbW5pc2hhcnAtYXRvbS5hdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuOyAvL3Nob3J0IG91dCwgaWYgc2V0dGluZyB0byBub3QgYXV0byBzdGFydCBpcyBlbmFibGVkXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoT21uaS5pc1ZhbGlkR3JhbW1hcihncmFtbWFyKSkge1xyXG4gICAgICAgICAgICBpZiAoT21uaS5pc09mZikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50b2dnbGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoZ3JhbW1hci5uYW1lID09PSAnSlNPTicpIHtcclxuICAgICAgICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZWRpdG9yLmdldFBhdGgoKSkgPT09ICdwcm9qZWN0Lmpzb24nKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoT21uaS5pc09mZikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvZ2dsZSgpIHtcclxuICAgICAgICBpZiAoT21uaS5pc09mZikge1xyXG4gICAgICAgICAgICBPbW5pLmNvbm5lY3QoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKE9tbmkuaXNPbikge1xyXG4gICAgICAgICAgICBPbW5pLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlYWN0aXZhdGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uc3VtZVN0YXR1c0JhcihzdGF0dXNCYXI6IGFueSkge1xyXG4gICAgICAgIGxldCBmID0gcmVxdWlyZSgnLi9hdG9tL3N0YXR1cy1iYXInKTtcclxuICAgICAgICBmLnN0YXR1c0Jhci5zZXR1cChzdGF0dXNCYXIpO1xyXG4gICAgICAgIGYgPSByZXF1aXJlKCcuL2F0b20vZnJhbWV3b3JrLXNlbGVjdG9yJyk7XHJcbiAgICAgICAgZi5mcmFtZXdvcmtTZWxlY3Rvci5zZXR1cChzdGF0dXNCYXIpO1xyXG4gICAgICAgIGYgPSByZXF1aXJlKCcuL2F0b20vZmVhdHVyZS1idXR0b25zJyk7XHJcbiAgICAgICAgZi5mZWF0dXJlRWRpdG9yQnV0dG9ucy5zZXR1cChzdGF0dXNCYXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuICAgIHB1YmxpYyBjb25zdW1lWWVvbWFuRW52aXJvbm1lbnQoZ2VuZXJhdG9yU2VydmljZTogYW55KSB7XHJcbiAgICAgICAgY29uc3Qge2dlbmVyYXRvckFzcG5ldH0gPSByZXF1aXJlKCcuL2F0b20vZ2VuZXJhdG9yLWFzcG5ldCcpO1xyXG4gICAgICAgIGdlbmVyYXRvckFzcG5ldC5zZXR1cChnZW5lcmF0b3JTZXJ2aWNlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJvdmlkZUF1dG9jb21wbGV0ZSgpIHtcclxuICAgICAgICByZXR1cm4gcmVxdWlyZSgnLi9zZXJ2aWNlcy9jb21wbGV0aW9uLXByb3ZpZGVyJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByb3ZpZGVMaW50ZXIoKTogYW55W10ge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAvL2NvbnN0IExpbnRlclByb3ZpZGVyID0gcmVxdWlyZShcIi4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyXCIpO1xyXG4gICAgICAgIC8vcmV0dXJuIExpbnRlclByb3ZpZGVyLnByb3ZpZGVyO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcm92aWRlUHJvamVjdEpzb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoJy4vc2VydmljZXMvcHJvamVjdC1wcm92aWRlcicpLmNvbmNhdChyZXF1aXJlKCcuL3NlcnZpY2VzL2ZyYW1ld29yay1wcm92aWRlcicpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uc3VtZUxpbnRlcihsaW50ZXI6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IExpbnRlclByb3ZpZGVyID0gcmVxdWlyZSgnLi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXInKTtcclxuICAgICAgICBjb25zdCBsaW50ZXJzID0gTGludGVyUHJvdmlkZXIucHJvdmlkZXI7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBlYWNoKGxpbnRlcnMsIGwgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGludGVyLmRlbGV0ZUxpbnRlcihsKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKExpbnRlclByb3ZpZGVyLmluaXQobGludGVyKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbnN1bWVJbmRpZUxpbnRlcihsaW50ZXI6IGFueSkge1xyXG4gICAgICAgIHJlcXVpcmUoJy4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyJykucmVnaXN0ZXJJbmRpZShsaW50ZXIsIHRoaXMuZGlzcG9zYWJsZSk7XHJcbiAgICB9XHJcbiAgICAvKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuXHJcbiAgICBwcml2YXRlIGNvbmZpZ3VyZUtleWJpbmRpbmdzKCkge1xyXG4gICAgICAgIGxldCBkaXNwb3NhYmxlOiBFdmVudEtpdC5EaXNwb3NhYmxlO1xyXG4gICAgICAgIGNvbnN0IG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyA9IE9tbmkucGFja2FnZURpciArICcvb21uaXNoYXJwLWF0b20va2V5bWFwcy9vbW5pc2hhcnAtZmlsZS1uZXcuY3Nvbic7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdvbW5pc2hhcnAtYXRvbS5lbmFibGVBZHZhbmNlZEZpbGVOZXcnLCAoZW5hYmxlZDogYm9vbGVhbikgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZSA9IGF0b20ua2V5bWFwcy5sb2FkS2V5bWFwKG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGlzcG9zYWJsZSkgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBhdG9tLmtleW1hcHMucmVtb3ZlQmluZGluZ3NGcm9tU291cmNlKG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbmZpZyA9IHtcclxuICAgICAgICBhdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnQXV0b3N0YXJ0IE9tbmlzaGFycCBSb3NseW4nLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0F1dG9tYXRpY2FsbHkgc3RhcnRzIE9tbmlzaGFycCBSb3NseW4gd2hlbiBhIGNvbXBhdGlibGUgZmlsZSBpcyBvcGVuZWQuJyxcclxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZXZlbG9wZXJNb2RlOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnRGV2ZWxvcGVyIE1vZGUnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ091dHB1dHMgZGV0YWlsZWQgc2VydmVyIGNhbGxzIGluIGNvbnNvbGUubG9nJyxcclxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnU2hvdyBEaWFnbm9zdGljcyBmb3IgYWxsIFNvbHV0aW9ucycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWR2YW5jZWQ6IFRoaXMgd2lsbCBzaG93IGRpYWdub3N0aWNzIGZvciBhbGwgb3BlbiBzb2x1dGlvbnMuICBOT1RFOiBNYXkgdGFrZSBhIHJlc3RhcnQgb3IgY2hhbmdlIHRvIGVhY2ggc2VydmVyIHRvIHRha2UgZWZmZWN0IHdoZW4gdHVybmVkIG9uLicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVuYWJsZUFkdmFuY2VkRmlsZU5ldzoge1xyXG4gICAgICAgICAgICB0aXRsZTogJ0VuYWJsZSBgQWR2YW5jZWQgRmlsZSBOZXdgJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFbmFibGUgYEFkdmFuY2VkIEZpbGUgTmV3YCB3aGVuIGRvaW5nIGN0cmwtbi9jbWQtbiB3aXRoaW4gYSBDIyBlZGl0b3IuJyxcclxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnM6IHtcclxuICAgICAgICAgICAgdGl0bGU6ICdVc2UgTGVmdC1MYWJlbCBjb2x1bW4gaW4gU3VnZ2VzdGlvbnMnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Nob3dzIHJldHVybiB0eXBlcyBpbiBhIHJpZ2h0LWFsaWduZWQgY29sdW1uIHRvIHRoZSBsZWZ0IG9mIHRoZSBjb21wbGV0aW9uIHN1Z2dlc3Rpb24gdGV4dC4nLFxyXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICB1c2VJY29uczoge1xyXG4gICAgICAgICAgICB0aXRsZTogJ1VzZSB1bmlxdWUgaWNvbnMgZm9yIGtpbmQgaW5kaWNhdG9ycyBpbiBTdWdnZXN0aW9ucycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2hvd3Mga2luZHMgd2l0aCB1bmlxdWUgaWNvbnMgcmF0aGVyIHRoYW4gYXV0b2NvbXBsZXRlIGRlZmF1bHQgc3R5bGVzLicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b0FkanVzdFRyZWVWaWV3OiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnQWRqdXN0IHRoZSB0cmVlIHZpZXcgdG8gbWF0Y2ggdGhlIHNvbHV0aW9uIHJvb3QuJyxcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogJ1RoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IGFkanVzdCB0aGUgdHJlZXZpZXcgdG8gYmUgdGhlIHJvb3Qgb2YgdGhlIHNvbHV0aW9uLicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIG5hZ0FkanVzdFRyZWVWaWV3OiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnU2hvdyB0aGUgbm90aWZpY2F0aW9ucyB0byBBZGp1c3QgdGhlIHRyZWUgdmlldycsXHJcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b0FkZEV4dGVybmFsUHJvamVjdHM6IHtcclxuICAgICAgICAgICAgdGl0bGU6ICdBZGQgZXh0ZXJuYWwgcHJvamVjdHMgdG8gdGhlIHRyZWUgdmlldy4nLFxyXG4gICAgICAgICAgICBkZXNjcnB0aW9uOiAnVGhpcyB3aWxsIGF1dG9tYXRpY2FsbHkgYWRkIGV4dGVybmFsIHNvdXJjZXMgdG8gdGhlIHRyZWUgdmlldy5cXG4gRXh0ZXJuYWwgc291cmNlcyBhcmUgYW55IHByb2plY3RzIHRoYXQgYXJlIGxvYWRlZCBvdXRzaWRlIG9mIHRoZSBzb2x1dGlvbiByb290LicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIG5hZ0FkZEV4dGVybmFsUHJvamVjdHM6IHtcclxuICAgICAgICAgICAgdGl0bGU6ICdTaG93IHRoZSBub3RpZmljYXRpb25zIHRvIGFkZCBvciByZW1vdmUgZXh0ZXJuYWwgcHJvamVjdHMnLFxyXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhpZGVMaW50ZXJJbnRlcmZhY2U6IHtcclxuICAgICAgICAgICAgdGl0bGU6ICdIaWRlIHRoZSBsaW50ZXIgaW50ZXJmYWNlIHdoZW4gdXNpbmcgb21uaXNoYXJwLWF0b20gZWRpdG9ycycsXHJcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd2FudE1ldGFkYXRhOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnUmVxdWVzdCBtZXRhZGF0YSBkZWZpbml0aW9uIHdpdGggR290byBEZWZpbml0aW9uJyxcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogJ1JlcXVlc3Qgc3ltYm9sIG1ldGFkYXRhIGZyb20gdGhlIHNlcnZlciwgd2hlbiB1c2luZyBnby10by1kZWZpbml0aW9uLiAgVGhpcyBpcyBkaXNhYmxlZCBieSBkZWZhdWx0IG9uIExpbnV4LCBkdWUgdG8gaXNzdWVzIHdpdGggUm9zbHluIG9uIE1vbm8uJyxcclxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB3aW4zMlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYWx0R290b0RlZmluaXRpb246IHtcclxuICAgICAgICAgICAgdGl0bGU6ICdBbHQgR28gVG8gRGVmaW5pdGlvbicsXHJcbiAgICAgICAgICAgIGRlc2NycHRpb246ICdVc2UgdGhlIGFsdCBrZXkgaW5zdGVhZCBvZiB0aGUgY3RybC9jbWQga2V5IGZvciBnb3RvIGRlZmludGlvbiBtb3VzZSBvdmVyLicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNob3dIaWRkZW5EaWFnbm9zdGljczoge1xyXG4gICAgICAgICAgICB0aXRsZTogJ1Nob3cgXFwnSGlkZGVuXFwnIGRpYWdub3N0aWNzIGluIHRoZSBsaW50ZXInLFxyXG4gICAgICAgICAgICBkZXNjcnB0aW9uOiAnU2hvdyBvciBoaWRlIGhpZGRlbiBkaWFnbm9zdGljcyBpbiB0aGUgbGludGVyLCB0aGlzIGRvZXMgbm90IGFmZmVjdCBncmV5aW5nIG91dCBvZiBuYW1lc3BhY2VzIHRoYXQgYXJlIHVudXNlZC4nLFxyXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBPbW5pU2hhcnBBdG9tO1xyXG4iXX0=
