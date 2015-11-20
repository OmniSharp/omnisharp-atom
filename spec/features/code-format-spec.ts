/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {OmniSharp} from "../../lib/omnisharp.ts";
import {Omni} from "../../lib/omni-sharp-server/omni";
import {CompositeDisposable} from "rx";
import {setupFeature, restoreBuffers} from "../test-helpers";
import {codeFormat} from "../../lib/omnisharp-atom/features/code-format";

describe("Code Format", () => {
    setupFeature(["features/code-format"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();

        const commands: any = atom.commands;

        expect(commands.registeredCommands["omnisharp-atom:code-format"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:code-format-on-semicolon"]).to.be.true;
        expect(commands.registeredCommands["omnisharp-atom:code-format-on-curly-brace"]).to.be.true;

        disposable.dispose();
    });

    it("formats code", (done) => {
        const d = restoreBuffers();
        const disposable = new CompositeDisposable();
        disposable.add(d);
        disposable.add({ dispose: done });
        let e: Atom.TextEditor;
        let request: OmniSharp.Models.FormatRangeRequest;
        let response: OmniSharp.Models.FormatRangeResponse;

        Omni.listener.formatRange
            .do(r => request = r.request)
            .do(r => response = r.response)
            .take(1)
            .toPromise();

        atom.workspace.open("simple/code-format/UnformattedClass.cs")
            .then((editor) => {
                e = editor;
                codeFormat.format();

                return Omni.listener.formatRange
                    .do(r => request = r.request)
                    .take(1)
                    .delay(400)
                    .toPromise();
            })
            .then(() => {
                expect(e.getPath()).to.be.eql(request.FileName);
                const expected = `public class UnformattedClass
{
    public const int TheAnswer = 42;
}
`.replace(/\r|\n/g, "");
                const result = e.getText().replace(/\r|\n/g, "");
                expect(result).to.contain(expected);
                disposable.dispose();
            });
    });
});
