import {CompositeDisposable, Subject} from "rx";
import {set} from "lodash";

export class OmnisharpConfig implements Rx.IDisposable {
    private disposable = new CompositeDisposable();
    public value = {};

    private _changed = new Subject<any>();
    private _changedObservable = this._changed.asObservable().debounce(6000).map(z => this.value);
    public get changed() { return this._changedObservable; }

    public constructor() {
        // monitor atom project paths
        this.disposable.add(
            atom.config.observe('omnisharp-atom.dnxAlias',
                (value) => {
                    set(this.value, 'dnx.alias', value);
                    this._changed.onNext(null);
                }));

        /*this.disposable.add(
            atom.config.observe('omnisharp-atom.dnxProjects',
                (value) => {
                    set(this.value, 'dnx.projects', value);
                    this._changed.onNext(null);
                }));*/parseInt

        this.disposable.add(
            atom.config.observe('omnisharp-atom.dnxEnablePackageRestore',
                (value) => {
                    set(this.value, 'dnx.enablePackageRestore', value);
                    this._changed.onNext(null);
                }));

        this.disposable.add(
            atom.config.observe('omnisharp-atom.dnxPackageRestoreTimeout',
                (value) => {
                    set(this.value, 'dnx.packageRestoreTimeout', value);
                    this._changed.onNext(null);
                }));

        /*this.disposable.add(
            atom.config.observe('omnisharp-atom.formattingOptionsNewLine',
                (value) => {
                    set(this.value, 'formattingOptions.newLine', value);
                    this._changed.onNext(null);
                }));*/

        this.disposable.add(
            atom.config.observe('omnisharp-atom.formattingOptionsUseTabs',
                (value) => {
                    set(this.value, 'formattingOptions.useTabs', value);
                    this._changed.onNext(null);
                }));

        this.disposable.add(
            atom.config.observe('omnisharp-atom.formattingOptionsTabSize',
                (value) => {
                    set(this.value, 'formattingOptions.tabSize', value);
                    this._changed.onNext(null);
                }));
    }

    public dispose() {
        this.disposable.dispose();
    }
}

export var config = new OmnisharpConfig;
