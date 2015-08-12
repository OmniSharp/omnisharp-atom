import Omni = require('../../lib/omni-sharp-server/omni');
import {Observable, CompositeDisposable} from "rx";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";

describe('Navigation', () => {
    setupFeature(['features/navigate-up-down']);

    it('adds commands', () => {
        var disposable = new CompositeDisposable();

        runs(() => {
            var commands: any = atom.commands;

            expect(commands.registeredCommands['omnisharp-atom:navigate-up']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:navigate-down']).toBeTruthy();
            disposable.dispose();
        });
    });

    // TODO: Test functionality
});
