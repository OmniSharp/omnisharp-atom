import Omni = require('../../omni-sharp-server/omni')
import child_process = require('child_process')
var spawn = child_process.spawn

class Build {
    private build: child_process.ChildProcess;

    public activate() {
        atom.commands.add('atom-workspace', 'omnisharp-atom:build', () => {
            atom.commands.dispatch(atom.views.getView(atom.workspace), 'omnisharp-atom:show-build');
            return Omni.build();
        });

        atom.emitter.on("omni:build-command", (command) => {
            var pattern = /[\w\\\/:=_\-\.]+|"[\w\\\s\/:=_\-\.]*"/g;
            var args = command.match(pattern);
            var buildCommand = args.shift();
            var projectPath = args[args.length - 1];

            args[args.length - 1] = projectPath.substring(1, projectPath.length - 1);

            this.build = spawn(buildCommand, args);
            atom.emitter.emit("omnisharp-atom:building", command);
            this.build.stdout.on('data', this.out);
            this.build.stderr.on('data', this.err);
            return this.build.on('close', this.close);
        });
    }

    public out = (data) =>
        atom.emitter.emit("omnisharp-atom:build-message", data.toString())

    public err = (data) =>
        atom.emitter.emit("omnisharp-atom:build-err", data.toString())

    public close = (exitCode) =>
        atom.emitter.emit("omnisharp-atom:build-exitcode", exitCode)
}
export = Build
