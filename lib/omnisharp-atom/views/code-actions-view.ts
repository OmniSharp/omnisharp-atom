import SpacePen = require('atom-space-pen-views');


class CodeActionsView extends SpacePen.SelectListView {

    //todo cleanup
    //todo set placeholder text
    //todo appropriately remove view (not hide)
    //todo add TS types for all the things
    //todo implement firing off applying code action


    constructor(items) {
        super();
        this.setItems(items.response.CodeActions);
        atom.workspace.addModalPanel({ item: this });
    }

    public cancelled() {

        return this.hide();
    }

    public viewForItem(item) {
        return `<li>${item}</li>`;
    }
}

export = CodeActionsView;
