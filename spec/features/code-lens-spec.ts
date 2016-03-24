import {Observable} from "rxjs";
/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {Omni} from "../../lib/server/omni";
import {setupFeature, openEditor} from "../test-helpers";
import {Lens} from "../../lib/features/code-lens";

describe("Code Lens", () => {
    setupFeature(["features/code-lens"]);

    (<any>Lens.prototype)._isVisible = () => true;

    it("should add code lens", () => {
        return Observable.zip(
            openEditor("simple/code-lens/CodeLens.cs"),
            Omni.listener.currentfilemembersasflat,
            (x, z) => <[typeof x, typeof z]>[x, z]
        )
            .take(1)
            .delay(300)
            .do((ctx) => {
                expect(ctx[1].response.length).to.be.eql(15);
            })
            .toPromise();
    });

    xit("should handle editor switching", () => {
        return openEditor("simple/code-lens/CodeLens.cs")
            .flatMap(({solution}) => solution.observe.currentfilemembersasflat.take(1))
            .delay(300)
            .flatMap(() => openEditor("simple/code-lens/CodeLens2.cs"))
            .flatMap(({solution}) => solution.observe.currentfilemembersasflat.take(1))
            .delay(300)
            .flatMap(() => openEditor("simple/code-lens/CodeLens.cs"))
            .flatMap(({solution}) => solution.observe.currentfilemembersasflat.take(1), ({editor}) => editor)
            .delay(1000)
            .do((editor) => {
                expect(editor.getDecorations().length).to.be.greaterThan(9);
            })
            .toPromise();
    });
});
