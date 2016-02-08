import {Solution} from "./solution";
import {TextEditor} from "atom";
import {SolutionManager} from "./solution-manager";
import {startsWith} from "lodash";

const metadataUri = "omnisharp://metadata/";
export function metadataOpener(): Rx.IDisposable {
    function createEditorView(assemblyName: string, typeName: string) {
        function issueRequest(solution: Solution) {
            return solution.request<any, { Source: string; SourceName: string }>("metadata", { AssemblyName: assemblyName, TypeName: typeName })
                .map(response => ({ source: response.Source, path: response.SourceName, solution }));
        }

        function setupEditor({solution, path, source}: { solution: Solution; source: string; path: string }) {
            const editor = new TextEditor({});
            editor.setText(source);
            editor.onWillInsertText((e) => e.cancel());
            editor.getBuffer().setPath(path);

            (<any>editor).omniProject = (<any>solution).path;
            (<any>editor).__omniClient__ = solution;
            editor.save = function() { /* */ };
            editor.saveAs = function() { /* */ };
            (<any>editor)._metadataEditor = true;

            return editor;
        }

        return SolutionManager.activeSolution
            .take(1)
            .flatMap(issueRequest)
            .map(setupEditor)
            .toPromise();
    }

    return <any>atom.workspace.addOpener((uri: string) => {
        if (startsWith(uri, metadataUri)) {
            const url = uri.substr(metadataUri.length);
            const [assemblyName, typeName] = url.split("/");
            return createEditorView(assemblyName, typeName);
        }
    });
}
