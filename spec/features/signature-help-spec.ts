import {Solution} from "../../lib/omni-sharp-server/solution";
import Omni from "../../lib/omni-sharp-server/omni";
import {Observable, CompositeDisposable} from "@reactivex/rxjs";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";

describe("Signature Help", () => {
    setupFeature(["features/signature-help"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();

        runs(() => {
            const commands: any = atom.commands;

            expect(commands.registeredCommands["omnisharp-atom:signature-help"]).toBeTruthy();
            disposable.dispose();
        });
    });
});
