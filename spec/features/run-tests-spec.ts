import Omni from "../../lib/omni-sharp-server/omni";
import {Observable, CompositeDisposable} from "@reactivex/rxjs";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";

describe("Run Tests", () => {
    setupFeature(["features/run-tests"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();

        runs(() => {
            const commands: any = atom.commands;

            expect(commands.registeredCommands["omnisharp-atom:run-all-tests"]).toBeTruthy();
            expect(commands.registeredCommands["omnisharp-atom:run-fixture-tests"]).toBeTruthy();
            expect(commands.registeredCommands["omnisharp-atom:run-single-test"]).toBeTruthy();
            expect(commands.registeredCommands["omnisharp-atom:run-last-test"]).toBeTruthy();
            disposable.dispose();
        });
    });

    // TODO: Test functionality
});
