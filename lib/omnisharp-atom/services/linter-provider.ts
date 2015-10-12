import Omni = require('../../omni-sharp-server/omni')
var Range = require('atom').Range;
import _ = require('lodash');
import {Observable, CompositeDisposable, Subject} from "rx";
import {codeCheck} from "../features/code-check";

interface LinterError {
    type: string; // 'error' | 'warning'
    text?: string;
    html?: string;
    filePath?: string;
    range?: Range;
    [key: string]: any;
}

function getWordAt(str: string, pos: number) {
    var wordLocation = {
        start: pos,
        end: pos
    }

    if (str === undefined) {
        return wordLocation;
    }

    while (pos < str.length && /\W/.test(str[pos])) {
        ++pos;
    }

    var left = str.slice(0, pos + 1).search(/\W(?!.*\W)/);
    var right = str.slice(pos).search(/(\W|$)/);

    wordLocation.start = left + 1;
    wordLocation.end = wordLocation.start + right;

    return wordLocation;
}

function mapValues(editor: Atom.TextEditor, error: OmniSharp.Models.DiagnosticLocation): LinterError {
    var line = error.Line;
    var column = error.Column;
    var text = editor.lineTextForBufferRow(line);
    var wordLocation = getWordAt(text, column);
    var level = error.LogLevel.toLowerCase();

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
    _.each(document.querySelectorAll('linter-bottom-tab'), (element: HTMLElement) => element.style.display = '');
    _.each(document.querySelectorAll('linter-bottom-status'), (element: HTMLElement) => element.style.display = '');
    var panel = <HTMLElement>document.querySelector('linter-panel');
    if (panel)
        panel.style.display = '';
}

function hideLinter() {
    _.each(document.querySelectorAll('linter-bottom-tab'), (element: HTMLElement) => element.style.display = 'none');
    _.each(document.querySelectorAll('linter-bottom-status'), (element: HTMLElement) => element.style.display = 'none');
    var panel = <HTMLElement>document.querySelector('linter-panel');
    if (panel)
        panel.style.display = 'none';
}

export function init(linter: { getEditorLinter(editor: Atom.TextEditor): { lint(); }; }) {
    var disposable = new CompositeDisposable();
    var cd: CompositeDisposable;
    disposable.add(atom.config.observe('omnisharp-atom.hideLinterInterface', hidden => {
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

    /*disposable.add(Omni.activeModel
        .flatMap(x => x.observe.diagnostics)
        .flatMap(() => Omni.activeEditor)
        .debounce(100)
        .subscribe(editor => linter.getEditorLinter(editor).lint()));*/

    return disposable;
}

function getNextDiagnostic() {
    return Omni.activeModel
        .flatMap(x => x.observe.diagnostics)
        .take(1)
        // CODECHECK v2
        .timeout(500, Omni.activeModel.flatMap(x => Observable.just(x.diagnostics)))
        .flatMap(x => x)
        .where(z => z.LogLevel !== "Hidden");
}

export var provider = [
    {
        get grammarScopes() { return Omni.grammars.map((x: any) => x.scopeName) },
        scope: 'file',
        lintOnFly: true,
        lint: (editor: Atom.TextEditor) => {
            if (!Omni.isValidGrammar(editor.getGrammar())) return Promise.resolve([]);

            var path = editor.getPath();
            return getNextDiagnostic()
                .where(x => x.FileName === path)
                .map(error => mapValues(editor, error))
                .toArray()
                .toPromise();
        }
    }, {
        get grammarScopes() { return Omni.grammars.map((x: any) => x.scopeName) },
        scope: 'project',
        lintOnFly: false,
        lint: (editor: Atom.TextEditor) => {
            if (!Omni.isValidGrammar(editor.getGrammar())) return Promise.resolve([]);

            return getNextDiagnostic()
                .map(error => mapValues(editor, error))
                .toArray()
                .toPromise();
        }
    }
];
