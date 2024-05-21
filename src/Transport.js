import { isNumber } from '@ircam/sc-utils';

import { quantize } from './utils.js';
import Scheduler from './Scheduler.js';
import TransportEventQueue from './TransportEventQueue.js';

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default class Transport {
  constructor(scheduler) {
    // @todo - when scheduler is moved into the lib
    if (!(scheduler instanceof Scheduler)) {
      throw new Error(`[sc-scheduling] Invalid param, is not an instance of Scheduler`);
    }

    this.scheduler = scheduler;

    this._eventQueue = new TransportEventQueue();
    this._children = new Map(); // child / originalAdvanceTime

    this._tick = this._tick.bind(this);
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
    // @todo - replace with proper class with getters
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
    };

    return this.addEvent(event);
  }

  /**
   * Change the transport's position at a given time
   */
  seek(time, position) {
    const event = {
      type: 'seek',
      time: quantize(time),
      position: position,
    };

    return this.addEvent(event);
  }

  /**
   * Toggle the transport loop at a given time
   */
  loop(time, value) {
    const event = {
      type: 'loop',
      time: quantize(time),
      loop: value,
    };

    return this.addEvent(event);
  }

  speed(time, value) {
    const event = {
      type: 'speed',
      time: quantize(time),
      speed: value,
    };

    return this.addEvent(event);
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
      if (!this.scheduler.has(this._tick)) {
        // use logical next as it may not be the same as the enqueued event
        // (not sure this is actually possible, but this doesn't hurt...)
        this.scheduler.add(this._tick, this._eventQueue.next.time);
      } else if (!next || enqueued.time < next.time) {
        // reschedule transport if inserted event is before previous next event
        this.scheduler.reset(this._tick, enqueued.time);
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

  _tick(currentTime, audioTime, infos) {
    const event = this._eventQueue.dequeue();

    // propagate transport events to all childrens, so that they can override
    // their next position
    for (let child of this._children.keys()) {
      // console.log('handle children', child);
      let resetPosition;

      try {
        resetPosition = child.onTransportEvent(event, event.position, audioTime, infos);
      } catch(err) {
        console.log(err);
      }

      // @todo - reseting all children 1 by 1 is overkill, because it will call
      // scheduler.resetTick each time, would be good to have some methods to batch
      // the reset.
      if (isNumber(resetPosition)) {
        // queue.getTimeAtPosition handles Infinity too
        const resetTime = this._eventQueue.getTimeAtPosition(resetPosition);
        this.scheduler.reset(child, resetTime);
      }
    }

    if (this._eventQueue.next) {
      return this._eventQueue.next.time;
    } else {
      return Infinity;
    }
  }

  // @todo
  // - draft to be completed
  // - review so that we don't rely on advanceTime
  add(child) {
    if (this._children.has(child)) {
      throw new Error(`already added to transport`);
    }

    // @todo - we can do that more cleanly with the new scheduler API

    // The scheduler requires an advanceTime method so we need to
    // monkey patch in all cases
    let originalAdvanceTime = child.advanceTime;
    // allow engine to only implement `onScheduledEvent`
    if (!originalAdvanceTime) {
      originalAdvanceTime = () => Infinity;
    }

    child.advanceTime = (currentTime, audioTime, dt) => {
      if (this._eventQueue.state.speed > 0) {
        // we should proabably quantize all the way... no idea
        const position = this.getPositionAtTime(currentTime); // quantized
        const nextPosition = originalAdvanceTime.call(child, position, audioTime, dt);

        if (isNumber(nextPosition)) {
          return this._eventQueue.getTimeAtPosition(nextPosition);
        } else {
          // make sure engines do not remove themselves from the scheduler
          return Infinity;
        }
      }
    }

    this._children.set(child, originalAdvanceTime);

    // allow engine to only implement `advanceTime`
    if (!child.onTransportEvent) {
      // such default should be good enought for any engine that rely on an
      // `advanceTime` method (e.g. Granular engine)
      child.onTransportEvent = (event, position, audioTime, dt) => {
        return event.speed > 0 ? position : Infinity;
      }
    }

    // add to scheduler at Infinity, children should never be removed from scheduler
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
    const originalAdvanceTime = this._children.get(child);
    child.advanceTime = originalAdvanceTime;
    this._children.delete(child);
  }
}
