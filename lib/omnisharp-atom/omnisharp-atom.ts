require('./configure-rx');
import _ = require('lodash');
import {Observable, BehaviorSubject} from "rx";
import path = require('path');
import fs = require('fs');
import a = require("atom");
var Emitter = (<any>a).Emitter

// TODO: Remove these at some point to stream line startup.
import Omni = require('../omni-sharp-server/omni');
import ClientManager = require('../omni-sharp-server/client-manager');
import dependencyChecker = require('./dependency-checker');
import StatusBarComponent = require('./views/status-bar-view');
import DockWindow = require('./views/dock-view');
import React = require('react');

class Feature implements OmniSharp.IFeature {
    public name: string;
    public path: string;
    private _instance: any;

    constructor(atom: OmniSharpAtom, feature: string) {
        this.name = feature.replace('.ts', '');
        this.path = "./features/" + feature;

        var _cls = require(this.path);
        this._instance = new _cls(atom);
    }

    public invoke(method: string, ...args: any[]) {
        if (this._instance[method])
            this._instance[method].apply(this._instance, args);
    }
}

class OmniSharpAtom {
    private features: OmniSharp.IFeature[];
    private observeEditors: { dispose: Function };
    private activeEditorAtomDisposable: { dispose: Function };
    private emitter: EventKit.Emitter;
    private statusBarView;
    private outputView;
    private autoCompleteProvider;
    private statusBar;
    private generator: { run(generator: string, path?: string): void; start(prefix: string, path?: string): void; };
    private menu: EventKit.Disposable;

    private _activeEditor = new BehaviorSubject<Atom.TextEditor>(null);
    private _activeEditorObservable = this._activeEditor.replay(z => z, 1);
    public get activeEditor(): Observable<Atom.TextEditor> { return this._activeEditorObservable; }

    public cfgUseIcons: boolean;
    public cfgUseLeftLabelColumnForSuggestions: boolean;

    public activate(state) {
        atom.commands.add('atom-workspace', 'omnisharp-atom:toggle', () => this.toggle());
        atom.commands.add('atom-workspace', 'omnisharp-atom:new-application', () => this.generator.run("aspnet:app"));
        atom.commands.add('atom-workspace', 'omnisharp-atom:new-class', () => this.generator.run("aspnet:Class"));

        // This needs to be set earlier so that the auto-start can also connect
        // to the output
        var p = atom.workspace.addBottomPanel({
            item: document.createElement('span'),
            visible: false
        });
        this.outputView = p.item.parentElement;
        this.outputView.classList.add('omnisharp-atom-pane')
        React.render(React.createElement(DockWindow, { panel: p }), this.outputView);

        if (dependencyChecker.findAllDeps(this.getPackageDir())) {
            this.emitter = new Emitter;
            this.loadFeatures(state).toPromise().then(() => {
                ClientManager.activate(this);
                this.subscribeToEvents();
            });
        } else {
            _.map(dependencyChecker.errors() || [], missingDependency => console.error(missingDependency))
        }
    }

    public addCommand(commandName: string, callback: (...args: any[]) => any) {
        atom.commands.add("atom-text-editor", commandName, (event) => {
            var editor = atom.workspace.getActiveTextEditor();
            if (!editor) {
                return;
            };

            var grammarName = editor.getGrammar().name;
            if (grammarName === 'C#' || grammarName === 'C# Script File') {
                callback(event);
            }
        });
    };

    public onEditor(callback: (...args: any[]) => void) {
        return this.emitter.on('omnisharp-atom-editor', callback);
    }

    public onEditorDestroyed(callback: (path: string) => any) {
        return this.emitter.on('omnisharp-atom-editor-destroyed', (filePath) => callback(filePath))
    }

    public onConfigEditor(callback: (...args: any[]) => void) {
        return this.emitter.on('omnisharp-atom-config-editor', callback);
    }

    public onConfigEditorDestroyed(callback: (path: string) => any) {
        return this.emitter.on('omnisharp-atom-config-editor-destroyed', (filePath) => {
            callback(filePath);
        });
    }

    public getPackageDir() {
        return _.find(atom.packages.getPackageDirPaths(), function(packagePath) {
            return fs.existsSync(packagePath + "/omnisharp-atom");
        });
    }

    public loadFeatures(state) {
        var packageDir = this.getPackageDir();
        var featureDir = packageDir + "/omnisharp-atom/lib/omnisharp-atom/features";

        var features = Observable.fromNodeCallback(fs.readdir)(featureDir)
            .flatMap(files => Observable.from(files))
            .where(file => /\.js$/.test(file))
            .flatMap(file => Observable.fromNodeCallback(fs.stat)(featureDir + "/" + file).map(stat => ({ file, stat })))
            .where(z => !z.stat.isDirectory())
            .map(z => z.file)
            .map(file => new Feature(this, file));

        features.subscribe(feature => feature.invoke('activate', state));
        var result = features.toArray();
        result.subscribe(features => this.features = features);

        return result;
    }

    public subscribeToEvents() {
        this.observeEditors = atom.workspace.observeTextEditors((editor: Atom.TextEditor) => {
            var editorFilePath;
            var grammarName = editor.getGrammar().name;
            if (grammarName === 'C#' || grammarName === 'C# Script File') {
                this.emitter.emit('omnisharp-atom-editor', editor);
                editorFilePath = editor.buffer.file.path;
                editor.onDidDestroy(() => this.emitter.emit('omnisharp-atom-editor-destroyed', editorFilePath));
            } else if (grammarName === "JSON") {
                this.emitter.emit('omnisharp-atom-config-editor', editor);
                editor.onDidDestroy(() => this.emitter.emit('omnisharp-atom-config-editor-destroyed', editor.buffer.file.path));
            }

            this.detectAutoToggleGrammar(editor);
        });

        this.activeEditorAtomDisposable = atom.workspace.observeActivePaneItem((pane: any) => {
            if (pane && pane.getGrammar) {
                var grammarName = pane.getGrammar().name;
                if (grammarName === 'C#' || grammarName === 'C# Script File') {
                    this._activeEditor.onNext(pane);
                    return;
                }
            }

            // This will tell us when the editor is no longer an appropriate editor
            this._activeEditor.onNext(null);
        });

        atom.config.observe('omnisharp-atom.useIcons', (value) => {
            this.cfgUseIcons = value;
        })
        atom.config.observe('omnisharp-atom.useLeftLabelColumnForSuggestions', (value) => {
            this.cfgUseLeftLabelColumnForSuggestions = value;
        })
    }

    private detectAutoToggleGrammar(editor: Atom.TextEditor) {
        var grammar = editor.getGrammar();

        this.detectGrammar(editor, grammar);
        editor.onDidChangeGrammar((grammar: FirstMate.Grammar) => this.detectGrammar(editor, grammar));
    }

    private detectGrammar(editor: Atom.TextEditor, grammar: FirstMate.Grammar) {

        if (!atom.config.get('omnisharp-atom.autoStartOnCompatibleFile')) {
            return; //short out, if setting to not auto start is enabled
        }


        if (ClientManager.isOn && !this.menu)
            this.toggleMenu();

        if (grammar.name === 'C#') {
            if (ClientManager.isOff) {
                this.toggle();
            }
        } else if (grammar.name === "JSON") {
            if (path.basename(editor.getPath()) === "project.json") {
                if (ClientManager.isOff) {
                    this.toggle();
                }
            }
        } else if (grammar.name === "C# Script File") {
            if (ClientManager.isOff) {
                this.toggle()
            }
        }
    }

    private toggleMenu() {
        var menuJsonFile = this.getPackageDir() + "/omnisharp-atom/menus/omnisharp-menu.json";
        var menuJson = JSON.parse(fs.readFileSync(menuJsonFile, 'utf8'));
        this.menu = atom.menu.add(menuJson.menu);
    }

    public toggle() {
        var dependencyErrors = dependencyChecker.errors();
        if (dependencyErrors.length === 0) {
            if (ClientManager.isOff) {
                ClientManager.connect();
                this.toggleMenu();
            } else if (ClientManager.isOn) {
                //this.turnOffIcon();
                ClientManager.disconnect();

                if (this.menu) {
                    this.menu.dispose();
                    this.menu = null;
                }
            }
        } else {
            _.map(dependencyErrors, missingDependency => alert(missingDependency));
        }
    }

    public deactivate() {
        var ref, ref1, ref2;
        this.emitter.dispose();
        this.observeEditors.dispose();
        // This was not defined in .coffee
        //observePackagesActivated.dispose();
        this.features = null;
        this.statusBarView && React.unmountComponentAtNode(this.statusBarView.destroy());
        this.outputView && this.outputView.destroy();
        this.autoCompleteProvider && this.autoCompleteProvider.destroy();
        ClientManager.disconnect();
    }

    public consumeStatusBar(statusBar) {
        this.statusBar = statusBar;
        this.statusBarView = document.createElement("span")
        React.render(React.createElement(StatusBarComponent, {}), this.statusBarView);
        statusBar.addLeftTile({
            item: this.statusBarView,
            priority: -1000
        });
    }

    public consumeYeomanEnvironment(generatorService: { run(generator: string, path: string): void; start(prefix: string, path: string): void; }) {
        this.generator = generatorService;
    }

    public provideAutocomplete() {
        var {CompletionProvider} = require("./features/lib/completion-provider");
        this.autoCompleteProvider = CompletionProvider;
        return this.autoCompleteProvider;
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
        }
    }

}

var instance = new OmniSharpAtom
export = instance;
