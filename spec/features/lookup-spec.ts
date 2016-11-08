/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {CompositeDisposable} from "ts-disposables";
import {setupFeature} from "../test-helpers";

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
