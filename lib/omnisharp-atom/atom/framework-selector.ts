import {CompositeDisposable, Observable} from "rx";
import {ProjectViewModel} from "../../omni-sharp-server/view-model";
import Omni = require('../../omni-sharp-server/omni')
import {FrameworkSelectorComponent} from '../views/framework-selector-view';
import React = require('react');

class FrameworkSelector implements OmniSharp.IAtomFeature {
    private disposable: Rx.CompositeDisposable;
    private view: HTMLSpanElement;
    private tile: any;
    private statusBar: any;
    private _active = false;
    public project: ProjectViewModel;
    private _component: FrameworkSelectorComponent;

    public activate() {
        this.disposable = new CompositeDisposable();
    }

    public setup(statusBar) {
        this.statusBar = statusBar;

        if (this._active) {
            this._attach();
        }
    }

    public attach() {
        this.view = document.createElement("span");
        this.view.classList.add('inline-block');
        this.view.classList.add('framework-selector')
        if (this.statusBar) { this._attach(); }
        this._active = true;
    }

    private _attach() {
        if (atom.config.get('grammar-selector.showOnRightSideOfStatusBar')) {
            this.statusBar.addRightTile({
                item: this.view,
                priority: 9
            });
        } else {
            this.statusBar.addLeftTile({
                item: this.view,
                priority: 11
            });
        }

        this._component = <any>React.render(React.createElement(FrameworkSelectorComponent, { alignLeft: !atom.config.get('grammar-selector.showOnRightSideOfStatusBar') }), this.view);

        this.disposable.add(Omni.activeEditor
            .where(z => !z)
            .subscribe(() => this.view.style.display = 'none'));

        this.disposable.add(Omni.activeEditor
            .where(z => !!z)
            .subscribe(() => this.view.style.display = ''));

        this.disposable.add(Omni.activeProject
            .where(z => !z.frameworks.length)
            .subscribe(() => this.view.style.display = 'none'));

        this.disposable.add(Omni.activeProject
            .subscribe(project => {
                this.project = project;
                var {frameworks, activeFramework} = project;
                this._component.setState({ frameworks: frameworks, activeFramework });
            }));
    }

    public dispose() {
        React.unmountComponentAtNode(this.view);
        this.tile.destroy();
        this.disposable.dispose();
    }

    public setActiveFramework(framework: OmniSharp.Models.DnxFramework) {
        if (this.project) {
            this.project.activeFramework = framework;
            this._component.setState({ activeFramework: framework })
        }
    }
}

export var frameworkSelector = new FrameworkSelector;
