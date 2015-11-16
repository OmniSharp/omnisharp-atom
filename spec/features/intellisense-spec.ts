import Omni from "../../lib/omni-sharp-server/omni";
import {Observable, CompositeDisposable} from "@reactivex/rxjs";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";

describe("Intellisense", () => {
    setupFeature(["features/intellisense"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();

        runs(() => {
            const commands: any = atom.commands;

            expect(commands.registeredCommands["omnisharp-atom:intellisense-dot"]).toBeTruthy();
            expect(commands.registeredCommands["omnisharp-atom:intellisense-space"]).toBeTruthy();
            expect(commands.registeredCommands["omnisharp-atom:intellisense-semicolon"]).toBeTruthy();
            disposable.dispose();
        });
    });

    // TODO: Test functionality
});
