import manager = require("./client-manager");
import Client = require("./client");
import omnisharp = require("omnisharp-node-client");

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

    public static toggle() {
        return manager.getClientForActiveEditor().toggle();
    }

    public static get client() {
        return manager.getClientForActiveEditor();
    }

    public static makeRequest(editor?: Atom.TextEditor, buffer?: TextBuffer.TextBuffer) {
        return manager.getClientForActiveEditor().makeRequest(editor, buffer);
    }

    public static makeDataRequest<T>(data: T, editor?: Atom.TextEditor, buffer?: TextBuffer.TextBuffer) {
        return manager.getClientForActiveEditor().makeDataRequest(data, editor, buffer);
    }

    public static navigateTo(response: { FileName: string; Line: number; Column: number; }) {
        return manager.getClientForActiveEditor().navigateTo(response);
    }

    public static registerConfiguration(callback: (client: Client) => void) {
        manager.registerConfiguration(callback);
    }

    public static updateState(state) {
        this.vm.isLoading = state === omnisharp.DriverState.Connecting;
        this.vm.isNotLoading = !this.vm.isLoading;
        this.vm.isOff = state === omnisharp.DriverState.Disconnected;
        this.vm.isNotOff = !this.vm.isOff;
        this.vm.isOn = state === omnisharp.DriverState.Connecting || state === omnisharp.DriverState.Connected;
        this.vm.isReady = state === omnisharp.DriverState.Connected;
        this.vm.isNotReady = !this.vm.isReady
        this.vm.isNotError = !this.vm.isError;
        this.vm.isLoadingOrReady = this.vm.isLoading || this.vm.isReady;
        this.vm.iconText = this.vm.isError ? "omni error occured" : "";
    };
}

export = Omni
