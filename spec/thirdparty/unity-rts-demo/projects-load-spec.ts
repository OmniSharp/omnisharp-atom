import Omni = require('../../../lib/omni-sharp-server/omni');
import ClientManager = require('../../../lib/omni-sharp-server/client-manager');
import {DriverState} from "omnisharp-client";
import {Observable} from "rx";
import {setupFeature} from "../../test-helpers";

describe('RTS Tutorial', () => {
    setupFeature([], true);

    it('loads solution 1 projects', () => {
        var p1: Rx.IPromise<any>, p2: Rx.IPromise<any>, p3: Rx.IPromise<any>;
        runs(() => {
            // Init the editor, and start connecting.
            p1 = Observable.fromPromise(atom.workspace.open('thirdparty/unity-rts-demo/RTS Tutorial/Assets/Menu/Scripts/ConfirmDialog.cs'))
                .flatMap(editor =>
                    ClientManager.getClientForEditor(editor))
                .flatMap(x =>
                    x.state.startWith(x.currentState))
                .where(z =>
                    z === DriverState.Connected)
                .take(1)
                .toPromise();

            // Should call out to projects
            p2 = Omni.listener
                .observeProjects
                .take(1)
                .toPromise();

            // Shoud produce a list of projects
            // Two are included in this sln
            p3 = Omni.listener
                .model.projectAdded
                .take(1)
                .toArray()
                .toPromise();
        });

        waitsForPromise(() => Promise.all([p1, p2, p3]));
        runs(() => {
            expect(true).toBe(true);
        });
    });
});
