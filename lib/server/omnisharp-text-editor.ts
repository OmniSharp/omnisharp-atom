import {CompositeDisposable, Disposable, IDisposable} from "ts-disposables";
import {Models} from "omnisharp-client";
import {Solution} from "./solution";
import {ProjectViewModel, EmptyProjectViewModel} from "./project-view-model";
import _ from "lodash";
import {Subject} from "rxjs";

const contextItems = new Map<string, (context: OmnisharpEditorContext, editor: OmnisharpTextEditor) => any>();
export function registerContextItem<T>(name: string, callback: (context: OmnisharpEditorContext, editor: OmnisharpTextEditor) => T) {
    contextItems.set(name, callback);
    return Disposable.create(() => contextItems.delete(name));
}

export type AtomTextChange = { oldRange: TextBuffer.Range; newRange: TextBuffer.Range; oldText: string; newText: string; };

export class OmnisharpEditorContext implements IDisposable {
    private static _createdSubject = new Subject<OmnisharpTextEditor>();
    public static get created() { return OmnisharpEditorContext._createdSubject.asObservable(); }

    private _editor: OmnisharpTextEditor;
    private _solution: Solution;
    private _metadata: boolean;
    private _config: boolean;
    private _project: ProjectViewModel<any>;
    private _items = new Map<string, any>();
    private _disposable = new CompositeDisposable();
    private _loaded = false;
    private _changes: AtomTextChange[] = [];

    constructor(editor: Atom.TextEditor, solution: Solution) {
        if ((<any>editor).omnisharp) return;
        this._editor = <any>editor;
        this._editor.omnisharp = this;
        this._solution = solution;
        this._project = new EmptyProjectViewModel(null, solution.path);

        const view: HTMLElement = <any>atom.views.getView(editor);
        view.classList.add("omnisharp-editor");

        this._disposable.add(
            () => {
                this._editor.omnisharp = null;
                view.classList.remove("omnisharp-editor");
            },
            solution.model
                .getProjectForEditor(editor)
                .take(1)
                .subscribe((project) => this._project.update(project)),
            this.solution.whenConnected().subscribe(() => this._loaded = true),
            Disposable.create(() => {
                this._items.forEach(item => item.dispose && item.dispose());
            }),
            solution.open({ FileName: editor.getPath() }).subscribe(),
            solution.updatebuffer({ FileName: editor.getPath(), FromDisk: true }, { silent: true }).subscribe(),
            () => {
                solution.disposable.add(solution.close({ FileName: editor.getPath() }).subscribe());
            },
            editor.getBuffer().onWillChange((change: { oldRange: TextBuffer.Range; newRange: TextBuffer.Range; oldText: string; newText: string; }) => {
                this.pushChange(change);
            }),
            editor.onDidStopChanging(() => {
                if (this.hasChanges) {
                    solution.updatebuffer({ FileName: editor.getPath(), Changes: this.popChanges() }, { silent: true });
                }
            }),
            editor.onDidSave(() => solution.updatebuffer({ FileName: editor.getPath(), FromDisk: true }, { silent: true }))
        );

        solution.disposable.add(this);

        OmnisharpEditorContext._createdSubject.next(<any>editor);
    }

    public dispose() {
        this._disposable.dispose();
    }

    public get solution() { return this._solution; }
    public get project() { return this._project; }
    public get loaded() { return this._loaded; }
    public onLoad<T extends Function>(callback: T) {
        if (!this._loaded) {
            this._disposable.add(this.solution.whenConnected()
                .subscribe(() => callback()));
            return;
        }
        callback();
    }

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

    public set<T>(name: string, callback: (context: OmnisharpEditorContext, editor: OmnisharpTextEditor) => T) {
        if (this._items.has(name))
            return this._items.get(name);

        const result = callback(this, this._editor);
        this._items.set(name, result);
        return result;
    }

    public get<T>(name: string): T {
        if (!this._items.has(name) && contextItems.has(name)) {
            this.set(name, contextItems.get(name));
        }
        return <any>this._items.get(name);
    }

    public pushChange(change: AtomTextChange) {
        this._changes.push(change);
    }

    public popChanges() {
        if (!this._changes.length) {
            return null;
        }
        return _.map(this._changes.splice(0, this._changes.length), change => <Models.LinePositionSpanTextChange>{
            NewText: change.newText,
            StartLine: change.oldRange.start.row,
            StartColumn: change.oldRange.start.column,
            EndLine: change.oldRange.end.row,
            EndColumn: change.oldRange.end.column
        });
    }

    public get hasChanges() { return !!this._changes.length; }
}

export interface OmnisharpTextEditor extends Atom.TextEditor {
    omnisharp: OmnisharpEditorContext;
}

export function isOmnisharpTextEditor(editor: any): editor is OmnisharpTextEditor { return editor && !!(<any>editor).omnisharp; }
