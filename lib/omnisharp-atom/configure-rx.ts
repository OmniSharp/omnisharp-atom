// Configure rx / Bluebird for long stacks
const promise = require("bluebird");
if ((<any>atom).devMode) {
    promise.longStackTraces();
}
