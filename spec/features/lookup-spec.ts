/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {setupFeature} from "../test-helpers";
import {CompositeDisposable} from "omnisharp-client";

describe("Lookup", () => {
    setupFeature(["features/lookup"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();
        const commands: any = atom.commands;

        expect(commands.registeredCommands["omnisharp-atom:type-lookup"]).to.be.true;
        disposable.dispose();
    });

    // TODO: Test functionality
});
