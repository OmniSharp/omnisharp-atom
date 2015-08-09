import ClientManager = require('../lib/omni-sharp-server/client-manager');
import Client = require('../lib/omni-sharp-server/client');
import {Observable} from "rx";
import {setupFeature, openEditor} from "./test-helpers";
import {DriverState} from "omnisharp-client";
import {GenericSelectListView} from "../lib/omnisharp-atom/views/generic-list-view";
import {delay} from "lodash";

describe('OmniSharp Atom', () => {
    setupFeature([], false);

    it('Works with single cs files', function() {
        var c: Client;
        waitsForPromise(() =>
            openEditor('single-cs/class.cs').then(({client}) => c = client));

        runs(() => {
            expect(c.currentState).toBe(DriverState.Connected);
        });
    });

    it('shows a list of solutions when it detects many sln files', function() {
        var p: Rx.IPromise<any>;
        waitsForPromise(() =>
            atom.workspace.open('two-solution/class.cs').then(editor => { p = ClientManager.getClientForEditor(editor).toPromise(); }));

        waitsFor(() => {
            var panels = atom.workspace.getModalPanels();
            return !!panels.length;
        });

        runs(function() {
            var panels = atom.workspace.getModalPanels();
            var panelItem: GenericSelectListView = panels[0].item;
            expect(panelItem._items.length).toBe(2);

            panelItem.onConfirm(panelItem._items[0].name);
        });

        waitsForPromise(() => p);

        runs(() => {
            expect(true).toBe(true);
        });
    });
});
