/// <reference path="typingsTemp/atom/atom.d.ts" />
/// <reference path="typingsTemp/atom-keymap/atom-keymap.d.ts" />
/// <reference path="typingsTemp/atom-space-pen-views/atom-space-pen-views.d.ts" />
/// <reference path="typingsTemp/event-kit/event-kit.d.ts" />
/// <reference path="typingsTemp/first-mate/first-mate.d.ts" />
/// <reference path="typingsTemp/linter/linter.d.ts" />
/// <reference path="typingsTemp/pathwatcher/pathwatcher.d.ts" />
/// <reference path="typingsTemp/property-accessors/property-accessors.d.ts" />
/// <reference path="typingsTemp/scandal/scandal.d.ts" />
/// <reference path="typingsTemp/scoped-property-store/scoped-property-store.d.ts" />
/// <reference path="typingsTemp/serializable/serializable.d.ts" />
/// <reference path="typingsTemp/space-pen/space-pen.d.ts" />
/// <reference path="typingsTemp/status-bar/status-bar.d.ts" />
/// <reference path="typingsTemp/text-buffer/text-buffer.d.ts" />
/// <reference path="node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="node_modules/omnisharp-client/omnisharp-client.d.ts" />
/// <reference path="typings/bluebird/bluebird.d.ts" />
/// <reference path="typings/chai/chai.d.ts" />
/// <reference path="typings/jasmine/jasmine.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/lodash/lodash.d.ts" />
/// <reference path="typings/mixto/mixto.d.ts" />
/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/q/Q.d.ts" />
/// <reference path="typings/react/react.d.ts" />
/// <reference path="typings/semver/semver.d.ts" />

declare module chai {
    interface Assert {
        isAbove(valueToCheck: number, valueToBeAbove: number, message?: string);
    }
}

declare module _ {
    interface LoDashStatic {
        set: any;
    }
}
