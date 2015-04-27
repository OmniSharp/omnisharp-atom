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
        name:string;
        path:string;
        invoke(method:string, ...args: any[]);
    }

    interface vm {
        isNotLoading: boolean;
        isLoading: boolean;
        isOff: boolean;
        isNotOff: boolean;
        isOn: boolean;
        isNotReady: boolean;
        isReady: boolean;
        isNotError: boolean;
        isError: boolean;
        isLoadingOrReady: boolean;
        iconText: string;
        isOpen: boolean;
    }

    interface ICompletionResult {
        word: string;
        prefix: string;
        renderLabelAsHtml: boolean;
        label: string;
    }

    interface VueArray<T> extends Array<T> {
        $remove(index:number);
    }
}
