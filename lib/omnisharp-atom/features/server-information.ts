import {Observable, CompositeDisposable} from "rx";
import Omni = require("../../omni-sharp-server/omni");
import * as _ from 'lodash';
import {OmnisharpClientStatus} from "omnisharp-client";


class ServerInformation implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    public observe: {
        status: Observable<OmnisharpClientStatus>;
    }

    status: OmnisharpClientStatus;

    public activate() {
        this.disposable = new CompositeDisposable();

        // Stream the status from the active model
        var status = Omni.activeModel
            .flatMapLatest(model => model.observe.status)
            .share();

        this.disposable.add(status.subscribe(status => this.status = status));
        this.observe = { status };
    }

    public dispose() {
        this.disposable.dispose();
    }
}

export var server = new ServerInformation;
