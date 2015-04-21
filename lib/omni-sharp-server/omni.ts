import OmniSharpServer = require('./omni-sharp-server')
import Url = require("url")
import _ = require("lodash")
import Promise = require("bluebird")
type Request = OmniSharp.Models.Request;
// TODO: Make .d.ts and submit to DefinitelyTyped?
var request: (options: any) => Promise<string> = require("request-promise")

class Omni {
    public static getEditorContext(editor: Atom.TextEditor) : Request {
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

    public static req<TRequest extends Request, TResponse>(path: string, event: string, data?: TRequest, editor?: Atom.TextEditor): Promise<TResponse> {
        var context = Omni.getEditorContext(editor);
        if (!context) {
            return Promise.reject<any>("no editor context found");
        }
        var fullData = <TRequest>_.extend({}, context, data);
        var result = Omni._req<TRequest, TResponse>(path, event, fullData, editor);

            var ref;
            if (typeof data !== 'string') {
                console.error(data.statusCode != null, (ref = data.options) != null ? ref.uri : void 0);
            }
        });

        return result;
    }

    public static reql<TRequest, TResponse>(path: string, event: string, data?: TRequest, editor?: Atom.TextEditor): Promise<TResponse> {
        var context = Omni.getEditorContext(editor);
        if (!context) {
            return Promise.reject<any>("no editor context found");
        }
        var fullData = <TRequest>_.extend([], [context], data);
        var result = Omni._req<TRequest, TResponse>(path, event, fullData, editor);

        result.catch(function(data) {
            var ref;
            if (typeof data !== 'string') {
                console.error(data.statusCode != null, (ref = data.options) != null ? ref.uri : void 0);
            }
        });

        return result;
    }

    private static _req<TRequest, TResponse>(path: string, event: string, data: TRequest, editor: Atom.TextEditor): Promise<TResponse> {
        if (OmniSharpServer.vm.isNotReady) {
            return Promise.reject<any>("omnisharp not ready");
        }

        var context = Omni.getEditorContext(editor);
        if (!context) {
            return Promise.reject<any>("no editor context found");
        }

        return OmniSharpServer.get()
        .request<TRequest, TResponse>(path, <TRequest>_.extend({}, context, data))
        .then(function(data) {
            atom.emitter.emit("omni:" + event, data);
            console.log("omni:" + event, data);
            return data;
        })
    }

    public static syntaxErrors() {
        return Omni.req("syntaxErrors", "syntax-errors");
    }

    public static codecheck(buffer, editor) {
        return Omni.req<Request, OmniSharp.Models.QuickFixResponse>("codecheck", "quick-fixes", null, editor);
    }

    public static findUsages() {
        return Omni.req<Request, OmniSharp.Models.QuickFixResponse>("findUsages", "find-usages");
    }

    public static goToDefinition() {
        return Omni.req<Request, OmniSharp.Models.GotoDefinitionResponse>("gotoDefinition", "navigate-to");
    }

    public static goToImplementation() {
        return Omni.req<OmniSharp.Request, OmniSharp.QuickFixResponse>("findimplementations", "navigate-to-implementation");
    }

    public static fixUsings() {
        return Omni.req("fixUsings", "code-format");
    }

    public static codeFormat() {
        return Omni.req<Request, OmniSharp.Models.CodeFormatResponse>("codeFormat", "code-format");
    }

    public static build() {
        return Omni.req("buildcommand", "build-command");
    }

    public static packageRestore() {
        Omni.reql("filesChanged", "package-restore");
    }

    public static autocomplete(wordToComplete: string) {
        var data: OmniSharp.Models.AutoCompleteRequest = {
            WordToComplete: wordToComplete,
            WantDocumentationForEveryCompletionResult: false,
            WantKind: true,
            WantSnippet: true,
            WantReturnType: true

        };
        return Omni.req<OmniSharp.Models.AutoCompleteRequest, OmniSharp.Models.AutoCompleteResponse[]>("autocomplete", "autocomplete", data);
    }

    public static rename(wordToRename: string) {
        var data : OmniSharp.Models.RenameRequest = {
            RenameTo: wordToRename
        };
        return Omni.req("rename", "rename", data);
    }
}

export = Omni
