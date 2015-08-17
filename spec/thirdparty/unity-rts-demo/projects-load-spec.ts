import Omni = require('../../../lib/omni-sharp-server/omni');
import ClientManager = require('../../../lib/omni-sharp-server/client-manager');
import {DriverState} from "omnisharp-client";
import {Observable} from "rx";
import {setupFeature} from "../../test-helpers";

describe('RTS Tutorial', () => {
    setupFeature([], true);

    it('loads solution 1 projects', () => {
        var p2: Rx.IPromise<any>, p3: Rx.IPromise<any>;
        runs(() => {
            var o = Observable.fromPromise(atom.workspace.open('thirdparty/unity-rts-demo/RTS Tutorial/Assets/Menu/Scripts/ConfirmDialog.cs'))
                .flatMap(editor =>
                    ClientManager.getClientForEditor(editor))
                .share();
            // Should call out to projects
            p2 = o.flatMap(x => x.observeProjects)
                .take(1)
                .toPromise();

            // Shoud produce a list of projects
            // Two are included in this sln
            p3 = o.flatMap(x => x.model.observe.projectAdded)
                .take(1)
                .toArray()
                .toPromise();

            p2.then(() => console.log('p2 - RTS Tutorial'));
            p3.then(() => console.log('p3 - RTS Tutorial'));
        });

        waitsForPromise(() => Promise.all([p2, p3]));
        runs(() => {
            expect(true).toBe(true);
        });
    });
});
