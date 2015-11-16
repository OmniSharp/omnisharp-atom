import {Observable, Subscriber} from "@reactivex/rxjs";

export function fromCallback<TResult, T1>(func: (arg1: T1, callback: (result: TResult) => any) => any): (arg1: T1) => Observable<TResult>;
export function fromCallback<TResult, T1, T2>(func: (arg1: T1, arg2: T2, callback: (result: TResult) => any) => any): (arg1: T1, arg2: T2) => Observable<TResult>;
export function fromCallback<TResult, T1, T2, T3>(func: (arg1: T1, arg2: T2, arg3: T3, callback: (result: TResult) => any) => any): (arg1: T1, arg2: T2, arg3: T3) => Observable<TResult>;
export function fromCallback<TResult, T1, T2, T3, T4>(func: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, callback: (result: TResult) => any) => any): (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => Observable<TResult>;
export function fromCallback<TResult>(func: Function): (...args: any[]) => Observable<TResult>;
export function fromCallback(func: Function) {
    return function(...args: any[]) {
        return Observable.create((subscriber: Subscriber<any>) => {
            let cancelled = false;
            function handler(...handlerArgs: any[]) {
                if (cancelled) return;
                if (handlerArgs.length <= 1) {
                    subscriber.next(handlerArgs[0]);
                } else {
                    subscriber.next(handlerArgs);
                }

                subscriber.complete();
            }

            args.push(handler);
            func.apply(null, args);

            return function() { cancelled = true; };
        });
    };
};

export function fromNodeCallback<TResult, T1>(func: (arg1: T1, callback: (err: any, result: TResult) => any) => any): (arg1: T1) => Observable<TResult>;
export function fromNodeCallback<TResult, T1, T2>(func: (arg1: T1, arg2: T2, callback: (err: any, result: TResult) => any) => any): (arg1: T1, arg2: T2) => Observable<TResult>;
export function fromNodeCallback<TResult, T1, T2, T3>(func: (arg1: T1, arg2: T2, arg3: T3, callback: (err: any, result: TResult) => any) => any): (arg1: T1, arg2: T2, arg3: T3) => Observable<TResult>;
export function fromNodeCallback<TResult, T1, T2, T3, T4>(func: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, callback: (err: any, result: TResult) => any) => any): (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => Observable<TResult>;
export function fromNodeCallback<TResult>(func: Function): (...args: any[]) => Observable<TResult>;
export function fromNodeCallback(func: Function) {
    return function(...args: any[]) {
        return Observable.create((subscriber: Subscriber<any>) => {
            let cancelled = false;
            function handler(...handlerArgs: any[]) {
                if (cancelled) return;

                const err = handlerArgs[0];
                if (err) { return subscriber.error(err); }

                if (handlerArgs.length <= 1) {
                    subscriber.next(handlerArgs[0]);
                } else {
                    subscriber.next(handlerArgs);
                }

                subscriber.complete();
            }

            args.push(handler);
            func.apply(null, args);

            return function() { cancelled = true; };
        });
    };
};
