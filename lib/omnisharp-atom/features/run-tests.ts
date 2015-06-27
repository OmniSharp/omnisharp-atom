import _ = require('lodash');
import {CompositeDisposable, Subject, Observable, Disposable} from "rx";
import Omni = require('../../omni-sharp-server/omni')
import {dock} from "../atom/dock";
import {TestResultsWindow} from "../views/test-results-window";

class RunTests implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private window: Rx.CompositeDisposable;
    public testResults: string[] = ['what'];
    public foo: string;

    public observe: {
        updated: Observable<Rx.ObjectObserveChange<RunTests>>;
        output: any;
    };

    public activate() {
        this.disposable = new CompositeDisposable();

        var updated = Observable.ofObjectChanges(this);

        this.observe = {
            updated: updated,
            get output() { return Observable.fromArray(['somethign']); }
        };

        this.disposable.add(Omni.listener.observeGettestcontext.subscribe((data) => {
            this.ensureWindowIsCreated();
        }));

        this.disposable.add(Omni.addTextEditorCommand('omnisharp-atom:run-tests', () => {
            //store the editor that this was triggered by.
            Omni.request(client => client.gettestcontextPromise(client.makeDataRequest<OmniSharp.Models.TestCommandRequest>({
                Type: 2
            })));
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    private ensureWindowIsCreated() {
        if (!this.window) {
            this.window = new CompositeDisposable();
            debugger;
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
