/// <reference path="../tsd.d.ts" />
//import {expect} from "chai";
import {CompositeDisposable} from "omnisharp-client";
import {setupFeature} from "../test-helpers";

describe("Intellisense", () => {
    setupFeature(["features/intellisense"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();
        //const commands: any = atom.commands;

        disposable.dispose();
    });

    // TODO: Test functionality
});
