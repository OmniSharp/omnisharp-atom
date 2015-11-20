import {OmniSharp} from "omnisharp-client";
export {OmniSharp} from "omnisharp-client";

export interface ExtendApi extends OmniSharp.Api.V2 {
    request<TRequest, TResponse>(path: string, request: TRequest): Rx.Observable<TResponse>;
    path: string;
    whenConnected(): Rx.Observable<any>;
}

export interface IProjectViewModel {
    name: string;
    path: string;
    activeFramework: OmniSharp.Models.DnxFramework;
    frameworks: OmniSharp.Models.DnxFramework[];
    configurations: string[];
    commands: { [key: string]: string };
}
