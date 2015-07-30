import Omni = require('../../lib/omni-sharp-server/omni');
import ClientManager = require('../../lib/omni-sharp-server/client-manager');
import {DriverState} from "omnisharp-client";
import {Observable, CompositeDisposable, AsyncSubject} from "rx";
import {setupFeature, restoreBuffers} from "../test-helpers";
import {codeFormat} from "../../lib/omnisharp-atom/features/code-format";

describe('Code Format', () => {
    setupFeature(['features/code-format']);

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
            expect(response.Changes.length).toBe(1);
            disposable.dispose();
        });
    });
});
