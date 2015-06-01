import {Observable, CompositeDisposable, Disposable} from "rx";
import Omni = require("../../omni-sharp-server/omni");
import * as _ from 'lodash';
import {dock} from "../atom/dock";
import {SolutionStatusWindow} from '../views/solution-status-view';
import ViewModel = require('../../omni-sharp-server/view-model');
import manager = require("../../omni-sharp-server/client-manager");

class SolutionInformation implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    private window: CompositeDisposable;

    public observe: {
        solutions: Observable<ViewModel[]>;
        updates: Observable<Rx.ObjectObserveChange<SolutionInformation>>;
    }

    public solutions: ViewModel[] = manager.activeClients.map(z => z.model);

    public activate() {
        this.disposable = new CompositeDisposable();

        var solutions = this.setupSolutions();
        this.observe = { solutions, updates: Observable.ofObjectChanges(this) };

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:solutions", (e) => {
            if (this.window && dock.isOpen && dock.selected === "solutions") {
                dock.hide();
            } else {
                this.createSolutionsWindow();
                dock.selectWindow("solutions");
            }
        }));
    }

    private setupSolutions() {
        var solutions = Observable.ofArrayChanges(manager.activeClients)
            .map(() => manager.activeClients.map(z => z.model))
            .share();

        this.disposable.add(solutions.subscribe(o =>
             this.solutions = o));
        return solutions;
    }

    private createSolutionsWindow() {
        if (!this.window) {
            this.window = new CompositeDisposable();
            var windowDisposable = dock.addWindow('solutions', 'Active Solutions', SolutionStatusWindow, {
                solutionInformation: this
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
