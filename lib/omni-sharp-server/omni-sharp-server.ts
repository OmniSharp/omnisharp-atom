import child_process = require('child_process')
var spawn = child_process.spawn
var BrowserWindow = require('remote').require('browser-window')
var OmnisharpLocation = require('omnisharp-server-roslyn-binaries')
var findFreePort = require('freeport')
import _ = require('lodash')
import Promise = require("bluebird");

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
        isOffOrError: false,
        isOffAndNotError: false,
        isError: false,
        isLoadingOrReady: false,
        isLoadingOrReadyOrError: false,
        state: "off",
        previousState: "off",
        iconText: "",
        isOpen: false
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
        findFreePort((err, port) => {
            var ref;
            if (err) {
                return console.error("error finding freeport: ", err);
            }
            this.port = port;


            var path = atom && atom.project && atom.project.getPaths()[0] || void 0;
            var serverArguments = ["--stdio", "-s", path, "-p", port, "--hostPID", process.pid];
            this.child = spawn(executablePath, serverArguments);
            atom.emitter.emit("omni-sharp-server:start", this.child.pid, port);
            atom.emitter.emit("omni-sharp-server:state-change", "loading");
            this.child.stdout.on('data', this.serverStart);
            this.child.stderr.on('data', this.serverErr);
            this.child.stdout.on('data', this.serverResponse);
            this.child.on('close', this.close);
            this.child.on('error', this.serverErr);
        })
    }

    private serverStart = (data) => {
        var s = data.toString();

        var ref = s.match(/Detected an OmniSharp instance already running on port/);
        if ((ref != null ? ref.length : 0) > 0) {
            atom.emitter.emit("omni-sharp-server:error");
            atom.emitter.emit("omni-sharp-server:state-change", "error");
            this.stop();
        }
    }

    private _outstandingRequests: { [seq: number]: { resolve: (thenable: any | Promise.Thenable<any>) => void; reject: (error: any) => void; } } = {}
    private _partialResult: string;

    // TODO: Review if this is the best way...
    private serverResponse = (data: any) => {
        var result :string = data.toString();
        if (this._partialResult) {
            result = this._partialResult + result;
        }

        var results = result.split('\n');

        _.each(results, (res, index) =>  {
            if (_.startsWith(res.trim(), "{") && _.endsWith(res.trim(), "}")) {
                this.handleResponse(res)
            } else if (index === results.length - 1) {
                this._partialResult = res;
            } else {
                console.log('wtf...');
            }

        });
    }

    private handleResponse(data: string) {
        try {
            var packet: OmniSharp.Protocol.Packet = JSON.parse(data.toString());
        } catch (_error) {
            atom.emitter.emit("omni-sharp-server:out", 'failed with: ' + data.toString());
        }

        if (!packet) {
            // TODO: Log error?
            return;
        }

        // enum?
        if (packet.Type === "response") {
            var response: OmniSharp.Protocol.ResponsePacket<any> = packet;
            var outstandingRequest = this._outstandingRequests[response.Request_seq];
            if (response.Success) {
                if (outstandingRequest) {
                    outstandingRequest.resolve(response.Body);
                } else {
                    // TODO: using .Command go find stuff
                }
            } else {
                if (outstandingRequest) {
                    outstandingRequest.reject(response.Message);
                } else {
                    // TODO: make notification?
                }
            }

            if (outstandingRequest) {
                delete this._outstandingRequests[response.Request_seq];
            }
        } else if (packet.Type === "event") {
            var event : OmniSharp.Protocol.EventPacket<any> = packet;

            if (event.Event === "started") {
                atom.emitter.emit("omni-sharp-server:ready", this.child.pid);
                atom.emitter.emit("omni-sharp-server:state-change", "ready");
            }

            // TODO: make friend with colors and stuff
            atom.emitter.emit("omni-sharp-server:out", event.Body && event.Body.Message || event.Event || '');
        }
    }

    private serverErr = (data) => {
        var friendlyMessage = this.parseError(data);

        // TODO: make friend with colors and stuff
        return atom.emitter.emit("omni-sharp-server:err", friendlyMessage);
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

            this.child.stdin.write(JSON.stringify(packet) + '\n');
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
