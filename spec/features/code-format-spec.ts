/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {Omni} from "../../lib/server/omni";
import {CompositeDisposable} from "rx";
import {setupFeature, restoreBuffers} from "../test-helpers";
import {codeFormat} from "../../lib/features/code-format";

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

        let tries = 5;
        atom.workspace.open("simple/code-format/UnformattedClass.cs")
            .then((editor) => {
                execute(editor);
            });

        function execute(editor: Atom.TextEditor) {
            Omni.listener.formatRange
                .take(1)
                .subscribe(({request}) => {
                    expect(editor.getPath()).to.be.eql(request.FileName);
                    const expected = `public class UnformattedClass{    public const int TheAnswer = 42;}`;
                    const result = editor.getText().replace(/\r|\n/g, "");
                    try {
                        expect(result).to.contain(expected);
                        tries = 0;
                    } catch (e) {
                        if (tries > 0) {
                            execute(editor);
                        } else {
                            tries = -1;
                            throw e;
                        }
                    } finally {
                        if (tries === -1) {
                            disposable.dispose();
                            done(1);
                        } else if (tries === 0) {
                            disposable.dispose();
                            done();
                        }
                        tries--;
                    }
                });
            codeFormat.format();
        }
    });
});
