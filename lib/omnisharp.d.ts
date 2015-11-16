import {Observable} from "@reactivex/rxjs";
import {OmniSharp} from "omnisharp-client";
export {OmniSharp} from "omnisharp-client";


export module OmniSharpAtom {
    interface IFeature {
        activate(): void;
        dispose(): void;
        required: boolean;
        title: string;
        description: string;
        default?: boolean;
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

    interface OutputMessage {
        message: string;
        logLevel?: string;
    }

    interface ExtendApi extends OmniSharp.Api.V2 {
        request<TRequest, TResponse>(path: string, request: TRequest): Observable<TResponse>;
        path: string;
        whenConnected(): Observable<any>;
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
