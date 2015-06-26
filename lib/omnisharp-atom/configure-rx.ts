// Configure rx / Bluebird for long stacks
var rx = require("rx");
var promise = require('bluebird');

rx.Observable.ofObjectChanges = function(obj) {
    if (obj == null) { throw new TypeError('object must not be null or undefined.'); }
    if (typeof (<any>Object).observe !== 'function' && typeof (<any>Object).unobserve !== 'function') { throw new TypeError('Object.observe is not supported on your platform') }
    return rx.Observable.create(function(observer) {
        function observerFn(changes) {
            for (var i = 0, len = changes.length; i < len; i++) {
                observer.onNext(changes[i]);
            }
        }

        (<any>Object).observe(obj, observerFn);

        return function() {
            (<any>Object).unobserve(obj, observerFn);
        };
    });
};

rx.Observable.ofArrayChanges = function(array) {
    if (!Array.isArray(array)) { throw new TypeError('Array.observe only accepts arrays.'); }
    if (typeof (<any>Array).observe !== 'function' && typeof (<any>Array).unobserve !== 'function') { throw new TypeError('Array.observe is not supported on your platform') }
    return rx.Observable.create(function(observer) {
        function observerFn(changes) {
            for (var i = 0, len = changes.length; i < len; i++) {
                observer.onNext(changes[i]);
            }
        }

        (<any>Array).observe(array, observerFn);

        return function() {
            (<any>Array).unobserve(array, observerFn);
        };
    });
};

if ((<any>atom).devMode) {
    promise.longStackTraces();
    rx.config.promise = promise;
    rx.config.longStackSupport = true;
}
