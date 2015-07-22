/// <reference path="tsd.d.ts" />
import Omni = require('../lib/omni-sharp-server/omni');
import ClientManager = require('../lib/omni-sharp-server/client-manager');
import {DriverState} from "omnisharp-client";
import {Observable} from "rx";
import Promise = require('bluebird');

var turnOnOmnisharp = new Promise(resolve => {
    setTimeout(() => {

        var workspaceView = atom.views.getView(atom.workspace);
        jasmine.attachToDOM(workspaceView);
        resolve(null);
    }, 1000)
})
    .then(() => atom.packages.activatePackage('status-bar'))
    .then(() => atom.packages.activatePackage('omnisharp-atom'))
    .then(() => atom.workspace.open('project.json'));

if (jasmine.getEnv().defaultTimeoutInterval < 15000) jasmine.getEnv().defaultTimeoutInterval = 15000;

describe('OmniSharp Atom', () => {
    beforeEach(() => {
        return waitsForPromise(() => turnOnOmnisharp);
    });
    describe('when the package is activated', () => {
        // TODO: Figure out the best way to test this without workspaceView
        //it('should display the atom sharper button in the status bar', () => {
        //    return expect(statusBar.find('.omnisharp-atom-button')).toExist();
        //});
        it('connect', () => {
            waitsForPromise(() =>
                Observable.merge(
                    ClientManager.activeClients.map(x =>
                        x.state.startWith(x.currentState)))
                    .where(z =>
                        z === DriverState.Connected)
                    .take(1)
                    .toPromise());

            runs(() => {
                expect(Omni.isOn).toBeTruthy();
            })
        });
    });
});
