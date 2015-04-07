import OmniSharpServer = require('./omni-sharp-server')
import Url = require("url")
import _ = require("lodash")
import Promise = require("bluebird")
// TODO: Make .d.ts and submit to DefinitelyTyped?
var request : (options:any) => Promise<any> = require("request-promise")

class Omni {
    public static getEditorContext(editor: AtomCore.IEditor) {
        editor = editor || atom.workspace.getActiveEditor();
        if (!editor) {
            return;
        }
        var marker = editor.getCursorBufferPosition();
        // TODO: Cleanup get lines when .d.ts returns `string[]`` instead of `string`
        var buffer = (<any>editor.buffer.getLines()).join('\n');
        return {
            column: marker.column + 1,
            filename: editor.getUri(),
            line: marker.row + 1,
            // TODO: Update atom.d.ts?
            buffer: buffer
        }
    }

    private static _uri(path: string, query? : string) {
        var port = OmniSharpServer.get().port;
        return Url.format({
            hostname: "localhost",
            protocol: "http",
            port: port,
            pathname: path,
            query: query
        })
    }

    public static req(path: string, event: string, d?: any, editor?: AtomCore.IEditor) : Promise<any> {
        return Omni._req(path, event, d, editor)
            .catch(data => {
            var ref;
            if (typeof data !== 'string') {
                return console.error(data.statusCode != null, (ref = data.options) != null ? ref.uri : void 0);
            }
        })
    }

    private static _req(path: string, event: string, d, editor: AtomCore.IEditor) : Promise<any> {
        if (OmniSharpServer.vm.isNotReady) {
            return Promise.reject("omnisharp not ready");
        }

        var context = Omni.getEditorContext(editor);
        if (!context) {
            return Promise.reject("no editor context found");
        }

        return request({
            uri: Omni._uri(path),
            method: "POST",
            json: true,
            body: _.extend({}, context, d)
        }).then(function(data) {
            var parsedData;
            try {
                parsedData = JSON.parse(data);
            } catch (_error) {
                parsedData = data;
            } finally {
                // TODO: Add to atom.d.ts?
                atom.emit("omni:" + event, parsedData);
                console.log("omni:" + event, parsedData);
            }
            return parsedData;
        })
    }

    public static syntaxErrors() {
        return Omni.req("syntaxErrors", "syntax-errors");
    }

    public static codecheck(buffer, editor) {
        return Omni.req("codecheck", "quick-fixes", null, editor);
    }

    public static findUsages() {
        return Omni.req("findUsages", "find-usages");
    }

    public static goToDefinition() {
        return Omni.req("gotoDefinition", "navigate-to");
    }

    public static fixUsings() {
        return Omni.req("fixUsings", "code-format");
    }

    public static codeFormat() {
        return Omni.req("codeFormat", "code-format");
    }

    public static build() {
        return Omni.req("buildcommand", "build-command");
    }

    public static autocomplete(wordToComplete) {
        var data = {
            wordToComplete: wordToComplete,
            wantDocumentationForEveryCompletionResult: false,
            wantKind: true
        };
        return Omni.req("autocomplete", "autocomplete", data);
    }

    public static rename(wordToRename) {
        var data = {
            renameTo: wordToRename
        };
        return Omni.req("rename", "rename", data);
    }
}

export = Omni
