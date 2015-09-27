import SpacePen = require('atom-space-pen-views');

class SignatureHelpView extends SpacePen.View {


    constructor(items : any[]) {
        super();
    }

    public cancelled() {

    }

    public confirmed(item) {
        return null;
    }

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

export = SignatureHelpView;
