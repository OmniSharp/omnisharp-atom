import manager = require("./client-manager");
import Client = require("./client");

class Omni {

    public static get vm() {
        return manager.getClientForActiveEditor().vm;
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
}

export = Omni
