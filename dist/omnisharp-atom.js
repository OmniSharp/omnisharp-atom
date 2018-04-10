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
            var grammars = atom.grammars.textmateRegistry || atom.grammars;
            var grammarCb = function grammarCb(grammar) {
                if ((0, _lodash.find)(_omni.Omni.grammars, function (gmr) {
                    return gmr.scopeName === grammar.scopeName;
                })) {
                    grammars.startIdForScope(grammar.scopeName);
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
                var configKey = 'omnisharp-atom.' + key;
                var enableDisposable = void 0;
                var disableDisposable = void 0;
                this.disposable.add(atom.config.observe(configKey, function (enabled) {
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
                this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-feature:toggle-' + (0, _lodash.kebabCase)(key), function () {
                    return atom.config.set(configKey, !atom.config.get(configKey));
                }));
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9vbW5pc2hhcnAtYXRvbS50cyJdLCJuYW1lcyI6WyJmcyIsInBhdGgiLCJ3aW4zMiIsInByb2Nlc3MiLCJwbGF0Zm9ybSIsIk9tbmlTaGFycEF0b20iLCJjb25maWciLCJhdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsInR5cGUiLCJkZWZhdWx0IiwiZGV2ZWxvcGVyTW9kZSIsInNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucyIsImVuYWJsZUFkdmFuY2VkRmlsZU5ldyIsInVzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zIiwidXNlSWNvbnMiLCJhdXRvQWRqdXN0VHJlZVZpZXciLCJkZXNjcnB0aW9uIiwibmFnQWRqdXN0VHJlZVZpZXciLCJhdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyIsIm5hZ0FkZEV4dGVybmFsUHJvamVjdHMiLCJoaWRlTGludGVySW50ZXJmYWNlIiwid2FudE1ldGFkYXRhIiwiYWx0R290b0RlZmluaXRpb24iLCJzaG93SGlkZGVuRGlhZ25vc3RpY3MiLCJzdGF0ZSIsImRpc3Bvc2FibGUiLCJfc3RhcnRlZCIsIl9hY3RpdmF0ZWQiLCJjb25maWd1cmVLZXliaW5kaW5ncyIsImFkZCIsImF0b20iLCJjb21tYW5kcyIsInRvZ2dsZSIsInJlcXVlc3QiLCJzb2x1dGlvbiIsImZpeHVzaW5ncyIsIndvcmtzcGFjZSIsIm9wZW4iLCJ0aGVuIiwidGFiIiwiZ2V0VVJJIiwiZ3JhbW1hcnMiLCJncmFtbWFyQ2IiLCJncmFtbWFyIiwiZ21yIiwic2NvcGVOYW1lIiwic3RhcnRJZEZvclNjb3BlIiwib21uaXNoYXJwU2NvcGVOYW1lIiwic2NvcGVJZCIsImlkc0J5U2NvcGUiLCJzY29wZXNCeUlkIiwib25EaWRBZGRHcmFtbWFyIiwicmVxdWlyZSIsImluc3RhbGwiLCJjb25zb2xlIiwiaW5mbyIsImFjdGl2YXRlIiwibmV4dCIsImNvbXBsZXRlIiwibG9hZEZlYXR1cmVzIiwiZ2V0RmVhdHVyZXMiLCJkZWxheSIsInRvUHJvbWlzZSIsInN0YXJ0aW5nT2JzZXJ2YWJsZSIsImFjdGl2ZVNvbHV0aW9uIiwiZmlsdGVyIiwieiIsInRha2UiLCJvZiIsImZsYXRNYXAiLCJzdWJzY3JpYmUiLCJvYnNlcnZlVGV4dEVkaXRvcnMiLCJlZGl0b3IiLCJkZXRlY3RBdXRvVG9nZ2xlR3JhbW1hciIsImZvbGRlciIsIndoaXRlTGlzdCIsImdldCIsImZlYXR1cmVMaXN0Iiwid2hpdGVMaXN0VW5kZWZpbmVkIiwidW5kZWZpbmVkIiwiZmVhdHVyZURpciIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJsb2FkRmVhdHVyZSIsImZpbGUiLCJyZXN1bHQiLCJiaW5kTm9kZUNhbGxiYWNrIiwicmVhZGRpciIsImZpbGVzIiwidGVzdCIsInN0YXQiLCJpc0RpcmVjdG9yeSIsIm1hcCIsImJhc2VuYW1lIiwicmVwbGFjZSIsImxvYWQiLCJmZWF0dXJlIiwiZmVhdHVyZXMiLCJ2YWx1ZSIsImtleSIsInJlcXVpcmVkIiwicHVzaCIsImFjdGl2YXRlRmVhdHVyZSIsImZyb20iLCJsIiwiY29uY2F0TWFwIiwidG9BcnJheSIsIngiLCJmIiwiZG8iLCJzZXRTY2hlbWEiLCJwcm9wZXJ0aWVzIiwiZmlyc3RSdW4iLCJjb25maWdLZXkiLCJlbmFibGVEaXNwb3NhYmxlIiwiZGlzYWJsZURpc3Bvc2FibGUiLCJvYnNlcnZlIiwiZW5hYmxlZCIsImRpc3Bvc2UiLCJyZW1vdmUiLCJleCIsInNldCIsImNyZWF0ZSIsImdldEdyYW1tYXIiLCJkZXRlY3RHcmFtbWFyIiwib25EaWRDaGFuZ2VHcmFtbWFyIiwiaXNWYWxpZEdyYW1tYXIiLCJpc09mZiIsIm5hbWUiLCJnZXRQYXRoIiwiY29ubmVjdCIsImlzT24iLCJkaXNjb25uZWN0Iiwic3RhdHVzQmFyIiwic2V0dXAiLCJmcmFtZXdvcmtTZWxlY3RvciIsImZlYXR1cmVFZGl0b3JCdXR0b25zIiwiZ2VuZXJhdG9yU2VydmljZSIsImdlbmVyYXRvckFzcG5ldCIsImNvbmNhdCIsImxpbnRlciIsIkxpbnRlclByb3ZpZGVyIiwibGludGVycyIsInByb3ZpZGVyIiwiZGVsZXRlTGludGVyIiwiaW5pdCIsInJlZ2lzdGVySW5kaWUiLCJvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXciLCJwYWNrYWdlRGlyIiwia2V5bWFwcyIsImxvYWRLZXltYXAiLCJyZW1vdmVCaW5kaW5nc0Zyb21Tb3VyY2UiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7O0lBQVlBLEU7O0FBQ1o7O0FBQ0E7O0lBQVlDLEk7O0FBQ1o7O0FBQ0E7O0FBR0E7Ozs7OztBQUNBLElBQU1DLFFBQVFDLFFBQVFDLFFBQVIsS0FBcUIsT0FBbkM7O0lBRUFDLGE7QUFBQSw2QkFBQTtBQUFBOztBQXNVVyxhQUFBQyxNQUFBLEdBQVM7QUFDWkMsdUNBQTJCO0FBQ3ZCQyx1QkFBTyw0QkFEZ0I7QUFFdkJDLDZCQUFhLHlFQUZVO0FBR3ZCQyxzQkFBTSxTQUhpQjtBQUl2QkMseUJBQVM7QUFKYyxhQURmO0FBT1pDLDJCQUFlO0FBQ1hKLHVCQUFPLGdCQURJO0FBRVhDLDZCQUFhLDhDQUZGO0FBR1hDLHNCQUFNLFNBSEs7QUFJWEMseUJBQVM7QUFKRSxhQVBIO0FBYVpFLDRDQUFnQztBQUM1QkwsdUJBQU8sb0NBRHFCO0FBRTVCQyw2QkFBYSxnSkFGZTtBQUc1QkMsc0JBQU0sU0FIc0I7QUFJNUJDLHlCQUFTO0FBSm1CLGFBYnBCO0FBbUJaRyxtQ0FBdUI7QUFDbkJOLHVCQUFPLDRCQURZO0FBRW5CQyw2QkFBYSx3RUFGTTtBQUduQkMsc0JBQU0sU0FIYTtBQUluQkMseUJBQVM7QUFKVSxhQW5CWDtBQXlCWkksOENBQWtDO0FBQzlCUCx1QkFBTyxzQ0FEdUI7QUFFOUJDLDZCQUFhLDZGQUZpQjtBQUc5QkMsc0JBQU0sU0FId0I7QUFJOUJDLHlCQUFTO0FBSnFCLGFBekJ0QjtBQStCWkssc0JBQVU7QUFDTlIsdUJBQU8scURBREQ7QUFFTkMsNkJBQWEsd0VBRlA7QUFHTkMsc0JBQU0sU0FIQTtBQUlO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QUFPSSxZQUFQLENBQW9CeEMsQ0FBcEI7QUFDSCxpQkFGRDtBQUdILGFBSm1CLENBQXBCO0FBTUEsaUJBQUsvRSxVQUFMLENBQWdCSSxHQUFoQixDQUFvQmdILGVBQWVJLElBQWYsQ0FBb0JMLE1BQXBCLENBQXBCO0FBQ0g7OzsyQ0FFeUJBLE0sRUFBVztBQUNqQ3hGLG9CQUFRLDRCQUFSLEVBQXNDOEYsYUFBdEMsQ0FBb0ROLE1BQXBELEVBQTRELEtBQUtuSCxVQUFqRTtBQUNIOzs7K0NBRzJCO0FBQ3hCLGdCQUFJQSxtQkFBSjtBQUNBLGdCQUFNMEgsMkJBQTJCLFdBQUtDLFVBQUwsR0FBa0IsaURBQW5EO0FBQ0EsaUJBQUszSCxVQUFMLENBQWdCSSxHQUFoQixDQUFvQkMsS0FBSzFCLE1BQUwsQ0FBWWdILE9BQVosQ0FBb0Isc0NBQXBCLEVBQTRELFVBQUNDLE9BQUQsRUFBaUI7QUFDN0Ysb0JBQUlBLE9BQUosRUFBYTtBQUNUNUYsaUNBQWFLLEtBQUt1SCxPQUFMLENBQWFDLFVBQWIsQ0FBd0JILHdCQUF4QixDQUFiO0FBQ0gsaUJBRkQsTUFFTztBQUNILHdCQUFJMUgsVUFBSixFQUFnQkEsV0FBVzZGLE9BQVg7QUFDaEJ4Rix5QkFBS3VILE9BQUwsQ0FBYUUsd0JBQWIsQ0FBc0NKLHdCQUF0QztBQUNIO0FBQ0osYUFQbUIsQ0FBcEI7QUFRSDs7Ozs7O0FBdUZMSyxPQUFPQyxPQUFQLEdBQWlCLElBQUl0SixhQUFKLEVBQWpCIiwiZmlsZSI6ImxpYi9vbW5pc2hhcnAtYXRvbS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IHsgYmluZCwgZWFjaCwgZmluZCwgaGFzLCBpbmNsdWRlcywgaXNBcnJheSwgaXNGdW5jdGlvbiwga2ViYWJDYXNlIH0gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgQXN5bmNTdWJqZWN0LCBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlIH0gZnJvbSAndHMtZGlzcG9zYWJsZXMnO1xyXG5cclxuLy8gVE9ETzogUmVtb3ZlIHRoZXNlIGF0IHNvbWUgcG9pbnQgdG8gc3RyZWFtIGxpbmUgc3RhcnR1cC5cclxuaW1wb3J0IHsgT21uaSB9IGZyb20gJy4vc2VydmVyL29tbmknO1xyXG5jb25zdCB3aW4zMiA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMic7XHJcblxyXG5jbGFzcyBPbW5pU2hhcnBBdG9tIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIC8vIEludGVybmFsOiBVc2VkIGJ5IHVuaXQgdGVzdGluZyB0byBtYWtlIHN1cmUgdGhlIHBsdWdpbiBpcyBjb21wbGV0ZWx5IGFjdGl2YXRlZC5cclxuICAgIHByaXZhdGUgX3N0YXJ0ZWQ6IEFzeW5jU3ViamVjdDxib29sZWFuPjtcclxuICAgIHByaXZhdGUgX2FjdGl2YXRlZDogQXN5bmNTdWJqZWN0PGJvb2xlYW4+O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZShzdGF0ZTogYW55KSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgICB0aGlzLl9zdGFydGVkID0gbmV3IEFzeW5jU3ViamVjdDxib29sZWFuPigpO1xyXG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IG5ldyBBc3luY1N1YmplY3Q8Ym9vbGVhbj4oKTtcclxuXHJcbiAgICAgICAgdGhpcy5jb25maWd1cmVLZXliaW5kaW5ncygpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdvbW5pc2hhcnAtYXRvbTp0b2dnbGUnLCAoKSA9PiB0aGlzLnRvZ2dsZSgpKSk7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAnb21uaXNoYXJwLWF0b206Zml4LXVzaW5ncycsICgpID0+IE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maXh1c2luZ3Moe30pKSkpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ29tbmlzaGFycC1hdG9tOnNldHRpbmdzJywgKCkgPT4gYXRvbS53b3Jrc3BhY2Uub3BlbignYXRvbTovL2NvbmZpZy9wYWNrYWdlcycpXHJcbiAgICAgICAgICAgIC50aGVuKHRhYiA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFiICYmIHRhYi5nZXRVUkkgJiYgdGFiLmdldFVSSSgpICE9PSAnYXRvbTovL2NvbmZpZy9wYWNrYWdlcy9vbW5pc2hhcnAtYXRvbScpIHtcclxuICAgICAgICAgICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCdhdG9tOi8vY29uZmlnL3BhY2thZ2VzL29tbmlzaGFycC1hdG9tJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGdyYW1tYXJzID0gKDxhbnk+YXRvbS5ncmFtbWFycyk7XHJcbiAgICAgICAgY29uc3QgZ3JhbW1hckNiID0gKGdyYW1tYXI6IHsgc2NvcGVOYW1lOiBzdHJpbmc7IH0pID0+IHtcclxuICAgICAgICAgICAgaWYgKGZpbmQoT21uaS5ncmFtbWFycywgKGdtcjogYW55KSA9PiBnbXIuc2NvcGVOYW1lID09PSBncmFtbWFyLnNjb3BlTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIC8vIGVuc3VyZSB0aGUgc2NvcGUgaGFzIGJlZW4gaW5pdGVkXHJcbiAgICAgICAgICAgICAgICBhdG9tLmdyYW1tYXJzLnN0YXJ0SWRGb3JTY29wZShncmFtbWFyLnNjb3BlTmFtZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qgb21uaXNoYXJwU2NvcGVOYW1lID0gYCR7Z3JhbW1hci5zY29wZU5hbWV9Lm9tbmlzaGFycGA7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY29wZUlkID0gZ3JhbW1hcnMuaWRzQnlTY29wZVtncmFtbWFyLnNjb3BlTmFtZV07XHJcbiAgICAgICAgICAgICAgICBncmFtbWFycy5pZHNCeVNjb3BlW29tbmlzaGFycFNjb3BlTmFtZV0gPSBzY29wZUlkO1xyXG4gICAgICAgICAgICAgICAgZ3JhbW1hcnMuc2NvcGVzQnlJZFtzY29wZUlkXSA9IG9tbmlzaGFycFNjb3BlTmFtZTtcclxuICAgICAgICAgICAgICAgIGdyYW1tYXIuc2NvcGVOYW1lID0gb21uaXNoYXJwU2NvcGVOYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBlYWNoKGdyYW1tYXJzLmdyYW1tYXJzLCBncmFtbWFyQ2IpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5ncmFtbWFycy5vbkRpZEFkZEdyYW1tYXIoZ3JhbW1hckNiKSk7XHJcblxyXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1yZXF1aXJlLWltcG9ydHNcclxuICAgICAgICByZXF1aXJlKCdhdG9tLXBhY2thZ2UtZGVwcycpLmluc3RhbGwoJ29tbmlzaGFycC1hdG9tJylcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKCdBY3RpdmF0aW5nIG9tbmlzaGFycC1hdG9tIHNvbHV0aW9uIHRyYWNraW5nLi4uJyk7XHJcbiAgICAgICAgICAgICAgICBPbW5pLmFjdGl2YXRlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0ZWQubmV4dCh0cnVlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0ZWQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5sb2FkRmVhdHVyZXModGhpcy5nZXRGZWF0dXJlcygnYXRvbScpLmRlbGF5KE9tbmlbJ19raWNrX2luX3RoZV9wYW50c18nXSA/IDAgOiAyMDAwKSkudG9Qcm9taXNlKCkpXHJcbiAgICAgICAgICAgIC8qIHRzbGludDplbmFibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0aW5nT2JzZXJ2YWJsZSA9IE9tbmkuYWN0aXZlU29sdXRpb25cclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxyXG4gICAgICAgICAgICAgICAgICAgIC50YWtlKDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcbiAgICAgICAgICAgICAgICBpZiAoT21uaVsnX2tpY2tfaW5fdGhlX3BhbnRzXyddKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRpbmdPYnNlcnZhYmxlID0gT2JzZXJ2YWJsZS5vZihudWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gT25seSBhY3RpdmF0ZSBmZWF0dXJlcyBvbmNlIHdlIGhhdmUgYSBzb2x1dGlvbiFcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc3RhcnRpbmdPYnNlcnZhYmxlXHJcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gdGhpcy5sb2FkRmVhdHVyZXModGhpcy5nZXRGZWF0dXJlcygnZmVhdHVyZXMnKSkpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyKGVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZhdGVkLm5leHQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmF0ZWQuY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRGZWF0dXJlcyhmb2xkZXI6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdCA9IGF0b20uY29uZmlnLmdldDxib29sZWFuPignb21uaXNoYXJwLWF0b206ZmVhdHVyZS13aGl0ZS1saXN0Jyk7XHJcbiAgICAgICAgY29uc3QgZmVhdHVyZUxpc3QgPSBhdG9tLmNvbmZpZy5nZXQ8c3RyaW5nW10+KCdvbW5pc2hhcnAtYXRvbTpmZWF0dXJlLWxpc3QnKTtcclxuICAgICAgICBjb25zdCB3aGl0ZUxpc3RVbmRlZmluZWQgPSB3aGl0ZUxpc3QgPT09IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgY29uc29sZS5pbmZvKGBHZXR0aW5nIGZlYXR1cmVzIGZvciBcIiR7Zm9sZGVyfVwiLi4uYCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGZlYXR1cmVEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBmb2xkZXIpO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBsb2FkRmVhdHVyZShmaWxlOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXJlcXVpcmUtaW1wb3J0cyBub24tbGl0ZXJhbC1yZXF1aXJlXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlcXVpcmUoYC4vJHtmb2xkZXJ9LyR7ZmlsZX1gKTtcclxuICAgICAgICAgICAgY29uc29sZS5pbmZvKGBMb2FkaW5nIGZlYXR1cmUgXCIke2ZvbGRlcn0vJHtmaWxlfVwiLi4uYCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7IC8vdmFsdWVzKHJlc3VsdCkuZmlsdGVyKGZlYXR1cmUgPT4gIWlzRnVuY3Rpb24oZmVhdHVyZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuYmluZE5vZGVDYWxsYmFjayhmcy5yZWFkZGlyKShmZWF0dXJlRGlyKVxyXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlcyA9PiBmaWxlcylcclxuICAgICAgICAgICAgLmZpbHRlcihmaWxlID0+IC9cXC5qcyQvLnRlc3QoZmlsZSkpXHJcbiAgICAgICAgICAgIC5mbGF0TWFwKGZpbGUgPT4gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnN0YXQpKGAke2ZlYXR1cmVEaXJ9LyR7ZmlsZX1gKSwgKGZpbGUsIHN0YXQpID0+ICh7IGZpbGUsIHN0YXQgfSkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhei5zdGF0LmlzRGlyZWN0b3J5KCkpXHJcbiAgICAgICAgICAgIC5tYXAoeiA9PiAoe1xyXG4gICAgICAgICAgICAgICAgZmlsZTogYCR7Zm9sZGVyfS8ke3BhdGguYmFzZW5hbWUoei5maWxlKX1gLnJlcGxhY2UoL1xcLmpzJC8sICcnKSxcclxuICAgICAgICAgICAgICAgIGxvYWQ6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmZWF0dXJlID0gbG9hZEZlYXR1cmUoei5maWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmVhdHVyZXM6IHsga2V5OiBzdHJpbmcsIGFjdGl2YXRlOiAoKSA9PiAoKSA9PiB2b2lkIH1bXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGVhY2goZmVhdHVyZSwgKHZhbHVlOiBJRmVhdHVyZSwga2V5OiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKHZhbHVlKSAmJiAhaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWUucmVxdWlyZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ1trZXldID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogYCR7dmFsdWUudGl0bGV9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHZhbHVlLmRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IChoYXModmFsdWUsICdkZWZhdWx0JykgPyB2YWx1ZS5kZWZhdWx0IDogdHJ1ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSwgYWN0aXZhdGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZCwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbTx7IGtleTogc3RyaW5nLCBhY3RpdmF0ZTogKCkgPT4gKCkgPT4gdm9pZCB9PihmZWF0dXJlcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICAuZmlsdGVyKGwgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHdoaXRlTGlzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHdoaXRlTGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbmNsdWRlcyhmZWF0dXJlTGlzdCwgbC5maWxlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICFpbmNsdWRlcyhmZWF0dXJlTGlzdCwgbC5maWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxvYWRGZWF0dXJlcyhmZWF0dXJlczogT2JzZXJ2YWJsZTx7IGZpbGU6IHN0cmluZzsgbG9hZDogKCkgPT4gT2JzZXJ2YWJsZTx7IGtleTogc3RyaW5nLCBhY3RpdmF0ZTogKCkgPT4gKCkgPT4gdm9pZCB9PiB9Pikge1xyXG4gICAgICAgIHJldHVybiBmZWF0dXJlc1xyXG4gICAgICAgICAgICAuY29uY2F0TWFwKHogPT4gei5sb2FkKCkpXHJcbiAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgLmNvbmNhdE1hcCh4ID0+IHgpXHJcbiAgICAgICAgICAgIC5tYXAoZiA9PiBmLmFjdGl2YXRlKCkpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXHJcbiAgICAgICAgICAgIC50b0FycmF5KClcclxuICAgICAgICAgICAgLmRvKHtcclxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgKDxhbnk+YXRvbS5jb25maWcpLnNldFNjaGVtYSgnb21uaXNoYXJwLWF0b20nLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB0aGlzLmNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY29uY2F0TWFwKHggPT4geClcclxuICAgICAgICAgICAgLmRvKHggPT4geCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZDogYm9vbGVhbiwga2V5OiBzdHJpbmcsIHZhbHVlOiBJRmVhdHVyZSkge1xyXG4gICAgICAgIGxldCByZXN1bHQ6ICgpID0+IHZvaWQgPSBudWxsO1xyXG4gICAgICAgIGxldCBmaXJzdFJ1biA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vIFdoaXRlbGlzdCBpcyB1c2VkIGZvciB1bml0IHRlc3RpbmcsIHdlIGRvblwidCB3YW50IHRoZSBjb25maWcgdG8gbWFrZSBjaGFuZ2VzIGhlcmVcclxuICAgICAgICBpZiAod2hpdGVMaXN0VW5kZWZpbmVkICYmIGhhcyh0aGlzLmNvbmZpZywga2V5KSkge1xyXG4gICAgICAgICAgICBjb25zdCBjb25maWdLZXkgPSBgb21uaXNoYXJwLWF0b20uJHtrZXl9YDtcclxuICAgICAgICAgICAgbGV0IGVuYWJsZURpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xyXG4gICAgICAgICAgICBsZXQgZGlzYWJsZURpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlnS2V5LCBlbmFibGVkID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghZW5hYmxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXNhYmxlRGlzcG9zYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzYWJsZURpc3Bvc2FibGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB0cnkgeyB2YWx1ZS5kaXNwb3NlKCk7IH0gY2F0Y2ggKGV4KSB7IC8qICovIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnYXRvbS13b3Jrc3BhY2UnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBgb21uaXNoYXJwLWZlYXR1cmU6ZW5hYmxlLSR7a2ViYWJDYXNlKGtleSl9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZ0tleSwgdHJ1ZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZW5hYmxlRGlzcG9zYWJsZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmFibGVEaXNwb3NhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc2FibGVEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEFjdGl2YXRpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUuYWN0aXZhdGUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWVbJ2F0dGFjaCddKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3RSdW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVsnYXR0YWNoJ10oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlWydhdHRhY2gnXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsIGBvbW5pc2hhcnAtZmVhdHVyZTpkaXNhYmxlLSR7a2ViYWJDYXNlKGtleSl9YCwgKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZ0tleSwgZmFsc2UpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGRpc2FibGVEaXNwb3NhYmxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGZpcnN0UnVuID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcblxyXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsIGBvbW5pc2hhcnAtZmVhdHVyZTp0b2dnbGUtJHtrZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZ0tleSkpKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFsdWUuYWN0aXZhdGUoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlWydhdHRhY2gnXSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZVsnYXR0YWNoJ10oKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4geyB0cnkgeyB2YWx1ZS5kaXNwb3NlKCk7IH0gY2F0Y2ggKGV4KSB7IC8qICovIH0gfSkpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkZXRlY3RBdXRvVG9nZ2xlR3JhbW1hcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xyXG4gICAgICAgIGNvbnN0IGdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xyXG4gICAgICAgIHRoaXMuZGV0ZWN0R3JhbW1hcihlZGl0b3IsIGdyYW1tYXIpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hcigoZ21yOiBGaXJzdE1hdGUuR3JhbW1hcikgPT4gdGhpcy5kZXRlY3RHcmFtbWFyKGVkaXRvciwgZ21yKSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZGV0ZWN0R3JhbW1hcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgZ3JhbW1hcjogRmlyc3RNYXRlLkdyYW1tYXIpIHtcclxuICAgICAgICBpZiAoIWF0b20uY29uZmlnLmdldCgnb21uaXNoYXJwLWF0b20uYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZScpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjsgLy9zaG9ydCBvdXQsIGlmIHNldHRpbmcgdG8gbm90IGF1dG8gc3RhcnQgaXMgZW5hYmxlZFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKE9tbmkuaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcikpIHtcclxuICAgICAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKGdyYW1tYXIubmFtZSA9PT0gJ0pTT04nKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVkaXRvci5nZXRQYXRoKCkpID09PSAncHJvamVjdC5qc29uJykge1xyXG4gICAgICAgICAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b2dnbGUoKSB7XHJcbiAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcclxuICAgICAgICAgICAgT21uaS5jb25uZWN0KCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChPbW5pLmlzT24pIHtcclxuICAgICAgICAgICAgT21uaS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyOiBhbnkpIHtcclxuICAgICAgICBsZXQgZiA9IHJlcXVpcmUoJy4vYXRvbS9zdGF0dXMtYmFyJyk7XHJcbiAgICAgICAgZi5zdGF0dXNCYXIuc2V0dXAoc3RhdHVzQmFyKTtcclxuICAgICAgICBmID0gcmVxdWlyZSgnLi9hdG9tL2ZyYW1ld29yay1zZWxlY3RvcicpO1xyXG4gICAgICAgIGYuZnJhbWV3b3JrU2VsZWN0b3Iuc2V0dXAoc3RhdHVzQmFyKTtcclxuICAgICAgICBmID0gcmVxdWlyZSgnLi9hdG9tL2ZlYXR1cmUtYnV0dG9ucycpO1xyXG4gICAgICAgIGYuZmVhdHVyZUVkaXRvckJ1dHRvbnMuc2V0dXAoc3RhdHVzQmFyKTtcclxuICAgIH1cclxuXHJcbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcbiAgICBwdWJsaWMgY29uc3VtZVllb21hbkVudmlyb25tZW50KGdlbmVyYXRvclNlcnZpY2U6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHtnZW5lcmF0b3JBc3BuZXR9ID0gcmVxdWlyZSgnLi9hdG9tL2dlbmVyYXRvci1hc3BuZXQnKTtcclxuICAgICAgICBnZW5lcmF0b3JBc3BuZXQuc2V0dXAoZ2VuZXJhdG9yU2VydmljZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByb3ZpZGVBdXRvY29tcGxldGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoJy4vc2VydmljZXMvY29tcGxldGlvbi1wcm92aWRlcicpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwcm92aWRlTGludGVyKCk6IGFueVtdIHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgLy9jb25zdCBMaW50ZXJQcm92aWRlciA9IHJlcXVpcmUoXCIuL3NlcnZpY2VzL2xpbnRlci1wcm92aWRlclwiKTtcclxuICAgICAgICAvL3JldHVybiBMaW50ZXJQcm92aWRlci5wcm92aWRlcjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJvdmlkZVByb2plY3RKc29uKCkge1xyXG4gICAgICAgIHJldHVybiByZXF1aXJlKCcuL3NlcnZpY2VzL3Byb2plY3QtcHJvdmlkZXInKS5jb25jYXQocmVxdWlyZSgnLi9zZXJ2aWNlcy9mcmFtZXdvcmstcHJvdmlkZXInKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbnN1bWVMaW50ZXIobGludGVyOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBMaW50ZXJQcm92aWRlciA9IHJlcXVpcmUoJy4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyJyk7XHJcbiAgICAgICAgY29uc3QgbGludGVycyA9IExpbnRlclByb3ZpZGVyLnByb3ZpZGVyO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcclxuICAgICAgICAgICAgZWFjaChsaW50ZXJzLCBsID0+IHtcclxuICAgICAgICAgICAgICAgIGxpbnRlci5kZWxldGVMaW50ZXIobCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChMaW50ZXJQcm92aWRlci5pbml0KGxpbnRlcikpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25zdW1lSW5kaWVMaW50ZXIobGludGVyOiBhbnkpIHtcclxuICAgICAgICByZXF1aXJlKCcuL3NlcnZpY2VzL2xpbnRlci1wcm92aWRlcicpLnJlZ2lzdGVySW5kaWUobGludGVyLCB0aGlzLmRpc3Bvc2FibGUpO1xyXG4gICAgfVxyXG4gICAgLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lICovXHJcblxyXG4gICAgcHJpdmF0ZSBjb25maWd1cmVLZXliaW5kaW5ncygpIHtcclxuICAgICAgICBsZXQgZGlzcG9zYWJsZTogRXZlbnRLaXQuRGlzcG9zYWJsZTtcclxuICAgICAgICBjb25zdCBvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcgPSBPbW5pLnBhY2thZ2VEaXIgKyAnL29tbmlzaGFycC1hdG9tL2tleW1hcHMvb21uaXNoYXJwLWZpbGUtbmV3LmNzb24nO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnb21uaXNoYXJwLWF0b20uZW5hYmxlQWR2YW5jZWRGaWxlTmV3JywgKGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2FibGUgPSBhdG9tLmtleW1hcHMubG9hZEtleW1hcChvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRpc3Bvc2FibGUpIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgYXRvbS5rZXltYXBzLnJlbW92ZUJpbmRpbmdzRnJvbVNvdXJjZShvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb25maWcgPSB7XHJcbiAgICAgICAgYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZToge1xyXG4gICAgICAgICAgICB0aXRsZTogJ0F1dG9zdGFydCBPbW5pc2hhcnAgUm9zbHluJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBdXRvbWF0aWNhbGx5IHN0YXJ0cyBPbW5pc2hhcnAgUm9zbHluIHdoZW4gYSBjb21wYXRpYmxlIGZpbGUgaXMgb3BlbmVkLicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGV2ZWxvcGVyTW9kZToge1xyXG4gICAgICAgICAgICB0aXRsZTogJ0RldmVsb3BlciBNb2RlJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPdXRwdXRzIGRldGFpbGVkIHNlcnZlciBjYWxscyBpbiBjb25zb2xlLmxvZycsXHJcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9uczoge1xyXG4gICAgICAgICAgICB0aXRsZTogJ1Nob3cgRGlhZ25vc3RpY3MgZm9yIGFsbCBTb2x1dGlvbnMnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FkdmFuY2VkOiBUaGlzIHdpbGwgc2hvdyBkaWFnbm9zdGljcyBmb3IgYWxsIG9wZW4gc29sdXRpb25zLiAgTk9URTogTWF5IHRha2UgYSByZXN0YXJ0IG9yIGNoYW5nZSB0byBlYWNoIHNlcnZlciB0byB0YWtlIGVmZmVjdCB3aGVuIHR1cm5lZCBvbi4nLFxyXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbmFibGVBZHZhbmNlZEZpbGVOZXc6IHtcclxuICAgICAgICAgICAgdGl0bGU6ICdFbmFibGUgYEFkdmFuY2VkIEZpbGUgTmV3YCcsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRW5hYmxlIGBBZHZhbmNlZCBGaWxlIE5ld2Agd2hlbiBkb2luZyBjdHJsLW4vY21kLW4gd2l0aGluIGEgQyMgZWRpdG9yLicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnVXNlIExlZnQtTGFiZWwgY29sdW1uIGluIFN1Z2dlc3Rpb25zJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTaG93cyByZXR1cm4gdHlwZXMgaW4gYSByaWdodC1hbGlnbmVkIGNvbHVtbiB0byB0aGUgbGVmdCBvZiB0aGUgY29tcGxldGlvbiBzdWdnZXN0aW9uIHRleHQuJyxcclxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXNlSWNvbnM6IHtcclxuICAgICAgICAgICAgdGl0bGU6ICdVc2UgdW5pcXVlIGljb25zIGZvciBraW5kIGluZGljYXRvcnMgaW4gU3VnZ2VzdGlvbnMnLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Nob3dzIGtpbmRzIHdpdGggdW5pcXVlIGljb25zIHJhdGhlciB0aGFuIGF1dG9jb21wbGV0ZSBkZWZhdWx0IHN0eWxlcy4nLFxyXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9BZGp1c3RUcmVlVmlldzoge1xyXG4gICAgICAgICAgICB0aXRsZTogJ0FkanVzdCB0aGUgdHJlZSB2aWV3IHRvIG1hdGNoIHRoZSBzb2x1dGlvbiByb290LicsXHJcbiAgICAgICAgICAgIGRlc2NycHRpb246ICdUaGlzIHdpbGwgYXV0b21hdGljYWxseSBhZGp1c3QgdGhlIHRyZWV2aWV3IHRvIGJlIHRoZSByb290IG9mIHRoZSBzb2x1dGlvbi4nLFxyXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBuYWdBZGp1c3RUcmVlVmlldzoge1xyXG4gICAgICAgICAgICB0aXRsZTogJ1Nob3cgdGhlIG5vdGlmaWNhdGlvbnMgdG8gQWRqdXN0IHRoZSB0cmVlIHZpZXcnLFxyXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9BZGRFeHRlcm5hbFByb2plY3RzOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnQWRkIGV4dGVybmFsIHByb2plY3RzIHRvIHRoZSB0cmVlIHZpZXcuJyxcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogJ1RoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IGFkZCBleHRlcm5hbCBzb3VyY2VzIHRvIHRoZSB0cmVlIHZpZXcuXFxuIEV4dGVybmFsIHNvdXJjZXMgYXJlIGFueSBwcm9qZWN0cyB0aGF0IGFyZSBsb2FkZWQgb3V0c2lkZSBvZiB0aGUgc29sdXRpb24gcm9vdC4nLFxyXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBuYWdBZGRFeHRlcm5hbFByb2plY3RzOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnU2hvdyB0aGUgbm90aWZpY2F0aW9ucyB0byBhZGQgb3IgcmVtb3ZlIGV4dGVybmFsIHByb2plY3RzJyxcclxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBoaWRlTGludGVySW50ZXJmYWNlOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnSGlkZSB0aGUgbGludGVyIGludGVyZmFjZSB3aGVuIHVzaW5nIG9tbmlzaGFycC1hdG9tIGVkaXRvcnMnLFxyXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdhbnRNZXRhZGF0YToge1xyXG4gICAgICAgICAgICB0aXRsZTogJ1JlcXVlc3QgbWV0YWRhdGEgZGVmaW5pdGlvbiB3aXRoIEdvdG8gRGVmaW5pdGlvbicsXHJcbiAgICAgICAgICAgIGRlc2NycHRpb246ICdSZXF1ZXN0IHN5bWJvbCBtZXRhZGF0YSBmcm9tIHRoZSBzZXJ2ZXIsIHdoZW4gdXNpbmcgZ28tdG8tZGVmaW5pdGlvbi4gIFRoaXMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdCBvbiBMaW51eCwgZHVlIHRvIGlzc3VlcyB3aXRoIFJvc2x5biBvbiBNb25vLicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgZGVmYXVsdDogd2luMzJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFsdEdvdG9EZWZpbml0aW9uOiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnQWx0IEdvIFRvIERlZmluaXRpb24nLFxyXG4gICAgICAgICAgICBkZXNjcnB0aW9uOiAnVXNlIHRoZSBhbHQga2V5IGluc3RlYWQgb2YgdGhlIGN0cmwvY21kIGtleSBmb3IgZ290byBkZWZpbnRpb24gbW91c2Ugb3Zlci4nLFxyXG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaG93SGlkZGVuRGlhZ25vc3RpY3M6IHtcclxuICAgICAgICAgICAgdGl0bGU6ICdTaG93IFxcJ0hpZGRlblxcJyBkaWFnbm9zdGljcyBpbiB0aGUgbGludGVyJyxcclxuICAgICAgICAgICAgZGVzY3JwdGlvbjogJ1Nob3cgb3IgaGlkZSBoaWRkZW4gZGlhZ25vc3RpY3MgaW4gdGhlIGxpbnRlciwgdGhpcyBkb2VzIG5vdCBhZmZlY3QgZ3JleWluZyBvdXQgb2YgbmFtZXNwYWNlcyB0aGF0IGFyZSB1bnVzZWQuJyxcclxuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgT21uaVNoYXJwQXRvbTtcclxuIl19
