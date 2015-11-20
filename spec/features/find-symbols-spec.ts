/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {CompositeDisposable} from "rx";
import {setupFeature} from "../test-helpers";

describe("Find Symbols", () => {
    setupFeature(["features/find-symbols"]);

    it("adds commands", (done) => {
        const disposable = new CompositeDisposable();
        const commands: any = atom.commands;

        expect(commands.registeredCommands["omnisharp-atom:find-symbols"]).to.be.true;
        disposable.dispose();
        done();
    });

    // TODO: Test functionality
});
