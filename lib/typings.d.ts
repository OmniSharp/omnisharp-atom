/// <reference path="../typingsTemp/atom/atom.d.ts" />
declare module OmniSharp {
    interface IFeature {
        activate(): void;
        dispose(): void;
        required: boolean;
        title: string;
        description: string;
        default?: boolean;
    }

    interface IToggleFeature extends IFeature {
        active: boolean;
        enabled: boolean;
        observe: {enabled: Rx.Observable<boolean>; };
    }

    interface IAtomFeature extends IFeature {
        attach(): void;
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

    interface ExtendApi extends OmniSharp.Api.V2 {
        makeRequest(editor?: Atom.TextEditor, buffer?: TextBuffer.TextBuffer): OmniSharp.Models.Request;
        makeDataRequest<T>(data: T, editor?: Atom.TextEditor, buffer?: TextBuffer.TextBuffer): T;
        v1: OmniSharp.Api.V1;
        request<TRequest, TResponse>(path: string, request: TRequest): Rx.Observable<TResponse>;
        path: string;
    }

    interface IProjectViewModel {
        name: string;
        path: string;
        activeFramework: OmniSharp.Models.DnxFramework;
        frameworks: OmniSharp.Models.DnxFramework[];
        configurations: string[];
        commands: { [key: string]: string };
    }

}
