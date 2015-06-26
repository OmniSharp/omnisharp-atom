import SpacePen = require('atom-space-pen-views');

export interface SelectListViewOptions<T> {
    items: T[];
    confirmed: (item: T) => any;
}

export default function <T>(options: SelectListViewOptions<T>, editor: Atom.TextEditor): CodeActionsView<T> {
    var codeActionView = (<any>editor).codeActionView;
    if (!codeActionView) codeActionView = new CodeActionsView<T>(options, editor);
    else { codeActionView.options = options; }

    codeActionView.setItems();
    codeActionView.show();
    return codeActionView;
}

class CodeActionsView<T> extends SpacePen.SelectListView {

    private panel: Atom.Panel;
    private _overlayDecoration: any;
    private _vimMode: boolean;

    constructor(public options: SelectListViewOptions<T>, public editor: Atom.TextEditor) {
        super();
        this._vimMode = atom.packages.isPackageActive("vim-mode");
        this.$.addClass('code-actions-overlay');
        (<any>this).filterEditorView.model.placeholderText = 'Filter list';
    }

    get $(): JQuery {
        return <any>this;
    }

    public setItems() {
        super.setItems(this.options.items)
    }

    public confirmed(item) {
        this.cancel(); //will close the view

        this.options.confirmed(item);

        this.enableVimMode();
        return null;
    }

    show() {
        this.storeFocusedElement();
        this.disableVimMode();

        this._overlayDecoration = this.editor.decorateMarker(this.editor.getLastCursor().getMarker(),
            { type: "overlay", position: "tail", item: this });

        setTimeout(() => this.focusFilterEditor(), 100);
    }

    hide() {
        this.restoreFocus();
        this.enableVimMode();

        if (this._overlayDecoration)
            this._overlayDecoration.destroy();
    }

    cancelled() {
        this.hide();
    }

    enableVimMode() {
        if (this._vimMode) {
            atom.views.getView(this.editor).addClass("vim-mode");
        }
    }

    disableVimMode() {
        if (this._vimMode) {
            atom.views.getView(this.editor).removeClass("vim-mode");
        }
    }

    public getFilterKey() { return 'Name'; }

    public viewForItem(item) {

        return SpacePen.$$(function() {
            return this.li({
                "class": 'event',
                'data-event-name': item.Name
            }, () => {
                return this.span(item.Name, {
                    title: item.Name
                });
            });
        });

    }
}
