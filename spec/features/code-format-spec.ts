import {Omni} from "../../lib/omni-sharp-server/omni";
import {CompositeDisposable} from "rx";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";
import {codeFormat} from "../../lib/omnisharp-atom/features/code-format";

describe("Code Format", () => {
    setupFeature(["features/code-format"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();

        runs(() => {
            const commands: any = atom.commands;

            expect(commands.registeredCommands["omnisharp-atom:code-format"]).toBeTruthy();
            expect(commands.registeredCommands["omnisharp-atom:code-format-on-semicolon"]).toBeTruthy();
            expect(commands.registeredCommands["omnisharp-atom:code-format-on-curly-brace"]).toBeTruthy();

            disposable.dispose();
        });
    });

    it("formats code", () => {
        const d = restoreBuffers();
        const disposable = new CompositeDisposable();
        disposable.add(d);
        const e: Atom.TextEditor;
        const request: OmniSharp.Models.FormatRangeRequest;
        const response: OmniSharp.Models.FormatRangeResponse;

        const responsePromise = Omni.listener.formatRange
            .tapOnNext(r => request = r.request)
            .tapOnNext(r => response = r.response)
            .take(1)
            .toPromise();

        waitsForPromise(() => atom.workspace.open("simple/code-format/UnformattedClass.cs")
            .then((editor) => {
                e = editor;
                codeFormat.format();

                const observable = Omni.listener.formatRange
                    .tapOnNext(r =>
                        request = r.request)
                    .take(1)
                    .delay(400);

                return observable.toPromise();
            }));

        runs(() => {
            expect(e.getPath()).toEqual(request.FileName);
            const expected = `public class UnformattedClass
{
    public const int TheAnswer = 42;
}
`.replace(/\r|\n/g, "");
            const result = e.getText().replace(/\r|\n/g, "");
            expect(result).toContain(expected);
            disposable.dispose();
        });
    });
});
