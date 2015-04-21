import OmniSharpServer = require('./omni-sharp-server')
import Url = require("url")
import _ = require("lodash")
import Promise = require("bluebird")
// TODO: Make .d.ts and submit to DefinitelyTyped?
var request: (options: any) => Promise<string> = require("request-promise")

class Omni {
    public static getEditorContext(editor: Atom.TextEditor) : OmniSharp.Request {
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

    private static _uri(path: string, query?: string) {
        var port = OmniSharpServer.get().port;
        return Url.format({
            hostname: "localhost",
            protocol: "http",
            port: port,
            pathname: path,
            query: query
        })
    }

    public static req<TRequest extends OmniSharp.Request, TResponse>(path: string, event: string, data?: TRequest, editor?: Atom.TextEditor): Promise<TResponse> {
        var result = Omni._req<TRequest, TResponse>(path, event, data, editor);

        result.catch(data => {
            var ref;
            if (typeof data !== 'string') {
                console.error(data.statusCode != null, (ref = data.options) != null ? ref.uri : void 0);
            }
        })

        return result;
    }

    private static _req<TRequest extends OmniSharp.Request, TResponse>(path: string, event: string, data : TRequest, editor: Atom.TextEditor): Promise<TResponse> {
        if (OmniSharpServer.vm.isNotReady) {
            return Promise.reject<any>("omnisharp not ready");
        }

        var context = Omni.getEditorContext(editor);
        if (!context) {
            return Promise.reject<any>("no editor context found");
        }

        return request({
            uri: Omni._uri(path),
            method: "POST",
            json: true,
            body: _.extend({}, context, data)
        }).then(function(data) {
            var parsedData;
            try {
                parsedData = JSON.parse(data);
            } catch (_error) {
                parsedData = data;
            } finally {
                atom.emitter.emit("omni:" + event, parsedData);
                console.log("omni:" + event, parsedData);
            }
            return <TResponse>parsedData;
        })
    }

    public static syntaxErrors() {
        return Omni.req("syntaxErrors", "syntax-errors");
    }

    public static codecheck(buffer, editor) {
        return Omni.req<OmniSharp.Request, OmniSharp.QuickFixResponse>("codecheck", "quick-fixes", null, editor);
    }

    public static findUsages() {
        return Omni.req<OmniSharp.Request, OmniSharp.QuickFixResponse>("findUsages", "find-usages");
    }

    public static goToDefinition() {
        return Omni.req<OmniSharp.Request, OmniSharp.GotoDefinitionResponse>("gotoDefinition", "navigate-to");
    }

    public static fixUsings() {
        return Omni.req("fixUsings", "code-format");
    }

    public static codeFormat() {
        return Omni.req<OmniSharp.Request, OmniSharp.CodeFormatResponse>("codeFormat", "code-format");
    }

    public static build() {
        return Omni.req("buildcommand", "build-command");
    }

    public static autocomplete(wordToComplete: string) {
        var data : OmniSharp.AutoCompleteRequest = {
            WordToComplete: wordToComplete,
            WantDocumentationForEveryCompletionResult: false,
            WantKind: true
        };
        return Omni.req<OmniSharp.AutoCompleteRequest, OmniSharp.AutoCompleteResponse[]>("autocomplete", "autocomplete", data);
    }

    public static rename(wordToRename: string) {
        var data : OmniSharp.RenameRequest = {
            RenameTo: wordToRename
        };
        return Omni.req("rename", "rename", data);
    }
}

export = Omni
