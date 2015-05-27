import manager = require("./client-manager");
import Client = require("./client");
//import {DriverState} from "omnisharp-client";
import _ = require('lodash');

class Omni {
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

    public static getFrameworks(projects: string[]): string {
        var frameworks = _.map(projects, (project: string) => {
            return project.indexOf('+') === -1 ? '' : project.split('+')[1];
        }).filter((fw: string) => fw.length > 0);
        return frameworks.join(',');
    }
}

export = Omni
