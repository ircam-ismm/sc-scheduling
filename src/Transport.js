import TransportEventQueue from './TransportEventQueue.js';
import { quantize } from './utils.js';
import cloneDeep from 'clone-deep';

import Scheduler from './Scheduler.js';

export default class Transport {
  constructor(scheduler) {
    // @todo - when scheduler is moved into the lib
    if (!(scheduler instanceof Scheduler)) {
      throw new Error(`[sc-scheduling] Invalid param, is not an instance of Scheduler`);
    }

    this.scheduler = scheduler;
    this._eventQueue = new TransportEventQueue();

    this._children = new Map(); // child / oldAdvanceTime
  }

  get currentTime() {
    return this.scheduler.currentTime;
  }

  get audioTime() {
    return this.scheduler.audioTime;
  }

  // if we want to init the transport from the actual state of an existing one
  setState(state) {
    this._eventQueue.state = state.currentState;
    this._eventQueue.scheduledEvents = state.scheduledEvents;
  }

  // retrieves the full state of the event queue (i.e. state and scheduled events)
  getState() {
    return {
      currentState: cloneDeep(this._eventQueue.state),
      scheduledEvents: cloneDeep(this._eventQueue.scheduledEvents),
    };
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

  /**
   * Start running the transport at a given time
   */
  play(time) {
    const event = {
      type: 'play',
      time: quantize(time),
      // `position`, `speed` and `loop` are defined dynamically by queue
    };

    return this.addEvent(event);
  }

  /**
   * Pause the transport at a given time
   */
  pause(time) {
    const event = {
      type: 'pause',
      time: quantize(time),
      // `position`, `speed` and `loop` are defined dynamically by queue
    };

    return this.addEvent(event); // return computed event or null
  }

  /**
   * Change the transport's position at a given time
   */
  seek(time, position) {
    const event = {
      type: 'seek',
      time: quantize(time),
      position: position,
      // `speed`and `loop` are defined dynamically by queue
    }

    return this.addEvent(event); // return computed event or null
  }

  /**
   * Toggle the transport loop at a given time
   */
  loop(time, value) {
    const event = {
      type: 'loop',
      time: quantize(time),
      loop: value,
      // `speed`and `position` are defined dynamically by queue
    }

    this.addEvent(event);
  }

  /**
   * Cancel all event currently scheduled after the given time
   */
  cancel(time) {
    const event = {
      type: 'cancel',
      time: quantize(time),
    };

    return this.addEvent(event);
  }

  addEvents(eventList) {
    return eventList.map(event => this.addEvent(event));
  }

  /**
   * Add raw event to the queue. This is usefull to control several transports
   * from a central event producer (e.g. on the network)
   */
  addEvent(event) {
    // grab next before adding event, as it may be replaced by the new event
    const next = this._eventQueue.next;
    const enqueued = this._eventQueue.add(event);

    // cancel events are applied right now, no need to schedule them
    if (enqueued !== null && enqueued.type !== 'cancel') {
      if (!this.scheduler.has(this)) {
        // use logical next as it may not be the same as the enqueued event
        // (not sure this is actually possible, but this doesn't hurt...)
        this.scheduler.add(this, this._eventQueue.next.time);
      } else if (!next || enqueued.time < next.time) {
        // reschedule transport if inserted event is before previous next event
        this.scheduler.resetEngineTime(this, enqueued.time);
      }
    }

    return enqueued;
  }

  getPositionAtTime(time) {
    return quantize(this._eventQueue.getPositionAtTime(time));
  }

  // getTimeAtPosition(position) {
  //   return quantize(this._eventQueue.getTimeAtPosition(position));
  // }

  advanceTime(currentTime, audioTime, dt) {
    const event = this._eventQueue.dequeue();
    const currentPosition = event.position;

    // propagate transport events to all childrens, so that they can override
    // their next position
    for (let child of this._children.keys()) {
      const resetPosition = child.onTransportEvent(event, event.position, audioTime, dt);

      if (Number.isFinite(resetPosition)) {
        const resetTime = this._eventQueue.getTimeAtPosition(resetPosition);
        this.scheduler.resetEngineTime(child, resetTime);
      } else if (resetPosition === Number.POSITIVE_INFINITY) {
        this.scheduler.resetEngineTime(child, Infinity);
      }
    }

    if (this._eventQueue.next) {
      return this._eventQueue.next.time;
    } else {
      return Infinity;
    }
  }

  // @todo - draft to be completed
  add(child) {
    if (this._children.has(child)) {
      throw new Error(`already added to transport`);
    }

    // The scheduler requires an advanceTime method so we need to
    // monkey patch in all cases
    let oldAdvanceTime = child.advanceTime;
    // allow engine to only implement `onScheduledEvent`
    if (!oldAdvanceTime) {
      oldAdvanceTime = () => Infinity;
    }

    child.advanceTime = (currentTime, audioTime, dt) => {
      if (this._eventQueue.state.speed > 0) {
        const position = this._eventQueue.getPositionAtTime(currentTime);
        const nextPosition = oldAdvanceTime.call(child, position, audioTime, dt);

        // make sure the engine does not remove itself from the scheduler
        if (Number.isFinite(nextPosition)) {
          const nextTime = this._eventQueue.getTimeAtPosition(nextPosition);
          return nextTime;
        } else  if (nextPosition === Number.POSITIVE_INFINITY) {
          return Infinity;
        } else {
          return null;
        }
      }
    }

    this._children.set(child, oldAdvanceTime);

    // allow engine to only implement `advanceTime`
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

  has(child) {
    return this._children.has(child);
  }

  // @todo - draft to be completed
  remove(child) {
    // remove from scheduler
    this.scheduler.remove(child);

    // un-monkey patch the advanceTime
    const oldAdvanceTime = this._children.get(child);
    child.advanceTime = oldAdvanceTime;
    this._children.delete(child);
  }
}
