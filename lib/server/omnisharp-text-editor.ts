import {CompositeDisposable, Disposable} from "rx";
import {Solution} from "./solution";
import {ProjectViewModel, EmptyProjectViewModel} from "./project-view-model";

export class OmnisharpEditorContext implements Rx.IDisposable {
    private _solution: Solution;
    private _metadata: boolean;
    private _config: boolean;
    private _project: ProjectViewModel<any>;
    private _items = new Map<string, any>();
    private _disposable = new CompositeDisposable();

    constructor(editor: Atom.TextEditor, solution: Solution) {
        this._solution = solution;
        this._project = new EmptyProjectViewModel(null, solution.path);

        this._disposable.add(solution.model
            .getProjectForEditor(editor)
            .take(1)
            .subscribe((project) => this._project.update(project)));

        this._disposable.add(Disposable.create(() => {
            this._items.forEach(item => item.dispose && item.dispose());
        }));
    }

    public dispose() {
        this._disposable.dispose();
    }

    public get solution() { return this._solution; }
    public get project() { return this._project; }

    public get temp() { return this._items.has("___TEMP___") && this._items.get("___TEMP___") || false; }
    public set temp(value: boolean) {
        if (!this._items.has("___TEMP___")) {
            this._items.set("___TEMP___", value);
        }
    }

    public get metadata() { return this._metadata; }
    public set metadata(value) { this._metadata = value; }

    public get config() { return this._config; }
    public set config(value) { this._config = value; }

    public set<T>(name: string, callback: (context: OmnisharpEditorContext) => T) {
        if (this._items.has(name))
            return this._items.get(name);

        const result = callback(this);
        this._items.set(name, result);
        return result;
    }

    public get<T>(name: string): T {
        return <any>this._items.get(name);
    }
}

export interface OmnisharpTextEditor extends Atom.TextEditor {
    omnisharp: OmnisharpEditorContext;
}

export function isOmnisharpTextEditor(editor: any): editor is OmnisharpTextEditor { return editor && !!(<any>editor).omnisharp; }
