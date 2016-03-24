/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {CompositeDisposable} from "omnisharp-client";
import {setupFeature} from "../test-helpers";

describe("Solution Information", () => {
    setupFeature(["atom/solution-information"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();

        const commands: any = atom.commands;

        expect(commands.registeredCommands["omnisharp-atom:next-solution-status"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:solution-status"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:previous-solution-status"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:stop-server"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:start-server"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:restart-server"]).to.be.true;
        disposable.dispose();
    });

    // TODO: Test functionality
});
