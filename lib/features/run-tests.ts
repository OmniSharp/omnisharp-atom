import * as childProcess from 'child_process';
import {Models} from 'omnisharp-client';
import {Observable, Subject} from 'rxjs';
import {CompositeDisposable, Disposable} from 'ts-disposables';
import {dock} from '../atom/dock';
import {Omni} from '../server/omni';
import {TestResultsWindow} from '../views/test-results-window';

// Using this enum as the Omnisharp one is freaking out.
enum TestCommandType {
    All = 0,
    Fixture = 1,
    Single = 2
}

class RunTests implements IFeature {
    public required = true;
    public title = 'Test Runner';
    public description = 'Adds support for running tests within atom.';

    public testResults: OutputMessage[] = [];
    public observe: {
        output: Observable<OutputMessage[]>;
    };

    private disposable: CompositeDisposable;
    private window: CompositeDisposable;
    private lastRun: Models.GetTestCommandResponse;
    private _testWindow: TestResultsWindow;

    public activate() {
        this.disposable = new CompositeDisposable();
        this._testWindow = new TestResultsWindow();

        const output = new Subject<OutputMessage[]>();
        this.observe = {
            output: <Observable<OutputMessage[]>><any>output
        };

        this.disposable.add(Omni.listener.gettestcontext.subscribe(data => {
            this._ensureWindowIsCreated();
            this._executeTests(data.response);
        }));

        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:run-all-tests', () => {
            this._makeRequest(TestCommandType.All);
        }));

        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:run-fixture-tests', () => {
            this._makeRequest(TestCommandType.Fixture);
        }));

        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:run-single-test', () => {
            this._makeRequest(TestCommandType.Single);
        }));

        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:run-last-test', () => {
            this._executeTests(this.lastRun);
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    private _makeRequest(type: TestCommandType) {
        Omni.request(solution => solution.gettestcontext({ Type: <any>type }));
    }

    private _executeTests(response: Models.GetTestCommandResponse) {
        this.testResults.length = 0;
        this.lastRun = response;

        this._testWindow.clear();

        const child = childProcess.exec(response.TestCommand, { cwd: response.Directory });

        child.stdout.on('data', (data: any) => {
            this._testWindow.addMessage({ message: data, logLevel: '' });
        });

        child.stderr.on('data', (data: any) => {
            this._testWindow.addMessage({ message: data, logLevel: 'fail' });
        });

        dock.selectWindow('test-output');
    }

    private _ensureWindowIsCreated() {
        if (!this.window) {
            this.window = new CompositeDisposable();

            const windowDisposable = dock.addWindow('test-output', 'Test output', this._testWindow, { priority: 2000, closeable: true }, this.window);
            this.window.add(windowDisposable);
            this.window.add(Disposable.create(() => {
                this.disposable.remove(this.window);
                this.window = null;
            }));
            this.disposable.add(this.window);
        }
    }
}

// tslint:disable-next-line:export-name
export const runTests = new RunTests();
