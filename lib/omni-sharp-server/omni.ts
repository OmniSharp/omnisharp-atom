import manager = require("./client-manager");
import Client = require("./client");
import {DriverState} from "omnisharp-client";
import _ = require('lodash');

manager.registerConfiguration(client => client.state.subscribe(z => Omni.updateState(z)));

class Omni {
    private static _vm: OmniSharp.vm = {
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

    public static get vm() {
        return Omni._vm;
    }

    public static get turnedOnAndReady() {
        return Omni._vm.isReady;
    }

    public static toggle() {
        if (manager.connected) {
            manager.disconnect();
        } else {
            manager.connect();
        }
    }

    public static navigateTo(response: { FileName: string; Line: number; Column: number; }) {
        atom.workspace.open(response.FileName, undefined)
            .then((editor) => {
            editor.setCursorBufferPosition([response.Line && response.Line - 1, response.Column && response.Column - 1])
        });
    }

    public static registerConfiguration(callback: (client: Client) => void) {
        manager.registerConfiguration(callback);
    }

    public static updateState(state) {
        this.vm.isLoading = state === DriverState.Connecting;
        this.vm.isNotLoading = !this.vm.isLoading;
        this.vm.isOff = state === DriverState.Disconnected;
        this.vm.isNotOff = !this.vm.isOff;
        this.vm.isOn = state === DriverState.Connecting || state === DriverState.Connected;
        this.vm.isReady = state === DriverState.Connected;
        this.vm.isNotReady = !this.vm.isReady;
        this.vm.isNotError = !this.vm.isError;
        this.vm.isError = state === DriverState.Error;
        this.vm.isLoadingOrReady = this.vm.isLoading || this.vm.isReady;
        this.vm.iconText = manager.numberOfClients.toString();
    }

    public static getFrameworks(projects: string[]): string {
        var frameworks = _.map(projects, (project: string) => {
            return project.indexOf('+') === -1 ? '' : project.split('+')[1];
        }).filter((fw: string) => fw.length > 0);
        return frameworks.join(',');
    }
}

export = Omni
