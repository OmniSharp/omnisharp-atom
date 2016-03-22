/// <reference path="../tsd.d.ts" />
import {expect} from "chai";
import {CompositeDisposable} from "omnisharp-client";
import {setupFeature, openEditor} from "../test-helpers";
import {RenameView} from "../../lib/views/rename-view";
import {Observable} from "rxjs";
const a = require("atom");
/* tslint:disable:variable-name */
const Range: typeof TextBuffer.Range = a.Range;
/* tslint:enable:variable-name */

describe("Rename", () => {
    setupFeature(["features/rename"]);

    it("adds commands", () => {
        const disposable = new CompositeDisposable();
        const commands: any = atom.commands;

        expect(commands.registeredCommands["omnisharp-atom:rename"]).to.be.true;
        disposable.dispose();
    });

    it("should select rename text appropriately with selection", () => {
        openEditor("simple/rename/ClassToRename.cs")
            .subscribe(({editor}) => {
                editor.setSelectedBufferRange(<any>new Range([4, 16], [4, 22]));
                atom.commands.dispatch(atom.views.getView(editor), "omnisharp-atom:rename");
            });

        function checkPanel(): any {
            const panels = atom.workspace.getTopPanels();
            if (panels.length) {
                const panel: RenameView = panels[0].item;
                expect(panel.miniEditor.getText()).to.be.eql("Method");
            } else {
                return Observable.timer(100).toPromise().then(() => checkPanel());
            }
        }
        return checkPanel();
    });

    it("should select rename text appropriately with cursor", () => {
        openEditor("simple/rename/ClassToRename.cs")
            .subscribe(({editor}) => {
                editor.setCursorBufferPosition([4, 18]);
                atom.commands.dispatch(atom.views.getView(editor), "omnisharp-atom:rename");
            });

        function checkPanel(): any {
            const panels = atom.workspace.getTopPanels();
            if (panels.length) {
                const panel: RenameView = panels[0].item;
                expect(panel.miniEditor.getText()).to.be.eql("Method");
            } else {
                return Observable.timer(100).toPromise().then(() => checkPanel());
            }
        }
        return checkPanel();
    });

});
