/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {CompositeDisposable} from "omnisharp-client";
import {setupFeature} from "../test-helpers";

describe("Run Tests", () => {
    setupFeature(["features/run-tests"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();
        const commands: any = atom.commands;

        expect(commands.registeredCommands["omnisharp-atom:run-all-tests"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:run-fixture-tests"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:run-single-test"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:run-last-test"]).to.be.true;
        disposable.dispose();
    });

    // TODO: Test functionality
});
