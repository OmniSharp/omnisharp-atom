/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {CompositeDisposable} from "omnisharp-client";
import {setupFeature} from "../test-helpers";

describe("Go To Definition", () => {
    setupFeature(["features/go-to-definition"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();
        const commands: any = atom.commands;

        expect(commands.registeredCommands["omnisharp-atom:go-to-definition"]).to.be.true;
        disposable.dispose();
    });

    // TODO: Test functionality
});
