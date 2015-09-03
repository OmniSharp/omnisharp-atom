import {SingleAssignmentDisposable, CompositeDisposable, Disposable, Scheduler} from "rx";

function scheduleNow(state, action) {
    var scheduler = this,
        disposable = new SingleAssignmentDisposable();
    var id = window.requestAnimationFrame(function() {
        !disposable.isDisposed && (disposable.setDisposable(action(scheduler, state)));
    });
    return new CompositeDisposable(disposable, Disposable.create(function() {
        window.cancelAnimationFrame(id);
    }));
}

function scheduleRelative(state, dueTime, action) {
    var scheduler = this, dt = Scheduler.normalize(dueTime);
    if (dt === 0) { return scheduler.scheduleWithState(state, action); }
    var disposable = new SingleAssignmentDisposable();
    var id = setTimeout(function() {
        if (!disposable.isDisposed) {
            disposable.setDisposable(action(scheduler, state));
        }
    }, dt);
    return new CompositeDisposable(disposable, Disposable.create(function() {
        clearTimeout(id);
    }));
}

function scheduleAbsolute(state, dueTime, action) {
    return this.scheduleWithRelativeAndState(state, dueTime - this.now(), action);
}

var defaultNow = (function () { return !!Date.now ? Date.now : function () { return +new Date; }; }());
/**
 * Gets a scheduler that schedules schedules work on the requestAnimationFrame for immediate actions.
 */
export default new Scheduler(defaultNow, scheduleNow, scheduleRelative, scheduleAbsolute);
