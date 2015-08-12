import Omni = require('../../lib/omni-sharp-server/omni');
import {CompositeDisposable} from "rx";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";
import {codeFormat} from "../../lib/omnisharp-atom/features/code-format";

describe('Code Format', () => {
    setupFeature(['features/code-format']);

    it('adds commands', () => {
        var disposable = new CompositeDisposable();

        runs(() => {
            var commands: any = atom.commands;

            expect(commands.registeredCommands['omnisharp-atom:code-format']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:code-format-on-semicolon']).toBeTruthy();
            expect(commands.registeredCommands['omnisharp-atom:code-format-on-curly-brace']).toBeTruthy();

            disposable.dispose();
        });
    });

    it('formats code', () => {
        var d = restoreBuffers();
        var disposable = new CompositeDisposable();
        disposable.add(d);
        var e: Atom.TextEditor;
        var request: OmniSharp.Models.FormatRangeRequest;
        var response: OmniSharp.Models.FormatRangeResponse;

        var responsePromise = Omni.listener.observeFormatRange
            .tapOnNext(r => request = r.request)
            .tapOnNext(r => response = r.response)
            .take(1)
            .toPromise();

        waitsForPromise(() => atom.workspace.open('simple/code-format/UnformattedClass.cs')
            .then((editor) => {
                e = editor;
                codeFormat.format();

                var observable = Omni.listener.observeFormatRange
                    .tapOnNext(r =>
                        request = r.request)
                    .take(1)
                    .delay(400);

                return observable.toPromise();
            }));

        runs(() => {
            expect(e.getPath()).toEqual(request.FileName);
            var expected = `public class UnformattedClass
{
    public const int TheAnswer = 42;
}
`.replace(/\r|\n/g, '');
            var result = e.getText().replace(/\r|\n/g, '');
            expect(result).toContain(expected);
            disposable.dispose();
        });
    });
});
