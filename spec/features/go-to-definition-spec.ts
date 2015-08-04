import Omni = require('../../lib/omni-sharp-server/omni');
import {Observable, CompositeDisposable} from "rx";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";

describe('Go To Definition', () => {
    setupFeature(['features/go-to-definition']);

    it('adds commands', () => {
        var disposable = new CompositeDisposable();

        runs(() => {
            var commands: any = atom.commands;

            expect(commands.registeredCommands['omnisharp-atom:go-to-definition']).toBeTruthy();
            disposable.dispose();
        });
    });

    // TODO: Test functionality
});
