/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {CompositeDisposable} from "omnisharp-client";
import {setupFeature} from "../test-helpers";

describe("Find Usages", () => {
    setupFeature(["features/find-usages"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();
        const commands: any = atom.commands;

        expect(commands.registeredCommands["omnisharp-atom:find-usages"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:go-to-implementation"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:next-usage"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:go-to-usage"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:previous-usage"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:go-to-next-usage"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:go-to-previous-usage"]).to.be.true;
        disposable.dispose();
    });

    // TODO: Test functionality
});
