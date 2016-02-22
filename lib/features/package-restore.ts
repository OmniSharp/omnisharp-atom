import {CompositeDisposable} from "omnisharp-client";
import {Omni} from "../server/omni";

class PackageRestore implements IFeature {
    private disposable: CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();
        this.disposable.add(Omni.eachConfigEditor((editor, cd) => {
            cd.add(editor.getBuffer().onDidSave(() => {
                Omni.request(solution => solution.filesChanged([{ FileName: editor.getPath() }]));
            }));
        }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = "Package Restore";
    public description = "Initializes a package restore, when an project.json file is saved.";
}

export const packageRestore = new PackageRestore;
