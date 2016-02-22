/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {CompositeDisposable} from "omnisharp-client";
import {setupFeature, openEditor} from "../test-helpers";
const win32 = process.platform === "win32";
import {getDnxExe} from "../../lib/atom/command-runner";

describe("Command Runner", () => {
    setupFeature(["atom/command-runner"]);

    xit("adds commands", () => {
        const disposable = new CompositeDisposable();
        return openEditor("commands/project.json")
            .flatMap(x => x.solution.observe.projects)
            .debounceTime(1000)
            .do(() => {
                const commands: any = atom.commands;

                expect(commands.registeredCommands["omnisharp-dnx:commands-[web]-(watch)"]).to.be.true;
                expect(commands.registeredCommands["omnisharp-dnx:commands-[kestrel]-(watch)"]).to.be.true;
                expect(commands.registeredCommands["omnisharp-dnx:commands-[run]"]).to.be.true;
                disposable.dispose();
            })
            .toPromise();
    });

    it("returns the correct path for a given environment", () => {
        const result = getDnxExe(<any>{
            model: {
                runtimePath: "abc"
            }
        });

        if (win32) {
            expect(result).to.be.eql("abc\\bin\\dnx.exe");
        } else {
            expect(result).to.be.eql("abc/bin/dnx");
        }
    });

    // TODO: Add Tests for the daemon
});
