import SpacePen = require('atom-space-pen-views');


class CodeActionsView<T> extends SpacePen.SelectListView {

    private panel: Atom.Panel;

    constructor(items : T[], private invokeNext: (result: T) => void) {
        super({ placeholderText: "Code actions" }); //note: doesn't work.

        this.setItems(items);

        //stores the previously selected element.
        this.storeFocusedElement();

        this.panel = atom.workspace.addModalPanel({ item: this });

        //sets focus
        this.focusFilterEditor();
    }

    public cancelled() {
        this.panel.destroy();
    }

    public confirmed(item) {
        this.cancel(); //will close the view

        if (this.invokeNext) {
            this.invokeNext(item);
        }

        return null;
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

export = CodeActionsView;
