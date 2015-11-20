/// <reference path="tsd.d.ts" />
import {SolutionManager} from "../lib/omni-sharp-server/solution-manager";
import {Observable} from "rx";
import {CompositeDisposable, Disposable} from "rx";
import {DriverState} from "omnisharp-client";

SolutionManager.solutionObserver.errors.subscribe(error => console.error(JSON.stringify(error)));
SolutionManager.solutionObserver.events.subscribe(event => console.info(`server event: ${JSON.stringify(event) }`));
SolutionManager.solutionObserver.requests.subscribe(r => console.info(`request: ${JSON.stringify(r) }`));
SolutionManager.solutionObserver.responses.subscribe(r => console.info(`response: ${JSON.stringify(r) }`));

export function setupFeature(features: string[], unitTestMode = true) {
    let cd: CompositeDisposable;
    beforeEach(function(done) {
        cd = new CompositeDisposable();
        SolutionManager._unitTestMode_ = unitTestMode;
        SolutionManager._kick_in_the_pants_ = true;

        atom.config.set("omnisharp-atom:feature-white-list", true);
        atom.config.set("omnisharp-atom:feature-list", features);

        atom.packages.activatePackage("language-csharp")
            .then(() => atom.packages.activatePackage("omnisharp-atom"))
            .then((pack: Atom.Package) => pack.mainModule._activated.toPromise())
            .then(done);
    });

    afterEach(() => {
        atom.config.set("omnisharp-atom:feature-white-list", undefined);
        atom.config.set("omnisharp-atom:feature-list", undefined);
        SolutionManager._unitTestMode_ = false;
        SolutionManager._kick_in_the_pants_ = false;
        cd.dispose();
    });
}

export function restoreBuffers() {
    return Disposable.empty;
    /*
    let disposable = new CompositeDisposable();
    const buffers = new Map<string, string>();

    if (SolutionManager._unitTestMode_) {
        disposable.add(SolutionManager.solutionObserver.responses
            .filter(z =>
                z.request.FileName && z.request.Buffer)
            .map(z =>
                ({ fileName: <string>z.request.FileName, buffer: <string>z.request.Buffer }))
            .filter(({fileName}) =>
                !buffers.has(fileName))
            .subscribe(({fileName, buffer}) => {
                buffers.set(fileName, buffer);
            }));
    }

    return Disposable.create(() => {
        disposable.dispose();
        // Reset the buffers to their original state
        if (SolutionManager._unitTestMode_) {
            const results: Observable<any>[] = [];
            const iterator = buffers.entries();
            const iteratee = iterator.next();
            while (!iteratee.done) {
                const [path, buffer] = iteratee.value;

                results.push(
                    SolutionManager.getSolutionForPath(path)
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
    });*/
}

export function openEditor(file: string) {
    return Observable.fromPromise<Atom.TextEditor>(<any>atom.workspace.open(file))
        .flatMap(editor =>
            SolutionManager.getSolutionForEditor(editor).map(solution => ({ editor, solution }))
        )
        .flatMap(({editor, solution}) => solution.state.startWith(solution.currentState)
        .map(state => ({ editor, solution, state: state })))
        .filter(z => z.state === DriverState.Connected)
        .take(1);
}
