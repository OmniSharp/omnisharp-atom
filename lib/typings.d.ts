declare module OmniSharp {
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

    interface VueArray<T> extends Array<T> {
        $remove(index: number);
    }

    interface OutputMessage {
        message: string;
        logLevel?: string;
    }

    interface Observable<T> {}

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
interface WebComponent {
    createdCallback?: () => void;
    attachedCallback?: () => void;
    detachedCallback?: () => void;
    attributeChangedCallback?: (attrName: string, oldVal: any, newVal: any) => void;
}

declare module "fastdom" {
    export function read(cb: Function): any;
    export function write(cb: Function): any;
    export function defer(frames: number, cb: Function): any;
    export function defer(cb: Function): any;
    export function clear(caller: any): void;
}
