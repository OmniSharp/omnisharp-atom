import {Models} from "omnisharp-client";
import {Observable, Subject} from "rxjs";
import {CompositeDisposable, Disposable} from "ts-disposables";
import {Omni} from "../server/omni";
import {dock} from "../atom/dock";
import {TestResultsWindow} from "../views/test-results-window";
import * as childProcess from "child_process";

// Using this enum as the Omnisharp one is freaking out.
enum TestCommandType {
    All = 0,
    Fixture = 1,
    Single = 2
}

class RunTests implements IFeature {
    private disposable: CompositeDisposable;
    private window: CompositeDisposable;
    public testResults: OutputMessage[] = [];
    private lastRun: Models.GetTestCommandResponse;
    private _testWindow: TestResultsWindow;

    public observe: {
        output: Observable<OutputMessage[]>;
    };

    public activate() {
        this.disposable = new CompositeDisposable();
        this._testWindow = new TestResultsWindow;

        const output = new Subject<OutputMessage[]>();
        this.observe = {
            output: <Observable<OutputMessage[]>><any>output
        };

        this.disposable.add(Omni.listener.gettestcontext.subscribe((data) => {
            this.ensureWindowIsCreated();
            this.executeTests(data.response);
        }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:run-all-tests", () => {
            this.makeRequest(TestCommandType.All);
        }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:run-fixture-tests", () => {
            this.makeRequest(TestCommandType.Fixture);
        }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:run-single-test", () => {
            this.makeRequest(TestCommandType.Single);
        }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:run-last-test", () => {
            this.executeTests(this.lastRun);
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    private makeRequest(type: TestCommandType) {
        Omni.request(solution => solution.gettestcontext({ Type: <any>type }));
    }

    private executeTests(response: Models.GetTestCommandResponse) {
        this.testResults.length = 0;
        this.lastRun = response;

        this._testWindow.clear();

        const child = childProcess.exec(response.TestCommand, { cwd: response.Directory });

        child.stdout.on("data", (data: any) => {
            this._testWindow.addMessage({ message: data, logLevel: "" });
        });

        child.stderr.on("data", (data: any) => {
            this._testWindow.addMessage({ message: data, logLevel: "fail" });
        });

        dock.selectWindow("test-output");
    }

    private ensureWindowIsCreated() {
        if (!this.window) {
            this.window = new CompositeDisposable();

            const windowDisposable = dock.addWindow("test-output", "Test output", this._testWindow, { priority: 2000, closeable: true }, this.window);
            this.window.add(windowDisposable);
            this.window.add(Disposable.create(() => {
                this.disposable.remove(this.window);
                this.window = null;
            }));
            this.disposable.add(this.window);
        }
    }

    public required = true;
    public title = "Test Runner";
    public description = "Adds support for running tests within atom.";
}

export const runTests = new RunTests;
