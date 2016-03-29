import {Api, Models} from "omnisharp-client";
import {Observable} from "rxjs";

export interface ExtendApi extends Api.V2 {
    request<TRequest, TResponse>(path: string, request: TRequest): Observable<TResponse>;
    path: string;
    whenConnected(): Observable<any>;
}

export interface IProjectViewModel {
    name: string;
    path: string;
    activeFramework: Models.DotNetFramework;
    frameworks: Models.DotNetFramework[];
    configurations: string[];
}
