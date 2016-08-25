import {Models} from "omnisharp-client";
import {CompositeDisposable, Disposable} from "ts-disposables";
import {ProjectViewModel} from "../server/project-view-model";
import {Omni} from "../server/omni";
import {FrameworkSelectorComponent} from "../views/framework-selector-view";

class FrameworkSelector implements IAtomFeature {
    private disposable: CompositeDisposable;
    private view: HTMLSpanElement;
    private statusBar: any;
    private _active = false;
    public project: ProjectViewModel<any>;
    private _component: FrameworkSelectorComponent;

    public activate() {
        this.disposable = new CompositeDisposable();
    }

    public setup(statusBar: any) {
        this.statusBar = statusBar;

        if (this._active) {
            this._attach();
        }
    }

    public attach() {
        if (this.statusBar) { this._attach(); }
        this._active = true;
    }

    private _attach() {
        this.view = document.createElement("span");
        this.view.classList.add("inline-block");
        this.view.classList.add("framework-selector");
        this.view.style.display = "none";

        let tile: any;
        if (atom.config.get("grammar-selector.showOnRightSideOfStatusBar")) {
            tile = this.statusBar.addRightTile({
                item: this.view,
                priority: 9
            });
        } else {
            tile = this.statusBar.addLeftTile({
                item: this.view,
                priority: 11
            });
        }

        this._component = new FrameworkSelectorComponent;
        this._component.alignLeft = !atom.config.get("grammar-selector.showOnRightSideOfStatusBar");
        this.view.appendChild(this._component);

        this.disposable.add(Disposable.create(() => {
            tile.destroy();
            this.view.remove();
        }));

        this.disposable.add(Omni.activeEditor
            .filter(z => !z)
            .subscribe(() => this.view.style.display = "none"));

        this.disposable.add(Omni.activeProject
            .filter(z => z.frameworks.length === 1)
            .subscribe(() => this.view.style.display = "none"));

        this.disposable.add(Omni.activeProject
            .subscribe(project => {
                this.view.style.display = "";

                const {frameworks, activeFramework} = project;
                this.project = project;
                this._component.frameworks = frameworks;
                this._component.activeFramework = activeFramework;
            }));

        this.disposable.add(Omni.activeFramework
            .subscribe(ctx => {
                this.view.style.display = "";

                const {project, framework} = ctx;
                this.project = project;
                this._component.frameworks = project.frameworks;
                this._component.activeFramework = framework;
            }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public setActiveFramework(framework: Models.DotNetFramework) {
        if (this.project) {
            this.project.activeFramework = framework;
            this._component.activeFramework = framework;
        }
    }

    public required = true;
    public title = "Framework Selector";
    public description = "Lets you select the framework you\"re currently targeting.";
}

export const frameworkSelector = new FrameworkSelector;
