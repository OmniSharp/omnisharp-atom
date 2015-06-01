import {CompositeDisposable} from "rx";

class ErrorHandler implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(atom.emitter.on("omnisharp-atom:error", (err) => console.error(err)));
    }

    public dispose() {
        this.disposable.dispose();
    }
}
export var errorHandler = new  ErrorHandler
