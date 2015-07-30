import ClientManager = require('../lib/omni-sharp-server/client-manager');
import {CompositeDisposable, Disposable, Observable} from "rx";

if ((<any>jasmine.getEnv()).defaultTimeoutInterval < 30000) (<any>jasmine.getEnv()).defaultTimeoutInterval = 30000;
if ((<any>jasmine.getEnv()).defaultTimeoutInterval === 60000) (<any>jasmine.getEnv()).defaultTimeoutInterval = 60000 * 3;

export function setupFeature(features: string[], unitTestMode = true) {
    beforeEach(function() {
        ClientManager._unitTestMode_ = unitTestMode;
        atom.config.set('omnisharp-atom:feature-white-list', true);
        atom.config.set('omnisharp-atom:feature-list', features);

        waitsForPromise(() => atom.packages.activatePackage('omnisharp-atom'))
    });

    afterEach(() => {
        atom.config.set('omnisharp-atom:feature-white-list', undefined);
        atom.config.set('omnisharp-atom:feature-list', undefined);
    });
}

export function restoreBuffers() {
    var disposable = new CompositeDisposable();
    var buffers = new Map<string, string>();

    if (ClientManager._unitTestMode_) {
        disposable.add(ClientManager.observationClient.responses
            .where(z =>
                z.request.FileName && z.request.Buffer)
            .map(z =>
                ({ fileName: <string>z.request.FileName, buffer: <string>z.request.Buffer }))
            .where(({fileName}) =>
                !buffers.has(fileName))
            .subscribe(({fileName, buffer}) => {
                buffers.set(fileName, buffer);
            }));
    }

    return Disposable.create(() => {
        disposable.dispose();
        // Reset the buffers to their original state
        if (ClientManager._unitTestMode_) {
            var results: Rx.Observable<any>[] = [];
            var iterator = buffers.entries();
            var iteratee = iterator.next();
            while (!iteratee.done) {
                var [path, buffer] = iteratee.value;

                results.push(
                    ClientManager.getClientForPath(path)
                        .map(z => z.updatebuffer({
                            Line: 0,
                            Column: 0,
                            Buffer: buffer,
                            FileName: path
                        }))
                    );

                iteratee = iterator.next();
            }
        }
    });
}
