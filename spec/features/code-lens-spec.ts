import Omni = require('../../lib/omni-sharp-server/omni');
import {Observable, CompositeDisposable} from "rx";
import {setupFeature, restoreBuffers, openEditor} from "../test-helpers";
import {codeLens, Lens} from "../../lib/omnisharp-atom/features/code-lens";
import * as _ from "lodash";

describe('Code Lens', () => {
    setupFeature(['features/code-lens']);

    (<any>Lens.prototype)._isVisible = () => true;

    var e: Atom.TextEditor;
    it('should add code lens\'', () => {
        var p1 = openEditor('simple/code-lens/CodeLens.cs')
            .then((a) => {
                e = a.editor;
                return a;
            });

        var p2 = Omni.listener.observeCurrentfilemembersasflat.debounce(1000).take(1).toPromise();

        waitsForPromise(() => Promise.all([p1, p2]));

        runs(function() {
            var map: WeakMap<Atom.TextEditor, Lens[]> = (<any>codeLens).decorations;
            var lenses = map.get(e);

            expect(lenses.length).toBe(15);
            //expect(_.filter(lenses, x => x.loaded).length).toBe(9);
        });
    });

    it('should handle editor switching', () => {
        var p1 = openEditor('simple/code-lens/CodeLens.cs')
            .then(() => Omni.listener.observeCurrentfilemembersasflat.debounce(1000).take(1).toPromise())
            .then(() => openEditor('simple/code-lens/CodeLens2.cs'))
            .then(() => Omni.listener.observeCurrentfilemembersasflat.debounce(1000).take(1).toPromise())
            .then(() => openEditor('simple/code-lens/CodeLens.cs'))
            .then((a: any) => {
                e = a.editor;
                return a;
            })
            .then(() => Omni.listener.observeCurrentfilemembersasflat.debounce(1000).take(1).toPromise());

        waitsForPromise(() => p1);

        runs(function() {
            // Sometimes varies as the server starts up
            expect(e.getDecorations().length).toBeGreaterThan(10);
        });
    });
});
