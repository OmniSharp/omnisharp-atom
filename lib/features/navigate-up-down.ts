import {Models} from "omnisharp-client";
import {CompositeDisposable} from "ts-disposables";
import {Omni} from "../server/omni";

class Navigate implements IFeature {
    private disposable: CompositeDisposable;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:navigate-up", () => {
            return this.navigateUp();
        }));

        this.disposable.add(Omni.addTextEditorCommand("omnisharp-atom:navigate-down", () => {
            return this.navigateDown();
        }));

        this.disposable.add(Omni.listener.navigateup.subscribe((data) => this.navigateTo(data.response)));
        this.disposable.add(Omni.listener.navigatedown.subscribe((data) => this.navigateTo(data.response)));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public navigateUp() {
        Omni.request(solution => solution.navigateup({}));
    }

    public navigateDown() {
        Omni.request(solution => solution.navigatedown({}));
    }

    private navigateTo(data: Models.NavigateResponse) {
        const editor = atom.workspace.getActiveTextEditor();
        Omni.navigateTo({ FileName: editor.getURI(), Line: data.Line, Column: data.Column });
    }

    public required = true;
    public title = "Navigate";
    public description = "Adds server based navigation support";
}
export const navigate = new Navigate;
