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

    constructor(public client: Client) { }
}

export = ViewModel;
