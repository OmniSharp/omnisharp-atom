import ClientManager = require('../lib/omni-sharp-server/client-manager');
import {CompositeDisposable, Disposable, Observable} from "rx";
import {DriverState} from "omnisharp-client";

if ((<any>jasmine.getEnv()).defaultTimeoutInterval < 30000) (<any>jasmine.getEnv()).defaultTimeoutInterval = 30000;
if ((<any>jasmine.getEnv()).defaultTimeoutInterval === 60000) (<any>jasmine.getEnv()).defaultTimeoutInterval = 60000 * 3;

ClientManager.observationClient.errors.subscribe(error => console.error(JSON.stringify(error)));
ClientManager.observationClient.events.subscribe(event => console.info(`server event: ${JSON.stringify(event) }`));
ClientManager.observationClient.requests.subscribe(r => console.info(`request: ${JSON.stringify(r) }`));
ClientManager.observationClient.responses.subscribe(r => console.info(`response: ${JSON.stringify(r) }`));

export function setupFeature(features: string[], unitTestMode = true) {
    var cd: CompositeDisposable;
    beforeEach(function() {
        cd = new CompositeDisposable();
        ClientManager._unitTestMode_ = unitTestMode;

        atom.config.set('omnisharp-atom:feature-white-list', true);
        atom.config.set('omnisharp-atom:feature-list', features);

        waitsForPromise(() => atom.packages.activatePackage('language-csharp')
            .then(() => atom.packages.activatePackage('omnisharp-atom'))
            .then((pack: Atom.Package) => pack.mainModule._started.toPromise())
        );
    });

    afterEach(() => {
        atom.config.set('omnisharp-atom:feature-white-list', undefined);
        atom.config.set('omnisharp-atom:feature-list', undefined);
        cd.dispose();
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

export function openEditor(file: string) {
    return Observable.fromPromise(atom.workspace.open(file))
        .flatMap(editor =>
            ClientManager.getClientForEditor(editor).map(client => ({
                editor,
                client: client
            }))
        )
        .flatMap(({editor, client}) => client.state.startWith(client.currentState).map(state=> ({ editor, client, state: state })))
        .where(z => z.state === DriverState.Connected)
        .take(1)
        .toPromise();
}
