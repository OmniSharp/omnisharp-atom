import SpacePen = require('atom-space-pen-views');


class CodeActionsView extends SpacePen.SelectListView {

    private panel: Atom.Panel;

    constructor(items : string[], private invokeNext: (result: any) => void) {
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

    public viewForItem(item: string[]) {
        return SpacePen.$$(function() {
           return this.li({
               "class": 'event',
               'data-event-name': item
           }, () => {
                   return this.span(item, {
                       title: item
                   });
               });
       });

    }

}

export = CodeActionsView;
