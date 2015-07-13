import {CompositeDisposable, Disposable, Observable, Subject} from "rx";
import Omni = require('../../omni-sharp-server/omni');
import {ProjectViewModel} from "../../omni-sharp-server/view-model";
import {any, each, contains} from "lodash";
import {spawn, ChildProcess} from "child_process";
import {CommandOutputWindow} from '../views/command-output-window';
import * as readline from "readline";
import {dock} from "../atom/dock";

var daemonFlags = ['--server Kestrel', '--server Microsoft.AspNet.Server.WebListener'];
if (process.platform === "win32") {
    var inactiveCommands = ['--server Kestrel'];
    var env = <typeof process.env>{};
} else {
    var inactiveCommands = ['--server Microsoft.AspNet.Server.WebListener'];
    var env = process.env;
}

class CommandRunner implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private _projectMap = new WeakMap<ProjectViewModel, Rx.CompositeDisposable>();

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
        var names = project.name.split('.');
        var name = names[names.length - 1];

        //--server Kestrel
        //--server Microsoft.AspNet.Server.WebListener
        var daemon = any(daemonFlags, cnt => contains(content, cnt));
        if (daemon) {
            return atom.commands.add('atom-workspace', `omnisharp-atom:${name}-watch-${command}`, () => this.daemonProcess(project, command));
        } else {
            return atom.commands.add('atom-workspace', `omnisharp-atom:${name}-${command}`, () => this.runProcess(project, command));
        }
    }

    private daemonProcess(project: ProjectViewModel, command: string) {
        var process = new DaemonProcess(project, command);
        process.start();
    }

    private runProcess(project: ProjectViewModel, command: string) {
        var process = new DaemonProcess(project, command);
        process.start();

    }

    public dispose() {
        this.disposable.dispose();
    }
}

export class DaemonProcess implements Rx.IDisposable {
    private disposable = new CompositeDisposable();
    constructor(private project: ProjectViewModel, private command: string) { }

    public output: { message: string }[];

    public start() {
        var names = this.project.name.split('.');
        var name = names[names.length - 1];
        var subject = new Subject<{ message: string }[]>();

        this.disposable.add(dock.addWindow(`${this.project.name}${this.command}`, `${name} --watch ${this.command}`, CommandOutputWindow, { update: subject }, { closeable: true }, this.disposable));

        var solution = Omni.getClientForProject(this.project)
            .map(solution => solution.model.dnx.RuntimePath)
            .subscribe(runtime => {
                var process = spawn(runtime, ['--watch', this.project.path, this.command], {
                    env, stdio: 'pipe'
                });

                var rl = readline.createInterface({
                    input: process.stdout,
                    output: undefined
                });

                rl.on('line', (data) => {
                    this.output.push({ message: data });
                    subject.onNext(this.output);
                });

                var disposable = Disposable.create(() => {
                    process.removeAllListeners();
                    try { process.kill(); } catch (e) { }
                });
                this.disposable.add(disposable);

                var cb = () => {
                    disposable.dispose();
                    this.start();
                }

                process.on('close', cb);
                process.on('exit', cb);
                process.on('disconnect', cb);
            });
    }

    public dispose() {
        this.disposable.dispose();
    }
}

export class RunProcess {
    private disposable = new CompositeDisposable();
    constructor(private project: ProjectViewModel, private command: string) { }

    public output: string[];

    public start() {
        var names = this.project.name.split('.');
        var name = names[names.length - 1];
        this.disposable.add(dock.addWindow(`${this.project.name}${this.command}`, `${name} --watch ${this.command}`, CommandOutputWindow, {}, { closeable: true }, this.disposable));

        var solution = Omni.getClientForProject(this.project)
            .map(solution => solution.model.dnx.RuntimePath)
            .subscribe(runtime => {
                var process = spawn(runtime, ['--watch', this.project.path, this.command], {
                    env, stdio: 'pipe'
                });

                var rl = readline.createInterface({
                    input: process.stdout,
                    output: undefined
                });

                rl.on('line', (data) => this.output.push(data));

                var disposable = Disposable.create(() => {
                    try { process.kill(); } catch (e) { }
                });
                this.disposable.add(disposable);
            });
    }
}

export var commandRunner = new CommandRunner
