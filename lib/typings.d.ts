/// <reference path="../typingsTemp/atom/atom.d.ts" />

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
