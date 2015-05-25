import _ = require('lodash');
import {Observable} from 'rx';
import {OmnisharpCompositeClient, ICompositeObservable} from "omnisharp-client";
import Client = require("./client");

class CompositeClient extends OmnisharpCompositeClient<Client> {
    public omniOutputBuffer: ICompositeObservable<OmniSharp.OutputMessage>;

    public reset() {
        this.omniOutputBuffer.reset();
    }
}
export = CompositeClient;
