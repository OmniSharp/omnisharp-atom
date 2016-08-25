import _ from "lodash";
import {ViewModel} from "../server/view-model";
import {ProjectViewModel} from "../server/project-view-model";
import {DriverState} from "omnisharp-client";
import {CompositeDisposable}  from "ts-disposables";
const $: JQueryStatic = require("jquery");
let fastdom: typeof Fastdom = require("fastdom");
import {basename} from "path";

function truncateStringReverse(str: string, maxLength = 55) {
    const reversedString = _.toArray(str).reverse().join("");
    return _.toArray(_.truncate(reversedString, maxLength)).reverse().join("");
}


export interface ProjectDisplayElement extends HTMLDivElement {
    project: ProjectViewModel<any>;
    key: string;
}

const getMessageElement = (function() {
    const projectProps = {
        get: function project() { return this._project; },
        set: function project(project: ProjectViewModel<any>) {
            this._project = project;
            this._key = project.path;

            const path = truncateStringReverse(project.path.replace(this.project.solutionPath, ""), 24);
            this.title = `${path} [${project.frameworks.filter(z => z.Name !== "all").map(x => x.FriendlyName)}]`;
            this.innerText = project.name;
        }
    };

    const keyProps = {
        get: function key() { return this._key; }
    };

    return function getMessageElement(): ProjectDisplayElement {
        const element: ProjectDisplayElement = <any>document.createElement("div");
        element.classList.add("project", "name");
        Object.defineProperty(element, "project", projectProps);
        Object.defineProperty(element, "key", keyProps);

        return element;
    };
})();

export class SolutionStatusCard extends HTMLDivElement implements WebComponent {
    public displayName = "Card";

    private modelDisposable: CompositeDisposable;
    public attachTo: string;

    private _name: HTMLSpanElement;
    private _projects: HTMLDivElement;
    private _buttons: HTMLDivElement;
    private _body: HTMLElement;

    private _stopBtn: HTMLButtonElement;
    private _startBtn: HTMLButtonElement;
    private _restartBtn: HTMLButtonElement;

    private _statusItem: HTMLSpanElement;
    private _statusText: HTMLSpanElement;
    private _runtimeText: HTMLSpanElement;

    private _count: number;
    public get count() { return this._count; }
    public set count(count) {
        if (this._count !== count) {
            this._count = count;
        }
        if (this._count > 1) {
            this._body.parentElement.insertBefore(this._buttons, this._body);
        } else {
            this._buttons.remove();
        }
    }

    private _model: ViewModel;
    public get model() { return this._model; }
    public set model(model) {
        this._model = model;
        this.modelDisposable.dispose();
        this.modelDisposable = new CompositeDisposable();

        this.modelDisposable.add(this._model.observe.state.delay(10).subscribe(({index, path, /*runtime,*/ state, isReady, isOff, isOn}) => {
            fastdom.mutate(() => {
                const name = `${basename(path)} (${index})`;
                if (this._name.innerText !== name) {
                    this._name.innerText = name;
                }

                if (state === DriverState.Connected) {
                    this._statusText.innerText = "Online";
                } else if (state === DriverState.Connecting) {
                    this._statusText.innerText = "Loading";
                } else if (state === DriverState.Disconnected) {
                    this._statusText.innerText = "Offline";
                } else {
                    this._statusText.innerText = DriverState[state];
                }

                if (isReady) {
                    this._startBtn.style.display = "none";
                    this._stopBtn.style.display = "";
                } else if (isOff) {
                    this._startBtn.style.display = "";
                    this._stopBtn.style.display = "none";
                } else {
                    this._startBtn.style.display = "none";
                    this._stopBtn.style.display = "none";
                }

                if (isOn) {
                    this._restartBtn.style.display = "";
                } else {
                    this._restartBtn.style.display = "none";
                }

                if (isOff) {
                    this._projects.style.display = "none";
                } else {
                    this._projects.style.display = "";
                }

                //this._statusText.innerText = DriverState[state];
                this._statusItem.className = "pull-left stats-item";
                this._statusItem.classList.add(DriverState[state].toLowerCase());

                this.verifyPosition();

                /*if (runtime) {
                    this._runtimeText.style.display = "";
                    this._runtimeText.innerText = runtime;
                } else {*/
                    this._runtimeText.style.display = "none";
                    this._runtimeText.innerText = "";
                /*}*/
            });
        }));

        this.modelDisposable.add(this._model.observe.projects.subscribe(projects => {
            fastdom.mutate(() => {
                for (let i = 0, len = this._projects.children.length > projects.length ? this._projects.children.length : projects.length; i < len; i++) {
                    const item = projects[i];
                    let child: ProjectDisplayElement = <any>this._projects.children[i];

                    if (!item && child) {
                        child.remove();
                        continue;
                    } else if (item && !child) {
                        child = getMessageElement();
                        this._projects.appendChild(child);
                    }

                    if (child && child.key !== item.path) {
                        child.project = item;
                    }
                }

                this.verifyPosition();
            });
        }));
    }

    private _getMetaControls() {
        this._stopBtn = document.createElement("button");
        this._stopBtn.classList.add("btn", "btn-xs", "btn-error");
        this._stopBtn.onclick = () => atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:stop-server");

        let span = document.createElement("span");
        span.classList.add("fa", "fa-stop");
        this._stopBtn.appendChild(span);
        this._stopBtn.innerHTML += " Stop";

        this._startBtn = document.createElement("button");
        this._startBtn.classList.add("btn", "btn-xs", "btn-success");
        this._startBtn.onclick = () => atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:start-server");

        span = document.createElement("span");
        span.classList.add("fa", "fa-play");
        this._startBtn.appendChild(span);
        this._startBtn.innerHTML += " Start";

        this._restartBtn = document.createElement("button");
        this._restartBtn.classList.add("btn", "btn-xs", "btn-info");
        this._restartBtn.onclick = () => atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:restart-server");

        span = document.createElement("span");
        span.classList.add("fa", "fa-refresh");
        this._restartBtn.appendChild(span);
        this._restartBtn.innerHTML += " Restart";

        const metaControls = document.createElement("div");
        metaControls.classList.add("meta-controls");

        const buttonGroup = document.createElement("div");
        buttonGroup.classList.add("btn-group");
        metaControls.appendChild(buttonGroup);

        buttonGroup.appendChild(this._startBtn);
        buttonGroup.appendChild(this._stopBtn);
        buttonGroup.appendChild(this._restartBtn);

        return metaControls;
    }

    private _getStatusItem() {
        this._statusItem = document.createElement("span");
        this._statusItem.classList.add("pull-left", "stats-item");

        const statusContainer = document.createElement("span");
        this._statusItem.appendChild(statusContainer);
        const icon = document.createElement("span");
        statusContainer.appendChild(icon);
        icon.classList.add("icon", "icon-zap");

        this._statusText = document.createElement("span");
        statusContainer.appendChild(this._statusText);

        return this._statusItem;
    }

    private _getVersions() {
        const versions = document.createElement("span");
        versions.classList.add("pull-right", "stats-item");

        const spans = document.createElement("span");
        spans.classList.add("icon", "icon-versions");
        versions.appendChild(spans);

        this._runtimeText = document.createElement("span");
        versions.appendChild(this._runtimeText);

        return versions;
    }

    private _getBody() {
        const body = document.createElement("div");
        this._body = body;
        body.classList.add("body");

        const header = document.createElement("h4");
        header.classList.add("name");
        body.appendChild(header);

        this._name = document.createElement("span");
        header.appendChild(this._name);

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
        this._buttons.appendChild(left);

        const right = document.createElement("div");
        right.classList.add("btn", "btn-xs", "icon", "icon-triangle-right");
        right.onclick = (e) => atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:next-solution-status");
        this._buttons.appendChild(right);

        return this._buttons;
    }

    public createdCallback() {
        this.modelDisposable = new CompositeDisposable();

        this.classList.add("omnisharp-card");

        this._getButtons();

        const body = this._getBody();
        this.appendChild(body);

        const projects = this._getProjects();
        this.appendChild(projects);
    }

    public attachedCallback() {
        this.verifyPosition();
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
