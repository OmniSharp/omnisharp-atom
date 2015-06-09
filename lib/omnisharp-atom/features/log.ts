
import {CompositeDisposable, Observable} from "rx";
import Omni = require('../../omni-sharp-server/omni')

class Log implements OmniSharp.IFeature {
    private disposable: CompositeDisposable;
    public observe: {
    }

    public activate() {
        this.disposable = new CompositeDisposable();


    }

    public dispose() {
        this.disposable.dispose();
    }
}

export var log = new Log;
