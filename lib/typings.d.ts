/// <reference path="./models.d.ts" />
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
        isOffOrError: boolean;
        isOffAndNotError: boolean;
        isError: boolean;
        isLoadingOrReady: boolean;
        isLoadingOrReadyOrError: boolean;
        state: string;
        previousState: string;
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
