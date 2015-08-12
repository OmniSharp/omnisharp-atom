import Omni = require('../../lib/omni-sharp-server/omni');
import {Observable, CompositeDisposable} from "rx";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";

describe('Run Tests', () => {
    setupFeature(['features/run-tests']);

    it('adds commands', () => {
        var disposable = new CompositeDisposable();

        runs(() => {
            var commands: any = atom.commands;

            expect(commands.registeredCommands['omnisharp-atom:run-all-tests']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:run-fixture-tests']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:run-single-test']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:run-last-test']).toBeTruthy();
            disposable.dispose();
        });
    });

    // TODO: Test functionality
});
