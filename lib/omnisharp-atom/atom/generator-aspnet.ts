import {CompositeDisposable, Disposable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import StatusBarComponent = require('../views/status-bar-view');
import React = require('react');
import {each, delay} from "lodash";

// TODO: Make sure it stays in sync with
var commands = [
    'AngularController',
    'AngularControllerAs',
    'AngularDirective',
    'AngularFactory',
    'AngularModule',
    'BowerJson',
    'Class',
    'CoffeeScript',
    'Config',
    'gitignore',
    'Gruntfile',
    'Gulpfile',
    'HTMLPage',
    'Interface',
    'JavaScript',
    'JScript',
    'JSON',
    'JSONSchema',
    'JSX',
    'Middleware',
    'MvcController',
    'MvcView',
    'PackageJson',
    'StartupClass',
    'StyleSheet',
    'StyleSheetLess',
    'StyleSheetSCSS',
    'TagHelper',
    'TextFile',
    'TypeScript',
    'TypeScriptConfig',
    'WebApiController'
];

class GeneratorAspnet implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private generator: {
        run(generator: string, path?: string, options?: any): void; start(prefix: string, path?: string, options?: any): void;
        list(prefix?: string, path?: string, options?: any): Promise<{ displayName: string; name: string; resolved: string; }[]>
    };

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:new-application', () => this.run("aspnet:app")));
        this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:new-class', () => this.run("aspnet:Class")));

        each(commands, command => {
            this.disposable.add(atom.commands.add('atom-workspace', `omnisharp-atom:aspnet-${command}`, () => this.run(`aspnet:${command}`)));
        })
    }

    private run(command: string) {
        if (this.generator) {
            this.generator.run(command, undefined, { promptOnZeroDirectories: true });
        }
    }

    public setup(generator) {
        this.generator = generator;

    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = 'Aspnet Yeoman Generator';
    public description = 'Enables the aspnet yeoman generator.';
}

export var generatorAspnet = new GeneratorAspnet;
