/// <reference path="tsd.d.ts" />
import {expect} from "chai";
import {SolutionManager} from "../lib/omni-sharp-server/solution-manager";
import {setupFeature, openEditor} from "./test-helpers";
import {DriverState} from "omnisharp-client";
import {GenericSelectListView} from "../lib/omnisharp-atom/views/generic-list-view";

describe("OmniSharp Atom", () => {
    setupFeature([], false);

    it("Works with single cs files", function(done) {
        openEditor("single-cs/class.cs")
            .subscribe(({solution}) => {
                expect(solution.currentState).to.be.eql(DriverState.Connected);
            });
    });

    it("shows a list of solutions when it detects many sln files", function(done) {
        atom.workspace.open("two-solution/class.cs")
            .then(editor => SolutionManager.getSolutionForEditor(editor).toPromise())
            .then(() => done());

        function checkPanel() {
            const panels = atom.workspace.getModalPanels();
            if (panels.length) {
                const panelItem: GenericSelectListView = panels[0].item;
                expect(panelItem._items.length).to.be.eql(2);

                panelItem.onConfirm(panelItem._items[0].name);
            } else {
                setTimeout(checkPanel, 100);
            }
        }
        checkPanel();
    });
});
