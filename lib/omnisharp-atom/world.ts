import * as _ from 'lodash';
import Omni = require('../omni-sharp-server/omni');
import {Observable, CompositeDisposable} from "rx";

var statefulProperties = ['isOff', 'isConnecting', 'isOn', 'isReady', 'isError'];

class WorldModel implements Rx.IDisposable {
    private _disposable: CompositeDisposable;

    public isOff: boolean;
    public isConnecting: boolean;
    public isOn: boolean;
    public isReady: boolean;
    public isError: boolean;

    public activate() {
        this._disposable = new CompositeDisposable();
        this.setupState();
        this.observe = {
            updates: Observable.ofObjectChanges(this)
        };
    }

    private setupState() {
        this._disposable.add(Omni.activeModel
            .subscribe(newModel => {
                // Update on change
                _.each(statefulProperties, property => { this[property] = newModel[property] });
            }));

        this._disposable.add(Omni.activeModel
            .flatMapLatest(newModel =>
                newModel.observe.updates// Track changes to the model
                    .buffer(newModel.observe.updates.throttle(100), () => Observable.timer(100)) // Group the changes so that we capture all the differences at once.
                    .map(items => _.filter(items, item => _.contains(statefulProperties, item.name)))
                    .where(z => z.length > 0)
                    .map(items => ({ items, newModel })))
            .subscribe(ctx => {
                var {items, newModel} = ctx;
                // Apply the updates if found
                _.each(items, item => {
                    this[item.name] = newModel[item.name];
                })
            }));
    }

    public observe: {
        // TODO: Do these make sense, or should we just do `world.log.observe.output`?
        updates: Observable<Rx.ObjectObserveChange<WorldModel>>;
    }

    public dispose() {
        this._disposable.dispose();
    }
}

var world = new WorldModel();
window['world'] = world; //TEMP

export {world};
