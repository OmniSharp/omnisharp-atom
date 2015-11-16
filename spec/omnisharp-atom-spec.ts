import Omni from "../lib/omni-sharp-server/omni";
import SolutionManager from "../lib/omni-sharp-server/solution-manager";
import {DriverState} from "omnisharp-client";
import {Observable} from "@reactivex/rxjs";
import {setupFeature} from "./test-helpers";

describe("OmniSharp Atom", () => {
    setupFeature([]);

    describe("when the package is activated", () => {
        it("connect", () => {
            waitsForPromise(() =>
                Observable.fromPromise(atom.workspace.open("simple/code-lens/CodeLens.cs"))
                    .mergeMap(editor =>
                        SolutionManager.getSolutionForEditor(editor))
                    .mergeMap(x =>
                        x.state.startWith(x.currentState))
                    .filter(z =>
                        z === DriverState.Connected)
                    .take(1)
                    .toPromise());

            runs(() => {
                expect(SolutionManager.connected).toBeTruthy();
            });
        });

        it("connect-simple2", () => {
            waitsForPromise(() =>
                Observable.fromPromise(
                    Promise.all([
                        atom.workspace.open("simple/code-lens/CodeLens.cs"),
                        atom.workspace.open("simple2/project.json")
                    ])
                    )
                    .mergeMap(x => Observable.from(x))
                    .mergeMap(editor =>
                        SolutionManager.getSolutionForEditor(editor))
                    .mergeMap(x =>
                        x.state.startWith(x.currentState))
                    .filter(z =>
                        z === DriverState.Connected)
                    .take(2)
                    .toPromise());

            runs(() => {
                expect(SolutionManager.connected).toBeTruthy();
                expect(SolutionManager.activeSolutions.length).toBe(2);
            });
        });
    });
});
