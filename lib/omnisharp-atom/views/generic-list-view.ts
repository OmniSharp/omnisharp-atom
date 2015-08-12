import spacePen = require("atom-space-pen-views");
import _ = require('lodash');
import {AsyncSubject} from "rx";

export class GenericSelectListView extends spacePen.SelectListView {
    private panel: Atom.Panel;
    private previouslyFocusedElement: Node;
    private eventElement: any;
    private _onClosed = new AsyncSubject<boolean>();
    public get onClosed() : Rx.Observable<boolean> { return this._onClosed; };

    public message: JQuery;

    constructor(private messageText: string, public _items: { displayName: string; name: string; }[], public onConfirm: (result: any) => void, public onCancel: () => void) {
        super();
    }

    public static content() {
        return this.div({}, () => {
            this.p({
                outlet: 'message'
            }, '');

            (<any>spacePen.SelectListView).content.call(this);
        });
    }

    public keyBindings = null;

    public initialize() {
        (<any>spacePen.SelectListView).prototype.initialize.call(this);
        this.addClass('generic-list');
        this.message.text(this.messageText);

        return false;
    }

    public getFilterKey() {
        return 'displayName';
    }

    public cancelled() {
        this.onCancel();
        return this.hide();
    }

    public toggle() {
        if (this.panel && this.panel.isVisible()) {
            this.cancel();
        } else {
            this.show();
        }
    }

    public show() {
        if (this.panel == null) {
            this.panel = atom.workspace.addModalPanel({ item: this });
        }
        this.panel.show();
        this.storeFocusedElement();

        if (this.previouslyFocusedElement[0] && this.previouslyFocusedElement[0] !== document.body) {
            this.eventElement = this.previouslyFocusedElement[0];
        } else {
            this.eventElement = atom.views.getView(atom.workspace);
        }

        this.keyBindings = atom.keymaps.findKeyBindings({
            target: this.eventElement
        });

        // infer the generator somehow? based on the project information?  store in the project system??
        var commands = _.sortBy(this._items, 'displayName');
        this.setItems(commands);
        this.focusFilterEditor();
    }

    public hide() {
        this._onClosed.onNext(true);
        this._onClosed.onCompleted();

        this.panel && this.panel.hide();
        this.panel.destroy();
        this.panel = null;
    }

    public viewForItem(item: { displayName: string; name: string; }) {
        var keyBindings = this.keyBindings;
        return spacePen.$$(function() {
            return this.li({
                "class": 'event',
                'data-event-name': item.name
            }, () => {
                    return this.span(item.displayName, {
                        title: item.name
                    });
                });
        });
    }

    public confirmed(item?: any): spacePen.View {
        this.onConfirm(item.name);
        this.cancel();

        return null;
    }
}
