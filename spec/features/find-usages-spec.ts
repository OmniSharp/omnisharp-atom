import Omni = require('../../lib/omni-sharp-server/omni');
import {Observable, CompositeDisposable} from "rx";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";

describe('Find Usages', () => {
    setupFeature(['features/find-usages']);

    it('adds commands', () => {
        var disposable = new CompositeDisposable();

        runs(() => {
            var commands: any = atom.commands;

            expect(commands.registeredCommands['omnisharp-atom:find-usages']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:go-to-implementation']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:next-usage']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:go-to-usage']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:previous-usage']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:go-to-next-usage']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:go-to-previous-usage']).toBeTruthy();
            disposable.dispose();
        });
    });

    // TODO: Test functionality
});
