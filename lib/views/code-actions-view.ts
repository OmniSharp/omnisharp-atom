import * as SpacePen from "atom-space-pen-views";

export interface SelectListViewOptions<T> {
    items: T[];
    confirmed: (item: T) => any;
}

export default function <T>(options: SelectListViewOptions<T>, editor: Atom.TextEditor): CodeActionsView<T> {
    let codeActionView = (<any>editor).codeActionView;
    if (!codeActionView) {
        (<any>editor).codeActionView = codeActionView = new CodeActionsView<T>(options, editor);
    } else {
        codeActionView.options = options;
    }

    codeActionView.setItems();
    codeActionView.show();
    return codeActionView;
}

class CodeActionsView<T> extends SpacePen.SelectListView {

    private _overlayDecoration: any;
    private _vimMode: boolean;
    private _editorElement: any;

    constructor(public options: SelectListViewOptions<T>, public editor: Atom.TextEditor) {
        super();
        this._editorElement = atom.views.getView(editor);
        this._vimMode = atom.packages.isPackageActive("vim-mode");
        this.$.addClass("code-actions-overlay");
        (<any>this).filterEditorView.model.placeholderText = "Filter list";
    }

    get $(): JQuery {
        return <any>this;
    }

    public setItems() {
        //super.setItems(this.options.items)
        SpacePen.SelectListView.prototype.setItems.call(this, this.options.items);
    }

    public confirmed(item: any): any {
        this.cancel(); //will close the view

        this.options.confirmed(item);

        this.enableVimMode();
        return null;
    }

    public show() {
        this.storeFocusedElement();
        this.disableVimMode();
        this.destroyOverlay();
        this._overlayDecoration = this.editor.decorateMarker(this.editor.getLastCursor().getMarker(),
            { type: "overlay", position: "tail", item: this });

        setTimeout(() => this.focusFilterEditor(), 100);
    }

    public hide() {
        this.restoreFocus();
        this.enableVimMode();
        this.destroyOverlay();
    }

    public destroyOverlay() {
        if (this._overlayDecoration)
            this._overlayDecoration.destroy();
    }


    public cancelled() {
        this.hide();
    }

    public enableVimMode() {
        if (this._vimMode) {
            this._editorElement.classList.add("vim-mode");
        }
    }

    public disableVimMode() {
        if (this._vimMode) {
            this._editorElement.classList.remove("vim-mode");
        }
    }

    public getFilterKey() { return "Name"; }

    public viewForItem(item: any) {

        return SpacePen.$$(function() {
            return this.li({
                "class": "event",
                "data-event-name": item.Name
            }, () => {
                return this.span(item.Name, {
                    title: item.Name
                });
            });
        });
    }
}
