import {CompositeDisposable} from "rx";

export class Component extends HTMLDivElement implements WebComponent {
    private _disposable: CompositeDisposable;
    protected get disposable() { return this._disposable; }
    public createdCallback() {
        this.disposable = new CompositeDisposable();
    }

    public attachedCallback() { /* */ }

    public attributeChangedCallback(attrName: string, oldVal: any, newVal: any) { /* */ }

    public detachedCallback() {
        this.disposable.dispose();
        this.disposable = new CompositeDisposable();
    }
}