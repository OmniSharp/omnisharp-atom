/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {CompositeDisposable} from "omnisharp-client";
import {setupFeature} from "../test-helpers";

describe("Signature Help", () => {
    setupFeature(["features/signature-help"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();
        const commands: any = atom.commands;

        expect(commands.registeredCommands["omnisharp-atom:signature-help"]).to.be.true;
        disposable.dispose();
    });
});
