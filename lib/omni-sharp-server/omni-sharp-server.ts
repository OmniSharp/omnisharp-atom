import child_process = require('child_process')
var spawn = child_process.spawn
var BrowserWindow = require('remote').require('browser-window')
var OmnisharpLocation = require('omnisharp-server-roslyn-binaries')
var findFreePort = require('freeport')
import _ = require('lodash')

class OmniSharpServer {
    public vm : OmniSharp.vm = {
        isNotLoading: true,
        isLoading: false,
        isOff: true,
        isNotOff: false,
        isOn: false,
        isNotReady: true,
        isReady: false,
        isNotError: true,
        isOffOrError: false,
        isOffAndNotError: false,
        isError: false,
        isLoadingOrReady: false,
        isLoadingOrReadyOrError: false,
        state: "off",
        previousState: "off",
        iconText: ""
    }

    private _instance: OmniSharpServerInstance;
    public get() {
        if (this._instance == null)
            this._instance = new OmniSharpServerInstance();
        return this._instance;
    }
}

var server = new OmniSharpServer();
export = server;

atom.on("omni-sharp-server:state-change", (state) => {
    server.vm.previousState = server.vm.state;
    server.vm.state = state;
    server.vm.isOn = state === "on";
    server.vm.isOff = state === "off";
    server.vm.isNotOff = state !== "off";
    server.vm.isError = state === "error" || (state === "off" && server.vm.previousState === "error");
    server.vm.isNotError = !server.vm.isError;
    server.vm.isOffOrError = server.vm.isError || server.vm.isOff;
    server.vm.isOffAndNotError = !server.vm.isError && server.vm.isOff;
    server.vm.isLoading = state === "loading";
    server.vm.isNotLoading = state !== "loading";
    server.vm.isReady = state === "ready";
    server.vm.isNotReady = !server.vm.isReady;
    server.vm.isLoadingOrReady = state === "ready" || state === "loading";
    server.vm.isLoadingOrReadyOrError = server.vm.isLoadingOrReady || server.vm.isError;
    server.vm.iconText = server.vm.isError ? "omni error occured" : "";
    return atom.emit("omni-sharp-server:state-change-complete", state);
})

class OmniSharpServerInstance {
    public packageDir = atom.packages.packageDirPaths[0];
    public location = OmnisharpLocation;
    public child;
    public port;

    public start() {
        var executablePath, useMono;
        useMono = process.platform !== "win32";
        executablePath = this.location;
        return findFreePort((err, port) => {
            var ref;
            if (err) {
                return console.error("error finding freeport: ", err);
            }
            this.port = port;
            var serverArguments = ["-s", typeof atom !== "undefined" && atom !== null ? (ref = atom.project) != null ? ref.getPaths()[0] : void 0 : void 0, "-p", port];
            this.child = spawn(executablePath, serverArguments);
            atom.emit("omni-sharp-server:start", this.child.pid, port);
            atom.emit("omni-sharp-server:state-change", "loading");
            this.child.stdout.on('data', this.out);
            this.child.stderr.on('data', this.err);
            this.child.on('close', this.close);
            return this.child.on('error', this.err);
        })
    }

    public out = (data) => {
        var s = data.toString();

        var ref = s.match(/Solution has finished loading/);
        if ((ref != null ? ref.length : 0) > 0) {
            atom.emit("omni-sharp-server:ready", this.child.pid);
            atom.emit("omni-sharp-server:state-change", "ready");
        }

        var ref = s.match(/Detected an OmniSharp instance already running on port/);
        if ((ref != null ? ref.length : 0) > 0) {
            atom.emit("omni-sharp-server:error");
            atom.emit("omni-sharp-server:state-change", "error");
            this.stop();
        }

        return atom.emit("omni-sharp-server:out", s);
    }

    public err = (data) => {
        var friendlyMessage = this.parseError(data);
        return atom.emit("omni-sharp-server:err", friendlyMessage);
    }

    public close = (data) => {
        atom.emit("omni-sharp-server:close", data);
        atom.emit("omni-sharp-server:state-change", "off");
        return this.port = null;
    }

    public stop() {
        if (this.child != null) {
            this.child.kill("SIGKILL");
        }

        return this.child = null;
    }

    public toggle() {
        if (this.child) {
            return this.stop();
        } else {
            return this.start();
        }
    }

    public parseError(data) {
        var message = data.toString();
        if (data.code === 'ENOENT' && data.path === 'mono') {
            message = 'mono could not be found, please ensure it is installed and in your path';
        }
        return message;
    }
}
