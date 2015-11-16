import Omni from "../../lib/omni-sharp-server/omni";
import {Observable, CompositeDisposable} from "@reactivex/rxjs";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";

describe("Lookup", () => {
    setupFeature(["features/lookup"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();

        runs(() => {
            const commands: any = atom.commands;

            expect(commands.registeredCommands["omnisharp-atom:type-lookup"]).toBeTruthy();
            disposable.dispose();
        });
    });

    // TODO: Test functionality
});
