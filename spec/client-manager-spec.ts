import SolutionManager from "../lib/omni-sharp-server/solution-manager";
import {Solution} from "../lib/omni-sharp-server/solution";
import {Observable} from "rx";
import {setupFeature, openEditor} from "./test-helpers";
import {DriverState} from "omnisharp-client";
import {GenericSelectListView} from "../lib/omnisharp-atom/views/generic-list-view";
import {delay} from "lodash";

describe("OmniSharp Atom", () => {
    setupFeature([], false);

    it("Works with single cs files", function() {
        const c: Solution;
        waitsForPromise(() =>
            openEditor("single-cs/class.cs").then(({solution}) => c = solution));

        runs(() => {
            expect(c.currentState).toBe(DriverState.Connected);
        });
    });

    it("shows a list of solutions when it detects many sln files", function() {
        const p: Rx.IPromise<any>;
        waitsForPromise(() =>
            atom.workspace.open("two-solution/class.cs").then(editor => { p = SolutionManager.getSolutionForEditor(editor).toPromise(); }));

        waitsFor(() => {
            const panels = atom.workspace.getModalPanels();
            return !!panels.length;
        });

        runs(function() {
            const panels = atom.workspace.getModalPanels();
            const panelItem: GenericSelectListView = panels[0].item;
            expect(panelItem._items.length).toBe(2);

            panelItem.onConfirm(panelItem._items[0].name);
        });

        waitsForPromise(() => p);

        runs(() => {
            expect(true).toBe(true);
        });
    });
});
