import Omni = require("../lib/omni-sharp-server/omni");
import SolutionManager from "../lib/omni-sharp-server/solution-manager";
import {DriverState} from "omnisharp-client";
import {Observable} from "rx";
import {setupFeature} from "./test-helpers";

describe("OmniSharp Atom", () => {
    setupFeature([]);

    describe("when the package is activated", () => {
        it("connect", () => {
            waitsForPromise(() =>
                Observable.fromPromise(atom.workspace.open("simple/code-lens/CodeLens.cs"))
                    .flatMap(editor =>
                        SolutionManager.getSolutionForEditor(editor))
                    .flatMap(x =>
                        x.state.startWith(x.currentState))
                    .where(z =>
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
                    .flatMap(x => Observable.from(x))
                    .flatMap(editor =>
                        SolutionManager.getSolutionForEditor(editor))
                    .flatMap(x =>
                        x.state.startWith(x.currentState))
                    .where(z =>
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
