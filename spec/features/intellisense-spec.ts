import Omni = require('../../lib/omni-sharp-server/omni');
import {Observable, CompositeDisposable} from "rx";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";

describe('Intellisense', () => {
    setupFeature(['features/intellisense']);

    it('adds commands', () => {
        var disposable = new CompositeDisposable();

        runs(() => {
            var commands: any = atom.commands;

            expect(commands.registeredCommands['omnisharp-atom:intellisense-dot']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:intellisense-space']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:intellisense-semicolon']).toBeTruthy();
            disposable.dispose();
        });
    });

    // TODO: Test functionality
});
