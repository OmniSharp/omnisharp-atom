/// <reference path="../tsd.d.ts" />
/// <reference path="../typings/jasmine/jasmine.d.ts" />

declare function waitsForPromise<T>(callback: () => Promise<T>);
declare function waitsForPromise<T>(callback: () => Q.Promise<T>);

declare module  jasmine {
    function attachToDOM(element:any);

    interface Matchers {
        toExist();
    }
}
