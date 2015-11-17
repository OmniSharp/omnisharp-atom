import {Observable} from "@reactivex/rxjs";
import {OmniSharp} from "omnisharp-client";
export {OmniSharp} from "omnisharp-client";

export module OmniSharpAtom {
    export interface IFeature {
        activate(): void;
        dispose(): void;
        required: boolean;
        title: string;
        description: string;
        default?: boolean;
    }

    export interface IAtomFeature extends IFeature {
        attach(): void;
    }

    export interface ICompletionResult {
        word: string;
        prefix: string;
        renderLabelAsHtml: boolean;
        label: string;
    }

    export interface OutputMessage {
        message: string;
        logLevel?: string;
    }

    export interface ExtendApi extends OmniSharp.Api.V2 {
        request<TRequest, TResponse>(path: string, request: TRequest): Observable<TResponse>;
        path: string;
        whenConnected(): Observable<any>;
    }

    export interface IProjectViewModel {
        name: string;
        path: string;
        activeFramework: OmniSharp.Models.DnxFramework;
        frameworks: OmniSharp.Models.DnxFramework[];
        configurations: string[];
        commands: { [key: string]: string };
    }

}
