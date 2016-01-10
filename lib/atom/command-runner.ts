import {Solution} from "../server/solution";
import {CompositeDisposable, Disposable, Observable, Subject} from "rx";
import {Omni} from "../server/omni";
import {ProjectViewModel} from "../server/project-view-model";
import {any, each, contains, pull} from "lodash";
import {spawn} from "child_process";
import {CommandOutputWindow} from "../views/command-output-window";
import * as readline from "readline";
import {dock} from "../atom/dock";
import {normalize, join, dirname} from "path";

const win32 = process.platform === "win32";
let env: typeof process.env;
const daemonFlags = [
    "Microsoft.AspNet.Hosting", // Old (pre beta 8)
    "Microsoft.AspNet.Server.Kestrel", // New post beta8
    "Microsoft.AspNet.Server.WebListener"
];
if (win32) {
    env = <typeof process.env>{};
} else {
    env = process.env;
}

class CommandRunner implements IFeature {
    private disposable: Rx.CompositeDisposable;
    private _projectMap = new WeakMap<ProjectViewModel<any>, Rx.CompositeDisposable>();

    private _watchProcesses: RunProcess[] = [];
    public get processes() { return this._watchProcesses; }

    public observe: { processes: Observable<RunProcess[]> };

    private _processesChanged: Subject<RunProcess[]>;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(
            Observable.merge(
                // Get all currently defined projects
                Omni.solutions.flatMap(z => Observable.from(z.model.projects)),
                Omni.listener.model.projectAdded
            ).subscribe(project => this.addCommands(project)));

        this.disposable.add(Omni.listener.model.projectChanged
            .subscribe(project => {
                const cd = this._projectMap.get(project);
                if (cd) {
                    cd.dispose();
                    this._projectMap.delete(project);
                }

                this.addCommands(project);
            }));

        this.disposable.add(Omni.listener.model.projectRemoved
            .subscribe(project => {
                const cd = this._projectMap.get(project);
                if (cd) {
                    cd.dispose();
                    this._projectMap.delete(project);
                }
            }));

        // Auto restart the process if a file changes for a project that applies
        const restart = new Subject<Atom.TextEditor>();

        this.disposable.add(Omni.eachEditor((editor, cd) => {
            cd.add(editor.onDidSave(() => restart.onNext(editor)));
            cd.add(editor.getBuffer().onDidReload(() => restart.onNext(editor)));
        }));

        const processes = this._processesChanged = new Subject<RunProcess[]>();
        this.observe = { processes };

        this.disposable.add(restart
            .where(z => !!this._watchProcesses.length)
            .flatMap(editor =>
                Omni.activeModel
                    .concatMap(model => model.getProjectContainingEditor(editor))
                    .take(1)
                    .where(project => !!project))
            .throttle(1000)
            .subscribe(project => {
                each(this._watchProcesses, process => {
                    if (project.solutionPath === process.project.solutionPath)
                        process.stop();
                });
            }));
        this.disposable.add(restart);
    }

    private addCommands(project: ProjectViewModel<any>) {
        if (any(project.commands)) {
            const cd = new CompositeDisposable();
            this._projectMap.set(project, cd);
            this.disposable.add(cd);

            each(project.commands, (content, command) => {
                cd.add(this.addCommand(project, command, content));
            });
        }
    }

    private addCommand(project: ProjectViewModel<any>, command: string, content: string) {
        //--server Kestrel
        //--server Microsoft.AspNet.Server.WebListener
        const daemon = any(daemonFlags, cnt => contains(content, cnt));
        if (daemon) {
            return atom.commands.add("atom-workspace", `omnisharp-dnx:${project.name}-[${command}]-(watch)`, () => this.daemonProcess(project, command));
        } else {
            return atom.commands.add("atom-workspace", `omnisharp-dnx:${project.name}-[${command}]`, () => this.runProcess(project, command));
        }
    }

    private daemonProcess(project: ProjectViewModel<any>, command: string) {
        const process = new RunProcess(project, command, true);
        this._watchProcesses.push(process);
        this._processesChanged.onNext(this.processes);
        process.disposable.add(Disposable.create(() => {
            pull(this._watchProcesses, process);
            this._processesChanged.onNext(this.processes);
        }));

        process.disposable.add(process.observeStarted.where(z => z).delay(1000).subscribe(() => this._processesChanged.onNext(this.processes)));
        process.disposable.add(process.observeStarted.where(z => !z).subscribe(() => this._processesChanged.onNext(this.processes)));

        process.start();
    }

    private runProcess(project: ProjectViewModel<any>, command: string) {
        const process = new RunProcess(project, command);
        process.start();
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = "Command Runner";
    public description = "Adds command runner to run dnx and other similar commands from within atom.";
}

export function getDnxExe(solution: Solution) {
    return join(solution.model.runtimePath, win32 ? "/bin/dnx.exe" : "/bin/dnx");
}

export class RunProcess {
    private _outputWindow = new CommandOutputWindow;
    private id: string;
    private process: any;

    public disposable = new CompositeDisposable();
    public started = false;
    public observeStarted = new Subject<boolean>();

    constructor(public project: ProjectViewModel<any>, private command: string, private watch = false) {
        this.id = `${this.project.name}${this.command}`;
        this.disposable.add(dock.addWindow(this.id, `${this.project.name} ${this.watch ? "--watch" : ""} ${this.command}`, this._outputWindow, {
            closeable: true,
            priority: 1001
        }, this.disposable));
    }

    public start() {
        const solution = Omni.getSolutionForProject(this.project)
            .map(x => normalize(getDnxExe(x)))
            .tapOnNext(() => dock.selectWindow(this.id))
            .subscribe((runtime) => this.bootRuntime(runtime));

        this.disposable.add(solution);
    }

    public stop() {
        try { this.process.kill(); } catch (e) { /* */ }
    }

    private bootRuntime(runtime: string) {
        const args = [this.command];
        // Support old way of doing things (remove at RC?)
        if (any(["beta3", "beta4", "beta5", "beta6"], x => runtime.indexOf(x) > -1)) {
            args.unshift(".");
        }

        if (this.watch) {
            args.unshift("--watch");
        }

        this._outputWindow.addMessage({ message: `Starting ${runtime} ${args.join(" ")}` });

        this.started = true;
        this.observeStarted.onNext(this.started);

        const process = this.process = spawn(runtime, args, {
            cwd: dirname(this.project.path),
            env,
            stdio: "pipe"
        });

        const out = readline.createInterface({
            input: process.stdout,
            output: undefined
        });

        out.on("line", (data: any) => {
            this._outputWindow.addMessage({ message: data });
        });

        const error = readline.createInterface({
            input: process.stderr,
            output: undefined
        });

        error.on("line", (data: any) => {
            this._outputWindow.addMessage({ message: data });
        });

        const disposable = Disposable.create(() => {
            this.started = false;
            this.observeStarted.onNext(this.started);
            this.process.removeAllListeners();
            this.stop();
            this.disposable.remove(disposable);
        });
        this.disposable.add(disposable);

        const cb = () => {
            this.started = false;
            this.observeStarted.onNext(this.started);
            disposable.dispose();
            if (this.watch)
                this.bootRuntime(runtime);
        };

        if (this.watch) {
            process.on("close", cb);
            process.on("exit", cb);
            process.on("disconnect", cb);
        }
    }

    public dispose() {
        this.disposable.dispose();
    }
}

export const commandRunner = new CommandRunner;
