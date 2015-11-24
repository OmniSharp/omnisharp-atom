/* tslint:disable:no-string-literal */
import {CompositeDisposable, Observable} from "rx";
const _: _.LoDashStatic = require("lodash");
import {Omni} from "../server/omni";
import {OmnisharpClientStatus} from "omnisharp-client";
import {server} from "../atom/server-information";
import {SolutionManager} from "../server/solution-manager";
import {commandRunner} from "../atom/command-runner";
let fastdom : { read(cb: Function): any; write(cb: Function): any; } = require("fastdom");

function addClassIfNotContains(icon: HTMLElement, ...cls: string[]) {
    if (icon) {
        fastdom.read(() => {
            _.each(cls, c => {
                if (!icon.classList.contains(c))
                    fastdom.write(() => icon.classList.add(c));
            });
        });
    }
}
function removeClassIfContains(icon: HTMLElement, ...cls: string[]) {
    if (icon) {
        fastdom.read(() => {
            _.each(cls, c => {
                if (icon.classList.contains(c))
                    fastdom.write(() => icon.classList.remove(c));
            });
        });
    }
}

interface StatusBarState {
    isOff?: boolean;
    isConnecting?: boolean;
    isOn?: boolean;
    isReady?: boolean;
    isError?: boolean;
    status?: OmnisharpClientStatus;
}

function updateState(self: any, state: any) {
    _.each(Omni.viewModelStatefulProperties, x => {
        if (_.has(state, x)) {
            self[x] = state[x];
        }
    });
}

export class FlameElement extends HTMLAnchorElement implements WebComponent {
    private _state: {
        isOff?: boolean;
        isConnecting?: boolean;
        isOn?: boolean;
        isReady?: boolean;
        isError?: boolean;
        status?: OmnisharpClientStatus;
    };

    private _icon: HTMLSpanElement;
    private _outgoing: HTMLSpanElement;

    public createdCallback() {
        this.classList.add("omnisharp-atom-button");
        this._state = { status: <any>{} };

        const icon = this._icon = document.createElement("span");
        icon.classList.add("icon", "icon-flame");
        this.appendChild(icon);

        const outgoing = this._outgoing = document.createElement("span");
        outgoing.classList.add("outgoing-requests");
        this.appendChild(outgoing);
    }

    public updateState(state: typeof FlameElement.prototype._state) {
        updateState(this._state, state);
        const icon = this._icon;

        if (this._state.isOff) {
            removeClassIfContains(icon, "text-subtle");
        } else {
            addClassIfNotContains(icon, "text-subtle");
        }

        if (this._state.isReady) {
            addClassIfNotContains(icon, "text-success");
        } else {
            removeClassIfContains(icon, "text-success");
        }

        if (this._state.isError) {
            addClassIfNotContains(icon, "text-error");
        } else {
            removeClassIfContains(icon, "text-error");
        }

        if (this._state.isConnecting) {
            addClassIfNotContains(icon, "icon-flame-loading");
            removeClassIfContains(icon, "icon-flame-processing");
            removeClassIfContains(icon, "icon-flame-loading");
        } else if (this._state.status.hasOutgoingRequests) {
            addClassIfNotContains(icon, "icon-flame-processing");
            removeClassIfContains(icon, "icon-flame-loading");
        } else {
            removeClassIfContains(icon, "icon-flame-processing");
            removeClassIfContains(icon, "icon-flame-loading");
        }
    }

    public updateOutgoing(status: typeof FlameElement.prototype._state.status) {
        if (status.hasOutgoingRequests && status.outgoingRequests > 0) {
            removeClassIfContains(this._outgoing, "fade");
        } else {
            addClassIfNotContains(this._outgoing, "fade");
        }

        if (status.outgoingRequests !== this._state.status.outgoingRequests) {
            fastdom.write(() => this._outgoing.innerText = status.outgoingRequests && status.outgoingRequests.toString() || "0");
        }

        this._state.status = status || <any>{};
        this.updateState(this._state);
    }
}

(<any>exports).FlameElement = (<any>document).registerElement("omnisharp-flame", { prototype: FlameElement.prototype });

export enum CommandRunnerState { Running, Started, Off };
export class CommandRunnerElement extends HTMLAnchorElement implements WebComponent {
    private _state: CommandRunnerState;

    public createdCallback() {
        this.classList.add("omnisharp-atom-button", "icon", "icon-clock");
    }

    public attachedCallback() {
        if (this._state === undefined)
            this.updateState(CommandRunnerState.Off);
    }

    public updateState(state: CommandRunnerState) {
        if (this._state !== state) {
            this._state = state;
            if (state === CommandRunnerState.Running) {
                addClassIfNotContains(this, "text-info");
                removeClassIfContains(this, "text-subtle", "icon-flame-loading");
            } else {
                removeClassIfContains(this, "text-info");
                addClassIfNotContains(this, "text-subtle", "icon-flame-loading");
            }

            if (state === CommandRunnerState.Off) {
                fastdom.read(() => this.style.display !== "none" && fastdom.write(() => this.style.display = "none"));
            } else {
                fastdom.read(() => this.style.display === "none" && fastdom.write(() => this.style.display = ""));
            }
        }
    }
}

(<any>exports).CommandRunnerElement = (<any>document).registerElement("omnisharp-command-runner", { prototype: CommandRunnerElement.prototype });

export class DiagnosticsElement extends HTMLAnchorElement implements WebComponent {
    private _state: {
        errorCount: number;
        warningCount: number;
    };
    private _errors: HTMLSpanElement;
    private _warnings: HTMLSpanElement;
    private _sync: HTMLAnchorElement;

    public createdCallback() {
        this.classList.add("inline-block", "error-warning-summary");

        const sync = this._sync = document.createElement("a");
        sync.classList.add("icon", "icon-sync", "text-subtle");
        this.appendChild(sync);
        sync.onclick = () => this.syncClick();

        const s = document.createElement("span");
        this.appendChild(s);
        s.onclick = () => this.diagnosticClick();

        const errorsIcon = document.createElement("span");
        errorsIcon.classList.add("icon", "icon-issue-opened");
        s.appendChild(errorsIcon);

        const errors = this._errors = document.createElement("span");
        errors.classList.add("error-summary");
        s.appendChild(errors);

        const warningsIcon = document.createElement("span");
        warningsIcon.classList.add("icon", "icon-alert");
        s.appendChild(warningsIcon);

        const warnings = this._warnings = document.createElement("span");
        warnings.classList.add("warning-summary");
        s.appendChild(warnings);
    }

    public updateState(state: typeof DiagnosticsElement.prototype._state) {
        if (!_.isEqual(this._state, state)) {
            this._state = state;
            fastdom.write(() => {
                if (this._state.errorCount) {
                    this._errors.innerText = this._state.errorCount.toString();
                } else {
                    this._errors.innerText = "0";
                }

                if (this._state.warningCount) {
                    this._warnings.innerText = this._state.warningCount.toString();
                } else {
                    this._warnings.innerText = "0";
                }
            });
        }
    }

    public syncClick: () => void;
    public diagnosticClick: () => void;
}

(<any>exports).DiagnosticsElement = (<any>document).registerElement("omnisharp-diagnostics", { prototype: DiagnosticsElement.prototype });

export class ProjectCountElement extends HTMLAnchorElement implements WebComponent {
    private _state: { projectCount: number };
    public projects: HTMLSpanElement;
    private _solutionNunmber: HTMLSpanElement;

    public createdCallback() {
        this.classList.add("inline-block", "project-summary", "projects-icon");

        const icon = document.createElement("span");
        icon.classList.add("icon", "icon-pulse");
        this.appendChild(icon);

        const sub = this._solutionNunmber = document.createElement("sub");
        icon.appendChild(sub);

        const projects = this.projects = document.createElement("span");
        projects.classList.add("projects");
        projects.innerText = "0 Projects";
        this.appendChild(projects);
    }

    public updateState(state: typeof ProjectCountElement.prototype._state) {
        if (!_.isEqual(this._state, state)) {
            this._state = state;
            fastdom.write(() => this.projects.innerText = `${this._state.projectCount} Projects`);
        }
    }

    public updateSolutionNumber(solutionNumber: string) {
        fastdom.write(() => this._solutionNunmber.innerText = solutionNumber);
    }
}

(<any>exports).ProjectCountElement = (<any>document).registerElement("omnisharp-project-count", { prototype: ProjectCountElement.prototype });


export class StatusBarElement extends HTMLElement implements WebComponent, Rx.IDisposable {
    private _state: StatusBarState;
    private _disposable: CompositeDisposable;
    private _flame: FlameElement;
    private _commandRunner: CommandRunnerElement;
    private _diagnostics: DiagnosticsElement;
    private _projectCount: ProjectCountElement;

    public createdCallback() {
        this.classList.add("inline-block");

        const flameElement = this._flame = <FlameElement>new exports.FlameElement();
        this.appendChild(flameElement);
        flameElement.onclick = () => this.toggle();

        const commandRunnerElement = this._commandRunner = <CommandRunnerElement>new exports.CommandRunnerElement();
        this.appendChild(commandRunnerElement);

        const projectCount = this._projectCount = <ProjectCountElement>new exports.ProjectCountElement();
        this.appendChild(projectCount);
        projectCount.onclick = () => this.toggleSolutionInformation();
        projectCount.style.display = "none";
        projectCount.projects.style.display = "none";

        const diagnostics = this._diagnostics = <DiagnosticsElement>new exports.DiagnosticsElement();
        this.appendChild(diagnostics);
        diagnostics.diagnosticClick = () => this.toggleErrorWarningPanel();
        diagnostics.syncClick = () => this.doCodeCheck();
        diagnostics.style.display = "none";

        this._disposable = new CompositeDisposable();
        this._state = { status: <any>{} };
    }

    public attachedCallback() {
        this._disposable.add(Omni.diagnostics.subscribe(diagnostics => {
            const counts = _.countBy(diagnostics, quickFix => quickFix.LogLevel);

            this._diagnostics.updateState({
                errorCount: counts["Error"] || 0,
                warningCount: counts["Warning"] || 0
            });
        }));

        this._disposable.add(Observable.merge(Omni.activeModel, Omni.activeModel.flatMap(x => x.observe.state))
            .subscribe(model => {
                this._flame.updateState(model);
                updateState(this._state, model);

                this._updateVisible();
            }));

        this._disposable.add(server.observe.projects
            .debounce(500)
            .subscribe(projects => this._projectCount.updateState({ projectCount: projects.length })));

        this._disposable.add(server.observe.status
            .subscribe(status => this._flame.updateOutgoing(status || <any>{})));

        this._disposable.add(server.observe.model
            .subscribe(model => {
                const solutionNumber = SolutionManager.activeSolutions.length > 1 ? _.trim(server.model && (<any>server.model).index, "client") : "";
                this._projectCount.updateSolutionNumber(solutionNumber);
            }));

        this._disposable.add(Omni.activeEditorOrConfigEditor.subscribe(editor => {
            this._updateVisible(!!editor);
        }));

        this._disposable.add(commandRunner.observe.processes
            .subscribe(processes => {
                if (_.all(processes, process => process.started)) {
                    this._commandRunner.updateState(CommandRunnerState.Started);
                } else if (processes.length > 0) {
                    this._commandRunner.updateState(CommandRunnerState.Running);
                } else {
                    this._commandRunner.updateState(CommandRunnerState.Off);
                }
            }));

        this._disposable.add(SolutionManager.activeSolution
            .subscribe(solutions => {
                const solutionNumber = SolutionManager.activeSolutions.length > 1 ? _.trim(server.model && (<any>server.model).index, "client") : "";
                this._projectCount.updateSolutionNumber(solutionNumber);
            }));
    }

    private _hasValidEditor: boolean = false;
    private _updateVisible(hasValidEditor?: boolean) {
        if (typeof hasValidEditor !== "undefined") {
            this._hasValidEditor = hasValidEditor;
        }

        if (this._state.isOn) {
            fastdom.read(() => this._projectCount.style.display === "none" && fastdom.write(() => this._projectCount.style.display = ""));
        }

        if (this._state.isOn && this._hasValidEditor) {
            this._showOnStateItems();
        } else {
            this._hideOnStateItems();
        }
    }

    private _showOnStateItems() {
        fastdom.read(() => {
            if (this._diagnostics.style.display === "none") { fastdom.write(() => this._diagnostics.style.display = ""); }
            if (this._projectCount.projects.style.display === "none") { fastdom.write(() => this._projectCount.projects.style.display = ""); }
        });
    }

    private _hideOnStateItems() {
        fastdom.read(() => {
            if (this._diagnostics.style.display !== "none") { fastdom.write(() => this._diagnostics.style.display = "none"); }
            if (this._projectCount.projects.style.display !== "none") { fastdom.write(() => this._projectCount.projects.style.display = "none"); }
        });
    }

    public detachedCallback() {
        this._disposable.dispose();
    }

    public dispose() {
        this._disposable.dispose();
    }

    public toggle() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:toggle-dock");
    }

    public toggleErrorWarningPanel() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:dock-toggle-errors");
    }

    public toggleSolutionInformation() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:solution-status");
    }

    public doCodeCheck() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:code-check");
    }
}

(<any>exports).StatusBarElement = (<any>document).registerElement("omnisharp-status-bar", { prototype: StatusBarElement.prototype });
