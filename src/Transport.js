import TransportEventQueue from './TransportEventQueue.js';
import { quantize } from './utils.js';

export default class Transport {
  constructor(scheduler) {
    // @todo - when scheduler is moved into the lib
    // if (!(scheduler instanceof Scheduler)) {
    //   throw new Error(`need scheduler`);
    // }

    this.scheduler = scheduler;
    this._eventQueue = new TransportEventQueue();

    this._children = new Set(); // child / oldAdvanceTime
  }

  set loopStart(value) {
    this._eventQueue.loopStart = value;
  }

  get loopStart() {
    return this._eventQueue.loopStart;
  }

  set loopEnd(value) {
    this._eventQueue.loopEnd = value;
  }

  get loopEnd() {
    return this._eventQueue.loopEnd;
  }

  play(time) {
    const event = {
      type: 'play',
      time: quantize(time),
      speed: 1,
    };

    return this.addEvent(event);
  }

  // for `pause` and `stop` events, we must define `position` as late as
  // possible to be sure to get the lastest availalble timing informations`
  pause(time) {
    const event = {
      type: 'pause',
      time: quantize(time),
      speed: 0,
      // `position` is defined dynamically by queue
    };

    return this.addEvent(event); // return computed event or null
  }

  seek(time, position) {
    const event = {
      type: 'seek',
      time: quantize(time),
      position: position,
      // `speed` is defined dynamically by queue
    }

    return this.addEvent(event); // return computed event or null
  }

  loop(time, value) {
    const event = {
      type: value ? 'loop-start' : 'loop-stop',
      time: quantize(time),
    }

    this.addEvent(event);
  }

  /**
   * Cancel all event currently scheduled after this time
   */
  cancel(time) {
    const event = {
      type: 'cancel',
      time: quantize(time),
    };

    return this.addEvent(event);
  }

  // expose to enable sharing of raw events on the network
  addEvent(event) {
    const res = this._eventQueue.add(event);

    if (res !== null && res.type !== 'cancel' && !this.scheduler.has(this)) {
      this.scheduler.add(this, this._eventQueue.next.time);
    }
  }

  getPositionAtTime(time) {
    return quantize(this._eventQueue.getPositionAtTime(time));
  }

  advanceTime(currentTime, audioTime, dt) {
    const event = this._eventQueue.dequeue();
    const currentPosition = event.position;

    // propagate event to all childrens
    for (let child of this._children.keys()) {
      // allow engine to override it's next position
      const resetPosition = child.onScheduledEvent(event, event.position, audioTime, dt);
      const resetTime = this._eventQueue.getTimeAtPosition(resetPosition);
      this.scheduler.resetEngineTime(child, resetTime);
    }

    if (this._eventQueue.next) {
      return this._eventQueue.next.time;
    } else {
      // @todo - check
      return Infinity;
    }
  }

  // @note - maybe should be private
  // getTimeAtPosition(position) {
  //   return quantize(this._eventQueue.getTimeAtPosition(position));
  // },
  //
  // getSpeedAtTime(time) {
  //   return quantize(this._eventQueue.getSpeedAtTime(time));
  // },

  add(child) {
    if (this._children.has(child)) {
      throw new Error(`already added to transport`);
    }

    // The scheduler requires an advanceTime method so we need to
    // monkey patch in all cases
    let oldAdvanceTime = child.advanceTime;

    if (!oldAdvanceTime) {
      oldAdvanceTime = () => Infinity;
    }

    child.advanceTime = (currentTime, audioTime, dt) => {
      if (this._queue.current.speed > 0) {
        const position = this._eventQueue.getPositionAtTime(currentTime);
        const nextPosition = oldAdvanceTime.call(child, position, audioTime, dt);

        // make sure the engine does not remove itself from the scheduler
        if (Number.isFinite(nextTime)) {
          const nextTime = this._eventQueue.getTimeAtPosition(nextPosition);
          return nextTime;
        } else {
          return Infinity;
        }
      }
    }

    this._children.add(child, oldAdvanceTime);

    if (!child.onTransportEvent) {
      // such default should be good enought for any engine that rely on an
      // `advanceTime` method (e.g. Granular engine)
      child.onTransportEvent = (event, position, audioTime, dt) => {
        return event.speed > 0 ? position : Infinity;
      }
    }

    // add to scheduler
    this.scheduler.add(child, Infinity);
  }

  remove(child) {
    // remove from scheduler
    this.scheduler.remove(child);

    // un-monkey patch the advanceTime
    const oldAdvanceTime = this._children.get(child);
    child.advanceTime = oldAdvanceTime;
    this._children.remove(child);
  }
}
