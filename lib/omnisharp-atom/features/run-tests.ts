import _ = require('lodash');
import {CompositeDisposable, Subject, Observable, Disposable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import {dock} from "../atom/dock";
import {TestResultsWindow} from "../views/test-results-window";
import childProcess = require('child_process');

// Using this enum as the Omnisharp one is freaking out.
enum TestCommandType {
    All = 0,
    Fixture = 1,
    Single = 2
}

class RunTests implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private window: Rx.CompositeDisposable;
    public testResults: OmniSharp.OutputMessage[] = [];
    private lastRun: OmniSharp.Models.GetTestCommandResponse;

    public observe: {
        updated: Observable<Rx.ObjectObserveChange<RunTests>>;
        output: Observable<OmniSharp.OutputMessage[]>;
    };

    public activate() {
        this.disposable = new CompositeDisposable();

        var updated = Observable.ofObjectChanges(this);

        var output = Observable.ofArrayChanges(this.testResults).map(x => this.testResults);
        this.observe = {
            updated: updated,
            get output() { return output; }
        };

        this.disposable.add(Omni.listener.observeGettestcontext.subscribe((data) => {
            this.ensureWindowIsCreated();
            this.executeTests(data.response);
        }));

        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:run-all-tests', () => {
            this.makeRequest(TestCommandType.All);
        }));

        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:run-fixture-tests', () => {
            this.makeRequest(TestCommandType.Fixture);
        }));

        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:run-single-test', () => {
            this.makeRequest(TestCommandType.Single);
        }));

        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:run-last-test', () => {
            this.executeTests(this.lastRun);
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    private makeRequest(type: TestCommandType) {
        Omni.request(client => client.gettestcontextPromise(client.makeDataRequest<OmniSharp.Models.TestCommandRequest>({
            Type: <any>type
        })));
    }

    private executeTests(response: OmniSharp.Models.GetTestCommandResponse) {
        this.testResults.length = 0;
        this.lastRun = response;

        var child = childProcess.exec(response.TestCommand, { cwd: response.Directory });

        child.stdout.on('data', (data) => {
            this.testResults.push({ message: data, logLevel: '' });
        });

        child.stderr.on('data', (data) => {
            this.testResults.push({message: data, logLevel: 'fail' });
        });

        dock.selectWindow('test-output');
    }

    private ensureWindowIsCreated() {
        if (!this.window) {
            this.window = new CompositeDisposable();

            var windowDisposable = dock.addWindow('test-output', 'Test output', TestResultsWindow, {
                runTests: this
            }, {
                priority: 2000,
                closeable: true
            }, this.window);
            this.window.add(windowDisposable);
            this.window.add(Disposable.create(() => {
                this.disposable.remove(this.window);
                this.window = null;
            }));
            this.disposable.add(this.window);
        }
    }
}

export var runTests = new RunTests;
