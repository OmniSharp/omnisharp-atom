import SpacePen = require('atom-space-pen-views');


class CodeActionsView extends SpacePen.SelectListView {

    private panel: Atom.Panel;

    //todo cleanup
    //todo set placeholder text
    //todo appropriately remove view (not hide)
    //todo add TS types for all the things
    //todo implement firing off applying code action


    constructor(items, private invokeNext: (result: any) => void) {
        super({ placeholderText: "Code actions" }); //note: doesn't work?

        this.setItems(items.response.CodeActions); //todo: fix

        //stores the previously selected element.
        this.storeFocusedElement();

        this.panel = atom.workspace.addModalPanel({ item: this });
        //this.focusFilterEditor();
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

    public viewForItem(item) {
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
