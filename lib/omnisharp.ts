import {Api, Models} from "omnisharp-client";
import {Observable} from "rxjs-beta3";

export interface ExtendApi extends Api.V2 {
    request<TRequest, TResponse>(path: string, request: TRequest): Observable<TResponse>;
    path: string;
    whenConnected(): Observable<any>;
}

export interface IProjectViewModel {
    name: string;
    path: string;
    activeFramework: Models.DnxFramework;
    frameworks: Models.DnxFramework[];
    configurations: string[];
    commands: { [key: string]: string };
}
