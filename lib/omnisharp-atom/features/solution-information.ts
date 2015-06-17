import {Observable, CompositeDisposable, Disposable} from "rx";
import Omni = require("../../omni-sharp-server/omni");
import * as _ from 'lodash';
import {dock} from "../atom/dock";
import {SolutionStatusCard, ICardProps} from '../views/solution-status-view';
import {ViewModel} from "../../omni-sharp-server/view-model";
import manager = require("../../omni-sharp-server/client-manager");
import React = require('react');
import $ = require('jquery');

class SolutionInformation implements OmniSharp.IFeature {
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

    public solutions: ViewModel[] = manager.activeClients.map(z => z.model);

    public activate() {
        this.disposable = new CompositeDisposable();

        var solutions = this.setupSolutions();
        this.observe = { solutions, updates: Observable.ofObjectChanges(this) };

        this.disposable.add(manager.activeClient.subscribe(model => this.selectedIndex = _.findIndex(manager.activeClients, { index: model.index })));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:next-solution-status', () => {
            this.updateSelectedItem(this.selectedIndex + 1);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:solution-status', () => {
            if (this.cardDisposable) {
                this.cardDisposable.dispose();
            } else {
                this.cardDisposable = this.createSolutionCard();
            }
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:previous-solution-status', () => {
            this.updateSelectedItem(this.selectedIndex - 1);
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:stop-server', () => {
            manager.activeClients[this.selectedIndex].disconnect();
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:start-server', () => {
            manager.activeClients[this.selectedIndex].connect();
        }));

        this.disposable.add(atom.commands.add("atom-workspace", 'omnisharp-atom:restart-server', () => {
            manager.activeClients[this.selectedIndex].disconnect();
            manager.activeClients[this.selectedIndex].connect();
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
        var solutions = Observable.ofArrayChanges(manager.activeClients)
            .map(() => manager.activeClients.map(z => z.model))
            .share();

        this.disposable.add(solutions.subscribe(o => {
            this.solutions = o;
            this.updateSelectedItem(this.selectedIndex);
        }));
        return solutions;
    }

    private createSolutionCard() {
        var disposable = new CompositeDisposable();
        this.disposable.add(disposable);
        var workspace = <any>atom.views.getView(atom.workspace);
        if (!this.container) {
            var container = this.container = document.createElement("div");
            workspace.appendChild(container);
        }

        if (this.solutions.length) {
            var element: SolutionStatusCard<ICardProps> = <any>React.render(React.createElement(SolutionStatusCard, {
                model: this.solutions[this.selectedIndex],
                count: this.solutions.length,
                attachTo: '.projects-icon'
            }), this.container);

            this.card = element;

            disposable.add(atom.commands.add("atom-workspace", 'core:cancel', () => {
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

            var notice = <any>React.render(React.DOM.div({}, "Solution not loaded!"), this.container);

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
}

export var solutionInformation = new SolutionInformation;
