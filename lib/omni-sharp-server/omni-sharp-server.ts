import child_process = require('child_process')
var spawn = child_process.spawn
var BrowserWindow = require('remote').require('browser-window')
var OmnisharpLocation = require('omnisharp-server-roslyn-binaries')
import _ = require('lodash')
import Promise = require("bluebird");
import readline = require("readline");
<<<<<<< HEAD
import finder = require('./project-finder');
=======
import omnisharp = require("omnisharp-node-client");
>>>>>>> Converted to using omnisharp-node-client to control the server connection.  Refactored to not wrap the client up too much and reduce events that are getting emitted.

class OmniSharpServer {
    public vm: OmniSharp.vm = {
        isNotLoading: true,
        isLoading: false,
        isOff: true,
        isNotOff: false,
        isOn: false,
        isNotReady: true,
        isReady: false,
        isNotError: true,
        isError: false,
        isLoadingOrReady: false,
        iconText: "",
        isOpen: false
    }

<<<<<<< HEAD
    private _instance: OmniSharpServerInstance;
    public get() {
        if (this._instance == null)
            this._instance = new OmniSharpServerInstance();
        return this._instance;
    }
}

var server = new OmniSharpServer();
export = server;

atom.emitter.on("omni-sharp-server:state-change", (state) => {
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
    return atom.emitter.emit("omni-sharp-server:state-change-complete", state);
})

class OmniSharpServerInstance {
    public packageDir = atom.packages.getPackageDirPaths()[0];
    public location = OmnisharpLocation;
    public child: child_process.ChildProcess;
    public port;
    private _seq = 0;

    public start() {
        var executablePath, useMono;
        useMono = process.platform !== "win32";
        executablePath = this.location;


        var path = finder.findProject(atom && atom.project && atom.project.getPaths()[0]);
        var serverArguments = ["--stdio", "-s", path, "--hostPID", <any>process.pid];
        this.child = spawn(executablePath, serverArguments);
        atom.emitter.emit("omni-sharp-server:start", { pid: this.child.pid, path: path, exePath: executablePath});
        atom.emitter.emit("omni-sharp-server:state-change", "loading");
        this.child.stdout.on('data', this.serverStart);
        this.child.stderr.on('data', this.serverErr);
        var rl = readline.createInterface({
            input: this.child.stdout,
            output: undefined
        });
        rl.on('line', this.handleResponse);
        this.child.on('close', this.close);
        this.child.on('error', this.serverErr);
    }

    private serverStart = (data) => {
        var s = data.toString();

        var ref = s.match(/Detected an OmniSharp instance already running on port/);
        if ((ref != null ? ref.length : 0) > 0) {
            atom.emitter.emit("omni-sharp-server:error");
            atom.emitter.emit("omni-sharp-server:state-change", "error");
            this.stop();
=======
    public toggle() {
        if (this.client.currentState === omnisharp.DriverState.Disconnected) {
            var path = atom && atom.project && atom.project.getPaths()[0];
            this.client.connect({
                projectPath: path
            });
            atom.emitter.emit("omni-sharp-server:start", this.client.id);
            atom.emitter.emit("omni-sharp-server:state-change", "loading");
        } else {
            this.client.disconnect();
>>>>>>> Converted to using omnisharp-node-client to control the server connection.  Refactored to not wrap the client up too much and reduce events that are getting emitted.
        }
    }

    private _client: omnisharp.OmnisharpClient;
    public get client() { return this._client; }

<<<<<<< HEAD
    private handleResponse = (data: string) => {
        try {
            var packet: OmniSharp.Protocol.Packet = JSON.parse(data.toString().trim());
        } catch (_error) {
            atom.emitter.emit("omni-sharp-server:out", { message: 'failed with: ' + data.toString(), logLevel: "ERROR" });
        }

        if (!packet) {
            // TODO: Log error?
            return;
        }
=======
    constructor() {
        var client = this._client = new omnisharp.OmnisharpClient();
        this.configure(client);
    }
>>>>>>> Converted to using omnisharp-node-client to control the server connection.  Refactored to not wrap the client up too much and reduce events that are getting emitted.

    private configure(client: omnisharp.OmnisharpClient) {
        console.log('configure called')
        atom.notifications.addInfo("configured called");
        client.events.subscribe(event => {
            atom.emitter.emit("omni-sharp-server:out", event.Body && event.Body.Message || event.Event || '');

            if (event.Type === "error") {
                atom.emitter.emit("omni-sharp-server:err", event.Body && event.Body.Message || event.Event || '');
            }
        });

        client.state.subscribe(state => {
            atom.emitter.emit("omni-sharp-server:state-change", state);
            if (state == omnisharp.DriverState.Connected) {
                atom.emitter.emit("omni-sharp-server:ready", client.id);
            } else if (state == omnisharp.DriverState.Disconnected) {
                atom.emitter.emit("omni-sharp-server:close", "closing server");
            }
        });

<<<<<<< HEAD
            var outMessage = {
              message: event.Body && event.Body.Message || event.Event || '',
              logLevel: event.Body && event.Body.LogLevel || 'INFORMATION'
            };

            atom.emitter.emit("omni-sharp-server:out", outMessage);
        }
    }

    private serverErr = (data) => {
        var outMessage = { message: this.parseError(data), logLevel: "ERROR" };

        return atom.emitter.emit("omni-sharp-server:err", outMessage);
    }

    public request<TRequest extends OmniSharp.Models.Request, TResponse>(command: string, request: TRequest): Promise<TResponse> {
        var sequence = this._seq++;
        var packet: OmniSharp.Protocol.RequestPacket<TRequest> = {
            Command: command,
            Seq: sequence,
            Arguments: request
        };

        return new Promise<TResponse>((resolve, reject) => {
            this._outstandingRequests[sequence] = { resolve: resolve, reject: reject };

            this.child.stdin.write(JSON.stringify(packet) + '\n', 'ascii');
        })
    }

    public close = (data) => {
        atom.emitter.emit("omni-sharp-server:close", data);
        atom.emitter.emit("omni-sharp-server:state-change", "off");
        return this.port = null;
    }

    public stop() {
        if (this.child != null) {
            this.child.kill("SIGKILL");
        }
=======
        client.errors.subscribe(exception => {
            console.error(exception);
        });
>>>>>>> Converted to using omnisharp-node-client to control the server connection.  Refactored to not wrap the client up too much and reduce events that are getting emitted.

        client.responses.subscribe(data => {
            console.log("omni:" + event, data);
        });
    }
}

var server = new OmniSharpServer();
export = server;

atom.emitter.on("omni-sharp-server:state-change", (state: omnisharp.DriverState) => {
    server.vm.isLoading = state === omnisharp.DriverState.Connecting;
    server.vm.isNotLoading = !this.isLoading;
    server.vm.isOff = state === omnisharp.DriverState.Disconnected;
    server.vm.isNotOff = !this.isOff;
    server.vm.isOn = state === omnisharp.DriverState.Connecting || state === omnisharp.DriverState.Connected;
    server.vm.isReady = state === omnisharp.DriverState.Connected;
    server.vm.isNotReady = !this.isReady
    server.vm.isNotError = !this.isError;
    server.vm.isLoadingOrReady = this.isLoading || this.isReady;
    server.vm.iconText = server.vm.isError ? "omni error occured" : "";
    atom.emitter.emit("omni-sharp-server:state-change-complete", omnisharp.DriverState[state]);
});
