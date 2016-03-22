/// <reference path="tsd.d.ts" />
import {expect} from "chai";
import {SolutionManager} from "../lib/server/solution-manager";
import {DriverState} from "omnisharp-client";
import {Observable} from "rxjs";
import {setupFeature} from "./test-helpers";

describe("OmniSharp Atom", () => {
    setupFeature([]);

    describe("when the package is activated", () => {
        it("connect", () => {
            return Observable.fromPromise<Atom.TextEditor>(<any>atom.workspace.open("simple/code-lens/CodeLens.cs"))
                .flatMap(editor => SolutionManager.getSolutionForEditor(editor))
                .flatMap(x => x.state.startWith(x.currentState))
                .filter(z => z === DriverState.Connected)
                .take(1)
                .do(() => {
                    expect(SolutionManager.connected).to.be.true;
                })
                .toPromise();
        });

        xit("connect-simple2", () => {
            return Observable.fromPromise(
                Promise.all([
                    atom.workspace.open("simple/code-lens/CodeLens.cs"),
                    atom.workspace.open("simple2/project.json")
                ])
            )
                .flatMap(x => x)
                .flatMap(editor => SolutionManager.getSolutionForEditor(editor))
                .flatMap(x => x.state.startWith(x.currentState))
                .filter(z => z === DriverState.Connected)
                .take(1)
                .do(null, null, () => {
                    expect(SolutionManager.connected).to.be.true;
                    expect(SolutionManager.activeSolutions.length).to.be.eql(2);
                })
                .toPromise();
        });
    });
});
