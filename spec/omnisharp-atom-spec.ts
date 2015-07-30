import Omni = require('../lib/omni-sharp-server/omni');
import ClientManager = require('../lib/omni-sharp-server/client-manager');
import {DriverState} from "omnisharp-client";
import {Observable} from "rx";
import {setupFeature} from "./test-helpers";

describe('OmniSharp Atom', () => {
    setupFeature([], false);

    describe('when the package is activated', () => {
        it('connect', () => {
            waitsForPromise(() =>
                Observable.fromPromise(atom.workspace.open('simple/project.json'))
                    .flatMap(editor =>
                        ClientManager.getClientForEditor(editor))
                    .flatMap(x =>
                        x.state.startWith(x.currentState))
                    .where(z =>
                        z === DriverState.Connected)
                    .take(1)
                    .toPromise());

            runs(() => {
                expect(ClientManager.connected).toBeTruthy();
            });
        });

        it('connect-simple2', () => {
            waitsForPromise(() =>
                Observable.fromPromise(
                    Promise.all([
                        atom.workspace.open('simple/project.json'),
                        atom.workspace.open('simple2/project.json')
                    ])
                    )
                    .flatMap(x => Observable.from(x))
                    .flatMap(editor =>
                        ClientManager.getClientForEditor(editor))
                    .flatMap(x =>
                        x.state.startWith(x.currentState))
                    .where(z =>
                        z === DriverState.Connected)
                    .take(2)
                    .toPromise());

            runs(() => {
                expect(ClientManager.connected).toBeTruthy();
                expect(ClientManager.activeClients.length).toBe(2);
            });
        });
    });
});
