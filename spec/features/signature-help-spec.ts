import Client = require("../../lib/omni-sharp-server/client");
import Omni = require('../../lib/omni-sharp-server/omni');
import {Observable, CompositeDisposable} from "rx";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";

describe('Signature Help', () => {
    setupFeature(['features/signature-help']);

    it('adds commands', () => {
        var disposable = new CompositeDisposable();

        runs(() => {
            var commands: any = atom.commands;

            expect(commands.registeredCommands['omnisharp-atom:signature-help']).toBeTruthy();
            disposable.dispose();
        });
    });
});
