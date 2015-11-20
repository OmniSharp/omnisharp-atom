import {OmniSharp} from "../../omnisharp";
import {Omni} from "../../omni-sharp-server/omni";
/* tslint:disable:variable-name */
const Range = require("atom").Range;
/* tslint:enable:variable-name */
import * as _ from "lodash";
import {Observable, CompositeDisposable} from "rx";
import {codeCheck} from "../features/code-check";

interface LinterError {
    type: string; // "error" | "warning"
    text?: string;
    html?: string;
    filePath?: string;
    range?: Range;
    [key: string]: any;
}

function getWordAt(str: string, pos: number) {
    const wordLocation = {
        start: pos,
        end: pos
    };

    if (str === undefined) {
        return wordLocation;
    }

    while (pos < str.length && /\W/.test(str[pos])) {
        ++pos;
    }

    const left = str.slice(0, pos + 1).search(/\W(?!.*\W)/);
    const right = str.slice(pos).search(/(\W|$)/);

    wordLocation.start = left + 1;
    wordLocation.end = wordLocation.start + right;

    return wordLocation;
}

function mapValues(editor: Atom.TextEditor, error: OmniSharp.Models.DiagnosticLocation): LinterError {
    const line = error.Line;
    const column = error.Column;
    const text = editor.lineTextForBufferRow(line);
    const wordLocation = getWordAt(text, column);
    const level = error.LogLevel.toLowerCase();

    return {
        type: level,
        text: `${error.Text} [${Omni.getFrameworks(error.Projects) }] `,
        filePath: editor.getPath(),
        line: line + 1,
        col: column + 1,
        range: new Range([line, wordLocation.start], [line, wordLocation.end])
    };
}

function showLinter() {
    _.each(document.querySelectorAll("linter-bottom-tab"), (element: HTMLElement) => element.style.display = "");
    _.each(document.querySelectorAll("linter-bottom-status"), (element: HTMLElement) => element.style.display = "");
    const panel = <HTMLElement>document.querySelector("linter-panel");
    if (panel)
        panel.style.display = "";
}

function hideLinter() {
    _.each(document.querySelectorAll("linter-bottom-tab"), (element: HTMLElement) => element.style.display = "none");
    _.each(document.querySelectorAll("linter-bottom-status"), (element: HTMLElement) => element.style.display = "none");
    const panel = <HTMLElement>document.querySelector("linter-panel");
    if (panel)
        panel.style.display = "none";
}

export function init() {
    const disposable = new CompositeDisposable();
    let cd: CompositeDisposable;
    disposable.add(atom.config.observe("omnisharp-atom.hideLinterInterface", hidden => {
        if (hidden) {
            cd = new CompositeDisposable();
            disposable.add(cd);

            // show linter buttons
            cd.add(Omni.activeEditor
                .where(z => !z)
                .subscribe(showLinter));

            // hide linter buttons
            cd.add(Omni.activeEditor
                .where(z => !!z)
                .subscribe(hideLinter));
        } else {
            if (cd) {
                disposable.remove(cd);
                cd.dispose();
            }
            showLinter();
        }
    }));

    return disposable;
}

export const provider = [
    {
        get grammarScopes() { return Omni.grammars.map((x: any) => x.scopeName); },
        scope: "file",
        lintOnFly: true,
        lint: (editor: Atom.TextEditor) => {
            if (!Omni.isValidGrammar(editor.getGrammar())) return Promise.resolve([]);

            codeCheck.doCodeCheck(editor);
            const path = editor.getPath();
            return Omni.diagnostics
                .take(1)
                .flatMap(x => x)
                .where(z =>z.FileName === path)
                .where(z => z.LogLevel !== "Hidden")
                .map(error => mapValues(editor, error))
                .toArray()
                .toPromise();
        }
    }, {
        get grammarScopes() { return Omni.grammars.map((x: any) => x.scopeName); },
        scope: "project",
        lintOnFly: false,
        lint: (editor: Atom.TextEditor) => {
            if (!Omni.isValidGrammar(editor.getGrammar())) return Promise.resolve([]);

            return Omni.activeModel
                .flatMap(x => Observable.from(x.diagnostics))
                .where(z => z.LogLevel !== "Hidden")
                .map(error => mapValues(editor, error))
                .toArray()
                .toPromise();
        }
    }
];
