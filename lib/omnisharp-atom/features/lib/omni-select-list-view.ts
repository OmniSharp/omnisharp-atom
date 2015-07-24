import SpacePen = require('atom-space-pen-views');
import $ = require('jquery');

class OmniSelectListView extends SpacePen.SelectListView {
    public panel: Atom.Panel;
    private items = [];
    private list;

    constructor(placeholderText : string) {
        super({ placeholderText: placeholderText });
        this.setItems([]);
        this.storeFocusedElement();
        this.panel = atom.workspace.addModalPanel({ item: this });
        this.focusFilterEditor();
    }

    public addToList(symbols : OmniSharp.Models.QuickFix[]) : void {
        this.list.empty();

        if (symbols.length > 0) {
            this.setError(null);

            for (let i = 0; i < Math.min(symbols.length, this.maxItems); i++) {
                var item = symbols[i];
                var itemView = $(this.viewForItem(item));
                itemView.data('select-list-item', item)
                this.list.append(itemView)
            }

            this.selectItemView(this.list.find('li:first'))
        } else {

        }
    }

    public populateList() {
        if (this.items === null) {
            return;
        }

        var filterQuery = this.getFilterQuery();

        if (filterQuery.length >= this.getMinQueryLength()) {
            this.onFilter(filterQuery);
        } else {
            this.list.empty();
        }
    }

    public onFilter(filter : string) : void {
        throw new Error("Subclass must implement an onFilter(filter) method")
    }

    public getMinQueryLength() : number {
        return 0;
    }

    public cancelled() {
        this.panel.destroy();
    }
}

export = OmniSelectListView;
