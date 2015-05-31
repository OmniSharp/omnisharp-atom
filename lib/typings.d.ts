/// <reference path="../typingsTemp/atom/atom.d.ts" />

interface WeakMap<K, V> {
    clear(): void;
    delete(key: K): boolean;
    get(key: K): V;
    has(key: K): boolean;
    set(key: K, value?: V): WeakMap<K, V>;
}

interface WeakMapConstructor {
    new <K, V>(): WeakMap<K, V>;
    prototype: WeakMap<any, any>;
}

declare var WeakMap: WeakMapConstructor;

declare module OmniSharp {
    interface IFeature {
        activate(): void;
        dispose(): void;
        //disposable: Rx.CompositeDisposable;
    }

    interface ICompletionResult {
        word: string;
        prefix: string;
        renderLabelAsHtml: boolean;
        label: string;
    }

    interface VueArray<T> extends Array<T> {
        $remove(index: number);
    }

    interface OutputMessage {
        message: string;
        logLevel?: string;
    }

    interface ExtendApi extends OmniSharp.Api {
        makeRequest(editor?: Atom.TextEditor, buffer?: TextBuffer.TextBuffer): OmniSharp.Models.Request;
        makeDataRequest<T>(data: T, editor?: Atom.TextEditor, buffer?: TextBuffer.TextBuffer): T;
    }
}

declare module Rx {
    interface ObjectObserveChange<T> {
        type: string;
        object: T;
        name: string;
        oldValue?: any;
    }

    interface ArrayObserveChange<T> {
        type: string;
        object: T[];
        name?: string;
        oldValue?: T;
        index?: number;
        removed?: T[];
        added?: number;
    }

    interface ObservableStatic {
        ofObjectChanges<T>(obj: T): Observable<ObjectObserveChange<T>>;
        ofArrayChanges<T>(obj: T): Observable<ArrayObserveChange<T>>;
    }
}
