import _ = require('lodash')
import fs = require('fs')
import a = require("atom")
var Emitter = (<any>a).Emitter

import OmniSharpServer = require('../omni-sharp-server/omni-sharp-server')
import Omni = require('../omni-sharp-server/omni')

import CompletionProvider = require("./features/lib/completion-provider")
import dependencyChecker = require('./dependency-checker')
import StatusBarView = require('./views/status-bar-view')
import DockView = require('./views/dock-view')

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
    private observeEditors: {dispose: Function};
    private emitter: EventKit.Emitter;
    public statusBarView;
    public outputView;
    private autoCompleteProvider;
    private statusBar;

    public activate(state) {
        atom.commands.add('atom-workspace', 'omnisharp-atom:toggle', () => this.toggle());

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

    public onConfigEditor(callback: (path: string) => any) {
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
            (file: string) => !fs.statSync(featureDir + "/" + file).isDirectory()
            );

        var features = _.map(featureFiles, (feature: string) => new Feature(this, feature));
        return features;
    }
    public subscribeToEvents() {
        return this.observeEditors = atom.workspace.observeTextEditors((editor: Atom.TextEditor) => {
            var editorFilePath;
            var grammarName = editor.getGrammar().name;
            if (grammarName === 'C#') {
                this.emitter.emit('omnisharp-atom-editor', editor);
                editorFilePath = editor.buffer.file.path;
                return editor.onDidDestroy(() => this.emitter.emit('omnisharp-atom-editor-destroyed', editorFilePath));
            } else if (grammarName=== "JSON") {
                this.emitter.emit('omnisharp-atom-config-editor', editor);
                return editor.onDidDestroy(() => this.emitter.emit('omnisharp-atom-config-editor-destroyed', editor.buffer.file.path));
            }
        })
    }

    public buildStatusBarAndDock() {
        this.statusBar = new StatusBarView;
        return this.outputView = new DockView;
    }

    public toggle() {
        var dependencyErrors = dependencyChecker.errors();
        if (dependencyErrors.length === 0) {
            return OmniSharpServer.get().toggle();
        } else {
            return _.map(dependencyErrors, missingDependency => alert(missingDependency));
        }
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
        return OmniSharpServer.get().stop();
    }

    public consumeStatusBar(statusBar) {
        this.statusBarView = new StatusBarView(statusBar);
        return this.outputView = new DockView;
    }

    public provideAutocomplete() {
        this.autoCompleteProvider = new CompletionProvider;
        return {
            provider: this.autoCompleteProvider
        };
    }

}

var instance = new OmniSharpAtom
export = instance;
