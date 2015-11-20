/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {CompositeDisposable} from "rx";
import {setupFeature} from "../test-helpers";

describe("Intellisense", () => {
    setupFeature(["features/intellisense"]);

    it("adds commands", (done) => {
        const disposable = new CompositeDisposable();
        const commands: any = atom.commands;

        expect(commands.registeredCommands["omnisharp-atom:intellisense-dot"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:intellisense-space"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:intellisense-semicolon"]).to.be.true;
        disposable.dispose();
    });

    // TODO: Test functionality
});
