import {Observable, CompositeDisposable} from "rx";
import Omni = require("../../omni-sharp-server/omni");
import * as _ from 'lodash';
import {OmnisharpClientStatus} from "omnisharp-client";
import {dock} from "../atom/dock";
import {OutputWindow} from '../views/omni-output-pane-view'


class ServerInformation implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    public observe: {
        status: Observable<OmnisharpClientStatus>;
        output: Observable<OmniSharp.OutputMessage[]>;
    }

    status: OmnisharpClientStatus;
    output: OmniSharp.OutputMessage[];

    public activate() {
        this.disposable = new CompositeDisposable();

        var status = this.setupStatus();
        var output = this.setupOutput();
        this.observe = { status, output };

        this.disposable.add(dock.addWindow('omni', 'Omnisharp output', OutputWindow, {}));
    }

    private setupStatus() {

        // Stream the status from the active model
        var status = Omni.activeModel
            .flatMapLatest(model => model.observe.status)
            .share();

        this.disposable.add(status.subscribe(status => this.status = status));
        return status;
    }

    private setupOutput() {
        // As the active model changes (when we go from an editor for ClientA to an editor for ClientB)
        // We want to make sure that the output field is
        var output = Omni.activeModel
            .flatMapLatest(z => z.observe.output)
        // This starts us off with the current models output
            .merge(Omni.activeModel.map(z => z.output))
            .startWith([])
        // Only update after a short time incase things are changing quickly.
            .debounce(100)
            .share();

        this.disposable.add(output.subscribe(o => this.output = o));
        return output;

    }

    public dispose() {
        this.disposable.dispose();
    }
}

export var server = new ServerInformation;
