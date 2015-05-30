import * as _ from "lodash";
import Client = require('./client');
import {DriverState, OmnisharpClientStatus} from "omnisharp-client";
import {Observable} from "rx";

class ViewModel {
    public updated: Observable<Rx.ObjectObserveChange<ViewModel>>;

    public isOff: boolean;
    public isConnecting: boolean;
    public isOn: boolean;
    public isReady: boolean;
    public isError: boolean;

    private _uniqueId;
    public get uniqueId() { return this._client.uniqueId; }
    public output: OmniSharp.OutputMessage[] = [];
    public diagnostics: OmniSharp.Models.DiagnosticLocation[] = [];
    public status: OmnisharpClientStatus;

    public observe: {
        codecheck: Rx.Observable<OmniSharp.Models.DiagnosticLocation[]>;
        output: Rx.Observable<OmniSharp.OutputMessage[]>;
        status: Rx.Observable<OmnisharpClientStatus>;
    };

    constructor(private _client: Client) {
        this._uniqueId = _client.uniqueId;
        this._updateState(_client.currentState);

        // Manage our build log for display
        _client.logs.subscribe(event => {
            this.output.push(event);
            if (this.output.length > 1000)
                this.output.shift();
        });

        var codecheck = _client.observeCodecheck
            .where(z => !z.request.FileName)
            .map(z => z.response)
            .map(z => <OmniSharp.Models.DiagnosticLocation[]>z.QuickFixes)
            .map(data => _.sortBy(data, quickFix => quickFix.LogLevel))
            .startWith([])
            .shareReplay(1);

        codecheck.subscribe((data) => this.diagnostics = data);

        var status = _client.status
            .startWith(<any>{})
            .share();
        _client.status.subscribe(z => this.status = z);

        var output = this.output;

        this.observe = {
            get codecheck() { return codecheck; },
            get output() { return _client.logs.map(() => output); },
            get status() { return status; }
        };

        _client.state.subscribe(_.bind(this._updateState, this));

        this.updated = Observable.ofObjectChanges(this);

        (window['clients'] || (window['clients'] = [])).push(this);  //TEMP
    }

    private _updateState(state) {
        this.isOn = state === DriverState.Connecting || state === DriverState.Connected;
        this.isOff = state === DriverState.Disconnected;
        this.isConnecting = state === DriverState.Connecting;
        this.isReady = state === DriverState.Connected;
        this.isError = state === DriverState.Error;
    }
}

export = ViewModel;
