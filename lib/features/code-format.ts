import {Models} from "omnisharp-client";
import {CompositeDisposable} from "ts-disposables";
import {Omni} from "../server/omni";
import {applyChanges} from "../services/apply-changes";

class CodeFormat implements IFeature {
    private disposable: CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:code-format", () => this.format()));

        this.disposable.add(Omni.switchActiveEditor((editor, cd) => {
            cd.add(editor.onDidInsertText(event => {
                if (event.text.length > 1) return;

                if (event.text === ";" || event.text === "}" || event.text === "{" || event.text.charCodeAt(0) === 10) {
                    Omni.request(editor, solution => solution.formatAfterKeystroke({ Character: event.text }))
                        .subscribe(data => applyChanges(editor, data));
                }
            }));
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public format() {
        const editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            const buffer = editor.getBuffer();
            Omni.request(editor, solution => {
                const request = <Models.FormatRangeRequest>{
                    Line: 0,
                    Column: 0,
                    EndLine: buffer.getLineCount() - 1,
                    EndColumn: 0,
                };

                return solution
                    .formatRange(request)
                    .do((data) => applyChanges(editor, data));
            });
        }
    }

    public required = false;
    public title = "Code Format";
    public description = "Support for code formatting.";
}
export const codeFormat = new CodeFormat;
