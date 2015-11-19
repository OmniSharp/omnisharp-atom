import {Observable, CompositeDisposable, Disposable} from "rx";
import Omni = require("../../omni-sharp-server/omni");
import * as _ from "lodash";
import {dock} from "../atom/dock";
import {SolutionStatusCard, ICardProps} from "../views/solution-status-view";
import {ViewModel} from "../../omni-sharp-server/view-model";
import manager from "../../omni-sharp-server/solution-manager";
import {DriverState} from "omnisharp-client";
import * as React from "react";
import * as $ from "jquery";

class SolutionInformation implements IFeature {
    private disposable: CompositeDisposable;
    private window: CompositeDisposable;
    public selectedIndex: number = 0;
    private card: SolutionStatusCard<ICardProps>;
    private cardDisposable: Disposable;
    private container: Element;

    public observe: {
        solutions: Observable<ViewModel[]>;
        updates: Observable<Rx.ObjectObserveChange<SolutionInformation>>;
    }

    public solutions: ViewModel[] = [];

    public activate() {
        this.disposable = new CompositeDisposable();

        const solutions = this.setupSolutions();
        this.observe = { solutions, updates: Observable.ofObjectChanges(this) };

        this.disposable.add(manager.activeSolution.subscribe(model => this.selectedIndex = _.findIndex(manager.activeSolutions, { index: model.index })));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:next-solution-status", () => {
            this.updateSelectedItem(this.selectedIndex + 1);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:solution-status", () => {
            if (this.cardDisposable) {
                this.cardDisposable.dispose();
            } else {
                this.cardDisposable = this.createSolutionCard();
            }
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:previous-solution-status", () => {
            this.updateSelectedItem(this.selectedIndex - 1);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:stop-server", () => {
            manager.activeSolutions[this.selectedIndex].dispose();
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:start-server", () => {
            manager.activeSolutions[this.selectedIndex].connect();
        }));

        this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:restart-server", () => {
            const solution = manager.activeSolutions[this.selectedIndex];
            solution.state
                .where(z => z == DriverState.Disconnected)
                .take(1)
                .delay(500)
                .subscribe(() => {
                    solution.connect();
                });
            solution.dispose();
        }));
    }

    private updateSelectedItem(index: number) {
        if (index < 0)
            index = this.solutions.length - 1;
        if (index >= this.solutions.length)
            index = 0;
        if (this.selectedIndex !== index)
            this.selectedIndex = index;

        if (this.card) {
            this.card.updateCard({
                model: this.solutions[this.selectedIndex],
                count: this.solutions.length
            });
        }
    }

    private setupSolutions() {
        const solutions = Observable.ofArrayChanges(manager.activeSolutions)
            .map(() => manager.activeSolutions)
            .startWith(manager.activeSolutions)
            .map(x=> x.map(z => z.model))
            .share();

        this.disposable.add(solutions.subscribe(o => {
            this.solutions = o;
            this.updateSelectedItem(this.selectedIndex);
        }));
        return solutions;
    }

    private createSolutionCard() {
        const disposable = new CompositeDisposable();
        this.disposable.add(disposable);
        const workspace = <any>atom.views.getView(atom.workspace);
        if (!this.container) {
            const container = this.container = document.createElement("div");
            workspace.appendChild(container);
        }

        if (this.solutions.length) {
            const element: SolutionStatusCard<ICardProps> = <any>React.render(React.createElement(SolutionStatusCard, {
                model: this.solutions[this.selectedIndex],
                count: this.solutions.length,
                attachTo: ".projects-icon"
            }), this.container);

            this.card = element;

            disposable.add(atom.commands.add("atom-workspace", "core:cancel", () => {
                disposable.dispose();
                this.disposable.remove(disposable);
            }));

            disposable.add(Disposable.create(() => {
                React.unmountComponentAtNode(this.container);
                this.card = null;
                this.cardDisposable = null;
            }));
        } else {
            if (this.cardDisposable) {
                this.cardDisposable.dispose();
            }

            const notice = <any>React.render(React.DOM.div({}, "Solution not loaded!"), this.container);

            disposable.add(Disposable.create(() => {
                React.unmountComponentAtNode(this.container);
                this.card = null;
                this.cardDisposable = null;
            }));

        }

        return disposable;
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = "Solution Information";
    public description = "Monitors each running solution and offers the ability to start/restart/stop a solution.";
}

export const solutionInformation = new SolutionInformation;
