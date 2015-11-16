export interface IDisposable {
    dispose(): void;
}

export interface ISubscription {
    unsubscribe(): void;
}

export type IDisposableOrSubscription = IDisposable | ISubscription | (() => void);

/* tslint:disable:no-use-before-declare */
export class Disposable implements IDisposable {
    public static get empty() { return empty; }

    public static of(value: any) {
        if (!value) return empty;

        if (value.dispose) {
            return <IDisposable>value;
        }
        return new Disposable(value);
    }

    public static create(action: () => void) {
        return new Disposable(action);
    }

    private _action: () => void;
    private _isDisposed = false;

    constructor(value: IDisposableOrSubscription);
    constructor(value: any) {
        if (!value) return empty;

        if (typeof value === "function") {
            this._action = value;
        } else if (value.unsubscribe) {
            this._action = () => (<ISubscription>value).unsubscribe();
        } else if (value.dispose) {
            this._action = () => (<IDisposable>value).dispose();
        }
    }

    public get isDisposed() { return this._isDisposed; }

    public dispose() {
        if (!this.isDisposed) {
            this._isDisposed = true;
            this._action();
        }
    }
}
/* tslint:enable:no-use-before-declare */

/* tslint:disable:no-empty */
const empty = new Disposable(function noop() { });
/* tslint:enable:no-empty */

let disposableCallback = (disposable: any) => Disposable.of(disposable).dispose();
export class CompositeDisposable implements IDisposable {
    private _disposables = new Set<IDisposableOrSubscription>();
    private _isDisposed = false;

    constructor(...disposables: IDisposableOrSubscription[]) {
        disposables.forEach((item: any) => this._disposables.add(item));
    }

    public get isDisposed() { return this._isDisposed; }

    public dispose() {
        this._isDisposed = true;
        if (this._disposables.size) {
            this._disposables.forEach(disposableCallback);
            this._disposables.clear();
        }
    }

    public add(...disposables: IDisposableOrSubscription[]) {
        if (this.isDisposed) {
            disposables.forEach(disposableCallback);
        } else {
            disposables.forEach((item: any) => this._disposables.add(item));
        }
    }

    public remove(disposable: IDisposableOrSubscription) {
        return this._disposables.delete(disposable);
    }
}

export class RefCountDisposable implements IDisposable {
    private _underlyingDisposable: IDisposable;
    private _isDisposed = false;
    private _isPrimaryDisposed = false;
    private _count = 0;

    constructor(underlyingDisposable: IDisposableOrSubscription) {
        this._underlyingDisposable = Disposable.of(underlyingDisposable);
    }

    public get isDisposed() { return this._isDisposed; }

    public dispose() {
        if (!this.isDisposed && !this._isPrimaryDisposed) {
            this._isPrimaryDisposed = true;
            if (this._count === 0) {
                this._isDisposed = true;
                this._underlyingDisposable.dispose();
            }
        }
    }

    public getDisposable() {
        if (this.isDisposed) return Disposable.empty;

        this._count++;
        return new InnerDisposable(this, () => {
            this._count--;
            if (this._count === 0 && this._isPrimaryDisposed) {
                this._isDisposed = true;
                this._underlyingDisposable.dispose();
            }
        });
    }
}

class InnerDisposable extends Disposable {
    constructor(private _reference: RefCountDisposable, action: () => void) {
        super(action);
    }

    public dispose() {
        if (!this._reference.isDisposed && !this.isDisposed) {
            super.dispose();
        }
    }
}

export class SingleAssignmentDisposable implements IDisposable {
    private _currentDisposable: IDisposable;
    private _isDisposed = false;

    public get isDisposed() { return this._isDisposed; }

    public get disposable() { return this._currentDisposable; }
    public set disposable(value) {
        if (this._currentDisposable) { throw new Error("Disposable has already been assigned"); }
        if (!this.isDisposed) {
            this._currentDisposable = value;
        }
        if (this.isDisposed && value) {
            value.dispose();
        }
    }

    public dispose() {
        if (!this.isDisposed) {
            this.isDisposed = true;
            var old = this._currentDisposable;
            this._currentDisposable = null;
            old && old.dispose();
        }
    }
}
