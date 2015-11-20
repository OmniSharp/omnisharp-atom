/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {CompositeDisposable} from "rx";
import {setupFeature} from "../test-helpers";

describe("Signature Help", () => {
    setupFeature(["features/signature-help"]);

    it("adds commands", (done) => {
        const disposable = new CompositeDisposable();
        const commands: any = atom.commands;

        expect(commands.registeredCommands["omnisharp-atom:signature-help"]).to.be.true;
        disposable.dispose();
        done();
    });
});
