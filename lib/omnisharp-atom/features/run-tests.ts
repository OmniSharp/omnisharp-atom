import {Models} from "omnisharp-client";
import {CompositeDisposable, Observable, Disposable, Subject} from "rx";
import {Omni} from "../../omni-sharp-server/omni";
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
    private disposable: Rx.CompositeDisposable;
    private window: Rx.CompositeDisposable;
    private _output: Rx.Subject<OutputMessage[]>;
    public testResults: OutputMessage[] = [];
    private lastRun: Models.GetTestCommandResponse;

    public observe: {
        output: Observable<OutputMessage[]>;
    };

    public activate() {
        this.disposable = new CompositeDisposable();

        const output = this._output = new Subject<OutputMessage[]>();
        this.observe = {
            output: output.asObservable()
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

        const child = childProcess.exec(response.TestCommand, { cwd: response.Directory });

        child.stdout.on("data", (data: any) => {
            this.testResults.push({ message: data, logLevel: "" });
            this._output.onNext(this.testResults);
        });

        child.stderr.on("data", (data: any) => {
            this.testResults.push({ message: data, logLevel: "fail" });
            this._output.onNext(this.testResults);
        });

        dock.selectWindow("test-output");
    }

    private ensureWindowIsCreated() {
        if (!this.window) {
            this.window = new CompositeDisposable();

            const windowDisposable = dock.addWindow("test-output", "Test output", TestResultsWindow, {
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

    public required = true;
    public title = "Test Runner";
    public description = "Adds support for running tests within atom.";
}

export const runTests = new RunTests;
