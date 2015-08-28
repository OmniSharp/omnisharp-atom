require('./configure-rx');
import _ = require('lodash');
import {Observable, BehaviorSubject, Subject, AsyncSubject, CompositeDisposable, Disposable} from "rx";
import path = require('path');
import fs = require('fs');

// TODO: Remove these at some point to stream line startup.
import Omni = require('../omni-sharp-server/omni');
import dependencyChecker = require('./dependency-checker');
import {world} from './world';
var win32 = process.platform === "win32";

class OmniSharpAtom {
    private disposable: Rx.CompositeDisposable;
    private menu: EventKit.Disposable;

    // Internal: Used by unit testing to make sure the plugin is completely activated.
    private _started: AsyncSubject<boolean>;
    private _activated: AsyncSubject<boolean>;

    private restartLinter: () => void = () => { };

    public activate(state) {
        this.disposable = new CompositeDisposable;
        this._started = new AsyncSubject<boolean>();
        this._activated = new AsyncSubject<boolean>();

        console.info("Starting omnisharp-atom...");
        if (dependencyChecker.findAllDeps(this.getPackageDir())) {
            console.info("Dependencies installed...");

            this.configureKeybindings();

            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:toggle', () => this.toggle()));

            var whiteList = atom.config.get<boolean>("omnisharp-atom:feature-white-list");
            var featureList = atom.config.get<string[]>('omnisharp-atom:feature-list');

            var whiteListUndefined = (typeof whiteList === 'undefined');

            var started = Observable.merge(
                this.getFeatures(featureList, whiteList, "atom"),
                this.getFeatures(featureList, whiteList, "features")
            ).filter(l => {
                if (typeof whiteList === 'undefined') {
                    return true;
                }

                if (whiteList) {
                    return _.contains(featureList, l.file);
                } else {
                    return !_.contains(featureList, l.file);
                }
            })
                .flatMap(z => z.load())
                .toArray()
                .share();

            started.subscribe(() => {
                this._started.onNext(true);
                this._started.onCompleted();
            });

            this.disposable.add(started.subscribe(features => {
                console.info("Activating omnisharp-atom...");

                (<any>atom.config).setSchema('omnisharp-atom', {
                    type: 'object',
                    properties: this.config
                });

                Omni.activate();
                this.disposable.add(Omni);

                world.activate();
                this.disposable.add(world);

                var deferred = [];
                _.each(features, f => {
                    var {key, value} = f;

                    // Whitelist is used for unit testing, we don't want the config to make changes here
                    if (whiteListUndefined && _.has(this.config, key)) {
                        this.disposable.add(atom.config.observe(`omnisharp-atom.${key}`, enabled => {
                            if (!enabled) {
                                try { value.dispose(); } catch (ex) { }
                            } else {
                                value.activate();

                                if (_.isFunction(value['attach'])) {
                                    deferred.push(() => value['attach']());
                                }
                            }
                        }));
                    } else {
                        value.activate();

                        if (_.isFunction(value['attach'])) {
                            deferred.push(() => value['attach']());
                        }
                    }

                    this.disposable.add(Disposable.create(() => { try { value.dispose() } catch (ex) { } }));
                });
                _.each(deferred, x => x());

                this.disposable.add(atom.workspace.observeTextEditors((editor: Atom.TextEditor) => {
                    this.detectAutoToggleGrammar(editor);
                }));

                this._activated.onNext(true);
                this._activated.onCompleted();
            }));
        } else {
            console.info(`omnisharp-atom not started missing depedencies ${dependencyChecker.errors() }...`);
            _.map(dependencyChecker.errors() || [], missingDependency => console.error(missingDependency))
        }
    }

    private _packageDir: string;
    public getPackageDir() {
        if (!this._packageDir) {
            console.info(`getPackageDirPaths: ${atom.packages.getPackageDirPaths() }`);
            this._packageDir = _.find(atom.packages.getPackageDirPaths(), function(packagePath) {
                console.info(`packagePath ${packagePath} exists: ${fs.existsSync(path.join(packagePath, "omnisharp-atom")) }`);
                return fs.existsSync(path.join(packagePath, "omnisharp-atom"));
            });

            // Fallback, this is for unit testing on travis mainly
            if (!this._packageDir) {
                this._packageDir = path.resolve(__dirname, '../../..');
            }
        }
        return this._packageDir;
    }

    public getFeatures(featureList: string[], whiteList: boolean, folder: string) {
        console.info(`Getting features for '${folder}'...`);

        var packageDir = this.getPackageDir();
        var featureDir = `${packageDir}/omnisharp-atom/lib/omnisharp-atom/${folder}`;

        function loadFeature(file: string) {
            var result = require(`./${folder}/${file}`);
            console.info(`Loading feature '${folder}/${file}'...`);
            return result;//_.values(result).filter(feature => !_.isFunction(feature));
        }

        return Observable.fromNodeCallback(fs.readdir)(featureDir)
            .flatMap(files => Observable.from(files))
            .where(file => /\.js$/.test(file))
            .flatMap(file => Observable.fromNodeCallback(fs.stat)(`${featureDir}/${file}`).map(stat => ({ file, stat })))
            .where(z => !z.stat.isDirectory())
            .map(z => ({
                file: `${folder}/${path.basename(z.file) }`.replace(/\.js$/, ''),
                load: () => {
                    var feature = loadFeature(z.file);

                    var features: { key: string, value: OmniSharp.IFeature }[] = [];
                    _.each(feature, (value: OmniSharp.IFeature, key: string) => {
                        if (!_.isFunction(value)) {
                            if (!value.required) {
                                this.config[key] = {
                                    title: `${value.title}`,
                                    description: value.description,
                                    type: 'boolean',
                                    default: (_.has(value, 'default') ? value.default : true)
                                };
                                //OmniSharpAtom.config.features.default[key] = (_.has(value, 'default') ? value.default : true);
                            }

                            features.push({ key, value });
                        }
                    });

                    return Observable.from<{ key: string, value: OmniSharp.IFeature }>(features);
                }
            }));
    }

    private detectAutoToggleGrammar(editor: Atom.TextEditor) {
        var grammar = editor.getGrammar();
        this.detectGrammar(editor, grammar);
        this.disposable.add(editor.onDidChangeGrammar((grammar: FirstMate.Grammar) => this.detectGrammar(editor, grammar)));
    }

    private detectGrammar(editor: Atom.TextEditor, grammar: FirstMate.Grammar) {
        if (!atom.config.get('omnisharp-atom.autoStartOnCompatibleFile')) {
            return; //short out, if setting to not auto start is enabled
        }

        if (Omni.isOn && !this.menu) {
            this.toggleMenu();
        }

        if (grammar.name === 'C#') {
            if (Omni.isOff) {
                this.toggle();
            }
        } else if (grammar.name === "JSON") {
            if (path.basename(editor.getPath()) === "project.json") {
                if (Omni.isOff) {
                    this.toggle();
                }
            }
        } else if (grammar.name === "C# Script File") {
            if (Omni.isOff) {
                this.toggle()
            }
        }
    }

    private toggleMenu() {
        var menuJsonFile = this.getPackageDir() + "/omnisharp-atom/menus/omnisharp-menu.json";
        var menuJson = JSON.parse(fs.readFileSync(menuJsonFile, 'utf8'));
        this.menu = atom.menu.add(menuJson.menu);
        this.disposable.add(this.menu);
    }

    public toggle() {
        var dependencyErrors = dependencyChecker.errors();
        if (dependencyErrors.length === 0) {
            if (Omni.isOff) {
                Omni.connect();
                this.toggleMenu();
            } else if (Omni.isOn) {
                Omni.disconnect();

                if (this.menu) {
                    this.disposable.remove(this.menu);
                    this.menu.dispose();
                    this.menu = null;
                }
            }
        } else {
            _.map(dependencyErrors, missingDependency => alert(missingDependency));
        }
    }

    public deactivate() {
        this.disposable.dispose();
    }

    public consumeStatusBar(statusBar) {
        var f = require('./atom/status-bar');
        f.statusBar.setup(statusBar);
        var f = require('./atom/framework-selector');
        f.frameworkSelector.setup(statusBar);
    }

    public consumeYeomanEnvironment(generatorService) {
        var {generatorAspnet} = require("./atom/generator-aspnet");
        generatorAspnet.setup(generatorService);
    }

    public provideAutocomplete() {
        var {CompletionProvider} = require("./services/completion-provider");
        this.disposable.add(CompletionProvider);
        return CompletionProvider;
    }

    public provideLinter() {
        var LinterProvider = require("./services/linter-provider");
        return LinterProvider.provider;
    }

    public provideProjectJson() {
        return require("./services/project-provider").concat(require('./services/framework-provider'));
    }

    public consumeLinter(linter) {
        var LinterProvider = require("./services/linter-provider");
        var linters = LinterProvider;

        this.disposable.add(Disposable.create(() => {
            _.each(linters, l => {
                linter.deleteLinter(l);
            });
        }));

        this.disposable.add(LinterProvider.init());
    }

    private configureKeybindings() {
        var omnisharpFileNew = this.getPackageDir() + "/omnisharp-atom/keymaps/omnisharp-file-new.cson";
        this.disposable.add(atom.config.observe("omnisharp-atom.enableAdvancedFileNew", (enabled) => {
            if (enabled) {
                atom.keymaps.loadKeymap(omnisharpFileNew);
            } else {
                atom.keymaps.removeBindingsFromSource(omnisharpFileNew);
            }
        }));

        var disposable: EventKit.Disposable;
        var omnisharpAdvancedFileNew = this.getPackageDir() + "/omnisharp-atom/keymaps/omnisharp-advanced-file-new.cson";
        this.disposable.add(atom.config.observe("omnisharp-atom.useAdvancedFileNew", (enabled) => {
            if (enabled) {
                atom.keymaps.loadKeymap(omnisharpAdvancedFileNew);

                var anymenu = <any>atom.menu;
                _.each(anymenu.template, (template: any) => {
                    var item = <any>_.find(template.submenu, { command: "application:new-file" });
                    if (item) {
                        item.command = 'advanced-new-file:toggle';
                    }
                });
            } else {
                if (disposable) disposable.dispose();
                atom.keymaps.removeBindingsFromSource(omnisharpAdvancedFileNew);

                var anymenu = <any>atom.menu;
                _.each(anymenu.template, (template: any) => {
                    var item = <any>_.find(template.submenu, { command: "advanced-new-file:toggle" });
                    if (item) {
                        item.command = 'application:new-file';
                    }
                });
            }
        }));
    }

    public config = {
        autoStartOnCompatibleFile: {
            title: "Autostart Omnisharp Roslyn",
            description: "Automatically starts Omnisharp Roslyn when a compatible file is opened.",
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
            default: true
        },
        useAdvancedFileNew: {
            title: 'Use `Advanced File New` as default',
            description: 'Use `Advanced File New` as your default new command everywhere.',
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
            title: 'Want metadata',
            descrption: 'Request symbol metadata from the server, when using go-to-definition.  This is disabled by default on Linux, due to issues with Roslyn on Mono.',
            type: 'boolean',
            default: win32
        }
    }
}

var instance = new OmniSharpAtom
export = instance;
