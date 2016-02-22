/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {Omni} from "../../lib/server/omni";
import {CompositeDisposable} from "omnisharp-client";
import {setupFeature, restoreBuffers} from "../test-helpers";
import {codeFormat} from "../../lib/features/code-format";

describe("Code Format", () => {
    setupFeature(["features/code-format"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();

        const commands: any = atom.commands;

        expect(commands.registeredCommands["omnisharp-atom:code-format"]).to.be.true;

        disposable.dispose();
    });

    it("formats code", () => {
        const d = restoreBuffers();
        const disposable = new CompositeDisposable();
        disposable.add(d);

        let tries = 5;
        return atom.workspace.open("simple/code-format/UnformattedClass.cs")
            .then((editor) => {
                return execute(editor);
            });

        function execute(editor: Atom.TextEditor): any {
            const promise = Omni.listener.formatRange
                .take(1)
                .toPromise()
                .then(({request}) => {
                    expect(editor.getPath()).to.be.eql(request.FileName);
                    const expected = `public class UnformattedClass{    public const int TheAnswer = 42;}`;
                    const result = editor.getText().replace(/\r|\n/g, "");
                    try {
                        expect(result).to.contain(expected);
                        tries = 0;
                    } catch (e) {
                        if (tries > 0) {
                            return execute(editor);
                        } else {
                            tries = -1;
                            throw e;
                        }
                    } finally {
                        if (tries === -1) {
                            disposable.dispose();
                            throw new Error("Failed!");
                        } else if (tries === 0) {
                            disposable.dispose();
                        }
                        tries--;
                    }
                });
            codeFormat.format();
            return promise;
        }
    });
});
