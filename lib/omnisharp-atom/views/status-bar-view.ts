import {CompositeDisposable, Disposable, Scheduler, Observable} from "rx";
import _ = require('lodash');
import Omni = require('../../omni-sharp-server/omni')
import {Solution} from '../../omni-sharp-server/solution';
import React = require('react');
import {ReactClientComponent} from "./react-client-component";
import {server} from "../features/server-information";
import {solutionInformation} from "../features/solution-information";
import {world} from '../world';
import {codeCheck} from "../features/code-check";
import {OmnisharpClientStatus} from "omnisharp-client";
import {commandRunner, RunProcess} from "../features/command-runner";
import {read, write} from "fastdom";

function addClassIfNotContains(icon: HTMLElement, ...cls: string[]) {
    _.each(cls, cls => {
        read(() => {
            if (!icon.classList.contains(cls))
                write(() => icon.classList.add(cls));
        });
    });
}
function removeClassIfContains(icon: HTMLElement, ...cls: string[]) {
    _.each(cls, cls => {
        read(() => {
            if (icon.classList.contains(cls))
                write(() => icon.classList.remove(cls));
        });
    });
}

interface StatusBarState {
    isOff?: boolean;
    isConnecting?: boolean;
    isOn?: boolean;
    isReady?: boolean;
    isError?: boolean;
    status?: OmnisharpClientStatus;
}

export class FlameElement extends HTMLAnchorElement implements WebComponent {
    private _state: {
        isOff?: boolean;
        isConnecting?: boolean;
        isOn?: boolean;
        isReady?: boolean;
        isError?: boolean;
        status?: OmnisharpClientStatus;
    }

    private _icon: HTMLSpanElement;
    private _outgoing: HTMLSpanElement;

    public createdCallback() {
        this.classList.add('omnisharp-atom-button');
        this._state = { status: <any>{} };

        var icon = this._icon = document.createElement('span');
        icon.classList.add('icon', 'icon-flame');
        this.appendChild(icon);

        var outgoing = this._outgoing = document.createElement('span');
        outgoing.classList.add('outgoing-requests');
        this.appendChild(outgoing);
    }

    public updateState(state: typeof FlameElement.prototype._state) {
        _.assign(this._state, state);
        var icon = this._icon;

        if (this._state.isOff) {
            removeClassIfContains(icon, 'text-subtle');
        } else {
            addClassIfNotContains(icon, 'text-subtle');
        }

        if (this._state.isReady) {
            addClassIfNotContains(icon, 'text-success');
        } else {
            removeClassIfContains(icon, 'text-success');
        }

        if (this._state.isError) {
            addClassIfNotContains(icon, 'text-error');
        } else {
            removeClassIfContains(icon, 'text-error');
        }

        if (this._state.isConnecting) {
            addClassIfNotContains(icon, 'icon-flame-loading');
            removeClassIfContains(icon, 'icon-flame-processing');
            removeClassIfContains(icon, 'icon-flame-loading');
        } else if (this._state.status.hasOutgoingRequests) {
            addClassIfNotContains(icon, 'icon-flame-processing');
            removeClassIfContains(icon, 'icon-flame-loading');
        } else {
            removeClassIfContains(icon, 'icon-flame-processing');
            removeClassIfContains(icon, 'icon-flame-loading');
        }
    }

    public updateOutgoing(status: typeof FlameElement.prototype._state.status) {
        if (status.hasOutgoingRequests) {
            removeClassIfContains(this._outgoing, 'fade');
        } else {
            addClassIfNotContains(this._outgoing, 'fade');
        }

        if (status.outgoingRequests !== this._state.status.outgoingRequests) {
            write(() => this._outgoing.innerText = this._state.status.outgoingRequests && this._state.status.outgoingRequests.toString() || '0');
        }

        this._state.status = status || <any>{};
        this.updateState(this._state);
    }
}

(<any>exports).FlameElement = (<any>document).registerElement('omnisharp-flame', { prototype: FlameElement.prototype });

export enum CommandRunnerState { Running, Started, Off };
export class CommandRunnerElement extends HTMLAnchorElement implements WebComponent {
    private _state: CommandRunnerState;

    public createdCallback() {
        this.classList.add('omnisharp-atom-button', 'icon', 'icon-clock');
    }

    public attachedCallback() {
        if (this._state === undefined)
            this.updateState(CommandRunnerState.Off);
    }

    public updateState(state: CommandRunnerState) {
        if (this._state !== state) {
            this._state = state;
            if (state == CommandRunnerState.Running) {
                addClassIfNotContains(this, 'text-info');
                removeClassIfContains(this, 'text-subtle', 'icon-flame-loading');
            } else {
                removeClassIfContains(this, 'text-info');
                addClassIfNotContains(this, 'text-subtle', 'icon-flame-loading');
            }

            if (state === CommandRunnerState.Off) {
                read(() => this.style.display !== 'none' && write(() => this.style.display = 'none'));
            } else {
                read(() => this.style.display === 'none' && write(() => this.style.display = ''));
            }
        }
    }
}

(<any>exports).CommandRunnerElement = (<any>document).registerElement('omnisharp-command-runner', { prototype: CommandRunnerElement.prototype });

export class DiagnosticsElement extends HTMLAnchorElement implements WebComponent {
    private _state: {
        errorCount: number;
        warningCount: number;
    };
    private _errors: HTMLSpanElement;
    private _warnings: HTMLSpanElement;
    private _sync: HTMLAnchorElement;

    public createdCallback() {
        this.classList.add('inline-block', 'error-warning-summary');

        var sync = this._sync = document.createElement('a');
        sync.classList.add('icon', 'icon-sync', 'text-subtle');
        this.appendChild(sync);
        sync.onclick = () => this.syncClick();

        var s = document.createElement('span');
        this.appendChild(s);
        s.onclick = () => this.diagnosticClick();

        var errorsIcon = document.createElement('span');
        errorsIcon.classList.add('icon', 'icon-issue-opened');
        s.appendChild(errorsIcon);

        var errors = this._errors = document.createElement('span');
        errors.classList.add('error-summary');
        s.appendChild(errors);

        var warningsIcon = document.createElement('span');
        warningsIcon.classList.add('icon', 'icon-alert');
        s.appendChild(warningsIcon);

        var warnings = this._warnings = document.createElement('span');
        warnings.classList.add('warning-summary');
        s.appendChild(warnings);
    }

    public updateState(state: typeof DiagnosticsElement.prototype._state) {
        if (!_.isEqual(this._state, state)) {
            this._state = state;
            write(() => {
                if (this._state.errorCount) {
                    this._errors.innerText = this._state.errorCount.toString();
                } else {
                    this._errors.innerText = '0';
                }

                if (this._state.warningCount) {
                    this._warnings.innerText = this._state.warningCount.toString();
                } else {
                    this._warnings.innerText = '0';
                }
            });
        }
    }

    public syncClick: () => void;
    public diagnosticClick: () => void;
}

(<any>exports).DiagnosticsElement = (<any>document).registerElement('omnisharp-diagnostics', { prototype: DiagnosticsElement.prototype });

export class ProjectCountElement extends HTMLAnchorElement implements WebComponent {
    private _state: { projectCount: number };
    public projects: HTMLSpanElement;
    private _solutionNunmber: HTMLSpanElement;

    public createdCallback() {
        this.classList.add('inline-block', 'project-summary', 'projects-icon');

        var icon = document.createElement('span');
        icon.classList.add('icon', 'icon-pulse');
        this.appendChild(icon);

        var sub = this._solutionNunmber = document.createElement('sub');
        icon.appendChild(sub);

        var projects = this.projects = document.createElement('span');
        projects.classList.add('projects');
        projects.innerText = '0 Projects';
        this.appendChild(projects);
    }

    public updateState(state: typeof ProjectCountElement.prototype._state) {
        if (!_.isEqual(this._state, state)) {
            this._state = state;
            write(() => this.projects.innerText = `${this._state.projectCount} Projects`);
        }
    }

    public updateSolutionNumber(solutionNumber: string) {
        write(() => this._solutionNunmber.innerText = solutionNumber);
    }
}

(<any>exports).ProjectCountElement = (<any>document).registerElement('omnisharp-project-count', { prototype: ProjectCountElement.prototype });


export class StatusBarElement extends HTMLElement implements WebComponent, Rx.IDisposable {
    private _state: StatusBarState;
    private _disposable: CompositeDisposable;
    private _shadow: HTMLElement;
    private _flame: FlameElement;
    private _commandRunner: CommandRunnerElement;
    private _diagnostics: DiagnosticsElement;
    private _projectCount: ProjectCountElement;

    public createdCallback() {
        this.classList.add('inline-block');

        var flameElement = this._flame = <FlameElement>new exports.FlameElement();
        this.appendChild(flameElement);
        flameElement.onclick = () => this.toggle();

        var commandRunnerElement = this._commandRunner = <CommandRunnerElement>new exports.CommandRunnerElement();
        this.appendChild(commandRunnerElement);

        var projectCount = this._projectCount = <ProjectCountElement>new exports.ProjectCountElement();
        this.appendChild(projectCount);
        projectCount.onclick = () => this.toggleSolutionInformation();
        projectCount.style.display = 'none';
        projectCount.projects.style.display = 'none';

        var diagnostics = this._diagnostics = <DiagnosticsElement>new exports.DiagnosticsElement();
        this.appendChild(diagnostics);
        diagnostics.diagnosticClick = () => this.toggleErrorWarningPanel();
        diagnostics.syncClick = () => this.doCodeCheck();
        diagnostics.style.display = 'none';

        this._disposable = new CompositeDisposable();
        this._state = { status: <any>{} };
    }

    public attachedCallback() {
        this._disposable.add(codeCheck.observe.diagnostics.subscribe(diagnostics => {
            var counts = _.countBy(diagnostics, quickFix => quickFix.LogLevel);

            this._diagnostics.updateState({
                errorCount: counts['Error'] || 0,
                warningCount: counts['Warning'] || 0
            })
        }));

        this._disposable.add(world.observe.updates
            .buffer(world.observe.updates.throttle(500), () => Observable.timer(500))
            .subscribe(items => {
                var updates = _(items)
                    .filter(item => _.contains(['isOff', 'isConnecting', 'isOn', 'isReady', 'isError'], item.name))
                    .value();

                if (updates.length) {
                    var update = {};
                    _.each(updates, item => {
                        update[item.name] = world[item.name];
                    });
                    this._flame.updateState(update);
                    _.assign(this._state, update);

                    this._updateVisible();
                }
            }));

        this._disposable.add(server.observe.projects
            .debounce(500)
            .subscribe(projects => this._projectCount.updateState({ projectCount: projects.length })));

        this._disposable.add(server.observe.status
            .subscribe(status => this._flame.updateOutgoing(status || <any>{})));

        this._disposable.add(server.observe.model
            .subscribe(model => {
                var solutionNumber = solutionInformation.solutions.length > 1 ? _.trim(server.model && (<any>server.model).index, 'client') : '';
                this._projectCount.updateSolutionNumber(solutionNumber);
            }));

        this._disposable.add(Omni.activeEditorOrConfigEditor.subscribe(editor => {
            this._updateVisible(!!editor);
        }));

        this._disposable.add(commandRunner.observe.processes
            .subscribe(processes => {
                if (_.all(processes, process => process.started))
                    this._commandRunner.updateState(CommandRunnerState.Started);
                else if (processes.length > 0)
                    this._commandRunner.updateState(CommandRunnerState.Running);
                else
                    this._commandRunner.updateState(CommandRunnerState.Off);
            }));

        this._disposable.add(solutionInformation.observe.solutions
            .subscribe(solutions => {
                var solutionNumber = solutions.length > 1 ? _.trim(server.model && (<any>server.model).index, 'client') : '';
                this._projectCount.updateSolutionNumber(solutionNumber);
            }));
    }

    private _hasValidEditor: boolean = false;
    private _updateVisible(hasValidEditor?: boolean) {
        if (typeof hasValidEditor !== 'undefined') {
            this._hasValidEditor = hasValidEditor;
        }

        if (this._state.isOn) {
            read(() => this._projectCount.style.display === 'none' && write(() => this._projectCount.style.display = ''));
        }

        if (this._state.isOn && this._hasValidEditor) {
            this._showOnStateItems();
        } else {
            this._hideOnStateItems();
        }
    }

    private _showOnStateItems() {
        read(() => this._diagnostics.style.display === 'none' && write(() => this._diagnostics.style.display = ''));
        read(() => this._projectCount.projects.style.display === 'none' && write(() => this._projectCount.projects.style.display = ''));
    }

    private _hideOnStateItems() {
        read(() => this._diagnostics.style.display !== 'none' && write(() => this._diagnostics.style.display = 'none'));
        read(() => this._projectCount.projects.style.display !== 'none' && write(() => this._projectCount.projects.style.display = 'none'));
    }

    public detachedCallback() {
        this._disposable.dispose();
    }

    public dispose() {
        this._disposable.dispose();
    }

    public toggle() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-dock');
    }

    public toggleErrorWarningPanel() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:toggle-errors');
    }

    public toggleSolutionInformation() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:solution-status');
    }

    public doCodeCheck() {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:code-check');
    }
}

(<any>exports).StatusBarElement = (<any>document).registerElement('omnisharp-status-bar', { prototype: StatusBarElement.prototype });
