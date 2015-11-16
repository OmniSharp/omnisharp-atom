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
