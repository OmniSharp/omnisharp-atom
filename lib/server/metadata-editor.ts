import {TextEditor} from 'atom';
import {startsWith} from 'lodash';
import {IDisposable} from 'ts-disposables';
import {OmnisharpEditorContext, IOmnisharpTextEditor} from './omnisharp-text-editor';
import {Solution} from './solution';
import {SolutionManager} from './solution-manager';

const metadataUri = 'omnisharp://metadata/';
export function metadataOpener(): IDisposable {
    function createEditorView(assemblyName: string, typeName: string) {
        function issueRequest(solution: Solution) {
            return solution.request<any, { Source: string; SourceName: string }>('metadata', { AssemblyName: assemblyName, TypeName: typeName })
                .map(response => ({ source: response.Source, path: response.SourceName, solution }));
        }

        function setupEditor({solution, path, source}: { solution: Solution; source: string; path: string }) {
            const editor = new TextEditor({});
            editor.setText(source);
            editor.onWillInsertText(e => e.cancel());
            editor.getBuffer().setPath(path);

            const context = new OmnisharpEditorContext(editor, solution);
            context.metadata = true;
            const result: IOmnisharpTextEditor = <any>editor;
            result.omnisharp = context;

            editor.save = function () { /* */ };
            editor.saveAs = function () { /* */ };

            return editor;
        }

        return SolutionManager.activeSolution
            .take(1)
            .flatMap(issueRequest, (_z, z) => setupEditor(z))
            .toPromise();
    }

    return <any>atom.workspace.addOpener((uri: string) => {
        if (startsWith(uri, metadataUri)) {
            const url = uri.substr(metadataUri.length);
            const [assemblyName, typeName] = url.split('/');
            return createEditorView(assemblyName, typeName);
        }
    });
}
