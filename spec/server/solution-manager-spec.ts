/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {SolutionManager} from "../../lib/server/solution-manager";
import {setupFeature, openEditor} from "../test-helpers";
import {DriverState} from "omnisharp-client";
import {GenericSelectListView} from "../../lib/views/generic-list-view";
import {Observable} from "rxjs";

describe("Solution Manager", () => {
    setupFeature([], false);

    xit("Works with single cs files", function() {
        return openEditor("single-cs/class.cs")
            .do(({solution}) => {
                expect(solution.currentState).to.be.eql(DriverState.Connected);
            })
            .toPromise();
    });

    it("shows a list of solutions when it detects many sln files", function() {
        const p = atom.workspace.open("two-solution/class.cs")
            .then(editor => SolutionManager.getSolutionForEditor(editor).toPromise());

        function checkPanel(): any {
            const panels = atom.workspace.getModalPanels();
            if (panels.length) {
                const panelItem: GenericSelectListView = panels[0].item;
                expect(panelItem._items.length).to.be.eql(2);

                panelItem.onConfirm(panelItem._items[0].name);

                return p;
            } else {
                return Observable.timer(100).toPromise()
                    .then(() => checkPanel());
            }
        }
        return checkPanel();
    });
});
