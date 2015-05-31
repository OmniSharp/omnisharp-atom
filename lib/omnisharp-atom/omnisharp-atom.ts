require('./configure-rx');
import _ = require('lodash');
import {Observable, BehaviorSubject, Subject} from "rx";
import path = require('path');
import fs = require('fs');
import a = require("atom");
var Emitter = (<any>a).Emitter

// TODO: Remove these at some point to stream line startup.
//import Omni = require('../omni-sharp-server/omni');
import ClientManager = require('../omni-sharp-server/client-manager');
import dependencyChecker = require('./dependency-checker');
import StatusBarComponent = require('./views/status-bar-view');
import DockWindow = require('./views/dock-view');
import React = require('react');

class Feature {
    public name: string;
    public path: string;
    public instance: OmniSharp.IFeature;

    constructor(atom: OmniSharpAtom, feature: string) {
        this.name = feature.replace('.ts', '');
        this.path = "./features/" + feature;
        this.instance = require(this.path);
    }
}

class OmniSharpAtom {
    private features: Feature[];
    private emitter: EventKit.Emitter;
    private disposable: Rx.CompositeDisposable;
    private statusBarView;
    private outputView;
    private autoCompleteProvider;
    private statusBar;
    private generator: { run(generator: string, path?: string): void; start(prefix: string, path?: string): void; };
    private menu: EventKit.Disposable;

    private _editor = new Subject<Atom.TextEditor>();
    public get editors(): Observable<Atom.TextEditor> { return this._editor; }

    private _configEditor = new Subject<Atom.TextEditor>();
    public get configEditors(): Observable<Atom.TextEditor> { return this._configEditor; }

    private _activeEditor = new BehaviorSubject<Atom.TextEditor>(null);
    private _activeEditorObservable = this._activeEditor.shareReplay(1);
    public get activeEditor(): Observable<Atom.TextEditor> { return this._activeEditorObservable; }

    public activate(state) {

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

            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:toggle', () => this.toggle()));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:new-application', () => this.generator.run("aspnet:app")));
            this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:new-class', () => this.generator.run("aspnet:Class")));
            this.disposable.add(this.emitter);

            this.loadFeatures(state).toPromise().then(() => {
                ClientManager.activate(this);
                this.subscribeToEvents();
            });
        } else {
            _.map(dependencyChecker.errors() || [], missingDependency => console.error(missingDependency))
        }
    }

    public onEditor(callback: (...args: any[]) => void) {
        return this.emitter.on('omnisharp-atom-editor', callback);
    }

    public onConfigEditor(callback: (...args: any[]) => void) {
        return this.emitter.on('omnisharp-atom-config-editor', callback);
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

        var result = features.toArray();
        result.subscribe(features => {
            this.features = features;
            _.each(this.features, f => {
                f.instance.activate();
                this.disposable.add(f.instance);
            });


        })

        return result;
    }

    public subscribeToEvents() {
        this.disposable.add(atom.workspace.observeTextEditors((editor: Atom.TextEditor) => {
            var editorFilePath;
            var grammarName = editor.getGrammar().name;
            if (grammarName === 'C#' || grammarName === 'C# Script File') {
                this._editor.onNext(editor);
                editorFilePath = editor.buffer.file.path;
            } else if (grammarName === "JSON") {
                this._configEditor.onNext(editor);
            }

            this.detectAutoToggleGrammar(editor);
        }));

        this.disposable.add(atom.workspace.observeActivePaneItem((pane: any) => {
            if (pane && pane.getGrammar) {
                var grammarName = pane.getGrammar().name;
                if (grammarName === 'C#' || grammarName === 'C# Script File') {
                    this._activeEditor.onNext(pane);
                    return;
                }
            }

            // This will tell us when the editor is no longer an appropriate editor
            this._activeEditor.onNext(null);
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

        if (ClientManager.isOn && !this.menu) {
            this.toggleMenu();
        }

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
        this.disposable.add(this.menu);
    }

    public toggle() {
        var dependencyErrors = dependencyChecker.errors();
        if (dependencyErrors.length === 0) {
            if (ClientManager.isOff) {
                ClientManager.connect();
                this.toggleMenu();
            } else if (ClientManager.isOn) {
                ClientManager.disconnect();

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
        }
    }

}

var instance = new OmniSharpAtom
export = instance;
