import { IOmnisharpClientStatus } from 'omnisharp-client';
import { Observable } from 'rxjs';
import { CompositeDisposable } from 'ts-disposables';
import { dock } from '../atom/dock';
import { IProjectViewModel } from '../omnisharp';
import { Omni } from '../server/omni';
import { ViewModel } from '../server/view-model';
import { OutputWindow } from '../views/omni-output-pane-view';

class ServerInformation implements IFeature {
    private disposable: CompositeDisposable;
    public observe: {
        status: Observable<IOmnisharpClientStatus>;
        output: Observable<OutputMessage[]>;
        outputElement: Observable<HTMLDivElement>;
        projects: Observable<IProjectViewModel[]>;
        model: Observable<ViewModel>;
    };

    public model: ViewModel;

    public activate() {
        this.disposable = new CompositeDisposable();

        const status = this.setupStatus();
        const output = this.setupOutput();
        const outputElement = this.setupOutputElement();
        const projects = this.setupProjects();

        this.disposable.add(Omni.activeModel.subscribe(z => this.model = z));
        this.observe = { status, output, outputElement, projects, model: Omni.activeModel };

        this.disposable.add(dock.addWindow('output', 'Omnisharp output', new OutputWindow, {}));
        dock.selected = 'output';
    }

    private setupStatus() {
        // Stream the status from the active model
        return Omni.activeModel
            .switchMap(model => model.observe.status)
            .share();
    }

    private setupOutput() {
        // As the active model changes (when we go from an editor for ClientA to an editor for ClientB)
        // We want to make sure that the output field is
        return Omni.activeModel
            .switchMap(z => z.observe.output)
            .startWith([])
            .share();
    }

    private setupOutputElement() {
        return Omni.activeModel
            .map(z => z.outputElement)
            .startWith(document.createElement('div'))
            .share();
    }

    private setupProjects() {
        return Omni.activeModel
            .switchMap(model => model.observe.projects)
            .share();
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = 'Server Information';
    public description = 'Monitors server output and status.';
}

export const server = new ServerInformation;
