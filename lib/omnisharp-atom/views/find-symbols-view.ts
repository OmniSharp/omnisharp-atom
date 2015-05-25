import OmniSelectListView = require('../features/lib/omni-select-list-view');
import ClientManager = require('../../omni-sharp-server/client-manager');
import Omni = require('../../omni-sharp-server/omni');
import $ = require('jquery');

class FindSymbolsView extends OmniSelectListView {

     constructor() {
            super("Find Symbols");
            this.setItems([]);
            this.storeFocusedElement();
            this.panel = atom.workspace.addModalPanel({ item: this });
            this.focusFilterEditor();
        }

    public viewForItem(item) {
        return '<li>' +
            '<span>' +
            '<img style="margin-right: 0.75em;" height="16px" width="16px" src="atom://omnisharp-atom/styles/icons/autocomplete_' + item.Kind.toLowerCase() + '@3x.png" />' +
            '<span>' + item.Text + '</span>' +
            '</span>' +
            '<br/>' +
            '<span class="filename">'+ atom.project.relativizePath(item.FileName)[1] + ':' + item.Line + '</span>' +
            '</li>';
    }

    public getFilterKey() {
        return "Text";
    }

    public confirmed(item) {
        this.cancel();
        this.hide();

        Omni.navigateTo(item);
        return null;
    }

    public onFilter(filter : string) : void {
        ClientManager.getClientForActiveEditor().subscribe(client => {
            var request = <OmniSharp.Models.FindSymbolsRequest>client.makeRequest();
            request.Filter = filter;
            client.findsymbolsPromise(request);
        });
    }

    public getMinQueryLength() {
        return 1;
    }
}

export = FindSymbolsView;
