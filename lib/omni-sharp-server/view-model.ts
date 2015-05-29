import * as _ from "lodash";
import Client = require('./client');
import {DriverState} from "omnisharp-client";

class ViewModel {
    public get isOff() { return this.client.currentState === DriverState.Disconnected; }
    public get isConnecting() { return this.client.currentState === DriverState.Connecting; }
    public get isOn() { return this.client.currentState === DriverState.Connecting || this.client.currentState === DriverState.Connected; }
    public get isReady() { return this.client.currentState === DriverState.Connected; }
    public get isError() { return this.client.currentState === DriverState.Error; }

    public get uniqueId() { return this.client.uniqueId; }
    public output: OmniSharp.OutputMessage[] = [];
    public diagnostics: OmniSharp.Models.DiagnosticLocation[] = [];

    private _codeCheck: Rx.Observable<OmniSharp.Models.DiagnosticLocation[]>;
    public get codecheck() { return this._codeCheck; }

    constructor(public client: Client) {
        // Manage our build log for display
        client.logs.subscribe(event => {
            this.output.push(event);
            if (this.output.length > 1000)
                this.output.shift();
        });

        this.codecheck = client.observeCodecheck
            .where(z => z.request.FileName === null)
            .map(z => z.response)
            .merge(client.codecheck({})) // This kicks off the first code check
            .map(z => <OmniSharp.Models.DiagnosticLocation[]>z.QuickFixes)
            .startWith([]); // Populates our data
            
        this.codecheck.subscribe((data) => this.diagnostics = _.sortBy(data, quickFix => quickFix.LogLevel));
    }
}

export = ViewModel;
