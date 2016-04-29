import {Operator} from "rxjs/Operator";
import {Subscriber} from "rxjs/Subscriber";
import {Observable} from "rxjs/Observable";
import {Scheduler} from "rxjs/Scheduler";
import {async} from "rxjs/scheduler/async";

export function bufferFor<T>(observable: Observable<T>, bufferDuration: number, scheduler = async): Observable<T[]> {
    return observable.lift(new BufferForOperator<T>(bufferDuration, scheduler));
}

class BufferForOperator<T> implements Operator<T, T[]> {
    constructor(private bufferDuration: number, private scheduler: Scheduler) {
    }

    public call(subscriber: Subscriber<T[]>, source: any): Subscriber<T> {
        return source._subscribe(new BufferForSubscriber(subscriber, this.bufferDuration, this.scheduler));
    }
}

class BufferForSubscriber<T> extends Subscriber<T> {
    private buffer: T[];
    private open = false;

    constructor(destination: Subscriber<T[]>, private bufferDuration: number, private scheduler: Scheduler) {
        super(destination);
    }

    protected _next(value: T) {
        if (!this.open) {
            this.openBuffer();
        }
        this.buffer.push(value);
    }

    protected _complete() {
        const buffer = this.buffer;
        if (buffer) {
            this.destination.next(buffer);
        }
        super._complete();
    }

    protected _unsubscribe() {
        this.buffer = null;
    }

    public closeBuffer() {
        this.open = false;

        const buffer = this.buffer;
        if (this.buffer) {
            this.destination.next(buffer);
        }

        this.buffer = null;
    }

    public openBuffer() {
        const schedule = this.scheduler.schedule(() => {
            this.remove(schedule);
            this.closeBuffer();
        }, this.bufferDuration);
        this.add(schedule);

        this.open = true;
        this.buffer = [];
    }
}
