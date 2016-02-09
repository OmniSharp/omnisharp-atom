require("babel-polyfill");
const _: _.LoDashStatic = require("lodash");
import {Observable, Subject, BehaviorSubject, CompositeDisposable, Scheduler} from "rx";
import {Models} from "omnisharp-client";

// Used to cache values for specific editors
export class DiagnosticMap implements Rx.IDisposable {
    public static create(observable: Observable<Models.DiagnosticLocation[]>) {
        const map = new DiagnosticMap();
        map._disposable.add(DiagnosticMap.observeDiagnostics(map, observable));
        return map;
    }

    public static observeDiagnostics(map: DiagnosticMap, observable: Observable<Models.DiagnosticLocation[]>) {
        return observable
            .flatMap(diagnostics => Observable.from(diagnostics)
                .groupBy(x => x.FileName, x => x))
            .flatMap(x => x.toArray(), ({key}, result) => ({ key, result }))
            .subscribe(({key, result}) => {
                map.set(key, _.sortBy(result, quickFix => quickFix.LogLevel));
            });
    }

    private _map = new Map<string, [Rx.IDisposable, BehaviorSubject<DiagnosticMapValue>]>();
    private _subject = new Subject<DiagnosticMapValue>();

    private _updated = this._subject.map(x => <void>null)
        .debounce(1000);
    public get updated() { return this._updated; }

    private _disposable = new CompositeDisposable();

    private _count = 0;
    public get count() { return this._count; }

    private _errors = 0;
    public get errors() { return this._errors; }

    private _warnings = 0;
    public get warnings() { return this._warnings; }

    private _hidden = 0;
    public get hidden() { return this._hidden; }

    private _observe = Observable.defer(() =>
        Observable.merge(
            Observable.from(this._map.values()).concatMap(x => x[1].take(1).delay(Math.max(this._map.size, 100))),
            this._subject.asObservable()
        ));
    public get observe() { return this._observe; }


    public get(filename: string) {
        if (!this._map.has(filename)) {
            const bs = new BehaviorSubject<DiagnosticMapValue>(new DiagnosticMapValue(filename, []));
            const cd = new CompositeDisposable();

            cd.add(bs.observeOn(Scheduler.async).subscribe(this._subject));

            cd.add(Observable.zip(bs, bs.skip(1).startWith(new DiagnosticMapValue(filename, [])), (newValue, oldValue) => ({
                count: newValue.count - oldValue.count,
                errors: newValue.errors - oldValue.errors,
                warnings: newValue.warnings - oldValue.warnings,
                hidden: newValue.hidden - oldValue.hidden,
            }))
                .observeOn(Scheduler.async)
                .subscribe((result) => {
                    this._count = this._count + result.count;
                    this._errors = this._errors + result.errors;
                    this._warnings = this._warnings + result.warnings;
                    this._hidden = this._hidden + result.hidden;
                }));
            this._map.set(filename, [cd, bs]);
        }

        const [, observable] = this._map.get(filename);
        return <Rx.Observable<DiagnosticMapValue>>observable;
    }

    private _getObserver(key: string): Rx.Observer<DiagnosticMapValue> & { getValue(): DiagnosticMapValue } {
        return <BehaviorSubject<DiagnosticMapValue>><any>this.get(key);
    }

    public set(filename: string, diagnostics: Models.DiagnosticLocation[]) {
        const o = this._getObserver(filename);
        const oldValue = o.getValue();
        if (!_.isEqual(oldValue.diagnostics, diagnostics)) {
            _.defer(() => o.onNext(new DiagnosticMapValue(filename, diagnostics)));
        }
        return this;
    }

    public delete(filename: string) {
        if (this._map.has(filename)) {
            const [disposable, observable] = this._map.get(filename);
            this._disposable.remove(disposable);
            observable.onNext(new DiagnosticMapValue(filename, []));
            disposable.dispose();
            observable.onCompleted();

            this._map.delete(filename);
        }
    }

    public clear() {
        for (let key of this._map.keys()) {
            this.delete(key);
        }

        this._count = 0;
        this._errors = 0;
        this._warnings = 0;
        this._hidden = 0;
        this._map.clear();
    }

    public *values() {
        for (let [, value] of this._map.values()) {
            for (let item of value.getValue().diagnostics) {
                yield item;
            }
        }
    }

    public dispose() {
        this._disposable.dispose();
    }
}

export class DiagnosticMapValue {
    private _logLevels: { [index: string]: number } = {};

    constructor(private _filename: string, private _diagnostics: Models.DiagnosticLocation[]) {
        this._logLevels = _.countBy(_diagnostics, quickFix => quickFix.LogLevel);
    }

    public get filename() { return this._filename; }
    public get diagnostics() { return this._diagnostics; }
    public get count() { return this._diagnostics.length; }
    /* tslint:disable:no-string-literal */
    public get errors() { return this._logLevels["Error"] || 0; }
    public get warnings() { return this._logLevels["Warning"] || 0; }
    public get hidden() { return this._logLevels["Hidden"] || 0; }
    /* tslint:enable:no-string-literal */
}
