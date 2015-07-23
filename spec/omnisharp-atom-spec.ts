/// <reference path="tsd.d.ts" />
import Omni = require('../lib/omni-sharp-server/omni');
import ClientManager = require('../lib/omni-sharp-server/client-manager');
import {DriverState} from "omnisharp-client";
import {Observable} from "rx";
import Promise = require('bluebird');


if ((<any>jasmine.getEnv()).defaultTimeoutInterval < 30000) (<any>jasmine.getEnv()).defaultTimeoutInterval = 30000;

describe('OmniSharp Atom', () => {
    beforeEach(() => {
        ClientManager._unitTestMode_ = false;
        atom.config.set('omnisharp-atom:feature-white-list', true);
        atom.config.set('omnisharp-atom:feature-list', []);

        return waitsForPromise(() => atom.packages.activatePackage('omnisharp-atom'));
    });

    afterEach(() => {
        atom.config.set('omnisharp-atom:feature-white-list', undefined);
        atom.config.set('omnisharp-atom:feature-list', undefined);
    });

    describe('when the package is activated', () => {
        it('connect', () => {
            waitsForPromise(() =>
                Observable.fromPromise(atom.workspace.open('simple/project.json'))
                    .delay(1000)
                    .flatMap(editor => ClientManager.getClientForEditor(editor))
                    .flatMap(x => x.state.startWith(x.currentState))
                    .where(z => z === DriverState.Connected)
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
                    .delay(1000)
                    .flatMap(x => Observable.from(x))
                    .flatMap(editor => ClientManager.getClientForEditor(editor))
                    .flatMap(x => x.state.startWith(x.currentState))
                    .where(z => z === DriverState.Connected)
                    .take(2)
                    .toPromise());

            runs(() => {
                expect(ClientManager.connected).toBeTruthy();
                expect(ClientManager.activeClients.length).toBe(2);
            });
        });
    });
});
