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
        this.name = feature.replace('.ts', '')
        // TODO: Remove when all features are .st
            .replace('.coffee', '');;
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
    private emitter: Emissary.IEmitter;
    private statusBarView;
    private outputView;
    private autoCompleteProvider;
    private statusBar;

    public activate(state) {
        atom.commands.add('atom-workspace', 'omnisharp-atom:toggle', () => this.toggle());

        if (dependencyChecker.findAllDeps(this.getPackageDir())) {
            this.emitter = new Emitter;
            this.loadFeatures();

            _.each(this.features, x => x.invoke('activate', state));
            return this.subscribeToEvents();
        } else {
            return _.map(dependencyChecker.errors() || [], missingDependency => console.error(missingDependency))
        }
    }

    public onEditor(callback: Function) {
        return this.emitter.on('omnisharp-atom-editor', callback);
    }

    public onEditorDestroyed(callback: (path: string) => any) {
        return this.emitter.on('omnisharp-atom-editor-destroyed', (filePath) => callback(filePath))
    }

    public getPackageDir() {
        return _.find(atom.packages.packageDirPaths, function(packagePath) {
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
        return this.observeEditors = atom.workspace.observeTextEditors((editor: AtomCore.IEditor) => {
            var editorFilePath;
            if (editor.getGrammar().name === 'C#') {
                this.emitter.emit('omnisharp-atom-editor', editor);
                editorFilePath = editor.buffer.file.path;
                return editor.onDidDestroy(() => this.emitter.emit('omnisharp-atom-editor-destroyed', editorFilePath));
            }
        })
    }

    public buildStatusBarAndDock() {
        this.statusBar = new StatusBarView;
        return this.outputView = new DockView;
    }

    public toggle() {
        var dependencyErrors, i, len, missingDependency, results;
        dependencyErrors = dependencyChecker.errors();
        if (dependencyErrors.length === 0) {
            return OmniSharpServer.get().toggle();
        } else {
            results = [];
            for (i = 0, len = dependencyErrors.length; i < len; i++) {
                missingDependency = dependencyErrors[i];
                results.push(alert(missingDependency));
            }
            return results;
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
