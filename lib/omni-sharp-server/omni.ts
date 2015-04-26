import OmniSharpServer = require('./omni-sharp-server')
import Url = require("url");
import _ = require("lodash");
import Promise = require("bluebird");
import Rx = require('rx');
Rx.config.Promise = Promise;
type Request = OmniSharp.Models.Request;
// TODO: Make .d.ts and submit to DefinitelyTyped?
var request: (options: any) => Promise<string> = require("request-promise")

class Omni {
    public static get client() { return OmniSharpServer.client; }

    public static getEditorContext(editor: Atom.TextEditor): Request {
        editor = editor || atom.workspace.getActiveTextEditor();
        if (!editor) {
            return;
        }
        var marker = editor.getCursorBufferPosition();
        var buffer = editor.getBuffer().getLines().join('\n');
        return {
            Column: marker.column + 1,
            FileName: editor.getURI(),
            Line: marker.row + 1,
            Buffer: buffer
        };
    }

    public static makeRequest(editor?: Atom.TextEditor, buffer?: TextBuffer.TextBuffer) {
        editor = editor || atom.workspace.getActiveTextEditor();
        buffer = buffer || editor.getBuffer();

        var bufferText = buffer.getLines().join('\n');

        var marker = editor.getCursorBufferPosition();
        return <OmniSharp.Models.Request>{
            Column: marker.column + 1,
            FileName: editor.getURI(),
            Line: marker.row + 1,
            Buffer: bufferText
        };
    }

    public static makeDataRequest<T>(data: T, editor?: Atom.TextEditor, buffer?: TextBuffer.TextBuffer) {
        return <T>_.extend(data, Omni.makeRequest(editor, buffer));
    }

    public static navigateTo(response: { FileName: string; Line: number; Column: number; }) {
        atom.workspace.open(response.FileName, undefined)
            .then((editor) => {
                editor.setCursorBufferPosition([response.Line && response.Line - 1, response.Column && response.Column - 1])
            });
    }
}

export = Omni
