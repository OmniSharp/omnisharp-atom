/* tslint:disable:no-string-literal */
import {Observable} from "rxjs";
import {CompositeDisposable, IDisposable} from "ts-disposables";
import _ from "lodash";
import {Omni} from "../server/omni";
import {OmnisharpClientStatus} from "omnisharp-client";
import {server} from "../atom/server-information";
import {SolutionManager} from "../server/solution-manager";
let fastdom: typeof Fastdom = require("fastdom");

function addClassIfNotincludes(icon: HTMLElement, ...cls: string[]) {
    if (icon) {
        fastdom.measure(() => {
            _.each(cls, c => {
                if (!icon.classList.contains(c))
                    fastdom.mutate(() => icon.classList.add(c));
            });
        });
    }
}
function removeClassIfincludes(icon: HTMLElement, ...cls: string[]) {
    if (icon) {
        fastdom.measure(() => {
            _.each(cls, c => {
                if (icon.classList.contains(c))
                    fastdom.mutate(() => icon.classList.remove(c));
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
            removeClassIfincludes(icon, "text-subtle");
        } else {
            addClassIfNotincludes(icon, "text-subtle");
        }

        if (this._state.isReady) {
            addClassIfNotincludes(icon, "text-success");
        } else {
            removeClassIfincludes(icon, "text-success");
        }

        if (this._state.isError) {
            addClassIfNotincludes(icon, "text-error");
        } else {
            removeClassIfincludes(icon, "text-error");
        }

        if (this._state.isConnecting) {
            addClassIfNotincludes(icon, "icon-flame-loading");
            removeClassIfincludes(icon, "icon-flame-processing");
            removeClassIfincludes(icon, "icon-flame-loading");
        } else if (this._state.status.hasOutgoingRequests) {
            addClassIfNotincludes(icon, "icon-flame-processing");
            removeClassIfincludes(icon, "icon-flame-loading");
        } else {
            removeClassIfincludes(icon, "icon-flame-processing");
            removeClassIfincludes(icon, "icon-flame-loading");
        }
    }

    public updateOutgoing(status: typeof FlameElement.prototype._state.status) {
        if (status.hasOutgoingRequests && status.outgoingRequests > 0) {
            removeClassIfincludes(this._outgoing, "fade");
        } else {
            addClassIfNotincludes(this._outgoing, "fade");
        }

        if (status.outgoingRequests !== this._state.status.outgoingRequests) {
            fastdom.mutate(() => this._outgoing.innerText = status.outgoingRequests && status.outgoingRequests.toString() || "0");
        }

        this._state.status = status || <any>{};
        this.updateState(this._state);
    }
}

(<any>exports).FlameElement = (<any>document).registerElement("omnisharp-flame", { prototype: FlameElement.prototype });

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
            fastdom.mutate(() => {
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
            fastdom.mutate(() => this.projects.innerText = `${this._state.projectCount} Projects`);
        }
    }

    public updateSolutionNumber(solutionNumber: string) {
        fastdom.mutate(() => this._solutionNunmber.innerText = solutionNumber);
    }
}

(<any>exports).ProjectCountElement = (<any>document).registerElement("omnisharp-project-count", { prototype: ProjectCountElement.prototype });


export class StatusBarElement extends HTMLElement implements WebComponent, IDisposable {
    private _state: StatusBarState;
    private _disposable: CompositeDisposable;
    private _flame: FlameElement;
    private _diagnostics: DiagnosticsElement;
    private _projectCount: ProjectCountElement;

    public createdCallback() {
        this.classList.add("inline-block");

        const flameElement = this._flame = <FlameElement>new exports.FlameElement();
        this.appendChild(flameElement);
        flameElement.onclick = () => this.toggle();

        const projectCount = this._projectCount = <ProjectCountElement>new exports.ProjectCountElement();
        this.appendChild(projectCount);
        projectCount.onclick = () => this.toggleSolutionInformation();
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
        this._disposable.add(Omni.diagnosticsCounts.subscribe(counts => {
            this._diagnostics.updateState({
                errorCount: counts["error"] || 0,
                warningCount: counts["warning"] || 0
            });
        }));

        this._disposable.add(Observable.merge(Omni.activeModel, Omni.activeModel.flatMap(x => x.observe.state))
            .subscribe(model => {
                this._flame.updateState(model);
                updateState(this._state, model);

                this._updateVisible();
            }));

        this._disposable.add(server.observe.projects
            .debounceTime(500)
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

        if (this._state.isOn && this._hasValidEditor) {
            this._showOnStateItems();
        } else {
            this._hideOnStateItems();
        }
    }

    private _showOnStateItems() {
        fastdom.measure(() => {
            if (this._diagnostics.style.display === "none") { fastdom.mutate(() => this._diagnostics.style.display = ""); }
            if (this._projectCount.projects.style.display === "none") { fastdom.mutate(() => this._projectCount.projects.style.display = ""); }
        });
    }

    private _hideOnStateItems() {
        fastdom.measure(() => {
            if (this._diagnostics.style.display !== "none") { fastdom.mutate(() => this._diagnostics.style.display = "none"); }
            if (this._projectCount.projects.style.display !== "none") { fastdom.mutate(() => this._projectCount.projects.style.display = "none"); }
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
