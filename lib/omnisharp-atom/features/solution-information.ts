import {Observable, CompositeDisposable, Disposable} from "rx";
import Omni = require("../../omni-sharp-server/omni");
import * as _ from 'lodash';
import {dock} from "../atom/dock";
import {SolutionStatusWindow} from '../views/solution-status-view';
import Client = require('../../omni-sharp-server/client');
import manager = require("../../omni-sharp-server/client-manager");

class SolutionInformation implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    private window: CompositeDisposable;

    public observe: {
        solutions: Observable<Client[]>;
        updates: Observable<Rx.ObjectObserveChange<SolutionInformation>>;
    }

    public solutions: Client[] = manager.activeClients;

    public activate() {
        this.disposable = new CompositeDisposable();

        var solutions = this.setupSolutions();
        this.observe = { solutions, updates: Observable.ofObjectChanges(this) };

        Omni.addCommand("atom-workspace", "omnisharp-atom:solutions", (e) => {
            this.createSolutionsWindow();
            dock.selectWindow("solutions");
        });
    }

    private setupSolutions() {
        var solutions = Observable.ofArrayChanges(manager.activeClients)
            .map(() => manager.activeClients)
            .share();

        this.disposable.add(solutions.subscribe(o =>
             this.solutions = o));
        return solutions;
    }

    private createSolutionsWindow() {
        if (!this.window) {
            this.window = new CompositeDisposable();
            var windowDisposable = dock.addWindow('solutions', 'Active Solutions', SolutionStatusWindow, {
                solutions: this
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

    public dispose() {
        this.disposable.dispose();
    }
}

export var solutionInformation = new SolutionInformation;
