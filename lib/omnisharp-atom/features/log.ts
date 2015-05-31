
import {CompositeDisposable, Observable} from "rx";
import Omni = require('../../omni-sharp-server/omni')

class Log implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    public observe: {
        output: Observable<OmniSharp.OutputMessage[]>;
    }

    output: OmniSharp.OutputMessage[];

    public activate() {
        this.disposable = new CompositeDisposable();

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

        this.observe = { output };

        this.disposable.add(output.subscribe(o => this.output = o));
    }

    public dispose() {
        this.disposable.dispose();
    }
}

export var log = new Log;
