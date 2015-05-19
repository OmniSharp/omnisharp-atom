import SpacePen = require('atom-space-pen-views');


class CodeActionsView extends SpacePen.SelectListView {
    //private panel: Atom.Panel;
    //private previouslyFocusedElement: Node;
    //private eventElement: any;
    //public message: JQuery;

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
