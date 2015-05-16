import _ = require('lodash')
import fs = require('fs')
import a = require("atom")
var Emitter = (<any>a).Emitter

import Omni = require('../omni-sharp-server/omni')
import ClientManager = require('../omni-sharp-server/client-manager')

import CompletionProvider = require("./features/lib/completion-provider")
import dependencyChecker = require('./dependency-checker')
import StatusBarView = require('./views/status-bar-view')
import DockView = require('./views/dock-view')
import path = require('path');
//import autoCompleteProvider = require('./features/lib/completion-provider');


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
    private emitter: EventKit.Emitter;
    public statusBarView;
    public outputView;
    private autoCompleteProvider;
    private statusBar;
    private generator: { run(generator: string, path?: string): void; start(prefix: string, path?: string): void; };
    private menu: EventKit.Disposable;

    public activate(state) {
        ClientManager.activate();
        atom.commands.add('atom-workspace', 'omnisharp-atom:toggle', () => this.toggle());
        atom.commands.add('atom-workspace', 'omnisharp-atom:new-application', () => this.generator.run("aspnet:app"));
        atom.commands.add('atom-workspace', 'omnisharp-atom:new-class', () => this.generator.run("aspnet:Class"));

        // This needs to be set earlier so that the auto-start can also connect
        // to the output
        this.outputView = new DockView(this);

        if (dependencyChecker.findAllDeps(this.getPackageDir())) {
            this.emitter = new Emitter;
            this.features = this.loadFeatures();

            _.each(this.features, x => x.invoke('activate', state));
            this.subscribeToEvents();
        } else {
            _.map(dependencyChecker.errors() || [], missingDependency => console.error(missingDependency))
        }
    }

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

    public loadFeatures() {
        var packageDir = this.getPackageDir();
        var featureDir = packageDir + "/omnisharp-atom/lib/omnisharp-atom/features";
        var featureFiles = _.filter(
            fs.readdirSync(featureDir),
            (file: string) => !fs.statSync(featureDir + "/" + file).isDirectory() && /\.ts$/.test(file)
            );

        var features = _.map(featureFiles, (feature: string) => new Feature(this, feature));
        return features;
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
        if (grammar.name === 'C#') {
            if (Omni.vm.isOff) {
                this.toggle();
            }
        } else if (grammar.name === "JSON") {
            if (path.basename(editor.getPath()) === "project.json") {
                if (Omni.vm.isOff) {
                    this.toggle();
                }
            }
        } else if (grammar.name === "C# Script File") {
            if (Omni.vm.isOff) {
                this.toggle()
            }
        }

    }

    public buildStatusBarAndDock() {
        this.statusBar = new StatusBarView;

        if (!this.outputView) {
            this.outputView = new DockView(this);
        }
    }

    public toggle() {
        var menuJsonFile = this.getPackageDir() + "/omnisharp-atom/menus/omnisharp-menu.json";
        var menuJson = JSON.parse(fs.readFileSync(menuJsonFile, 'utf8'));

        var dependencyErrors = dependencyChecker.errors();
        if (dependencyErrors.length === 0) {
            if (Omni.vm.isOff) {
                this.menu = atom.menu.add(menuJson.menu);
            } else if (this.menu) {
                this.turnOffIcon();
                this.menu.dispose();
                this.menu = null;
            }
        } else {
            _.map(dependencyErrors, missingDependency => alert(missingDependency));
        }
    }

    private turnOffIcon() {
        this.statusBarView.turnOffIcon();
    }

    public deactivate() {
        var ref, ref1, ref2;
        this.emitter.dispose();
        this.observeEditors.dispose();
        // This was not defined in .coffee
        //observePackagesActivated.dispose();
        this.features = null;
        this.statusBarView && this.statusBarView.destroy();
        this.outputView && this.outputView.destroy();
        this.autoCompleteProvider && this.autoCompleteProvider.destroy();
        Omni.client.disconnect();
    }

    public consumeStatusBar(statusBar) {
        this.statusBarView = new StatusBarView(statusBar);
        if (!this.outputView) {
            this.outputView = new DockView(this);
        }
    }

    public consumeYeomanEnvironment(generatorService: { run(generator: string, path: string): void; start(prefix: string, path: string): void; }) {

        console.log('generatorService')
        this.generator = generatorService;
    }

    public provideAutocomplete() {

        this.autoCompleteProvider = CompletionProvider.CompletionProvider;

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
        }
    }

}

var instance = new OmniSharpAtom
export = instance;
