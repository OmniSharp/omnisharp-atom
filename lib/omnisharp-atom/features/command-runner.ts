import {CompositeDisposable, Disposable, Observable, Subject} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import {ProjectViewModel} from "../../omni-sharp-server/view-model";
import {any, each, contains, pull} from "lodash";
import {spawn, ChildProcess} from "child_process";
import {CommandOutputWindow} from '../views/command-output-window';
import * as readline from "readline";
import {dock} from "../atom/dock";
import {normalize} from "path";

var win32 = process.platform === "win32";

var daemonFlags = ['--server Kestrel', '--server Microsoft.AspNet.Server.WebListener'];
if (win32) {
    var inactiveCommands = ['--server Kestrel'];
    var env = <typeof process.env>{};
} else {
    var inactiveCommands = ['--server Microsoft.AspNet.Server.WebListener'];
    var env = process.env;
}

class CommandRunner implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private _projectMap = new WeakMap<ProjectViewModel, Rx.CompositeDisposable>();

    private _watchProcesses: RunProcess[] = [];
    public get processes() { return this._watchProcesses; }

    public observe: { processes: Observable<RunProcess[]> };

    private _processesChanged: Subject<RunProcess[]>;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Disposable.create(() => this._projectMap.clear()));
        this.disposable.add(Omni.listener.model.projectAdded
            .subscribe(project => this.addCommands(project)));

        this.disposable.add(Omni.listener.model.projectChanged
            .subscribe(project => {
                var cd = this._projectMap.get(project);
                if (cd) {
                    cd.dispose();
                    this._projectMap.delete(project);
                    this.addCommands(project);
                }
            }));

        this.disposable.add(Omni.listener.model.projectRemoved
            .subscribe(project => {
                var cd = this._projectMap.get(project);
                if (cd) {
                    cd.dispose();
                    this._projectMap.delete(project);
                }
            }));

        var processes = this._processesChanged = new Subject<RunProcess[]>();
        this.observe = { processes };
    }

    private addCommands(project: ProjectViewModel) {
        if (any(project.commands)) {
            var cd = new CompositeDisposable();
            this._projectMap.set(project, cd);
            this.disposable.add(cd);

            each(project.commands, (content, command) => {
                if (!any(inactiveCommands, cnt => contains(content, cnt))) {
                    cd.add(this.addCommand(project, command, content));
                }
            });
        }
    }

    private addCommand(project: ProjectViewModel, command: string, content: string) {
        //--server Kestrel
        //--server Microsoft.AspNet.Server.WebListener
        var daemon = any(daemonFlags, cnt => contains(content, cnt));
        if (daemon) {
            return atom.commands.add('atom-workspace', `omnisharp-dnx:${project.name}-[${command}]-(watch)`, () => this.daemonProcess(project, command));
        } else {
            return atom.commands.add('atom-workspace', `omnisharp-dnx:${project.name}-[${command}]`, () => this.runProcess(project, command));
        }
    }

    private daemonProcess(project: ProjectViewModel, command: string) {
        var process = new RunProcess(project, command, true);
        this._watchProcesses.push(process);
        this._processesChanged.onNext(this.processes);
        process.disposable.add(Disposable.create(() => {
            pull(this._watchProcesses, process);
            this._processesChanged.onNext(this.processes);
        }));

        var objectChanges = Observable.ofObjectChanges(process).where(z => z.name === 'started');
        process.disposable.add(objectChanges.where(z => z.object.started).delay(1000).subscribe(() => this._processesChanged.onNext(this.processes)));
        process.disposable.add(objectChanges.where(z => !z.object.started).subscribe(() => this._processesChanged.onNext(this.processes)));

        process.start();
    }

    private runProcess(project: ProjectViewModel, command: string) {
        var process = new RunProcess(project, command);
        process.start();
    }

    public dispose() {
        this.disposable.dispose();
    }
}

export class RunProcess {
    public disposable = new CompositeDisposable();
    public update = new Subject<{ message: string }[]>();
    public output: { message: string }[] = [];
    public started = false;
    private id: string;

    constructor(private project: ProjectViewModel, private command: string, private watch: boolean = false) {
        this.id = `${this.project.name}${this.command}`;
        this.disposable.add(dock.addWindow(this.id, `${this.project.name} ${this.watch ? '--watch' : ''} ${this.command}`, CommandOutputWindow, this, {
            closeable: true,
            priority: 1001
        }, this.disposable));
    }

    public start() {
        var solution = Omni.getClientForProject(this.project)
            .map(solution => solution.model.dnx.RuntimePath + (win32 ? '/bin/dnx.exe' : '/bin/dnx'))
            .map(normalize)
            .tapOnNext(() => dock.selectWindow(this.id))
            .subscribe((runtime) => this.bootRuntime(runtime));
    }

    private bootRuntime(runtime: string) {
        var args = ['.', this.command];
        var failed = false;
        if (this.watch) {
            args.unshift('--watch');
        }

        this.output.push({ message: `Starting ${runtime} ${args.join(' ') }` });

        this.started = true;

        var process = spawn(runtime, args, {
            cwd: this.project.path,
            env,
            stdio: 'pipe'
        });

        var out = readline.createInterface({
            input: process.stdout,
            output: undefined
        });

        out.on('line', (data) => {
            this.output.push({ message: data });
            this.update.onNext(this.output);
        });

        var error = readline.createInterface({
            input: process.stderr,
            output: undefined
        });

        error.on('line', (data) => {
            this.output.push({ message: data });
            this.update.onNext(this.output);
        });

        var disposable = Disposable.create(() => {
            this.started = false;
            process.removeAllListeners();
            try { process.kill(); } catch (e) { }
        });
        this.disposable.add(disposable);

        var cb = () => {
            this.started = false;
            disposable.dispose();
            if (this.watch && !failed)
                this.bootRuntime(runtime);
        };

        if (this.watch) {
            process.on('close', cb);
            process.on('exit', cb);
            process.on('disconnect', cb);
        }
    }

    public dispose() {
        this.disposable.dispose();
    }
}

export var commandRunner = new CommandRunner
