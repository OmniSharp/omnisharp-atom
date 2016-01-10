const _: _.LoDashStatic = require("lodash");
import {Component} from "./component";
import {ViewModel} from "../server/view-model";
import {ProjectViewModel} from "../server/project-view-model";
import {DriverState} from "omnisharp-client";
import {CompositeDisposable}  from "rx";
const $: JQueryStatic = require("jquery");

function truncateStringReverse(str: string, maxLength = 55) {
    const reversedString = _.toArray(str).reverse().join("");
    return _.toArray(_.trunc(reversedString, maxLength)).reverse().join("");
}

export class ProjectDisplayElement extends HTMLDivElement implements WebComponent {
    private _project: ProjectViewModel<any>;
    public get project() { return this._project; }
    public set project(project) {
        this._project = project;
        this._key = project.path;

        const path = truncateStringReverse(project.path.replace(this.project.solutionPath, ""), 24);
        this.title = `${path} [${project.frameworks.filter(z => z.Name !== "all").map(x => x.FriendlyName)}]`;
        this.innerText = project.name;
    }

    private _key: string;
    public get key() { return this._key; }

    public createdCallback() {
        this.classList.add("project", "name");
    }
}

(<any>exports).ProjectDisplayElement = (<any>document).registerElement("omnisharp-project-element", { prototype: ProjectDisplayElement.prototype });

export class SolutionStatusCard extends Component {
    public displayName = "Card";

    private modelDisposable: CompositeDisposable;
    public attachTo: string;

    private _name: HTMLSpanElement;
    private _description: HTMLSpanElement;
    private _projects: HTMLDivElement;
    private _buttons: HTMLDivElement;

    private _stopBtn: HTMLButtonElement;
    private _startBtn: HTMLButtonElement;
    private _restartBtn: HTMLButtonElement;

    private _statusItem: HTMLSpanElement;
    private _statusText: HTMLSpanElement;
    private _runtimeText: HTMLSpanElement;

    private _count: number;
    public get count() { return this._count; }
    public set count(count) {
        if (this._count > 1) {
            this._buttons.style.display = "";
        } else {
            this._buttons.style.display = "none";
        }
    }

    private _model: ViewModel;
    public get model() { return this._model; }
    public set model(model) {
        this.modelDisposable.dispose();
        this.modelDisposable = new CompositeDisposable();

        this.modelDisposable.add(this._model.observe.state.subscribe(({state}) => {
            if (state === DriverState.Connected) {
                this._statusText.innerText = "Online";
            } else if (state === DriverState.Connecting) {
                this._statusText.innerText = "Loading";
            } else if (state === DriverState.Disconnected) {
                this._statusText.innerText = "Offline";
            }
            this._statusText.innerText = DriverState[state];
            this._statusItem.classList.add(DriverState[state].toLowerCase());

            this.verifyPosition();

            if (this.model.runtime) {
                this._runtimeText.style.display = "";
                this._runtimeText.innerText = this.model.runtime;
            } else {
                this._runtimeText.style.display = "none";
                this._runtimeText.innerText = "";
            }
        }));

        this.modelDisposable.add(this._model.observe.projects.subscribe(projects => {
            const add: ProjectDisplayElement[] = [];
            const remove: Element[] = [];
            if (this._projects.children.length > projects.length) {
                for (let i = this._projects.children.length - projects.length - 1; i < this._projects.children.length; i++) {
                    remove.push(this._projects.children[i]);
                }
            } else {
                for (let i = this._projects.children.length - 1; i < projects.length; i++) {
                    add.push(new exports.ProjectDisplayElement);
                }
            }

            window.requestAnimationFrame(() => {
                _.each(add, x => this._projects.appendChild(x));
                _.each(remove, x => x.remove());

                _.each(projects, (item, i) => {
                    const child: ProjectDisplayElement = <any>this._projects.children[i];
                    if (child.key !== item.path) {
                        child.project = item;
                    }
                });

                this.verifyPosition();
            });
        }));
    }

    private _getMetaControls() {
        this._stopBtn = document.createElement("button");
        this._stopBtn.classList.add("btn", "btn-xs", "btn-error");
        this._stopBtn.onclick = () => atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:stop-server");

        let span = document.createElement("span");
        span.classList.add("fa fa-stop");
        this._stopBtn.appendChild(span);
        this._stopBtn.innerHTML += " Stop";

        this._startBtn = document.createElement("button");
        this._startBtn.classList.add("btn", "btn-xs", "btn-success");
        this._startBtn.onclick = () => atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:start-server");

        span = document.createElement("span");
        span.classList.add("fa fa-play");
        this._startBtn.appendChild(span);
        this._startBtn.innerHTML += " Start";

        this._restartBtn = document.createElement("button");
        this._restartBtn.classList.add("btn", "btn-xs", "btn-info");
        this._restartBtn.onclick = () => atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:restart-server");

        span = document.createElement("span");
        span.classList.add("fa fa-refresh");
        this._restartBtn.appendChild(span);
        this._restartBtn.innerHTML += " Restart";

        const metaControls = document.createElement("div");
        metaControls.classList.add("meta-controls");

        const buttonGroup = document.createElement("div");
        buttonGroup.classList.add("btn-group");
        metaControls.appendChild(buttonGroup);

        buttonGroup.appendChild(this._stopBtn);
        buttonGroup.appendChild(this._stopBtn);
        buttonGroup.appendChild(this._restartBtn);

        return metaControls;
    }

    private _getStatusItem() {
        this._statusItem = document.createElement("span");
        this._statusItem.classList.add("pull-left", "stats-item");

        const statusContainer = document.createElement("span");
        this._statusItem.appendChild(statusContainer);
        this._statusText = document.createElement("span");
        statusContainer.appendChild(this._statusText);
        this._statusText.classList.add("icon", "icon-zap");

        return this._statusItem;
    }

    private _getVersions() {
        const versions = document.createElement("span");
        versions.classList.add("pull-right", "stats-item");

        const spans = document.createElement("span");
        spans.classList.add("icon", "icon-versions");
        versions.appendChild(spans);

        this._runtimeText = document.createElement("span");
        spans.appendChild(this._runtimeText);

        return versions;
    }

    private _getBody() {
        const body = document.createElement("div");
        body.classList.add("body");

        const header = document.createElement("h4");
        header.classList.add("name");
        body.appendChild(header);

        this._name = document.createElement("span");
        header.appendChild(this._name);

        this._description = document.createElement("name");
        body.appendChild(this._description);

        const versions = this._getVersions();
        body.appendChild(versions);

        const statusItem = this._getStatusItem();
        body.appendChild(statusItem);

        const metaControls = this._getMetaControls();
        body.appendChild(metaControls);

        return body;
    }

    private _getProjects() {
        this._projects = document.createElement("div");
        this._projects.classList.add("meta", "meta-projects");

        const header = document.createElement("div");
        header.classList.add("header");
        header.innerText = "Projects";

        return this._projects;
    }

    private _getButtons() {
        this._buttons = document.createElement("div");
        this._buttons.classList.add("selector", "btn-group", "btn-group-xs");

        const left = document.createElement("div");
        left.classList.add("btn", "btn-xs", "icon", "icon-triangle-left");
        left.onclick = (e) => atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:previous-solution-status");

        const right = document.createElement("div");
        right.classList.add("btn", "btn-xs", "icon", "icon-triangle-right");
        right.onclick = (e) => atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:next-solution-status");

        return this._buttons;
    }

    public createdCallback() {
        super.createdCallback();
        this.modelDisposable = new CompositeDisposable();

        this.classList.add("omnisharp-card");

        const buttons = this._getButtons();
        this.appendChild(buttons);

        const projects = this._getProjects();
        this.appendChild(projects);

        const body = this._getBody();
        this.appendChild(body);
    }

    public attachedCallback() {
        super.attachedCallback();
        this.verifyPosition();
    }

    public detachedCallback() {
        super.detachedCallback();
    }

    public updateCard(model: ViewModel, count: number) {
        this.model = model;
        this.count = count;
    }

    private verifyPosition() {
        const offset = $(document.querySelectorAll(this.attachTo)).offset();
        if (offset) {
            $(this).css({
                position: "fixed",
                top: offset.top - this.clientHeight,
                left: offset.left
            });
        }
    }
}

(<any>exports).SolutionStatusCard = (<any>document).registerElement("omnisharp-solution-card", { prototype: SolutionStatusCard.prototype });
